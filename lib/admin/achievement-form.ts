export const achievementFields = ["title", "description", "proof_url", "extra_proof_url"] as const;
export type AchievementField = typeof achievementFields[number];
export type AchievementValues = Record<AchievementField, string>;
export type AchievementFormState = {
  message?: string;
  errors?: Partial<Record<AchievementField, string>>;
  values?: AchievementValues;
};

export function parseAchievementForm(form: FormData) {
  const values = Object.fromEntries(achievementFields.map((field) => [
    field,
    typeof form.get(field) === "string" ? form.get(field) : "",
  ])) as AchievementValues;
  const errors: AchievementFormState["errors"] = {};

  if (!values.title.trim()) errors.title = "Enter a nonblank title.";
  if (!values.description.trim()) errors.description = "Enter a nonblank description.";

  const optionalUrl = (value: string, field: "proof_url" | "extra_proof_url") => {
    if (!value.trim()) return null;
    try {
      if (value !== value.trim() || /\s/.test(value)) throw new Error();
      const parsed = new URL(value);
      if (!/^https?:\/\//i.test(value) || !["http:", "https:"].includes(parsed.protocol)
        || !parsed.hostname || parsed.username || parsed.password) throw new Error();
      return value;
    } catch {
      errors[field] = "Enter a valid HTTP or HTTPS URL.";
      return value;
    }
  };

  return {
    values,
    errors,
    data: {
      title: values.title,
      description: values.description,
      proof_url: optionalUrl(values.proof_url, "proof_url"),
      extra_proof_url: optionalUrl(values.extra_proof_url, "extra_proof_url"),
    },
  };
}

export function positiveInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= 2147483647 ? number : null;
}
