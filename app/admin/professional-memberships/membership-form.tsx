"use client";

import { useActionState } from "react";
import { saveProfessionalMembership } from "./actions";
import type { ProfessionalMembershipFormState, ProfessionalMembershipValues } from "../../../lib/admin/professional-membership-form";
import styles from "../admin.module.css";

const fields: Array<{ name: keyof ProfessionalMembershipValues; label: string; multiline?: boolean }> = [
  { name: "organization_name", label: "Organization name (required)" },
  { name: "membership_type", label: "Membership type (optional)" },
  { name: "membership_number", label: "Membership number (optional)" },
  { name: "date_text", label: "Date text (optional)" },
  { name: "validity_text", label: "Validity text (optional)" },
  { name: "designation", label: "Designation (optional)" },
  { name: "chapter", label: "Chapter (optional)" },
  { name: "proof_url", label: "Proof URL (optional)" },
];

export default function ProfessionalMembershipForm({ id, updatedAt, initial }: { id?: number; updatedAt?: string; initial?: Partial<ProfessionalMembershipValues> }) {
  const [state, action, pending] = useActionState<ProfessionalMembershipFormState, FormData>(saveProfessionalMembership, {});
  const value = (name: keyof ProfessionalMembershipValues) => state.values?.[name] ?? initial?.[name] ?? "";
  return <form action={action} className={styles.form}>
    <input type="hidden" name="id" value={id ?? ""} /><input type="hidden" name="updated_at" value={updatedAt ?? ""} />
    {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
    {fields.map(({ name, label }) => <label key={name} className={styles.field} htmlFor={name}>{label}
      <input id={name} name={name} type={name === "proof_url" ? "url" : "text"} defaultValue={value(name)}
        required={name === "organization_name"} aria-invalid={!!state.errors?.[name]}
        aria-describedby={state.errors?.[name] ? `${name}-error` : undefined} />
      {state.errors?.[name] && <span id={`${name}-error`} className={styles.error}>{state.errors[name]}</span>}
    </label>)}
    <p className={styles.note}>Leave unsupported membership details blank. Optional blank fields are saved as NULL; proof links must use HTTP or HTTPS.</p>
    <div className={styles.controls}><button className={styles.button} type="submit" disabled={pending}>{pending ? "Saving…" : id ? "Save membership" : "Add membership"}</button>
      <a className={styles.secondary} href="/admin/professional-memberships">Cancel</a></div>
  </form>;
}
