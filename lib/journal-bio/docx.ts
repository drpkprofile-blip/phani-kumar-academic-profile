import "server-only";

import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { PublicProfileSettings } from "../profile-settings";
import type { ResumeImage } from "../resume/media";

const navy = "102C3D";
const teal = "087F86";
const ink = "25333B";
const muted = "586A73";
const cleanBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function clean(value: string) {
  return value.replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u00A0\u202F]/g, " ").trim();
}

function dateParts(period: string): { year: number; month: number } | undefined {
  const firstDate = period.split(/[–—-]/, 1)[0]?.trim() ?? "";
  const match = firstDate.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i)
    ?? firstDate.match(/^([A-Za-z]{3})\.?\s+(\d{4})$/);
  if (!match) return undefined;
  const month = new Date(`${match[1]} 1, ${match[2]}`).getMonth() + 1;
  return month > 0 ? { year: Number(match[2]), month } : undefined;
}

function teachingExperienceYears(settings: PublicProfileSettings, now = new Date()) {
  const starts = settings.experience
    .filter((item) => /professor|lecturer|teacher|instructor/i.test(item.role))
    .map((item) => dateParts(item.period))
    .filter((item): item is { year: number; month: number } => Boolean(item))
    .sort((a, b) => a.year - b.year || a.month - b.month);
  const start = starts[0] ?? { year: 2008, month: 6 };
  let years = now.getFullYear() - start.year;
  if (now.getMonth() + 1 < start.month) years -= 1;
  return Math.max(0, years);
}

function imageDimensions(image: ResumeImage, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  return { width: Math.max(1, Math.round(image.width * scale)), height: Math.max(1, Math.round(image.height * scale)) };
}

function text(value: string, options: { size?: number; color?: string; bold?: boolean; font?: string } = {}) {
  return new TextRun({
    text: clean(value),
    font: options.font ?? "Aptos",
    size: options.size ?? 22,
    color: options.color ?? ink,
    bold: options.bold,
  });
}

export async function renderJournalBioDocx(settings: PublicProfileSettings, photo?: ResumeImage): Promise<Buffer> {
  const { profile, education, experience } = settings;
  const degree = (pattern: RegExp) => education.find((item) => pattern.test(`${item.degree} ${item.field}`));
  const bachelor = degree(/bachelor|b\.\s*tech/i);
  const masters = education.filter((item) => /master|m\.\s*tech|m\.\s*e\./i.test(`${item.degree} ${item.field}`));
  const phd = degree(/doctor|ph\.?d/i);
  const bachelorYear = bachelor?.year.match(/\d{4}/)?.[0] ?? "2005";
  const me = masters.find((item) => /cad|cam/i.test(`${item.degree} ${item.field}`));
  const aiMasters = masters.find((item) => /artificial|ai|machine learning/i.test(`${item.degree} ${item.field}`));
  const phdYear = phd?.year.match(/\d{4}/)?.[0] ?? "2026";
  const meYear = me?.year.match(/\d{4}/)?.[0] ?? "2010";
  const aiYear = aiMasters?.year.match(/\d{4}/)?.[0] ?? "2026";
  const interests = [...new Set(profile.researchInterests.map(clean).filter(Boolean))];
  const currentExperience = experience.find((item) => /present|current/i.test(item.period))
    ?? experience[0];
  const experienceYears = teachingExperienceYears(settings);
  const teachingInstitutions = [...new Set(experience
    .filter((item) => /professor|lecturer|teacher|instructor/i.test(item.role))
    .map((item) => clean(item.institution))
    .filter(Boolean))];
  const schoolNames = teachingInstitutions.length > 1
    ? `${teachingInstitutions.slice(0, -1).join(", ")}, and ${teachingInstitutions.at(-1)}`
    : teachingInstitutions[0] ?? profile.institution;
  const currentEmployer = currentExperience?.institution ?? profile.institution;
  const currentRole = currentExperience?.role ?? profile.designation;
  const phdTopic = phd?.detail?.replace(/^\s*research\s+topic\s*:\s*/i, "").trim();
  const phdField = phd ? `${clean(phd.field)}${phdTopic ? ` (research on ${clean(phdTopic)})` : ""}` : "";
  const aiField = aiMasters && /\bai[- ]?ml\b|artificial intelligence/i.test(aiMasters.field)
    ? "Artificial Intelligence and Machine Learning"
    : aiMasters?.field ?? "";
  const degreeSentences = [
    bachelor && `the B.Tech. degree in ${clean(bachelor.field)} from ${clean(bachelor.institution)}, India, in ${bachelorYear}`,
    me && `the M.E. degree in ${clean(me.field)} from ${clean(me.institution)}, India, in ${meYear}`,
    aiMasters && `the M.Tech. degree in ${clean(aiField)} from ${clean(aiMasters.institution)}, India, in ${aiYear}`,
    phd && `the Ph.D. degree in ${phdField} from ${clean(phd.institution)}, India, in ${phdYear}`,
  ].filter((item): item is string => Boolean(item));
  const degreesText = degreeSentences.length > 1
    ? `${degreeSentences.slice(0, -1).join("; ")}; and ${degreeSentences.at(-1)}`
    : degreeSentences[0] ?? clean(profile.qualifications);
  const bio = `${profile.name} received ${degreesText}. He has ${experienceYears} years of teaching experience and is currently working as ${currentRole} in the ${profile.department} at ${currentEmployer}, India. His academic appointments include ${schoolNames}. His research interests include ${interests.join(", ")}.`;

  const leftContent = [
    new Paragraph({ spacing: { after: 145 }, children: [text("AUTHOR BIOGRAPHY", { size: 19, color: teal, bold: true })] }),
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 130, line: 310 }, children: [text(bio, { size: 22 })] }),
    new Paragraph({ spacing: { after: 55 }, children: [text(profile.name, { size: 22, color: navy, bold: true })] }),
    new Paragraph({ spacing: { after: 20 }, children: [text(`${profile.designation} | ${profile.department}`, { size: 18, color: muted })] }),
    new Paragraph({ children: [text(profile.institution, { size: 18, color: muted })] }),
  ];
  const cells = [new TableCell({
    width: { size: photo ? 78 : 100, type: WidthType.PERCENTAGE },
    borders: cleanBorders,
    margins: { top: 0, bottom: 0, left: 0, right: 250 },
    children: leftContent,
  })];
  if (photo) {
    const dimensions = imageDimensions(photo, 132, 172);
    cells.push(new TableCell({
      width: { size: 22, type: WidthType.PERCENTAGE },
      borders: cleanBorders,
      margins: { top: 0, bottom: 0, left: 80, right: 0 },
      verticalAlign: "top",
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new ImageRun({
        data: photo.data,
        type: photo.type,
        transformation: dimensions,
        altText: { name: "Profile photograph", title: profile.name, description: `Profile photograph of ${profile.name}` },
      })] })],
    }));
  }
  const body = [
    new Paragraph({ spacing: { after: 55 }, children: [text(profile.name, { size: 36, color: navy, bold: true })] }),
    new Paragraph({ spacing: { after: 240 }, children: [text(`${profile.designation} | ${profile.department} | ${profile.institution}`, { size: 19, color: muted })] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: photo ? [7539, 2127] : [9666],
      borders: cleanBorders,
      rows: [new TableRow({ cantSplit: true, children: cells })],
    }),
  ];
  const doc = new Document({
    creator: profile.name,
    title: `${profile.name} — Journal Biography`,
    subject: "Author biography for academic journal submissions",
    description: "Editable Word author biography",
    styles: { default: { document: { run: { font: "Aptos", size: 22, color: ink } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1080, right: 1120, bottom: 1080, left: 1120 } } },
      children: body,
    }],
  });
  return Packer.toBuffer(doc);
}
