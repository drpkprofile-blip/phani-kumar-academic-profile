import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";

const migration = readFileSync(`${root}/supabase/migrations/20261005000100_certifications_foundation.sql`, "utf8");
const databaseTests = readFileSync(`${root}/supabase/tests/certifications_rls.sql`, "utf8");

test("Certifications foundation defines exact optional fields and deferrable positive order without seed rows", () => {
  for (const expression of [
    /title text not null check \(length\(btrim\(title\)\) > 0\)/,
    /certificate_url text,/,
    /fdp_url text,/,
    /source_order integer check \(source_order > 0\)/,
    /display_order integer not null check \(display_order > 0\)/,
    /unique \(display_order\) deferrable initially immediate/,
    /created_at timestamptz not null default now\(\)/,
    /updated_at timestamptz not null default now\(\)/,
    /public\.is_publications_admin\(\)/,
  ]) assert.match(migration, expression);
  assert.doesNotMatch(migration, /insert\s+into\s+public\.certifications/i);
});

test("Certifications database authorization suite covers required access and transactional reorder cases", () => {
  for (const phrase of [
    "Anonymous users can read certifications",
    "Authenticated visitors can read certifications",
    "Anonymous insert is denied",
    "Authenticated non-admin insert is denied",
    "Admin can insert with both optional URLs NULL",
    "Admin can update certification",
    "Admin can delete certification",
    "Admin can reorder by swapping positions transactionally",
    "Duplicate display order is rejected",
    "Display order constraint is deferrable",
  ]) assert.ok(databaseTests.includes(phrase), `Missing database assertion: ${phrase}`);
});

test("Committed certification content and rendered NPTEL section match the captured baseline", () => {
  execFileSync("node", ["scripts/verify-certifications-baseline.mjs"], { cwd: root, stdio: "pipe" });
});
