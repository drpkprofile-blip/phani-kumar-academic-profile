import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import { loadModule } from "./helpers/render-profile.mjs";

const validation = loadModule("lib/admin/certification-form.ts");
function form(overrides = {}) {
  const values = new FormData();
  for (const [name, value] of Object.entries({ id: "", updated_at: "", title: "Test certification", certificate_url: "", fdp_url: "", ...overrides })) {
    values.set(name, value);
  }
  return values;
}

function actionHarness({ denied = false, error = null } = {}) {
  const calls = [];
  const revalidated = [];
  const redirect = (path) => { throw Object.assign(new Error("Redirect"), { path }); };
  const supabase = { rpc: async (name, args) => { calls.push({ name, args }); return { data: 100, error }; } };
  return {
    calls,
    revalidated,
    ...loadModule("app/admin/certifications/actions.ts", {
      "../../../lib/auth/admin-page": {
        requireAdminPage: async () => {
          if (denied) redirect("/admin/login");
          return { supabase };
        },
      },
      "next/navigation": { redirect },
      "next/cache": { revalidatePath: (...args) => revalidated.push(args) },
    }),
  };
}

const redirected = (callback, path) => assert.rejects(callback, (error) => error.path === path);

test("certification form normalizes only empty URLs to NULL and preserves supplied query strings", () => {
  const url = "https://drive.google.com/file/d/example/view?usp=drive_link&source=certification";
  const parsed = validation.parseCertificationForm(form({
    title: "  Exact title  ", certificate_url: url, fdp_url: "  ",
  }));
  assert.deepEqual(parsed.errors, {});
  assert.deepEqual(parsed.data, { title: "  Exact title  ", certificate_url: url, fdp_url: null });
  assert.deepEqual(validation.parseCertificationForm(form({ certificate_url: "\t", fdp_url: " " })).data,
    { title: "Test certification", certificate_url: null, fdp_url: null });
});

test("certification form rejects blank titles and invalid or non-HTTP URLs", () => {
  for (const overrides of [
    { title: " \t " },
    { certificate_url: "javascript:alert(1)" },
    { fdp_url: "ftp://example.test/file" },
    { certificate_url: "https://user:secret@example.test/file" },
    { fdp_url: "https://example.test/has space" },
  ]) assert.ok(Object.keys(validation.parseCertificationForm(form(overrides)).errors).length > 0);
});

test("all certification server actions require the allowlisted admin before a write", async () => {
  const calls = [
    ["saveCertification", () => actionHarness({ denied: true }).saveCertification({}, form())],
    ["deleteCertification", () => actionHarness({ denied: true }).deleteCertification(form({ id: "14", updated_at: "2026-10-05T00:00:00Z", confirmed: "yes" }))],
    ["moveCertification", () => actionHarness({ denied: true }).moveCertification(form({ id: "1", order: "[1,2]", position: "2" }))],
  ];
  for (const [, invoke] of calls) await redirected(invoke, "/admin/login");
});

test("admin create stores nullable URLs and lets the database assign source and final order", async () => {
  const helper = actionHarness();
  const url = "https://example.test/certificate?usp=drive_link&x=1";
  await redirected(() => helper.saveCertification({}, form({
    certificate_url: url, fdp_url: "", source_order: "55", display_order: "2",
  })), "/admin/certifications?success=added");
  assert.equal(helper.calls[0].name, "admin_save_certification");
  assert.deepEqual(helper.calls[0].args, {
    p_certification: { title: "Test certification", certificate_url: url, fdp_url: null },
  });
  assert.deepEqual(helper.revalidated, [["/"], ["/admin", "layout"]]);
});

test("admin edit sends only title and URLs and does not send a display position", async () => {
  const helper = actionHarness();
  const timestamp = "2026-10-05T00:00:00Z";
  await redirected(() => helper.saveCertification({}, form({
    id: "9", updated_at: timestamp, title: "Edited title", certificate_url: "", fdp_url: "https://example.test/fdp?x=2",
  })), "/admin/certifications?success=saved");
  assert.deepEqual(helper.calls[0].args, {
    p_certification: { title: "Edited title", certificate_url: null, fdp_url: "https://example.test/fdp?x=2" },
    p_id: 9, p_expected_updated_at: timestamp,
  });
});

test("delete requires confirmation and invokes the transactional resequencing function", async () => {
  const helper = actionHarness();
  const details = { id: "14", updated_at: "2026-10-05T00:00:00Z" };
  await redirected(() => helper.deleteCertification(form(details)), "/admin/certifications?error=confirmation");
  assert.deepEqual(helper.calls, []);
  await redirected(() => helper.deleteCertification(form({ ...details, confirmed: "yes" })), "/admin/certifications?success=deleted");
  assert.deepEqual(helper.calls[0], {
    name: "admin_delete_certification",
    args: { p_id: 14, p_expected_updated_at: details.updated_at, p_confirmed: true },
  });
});

test("reorder sends a full snapshot and rejects invalid or duplicate positions", async () => {
  const helper = actionHarness();
  await redirected(() => helper.moveCertification(form({ id: "2", order: "[1,2,3]", direction: "down" })),
    "/admin/certifications?success=reordered");
  assert.deepEqual(helper.calls[0], {
    name: "admin_move_certification", args: { p_id: 2, p_position: 3, p_expected_order: [1, 2, 3] },
  });
  const invalid = actionHarness();
  await redirected(() => invalid.moveCertification(form({ id: "2", order: "[1,2,2]", position: "1" })),
    "/admin/certifications?error=stale");
  assert.deepEqual(invalid.calls, []);
});

test("Certifications database suite covers read-only visitors, admin CRUD, safe order and unchanged originals", async () => {
  const migration = await import("node:fs").then(({ readFileSync }) => readFileSync("supabase/migrations/20261005000300_certifications_management.sql", "utf8"));
  const databaseTests = await import("node:fs").then(({ readFileSync }) => readFileSync("supabase/tests/certifications_management.sql", "utf8"));
  for (const phrase of ["admin_save_certification", "admin_delete_certification", "admin_move_certification", "is_publications_admin()", "certifications_display_order_unique deferred"]) {
    assert.ok(migration.includes(phrase), `Missing management function/policy: ${phrase}`);
  }
  for (const phrase of ["original 13 certifications are present", "Anonymous certification actions are denied", "Authenticated non-admin certification actions are denied", "Admin can create a certification", "Admin can edit title and links", "Admin can transactionally reorder", "Deleting a record compacts", "original 13 records and their metadata, order and timestamps remain unchanged"]) {
    assert.ok(databaseTests.includes(phrase), `Missing database test: ${phrase}`);
  }
});

test("protected Certifications routes and admin dashboard link are present", () => {
  const routes = [
    ["/admin/certifications", "app/admin/certifications/page.tsx"],
    ["/admin/certifications/new", "app/admin/certifications/new/page.tsx"],
    ["/admin/certifications/[id]/edit", "app/admin/certifications/[id]/edit/page.tsx"],
    ["/admin/certifications/[id]/delete", "app/admin/certifications/[id]/delete/page.tsx"],
  ];
  for (const [route, file] of routes) {
    assert.ok(existsSync(`${root}/${file}`), `Missing route ${route}`);
    assert.ok(readFileSync(`${root}/${file}`, "utf8").includes("requireAdminPage"), `${route} must verify admin server-side`);
  }
  assert.match(readFileSync(`${root}/app/admin/page.tsx`, "utf8"), /href="\/admin\/certifications"/);
});
