-- Generated from data/professional-memberships.ts by scripts/professional-membership-seed.mjs.
-- Repeatable: the exact supplied row is retained; conflicting or extra rows abort.
begin;
lock table public.professional_memberships in exclusive mode;

do $$
begin
  if exists (
    select 1 from public.professional_memberships m
    where m.id <> 1
      or m.organization_name <> 'Condition Monitoring Society of India (MCMSI)'
      or m.membership_type is distinct from 'Member'
      or m.membership_number is not null or m.date_text is not null
      or m.validity_text is not null or m.designation is not null
      or m.chapter is not null or m.proof_url is not null
      or m.source_order is distinct from 1 or m.display_order is distinct from 1
  ) then
    raise exception 'Professional membership rows conflict with the supplied record; seed made no changes';
  end if;
end;
$$;

insert into public.professional_memberships
  (id,organization_name,membership_type,source_order,display_order)
select 1,'Condition Monitoring Society of India (MCMSI)','Member',1,1
where not exists (select 1 from public.professional_memberships);

do $$
begin
  if (select count(*) from public.professional_memberships) <> 1
    or not exists (select 1 from public.professional_memberships
      where id=1 and organization_name='Condition Monitoring Society of India (MCMSI)'
        and membership_type='Member' and membership_number is null and date_text is null
        and validity_text is null and designation is null and chapter is null
        and proof_url is null and source_order=1 and display_order=1) then
    raise exception 'Professional membership seed verification failed';
  end if;
end;
$$;

select setval('public.professional_memberships_id_seq', greatest(
  (select max(id) from public.professional_memberships),
  (select last_value from public.professional_memberships_id_seq)
), true);
commit;
