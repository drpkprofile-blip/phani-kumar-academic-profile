"use client";

import { useActionState } from "react";
import { saveAchievement } from "./actions";
import type { AchievementFormState, AchievementValues } from "../../../lib/admin/achievement-form";
import styles from "../admin.module.css";

export default function AchievementForm({ id, updatedAt, initial }: {
  id?: number;
  updatedAt?: string;
  initial?: Partial<AchievementValues>;
}) {
  const [state, action, pending] = useActionState<AchievementFormState, FormData>(saveAchievement, {});
  const value = (name: keyof AchievementValues) => state.values?.[name] ?? initial?.[name] ?? "";
  const error = (name: keyof AchievementValues) => state.errors?.[name];
  const props = (name: keyof AchievementValues) => ({
    id: name,
    name,
    defaultValue: value(name),
    "aria-invalid": !!error(name),
    "aria-describedby": error(name) ? `${name}-error` : undefined,
  });
  const hint = (name: keyof AchievementValues) => error(name)
    && <span id={`${name}-error`} className={styles.error}>{error(name)}</span>;

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="id" value={id ?? ""} />
      <input type="hidden" name="updated_at" value={updatedAt ?? ""} />
      {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
      <label className={styles.field} htmlFor="title">Title (required)
        <textarea {...props("title")} rows={2} required />{hint("title")}
      </label>
      <label className={styles.field} htmlFor="description">Description (required)
        <textarea {...props("description")} rows={5} required />{hint("description")}
      </label>
      <label className={styles.field} htmlFor="proof_url">Proof URL (optional)
        <input {...props("proof_url")} type="url" />{hint("proof_url")}
      </label>
      <label className={styles.field} htmlFor="extra_proof_url">Extra Proof URL (optional)
        <input {...props("extra_proof_url")} type="url" />{hint("extra_proof_url")}
      </label>
      <p className={styles.note}>Leave missing proof links blank. Supplied HTTP/HTTPS URLs are kept exactly as entered.</p>
      <div className={styles.controls}>
        <button className={styles.button} type="submit" disabled={pending}>
          {pending ? "Saving…" : id ? "Save achievement" : "Add achievement"}
        </button>
        <a className={styles.secondary} href="/admin/achievements">Cancel</a>
      </div>
    </form>
  );
}
