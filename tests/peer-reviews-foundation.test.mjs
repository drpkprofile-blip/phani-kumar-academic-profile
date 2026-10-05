import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";

const foundation = readFileSync(`${root}/supabase/migrations/20261005001400_peer_reviews_foundation.sql`, "utf8");
const seed = readFileSync(`${root}/supabase/migrations/20261005001500_seed_peer_reviews.sql`, "utf8");
const reviewsTests = readFileSync(`${root}/supabase/tests/peer_reviews_rls.sql`, "utf8");
const settingsTests = readFileSync(`${root}/supabase/tests/peer_review_settings_rls.sql`, "utf8");

test("Peer Reviews foundation defines the approved schema, positive deferrable order, RLS and settings", () => {
  for (const expression of [
    /create table public\.peer_reviews\s*\(/,
    /review_text text not null check \(length\(btrim\(review_text\)\) > 0\)/,
    /source_order integer check \(source_order > 0\)/,
    /display_order integer not null check \(display_order > 0\)/,
    /unique \(display_order\) deferrable initially immediate/,
    /created_at timestamptz not null default now\(\)/,
    /updated_at timestamptz not null default now\(\)/,
    /create table public\.peer_review_settings\s*\(/,
    /singleton boolean primary key default true check \(singleton\)/,
    /hero_counter_text text not null/,
    /completed_reviews_count integer not null check \(completed_reviews_count >= 0\)/,
    /grant select on table public\.peer_reviews to anon, authenticated/,
    /grant update on table public\.peer_review_settings to authenticated/,
    /public\.is_publications_admin\(\)/,
  ]) assert.match(foundation, expression);
  assert.doesNotMatch(foundation, /create policy .*settings.*admin_insert|grant insert.*peer_review_settings/i);
  assert.doesNotMatch(foundation, /manuscript_title|journal_name|review_year|proof_url/i);
  assert.match(seed, /values \(true, '16\+', 16\)/);
});

test("Peer Reviews authorization tests cover anonymous, authenticated, admin and settings access", () => {
  for (const phrase of [
    "Anonymous users can read all 11 peer reviews",
    "Authenticated visitors can read all 11 peer reviews",
    "Anonymous insert is denied",
    "Anonymous update and reorder are denied",
    "Anonymous delete is denied",
    "Authenticated non-admin insert is denied",
    "Authenticated non-admin update and reorder are denied",
    "Authenticated non-admin delete is denied",
    "Admin can insert peer reviews with nullable source order",
    "Admin can reorder positions transactionally",
    "Admin can update a peer review",
    "Blank review text is rejected",
    "Non-positive display order is rejected",
    "Duplicate display order is rejected",
    "Display order uniqueness is deferrable",
  ]) assert.ok(reviewsTests.includes(phrase), `Missing Peer Reviews assertion: ${phrase}`);
  for (const phrase of [
    "Anonymous users can read exactly one settings row",
    "Anonymous settings update is denied",
    "Authenticated non-admin settings update is denied",
    "Allowlisted admin can update both counters",
    "Admin-updated counters remain independent settings",
  ]) assert.ok(settingsTests.includes(phrase), `Missing settings assertion: ${phrase}`);
});

test("Peer Reviews test aggregator can prepare both transactional suites", () => {
  for (const [flag, output] of [
    ["--peer-reviews", "peer-reviews-rls-validation.sql"],
    ["--peer-review-settings", "peer-review-settings-rls-validation.sql"],
  ]) {
    const result = execFileSync("node", ["scripts/prepare-rls-test.mjs", flag], { cwd: root, encoding: "utf8" });
    assert.match(result, /Prepared ignored transactional RLS test output aggregation/);
    assert.match(readFileSync(`${root}/supabase/.temp/${output}`, "utf8"), /tap_results/);
  }
});

test("Committed Peer Reviews source and rendered baseline are unchanged", () => {
  execFileSync("node", ["scripts/verify-peer-reviews-baseline.mjs"], { cwd: root, stdio: "pipe" });
});
