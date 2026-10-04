export const publicationFields = ["title", "year", "journal", "indexing", "doi", "article_url", "proof_url", "publication_type", "impact_factor"] as const;
export type PublicationField = typeof publicationFields[number];
export type PublicationValues = Record<PublicationField, string>;
export type PublicationFormState = {
  message?: string;
  errors?: Partial<Record<PublicationField, string>>;
  values?: PublicationValues;
};

export function parsePublicationForm(form: FormData) {
  const values = Object.fromEntries(publicationFields.map((field) => [field, typeof form.get(field) === "string" ? form.get(field) : ""])) as PublicationValues;
  const errors: PublicationFormState["errors"] = {};
  for (const field of ["title", "year", "journal"] as const) {
    if (!values[field].trim()) errors[field] = "This field is required.";
  }
  if (!/^\d{4}$/.test(values.year)) errors.year = "Enter a four-digit year.";
  const optional = (value: string) => value.trim() ? value : null;
  for (const field of ["article_url", "proof_url"] as const) {
    if (!optional(values[field])) continue;
    try {
      const url = new URL(values[field]);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error();
    } catch { errors[field] = "Enter a valid HTTP or HTTPS URL without credentials."; }
  }
  const type = optional(values.publication_type);
  if (type && !["Journal Article", "Book Chapter", "Conference Proceeding"].includes(type)) errors.publication_type = "Choose a listed publication type.";
  const impact = optional(values.impact_factor);
  const impactFactor = impact === null ? null : Number(impact);
  if (impact !== null && (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(impact) || !Number.isFinite(impactFactor) || impactFactor! < 0)) {
    errors.impact_factor = "Enter a non-negative finite number, or leave blank.";
  }
  return {
    values, errors,
    data: {
      title: values.title, year: values.year, journal: values.journal,
      indexing: values.indexing.split(/\r?\n/).filter((badge) => badge.trim()),
      doi: optional(values.doi), article_url: optional(values.article_url), proof_url: optional(values.proof_url),
      publication_type: type, impact_factor: impactFactor,
    },
  };
}

export function positiveInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= 2147483647 ? number : null;
}
