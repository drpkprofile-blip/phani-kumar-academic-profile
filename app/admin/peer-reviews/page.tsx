import Link from "next/link";
import { requireAdminPage } from "../../../lib/auth/admin-page";
import { logout } from "../actions";
import { updatePeerReviewSettings } from "./actions";
import styles from "../admin.module.css";
import { sortPeerReviewRowsNewestFirst } from "../../../lib/peer-review-text";

const successes: Record<string, string> = {
  added: "Peer review added.", saved: "Peer review saved.", deleted: "Peer review deleted.",
  settings: "Peer Review counters updated.",
};
const errors: Record<string, string> = {
  stale: "The data changed. Reload and try again.", operation: "Unable to complete the operation. Please try again.",
  confirmation: "Deletion requires explicit confirmation.",
  counter: "Enter a non-empty hero counter and non-negative whole-number review and manuscript counts.",
};

export default async function PeerReviewsAdmin({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { user, supabase } = await requireAdminPage();
  const [reviewsResult, titlesResult, settingsResult] = await Promise.all([
    supabase.from("peer_reviews").select("id,journal_name,review_date,display_order,updated_at").order("review_date", { ascending: false }),
    supabase.from("peer_review_titles").select("review_id,publication_title"),
    supabase.from("peer_review_settings").select("*").eq("singleton", true).single(),
  ]);
  if (reviewsResult.error || !reviewsResult.data || titlesResult.error || !titlesResult.data || settingsResult.error || !settingsResult.data) {
    throw new Error("Unable to load Peer Reviews management.");
  }
  const titles = new Map(titlesResult.data.map((row) => [row.review_id, row.publication_title]));
  const reviews = sortPeerReviewRowsNewestFirst(reviewsResult.data);
  const { success, error } = await searchParams;
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.management}`} aria-labelledby="peer-reviews-admin-title">
    <h1 id="peer-reviews-admin-title">Peer Reviews ({reviews.length}) · Manuscripts ({settingsResult.data.manuscripts_count})</h1>
    <p className={styles.email}>{user.email}</p>
    <div className={styles.toolbar}>
      <Link className={styles.secondary} href="/admin">Admin Dashboard</Link>
      <Link className={styles.secondary} href="/" prefetch={false}>Back to Public Website</Link>
      <form action={logout}><button className={styles.secondary} type="submit">Logout</button></form>
      <Link className={styles.button} href="/admin/peer-reviews/new">Add review</Link>
    </div>
    {success && Object.hasOwn(successes, success) && <p role="status" className={styles.success}>{successes[success]}</p>}
    {error && Object.hasOwn(errors, error) && <p role="alert" className={styles.error}>{errors[error]}</p>}

    <section className={styles.module} aria-labelledby="peer-review-settings-title">
      <h2 id="peer-review-settings-title">Independent Peer Review counters</h2>
      <p className={styles.note}>These values are independent of the number of review records.</p>
      <form action={updatePeerReviewSettings} className={styles.counterForm}>
        <input type="hidden" name="updated_at" value={settingsResult.data.updated_at} />
        <label className={styles.field} htmlFor="hero_counter_text">Hero counter text
          <input id="hero_counter_text" name="hero_counter_text" defaultValue={settingsResult.data.hero_counter_text} maxLength={64} required />
        </label>
        <label className={styles.field} htmlFor="completed_reviews_count">Completed reviews count
          <input id="completed_reviews_count" name="completed_reviews_count" type="number" min="0" step="1" defaultValue={settingsResult.data.completed_reviews_count} required />
        </label>
        <label className={styles.field} htmlFor="manuscripts_count">Distinct manuscripts count
          <input id="manuscripts_count" name="manuscripts_count" type="number" min="0" step="1" defaultValue={settingsResult.data.manuscripts_count} required />
        </label>
        <button className={styles.button} type="submit">Update counters</button>
      </form>
    </section>

    <div className={styles.toolbar}><h2>Review records</h2></div>
    <p className={styles.note}>Sorted by exact review date, newest first. Manuscript titles are shown to you here only.</p>
    <div className={styles.list}>
      {reviews.map((review, index) => {
        return <article className={styles.record} key={review.id}>
        <div className={styles.badges}><span>#{String(index + 1).padStart(2, "0")}</span></div>
        <p className={styles.reviewText}><strong>Manuscript title:</strong> {titles.get(review.id) || "Title not entered"}</p>
        <p className={styles.reviewText}><strong>Journal:</strong> {review.journal_name}</p>
        <p className={styles.reviewText}><strong>Date reviewed:</strong> {review.review_date}</p>
        <div className={styles.controls}>
          <Link className={styles.secondary} href={`/admin/peer-reviews/${review.id}/edit`}>Edit</Link>
          <Link className={styles.danger} href={`/admin/peer-reviews/${review.id}/delete`}>Delete</Link>
        </div>
      </article>;
      })}
      {reviews.length === 0 && <p>No peer reviews have been added yet.</p>}
    </div>
  </section></main>;
}
