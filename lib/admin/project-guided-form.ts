export const projectGuidedFields = [
  "project_title", "project_level", "degree_program", "branch", "academic_year", "batch",
  "student_names", "guide_name", "co_guide_names", "proof_url",
] as const;

export type ProjectGuidedField = typeof projectGuidedFields[number];
export type ProjectGuidedValues = Record<ProjectGuidedField, string>;
export type ProjectGuidedFormState = {
  message?: string;
  errors?: Partial<Record<ProjectGuidedField, string>>;
  values?: ProjectGuidedValues;
};

const optionalText = (value: string) => value.trim() ? value : null;
const parseNameList = (value: string) => {
  const names = value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
  return names.length ? names : null;
};

export function parseProjectGuidedForm(form: FormData) {
  const values = Object.fromEntries(projectGuidedFields.map((field) => [
    field, typeof form.get(field) === "string" ? form.get(field) : "",
  ])) as ProjectGuidedValues;
  const errors: ProjectGuidedFormState["errors"] = {};
  if (!values.project_title.trim()) errors.project_title = "Enter a nonblank project title.";

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

  return {
    values,
    errors,
    data: {
      project_title: values.project_title,
      project_level: optionalText(values.project_level),
      degree_program: optionalText(values.degree_program),
      branch: optionalText(values.branch),
      academic_year: optionalText(values.academic_year),
      batch: optionalText(values.batch),
      student_names: parseNameList(values.student_names),
      guide_name: optionalText(values.guide_name),
      co_guide_names: parseNameList(values.co_guide_names),
      proof_url: proofUrl,
    },
  };
}

export function positiveProjectGuidedInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= 2147483647 ? number : null;
}
