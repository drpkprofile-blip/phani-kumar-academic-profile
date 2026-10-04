import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { loadModule } from "./helpers/render-profile.mjs";
import { mapPublications, readCommittedPublications } from "../scripts/publication-seed.mjs";

const validation = loadModule("lib/admin/publication-form.ts");
function form(overrides = {}) {
  const data = new FormData();
  for (const [name, value] of Object.entries({ id: "", updated_at: "", title: "Test only", year: "2026", journal: "Test details", ...overrides })) data.set(name, value);
  return data;
}
function actions({ denied = false, error = null } = {}) {
  const calls = []; const invalidated = []; const filters = [];
  const client = {
    rpc: async (name, args) => { calls.push({ name, args }); return { data: 9000000, error }; },
    from: (table) => ({ update(value) {
      calls.push({ table, value });
      const chain = { eq: (key, expected) => { filters.push([key,expected]); return chain; }, select: () => ({ single: async () => ({ data: error ? null : value, error }) }) };
      return chain;
    } }),
  };
  const redirect = (path) => { throw Object.assign(new Error("Redirect"), { path }); };
  return { calls, invalidated, filters, ...loadModule("app/admin/publications/actions.ts", {
    "../../../lib/auth/admin-page": { requireAdminPage: async () => { if (denied) redirect("/admin/login"); return { supabase: client }; } },
    "next/navigation": { redirect }, "next/cache": { revalidatePath: (...args) => invalidated.push(args) },
  }) };
}
const redirected = (callback, path) => assert.rejects(callback, (error) => error.path === path);

test("blank optional metadata becomes NULL, with no invented defaults", () => {
  const parsed = validation.parsePublicationForm(form({ doi: "  ", article_url: "", proof_url: "\n", impact_factor: "", publication_type: "", indexing: "\n " }));
  assert.deepEqual(parsed.errors, {});
  for (const field of ["doi", "article_url", "proof_url", "publication_type", "impact_factor"]) assert.equal(parsed.data[field], null);
  assert.deepEqual(parsed.data.indexing, []);
});

test("form round trips every supplied field of all 37 originals without changing metadata or badges", () => {
  for (const p of readCommittedPublications()) {
    const parsed = validation.parsePublicationForm(form({
      title: p.title, year: p.year, journal: p.journal, indexing: p.indexing.join("\n"),
      doi: p.doi ?? "", article_url: p.url ?? "", proof_url: p.proof ?? "",
      publication_type: p.type ?? "", impact_factor: p.impactFactor?.toString() ?? "",
    }));
    assert.deepEqual(parsed.errors, {}, `Original ID ${p.id} must be editable without corrections`);
    assert.deepEqual(parsed.data, {
      title: p.title, year: p.year, journal: p.journal, indexing: p.indexing,
      doi: p.doi ?? null, article_url: p.url ?? null, proof_url: p.proof || null,
      publication_type: p.type ?? null, impact_factor: p.impactFactor ?? null,
    });
  }
});

test("form rejects invalid required fields, unsafe URLs and false numeric metadata", () => {
  const parsed = validation.parsePublicationForm(form({ title: " ", journal: "", year: "26", article_url: "javascript:alert(1)", proof_url: "https://user:password@example.com", impact_factor: "Infinity", publication_type: "Invented" }));
  for (const field of ["title", "journal", "year", "article_url", "proof_url", "impact_factor", "publication_type"]) assert.ok(parsed.errors[field]);
  assert.equal(validation.parsePublicationForm(form({ impact_factor: "0" })).data.impact_factor, 0);
});

test("every mutation checks admin authorization before performing any write", async () => {
  for (const method of ["savePublication", "deletePublication", "movePublication", "updateHeroCounter"]) {
    const helper = actions({ denied: true });
    await redirected(() => method === "savePublication" ? helper[method]({}, form()) : helper[method](form()), "/admin/login");
    assert.deepEqual(helper.calls, []);
  }
});

test("admin add passes only metadata, then refreshes public reads", async () => {
  const helper = actions();
  await redirected(() => helper.savePublication({}, form({ display_order: "999", source_order: "999" })), "/admin?success=added");
  assert.equal(helper.calls[0].name, "admin_save_publication");
  assert.ok(!("p_id" in helper.calls[0].args));
  assert.ok(!("p_expected_updated_at" in helper.calls[0].args));
  assert.equal(helper.calls[0].args.p_publication.proof_url, null);
  assert.ok(!("display_order" in helper.calls[0].args.p_publication));
  assert.ok(!("source_order" in helper.calls[0].args.p_publication));
  assert.deepEqual(helper.invalidated, [["/"], ["/admin", "layout"]]);
});

test("admin edit sends the selected ID and expected timestamp without changing record order", async () => {
  const helper = actions();
  const timestamp = "2026-10-04T10:00:00Z";
  await redirected(() => helper.savePublication({}, form({ id: "9", updated_at: timestamp, indexing: "SCIE\nQ2-SCOPUS", impact_factor: "2.8" })), "/admin?success=saved");
  assert.equal(helper.calls[0].args.p_id, 9);
  assert.equal(helper.calls[0].args.p_expected_updated_at, timestamp);
  assert.deepEqual(helper.calls[0].args.p_publication.indexing, ["SCIE","Q2-SCOPUS"]);
});

test("delete rejects unconfirmed requests and passes explicit confirmation for the chosen record", async () => {
  const helper = actions();
  const input = { id: "9", updated_at: "2026-10-04T10:00:00Z" };
  await redirected(() => helper.deletePublication(form(input)), "/admin?error=confirmation");
  assert.deepEqual(helper.calls, []);
  await redirected(() => helper.deletePublication(form({ ...input, confirmed: "yes" })), "/admin?success=deleted");
  assert.equal(helper.calls[0].name, "admin_delete_publication");
  assert.equal(helper.calls[0].args.p_confirmed, true);
});

test("reorder sends the full snapshot and correct position for move, up and down", async () => {
  for (const [direction, position, expected] of [["up","2",1],["down","2",3],["","1",1]]) {
    const helper = actions();
    await redirected(() => helper.movePublication(form({ id: "12", order: "[11,12,13]", direction, position })), "/admin?success=reordered");
    assert.deepEqual(helper.calls[0], { name: "admin_move_publication", args: { p_id: 12, p_position: expected, p_expected_order: [11,12,13] } });
  }
  const invalid = actions();
  await redirected(() => invalid.movePublication(form({ id: "12", order: "[12,12]", position: "1" })), "/admin?error=stale");
  assert.deepEqual(invalid.calls, []);
});

test("hero counter changes independently and protects against stale counter edits", async () => {
  const helper = actions();
  await redirected(() => helper.updateHeroCounter(form({ hero_publications: "40+", previous_counter: "39+" })), "/admin?success=counter");
  assert.deepEqual(helper.calls, [{ table: "publication_settings", value: { hero_publications: "40+" } }]);
  assert.deepEqual(helper.filters, [["id",true],["hero_publications","39+"]]);
  const stale = actions({ error: { code: "PGRST116" } });
  await redirected(() => stale.updateHeroCounter(form({ hero_publications: "40+", previous_counter: "39+" })), "/admin?error=stale");
});

test("validation and stale-save feedback retain user-entered fields", async () => {
  const helper = actions();
  const invalid = await helper.savePublication({}, form({ year: "bad" }));
  assert.ok(invalid.errors.year);
  assert.equal(invalid.values.title, "Test only");
  assert.deepEqual(helper.calls, []);
  const stale = await actions({ error: { code: "P0001" } }).savePublication({}, form());
  assert.match(stale.message, /Reload/);
  assert.equal(stale.values.journal, "Test details");
});

test("public rendering derives updated count and hides missing impact factors for newly added data", async () => {
  const rows = mapPublications(readCommittedPublications()).sort((a,b) => a.display_order-b.display_order);
  const { mapPublication } = loadModule("lib/publications.ts", { "./supabase/server": {} });
  const publications = [...rows.map(mapPublication), mapPublication({ ...rows[0], id: 9000000, title: "Temporary only", indexing: [], impact_factor: null, proof_url: null })];
  const Page = loadModule("app/page.tsx", { "../lib/publications": { getPublicPublications: async () => ({ publications, heroPublications: "40+" }) } }).default;
  const html = renderToStaticMarkup(await Page());
  assert.equal((html.match(/class="publication-card"/g) ?? []).length, 38);
  assert.ok(html.includes("<strong>38+</strong>"));
  assert.ok(html.includes("<strong>40+</strong>"));
  assert.equal((html.match(/<span>IF /g) ?? []).length, 6);
});
