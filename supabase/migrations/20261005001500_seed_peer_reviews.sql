-- Generated solely from committed data/peer-reviews.ts by scripts/peer-review-seed.mjs.
-- Repeatable: exact existing rows and settings are retained; conflicts abort.
begin;
lock table public.peer_reviews in exclusive mode;
create temporary table phase_peer_reviews_expected on commit drop as
select * from jsonb_to_recordset($peer_review_seed$[
  {
    "id": 1,
    "review_text": "Diffusion-Based Generative Augmentation for Dataset Construction in Door-State Detection of Temporary Electrical Distribution Boxes on Construction Sites, Engineering Research Express (2026)",
    "source_order": 1,
    "display_order": 1
  },
  {
    "id": 2,
    "review_text": "Adaptive MPC with EKF-Based Obstacle Prediction for AGV Navigation, Engineering Research Express (2026)",
    "source_order": 2,
    "display_order": 2
  },
  {
    "id": 3,
    "review_text": "Enhanced Lichtenberg Optimization Algorithm for the Optimal Design and Control of MRWBLDC Motors, Proceedings of the Institution of Mechanical Engineers, Part G: Journal of Aerospace Engineering (2026)",
    "source_order": 3,
    "display_order": 3
  },
  {
    "id": 4,
    "review_text": "TIRP: A Topology-Informed Refinement Model for Multimodal Trajectory Prediction in Autonomous Driving, Measurement Science and Technology (2026)",
    "source_order": 4,
    "display_order": 4
  },
  {
    "id": 5,
    "review_text": "Parallel Hybrid Interval Type-2 Fuzzy NARX Network for Robust Line-Following Control of Autonomous Guided Vehicles, Measurement Science and Technology (2026)",
    "source_order": 5,
    "display_order": 5
  },
  {
    "id": 6,
    "review_text": "Effect of Stress Concentration Caused by 3D Surface Topography on Gear Bending Fatigue Life, Engineering Research Express (2025)",
    "source_order": 6,
    "display_order": 6
  },
  {
    "id": 7,
    "review_text": "Chaotic African Vultures Optimization Based Non-Linear FOPID Controller for Frequency Regulation in Standalone Microgrid System, Engineering Research Express (2025)",
    "source_order": 7,
    "display_order": 7
  },
  {
    "id": 8,
    "review_text": "CNN-BiLSTM-AM: A Hybrid Deep Learning Model for Real-Time Vehicle Longitudinal Control in Bench Testing, Engineering Research Express (2025)",
    "source_order": 8,
    "display_order": 8
  },
  {
    "id": 9,
    "review_text": "A Comparative Study on the Structural and Stress Performance of Phased and Non-Phased Gear Systems, Engineering Research Express (2025)",
    "source_order": 9,
    "display_order": 9
  },
  {
    "id": 10,
    "review_text": "Electric Vehicle Battery Pack State of Health Assessment by Signal Tracking Regularized Box Particle Filter, Engineering Research Express (2025)",
    "source_order": 10,
    "display_order": 10
  },
  {
    "id": 11,
    "review_text": "Effects of Discrete Fibre Reinforcements on the Wear Resistance Behaviour of Polyamide-Based Spur Gears, Physica Scripta (2024)",
    "source_order": 11,
    "display_order": 11
  }
]$peer_review_seed$::jsonb)
as r(id integer, review_text text, source_order integer, display_order integer);

do $$
begin
  if exists (
    select 1 from public.peer_reviews actual
    left join phase_peer_reviews_expected expected using (id)
    where expected.id is null
      or (to_jsonb(actual) - 'created_at' - 'updated_at') is distinct from to_jsonb(expected)
  ) then
    raise exception 'Existing Peer Reviews conflict with committed source; no rows changed';
  end if;
end;
$$;

insert into public.peer_reviews (id, review_text, source_order, display_order)
select expected.* from phase_peer_reviews_expected expected
where not exists (select 1 from public.peer_reviews actual where actual.id=expected.id);

insert into public.peer_review_settings (singleton, hero_counter_text, completed_reviews_count)
values (true, '16+', 16)
on conflict (singleton) do nothing;

do $$
begin
  if (select count(*) from public.peer_reviews) <> 11 or exists (
    select 1 from phase_peer_reviews_expected expected
    left join public.peer_reviews actual using (id)
    where (to_jsonb(actual) - 'created_at' - 'updated_at') is distinct from to_jsonb(expected)
  ) then
    raise exception 'Field-by-field Peer Reviews seed verification failed';
  end if;
  if (select count(distinct display_order) from public.peer_reviews) <> 11
     or (select min(display_order) from public.peer_reviews) <> 1
     or (select max(display_order) from public.peer_reviews) <> 11 then
    raise exception 'Peer Reviews display positions must be exactly 1 through 11';
  end if;
  if (select count(*) from public.peer_review_settings) <> 1
     or not exists (
       select 1 from public.peer_review_settings
       where singleton is true
         and hero_counter_text = '16+'
         and completed_reviews_count = 16
     ) then
    raise exception 'Peer Review settings conflict with the approved independent counters';
  end if;
end;
$$;

select setval('public.peer_reviews_id_seq', greatest(
  (select max(id) from public.peer_reviews),
  (select last_value from public.peer_reviews_id_seq)
), true);
commit;
