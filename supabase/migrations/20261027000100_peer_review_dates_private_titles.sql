-- Reconcile the 20 WOS review dates and isolate manuscript titles from public access.
-- Existing rows and legacy text are retained; public roles lose access to the legacy title column.
begin;

lock table public.peer_reviews in exclusive mode;
drop view if exists public.peer_reviews_public;

alter table public.peer_reviews add column journal_name text;
alter table public.peer_reviews add column review_date date;

create table public.peer_review_titles (
  review_id integer primary key references public.peer_reviews(id) on delete cascade,
  publication_title text not null check (length(btrim(publication_title)) > 0)
);
alter table public.peer_review_titles enable row level security;
revoke all on table public.peer_review_titles from public, anon, authenticated;
grant select, insert, update, delete on table public.peer_review_titles to authenticated;
create policy peer_review_titles_admin_all on public.peer_review_titles
for all to authenticated
using ((select public.is_publications_admin()))
with check ((select public.is_publications_admin()));

create temporary table phase_peer_review_wos_seed (
  display_order integer primary key,
  publication_title text not null,
  journal_name text not null,
  review_date date not null,
  legacy_source_order integer,
  legacy_title_prefix text
) on commit drop;

insert into phase_peer_review_wos_seed values
  (1, 'From polymer sorption to water transport: Multiscale mechanisms and predictive modeling in SAP-modified cementitious materials', 'Journal of Polymer Research', '2026-10-27', null, 'From polymer sorption to water transport:'),
  (2, 'An Active-Attention-Based Obstacle Perception Method for Intelligent Connected Vehicles', 'Engineering Research Express', '2026-10-12', null, 'An Active-Attention-Based Obstacle Perception Method for Intelligent Connected Vehicles'),
  (3, 'Tooth Modification for Mitigating Inter-Tooth Interference in Misaligned Spiral Bevel Gears', 'Journal of the Brazilian Society of Mechanical Sciences and Engineering', '2026-09-08', null, null),
  (4, 'Diffusion-Based Generative Augmentation for Dataset Construction in Door-State Detection of Temporary Electrical Distribution Boxes on Construction Sites', 'Engineering Research Express', '2026-08-23', 1, null),
  (5, 'Diffusion-Based Generative Augmentation for Dataset Construction in Door-State Detection of Temporary Electrical Distribution Boxes on Construction Sites', 'Engineering Research Express', '2026-07-24', null, null),
  (6, 'Adaptive MPC with EKF-Based Obstacle Prediction for AGV Navigation', 'Engineering Research Express', '2026-05-24', 2, null),
  (7, 'Enhanced Lichtenberg Optimization Algorithm for the Optimal Design and Control of MRWBLDC Motors', 'Proceedings of the Institution of Mechanical Engineers, Part G: Journal of Aerospace Engineering', '2026-04-27', 3, null),
  (8, 'TIRP: a topology-informed refinement model for multimodal trajectory prediction in autonomous driving', 'Measurement Science and Technology', '2026-03-22', 4, null),
  (9, 'Parallel hybrid interval type-2 fuzzy NARX network for robust line-following control of autonomous guided vehicles', 'Measurement Science and Technology', '2026-02-27', 5, null),
  (10, 'TIRP: a topology-informed refinement model for multimodal trajectory prediction in autonomous driving', 'Measurement Science and Technology', '2026-02-22', null, null),
  (11, 'Parallel hybrid interval type-2 fuzzy NARX network for robust line-following control of autonomous guided vehicles', 'Measurement Science and Technology', '2026-01-12', null, null),
  (12, 'Effect of stress concentration caused by 3D surface topography on gear bending fatigue life', 'Engineering Research Express', '2025-09-30', 6, null),
  (13, 'Effect of stress concentration caused by 3D surface topography on gear bending fatigue life', 'Engineering Research Express', '2025-08-24', null, null),
  (14, 'Chaotic African vultures optimization based non-linear FOPID controller for frequency regulation in standalone microgrid system', 'Engineering Research Express', '2025-06-14', 7, null),
  (15, 'CNN-BiLSTM-AM: A Hybrid Deep Learning Model for Real-Time Vehicle Longitudinal Control in Bench Testing', 'Engineering Research Express', '2025-05-27', 8, null),
  (16, 'A Comparative Study on the Structural and Stress Performance of Phased and Non-Phased Gear Systems', 'Engineering Research Express', '2025-04-29', 9, null),
  (17, 'Chaotic African vultures optimization based non-linear FOPID controller for frequency regulation in standalone microgrid system', 'Engineering Research Express', '2025-04-08', null, null),
  (18, 'Electric Vehicle Battery Pack State of Health Assessment by Signal Tracking Regularized Box Particle Filter', 'Engineering Research Express', '2025-02-23', 10, null),
  (19, 'Effects of discrete fibre reinforcements on the wear resistance behaviour of polyamide-based spur gears', 'Physica Scripta', '2024-11-18', 11, null),
  (20, 'Effects of discrete fibre reinforcements on the wear resistance behaviour of polyamide-based spur gears', 'Physica Scripta', '2024-10-15', null, null);

create temporary table phase_peer_review_existing_links on commit drop as
select review.id as review_id, seed.display_order, seed.publication_title
from phase_peer_review_wos_seed seed
join public.peer_reviews review
  on (seed.legacy_source_order is not null and review.source_order = seed.legacy_source_order)
  or (seed.legacy_title_prefix is not null and review.review_text ilike seed.legacy_title_prefix || '%');

do $$
begin
  if (select count(*) from public.peer_reviews) <> 13
    or (select count(*) from phase_peer_review_existing_links) <> 13
    or (select count(distinct review_id) from phase_peer_review_existing_links) <> 13
    or (select count(distinct display_order) from phase_peer_review_existing_links) <> 13 then
    raise exception 'Unexpected legacy peer-review rows; migration stopped without changing the saved review data';
  end if;
end;
$$;

set constraints public.peer_reviews_display_order_unique deferred;

update public.peer_reviews review
set journal_name = seed.journal_name,
    review_date = seed.review_date,
    display_order = seed.display_order
from phase_peer_review_existing_links link
join phase_peer_review_wos_seed seed using (display_order)
where review.id = link.review_id;

insert into public.peer_reviews (review_text, journal_name, review_date, display_order)
select 'Private manuscript title stored in the admin-only table', seed.journal_name, seed.review_date, seed.display_order + 100
from phase_peer_review_wos_seed seed
left join phase_peer_review_existing_links link using (display_order)
where link.review_id is null;

insert into public.peer_review_titles (review_id, publication_title)
select review.id, link.publication_title
from phase_peer_review_existing_links link
join public.peer_reviews review on review.id = link.review_id
on conflict (review_id) do update set publication_title = excluded.publication_title;

insert into public.peer_review_titles (review_id, publication_title)
select review.id, seed.publication_title
from phase_peer_review_wos_seed seed
join public.peer_reviews review on review.display_order = seed.display_order + 100
on conflict (review_id) do update set publication_title = excluded.publication_title;

with numbered as (
  select id, row_number() over (order by review_date desc, display_order asc, id asc)::integer as next_order
  from public.peer_reviews
)
update public.peer_reviews review
set display_order = numbered.next_order
from numbered
where review.id = numbered.id;

set constraints public.peer_reviews_display_order_unique immediate;

alter table public.peer_reviews alter column journal_name set not null;
alter table public.peer_reviews alter column review_date set not null;
alter table public.peer_reviews add constraint peer_reviews_journal_nonblank check (length(btrim(journal_name)) > 0);

alter table public.peer_review_settings
  add column manuscripts_count integer not null default 14 check (manuscripts_count >= 0);
update public.peer_review_settings
set hero_counter_text = '20+', completed_reviews_count = 20, manuscripts_count = 14
where singleton is true;

create index peer_reviews_review_date_idx on public.peer_reviews (review_date desc, display_order asc);

-- Do not expose legacy review_text (which contains manuscript titles) to public or signed-in non-admin clients.
revoke select on table public.peer_reviews from anon, authenticated;
grant select (id, display_order, journal_name, review_date) on table public.peer_reviews to anon;
grant select (id, display_order, journal_name, review_date, created_at, updated_at) on table public.peer_reviews to authenticated;

create view public.peer_reviews_public with (security_invoker = true) as
select id, display_order, journal_name, review_date
from public.peer_reviews;
grant select on public.peer_reviews_public to anon, authenticated;

drop function if exists public.admin_save_peer_review(integer, text, timestamptz);
create function public.admin_save_peer_review(
  p_id integer default null,
  p_publication_title text default null,
  p_journal_name text default null,
  p_review_date date default null,
  p_expected_updated_at timestamptz default null
) returns integer language plpgsql security invoker set search_path = '' as $$
declare
  saved_id integer;
  next_position integer;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_publication_title is null or p_publication_title !~ '[^[:space:]]'
    or p_journal_name is null or p_journal_name !~ '[^[:space:]]'
    or p_review_date is null then
    raise exception 'Manuscript title, journal, and review date are required' using errcode = '22023';
  end if;

  lock table public.peer_reviews in exclusive mode;
  if p_id is null then
    select coalesce(max(display_order), 0) + 1 into next_position from public.peer_reviews;
    insert into public.peer_reviews(journal_name, review_date, display_order)
    values (btrim(p_journal_name), p_review_date, next_position)
    returning id into saved_id;
    insert into public.peer_review_titles(review_id, publication_title)
    values (saved_id, btrim(p_publication_title));
  else
    perform 1 from public.peer_reviews where id = p_id and updated_at = p_expected_updated_at;
    if not found then
      raise exception 'Review changed or no longer exists; reload before saving' using errcode = 'P0001';
    end if;
    update public.peer_reviews
    set journal_name = btrim(p_journal_name), review_date = p_review_date
    where id = p_id returning id into saved_id;
    insert into public.peer_review_titles(review_id, publication_title)
    values (saved_id, btrim(p_publication_title))
    on conflict (review_id) do update set publication_title = excluded.publication_title;
  end if;
  return saved_id;
end;
$$;

drop function if exists public.admin_update_peer_review_settings(text, integer, timestamptz);
create function public.admin_update_peer_review_settings(
  p_hero_counter_text text, p_completed_reviews_count integer,
  p_manuscripts_count integer, p_expected_updated_at timestamptz
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_hero_counter_text is null or p_hero_counter_text !~ '[^[:space:]]'
    or length(p_hero_counter_text) > 64 then
    raise exception 'A nonblank hero counter of at most 64 characters is required' using errcode = '22023';
  end if;
  if p_completed_reviews_count is null or p_completed_reviews_count < 0
    or p_manuscripts_count is null or p_manuscripts_count < 0 then
    raise exception 'Review and manuscript counts must be non-negative integers' using errcode = '22023';
  end if;

  update public.peer_review_settings
  set hero_counter_text = p_hero_counter_text,
      completed_reviews_count = p_completed_reviews_count,
      manuscripts_count = p_manuscripts_count
  where singleton is true and updated_at = p_expected_updated_at;
  if not found then
    raise exception 'Peer Review settings changed or no longer exist; reload before saving' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.admin_save_peer_review(integer, text, text, date, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_save_peer_review(integer, text, text, date, timestamptz) to authenticated;
revoke all on function public.admin_update_peer_review_settings(text, integer, integer, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_update_peer_review_settings(text, integer, integer, timestamptz) to authenticated;

notify pgrst, 'reload schema';
commit;
