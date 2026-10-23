import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { root } from "../scripts/publication-seed.mjs";
import { loadModule } from "./helpers/render-profile.mjs";

const require = createRequire(import.meta.url);
const JSZip = require("jszip");

const emptyModel = {
  profile: {
    name: "Dr Example", qualifications: "PhD", designation: "Professor", department: "Engineering",
    institution: "Example University", description: "Academic profile summary", email: "example@example.test",
    phone: "+1 555 0100", photo: "https://example.test/profile.jpg", citationsImageUrl: "https://example.test/scholar.jpg",
    googleScholarMetrics: { citationsText: "179 (142)", hIndexText: "8 (8)", i10IndexText: "5 (4)" },
    academicIdentity: [{ label: "ORCID", value: "0000-0000", href: "https://orcid.example.test/0000" }], profileLinks: [
      { label: "Google Scholar", href: "https://scholar.example.test/profile" },
      { label: "LinkedIn", href: "https://linkedin.example.test/phani" },
      { label: "Instagram", href: "https://instagram.example.test/phani" },
    ],
    researchInterests: ["Composite materials"], technicalTools: ["ANSYS"], skills: ["Research"],
  },
  experienceCounterText: "20+",
  education: [
    { degree: "Doctor of Philosophy", year: "February 2026", institution: "Example University", field: "Engineering", proof: "https://drive.example.test/certificate" },
    { degree: "Intermediate", year: "2000", institution: "Example College", field: "MPC" },
  ],
  experience: [{ role: "Assistant Professor", period: "Aug 2012 – Present", institution: "Example University", department: "Engineering" }],
  researchAreas: [],
  publications: [
    { title: "Older Research Paper LiFePO₄", year: "2024", journal: "Example Journal", type: "Journal Article", doi: "10.1000/older", url: "https://article.example.test/older", proof: "https://drive.example.test/older-proof", indexing: ["SCOPUS"], id: 2 },
    { title: "Research Paper", year: "2026", journal: "Example Journal", type: "Journal Article", doi: "10.1000/example", url: "https://article.example.test/paper", proof: "https://drive.example.test/article-proof", indexing: ["SCIE", "Q2-SCOPUS"], impactFactor: 2.8, id: 1 },
  ],
  patents: [{
    id: 1, applicationNumber: "202141030245 A", filingDate: "2021-07-06", publicationDate: "2021-07-16",
    title: "PROCESS OF PLASTIC WASTE FOR PRODUCTS OF BUILDING MATERIALS WITH PLASTIC EXTRUSION METHOD",
    journalNumber: "29/2021", pageNumber: "31374", proofUrl: "https://drive.example.test/patent-proof",
  }],
  activities: [
    { title: "Older Workshop", year: "2024", type: "Workshop", institution: "Example University", proofUrl: "https://drive.example.test/older-activity-proof" },
    { title: "Teaching Workshop", year: "2026", type: "Workshop", institution: "Example University", proofUrl: "https://drive.example.test/activity-proof" },
  ],
  certifications: [{ title: "Machine Learning", year: "2025", certificateUrl: "https://drive.example.test/certificate-proof", fdpUrl: undefined }],
  achievements: [{ title: "Teaching Award", text: "Recognized as an **IOP Trusted Reviewer™ by IOP Publishing**.", proof: "https://drive.example.test/award-proof" }],
  memberships: [],
  subjects: [
    { subjectName: "Mechanics of Solids", courseCode: "ME201" },
    { subjectName: "Python Programming", courseCode: "CS101" },
  ],
  projects: [
    { projectTitle: "Private UG project title", projectLevel: "UG", studentNames: ["Private Student"] },
    { projectTitle: "Private PG project title", projectLevel: "PG", studentNames: ["Private Student"] },
  ], guidedProjectCounts: { ug: 14, pg: 4 }, peerReviews: [],
  peerReviewCounterText: "16+", completedReviewsCount: 16,
  academicIdentity: [{ label: "ORCID", value: "0000-0000", href: "https://orcid.example.test/0000" }],
  profileLinks: [
    { label: "Google Scholar", href: "https://scholar.example.test/profile" },
    { label: "LinkedIn", href: "https://linkedin.example.test/phani" },
    { label: "Instagram", href: "https://instagram.example.test/phani" },
  ],
};

test("academic CV is recruiter-readable, omits proof/image clutter, and retains useful academic links", async () => {
  const { renderResumePdf } = loadModule("lib/resume/pdf.ts");
  const pdf = await renderResumePdf(emptyModel);
  const content = pdf.toString("latin1");
  const textRuns = [...content.matchAll(/<([0-9a-f]+)>/gi)].map((match) => Buffer.from(match[1], "hex").toString("latin1")).join("");
  assert.ok(content.startsWith("%PDF-"));
  assert.match(content, /\/URI \(https:\/\/scholar\.example\.test\/profile\)/);
  assert.match(content, /\/URI \(https:\/\/orcid\.example\.test\/0000\)/);
  assert.match(content, /\/URI \(https:\/\/doi\.org\/10\.1000\/example\)/);
  assert.match(textRuns, /PROFESSIONAL SUMMARY/);
  assert.match(textRuns, /ACADEMIC APPOINTMENTS/);
  assert.match(textRuns, /RESEARCH PUBLICATIONS \(2\)/);
  assert.match(textRuns, /PATENTS \(1\)/);
  assert.match(textRuns, /202141030245 A/);
  assert.match(textRuns, /Patent Office Journal No\. 29\/2021/);
  assert.match(textRuns, /Page 31374/);
  assert.match(content, /drive\.example\.test\/patent-proof/);
  assert.match(textRuns, /ACADEMIC ACTIVITIES \(2\)/);
  assert.match(textRuns, /PEER-REVIEWED WEB OF SCIENCE \(WOS\) PUBLICATIONS: 17/i);
  assert.match(textRuns, /Indexing: SCIE, Q2-SCOPUS/);
  assert.match(textRuns, /Indexing: SCOPUS/);
  assert.match(textRuns, /Impact Factor: 2\.8/);
  assert.doesNotMatch(textRuns, /Impact Factor: undefined/);
  assert.match(textRuns, /NPTEL COURSES \(1\)/i);
  assert.match(textRuns, /SUBJECTS TAUGHT \(2\)/i);
  assert.match(textRuns, /PROJECTS GUIDED/i);
  assert.match(textRuns, /UG: 14\s+\|\s+PG: 4/);
  assert.match(textRuns, /IOP Trusted ReviewerTM by IOP Publishing/);
  assert.match(textRuns, /Older Research Paper LiFePO4 \(2024\)/);
  assert.match(textRuns, /S\/O Satyanarayana/);
  assert.match(textRuns, /D\. No: 10-35-46/);
  assert.match(textRuns, /Near Kunchalamma Gudi/);
  assert.match(textRuns, /531163/);
  assert.match(textRuns, /DECLARATION/);
  assert.match(textRuns, /I hereby declare that the information provided in this CV is true and correct to the best of my knowledge\./);
  assert.ok(textRuns.indexOf("DECLARATION") < textRuns.lastIndexOf("Dr Example"));
  assert.doesNotMatch(textRuns, /\*\*/);
  assert.doesNotMatch(textRuns, /Private UG project title|Private PG project title|Private Student/);
  assert.match(textRuns, /179/);
  assert.doesNotMatch(textRuns, /142/);
  assert.match(textRuns, /h-index 8/);
  assert.match(textRuns, /i10-index 5/);
  assert.match(textRuns, /Doctor of Philosophy \| 02\/2026/);
  assert.doesNotMatch(textRuns, /Doctor of Philosophy \| 22\/02\/2026/);
  assert.match(textRuns, /Aug 2012 - Present/);
  assert.ok(textRuns.indexOf("Research Paper (2026)") < textRuns.indexOf("Older Research Paper LiFePO4 (2024)"));
  assert.ok(textRuns.indexOf("Teaching Workshop (2026)") < textRuns.indexOf("Older Workshop (2024)"));
  assert.doesNotMatch(textRuns, /Intermediate/);
  assert.doesNotMatch(textRuns, /Open link|Scholar citations graph|certificate-proof|activity-proof|article-proof|older-proof|award-proof|scholar\.jpg|profile\.jpg|instagram\.example/);
  assert.match(content, /scholar\.example\.test/);
  assert.match(content, /doi\.org\/10\.1000\/example/);
  assert.doesNotMatch(content, /instagram\.example\.test|drive\.example\.test\/(?:certificate-proof|activity-proof|article-proof|older-proof|award-proof)|article\.example\.test|scholar\.jpg|profile\.jpg/);
});

test("academic CV includes every publication and activity beyond the former selected-item limits", async () => {
  const { renderResumePdf } = loadModule("lib/resume/pdf.ts");
  const model = {
    ...emptyModel,
    publications: Array.from({ length: 15 }, (_, index) => ({
      title: `Complete publication ${index + 1}`,
      year: String(2026 - index),
      journal: "Example Journal",
      type: "Journal Article",
      id: index + 1,
      indexing: [],
    })),
    activities: Array.from({ length: 11 }, (_, index) => ({
      title: `Complete activity ${index + 1}`,
      year: String(2026 - index),
      type: "Workshop",
      institution: "Example University",
      details: index === 0 ? "Presented a technical session" : undefined,
    })),
  };
  const pdf = await renderResumePdf(model);
  const content = pdf.toString("latin1");
  const textRuns = [...content.matchAll(/<([0-9a-f]+)>/gi)]
    .map((match) => Buffer.from(match[1], "hex").toString("latin1")).join("");
  assert.match(textRuns, /RESEARCH PUBLICATIONS \(15\)/i);
  assert.match(textRuns, /ACADEMIC ACTIVITIES \(11\)/i);
  assert.match(textRuns, /Complete publication 15/);
  assert.match(textRuns, /Complete activity 11/);
  assert.match(textRuns, /Presented a technical session/);
});

test("PDF separates research interests and technical tools into one-per-line bullets", async () => {
  const { renderResumePdf } = loadModule("lib/resume/pdf.ts");
  const model = {
    ...emptyModel,
    researchAreas: [],
    profile: {
      ...emptyModel.profile,
      researchInterests: ["Polymer Composite Gears", "Tribology", "Contact Stress Analysis", "Finite Element Analysis"],
      technicalTools: ["Python Programming", "SOLID WORKS", "ANSYS", "AUTO CAD"],
    },
  };
  const pdf = await renderResumePdf(model);
  const content = pdf.toString("latin1");
  const textRuns = [...content.matchAll(/<([0-9a-f]+)>/gi)]
    .map((match) => Buffer.from(match[1], "hex").toString("latin1")).join("");
  for (const item of [...model.profile.researchInterests, ...model.profile.technicalTools]) {
    assert.ok(textRuns.includes(item), `PDF should keep a separate readable entry for ${item}`);
  }
  assert.match(textRuns, /RESEARCH INTERESTS/);
  assert.match(textRuns, /TECHNICAL TOOLS/);
  const outputPath = process.env.RESUME_PDF_QA_OUTPUT;
  if (outputPath) await writeFile(outputPath, pdf);
});

test("PDF CV embeds the approved profile photograph and citations figure when images are loaded", async () => {
  const { renderResumePdf } = loadModule("lib/resume/pdf.ts");
  const images = {
    profilePhoto: { data: readFileSync(`${root}/public/phani-photo.png`), type: "png", width: 800, height: 960 },
    citationsFigure: { data: readFileSync(`${root}/public/google-scholar-citations.jpg`), type: "jpg", width: 310, height: 410 },
  };
  const pdf = await renderResumePdf(emptyModel, images);
  assert.ok(pdf.toString("latin1").startsWith("%PDF-"));
  assert.equal([...pdf.toString("latin1").matchAll(/\/Subtype \/Image/g)].length, 2);
});

test("resume data uses the user-supplied UG/PG project totals instead of empty database project rows", async () => {
  const publications = Array.from({ length: 3 }, (_, index) => ({ id: index + 1, title: `Publication ${index + 1}`, year: "2026", journal: "Journal", type: "Article", indexing: [] }));
  const activities = Array.from({ length: 4 }, (_, index) => ({ title: `Activity ${index + 1}`, year: "2026", type: "FDP", institution: "Example" }));
  const mocks = {
    "../achievements": { getPublicAchievements: async () => [] },
    "../activities": { getPublicActivities: async () => ({ activities }) },
    "../certifications": { getPublicCertifications: async () => [] },
    "../professional-memberships": { getPublicProfessionalMemberships: async () => [] },
    "../peer-reviews": { getPublicPeerReviews: async () => ({ peerReviews: [], heroCounterText: "16+", completedReviewsCount: 16 }) },
    "../projects-guided": { getPublicProjectsGuided: async () => [] },
    "../publications": { getPublicPublications: async () => ({ publications }) },
    "../profile-settings": { getPublicProfileSettings: async () => ({ profile: emptyModel.profile, experienceCounterText: "20+" }) },
    "../subjects-taught": { getPublicSubjectsTaught: async () => [] },
    "../../data/education": { educationNewestFirst: [] },
    "../../data/experience": { experience: [] },
    "../../data/research": { researchAreas: [] },
  };
  const { loadResumeModel } = loadModule("lib/resume/data.ts", mocks);
  const model = await loadResumeModel();
  assert.deepEqual(model.guidedProjectCounts, { ug: 14, pg: 4 });
  assert.equal(model.publications.length, 3);
  assert.equal(model.activities.length, 4);
});

test("editable Word CV includes photo, Scholar figure, full records, spaced lists, and signature space", async () => {
  const { renderResumeDocx } = loadModule("lib/resume/docx.ts");
  const images = {
    profilePhoto: { data: readFileSync(`${root}/public/phani-photo.png`), type: "png", width: 800, height: 960 },
    citationsFigure: { data: readFileSync(`${root}/public/google-scholar-citations.jpg`), type: "jpg", width: 310, height: 410 },
  };
  const completeModel = {
    ...emptyModel,
    researchAreas: [
      { title: "Polymer Composite Gears", text: "Gear materials research" },
      { title: "Tribology", text: "Friction and wear" },
    ],
    profile: { ...emptyModel.profile, technicalTools: ["Python Programming", "SOLID WORKS", "ANSYS", "AUTO CAD"] },
    publications: Array.from({ length: 15 }, (_, index) => ({
      title: `Word publication ${index + 1}`, year: String(2026 - index), journal: "Example Journal", type: "Journal Article", id: index + 1, indexing: [],
    })),
    activities: Array.from({ length: 11 }, (_, index) => ({
      title: `Complete activity ${index + 1}`, year: String(2026 - index), type: "FDP", institution: "Example University",
      details: index === 0 ? "Presented a technical session" : undefined,
    })),
  };
  const buffer = await renderResumeDocx(completeModel, images);
  assert.equal(buffer.subarray(0, 2).toString("ascii"), "PK");
  const archive = await JSZip.loadAsync(buffer);
  const documentXml = await archive.file("word/document.xml").async("string");
  assert.match(documentXml, /Dr\. Phani Kumar Simhadri/);
  assert.match(documentXml, /Permanent Address/);
  assert.match(documentXml, /S\/O Satyanarayana/);
  assert.match(documentXml, /PEER-REVIEWED WEB OF SCIENCE \(WOS\) PUBLICATIONS: 17/i);
  assert.match(documentXml, /Machine Learning/);
  assert.doesNotMatch(documentXml, /Machine Learning \(2025\)/);
  assert.match(documentXml, /Mechanics of Solids/);
  assert.match(documentXml, /Python Programming/);
  assert.match(documentXml, /RESEARCH INTERESTS/);
  assert.match(documentXml, /TECHNICAL TOOLS/);
  assert.match(documentXml, /Tribology/);
  assert.match(documentXml, /ANSYS/);
  const paragraphs = [...documentXml.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)]
    .map((match) => match[1].replace(/<[^>]+>/g, ""));
  for (const item of ["Polymer Composite Gears", "Tribology", "Python Programming", "SOLID WORKS", "ANSYS", "AUTO CAD"]) {
    assert.ok(paragraphs.some((paragraph) => paragraph === item), `${item} should appear in its own Word paragraph`);
  }
  assert.match(documentXml, /Complete activity/);
  assert.match(documentXml, /Complete activity 11/);
  assert.match(documentXml, /Presented a technical session/);
  assert.match(documentXml, /UG: 14\s+\|\s+PG: 4/);
  assert.match(documentXml, /ACADEMIC ACTIVITIES \(11\)/i);
  assert.match(documentXml, /RESEARCH PUBLICATIONS \(15\)/i);
  assert.match(documentXml, /PATENTS \(1\)/i);
  assert.match(documentXml, /202141030245 A/);
  assert.match(documentXml, /Patent Office Journal No\. 29\/2021/);
  assert.match(documentXml, /Page 31374/);
  const relationshipsXml = await Promise.all(Object.keys(archive.files)
    .filter((name) => /^word\/_rels\/.*\.rels$/.test(name))
    .map(async (name) => archive.file(name).async("string"))).then((items) => items.join("\n"));
  assert.match(relationshipsXml, /drive\.example\.test\/patent-proof/);
  assert.match(documentXml, /Word publication 15/);
  assert.match(documentXml, /Doctor of Philosophy \| 02\/2026/);
  assert.doesNotMatch(documentXml, /Private UG project title|Private PG project title|Private Student/);
  assert.match(documentXml, /DECLARATION/);
  assert.match(documentXml, /<w:drawing>/);
  const embeddedImages = Object.keys(archive.files).filter((name) => /^word\/media\//.test(name) && !archive.files[name].dir);
  assert.ok(embeddedImages.length >= 2);
  const embeddedBytes = await Promise.all(embeddedImages.map((name) => archive.file(name).async("nodebuffer")));
  assert.ok(embeddedBytes.some((item) => item.equals(images.profilePhoto.data)));
  assert.ok(embeddedBytes.some((item) => item.equals(images.citationsFigure.data)));
  const outputPath = process.env.RESUME_DOCX_QA_OUTPUT;
  if (outputPath) await writeFile(outputPath, buffer);
});

test("resume PDF download verifies admin access before reading data and returns private attachment headers", async () => {
  const calls = [];
  const mocks = {
    "../../../../lib/auth/admin": { AdminAccessError: class AdminAccessError extends Error { constructor(reason) { super(reason); this.reason = reason; } }, requirePublicationsAdmin: async () => { calls.push("auth"); return { user: { email: "admin@example.test" } }; } },
    "../../../../lib/resume/data": { loadResumeModel: async () => { calls.push("data"); return emptyModel; } },
    "../../../../lib/resume/media": { loadResumeImages: async () => { calls.push("images"); return {}; } },
    "../../../../lib/resume/pdf": { renderResumePdf: async () => Buffer.from("%PDF-test") },
  };
  const { GET } = loadModule("app/admin/resume/download/route.ts", mocks);
  const response = await GET();
  assert.equal(calls[0], "auth");
  assert.equal(calls[1], "data");
  assert.equal(calls[2], "images");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.match(response.headers.get("content-disposition"), /attachment/);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal(await response.text(), "%PDF-test");
});

test("resume endpoint denies anonymous and non-admin requests before data reads", async () => {
  for (const [reason, status] of [["anonymous", 401], ["denied", 403]]) {
    class AdminAccessError extends Error { constructor() { super(reason); this.reason = reason; } }
    const mocks = {
      "../../../../lib/auth/admin": { AdminAccessError, requirePublicationsAdmin: async () => { throw new AdminAccessError(); } },
      "../../../../lib/resume/data": { loadResumeModel: async () => assert.fail("data reader must not run") },
      "../../../../lib/resume/media": { loadResumeImages: async () => assert.fail("media reader must not run") },
      "../../../../lib/resume/pdf": { renderResumePdf: async () => assert.fail("PDF must not be generated") },
    };
    const { GET } = loadModule("app/admin/resume/download/route.ts", mocks);
    assert.equal((await GET()).status, status);
  }
});

test("editable Word download is admin-only and returns a private DOCX attachment", async () => {
  const calls = [];
  const mocks = {
    "../../../../../lib/auth/admin": { AdminAccessError: class AdminAccessError extends Error { constructor(reason) { super(reason); this.reason = reason; } }, requirePublicationsAdmin: async () => { calls.push("auth"); } },
    "../../../../../lib/resume/data": { loadResumeModel: async () => { calls.push("data"); return emptyModel; } },
    "../../../../../lib/resume/media": { loadResumeImages: async () => { calls.push("images"); return {}; } },
    "../../../../../lib/resume/docx": { renderResumeDocx: async () => Buffer.from("PK-test") },
  };
  const { GET } = loadModule("app/admin/resume/download/word/route.ts", mocks);
  const response = await GET();
  assert.deepEqual(calls, ["auth", "data", "images"]);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /wordprocessingml\.document/);
  assert.match(response.headers.get("content-disposition"), /\.docx/);
  assert.match(response.headers.get("cache-control"), /private, no-store/);
  assert.equal(await response.text(), "PK-test");
});

test("editable Word route denies anonymous and non-admin requests before loading resume data", async () => {
  for (const [reason, status] of [["anonymous", 401], ["denied", 403]]) {
    class AdminAccessError extends Error { constructor() { super(reason); this.reason = reason; } }
    const mocks = {
      "../../../../../lib/auth/admin": { AdminAccessError, requirePublicationsAdmin: async () => { throw new AdminAccessError(); } },
      "../../../../../lib/resume/data": { loadResumeModel: async () => assert.fail("data reader must not run") },
      "../../../../../lib/resume/media": { loadResumeImages: async () => assert.fail("media reader must not run") },
      "../../../../../lib/resume/docx": { renderResumeDocx: async () => assert.fail("DOCX must not be generated") },
    };
    const { GET } = loadModule("app/admin/resume/download/word/route.ts", mocks);
    assert.equal((await GET()).status, status);
  }
});

test("admin dashboard links to the protected resume builder and public hero graphics remain decorative", () => {
  const dashboard = readFileSync(`${root}/app/admin/page.tsx`, "utf8");
  const page = readFileSync(`${root}/app/admin/resume/page.tsx`, "utf8");
  const publicPage = readFileSync(`${root}/app/page.tsx`, "utf8");
  const route = readFileSync(`${root}/app/admin/resume/download/route.ts`, "utf8");
  const wordRoute = readFileSync(`${root}/app/admin/resume/download/word/route.ts`, "utf8");
  const css = readFileSync(`${root}/app/globals.css`, "utf8");
  assert.match(publicPage, /href="\/admin\/resume" className="button button-secondary">Download CV<\/a>/);
  assert.match(dashboard, /href="\/admin\/resume"/);
  assert.match(page, /href="\/admin\/resume\/download"/);
  assert.match(page, /href="\/admin\/resume\/download\/word"/);
  assert.match(route, /requirePublicationsAdmin\(\)/);
  assert.match(route, /Cache-Control.*private, no-store/);
  assert.match(wordRoute, /requirePublicationsAdmin\(\)/);
  assert.match(wordRoute, /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/);
  assert.match(css, /\.hero::after/);
  assert.match(css, /\.section-heading-row::before/);
});
