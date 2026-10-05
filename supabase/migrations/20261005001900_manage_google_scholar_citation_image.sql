begin;

alter table public.profile_settings
  add column citations_image_url text not null default '/google-scholar-citations.jpg'
  check (
    (citations_image_url like '/%' and citations_image_url not like '//%'
      and position(chr(92) in citations_image_url) = 0 and citations_image_url !~ '[[:space:]]')
    or citations_image_url ~ '^https://[^/[:space:]]+[^[:space:]]*$'
  );

create policy "Public Google Scholar citation image is readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'profile-assets' and name = 'profile/google-scholar-citations');

create policy "Allowlisted admins upload Google Scholar citation image"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-assets' and name = 'profile/google-scholar-citations' and public.is_publications_admin());

create policy "Allowlisted admins replace Google Scholar citation image"
  on storage.objects for update to authenticated
  using (bucket_id = 'profile-assets' and name = 'profile/google-scholar-citations' and public.is_publications_admin())
  with check (bucket_id = 'profile-assets' and name = 'profile/google-scholar-citations' and public.is_publications_admin());

create policy "Allowlisted admins remove Google Scholar citation image"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profile-assets' and name = 'profile/google-scholar-citations' and public.is_publications_admin());

commit;
