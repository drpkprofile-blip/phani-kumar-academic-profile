"use client";

import { Fragment, useState } from "react";
import { useActionState } from "react";
import type { AcademicIdentity, ProfileLink } from "../../../data/profile";
import type { Education } from "../../../data/education";
import type { Experience } from "../../../data/experience";
import type { ResearchArea } from "../../../data/research";
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
  education_records: Education[]; research_area_records: ResearchArea[]; experience_records: Experience[];
  hero_message_mode: string; hero_quote: string; hero_quote_attribution: string;
  hero_greeting: string; hero_greeting_attribution: string;
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
  { name: "hero_message_mode", label: "Home page message" },
  { name: "hero_quote", label: "General quote", multiline: true },
  { name: "hero_quote_attribution", label: "Quote attribution" },
  { name: "hero_greeting", label: "Festival wishes", multiline: true },
  { name: "hero_greeting_attribution", label: "Festival wishes attribution" },
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
    {rows.map((row, index) => <div className={styles.profileRecordRow} key={`${title}-${index}`}>
      <label className={styles.field}>Label<input value={row.label} onChange={(event) => update(index, "label", event.target.value)} /></label>
      {identity && <label className={styles.field}>Value<input value={String((row as T & { value?: string }).value ?? "")} onChange={(event) => update(index, "value", event.target.value)} /></label>}
      <label className={styles.field}>URL (optional)<input type="url" value={row.href ?? ""} onChange={(event) => update(index, "href", event.target.value)} /></label>
      <button type="button" className={styles.danger} onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))} aria-label={`Remove ${title} row ${index + 1}`}>Remove</button>
    </div>)}
    <button type="button" className={styles.secondary} onClick={() => onChange([...rows, { label: "", href: "", ...(identity ? { value: "" } : {}) } as T])}>Add row</button>
  </fieldset>;
}

function RecordListEditor<T extends object>({
  title, rows, onChange, fields, createRow,
}: {
  title: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  fields: Array<{ key: keyof T; label: string; multiline?: boolean }>;
  createRow: () => T;
}) {
  return <fieldset className={styles.rowEditor}>
    <legend>{title}</legend>
    {rows.map((row, index) => <div className={styles.profileRecordRow} key={`${title}-${index}`}>
      <strong>{index + 1}</strong>
      {fields.map((field) => <label className={styles.field} key={String(field.key)}>{field.label}
        {field.multiline ? <textarea rows={3} value={String(row[field.key] ?? "")} onChange={(event) => onChange(rows.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field.key]: event.target.value } as T : entry))} />
          : <input value={String(row[field.key] ?? "")} onChange={(event) => onChange(rows.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field.key]: event.target.value } as T : entry))} />}
      </label>)}
      <button type="button" className={styles.danger} onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))} aria-label={`Remove ${title} record ${index + 1}`}>Remove</button>
    </div>)}
    <button type="button" className={styles.secondary} onClick={() => onChange([...rows, createRow()])}>Add {title.toLowerCase()}</button>
  </fieldset>;
}

export default function ProfileEditor({ initial }: { initial: ProfileEditorValues }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfileSettings, {});
  const [identity, setIdentity] = useState(initial.academic_identity);
  const [links, setLinks] = useState(initial.profile_links);
  const [education, setEducation] = useState(initial.education_records.map((item) => ({ ...item, detail: item.detail ?? "", proof: item.proof ?? "", marksProof: item.marksProof ?? "" })));
  const [researchAreas, setResearchAreas] = useState(initial.research_area_records);
  const [experience, setExperience] = useState(initial.experience_records);
  function listField(name: "technical_tools" | "skills" | "research_interests", label: string, values: string[]) {
    return <label className={styles.field} htmlFor={name}>{label} (one item per line)
      <textarea id={name} name={name} rows={5} defaultValue={values.join("\n")} />
    </label>;
  }

  return <form action={action} className={styles.form}>
    {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
    <h2>Home page and public identity</h2>
    {fields.map(({ name, label, multiline }) => <Fragment key={name}>
      {name === "hero_message_mode" && <h2>Home page message</h2>}
      <label className={styles.field} htmlFor={name}>{label}
      {name === "hero_message_mode" ? <select id={name} name={name} defaultValue={String(state.values?.[name] ?? initial[name])}>
          <option value="quote">Show the general quote</option><option value="greeting">Show festival wishes</option>
        </select>
        : multiline ? <textarea id={name} name={name} rows={name === "hero_quote" || name === "hero_greeting" ? 3 : 5}
          maxLength={name === "hero_quote" || name === "hero_greeting" ? 280 : undefined}
          defaultValue={String(state.values?.[name] ?? initial[name])} />
        : <input id={name} name={name} type={name === "email" ? "email" : name === "youtube_href" || name === "youtube_image" ? "text" : "text"}
          defaultValue={String(state.values?.[name] ?? initial[name])} required={!name.endsWith("attribution")}
          maxLength={name.endsWith("attribution") ? 120 : undefined} />}
      {state.errors?.[name] && <span className={styles.error}>{state.errors[name]}</span>}
      </label>
    </Fragment>)}
    <input type="hidden" name="academic_identity" value={JSON.stringify(identity)} />
    <input type="hidden" name="profile_links" value={JSON.stringify(links)} />
    <input type="hidden" name="education_records" value={JSON.stringify(education)} />
    <input type="hidden" name="research_area_records" value={JSON.stringify(researchAreas)} />
    <input type="hidden" name="experience_records" value={JSON.stringify(experience)} />
    <h2>Academic identity and public links</h2>
    <RowEditor title="Academic and research IDs" rows={identity} onChange={setIdentity} identity />
    {state.errors?.academic_identity && <p className={styles.error}>{state.errors.academic_identity}</p>}
    <RowEditor title="Social and research links" rows={links} onChange={setLinks} />
    {state.errors?.profile_links && <p className={styles.error}>{state.errors.profile_links}</p>}
    <h2>Academic records and career</h2>
    <RecordListEditor title="Education record" rows={education} onChange={setEducation} createRow={() => ({ year: "", degree: "", institution: "", field: "", detail: "", proof: "", marksProof: "" })}
      fields={[{ key: "year", label: "Year / date" }, { key: "degree", label: "Degree" }, { key: "institution", label: "Institution" }, { key: "field", label: "Field" }, { key: "detail", label: "Additional detail", multiline: true }, { key: "proof", label: "Proof URL" }, { key: "marksProof", label: "Marks memo URL" }]} />
    {state.errors?.education_records && <p className={styles.error}>{state.errors.education_records}</p>}
    <RecordListEditor title="Research area" rows={researchAreas} onChange={setResearchAreas} createRow={() => ({ title: "", text: "" })}
      fields={[{ key: "title", label: "Area title" }, { key: "text", label: "Description", multiline: true }]} />
    {state.errors?.research_area_records && <p className={styles.error}>{state.errors.research_area_records}</p>}
    <RecordListEditor title="Experience record" rows={experience} onChange={setExperience} createRow={() => ({ period: "", role: "", institution: "", department: "" })}
      fields={[{ key: "period", label: "Period" }, { key: "role", label: "Position" }, { key: "institution", label: "Institution" }, { key: "department", label: "Department" }]} />
    {state.errors?.experience_records && <p className={styles.error}>{state.errors.experience_records}</p>}
    <h2>Research interests and technical profile</h2>
    {listField("research_interests", "Research interests", state.values?.research_interests ?? initial.research_interests)}
    {listField("technical_tools", "Technical tools", state.values?.technical_tools ?? initial.technical_tools)}
    {listField("skills", "Skills", state.values?.skills ?? initial.skills)}
    <p className={styles.note}>Links accept HTTP or HTTPS. Leave a link blank when none is supplied. The experience counter stays independent of record counts.</p>
    <p className={styles.note}>Enter each metric as All (Since 2021), for example 179 (142), matching the citation table. Metrics are manual and are never imported automatically.</p>
    <p className={styles.note}>Choose which message appears in the home page hero. Both the general quote and festival wishes are saved, so you can switch back at any time. Messages allow 280 characters; attributions are optional.</p>
    <button className={styles.button} type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile settings"}</button>
  </form>;
}
