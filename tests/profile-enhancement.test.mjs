import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { root } from "../scripts/publication-seed.mjs";
import { compareProfile, loadModule } from "./helpers/render-profile.mjs";

const migration = readFileSync(`${root}/supabase/migrations/20261005001800_profile_settings_and_photo_storage.sql`, "utf8");
const citationsMigration = readFileSync(`${root}/supabase/migrations/20261005001900_manage_google_scholar_citation_image.sql`, "utf8");
const scholarMigration = readFileSync(`${root}/supabase/migrations/20261005002000_google_scholar_metrics_and_irins.sql`, "utf8");
const heroMessageMigration = readFileSync(`${root}/supabase/migrations/20261006000600_home_hero_messages.sql`, "utf8");
const profileSettingsRls = readFileSync(`${root}/supabase/tests/profile_settings_rls.sql`, "utf8");

test("home hero message supports admin-managed quotes and festival wishes with constrained text", async () => {
  assert.match(heroMessageMigration, /hero_message_mode text not null default 'quote'[\s\S]*hero_message_mode in \('quote', 'greeting'\)/);
  assert.match(heroMessageMigration, /hero_quote text not null default '[^']+'[\s\S]*length\(btrim\(hero_quote\)\) between 1 and 280/);
  assert.match(heroMessageMigration, /hero_greeting text not null default '[^']+'[\s\S]*length\(btrim\(hero_greeting\)\) between 1 and 280/);
  assert.match(heroMessageMigration, /hero_quote_attribution text not null default ''/);
  assert.match(heroMessageMigration, /hero_greeting_attribution text not null default ''/);
  assert.match(profileSettingsRls, /select plan\(25\)/);
  assert.match(profileSettingsRls, /Anonymous readers can see the selected home hero message/);
  assert.match(profileSettingsRls, /Allowlisted admin can select and edit the public festival greeting/);
  const page = readFileSync(`${root}/app/page.tsx`, "utf8");
  const editor = readFileSync(`${root}/app/admin/profile/profile-editor.tsx`, "utf8");
  const css = readFileSync(`${root}/app/globals.css`, "utf8");
  assert.match(page, /hero-message--\$\{profile\.heroMessage\.mode\}/);
  assert.match(page, /profile\.heroMessage\.mode === "greeting" \? profile\.heroMessage\.greeting : profile\.heroMessage\.quote/);
  assert.match(page, /<div className="hero-nameplate">[\s\S]*?<h1 className="hero-name">\{profile\.name\}<\/h1>[\s\S]*?<h2 className="qualifications">\{profile\.qualifications\}<\/h2>[\s\S]*?<p className="hero-role">[\s\S]*?<p className="institution">\{profile\.institution\}<\/p>\s*<\/div>/);
  assert.match(css, /\.hero-nameplate\s*\{[^}]*border-left:\s*8px solid var\(--teal\)[^}]*background:\s*linear-gradient\(112deg, #0755b7, #0a438e\)/s);
  assert.match(editor, /Show the general quote[\s\S]*Show festival wishes/);
  assert.match(editor, /name === "hero_quote" \|\| name === "hero_greeting" \? 280/);
  assert.match(css, /\.hero-message\s*\{[^}]*min-height:\s*104px/s);
  assert.match(css, /\.hero-message--quote\s*\{[^}]*background:\s*#0b2230/s);
  assert.match(css, /\.hero-message--greeting\s*\{[^}]*background:\s*#0b2230/s);
  assert.match(css, /\.hero-message--quote blockquote,[\s\S]*color:\s*#f0a6c9/s);
  assert.match(css, /\.hero-message--greeting blockquote\s*\{[^}]*color:\s*#e5bd3c/s);
  assert.match(css, /\.hero-message--greeting \.hero-message-kicker\s*\{[^}]*color:\s*var\(--teal\)/s);
  assert.match(css, /\.hero-message--greeting cite\s*\{[^}]*color:\s*#a8bfcb/s);
  assert.match(css, /@media \(max-width: 420px\)\s*\{[^}]*\.hero-message\s*\{/s);
  const general = await compareProfile({ publications: [], heroPublications: "38+" });
  assert.match(general.rawCurrent, /Curiosity inspires discovery; knowledge creates lasting impact\./);
  const festival = await compareProfile(
    { publications: [], heroPublications: "38+" }, undefined, undefined, undefined, undefined, undefined,
    undefined, false, undefined, [], false, { ug: 14, pg: 4 },
    { mode: "greeting", quote: "A general quote", quoteAttribution: "", greeting: "Happy festival to all!", greetingAttribution: "From our family" },
  );
  assert.match(festival.rawCurrent, /FESTIVAL WISHES/);
  assert.match(festival.rawCurrent, /Happy festival to all!/);
  assert.match(festival.rawCurrent, /— From our family/);
  assert.doesNotMatch(festival.rawCurrent, /A general quote/);
});

test("public research interests and technical tools render as spaced responsive tags", async () => {
  const rendered = await compareProfile({ publications: [], heroPublications: "38+" });
  const research = rendered.current.match(/<section id="research"[\s\S]*?<\/section>/)?.[0];
  assert.ok(research, "research section should render");
  for (const item of ["Polymer Composite Gears", "Tribology", "Contact Stress Analysis", "Advanced Engineering Systems", "Python Programming", "SOLID WORKS", "ANSYS", "AUTO CAD"]) {
    assert.ok(research.includes(item), `research section should retain ${item}`);
  }
  const css = readFileSync(`${root}/app/globals.css`, "utf8");
  assert.match(css, /\.tag-list\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*gap:\s*8px/s);
  assert.match(css, /\.tag-list span\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.research-footer-grid\s*\{\s*grid-template-columns:\s*1fr/s);
});

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

test("Google Scholar citation screenshot has public read and protected replacement storage", () => {
  assert.match(citationsMigration, /citations_image_url text not null default '\/google-scholar-citations\.jpg'/);
  assert.match(citationsMigration, /Public Google Scholar citation image is readable[\s\S]*profile\/google-scholar-citations/);
  assert.match(citationsMigration, /Allowlisted admins upload Google Scholar citation image[\s\S]*is_publications_admin\(\)/);
  assert.match(citationsMigration, /Allowlisted admins replace Google Scholar citation image[\s\S]*is_publications_admin\(\)/);
  assert.match(citationsMigration, /Allowlisted admins remove Google Scholar citation image[\s\S]*is_publications_admin\(\)/);
  assert.doesNotMatch(citationsMigration, /service.role|service_role|secret key/i);
});

test("Scholar metrics use the supplied values and IRINS points to the supplied Vidwan profile", () => {
  assert.match(scholarMigration, /google_scholar_citations_text text not null default '179 \(142\)'/);
  assert.match(scholarMigration, /google_scholar_h_index_text text not null default '8 \(8\)'/);
  assert.match(scholarMigration, /google_scholar_i10_index_text text not null default '5 \(4\)'/);
  assert.match(scholarMigration, /https:\/\/vidwan\.inflibnet\.ac\.in\/profile\/262584/);
  assert.match(scholarMigration, /where settings\.singleton[\s\S]*profile_links @> '\[\{"label":"IRINS"\}\]'/);
});

test("academic month-year formatting is readable while year-only and descriptive date ranges remain exact", () => {
  const { formatAcademicDate } = loadModule("lib/date-format.ts");
  assert.equal(formatAcademicDate("February 2026"), "02/2026");
  assert.equal(formatAcademicDate("June 2026"), "06/2026");
  assert.equal(formatAcademicDate("9/1983"), "09/1983");
  assert.equal(formatAcademicDate("09/1983"), "09/1983");
  assert.equal(formatAcademicDate("22 June 1983"), "22/06/1983");
  assert.equal(formatAcademicDate("1983-06-22"), "22/06/1983");
  assert.equal(formatAcademicDate("06/22/1983"), "22/06/1983");
  assert.equal(formatAcademicDate("01/02/1983"), "01/02/1983");
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
    google_scholar_citations_text: "179 (142)", google_scholar_h_index_text: "8 (8)",
    google_scholar_i10_index_text: "5 (4)",
    hero_message_mode: "greeting", hero_quote: "Curiosity creates impact.",
    hero_quote_attribution: "Dr. Phani", hero_greeting: "Happy festival wishes.", hero_greeting_attribution: "Family",
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
  assert.equal(row.google_scholar_citations_text, "179 (142)");
  assert.equal(row.google_scholar_h_index_text, "8 (8)");
  assert.equal(row.google_scholar_i10_index_text, "5 (4)");
  assert.equal(row.hero_message_mode, "greeting");
  assert.equal(row.hero_quote, "Curiosity creates impact.");
  assert.equal(row.hero_quote_attribution, "Dr. Phani");
  assert.equal(row.hero_greeting, "Happy festival wishes.");
  assert.equal(row.hero_greeting_attribution, "Family");

  form.set("google_scholar_citations_text", "not a count");
  assert.ok(parseProfileSettingsForm(form).errors.google_scholar_citations_text);
  form.set("google_scholar_citations_text", values.google_scholar_citations_text);

  form.set("hero_message_mode", "announcement");
  assert.ok(parseProfileSettingsForm(form).errors.hero_message_mode);
  form.set("hero_message_mode", "quote");
  form.set("hero_quote", "  ");
  assert.ok(parseProfileSettingsForm(form).errors.hero_quote);
  form.set("hero_quote", values.hero_quote);
  form.set("hero_greeting", "x".repeat(281));
  assert.ok(parseProfileSettingsForm(form).errors.hero_greeting);

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
    citations_image_url: "https://example.supabase.co/storage/v1/object/public/profile-assets/profile/google-scholar-citations?v=1",
    google_scholar_citations_text: "179 (142)", google_scholar_h_index_text: "8 (8)", google_scholar_i10_index_text: "5 (4)",
    hero_message_mode: "greeting", hero_quote: "Managed quote.", hero_quote_attribution: "Author",
    hero_greeting: "Managed festival wish.", hero_greeting_attribution: "From us",
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
    assert.equal(result.profile.citationsImageUrl, row.citations_image_url);
    assert.deepEqual(result.profile.googleScholarMetrics, { citationsText: "179 (142)", hIndexText: "8 (8)", i10IndexText: "5 (4)" });
    assert.equal(result.profile.academicIdentity[0].value, "0000-0002-4097-2635");
    assert.equal(result.profile.profileLinks[0].href, row.profile_links[0].href);
    assert.equal(result.experienceCounterText, "20+");
    assert.deepEqual(result.profile.heroMessage, {
      mode: "greeting", quote: "Managed quote.", quoteAttribution: "Author",
      greeting: "Managed festival wish.", greetingAttribution: "From us",
    });
  } finally {
    names.forEach((name, index) => { if (old[index] === undefined) delete process.env[name]; else process.env[name] = old[index]; });
  }

  const missingTable = loadModule("lib/profile-settings.ts", { "./supabase/server": { createClient: async () => ({
    from() { return { select() { return { eq() { return { single: async () => ({ data: null, error: { code: "PGRST205" } }) }; } }; } }; },
  }) } });
  const fallback = await missingTable.getPublicProfileSettings();
  assert.equal(fallback.profile.name, "Dr. Phani Kumar Simhadri");
  assert.equal(fallback.profile.citationsImageUrl, "/google-scholar-citations.jpg");
  assert.deepEqual(fallback.profile.googleScholarMetrics, { citationsText: "179 (142)", hIndexText: "8 (8)", i10IndexText: "5 (4)" });
  assert.equal(fallback.experienceCounterText, "20+");
  assert.equal(fallback.profile.heroMessage.mode, "quote");
  assert.ok(fallback.profile.heroMessage.quote);
});

test("dashboard links to protected profile settings and photo route uses an authenticated server action", () => {
  const dashboard = readFileSync(`${root}/app/admin/page.tsx`, "utf8");
  const page = readFileSync(`${root}/app/admin/profile/page.tsx`, "utf8");
  const actions = readFileSync(`${root}/app/admin/profile/actions.ts`, "utf8");
  const profileActions = actions;
  const config = readFileSync(`${root}/next.config.ts`, "utf8");
  assert.match(dashboard, /href="\/admin\/profile"/);
  assert.match(page, /requireAdminPage\(\)/);
  assert.match(page, /uploadProfilePhoto/);
  assert.match(page, /uploadCitationImage/);
  assert.match(page, /View citation screenshot/);
  assert.match(page, /google_scholar_citations_text/);
  assert.doesNotMatch(page, /encType=/);
  assert.match(actions, /requireAdminPage\(\)/);
  assert.match(actions, /from\("profile-assets"\)\.upload/);
  assert.match(actions, /file\.size > 8 \* 1024 \* 1024/);
  assert.match(profileActions, /upload\("profile\/google-scholar-citations"/);
  assert.match(profileActions, /citations_image_url: imageUrl/);
  assert.match(profileActions, /uploadCitationImage/);
  assert.match(config, /serverActions:\s*\{\s*bodySizeLimit:\s*"9mb"/);
});
