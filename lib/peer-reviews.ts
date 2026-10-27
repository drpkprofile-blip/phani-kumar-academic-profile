import "server-only";

import { peerReviews as referencePeerReviews } from "../data/peer-reviews";
import type { PublicPeerReview } from "../data/peer-reviews";
import { counters } from "../data/counters";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";
import { parsePeerReview, sortPeerReviewsByExplicitYear, sortPublicPeerReviewRows } from "./peer-review-text";
export { parsePeerReview, peerReviewYear, sortPeerReviewRowsByExplicitYear, sortPeerReviewsByExplicitYear, sortPublicPeerReviewRows } from "./peer-review-text";

type PublicPeerReviewRow = Database["public"]["Views"]["peer_reviews_public"]["Row"];
type PeerReviewSettingsRow = Database["public"]["Tables"]["peer_review_settings"]["Row"];

export type PublicPeerReviews = {
  peerReviews: PublicPeerReview[];
  heroCounterText: string;
  completedReviewsCount: number;
};

export function mapPeerReview(row: PublicPeerReviewRow): PublicPeerReview {
  return { journalName: row.journal_name, reviewYear: row.review_year, displayOrder: row.display_order };
}

function publicReferencePeerReviews(): PublicPeerReview[] {
  return sortPeerReviewsByExplicitYear([...referencePeerReviews]).map((review, index) => {
    const { journalName, year } = parsePeerReview(review);
    return { journalName, reviewYear: year ? Number(year) : null, displayOrder: index + 1 };
  });
}

export function mapPeerReviewSettings(row: PeerReviewSettingsRow) {
  return {
    heroCounterText: row.hero_counter_text,
    completedReviewsCount: row.completed_reviews_count,
  };
}

export async function getPublicPeerReviews(): Promise<PublicPeerReviews> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.warn("Supabase public configuration missing; using the committed Peer Reviews reference.");
    return {
      peerReviews: publicReferencePeerReviews(),
      heroCounterText: counters.heroPeerReviews,
      completedReviewsCount: counters.peerReviewCount,
    };
  }

  const supabase = await createClient();
  const [reviewsResult, settingsResult] = await Promise.all([
    supabase
      .from("peer_reviews_public")
      .select("id,display_order,journal_name,review_year")
      .order("review_year", { ascending: false, nullsFirst: false })
      .order("display_order", { ascending: true }),
    supabase
      .from("peer_review_settings")
      .select("*")
      .eq("singleton", true)
      .single(),
  ]);

  if (settingsResult.error || !settingsResult.data) {
    throw new Error("Unable to read Peer Review settings from Supabase");
  }
  if (reviewsResult.error || !reviewsResult.data) {
    console.warn("Sanitized Peer Review view is not available; using the safe public reference list.");
    return {
      peerReviews: publicReferencePeerReviews(),
      ...mapPeerReviewSettings(settingsResult.data),
    };
  }

  return {
    peerReviews: sortPublicPeerReviewRows(reviewsResult.data.map(mapPeerReview)),
    ...mapPeerReviewSettings(settingsResult.data),
  };
}
