import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import { loadModule, compareProfile } from "./helpers/render-profile.mjs";

const defaultValues = { ug: 14, pg: 4 };
const base = { publications: [], heroPublications: "43+" };

function form(values = {}) {
  const result = new FormData();
  for (const [key, value] of Object.entries({ ug_project_count: "14", pg_project_count: "4", updated_at: "2026-10-01T00:00:00Z", ...values })) result.set(key, value);
  return result;
}

function actionHarness({ denied = false, rpcError = null } = {}) {
  const calls = [];
  const redirect = (path) => { throw Object.assign(new Error("Redirect"), { path }); };
  const supabase = { rpc: async (name, args) => { calls.push({ name, args }); return { data: null, error: rpcError }; } };
  return { calls, ...loadModule("app/admin/projects-guided/actions.ts", {
    "../../../lib/auth/admin-page": { requireAdminPage: async () => { if (denied) redirect("/admin/login"); return { supabase }; } },
    "next/navigation": { redirect }, "next/cache": { revalidatePath: () => {} },
  }) };
}

test("guided project counter validation accepts non-negative integers only", () => {
  const parse = loadModule("lib/admin/project-guided-counts-form.ts").parseProjectGuidedCounts;
  assert.deepEqual(parse(form({ ug_project_count: "0", pg_project_count: "2147483647" })), { ug: 0, pg: 2147483647, updatedAt: "2026-10-01T00:00:00Z" });
  for (const value of ["-1", "1.5", "", "01", "2147483648", "2x"]) assert.equal(parse(form({ ug_project_count: value })), null, value);
  assert.equal(parse(form({ updated_at: "invalid" })), null);
});

test("public hero counts load the independent saved values, not project row totals", async () => {
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const previous = names.map((name) => process.env[name]);
  names.forEach((name) => { process.env[name] = "configured-test-value"; });
  const calls = [];
  const client = { from(table) { calls.push(["from", table]); return { select() { return { eq(field, value) { calls.push(["eq", field, value]); return { single: async () => ({ data: { singleton: true, ug_project_count: 14, pg_project_count: 4, created_at: "2026-01-01", updated_at: "2026-01-01" }, error: null }) }; } }; } }; } };
  try {
    const { getPublicGuidedProjectCounts } = loadModule("lib/projects-guided-settings.ts", { "./supabase/server": { createClient: async () => client } });
    assert.deepEqual(await getPublicGuidedProjectCounts(), defaultValues);
    assert.deepEqual(calls, [["from", "project_guided_settings"], ["eq", "singleton", true]]);
  } finally {
    names.forEach((name, index) => { if (previous[index] === undefined) delete process.env[name]; else process.env[name] = previous[index]; });
  }
});

test("missing Supabase configuration keeps the supplied 14+ and 4+ counters", async () => {
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const previous = names.map((name) => process.env[name]);
  names.forEach((name) => delete process.env[name]);
  try {
    const { getPublicGuidedProjectCounts } = loadModule("lib/projects-guided-settings.ts", { "./supabase/server": { createClient: async () => { throw new Error("must not connect"); } } });
    assert.deepEqual(await getPublicGuidedProjectCounts(), defaultValues);
    const current = (await compareProfile(base, undefined, undefined, undefined, undefined, [], [], true)).current;
    assert.match(current, /<strong>14\+<\/strong><span>UG PROJECTS GUIDED<\/span>/);
    assert.match(current, /<strong>4\+<\/strong><span>PG PROJECTS GUIDED<\/span>/);
  } finally {
    names.forEach((name, index) => { if (previous[index] !== undefined) process.env[name] = previous[index]; });
  }
});

test("admin counter action requires authorization and changes only independent settings", async () => {
  const denied = actionHarness({ denied: true });
  await assert.rejects(denied.saveProjectGuidedCounts(form()), (error) => error.path === "/admin/login");
  const action = actionHarness();
  await assert.rejects(action.saveProjectGuidedCounts(form({ ug_project_count: "15", pg_project_count: "5" })), (error) => error.path === "/admin/projects-guided?success=counters");
  assert.deepEqual(action.calls, [{ name: "admin_update_project_guided_counts", args: {
    p_ug_project_count: 15, p_pg_project_count: 5, p_expected_updated_at: "2026-10-01T00:00:00Z",
  } }]);
  await assert.rejects(action.saveProjectGuidedCounts(form({ pg_project_count: "-1" })), (error) => error.path === "/admin/projects-guided?error=counters");
});

test("database migration seeds only supplied project counts and protects settings with admin RLS", () => {
  const migration = readFileSync(`${root}/supabase/migrations/20261006000400_public_gallery.sql`, "utf8");
  assert.match(migration, /insert into public\.project_guided_settings\(singleton, ug_project_count, pg_project_count\)\s*values \(true, 14, 4\)/);
  assert.match(migration, /for select to anon, authenticated using \(true\)/);
  assert.match(migration, /Allowlisted admins update guided project counters[\s\S]*?is_publications_admin\(\)/);
  assert.match(migration, /admin_update_project_guided_counts[\s\S]*?security definer set search_path = ''/);
  assert.match(readFileSync(`${root}/supabase/tests/projects_guided_counts_authorization.sql`, "utf8"), /rollback/i);
  assert.match(readFileSync(`${root}/app/admin/projects-guided/page.tsx`, "utf8"), /Update counts/);
});