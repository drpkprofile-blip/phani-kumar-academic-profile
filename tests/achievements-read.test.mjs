import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import { mapAchievements, readCommittedAchievements } from "../scripts/achievement-seed.mjs";
import { loadModule, compareProfile } from "./helpers/render-profile.mjs";
import { readCommittedPublications } from "../scripts/publication-seed.mjs";

const source = readCommittedAchievements();
const rows = mapAchievements(source);
const baseline = JSON.parse(readFileSync(`${root}/supabase/baselines/achievements.json`, "utf8"));
const section = (html) => html.match(/<section id="achievements".*?<\/section>/s)?.[0];

function reader(records = { data: rows.map((row) => ({ ...row, created_at: "", updated_at: "" })), error: null }) {
  const calls = [];
  const client = {
    from(table) {
      calls.push(["from", table]);
      return {
        select(columns) {
          calls.push(["select", columns]);
          return {
            order(field, options) {
              calls.push(["order", field, options]);
              return Promise.resolve(records);
            },
          };
        },
      };
    },
  };
  return {
    ...loadModule("lib/achievements.ts", { "./supabase/server": { createClient: async () => client } }),
    calls,
  };
}

async function configured(callback) {
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const previous = names.map((name) => process.env[name]);
  names.forEach((name) => { process.env[name] = "test-configured"; });
  try { await callback(); } finally {
    names.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
}

const render = async (achievements) => section((await compareProfile({
  publications: readCommittedPublications().sort((a, b) => Number(b.year) - Number(a.year) || a.id - b.id),
  heroPublications: "40+",
}, undefined, undefined, achievements)).current);

test("configured Achievements reader orders rows only by display_order and maps the current shape", async () => {
  await configured(async () => {
    const helper = reader();
    const records = await helper.getPublicAchievements();
    assert.deepEqual(helper.calls, [
      ["from", "achievements"],
      ["select", "*"],
      ["order", "display_order", { ascending: true }],
    ]);
    assert.deepEqual(records, source.map((record) => ({
      number: record.number,
      title: record.title,
      text: record.text,
      proof: record.proof,
      extraProof: record.extraProof,
    })));
  });
});

test("NULL proof fields become undefined and configured database errors are visible", async () => {
  await configured(async () => {
    const helper = reader();
    const mapped = helper.mapAchievement({ ...rows[0], proof_url: null, extra_proof_url: null });
    assert.equal(mapped.proof, undefined);
    assert.equal(mapped.extraProof, undefined);
    await assert.rejects(reader({ data: null, error: {} }).getPublicAchievements(), /Unable to read public Achievements/);
  });
});

test("Supabase Achievements render exactly matches the saved Phase 8C baseline", async () => {
  await configured(async () => {
    const helper = reader();
    const data = await helper.getPublicAchievements();
    const html = await render(data);
    assert.equal(html, baseline.sectionHtml);
    assert.equal((html.match(/class="achievement-card"/g) ?? []).length, 4);
    assert.deepEqual([...html.matchAll(/class="achievement-number">(\d+)</g)].map((match) => match[1]), ["01", "02", "03", "04"]);
    assert.deepEqual([...html.matchAll(/<h3>(.*?)<\/h3>/g)].map((match) => match[1]), source.map((record) => record.title));
    assert.deepEqual([...html.matchAll(/<p>(.*?)<\/p>/g)].slice(-4).map((match) => match[1]), source.map((record) => record.text));
    const links = html.match(/<a\b[^>]*>.*?<\/a>/g) ?? [];
    assert.equal(links.filter((link) => link.includes(">Proof ")).length, 4);
    assert.equal(links.filter((link) => link.includes(">Event Proof ")).length, 1);
    assert.equal(data.filter((record) => !record.extraProof).length, 3);
    assert.match(html, /<div class="section-index">09<\/div>/);
  });
});

test("missing Supabase configuration keeps the exact static fallback and pending proof behavior", async () => {
  await configured(async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const helper = reader();
    const records = await helper.getPublicAchievements();
    assert.deepEqual(helper.calls, []);
    assert.equal(await render(records), baseline.sectionHtml);
    const withMissingProof = records.map((record, index) => index === 0 ? { ...record, proof: undefined } : record);
    assert.match(await render(withMissingProof), /<span class="link-pending">Proof<\/span>/);
  });
});
