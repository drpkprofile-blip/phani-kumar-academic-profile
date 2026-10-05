begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(14);

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000931'),
  ('00000000-0000-0000-0000-000000000932');
insert into private.publications_admins(user_id)
values ('00000000-0000-0000-0000-000000000931');

select is((select citations_image_url from public.profile_settings where singleton),
  '/google-scholar-citations.jpg', 'The existing citation screenshot remains the initial public image');

set local role anon;
select is((select citations_image_url from public.profile_settings where singleton),
  '/google-scholar-citations.jpg', 'Anonymous visitors can read which citation image is current');
select throws_ok($$insert into storage.objects(bucket_id,name,metadata)
  values('profile-assets','profile/google-scholar-citations','{"mimetype":"image/jpeg"}'::jsonb)$$,
  '42501',null,'Anonymous users cannot upload a citation image');
with changed as (update storage.objects set metadata='{"mimetype":"image/png"}'::jsonb
  where bucket_id='profile-assets' and name='profile/google-scholar-citations' returning id)
select is((select count(*)::integer from changed),0,'Anonymous users cannot replace a citation image');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000932","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'Untrusted user metadata cannot grant citation image admin access');
select is((select citations_image_url from public.profile_settings where singleton),
  '/google-scholar-citations.jpg', 'Authenticated visitors can read which citation image is current');
with changed as (update public.profile_settings set citations_image_url='https://example.invalid/fake.jpg' where singleton returning singleton)
select is((select count(*)::integer from changed),0,'Authenticated non-admin cannot change the public citation image');
with changed as (update storage.objects set metadata='{"mimetype":"image/png"}'::jsonb
  where bucket_id='profile-assets' and name='profile/google-scholar-citations' returning id)
select is((select count(*)::integer from changed),0,'Authenticated non-admin cannot replace a citation image');
select throws_ok($$insert into storage.objects(bucket_id,name,metadata)
  values('profile-assets','profile/google-scholar-citations','{"mimetype":"image/jpeg"}'::jsonb)$$,
  '42501',null,'Authenticated non-admin cannot upload a citation image');

select ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
  and policyname='Public Google Scholar citation image is readable' and cmd='SELECT'),
  'Citation image has a public read policy');
select ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
  and policyname='Allowlisted admins upload Google Scholar citation image' and cmd='INSERT' and with_check like '%is_publications_admin%'),
  'Only allowlisted admins can upload the citation image');
select ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
  and policyname='Allowlisted admins replace Google Scholar citation image' and cmd='UPDATE' and qual like '%is_publications_admin%' and with_check like '%is_publications_admin%'),
  'Only allowlisted admins can replace the citation image');
select ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
  and policyname='Allowlisted admins remove Google Scholar citation image' and cmd='DELETE' and qual like '%is_publications_admin%'),
  'Only allowlisted admins can remove the citation image');
select ok(exists(select 1 from information_schema.columns where table_schema='public'
  and table_name='profile_settings' and column_name='citations_image_url' and is_nullable='NO'),
  'Profile settings stores a required citation image URL');

select * from finish();
rollback;
