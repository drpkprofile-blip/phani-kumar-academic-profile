import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { root } from "./publication-seed.mjs";
import { mapAchievements, readCommittedAchievements } from "./achievement-seed.mjs";

nextEnv.loadEnvConfig(root);
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL);
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_"));
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const expected = mapAchievements(readCommittedAchievements());
const fields = "id,title,description,proof_url,extra_proof_url,source_order,display_order,created_at,updated_at";
const result = await client.from("achievements").select(fields).order("id");
assert.ifError(result.error);
assert.equal(result.data.length, 4, "Exactly four achievement rows must exist");
assert.deepEqual(result.data.map(({ id, title, description, proof_url, extra_proof_url, source_order, display_order }) => ({
  id, title, description, proof_url, extra_proof_url, source_order, display_order,
})), expected, "Every migrated field must match the committed static source");
assert.deepEqual(result.data.map((record) => record.id), [1, 2, 3, 4], "IDs must be exactly 1–4");
assert.deepEqual(result.data.map((record) => record.source_order), [1, 2, 3, 4]);
assert.deepEqual(result.data.map((record) => record.display_order), [1, 2, 3, 4]);
assert.equal(new Set(result.data.map((record) => record.display_order)).size, 4,
  "Display positions must be unique");
assert.equal(result.data.filter((record) => record.proof_url !== null).length, 4);
assert.equal(result.data.filter((record) => record.extra_proof_url !== null).length, 1);
assert.equal(result.data.filter((record) => record.extra_proof_url === null).length, 3);
assert.equal(result.data[1].extra_proof_url, expected[1].extra_proof_url,
  "Record 02 extraProof URL must be retained exactly");
assert.equal(result.data[3].proof_url, expected[3].proof_url,
  "Research Seed Money Drive-folder URL must be retained exactly");

const snapshotPath = `${root}/supabase/.temp/achievements-repeat-before.json`;
if (process.argv.includes("--capture-repeat-snapshot")) {
  mkdirSync(`${root}/supabase/.temp`, { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(result.data, null, 2)}\n`);
}
if (process.argv.includes("--check-repeat-snapshot")) {
  assert.deepEqual(result.data, JSON.parse(readFileSync(snapshotPath, "utf8")),
    "Reapplying the seed must preserve all fields and timestamps");
}

console.log(JSON.stringify({
  verifiedRows: result.data.length,
  fieldsPerRow: 7,
  mismatches: 0,
  proofUrls: 4,
  extraProofUrls: 1,
  missingExtraProofUrls: 3,
  displayOrder: result.data.map((record) => record.display_order),
}, null, 2));
