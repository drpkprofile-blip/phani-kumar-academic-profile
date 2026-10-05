begin;

create or replace function public.admin_save_subject_taught(
  p_id integer default null,
  p_subject jsonb default '{}'::jsonb,
  p_expected_updated_at timestamptz default null
) returns integer language plpgsql security invoker set search_path = '' as $$
declare
  saved_id integer;
  next_position integer;
  previous public.subjects_taught%rowtype;
  subject_name_value text;
  course_code_value text;
  program_value text;
  branch_value text;
  semester_value text;
  academic_year_value text;
  subject_type_value text;
  proof_link text;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  lock table public.subjects_taught in exclusive mode;
  if jsonb_typeof(p_subject) is distinct from 'object'
    or (p_subject - array['subject_name','course_code','program','branch','semester','academic_year','subject_type','proof_url']::text[]) <> '{}'::jsonb then
    raise exception 'Subject object contains invalid fields' using errcode = '22023';
  end if;
  subject_name_value := p_subject->>'subject_name';
  if subject_name_value is null or subject_name_value !~ '[^[:space:]]' then
    raise exception 'A nonblank subject name is required' using errcode = '22023';
  end if;
  course_code_value := case when coalesce(p_subject->>'course_code', '') !~ '[^[:space:]]' then null else p_subject->>'course_code' end;
  program_value := case when coalesce(p_subject->>'program', '') !~ '[^[:space:]]' then null else p_subject->>'program' end;
  branch_value := case when coalesce(p_subject->>'branch', '') !~ '[^[:space:]]' then null else p_subject->>'branch' end;
  semester_value := case when coalesce(p_subject->>'semester', '') !~ '[^[:space:]]' then null else p_subject->>'semester' end;
  academic_year_value := case when coalesce(p_subject->>'academic_year', '') !~ '[^[:space:]]' then null else p_subject->>'academic_year' end;
  subject_type_value := case when coalesce(p_subject->>'subject_type', '') !~ '[^[:space:]]' then null else p_subject->>'subject_type' end;
  proof_link := p_subject->>'proof_url';
  if proof_link is not null and btrim(proof_link) = '' then proof_link := null; end if;
  if proof_link is not null and (proof_link !~* '^https?://[^[:space:]]+$'
    or proof_link ~* '^https?://[^/]*@') then
    raise exception 'Proof links must be HTTP or HTTPS URLs' using errcode = '22023';
  end if;
  if p_id is null then
    select coalesce(max(display_order), 0) + 1 into next_position from public.subjects_taught;
    insert into public.subjects_taught(subject_name,course_code,program,branch,semester,academic_year,subject_type,proof_url,display_order)
    values(subject_name_value,course_code_value,program_value,branch_value,semester_value,academic_year_value,subject_type_value,proof_link,next_position)
    returning id into saved_id;
  else
    select * into previous from public.subjects_taught where id=p_id and updated_at=p_expected_updated_at;
    if not found then
      raise exception 'Record changed or no longer exists; reload before saving' using errcode = 'P0001';
    end if;
    update public.subjects_taught set subject_name=subject_name_value,course_code=course_code_value,
      program=program_value,branch=branch_value,semester=semester_value,academic_year=academic_year_value,
      subject_type=subject_type_value,proof_url=proof_link
    where id=p_id returning id into saved_id;
  end if;
  return saved_id;
end;
$$;

create or replace function public.admin_delete_subject_taught(
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
  lock table public.subjects_taught in exclusive mode;
  delete from public.subjects_taught where id=p_id and updated_at=p_expected_updated_at returning id into deleted_id;
  if deleted_id is null then
    raise exception 'Record changed or no longer exists; reload before deleting' using errcode = 'P0001';
  end if;
  select coalesce(array_agg(id order by display_order), '{}'::integer[]) into remaining_ids from public.subjects_taught;
  if cardinality(remaining_ids)>0 then
    set constraints public.subjects_taught_display_order_unique deferred;
    update public.subjects_taught m set display_order=o.position::integer
    from unnest(remaining_ids) with ordinality as o(id,position)
    where m.id=o.id and m.display_order is distinct from o.position::integer;
    set constraints public.subjects_taught_display_order_unique immediate;
  end if;
  return deleted_id;
end;
$$;

create or replace function public.admin_move_subject_taught(
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
  lock table public.subjects_taught in exclusive mode;
  select coalesce(array_agg(id order by display_order), '{}'::integer[]) into current_ids from public.subjects_taught;
  if current_ids is distinct from p_expected_order then
    raise exception 'Subject order changed; reload before reordering' using errcode = 'P0001';
  end if;
  if p_id is null or p_position is null or p_position<1 or p_position>cardinality(current_ids) or not p_id=any(current_ids) then
    raise exception 'Invalid subject position' using errcode = '22023';
  end if;
  remaining_ids := array_remove(current_ids,p_id);
  reordered_ids := remaining_ids[1:p_position-1] || array[p_id] || remaining_ids[p_position:cardinality(remaining_ids)];
  set constraints public.subjects_taught_display_order_unique deferred;
  update public.subjects_taught m set display_order=o.position::integer
  from unnest(reordered_ids) with ordinality as o(id,position)
  where m.id=o.id and m.display_order is distinct from o.position::integer;
  set constraints public.subjects_taught_display_order_unique immediate;
end;
$$;

revoke all on function public.admin_save_subject_taught(integer,jsonb,timestamptz) from public,anon,authenticated;
revoke all on function public.admin_delete_subject_taught(integer,timestamptz,boolean) from public,anon,authenticated;
revoke all on function public.admin_move_subject_taught(integer,integer,integer[]) from public,anon,authenticated;
grant execute on function public.admin_save_subject_taught(integer,jsonb,timestamptz) to authenticated;
grant execute on function public.admin_delete_subject_taught(integer,timestamptz,boolean) to authenticated;
grant execute on function public.admin_move_subject_taught(integer,integer,integer[]) to authenticated;

commit;
