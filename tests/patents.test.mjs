import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import { compareProfile, loadModule } from "./helpers/render-profile.mjs";

const valid = {
  application_number: "202141030245 A",
  filing_date: "2021-07-06",
  publication_date: "2021-07-16",
  title: "PROCESS OF PLASTIC WASTE FOR PRODUCTS OF BUILDING MATERIALS WITH PLASTIC EXTRUSION METHOD",
  journal_number: "29/2021",
  page_number: "31374",
  proof_url: "",
};
const formData = (fields = {}) => {
  const form = new FormData();
  for (const [name, value] of Object.entries({ id: "", updated_at: "", ...valid, ...fields })) form.set(name, value);
  return form;
};

test("patent form accepts the supplied record and validates real ISO dates and safe optional URLs", () => {
  const validation = loadModule("lib/admin/patent-form.ts");
  const parsed = validation.parsePatentForm(formData({
    proof_url: "https://drive.google.com/file/d/example/view?usp=drive_link&x=1",
  }));
  assert.deepEqual(parsed.errors, {});
  assert.equal(parsed.data.application_number, valid.application_number);
  assert.equal(parsed.data.proof_url, "https://drive.google.com/file/d/example/view?usp=drive_link&x=1");
  assert.deepEqual(validation.parsePatentForm(formData()).errors, {});
  for (const fields of [
    { application_number: "  " }, { title: "\t" }, { journal_number: " " },
    { filing_date: "2021-02-29" }, { publication_date: "16/07/2021" },
    { publication_date: "2021-07-05" }, { proof_url: "javascript:alert(1)" },
    { proof_url: "https://user:pw@example.test/proof" }, { proof_url: "https://example.test/a b" },
  ]) assert.ok(Object.keys(validation.parsePatentForm(formData(fields)).errors).length > 0, JSON.stringify(fields));
  assert.equal(validation.positivePatentId("5"), 5);
  assert.equal(validation.positivePatentId("0"), null);
});

test("public patent reader maps fields and orders latest dates first", async () => {
  const calls = [];
  const rows = [{ id: 1, application_number: valid.application_number, filing_date: valid.filing_date,
    publication_date: valid.publication_date, title: valid.title, journal_number: valid.journal_number,
    page_number: valid.page_number, proof_url: null, created_at: "", updated_at: "" }];
  const query = { order(field, options) { calls.push(["order", field, options]); return query; },
    then(resolve, reject) { return Promise.resolve({ data: rows, error: null }).then(resolve, reject); } };
  const client = { from(table) { calls.push(["from", table]); return { select(columns) {
    calls.push(["select", columns]); return query;
  } }; } };
  const reader = loadModule("lib/patents.ts", { "./supabase/server": { createClient: async () => client } });
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const previous = names.map((name) => process.env[name]);
  names.forEach((name) => { process.env[name] = "test-configured"; });
  try {
    assert.deepEqual(await reader.getPublicPatents(), [{
      id: 1, applicationNumber: valid.application_number, filingDate: valid.filing_date,
      publicationDate: valid.publication_date, title: valid.title, journalNumber: "29/2021", pageNumber: "31374", proofUrl: undefined,
    }]);
  } finally {
    names.forEach((name, i) => previous[i] === undefined ? delete process.env[name] : process.env[name] = previous[i]);
  }
  assert.deepEqual(calls, [["from", "patents"], ["select", "*"],
    ["order", "filing_date", { ascending: false }], ["order", "publication_date", { ascending: false }]]);
});

test("public page falls back to the supplied patent if the Supabase migration is pending", async () => {
  const query = { order() { return query; }, then(resolve, reject) {
    return Promise.resolve({ data: null, error: { code: "PGRST205" } }).then(resolve, reject);
  } };
  const client = { from() { return { select() { return query; } }; } };
  const reader = loadModule("lib/patents.ts", { "./supabase/server": { createClient: async () => client } });
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const previous = names.map((name) => process.env[name]);
  names.forEach((name) => { process.env[name] = "test-configured"; });
  try {
    assert.deepEqual(await reader.getPublicPatents(), [loadModule("data/patents.ts").patents[0]]);
  } finally {
    names.forEach((name, i) => previous[i] === undefined ? delete process.env[name] : process.env[name] = previous[i]);
  }
});

test("public Patents section presents all supplied application metadata and a pending proof link", async () => {
  const record = { id: 1, applicationNumber: valid.application_number, filingDate: valid.filing_date,
    publicationDate: valid.publication_date, title: valid.title, journalNumber: valid.journal_number, pageNumber: valid.page_number };
  const { rawCurrent } = await compareProfile({ publications: [], heroPublications: "0+" }, undefined, undefined,
    undefined, undefined, undefined, undefined, false, undefined, [], false, undefined, undefined, [record]);
  const section = rawCurrent.match(/<section id="patents"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  for (const text of ["202141030245 A", "06/07/2021", "16/07/2021", "29/2021", "31374", valid.title, "Proof link will be added soon"]) {
    assert.ok(section.includes(text), `Missing public patent detail: ${text}`);
  }
});

test("admin patent mutations require an admin, validate, and call secured RPCs", async () => {
  const calls = [];
  const revalidated = [];
  const redirect = (path) => { throw Object.assign(new Error("Redirect"), { path }); };
  const supabase = { rpc: async (name, args) => { calls.push({ name, args }); return { error: null }; } };
  const dependencies = (denied = false) => ({
    "../../../lib/auth/admin-page": { requireAdminPage: async () => {
      if (denied) redirect("/admin/login");
      return { supabase };
    } },
    "next/navigation": { redirect },
    "next/cache": { revalidatePath: (...args) => revalidated.push(args) },
  });
  const actions = loadModule("app/admin/patents/actions.ts", dependencies());
  const deniedActions = loadModule("app/admin/patents/actions.ts", dependencies(true));
  await assert.rejects(deniedActions.savePatent({}, formData()), (error) => error.path === "/admin/login");
  assert.equal(calls.length, 0);
  await assert.rejects(actions.savePatent({}, formData()), (error) => error.path === "/admin/patents?success=added");
  assert.deepEqual(calls[0], { name: "admin_save_patent", args: { p_patent: {
    application_number: valid.application_number, filing_date: valid.filing_date,
    publication_date: valid.publication_date, title: valid.title, journal_number: valid.journal_number,
    page_number: valid.page_number, proof_url: null,
  } } });
  assert.deepEqual(revalidated, [["/"], ["/admin", "layout"]]);
  const rejected = await actions.savePatent({}, formData({ proof_url: "javascript:bad" }));
  assert.equal(rejected.errors.proof_url, "Enter a valid HTTP or HTTPS URL.");
  await assert.rejects(actions.deletePatent(formData({ id: "1", updated_at: "2026-10-01T00:00:00Z" })),
    (error) => error.path === "/admin/patents?error=confirmation");
  assert.equal(calls.length, 1);
});

test("patents have public navigation and admin CRUD routes with database authorization", () => {
  for (const file of [
    "app/admin/patents/page.tsx", "app/admin/patents/new/page.tsx",
    "app/admin/patents/[id]/edit/page.tsx", "app/admin/patents/[id]/delete/page.tsx",
  ]) {
    assert.ok(existsSync(`${root}/${file}`), `Missing ${file}`);
    assert.match(readFileSync(`${root}/${file}`, "utf8"), /requireAdminPage/);
  }
  const migration = readFileSync(`${root}/supabase/migrations/20261023000100_patents.sql`, "utf8");
  const databaseTests = readFileSync(`${root}/supabase/tests/patents.sql`, "utf8");
  for (const phrase of ["public.patents", "public.is_publications_admin()", "admin_save_patent", "admin_delete_patent", "security invoker", "202141030245 A", "29/2021", "31374"]) {
    assert.ok(migration.includes(phrase), `Missing migration feature: ${phrase}`);
  }
  for (const phrase of ["Anonymous patent save is denied", "Non-admin patent save is denied", "Admin can add a patent", "Publication before filing is rejected", "Original supplied patent record remains unchanged"]) {
    assert.ok(databaseTests.includes(phrase), `Missing database assertion: ${phrase}`);
  }
  assert.match(readFileSync(`${root}/app/admin/page.tsx`, "utf8"), /href="\/admin\/patents"/);
  assert.match(readFileSync(`${root}/app/page.tsx`, "utf8"), /section id="patents"/);
});
