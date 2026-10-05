-- All management fixtures roll back, including changes to the genuine supplied row.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(19);
create temporary table memberships_before on commit drop as select * from public.professional_memberships;
create temporary table created_memberships(id integer) on commit drop;
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000951');
insert into private.publications_admins(user_id) values ('00000000-0000-0000-0000-000000000951');
select is((select count(*)::integer from memberships_before),1,'The genuine supplied membership is present before tests');

set local role anon;
select throws_ok($$select public.admin_save_professional_membership(null,'{"organization_name":"Anonymous"}'::jsonb,null)$$,
  '42501',null,'Anonymous membership save is denied');
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000951","role":"authenticated"}',true);
set local role authenticated;
insert into created_memberships select public.admin_save_professional_membership(null,
  '{"organization_name":"TEMP TEST - Professional Membership - A","membership_type":"","membership_number":"","date_text":"","validity_text":"","designation":"","chapter":"","proof_url":""}'::jsonb,null);
select is((select count(*)::integer from created_memberships),1,'Admin can create a professional membership');
select ok((select display_order=2 and source_order is null and membership_type is null and membership_number is null
  and date_text is null and validity_text is null and designation is null and chapter is null and proof_url is null
  from public.professional_memberships where id=(select id from created_memberships)),
  'New record appends, keeps source order NULL, and stores blank optional fields as NULL');
select throws_ok($$select public.admin_save_professional_membership(null,'{"organization_name":"  "}'::jsonb,null)$$,
  '22023',null,'Blank organization name is rejected');
select throws_ok($$select public.admin_save_professional_membership(null,'{"organization_name":"Valid","proof_url":"ftp://example.test/proof"}'::jsonb,null)$$,
  '22023',null,'Invalid proof URL is rejected');
select throws_ok($$select public.admin_save_professional_membership(null,'{"organization_name":"Valid","proof_url":"https://user:pass@example.test/proof"}'::jsonb,null)$$,
  '22023',null,'Credential-bearing proof URL is rejected');
select lives_ok(format('select public.admin_save_professional_membership(%s,%L::jsonb,(select updated_at from public.professional_memberships where id=%s))',
  (select id from created_memberships),
  '{"organization_name":"TEMP TEST - Professional Membership - A edited","membership_type":"Member","membership_number":"","date_text":"","validity_text":"","designation":"","chapter":"","proof_url":"https://example.test/proof?keep=1&source=acceptance"}',
  (select id from created_memberships)),'Admin can edit membership metadata');
select is((select display_order from public.professional_memberships where id=(select id from created_memberships)),2,
  'Editing metadata preserves display position');
select is((select proof_url from public.professional_memberships where id=(select id from created_memberships)),
  'https://example.test/proof?keep=1&source=acceptance','Proof URL query text is preserved exactly');
insert into created_memberships select public.admin_save_professional_membership(null,
  '{"organization_name":"TEMP TEST - Professional Membership - B"}'::jsonb,null);
select is((select display_order from public.professional_memberships where id=(select max(id) from created_memberships)),3,
  'Second new record appends at the final position');
select lives_ok(format('select public.admin_move_professional_membership(%s,2,%L::integer[])',
  (select max(id) from created_memberships),
  (select array_agg(id order by display_order)::text from public.professional_memberships)),
  'Admin can reorder memberships transactionally');
select is((select display_order from public.professional_memberships where id=(select max(id) from created_memberships)),2,
  'Reorder assigns the requested position');
select throws_ok(format('select public.admin_delete_professional_membership(%s,(select updated_at from public.professional_memberships where id=%s),false)',
  (select max(id) from created_memberships),(select max(id) from created_memberships)),
  '22023',null,'Membership delete requires explicit confirmation');
select lives_ok(format('select public.admin_delete_professional_membership(%s,(select updated_at from public.professional_memberships where id=%s),true)',
  (select max(id) from created_memberships),(select max(id) from created_memberships)),
  'Admin can delete a confirmed membership');
select is((select display_order from public.professional_memberships where id=(select id from created_memberships limit 1)),2,
  'Delete compacts remaining display order');
select lives_ok(format('select public.admin_delete_professional_membership(%s,(select updated_at from public.professional_memberships where id=%s),true)',
  (select id from created_memberships limit 1),(select id from created_memberships limit 1)),
  'Admin can remove the remaining temporary membership');
select is((select count(*)::integer from public.professional_memberships),1,'Only the genuine row remains after test cleanup');
select ok(not exists(select 1 from memberships_before b full join public.professional_memberships m using(id)
  where b.id is null or m.id is null or to_jsonb(b) is distinct from to_jsonb(m)),
  'The genuine membership row and timestamps are unchanged');
reset role;
select * from finish();
rollback;
