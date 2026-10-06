begin;

-- Existing course years are unknown, so this stays NULL until an admin supplies
-- an authoritative year. Existing title/link/order data is untouched.
alter table public.certifications
  add column year integer check (year is null or year between 1800 and 2200);

-- Save the optional year in the same authorized transaction as the existing
-- title and URL fields; records without a supplied year remain NULL.
create or replace function public.admin_save_certification(
  p_id integer default null,
  p_certification jsonb default '{}'::jsonb,
  p_expected_updated_at timestamptz default null
) returns integer language plpgsql security invoker set search_path = '' as $$
declare
  saved_id integer;
  next_position integer;
  previous public.certifications%rowtype;
  certification_title text;
  certification_year integer;
  certificate_link text;
  fdp_link text;
begin
  if public.is_publications_admin() is distinct from true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  lock table public.certifications in exclusive mode;
  if jsonb_typeof(p_certification) is distinct from 'object' then
    raise exception 'Certification object required' using errcode = '22023';
  end if;
  certification_title := p_certification->>'title';
  if certification_title is null or certification_title !~ '[^[:space:]]' then
    raise exception 'A nonblank title is required' using errcode = '22023';
  end if;
  if nullif(p_certification->>'year', '') is not null then
    if (p_certification->>'year') !~ '^\d{4}$' then
      raise exception 'Year must be a valid four-digit year' using errcode = '22023';
    end if;
    certification_year := (p_certification->>'year')::integer;
    if certification_year not between 1800 and 2200 then
      raise exception 'Year must be between 1800 and 2200' using errcode = '22023';
    end if;
  end if;
  certificate_link := p_certification->>'certificate_url';
  fdp_link := p_certification->>'fdp_url';
  if certificate_link is not null and btrim(certificate_link) = '' then certificate_link := null; end if;
  if fdp_link is not null and btrim(fdp_link) = '' then fdp_link := null; end if;
  if (certificate_link is not null and (certificate_link !~* '^https?://[^[:space:]]+$' or certificate_link ~* '^https?://[^/]*@'))
    or (fdp_link is not null and (fdp_link !~* '^https?://[^[:space:]]+$' or fdp_link ~* '^https?://[^/]*@')) then
    raise exception 'Certificate and FDP links must be HTTP or HTTPS URLs' using errcode = '22023';
  end if;
  if p_id is null then
    select coalesce(max(display_order), 0) + 1 into next_position from public.certifications;
    insert into public.certifications(title,year,certificate_url,fdp_url,display_order)
    values(certification_title,certification_year,certificate_link,fdp_link,next_position)
    returning id into saved_id;
  else
    select * into previous from public.certifications
    where id = p_id and updated_at = p_expected_updated_at;
    if not found then
      raise exception 'Record changed or no longer exists; reload before saving' using errcode = 'P0001';
    end if;
    update public.certifications set title=certification_title,year=certification_year,
      certificate_url=certificate_link,fdp_url=fdp_link
    where id=p_id returning id into saved_id;
  end if;
  return saved_id;
end;
$$;

revoke all on function public.admin_save_certification(integer,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.admin_save_certification(integer,jsonb,timestamptz) to authenticated;

commit;
