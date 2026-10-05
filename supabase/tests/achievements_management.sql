-- All CRUD and reorder fixtures are rolled back; the original four rows are snapshotted.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(32);

create temporary table phase8e_before on commit drop as select * from public.achievements;
create temporary table phase8e_a(id integer) on commit drop;
create temporary table phase8e_b(id integer) on commit drop;
create temporary table phase8e_users(user_id uuid) on commit drop;
grant select on phase8e_before to authenticated;
grant select, insert on phase8e_a, phase8e_b to authenticated;
insert into phase8e_users values
  ('00000000-0000-0000-0000-000000000851'),
  ('00000000-0000-0000-0000-000000000852');
insert into auth.users(id) select user_id from phase8e_users;
insert into private.publications_admins(user_id)
select user_id from phase8e_users where user_id='00000000-0000-0000-0000-000000000851';

select is((select count(*)::integer from phase8e_before),4,'The original four achievements are present before test fixtures');
set local role anon;
select is((select count(*)::integer from public.achievements),4,'Anonymous visitors can read achievements');
select throws_ok($$insert into public.achievements(title,description,display_order) values('Anonymous','Fixture',1001)$$,
  '42501',null,'Anonymous direct insert is denied');
select throws_ok($$select public.admin_save_achievement(null,'{"title":"Anonymous","description":"Fixture"}'::jsonb,null)$$,
  '42501',null,'Anonymous achievement save is denied');
select throws_ok($$select public.admin_delete_achievement(1,null,true)$$,
  '42501',null,'Anonymous achievement delete is denied');
select throws_ok($$select public.admin_move_achievement(1,1,'{}'::integer[])$$,
  '42501',null,'Anonymous achievement reorder is denied');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000852","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'Authentication and user metadata do not grant admin access');
select is((select count(*)::integer from public.achievements),4,'Authenticated non-admin users can read achievements');
select throws_ok($$insert into public.achievements(title,description,display_order) values('Non-admin','Fixture',1001)$$,
  '42501',null,'Authenticated non-admin direct insert is denied');
select throws_ok($$select public.admin_save_achievement(null,'{"title":"Non-admin","description":"Fixture"}'::jsonb,null)$$,
  '42501',null,'Authenticated non-admin achievement save is denied');
select throws_ok($$select public.admin_delete_achievement(1,null,true)$$,
  '42501',null,'Authenticated non-admin achievement delete is denied');
select throws_ok($$select public.admin_move_achievement(1,1,'{}'::integer[])$$,
  '42501',null,'Authenticated non-admin achievement reorder is denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000851","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
insert into phase8e_a select public.admin_save_achievement(null,
  '{"title":"Phase 8E TEMP achievement A","description":"Temporary achievement description","proof_url":" ","extra_proof_url":""}'::jsonb,null);
select ok((select count(*)=1 from phase8e_a),'Admin can create an achievement');
select ok((select source_order is null and proof_url is null and extra_proof_url is null and display_order=5
  from public.achievements where id=(select id from phase8e_a)),
  'New achievement has NULL source order and URLs and appends at the next position');
select throws_ok($$select public.admin_save_achievement(null,'{"title":"   ","description":"Fixture"}'::jsonb,null)$$,
  '22023',null,'Blank title is rejected');
select throws_ok($$select public.admin_save_achievement(null,'{"title":"Valid","description":"   "}'::jsonb,null)$$,
  '22023',null,'Blank required description is rejected');
select throws_ok($$select public.admin_save_achievement(null,'{"title":"Valid","description":"Fixture","proof_url":"javascript:alert(1)"}'::jsonb,null)$$,
  '22023',null,'Invalid non-HTTP proof URL is rejected');
select throws_ok($$select public.admin_save_achievement(null,'{"title":"Valid","description":"Fixture","extra_proof_url":"ftp://example.test/proof"}'::jsonb,null)$$,
  '22023',null,'Non-HTTP extra proof URL is rejected');
select lives_ok(format(
  'select public.admin_save_achievement(%s, %L::jsonb, (select updated_at from public.achievements where id=%s))',
  (select id from phase8e_a),
  '{"title":"Phase 8E TEMP achievement A edited","description":"Edited text","proof_url":"https://drive.google.com/file/d/example/view?usp=drive_link&x=1","extra_proof_url":"https://example.test/event?source=event-proof"}',
  (select id from phase8e_a)),
  'Admin can edit achievement fields');
select ok((select title='Phase 8E TEMP achievement A edited' and description='Edited text'
  and proof_url='https://drive.google.com/file/d/example/view?usp=drive_link&x=1'
  and extra_proof_url='https://example.test/event?source=event-proof'
  from public.achievements where id=(select id from phase8e_a)),
  'Edit preserves supplied text and URL query strings exactly');
select is((select display_order from public.achievements where id=(select id from phase8e_a)),5,
  'Editing metadata preserves display position');
insert into phase8e_b select public.admin_save_achievement(null,
  '{"title":"Phase 8E TEMP achievement B","description":"Second temporary fixture"}'::jsonb,null);
select is((select display_order from public.achievements where id=(select id from phase8e_b)),6,
  'Second achievement appends after current records');
select lives_ok(format(
  'select public.admin_move_achievement(%s,5,%L::integer[])',
  (select id from phase8e_b),
  (select array_agg(id order by display_order)::text from public.achievements)),
  'Admin can transactionally reorder achievements');
select ok((select display_order=5 from public.achievements where id=(select id from phase8e_b))
  and (select display_order=6 from public.achievements where id=(select id from phase8e_a)),
  'Reorder changes positions without duplicates');
select throws_ok(format('select public.admin_delete_achievement(%s,(select updated_at from public.achievements where id=%s),false)',
  (select id from phase8e_b),(select id from phase8e_b)),
  '22023',null,'Delete requires explicit confirmation');
select lives_ok(format('select public.admin_delete_achievement(%s,(select updated_at from public.achievements where id=%s),true)',
  (select id from phase8e_b),(select id from phase8e_b)),
  'Admin can delete a confirmed achievement');
select is((select display_order from public.achievements where id=(select id from phase8e_a)),5,
  'Deleting a record compacts later display positions');
select lives_ok(format('select public.admin_delete_achievement(%s,(select updated_at from public.achievements where id=%s),true)',
  (select id from phase8e_a),(select id from phase8e_a)),
  'Admin can remove the remaining temporary achievement');
select is((select count(*)::integer from public.achievements),4,'Temporary achievement rows are removed');
select ok((select count(*)=4 and count(distinct display_order)=4 and min(display_order)=1 and max(display_order)=4
  from public.achievements),'Original achievement positions remain consecutive and unique');
select ok(not exists (
  select 1 from phase8e_before b full join public.achievements a using (id)
  where b.id is null or a.id is null or to_jsonb(b) is distinct from to_jsonb(a)
),'All original four records, metadata, order and timestamps remain unchanged');

reset role;
select * from finish();
rollback;
