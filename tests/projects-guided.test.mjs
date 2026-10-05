import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import { loadModule, compareProfile } from "./helpers/render-profile.mjs";

const validation = loadModule("lib/admin/project-guided-form.ts");
const makeForm = (overrides = {}) => {
  const form = new FormData();
  for (const [name, value] of Object.entries({ id: "", updated_at: "", project_title: "Thermal Storage Optimization", ...overrides })) form.set(name, value);
  return form;
};

function actionHarness({ denied = false, error = null } = {}) {
  const calls = [];
  const redirect = (path) => { throw Object.assign(new Error("Redirect"), { path }); };
  const supabase = { rpc: async (name, args) => { calls.push({ name, args }); return { data: 9, error }; } };
  return {
    calls,
    ...loadModule("app/admin/projects-guided/actions.ts", {
      "../../../lib/auth/admin-page": { requireAdminPage: async () => {
        if (denied) redirect("/admin/login");
        return { supabase };
      } },
      "next/navigation": { redirect },
      "next/cache": { revalidatePath: () => {} },
    }),
  };
}
const redirected = (callback, path) => assert.rejects(callback, (error) => error.path === path);

test("project form requires title and maps blank optional metadata to NULL", () => {
  const parsed = validation.parseProjectGuidedForm(makeForm({
    project_title: "  Data-driven thermal system  ", project_level: " ", degree_program: "B.Tech", branch: "",
    academic_year: "2026-27", batch: " ", student_names: " Asha Rao \n\n Kiran Das ", guide_name: " ", co_guide_names: " Meera ", proof_url: "",
  }));
  assert.deepEqual(parsed.errors, {});
  assert.equal(parsed.data.project_title, "  Data-driven thermal system  ");
  assert.equal(parsed.data.project_level, null);
  assert.equal(parsed.data.branch, null);
  assert.equal(parsed.data.batch, null);
  assert.equal(parsed.data.guide_name, null);
  assert.deepEqual(parsed.data.student_names, ["Asha Rao", "Kiran Das"]);
  assert.deepEqual(parsed.data.co_guide_names, ["Meera"]);
  assert.equal(Object.keys(validation.parseProjectGuidedForm(makeForm({ project_title: " \t " })).errors).length, 1);
});

test("project proof URLs are HTTP/HTTPS only and preserve their full text", () => {
  const proof = "https://drive.google.com/file/d/example/view?usp=drive_link&keep=1";
  assert.equal(validation.parseProjectGuidedForm(makeForm({ proof_url: proof })).data.proof_url, proof);
  for (const proof_url of ["javascript:alert(1)", "ftp://example.test/file", "https://user:pw@example.test/proof", "https://example.test/a b", " https://example.test"]) {
    assert.ok(validation.parseProjectGuidedForm(makeForm({ proof_url })).errors.proof_url, proof_url);
  }
});

test("every Projects Guided server mutation checks the existing admin authorization", async () => {
  await redirected(() => actionHarness({ denied: true }).saveProjectGuided({}, makeForm()), "/admin/login");
  await redirected(() => actionHarness({ denied: true }).deleteProjectGuided(makeForm({ id: "1", updated_at: "2026-10-05T00:00:00Z", confirmed: "yes" })), "/admin/login");
  await redirected(() => actionHarness({ denied: true }).moveProjectGuided(makeForm({ id: "1", order: "[1,2]", position: "2" })), "/admin/login");
});

test("create sends approved fields, ordered arrays, and leaves position/source order to the database", async () => {
  const helper = actionHarness();
  const proof = "https://example.test/proof?x=1&keep=2";
  await redirected(() => helper.saveProjectGuided({}, makeForm({ student_names: "Asha\nKiran", co_guide_names: "Meera\nHari", proof_url: proof, source_order: "2", display_order: "1" })), "/admin/projects-guided?success=added");
  assert.deepEqual(helper.calls[0], { name: "admin_save_project_guided", args: { p_project: {
    project_title: "Thermal Storage Optimization", project_level: null, degree_program: null, branch: null,
    academic_year: null, batch: null, student_names: ["Asha", "Kiran"], guide_name: null,
    co_guide_names: ["Meera", "Hari"], proof_url: proof,
  } } });
});

test("edit cannot alter position; reorder uses a complete order snapshot and deletion requires confirmation", async () => {
  const helper = actionHarness();
  const timestamp = "2026-10-05T00:00:00Z";
  await redirected(() => helper.saveProjectGuided({}, makeForm({ id: "4", updated_at: timestamp, display_order: "1" })), "/admin/projects-guided?success=saved");
  assert.equal(helper.calls[0].args.p_id, 4);
  assert.deepEqual(helper.calls[0].args.p_project.student_names, null);
  assert.equal("display_order" in helper.calls[0].args.p_project, false);
  await redirected(() => helper.moveProjectGuided(makeForm({ id: "2", order: "[1,2,3]", position: "1" })), "/admin/projects-guided?success=reordered");
  assert.deepEqual(helper.calls[1], { name: "admin_move_project_guided", args: { p_id: 2, p_position: 1, p_expected_order: [1, 2, 3] } });
  await redirected(() => actionHarness().deleteProjectGuided(makeForm({ id: "2", updated_at: timestamp })), "/admin/projects-guided?error=confirmation");
});

const section = (html) => html.match(/<section id="projects-guided".*?<\/section>/s)?.[0];
const publicBaseline = { publications: [], heroPublications: "40+" };

test("zero rows render the clean Projects Guided empty state without fake project cards", async () => {
  const html = section((await compareProfile(publicBaseline, undefined, undefined, undefined, undefined, [], [], true)).current);
  assert.match(html, /class="projects-guided-empty-state" role="status">No guided projects have been added yet\./);
  assert.equal((html.match(/class="project-guided-card"/g) ?? []).length, 0);
});

test("temporary project rendering preserves field and name order while omitting empty metadata and proof", async () => {
  const rows = [
    { id: 8, displayOrder: 1, projectTitle: "Synthetic Project A", projectLevel: "UG", degreeProgram: "B.Tech", branch: "Mechanical", academicYear: "2026-27", batch: "2023-27", studentNames: ["Asha Rao", "Kiran Das"], guideName: "Dr. Example", coGuideNames: ["Meera", "Hari"], proofUrl: "https://example.test/proof?keep=1&x=2" },
    { id: 9, displayOrder: 2, projectTitle: "Synthetic Project B" },
  ];
  const html = section((await compareProfile(publicBaseline, undefined, undefined, undefined, undefined, [], rows, true)).current);
  assert.equal((html.match(/class="project-guided-card"/g) ?? []).length, 2);
  assert.ok(html.indexOf("Synthetic Project A") < html.indexOf("Synthetic Project B"));
  assert.ok(html.indexOf("Asha Rao, Kiran Das") > -1);
  assert.ok(html.indexOf("Meera, Hari") > -1);
  assert.match(html, /href="https:\/\/example\.test\/proof\?keep=1&amp;x=2"/);
  assert.doesNotMatch(html, /Project level:|Course code:|No proof|Synthetic Project B[\s\S]*?href=/);
});

test("protected routes and empty database foundation are declared without seeded projects", () => {
  for (const path of ["app/admin/projects-guided/page.tsx", "app/admin/projects-guided/new/page.tsx", "app/admin/projects-guided/[id]/edit/page.tsx", "app/admin/projects-guided/[id]/delete/page.tsx"]) {
    assert.ok(existsSync(`${root}/${path}`), path);
  }
  assert.match(readFileSync(`${root}/app/admin/page.tsx`, "utf8"), /Manage Projects Guided/);
  const migration = readFileSync(`${root}/supabase/migrations/20261005001200_projects_guided_foundation.sql`, "utf8");
  assert.match(migration, /create table if not exists public\.projects_guided/);
  assert.match(migration, /for select to anon, authenticated using \(true\)/);
  assert.match(migration, /is_publications_admin\(\)/);
  assert.match(migration, /unique \(display_order\) deferrable initially immediate/);
  assert.doesNotMatch(migration, /insert into public\.projects_guided/i);
  assert.match(readFileSync(`${root}/supabase/tests/projects_guided_management.sql`, "utf8"), /Rollback fixture leaves table empty/);
});
