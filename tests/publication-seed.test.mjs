import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { root, migrationPath, readCommittedPublications, mapPublications, buildMigration } from "../scripts/publication-seed.mjs";

test("all source values and known visible order are preserved", () => {
  const source = readCommittedPublications();
  const rows = mapPublications(source);
  rows.forEach((row, i) => {
    const p = source[i];
    assert.deepEqual([row.id,row.title,row.year,row.journal,row.indexing,row.doi,row.article_url,row.publication_type,row.impact_factor],
      [p.id,p.title,p.year,p.journal,p.indexing,p.doi ?? null,p.url ?? null,p.type ?? null,p.impactFactor ?? null]);
    assert.equal(row.source_order, i + 1);
    assert.equal(row.proof_url, null);
  });
  assert.deepEqual([...rows].sort((a,b) => a.display_order-b.display_order).map((p) => p.id),
    [1,2,3,4,5,6,7,8,9,10,11,15,12,13,14,16,17,18,19,20,21,22,23,24,25,27,26,28,29,30,31,32,33,34,35,36,37]);
  assert.deepEqual(rows.filter((p) => p.impact_factor !== null).map((p) => [p.id,p.impact_factor]), [[1,2.8],[3,1.6],[6,2.5],[7,3.9],[12,1.5],[16,3.5]]);
});

test("generated migration exactly matches committed-source mapping", () => {
  assert.equal(readFileSync(`${root}/${migrationPath}`, "utf8").replaceAll("\r\n", "\n"), buildMigration(mapPublications(readCommittedPublications())));
});

test("seed refuses duplicate IDs and unexpected proof enrichment", () => {
  const source = readCommittedPublications();
  assert.throws(() => mapPublications(source.map((p) => ({...p,id:1}))));
  assert.throws(() => mapPublications(source.map((p) => ({...p,proof:"https://example.com/proof"}))));
});
