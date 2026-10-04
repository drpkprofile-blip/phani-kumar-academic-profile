"use client";

import { useActionState } from "react";
import { savePublication } from "./actions";
import type { PublicationValues, PublicationFormState } from "../../../lib/admin/publication-form";
import styles from "../admin.module.css";

export default function PublicationForm({ id, updatedAt, initial }: {
  id?: number; updatedAt?: string; initial?: Partial<PublicationValues>;
}) {
  const [state, action, pending] = useActionState<PublicationFormState, FormData>(savePublication, {});
  const value = (name: keyof PublicationValues) => state.values?.[name] ?? initial?.[name] ?? "";
  const error = (name: keyof PublicationValues) => state.errors?.[name];
  const props = (name: keyof PublicationValues) => ({
    id: name, name, defaultValue: value(name), "aria-invalid": !!error(name),
    "aria-describedby": error(name) ? `${name}-error` : undefined,
  });
  const hint = (name: keyof PublicationValues) => error(name) && <span id={`${name}-error`} className={styles.error}>{error(name)}</span>;
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="id" value={id ?? ""} />
      <input type="hidden" name="updated_at" value={updatedAt ?? ""} />
      {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
      <label className={styles.field} htmlFor="title">Title (required)
        <textarea {...props("title")} rows={3} required />{hint("title")}
      </label>
      <label className={styles.field} htmlFor="year">Year (required)
        <input {...props("year")} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required />{hint("year")}
      </label>
      <label className={styles.field} htmlFor="journal">Journal / publication details (required)
        <textarea {...props("journal")} rows={3} required />{hint("journal")}
      </label>
      <label className={styles.field} htmlFor="indexing">Indexing badges (optional; one badge per line, in display order)
        <textarea {...props("indexing")} rows={3} />{hint("indexing")}
      </label>
      <label className={styles.field} htmlFor="doi">DOI (optional)
        <input {...props("doi")} />{hint("doi")}
      </label>
      <label className={styles.field} htmlFor="article_url">Article URL (optional)
        <input {...props("article_url")} type="url" />{hint("article_url")}
      </label>
      <label className={styles.field} htmlFor="proof_url">PDF / Proof URL (optional)
        <input {...props("proof_url")} type="url" />{hint("proof_url")}
      </label>
      <label className={styles.field} htmlFor="publication_type">Publication type (optional)
        <select {...props("publication_type")}>
          <option value="">Not supplied</option>
          <option>Journal Article</option><option>Book Chapter</option><option>Conference Proceeding</option>
        </select>{hint("publication_type")}
      </label>
      <label className={styles.field} htmlFor="impact_factor">Impact factor (optional; supplied data only)
        <input {...props("impact_factor")} type="number" min="0" step="any" />{hint("impact_factor")}
      </label>
      <p>Leave missing metadata blank. No fields are filled from Google Scholar.</p>
      <div className={styles.controls}>
        <button className={styles.button} type="submit" disabled={pending}>{pending ? "Saving…" : id ? "Save publication" : "Add publication"}</button>
        <a className={styles.secondary} href="/admin">Cancel</a>
      </div>
    </form>
  );
}
