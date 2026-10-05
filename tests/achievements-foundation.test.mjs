import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";

const migration = readFileSync(`${root}/supabase/migrations/20261005000400_achievements_foundation.sql`, "utf8");
const databaseTests = readFileSync(`${root}/supabase/tests/achievements_rls.sql`, "utf8");

test("Achievements foundation defines exact nullable fields and deferrable positive order without seed rows", () => {
  for (const expression of [
    /title text not null check \(length\(btrim\(title\)\) > 0\)/,
    /description text not null/,
    /proof_url text,/,
    /extra_proof_url text,/,
    /source_order integer check \(source_order > 0\)/,
    /display_order integer not null check \(display_order > 0\)/,
    /unique \(display_order\) deferrable initially immediate/,
    /created_at timestamptz not null default now\(\)/,
    /updated_at timestamptz not null default now\(\)/,
    /public\.is_publications_admin\(\)/,
  ]) assert.match(migration, expression);
  assert.doesNotMatch(migration, /insert\s+into\s+public\.achievements/i);
});

test("Achievements database authorization suite covers read, denied writes, admin changes, and constraints", () => {
  for (const phrase of [
    "Anonymous users can read achievements",
    "Authenticated visitors can read achievements",
    "Anonymous insert is denied",
    "Anonymous update and reorder are denied",
    "Anonymous delete is denied",
    "Authenticated non-admin insert is denied",
    "Authenticated non-admin update is denied",
    "Authenticated non-admin delete is denied",
    "Admin can insert with both optional proof URLs NULL",
    "Admin can update achievement",
    "Admin can delete achievement",
    "Admin can reorder positions transactionally",
    "Blank title is rejected",
    "Required description is enforced",
    "Non-positive display order is rejected",
    "Duplicate display order is rejected",
    "Display order constraint is deferrable",
  ]) assert.ok(databaseTests.includes(phrase), `Missing database assertion: ${phrase}`);
});

test("Committed achievement content and rendered section match the captured baseline", () => {
  execFileSync("node", ["scripts/verify-achievements-baseline.mjs"], { cwd: root, stdio: "pipe" });
});
