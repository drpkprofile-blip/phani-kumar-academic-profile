import "server-only";

import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { ResumeModel } from "./model";
import type { ResumeImages } from "./media";
import { primaryScholarMetric } from "../scholar-metrics";

const navy = "102C3D";
const teal = "087F86";
const muted = "536671";
const ink = "202D36";
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};
const listBorders = {
  top: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
  left: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
  right: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
  insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "D9D9D9" },
};

const address = [
  "S/O Satyanarayana",
  "D. No: 10-35-46",
  "Near Kunchalamma Gudi",
  "Bank Colony,",
  "Bheemunipatam,",
  "Visakhapatnam.",
  "531163",
];

function text(value: string) {
  return value.replace(/\*\*(.*?)\*\*/g, "$1").replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u00B7]/g, "-").replace(/[\u2080-\u2089]/g, (digit) => String.fromCharCode(48 + digit.charCodeAt(0) - 0x2080))
    .replace(/\u2122/g, "TM").replace(/\u00AE/g, "(R)").replace(/\u00A0/g, " ");
}

function safeLink(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}

function p(value = "", options: { bold?: boolean; color?: string; size?: number; before?: number; after?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new Paragraph({
    alignment: options.align,
    spacing: { before: options.before ?? 0, after: options.after ?? 80, line: 250 },
    children: value ? [new TextRun({ text: text(value), bold: options.bold, color: options.color ?? ink, size: options.size ?? 19 })] : [],
  });
}

function section(title: string) {
  return new Paragraph({
    style: "Heading1",
    heading: "Heading1",
    keepNext: true,
    spacing: { before: 220, after: 120 },
    children: [new TextRun({ text: text(title.toUpperCase()), bold: true, color: "000000", size: 22 })],
  });
}

function entry(title: string, detail?: string, href?: string) {
  const link = safeLink(href);
  return [
    new Paragraph({
      keepNext: Boolean(detail),
      spacing: { before: 35, after: detail ? 20 : 85 },
      children: [link
        ? new ExternalHyperlink({ link, children: [new TextRun({ text: text(title), bold: true, color: teal, underline: {} })] })
        : new TextRun({ text: text(title), bold: true, color: ink, size: 19 })],
    }),
    ...(detail ? [p(detail, { color: muted, size: 17, after: 85 })] : []),
  ];
}

function linkParagraph(label: string, href: string) {
  const link = safeLink(href);
  if (!link) return p(label, { color: muted, size: 17, after: 35 });
  return new Paragraph({
    spacing: { after: 35 },
    children: [new ExternalHyperlink({ link, children: [new TextRun({ text: text(label), color: teal, size: 17, underline: {} })] })],
  });
}

function twoColumnList(items: string[]) {
  if (!items.length) return [];
  const rows: TableRow[] = [];
  for (let index = 0; index < items.length; index += 2) {
    const cells = [items[index], items[index + 1]];
    rows.push(new TableRow({ children: cells.map((item) => new TableCell({
      borders: listBorders,
      width: { size: 50, type: WidthType.PERCENTAGE },
      margins: { top: 85, bottom: 85, left: 110, right: 110 },
      children: [new Paragraph({
        bullet: { level: 0 }, indent: { left: 180, hanging: 90 }, spacing: { after: 40 },
        children: item ? [new TextRun({ text: text(item), color: ink, size: 17 })] : [],
      })],
    })) }));
  }
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [4680, 4680],
    borders: noBorders,
    rows,
  })];
}

function singleColumnList(items: string[]) {
  return items.map((item) => new Paragraph({
    bullet: { level: 0 },
    indent: { left: 240, hanging: 120 },
    spacing: { after: 100, line: 270 },
    children: [new TextRun({ text: text(item), color: ink, size: 17 })],
  }));
}

function contacts(model: ResumeModel) {
  const links = [
    { label: "Email", href: `mailto:${model.profile.email}` },
    { label: "Phone", href: `tel:${model.profile.phone.replace(/\s+/g, "")}` },
    ...model.profileLinks.filter((item) => /google scholar|researchgate|linkedin|irins|vidwan/i.test(item.label)),
    { label: "YouTube", href: model.profile.youtubeChannel?.href ?? "" },
    ...model.academicIdentity.filter((item) => item.href && !/google scholar/i.test(item.label))
      .map((item) => ({ label: item.label.replace(/\s+ID$/i, ""), href: item.href! })),
  ];
  const seen = new Set<string>();
  return links.filter((item) => {
    const normalized = item.label.toLowerCase();
    if (seen.has(normalized) || !safeLink(item.href)) return false;
    seen.add(normalized);
    return true;
  }).map((item) => linkParagraph(item.label, item.href));
}

function yearNewestFirst<T>(items: T[], getYear: (item: T) => string | number | undefined) {
  return items.map((item, index) => ({ item, index, year: Number(String(getYear(item) ?? "").match(/\b\d{4}\b/)?.[0] ?? 0) }))
    .sort((a, b) => b.year - a.year || a.index - b.index).map(({ item }) => item);
}

const monthNumbers: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

function formatResumeDate(value: string) {
  const isoDate = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
  const match = value.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  const month = match && monthNumbers[match[1].toLowerCase()];
  return match && month ? `${month}/${match[2]}` : value;
}

function fitImage(image: NonNullable<ResumeImages["profilePhoto"]>, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  return { width: Math.max(1, Math.round(image.width * scale)), height: Math.max(1, Math.round(image.height * scale)) };
}

export async function renderResumeDocx(model: ResumeModel, images: ResumeImages = {}): Promise<Buffer> {
  const body: Array<Paragraph | Table> = [];
  const headerLeft: Array<Paragraph | Table> = [
    new Paragraph({ style: "Title", spacing: { after: 55 }, children: [new TextRun({ text: text(model.profile.name), bold: true, color: "000000", size: 48 })] }),
    p(model.profile.qualifications, { bold: true, color: teal, size: 18, after: 45 }),
    p(`${model.profile.designation} | ${model.profile.department}`, { bold: true, color: navy, size: 19, after: 35 }),
    p(model.profile.institution, { color: muted, size: 17, after: 75 }),
    ...contacts(model),
  ];
  const headerCells = [new TableCell({
    borders: noBorders, width: { size: images.profilePhoto ? 82 : 100, type: WidthType.PERCENTAGE },
    margins: { top: 40, bottom: 50, left: 0, right: 120 }, children: headerLeft,
  })];
  if (images.profilePhoto) {
    const photoSize = fitImage(images.profilePhoto, 100, 120);
    headerCells.push(new TableCell({
      borders: noBorders, width: { size: 18, type: WidthType.PERCENTAGE },
      margins: { top: 50, bottom: 50, left: 60, right: 0 }, verticalAlign: "center",
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new ImageRun({
        data: images.profilePhoto.data, type: images.profilePhoto.type,
        transformation: photoSize,
        altText: { name: "Profile photograph", title: "Profile photograph", description: "Photograph of Dr. Phani Kumar Simhadri" },
      })] })],
    }));
  }
  body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: images.profilePhoto ? [7680, 1680] : [9360], borders: noBorders, rows: [new TableRow({ children: headerCells })] }));
  body.push(p("Permanent Address", { bold: true, color: navy, size: 17, after: 15 }));
  body.push(...address.map((line) => p(line, { color: muted, size: 16, after: 5 })));
  for (let index = 0; index < model.academicIdentity.length; index += 2) {
    const rows = model.academicIdentity.slice(index, index + 2).map((item) => `${item.label}: ${item.value}`);
    body.push(p(rows.join("  |  "), { color: muted, size: 16, after: 55 }));
  }

  body.push(section("Professional Summary"), p(model.profile.description));
  const focus = [...new Set((model.researchAreas.length ? model.researchAreas.map((area) => area.title) : model.profile.researchInterests)
    .map((value) => value.trim()).filter(Boolean))];
  if (focus.length) body.push(section("Research Interests"), ...singleColumnList(focus));
  if (model.profile.technicalTools.length) body.push(section("Technical Tools"), ...singleColumnList(model.profile.technicalTools));

  body.push(section("Academic Appointments"));
  for (const item of model.experience) body.push(...entry(`${item.role} | ${item.period}`, [item.institution, item.department].filter(Boolean).join(" | ")));
  const degrees = model.education.filter((item) => !/^(school|intermediate|secondary|higher secondary)/i.test(item.degree.trim()));
  if (degrees.length) {
    body.push(section("Education"));
    for (const item of degrees) body.push(...entry(`${item.degree} | ${formatResumeDate(item.year)}`, [item.institution, item.field, item.detail].filter(Boolean).join(" | ")));
  }

  body.push(section("Google Scholar Metrics"));
  const scholarMetrics = [
    `Citations ${primaryScholarMetric(model.profile.googleScholarMetrics.citationsText)}`,
    `h-index ${primaryScholarMetric(model.profile.googleScholarMetrics.hIndexText)}`,
    `i10-index ${primaryScholarMetric(model.profile.googleScholarMetrics.i10IndexText)}`,
  ];
  body.push(p(scholarMetrics.join("     |     "), { bold: true, color: navy }));
  if (images.citationsFigure) body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 35, after: 90 }, children: [new ImageRun({
    data: images.citationsFigure.data, type: images.citationsFigure.type,
    transformation: fitImage(images.citationsFigure, 190, 250),
    altText: { name: "Google Scholar citation metrics", title: "Google Scholar citation metrics", description: "Citation count, h-index, and i10-index profile figure" },
  })] }));
  body.push(p("Peer-reviewed Web of Science (WoS) publications: 17", { color: muted, size: 17 }));

  const publications = yearNewestFirst(model.publications, (item) => item.year);
  if (publications.length) {
    body.push(section(`Research Publications (${publications.length})`));
    for (const item of publications) {
      const metadata = [item.journal, item.type, item.indexing?.length ? `Indexing: ${item.indexing.join(", ")}` : undefined,
        item.impactFactor !== undefined ? `Impact Factor: ${item.impactFactor}` : undefined].filter(Boolean).join(" | ");
      body.push(...entry(`${item.title} (${item.year})`, metadata));
      const doi = item.doi?.replace(/^https?:\/\/doi\.org\//i, "");
      if (doi) body.push(linkParagraph(`doi:${doi}`, `https://doi.org/${doi}`));
      else if (item.url && safeLink(item.url)) body.push(linkParagraph("Article link", item.url));
    }
  }

  if (model.patents.length) {
    body.push(section(`Patents (${model.patents.length})`));
    for (const item of model.patents) {
      const details = [
        `Application No.: ${item.applicationNumber}`,
        `Filed: ${formatResumeDate(item.filingDate)}`,
        `Published: ${formatResumeDate(item.publicationDate)}`,
        item.journalNumber ? `Patent Office Journal No. ${item.journalNumber}` : undefined,
        item.pageNumber ? `Page ${item.pageNumber}` : undefined,
      ].filter(Boolean).join(" | ");
      body.push(...entry(item.title, details));
      if (item.proofUrl) body.push(linkParagraph("Patent proof", item.proofUrl));
    }
  }

  if (model.achievements.length) {
    body.push(section("Awards and Achievements"));
    for (const item of model.achievements) body.push(...entry(item.title, item.text));
  }
  if (model.memberships.length) {
    body.push(section("Professional Memberships"));
    for (const item of model.memberships) body.push(...entry(item.organizationName, [item.membershipType, item.designation].filter(Boolean).join(" | ")));
  }
  if (model.certifications.length) {
    body.push(section(`NPTEL Courses (${model.certifications.length})`));
    body.push(...twoColumnList(yearNewestFirst(model.certifications, (item) => item.year).map((item) => item.title)));
  }
  const activities = yearNewestFirst(model.activities, (item) => item.year);
  if (activities.length) {
    body.push(section(`Academic Activities (${activities.length})`));
    for (const item of activities) body.push(...entry(`${item.title} (${item.year})`, [item.type, item.institution, item.date, item.duration, item.details].filter(Boolean).join(" | ")));
  }
  if (model.completedReviewsCount > 0) {
    body.push(section("Academic Service"), p(`Completed peer reviews: ${model.completedReviewsCount}`));
  }
  if (model.subjects.length) {
    body.push(section(`Subjects Taught (${model.subjects.length})`));
    body.push(...twoColumnList(model.subjects.map((item) => [item.subjectName, item.courseCode, item.program, item.branch, item.semester, item.academicYear, item.subjectType]
      .filter(Boolean).join(" | "))));
  }
  const ugCount = model.guidedProjectCounts?.ug ?? model.projects.filter((project) => /^UG\b/i.test(project.projectLevel?.trim() ?? "")).length;
  const pgCount = model.guidedProjectCounts?.pg ?? model.projects.filter((project) => /^PG\b/i.test(project.projectLevel?.trim() ?? "")).length;
  body.push(section("Projects Guided"), p(`UG: ${ugCount}   |   PG: ${pgCount}`));

  body.push(section("Declaration"));
  body.push(p("I hereby declare that the information provided in this CV is true and correct to the best of my knowledge.", { after: 380 }));
  body.push(p(" ", { after: 1100 }));
  body.push(p(model.profile.name, { bold: true, color: navy, after: 0 }));

  const doc = new Document({
    creator: model.profile.name,
    title: "Academic Curriculum Vitae",
    subject: "Academic CV generated from authorized profile data",
    description: "Editable academic CV",
    styles: { default: { document: { run: { font: "Aptos", size: 19, color: ink } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 760, right: 850, bottom: 760, left: 850 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
        new TextRun({ text: `${text(model.profile.name)} | Academic CV | `, size: 14, color: muted }),
        new TextRun({ children: [PageNumber.CURRENT], size: 14, color: muted }),
      ] })] }) },
      children: body,
    }],
  });
  return Packer.toBuffer(doc);
}
