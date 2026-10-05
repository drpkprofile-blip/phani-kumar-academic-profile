import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import { positivePeerReviewInteger } from "../../../../../lib/admin/peer-review-form";
import { deletePeerReview } from "../../actions";
import styles from "../../../admin.module.css";

export default async function DeletePeerReview({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const id = positivePeerReviewInteger((await params).id);
  if (!id) notFound();
  const { data, error } = await supabase.from("peer_reviews").select("id,review_text,updated_at").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load Peer Review.");
  if (!data) notFound();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}>
    <h1>Delete peer review?</h1><p className={styles.reviewText}>{data.review_text}</p>
    <p className={styles.note}>Deleting a review will resequence the remaining display positions. The independent counters will not change.</p>
    <form action={deletePeerReview} className={styles.form}>
      <input type="hidden" name="id" value={data.id} /><input type="hidden" name="updated_at" value={data.updated_at} />
      <label className={styles.field}><span><input type="checkbox" name="confirmed" value="yes" required /> Confirm deletion</span></label>
      <div className={styles.controls}><button className={styles.danger} type="submit">Delete review</button>
        <Link className={styles.secondary} href="/admin/peer-reviews">Cancel</Link></div>
    </form>
  </section></main>;
}
