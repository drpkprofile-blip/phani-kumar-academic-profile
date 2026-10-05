"use client";

import { useActionState } from "react";
import { saveSubjectTaught } from "./actions";
import type { SubjectTaughtFormState, SubjectTaughtValues } from "../../../lib/admin/subject-taught-form";
import styles from "../admin.module.css";

const fields: Array<{ name: keyof SubjectTaughtValues; label: string }> = [
  { name: "subject_name", label: "Subject Name (required)" },
  { name: "course_code", label: "Course Code (optional)" },
  { name: "program", label: "Program (optional)" },
  { name: "branch", label: "Branch (optional)" },
  { name: "semester", label: "Semester (optional)" },
  { name: "academic_year", label: "Academic Year (optional)" },
  { name: "subject_type", label: "Subject Type (optional)" },
  { name: "proof_url", label: "Proof URL (optional)" },
];

export default function SubjectTaughtForm({ id, updatedAt, initial }: { id?: number; updatedAt?: string; initial?: Partial<SubjectTaughtValues> }) {
  const [state, action, pending] = useActionState<SubjectTaughtFormState, FormData>(saveSubjectTaught, {});
  const value = (name: keyof SubjectTaughtValues) => state.values?.[name] ?? initial?.[name] ?? "";
  return <form action={action} className={styles.form}>
    <input type="hidden" name="id" value={id ?? ""} /><input type="hidden" name="updated_at" value={updatedAt ?? ""} />
    {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
    {fields.map(({ name, label }) => <label key={name} className={styles.field} htmlFor={name}>{label}
      <input id={name} name={name} type={name === "proof_url" ? "url" : "text"} defaultValue={value(name)}
        required={name === "subject_name"} aria-invalid={!!state.errors?.[name]}
        aria-describedby={state.errors?.[name] ? `${name}-error` : undefined} />
      {state.errors?.[name] && <span id={`${name}-error`} className={styles.error}>{state.errors[name]}</span>}
    </label>)}
    <p className={styles.note}>Leave unknown details blank. Optional blank fields are saved as NULL. Proof links must use HTTP or HTTPS.</p>
    <div className={styles.controls}><button className={styles.button} type="submit" disabled={pending}>{pending ? "Saving…" : id ? "Save subject" : "Add subject"}</button>
      <a className={styles.secondary} href="/admin/subjects-taught">Cancel</a></div>
  </form>;
}
