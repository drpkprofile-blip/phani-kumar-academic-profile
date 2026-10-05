import type { AcademicIdentity, ProfileLink } from "../../data/profile";

export type ProfileSettingsValues = {
  name: string; first_name: string; last_name: string; qualifications: string;
  designation: string; department: string; institution: string; profile_label: string;
  description: string; email: string; phone: string;
  experience_counter_text: string; youtube_title: string; youtube_href: string;
  youtube_image: string; google_scholar_citations_text: string;
  google_scholar_h_index_text: string; google_scholar_i10_index_text: string;
  technical_tools: string[]; skills: string[];
  research_interests: string[]; academic_identity: AcademicIdentity[]; profile_links: ProfileLink[];
};

export type ProfileSettingsErrors = Partial<Record<keyof ProfileSettingsValues, string>>;

const scalarFields = [
  "name", "first_name", "last_name", "qualifications", "designation", "department",
  "institution", "profile_label", "description", "email", "phone",
  "experience_counter_text", "youtube_title", "youtube_href", "youtube_image",
  "google_scholar_citations_text", "google_scholar_h_index_text", "google_scholar_i10_index_text",
] as const;

function safeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && !parsed.username && !parsed.password;
  } catch { return false; }
}

function parseRows<T extends { label: string; href?: string }>(value: FormDataEntryValue | null, kind: "social" | "identity"):
  { rows: T[]; error?: string } {
  if (typeof value !== "string") return { rows: [], error: "Add valid rows." };
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length > 40) return { rows: [], error: "Use no more than 40 rows." };
    const rows: T[] = [];
    for (const raw of parsed) {
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { rows: [], error: "Check the rows." };
      const row = raw as Record<string, unknown>;
      const label = typeof row.label === "string" ? row.label : "";
      const href = typeof row.href === "string" ? row.href : "";
      const secondary = kind === "identity" ? (typeof row.value === "string" ? row.value : "") : "";
      if (!label.trim() || label.length > 120 || (kind === "identity" && (!secondary.trim() || secondary.length > 500)) || href.length > 2048 || (href && !safeHttpUrl(href))) {
        return { rows: [], error: "Each row needs a label and valid optional HTTP/HTTPS link." };
      }
      rows.push((kind === "identity" ? { label, value: secondary, href } : { label, href }) as T);
    }
    return { rows };
  } catch { return { rows: [], error: "Check the row data." }; }
}

function parseList(value: FormDataEntryValue | null): string[] | null {
  if (typeof value !== "string" || value.length > 12000) return null;
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

export function parseProfileSettingsForm(form: FormData): { values: ProfileSettingsValues; errors: ProfileSettingsErrors } {
  const values = Object.fromEntries(scalarFields.map((field) => [field, form.get(field)])) as Record<(typeof scalarFields)[number], FormDataEntryValue | null>;
  const errors: ProfileSettingsErrors = {};
  for (const field of scalarFields) {
    if (typeof values[field] !== "string" || values[field].length > (field === "description" ? 8000 : field.startsWith("google_scholar_") ? 64 : 2048)) {
      errors[field as keyof ProfileSettingsValues] = "Enter a valid value within the field limit.";
    }
  }
  const requiredFields = ["name", "first_name", "last_name", "qualifications", "designation", "department", "institution", "profile_label", "description", "email", "phone", "experience_counter_text", "youtube_title", "google_scholar_citations_text", "google_scholar_h_index_text", "google_scholar_i10_index_text"] as const;
  for (const field of requiredFields) {
    const value = values[field];
    if (typeof value !== "string" || !value.trim()) errors[field] = "This field is required.";
  }
  if (typeof values.email === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Enter a valid email address.";
  if (typeof values.experience_counter_text === "string" && values.experience_counter_text.length > 64) errors.experience_counter_text = "Use at most 64 characters.";
  for (const field of ["google_scholar_citations_text", "google_scholar_h_index_text", "google_scholar_i10_index_text"] as const) {
    const value = values[field];
    if (typeof value === "string" && value.trim() && !/^\d+(?:\s*\(\d+\))?$/.test(value.trim())) {
      errors[field] = "Use a count with an optional parenthetical value, for example 179 (142).";
    }
  }
  for (const field of ["youtube_href", "youtube_image"] as const) {
    const value = values[field];
    const localPath = typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
    if (typeof value !== "string" || (value && !localPath && !safeHttpUrl(value))) errors[field] = "Use a local path or an HTTP/HTTPS URL.";
  }
  if (typeof values.youtube_href === "string" && !values.youtube_href.trim()) errors.youtube_href = "Enter a YouTube or channel link.";

  const identity = parseRows<AcademicIdentity>(form.get("academic_identity"), "identity");
  const links = parseRows<ProfileLink>(form.get("profile_links"), "social");
  if (identity.error) errors.academic_identity = identity.error;
  if (links.error) errors.profile_links = links.error;
  const tools = parseList(form.get("technical_tools"));
  const skills = parseList(form.get("skills"));
  const interests = parseList(form.get("research_interests"));
  if (!tools || !skills || !interests) errors.technical_tools = "Keep each list under 12,000 characters.";
  const mapped = Object.fromEntries(scalarFields.map((field) => [field, typeof values[field] === "string" ? values[field] as string : ""])) as unknown as ProfileSettingsValues;
  return {
    values: {
      ...mapped,
      technical_tools: tools ?? [], skills: skills ?? [], research_interests: interests ?? [],
      academic_identity: identity.rows, profile_links: links.rows,
    },
    errors,
  };
}

export function profileSettingsToRow(values: ProfileSettingsValues) {
  return {
    name: values.name, first_name: values.first_name, last_name: values.last_name,
    qualifications: values.qualifications, designation: values.designation,
    department: values.department, institution: values.institution,
    profile_label: values.profile_label, description: values.description,
    email: values.email, phone: values.phone,
    experience_counter_text: values.experience_counter_text,
    google_scholar_citations_text: values.google_scholar_citations_text,
    google_scholar_h_index_text: values.google_scholar_h_index_text,
    google_scholar_i10_index_text: values.google_scholar_i10_index_text,
    academic_identity: values.academic_identity, profile_links: values.profile_links,
    youtube_channel: { title: values.youtube_title, href: values.youtube_href, image: values.youtube_image },
    technical_tools: values.technical_tools, skills: values.skills, research_interests: values.research_interests,
  };
}
