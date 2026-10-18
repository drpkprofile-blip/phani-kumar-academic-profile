begin;

create table public.gallery_items (
  id bigint generated always as identity primary key,
  description text not null check (description ~ '[^[:space:]]'),
  storage_path text not null unique check (storage_path ~ '^gallery/[0-9a-f-]+\.(jpg|jpeg|png|webp)$'),
  source_order integer,
  display_order integer not null check (display_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_items_display_order_key unique (display_order) deferrable initially immediate
);

comment on table public.gallery_items is 'Admin-managed public photo gallery captions and their objects in profile-assets storage.';
alter table public.gallery_items enable row level security;
revoke all on table public.gallery_items from public, anon, authenticated;
grant select on table public.gallery_items to anon, authenticated;
grant insert, update, delete on table public.gallery_items to authenticated;

create policy "Anyone can read public gallery items"
  on public.gallery_items for select to anon, authenticated using (true);
create policy "Allowlisted admins insert gallery items"
  on public.gallery_items for insert to authenticated
  with check ((select public.is_publications_admin()));
create policy "Allowlisted admins update gallery items"
  on public.gallery_items for update to authenticated
  using ((select public.is_publications_admin()))
  with check ((select public.is_publications_admin()));
create policy "Allowlisted admins delete gallery items"
  on public.gallery_items for delete to authenticated
  using ((select public.is_publications_admin()));

create function public.set_gallery_item_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.set_gallery_item_updated_at() from public, anon, authenticated;
create trigger gallery_items_set_updated_at
  before update on public.gallery_items
  for each row execute function public.set_gallery_item_updated_at();

create function public.admin_save_gallery_item(
  p_description text,
  p_storage_path text,
  p_id bigint default null,
  p_expected_updated_at timestamptz default null
)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_id bigint;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_description is null or p_description !~ '[^[:space:]]' then
    raise exception 'A photo description is required' using errcode = '22023';
  end if;
  if p_storage_path is null or p_storage_path !~ '^gallery/[0-9a-f-]+\.(jpg|jpeg|png|webp)$' then
    raise exception 'Invalid gallery image path' using errcode = '22023';
  end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'profile-assets' and name = p_storage_path
  ) then
    raise exception 'Gallery image object is missing' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('public.gallery_items.display_order', 0));
  if p_id is null then
    insert into public.gallery_items (description, storage_path, source_order, display_order)
    values (p_description, p_storage_path, null,
      (select coalesce(max(display_order), 0) + 1 from public.gallery_items))
    returning id into v_id;
    return v_id;
  end if;

  update public.gallery_items
  set description = p_description, storage_path = p_storage_path
  where id = p_id and updated_at = p_expected_updated_at
  returning id into v_id;
  if v_id is null then
    raise exception 'Gallery item changed or was removed' using errcode = 'P0001';
  end if;
  return v_id;
end;
$$;
revoke all on function public.admin_save_gallery_item(text, text, bigint, timestamptz) from public, anon;
grant execute on function public.admin_save_gallery_item(text, text, bigint, timestamptz) to authenticated;

create function public.admin_move_gallery_item(
  p_id bigint,
  p_position integer,
  p_expected_order bigint[]
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_current integer;
  v_actual bigint[];
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('public.gallery_items.display_order', 0));
  select array_agg(id order by display_order), max(display_order) filter (where id = p_id)
    into v_actual, v_current from public.gallery_items;
  if v_actual is distinct from p_expected_order then
    raise exception 'Gallery order changed' using errcode = 'P0001';
  end if;
  if v_current is null or p_position is null or p_position < 1 or p_position > cardinality(v_actual) then
    raise exception 'Invalid gallery position' using errcode = '22023';
  end if;
  set constraints gallery_items_display_order_key deferred;
  if p_position < v_current then
    update public.gallery_items set display_order = display_order + 1
    where display_order >= p_position and display_order < v_current;
  elsif p_position > v_current then
    update public.gallery_items set display_order = display_order - 1
    where display_order > v_current and display_order <= p_position;
  end if;
  update public.gallery_items set display_order = p_position where id = p_id;
end;
$$;
revoke all on function public.admin_move_gallery_item(bigint, integer, bigint[]) from public, anon;
grant execute on function public.admin_move_gallery_item(bigint, integer, bigint[]) to authenticated;

create function public.admin_delete_gallery_item(
  p_id bigint,
  p_expected_updated_at timestamptz,
  p_confirmed boolean
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_path text;
  v_position integer;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_confirmed is distinct from true then
    raise exception 'Gallery deletion requires confirmation' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('public.gallery_items.display_order', 0));
  delete from public.gallery_items where id = p_id and updated_at = p_expected_updated_at
  returning storage_path, display_order into v_path, v_position;
  if v_path is null then
    raise exception 'Gallery item changed or was removed' using errcode = 'P0001';
  end if;
  set constraints gallery_items_display_order_key deferred;
  update public.gallery_items set display_order = display_order - 1 where display_order > v_position;
  return v_path;
end;
$$;
revoke all on function public.admin_delete_gallery_item(bigint, timestamptz, boolean) from public, anon;
grant execute on function public.admin_delete_gallery_item(bigint, timestamptz, boolean) to authenticated;

create policy "Public gallery images are readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'profile-assets' and name like 'gallery/%');
create policy "Allowlisted admins upload gallery images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-assets' and name like 'gallery/%' and public.is_publications_admin());
create policy "Allowlisted admins replace gallery images"
  on storage.objects for update to authenticated
  using (bucket_id = 'profile-assets' and name like 'gallery/%' and public.is_publications_admin())
  with check (bucket_id = 'profile-assets' and name like 'gallery/%' and public.is_publications_admin());
create policy "Allowlisted admins delete gallery images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profile-assets' and name like 'gallery/%' and public.is_publications_admin());

-- These curated project totals are independent of detailed project records.
create table public.project_guided_settings (
  singleton boolean primary key default true check (singleton),
  ug_project_count integer not null default 14 check (ug_project_count >= 0),
  pg_project_count integer not null default 4 check (pg_project_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.project_guided_settings(singleton, ug_project_count, pg_project_count)
values (true, 14, 4);
alter table public.project_guided_settings enable row level security;
revoke all on table public.project_guided_settings from public, anon, authenticated;
grant select on table public.project_guided_settings to anon, authenticated;
grant update on table public.project_guided_settings to authenticated;

create policy "Anyone can read guided project counters"
  on public.project_guided_settings for select to anon, authenticated using (true);
create policy "Allowlisted admins update guided project counters"
  on public.project_guided_settings for update to authenticated
  using ((select public.is_publications_admin()))
  with check ((select public.is_publications_admin()));

create function public.set_project_guided_settings_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.set_project_guided_settings_updated_at() from public, anon, authenticated;
create trigger project_guided_settings_set_updated_at
  before update on public.project_guided_settings
  for each row execute function public.set_project_guided_settings_updated_at();

create function public.admin_update_project_guided_counts(
  p_ug_project_count integer,
  p_pg_project_count integer,
  p_expected_updated_at timestamptz
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_ug_project_count is null or p_ug_project_count < 0 or p_pg_project_count is null or p_pg_project_count < 0 then
    raise exception 'Project counters must be non-negative integers' using errcode = '22023';
  end if;
  update public.project_guided_settings
  set ug_project_count = p_ug_project_count, pg_project_count = p_pg_project_count
  where singleton and updated_at = p_expected_updated_at;
  if not found then
    raise exception 'Project counters changed or were removed' using errcode = 'P0001';
  end if;
end;
$$;
revoke all on function public.admin_update_project_guided_counts(integer, integer, timestamptz) from public, anon;
grant execute on function public.admin_update_project_guided_counts(integer, integer, timestamptz) to authenticated;

commit;
