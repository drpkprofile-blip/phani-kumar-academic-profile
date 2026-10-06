import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/render-profile.mjs";

test("Projects Guided public reads sort supplied academic years newest first and number the rendered order", async () => {
  const calls = [];
  const rows = [
    { id: 1, project_title: "Older", academic_year: "2023-24", display_order: 1 },
    { id: 2, project_title: "Newer", academic_year: "2025-26", display_order: 2 },
    { id: 3, project_title: "Undated", academic_year: null, display_order: 3 },
  ];
  const client = { from(table) {
    assert.equal(table, "projects_guided");
    const query = { select: () => query, order(field, options) {
      calls.push([field, options]);
      return query;
    }, then(resolve, reject) {
      const sorted = [...rows].sort((a, b) => (b.academic_year ?? "").localeCompare(a.academic_year ?? "") || a.display_order - b.display_order);
      return Promise.resolve({ data: sorted, error: null }).then(resolve, reject);
    } };
    return query;
  } };
  const helper = loadModule("lib/projects-guided.ts", { "./supabase/server": { createClient: async () => client } });
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const old = names.map((name) => process.env[name]);
  names.forEach((name) => process.env[name] = "configured-test");
  try {
    const projects = await helper.getPublicProjectsGuided();
    assert.deepEqual(calls, [
      ["academic_year", { ascending: false, nullsFirst: false }],
      ["display_order", { ascending: true }],
    ]);
    assert.deepEqual(projects.map(({ projectTitle, displayOrder }) => [projectTitle, displayOrder]), [
      ["Newer", 1], ["Older", 2], ["Undated", 3],
    ]);
  } finally {
    names.forEach((name, index) => old[index] === undefined ? delete process.env[name] : process.env[name] = old[index]);
  }
});
