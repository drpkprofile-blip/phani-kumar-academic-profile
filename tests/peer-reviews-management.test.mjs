import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { loadModule } from "./helpers/render-profile.mjs";
import { root } from "../scripts/publication-seed.mjs";

const formModule = loadModule("lib/admin/peer-review-form.ts");
const reviewForm = { id: "", updated_at: "", review_text: "  Full supplied review text\nsecond line  " };
const makeForm = (overrides = {}) => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...reviewForm, ...overrides })) form.set(key, value);
  return form;
};
function redirect(path) { throw Object.assign(new Error("Redirect"), { path }); }
const redirected = (run, path) => assert.rejects(run, (error) => error.path === path);

function actionHarness({ denied = false, error = null } = {}) {
  const calls = [];
  const revalidated = [];
  const supabase = { rpc: async (name, args) => { calls.push({ name, args }); return { data: 12, error }; } };
  const actions = loadModule("app/admin/peer-reviews/actions.ts", {
    "../../../lib/auth/admin-page": { requireAdminPage: async () => {
      if (denied) redirect("/admin/login");
      return { supabase };
    } },
    "next/navigation": { redirect },
    "next/cache": { revalidatePath: (...args) => revalidated.push(args) },
  });
  return { calls, revalidated, ...actions };
}

test("Peer Review form rejects blank text and preserves every supplied character", () => {
  const exact = formModule.parsePeerReviewForm(makeForm());
  assert.deepEqual(exact.errors, {});
  assert.equal(exact.data.review_text, reviewForm.review_text);
  assert.deepEqual(formModule.parsePeerReviewForm(makeForm({ review_text: " \t\n " })).errors,
    { review_text: "Enter nonblank review text." });
});

test("counter count accepts only a non-negative 32-bit whole number", () => {
  for (const valid of ["0", "16", "2147483647"]) assert.ok(formModule.nonNegativeReviewCount(valid) >= 0);
  for (const invalid of ["", "-1", "+1", "1.0", "1e2", " 2", "2147483648", null]) {
    assert.equal(formModule.nonNegativeReviewCount(invalid), null, String(invalid));
  }
});

test("all Peer Reviews mutations require the allowlisted admin helper", async () => {
  await redirected(() => actionHarness({ denied: true }).savePeerReview({}, makeForm()), "/admin/login");
  await redirected(() => actionHarness({ denied: true }).deletePeerReview(makeForm({ id: "3", confirmed: "yes" })), "/admin/login");
  await redirected(() => actionHarness({ denied: true }).movePeerReview(makeForm({ id: "3", order: "[3,4]", position: "2" })), "/admin/login");
  await redirected(() => actionHarness({ denied: true }).updatePeerReviewSettings(makeForm({ hero_counter_text: "16+", completed_reviews_count: "16" })), "/admin/login");
});

test("create preserves raw review text and delegates append/source order to the database", async () => {
  const helper = actionHarness();
  await redirected(() => helper.savePeerReview({}, makeForm({ source_order: "8", display_order: "1" })), "/admin/peer-reviews?success=added");
  assert.deepEqual(helper.calls[0], { name: "admin_save_peer_review", args: { p_review_text: reviewForm.review_text } });
  assert.deepEqual(helper.revalidated, [["/"], ["/admin", "layout"]]);
});

test("edit passes only review text, id and optimistic timestamp, preserving position", async () => {
  const helper = actionHarness();
  const updatedAt = "2026-10-05T00:00:00Z";
  await redirected(() => helper.savePeerReview({}, makeForm({ id: "9", updated_at: updatedAt, display_order: "1" })), "/admin/peer-reviews?success=saved");
  assert.deepEqual(helper.calls[0], { name: "admin_save_peer_review", args: {
    p_review_text: reviewForm.review_text, p_id: 9, p_expected_updated_at: updatedAt,
  } });
  assert.equal("p_display_order" in helper.calls[0].args, false);
});

test("confirmed delete and reorder call the transactional RPCs with validated positions", async () => {
  const helper = actionHarness();
  const updatedAt = "2026-10-05T00:00:00Z";
  await redirected(() => helper.deletePeerReview(makeForm({ id: "12", updated_at: updatedAt, confirmed: "yes" })), "/admin/peer-reviews?success=deleted");
  await redirected(() => helper.movePeerReview(makeForm({ id: "12", order: "[11,12,13]", position: "1" })), "/admin/peer-reviews?success=reordered");
  assert.deepEqual(helper.calls.map((call) => call.name), ["admin_delete_peer_review", "admin_move_peer_review"]);
  assert.equal(helper.calls[0].args.p_confirmed, true);
  assert.deepEqual(helper.calls[1].args, { p_id: 12, p_position: 1, p_expected_order: [11, 12, 13] });
  await redirected(() => actionHarness().deletePeerReview(makeForm({ id: "12", updated_at: updatedAt, confirmed: "no" })), "/admin/peer-reviews?error=confirmation");
});

test("settings mutation validates and stores independent counter values", async () => {
  const helper = actionHarness();
  const updatedAt = "2026-10-05T00:00:00Z";
  await redirected(() => helper.updatePeerReviewSettings(makeForm({
    hero_counter_text: "  17+  ", completed_reviews_count: "0", updated_at: updatedAt,
  })), "/admin/peer-reviews?success=settings");
  assert.deepEqual(helper.calls[0], { name: "admin_update_peer_review_settings", args: {
    p_hero_counter_text: "  17+  ", p_completed_reviews_count: 0, p_expected_updated_at: updatedAt,
  } });
  await redirected(() => actionHarness().updatePeerReviewSettings(makeForm({
    hero_counter_text: "17+", completed_reviews_count: "-1", updated_at: updatedAt,
  })), "/admin/peer-reviews?error=counter");
});

test("Peer Reviews admin routes and dashboard module link exist without changing public rendering", () => {
  for (const route of [
    "app/admin/peer-reviews/page.tsx", "app/admin/peer-reviews/new/page.tsx",
    "app/admin/peer-reviews/[id]/edit/page.tsx", "app/admin/peer-reviews/[id]/delete/page.tsx",
  ]) assert.ok(existsSync(`${root}/${route}`), route);
  const dashboard = readFileSync(`${root}/app/admin/page.tsx`, "utf8");
  assert.match(dashboard, /Manage Peer Reviews/);
  const migration = readFileSync(`${root}/supabase/migrations/20261005001700_peer_reviews_management.sql`, "utf8");
  assert.match(migration, /security invoker set search_path = ''/g);
  assert.match(migration, /set constraints public\.peer_reviews_display_order_unique deferred/i);
  assert.match(migration, /p_completed_reviews_count < 0/);
});
