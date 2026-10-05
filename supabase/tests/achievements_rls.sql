-- Synthetic rows and users only; every fixture write rolls back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(21);

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000801'),
  ('00000000-0000-0000-0000-000000000802');
insert into private.publications_admins(user_id)
values ('00000000-0000-0000-0000-000000000801');
insert into public.achievements(id,title,description,display_order)
values
  (-801,'Achievement RLS fixture A','Synthetic fixture A',980001),
  (-802,'Achievement RLS fixture B','Synthetic fixture B',980002);

set local role anon;
select is((select count(*)::integer from public.achievements where id < 0),2,
  'Anonymous users can read achievements');
select throws_ok($$insert into public.achievements(title,description,display_order)
  values('Anonymous fixture','Synthetic fixture',980003)$$,
  '42501',null,'Anonymous insert is denied');
select throws_ok($$update public.achievements set display_order=980003 where id=-801$$,
  '42501',null,'Anonymous update and reorder are denied');
select throws_ok($$delete from public.achievements where id=-801$$,
  '42501',null,'Anonymous delete is denied');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000802","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'User metadata cannot grant admin status');
select is((select count(*)::integer from public.achievements where id < 0),2,
  'Authenticated visitors can read achievements');
select throws_ok($$insert into public.achievements(title,description,display_order)
  values('Non-admin fixture','Synthetic fixture',980003)$$,
  '42501',null,'Authenticated non-admin insert is denied');
with changed as (update public.achievements set title='Non-admin edit'
  where id=-801 returning id)
select is((select count(*)::integer from changed),0,
  'Authenticated non-admin update is denied');
with removed as (delete from public.achievements where id=-801 returning id)
select is((select count(*)::integer from removed),0,
  'Authenticated non-admin delete is denied');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000801","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
select lives_ok($$insert into public.achievements(id,title,description,proof_url,extra_proof_url,display_order)
  values(-803,'Admin achievement fixture','Synthetic fixture description',null,null,980003)$$,
  'Admin can insert with both optional proof URLs NULL');
select ok((select proof_url is null and extra_proof_url is null and source_order is null
  from public.achievements where id=-803),
  'Optional URLs and future source_order remain NULL');
select lives_ok($$update public.achievements set title='Admin achievement edited',
  description='Edited synthetic description' where id=-803$$,
  'Admin can update achievement');
select throws_ok($$insert into public.achievements(id,title,description,display_order)
  values(-804,'   ','Synthetic fixture',980004)$$,
  '23514',null,'Blank title is rejected');
select throws_ok($$insert into public.achievements(id,title,description,display_order)
  values(-805,'Missing description',null,980004)$$,
  '23502',null,'Required description is enforced');
select throws_ok($$insert into public.achievements(id,title,description,display_order)
  values(-806,'Zero position','Synthetic fixture',0)$$,
  '23514',null,'Non-positive display order is rejected');
select throws_ok($$insert into public.achievements(id,title,description,display_order)
  values(-807,'Duplicate position','Synthetic fixture',980001)$$,
  '23505',null,'Duplicate display order is rejected');
select lives_ok($$set constraints achievements_display_order_unique deferred;
  update public.achievements set display_order=case id when -801 then 980002 else 980001 end
  where id in(-801,-802);
  set constraints achievements_display_order_unique immediate$$,
  'Admin can reorder positions transactionally');
select ok((select display_order=980002 from public.achievements where id=-801)
  and (select display_order=980001 from public.achievements where id=-802),
  'Transactional reorder leaves unique positions');
select lives_ok($$delete from public.achievements where id=-803$$,
  'Admin can delete achievement');
reset role;
select ok((select condeferrable from pg_constraint
  where conname='achievements_display_order_unique'
    and conrelid='public.achievements'::regclass),
  'Display order constraint is deferrable');

select * from finish();
rollback;
