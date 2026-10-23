export const patentFields = [
  "application_number", "filing_date", "publication_date", "title", "journal_number", "page_number", "proof_url",
] as const;
export type PatentField = typeof patentFields[number];
export type PatentValues = Record<PatentField, string>;
export type PatentFormState = {
  message?: string;
  errors?: Partial<Record<PatentField, string>>;
  values?: PatentValues;
};

function isRealIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function parsePatentForm(form: FormData) {
  const values = Object.fromEntries(patentFields.map((field) => [
    field,
    typeof form.get(field) === "string" ? form.get(field) : "",
  ])) as PatentValues;
  const errors: PatentFormState["errors"] = {};

  for (const field of ["application_number", "title", "journal_number", "page_number"] as const) {
    if (!values[field].trim()) errors[field] = "This field is required.";
  }
  for (const field of ["filing_date", "publication_date"] as const) {
    if (!isRealIsoDate(values[field])) errors[field] = "Enter a valid date.";
  }
  if (!errors.filing_date && !errors.publication_date && values.publication_date < values.filing_date) {
    errors.publication_date = "Publication date cannot precede the filing date.";
  }

  let proofUrl: string | null = null;
  if (values.proof_url.trim()) {
    try {
      const parsed = new URL(values.proof_url);
      if (values.proof_url !== values.proof_url.trim() || /\s/.test(values.proof_url)
        || !["http:", "https:"].includes(parsed.protocol) || !parsed.hostname
        || parsed.username || parsed.password) throw new Error();
      proofUrl = values.proof_url;
    } catch {
      errors.proof_url = "Enter a valid HTTP or HTTPS URL.";
    }
  }

  return {
    values,
    errors,
    data: {
      application_number: values.application_number.trim(),
      filing_date: values.filing_date,
      publication_date: values.publication_date,
      title: values.title.trim(),
      journal_number: values.journal_number.trim(),
      page_number: values.page_number.trim(),
      proof_url: proofUrl,
    },
  };
}

export function positivePatentId(value: FormDataEntryValue | string | null): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= 2147483647 ? number : null;
}
