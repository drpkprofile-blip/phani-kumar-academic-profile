begin;

create table public.profile_settings (
  singleton boolean primary key default true check (singleton),
  name text not null check (name ~ '[^[:space:]]'),
  first_name text not null check (first_name ~ '[^[:space:]]'),
  last_name text not null check (last_name ~ '[^[:space:]]'),
  qualifications text not null check (qualifications ~ '[^[:space:]]'),
  designation text not null check (designation ~ '[^[:space:]]'),
  department text not null check (department ~ '[^[:space:]]'),
  institution text not null check (institution ~ '[^[:space:]]'),
  profile_label text not null check (profile_label ~ '[^[:space:]]'),
  description text not null check (description ~ '[^[:space:]]'),
  email text not null check (email ~ '[^[:space:]]'),
  phone text not null check (phone ~ '[^[:space:]]'),
  photo_url text not null check (((photo_url like '/%' and photo_url not like '//%' and position(chr(92) in photo_url) = 0 and photo_url !~ '[[:space:]]') or photo_url ~ '^https://[^/[:space:]]+[^[:space:]]*$'),
  academic_identity jsonb not null check (jsonb_typeof(academic_identity) = 'array'),
  profile_links jsonb not null check (jsonb_typeof(profile_links) = 'array'),
  youtube_channel jsonb not null check (jsonb_typeof(youtube_channel) = 'object'),
  technical_tools jsonb not null check (jsonb_typeof(technical_tools) = 'array'),
  skills jsonb not null check (jsonb_typeof(skills) = 'array'),
  research_interests jsonb not null check (jsonb_typeof(research_interests) = 'array'),
  experience_counter_text text not null check (experience_counter_text ~ '[^[:space:]]' and length(experience_counter_text) <= 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profile_settings is 'Singleton public profile content and independently curated experience counter.';

alter table public.profile_settings enable row level security;
revoke all on table public.profile_settings from public, anon, authenticated;
grant select on table public.profile_settings to anon, authenticated;
grant update on table public.profile_settings to authenticated;

create policy "Anyone can read public profile settings"
  on public.profile_settings for select to anon, authenticated using (true);
create policy "Allowlisted admin updates profile settings"
  on public.profile_settings for update to authenticated
  using (public.is_publications_admin()) with check (public.is_publications_admin());

create or replace function public.set_profile_settings_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.set_profile_settings_updated_at() from public, anon, authenticated;
create trigger profile_settings_set_updated_at
  before update on public.profile_settings
  for each row execute function public.set_profile_settings_updated_at();

insert into public.profile_settings (
  singleton, name, first_name, last_name, qualifications, designation, department,
  institution, profile_label, description, email, phone, photo_url,
  academic_identity, profile_links, youtube_channel, technical_tools, skills,
  research_interests, experience_counter_text
) values (
  true,
  'Dr. Phani Kumar Simhadri',
  'Dr. Phani',
  'Kumar Simhadri',
  'B. Tech.[Mech], M.E.[CAD/CAM], M. Tech (AI-ML), PhD[AU].',
  'Assistant Professor',
  'Mechanical Engineering',
  'Anil Neerukonda Institute of Technology and Sciences (ANITS)',
  'ACADEMIC & RESEARCH PROFILE',
  'Academic and researcher working in mechanical engineering, polymer composite materials, intelligent optimization, artificial intelligence, and advanced engineering systems.',
  'sphani.me@anits.edu.in',
  '+91 9866701200',
  '/phani-photo.png',
  '[{"label":"ORCID ID","value":"0000-0002-4097-2635","href":""},{"label":"Scopus ID","value":"57738906200","href":""},{"label":"Researcher ID","value":"ABB-7262-2022","href":""},{"label":"Google Scholar ID","value":"ASjE9TgAAAAJ","href":"https://scholar.google.com/citations?view_op=list_works&hl=en&user=ASjE9TgAAAAJ&pagesize=80&sortby=pubdate"}]'::jsonb,
  '[{"label":"LinkedIn","href":"https://www.linkedin.com/in/dr-phani-kumar-simhadri-bb7948b?utm_source=share_via&utm_content=profile&utm_medium=member_android"},{"label":"Instagram","href":"https://www.instagram.com/invites/contact/?i=oraf9tu717g0&utm_content=3nupwnq"},{"label":"Facebook","href":"https://www.facebook.com/phanikumarsimha"},{"label":"Google Scholar","href":"https://scholar.google.com/citations?view_op=list_works&hl=en&user=ASjE9TgAAAAJ&pagesize=80&sortby=pubdate"},{"label":"ResearchGate","href":"https://www.researchgate.net/profile/Phani-Simhadri?ev=hdr_xprf"},{"label":"IRINS","href":""}]'::jsonb,
  '{"title":"Code & CAD with PK","href":"https://youtube.com/@codeandcadwithpk?si=vaESyvrIBw5tMVYi","image":"/youtube-channel-logo.png"}'::jsonb,
  '["Python Programming","SOLID WORKS","ANSYS","AUTO CAD"]'::jsonb,
  '["Evaluations and assessments","Publications","Technology-based learning tools","Student research advisement"]'::jsonb,
  '["Polymer Composite Gears","Tribology","Contact Stress Analysis","Finite Element Analysis","Machine Learning","Artificial Intelligence","Optimization","Electric Vehicles","Intelligent Control Systems","Advanced Engineering Systems"]'::jsonb,
  '20+'
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-assets', 'profile-assets', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public profile photo objects are readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'profile-assets' and name = 'profile/profile-photo');
create policy "Allowlisted admins upload profile photo"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-assets' and name = 'profile/profile-photo' and public.is_publications_admin());
create policy "Allowlisted admins replace profile photo"
  on storage.objects for update to authenticated
  using (bucket_id = 'profile-assets' and name = 'profile/profile-photo' and public.is_publications_admin())
  with check (bucket_id = 'profile-assets' and name = 'profile/profile-photo' and public.is_publications_admin());
create policy "Allowlisted admins remove profile photo"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profile-assets' and name = 'profile/profile-photo' and public.is_publications_admin());

commit;
