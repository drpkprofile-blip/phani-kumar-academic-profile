begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(31);

create temporary table phase2f_baseline as select * from public.publications;
create temporary table phase2f_fixtures(slot integer primary key, id integer);
grant select on phase2f_baseline to authenticated;
grant select,insert on phase2f_fixtures to authenticated;
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000101'),('00000000-0000-0000-0000-000000000102');
insert into private.publications_admins(user_id) values ('00000000-0000-0000-0000-000000000101');

set local role anon;
select throws_ok($$select public.admin_save_publication(null,'{}')$$,'42501',null,'Anonymous cannot add via RPC');
select throws_ok($$select public.admin_delete_publication(1,now(),true)$$,'42501',null,'Anonymous cannot delete via RPC');
select throws_ok($$select public.admin_move_publication(1,1,array[1])$$,'42501',null,'Anonymous cannot reorder via RPC');
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000102","role":"authenticated","user_metadata":{"admin":true}}',true);
set local role authenticated;
select throws_ok($$select public.admin_save_publication(null,'{}')$$,'42501',null,'Non-admin cannot add');
select throws_ok($$select public.admin_save_publication(1,'{}',now())$$,'42501',null,'Non-admin cannot edit');
select throws_ok($$select public.admin_delete_publication(1,now(),true)$$,'42501',null,'Non-admin cannot delete');
select throws_ok($$select public.admin_move_publication(1,1,array[1])$$,'42501',null,'Non-admin cannot reorder');
with changed as (update public.publication_settings set hero_publications='Unauthorized' returning id)
select is((select count(*)::integer from changed),0,'Non-admin cannot update independent counter');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000101","role":"authenticated"}',true);
set local role authenticated;
select lives_ok($$insert into phase2f_fixtures select 1,public.admin_save_publication(p_publication => '{"title":"PHASE2F TEMPORARY TEST A — not a real publication","year":"2026","journal":"Test only","indexing":[]}')$$,'Admin can add with missing optional fields');
select lives_ok($$insert into phase2f_fixtures select 2,public.admin_save_publication(null,'{"title":"PHASE2F TEMPORARY TEST B — not a real publication","year":"2026","journal":"Test only","indexing":[]}')$$,'Second add receives its own automatic position');
select ok((select doi is null and article_url is null and proof_url is null and publication_type is null and impact_factor is null and source_order is null and indexing='{}'::text[] from public.publications where id=(select id from phase2f_fixtures where slot=1)),'Missing optional values are NULL and badges empty');
select is((select display_order from public.publications where id=(select id from phase2f_fixtures where slot=1)),(select coalesce(max(display_order),0)+1 from phase2f_baseline),'New record appends after existing positions');
select is((select count(*)::integer from public.publications),(select count(*)::integer+2 from phase2f_baseline),'Publication count updates after add');
select lives_ok($$select public.admin_save_publication(id,'{"title":"PHASE2F TEMPORARY TEST A edited","year":"2025","journal":"Exact edited test details","indexing":["Second","First"],"doi":"10.test/fixture","article_url":"https://example.com/article","proof_url":"https://example.com/proof.pdf","publication_type":"Book Chapter","impact_factor":0}',updated_at) from public.publications where id=(select id from phase2f_fixtures where slot=1)$$,'Admin can edit supplied fields');
select ok((select title='PHASE2F TEMPORARY TEST A edited' and year='2025' and journal='Exact edited test details' and indexing=array['Second','First'] and doi='10.test/fixture' and article_url='https://example.com/article' and proof_url='https://example.com/proof.pdf' and publication_type='Book Chapter' and impact_factor=0 from public.publications where id=(select id from phase2f_fixtures where slot=1)),'Every supplied field and badge order preserved, including zero impact factor');
select throws_ok($$select public.admin_save_publication((select id from phase2f_fixtures where slot=1),'{}','2000-01-01'::timestamptz)$$,'P0001',null,'Stale edit is rejected');
select lives_ok($$select public.admin_move_publication((select id from phase2f_fixtures where slot=1),(select count(*)::integer from public.publications),(select array_agg(id order by display_order) from public.publications))$$,'Admin can transactionally reorder test records');
select ok((select count(*)=count(distinct display_order) and min(display_order)>0 and max(display_order)=count(*) from public.publications),'Display positions remain valid and unique');
select is((select display_order from public.publications where id=(select id from phase2f_fixtures where slot=1)),(select count(*)::integer from public.publications),'Reorder moved selected test record to requested position');
select throws_ok($$select public.admin_move_publication((select id from phase2f_fixtures where slot=1),1,array[1])$$,'P0001',null,'Stale order snapshot is rejected');
select throws_ok($$select public.admin_move_publication((select id from phase2f_fixtures where slot=1),0,(select array_agg(id order by display_order) from public.publications))$$,'22023',null,'Invalid position is rejected');
select throws_ok($$select public.admin_move_publication(null,1,(select array_agg(id order by display_order) from public.publications))$$,'22023',null,'Missing reorder ID is rejected');
select throws_ok($$select public.admin_delete_publication(id,updated_at,false) from public.publications where id=(select id from phase2f_fixtures where slot=1)$$,'22023',null,'Delete requires explicit confirmation');
select throws_ok($$select public.admin_delete_publication((select id from phase2f_fixtures where slot=1),'2000-01-01'::timestamptz,true)$$,'P0001',null,'Stale delete is rejected');
select lives_ok($$update public.publication_settings set hero_publications='PHASE2F temporary counter' where id=true$$,'Admin can update independent hero counter');
select is((select hero_publications from public.publication_settings),'PHASE2F temporary counter','Hero counter is independent of row count');
select lives_ok($$select public.admin_delete_publication(id,updated_at,true) from public.publications where id=(select id from phase2f_fixtures where slot=1)$$,'Admin can delete confirmed test record');
select lives_ok($$select public.admin_delete_publication(id,updated_at,true) from public.publications where id=(select id from phase2f_fixtures where slot=2)$$,'Admin can remove second temporary record');
select is((select count(*)::integer from public.publications),(select count(*)::integer from phase2f_baseline),'Original publication count restored');
select ok(not exists(select 1 from phase2f_baseline b full join public.publications p using(id) where to_jsonb(b) is distinct from to_jsonb(p)),'Every original row including timestamps remains untouched');
reset role;
delete from private.publications_admins where user_id='00000000-0000-0000-0000-000000000101';
set local role authenticated;
select throws_ok($$select public.admin_save_publication(null,'{}')$$,'42501',null,'Revoked admin cannot write');

select * from finish();
rollback;
