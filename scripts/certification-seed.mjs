import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { root } from "./publication-seed.mjs";

export const migrationPath = "supabase/migrations/20261005000200_seed_certifications.sql";
const nullable = (value) => value === undefined || value === null ? null : value;

export function readCommittedCertifications() {
  const source = execFileSync("git", ["show", "HEAD:data/certifications.ts"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(
    readFileSync(`${root}/data/certifications.ts`, "utf8").replaceAll("\r\n", "\n"),
    source.replaceAll("\r\n", "\n"),
    "Certifications source must match the committed file",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function("exports", "require", compiled)(exports, () => {
    throw new Error("Unexpected certification data dependency");
  });
  return exports.certifications;
}

export function mapCertifications(certifications) {
  assert.equal(certifications.length, 13);
  assert.equal(new Set(certifications.map((record) => record.number)).size, 13);
  return certifications.map((record, index) => {
    assert.equal(record.number, index + 1, "Static number must match original array order");
    return {
      id: index + 1,
      title: record.title,
      certificate_url: nullable(record.certificateUrl),
      fdp_url: nullable(record.fdpUrl),
      source_order: index + 1,
      display_order: index + 1,
    };
  });
}

export function buildMigration(rows) {
  const payload = JSON.stringify(rows, null, 2);
  assert.ok(!payload.includes("$certification_seed$"));
  return `-- Generated solely from committed data/certifications.ts by scripts/certification-seed.mjs.
-- Repeatable: exact existing rows are retained; conflicting or extra rows abort.
begin;
lock table public.certifications in exclusive mode;
create temporary table phase4c_expected on commit drop as
select * from jsonb_to_recordset($certification_seed$${payload}$certification_seed$::jsonb)
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
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sql = buildMigration(mapCertifications(readCommittedCertifications()));
  const path = `${root}/${migrationPath}`;
  if (process.argv.includes("--check")) {
    assert.equal(readFileSync(path, "utf8").replaceAll("\r\n", "\n"), sql);
  } else {
    writeFileSync(path, sql);
  }
  console.log("13-record certification seed matches the committed source.");
}
