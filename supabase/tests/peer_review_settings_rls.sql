-- Settings fixtures and mutations are rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(13);

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000911'),
  ('00000000-0000-0000-0000-000000000912');
insert into private.publications_admins(user_id)
values ('00000000-0000-0000-0000-000000000911');

set local role anon;
select is((select count(*)::integer from public.peer_review_settings),1,
  'Anonymous users can read exactly one settings row');
select is((select hero_counter_text from public.peer_review_settings where singleton),
  '16+','Anonymous readers see the independent 16+ hero counter');
select is((select completed_reviews_count from public.peer_review_settings where singleton),
  16,'Anonymous readers see the independent completed count of 16');
select throws_ok($$update public.peer_review_settings set hero_counter_text='17+'
  where singleton$$,'42501',null,'Anonymous settings update is denied');
select throws_ok($$insert into public.peer_review_settings(hero_counter_text,completed_reviews_count)
  values('17+',17)$$,'42501',null,'Anonymous settings insert is denied');
select throws_ok($$delete from public.peer_review_settings where singleton$$,
  '42501',null,'Anonymous settings delete is denied');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000912","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'Authenticated user metadata does not grant settings access');
select is((select count(*)::integer from public.peer_review_settings),1,
  'Authenticated users may read Peer Review settings');
with changed as (update public.peer_review_settings set hero_counter_text='17+'
  where singleton returning singleton)
select is((select count(*)::integer from changed),0,
  'Authenticated non-admin settings update is denied');
select is((select hero_counter_text from public.peer_review_settings where singleton),
  '16+','Non-admin cannot alter the hero counter');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000911","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
select lives_ok($$update public.peer_review_settings set hero_counter_text='17+',
  completed_reviews_count=17 where singleton$$,'Allowlisted admin can update both counters');
select ok((select hero_counter_text='17+' and completed_reviews_count=17
  from public.peer_review_settings where singleton),
  'Admin-updated counters remain independent settings');

select * from finish();
rollback;
