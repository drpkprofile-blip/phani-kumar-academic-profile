export type PeerReviewFormState = {
  message?: string;
  errors?: { publication_title?: string; journal_name?: string; review_date?: string };
  values?: { publication_title: string; journal_name: string; review_date: string };
};

export function parsePeerReviewForm(form: FormData) {
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  const publicationTitle = field("publication_title");
  const journalName = field("journal_name");
  const reviewDate = field("review_date");
  const errors: PeerReviewFormState["errors"] = {};
  if (!publicationTitle) errors.publication_title = "Enter the manuscript title. It is visible to admins only.";
  if (!journalName) errors.journal_name = "Enter the journal name.";
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(reviewDate) ? new Date(`${reviewDate}T00:00:00Z`) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== reviewDate) {
    errors.review_date = "Enter the exact review date.";
  }
  const values = { publication_title: publicationTitle, journal_name: journalName, review_date: reviewDate };
  return { values, errors, data: values };
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
