-- Curated project totals are tested independently and restored with rollback.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(12);

create temporary table project_counts_before on commit drop as select * from public.project_guided_settings;
create temporary table projects_before on commit drop as select * from public.projects_guided;
grant select on project_counts_before, projects_before to authenticated;
insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000996'),
  ('00000000-0000-0000-0000-000000000997');
insert into private.publications_admins(user_id) values ('00000000-0000-0000-0000-000000000996');

select is((select ug_project_count from project_counts_before where singleton),14,'Initial UG project total is the user-supplied 14');
select is((select pg_project_count from project_counts_before where singleton),4,'Initial PG project total is the user-supplied 4');
set local role anon;
select is((select count(*)::integer from public.project_guided_settings),1,'Anonymous visitors can read the counters');
select throws_ok($$update public.project_guided_settings set ug_project_count=900 where singleton$$,'42501',null,'Anonymous counter writes are denied');
select throws_ok($$select public.admin_update_project_guided_counts(15,5,now())$$,'42501',null,'Anonymous counter RPC writes are denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000997","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'Authenticated non-admin is not allowlisted');
with changed as (update public.project_guided_settings set pg_project_count=900 where singleton returning singleton)
select is((select count(*)::integer from changed),0,'Authenticated non-admin direct counter update is blocked by RLS');
select throws_ok($$select public.admin_update_project_guided_counts(15,5,now())$$,'42501',null,'Authenticated non-admin counter RPC is denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000996","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
select lives_ok($$select public.admin_update_project_guided_counts(15,5,(select updated_at from public.project_guided_settings where singleton))$$,
  'Allowlisted admin can update guided project totals');
select ok((select ug_project_count=15 and pg_project_count=5 from public.project_guided_settings where singleton),
  'Updated totals are stored independently of detailed project rows');
select ok(not exists(select 1 from projects_before before_row full join public.projects_guided current_row using(id)
  where before_row.id is null or current_row.id is null or to_jsonb(before_row) is distinct from to_jsonb(current_row)),
  'Counter edits leave all guided project records unchanged');

reset role;
select * from finish();
rollback;
