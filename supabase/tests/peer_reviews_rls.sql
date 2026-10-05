-- Synthetic rows and users only; every fixture write rolls back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(20);

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000901'),
  ('00000000-0000-0000-0000-000000000902');
insert into private.publications_admins(user_id)
values ('00000000-0000-0000-0000-000000000901');

set local role anon;
select is((select count(*)::integer from public.peer_reviews where id > 0),11,
  'Anonymous users can read all 11 peer reviews');
select throws_ok($$insert into public.peer_reviews(review_text,display_order)
  values('Anonymous fixture',990003)$$,
  '42501',null,'Anonymous insert is denied');
select throws_ok($$update public.peer_reviews set display_order=990003 where id=1$$,
  '42501',null,'Anonymous update and reorder are denied');
select throws_ok($$delete from public.peer_reviews where id=1$$,
  '42501',null,'Anonymous delete is denied');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000902","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'User metadata cannot grant peer-review admin status');
select is((select count(*)::integer from public.peer_reviews where id > 0),11,
  'Authenticated visitors can read all 11 peer reviews');
select throws_ok($$insert into public.peer_reviews(review_text,display_order)
  values('Non-admin fixture',990003)$$,
  '42501',null,'Authenticated non-admin insert is denied');
with changed as (update public.peer_reviews set review_text='Non-admin edit'
  where id=1 returning id)
select is((select count(*)::integer from changed),0,
  'Authenticated non-admin update and reorder are denied');
with removed as (delete from public.peer_reviews where id=1 returning id)
select is((select count(*)::integer from removed),0,
  'Authenticated non-admin delete is denied');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000901","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
select lives_ok($$insert into public.peer_reviews(id,review_text,source_order,display_order)
  values(-901,'Synthetic peer review A',null,990001),(-902,'Synthetic peer review B',null,990002)$$,
  'Admin can insert peer reviews with nullable source order');
select ok((select source_order is null from public.peer_reviews where id=-901),
  'A future record can have NULL source order');
select lives_ok($$set constraints peer_reviews_display_order_unique deferred;
  update public.peer_reviews set display_order=case id when -901 then 990002 else 990001 end
  where id in(-901,-902);
  set constraints peer_reviews_display_order_unique immediate$$,
  'Admin can reorder positions transactionally');
select ok((select display_order=990002 from public.peer_reviews where id=-901)
  and (select display_order=990001 from public.peer_reviews where id=-902),
  'Transactional reorder leaves positive unique positions');
select lives_ok($$update public.peer_reviews set review_text='Synthetic peer review A edited'
  where id=-901$$,'Admin can update a peer review');
select throws_ok($$insert into public.peer_reviews(review_text,display_order)
  values('  ',990003)$$,'23514',null,'Blank review text is rejected');
select throws_ok($$insert into public.peer_reviews(review_text,display_order)
  values('Zero position',0)$$,'23514',null,'Non-positive display order is rejected');
select throws_ok($$insert into public.peer_reviews(review_text,display_order)
  values('Duplicate position',1)$$,'23505',null,'Duplicate display order is rejected');
select lives_ok($$delete from public.peer_reviews where id in(-901,-902)$$,
  'Admin can delete peer reviews');
reset role;
select ok((select condeferrable from pg_constraint
  where conname='peer_reviews_display_order_unique'
    and conrelid='public.peer_reviews'::regclass),
  'Display order uniqueness is deferrable');

select * from finish();
rollback;
