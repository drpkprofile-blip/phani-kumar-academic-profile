begin;

-- New records are placed first in the public/admin display order. Existing
-- publication metadata and relative order remain unchanged.
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
    -- Put the new record at the start of its year group. The public query sorts
    -- year descending, then display_order, so older backfills stay chronological.
    select coalesce(min(display_order), (select coalesce(max(display_order), 0) + 1 from public.publications))
      into position
    from public.publications
    where year = p_publication->>'year';
    set constraints public.publications_display_order_unique deferred;
    update public.publications set display_order = display_order + 1 where display_order >= position;
    insert into public.publications(title,year,journal,indexing,doi,article_url,proof_url,publication_type,impact_factor,display_order)
    values(p_publication->>'title',p_publication->>'year',p_publication->>'journal',badges,
      nullif(p_publication->>'doi',''),nullif(p_publication->>'article_url',''),
      nullif(p_publication->>'proof_url',''),nullif(p_publication->>'publication_type',''),
      nullif(p_publication->>'impact_factor','')::numeric,position)
    returning id into saved_id;
    set constraints public.publications_display_order_unique immediate;
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

revoke all on function public.admin_save_publication(integer,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.admin_save_publication(integer,jsonb,timestamptz) to authenticated;

commit;
