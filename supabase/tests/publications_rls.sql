-- Run with `supabase test db` against a disposable local/test Supabase database.
-- Synthetic fixtures are test-only and every write is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(20);

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');
insert into private.publications_admins (user_id)
values ('00000000-0000-0000-0000-000000000001');
insert into public.publications (id, title, year, journal, display_order)
values (-1, 'RLS test fixture — not a real publication', '2026', 'Test only', 1000000);
insert into public.publication_settings (hero_publications) values ('40+');

set local role anon;
select is((select count(*)::integer from public.publications where id = -1), 1, 'Visitors can read publications');
select is((select hero_publications from public.publication_settings), '40+', 'Visitors can read independent settings');
select throws_ok($$insert into public.publications (title, year, journal, display_order) values ('Test', '2026', 'Test', 1000001)$$, '42501', null, 'Visitors cannot insert');
select throws_ok($$update public.publications set display_order = 1000001 where id = -1$$, '42501', null, 'Visitors cannot reorder');
select throws_ok($$delete from public.publications where id = -1$$, '42501', null, 'Visitors cannot delete');
select throws_ok($$update public.publication_settings set hero_publications = '999+'$$, '42501', null, 'Visitors cannot change settings');
select throws_ok($$select * from private.publications_admins$$, '42501', null, 'Visitors cannot read membership');

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated","user_metadata":{"admin":true}}', true);
set local role authenticated;
select is(public.is_publications_admin(), false, 'User metadata cannot confer admin status');
select is((select count(*)::integer from public.publications where id = -1), 1, 'Non-admin can read');
select throws_ok($$insert into public.publications (title, year, journal, display_order) values ('Test', '2026', 'Test', 1000001)$$, '42501', null, 'Non-admin insert rejected');
with changed as (update public.publications set display_order = 1000001 where id = -1 returning id)
select is((select count(*)::integer from changed), 0, 'Non-admin update/reorder affects no rows');
with removed as (delete from public.publications where id = -1 returning id)
select is((select count(*)::integer from removed), 0, 'Non-admin delete affects no rows');
with changed as (update public.publication_settings set hero_publications = '999+' returning id)
select is((select count(*)::integer from changed), 0, 'Non-admin settings update affects no rows');
select throws_ok($$insert into private.publications_admins (user_id) values ('00000000-0000-0000-0000-000000000002')$$, '42501', null, 'Non-admin cannot promote themselves');

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is(public.is_publications_admin(), true, 'Allowlisted admin recognized');
select lives_ok($$insert into public.publications (id, title, year, journal, display_order) values (-2, 'Second test fixture', '2026', 'Test only', 1000001)$$, 'Admin can insert with missing optional fields');
select lives_ok($$set constraints publications_display_order_unique deferred; update public.publications set display_order = case id when -1 then 1000001 else 1000000 end where id in (-1, -2); set constraints publications_display_order_unique immediate;$$, 'Admin can swap order transactionally');
select lives_ok($$update public.publication_settings set hero_publications = '41+'$$, 'Admin can change independent counter');
select lives_ok($$delete from public.publications where id = -2$$, 'Admin can delete');

reset role;
delete from private.publications_admins where user_id = '00000000-0000-0000-0000-000000000001';
set local role authenticated;
select is(public.is_publications_admin(), false, 'Revoked membership loses admin access');

select * from finish();
rollback;
