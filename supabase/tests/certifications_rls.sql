-- Synthetic rows and users only; every fixture write rolls back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(18);

insert into auth.users(id) values
  ('00000000-0000-0000-0000-000000000401'),
  ('00000000-0000-0000-0000-000000000402');
insert into private.publications_admins(user_id)
values ('00000000-0000-0000-0000-000000000401');
insert into public.certifications(id,title,certificate_url,fdp_url,source_order,display_order)
values
  (-401,'Certification RLS fixture A',null,null,null,900001),
  (-402,'Certification RLS fixture B',null,null,null,900002);

set local role anon;
select is((select count(*)::integer from public.certifications where id < 0),2,
  'Anonymous users can read certifications');
select throws_ok($$insert into public.certifications(title,display_order) values('Anonymous fixture',900003)$$,
  '42501',null,'Anonymous insert is denied');
select throws_ok($$update public.certifications set display_order=900003 where id=-401$$,
  '42501',null,'Anonymous reorder is denied');
select throws_ok($$delete from public.certifications where id=-401$$,
  '42501',null,'Anonymous delete is denied');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000402","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'User metadata cannot grant admin status');
select is((select count(*)::integer from public.certifications where id < 0),2,
  'Authenticated visitors can read certifications');
select throws_ok($$insert into public.certifications(title,display_order) values('Non-admin fixture',900003)$$,
  '42501',null,'Authenticated non-admin insert is denied');
with changed as (
  update public.certifications set display_order=900003 where id=-401 returning id
)
select is((select count(*)::integer from changed),0,'Authenticated non-admin reorder is denied');
with removed as (delete from public.certifications where id=-401 returning id)
select is((select count(*)::integer from removed),0,'Authenticated non-admin delete is denied');

reset role;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000401","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
select lives_ok($$insert into public.certifications(id,title,certificate_url,fdp_url,display_order)
  values(-403,'Admin certification fixture',null,null,900003)$$,
  'Admin can insert with both optional URLs NULL');
select ok((select certificate_url is null and fdp_url is null and source_order is null
  from public.certifications where id=-403),'Optional URLs and source_order stay NULL');
select lives_ok($$update public.certifications set title='Admin certification edited'
  where id=-403$$,'Admin can update certification');
select throws_ok($$insert into public.certifications(id,title,display_order)
  values(-404,'Duplicate position',900001)$$,
  '23505',null,'Duplicate display order is rejected');
select lives_ok($$set constraints certifications_display_order_unique deferred;
  update public.certifications set display_order=case id when -401 then 900002 else 900001 end
  where id in(-401,-402);
  set constraints certifications_display_order_unique immediate$$,
  'Admin can reorder by swapping positions transactionally');
select ok((select display_order=900002 from public.certifications where id=-401)
  and (select display_order=900001 from public.certifications where id=-402),
  'Transactional reorder leaves unique positions');
select lives_ok($$delete from public.certifications where id=-403$$,
  'Admin can delete certification');
reset role;
select ok((select condeferrable from pg_constraint
  where conname='certifications_display_order_unique'
    and conrelid='public.certifications'::regclass),
  'Display order constraint is deferrable');

select * from finish();
rollback;
