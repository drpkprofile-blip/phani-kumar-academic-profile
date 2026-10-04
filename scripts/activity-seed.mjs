import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { root } from "./publication-seed.mjs";

export const migrationPath = "supabase/migrations/20261004000500_seed_activities.sql";
export function readCommittedActivities() {
  const source = execFileSync("git", ["show", "HEAD:data/activities.ts"], { cwd: root, encoding: "utf8" });
  assert.equal(readFileSync(`${root}/data/activities.ts`, "utf8").replaceAll("\r\n", "\n"), source.replaceAll("\r\n", "\n"));
  const exports = {};
  new Function("exports", "require", ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports, () => { throw new Error("Unexpected data import"); });
  return { activities: exports.activities, categories: exports.activityTypes };
}
export function mapActivities(activities) {
  assert.equal(activities.length, 46);
  const positions = new Map();
  return activities.map((a, i) => {
    const position = (positions.get(a.year) ?? 0) + 1;
    positions.set(a.year, position);
    return { id:i+1, year:a.year, title:a.title, activity_type:a.type,
      institution:a.institution, date_text:a.date ?? null, duration_text:a.duration ?? null,
      details:a.details ?? null, proof_url:a.proofUrl ?? null, source_order:i+1, display_order:position };
  });
}
export function buildActivityMigration(rows, categories) {
  const payload = JSON.stringify(rows, null, 2);
  const labels = JSON.stringify(categories);
  assert.ok(!payload.includes("$activity_seed$"));
  assert.ok(!labels.includes("$activity_categories$"));
  return `-- Generated solely from committed data/activities.ts by scripts/activity-seed.mjs.
-- Repeatable: exact existing rows are retained; conflicts abort without updates/deletes.
begin;
lock table public.activities in exclusive mode;
lock table public.activity_categories in share mode;
create temporary table phase3c_expected on commit drop as
select * from jsonb_to_recordset($activity_seed$${payload}$activity_seed$::jsonb)
as a(id integer, year text, title text, activity_type text, institution text,
date_text text, duration_text text, details text, proof_url text,
source_order integer, display_order integer);
do $$
begin
  if (select jsonb_agg(label order by display_order) from public.activity_categories)
    is distinct from $activity_categories$${labels}$activity_categories$::jsonb then
    raise exception 'Activity categories differ from committed source';
  end if;
  if exists(select 1 from public.activities a left join phase3c_expected e using(id)
    where e.id is null or (to_jsonb(a)-'created_at'-'updated_at') is distinct from to_jsonb(e)) then
    raise exception 'Existing activities conflict with source; no records changed';
  end if;
end;
$$;
insert into public.activities
(id,year,title,activity_type,institution,date_text,duration_text,details,proof_url,source_order,display_order)
select e.* from phase3c_expected e where not exists(select 1 from public.activities a where a.id=e.id);
do $$
begin
  if (select count(*) from public.activities) <> 46 or exists(
    select 1 from phase3c_expected e left join public.activities a using(id)
    where (to_jsonb(a)-'created_at'-'updated_at') is distinct from to_jsonb(e)) then
    raise exception 'Activity field-by-field verification failed';
  end if;
end;
$$;
select setval('public.activities_id_seq',greatest(
  (select max(id) from public.activities),(select last_value from public.activities_id_seq)),true);
commit;
`;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = readCommittedActivities();
  const sql = buildActivityMigration(mapActivities(source.activities), source.categories);
  if (process.argv.includes("--check")) assert.equal(readFileSync(`${root}/${migrationPath}`, "utf8").replaceAll("\r\n", "\n"),sql);
  else writeFileSync(`${root}/${migrationPath}`,sql);
  console.log("46-record Activities seed matches committed source.");
}
