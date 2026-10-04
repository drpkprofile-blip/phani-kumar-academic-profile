import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { createServerClient } from "@supabase/ssr";
import { root } from "./publication-seed.mjs";
import { loadModule, compareProfile } from "../tests/helpers/render-profile.mjs";

nextEnv.loadEnvConfig(root);
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(key?.startsWith("sb_publishable_"));
// No cookies/session: exercise the real server read layer as an anonymous visitor.
const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
  cookies: { getAll: () => [], setAll: () => {} },
});
const { getPublicPublications } = loadModule("lib/publications.ts", {
  "./supabase/server": { createClient: async () => client },
});
const data = await getPublicPublications();
assert.equal(data.publications.length, 37);
assert.equal(data.heroPublications, "40+");
assert.equal(data.publications.filter((p) => p.impactFactor !== undefined).length, 6);
const html = await compareProfile(data);
assert.equal(html.current, html.baseline);
console.log("Real anonymous SSR reads passed: all rendered page HTML equals Phase 2C, including 37 cards, links, badges, fallbacks, order and independent 40+ counter.");

if (process.argv[2]) {
  const response = await fetch(process.argv[2]);
  assert.equal(response.status, 200);
  const document = await response.text();
  const main = (markup) => markup.slice(markup.indexOf('<main id="top">'), markup.indexOf("</main>") + 7).replace(/<!--.*?-->/gs, "");
  assert.equal(main(document), main(html.baseline), "Production HTTP page must match the baseline main element");
  console.log("Production HTTP verification passed: the entire main element matches the static baseline.");
}
