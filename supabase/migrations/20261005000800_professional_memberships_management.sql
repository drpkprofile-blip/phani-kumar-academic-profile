begin;

create or replace function public.admin_save_professional_membership(
  p_id integer default null,
  p_membership jsonb default '{}'::jsonb,
  p_expected_updated_at timestamptz default null
) returns integer language plpgsql security invoker set search_path = '' as $$
declare
  saved_id integer;
  next_position integer;
  previous public.professional_memberships%rowtype;
  organization text;
  membership_type_value text;
  membership_number_value text;
  date_value text;
  validity_value text;
  designation_value text;
  chapter_value text;
  proof_link text;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  lock table public.professional_memberships in exclusive mode;
  if jsonb_typeof(p_membership) is distinct from 'object'
    or (p_membership - array['organization_name','membership_type','membership_number','date_text',
      'validity_text','designation','chapter','proof_url']::text[]) <> '{}'::jsonb then
    raise exception 'Membership object contains invalid fields' using errcode = '22023';
  end if;

  organization := p_membership->>'organization_name';
  if organization is null or organization !~ '[^[:space:]]' then
    raise exception 'A nonblank organization name is required' using errcode = '22023';
  end if;
  membership_type_value := nullif(btrim(p_membership->>'membership_type'), '');
  membership_number_value := nullif(btrim(p_membership->>'membership_number'), '');
  date_value := nullif(btrim(p_membership->>'date_text'), '');
  validity_value := nullif(btrim(p_membership->>'validity_text'), '');
  designation_value := nullif(btrim(p_membership->>'designation'), '');
  chapter_value := nullif(btrim(p_membership->>'chapter'), '');
  proof_link := p_membership->>'proof_url';
  if proof_link is not null and btrim(proof_link) = '' then proof_link := null; end if;
  if proof_link is not null and (proof_link !~* '^https?://[^[:space:]]+$'
    or proof_link ~* '^https?://[^/]*@') then
    raise exception 'Proof links must be HTTP or HTTPS URLs' using errcode = '22023';
  end if;

  if p_id is null then
    select coalesce(max(display_order), 0) + 1 into next_position from public.professional_memberships;
    insert into public.professional_memberships(organization_name,membership_type,membership_number,
      date_text,validity_text,designation,chapter,proof_url,display_order)
    values(organization,membership_type_value,membership_number_value,date_value,validity_value,
      designation_value,chapter_value,proof_link,next_position)
    returning id into saved_id;
  else
    select * into previous from public.professional_memberships
    where id = p_id and updated_at = p_expected_updated_at;
    if not found then
      raise exception 'Record changed or no longer exists; reload before saving' using errcode = 'P0001';
    end if;
    update public.professional_memberships set organization_name=organization,
      membership_type=membership_type_value,membership_number=membership_number_value,
      date_text=date_value,validity_text=validity_value,designation=designation_value,
      chapter=chapter_value,proof_url=proof_link
    where id=p_id returning id into saved_id;
  end if;
  return saved_id;
end;
$$;

create or replace function public.admin_delete_professional_membership(
  p_id integer, p_expected_updated_at timestamptz, p_confirmed boolean
) returns integer language plpgsql security invoker set search_path = '' as $$
declare
  deleted_id integer;
  remaining_ids integer[];
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_confirmed is distinct from true then
    raise exception 'Explicit deletion confirmation required' using errcode = '22023';
  end if;
  lock table public.professional_memberships in exclusive mode;
  delete from public.professional_memberships where id=p_id and updated_at=p_expected_updated_at
  returning id into deleted_id;
  if deleted_id is null then
    raise exception 'Record changed or no longer exists; reload before deleting' using errcode = 'P0001';
  end if;
  select coalesce(array_agg(id order by display_order), '{}'::integer[]) into remaining_ids
  from public.professional_memberships;
  if cardinality(remaining_ids)>0 then
    set constraints public.professional_memberships_display_order_unique deferred;
    update public.professional_memberships m set display_order=o.position::integer
    from unnest(remaining_ids) with ordinality as o(id,position)
    where m.id=o.id and m.display_order is distinct from o.position::integer;
    set constraints public.professional_memberships_display_order_unique immediate;
  end if;
  return deleted_id;
end;
$$;

create or replace function public.admin_move_professional_membership(
  p_id integer, p_position integer, p_expected_order integer[]
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  current_ids integer[];
  remaining_ids integer[];
  reordered_ids integer[];
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  lock table public.professional_memberships in exclusive mode;
  select coalesce(array_agg(id order by display_order), '{}'::integer[]) into current_ids
  from public.professional_memberships;
  if current_ids is distinct from p_expected_order then
    raise exception 'Membership order changed; reload before reordering' using errcode = 'P0001';
  end if;
  if p_id is null or p_position is null or p_position<1
    or p_position>cardinality(current_ids) or not p_id=any(current_ids) then
    raise exception 'Invalid membership position' using errcode = '22023';
  end if;
  remaining_ids := array_remove(current_ids,p_id);
  reordered_ids := remaining_ids[1:p_position-1] || array[p_id] || remaining_ids[p_position:cardinality(remaining_ids)];
  set constraints public.professional_memberships_display_order_unique deferred;
  update public.professional_memberships m set display_order=o.position::integer
  from unnest(reordered_ids) with ordinality as o(id,position)
  where m.id=o.id and m.display_order is distinct from o.position::integer;
  set constraints public.professional_memberships_display_order_unique immediate;
end;
$$;

revoke all on function public.admin_save_professional_membership(integer,jsonb,timestamptz) from public,anon,authenticated;
revoke all on function public.admin_delete_professional_membership(integer,timestamptz,boolean) from public,anon,authenticated;
revoke all on function public.admin_move_professional_membership(integer,integer,integer[]) from public,anon,authenticated;
grant execute on function public.admin_save_professional_membership(integer,jsonb,timestamptz) to authenticated;
grant execute on function public.admin_delete_professional_membership(integer,timestamptz,boolean) to authenticated;
grant execute on function public.admin_move_professional_membership(integer,integer,integer[]) to authenticated;

commit;
