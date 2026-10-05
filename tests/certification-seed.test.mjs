import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import { buildMigration, mapCertifications, readCommittedCertifications } from "../scripts/certification-seed.mjs";

const source = readCommittedCertifications();
const rows = mapCertifications(source);

test("Certification seed maps only supplied fields and preserves every URL and source/display order", () => {
  assert.equal(rows.length, 13);
  assert.deepEqual(rows.map((record) => [record.id, record.source_order, record.display_order]),
    Array.from({ length: 13 }, (_, index) => [index + 1, index + 1, index + 1]));
  for (const [index, record] of source.entries()) {
    assert.equal(rows[index].title, record.title);
    assert.equal(rows[index].certificate_url, record.certificateUrl ?? null);
    assert.equal(rows[index].fdp_url, record.fdpUrl ?? null);
  }
  assert.equal(rows.filter((record) => record.certificate_url !== null).length, 9);
  assert.equal(rows.filter((record) => record.certificate_url === null).length, 4);
  assert.equal(rows.filter((record) => record.fdp_url !== null).length, 6);
  assert.equal(rows.filter((record) => record.fdp_url === null).length, 7);
});

test("Generated seed is guarded, idempotent and matches the committed migration", () => {
  const migration = buildMigration(rows);
  const path = `${root}/supabase/migrations/20261005000200_seed_certifications.sql`;
  assert.equal(readFileSync(path, "utf8").replaceAll("\r\n", "\n"), migration);
  assert.match(migration, /left join phase4c_expected/);
  assert.match(migration, /where not exists/);
  assert.match(migration, /conflict with committed source/);
  assert.doesNotMatch(migration, /update public\.certifications|delete from public\.certifications/i);
});
