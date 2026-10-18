import Link from "next/link";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { logout } from "../actions";
import { moveProjectGuided, saveProjectGuidedCounts } from "./actions";
import styles from "../admin.module.css";

const successes: Record<string, string> = {
  added: "Guided project added.", saved: "Guided project saved.", deleted: "Guided project deleted.", reordered: "Project order updated.", counters: "UG/PG project counts updated.",
};
const errors: Record<string, string> = {
  stale: "The project list changed. Reload and try again.", operation: "Unable to complete the operation. Please try again.",
  confirmation: "Deletion requires explicit confirmation.", position: "Choose a valid project position.", counters: "Enter valid non-negative whole-number UG and PG counts.",
};

export default async function ProjectsGuidedAdmin({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { user, supabase } = await requireAdminPage();
  const [recordsResult, settingsResult] = await Promise.all([
    supabase.from("projects_guided").select("*").order("display_order", { ascending: true }),
    supabase.from("project_guided_settings").select("*").eq("singleton", true).maybeSingle(),
  ]);
  if (recordsResult.error || !recordsResult.data) throw new Error("Unable to load Projects Guided management.");
  const records = recordsResult.data;
  const { success, error: errorCode } = await searchParams;
  const order = JSON.stringify(records.map((record) => record.id));
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.management}`} aria-labelledby="projects-guided-admin-title">
    <h1 id="projects-guided-admin-title">Projects Guided ({records.length})</h1><p className={styles.email}>{user.email}</p>
    <div className={styles.toolbar}><Link className={styles.secondary} href="/admin">Admin Dashboard</Link><Link className={styles.secondary} href="/" prefetch={false}>Back to Public Website</Link>
      <form action={logout}><button className={styles.secondary} type="submit">Logout</button></form><Link className={styles.button} href="/admin/projects-guided/new">Add project</Link></div>
    {success && Object.hasOwn(successes, success) && <p role="status" className={styles.success}>{successes[success]}</p>}
    {errorCode && Object.hasOwn(errors, errorCode) && <p role="alert" className={styles.error}>{errors[errorCode]}</p>}
    {settingsResult.data ? <form action={saveProjectGuidedCounts} className={styles.counterForm}>
      <input type="hidden" name="updated_at" value={settingsResult.data.updated_at} />
      <label className={styles.field} htmlFor="ug_project_count">UG project count<input id="ug_project_count" name="ug_project_count" type="number" min="0" max="2147483647" defaultValue={settingsResult.data.ug_project_count} required /></label>
      <label className={styles.field} htmlFor="pg_project_count">PG project count<input id="pg_project_count" name="pg_project_count" type="number" min="0" max="2147483647" defaultValue={settingsResult.data.pg_project_count} required /></label>
      <button className={styles.button} type="submit">Update counts</button>
    </form> : <p className={styles.note}>Project count settings are not available until their database migration is applied.</p>}
    <p className={styles.note}>These independent totals include ongoing projects. They do not create or imply detailed project records.</p>
    <p className={styles.note}>No project records are preloaded. Enter only details supported by authoritative records.</p>
    <div className={styles.list}>{records.map((project, index) => <article className={styles.record} key={project.id}>
      <div className={styles.badges}><span>#{String(project.display_order).padStart(2, "0")}</span>{project.project_level && <span>{project.project_level}</span>}</div>
      <h2>{project.project_title}</h2>
      {[project.degree_program, project.branch, project.academic_year, project.batch,
        project.student_names?.length ? `Students: ${project.student_names.join(", ")}` : null,
        project.guide_name ? `Guide: ${project.guide_name}` : null,
        project.co_guide_names?.length ? `Co-guides: ${project.co_guide_names.join(", ")}` : null]
        .filter(Boolean).map((detail, detailIndex) => <p key={`${detailIndex}-${detail}`}>{detail}</p>)}
      {project.proof_url && <p><a href={project.proof_url} target="_blank" rel="noopener noreferrer">Proof ↗</a></p>}
      <div className={styles.controls}><Link className={styles.secondary} href={`/admin/projects-guided/${project.id}/edit`}>Edit</Link>
        <Link className={styles.danger} href={`/admin/projects-guided/${project.id}/delete`}>Delete</Link>
        <form action={moveProjectGuided} className={styles.reorder} aria-label={`Reorder project: ${project.project_title}`}>
          <input type="hidden" name="id" value={project.id} /><input type="hidden" name="order" value={order} />
          <button className={styles.secondary} name="direction" value="up" disabled={index === 0} aria-label="Move up">↑</button>
          <button className={styles.secondary} name="direction" value="down" disabled={index === records.length - 1} aria-label="Move down">↓</button>
          <label htmlFor={`project-position-${project.id}`}>Position</label><input id={`project-position-${project.id}`} name="position" type="number" min="1" max={records.length} defaultValue={index + 1} required />
          <button className={styles.secondary} type="submit">Move</button>
        </form>
      </div>
    </article>)}{records.length === 0 && <p>No guided projects have been added yet.</p>}</div>
  </section></main>;
}
