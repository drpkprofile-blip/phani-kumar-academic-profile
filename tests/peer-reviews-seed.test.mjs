import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import {
  buildMigration,
  mapPeerReviews,
  migrationPath,
  readCommittedPeerReviews,
} from "../scripts/peer-review-seed.mjs";

const source = readCommittedPeerReviews();
const rows = mapPeerReviews(source);

test("Peer Reviews seed preserves all eleven strings byte-for-byte and array order", () => {
  assert.equal(rows.length, 11);
  assert.deepEqual(rows.map(({ id, source_order, display_order }) => [id, source_order, display_order]),
    Array.from({ length: 11 }, (_, index) => [index + 1, index + 1, index + 1]));
  assert.deepEqual(rows.map((row) => row.review_text), source);
  assert.equal(new Set(rows.map((row) => row.review_text)).size, 11);
  assert.ok(rows.every((row) => !/[\r\n]/.test(row.review_text)));
  assert.ok(rows[2].review_text.includes("Proceedings of the Institution of Mechanical Engineers, Part G:"));
});

test("Peer Reviews seed SQL is guarded, repeatable, and preserves counters and timestamps", () => {
  const migration = buildMigration(rows);
  assert.equal(readFileSync(`${root}/${migrationPath}`, "utf8").replaceAll("\r\n", "\n"), migration);
  assert.match(migration, /left join phase_peer_reviews_expected/);
  assert.match(migration, /where not exists/);
  assert.match(migration, /on conflict \(singleton\) do nothing/);
  assert.match(migration, /hero_counter_text = '16\+'/);
  assert.match(migration, /completed_reviews_count = 16/);
  assert.doesNotMatch(migration, /update public\.peer_reviews|delete from public\.peer_reviews/i);
});
