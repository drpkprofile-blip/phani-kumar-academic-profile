-- All CRUD, order and validation fixtures are synthetic and rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(20);
create temporary table subjects_before on commit drop as select * from public.subjects_taught;
create temporary table subjects_created(id integer) on commit drop;
grant select on subjects_before to authenticated;
grant select,insert on subjects_created to authenticated;
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000971');
insert into private.publications_admins(user_id) values ('00000000-0000-0000-0000-000000000971');
select is((select count(*)::integer from subjects_before),0,'Live Subjects Taught table starts empty');

set local role anon;
select is((select count(*)::integer from public.subjects_taught),0,'Anonymous read is allowed for empty table');
select throws_ok($$select public.admin_save_subject_taught(null,'{"subject_name":"Anonymous"}'::jsonb,null)$$,
  '42501',null,'Anonymous cannot call subject save');
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000971","role":"authenticated"}',true);
set local role authenticated;
insert into subjects_created select public.admin_save_subject_taught(null,
  '{"subject_name":"Temporary subject A","course_code":"","program":" ","branch":"","semester":"","academic_year":"","subject_type":"","proof_url":""}'::jsonb,null);
select is((select count(*)::integer from subjects_created),1,'Allowlisted admin can create');
select ok((select display_order=1 and source_order is null and course_code is null and program is null
  and branch is null and semester is null and academic_year is null and subject_type is null and proof_url is null
  from public.subjects_taught where id=(select id from subjects_created)),'New subject appends with source_order NULL and blank optional values NULL');
select throws_ok($$select public.admin_save_subject_taught(null,'{"subject_name":"  "}'::jsonb,null)$$,
  '22023',null,'Blank subject name is rejected by management function');
select throws_ok($$select public.admin_save_subject_taught(null,'{"subject_name":"Valid","proof_url":"ftp://example.test/proof"}'::jsonb,null)$$,
  '22023',null,'Invalid proof URL is rejected');
select throws_ok($$select public.admin_save_subject_taught(null,'{"subject_name":"Valid","proof_url":"https://user:secret@example.test/proof"}'::jsonb,null)$$,
  '22023',null,'Credential-bearing proof URL is rejected');
select lives_ok(format('select public.admin_save_subject_taught(%s,%L::jsonb,(select updated_at from public.subjects_taught where id=%s))',
  (select id from subjects_created),
  '{"subject_name":"Temporary subject A edited","course_code":"ME401","program":"B.Tech","branch":"Mechanical","semester":"VII","academic_year":"2026-27","subject_type":"Theory","proof_url":"https://example.test/proof?x=1&keep=2"}',
  (select id from subjects_created)),'Admin can edit a subject');
select is((select display_order from public.subjects_taught where id=(select min(id) from subjects_created)),1,
  'Editing metadata preserves display position');
select is((select proof_url from public.subjects_taught where id=(select id from subjects_created)),
  'https://example.test/proof?x=1&keep=2','Proof URL query string is preserved exactly');
insert into subjects_created select public.admin_save_subject_taught(null,
  '{"subject_name":"Temporary subject B"}'::jsonb,null);
select is((select display_order from public.subjects_taught where id=(select max(id) from subjects_created)),2,
  'Second new subject appends at end');
select lives_ok(format('select public.admin_move_subject_taught(%s,1,%L::integer[])',
  (select max(id) from subjects_created),(select array_agg(id order by display_order)::text from public.subjects_taught)),
  'Admin can reorder subjects transactionally');
select ok((select display_order=1 from public.subjects_taught where id=(select max(id) from subjects_created))
  and (select array_agg(display_order order by display_order)=array[1,2] from public.subjects_taught),
  'Reorder keeps consecutive unique positions');
select throws_ok(format('select public.admin_delete_subject_taught(%s,(select updated_at from public.subjects_taught where id=%s),false)',
  (select max(id) from subjects_created),(select max(id) from subjects_created)),
  '22023',null,'Delete requires explicit confirmation');
select lives_ok(format('select public.admin_delete_subject_taught(%s,(select updated_at from public.subjects_taught where id=%s),true)',
  (select max(id) from subjects_created),(select max(id) from subjects_created)),
  'Admin can delete after confirmation');
select is((select display_order from public.subjects_taught where id=(select min(id) from subjects_created)),1,
  'Delete resequences remaining positions safely');
select lives_ok(format('select public.admin_delete_subject_taught(%s,(select updated_at from public.subjects_taught where id=%s),true)',
  (select min(id) from subjects_created),(select min(id) from subjects_created)),'Admin can delete final test subject');
select is((select count(*)::integer from public.subjects_taught),0,'Rollback fixture leaves table empty before transaction rollback');
select ok(not exists(select 1 from subjects_before b full join public.subjects_taught s using(id)
  where b.id is null or s.id is null or to_jsonb(b) is distinct from to_jsonb(s)),
  'Original table rows, if any, are unchanged');
reset role;
select * from finish();
rollback;
