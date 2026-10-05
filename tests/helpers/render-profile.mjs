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
    // Isolate unrelated publication tests from Activities network reads.
    if (name === "../lib/activities") return { getPublicActivities: async () => loadModule("data/activities.ts") };
    if (name.startsWith(".")) return loadModule(`${resolve(dirname(absolute), name)}.ts`, mocks);
    return require(name);
  });
  return exports;
}

export async function compareProfile(publicData, activityData, certificationData, achievementData, professionalMembershipData, subjectData, projectsGuidedData, includeProjects = false, peerReviewData) {
  const baseline = execFileSync("git", ["show", "112840e2d5aabbd516279533db6dde8ed08c1235:app/page.tsx"], { cwd: root, encoding: "utf8" });
  const oldPage = loadModule("app/page.tsx", {}, baseline).default;
  const newPage = loadModule("app/page.tsx", {
    "../lib/profile-settings": { getPublicProfileSettings: async () => ({
      profile: loadModule("data/profile.ts").profile,
      experienceCounterText: loadModule("data/counters.ts").counters.experienceYears,
    }) },
    "../lib/publications": { getPublicPublications: async () => publicData },
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
    "../lib/peer-reviews": { getPublicPeerReviews: async () => peerReviewData ?? {
      peerReviews: loadModule("data/peer-reviews.ts").peerReviews,
      heroCounterText: loadModule("data/counters.ts").counters.heroPeerReviews,
      completedReviewsCount: loadModule("data/counters.ts").counters.peerReviewCount,
    } },
  }).default;
  const current = renderToStaticMarkup(await newPage());
  const baselineCompatibleCurrent = includeProjects ? current : current
    .replace(/<a href="#projects-guided">Projects Guided<\/a>/, "")
    .replace(/<section id="projects-guided"[\s\S]*?<\/section>/, "");
  return {
    baseline: renderToStaticMarkup(await oldPage()),
    current: baselineCompatibleCurrent,
  };
}
