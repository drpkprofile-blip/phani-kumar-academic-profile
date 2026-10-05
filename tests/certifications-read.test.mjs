import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { mapCertifications, readCommittedCertifications } from "../scripts/certification-seed.mjs";
import { readCommittedPublications } from "../scripts/publication-seed.mjs";
import { loadModule, compareProfile } from "./helpers/render-profile.mjs";

const expected = mapCertifications(readCommittedCertifications());
const baseline = JSON.parse(readFileSync(new URL("../supabase/baselines/certifications.json", import.meta.url), "utf8"));

function reader(records = { data: expected, error: null }) {
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
    ...loadModule("lib/certifications.ts", { "./supabase/server": { createClient: async () => client } }),
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

test("configured public reader selects certifications strictly by display_order", async () => {
  await configured(async () => {
    const helper = reader();
    const records = await helper.getPublicCertifications();
    assert.deepEqual(helper.calls, [
      ["from", "certifications"],
      ["select", "*"],
      ["order", "display_order", { ascending: true }],
    ]);
    assert.deepEqual(records, readCommittedCertifications().map(({ number, title, certificateUrl, fdpUrl }) => ({
      number, title, certificateUrl: certificateUrl ?? undefined, fdpUrl: fdpUrl ?? undefined,
    })));
  });
});

test("database NULL URLs become undefined and configured errors are surfaced", async () => {
  await configured(async () => {
    const helper = reader();
    const mapped = helper.mapCertification({
      ...expected[0], certificate_url: null, fdp_url: null,
    });
    assert.equal(mapped.certificateUrl, undefined);
    assert.equal(mapped.fdpUrl, undefined);
    await assert.rejects(reader({ data: null, error: {} }).getPublicCertifications(), /Unable to read public Certifications/);
  });
});

test("Supabase rows render identically to Phase 4C baseline with dynamic 13+ counters", async () => {
  await configured(async () => {
    const data = await reader().getPublicCertifications();
    const rendered = await compareProfile({
      publications: readCommittedPublications().sort((a, b) => Number(b.year) - Number(a.year) || a.id - b.id),
      heroPublications: "40+",
    }, undefined, data);
    const section = (html) => html.match(/<section id="certifications".*?<\/section>/s)?.[0].replace(/<!--.*?-->/gs, "");
    const html = section(rendered.current);
    assert.equal(html, baseline.sectionHtml);
    assert.equal((html.match(/class="certification-card"/g) ?? []).length, 13);
    const links = html.match(/<a\b[^>]*>.*?<\/a>/g) ?? [];
    assert.equal(links.filter((link) => link.replace(/<[^>]*>/g, "").startsWith("Certificate")).length, 9);
    assert.equal((html.match(/Certificate link will be updated soon/g) ?? []).length, 4);
    assert.equal(links.filter((link) => link.replace(/<[^>]*>/g, "").startsWith("FDP")).length, 6);
    assert.equal(data.filter((record) => !record.fdpUrl).length, 7);
    assert.equal((rendered.current.match(/<strong>13\+<\/strong>/g) ?? []).length, 2);
  });
});

test("missing Supabase configuration uses the static reference without creating a client", async () => {
  await configured(async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const helper = reader();
    const data = await helper.getPublicCertifications();
    assert.deepEqual(helper.calls, []);
    assert.equal(data.length, 13);
    assert.equal(data[0].title, "Accreditation and Outcome Based Learning");
  });
});
