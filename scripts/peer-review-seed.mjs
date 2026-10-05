import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { root } from "./publication-seed.mjs";

export const migrationPath = "supabase/migrations/20261005001500_seed_peer_reviews.sql";

export function readCommittedPeerReviews() {
  const committed = execFileSync("git", ["show", "HEAD:data/peer-reviews.ts"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(
    readFileSync(`${root}/data/peer-reviews.ts`, "utf8").replaceAll("\r\n", "\n"),
    committed.replaceAll("\r\n", "\n"),
    "Peer Reviews source must match the committed file",
  );
  const compiled = ts.transpileModule(committed, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function("exports", "require", compiled)(exports, () => {
    throw new Error("Unexpected Peer Reviews data dependency");
  });
  return exports.peerReviews;
}

export function mapPeerReviews(reviews) {
  assert.equal(reviews.length, 11);
  assert.ok(reviews.every((review) => typeof review === "string" && review.trim().length > 0));
  return reviews.map((review_text, index) => ({
    id: index + 1,
    review_text,
    source_order: index + 1,
    display_order: index + 1,
  }));
}

export function buildMigration(rows) {
  assert.equal(rows.length, 11);
  const payload = JSON.stringify(rows, null, 2);
  assert.ok(!payload.includes("$peer_review_seed$"));
  return `-- Generated solely from committed data/peer-reviews.ts by scripts/peer-review-seed.mjs.
-- Repeatable: exact existing rows and settings are retained; conflicts abort.
begin;
lock table public.peer_reviews in exclusive mode;
create temporary table phase_peer_reviews_expected on commit drop as
select * from jsonb_to_recordset($peer_review_seed$${payload}$peer_review_seed$::jsonb)
as r(id integer, review_text text, source_order integer, display_order integer);

do $$
begin
  if exists (
    select 1 from public.peer_reviews actual
    left join phase_peer_reviews_expected expected using (id)
    where expected.id is null
      or (to_jsonb(actual) - 'created_at' - 'updated_at') is distinct from to_jsonb(expected)
  ) then
    raise exception 'Existing Peer Reviews conflict with committed source; no rows changed';
  end if;
end;
$$;

insert into public.peer_reviews (id, review_text, source_order, display_order)
select expected.* from phase_peer_reviews_expected expected
where not exists (select 1 from public.peer_reviews actual where actual.id=expected.id);

insert into public.peer_review_settings (singleton, hero_counter_text, completed_reviews_count)
values (true, '16+', 16)
on conflict (singleton) do nothing;

do $$
begin
  if (select count(*) from public.peer_reviews) <> 11 or exists (
    select 1 from phase_peer_reviews_expected expected
    left join public.peer_reviews actual using (id)
    where (to_jsonb(actual) - 'created_at' - 'updated_at') is distinct from to_jsonb(expected)
  ) then
    raise exception 'Field-by-field Peer Reviews seed verification failed';
  end if;
  if (select count(distinct display_order) from public.peer_reviews) <> 11
     or (select min(display_order) from public.peer_reviews) <> 1
     or (select max(display_order) from public.peer_reviews) <> 11 then
    raise exception 'Peer Reviews display positions must be exactly 1 through 11';
  end if;
  if (select count(*) from public.peer_review_settings) <> 1
     or not exists (
       select 1 from public.peer_review_settings
       where singleton is true
         and hero_counter_text = '16+'
         and completed_reviews_count = 16
     ) then
    raise exception 'Peer Review settings conflict with the approved independent counters';
  end if;
end;
$$;

select setval('public.peer_reviews_id_seq', greatest(
  (select max(id) from public.peer_reviews),
  (select last_value from public.peer_reviews_id_seq)
), true);
commit;
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sql = buildMigration(mapPeerReviews(readCommittedPeerReviews()));
  const path = `${root}/${migrationPath}`;
  if (process.argv.includes("--check")) {
    assert.equal(readFileSync(path, "utf8").replaceAll("\r\n", "\n"), sql);
  } else {
    writeFileSync(path, sql);
  }
  console.log("11-record Peer Reviews seed matches the committed source.");
}
