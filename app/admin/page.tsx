import { requireAdminPage } from "../../lib/auth/admin-page";
import { logout } from "./actions";
import styles from "./admin.module.css";
import { movePublication, updateHeroCounter } from "./publications/actions";
import Link from "next/link";
import { profile as referenceProfile } from "../../data/profile";

const successMessages: Record<string, string> = {
  added: "Publication added.", saved: "Publication saved.", deleted: "Publication deleted.",
  reordered: "Publication order updated.", counter: "Hero publication counter updated.",
};
const errorMessages: Record<string, string> = {
  stale: "The data changed. Review the current list before trying again.",
  operation: "Unable to complete the operation. Please try again.",
  confirmation: "Deletion requires explicit confirmation. Please try again.",
  position: "Choose a valid publication position.", counter: "Enter a non-empty counter of up to 64 characters.",
};

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { user, supabase } = await requireAdminPage();
  const [records, settings] = await Promise.all([
    supabase.from("publications").select("*").order("display_order", { ascending: true }),
    supabase.from("publication_settings").select("hero_publications").eq("id", true).single(),
  ]);
  if (records.error || !records.data || settings.error || !settings.data) throw new Error("Unable to load Publications management.");
  const { data: profileData, error: profileError } = await supabase.from("profile_settings").select("profile_links").eq("singleton", true).single();
  if (profileError && profileError.code !== "PGRST205") throw new Error("Unable to load profile links.");
  const { success, error } = await searchParams;
  const successMessage = success && Object.hasOwn(successMessages, success) ? successMessages[success] : undefined;
  const errorMessage = error && Object.hasOwn(errorMessages, error) ? errorMessages[error] : undefined;
  const publications = records.data;
  const order = JSON.stringify(publications.map((p) => p.id));
  const profileLinks = profileData && Array.isArray(profileData.profile_links)
    ? profileData.profile_links as Array<{ label?: string; href?: string }>
    : [...referenceProfile.profileLinks];
  const scholar = profileLinks.find((link) => link.label === "Google Scholar");
  return (
    <main className={styles.shell}>
      <section className={`${styles.panel} ${styles.management}`} aria-labelledby="admin-dashboard-title">
        <h1 id="admin-dashboard-title">Admin Dashboard</h1>
        <p className={styles.email}>{user.email}</p>
        <div className={styles.toolbar}>
          <Link className={styles.secondary} href="/" prefetch={false}>View public website</Link>
          {scholar?.href && <a className={styles.secondary} href={scholar.href} target="_blank" rel="noopener noreferrer">Google Scholar reference ↗</a>}
          <form action={logout}><button className={styles.secondary} type="submit">Logout</button></form>
        </div>
        <section className={styles.module} aria-label="Profile settings management">
          <h2>Profile, Photo &amp; Links</h2><p>Manage public profile information, research links, contact details and the experience counter.</p>
          <Link className={styles.button} href="/admin/profile">Manage Profile</Link>
        </section>
        {successMessage && <p role="status" className={styles.success}>{successMessage}</p>}
        {errorMessage && <p role="alert" className={styles.error}>{errorMessage}</p>}
        <section className={styles.module} aria-label="Activities management">
          <h2>Activities</h2><p>Manage FDPs, workshops, conferences and other academic activities.</p>
          <Link className={styles.button} href="/admin/activities">Manage Activities</Link>
        </section>
        <section className={styles.module} aria-label="Certifications management">
          <h2>Certifications / NPTEL</h2><p>Manage NPTEL certificate and FDP links.</p>
          <Link className={styles.button} href="/admin/certifications">Manage Certifications</Link>
        </section>
        <section className={styles.module} aria-label="Achievements management">
          <h2>Achievements / Awards</h2><p>Manage achievement descriptions and proof links.</p>
          <Link className={styles.button} href="/admin/achievements">Manage Achievements</Link>
        </section>
        <section className={styles.module} aria-label="Professional Bodies management">
          <h2>Professional Bodies / Memberships</h2><p>Manage professional society membership details and proof links.</p>
          <Link className={styles.button} href="/admin/professional-memberships">Manage Professional Bodies</Link>
        </section>
        <section className={styles.module} aria-label="Subjects Taught management">
          <h2>Subjects Taught</h2><p>Manage subjects and optional programme details.</p>
          <Link className={styles.button} href="/admin/subjects-taught">Manage Subjects Taught</Link>
        </section>
        <section className={styles.module} aria-label="Projects Guided management">
          <h2>Projects Guided</h2><p>Manage guided UG and PG project records and supporting proof links.</p>
          <Link className={styles.button} href="/admin/projects-guided">Manage Projects Guided</Link>
        </section>
        <section className={styles.module} aria-label="Peer Reviews management">
          <h2>Peer Reviews</h2><p>Manage review text, display order, and the independent review counters.</p>
          <Link className={styles.button} href="/admin/peer-reviews">Manage Peer Reviews</Link>
        </section>
        <form action={updateHeroCounter} className={styles.counterForm}>
          <input type="hidden" name="previous_counter" value={settings.data.hero_publications} />
          <label className={styles.field} htmlFor="hero_publications">Independent hero Publications counter
            <input id="hero_publications" name="hero_publications" defaultValue={settings.data.hero_publications} maxLength={64} required />
          </label>
          <button className={styles.button} type="submit">Update counter</button>
        </form>
        <p className={styles.note}>The hero counter is independent of the number of listed publications. Use Google Scholar only as a manual reference.</p>
        <div className={styles.toolbar}>
          <h2>Publications ({publications.length})</h2>
          <a className={styles.button} href="/admin/publications/new">Add publication</a>
        </div>
        <div className={styles.list}>
          {publications.map((publication, index) => (
            <article key={publication.id} className={styles.record}>
              <div className={styles.badges}>
                <span>#{index + 1}</span><span>{publication.year}</span>
                {publication.indexing.map((badge, i) => <span key={i}>{badge}</span>)}
                {publication.impact_factor !== null && <span>IF: {publication.impact_factor}</span>}
              </div>
              <h3>{publication.title}</h3>
              <details><summary>Publication details</summary>
                <p>{publication.journal}</p>
                {publication.publication_type && <p>{publication.publication_type}</p>}
                {publication.doi && <p>DOI: {publication.doi}</p>}
                {publication.article_url && <p><a href={publication.article_url} target="_blank" rel="noopener noreferrer">Article ↗</a></p>}
                {publication.proof_url ? <p><a href={publication.proof_url} target="_blank" rel="noopener noreferrer">PDF / Proof ↗</a></p> : <p>PDF Proof will be updated soon</p>}
              </details>
              <div className={styles.controls}>
                <a className={styles.secondary} href={`/admin/publications/${publication.id}/edit`}>Edit</a>
                <a className={styles.danger} href={`/admin/publications/${publication.id}/delete`}>Delete</a>
                <form action={movePublication} className={styles.reorder} aria-label={`Reorder publication: ${publication.title}`}>
                  <input type="hidden" name="id" value={publication.id} />
                  <input type="hidden" name="order" value={order} />
                  <button className={styles.secondary} name="direction" value="up" disabled={index === 0} aria-label="Move up">↑</button>
                  <button className={styles.secondary} name="direction" value="down" disabled={index === publications.length - 1} aria-label="Move down">↓</button>
                  <label htmlFor={`position-${publication.id}`}>Position</label>
                  <input id={`position-${publication.id}`} name="position" type="number" min="1" max={publications.length} defaultValue={index + 1} required />
                  <button className={styles.secondary} type="submit">Move</button>
                </form>
              </div>
            </article>
          ))}
          {publications.length === 0 && <p>No publications yet.</p>}
        </div>
      </section>
    </main>
  );
}
