import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/render-profile.mjs";

test("public Google Scholar metrics show only the primary number", () => {
  const { primaryScholarMetric } = loadModule("lib/scholar-metrics.ts");
  assert.equal(primaryScholarMetric("179 (142)"), "179");
  assert.equal(primaryScholarMetric("8 (8)"), "8");
  assert.equal(primaryScholarMetric("5 (4)"), "5");
  assert.equal(primaryScholarMetric("22"), "22");
  assert.equal(primaryScholarMetric("unparsed value"), "unparsed value");
});
