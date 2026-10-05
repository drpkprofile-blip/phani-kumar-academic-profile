import { notFound } from "next/navigation";
import { requireAdminPage } from "../../../../../lib/auth/admin-page";
import { positivePeerReviewInteger } from "../../../../../lib/admin/peer-review-form";
import PeerReviewForm from "../../peer-review-form";
import styles from "../../../admin.module.css";

export default async function EditPeerReview({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const id = positivePeerReviewInteger((await params).id);
  if (!id) notFound();
  const { data, error } = await supabase.from("peer_reviews").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load Peer Review.");
  if (!data) notFound();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}>
    <h1>Edit peer review</h1><PeerReviewForm id={data.id} updatedAt={data.updated_at} initialText={data.review_text} />
  </section></main>;
}
