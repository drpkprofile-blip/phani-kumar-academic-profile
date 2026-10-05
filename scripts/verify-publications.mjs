import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { root, mapPublications, readCommittedPublications } from "./publication-seed.mjs";

nextEnv.loadEnvConfig(root);
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(key?.startsWith("sb_publishable_"), "Verification requires only a publishable key");
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
const expected = mapPublications(readCommittedPublications());
const approvedAddition = {
  id: 49,
  title: "Design of rack and pinion mechanism for power generation at speed breakers",
  year: "2015",
  journal: "International Journal of Engineering Trends and Technology, Volume 22, Issue 8",
  indexing: [],
  doi: null,
  article_url: null,
  proof_url: null,
  publication_type: "Journal Article",
  impact_factor: null,
  source_order: null,
  display_order: 33,
};
const fields = Object.keys(expected[0]).join(",");
const { data, error } = await client.from("publications").select(fields).order("id", { ascending: true });
assert.ifError(error);
assert.equal(data.length, 38, "The 37 migrated rows plus the approved addition must remain present");
assert.equal(new Set(data.map((p) => p.id)).size, 38);
const migrated = data.filter((p) => p.source_order !== null);
const additions = data.filter((p) => p.source_order === null);
const expectedMigrated = expected.map((p) => ({
  ...p,
  display_order: p.display_order >= approvedAddition.display_order ? p.display_order + 1 : p.display_order,
}));
assert.deepEqual(migrated, expectedMigrated, "Every migrated row must match the static source, retaining its relative order after the approved insertion");
assert.deepEqual(additions, [approvedAddition], "The approved addition must remain unchanged");
assert.equal(data.filter((p) => p.impact_factor !== null).length, 6);
assert.ok(data.every((p) => p.proof_url === null));
assert.ok(data.every((p) => p.display_order > 0));
assert.equal(new Set(data.map((p) => p.display_order)).size, 38);
const expectedVisibleOrder = [...expectedMigrated].sort((a, b) => a.display_order - b.display_order).map((p) => p.id);
expectedVisibleOrder.splice(32, 0, approvedAddition.id);
assert.deepEqual([...data].sort((a, b) => a.display_order - b.display_order).map((p) => p.id), expectedVisibleOrder);
const settings = await client.from("publication_settings").select("hero_publications").single();
assert.ifError(settings.error);
assert.match(settings.data.hero_publications, /^\d+\+$/, "The independent hero counter must remain a display label, separate from the row count");
console.log(`Anonymous read verification passed: all 37 migrated rows and the approved 38th publication match; order, six impact factors, NULL proofs and independent ${settings.data.hero_publications} counter preserved.`);
