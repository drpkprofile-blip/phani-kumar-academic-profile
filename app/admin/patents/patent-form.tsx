"use client";

import { useActionState } from "react";
import { savePatent } from "./actions";
import type { PatentFormState, PatentValues } from "../../../lib/admin/patent-form";
import styles from "../admin.module.css";

export default function PatentForm({ id, updatedAt, initial }: {
  id?: number;
  updatedAt?: string;
  initial?: Partial<PatentValues>;
}) {
  const [state, action, pending] = useActionState<PatentFormState, FormData>(savePatent, {});
  const value = (name: keyof PatentValues) => state.values?.[name] ?? initial?.[name] ?? "";
  const error = (name: keyof PatentValues) => state.errors?.[name];
  const props = (name: keyof PatentValues) => ({
    id: name,
    name,
    defaultValue: value(name),
    "aria-invalid": !!error(name),
    "aria-describedby": error(name) ? `${name}-error` : undefined,
  });
  const hint = (name: keyof PatentValues) => error(name)
    && <span id={`${name}-error`} className={styles.error}>{error(name)}</span>;

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="id" value={id ?? ""} />
      <input type="hidden" name="updated_at" value={updatedAt ?? ""} />
      {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
      <label className={styles.field} htmlFor="application_number">Application number
        <input {...props("application_number")} required />{hint("application_number")}
      </label>
      <label className={styles.field} htmlFor="title">Title of the invention
        <textarea {...props("title")} rows={3} required />{hint("title")}
      </label>
      <label className={styles.field} htmlFor="filing_date">Date of filing
        <input {...props("filing_date")} type="date" required />{hint("filing_date")}
      </label>
      <label className={styles.field} htmlFor="publication_date">Publication date
        <input {...props("publication_date")} type="date" required />{hint("publication_date")}
      </label>
      <label className={styles.field} htmlFor="journal_number">Patent Office Journal number
        <input {...props("journal_number")} required />{hint("journal_number")}
      </label>
      <label className={styles.field} htmlFor="page_number">Page number
        <input {...props("page_number")} required />{hint("page_number")}
      </label>
      <label className={styles.field} htmlFor="proof_url">Proof URL (optional)
        <input {...props("proof_url")} type="url" placeholder="Paste the Google Drive link when ready" />{hint("proof_url")}
      </label>
      <p className={styles.note}>Dates are saved as entered. Only HTTP/HTTPS proof links are accepted.</p>
      <div className={styles.controls}>
        <button className={styles.button} type="submit" disabled={pending}>
          {pending ? "Saving…" : id ? "Save patent" : "Add patent"}
        </button>
        <a className={styles.secondary} href="/admin/patents">Cancel</a>
      </div>
    </form>
  );
}
