import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { root } from "./publication-seed.mjs";
import { mapProfessionalMemberships } from "./professional-membership-seed.mjs";
import { loadModule, compareProfile } from "../tests/helpers/render-profile.mjs";
import { readCommittedPublications } from "./publication-seed.mjs";

nextEnv.loadEnvConfig(root);
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL);
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_"));
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const expected = mapProfessionalMemberships();
const { data, error } = await client.from("professional_memberships").select(
  "id,organization_name,membership_type,membership_number,date_text,validity_text,designation,chapter,proof_url,source_order,display_order,created_at,updated_at",
).order("display_order", { ascending: true });
assert.ifError(error);
assert.equal(data.length, 1, "Exactly one supplied membership row must exist");
assert.deepEqual(data.map((record) => Object.fromEntries(Object.entries(record).filter(([key]) => key !== "created_at" && key !== "updated_at"))), expected,
  "All membership fields must match the supplied seed record exactly");
assert.deepEqual(data.map((record) => record.display_order), [1]);
assert.equal(new Set(data.map((record) => record.display_order)).size, 1);
assert.equal(data[0].membership_number, null);
assert.equal(data[0].date_text, null);
assert.equal(data[0].validity_text, null);
assert.equal(data[0].designation, null);
assert.equal(data[0].chapter, null);
assert.equal(data[0].proof_url, null);

const mapper = loadModule("lib/professional-memberships.ts", { "./supabase/server": { createClient: async () => ({}) } });
const mapped = data.map(mapper.mapProfessionalMembership);
const rendered = await compareProfile({
  publications: readCommittedPublications().sort((a,b) => Number(b.year)-Number(a.year) || a.id-b.id),
  heroPublications: "40+",
}, undefined, undefined, undefined, mapped);
const section = (html) => html.match(/<section id="professional-bodies".*?<\/section>/s)?.[0];
const currentSection = section(rendered.current);
assert.ok(currentSection, "Public Professional Bodies section must render");
const baselinePath = `${root}/supabase/baselines/professional-memberships.json`;
const baseline = { rows: expected, sectionHtml: currentSection };
if (process.argv.includes("--capture-baseline")) writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
else assert.equal(currentSection, JSON.parse(readFileSync(baselinePath, "utf8")).sectionHtml,
  "Live membership rendering must match the saved public baseline");
assert.match(currentSection, /Condition Monitoring Society of India \(MCMSI\)/);
assert.match(currentSection, />Member</);
assert.doesNotMatch(currentSection, /Proof/);
console.log(JSON.stringify({ verifiedRows: data.length, mismatches: 0, nullOptionalFields: 6,
  displayOrder: data.map((record) => record.display_order), renderedMatchesBaseline: true }, null, 2));
