"use client";

import { useActionState } from "react";
import { savePeerReview } from "./actions";
import type { PeerReviewFormState } from "../../../lib/admin/peer-review-form";
import styles from "../admin.module.css";

export default function PeerReviewForm({ id, updatedAt, initialText = "" }: {
  id?: number;
  updatedAt?: string;
  initialText?: string;
}) {
  const [state, action, pending] = useActionState<PeerReviewFormState, FormData>(savePeerReview, {});
  const reviewText = state.values?.review_text ?? initialText;
  const invalid = !!state.errors?.review_text;
  return <form action={action} className={styles.form}>
    <input type="hidden" name="id" value={id ?? ""} />
    <input type="hidden" name="updated_at" value={updatedAt ?? ""} />
    {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
    <label className={styles.field} htmlFor="review_text">Review text (required)
      <textarea id="review_text" name="review_text" rows={7} required defaultValue={reviewText}
        aria-invalid={invalid} aria-describedby={invalid ? "review_text-error" : undefined} />
      {invalid && <span id="review_text-error" className={styles.error}>{state.errors?.review_text}</span>}
    </label>
    <p className={styles.note}>The full text is stored as entered. It is not split into separate publication fields.</p>
    <div className={styles.controls}>
      <button className={styles.button} type="submit" disabled={pending}>{pending ? "Saving…" : id ? "Save review" : "Add review"}</button>
      <a className={styles.secondary} href="/admin/peer-reviews">Cancel</a>
    </div>
  </form>;
}
