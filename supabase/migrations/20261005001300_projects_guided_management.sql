begin;

create or replace function public.admin_save_project_guided(
  p_id integer default null,
  p_project jsonb default '{}'::jsonb,
  p_expected_updated_at timestamptz default null
) returns integer language plpgsql security invoker set search_path = '' as $$
declare
  saved_id integer;
  next_position integer;
  previous public.projects_guided%rowtype;
  title_value text;
  level_value text;
  program_value text;
  branch_value text;
  year_value text;
  batch_value text;
  students_value text[];
  guide_value text;
  co_guides_value text[];
  proof_value text;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  lock table public.projects_guided in exclusive mode;
  if jsonb_typeof(p_project) is distinct from 'object'
    or (p_project - array['project_title','project_level','degree_program','branch','academic_year','batch',
      'student_names','guide_name','co_guide_names','proof_url']::text[]) <> '{}'::jsonb then
    raise exception 'Project object contains invalid fields' using errcode = '22023';
  end if;
  title_value := p_project->>'project_title';
  if title_value is null or title_value !~ '[^[:space:]]' then
    raise exception 'A nonblank project title is required' using errcode = '22023';
  end if;
  level_value := case when coalesce(p_project->>'project_level','') !~ '[^[:space:]]' then null else p_project->>'project_level' end;
  program_value := case when coalesce(p_project->>'degree_program','') !~ '[^[:space:]]' then null else p_project->>'degree_program' end;
  branch_value := case when coalesce(p_project->>'branch','') !~ '[^[:space:]]' then null else p_project->>'branch' end;
  year_value := case when coalesce(p_project->>'academic_year','') !~ '[^[:space:]]' then null else p_project->>'academic_year' end;
  batch_value := case when coalesce(p_project->>'batch','') !~ '[^[:space:]]' then null else p_project->>'batch' end;
  guide_value := case when coalesce(p_project->>'guide_name','') !~ '[^[:space:]]' then null else p_project->>'guide_name' end;

  if jsonb_typeof(p_project->'student_names') not in ('array','null') and p_project ? 'student_names' then
    raise exception 'Student names must be an array' using errcode = '22023';
  end if;
  if jsonb_typeof(p_project->'co_guide_names') not in ('array','null') and p_project ? 'co_guide_names' then
    raise exception 'Co-guide names must be an array' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(case when jsonb_typeof(p_project->'student_names')='array' then p_project->'student_names' else '[]'::jsonb end) e(value)
      where jsonb_typeof(e.value) is distinct from 'string')
    or exists (select 1 from jsonb_array_elements(case when jsonb_typeof(p_project->'co_guide_names')='array' then p_project->'co_guide_names' else '[]'::jsonb end) e(value)
      where jsonb_typeof(e.value) is distinct from 'string') then
    raise exception 'Project names must be strings' using errcode = '22023';
  end if;
  select array_agg(btrim(value) order by ordinality) into students_value
    from jsonb_array_elements_text(case when jsonb_typeof(p_project->'student_names')='array' then p_project->'student_names' else '[]'::jsonb end) with ordinality as entries(value,ordinality)
    where btrim(value) <> '';
  select array_agg(btrim(value) order by ordinality) into co_guides_value
    from jsonb_array_elements_text(case when jsonb_typeof(p_project->'co_guide_names')='array' then p_project->'co_guide_names' else '[]'::jsonb end) with ordinality as entries(value,ordinality)
    where btrim(value) <> '';
  if coalesce(cardinality(students_value),0)=0 then students_value := null; end if;
  if coalesce(cardinality(co_guides_value),0)=0 then co_guides_value := null; end if;

  proof_value := p_project->>'proof_url';
  if proof_value is not null and btrim(proof_value) = '' then proof_value := null; end if;
  if proof_value is not null and (proof_value !~* '^https?://[^[:space:]]+$' or proof_value ~* '^https?://[^/]*@') then
    raise exception 'Proof links must be HTTP or HTTPS URLs' using errcode = '22023';
  end if;

  if p_id is null then
    select coalesce(max(display_order),0)+1 into next_position from public.projects_guided;
    insert into public.projects_guided(project_title,project_level,degree_program,branch,academic_year,batch,
      student_names,guide_name,co_guide_names,proof_url,display_order)
    values(title_value,level_value,program_value,branch_value,year_value,batch_value,students_value,guide_value,
      co_guides_value,proof_value,next_position) returning id into saved_id;
  else
    select * into previous from public.projects_guided where id=p_id and updated_at=p_expected_updated_at;
    if not found then raise exception 'Record changed or no longer exists; reload before saving' using errcode = 'P0001'; end if;
    update public.projects_guided set project_title=title_value,project_level=level_value,degree_program=program_value,
      branch=branch_value,academic_year=year_value,batch=batch_value,student_names=students_value,
      guide_name=guide_value,co_guide_names=co_guides_value,proof_url=proof_value
    where id=p_id returning id into saved_id;
  end if;
  return saved_id;
end;
$$;

create or replace function public.admin_delete_project_guided(
  p_id integer,p_expected_updated_at timestamptz,p_confirmed boolean
) returns integer language plpgsql security invoker set search_path = '' as $$
declare deleted_id integer; remaining_ids integer[];
begin
  if public.is_publications_admin() is distinct from true then raise exception 'Admin access required' using errcode='42501'; end if;
  if p_confirmed is distinct from true then raise exception 'Explicit deletion confirmation required' using errcode='22023'; end if;
  lock table public.projects_guided in exclusive mode;
  delete from public.projects_guided where id=p_id and updated_at=p_expected_updated_at returning id into deleted_id;
  if deleted_id is null then raise exception 'Record changed or no longer exists; reload before deleting' using errcode='P0001'; end if;
  select coalesce(array_agg(id order by display_order),'{}'::integer[]) into remaining_ids from public.projects_guided;
  if cardinality(remaining_ids)>0 then
    set constraints public.projects_guided_display_order_unique deferred;
    update public.projects_guided m set display_order=o.position::integer
      from unnest(remaining_ids) with ordinality as o(id,position)
      where m.id=o.id and m.display_order is distinct from o.position::integer;
    set constraints public.projects_guided_display_order_unique immediate;
  end if;
  return deleted_id;
end;
$$;

create or replace function public.admin_move_project_guided(
  p_id integer,p_position integer,p_expected_order integer[]
) returns void language plpgsql security invoker set search_path = '' as $$
declare current_ids integer[]; remaining_ids integer[]; reordered_ids integer[];
begin
  if public.is_publications_admin() is distinct from true then raise exception 'Admin access required' using errcode='42501'; end if;
  lock table public.projects_guided in exclusive mode;
  select coalesce(array_agg(id order by display_order),'{}'::integer[]) into current_ids from public.projects_guided;
  if current_ids is distinct from p_expected_order then raise exception 'Project order changed; reload before reordering' using errcode='P0001'; end if;
  if p_id is null or p_position is null or p_position<1 or p_position>cardinality(current_ids) or not p_id=any(current_ids) then
    raise exception 'Invalid project position' using errcode='22023';
  end if;
  remaining_ids := array_remove(current_ids,p_id);
  reordered_ids := remaining_ids[1:p_position-1] || array[p_id] || remaining_ids[p_position:cardinality(remaining_ids)];
  set constraints public.projects_guided_display_order_unique deferred;
  update public.projects_guided m set display_order=o.position::integer
    from unnest(reordered_ids) with ordinality as o(id,position)
    where m.id=o.id and m.display_order is distinct from o.position::integer;
  set constraints public.projects_guided_display_order_unique immediate;
end;
$$;

revoke all on function public.admin_save_project_guided(integer,jsonb,timestamptz) from public,anon,authenticated;
revoke all on function public.admin_delete_project_guided(integer,timestamptz,boolean) from public,anon,authenticated;
revoke all on function public.admin_move_project_guided(integer,integer,integer[]) from public,anon,authenticated;
grant execute on function public.admin_save_project_guided(integer,jsonb,timestamptz) to authenticated;
grant execute on function public.admin_delete_project_guided(integer,timestamptz,boolean) to authenticated;
grant execute on function public.admin_move_project_guided(integer,integer,integer[]) to authenticated;

commit;
