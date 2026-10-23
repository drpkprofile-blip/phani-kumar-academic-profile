-- Patent CRUD fixtures are rolled back; the user-supplied first record remains intact.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(30);

create temporary table patents_before on commit drop as select * from public.patents;
create temporary table patent_a(id integer) on commit drop;
create temporary table patent_users(user_id uuid) on commit drop;
grant select on patents_before to authenticated;
grant select, insert on patent_a to authenticated;
insert into patent_users values
  ('00000000-0000-0000-0000-000000000861'),
  ('00000000-0000-0000-0000-000000000862');
insert into auth.users(id) select user_id from patent_users;
insert into private.publications_admins(user_id)
select user_id from patent_users where user_id='00000000-0000-0000-0000-000000000861';

select is((select count(*)::integer from patents_before),1,'The supplied patent is seeded exactly once');
select is((select application_number from public.patents), '202141030245 A','Seed preserves the application number');
select is((select filing_date::text from public.patents), '2021-07-06','Seed preserves the filing date');
select is((select publication_date::text from public.patents), '2021-07-16','Seed preserves the publication date');
select is((select journal_number from public.patents), '29/2021','Seed preserves the journal number');
select is((select page_number from public.patents), '31374','Seed preserves the page number');

set local role anon;
select is((select count(*)::integer from public.patents),1,'Anonymous visitors can read patent records');
select throws_ok($$insert into public.patents(application_number,filing_date,publication_date,title,journal_number) values('ANON',date '2021-01-01',date '2021-01-02','Fixture','1/2021')$$,
  '42501',null,'Anonymous direct insert is denied');
select throws_ok($$select public.admin_save_patent(null,'{}'::jsonb,null)$$,'42501',null,'Anonymous patent save is denied');
select throws_ok($$select public.admin_delete_patent(1,null,true)$$,'42501',null,'Anonymous patent delete is denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000862","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select is(public.is_publications_admin(),false,'User metadata alone cannot grant patent admin access');
select is((select count(*)::integer from public.patents),1,'Authenticated non-admin users can read patents');
select throws_ok($$insert into public.patents(application_number,filing_date,publication_date,title,journal_number) values('NONADMIN',date '2021-01-01',date '2021-01-02','Fixture','1/2021')$$,
  '42501',null,'Non-admin direct insert is denied');
select throws_ok($$select public.admin_save_patent(null,'{}'::jsonb,null)$$,'42501',null,'Non-admin patent save is denied');
select throws_ok($$select public.admin_delete_patent(1,null,true)$$,'42501',null,'Non-admin patent delete is denied');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000861","role":"authenticated"}',true);
set local role authenticated;
select is(public.is_publications_admin(),true,'Allowlisted admin is recognized');
insert into patent_a select public.admin_save_patent(null,
  '{"application_number":"TEST-PATENT-1","filing_date":"2022-01-10","publication_date":"2022-02-10","title":"Temporary test patent","journal_number":"04/2022","page_number":"512","proof_url":" "}'::jsonb,null);
select ok((select count(*)=1 from patent_a),'Admin can add a patent');
select ok((select proof_url is null and application_number='TEST-PATENT-1' and journal_number='04/2022' and page_number='512'
  from public.patents where id=(select id from patent_a)),'New patent keeps exact metadata and normalizes an empty proof to NULL');
select throws_ok($$select public.admin_save_patent(null,'{"application_number":" ","filing_date":"2022-01-01","publication_date":"2022-02-01","title":"Title","journal_number":"1/2022"}'::jsonb,null)$$,
  '22023',null,'Blank application number is rejected');
select throws_ok($$select public.admin_save_patent(null,'{"application_number":"X","filing_date":"2022-01-01","publication_date":"2022-02-01","title":" ","journal_number":"1/2022"}'::jsonb,null)$$,
  '22023',null,'Blank invention title is rejected');
select throws_ok($$select public.admin_save_patent(null,'{"application_number":"X","filing_date":"2022-01-01","publication_date":"2022-02-01","title":"Title","journal_number":"1/2022","page_number":" "}'::jsonb,null)$$,
  '22023',null,'Blank page number is rejected');
select throws_ok($$select public.admin_save_patent(null,'{"application_number":"X","filing_date":"2022-02-30","publication_date":"2022-03-01","title":"Title","journal_number":"1/2022","page_number":"1"}'::jsonb,null)$$,
  '22008',null,'Impossible calendar dates are rejected');
select throws_ok($$select public.admin_save_patent(null,'{"application_number":"X","filing_date":"2022-02-01","publication_date":"2022-01-01","title":"Title","journal_number":"1/2022","page_number":"1"}'::jsonb,null)$$,
  '22023',null,'Publication before filing is rejected');
select throws_ok($$select public.admin_save_patent(null,'{"application_number":"X","filing_date":"2022-01-01","publication_date":"2022-02-01","title":"Title","journal_number":"1/2022","page_number":"1","proof_url":"javascript:bad"}'::jsonb,null)$$,
  '22023',null,'Non-HTTP proof URL is rejected');
select lives_ok(format(
  'select public.admin_save_patent(%s,%L::jsonb,(select updated_at from public.patents where id=%s))',
  (select id from patent_a),
  '{"application_number":"TEST-PATENT-1","filing_date":"2022-01-10","publication_date":"2022-02-10","title":"Edited temporary patent","journal_number":"04/2022","page_number":"512","proof_url":"https://drive.google.com/file/d/example/view?x=1"}',
  (select id from patent_a)), 'Admin can edit a patent');
select ok((select title='Edited temporary patent' and proof_url='https://drive.google.com/file/d/example/view?x=1'
  from public.patents where id=(select id from patent_a)),'Edit preserves the exact supplied proof URL');
select throws_ok(format('select public.admin_delete_patent(%s,(select updated_at from public.patents where id=%s),false)',
  (select id from patent_a),(select id from patent_a)),'22023',null,'Delete requires explicit confirmation');
select lives_ok(format('select public.admin_delete_patent(%s,(select updated_at from public.patents where id=%s),true)',
  (select id from patent_a),(select id from patent_a)),'Admin can delete a confirmed patent');
select is((select count(*)::integer from public.patents),1,'Temporary patent is removed and original remains');
select ok(not exists (
  select 1 from patents_before b full join public.patents p using (id)
  where b.id is null or p.id is null or to_jsonb(b) is distinct from to_jsonb(p)
),'Original supplied patent record remains unchanged');

reset role;
select * from finish();
rollback;
