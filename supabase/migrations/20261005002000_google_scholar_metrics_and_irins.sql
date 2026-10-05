begin;

alter table public.profile_settings
  add column google_scholar_citations_text text not null default '179 (142)'
    check (google_scholar_citations_text ~ '[^[:space:]]' and char_length(google_scholar_citations_text) <= 64),
  add column google_scholar_h_index_text text not null default '8 (8)'
    check (google_scholar_h_index_text ~ '[^[:space:]]' and char_length(google_scholar_h_index_text) <= 64),
  add column google_scholar_i10_index_text text not null default '5 (4)'
    check (google_scholar_i10_index_text ~ '[^[:space:]]' and char_length(google_scholar_i10_index_text) <= 64);

update public.profile_settings as settings
set profile_links = (
  select jsonb_agg(
    case when link.value ->> 'label' = 'IRINS'
      then jsonb_set(link.value, '{href}', to_jsonb('https://vidwan.inflibnet.ac.in/profile/262584'::text), true)
      else link.value
    end
    order by link.ordinality
  )
  from jsonb_array_elements(settings.profile_links) with ordinality as link(value, ordinality)
)
where settings.singleton
  and settings.profile_links @> '[{"label":"IRINS"}]'::jsonb;

commit;
