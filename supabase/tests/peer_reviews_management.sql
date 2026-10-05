-- Synthetic review edits and counter settings roll back with the test transaction.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(35);

create temporary table peer_reviews_before on commit drop as select * from public.peer_reviews;
grant select on table peer_reviews_before to authenticated;
create temporary table peer_review_ids(id integer) on commit drop;
grant select, insert on table peer_review_ids to authenticated;
create temporary table peer_reviews_after_crud on commit drop as select * from public.peer_reviews;
grant select on table peer_reviews_after_crud to authenticated;

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000931'),
  ('00000000-0000-0000-0000-000000000932');
insert into private.publications_admins(user_id) values ('00000000-0000-0000-0000-000000000931');

select is((select count(*)::integer from peer_reviews_before),11,'The original eleven review rows exist before management tests');
select is((select hero_counter_text from public.peer_review_settings where singleton),'16+','The original hero counter is 16+');
select is((select completed_reviews_count from public.peer_review_settings where singleton),16,'The completed count is independently 16');

set local role anon;
select throws_ok($$select public.admin_save_peer_review(null,'Anonymous review',null)$$,
  '42501',null,'Anonymous RPC create is denied');
select throws_ok($$select public.admin_update_peer_review_settings('17+',17,now())$$,
  '42501',null,'Anonymous counter update is denied');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000932","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'Authentication and metadata do not grant admin access');
select throws_ok($$insert into public.peer_reviews(review_text,display_order) values('Non-admin row',990001)$$,
  '42501',null,'Authenticated non-admin direct write is denied');
select throws_ok($$select public.admin_save_peer_review(null,'Non-admin review',null)$$,
  '42501',null,'Authenticated non-admin RPC create is denied');
select throws_ok($$select public.admin_update_peer_review_settings('17+',17,now())$$,
  '42501',null,'Authenticated non-admin counter update is denied');
select is((select hero_counter_text from public.peer_review_settings where singleton),'16+',
  'Non-admin attempts leave settings unchanged');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000931","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
insert into peer_review_ids select public.admin_save_peer_review(null,E'  TEMP TEST - Peer Review A\n exact text  ',null);
select is((select count(*)::integer from peer_review_ids),1,'Admin can create a review');
select ok((select review_text=E'  TEMP TEST - Peer Review A\n exact text  ' and source_order is null and display_order=12
  from public.peer_reviews where id=(select id from peer_review_ids limit 1)),
  'New review text is exact, source order is NULL, and display order appends');
select throws_ok($$select public.admin_save_peer_review(null,'   ',null)$$,
  '22023',null,'Blank review text is rejected');
insert into peer_review_ids select public.admin_save_peer_review(null,'TEMP TEST - Peer Review B',null);
select is((select display_order from public.peer_reviews where id=(select max(id) from peer_review_ids)),13,
  'A second review appends after the first');
select lives_ok(format('select public.admin_move_peer_review(%s,12,(select array_agg(id order by display_order)::text from public.peer_reviews)::integer[])',
  (select max(id) from peer_review_ids)),'Admin reorder succeeds transactionally');
select ok((select display_order=12 from public.peer_reviews where id=(select max(id) from peer_review_ids))
  and (select display_order=13 from public.peer_reviews where id=(select min(id) from peer_review_ids)),
  'Reorder gives each review its requested consecutive position');
select lives_ok(format('select public.admin_save_peer_review(%s,%L,(select updated_at from public.peer_reviews where id=%s))',
  (select max(id) from peer_review_ids),'  Edited Peer Review B, all text remains supplied  ',(select max(id) from peer_review_ids)),
  'Admin can edit a review');
select ok((select display_order=12 and review_text='  Edited Peer Review B, all text remains supplied  '
  from public.peer_reviews where id=(select max(id) from peer_review_ids)),
  'Editing exact review text preserves its current position');
select is((select hero_counter_text from public.peer_review_settings where singleton),'16+',
  'Review create/edit/reorder does not change the hero counter');
select is((select completed_reviews_count from public.peer_review_settings where singleton),16,
  'Review create/edit/reorder does not change completed count');
select ok(not exists(select 1 from peer_reviews_before b left join public.peer_reviews r using(id)
  where r.id is null or to_jsonb(b) is distinct from to_jsonb(r)),
  'Every original review and timestamp remains unchanged during CRUD');

select throws_ok(format('select public.admin_update_peer_review_settings(%L,-1,(select updated_at from public.peer_review_settings where singleton))','17+'),
  '22023',null,'Negative completed count is rejected');
select lives_ok(format('select public.admin_update_peer_review_settings(%L,17,(select updated_at from public.peer_review_settings where singleton))','17+'),
  'Admin can update independent Peer Review counters');
select ok((select hero_counter_text='17+' and completed_reviews_count=17 from public.peer_review_settings where singleton),
  'Updated counter text and count are stored exactly');
select ok(not exists(select 1 from peer_reviews_after_crud b left join public.peer_reviews r using(id)
  where r.id is null or to_jsonb(b) is distinct from to_jsonb(r)),
  'Counter editing does not modify any review row');
select is((select count(*)::integer from public.peer_reviews),13,'Counter editing leaves the review row count unchanged');

select throws_ok(format('select public.admin_delete_peer_review(%s,(select updated_at from public.peer_reviews where id=%s),false)',
  (select max(id) from peer_review_ids),(select max(id) from peer_review_ids)),
  '22023',null,'Delete requires explicit confirmation');
select lives_ok(format('select public.admin_delete_peer_review(%s,(select updated_at from public.peer_reviews where id=%s),true)',
  (select max(id) from peer_review_ids),(select max(id) from peer_review_ids)),
  'Admin can delete a confirmed review');
select is((select display_order from public.peer_reviews where id=(select min(id) from peer_review_ids)),12,
  'Delete compacts the remaining display order safely');
select lives_ok(format('select public.admin_delete_peer_review(%s,(select updated_at from public.peer_reviews where id=%s),true)',
  (select min(id) from peer_review_ids),(select min(id) from peer_review_ids)),
  'Admin can delete the second confirmed review');
reset role;
select is((select count(*)::integer from public.peer_reviews),11,'Only the original eleven reviews remain after cleanup');
select ok(not exists(select 1 from peer_reviews_before b full join public.peer_reviews r using(id)
  where b.id is null or r.id is null or to_jsonb(b) is distinct from to_jsonb(r)),
  'Original review IDs, text, order, and timestamps are restored exactly');
select ok((select hero_counter_text='17+' and completed_reviews_count=17 from public.peer_review_settings where singleton),
  'Counter settings remain independently updated after review cleanup');
select ok((select count(*)=11 and count(distinct display_order)=11 and min(display_order)=1 and max(display_order)=11
  from public.peer_reviews),'Review display positions are unique and consecutive');

select * from finish();
rollback;

