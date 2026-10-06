export const certificationFields = ["title", "year", "certificate_url", "fdp_url"] as const;
export type CertificationField = typeof certificationFields[number];
export type CertificationValues = Record<CertificationField, string>;
export type CertificationFormState = {
  message?: string;
  errors?: Partial<Record<CertificationField, string>>;
  values?: CertificationValues;
};

export function parseCertificationForm(form: FormData) {
  const values = Object.fromEntries(certificationFields.map((field) => [
    field,
    typeof form.get(field) === "string" ? form.get(field) : "",
  ])) as CertificationValues;
  const errors: CertificationFormState["errors"] = {};

  if (!values.title.trim()) errors.title = "Enter a nonblank title.";

  let year: number | null = null;
  if (values.year.trim()) {
    if (!/^\d{4}$/.test(values.year) || Number(values.year) < 1800 || Number(values.year) > 2200) {
      errors.year = "Enter a valid four-digit year.";
    } else {
      year = Number(values.year);
    }
  }

  const optionalUrl = (value: string, field: "certificate_url" | "fdp_url") => {
    if (!value.trim()) return null;
    try {
      if (value !== value.trim()) throw new Error();
      const parsed = new URL(value);
      if (/\s/.test(value) || !/^https?:\/\//i.test(value) || !["http:", "https:"].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
        throw new Error();
      }
      return value;
    } catch {
      errors[field] = "Enter a valid HTTP or HTTPS URL.";
      return value;
    }
  };

  const certificateUrl = optionalUrl(values.certificate_url, "certificate_url");
  const fdpUrl = optionalUrl(values.fdp_url, "fdp_url");
  return {
    values,
    errors,
    data: { title: values.title, year, certificate_url: certificateUrl, fdp_url: fdpUrl },
  };
}

export function positiveInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= 2147483647 ? number : null;
}
