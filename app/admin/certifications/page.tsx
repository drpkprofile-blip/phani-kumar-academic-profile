import Link from "next/link";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { logout } from "../actions";
import { moveCertification } from "./actions";
import styles from "../admin.module.css";

const successes: Record<string, string> = {
  added: "Certification added.", saved: "Certification saved.", deleted: "Certification deleted.", reordered: "Certification order updated.",
};
const errors: Record<string, string> = {
  stale: "The certification list changed. Reload and try again.", operation: "Unable to complete the operation. Please try again.",
  confirmation: "Deletion requires explicit confirmation.", position: "Choose a valid certification position.",
};

export default async function CertificationsManagement({ searchParams }: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { user, supabase } = await requireAdminPage();
  const { data: certifications, error } = await supabase
    .from("certifications")
    .select("*")
    .order("display_order", { ascending: true });
  if (error || !certifications) throw new Error("Unable to load Certifications management.");
  const { success, error: errorCode } = await searchParams;
  const order = JSON.stringify(certifications.map((record) => record.id));

  return (
    <main className={styles.shell}>
      <section className={`${styles.panel} ${styles.management}`} aria-labelledby="certifications-title">
        <h1 id="certifications-title">Certifications / NPTEL ({certifications.length})</h1>
        <p className={styles.email}>{user.email}</p>
        <div className={styles.toolbar}>
          <Link className={styles.secondary} href="/admin">Admin Dashboard</Link>
          <Link className={styles.secondary} href="/" prefetch={false}>Back to Public Website</Link>
          <form action={logout}><button className={styles.secondary} type="submit">Logout</button></form>
          <Link className={styles.button} href="/admin/certifications/new">Add certification</Link>
        </div>
        {success && Object.hasOwn(successes, success) && <p role="status" className={styles.success}>{successes[success]}</p>}
        {errorCode && Object.hasOwn(errors, errorCode) && <p role="alert" className={styles.error}>{errors[errorCode]}</p>}
        <div className={styles.list}>
          {certifications.map((certification, index) => (
            <article key={certification.id} className={styles.record}>
              <div className={styles.badges}><span>#{String(index + 1).padStart(2, "0")}</span><span>NPTEL</span></div>
              <h2>{certification.title}</h2>
              <p>{certification.certificate_url ? "Certificate link supplied" : "Certificate link will be updated soon"}</p>
              {certification.fdp_url && <p>FDP link supplied</p>}
              {certification.certificate_url && <p><a href={certification.certificate_url} target="_blank" rel="noopener noreferrer">Certificate ↗</a></p>}
              {certification.fdp_url && <p><a href={certification.fdp_url} target="_blank" rel="noopener noreferrer">FDP ↗</a></p>}
              <div className={styles.controls}>
                <Link className={styles.secondary} href={`/admin/certifications/${certification.id}/edit`}>Edit</Link>
                <Link className={styles.danger} href={`/admin/certifications/${certification.id}/delete`}>Delete</Link>
                <form action={moveCertification} className={styles.reorder} aria-label={`Reorder certification: ${certification.title}`}>
                  <input type="hidden" name="id" value={certification.id} />
                  <input type="hidden" name="order" value={order} />
                  <button className={styles.secondary} name="direction" value="up" disabled={index === 0} aria-label="Move up">↑</button>
                  <button className={styles.secondary} name="direction" value="down" disabled={index === certifications.length - 1} aria-label="Move down">↓</button>
                  <label htmlFor={`certification-position-${certification.id}`}>Position</label>
                  <input id={`certification-position-${certification.id}`} name="position" type="number" min="1" max={certifications.length} defaultValue={index + 1} required />
                  <button className={styles.secondary} type="submit">Move</button>
                </form>
              </div>
            </article>
          ))}
          {certifications.length === 0 && <p>No certifications yet.</p>}
        </div>
      </section>
    </main>
  );
}
