import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const migrationPath = "supabase/migrations/20261004000200_seed_publications.sql";
const nullable = (value) => value === undefined || value === null || value === "" ? null : value;

export function readCommittedPublications() {
  const source = execFileSync("git", ["show", "HEAD:data/publications.ts"], { cwd: root, encoding: "utf8" });
  assert.equal(readFileSync(`${root}/data/publications.ts`, "utf8").replaceAll("\r\n", "\n"), source.replaceAll("\r\n", "\n"), "Static source must match the committed file");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  // Only the trusted, committed data module is evaluated; imports are forbidden.
  new Function("exports", "require", compiled)(exports, () => { throw new Error("Unexpected data dependency"); });
  return exports.publications;
}

export function mapPublications(publications) {
  assert.equal(publications.length, 37);
  assert.equal(new Set(publications.map((p) => p.id)).size, 37);
  const visible = [...publications].sort((a, b) => Number(b.year) - Number(a.year) || a.id - b.id);
  return publications.map((p, position) => {
    assert.equal(nullable(p.proof), null, "Phase 2C expects missing proofs");
    assert.equal(nullable(p.pdfUrl), null, "Phase 2C expects missing PDFs");
    return {
      id: p.id, title: p.title, year: p.year, journal: p.journal,
      indexing: [...p.indexing], doi: nullable(p.doi), article_url: nullable(p.url),
      proof_url: null, publication_type: nullable(p.type), impact_factor: nullable(p.impactFactor),
      source_order: position + 1, display_order: visible.findIndex((v) => v.id === p.id) + 1,
    };
  });
}

export function buildMigration(rows) {
  const payload = JSON.stringify(rows, null, 2);
  assert.ok(!payload.includes("$publication_seed$"));
  return `-- Generated only from committed data/publications.ts by scripts/publication-seed.mjs.
-- Repeatable: no updates/deletes; conflicting existing data aborts the transaction.
begin;
lock table public.publications in exclusive mode;
create temporary table phase2c_expected on commit drop as
select * from jsonb_to_recordset($publication_seed$${payload}$publication_seed$::jsonb)
as p(id integer, title text, year text, journal text, indexing text[], doi text,
article_url text, proof_url text, publication_type text, impact_factor numeric,
source_order integer, display_order integer);

do $$
begin
  if not exists (select 1 from public.publication_settings where id = true and hero_publications = '40+') then
    raise exception 'Independent hero counter must already be 40+';
  end if;
  if exists (
    select 1 from public.publications p left join phase2c_expected e using (id)
    where e.id is null or (to_jsonb(p) - 'created_at' - 'updated_at') is distinct from to_jsonb(e)
  ) then
    raise exception 'Existing publications conflict with the static source; no records changed';
  end if;
end;
$$;

insert into public.publications
(id,title,year,journal,indexing,doi,article_url,proof_url,publication_type,impact_factor,source_order,display_order)
select e.* from phase2c_expected e
where not exists (select 1 from public.publications p where p.id = e.id);

do $$
begin
  if (select count(*) from public.publications) <> 37 or exists (
    select 1 from phase2c_expected e left join public.publications p using(id)
    where (to_jsonb(p) - 'created_at' - 'updated_at') is distinct from to_jsonb(e)
  ) then
    raise exception 'Field-by-field seed verification failed';
  end if;
end;
$$;
-- Never rewind a sequence that may already have issued IDs.
select setval('public.publications_id_seq', greatest(
  (select max(id) from public.publications),
  (select last_value from public.publications_id_seq)
), true);
commit;
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sql = buildMigration(mapPublications(readCommittedPublications()));
  if (process.argv.includes("--check")) assert.equal(readFileSync(`${root}/${migrationPath}`, "utf8").replaceAll("\r\n", "\n"), sql);
  else writeFileSync(`${root}/${migrationPath}`, sql);
  console.log("37-record seed matches committed source.");
}
