import Link from "next/link";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { logout } from "../actions";
import styles from "../admin.module.css";

const successes: Record<string, string> = { added: "Patent added.", saved: "Patent saved.", deleted: "Patent deleted." };
const errors: Record<string, string> = {
  stale: "The patent changed. Reload and try again.",
  operation: "Unable to complete the operation. Please try again.",
  confirmation: "Deletion requires explicit confirmation.",
};

export default async function PatentsManagement({ searchParams }: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { user, supabase } = await requireAdminPage();
  const { data: patents, error } = await supabase.from("patents").select("*")
    .order("filing_date", { ascending: false }).order("publication_date", { ascending: false });
  if (error || !patents) throw new Error("Unable to load Patents management.");
  const { success, error: errorCode } = await searchParams;

  return (
    <main className={styles.shell}>
      <section className={`${styles.panel} ${styles.management}`} aria-labelledby="patents-title">
        <h1 id="patents-title">Patents ({patents.length})</h1>
        <p className={styles.email}>{user.email}</p>
        <div className={styles.toolbar}>
          <Link className={styles.secondary} href="/admin">Admin Dashboard</Link>
          <Link className={styles.secondary} href="/" prefetch={false}>Back to Public Website</Link>
          <form action={logout}><button className={styles.secondary} type="submit">Logout</button></form>
          <Link className={styles.button} href="/admin/patents/new">Add patent</Link>
        </div>
        {success && Object.hasOwn(successes, success) && <p role="status" className={styles.success}>{successes[success]}</p>}
        {errorCode && Object.hasOwn(errors, errorCode) && <p role="alert" className={styles.error}>{errors[errorCode]}</p>}
        <div className={styles.list}>
          {patents.map((patent) => (
            <article key={patent.id} className={styles.record}>
              <div className={styles.badges}><span>{patent.application_number}</span><span>Journal No. {patent.journal_number}</span><span>Page No. {patent.page_number}</span></div>
              <h2>{patent.title}</h2>
              <p>Filing date: {patent.filing_date}</p>
              <p>Publication date: {patent.publication_date}</p>
              {patent.proof_url
                ? <p><a href={patent.proof_url} target="_blank" rel="noopener noreferrer">Patent proof ↗</a></p>
                : <p className={styles.note}>Proof link will be added when available.</p>}
              <div className={styles.controls}>
                <Link className={styles.secondary} href={`/admin/patents/${patent.id}/edit`}>Edit</Link>
                <Link className={styles.danger} href={`/admin/patents/${patent.id}/delete`}>Delete</Link>
              </div>
            </article>
          ))}
          {patents.length === 0 && <p>No patents yet.</p>}
        </div>
      </section>
    </main>
  );
}
