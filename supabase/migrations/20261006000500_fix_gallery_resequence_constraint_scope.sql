begin;

create or replace function public.admin_move_gallery_item(
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
  set constraints public.gallery_items_display_order_key deferred;
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

create or replace function public.admin_delete_gallery_item(
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
  set constraints public.gallery_items_display_order_key deferred;
  update public.gallery_items set display_order = display_order - 1 where display_order > v_position;
  return v_path;
end;
$$;

commit;
