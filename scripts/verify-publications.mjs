import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { root, mapPublications, readCommittedPublications } from "./publication-seed.mjs";

nextEnv.loadEnvConfig(root);
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(key?.startsWith("sb_publishable_"), "Verification requires only a publishable key");
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
const expected = mapPublications(readCommittedPublications());
const fields = Object.keys(expected[0]).join(",");
const { data, error } = await client.from("publications").select(fields).order("source_order");
assert.ifError(error);
assert.deepEqual(data, expected, "Every field of every row must equal the static source");
assert.equal(data.length, 37);
assert.equal(new Set(data.map((p) => p.id)).size, 37);
assert.equal(data.filter((p) => p.impact_factor !== null).length, 6);
assert.ok(data.every((p) => p.proof_url === null));
assert.deepEqual([...data].sort((a, b) => a.display_order - b.display_order).map((p) => p.id),
  [...readCommittedPublications()].sort((a, b) => Number(b.year) - Number(a.year) || a.id - b.id).map((p) => p.id));
const settings = await client.from("publication_settings").select("hero_publications").single();
assert.ifError(settings.error);
assert.equal(settings.data.hero_publications, "40+");
console.log("Anonymous read verification passed: all 37 rows × 12 fields match; 37 NULL proofs, six impact factors, both orders and independent 40+ counter preserved.");
