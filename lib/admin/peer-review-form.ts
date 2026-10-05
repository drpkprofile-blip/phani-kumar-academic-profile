export type PeerReviewFormState = {
  message?: string;
  errors?: { review_text?: string };
  values?: { review_text: string };
};

export function parsePeerReviewForm(form: FormData) {
  const raw = form.get("review_text");
  const reviewText = typeof raw === "string" ? raw : "";
  const errors: PeerReviewFormState["errors"] = {};
  if (!reviewText.trim()) errors.review_text = "Enter nonblank review text.";
  return { values: { review_text: reviewText }, errors, data: { review_text: reviewText } };
}

export function positivePeerReviewInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= 2147483647 ? number : null;
}

export function nonNegativeReviewCount(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^(0|[1-9]\d*)$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= 2147483647 ? number : null;
}
