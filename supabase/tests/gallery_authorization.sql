-- Gallery fixtures exist only inside this transaction and are rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(28);

create temporary table gallery_before on commit drop as select * from public.gallery_items;
create temporary table gallery_fixture_ids(id bigint, storage_path text) on commit drop;
grant select on gallery_before to anon, authenticated;
grant select, insert on gallery_fixture_ids to authenticated;

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000994'),
  ('00000000-0000-0000-0000-000000000995');
insert into private.publications_admins(user_id) values ('00000000-0000-0000-0000-000000000994');

select is((select count(*)::integer from gallery_before),0,'Gallery starts with no seeded records');
set local role anon;
select is((select count(*)::integer from public.gallery_items),0,'Anonymous visitors can read the empty gallery');
select throws_ok($$insert into public.gallery_items(description,storage_path,display_order) values('Anonymous','gallery/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg',1)$$,
  '42501',null,'Anonymous gallery table writes are denied');
select throws_ok($$select public.admin_save_gallery_item('Anonymous','gallery/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg',null,null)$$,
  '42501',null,'Anonymous gallery RPC writes are denied');
select throws_ok($$insert into storage.objects(bucket_id,name,metadata) values('profile-assets','gallery/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg','{"mimetype":"image/jpeg"}'::jsonb)$$,
  '42501',null,'Anonymous gallery image uploads are denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000995","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'Authentication or user metadata does not grant admin access');
select is((select count(*)::integer from public.gallery_items),0,'Authenticated visitors can read the gallery');
select throws_ok($$insert into public.gallery_items(description,storage_path,display_order) values('Non-admin','gallery/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.jpg',1)$$,
  '42501',null,'Authenticated non-admin table writes are denied');
select throws_ok($$select public.admin_save_gallery_item('Non-admin','gallery/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.jpg',null,null)$$,
  '42501',null,'Authenticated non-admin RPC writes are denied');
select throws_ok($$insert into storage.objects(bucket_id,name,metadata) values('profile-assets','gallery/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.jpg','{"mimetype":"image/jpeg"}'::jsonb)$$,
  '42501',null,'Authenticated non-admin image uploads are denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000994","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
select lives_ok($$insert into storage.objects(bucket_id,name,metadata) values('profile-assets','gallery/11111111-1111-4111-8111-111111111111.jpg','{"mimetype":"image/jpeg"}'::jsonb)$$,
  'Allowlisted admin can upload a gallery image');
insert into gallery_fixture_ids select public.admin_save_gallery_item('Academic event photo','gallery/11111111-1111-4111-8111-111111111111.jpg',null,null);
select ok((select display_order=1 and source_order is null and description='Academic event photo' and storage_path='gallery/11111111-1111-4111-8111-111111111111.jpg'
  from public.gallery_items where id=(select min(id) from gallery_fixture_ids)),'New gallery item appends with exact caption and NULL source order');
select throws_ok($$select public.admin_save_gallery_item('  ','gallery/11111111-1111-4111-8111-111111111111.jpg',null,null)$$,
  '22023',null,'Blank caption is rejected');
select throws_ok($$select public.admin_save_gallery_item('Bad path','profile/profile-photo',null,null)$$,
  '22023',null,'Non-gallery storage paths are rejected');
select throws_ok($$select public.admin_save_gallery_item('Missing image','gallery/22222222-2222-4222-8222-222222222222.jpg',null,null)$$,
  '22023',null,'Gallery item requires an uploaded storage object');
select lives_ok($$insert into storage.objects(bucket_id,name,metadata) values('profile-assets','gallery/33333333-3333-4333-8333-333333333333.webp','{"mimetype":"image/webp"}'::jsonb)$$,
  'Allowlisted admin can upload a second gallery image');
insert into gallery_fixture_ids select public.admin_save_gallery_item('Laboratory visit','gallery/33333333-3333-4333-8333-333333333333.webp',null,null);
select is((select display_order from public.gallery_items where id=(select max(id) from gallery_fixture_ids)),2,'Second item appends in position two');
select lives_ok(format('select public.admin_move_gallery_item(%s,1,(select array_agg(id order by display_order) from public.gallery_items))',
  (select max(id) from gallery_fixture_ids)),'Admin can reorder gallery items transactionally');
select ok((select display_order=1 from public.gallery_items where id=(select max(id) from gallery_fixture_ids))
  and (select array_agg(display_order order by display_order)=array[1,2] from public.gallery_items),'Reorder keeps positions unique and consecutive');
select lives_ok(format('select public.admin_save_gallery_item(%L,%L,%s,(select updated_at from public.gallery_items where id=%s))',
  'Edited laboratory visit','gallery/33333333-3333-4333-8333-333333333333.webp',(select max(id) from gallery_fixture_ids),(select max(id) from gallery_fixture_ids)),
  'Admin can edit gallery caption');
select is((select display_order from public.gallery_items where id=(select max(id) from gallery_fixture_ids)),1,'Caption edits preserve display position');
select throws_ok(format('select public.admin_delete_gallery_item(%s,(select updated_at from public.gallery_items where id=%s),false)',
  (select max(id) from gallery_fixture_ids),(select max(id) from gallery_fixture_ids)),'22023',null,'Delete requires confirmation');
select is((select public.admin_delete_gallery_item((select max(id) from gallery_fixture_ids),(select updated_at from public.gallery_items where id=(select max(id) from gallery_fixture_ids)),true)),
  'gallery/33333333-3333-4333-8333-333333333333.webp','Confirmed delete returns the storage path for cleanup');
select is((select display_order from public.gallery_items where id=(select min(id) from gallery_fixture_ids)),1,'Delete resequences remaining gallery positions');
select is((select public.admin_delete_gallery_item((select min(id) from gallery_fixture_ids),(select updated_at from public.gallery_items where id=(select min(id) from gallery_fixture_ids)),true)),
  'gallery/11111111-1111-4111-8111-111111111111.jpg','Admin can delete the final gallery item');
select is((select count(*)::integer from public.gallery_items),0,'Temporary gallery items are cleaned up before rollback');
select ok(not exists(select 1 from gallery_before before_row full join public.gallery_items current_row using(id)
  where before_row.id is null or current_row.id is null or to_jsonb(before_row) is distinct from to_jsonb(current_row)),
  'Original gallery rows, if any, remain unchanged');

reset role;
select * from finish();
rollback;
