export const subjectTaughtFields = [
  "subject_name", "course_code", "program", "branch", "semester", "academic_year", "subject_type", "proof_url",
] as const;
export type SubjectTaughtField = typeof subjectTaughtFields[number];
export type SubjectTaughtValues = Record<SubjectTaughtField, string>;
export type SubjectTaughtFormState = {
  message?: string;
  errors?: Partial<Record<SubjectTaughtField, string>>;
  values?: SubjectTaughtValues;
};

export function parseSubjectTaughtForm(form: FormData) {
  const values = Object.fromEntries(subjectTaughtFields.map((field) => [
    field, typeof form.get(field) === "string" ? form.get(field) : "",
  ])) as SubjectTaughtValues;
  const errors: SubjectTaughtFormState["errors"] = {};
  if (!values.subject_name.trim()) errors.subject_name = "Enter a nonblank subject name.";

  let proofUrl: string | null = null;
  if (values.proof_url.trim()) {
    try {
      const parsed = new URL(values.proof_url);
      if (values.proof_url !== values.proof_url.trim() || /\s/.test(values.proof_url)
        || !/^https?:\/\//i.test(values.proof_url) || !["http:", "https:"].includes(parsed.protocol)
        || !parsed.hostname || parsed.username || parsed.password) throw new Error();
      proofUrl = values.proof_url;
    } catch {
      errors.proof_url = "Enter a valid HTTP or HTTPS URL.";
    }
  }
  const optional = (value: string) => value.trim() ? value : null;
  return {
    values,
    errors,
    data: {
      subject_name: values.subject_name,
      course_code: optional(values.course_code),
      program: optional(values.program),
      branch: optional(values.branch),
      semester: optional(values.semester),
      academic_year: optional(values.academic_year),
      subject_type: optional(values.subject_type),
      proof_url: proofUrl,
    },
  };
}

export function positiveSubjectInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= 2147483647 ? number : null;
}
