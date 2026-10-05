import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import { loadModule, compareProfile } from "./helpers/render-profile.mjs";
import { readCommittedPublications } from "../scripts/publication-seed.mjs";

const validation = loadModule("lib/admin/subject-taught-form.ts");
const validValues = {
  id: "", updated_at: "", subject_name: "Heat Transfer", course_code: "ME401", program: "B.Tech",
  branch: "Mechanical Engineering", semester: "VII", academic_year: "2026-27", subject_type: "Theory", proof_url: "",
};
const makeForm = (overrides = {}) => {
  const form = new FormData();
  for (const [name, value] of Object.entries({ ...validValues, ...overrides })) form.set(name, value);
  return form;
};

function actionHarness({ denied = false, error = null } = {}) {
  const calls = [];
  const revalidated = [];
  const redirect = (path) => { throw Object.assign(new Error("Redirect"), { path }); };
  const supabase = { rpc: async (name, args) => { calls.push({ name, args }); return { data: 9, error }; } };
  return {
    calls, revalidated,
    ...loadModule("app/admin/subjects-taught/actions.ts", {
      "../../../lib/auth/admin-page": { requireAdminPage: async () => {
        if (denied) redirect("/admin/login");
        return { supabase };
      } },
      "next/navigation": { redirect },
      "next/cache": { revalidatePath: (...args) => revalidated.push(args) },
    }),
  };
}
const redirected = (callback, path) => assert.rejects(callback, (error) => error.path === path);

test("subject form requires a nonblank name and preserves optional free text", () => {
  const parsed = validation.parseSubjectTaughtForm(makeForm({
    subject_name: "  Heat Transfer  ", course_code: "  ME-401 ", semester: "",
    proof_url: "https://example.test/proof?x=1&y=2",
  }));
  assert.deepEqual(parsed.errors, {});
  assert.equal(parsed.data.subject_name, "  Heat Transfer  ");
  assert.equal(parsed.data.course_code, "  ME-401 ");
  assert.equal(parsed.data.semester, null);
  assert.equal(parsed.data.proof_url, "https://example.test/proof?x=1&y=2");
  assert.equal(Object.values(validation.parseSubjectTaughtForm(makeForm({ subject_name: " \t " })).errors).length, 1);
});

test("subject form maps every empty optional value to NULL and rejects unsafe proof URLs", () => {
  const empty = validation.parseSubjectTaughtForm(makeForm({
    course_code: "", program: " ", branch: "", semester: "", academic_year: "", subject_type: "", proof_url: "",
  }));
  assert.deepEqual(empty.data, {
    subject_name: "Heat Transfer", course_code: null, program: null, branch: null, semester: null,
    academic_year: null, subject_type: null, proof_url: null,
  });
  for (const proof_url of ["javascript:alert(1)", "ftp://example.test", "https://user:pw@example.test", "https://example.test/a b", " https://example.test"]) {
    assert.ok(validation.parseSubjectTaughtForm(makeForm({ proof_url })).errors.proof_url, proof_url);
  }
});

test("every Subjects Taught server mutation verifies admin authorization first", async () => {
  await redirected(() => actionHarness({ denied: true }).saveSubjectTaught({}, makeForm()), "/admin/login");
  await redirected(() => actionHarness({ denied: true }).deleteSubjectTaught(makeForm({ id: "1", updated_at: "2026-10-05T00:00:00Z", confirmed: "yes" })), "/admin/login");
  await redirected(() => actionHarness({ denied: true }).moveSubjectTaught(makeForm({ id: "1", order: "[1,2]", position: "2" })), "/admin/login");
});

test("create sends only approved fields and leaves source order and position assignment to the database", async () => {
  const helper = actionHarness();
  const proof = "https://drive.google.com/file/d/example/view?usp=drive_link&keep=1";
  await redirected(() => helper.saveSubjectTaught({}, makeForm({ proof_url: proof, source_order: "4", display_order: "1" })), "/admin/subjects-taught?success=added");
  assert.deepEqual(helper.calls[0], { name: "admin_save_subject_taught", args: { p_subject: {
    subject_name: "Heat Transfer", course_code: "ME401", program: "B.Tech", branch: "Mechanical Engineering",
    semester: "VII", academic_year: "2026-27", subject_type: "Theory", proof_url: proof,
  } } });
  assert.deepEqual(helper.revalidated, [["/"], ["/admin", "layout"]]);
});

test("edit updates metadata and timestamp but cannot send or change display order", async () => {
  const helper = actionHarness();
  const timestamp = "2026-10-05T00:00:00Z";
  await redirected(() => helper.saveSubjectTaught({}, makeForm({ id: "4", updated_at: timestamp, subject_name: "Edited", display_order: "1", source_order: "9" })), "/admin/subjects-taught?success=saved");
  assert.deepEqual(helper.calls[0].args, {
    p_subject: { subject_name: "Edited", course_code: "ME401", program: "B.Tech", branch: "Mechanical Engineering", semester: "VII", academic_year: "2026-27", subject_type: "Theory", proof_url: null },
    p_id: 4, p_expected_updated_at: timestamp,
  });
});

test("reorder calls transactional database action and confirmed delete requires explicit checkbox", async () => {
  const helper = actionHarness();
  await redirected(() => helper.moveSubjectTaught(makeForm({ id: "2", order: "[1,2,3]", position: "1" })), "/admin/subjects-taught?success=reordered");
  assert.deepEqual(helper.calls[0], { name: "admin_move_subject_taught", args: { p_id: 2, p_position: 1, p_expected_order: [1, 2, 3] } });
  await redirected(() => actionHarness().deleteSubjectTaught(makeForm({ id: "2", updated_at: "2026-10-05T00:00:00Z" })), "/admin/subjects-taught?error=confirmation");
});

const sectionHtml = (html) => html.match(/<section id="subjects-taught".*?<\/section>/s)?.[0];
const publicBaseline = {
  publications: readCommittedPublications().sort((a, b) => Number(b.year) - Number(a.year) || a.id - b.id),
  heroPublications: "40+",
};

test("zero rows render a professional empty state without fake cards", async () => {
  const html = sectionHtml((await compareProfile(publicBaseline, undefined, undefined, undefined, undefined, [])).current);
  assert.match(html, /id="subjects-taught"/);
  assert.match(html, /class="subjects-empty-state" role="status">No subjects have been added yet\.</);
  assert.equal((html.match(/class="subject-taught-card"/g) ?? []).length, 0);
});

test("synthetic subject records render optional metadata and exact proof URL", async () => {
  const rows = [
    { id: 11, displayOrder: 1, subjectName: "Temporary test subject A", subjectType: "Theory", courseCode: "ME401", program: "B.Tech", branch: "Mechanical", semester: "VII", academicYear: "2026-27", proofUrl: "https://example.test/proof?x=1&keep=2" },
    { id: 12, displayOrder: 2, subjectName: "Temporary test subject B" },
  ];
  const html = sectionHtml((await compareProfile(publicBaseline, undefined, undefined, undefined, undefined, rows)).current);
  assert.equal((html.match(/class="subject-taught-card"/g) ?? []).length, 2);
  assert.ok(html.indexOf("Temporary test subject A") < html.indexOf("Temporary test subject B"));
  assert.match(html, /href="https:\/\/example\.test\/proof\?x=1&amp;keep=2"/);
  assert.match(html, /ME401/);
});

test("all protected admin routes and dashboard card exist, and the table is only declared with zero initial data", () => {
  const paths = [
    "app/admin/subjects-taught/page.tsx", "app/admin/subjects-taught/new/page.tsx",
    "app/admin/subjects-taught/[id]/edit/page.tsx", "app/admin/subjects-taught/[id]/delete/page.tsx",
  ];
  for (const path of paths) assert.ok(existsSync(`${root}/${path}`), path);
  assert.match(readFileSync(`${root}/app/admin/page.tsx`, "utf8"), /Manage Subjects Taught/);
  const migrations = readFileSync(`${root}/supabase/migrations/20261005001000_subjects_taught_foundation.sql`, "utf8");
  assert.match(migrations, /create table if not exists public\.subjects_taught/);
  assert.match(migrations, /for select to anon, authenticated using \(true\)/);
  assert.match(migrations, /is_publications_admin\(\)/);
  assert.match(migrations, /unique \(display_order\) deferrable initially immediate/);
  assert.doesNotMatch(migrations, /insert into public\.subjects_taught/i);
  assert.match(readFileSync(`${root}/supabase/tests/subjects_taught_rls.sql`, "utf8"), /Anonymous direct insert is denied/);
  assert.match(readFileSync(`${root}/supabase/tests/subjects_taught_management.sql`, "utf8"), /Rollback fixture leaves table empty/);
});
