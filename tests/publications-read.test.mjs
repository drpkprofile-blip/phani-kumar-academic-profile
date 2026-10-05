import assert from "node:assert/strict";
import test from "node:test";
import { mapPublications, readCommittedPublications } from "../scripts/publication-seed.mjs";
import { loadModule, compareProfile } from "./helpers/render-profile.mjs";
import { renderToStaticMarkup } from "react-dom/server";

const rows = mapPublications(readCommittedPublications()).sort((a,b) => a.display_order-b.display_order);
const publicationsSection = (html) => html.match(/<section id="publications".*?<\/section>/s)?.[0];
function reader(records = { data: rows, error: null }, settings = { data: { hero_publications: "40+" }, error: null }) {
  const calls = [];
  const client = { from(table) {
    calls.push(table);
    return { select() { return {
      order(field, options) { assert.equal(field, "display_order"); assert.deepEqual(options, { ascending: true }); return Promise.resolve(records); },
      eq(field, value) { assert.equal(field, "id"); assert.equal(value, true); return { single: async () => settings }; },
    }; } };
  } };
  return { ...loadModule("lib/publications.ts", { "./supabase/server": { createClient: async () => client } }), calls };
}

async function configured(callback) {
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const old = names.map((name) => process.env[name]);
  names.forEach((name) => process.env[name] = "test-configured");
  try { await callback(); } finally { names.forEach((name,i) => { if (old[i] === undefined) delete process.env[name]; else process.env[name] = old[i]; }); }
}

test("database reads use display order and independent settings; Publications section matches Phase 2C", async () => {
  await configured(async () => {
    const helper = reader();
    const data = await helper.getPublicPublications();
    assert.deepEqual(helper.calls, ["publications", "publication_settings"]);
    const html = await compareProfile(data);
    assert.equal(publicationsSection(html.current), publicationsSection(html.baseline));
    assert.equal((publicationsSection(html.current).match(/class="publication-card"/g) ?? []).length, 37);
  });
});

test("NULL optional fields disappear; supplied proof, zero impact factor and indexing order survive", () => {
  const { mapPublication } = reader();
  const mapped = mapPublication({ ...rows[0], doi: null, article_url: null, proof_url: null, impact_factor: null, publication_type: null });
  for (const key of ["doi", "url", "proof", "impactFactor", "type"]) assert.equal(mapped[key], undefined);
  const supplied = mapPublication({ ...rows[0], proof_url: "https://example.com/proof.pdf", impact_factor: 0, indexing: ["SCI", "Scopus"] });
  assert.equal(supplied.proof, "https://example.com/proof.pdf");
  assert.equal(supplied.impactFactor, 0);
  assert.deepEqual(supplied.indexing, ["SCI", "Scopus"]);
});

test("configured database errors never silently replace live records with static data", async () => {
  await configured(async () => {
    await assert.rejects(reader({ data: null, error: {} }).getPublicPublications(), /Unable to read public Publications/);
    await assert.rejects(reader(undefined, { data: null, error: {} }).getPublicPublications(), /independent publication counter/);
  });
});

test("existing card logic retains article precedence, DOI fallback, supplied proof and missing states", async () => {
  const { mapPublication } = reader();
  const publications = [
    mapPublication({ ...rows[0], article_url: "https://example.com/article", doi: "10.123/test", proof_url: "https://example.com/proof.pdf", impact_factor: null }),
    mapPublication({ ...rows[1], article_url: null, doi: "10.123/fallback", impact_factor: null }),
    mapPublication({ ...rows[2], article_url: null, doi: null, impact_factor: null }),
  ];
  const Page = loadModule("app/page.tsx", { "../lib/publications": {
    getPublicPublications: async () => ({ publications, heroPublications: "40+" }),
  } }).default;
  const html = renderToStaticMarkup(await Page());
  assert.ok(html.includes('href="https://example.com/article"'));
  assert.ok(!html.includes('href="https://doi.org/10.123/test"'));
  assert.ok(html.includes('href="https://doi.org/10.123/fallback"'));
  assert.ok(html.includes('href="https://example.com/proof.pdf"'));
  assert.equal((html.match(/class="pdf-pending"/g) ?? []).length, 2);
  assert.equal((html.match(/class="article-pending"/g) ?? []).length, 1);
  assert.ok(html.includes("Article link will be updated soon"));
  assert.ok(html.includes("PDF Proof will be updated soon"));
  assert.ok(!html.includes("IF:"));
});

test("missing configuration safely renders the reference without creating a client", async () => {
  await configured(async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const helper = reader();
    const html = await compareProfile(await helper.getPublicPublications());
    assert.equal(publicationsSection(html.current), publicationsSection(html.baseline));
    assert.deepEqual(helper.calls, []);
  });
});
