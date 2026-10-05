"use client";

import { useState } from "react";
import { useActionState } from "react";
import type { AcademicIdentity, ProfileLink } from "../../../data/profile";
import { saveProfileSettings, type ProfileFormState } from "./actions";
import styles from "../admin.module.css";

type ProfileEditorValues = {
  name: string; first_name: string; last_name: string; qualifications: string;
  designation: string; department: string; institution: string; profile_label: string;
  description: string; email: string; phone: string;
  experience_counter_text: string; youtube_title: string; youtube_href: string;
  youtube_image: string; google_scholar_citations_text: string;
  google_scholar_h_index_text: string; google_scholar_i10_index_text: string;
  technical_tools: string[]; skills: string[];
  research_interests: string[]; academic_identity: AcademicIdentity[]; profile_links: ProfileLink[];
};

const fields: Array<{ name: keyof Omit<ProfileEditorValues, "technical_tools" | "skills" | "research_interests" | "academic_identity" | "profile_links">; label: string; multiline?: boolean }> = [
  { name: "name", label: "Public name" },
  { name: "first_name", label: "First name" },
  { name: "last_name", label: "Last name" },
  { name: "qualifications", label: "Qualifications" },
  { name: "designation", label: "Designation" },
  { name: "department", label: "Department" },
  { name: "institution", label: "Institution" },
  { name: "profile_label", label: "Profile label" },
  { name: "description", label: "Short profile text", multiline: true },
  { name: "email", label: "Public email" },
  { name: "phone", label: "Public phone" },
  { name: "experience_counter_text", label: "Independent experience counter" },
  { name: "youtube_title", label: "YouTube channel title" },
  { name: "youtube_href", label: "YouTube channel URL" },
  { name: "youtube_image", label: "YouTube image path or URL" },
  { name: "google_scholar_citations_text", label: "Google Scholar citations (All / Since 2021)" },
  { name: "google_scholar_h_index_text", label: "Google Scholar h-index (All / Since 2021)" },
  { name: "google_scholar_i10_index_text", label: "Google Scholar i10-index (All / Since 2021)" },
];

function RowEditor<T extends { label: string; href?: string }>({
  title, rows, onChange, identity = false,
}: {
  title: string; rows: T[]; onChange: (rows: T[]) => void; identity?: boolean;
}) {
  function update(index: number, key: "label" | "href" | "value", value: string) {
    onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  }
  return <fieldset className={styles.rowEditor}>
    <legend>{title}</legend>
    {rows.map((row, index) => <div className={styles.profileRow} key={`${title}-${index}`}>
      <label className={styles.field}>Label<input value={row.label} onChange={(event) => update(index, "label", event.target.value)} /></label>
      {identity && <label className={styles.field}>Value<input value={String((row as T & { value?: string }).value ?? "")} onChange={(event) => update(index, "value", event.target.value)} /></label>}
      <label className={styles.field}>URL (optional)<input type="url" value={row.href ?? ""} onChange={(event) => update(index, "href", event.target.value)} /></label>
      <button type="button" className={styles.danger} onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))} aria-label={`Remove ${title} row ${index + 1}`}>Remove</button>
    </div>)}
    <button type="button" className={styles.secondary} onClick={() => onChange([...rows, { label: "", href: "", ...(identity ? { value: "" } : {}) } as T])}>Add row</button>
  </fieldset>;
}

export default function ProfileEditor({ initial }: { initial: ProfileEditorValues }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfileSettings, {});
  const [identity, setIdentity] = useState(initial.academic_identity);
  const [links, setLinks] = useState(initial.profile_links);
  function listField(name: "technical_tools" | "skills" | "research_interests", label: string, values: string[]) {
    return <label className={styles.field} htmlFor={name}>{label} (one item per line)
      <textarea id={name} name={name} rows={5} defaultValue={values.join("\n")} />
    </label>;
  }

  return <form action={action} className={styles.form}>
    {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
    {fields.map(({ name, label, multiline }) => <label className={styles.field} htmlFor={name} key={name}>{label}
      {multiline ? <textarea id={name} name={name} rows={5} defaultValue={String(state.values?.[name] ?? initial[name])} />
        : <input id={name} name={name} type={name === "email" ? "email" : name === "youtube_href" || name === "youtube_image" ? "text" : "text"}
          defaultValue={String(state.values?.[name] ?? initial[name])} required />}
      {state.errors?.[name] && <span className={styles.error}>{state.errors[name]}</span>}
    </label>)}
    <input type="hidden" name="academic_identity" value={JSON.stringify(identity)} />
    <input type="hidden" name="profile_links" value={JSON.stringify(links)} />
    <RowEditor title="Academic and research IDs" rows={identity} onChange={setIdentity} identity />
    {state.errors?.academic_identity && <p className={styles.error}>{state.errors.academic_identity}</p>}
    <RowEditor title="Social and research links" rows={links} onChange={setLinks} />
    {state.errors?.profile_links && <p className={styles.error}>{state.errors.profile_links}</p>}
    {listField("research_interests", "Research interests", state.values?.research_interests ?? initial.research_interests)}
    {listField("technical_tools", "Technical tools", state.values?.technical_tools ?? initial.technical_tools)}
    {listField("skills", "Skills", state.values?.skills ?? initial.skills)}
    <p className={styles.note}>Links accept HTTP or HTTPS. Leave a link blank when none is supplied. The experience counter stays independent of record counts.</p>
    <p className={styles.note}>Enter each metric as All (Since 2021), for example 179 (142), matching the citation table. Metrics are manual and are never imported automatically.</p>
    <button className={styles.button} type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile settings"}</button>
  </form>;
}
