import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import {
  buildMigration,
  mapAchievements,
  migrationPath,
  readCommittedAchievements,
} from "../scripts/achievement-seed.mjs";

const source = readCommittedAchievements();
const rows = mapAchievements(source);

test("Achievements seed preserves exactly four records, text, URLs, and array order", () => {
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.map(({ id, source_order, display_order }) => [id, source_order, display_order]),
    [[1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 4]]);
  for (const [index, record] of source.entries()) {
    assert.equal(rows[index].title, record.title);
    assert.equal(rows[index].description, record.text);
    assert.equal(rows[index].proof_url, record.proof ?? null);
    assert.equal(rows[index].extra_proof_url, record.extraProof ?? null);
  }
  assert.equal(rows.filter((record) => record.proof_url !== null).length, 4);
  assert.equal(rows.filter((record) => record.extra_proof_url !== null).length, 1);
  assert.equal(rows.filter((record) => record.extra_proof_url === null).length, 3);
  assert.equal(rows[1].extra_proof_url,
    "https://drive.google.com/file/d/1SslACwcOG3n2UaOmu1QdAqh-4-JoPOvH/view?usp=drive_link");
  assert.equal(rows[3].proof_url,
    "https://drive.google.com/drive/folders/1MndZ9k4UZH06eGZS1id8HpoVXMWl8pXm?usp=drive_link");
});

test("Generated seed is guarded, idempotent, and matches the committed migration", () => {
  const migration = buildMigration(rows);
  assert.equal(readFileSync(`${root}/${migrationPath}`, "utf8").replaceAll("\r\n", "\n"), migration);
  assert.match(migration, /left join phase8c_expected/);
  assert.match(migration, /where not exists/);
  assert.match(migration, /count\(\*\) from public\.achievements\) <> 4/);
  assert.match(migration, /conflict with committed source/);
  assert.doesNotMatch(migration, /update public\.achievements|delete from public\.achievements/i);
});
