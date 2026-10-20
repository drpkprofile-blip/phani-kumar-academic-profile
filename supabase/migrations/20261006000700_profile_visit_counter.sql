begin;

create table public.profile_visit_counter (
  singleton boolean primary key default true check (singleton),
  total_visits bigint not null default 0 check (total_visits >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.profile_visit_counter is
  'Public aggregate profile visit count; no visitor identifiers are stored.';

insert into public.profile_visit_counter (singleton, total_visits)
values (true, 0);

alter table public.profile_visit_counter enable row level security;
revoke all on table public.profile_visit_counter from public, anon, authenticated;
grant select on table public.profile_visit_counter to anon, authenticated;

create policy "Anyone can read aggregate profile visits"
  on public.profile_visit_counter for select to anon, authenticated
  using (true);

create function public.record_profile_visit()
returns bigint
language sql
security definer
set search_path = ''
as $$
  update public.profile_visit_counter
  set total_visits = total_visits + 1,
      updated_at = now()
  where singleton = true
  returning total_visits;
$$;

revoke all on function public.record_profile_visit() from public;
grant execute on function public.record_profile_visit() to anon, authenticated;

commit;
