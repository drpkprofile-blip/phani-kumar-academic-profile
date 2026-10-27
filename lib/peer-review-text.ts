export type PeerReviewDateRow = { review_date: string; display_order: number };
export type PublicPeerReviewDateRow = { reviewDate: string; displayOrder: number };

export function sortPeerReviewRowsNewestFirst<T extends PeerReviewDateRow>(reviews: readonly T[]): T[] {
  return [...reviews].sort((a, b) =>
    b.review_date.localeCompare(a.review_date) || a.display_order - b.display_order);
}

export function sortPublicPeerReviewRowsNewestFirst<T extends PublicPeerReviewDateRow>(reviews: readonly T[]): T[] {
  return [...reviews].sort((a, b) =>
    b.reviewDate.localeCompare(a.reviewDate) || a.displayOrder - b.displayOrder);
}
