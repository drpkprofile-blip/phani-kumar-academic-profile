export type PeerReviewText = string;

export function peerReviewYear(review: PeerReviewText): number {
  return Number(review.match(/\((\d{4})\)$/)?.[1] ?? 0);
}

export function parsePeerReview(review: PeerReviewText) {
  const yearMatch = review.match(/\((\d{4})\)$/);
  const year = yearMatch?.[1] ?? "";
  const citation = year ? review.replace(/\s*\(\d{4}\)$/, "") : review;
  const knownMultiCommaJournals = [
    "Proceedings of the Institution of Mechanical Engineers, Part G: Journal of Aerospace Engineering",
  ];
  const knownJournal = knownMultiCommaJournals.find((journal) => citation.endsWith(`, ${journal}`));
  const separator = knownJournal ? citation.length - knownJournal.length - 2 : citation.lastIndexOf(", ");
  return {
    publicationTitle: separator > -1 ? citation.slice(0, separator) : citation,
    journalName: separator > -1 ? citation.slice(separator + 2) : "",
    year,
  };
}

export function sortPeerReviewsByExplicitYear(reviews: PeerReviewText[]): PeerReviewText[] {
  return reviews.map((review, index) => ({
    review,
    index,
    year: peerReviewYear(review),
  })).sort((a, b) => b.year - a.year || a.index - b.index).map(({ review }) => review);
}

export function sortPeerReviewRowsByExplicitYear<T extends { review_text: string; display_order: number }>(
  reviews: readonly T[],
): T[] {
  return [...reviews].sort((a, b) =>
    peerReviewYear(b.review_text) - peerReviewYear(a.review_text)
      || a.display_order - b.display_order);
}

export function sortPublicPeerReviewRows<T extends { reviewYear: number | null; displayOrder: number }>(
  reviews: readonly T[],
): T[] {
  return [...reviews].sort((a, b) =>
    (b.reviewYear ?? 0) - (a.reviewYear ?? 0) || a.displayOrder - b.displayOrder);
}
