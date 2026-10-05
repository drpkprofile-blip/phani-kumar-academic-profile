import { requireAdminPage } from "../../../../lib/auth/admin-page";
import PeerReviewForm from "../peer-review-form";
import styles from "../../admin.module.css";

export default async function NewPeerReview() {
  await requireAdminPage();
  return <main className={styles.shell}><section className={`${styles.panel} ${styles.editor}`}>
    <h1>Add peer review</h1><PeerReviewForm />
  </section></main>;
}
