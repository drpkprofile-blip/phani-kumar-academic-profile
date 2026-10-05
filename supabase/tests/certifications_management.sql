-- Add/edit/reorder/delete functions are tested with temporary fixture rows only.
-- Every change, including position resequencing, is rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(32);

create temporary table phase4e_before on commit drop as
select * from public.certifications;
create temporary table phase4e_a(id integer) on commit drop;
create temporary table phase4e_b(id integer) on commit drop;
create temporary table phase4e_users(user_id uuid) on commit drop;
grant select on phase4e_before to authenticated;
grant select, insert on phase4e_a, phase4e_b to authenticated;
insert into phase4e_users values
  ('00000000-0000-0000-0000-000000000501'),
  ('00000000-0000-0000-0000-000000000502');
insert into auth.users(id) select user_id from phase4e_users;
insert into private.publications_admins(user_id)
select user_id from phase4e_users where user_id='00000000-0000-0000-0000-000000000501';

select is((select count(*)::integer from phase4e_before),13,'The original 13 certifications are present before acceptance fixtures');
set local role anon;
select is((select count(*)::integer from public.certifications),13,'Anonymous visitors can read the current certification list');
select throws_ok($$insert into public.certifications(title,display_order) values('Anonymous test',900101)$$,
  '42501',null,'Anonymous direct writes remain denied');
select throws_ok($$select public.admin_save_certification(null,'{"title":"Anonymous test"}'::jsonb,null)$$,
  '42501',null,'Anonymous certification actions are denied');
select throws_ok($$select public.admin_delete_certification(1,null,true)$$,
  '42501',null,'Anonymous delete actions are denied');
select throws_ok($$select public.admin_move_certification(1,1,'{}'::integer[])$$,
  '42501',null,'Anonymous reorder actions are denied');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000502","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'Authentication and user metadata do not grant admin access');
select is((select count(*)::integer from public.certifications),13,'Authenticated non-admin visitors can read certifications');
select throws_ok($$insert into public.certifications(title,display_order) values('Non-admin test',900101)$$,
  '42501',null,'Authenticated non-admin direct writes are denied');
select throws_ok($$select public.admin_save_certification(null,'{"title":"Non-admin test"}'::jsonb,null)$$,
  '42501',null,'Authenticated non-admin certification actions are denied');
select throws_ok($$select public.admin_delete_certification(1,null,true)$$,
  '42501',null,'Authenticated non-admin delete actions are denied');
select throws_ok($$select public.admin_move_certification(1,1,'{}'::integer[])$$,
  '42501',null,'Authenticated non-admin reorder actions are denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000501","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
insert into phase4e_a select public.admin_save_certification(null,
  '{"title":"Phase 4E temporary certification A","certificate_url":"https://example.test/certificate?usp=drive_link&ref=phase4e","fdp_url":""}'::jsonb,null);
select ok((select count(*)=1 from phase4e_a),'Admin can create a certification');
select ok((select source_order is null and fdp_url is null and certificate_url='https://example.test/certificate?usp=drive_link&ref=phase4e'
  from public.certifications where id=(select id from phase4e_a)),
  'New records keep NULL source_order and optional URLs, preserving supplied URL text');
select is((select display_order from public.certifications where id=(select id from phase4e_a)),14,
  'New certification is appended at a positive final display position');
select throws_ok($$select public.admin_save_certification(null,'{"title":"   "}'::jsonb,null)$$,
  '22023',null,'Blank titles are rejected');
select throws_ok($$select public.admin_save_certification(null,'{"title":"Temporary","certificate_url":"javascript:alert(1)"}'::jsonb,null)$$,
  '22023',null,'Non-HTTP URLs are rejected');
select lives_ok(format(
  'select public.admin_save_certification(%s, %L::jsonb, (select updated_at from public.certifications where id=%s))',
  (select id from phase4e_a),
  '{"title":"Phase 4E edited certification A","certificate_url":"https://example.test/certificate?usp=drive_link&ref=edited","fdp_url":null}',
  (select id from phase4e_a)),
  'Admin can edit title and links');
select ok((select title='Phase 4E edited certification A'
  and certificate_url='https://example.test/certificate?usp=drive_link&ref=edited'
  from public.certifications where id=(select id from phase4e_a)),
  'Edit preserves supplied URL query text');
select is((select display_order from public.certifications where id=(select id from phase4e_a)),14,
  'Editing metadata does not change display position');
insert into phase4e_b select public.admin_save_certification(null,
  '{"title":"Phase 4E temporary certification B"}'::jsonb,null);
select is((select display_order from public.certifications where id=(select id from phase4e_b)),15,
  'Second new record appends after the current final position');
select lives_ok(format(
  'select public.admin_move_certification(%s,14,%L::integer[])',
  (select id from phase4e_b),
  (select array_agg(id order by display_order)::text from public.certifications)),
  'Admin can transactionally reorder the full list');
select ok((select display_order=14 from public.certifications where id=(select id from phase4e_b))
  and (select display_order=15 from public.certifications where id=(select id from phase4e_a)),
  'Reorder creates consecutive positive positions');
select ok((select count(*)=15 and count(distinct display_order)=15 and min(display_order)=1 and max(display_order)=15
  from public.certifications),'Reorder leaves no duplicate, missing, zero or negative positions');
select throws_ok(format('select public.admin_delete_certification(%s, (select updated_at from public.certifications where id=%s), false)',
  (select id from phase4e_b),(select id from phase4e_b)),
  '22023',null,'Delete requires explicit confirmation');
select lives_ok(format('select public.admin_delete_certification(%s, (select updated_at from public.certifications where id=%s), true)',
  (select id from phase4e_b),(select id from phase4e_b)),
  'Admin can delete with confirmation');
select is((select display_order from public.certifications where id=(select id from phase4e_a)),14,
  'Deleting a record compacts later display positions');
select ok((select count(*)=14 and count(distinct display_order)=14 and min(display_order)=1 and max(display_order)=14
  from public.certifications),'Delete leaves consecutive positive positions');
select lives_ok(format('select public.admin_delete_certification(%s, (select updated_at from public.certifications where id=%s), true)',
  (select id from phase4e_a),(select id from phase4e_a)),
  'Admin can remove the remaining temporary certification');
select is((select count(*)::integer from public.certifications),13,'Temporary rows are removed after acceptance tests');
select ok(not exists (
  select 1 from phase4e_before b full join public.certifications c using (id)
  where b.id is null or c.id is null or to_jsonb(b) is distinct from to_jsonb(c)
),'All original 13 records and their metadata, order and timestamps remain unchanged');

reset role;
select * from finish();
rollback;
