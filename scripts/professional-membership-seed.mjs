import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { root } from "./publication-seed.mjs";

export const migrationPath = "supabase/migrations/20261005000900_seed_professional_membership.sql";
export function readProfessionalMemberships() {
  const source = readFileSync(`${root}/data/professional-memberships.ts`, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function("exports", "require", compiled)(exports, () => { throw new Error("Unexpected membership data dependency"); });
  assert.equal(exports.professionalMemberships.length, 1, "There is exactly one supplied membership record");
  return exports.professionalMemberships;
}

export function mapProfessionalMemberships(records = readProfessionalMemberships()) {
  return records.map((record, index) => ({
    id: index + 1,
    organization_name: record.organizationName,
    membership_type: record.membershipType ?? null,
    membership_number: record.membershipNumber ?? null,
    date_text: record.dateText ?? null,
    validity_text: record.validityText ?? null,
    designation: record.designation ?? null,
    chapter: record.chapter ?? null,
    proof_url: record.proofUrl ?? null,
    source_order: index + 1,
    display_order: index + 1,
  }));
}

export function buildSeedMigration(rows = mapProfessionalMemberships()) {
  assert.equal(rows.length, 1);
  const row = rows[0];
  assert.equal(row.organization_name, "Condition Monitoring Society of India (MCMSI)");
  assert.equal(row.membership_type, "Member");
  for (const field of ["membership_number", "date_text", "validity_text", "designation", "chapter", "proof_url"]) assert.equal(row[field], null);
  return `-- Generated from data/professional-memberships.ts by scripts/professional-membership-seed.mjs.
-- Repeatable: the exact supplied row is retained; conflicting or extra rows abort.
begin;
lock table public.professional_memberships in exclusive mode;

do $$
begin
  if exists (
    select 1 from public.professional_memberships m
    where m.id <> ${row.id}
      or m.organization_name <> ${sql(row.organization_name)}
      or m.membership_type is distinct from ${sql(row.membership_type)}
      or m.membership_number is not null or m.date_text is not null
      or m.validity_text is not null or m.designation is not null
      or m.chapter is not null or m.proof_url is not null
      or m.source_order is distinct from ${row.source_order} or m.display_order is distinct from ${row.display_order}
  ) then
    raise exception 'Professional membership rows conflict with the supplied record; seed made no changes';
  end if;
end;
$$;

insert into public.professional_memberships
  (id,organization_name,membership_type,source_order,display_order)
select ${row.id},${sql(row.organization_name)},${sql(row.membership_type)},${row.source_order},${row.display_order}
where not exists (select 1 from public.professional_memberships);

do $$
begin
  if (select count(*) from public.professional_memberships) <> 1
    or not exists (select 1 from public.professional_memberships
      where id=${row.id} and organization_name=${sql(row.organization_name)}
        and membership_type=${sql(row.membership_type)} and membership_number is null and date_text is null
        and validity_text is null and designation is null and chapter is null
        and proof_url is null and source_order=${row.source_order} and display_order=${row.display_order}) then
    raise exception 'Professional membership seed verification failed';
  end if;
end;
$$;

select setval('public.professional_memberships_id_seq', greatest(
  (select max(id) from public.professional_memberships),
  (select last_value from public.professional_memberships_id_seq)
), true);
commit;
`;
}

function sql(value) { return `'${String(value).replaceAll("'", "''")}'`; }
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const generated = buildSeedMigration();
  const path = `${root}/${migrationPath}`;
  if (process.argv.includes("--check")) assert.equal(readFileSync(path, "utf8").replaceAll("\r\n", "\n"), generated);
  else writeFileSync(path, generated);
  console.log("One supplied Professional Bodies record maps exactly to the guarded seed migration.");
}
