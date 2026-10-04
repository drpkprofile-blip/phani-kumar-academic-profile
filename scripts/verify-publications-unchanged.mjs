import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { root } from "./publication-seed.mjs";

nextEnv.loadEnvConfig(root);
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(key?.startsWith("sb_publishable_"));
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
const records = await client.from("publications").select("*").order("display_order");
const settings = await client.from("publication_settings").select("hero_publications").single();
assert.ifError(records.error); assert.ifError(settings.error);
assert.equal(records.data.length, 37);
assert.equal(settings.data.hero_publications, "40+");
const current = { records: records.data, hero: settings.data.hero_publications };
const path = `${root}/supabase/.temp/pre-admin-verification.json`;
if (process.argv.includes("--snapshot")) {
  mkdirSync(`${root}/supabase/.temp`, { recursive: true });
  writeFileSync(path, JSON.stringify(current, null, 2));
  console.log("Captured ignored public-data baseline: 37 original rows and 40+.");
} else {
  assert.deepEqual(current, JSON.parse(readFileSync(path, "utf8")));
  console.log("All 37 original rows, fields, order and timestamps remain untouched; hero counter is 40+.");
}
