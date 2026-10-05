-- Synthetic memberships and users only; every fixture write rolls back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(15);

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000901'),
  ('00000000-0000-0000-0000-000000000902');
insert into private.publications_admins(user_id) values ('00000000-0000-0000-0000-000000000901');
insert into public.professional_memberships(id,organization_name,display_order)
values (-901,'RLS fixture A',990001),(-902,'RLS fixture B',990002);

set local role anon;
select is((select count(*)::integer from public.professional_memberships where id<0),2,
  'Anonymous visitors can read memberships');
select throws_ok($$insert into public.professional_memberships(organization_name,display_order) values('Anonymous',990003)$$,
  '42501',null,'Anonymous membership insert is denied');
select throws_ok($$update public.professional_memberships set display_order=990003 where id=-901$$,
  '42501',null,'Anonymous membership update and reorder are denied');
select throws_ok($$delete from public.professional_memberships where id=-901$$,
  '42501',null,'Anonymous membership delete is denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000902","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'Authentication and user metadata do not grant admin status');
select is((select count(*)::integer from public.professional_memberships where id<0),2,
  'Authenticated visitors can read memberships');
select throws_ok($$insert into public.professional_memberships(organization_name,display_order) values('Non-admin',990003)$$,
  '42501',null,'Authenticated non-admin membership insert is denied');
with changed as (update public.professional_memberships set organization_name='Non-admin edit' where id=-901 returning id)
select is((select count(*)::integer from changed),0,'Authenticated non-admin membership update is denied');
with removed as (delete from public.professional_memberships where id=-901 returning id)
select is((select count(*)::integer from removed),0,'Authenticated non-admin membership delete is denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000901","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Existing allowlisted admin is recognized');
select lives_ok($$insert into public.professional_memberships(id,organization_name,display_order) values(-903,'Admin fixture',990003)$$,
  'Admin can insert a membership');
select ok((select membership_type is null and membership_number is null and date_text is null and validity_text is null
  and designation is null and chapter is null and proof_url is null and source_order is null
  from public.professional_memberships where id=-903),'All optional metadata and future source order may be NULL');
select lives_ok($$update public.professional_memberships set organization_name='Admin fixture edited' where id=-903$$,
  'Admin can update a membership');
select lives_ok($$delete from public.professional_memberships where id=-903$$,'Admin can delete a membership');
reset role;
select ok((select condeferrable and convalidated from pg_constraint
  where conname='professional_memberships_display_order_unique'
    and conrelid='public.professional_memberships'::regclass),
  'Display order is uniquely enforced with a deferrable constraint');

select * from finish();
rollback;
