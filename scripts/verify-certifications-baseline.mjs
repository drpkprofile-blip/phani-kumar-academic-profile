import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { root, readCommittedPublications } from "./publication-seed.mjs";
import { compareProfile, loadModule } from "../tests/helpers/render-profile.mjs";

const source = execFileSync("git", ["show", "HEAD:data/certifications.ts"], {
  cwd: root,
  encoding: "utf8",
}).replaceAll("\r\n", "\n");
assert.equal(readFileSync(`${root}/data/certifications.ts`, "utf8").replaceAll("\r\n", "\n"), source);

const { certifications } = loadModule("data/certifications.ts", {}, source);
assert.equal(certifications.length, 13);
assert.deepEqual(certifications.map((record) => record.number), Array.from({ length: 13 }, (_, i) => i + 1));

const rendered = await compareProfile({
  publications: readCommittedPublications().sort((a, b) => Number(b.year) - Number(a.year) || a.id - b.id),
  heroPublications: "40+",
});
const section = (html) => html.match(/<section id="certifications".*?<\/section>/s)?.[0].replace(/<!--.*?-->/gs, "");
const sectionHtml = section(rendered.current);
assert.ok(sectionHtml, "Rendered NPTEL section must be present");

const baseline = {
  sourceSha256: createHash("sha256").update(source).digest("hex"),
  certifications,
  sectionHtml,
};
const path = `${root}/supabase/baselines/certifications.json`;
if (process.argv.includes("--capture")) {
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

console.log("Certifications baseline passed: committed source, all 13 records, order and rendered NPTEL section match.");
