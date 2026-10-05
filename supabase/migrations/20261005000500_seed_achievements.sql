-- Generated solely from committed data/achievements.ts by scripts/achievement-seed.mjs.
-- Repeatable: exact existing rows are retained; conflicting or extra rows abort.
begin;
lock table public.achievements in exclusive mode;
create temporary table phase8c_expected on commit drop as
select * from jsonb_to_recordset($achievement_seed$[
  {
    "id": 1,
    "title": "Best Paper Award",
    "description": "Received the Best Paper Award at the International Conference on ICANITS-2026.",
    "proof_url": "https://drive.google.com/file/d/1TzMj1rdlHN1mUZZqJ7dZEY4Jw9wt0aTT/view?usp=drive_link",
    "extra_proof_url": null,
    "source_order": 1,
    "display_order": 1
  },
  {
    "id": 2,
    "title": "NPTEL Discipline Star",
    "description": "Received NPTEL Discipline Star Certificate from IIT Madras in 2026 and attended the NPTEL Star Event at IIT Tirupati.",
    "proof_url": "https://drive.google.com/file/d/1G2s4OHeQUODHIHDrkOWu2pY1U6kQY0bf/view?usp=drive_link",
    "extra_proof_url": "https://drive.google.com/file/d/1SslACwcOG3n2UaOmu1QdAqh-4-JoPOvH/view?usp=drive_link",
    "source_order": 2,
    "display_order": 2
  },
  {
    "id": 3,
    "title": "NPTEL Believer Certificate",
    "description": "Received NPTEL Believer Certificate from IIT Madras in 2022.",
    "proof_url": "https://drive.google.com/file/d/1Bh3tLtVVGmn9-REa0eZm5wesd6T5ggE2/view?usp=drive_link",
    "extra_proof_url": null,
    "source_order": 3,
    "display_order": 3
  },
  {
    "id": 4,
    "title": "Research Seed Money",
    "description": "Sanctioned Rs. 1,50,000/- from ANITS for research on contact stresses and wear rate of plastic gears mounted on shafts with misalignment.",
    "proof_url": "https://drive.google.com/drive/folders/1MndZ9k4UZH06eGZS1id8HpoVXMWl8pXm?usp=drive_link",
    "extra_proof_url": null,
    "source_order": 4,
    "display_order": 4
  }
]$achievement_seed$::jsonb)
as a(id integer, title text, description text, proof_url text, extra_proof_url text,
source_order integer, display_order integer);

do $$
begin
  if exists (
    select 1 from public.achievements a left join phase8c_expected e using (id)
    where e.id is null
      or (to_jsonb(a) - 'created_at' - 'updated_at') is distinct from to_jsonb(e)
  ) then
    raise exception 'Existing achievements conflict with committed source; no rows changed';
  end if;
end;
$$;

insert into public.achievements
(id,title,description,proof_url,extra_proof_url,source_order,display_order)
select e.* from phase8c_expected e
where not exists (select 1 from public.achievements a where a.id=e.id);

do $$
begin
  if (select count(*) from public.achievements) <> 4 or exists (
    select 1 from phase8c_expected e left join public.achievements a using (id)
    where (to_jsonb(a) - 'created_at' - 'updated_at') is distinct from to_jsonb(e)
  ) then
    raise exception 'Field-by-field Achievements seed verification failed';
  end if;
  if (select count(distinct display_order) from public.achievements) <> 4
     or (select min(display_order) from public.achievements) <> 1
     or (select max(display_order) from public.achievements) <> 4 then
    raise exception 'Achievements display positions must be exactly 1 through 4';
  end if;
end;
$$;

-- Never rewind a sequence that may already have issued IDs.
select setval('public.achievements_id_seq', greatest(
  (select max(id) from public.achievements),
  (select last_value from public.achievements_id_seq)
), true);
commit;
