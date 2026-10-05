begin;

create function public.admin_save_activity(p_id integer default null, p_activity jsonb default '{}'::jsonb,
  p_expected_updated_at timestamptz default null)
returns integer language plpgsql security invoker set search_path = '' as $$
declare saved_id integer; position integer; previous public.activities%rowtype;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode='42501';
  end if;
  lock table public.activities in exclusive mode;
  if jsonb_typeof(p_activity) is distinct from 'object' then
    raise exception 'Activity object required' using errcode='22023';
  end if;
  -- Normalize only empty optional values, never supplied free text or URL strings.
  select p_activity || coalesce(jsonb_object_agg(key, case when value is null or value ~ '^[[:space:]]*$' then 'null'::jsonb else to_jsonb(value) end),'{}'::jsonb)
  into p_activity from jsonb_each_text(p_activity) where key in ('date_text','duration_text','details','proof_url');
  if p_activity->>'proof_url' is not null and p_activity->>'proof_url' !~* '^https?://' then
    raise exception 'HTTP or HTTPS proof URL required' using errcode='22023';
  end if;
  if p_id is not null then
    select * into previous from public.activities where id=p_id and updated_at=p_expected_updated_at;
    if not found then raise exception 'Record changed; reload before saving' using errcode='P0001'; end if;
  end if;
  if p_id is null or previous.year is distinct from p_activity->>'year' then
    select coalesce(max(display_order),0)+1 into position from public.activities where year=p_activity->>'year';
  else position:=previous.display_order;
  end if;
  if p_id is null then
    insert into public.activities(year,title,activity_type,institution,date_text,duration_text,details,proof_url,display_order)
    values(p_activity->>'year',p_activity->>'title',p_activity->>'activity_type',p_activity->>'institution',
      p_activity->>'date_text',p_activity->>'duration_text',p_activity->>'details',p_activity->>'proof_url',position)
    returning id into saved_id;
  else
    update public.activities set year=p_activity->>'year',title=p_activity->>'title',activity_type=p_activity->>'activity_type',
      institution=p_activity->>'institution',date_text=p_activity->>'date_text',duration_text=p_activity->>'duration_text',
      details=p_activity->>'details',proof_url=p_activity->>'proof_url',display_order=position
    where id=p_id returning id into saved_id;
  end if;
  return saved_id;
end;
$$;

create function public.admin_delete_activity(p_id integer,p_expected_updated_at timestamptz,p_confirmed boolean)
returns integer language plpgsql security invoker set search_path = '' as $$
declare deleted_id integer;
begin
  if public.is_publications_admin() is distinct from true then raise exception 'Admin access required' using errcode='42501'; end if;
  if p_confirmed is distinct from true then raise exception 'Explicit confirmation required' using errcode='22023'; end if;
  lock table public.activities in exclusive mode;
  delete from public.activities where id=p_id and updated_at=p_expected_updated_at returning id into deleted_id;
  if deleted_id is null then raise exception 'Record changed; reload before deleting' using errcode='P0001'; end if;
  return deleted_id;
end;
$$;

create function public.admin_move_activity(p_id integer,p_year text,p_position integer,p_expected_order integer[])
returns void language plpgsql security invoker set search_path = '' as $$
declare current_ids integer[]; remaining integer[]; reordered integer[];
begin
  if public.is_publications_admin() is distinct from true then raise exception 'Admin access required' using errcode='42501'; end if;
  lock table public.activities in exclusive mode;
  select coalesce(array_agg(id order by display_order),'{}'::integer[]) into current_ids from public.activities where year=p_year;
  if current_ids is distinct from p_expected_order then raise exception 'Year order changed; reload before reordering' using errcode='P0001'; end if;
  if p_id is null or p_position is null or p_position<1 or p_position>cardinality(current_ids) or not p_id=any(current_ids) then
    raise exception 'Invalid within-year position' using errcode='22023';
  end if;
  remaining:=array_remove(current_ids,p_id);
  reordered:=remaining[1:p_position-1] || array[p_id] || remaining[p_position:cardinality(remaining)];
  set constraints public.activities_year_order_unique deferred;
  update public.activities a set display_order=r.position from unnest(reordered) with ordinality as r(id,position)
  where a.id=r.id and a.year=p_year and a.display_order is distinct from r.position::integer;
  set constraints public.activities_year_order_unique immediate;
end;
$$;

revoke all on function public.admin_save_activity(integer,jsonb,timestamptz) from public,anon,authenticated;
revoke all on function public.admin_delete_activity(integer,timestamptz,boolean) from public,anon,authenticated;
revoke all on function public.admin_move_activity(integer,text,integer,integer[]) from public,anon,authenticated;
grant execute on function public.admin_save_activity(integer,jsonb,timestamptz) to authenticated;
grant execute on function public.admin_delete_activity(integer,timestamptz,boolean) to authenticated;
grant execute on function public.admin_move_activity(integer,text,integer,integer[]) to authenticated;
commit;
