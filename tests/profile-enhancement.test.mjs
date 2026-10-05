import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { root } from "../scripts/publication-seed.mjs";
import { loadModule } from "./helpers/render-profile.mjs";

const migration = readFileSync(`${root}/supabase/migrations/20261005001800_profile_settings_and_photo_storage.sql`, "utf8");

test("profile settings migration seeds the committed profile and locks writes to the existing admin allowlist", () => {
  assert.match(migration, /create table public\.profile_settings/);
  assert.match(migration, /singleton boolean primary key default true check \(singleton\)/);
  assert.match(migration, /Anyone can read public profile settings[\s\S]*using \(true\)/);
  assert.match(migration, /Allowlisted admin updates profile settings[\s\S]*public\.is_publications_admin\(\)/);
  assert.match(migration, /experience_counter_text[\s\S]*'20\+'/);
  assert.doesNotMatch(migration, /\baddress\b|Bank Colony/i);
  assert.match(migration, /profile\/profile-photo/);
  assert.match(migration, /file_size_limit[\s\S]*8388608/);
  assert.match(migration, /array\['image\/jpeg', 'image\/png', 'image\/webp'\]/);
  assert.match(migration, /Allowlisted admins upload profile photo[\s\S]*public\.is_publications_admin\(\)/);
  assert.match(migration, /Allowlisted admins replace profile photo[\s\S]*public\.is_publications_admin\(\)/);
  assert.doesNotMatch(migration, /service.role|service_role|secret key/i);
});

test("academic month-year formatting is readable while year-only and descriptive date ranges remain exact", () => {
  const { formatAcademicDate } = loadModule("lib/date-format.ts");
  assert.equal(formatAcademicDate("February 2026"), "02/2026");
  assert.equal(formatAcademicDate("June 2026"), "06/2026");
  assert.equal(formatAcademicDate("2010"), "2010");
  assert.equal(formatAcademicDate("Aug 2012 – Present"), "Aug 2012 – Present");
  assert.equal(formatAcademicDate("012026"), "01/2026");
});

test("profile form preserves exact supplied URLs and values and validates only HTTP/HTTPS links", () => {
  const { parseProfileSettingsForm, profileSettingsToRow } = loadModule("lib/admin/profile-settings-form.ts");
  const form = new FormData();
  const values = {
    name: "Dr. Phani Kumar Simhadri", first_name: "Dr. Phani", last_name: "Kumar Simhadri",
    qualifications: "Qualifications", designation: "Assistant Professor", department: "Mechanical Engineering",
    institution: "ANITS", profile_label: "ACADEMIC & RESEARCH PROFILE", description: "Profile text",
    email: "sphani.me@anits.edu.in", phone: "+91 9866701200",
    experience_counter_text: "20+", youtube_title: "Code & CAD with PK",
    youtube_href: "https://youtube.com/@codeandcadwithpk?si=vaESyvrIBw5tMVYi",
    youtube_image: "/youtube-channel-logo.png", technical_tools: "SOLID WORKS\nANSYS",
    skills: "Research advisement", research_interests: "Tribology\nMachine Learning",
    academic_identity: JSON.stringify([{ label: "ORCID ID", value: "0000-0002-4097-2635", href: "" }]),
    profile_links: JSON.stringify([{ label: "ResearchGate", href: "https://www.researchgate.net/profile/Phani-Simhadri?ev=hdr_xprf" }]),
  };
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  const parsed = parseProfileSettingsForm(form);
  assert.deepEqual(parsed.errors, {});
  const row = profileSettingsToRow(parsed.values);
  assert.equal(row.youtube_channel.href, values.youtube_href);
  assert.equal(row.profile_links[0].href, values.profile_links && JSON.parse(values.profile_links)[0].href);
  assert.equal(row.academic_identity[0].value, "0000-0002-4097-2635");
  assert.deepEqual(row.technical_tools, ["SOLID WORKS", "ANSYS"]);

  form.set("profile_links", JSON.stringify([{ label: "Unsafe", href: "javascript:alert(1)" }]));
  assert.ok(parseProfileSettingsForm(form).errors.profile_links);
  form.set("profile_links", JSON.stringify([{ label: "Optional link", href: "" }]));
  assert.equal(parseProfileSettingsForm(form).errors.profile_links, undefined);
});

test("public profile reader maps the singleton row and falls back during an unapplied migration", async () => {
  const row = {
    singleton: true, name: "Managed name", first_name: "Managed", last_name: "Name",
    qualifications: "Qualifications", designation: "Assistant Professor", department: "Mechanical Engineering",
    institution: "ANITS", profile_label: "ACADEMIC PROFILE", description: "Managed biography",
    email: "person@example.edu", phone: "+91 1234567890",
    photo_url: "https://example.supabase.co/storage/v1/object/public/profile-assets/profile/profile-photo?v=1",
    academic_identity: [{ label: "ORCID ID", value: "0000-0002-4097-2635", href: "" }],
    profile_links: [{ label: "Scholar", href: "https://scholar.google.com/example?key=value" }],
    youtube_channel: { title: "Channel", href: "https://youtube.com/@channel", image: "/youtube-channel-logo.png" },
    technical_tools: ["ANSYS"], skills: ["Teaching"], research_interests: ["Tribology"],
    experience_counter_text: "20+", created_at: "2026-10-05T00:00:00Z", updated_at: "2026-10-05T00:00:00Z",
  };
  const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const old = names.map((name) => process.env[name]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  try {
    const helper = loadModule("lib/profile-settings.ts", { "./supabase/server": { createClient: async () => ({
      from(table) { assert.equal(table, "profile_settings"); return { select() { return { eq(field, value) {
        assert.equal(field, "singleton"); assert.equal(value, true); return { single: async () => ({ data: row, error: null }) };
      } }; } }; },
    }) } });
    const result = await helper.getPublicProfileSettings();
    assert.equal(result.profile.name, "Managed name");
    assert.equal(result.profile.photo, row.photo_url);
    assert.equal(result.profile.academicIdentity[0].value, "0000-0002-4097-2635");
    assert.equal(result.profile.profileLinks[0].href, row.profile_links[0].href);
    assert.equal(result.experienceCounterText, "20+");
  } finally {
    names.forEach((name, index) => { if (old[index] === undefined) delete process.env[name]; else process.env[name] = old[index]; });
  }

  const missingTable = loadModule("lib/profile-settings.ts", { "./supabase/server": { createClient: async () => ({
    from() { return { select() { return { eq() { return { single: async () => ({ data: null, error: { code: "PGRST205" } }) }; } }; } }; },
  }) } });
  const fallback = await missingTable.getPublicProfileSettings();
  assert.equal(fallback.profile.name, "Dr. Phani Kumar Simhadri");
  assert.equal(fallback.experienceCounterText, "20+");
});

test("dashboard links to protected profile settings and photo route uses an authenticated server action", () => {
  const dashboard = readFileSync(`${root}/app/admin/page.tsx`, "utf8");
  const page = readFileSync(`${root}/app/admin/profile/page.tsx`, "utf8");
  const actions = readFileSync(`${root}/app/admin/profile/actions.ts`, "utf8");
  assert.match(dashboard, /href="\/admin\/profile"/);
  assert.match(page, /requireAdminPage\(\)/);
  assert.match(page, /uploadProfilePhoto/);
  assert.match(actions, /requireAdminPage\(\)/);
  assert.match(actions, /from\("profile-assets"\)\.upload/);
  assert.match(actions, /file\.size > 8 \* 1024 \* 1024/);
});
