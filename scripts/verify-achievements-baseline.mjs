import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { root, readCommittedPublications } from "./publication-seed.mjs";
import { compareProfile, loadModule } from "../tests/helpers/render-profile.mjs";

const source = execFileSync("git", ["show", "HEAD:data/achievements.ts"], {
  cwd: root,
  encoding: "utf8",
}).replaceAll("\r\n", "\n");
assert.equal(readFileSync(`${root}/data/achievements.ts`, "utf8").replaceAll("\r\n", "\n"), source,
  "The committed Achievements source remains the baseline");

const { achievements } = loadModule("data/achievements.ts", {}, source);
assert.equal(achievements.length, 4);
assert.deepEqual(achievements.map((achievement) => achievement.number), ["01", "02", "03", "04"]);

const rendered = await compareProfile({
  publications: readCommittedPublications().sort((a, b) => Number(b.year) - Number(a.year) || a.id - b.id),
  heroPublications: "40+",
});
const section = (html) => html.match(/<section id="achievements".*?<\/section>/s)?.[0].replace(/<!--.*?-->/gs, "");
const sectionHtml = section(rendered.current);
assert.ok(sectionHtml, "Rendered Achievements section must be present");
assert.equal(section(rendered.baseline), sectionHtml,
  "The current Achievements section must match the existing public static design");

const baseline = {
  sourceSha256: createHash("sha256").update(source).digest("hex"),
  achievements,
  sectionHtml,
};
const path = `${root}/supabase/baselines/achievements.json`;
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
  assert.equal(section(await response.text()), sectionHtml);
}

console.log("Achievements baseline passed: committed source, all four records, order, and rendered section match.");
