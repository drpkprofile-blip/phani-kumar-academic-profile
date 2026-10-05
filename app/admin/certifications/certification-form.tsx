"use client";

import { useActionState } from "react";
import { saveCertification } from "./actions";
import type { CertificationFormState, CertificationValues } from "../../../lib/admin/certification-form";
import styles from "../admin.module.css";

export default function CertificationForm({ id, updatedAt, initial }: {
  id?: number;
  updatedAt?: string;
  initial?: Partial<CertificationValues>;
}) {
  const [state, action, pending] = useActionState<CertificationFormState, FormData>(saveCertification, {});
  const value = (name: keyof CertificationValues) => state.values?.[name] ?? initial?.[name] ?? "";
  const error = (name: keyof CertificationValues) => state.errors?.[name];
  const props = (name: keyof CertificationValues) => ({
    id: name,
    name,
    defaultValue: value(name),
    "aria-invalid": !!error(name),
    "aria-describedby": error(name) ? `${name}-error` : undefined,
  });
  const hint = (name: keyof CertificationValues) => error(name)
    && <span id={`${name}-error`} className={styles.error}>{error(name)}</span>;

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="id" value={id ?? ""} />
      <input type="hidden" name="updated_at" value={updatedAt ?? ""} />
      {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
      <label className={styles.field} htmlFor="title">Title (required)
        <textarea {...props("title")} rows={3} required />{hint("title")}
      </label>
      <label className={styles.field} htmlFor="certificate_url">Certificate URL (optional)
        <input {...props("certificate_url")} type="url" />{hint("certificate_url")}
      </label>
      <label className={styles.field} htmlFor="fdp_url">FDP URL (optional)
        <input {...props("fdp_url")} type="url" />{hint("fdp_url")}
      </label>
      <p className={styles.note}>Leave missing links blank. Supplied URLs are kept exactly as entered.</p>
      <div className={styles.controls}>
        <button className={styles.button} type="submit" disabled={pending}>
          {pending ? "Saving…" : id ? "Save certification" : "Add certification"}
        </button>
        <a className={styles.secondary} href="/admin/certifications">Cancel</a>
      </div>
    </form>
  );
}
