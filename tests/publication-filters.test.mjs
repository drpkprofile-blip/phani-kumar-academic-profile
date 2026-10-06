import assert from "node:assert/strict";
import test from "node:test";
import { publications } from "../data/publications.ts";
import { filterPublications, getPublicationYears } from "../lib/publication-filter.ts";

test("publication years are unique and ordered newest first", () => {
  const years = getPublicationYears(publications);
  assert.equal(new Set(years).size, years.length);
  assert.deepEqual(years, [...years].sort((a, b) => Number(b) - Number(a)));
  assert.ok(years.length > 1);
});

test("ALL returns every publication in the existing visible order", () => {
  const before = structuredClone(publications);
  const result = filterPublications(publications, "ALL");
  assert.deepEqual(result, publications);
  assert.deepEqual(publications, before);
});

test("each year returns only exact matching records in their current relative order", () => {
  for (const year of getPublicationYears(publications)) {
    const filtered = filterPublications(publications, year);
    assert.ok(filtered.length > 0);
    assert.ok(filtered.every((publication) => publication.year === year));
    assert.deepEqual(filtered, publications.filter((publication) => publication.year === year));
  }
});

test("switching from a year back to ALL restores the complete unchanged list", () => {
  const before = JSON.stringify(publications);
  const year = getPublicationYears(publications)[0];
  filterPublications(publications, year);
  assert.deepEqual(filterPublications(publications, "ALL"), publications);
  assert.equal(JSON.stringify(publications), before);
});
