"use client";

import { useActionState } from "react";
import { savePeerReview } from "./actions";
import type { PeerReviewFormState } from "../../../lib/admin/peer-review-form";
import styles from "../admin.module.css";

export default function PeerReviewForm({ id, updatedAt, initialTitle = "", initialJournal = "", initialDate = "" }: {
  id?: number;
  updatedAt?: string;
  initialTitle?: string;
  initialJournal?: string;
  initialDate?: string;
}) {
  const [state, action, pending] = useActionState<PeerReviewFormState, FormData>(savePeerReview, {});
  const title = state.values?.publication_title ?? initialTitle;
  const journal = state.values?.journal_name ?? initialJournal;
  const date = state.values?.review_date ?? initialDate;
  return <form action={action} className={styles.form}>
    <input type="hidden" name="id" value={id ?? ""} />
    <input type="hidden" name="updated_at" value={updatedAt ?? ""} />
    {state.message && <p role="alert" className={styles.error}>{state.message}</p>}
    <label className={styles.field} htmlFor="publication_title">Manuscript title (admin only)
      <textarea id="publication_title" name="publication_title" rows={3} required defaultValue={title}
        aria-invalid={!!state.errors?.publication_title}
        aria-describedby={state.errors?.publication_title ? "publication_title-error" : undefined} />
      {state.errors?.publication_title && <span id="publication_title-error" className={styles.error}>{state.errors.publication_title}</span>}
    </label>
    <label className={styles.field} htmlFor="journal_name">Journal name
      <input id="journal_name" name="journal_name" required defaultValue={journal}
        aria-invalid={!!state.errors?.journal_name}
        aria-describedby={state.errors?.journal_name ? "journal_name-error" : undefined} />
      {state.errors?.journal_name && <span id="journal_name-error" className={styles.error}>{state.errors.journal_name}</span>}
    </label>
    <label className={styles.field} htmlFor="review_date">Date reviewed
      <input id="review_date" name="review_date" type="date" required defaultValue={date}
        aria-invalid={!!state.errors?.review_date}
        aria-describedby={state.errors?.review_date ? "review_date-error" : undefined} />
      {state.errors?.review_date && <span id="review_date-error" className={styles.error}>{state.errors.review_date}</span>}
    </label>
    <p className={styles.note}>Only the journal and review date appear publicly. The manuscript title is stored in a separate admin-only table.</p>
    <div className={styles.controls}>
      <button className={styles.button} type="submit" disabled={pending}>{pending ? "Saving…" : id ? "Save review" : "Add review"}</button>
      <a className={styles.secondary} href="/admin/peer-reviews">Cancel</a>
    </div>
  </form>;
}
