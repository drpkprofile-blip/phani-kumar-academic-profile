-- Admin-only Peer Reviews CRUD, reorder, and independent counter settings.
begin;

create function public.admin_save_peer_review(
  p_id integer default null,
  p_review_text text default null,
  p_expected_updated_at timestamptz default null
) returns integer language plpgsql security invoker set search_path = '' as $$
declare
  saved_id integer;
  next_position integer;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  lock table public.peer_reviews in exclusive mode;
  if p_review_text is null or p_review_text !~ '[^[:space:]]' then
    raise exception 'Nonblank review text is required' using errcode = '22023';
  end if;

  if p_id is null then
    select coalesce(max(display_order), 0) + 1 into next_position from public.peer_reviews;
    insert into public.peer_reviews(review_text, source_order, display_order)
    values (p_review_text, null, next_position)
    returning id into saved_id;
  else
    perform 1 from public.peer_reviews where id = p_id and updated_at = p_expected_updated_at;
    if not found then
      raise exception 'Review changed or no longer exists; reload before saving' using errcode = 'P0001';
    end if;
    update public.peer_reviews set review_text = p_review_text where id = p_id returning id into saved_id;
  end if;
  return saved_id;
end;
$$;

create function public.admin_delete_peer_review(
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
  lock table public.peer_reviews in exclusive mode;
  delete from public.peer_reviews where id = p_id and updated_at = p_expected_updated_at
  returning id into deleted_id;
  if deleted_id is null then
    raise exception 'Review changed or no longer exists; reload before deleting' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(id order by display_order), '{}'::integer[]) into remaining_ids
  from public.peer_reviews;
  if cardinality(remaining_ids) > 0 then
    set constraints public.peer_reviews_display_order_unique deferred;
    update public.peer_reviews r set display_order = ordered.position::integer
    from unnest(remaining_ids) with ordinality as ordered(id, position)
    where r.id = ordered.id and r.display_order is distinct from ordered.position::integer;
    set constraints public.peer_reviews_display_order_unique immediate;
  end if;
  return deleted_id;
end;
$$;

create function public.admin_move_peer_review(p_id integer, p_position integer, p_expected_order integer[])
returns void language plpgsql security invoker set search_path = '' as $$
declare
  current_ids integer[];
  remaining_ids integer[];
  reordered_ids integer[];
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  lock table public.peer_reviews in exclusive mode;
  select coalesce(array_agg(id order by display_order), '{}'::integer[]) into current_ids
  from public.peer_reviews;
  if current_ids is distinct from p_expected_order then
    raise exception 'Peer Review order changed; reload before reordering' using errcode = 'P0001';
  end if;
  if p_id is null or p_position is null or p_position < 1
    or p_position > cardinality(current_ids) or not p_id = any(current_ids) then
    raise exception 'Invalid Peer Review position' using errcode = '22023';
  end if;
  remaining_ids := array_remove(current_ids, p_id);
  reordered_ids := remaining_ids[1:p_position - 1] || array[p_id] || remaining_ids[p_position:cardinality(remaining_ids)];
  set constraints public.peer_reviews_display_order_unique deferred;
  update public.peer_reviews r set display_order = ordered.position::integer
  from unnest(reordered_ids) with ordinality as ordered(id, position)
  where r.id = ordered.id and r.display_order is distinct from ordered.position::integer;
  set constraints public.peer_reviews_display_order_unique immediate;
end;
$$;

create function public.admin_update_peer_review_settings(
  p_hero_counter_text text, p_completed_reviews_count integer, p_expected_updated_at timestamptz
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_hero_counter_text is null or p_hero_counter_text !~ '[^[:space:]]'
    or length(p_hero_counter_text) > 64 then
    raise exception 'A nonblank hero counter of at most 64 characters is required' using errcode = '22023';
  end if;
  if p_completed_reviews_count is null or p_completed_reviews_count < 0 then
    raise exception 'Completed reviews count must be a non-negative integer' using errcode = '22023';
  end if;

  update public.peer_review_settings
  set hero_counter_text = p_hero_counter_text,
      completed_reviews_count = p_completed_reviews_count
  where singleton is true and updated_at = p_expected_updated_at;
  if not found then
    raise exception 'Peer Review settings changed or no longer exist; reload before saving' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.admin_save_peer_review(integer, text, timestamptz) from public, anon, authenticated;
revoke all on function public.admin_delete_peer_review(integer, timestamptz, boolean) from public, anon, authenticated;
revoke all on function public.admin_move_peer_review(integer, integer, integer[]) from public, anon, authenticated;
revoke all on function public.admin_update_peer_review_settings(text, integer, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_save_peer_review(integer, text, timestamptz) to authenticated;
grant execute on function public.admin_delete_peer_review(integer, timestamptz, boolean) to authenticated;
grant execute on function public.admin_move_peer_review(integer, integer, integer[]) to authenticated;
grant execute on function public.admin_update_peer_review_settings(text, integer, timestamptz) to authenticated;

commit;
