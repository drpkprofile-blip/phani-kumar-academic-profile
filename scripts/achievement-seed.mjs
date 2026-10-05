import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { root } from "./publication-seed.mjs";

export const migrationPath = "supabase/migrations/20261005000500_seed_achievements.sql";
const nullable = (value) => value === undefined || value === null ? null : value;

export function readCommittedAchievements() {
  const source = execFileSync("git", ["show", "HEAD:data/achievements.ts"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(
    readFileSync(`${root}/data/achievements.ts`, "utf8").replaceAll("\r\n", "\n"),
    source.replaceAll("\r\n", "\n"),
    "Achievements source must match the committed file",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function("exports", "require", compiled)(exports, () => {
    throw new Error("Unexpected Achievements data dependency");
  });
  return exports.achievements;
}

export function mapAchievements(achievements) {
  assert.equal(achievements.length, 4);
  assert.deepEqual(achievements.map((record) => record.number), ["01", "02", "03", "04"]);
  return achievements.map((record, index) => ({
    id: index + 1,
    title: record.title,
    description: record.text,
    proof_url: nullable(record.proof),
    extra_proof_url: nullable(record.extraProof),
    source_order: index + 1,
    display_order: index + 1,
  }));
}

export function buildMigration(rows) {
  const payload = JSON.stringify(rows, null, 2);
  assert.ok(!payload.includes("$achievement_seed$"));
  return `-- Generated solely from committed data/achievements.ts by scripts/achievement-seed.mjs.
-- Repeatable: exact existing rows are retained; conflicting or extra rows abort.
begin;
lock table public.achievements in exclusive mode;
create temporary table phase8c_expected on commit drop as
select * from jsonb_to_recordset($achievement_seed$${payload}$achievement_seed$::jsonb)
as a(id integer, title text, description text, proof_url text, extra_proof_url text,
source_order integer, display_order integer);

do $$
begin
  if exists (
    select 1 from public.achievements a left join phase8c_expected e using (id)
    where e.id is null
      or (to_jsonb(a) - 'created_at' - 'updated_at') is distinct from to_jsonb(e)
  ) then
    raise exception 'Existing achievements conflict with committed source; no rows changed';
  end if;
end;
$$;

insert into public.achievements
(id,title,description,proof_url,extra_proof_url,source_order,display_order)
select e.* from phase8c_expected e
where not exists (select 1 from public.achievements a where a.id=e.id);

do $$
begin
  if (select count(*) from public.achievements) <> 4 or exists (
    select 1 from phase8c_expected e left join public.achievements a using (id)
    where (to_jsonb(a) - 'created_at' - 'updated_at') is distinct from to_jsonb(e)
  ) then
    raise exception 'Field-by-field Achievements seed verification failed';
  end if;
  if (select count(distinct display_order) from public.achievements) <> 4
     or (select min(display_order) from public.achievements) <> 1
     or (select max(display_order) from public.achievements) <> 4 then
    raise exception 'Achievements display positions must be exactly 1 through 4';
  end if;
end;
$$;

-- Never rewind a sequence that may already have issued IDs.
select setval('public.achievements_id_seq', greatest(
  (select max(id) from public.achievements),
  (select last_value from public.achievements_id_seq)
), true);
commit;
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sql = buildMigration(mapAchievements(readCommittedAchievements()));
  const path = `${root}/${migrationPath}`;
  if (process.argv.includes("--check")) {
    assert.equal(readFileSync(path, "utf8").replaceAll("\r\n", "\n"), sql);
  } else {
    writeFileSync(path, sql);
  }
  console.log("4-record Achievements seed matches the committed source.");
}
