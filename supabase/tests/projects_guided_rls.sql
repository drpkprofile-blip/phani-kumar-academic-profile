-- All auth users and project rows are synthetic and rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(18);

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000981'),
  ('00000000-0000-0000-0000-000000000982');
insert into private.publications_admins(user_id) values ('00000000-0000-0000-0000-000000000981');

set local role anon;
select is((select count(*)::integer from public.projects_guided),0,'Anonymous visitors can read the empty Projects Guided table');
select throws_ok($$insert into public.projects_guided(project_title,display_order) values('Anonymous project',1)$$,
  '42501',null,'Anonymous direct insert is denied');
select throws_ok($$select public.admin_save_project_guided(null,'{"project_title":"Anonymous project"}'::jsonb,null)$$,
  '42501',null,'Anonymous mutation RPC is denied');
select throws_ok($$delete from public.projects_guided where id=1$$,'42501',null,'Anonymous delete is denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000982","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'User metadata cannot grant admin access');
select is((select count(*)::integer from public.projects_guided),0,'Authenticated visitors can read projects');
select throws_ok($$insert into public.projects_guided(project_title,display_order) values('Non-admin project',1)$$,
  '42501',null,'Authenticated non-admin insert is denied');
with changed as (update public.projects_guided set project_title='Unauthorized edit' returning id)
select is((select count(*)::integer from changed),0,'Authenticated non-admin update is denied');
with removed as (delete from public.projects_guided returning id)
select is((select count(*)::integer from removed),0,'Authenticated non-admin delete is denied');
select throws_ok($$select public.admin_save_project_guided(null,'{"project_title":"Non-admin project"}'::jsonb,null)$$,
  '42501',null,'Authenticated non-admin RPC mutation is denied');
select throws_ok($$select public.admin_move_project_guided(1,1,'{}'::integer[])$$,
  '42501',null,'Authenticated non-admin reorder is denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000981","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
select lives_ok($$select public.admin_save_project_guided(null,'{"project_title":"Synthetic RLS project A","student_names":["Asha","Kiran"],"co_guide_names":["Meera"],"proof_url":"https://example.test/proof?x=1&keep=2"}'::jsonb,null)$$,
  'Allowlisted admin can create a project');
select lives_ok($$select public.admin_save_project_guided(null,'{"project_title":"Synthetic RLS project B"}'::jsonb,null)$$,
  'Allowlisted admin can create another project');
select ok((select project_level is null and degree_program is null and branch is null and academic_year is null
  and batch is null and guide_name is null and source_order is null and student_names=array['Asha','Kiran']
  and co_guide_names=array['Meera'] from public.projects_guided where project_title='Synthetic RLS project A'),
  'Optional fields may be NULL and name array order is preserved');
select lives_ok($$select public.admin_move_project_guided((select id from public.projects_guided where project_title='Synthetic RLS project B'),1,
  (select array_agg(id order by display_order) from public.projects_guided))$$,'Allowlisted admin can reorder projects');
select ok((select array_agg(display_order order by display_order)=array[1,2] and count(distinct display_order)=2
  from public.projects_guided),'Display positions remain positive and unique');
reset role;
select ok((select condeferrable from pg_constraint where conname='projects_guided_display_order_unique'
  and conrelid='public.projects_guided'::regclass),'Display order uniqueness is deferrable');
select * from finish();
rollback;
