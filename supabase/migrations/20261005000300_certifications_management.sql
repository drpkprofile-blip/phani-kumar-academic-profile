begin;

-- SECURITY INVOKER keeps the existing table grants and RLS policies in force.
create function public.admin_save_certification(
  p_id integer default null,
  p_certification jsonb default '{}'::jsonb,
  p_expected_updated_at timestamptz default null
) returns integer language plpgsql security invoker set search_path = '' as $$
declare
  saved_id integer;
  next_position integer;
  previous public.certifications%rowtype;
  certification_title text;
  certificate_link text;
  fdp_link text;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  lock table public.certifications in exclusive mode;
  if jsonb_typeof(p_certification) is distinct from 'object' then
    raise exception 'Certification object required' using errcode = '22023';
  end if;

  certification_title := p_certification->>'title';
  if certification_title is null or certification_title !~ '[^[:space:]]' then
    raise exception 'A nonblank title is required' using errcode = '22023';
  end if;

  certificate_link := p_certification->>'certificate_url';
  fdp_link := p_certification->>'fdp_url';
  if certificate_link is not null and btrim(certificate_link) = '' then certificate_link := null; end if;
  if fdp_link is not null and btrim(fdp_link) = '' then fdp_link := null; end if;
  if (certificate_link is not null and (certificate_link !~* '^https?://[^[:space:]]+$' or certificate_link ~* '^https?://[^/]*@'))
    or (fdp_link is not null and (fdp_link !~* '^https?://[^[:space:]]+$' or fdp_link ~* '^https?://[^/]*@')) then
    raise exception 'Certificate and FDP links must be HTTP or HTTPS URLs' using errcode = '22023';
  end if;

  if p_id is null then
    select coalesce(max(display_order), 0) + 1 into next_position from public.certifications;
    insert into public.certifications(title, certificate_url, fdp_url, display_order)
    values(certification_title, certificate_link, fdp_link, next_position)
    returning id into saved_id;
  else
    select * into previous from public.certifications
    where id = p_id and updated_at = p_expected_updated_at;
    if not found then
      raise exception 'Record changed or no longer exists; reload before saving' using errcode = 'P0001';
    end if;
    update public.certifications set
      title = certification_title,
      certificate_url = certificate_link,
      fdp_url = fdp_link
    where id = p_id returning id into saved_id;
  end if;
  return saved_id;
end;
$$;

create function public.admin_delete_certification(p_id integer, p_expected_updated_at timestamptz, p_confirmed boolean)
returns integer language plpgsql security invoker set search_path = '' as $$
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

  lock table public.certifications in exclusive mode;
  delete from public.certifications where id = p_id and updated_at = p_expected_updated_at
  returning id into deleted_id;
  if deleted_id is null then
    raise exception 'Record changed or no longer exists; reload before deleting' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(id order by display_order), '{}'::integer[]) into remaining_ids
  from public.certifications;
  if cardinality(remaining_ids) > 0 then
    set constraints public.certifications_display_order_unique deferred;
    update public.certifications c set display_order = ordered.position::integer
    from unnest(remaining_ids) with ordinality as ordered(id, position)
    where c.id = ordered.id and c.display_order is distinct from ordered.position::integer;
    set constraints public.certifications_display_order_unique immediate;
  end if;
  return deleted_id;
end;
$$;

create function public.admin_move_certification(p_id integer, p_position integer, p_expected_order integer[])
returns void language plpgsql security invoker set search_path = '' as $$
declare
  current_ids integer[];
  remaining_ids integer[];
  reordered_ids integer[];
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  lock table public.certifications in exclusive mode;
  select coalesce(array_agg(id order by display_order), '{}'::integer[]) into current_ids
  from public.certifications;
  if current_ids is distinct from p_expected_order then
    raise exception 'Certification order changed; reload before reordering' using errcode = 'P0001';
  end if;
  if p_id is null or p_position is null or p_position < 1
    or p_position > cardinality(current_ids) or not p_id = any(current_ids) then
    raise exception 'Invalid certification position' using errcode = '22023';
  end if;

  remaining_ids := array_remove(current_ids, p_id);
  reordered_ids := remaining_ids[1:p_position - 1] || array[p_id] || remaining_ids[p_position:cardinality(remaining_ids)];
  set constraints public.certifications_display_order_unique deferred;
  update public.certifications c set display_order = ordered.position::integer
  from unnest(reordered_ids) with ordinality as ordered(id, position)
  where c.id = ordered.id and c.display_order is distinct from ordered.position::integer;
  set constraints public.certifications_display_order_unique immediate;
end;
$$;

revoke all on function public.admin_save_certification(integer, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.admin_delete_certification(integer, timestamptz, boolean) from public, anon, authenticated;
revoke all on function public.admin_move_certification(integer, integer, integer[]) from public, anon, authenticated;
grant execute on function public.admin_save_certification(integer, jsonb, timestamptz) to authenticated;
grant execute on function public.admin_delete_certification(integer, timestamptz, boolean) to authenticated;
grant execute on function public.admin_move_certification(integer, integer, integer[]) to authenticated;

commit;
