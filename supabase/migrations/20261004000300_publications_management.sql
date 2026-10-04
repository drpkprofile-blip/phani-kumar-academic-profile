begin;

-- SECURITY INVOKER keeps all existing table privileges and RLS in force.
create or replace function public.admin_save_publication(
  p_id integer default null, p_publication jsonb default '{}'::jsonb, p_expected_updated_at timestamptz default null
) returns integer language plpgsql security invoker set search_path = '' as $$
declare
  saved_id integer;
  position integer;
  badges text[];
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  lock table public.publications in exclusive mode;
  if jsonb_typeof(p_publication) is distinct from 'object' then
    raise exception 'Publication object required' using errcode = '22023';
  end if;
  if p_publication->'indexing' is not null and jsonb_typeof(p_publication->'indexing') <> 'array' then
    raise exception 'Indexing must be an ordered array' using errcode = '22023';
  end if;
  select coalesce(array_agg(value order by ordinal), '{}'::text[]) into badges
  from jsonb_array_elements_text(coalesce(p_publication->'indexing', '[]'::jsonb)) with ordinality as b(value, ordinal);
  if p_id is null then
    select coalesce(max(display_order), 0) + 1 into position from public.publications;
    insert into public.publications(title,year,journal,indexing,doi,article_url,proof_url,publication_type,impact_factor,display_order)
    values(p_publication->>'title',p_publication->>'year',p_publication->>'journal',badges,
      nullif(p_publication->>'doi',''),nullif(p_publication->>'article_url',''),
      nullif(p_publication->>'proof_url',''),nullif(p_publication->>'publication_type',''),
      nullif(p_publication->>'impact_factor','')::numeric,position)
    returning id into saved_id;
  else
    update public.publications set
      title=p_publication->>'title',year=p_publication->>'year',journal=p_publication->>'journal',indexing=badges,
      doi=nullif(p_publication->>'doi',''),article_url=nullif(p_publication->>'article_url',''),
      proof_url=nullif(p_publication->>'proof_url',''),publication_type=nullif(p_publication->>'publication_type',''),
      impact_factor=nullif(p_publication->>'impact_factor','')::numeric
    where id=p_id and updated_at=p_expected_updated_at returning id into saved_id;
    if saved_id is null then
      raise exception 'Record changed or no longer exists; reload before saving' using errcode = 'P0001';
    end if;
  end if;
  return saved_id;
end;
$$;

create or replace function public.admin_delete_publication(p_id integer, p_expected_updated_at timestamptz, p_confirmed boolean)
returns integer language plpgsql security invoker set search_path = '' as $$
declare deleted_id integer;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_confirmed is distinct from true then
    raise exception 'Explicit deletion confirmation required' using errcode = '22023';
  end if;
  lock table public.publications in exclusive mode;
  delete from public.publications where id=p_id and updated_at=p_expected_updated_at returning id into deleted_id;
  if deleted_id is null then
    raise exception 'Record changed or no longer exists; reload before deleting' using errcode = 'P0001';
  end if;
  return deleted_id;
end;
$$;

create or replace function public.admin_move_publication(p_id integer, p_position integer, p_expected_order integer[])
returns void language plpgsql security invoker set search_path = '' as $$
declare current_ids integer[]; remaining integer[]; reordered integer[];
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  lock table public.publications in exclusive mode;
  select coalesce(array_agg(id order by display_order), '{}'::integer[]) into current_ids from public.publications;
  if current_ids is distinct from p_expected_order then
    raise exception 'Publication order changed; reload before reordering' using errcode = 'P0001';
  end if;
  if p_id is null or p_position is null or p_position < 1 or p_position > cardinality(current_ids) or not p_id = any(current_ids) then
    raise exception 'Invalid publication position' using errcode = '22023';
  end if;
  remaining := array_remove(current_ids,p_id);
  reordered := remaining[1:p_position-1] || array[p_id] || remaining[p_position:cardinality(remaining)];
  set constraints public.publications_display_order_unique deferred;
  update public.publications p set display_order=r.position
  from unnest(reordered) with ordinality as r(id,position)
  where p.id=r.id and p.display_order is distinct from r.position::integer;
  set constraints public.publications_display_order_unique immediate;
end;
$$;

revoke all on function public.admin_save_publication(integer,jsonb,timestamptz) from public,anon,authenticated;
revoke all on function public.admin_delete_publication(integer,timestamptz,boolean) from public,anon,authenticated;
revoke all on function public.admin_move_publication(integer,integer,integer[]) from public,anon,authenticated;
grant execute on function public.admin_save_publication(integer,jsonb,timestamptz) to authenticated;
grant execute on function public.admin_delete_publication(integer,timestamptz,boolean) to authenticated;
grant execute on function public.admin_move_publication(integer,integer,integer[]) to authenticated;

commit;
