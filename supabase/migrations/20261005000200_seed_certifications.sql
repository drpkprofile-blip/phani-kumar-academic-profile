-- Generated solely from committed data/certifications.ts by scripts/certification-seed.mjs.
-- Repeatable: exact existing rows are retained; conflicting or extra rows abort.
begin;
lock table public.certifications in exclusive mode;
create temporary table phase4c_expected on commit drop as
select * from jsonb_to_recordset($certification_seed$[
  {
    "id": 1,
    "title": "Accreditation and Outcome Based Learning",
    "certificate_url": "https://drive.google.com/file/d/18x_ykLfdBSYNrr179M5WvUXOgonnqGiV/view?usp=drive_link",
    "fdp_url": "https://drive.google.com/file/d/11IFyiFHlJUnDUrr1zDfVoHqHgLJj6N0f/view?usp=drive_link",
    "source_order": 1,
    "display_order": 1
  },
  {
    "id": 2,
    "title": "Kinematics of Machines",
    "certificate_url": "https://drive.google.com/file/d/1Fxz7Y2mroMhqL6LPdw5SBicDq2pgdYom/view?usp=drive_link",
    "fdp_url": null,
    "source_order": 2,
    "display_order": 2
  },
  {
    "id": 3,
    "title": "Python for Data Science",
    "certificate_url": "https://drive.google.com/file/d/17JpScy_uTj7Lpmh4WJKqlkGO4TPLHHb/view?usp=drive_link",
    "fdp_url": "https://drive.google.com/file/d/1Ne_G1bZeNyjGv5briA4pHimpTWGBlOs6/view?usp=drive_link",
    "source_order": 3,
    "display_order": 3
  },
  {
    "id": 4,
    "title": "Introduction to Machine Learning",
    "certificate_url": "https://drive.google.com/file/d/1iQaBQSbnisLSUZaf7jpg65092wu9ywc/view?usp=drive_link",
    "fdp_url": "https://drive.google.com/file/d/1UnsRAsznBMTksT2Af4l56V_g4TDx_3Mf/view?usp=drive_link",
    "source_order": 4,
    "display_order": 4
  },
  {
    "id": 5,
    "title": "Fundamentals of Artificial Intelligence",
    "certificate_url": "https://drive.google.com/file/d/1yjxfxt__6jKaUxAMg32BFGe8PnAqyGxI/view?usp=drive_link",
    "fdp_url": "https://drive.google.com/file/d/11IOwz67Jv1uJS4d1zCJqmpCD24-Ksdn/view?usp=drive_link",
    "source_order": 5,
    "display_order": 5
  },
  {
    "id": 6,
    "title": "Introduction to Composite Materials",
    "certificate_url": "https://drive.google.com/file/d/18h9kjVe4nca6_tTr7d4C93eCpeAw0K2i/view?usp=drive_link",
    "fdp_url": "https://drive.google.com/file/d/1FDjKgkXwdkgGTEJnv3PuwZceU-JKmteK/view?usp=drive_link",
    "source_order": 6,
    "display_order": 6
  },
  {
    "id": 7,
    "title": "Introduction to Internet of Things",
    "certificate_url": "https://drive.google.com/file/d/19cfvYVp8ptC6HSwmuX-aip4ZcGvEwPV1/view?usp=drive_link",
    "fdp_url": "https://drive.google.com/file/d/1TJ4bFZ6NbFjbG94Sq7zplCFtAYlHSNye/view?usp=drive_link",
    "source_order": 7,
    "display_order": 7
  },
  {
    "id": 8,
    "title": "Research Methodology",
    "certificate_url": "https://drive.google.com/file/d/1hquQcw79GY5LmmsQ3swkVnigH47ad5v8/view?usp=drive_link",
    "fdp_url": null,
    "source_order": 8,
    "display_order": 8
  },
  {
    "id": 9,
    "title": "Computer Vision and Image Processing",
    "certificate_url": null,
    "fdp_url": null,
    "source_order": 9,
    "display_order": 9
  },
  {
    "id": 10,
    "title": "Cloud Computing",
    "certificate_url": null,
    "fdp_url": null,
    "source_order": 10,
    "display_order": 10
  },
  {
    "id": 11,
    "title": "Artificial Intelligence and Concepts",
    "certificate_url": null,
    "fdp_url": null,
    "source_order": 11,
    "display_order": 11
  },
  {
    "id": 12,
    "title": "Human Computer Interaction",
    "certificate_url": null,
    "fdp_url": null,
    "source_order": 12,
    "display_order": 12
  },
  {
    "id": 13,
    "title": "Computer Networks and Internet Protocol",
    "certificate_url": "https://drive.google.com/file/d/10ttL9JwUHzDkbs4Tw8iJNYsfm65zZqR1/view?usp=drive_link",
    "fdp_url": null,
    "source_order": 13,
    "display_order": 13
  }
]$certification_seed$::jsonb)
as c(id integer, title text, certificate_url text, fdp_url text,
source_order integer, display_order integer);

do $$
begin
  if exists (
    select 1 from public.certifications c left join phase4c_expected e using (id)
    where e.id is null
      or (to_jsonb(c) - 'created_at' - 'updated_at') is distinct from to_jsonb(e)
  ) then
    raise exception 'Existing certifications conflict with committed source; no rows changed';
  end if;
end;
$$;

insert into public.certifications
(id,title,certificate_url,fdp_url,source_order,display_order)
select e.* from phase4c_expected e
where not exists (select 1 from public.certifications c where c.id=e.id);

do $$
begin
  if (select count(*) from public.certifications) <> 13 or exists (
    select 1 from phase4c_expected e left join public.certifications c using (id)
    where (to_jsonb(c) - 'created_at' - 'updated_at') is distinct from to_jsonb(e)
  ) then
    raise exception 'Field-by-field certification seed verification failed';
  end if;
end;
$$;

-- Do not rewind the identity sequence if it has already issued later IDs.
select setval('public.certifications_id_seq', greatest(
  (select max(id) from public.certifications),
  (select last_value from public.certifications_id_seq)
), true);
commit;
