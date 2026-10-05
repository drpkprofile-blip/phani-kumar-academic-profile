import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import { loadModule, compareProfile } from "./helpers/render-profile.mjs";
import { mapProfessionalMemberships } from "../scripts/professional-membership-seed.mjs";
import { readCommittedPublications } from "../scripts/publication-seed.mjs";

const expected = mapProfessionalMemberships();
const reader = (result = { data: expected.map((row) => ({ ...row, created_at: "", updated_at: "" })), error: null }) => {
  const calls = [];
  const client = {
    from(table) {
      calls.push(["from", table]);
      return { select(columns) {
        calls.push(["select", columns]);
        return { order(field, options) {
          calls.push(["order", field, options]);
          return Promise.resolve(result);
        } };
      } };
    },
  };
  return { calls, ...loadModule("lib/professional-memberships.ts", { "./supabase/server": { createClient: async () => client } }) };
};
async function withConfig(fn) {
  const names = ["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const old = names.map((name) => process.env[name]); names.forEach((name) => { process.env[name] = "test-configured"; });
  try { await fn(); } finally { names.forEach((name,index) => old[index] === undefined ? delete process.env[name] : process.env[name] = old[index]); }
}
const render = async (records) => {
  const result = await compareProfile({ publications: readCommittedPublications().sort((a,b) => Number(b.year)-Number(a.year) || a.id-b.id), heroPublications: "40+" }, undefined, undefined, undefined, records);
  return result.current.match(/<section id="professional-bodies".*?<\/section>/s)?.[0];
};

test("public membership reader queries display order and maps the approved row shape", async () => withConfig(async () => {
  const helper = reader(); const records = await helper.getPublicProfessionalMemberships();
  assert.deepEqual(helper.calls, [["from","professional_memberships"],["select","*"],["order","display_order",{ascending:true}]]);
  assert.deepEqual(records, [{ displayOrder: 1, organizationName: "Condition Monitoring Society of India (MCMSI)", membershipType: "Member",
    membershipNumber: undefined, dateText: undefined, validityText: undefined, designation: undefined, chapter: undefined, proofUrl: undefined }]);
}));

test("nullable database values safely map to undefined and configured errors fail visibly", async () => withConfig(async () => {
  const helper = reader();
  const row = { ...expected[0], created_at: "", updated_at: "", membership_type: null, membership_number: null, date_text: null,
    validity_text: null, designation: null, chapter: null, proof_url: null };
  const mapped = helper.mapProfessionalMembership(row);
  for (const key of ["membershipType","membershipNumber","dateText","validityText","designation","chapter","proofUrl"]) assert.equal(mapped[key], undefined);
  await assert.rejects(reader({ data: null, error: {} }).getPublicProfessionalMemberships(), /Unable to read public Professional Bodies/);
}));

test("membership public card renders faithfully from the supplied Supabase row", async () => withConfig(async () => {
  const data = await reader().getPublicProfessionalMemberships(); const section = await render(data);
  const baseline = JSON.parse(readFileSync(`${root}/supabase/baselines/professional-memberships.json`, "utf8"));
  assert.equal(section, baseline.sectionHtml);
  assert.equal((section.match(/class="professional-membership-card"/g) ?? []).length, 1);
  assert.match(section, /Condition Monitoring Society of India \(MCMSI\)/);
  assert.match(section, />Member</);
  assert.doesNotMatch(section, /Proof/);
  assert.doesNotMatch(section, /membership number|validity|chapter|designation/i);
}));

test("missing public Supabase config uses exact supplied static membership fallback", async () => {
  const old = process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    const helper = reader(); const records = await helper.getPublicProfessionalMemberships();
    assert.deepEqual(helper.calls, []);
    assert.equal(await render(records), JSON.parse(readFileSync(`${root}/supabase/baselines/professional-memberships.json`, "utf8")).sectionHtml);
  } finally { if (old !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = old; }
});
