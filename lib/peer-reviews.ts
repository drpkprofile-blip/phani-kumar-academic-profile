import "server-only";

import { peerReviews as referencePeerReviews } from "../data/peer-reviews";
import type { PeerReview } from "../data/peer-reviews";
import { counters } from "../data/counters";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type PeerReviewRow = Database["public"]["Tables"]["peer_reviews"]["Row"];
type PeerReviewSettingsRow = Database["public"]["Tables"]["peer_review_settings"]["Row"];

export type PublicPeerReviews = {
  peerReviews: PeerReview[];
  heroCounterText: string;
  completedReviewsCount: number;
};

export function mapPeerReview(row: PeerReviewRow): PeerReview {
  return row.review_text;
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
      peerReviews: [...referencePeerReviews],
      heroCounterText: counters.heroPeerReviews,
      completedReviewsCount: counters.peerReviewCount,
    };
  }

  const supabase = await createClient();
  const [reviewsResult, settingsResult] = await Promise.all([
    supabase
      .from("peer_reviews")
      .select("*")
      .order("display_order", { ascending: true }),
    supabase
      .from("peer_review_settings")
      .select("*")
      .eq("singleton", true)
      .single(),
  ]);

  if (reviewsResult.error || !reviewsResult.data) {
    throw new Error("Unable to read public Peer Reviews from Supabase");
  }
  if (settingsResult.error || !settingsResult.data) {
    throw new Error("Unable to read Peer Review settings from Supabase");
  }

  return {
    peerReviews: reviewsResult.data.map(mapPeerReview),
    ...mapPeerReviewSettings(settingsResult.data),
  };
}
