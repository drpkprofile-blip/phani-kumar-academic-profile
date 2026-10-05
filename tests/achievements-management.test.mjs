import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import { loadModule } from "./helpers/render-profile.mjs";

const validation = loadModule("lib/admin/achievement-form.ts");
const blankForm = (overrides = {}) => {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    id: "", updated_at: "", title: "Achievement title", description: "Achievement description",
    proof_url: "", extra_proof_url: "", ...overrides,
  })) form.set(name, value);
  return form;
};

function actionHarness({ denied = false, error = null } = {}) {
  const calls = [];
  const revalidated = [];
  const redirect = (path) => { throw Object.assign(new Error("Redirect"), { path }); };
  const supabase = { rpc: async (name, args) => { calls.push({ name, args }); return { data: 999, error }; } };
  return {
    calls,
    revalidated,
    ...loadModule("app/admin/achievements/actions.ts", {
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

test("achievement form preserves supplied text and exact URLs while mapping empty links to NULL", () => {
  const proof = "https://drive.google.com/file/d/example/view?usp=drive_link&source=achievement";
  const parsed = validation.parseAchievementForm(blankForm({
    title: "  Exact title  ", description: "Exact description\nsecond line", proof_url: proof, extra_proof_url: "  ",
  }));
  assert.deepEqual(parsed.errors, {});
  assert.deepEqual(parsed.data, {
    title: "  Exact title  ", description: "Exact description\nsecond line", proof_url: proof, extra_proof_url: null,
  });
  assert.deepEqual(validation.parseAchievementForm(blankForm({ proof_url: "\t", extra_proof_url: "" })).data,
    { title: "Achievement title", description: "Achievement description", proof_url: null, extra_proof_url: null });
});

test("achievement form rejects blank title/description and unsafe or malformed URLs", () => {
  for (const overrides of [
    { title: " \t " },
    { description: "  \n" },
    { proof_url: "javascript:alert(1)" },
    { extra_proof_url: "ftp://example.test/proof" },
    { proof_url: "https://user:secret@example.test/file" },
    { extra_proof_url: "https://example.test/has space" },
  ]) assert.ok(Object.keys(validation.parseAchievementForm(blankForm(overrides)).errors).length > 0);
});

test("every achievement server action requires the allowlisted admin before a write", async () => {
  await redirected(() => actionHarness({ denied: true }).saveAchievement({}, blankForm()), "/admin/login");
  await redirected(() => actionHarness({ denied: true }).deleteAchievement(blankForm({ id: "4", updated_at: "2026-10-05T00:00:00Z", confirmed: "yes" })), "/admin/login");
  await redirected(() => actionHarness({ denied: true }).moveAchievement(blankForm({ id: "1", order: "[1,2,3,4]", position: "2" })), "/admin/login");
});

test("admin create sends only approved fields and lets the database assign NULL source/order", async () => {
  const helper = actionHarness();
  const proof = "https://drive.google.com/file/d/example/view?usp=drive_link&source=keep";
  await redirected(() => helper.saveAchievement({}, blankForm({
    proof_url: proof, extra_proof_url: "", source_order: "99", display_order: "1",
  })), "/admin/achievements?success=added");
  assert.deepEqual(helper.calls[0], {
    name: "admin_save_achievement",
    args: { p_achievement: {
      title: "Achievement title", description: "Achievement description", proof_url: proof, extra_proof_url: null,
    } },
  });
  assert.deepEqual(helper.revalidated, [["/"], ["/admin", "layout"]]);
});

test("admin edit sends metadata and timestamp but cannot unexpectedly change position", async () => {
  const helper = actionHarness();
  const timestamp = "2026-10-05T00:00:00Z";
  await redirected(() => helper.saveAchievement({}, blankForm({
    id: "2", updated_at: timestamp, title: "Edited", description: "Edited description",
    proof_url: "", extra_proof_url: "https://example.test/event?x=1",
  })), "/admin/achievements?success=saved");
  assert.deepEqual(helper.calls[0], {
    name: "admin_save_achievement",
    args: {
      p_achievement: { title: "Edited", description: "Edited description", proof_url: null, extra_proof_url: "https://example.test/event?x=1" },
      p_id: 2, p_expected_updated_at: timestamp,
    },
  });
});

test("delete requires explicit confirmation and uses the transactional resequence RPC", async () => {
  const helper = actionHarness();
  const fields = { id: "4", updated_at: "2026-10-05T00:00:00Z" };
  await redirected(() => helper.deleteAchievement(blankForm(fields)), "/admin/achievements?error=confirmation");
  assert.deepEqual(helper.calls, []);
  await redirected(() => helper.deleteAchievement(blankForm({ ...fields, confirmed: "yes" })), "/admin/achievements?success=deleted");
  assert.deepEqual(helper.calls[0], {
    name: "admin_delete_achievement",
    args: { p_id: 4, p_expected_updated_at: fields.updated_at, p_confirmed: true },
  });
});

test("reorder sends a complete snapshot and rejects duplicate or invalid positions", async () => {
  const helper = actionHarness();
  await redirected(() => helper.moveAchievement(blankForm({ id: "2", order: "[1,2,3,4]", direction: "down" })),
    "/admin/achievements?success=reordered");
  assert.deepEqual(helper.calls[0], {
    name: "admin_move_achievement", args: { p_id: 2, p_position: 3, p_expected_order: [1, 2, 3, 4] },
  });
  const invalid = actionHarness();
  await redirected(() => invalid.moveAchievement(blankForm({ id: "2", order: "[1,2,2]", position: "1" })),
    "/admin/achievements?error=stale");
  assert.deepEqual(invalid.calls, []);
});

test("Achievements management functions and rollback DB tests cover secure CRUD and preserve original four", () => {
  const migration = readFileSync(`${root}/supabase/migrations/20261005000600_achievements_management.sql`, "utf8");
  const databaseTests = readFileSync(`${root}/supabase/tests/achievements_management.sql`, "utf8");
  for (const phrase of ["admin_save_achievement", "admin_delete_achievement", "admin_move_achievement", "is_publications_admin()", "security invoker", "achievements_display_order_unique deferred"]) {
    assert.ok(migration.includes(phrase), `Missing Achievements database function/policy: ${phrase}`);
  }
  for (const phrase of ["original four achievements", "Anonymous achievement save is denied", "Authenticated non-admin achievement save is denied", "Admin can create an achievement", "Blank title is rejected", "Blank required description is rejected", "Invalid non-HTTP proof URL is rejected", "metadata preserves display position", "transactionally reorder", "Deleting a record compacts", "original four records, metadata, order and timestamps remain unchanged"]) {
    assert.ok(databaseTests.includes(phrase), `Missing Achievements database assertion: ${phrase}`);
  }
});

test("protected Achievements routes and dashboard entry point exist", () => {
  const routes = [
    ["/admin/achievements", "app/admin/achievements/page.tsx"],
    ["/admin/achievements/new", "app/admin/achievements/new/page.tsx"],
    ["/admin/achievements/[id]/edit", "app/admin/achievements/[id]/edit/page.tsx"],
    ["/admin/achievements/[id]/delete", "app/admin/achievements/[id]/delete/page.tsx"],
  ];
  for (const [route, path] of routes) {
    assert.ok(existsSync(`${root}/${path}`), `Missing route ${route}`);
    assert.ok(readFileSync(`${root}/${path}`, "utf8").includes("requireAdminPage"), `${route} must check admin access server-side`);
  }
  assert.match(readFileSync(`${root}/app/admin/page.tsx`, "utf8"), /href="\/admin\/achievements"/);
});
