import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { root } from "../scripts/publication-seed.mjs";
import { compareProfile, loadModule } from "./helpers/render-profile.mjs";

const migration = readFileSync(`${root}/supabase/migrations/20261006000700_profile_visit_counter.sql`, "utf8");
const databaseTests = readFileSync(`${root}/supabase/tests/profile_visits_rls.sql`, "utf8");

test("profile visit counter exposes only its aggregate and protects direct writes", () => {
  assert.match(migration, /create table public\.profile_visit_counter/);
  assert.match(migration, /total_visits bigint not null default 0 check \(total_visits >= 0\)/);
  assert.match(migration, /alter table public\.profile_visit_counter enable row level security/);
  assert.match(migration, /for select to anon, authenticated\s+using \(true\)/);
  assert.match(migration, /revoke all on table public\.profile_visit_counter from public, anon, authenticated/);
  assert.match(migration, /security definer\s+set search_path = ''/);
  assert.match(migration, /grant execute on function public\.record_profile_visit\(\) to anon, authenticated/);
  assert.match(migration, /no visitor identifiers are stored/i);
  assert.match(databaseTests, /select plan\(8\)/);
  assert.match(databaseTests, /Anonymous direct updates are denied/);
  assert.match(databaseTests, /Neither public role can write the counter table directly/);
  assert.match(databaseTests, /rollback;/i);
});

test("public count reader returns the aggregate and safely falls back without Supabase config", async () => {
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const old = names.map((name) => process.env[name]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  try {
    let queriedTable;
    const helper = loadModule("lib/profile-visits.ts", { "./supabase/server": { createClient: async () => ({
      from(table) {
        queriedTable = table;
        return { select(fields) { assert.equal(fields, "total_visits"); return { eq(column, value) {
          assert.equal(column, "singleton"); assert.equal(value, true);
          return { single: async () => ({ data: { total_visits: 4721 }, error: null }) };
        } }; } };
      },
      rpc: async () => ({ data: 4722, error: null }),
    }) } });
    assert.equal(await helper.getPublicProfileVisitCount(), 4721);
    assert.equal(queriedTable, "profile_visit_counter");
    assert.equal(await helper.recordProfileVisit(), 4722);
  } finally {
    names.forEach((name, index) => { if (old[index] === undefined) delete process.env[name]; else process.env[name] = old[index]; });
  }

  const fallbackOld = names.map((name) => process.env[name]);
  try {
    names.forEach((name) => { delete process.env[name]; });
    const fallback = loadModule("lib/profile-visits.ts", { "./supabase/server": { createClient: async () => {
      throw new Error("Must not create a client while unconfigured");
    } } });
    assert.equal(await fallback.getPublicProfileVisitCount(), 0);
  } finally {
    names.forEach((name, index) => { if (fallbackOld[index] === undefined) delete process.env[name]; else process.env[name] = fallbackOld[index]; });
  }
});

test("visit endpoint accepts same-origin requests and rejects cross-origin posts", async () => {
  let calls = 0;
  const route = loadModule("app/api/profile-visits/route.ts", {
    "../../../lib/profile-visits": { recordProfileVisit: async () => { calls += 1; return 48; } },
  });

  const response = await route.POST(new Request("https://profile.example/api/profile-visits", {
    method: "POST", headers: { origin: "https://profile.example" },
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { count: 48 });
  assert.equal(response.headers.get("cache-control"), "no-store");

  const rejected = await route.POST(new Request("https://profile.example/api/profile-visits", {
    method: "POST", headers: { origin: "https://another.example" },
  }));
  assert.equal(rejected.status, 403);
  assert.equal(calls, 1);
});

test("public home shows a session-counted Profile Visits stat", async () => {
  const rendered = await compareProfile({ publications: [], heroPublications: "43+" });
  assert.match(rendered.rawCurrent, /class="profile-visit-counter"/);
  assert.match(rendered.rawCurrent, /Profile visits/);
  assert.match(rendered.rawCurrent, />123<\/strong>/);

  const client = readFileSync(`${root}/app/profile-visit-counter.tsx`, "utf8");
  assert.match(client, /sessionStorage\.getItem\(sessionKey\)/);
  assert.match(client, /sessionStorage\.setItem\(sessionKey, "1"\)/);
  assert.match(client, /fetch\("\/api\/profile-visits", \{ method: "POST", cache: "no-store" \}\)/);
});
