import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { root } from "./publication-seed.mjs";
import { readCommittedPublications } from "./publication-seed.mjs";
import { mapPeerReviews, readCommittedPeerReviews } from "./peer-review-seed.mjs";
import { compareProfile } from "../tests/helpers/render-profile.mjs";

const committed = execFileSync("git", ["show", "HEAD:data/peer-reviews.ts"], {
  cwd: root,
  encoding: "utf8",
}).replaceAll("\r\n", "\n");
assert.equal(readFileSync(`${root}/data/peer-reviews.ts`, "utf8").replaceAll("\r\n", "\n"), committed,
  "The committed Peer Reviews file remains the migration/reference baseline");

const reviews = readCommittedPeerReviews();
const rows = mapPeerReviews(reviews);
const counters = { heroCounterText: "16+", completedReviewsCount: 16 };
const publications = readCommittedPublications().sort((a, b) => Number(b.year) - Number(a.year) || a.id - b.id);
const rendered = await compareProfile({ publications, heroPublications: "40+" }, undefined, undefined,
  undefined, undefined, undefined, undefined, false, { peerReviews: reviews, ...counters });
const sectionHtml = rendered.current.match(/<section id="peer-reviews".*?<\/section>/s)?.[0];
assert.ok(sectionHtml, "Rendered Peer Reviews section must be present");
assert.equal((sectionHtml.match(/class="review-card"/g) ?? []).length, 11);
assert.match(rendered.current, /<strong>16\+<\/strong><span>PEER REVIEWS<\/span>/);
assert.match(sectionHtml, /<strong>16<\/strong><span>REVIEWS COMPLETED<\/span>/);

const baseline = {
  sourceSha256: createHash("sha256").update(committed).digest("hex"),
  rows,
  heroCounterText: counters.heroCounterText,
  completedReviewsCount: counters.completedReviewsCount,
  sectionHtml,
};
const path = `${root}/supabase/baselines/peer-reviews.json`;
if (process.argv.includes("--capture")) {
  mkdirSync(`${root}/supabase/baselines`, { recursive: true });
  writeFileSync(path, `${JSON.stringify(baseline, null, 2)}\n`);
} else {
  assert.deepEqual(baseline, JSON.parse(readFileSync(path, "utf8")));
}

const url = process.argv.find((arg) => arg.startsWith("http"));
if (url) {
  const response = await fetch(url);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(html.match(/<section id="peer-reviews".*?<\/section>/s)?.[0], sectionHtml);
}

console.log("Peer Reviews baseline passed: 11 exact strings, order, counters, and rendered section match.");
