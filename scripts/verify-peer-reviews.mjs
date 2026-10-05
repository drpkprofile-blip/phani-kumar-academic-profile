import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { root, readCommittedPublications } from "./publication-seed.mjs";
import { mapPeerReviews, readCommittedPeerReviews } from "./peer-review-seed.mjs";
import { compareProfile, loadModule } from "../tests/helpers/render-profile.mjs";

nextEnv.loadEnvConfig(root);
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_URL);
assert.ok(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_"));

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const expected = mapPeerReviews(readCommittedPeerReviews());
const [reviewsResult, settingsResult] = await Promise.all([
  client.from("peer_reviews").select("id,review_text,source_order,display_order,created_at,updated_at")
    .order("display_order", { ascending: true }),
  client.from("peer_review_settings").select("singleton,hero_counter_text,completed_reviews_count,created_at,updated_at")
    .eq("singleton", true).single(),
]);
assert.ifError(reviewsResult.error);
assert.ifError(settingsResult.error);
assert.equal(reviewsResult.data.length, 11, "Exactly eleven Peer Reviews rows must exist");
assert.deepEqual(reviewsResult.data.map(({ id, review_text, source_order, display_order }) =>
  ({ id, review_text, source_order, display_order })), expected, "All stored fields must match the source exactly");
assert.deepEqual(reviewsResult.data.map(({ id }) => id), Array.from({ length: 11 }, (_, i) => i + 1));
assert.deepEqual(reviewsResult.data.map(({ source_order }) => source_order), Array.from({ length: 11 }, (_, i) => i + 1));
assert.deepEqual(reviewsResult.data.map(({ display_order }) => display_order), Array.from({ length: 11 }, (_, i) => i + 1));
assert.equal(new Set(reviewsResult.data.map(({ review_text }) => review_text)).size, 11, "No duplicate strings");
assert.deepEqual(settingsResult.data && {
  singleton: settingsResult.data.singleton,
  hero_counter_text: settingsResult.data.hero_counter_text,
  completed_reviews_count: settingsResult.data.completed_reviews_count,
}, { singleton: true, hero_counter_text: "16+", completed_reviews_count: 16 });

const reader = loadModule("lib/peer-reviews.ts", { "./supabase/server": { createClient: async () => client } });
const mappedReviews = reviewsResult.data.map(reader.mapPeerReview);
const settings = reader.mapPeerReviewSettings(settingsResult.data);
const rendered = await compareProfile({
  publications: readCommittedPublications().sort((a, b) => Number(b.year) - Number(a.year) || a.id - b.id),
  heroPublications: "40+",
}, undefined, undefined, undefined, undefined, undefined, undefined, false, {
  peerReviews: mappedReviews,
  ...settings,
});
const section = (html) => html.match(/<section id="peer-reviews".*?<\/section>/s)?.[0];
const baseline = JSON.parse(readFileSync(`${root}/supabase/baselines/peer-reviews.json`, "utf8"));
assert.equal(section(rendered.current), baseline.sectionHtml,
  "Public section rendered from anonymous Supabase reads must match the saved static baseline");

const snapshotPath = `${root}/supabase/.temp/peer-reviews-repeat-before.json`;
if (process.argv.includes("--capture-repeat-snapshot")) {
  mkdirSync(`${root}/supabase/.temp`, { recursive: true });
  writeFileSync(snapshotPath, `${JSON.stringify({ rows: reviewsResult.data, settings: settingsResult.data }, null, 2)}\n`);
}
if (process.argv.includes("--check-repeat-snapshot")) {
  assert.deepEqual({ rows: reviewsResult.data, settings: settingsResult.data },
    JSON.parse(readFileSync(snapshotPath, "utf8")),
    "Reapplying the seed must preserve every row and settings timestamp");
}

console.log(JSON.stringify({
  verifiedRows: reviewsResult.data.length,
  exactTextMismatches: 0,
  ids: reviewsResult.data.map(({ id }) => id),
  sourceOrder: reviewsResult.data.map(({ source_order }) => source_order),
  displayOrder: reviewsResult.data.map(({ display_order }) => display_order),
  settings: { heroCounterText: settings.heroCounterText, completedReviewsCount: settings.completedReviewsCount },
  renderedMatchesBaseline: true,
}, null, 2));
