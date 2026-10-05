begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(11);

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000941'),
  ('00000000-0000-0000-0000-000000000942');
insert into private.publications_admins(user_id)
values ('00000000-0000-0000-0000-000000000941');

select is((select google_scholar_citations_text from public.profile_settings where singleton),
  '179 (142)', 'Supplied Google Scholar citation display is initialized exactly');
select is((select google_scholar_h_index_text from public.profile_settings where singleton),
  '8 (8)', 'Supplied Google Scholar h-index display is initialized exactly');
select is((select google_scholar_i10_index_text from public.profile_settings where singleton),
  '5 (4)', 'Supplied Google Scholar i10-index display is initialized exactly');
select is((select link.value ->> 'href' from public.profile_settings as settings,
  lateral jsonb_array_elements(settings.profile_links) as link(value)
  where settings.singleton and link.value ->> 'label' = 'IRINS'),
  'https://vidwan.inflibnet.ac.in/profile/262584', 'IRINS points to the supplied Vidwan profile');

set local role anon;
select is((select google_scholar_citations_text from public.profile_settings where singleton),
  '179 (142)', 'Anonymous visitors can read the Scholar metrics');
select throws_ok($$update public.profile_settings set google_scholar_citations_text='1' where singleton$$,
  '42501', null, 'Anonymous users cannot update Scholar metrics');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000942","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'Untrusted user metadata cannot grant Scholar settings admin access');
with changed as (update public.profile_settings set google_scholar_citations_text='1' where singleton returning singleton)
select is((select count(*)::integer from changed),0,'Authenticated non-admin cannot edit Scholar metrics');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000941","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized for Scholar settings');
select lives_ok($$update public.profile_settings set google_scholar_citations_text='180 (143)',
  google_scholar_h_index_text='9 (8)', google_scholar_i10_index_text='6 (4)' where singleton$$,
  'Allowlisted admin can update all three independent Scholar metrics');
select is((select google_scholar_citations_text || '|' || google_scholar_h_index_text || '|' || google_scholar_i10_index_text
  from public.profile_settings where singleton), '180 (143)|9 (8)|6 (4)',
  'Admin-edited metric display text is preserved exactly');

select * from finish();
rollback;
