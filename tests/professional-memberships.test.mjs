import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { root } from "../scripts/publication-seed.mjs";
import { buildSeedMigration, mapProfessionalMemberships, migrationPath, readProfessionalMemberships } from "../scripts/professional-membership-seed.mjs";
import { loadModule } from "./helpers/render-profile.mjs";

const source = readProfessionalMemberships();
const mapped = mapProfessionalMemberships(source);
const formModule = loadModule("lib/admin/professional-membership-form.ts");
function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ id: "", updated_at: "", organization_name: "Condition Monitoring Society of India (MCMSI)", membership_type: "Member",
    membership_number: "", date_text: "", validity_text: "", designation: "", chapter: "", proof_url: "", ...overrides })) data.set(key, value);
  return data;
}
function harness({ denied = false, error = null } = {}) {
  const calls = []; const paths = [];
  const redirect = (path) => { throw Object.assign(new Error("Redirect"), { path }); };
  const supabase = { rpc: async (name, args) => { calls.push({ name, args }); return { data: 100, error }; } };
  return { calls, paths, ...loadModule("app/admin/professional-memberships/actions.ts", {
    "../../../lib/auth/admin-page": { requireAdminPage: async () => { if (denied) redirect("/admin/login"); return { supabase }; } },
    "next/navigation": { redirect }, "next/cache": { revalidatePath: (...args) => paths.push(args) },
  }) };
}
const redirected = (run, path) => assert.rejects(run, (error) => error.path === path);

test("seed contains only the single supplied membership and preserves the approved wording", () => {
  assert.deepEqual(mapped, [{ id: 1, organization_name: "Condition Monitoring Society of India (MCMSI)", membership_type: "Member",
    membership_number: null, date_text: null, validity_text: null, designation: null, chapter: null, proof_url: null,
    source_order: 1, display_order: 1 }]);
});

test("repeatable seed SQL matches the generated migration and refuses enrichment", () => {
  const migration = buildSeedMigration(mapped);
  assert.equal(readFileSync(`${root}/${migrationPath}`, "utf8").replaceAll("\r\n", "\n"), migration);
  assert.match(migration, /where not exists/);
  assert.match(migration, /count\(\*\) from public\.professional_memberships\) <> 1/);
  assert.match(migration, /rows conflict with the supplied record/);
  assert.doesNotMatch(migration, /update public\.professional_memberships|delete from public\.professional_memberships/i);
});

test("membership form preserves nonblank values and maps blank optional fields to NULL", () => {
  const proof = "https://example.test/membership.pdf?keep=1&query=exact";
  const parsed = formModule.parseProfessionalMembershipForm(form({ organization_name: "  Society wording  ", membership_number: "  A-1  ", proof_url: proof }));
  assert.deepEqual(parsed.errors, {});
  assert.equal(parsed.data.organization_name, "  Society wording  ");
  assert.equal(parsed.data.membership_number, "  A-1  ");
  assert.equal(parsed.data.membership_type, "Member");
  assert.equal(parsed.data.proof_url, proof);
  for (const field of ["date_text", "validity_text", "designation", "chapter"]) assert.equal(parsed.data[field], null);
});

test("membership form rejects blank organization and invalid, unsafe, or credential-bearing proof URLs", () => {
  for (const values of [{ organization_name: "  " }, { proof_url: "ftp://example.test/file" },
    { proof_url: "javascript:alert(1)" }, { proof_url: "https://user:pass@example.test/file" }, { proof_url: "https://example.test/with space" }]) {
    assert.ok(Object.keys(formModule.parseProfessionalMembershipForm(form(values)).errors).length > 0);
  }
});

test("server actions require the allowlisted admin before mutation", async () => {
  const helper = harness({ denied: true });
  await redirected(() => helper.saveProfessionalMembership({}, form()), "/admin/login");
  await redirected(() => helper.deleteProfessionalMembership(form({ id: "1", updated_at: "2026-10-05T00:00:00Z", confirmed: "yes" })), "/admin/login");
  await redirected(() => helper.moveProfessionalMembership(form({ id: "1", order: "[1]", position: "1" })), "/admin/login");
  assert.deepEqual(helper.calls, []);
});

test("admin create sends approved fields only and edit cannot move the record", async () => {
  const add = harness();
  await redirected(() => add.saveProfessionalMembership({}, form({ proof_url: "", display_order: "99", source_order: "100" })), "/admin/professional-memberships?success=added");
  assert.deepEqual(add.calls[0], { name: "admin_save_professional_membership", args: { p_membership: {
    organization_name: "Condition Monitoring Society of India (MCMSI)", membership_type: "Member", membership_number: null,
    date_text: null, validity_text: null, designation: null, chapter: null, proof_url: null,
  } } });
  assert.deepEqual(add.paths, [["/"], ["/admin", "layout"]]);
  const edit = harness(); const timestamp = "2026-10-05T00:00:00Z";
  await redirected(() => edit.saveProfessionalMembership({}, form({ id: "2", updated_at: timestamp, organization_name: "Edited" })), "/admin/professional-memberships?success=saved");
  assert.equal(edit.calls[0].args.p_id, 2);
  assert.equal(edit.calls[0].args.p_expected_updated_at, timestamp);
  assert.equal("display_order" in edit.calls[0].args.p_membership, false);
});

test("delete is confirmed and reorder submits a unique complete order snapshot", async () => {
  const helper = harness(); const time = "2026-10-05T00:00:00Z";
  await redirected(() => helper.deleteProfessionalMembership(form({ id: "1", updated_at: time })), "/admin/professional-memberships?error=confirmation");
  await redirected(() => helper.deleteProfessionalMembership(form({ id: "1", updated_at: time, confirmed: "yes" })), "/admin/professional-memberships?success=deleted");
  await redirected(() => helper.moveProfessionalMembership(form({ id: "2", order: "[1,2,3]", direction: "up" })), "/admin/professional-memberships?success=reordered");
  assert.deepEqual(helper.calls.map((call) => call.name), ["admin_delete_professional_membership", "admin_move_professional_membership"]);
  assert.deepEqual(helper.calls[1].args, { p_id: 2, p_position: 1, p_expected_order: [1, 2, 3] });
});

test("membership database RLS and management SQL cover public reads and admin-only writes", () => {
  const foundation = readFileSync(`${root}/supabase/migrations/20261005000700_professional_memberships_foundation.sql`, "utf8");
  const management = readFileSync(`${root}/supabase/migrations/20261005000800_professional_memberships_management.sql`, "utf8");
  const rlsTest = readFileSync(`${root}/supabase/tests/professional_memberships_rls.sql`, "utf8");
  const managementTest = readFileSync(`${root}/supabase/tests/professional_memberships_management.sql`, "utf8");
  for (const phrase of ["organization_name text not null", "is_publications_admin()", "for select to anon, authenticated", "deferrable initially immediate"]) assert.ok(foundation.includes(phrase));
  for (const phrase of ["security invoker", "is_publications_admin()", "professional_memberships_display_order_unique deferred", "admin_save_professional_membership", "admin_delete_professional_membership", "admin_move_professional_membership"]) assert.ok(management.includes(phrase));
  for (const phrase of ["Anonymous visitors can read memberships", "Anonymous membership insert is denied", "Authenticated non-admin membership insert is denied", "Existing allowlisted admin is recognized", "optional metadata", "deferrable constraint"]) assert.ok(rlsTest.includes(phrase));
  for (const phrase of ["Blank organization name is rejected", "Invalid proof URL is rejected", "source order NULL", "Editing metadata preserves display position", "transactionally", "explicit confirmation", "timestamps are unchanged"]) assert.ok(managementTest.includes(phrase));
});

test("protected list, add, edit and confirmed-delete routes link from the admin dashboard", () => {
  const routes = ["app/admin/professional-memberships/page.tsx", "app/admin/professional-memberships/new/page.tsx",
    "app/admin/professional-memberships/[id]/edit/page.tsx", "app/admin/professional-memberships/[id]/delete/page.tsx"];
  for (const path of routes) {
    assert.ok(existsSync(`${root}/${path}`));
    assert.match(readFileSync(`${root}/${path}`, "utf8"), /requireAdminPage/);
  }
  assert.match(readFileSync(`${root}/app/admin/page.tsx`, "utf8"), /href="\/admin\/professional-memberships"/);
});
