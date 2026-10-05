export const professionalMembershipFields = [
  "organization_name", "membership_type", "membership_number", "date_text",
  "validity_text", "designation", "chapter", "proof_url",
] as const;
export type ProfessionalMembershipField = typeof professionalMembershipFields[number];
export type ProfessionalMembershipValues = Record<ProfessionalMembershipField, string>;
export type ProfessionalMembershipFormState = {
  message?: string;
  errors?: Partial<Record<ProfessionalMembershipField, string>>;
  values?: ProfessionalMembershipValues;
};

export function parseProfessionalMembershipForm(form: FormData) {
  const values = Object.fromEntries(professionalMembershipFields.map((field) => [
    field, typeof form.get(field) === "string" ? form.get(field) : "",
  ])) as ProfessionalMembershipValues;
  const errors: ProfessionalMembershipFormState["errors"] = {};
  if (!values.organization_name.trim()) errors.organization_name = "Enter a nonblank organization name.";

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
  const nullable = (value: string) => value.trim() ? value : null;
  return {
    values,
    errors,
    data: {
      organization_name: values.organization_name,
      membership_type: nullable(values.membership_type),
      membership_number: nullable(values.membership_number),
      date_text: nullable(values.date_text),
      validity_text: nullable(values.validity_text),
      designation: nullable(values.designation),
      chapter: nullable(values.chapter),
      proof_url: proofUrl,
    },
  };
}

export function positiveMembershipInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= 2147483647 ? number : null;
}
