begin;

-- SECURITY INVOKER keeps the existing table grants and RLS policies in force.
create function public.admin_save_achievement(
  p_id integer default null,
  p_achievement jsonb default '{}'::jsonb,
  p_expected_updated_at timestamptz default null
) returns integer language plpgsql security invoker set search_path = '' as $$
declare
  saved_id integer;
  next_position integer;
  previous public.achievements%rowtype;
  achievement_title text;
  achievement_description text;
  proof_link text;
  extra_proof_link text;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  lock table public.achievements in exclusive mode;
  if jsonb_typeof(p_achievement) is distinct from 'object'
    or (p_achievement - array['title','description','proof_url','extra_proof_url']::text[]) <> '{}'::jsonb then
    raise exception 'Achievement object contains invalid fields' using errcode = '22023';
  end if;

  achievement_title := p_achievement->>'title';
  achievement_description := p_achievement->>'description';
  if achievement_title is null or achievement_title !~ '[^[:space:]]' then
    raise exception 'A nonblank title is required' using errcode = '22023';
  end if;
  if achievement_description is null or achievement_description !~ '[^[:space:]]' then
    raise exception 'A nonblank description is required' using errcode = '22023';
  end if;

  proof_link := p_achievement->>'proof_url';
  extra_proof_link := p_achievement->>'extra_proof_url';
  if proof_link is not null and btrim(proof_link) = '' then proof_link := null; end if;
  if extra_proof_link is not null and btrim(extra_proof_link) = '' then extra_proof_link := null; end if;
  if (proof_link is not null and (proof_link !~* '^https?://[^[:space:]]+$' or proof_link ~* '^https?://[^/]*@'))
    or (extra_proof_link is not null and (extra_proof_link !~* '^https?://[^[:space:]]+$' or extra_proof_link ~* '^https?://[^/]*@')) then
    raise exception 'Proof links must be HTTP or HTTPS URLs' using errcode = '22023';
  end if;

  if p_id is null then
    select coalesce(max(display_order), 0) + 1 into next_position from public.achievements;
    insert into public.achievements(title, description, proof_url, extra_proof_url, display_order)
    values(achievement_title, achievement_description, proof_link, extra_proof_link, next_position)
    returning id into saved_id;
  else
    select * into previous from public.achievements
    where id = p_id and updated_at = p_expected_updated_at;
    if not found then
      raise exception 'Record changed or no longer exists; reload before saving' using errcode = 'P0001';
    end if;
    update public.achievements set
      title = achievement_title,
      description = achievement_description,
      proof_url = proof_link,
      extra_proof_url = extra_proof_link
    where id = p_id returning id into saved_id;
  end if;
  return saved_id;
end;
$$;

create function public.admin_delete_achievement(p_id integer, p_expected_updated_at timestamptz, p_confirmed boolean)
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

  lock table public.achievements in exclusive mode;
  delete from public.achievements where id = p_id and updated_at = p_expected_updated_at
  returning id into deleted_id;
  if deleted_id is null then
    raise exception 'Record changed or no longer exists; reload before deleting' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(id order by display_order), '{}'::integer[]) into remaining_ids
  from public.achievements;
  if cardinality(remaining_ids) > 0 then
    set constraints public.achievements_display_order_unique deferred;
    update public.achievements a set display_order = ordered.position::integer
    from unnest(remaining_ids) with ordinality as ordered(id, position)
    where a.id = ordered.id and a.display_order is distinct from ordered.position::integer;
    set constraints public.achievements_display_order_unique immediate;
  end if;
  return deleted_id;
end;
$$;

create function public.admin_move_achievement(p_id integer, p_position integer, p_expected_order integer[])
returns void language plpgsql security invoker set search_path = '' as $$
declare
  current_ids integer[];
  remaining_ids integer[];
  reordered_ids integer[];
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  lock table public.achievements in exclusive mode;
  select coalesce(array_agg(id order by display_order), '{}'::integer[]) into current_ids
  from public.achievements;
  if current_ids is distinct from p_expected_order then
    raise exception 'Achievement order changed; reload before reordering' using errcode = 'P0001';
  end if;
  if p_id is null or p_position is null or p_position < 1
    or p_position > cardinality(current_ids) or not p_id = any(current_ids) then
    raise exception 'Invalid achievement position' using errcode = '22023';
  end if;

  remaining_ids := array_remove(current_ids, p_id);
  reordered_ids := remaining_ids[1:p_position - 1] || array[p_id] || remaining_ids[p_position:cardinality(remaining_ids)];
  set constraints public.achievements_display_order_unique deferred;
  update public.achievements a set display_order = ordered.position::integer
  from unnest(reordered_ids) with ordinality as ordered(id, position)
  where a.id = ordered.id and a.display_order is distinct from ordered.position::integer;
  set constraints public.achievements_display_order_unique immediate;
end;
$$;

revoke all on function public.admin_save_achievement(integer, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.admin_delete_achievement(integer, timestamptz, boolean) from public, anon, authenticated;
revoke all on function public.admin_move_achievement(integer, integer, integer[]) from public, anon, authenticated;
grant execute on function public.admin_save_achievement(integer, jsonb, timestamptz) to authenticated;
grant execute on function public.admin_delete_achievement(integer, timestamptz, boolean) to authenticated;
grant execute on function public.admin_move_achievement(integer, integer, integer[]) to authenticated;

commit;
