"use client";

import { useActionState } from "react";
import { saveProjectGuided } from "./actions";
import type { ProjectGuidedFormState, ProjectGuidedValues } from "../../../lib/admin/project-guided-form";
import styles from "../admin.module.css";

const fields: Array<{ name: keyof ProjectGuidedValues; label: string; multiline?: boolean }> = [
  { name: "project_title", label: "Project Title (required)" },
  { name: "project_level", label: "Project Level (optional)" },
  { name: "degree_program", label: "Degree Program (optional)" },
  { name: "branch", label: "Branch (optional)" },
  { name: "academic_year", label: "Academic Year (optional)" },
  { name: "batch", label: "Batch (optional)" },
  { name: "student_names", label: "Student Names (optional; one name per line)", multiline: true },
  { name: "guide_name", label: "Guide Name (optional)" },
  { name: "co_guide_names", label: "Co-Guide Names (optional; one name per line)", multiline: true },
  { name: "proof_url", label: "Proof URL (optional)" },
];

export default function ProjectGuidedForm({ id, updatedAt, initial }: {
  id?: number;
  updatedAt?: string;
  initial?: Partial<ProjectGuidedValues>;
}) {
  const [state, action, pending] = useActionState<ProjectGuidedFormState, FormData>(saveProjectGuided, {});
  const value = (name: keyof ProjectGuidedValues) => state.values?.[name] ?? initial?.[name] ?? "";
  return <form action={action} className={styles.form}>
    <input type="hidden" name="id" value={id ?? ""} />
    <input type="hidden" name="updated_at" value={updatedAt ?? ""} />
    {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
    {fields.map(({ name, label, multiline }) => <label key={name} className={styles.field} htmlFor={name}>{label}
      {multiline ? <textarea id={name} name={name} rows={4} defaultValue={value(name)} aria-invalid={!!state.errors?.[name]}
        aria-describedby={state.errors?.[name] ? `${name}-error` : undefined} /> :
        <input id={name} name={name} type={name === "proof_url" ? "url" : "text"} defaultValue={value(name)}
          required={name === "project_title"} aria-invalid={!!state.errors?.[name]}
          aria-describedby={state.errors?.[name] ? `${name}-error` : undefined} />}
      {state.errors?.[name] && <span id={`${name}-error`} className={styles.error}>{state.errors[name]}</span>}
    </label>)}
    <p className={styles.note}>Leave unknown information blank. Optional values are stored as NULL. Enter student and co-guide names on separate lines to preserve their order.</p>
    <div className={styles.controls}><button className={styles.button} type="submit" disabled={pending}>{pending ? "Saving…" : id ? "Save project" : "Add project"}</button>
      <a className={styles.secondary} href="/admin/projects-guided">Cancel</a></div>
  </form>;
}
