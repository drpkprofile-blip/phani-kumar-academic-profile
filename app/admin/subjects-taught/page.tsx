import Link from "next/link";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { logout } from "../actions";
import { moveSubjectTaught } from "./actions";
import styles from "../admin.module.css";

const successes: Record<string, string> = { added: "Subject added.", saved: "Subject saved.", deleted: "Subject deleted.", reordered: "Subject order updated." };
const errors: Record<string, string> = { stale: "The subject list changed. Reload and try again.", operation: "Unable to complete the operation. Please try again.", confirmation: "Deletion requires explicit confirmation.", position: "Choose a valid subject position." };

export default async function SubjectsTaughtAdmin({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { user, supabase } = await requireAdminPage();
  const { data: records, error } = await supabase.from("subjects_taught").select("*").order("display_order", { ascending: true });
  if (error || !records) throw new Error("Unable to load Subjects Taught management.");
  const { success, error: errorCode } = await searchParams;
  const order = JSON.stringify(records.map((record) => record.id));
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.management}`} aria-labelledby="subjects-taught-admin-title">
    <h1 id="subjects-taught-admin-title">Subjects Taught ({records.length})</h1><p className={styles.email}>{user.email}</p>
    <div className={styles.toolbar}><Link className={styles.secondary} href="/admin">Admin Dashboard</Link><Link className={styles.secondary} href="/" prefetch={false}>Back to Public Website</Link>
      <form action={logout}><button className={styles.secondary} type="submit">Logout</button></form><Link className={styles.button} href="/admin/subjects-taught/new">Add subject</Link></div>
    {success && Object.hasOwn(successes, success) && <p role="status" className={styles.success}>{successes[success]}</p>}
    {errorCode && Object.hasOwn(errors, errorCode) && <p role="alert" className={styles.error}>{errors[errorCode]}</p>}
    <p className={styles.note}>No subjects are preloaded. Add only subjects supported by authoritative records.</p>
    <div className={styles.list}>{records.map((record, index) => <article className={styles.record} key={record.id}>
      <div className={styles.badges}><span>#{String(record.display_order).padStart(2, "0")}</span>{record.subject_type && <span>{record.subject_type}</span>}</div>
      <h2>{record.subject_name}</h2>
      {[record.course_code && `Course code: ${record.course_code}`, record.program, record.branch, record.semester, record.academic_year]
        .filter(Boolean).map((detail) => <p key={detail}>{detail}</p>)}
      {record.proof_url && <p><a href={record.proof_url} target="_blank" rel="noopener noreferrer">Proof ↗</a></p>}
      <div className={styles.controls}><Link className={styles.secondary} href={`/admin/subjects-taught/${record.id}/edit`}>Edit</Link>
        <Link className={styles.danger} href={`/admin/subjects-taught/${record.id}/delete`}>Delete</Link>
        <form action={moveSubjectTaught} className={styles.reorder} aria-label={`Reorder subject: ${record.subject_name}`}>
          <input type="hidden" name="id" value={record.id} /><input type="hidden" name="order" value={order} />
          <button className={styles.secondary} name="direction" value="up" disabled={index === 0} aria-label="Move up">↑</button>
          <button className={styles.secondary} name="direction" value="down" disabled={index === records.length - 1} aria-label="Move down">↓</button>
          <label htmlFor={`subject-position-${record.id}`}>Position</label><input id={`subject-position-${record.id}`} name="position" type="number" min="1" max={records.length} defaultValue={index + 1} required />
          <button className={styles.secondary} type="submit">Move</button>
        </form>
      </div>
    </article>)}{records.length === 0 && <p>No subjects have been added yet.</p>}</div>
  </section></main>;
}
