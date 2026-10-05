-- All project fixtures are synthetic and rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(19);
create temporary table projects_before on commit drop as select * from public.projects_guided;
create temporary table project_fixture_ids(id integer) on commit drop;
grant select on projects_before to authenticated;
grant select,insert on project_fixture_ids to authenticated;
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000983');
insert into private.publications_admins(user_id) values ('00000000-0000-0000-0000-000000000983');
select is((select count(*)::integer from projects_before),0,'Live Projects Guided table starts empty');

select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000983","role":"authenticated"}',true);
set local role authenticated;
insert into project_fixture_ids select public.admin_save_project_guided(null,
  '{"project_title":"Synthetic project A","project_level":"UG","degree_program":"B.Tech","branch":"Mechanical","academic_year":"2026-27","batch":"2023-27","student_names":["Asha Rao","Kiran Das"],"guide_name":"Dr. Example","co_guide_names":["Meera","Hari"],"proof_url":"https://example.test/proof?x=1&keep=2"}'::jsonb,null);
select is((select count(*)::integer from project_fixture_ids),1,'Admin can create a project');
select ok((select display_order=1 and source_order is null and student_names=array['Asha Rao','Kiran Das']
  and co_guide_names=array['Meera','Hari'] and project_title='Synthetic project A'
  and proof_url='https://example.test/proof?x=1&keep=2' from public.projects_guided where id=(select min(id) from project_fixture_ids)),
  'Project fields, ordered arrays and full proof URL are preserved');
select throws_ok($$select public.admin_save_project_guided(null,'{"project_title":"  "}'::jsonb,null)$$,
  '22023',null,'Blank project title is rejected');
select throws_ok($$select public.admin_save_project_guided(null,'{"project_title":"Unsafe","proof_url":"ftp://example.test/proof"}'::jsonb,null)$$,
  '22023',null,'Non-HTTP proof URL is rejected');
select throws_ok($$select public.admin_save_project_guided(null,'{"project_title":"Malformed names","student_names":[1]}'::jsonb,null)$$,
  '22023',null,'Student name arrays reject non-string entries');
select lives_ok(format('select public.admin_save_project_guided(%s,%L::jsonb,(select updated_at from public.projects_guided where id=%s))',
  (select min(id) from project_fixture_ids),
  '{"project_title":"Synthetic project A edited","project_level":"PG","degree_program":"M.Tech","branch":"Mechanical","academic_year":"2026-27","batch":"2024-26","student_names":["Kiran Das","Asha Rao"],"guide_name":"Dr. Example","co_guide_names":["Hari","Meera"],"proof_url":"https://example.test/proof?edited=1"}',
  (select min(id) from project_fixture_ids)),'Admin can edit a project');
select is((select display_order from public.projects_guided where id=(select min(id) from project_fixture_ids)),1,
  'Editing metadata preserves display position');
select is((select student_names from public.projects_guided where id=(select min(id) from project_fixture_ids)),array['Kiran Das','Asha Rao'],
  'Edited student array preserves entered order');
insert into project_fixture_ids select public.admin_save_project_guided(null,'{"project_title":"Synthetic project B"}'::jsonb,null);
select is((select display_order from public.projects_guided where id=(select max(id) from project_fixture_ids)),2,
  'New project appends at the end');
select ok((select project_level is null and degree_program is null and branch is null and academic_year is null
  and batch is null and student_names is null and guide_name is null and co_guide_names is null and proof_url is null
  and source_order is null from public.projects_guided where id=(select max(id) from project_fixture_ids)),
  'All omitted optional fields remain NULL for a newly created project');
select lives_ok(format('select public.admin_move_project_guided(%s,1,%L::integer[])',
  (select max(id) from project_fixture_ids),(select array_agg(id order by display_order)::text from public.projects_guided)),
  'Admin can reorder projects transactionally');
select ok((select display_order=1 from public.projects_guided where id=(select max(id) from project_fixture_ids))
  and (select array_agg(display_order order by display_order)=array[1,2] from public.projects_guided),
  'Reorder keeps unique consecutive positions');
select throws_ok(format('select public.admin_delete_project_guided(%s,(select updated_at from public.projects_guided where id=%s),false)',
  (select max(id) from project_fixture_ids),(select max(id) from project_fixture_ids)),
  '22023',null,'Delete requires explicit confirmation');
select lives_ok(format('select public.admin_delete_project_guided(%s,(select updated_at from public.projects_guided where id=%s),true)',
  (select max(id) from project_fixture_ids),(select max(id) from project_fixture_ids)),'Admin can delete after confirmation');
select is((select display_order from public.projects_guided where id=(select min(id) from project_fixture_ids)),1,
  'Delete resequences remaining positions');
select lives_ok(format('select public.admin_delete_project_guided(%s,(select updated_at from public.projects_guided where id=%s),true)',
  (select min(id) from project_fixture_ids),(select min(id) from project_fixture_ids)),'Admin can delete final test project');
select is((select count(*)::integer from public.projects_guided),0,'Rollback fixture leaves table empty before transaction rollback');
select ok(not exists(select 1 from projects_before b full join public.projects_guided p using(id)
  where b.id is null or p.id is null or to_jsonb(b) is distinct from to_jsonb(p)),
  'Original project rows, if any, are unchanged');
reset role;
select * from finish();
rollback;
