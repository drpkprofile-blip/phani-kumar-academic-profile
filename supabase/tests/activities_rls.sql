-- Synthetic negative IDs and users only; all writes roll back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(32);
insert into auth.users(id) values
('00000000-0000-0000-0000-000000000301'),('00000000-0000-0000-0000-000000000302');
insert into private.publications_admins(user_id) values ('00000000-0000-0000-0000-000000000301');
insert into public.activities(id,year,title,activity_type,institution,display_order) values
(-301,'9998','Activity test A','Conference','Test only',1),
(-302,'9998','Activity test B','FDP','Test only',2);

set local role anon;
select is((select count(*)::integer from public.activities where id < 0),2,'Anonymous can read activities');
select is((select array_agg(label order by display_order) from public.activity_categories),array['Conference','FDP','Organizing','Guest Lecture','Training','Workshop','STTP','Webinar','Quiz','Resource Person','Seminar'],'Anonymous reads exact category order');
select throws_ok($$insert into public.activities(id,year,title,activity_type,institution,display_order) values(-303,'9998','Test','FDP','Test',3)$$,'42501',null,'Anonymous insert denied');
select throws_ok($$update public.activities set display_order=3 where id=-301$$,'42501',null,'Anonymous reorder denied');
select throws_ok($$delete from public.activities where id=-301$$,'42501',null,'Anonymous delete denied');
select throws_ok($$insert into public.activity_categories(label,display_order) values('Test category',12)$$,'42501',null,'Anonymous category insert denied');
select throws_ok($$update public.activity_categories set display_order=12 where label='Conference'$$,'42501',null,'Anonymous category update denied');
select throws_ok($$delete from public.activity_categories where label='Seminar'$$,'42501',null,'Anonymous category delete denied');
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000302","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'Authenticated metadata cannot grant admin');
select is((select count(*)::integer from public.activities where id < 0),2,'Authenticated public can read activities');
select is((select count(*)::integer from public.activity_categories),11,'Authenticated public can read categories');
select throws_ok($$insert into public.activities(id,year,title,activity_type,institution,display_order) values(-303,'9998','Test','FDP','Test',3)$$,'42501',null,'Non-admin insert denied');
with changed as (update public.activities set display_order=3 where id=-301 returning id)
select is((select count(*)::integer from changed),0,'Non-admin update/reorder denied');
with removed as (delete from public.activities where id=-301 returning id)
select is((select count(*)::integer from removed),0,'Non-admin delete denied');
select throws_ok($$insert into public.activity_categories(label,display_order) values('Test category',12)$$,'42501',null,'Non-admin category insert denied');
with changed as (update public.activity_categories set display_order=12 where label='Seminar' returning label)
select is((select count(*)::integer from changed),0,'Non-admin category update denied');
with removed as (delete from public.activity_categories where label='Seminar' returning label)
select is((select count(*)::integer from removed),0,'Non-admin category delete denied');
select throws_ok($$insert into private.publications_admins(user_id) values('00000000-0000-0000-0000-000000000302')$$,'42501',null,'Non-admin cannot promote self');
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000301","role":"authenticated"}',true);
set local role authenticated;
select lives_ok($$insert into public.activities(id,year,title,activity_type,institution,display_order) values(-303,'9998','Test add','FDP','Exact institution',3)$$,'Admin insert allowed');
select ok((select date_text is null and duration_text is null and details is null and proof_url is null and source_order is null from public.activities where id=-303),'Missing optional values stay NULL');
select lives_ok($$update public.activities set date_text='21 & 24 December 2022',duration_text='Two-week Value-Added Course',title='Test edited' where id=-303$$,'Admin edit allowed');
select ok((select date_text='21 & 24 December 2022' and duration_text='Two-week Value-Added Course' and institution='Exact institution' from public.activities where id=-303),'Free text preserved exactly');
select throws_ok($$insert into public.activities(id,year,title,activity_type,institution,display_order) values(-304,'9998','Collision','FDP','Test',1)$$,'23505',null,'Same-year duplicate position rejected');
select lives_ok($$insert into public.activities(id,year,title,activity_type,institution,display_order) values(-304,'9999','Other year','FDP','Test',1)$$,'Same position in different year allowed');
select lives_ok($$set constraints activities_year_order_unique deferred; update public.activities set display_order=case id when -301 then 2 else 1 end where id in(-301,-302); set constraints activities_year_order_unique immediate$$,'Admin can swap positions transactionally');
select ok((select display_order=2 from public.activities where id=-301) and (select display_order=1 from public.activities where id=-302),'Swap retains unique final positions');
select throws_ok($$update public.activities set activity_type='Unknown category' where id=-303$$,'23503',null,'Unknown category rejected by relationship');
select lives_ok($$insert into public.activity_categories(label,display_order) values('Future test category',12); update public.activities set activity_type='Future test category' where id=-303$$,'Admin can add future category without schema changes');
select throws_ok($$delete from public.activity_categories where label='Future test category'$$,'23503',null,'Referenced category cannot be removed');
select lives_ok($$delete from public.activities where id=-303; delete from public.activity_categories where label='Future test category'$$,'Admin delete and unused category removal allowed');
select throws_ok($$update private.publications_admins set user_id='00000000-0000-0000-0000-000000000302'$$,'42501',null,'Admin cannot modify membership through client role');
reset role;
select ok((select condeferrable from pg_constraint where conname='activities_year_order_unique' and conrelid='public.activities'::regclass),'Year/order uniqueness is deferrable');
select * from finish();
rollback;
