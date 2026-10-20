-- The counter update and all authorization checks roll back at the end.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(8);

set local role anon;
select is((select total_visits from public.profile_visit_counter where singleton), 0::bigint,
  'Anonymous visitors can read the aggregate counter');
select throws_ok($$update public.profile_visit_counter set total_visits=999 where singleton$$,
  '42501', null, 'Anonymous direct updates are denied');
select throws_ok($$insert into public.profile_visit_counter(singleton,total_visits) values(false,1)$$,
  '42501', null, 'Anonymous direct inserts are denied');
select throws_ok($$delete from public.profile_visit_counter where singleton$$,
  '42501', null, 'Anonymous direct deletes are denied');
select is(public.record_profile_visit(), 1::bigint,
  'Anonymous visitors can increment the public aggregate through the function');
select is(public.record_profile_visit(), 2::bigint,
  'Each accepted visit increments the aggregate once');

reset role;
select ok(exists(select 1 from pg_policies where schemaname='public'
  and tablename='profile_visit_counter' and policyname='Anyone can read aggregate profile visits'
  and cmd='SELECT'), 'The counter exposes only its aggregate through public read policy');
select ok(not has_table_privilege('anon','public.profile_visit_counter','UPDATE')
  and not has_table_privilege('authenticated','public.profile_visit_counter','UPDATE'),
  'Neither public role can write the counter table directly');

select * from finish();
rollback;
