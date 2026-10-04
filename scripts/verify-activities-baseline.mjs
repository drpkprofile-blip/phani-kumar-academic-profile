import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { root, readCommittedPublications } from "./publication-seed.mjs";
import { loadModule, compareProfile } from "../tests/helpers/render-profile.mjs";

const source = execFileSync("git", ["show", "HEAD:data/activities.ts"], { cwd: root, encoding: "utf8" }).replaceAll("\r\n", "\n");
assert.equal(readFileSync(`${root}/data/activities.ts`, "utf8").replaceAll("\r\n", "\n"), source);
const data = loadModule("data/activities.ts", {}, source);
assert.equal(data.activities.length, 46);
const rendered = await compareProfile({
  publications: readCommittedPublications().sort((a,b) => Number(b.year)-Number(a.year) || a.id-b.id),
  heroPublications: "40+",
});
const section = (html) => html.match(/<section id="activities".*?<\/section>/s)?.[0].replace(/<!--.*?-->/gs, "");
assert.ok(section(rendered.current));
assert.equal(section(rendered.current), section(rendered.baseline));
const baseline = {
  sourceSha256: createHash("sha256").update(source).digest("hex"),
  activities: data.activities, categories: data.activityTypes, years: data.activityYears,
  sectionHtml: section(rendered.current),
};
const path = `${root}/supabase/baselines/activities.json`;
if (process.argv.includes("--capture")) writeFileSync(path, `${JSON.stringify(baseline, null, 2)}\n`);
else assert.deepEqual(baseline, JSON.parse(readFileSync(path, "utf8")));
const url = process.argv.find((arg) => arg.startsWith("http"));
if (url) {
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.equal(section(await response.text()), baseline.sectionHtml);
}
console.log("Activities baseline passed: committed source, all 46 records, category/year order and exact rendered section unchanged.");
