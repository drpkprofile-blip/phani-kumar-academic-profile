-- Synthetic fixtures only. The transaction rolls back all rows and test users.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(24);

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000961'),
  ('00000000-0000-0000-0000-000000000962');
insert into private.publications_admins(user_id) values ('00000000-0000-0000-0000-000000000961');
insert into public.subjects_taught(id,subject_name,display_order)
values (-961,'Subjects Taught RLS fixture A',990001),(-962,'Subjects Taught RLS fixture B',990002);

set local role anon;
select is((select count(*)::integer from public.subjects_taught where id<0),2,'Anonymous visitors can read subjects');
select throws_ok($$insert into public.subjects_taught(subject_name,display_order) values('Anonymous',990003)$$,
  '42501',null,'Anonymous direct insert is denied');
select throws_ok($$update public.subjects_taught set display_order=990003 where id=-961$$,
  '42501',null,'Anonymous update and reorder are denied');
select throws_ok($$delete from public.subjects_taught where id=-961$$,
  '42501',null,'Anonymous delete is denied');
select throws_ok($$select public.admin_save_subject_taught(null,'{"subject_name":"Anonymous"}'::jsonb,null)$$,
  '42501',null,'Anonymous RPC write is denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000962","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'User metadata cannot grant admin access');
select is((select count(*)::integer from public.subjects_taught where id<0),2,'Authenticated visitors can read subjects');
select throws_ok($$insert into public.subjects_taught(subject_name,display_order) values('Non-admin',990003)$$,
  '42501',null,'Authenticated non-admin direct insert is denied');
with changed as (update public.subjects_taught set subject_name='Non-admin edit' where id=-961 returning id)
select is((select count(*)::integer from changed),0,'Authenticated non-admin update is denied');
with removed as (delete from public.subjects_taught where id=-961 returning id)
select is((select count(*)::integer from removed),0,'Authenticated non-admin delete is denied');
select throws_ok($$select public.admin_save_subject_taught(null,'{"subject_name":"Non-admin"}'::jsonb,null)$$,
  '42501',null,'Authenticated non-admin RPC write is denied');
select throws_ok($$select public.admin_move_subject_taught(-961,1,'{}'::integer[])$$,
  '42501',null,'Authenticated non-admin reorder is denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000961","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
select lives_ok($$insert into public.subjects_taught(id,subject_name,display_order)
  values(-963,'Admin subject fixture',990003)$$,'Allowlisted admin can insert');
select ok((select course_code is null and program is null and branch is null and semester is null
  and academic_year is null and subject_type is null and proof_url is null and source_order is null
  from public.subjects_taught where id=-963),'Optional metadata and source order may be NULL');
select lives_ok($$update public.subjects_taught set subject_name='Admin subject edited' where id=-963$$,
  'Allowlisted admin can edit');
select ok((select display_order=990003 from public.subjects_taught where id=-963),'Admin metadata edit can preserve position');
select throws_ok($$insert into public.subjects_taught(id,subject_name,display_order) values(-964,'   ',990004)$$,
  '23514',null,'Blank subject name is rejected');
select throws_ok($$insert into public.subjects_taught(id,subject_name,display_order) values(-965,'Zero position',0)$$,
  '23514',null,'Non-positive display order is rejected');
select throws_ok($$insert into public.subjects_taught(id,subject_name,display_order) values(-966,'Duplicate position',990001)$$,
  '23505',null,'Duplicate display order is rejected');
select lives_ok($$set constraints subjects_taught_display_order_unique deferred;
  update public.subjects_taught set display_order=case id when -961 then 990002 when -962 then 990001 else 990003 end
  where id in(-961,-962,-963); set constraints subjects_taught_display_order_unique immediate$$,
  'Allowlisted admin can reorder positions transactionally');
select ok((select count(distinct display_order)=3 and min(display_order)=990001 and max(display_order)=990003
  from public.subjects_taught where id between -966 and -961),'Reorder leaves unique valid positions');
select lives_ok($$delete from public.subjects_taught where id=-963$$,'Allowlisted admin can delete');
reset role;
select ok((select condeferrable from pg_constraint where conname='subjects_taught_display_order_unique'
  and conrelid='public.subjects_taught'::regclass),'Display order uniqueness is deferrable');
select * from finish();
rollback;
