import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { root, readCommittedPublications } from "../scripts/publication-seed.mjs";
import { readCommittedPeerReviews } from "../scripts/peer-review-seed.mjs";
import { loadModule, compareProfile } from "./helpers/render-profile.mjs";

const source = readCommittedPeerReviews();
const baseline = JSON.parse(readFileSync(`${root}/supabase/baselines/peer-reviews.json`, "utf8"));
const expectedSettings = { heroCounterText: "16+", completedReviewsCount: 16 };
const rows = source.map((review_text, index) => ({
  id: index + 1,
  review_text,
  source_order: index + 1,
  display_order: index + 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}));
const settingsRow = {
  singleton: true,
  hero_counter_text: "16+",
  completed_reviews_count: 16,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};
const section = (html) => html.match(/<section id="peer-reviews".*?<\/section>/s)?.[0];

function reader(records = { data: rows, error: null }, settings = { data: settingsRow, error: null }) {
  const calls = [];
  const client = {
    from(table) {
      calls.push(["from", table]);
      return {
        select(columns) {
          calls.push(["select", table, columns]);
          if (table === "peer_reviews") {
            return {
              order(field, options) {
                calls.push(["order", field, options]);
                return Promise.resolve(records);
              },
            };
          }
          return {
            eq(field, value) {
              calls.push(["eq", field, value]);
              return {
                single() {
                  calls.push(["single"]);
                  return Promise.resolve(settings);
                },
              };
            },
          };
        },
      };
    },
  };
  return {
    ...loadModule("lib/peer-reviews.ts", { "./supabase/server": { createClient: async () => client } }),
    calls,
  };
}

async function withConfiguration(callback) {
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const previous = names.map((name) => process.env[name]);
  names.forEach((name) => { process.env[name] = "configured-test-value"; });
  try { await callback(); } finally {
    names.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
}

async function render(result) {
  return section((await compareProfile({ publications: readCommittedPublications(), heroPublications: "40+" },
    undefined, undefined, undefined, undefined, undefined, undefined, false, result)).current);
}

test("configured reader reads rows in display order and counters from the singleton settings row", async () => {
  await withConfiguration(async () => {
    const helper = reader();
    const result = await helper.getPublicPeerReviews();
    assert.deepEqual(helper.calls, [
      ["from", "peer_reviews"],
      ["select", "peer_reviews", "*"],
      ["order", "display_order", { ascending: true }],
      ["from", "peer_review_settings"],
      ["select", "peer_review_settings", "*"],
      ["eq", "singleton", true],
      ["single"],
    ]);
    assert.deepEqual(result, { peerReviews: source, ...expectedSettings });
    assert.equal(helper.mapPeerReview(rows[2]), source[2]);
    assert.deepEqual(helper.mapPeerReviewSettings(settingsRow), expectedSettings);
  });
});

test("configured Peer Reviews render matches the saved static baseline exactly", async () => {
  await withConfiguration(async () => {
    const result = await reader().getPublicPeerReviews();
    const html = await render(result);
    assert.equal(html, baseline.sectionHtml);
    assert.equal((html.match(/class="review-card"/g) ?? []).length, 11);
    assert.deepEqual([...html.matchAll(/class="review-number">(\d+)</g)].map((match) => match[1]),
      Array.from({ length: 11 }, (_, index) => String(index + 1).padStart(2, "0")));
    assert.deepEqual([...html.matchAll(/class="review-year">(\d{4})</g)].map((match) => match[1]),
      ["2026", "2026", "2026", "2026", "2026", "2025", "2025", "2025", "2025", "2025", "2024"]);
    assert.equal((html.match(/class="review-meta-separator" aria-hidden="true">·</g) ?? []).length, 11);
    assert.match(html, /<strong>16<\/strong><span>REVIEWS COMPLETED<\/span>/);
  });
});

test("missing Supabase configuration uses static strings and both fallback counters", async () => {
  await withConfiguration(async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const helper = reader();
    const result = await helper.getPublicPeerReviews();
    assert.deepEqual(helper.calls, []);
    assert.deepEqual(result, { peerReviews: source, ...expectedSettings });
    assert.equal(await render(result), baseline.sectionHtml);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "configured-test-value";
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    assert.deepEqual(await reader().getPublicPeerReviews(), { peerReviews: source, ...expectedSettings });
  });
});

test("configured reader fails visibly when either database read fails", async () => {
  await withConfiguration(async () => {
    await assert.rejects(reader({ data: null, error: {} }).getPublicPeerReviews(), /Unable to read public Peer Reviews/);
    await assert.rejects(reader(rows.length ? { data: rows, error: null } : null, { data: null, error: {} })
      .getPublicPeerReviews(), /Unable to read Peer Review settings/);
  });
});
