import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/render-profile.mjs";

test("education displays unambiguous month/year and year-only records newest first without rewriting source dates", () => {
  const { education, educationNewestFirst } = loadModule("data/education.ts");
  assert.deepEqual(educationNewestFirst.map((record) => record.degree), [
    "Master of Technology",
    "Doctor of Philosophy",
    "Master of Engineering",
    "Bachelor of Technology",
    "Intermediate",
    "School (X)",
  ]);
  assert.deepEqual(education.map((record) => record.year), ["February 2026", "June 2026", "2010", "2005", "2000", "1998"]);
});
