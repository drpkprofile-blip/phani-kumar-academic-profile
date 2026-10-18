import Link from "next/link";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import styles from "../admin.module.css";

export default async function AdminResumePage() {
  const { user } = await requireAdminPage();

  return (
    <main className={styles.shell}>
      <section className={`${styles.panel} ${styles.resumePanel}`} aria-labelledby="resume-title">
        <p className={styles.resumeEyebrow}>PRIVATE ADMIN TOOL</p>
        <h1 id="resume-title">Recruiter-ready Academic CV</h1>
        <p className={styles.email}>{user.email}</p>
        <p className={styles.note}>
          Generate a recruiter-ready CV in PDF or editable Word format. It includes all publications, academic
          activities, achievements, experience, NPTEL courses, subjects taught, the approved profile photograph,
          Scholar metrics, and the citation figure. Guided projects are summarized by UG and PG counts.
        </p>
        <div className={styles.resumeActions}>
          <a className={styles.button} href="/admin/resume/download">Download Academic CV (PDF)</a>
          <a className={styles.secondary} href="/admin/resume/download/word">Download editable Word (DOCX)</a>
          <Link className={styles.secondary} href="/admin">Back to Admin</Link>
        </div>
        <p className={styles.resumePrivacy}>This download is available only to an authenticated, allowlisted administrator.</p>
      </section>
    </main>
  );
}
