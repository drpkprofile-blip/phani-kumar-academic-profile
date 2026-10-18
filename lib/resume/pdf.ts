import "server-only";

import * as PDFKitModule from "pdfkit";
import type { ResumeModel } from "./model";
import type { ResumeImages } from "./media";
import { primaryScholarMetric } from "../scholar-metrics";

const PDFDocument = (PDFKitModule as unknown as {
  PDFDocument: new (options: Record<string, unknown>) => PDFKit.PDFDocument;
}).PDFDocument;

const colors = {
  navy: "#102C3D",
  teal: "#087F86",
  ink: "#202D36",
  muted: "#536671",
  line: "#C9D8DF",
};
const resumeAddress = [
  "S/O Satyanarayana",
  "D. No: 10-35-46",
  "Near Kunchalamma Gudi",
  "Bank Colony,",
  "Bheemunipatam,",
  "Visakhapatnam.",
  "531163",
].join("\n");

const widthOf = (doc: InstanceType<typeof PDFDocument>) =>
  doc.page.width - doc.page.margins.left - doc.page.margins.right;

function displayText(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u00B7]/g, "-")
    .replace(/[\u2080-\u2089]/g, (digit) => String.fromCharCode(48 + digit.charCodeAt(0) - 0x2080))
    .replace(/\u2122/g, "TM")
    .replace(/\u00AE/g, "(R)")
    .replace(/\u00A0/g, " ");
}

function safeLink(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}

function ensureRoom(doc: InstanceType<typeof PDFDocument>, height = 30) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage();
}

function section(doc: InstanceType<typeof PDFDocument>, title: string) {
  ensureRoom(doc, 42);
  doc.moveDown(0.5);
  const y = doc.y;
  doc.rect(doc.page.margins.left, y - 2, 3, 15).fill(colors.teal);
  doc.fillColor(colors.navy).font("Helvetica-Bold").fontSize(11.5)
    .text(displayText(title.toUpperCase()), doc.page.margins.left + 10, y, { characterSpacing: 0.7 });
  const ruleY = doc.y + 4;
  doc.moveTo(doc.page.margins.left, ruleY).lineTo(doc.page.width - doc.page.margins.right, ruleY)
    .lineWidth(0.55).strokeColor(colors.line).stroke();
  doc.y = ruleY + 8;
  doc.fillColor(colors.ink).font("Helvetica").fontSize(9.1);
}

function paragraph(
  doc: InstanceType<typeof PDFDocument>,
  text?: string,
  options: { bold?: boolean; muted?: boolean; link?: string; indent?: number; fontSize?: number; width?: number } = {},
) {
  if (!text?.trim()) return;
  ensureRoom(doc, 20);
  doc.font(options.bold ? "Helvetica-Bold" : "Helvetica")
    .fillColor(options.muted ? colors.muted : options.link ? colors.teal : colors.ink)
    .fontSize(options.fontSize ?? 9.1)
    .text(displayText(text), doc.page.margins.left, doc.y, {
      width: options.width ?? widthOf(doc),
      indent: options.indent ?? 0,
      link: safeLink(options.link),
      underline: Boolean(options.link),
      lineGap: 1.6,
    });
}

function entry(
  doc: InstanceType<typeof PDFDocument>,
  title: string,
  detail?: string,
  options: { link?: string } = {},
) {
  paragraph(doc, title, { bold: true, link: options.link });
  if (detail) paragraph(doc, detail, { muted: true });
  doc.moveDown(0.2);
}

function twoColumnList(doc: InstanceType<typeof PDFDocument>, items: string[]) {
  if (!items.length) return;
  const gap = 24;
  const columnWidth = (widthOf(doc) - gap) / 2;
  const left = doc.page.margins.left;
  const right = left + columnWidth + gap;
  const rows = Math.ceil(items.length / 2);

  doc.font("Helvetica").fontSize(8.8).fillColor(colors.ink);
  for (let row = 0; row < rows; row += 1) {
    const leftItem = items[row * 2];
    const rightItem = items[row * 2 + 1];
    const leftText = leftItem ? `- ${displayText(leftItem)}` : undefined;
    const rightText = rightItem ? `- ${displayText(rightItem)}` : undefined;
    const leftHeight = leftText ? doc.heightOfString(leftText, { width: columnWidth, lineGap: 3 }) : 0;
    const rightHeight = rightText ? doc.heightOfString(rightText, { width: columnWidth, lineGap: 3 }) : 0;
    const rowHeight = Math.max(leftHeight, rightHeight);
    ensureRoom(doc, rowHeight + 6);
    const y = doc.y;

    if (leftText) doc.text(leftText, left, y, { width: columnWidth, lineGap: 3 });
    if (rightText) doc.text(rightText, right, y, { width: columnWidth, lineGap: 3 });
    doc.y = y + rowHeight + 6;
  }
}

function drawContactRow(doc: InstanceType<typeof PDFDocument>, items: Array<{ label: string; href: string }>) {
  let x = doc.page.margins.left;
  let y = doc.y;
  const right = doc.page.width - doc.page.margins.right;
  const fontSize = 8.4;
  for (const [index, item] of items.entries()) {
    const checked = safeLink(item.href);
    if (!checked) continue;
    const label = displayText(item.label);
    doc.font("Helvetica-Bold").fontSize(fontSize);
    const labelWidth = doc.widthOfString(label);
    doc.font("Helvetica").fontSize(fontSize);
    const separatorWidth = doc.widthOfString("   |   ");
    if (x + labelWidth > right) {
      x = doc.page.margins.left;
      y += 13;
    }
    doc.fillColor(colors.teal).font("Helvetica-Bold").fontSize(fontSize)
      .text(label, x, y, { link: checked, underline: true, lineBreak: false });
    x += labelWidth;
    if (index < items.length - 1) {
      doc.fillColor(colors.muted).font("Helvetica").fontSize(fontSize)
        .text("   |   ", x, y, { lineBreak: false });
      x += separatorWidth;
    }
  }
  doc.y = y + 13;
  doc.fillColor(colors.ink).font("Helvetica").fontSize(9.1);
}

function academicProfileLinks(model: ResumeModel) {
  const allowed = /google scholar|researchgate|linkedin|irins|vidwan/i;
  const links = model.profileLinks.filter((item) => allowed.test(item.label) && safeLink(item.href));
  const identityLinks = model.academicIdentity.filter((item) => safeLink(item.href));
  const combined = [
    ...links,
    ...identityLinks.map((item) => ({ label: item.label.replace(/\s+ID$/i, ""), href: item.href! })),
  ];
  const seen = new Set<string>();
  return combined.filter((item) => {
    const key = item.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isUniversityEducation(degree: string) {
  return !/^(school|intermediate|secondary|higher secondary)/i.test(degree.trim());
}

const months: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

function formatResumeDate(value: string) {
  const monthYear = value.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear && months[monthYear[1].toLowerCase()]) {
    return `${months[monthYear[1].toLowerCase()]}/${monthYear[2]}`;
  }
  return value;
}

function yearNewestFirst<T>(items: T[], getYear: (item: T) => string | number | undefined) {
  return items.map((item, index) => ({ item, index, year: Number(String(getYear(item) ?? "").match(/\b\d{4}\b/)?.[0] ?? 0) }))
    .sort((a, b) => b.year - a.year || a.index - b.index)
    .map(({ item }) => item);
}

export async function renderResumePdf(
  model: ResumeModel,
  images: ResumeImages = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 42, right: 48, bottom: 58, left: 48 },
      compress: false,
      bufferPages: true,
      info: {
        Title: "Academic Curriculum Vitae",
        Author: model.profile.name,
        Subject: "Academic CV generated from the authorized portfolio data",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const headerWidth = widthOf(doc) - (images.profilePhoto ? 96 : 0);
    doc.rect(left, 30, widthOf(doc), 4).fill(colors.teal);
    doc.fillColor(colors.navy).font("Helvetica-Bold").fontSize(22)
      .text(displayText(model.profile.name), left, 46, { width: headerWidth });
    doc.fillColor(colors.teal).font("Helvetica-Bold").fontSize(9.6)
      .text(displayText(model.profile.qualifications), left, doc.y + 2, { width: headerWidth });
    doc.fillColor(colors.navy).font("Helvetica-Bold").fontSize(10)
      .text(displayText(`${model.profile.designation} | ${model.profile.department}`), left, doc.y + 6, { width: headerWidth });
    paragraph(doc, model.profile.institution, { muted: true, fontSize: 8.8, width: headerWidth });
    if (images.profilePhoto) {
      doc.image(images.profilePhoto.data, right - 78, 43, { fit: [78, 92], align: "center", valign: "center" });
      doc.y = Math.max(doc.y, 137);
    }
    doc.moveDown(0.15);

    const contacts = [
      { label: "Email", href: `mailto:${model.profile.email}` },
      { label: "Phone", href: `tel:${model.profile.phone.replace(/\s+/g, "")}` },
      ...academicProfileLinks(model),
    ];
    drawContactRow(doc, contacts);
    paragraph(doc, "Permanent Address", { bold: true, fontSize: 8.2 });
    for (const addressLine of resumeAddress.split("\n")) {
      paragraph(doc, addressLine, { muted: true, fontSize: 8.1 });
    }
    const identifiers = model.academicIdentity
      .filter((item) => !/google scholar/i.test(item.label) && item.value.trim())
      .map((item) => `${item.label}: ${item.value}`);
    for (let index = 0; index < identifiers.length; index += 2) {
      paragraph(doc, identifiers.slice(index, index + 2).join("   |   "), { muted: true, fontSize: 8.1 });
    }
    doc.moveDown(0.15);
    doc.moveTo(left, doc.y).lineTo(right, doc.y).lineWidth(1.3).strokeColor(colors.teal).stroke();
    doc.moveDown(0.4);

    section(doc, "Professional Summary");
    paragraph(doc, model.profile.description);

    const researchFocus = [...new Set((model.researchAreas.length
      ? model.researchAreas.map((area) => area.title)
      : model.profile.researchInterests).map((value) => value.trim()).filter(Boolean))];
    if (researchFocus.length) {
      section(doc, "Research Interests");
      twoColumnList(doc, researchFocus);
    }
    if (model.profile.technicalTools.length) {
      section(doc, "Technical Tools");
      twoColumnList(doc, model.profile.technicalTools);
    }

    section(doc, "Academic Appointments");
    for (const item of model.experience) {
      entry(doc, `${item.role} | ${item.period}`, [item.institution, item.department].filter(Boolean).join(" | "));
    }

    const degrees = model.education.filter((item) => isUniversityEducation(item.degree));
    if (degrees.length) {
      section(doc, "Education");
      for (const item of degrees) {
        entry(doc, `${item.degree} | ${formatResumeDate(item.year)}`, [item.institution, item.field, item.detail]
          .filter(Boolean).join(" | "));
      }
    }

    section(doc, "Google Scholar Metrics");
    const scholarMetrics = [
      `Citations ${primaryScholarMetric(model.profile.googleScholarMetrics.citationsText)}`,
      `h-index ${primaryScholarMetric(model.profile.googleScholarMetrics.hIndexText)}`,
      `i10-index ${primaryScholarMetric(model.profile.googleScholarMetrics.i10IndexText)}`,
    ].join("   |   ");
    if (images.citationsFigure) {
      const imageY = doc.y;
      const imageWidth = 94;
      const imageHeight = 124;
      doc.image(images.citationsFigure.data, right - imageWidth, imageY, { fit: [imageWidth, imageHeight] });
      paragraph(doc, scholarMetrics, { width: widthOf(doc) - imageWidth - 14 });
      paragraph(doc, "Peer-reviewed Web of Science (WoS) publications: 17", { muted: true, width: widthOf(doc) - imageWidth - 14 });
      doc.y = Math.max(doc.y, imageY + imageHeight + 6);
    } else {
      paragraph(doc, scholarMetrics);
      paragraph(doc, "Peer-reviewed Web of Science (WoS) publications: 17", { muted: true });
    }
    const allPublications = yearNewestFirst(model.publications, (item) => item.year);
    section(doc, `Research Publications (${allPublications.length})`);
    let publicationPage = doc.bufferedPageRange().count;
    for (const publication of allPublications) {
      const title = `${publication.title} (${publication.year})`;
      const indexing = publication.indexing?.filter(Boolean) ?? [];
      const metadata = [
        publication.journal,
        publication.type,
        indexing.length ? `Indexing: ${indexing.join(", ")}` : undefined,
        publication.impactFactor !== undefined ? `Impact Factor: ${publication.impactFactor}` : undefined,
      ].filter(Boolean);
      const detail = metadata.join(" | ");
      const doi = publication.doi?.replace(/^https?:\/\/doi\.org\//i, "");
      doc.font("Helvetica-Bold").fontSize(9.1);
      const titleHeight = doc.heightOfString(displayText(title), { width: widthOf(doc), lineGap: 1.6 });
      doc.font("Helvetica").fontSize(9.1);
      const detailHeight = detail ? doc.heightOfString(displayText(detail), { width: widthOf(doc), lineGap: 1.6 }) : 0;
      const estimatedHeight = titleHeight + detailHeight
        + (doi ? 13 : 0) + 8;
      ensureRoom(doc, estimatedHeight);
      const currentPage = doc.bufferedPageRange().count;
      if (currentPage !== publicationPage) {
        section(doc, "Research Publications (continued)");
        publicationPage = doc.bufferedPageRange().count;
      }
      entry(doc, title, detail);
      if (doi) {
        paragraph(doc, `doi:${doi}`, { link: `https://doi.org/${doi}`, fontSize: 8.1 });
      }
    }

    if (model.achievements.length) {
      section(doc, "Awards and Achievements");
      for (const achievement of model.achievements) entry(doc, achievement.title, achievement.text);
    }

    if (model.memberships.length) {
      section(doc, "Professional Memberships");
      for (const membership of model.memberships) {
        entry(doc, membership.organizationName, [membership.membershipType, membership.designation]
          .filter(Boolean).join(" | "));
      }
    }

    if (model.certifications.length) {
      doc.font("Helvetica-Bold").fontSize(9.1);
      const certificationHeight = model.certifications.reduce((height, item) => {
        const lineHeight = doc.heightOfString(displayText(item.title), { width: widthOf(doc), lineGap: 1.6 });
        return height + lineHeight + (item.year ? 12 : 0) + 3;
      }, 46);
      ensureRoom(doc, certificationHeight);
      section(doc, `NPTEL Courses (${model.certifications.length})`);
      twoColumnList(doc, yearNewestFirst(model.certifications, (item) => item.year)
        .map((certification) => certification.title));
    }

    if (model.activities.length) {
      const allActivities = yearNewestFirst(model.activities, (item) => item.year);
      section(doc, `Academic Activities (${allActivities.length})`);
      for (const activity of allActivities) {
        entry(doc, `${activity.title} (${activity.year})`, [activity.type, activity.institution, activity.date, activity.duration, activity.details]
          .filter(Boolean).join(" | "));
      }
    }

    if (model.completedReviewsCount > 0) {
      section(doc, "Academic Service");
      paragraph(doc, `Completed peer reviews: ${model.completedReviewsCount}`);
    }

    if (model.subjects.length) {
      section(doc, `Subjects Taught (${model.subjects.length})`);
      twoColumnList(doc, model.subjects.map((subject) => [subject.subjectName, subject.courseCode, subject.program, subject.branch, subject.semester, subject.academicYear, subject.subjectType]
        .filter(Boolean).join(" | ")));
    }

    const ugProjectCount = model.guidedProjectCounts?.ug ?? model.projects.filter((project) => /^UG\b/i.test(project.projectLevel?.trim() ?? "")).length;
    const pgProjectCount = model.guidedProjectCounts?.pg ?? model.projects.filter((project) => /^PG\b/i.test(project.projectLevel?.trim() ?? "")).length;
    section(doc, "Projects Guided");
    paragraph(doc, `UG: ${ugProjectCount}   |   PG: ${pgProjectCount}`);

    ensureRoom(doc, 112);
    section(doc, "Declaration");
    paragraph(doc, "I hereby declare that the information provided in this CV is true and correct to the best of my knowledge.");
    doc.moveDown(4);
    paragraph(doc, model.profile.name, { bold: true });

    const pageRange = doc.bufferedPageRange();
    for (let pageIndex = pageRange.start; pageIndex < pageRange.start + pageRange.count; pageIndex += 1) {
      doc.switchToPage(pageIndex);
      const originalBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 12;
      const footerY = doc.page.height - 29;
      doc.moveTo(doc.page.margins.left, footerY - 8).lineTo(right, footerY - 8)
        .lineWidth(0.5).strokeColor(colors.line).stroke();
      doc.font("Helvetica").fontSize(7.8).fillColor(colors.muted)
        .text(`${displayText(model.profile.name)} | Academic CV | ${pageIndex - pageRange.start + 1} / ${pageRange.count}`, left, footerY, {
          width: widthOf(doc),
          align: "right",
          lineBreak: false,
        });
      doc.page.margins.bottom = originalBottomMargin;
    }

    doc.end();
  });
}
