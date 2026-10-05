-- Profile rows and test users are exercised in a transaction and rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(22);

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000921'),
  ('00000000-0000-0000-0000-000000000922');
insert into private.publications_admins(user_id)
values ('00000000-0000-0000-0000-000000000921');

set local role anon;
select is((select count(*)::integer from public.profile_settings where singleton),1,
  'Anonymous readers can view the singleton public profile');
select is((select name from public.profile_settings where singleton),
  'Dr. Phani Kumar Simhadri','Anonymous readers see the committed profile name');
select throws_ok($$update public.profile_settings set name='Anonymous edit' where singleton$$,
  '42501',null,'Anonymous profile writes are denied');
select throws_ok($$insert into public.profile_settings(name,first_name,last_name,qualifications,designation,department,institution,profile_label,description,email,phone,photo_url,academic_identity,profile_links,youtube_channel,technical_tools,skills,research_interests,experience_counter_text)
  select name,first_name,last_name,qualifications,designation,department,institution,profile_label,description,email,phone,photo_url,academic_identity,profile_links,youtube_channel,technical_tools,skills,research_interests,experience_counter_text from public.profile_settings where singleton$$,
  '42501',null,'Anonymous profile insert is denied');
select throws_ok($$delete from public.profile_settings where singleton$$,
  '42501',null,'Anonymous profile delete is denied');
select throws_ok($$insert into storage.objects(bucket_id,name,metadata)
  values('profile-assets','profile/profile-photo','{"mimetype":"image/png"}'::jsonb)$$,
  '42501',null,'Anonymous storage insert is denied');
with changed as (update storage.objects set metadata='{"mimetype":"image/jpeg"}'::jsonb
  where bucket_id='profile-assets' and name='profile/profile-photo' returning id)
select is((select count(*)::integer from changed),0,'Anonymous storage update is denied');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000922","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'Untrusted user metadata cannot grant profile admin access');
select is((select count(*)::integer from public.profile_settings),1,
  'Authenticated public visitors can read profile settings');
with changed as (update public.profile_settings set name='Non-admin edit' where singleton returning singleton)
select is((select count(*)::integer from changed),0,'Authenticated non-admin profile update is denied');
select is((select name from public.profile_settings where singleton),
  'Dr. Phani Kumar Simhadri','A non-admin cannot change public profile content');
select throws_ok($$delete from public.profile_settings where singleton$$,
  '42501',null,'Authenticated users cannot delete the singleton profile');
select throws_ok($$insert into storage.objects(bucket_id,name,metadata)
  values('profile-assets','profile/profile-photo','{"mimetype":"image/png"}'::jsonb)$$,
  '42501',null,'Authenticated non-admin storage insert is denied');
with changed as (update storage.objects set metadata='{"mimetype":"image/jpeg"}'::jsonb
  where bucket_id='profile-assets' and name='profile/profile-photo' returning id)
select is((select count(*)::integer from changed),0,'Authenticated non-admin storage update is denied');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000921","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
select lives_ok($$update public.profile_settings set experience_counter_text='21+' where singleton$$,
  'Allowlisted admin can update profile fields');
select is((select experience_counter_text from public.profile_settings where singleton),
  '21+','Admin-managed experience counter remains independent profile content');
select throws_ok($$update public.profile_settings set name='  ' where singleton$$,
  '23514',null,'Blank required public name is rejected');

select ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
  and policyname='Public profile photo objects are readable' and cmd='SELECT'),
  'The dedicated profile photo object has a public read policy');
select ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
  and policyname='Allowlisted admins upload profile photo' and cmd='INSERT' and with_check like '%is_publications_admin%'),
  'Only allowlisted admins can insert the dedicated profile photo');
select ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
  and policyname='Allowlisted admins replace profile photo' and cmd='UPDATE' and qual like '%is_publications_admin%' and with_check like '%is_publications_admin%'),
  'Only allowlisted admins can replace the dedicated profile photo');
select ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects'
  and policyname='Allowlisted admins remove profile photo' and cmd='DELETE' and qual like '%is_publications_admin%'),
  'Only allowlisted admins can delete the dedicated profile photo');

select * from finish();
rollback;
