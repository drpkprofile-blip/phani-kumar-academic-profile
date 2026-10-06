begin;

-- A year is a separate, optional sort key. Keep the existing free-text date
-- and validity fields unchanged; the currently seeded record remains NULL.
alter table public.professional_memberships
  add column year integer check (year is null or year between 1800 and 2200);

create or replace function public.admin_save_professional_membership(
  p_id integer default null,
  p_membership jsonb default '{}'::jsonb,
  p_expected_updated_at timestamptz default null
) returns integer language plpgsql security invoker set search_path = '' as $$
declare
  saved_id integer;
  next_position integer;
  previous public.professional_memberships%rowtype;
  organization text;
  year_value integer;
  membership_type_value text;
  membership_number_value text;
  date_value text;
  validity_value text;
  designation_value text;
  chapter_value text;
  proof_link text;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  lock table public.professional_memberships in exclusive mode;
  if jsonb_typeof(p_membership) is distinct from 'object'
    or (p_membership - array['organization_name','year','membership_type','membership_number','date_text',
      'validity_text','designation','chapter','proof_url']::text[]) <> '{}'::jsonb then
    raise exception 'Membership object contains invalid fields' using errcode = '22023';
  end if;
  organization := p_membership->>'organization_name';
  if organization is null or organization !~ '[^[:space:]]' then
    raise exception 'A nonblank organization name is required' using errcode = '22023';
  end if;
  if nullif(p_membership->>'year','') is not null then
    if p_membership->>'year' !~ '^\d{4}$' then
      raise exception 'Year must be a valid four-digit year' using errcode = '22023';
    end if;
    year_value := (p_membership->>'year')::integer;
    if year_value not between 1800 and 2200 then
      raise exception 'Year must be between 1800 and 2200' using errcode = '22023';
    end if;
  end if;
  membership_type_value := nullif(btrim(p_membership->>'membership_type'), '');
  membership_number_value := nullif(btrim(p_membership->>'membership_number'), '');
  date_value := nullif(btrim(p_membership->>'date_text'), '');
  validity_value := nullif(btrim(p_membership->>'validity_text'), '');
  designation_value := nullif(btrim(p_membership->>'designation'), '');
  chapter_value := nullif(btrim(p_membership->>'chapter'), '');
  proof_link := p_membership->>'proof_url';
  if proof_link is not null and btrim(proof_link) = '' then proof_link := null; end if;
  if proof_link is not null and (proof_link !~* '^https?://[^[:space:]]+$'
    or proof_link ~* '^https?://[^/]*@') then
    raise exception 'Proof links must be HTTP or HTTPS URLs' using errcode = '22023';
  end if;
  if p_id is null then
    select coalesce(max(display_order), 0) + 1 into next_position from public.professional_memberships;
    insert into public.professional_memberships(organization_name,year,membership_type,membership_number,
      date_text,validity_text,designation,chapter,proof_url,display_order)
    values(organization,year_value,membership_type_value,membership_number_value,date_value,validity_value,
      designation_value,chapter_value,proof_link,next_position)
    returning id into saved_id;
  else
    select * into previous from public.professional_memberships
    where id = p_id and updated_at = p_expected_updated_at;
    if not found then
      raise exception 'Record changed or no longer exists; reload before saving' using errcode = 'P0001';
    end if;
    update public.professional_memberships set organization_name=organization,year=year_value,
      membership_type=membership_type_value,membership_number=membership_number_value,
      date_text=date_value,validity_text=validity_value,designation=designation_value,
      chapter=chapter_value,proof_url=proof_link
    where id=p_id returning id into saved_id;
  end if;
  return saved_id;
end;
$$;

revoke all on function public.admin_save_professional_membership(integer,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.admin_save_professional_membership(integer,jsonb,timestamptz) to authenticated;

commit;
