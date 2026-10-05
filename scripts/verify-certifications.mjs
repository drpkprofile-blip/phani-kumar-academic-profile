import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { root } from "./publication-seed.mjs";
import { mapCertifications, readCommittedCertifications } from "./certification-seed.mjs";

nextEnv.loadEnvConfig(root);
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_"));
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const expected = mapCertifications(readCommittedCertifications());
const result = await client.from("certifications")
  .select("id,title,certificate_url,fdp_url,source_order,display_order,created_at,updated_at")
  .order("id");
assert.ifError(result.error);
assert.equal(result.data.length, 13, "Exactly 13 certification rows must exist");
assert.deepEqual(new Set(result.data.map((record) => record.id)), new Set(Array.from({ length: 13 }, (_, i) => i + 1)));
assert.deepEqual(result.data.map(({ id, title, certificate_url, fdp_url, source_order, display_order }) => ({
  id, title, certificate_url, fdp_url, source_order, display_order,
})), expected, "Every migrated field must match the committed static source");

const visible = await client.from("certifications")
  .select("id,display_order").order("display_order");
assert.ifError(visible.error);
assert.deepEqual(visible.data.map((record) => record.id), expected.map((record) => record.id));

const counts = {
  total: result.data.length,
  certificateUrls: result.data.filter((record) => record.certificate_url !== null).length,
  missingCertificateUrls: result.data.filter((record) => record.certificate_url === null).length,
  fdpUrls: result.data.filter((record) => record.fdp_url !== null).length,
  missingFdpUrls: result.data.filter((record) => record.fdp_url === null).length,
};
assert.deepEqual(counts, {
  total: 13,
  certificateUrls: 9,
  missingCertificateUrls: 4,
  fdpUrls: 6,
  missingFdpUrls: 7,
});

const snapshotPath = `${root}/supabase/.temp/certifications-repeat-before.json`;
if (process.argv.includes("--capture-repeat-snapshot")) {
  mkdirSync(`${root}/supabase/.temp`, { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify(result.data, null, 2)}\n`);
}
if (process.argv.includes("--check-repeat-snapshot")) {
  assert.deepEqual(result.data, JSON.parse(readFileSync(snapshotPath, "utf8")),
    "Reapplying the seed must preserve all rows and timestamps");
}

console.log(JSON.stringify({
  verifiedRows: result.data.length,
  fieldsPerRow: 6,
  mismatches: 0,
  counts,
  publicOrder: "IDs 1–13 in display_order",
}, null, 2));
