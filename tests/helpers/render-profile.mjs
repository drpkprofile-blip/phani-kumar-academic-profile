import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { root } from "../../scripts/publication-seed.mjs";

const require = createRequire(import.meta.url);
export function loadModule(path, mocks = {}, source) {
  const absolute = resolve(root, path);
  const compiled = ts.transpileModule(source ?? readFileSync(absolute, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function("exports", "require", compiled)(exports, (name) => {
    if (name === "server-only") return {};
    if (name in mocks) return mocks[name];
    if (name === "./activity-browser") return loadModule("app/activity-browser.tsx", mocks);
    if (name === "./publication-browser") return loadModule("app/publication-browser.tsx", mocks);
    if (name === "./primary-navigation") return loadModule("app/primary-navigation.tsx", mocks);
    if (name === "./profile-visit-counter") return loadModule("app/profile-visit-counter.tsx", mocks);
    // Isolate unrelated publication tests from Activities network reads.
    if (name === "../lib/activities") return { getPublicActivities: async () => loadModule("data/activities.ts") };
    if (name.startsWith(".")) return loadModule(`${resolve(dirname(absolute), name)}.ts`, mocks);
    return require(name);
  });
  return exports;
}

export async function compareProfile(publicData, activityData, certificationData, achievementData, professionalMembershipData, subjectData, projectsGuidedData, includeProjects = false, peerReviewData, galleryData = [], includeGallery = false, guidedCountsData = { ug: 14, pg: 4 }, heroMessageData = {
  mode: "quote", quote: "Curiosity inspires discovery; knowledge creates lasting impact.", quoteAttribution: "",
  greeting: "Warm wishes to you and your family on this special occasion.", greetingAttribution: "",
}, patentData = []) {
  const baseline = execFileSync("git", ["show", "112840e2d5aabbd516279533db6dde8ed08c1235:app/page.tsx"], { cwd: root, encoding: "utf8" });
  const oldPage = loadModule("app/page.tsx", {}, baseline).default;
  const newPage = loadModule("app/page.tsx", {
    "../lib/profile-settings": { getPublicProfileSettings: async () => ({
      profile: {
        ...loadModule("data/profile.ts").profile,
        heroMessage: heroMessageData,
      },
      experienceCounterText: loadModule("data/counters.ts").counters.experienceYears,
    }) },
    "../lib/publications": { getPublicPublications: async () => publicData },
    "../lib/patents": { getPublicPatents: async () => patentData },
    ...(activityData ? { "../lib/activities": { getPublicActivities: async () => activityData } } : {}),
    "../lib/certifications": {
      getPublicCertifications: async () => certificationData ?? loadModule("data/certifications.ts").certifications,
    },
    "../lib/achievements": {
      getPublicAchievements: async () => achievementData ?? loadModule("data/achievements.ts").achievements,
    },
    "../lib/professional-memberships": {
      getPublicProfessionalMemberships: async () => professionalMembershipData
        ?? loadModule("data/professional-memberships.ts").professionalMemberships.map((record, index) => ({ ...record, displayOrder: index + 1 })),
    },
    "../lib/subjects-taught": { getPublicSubjectsTaught: async () => subjectData ?? [] },
    "../lib/projects-guided": { getPublicProjectsGuided: async () => projectsGuidedData ?? [] },
    "../lib/projects-guided-settings": { getPublicGuidedProjectCounts: async () => guidedCountsData },
    "../lib/profile-visits": { getPublicProfileVisitCount: async () => 123 },
    "../lib/gallery": { getPublicGalleryItems: async () => galleryData ?? [] },
    "../lib/peer-reviews": { getPublicPeerReviews: async () => peerReviewData ?? {
      peerReviews: loadModule("data/peer-reviews.ts").peerReviews,
      heroCounterText: loadModule("data/counters.ts").counters.heroPeerReviews,
      completedReviewsCount: loadModule("data/counters.ts").counters.peerReviewCount,
    } },
  }).default;
  const current = renderToStaticMarkup(await newPage());
  const baselineCompatibleCurrent = includeProjects ? current : current
    .replace(/<a href="#projects-guided">Projects Guided<\/a>/, "")
    .replace(/<section id="projects-guided"[\s\S]*?<\/section>/, "")
    .replace(/<div><strong>\d+\+<\/strong><span>UG PROJECTS GUIDED<\/span><\/div>/, "")
    .replace(/<div><strong>\d+\+<\/strong><span>PG PROJECTS GUIDED<\/span><\/div>/, "")
    .replace('class="hero-stats hero-stats--guided"', 'class="hero-stats"');
  const baselineCompatibleWithNewPatents = baselineCompatibleCurrent
    .replace(/<a href="#patents">Patents<\/a>/, "")
    .replace(/<section id="patents"[\s\S]*?<\/section>/, "")
    .replace("05 · ACADEMIC ACTIVITIES", "05 · ACADEMIC ACTIVITIES")
    .replace("06 · ACADEMIC ACTIVITIES", "05 · ACADEMIC ACTIVITIES")
    .replace("07 · EXPERIENCE", "06 · EXPERIENCE")
    .replace("08 · NPTEL", "07 · NPTEL")
    .replace("09 · PEER REVIEWS", "08 · PEER REVIEWS")
    .replace("10 · ACHIEVEMENTS", "09 · ACHIEVEMENTS")
    .replace("11 · CONTACT", "10 · CONTACT")
    .replace('class="section-index">10</div>', 'class="section-index">09</div>');
  const baselineCompatibleWithVisitCounter = baselineCompatibleWithNewPatents
    .replace(/<p class="profile-visit-counter"[\s\S]*?<\/p>/, "");
  const baselineCompatiblePage = includeGallery ? baselineCompatibleWithVisitCounter : baselineCompatibleWithVisitCounter
    .replace(/<a href="#gallery">Gallery<\/a>/, "")
    .replace(/<section id="gallery"[\s\S]*?<\/section>/, "");
  // The year controls are the intentional UI addition under test. Keep existing
  // baseline comparisons focused on the unchanged publication cards and page.
  const baselineCompatibleWithPublicationFilters = baselineCompatiblePage
    .replace(/<aside class="hero-message[^\"]*"[\s\S]*?<\/aside>/, "")
    .replace(/<a class="admin-shortcut" href="\/admin\/login">Admin<\/a>/, "")
    .replace(/<div class="publication-filter-note"[^>]*>[\s\S]*?<\/div>/, "")
    .replace(/ aria-current="location"/g, "");
  return {
    baseline: renderToStaticMarkup(await oldPage()),
    rawCurrent: current,
    current: baselineCompatibleWithPublicationFilters,
  };
}
