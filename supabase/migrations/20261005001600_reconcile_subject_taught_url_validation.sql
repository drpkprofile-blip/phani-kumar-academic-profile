-- Preserve the stricter proof URL validation already active in production.
-- Migration 20261005001100 used a broader regex; this forward migration records
-- the live HTTP/HTTPS host/path/query/fragment validation as the intended state.
begin;
CREATE OR REPLACE FUNCTION public.admin_save_subject_taught(p_id integer DEFAULT NULL::integer, p_subject jsonb DEFAULT '{}'::jsonb, p_expected_updated_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare saved_id integer; next_position integer; previous public.subjects_taught%rowtype; subject_name_value text; course_code_value text; program_value text; branch_value text; semester_value text; academic_year_value text; subject_type_value text; proof_link text;
begin
 if public.is_publications_admin() is distinct from true then raise exception 'Admin access required' using errcode='42501'; end if;
 lock table public.subjects_taught in exclusive mode;
 if jsonb_typeof(p_subject) is distinct from 'object' or (p_subject-array['subject_name','course_code','program','branch','semester','academic_year','subject_type','proof_url']::text[]) <> '{}'::jsonb then raise exception 'Subject object contains invalid fields' using errcode='22023'; end if;
 subject_name_value:=p_subject->>'subject_name'; if subject_name_value is null or subject_name_value !~ '[^[:space:]]' then raise exception 'A nonblank subject name is required' using errcode='22023'; end if;
 course_code_value:=case when coalesce(p_subject->>'course_code','') !~ '[^[:space:]]' then null else p_subject->>'course_code' end;
 program_value:=case when coalesce(p_subject->>'program','') !~ '[^[:space:]]' then null else p_subject->>'program' end;
 branch_value:=case when coalesce(p_subject->>'branch','') !~ '[^[:space:]]' then null else p_subject->>'branch' end;
 semester_value:=case when coalesce(p_subject->>'semester','') !~ '[^[:space:]]' then null else p_subject->>'semester' end;
 academic_year_value:=case when coalesce(p_subject->>'academic_year','') !~ '[^[:space:]]' then null else p_subject->>'academic_year' end;
 subject_type_value:=case when coalesce(p_subject->>'subject_type','') !~ '[^[:space:]]' then null else p_subject->>'subject_type' end;
 proof_link:=p_subject->>'proof_url'; if proof_link is not null and btrim(proof_link)='' then proof_link:=null; end if;
 if proof_link is not null and (proof_link !~* '^https?://[A-Za-z0-9.-]+(:[0-9]+)?(/[^[:space:]]*)?(\?[^[:space:]]*)?(#[^[:space:]]*)?$' or proof_link ~* '^https?://[^/]*@') then raise exception 'Proof links must be HTTP or HTTPS URLs' using errcode='22023'; end if;
 if p_id is null then
  select coalesce(max(display_order),0)+1 into next_position from public.subjects_taught;
  insert into public.subjects_taught(subject_name,course_code,program,branch,semester,academic_year,subject_type,proof_url,display_order) values(subject_name_value,course_code_value,program_value,branch_value,semester_value,academic_year_value,subject_type_value,proof_link,next_position) returning id into saved_id;
 else
  select * into previous from public.subjects_taught where id=p_id and updated_at=p_expected_updated_at;
  if not found then raise exception 'Record changed or no longer exists; reload before saving' using errcode='P0001'; end if;
  update public.subjects_taught set subject_name=subject_name_value,course_code=course_code_value,program=program_value,branch=branch_value,semester=semester_value,academic_year=academic_year_value,subject_type=subject_type_value,proof_url=proof_link where id=p_id returning id into saved_id;
 end if; return saved_id;
end; $function$;

commit;


