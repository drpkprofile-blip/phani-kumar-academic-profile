import { publications } from "./publications";
import { activities } from "./activities";
import { certifications } from "./certifications";

export type ProfileCounters = {
  heroPublications: string;
  heroPeerReviews: string;
  experienceYears: string;
  peerReviewCount: number;
};

// These supplied display totals are independent of the listed record counts.
export const counters: ProfileCounters = {
  heroPublications: "40+",
  heroPeerReviews: "16+",
  experienceYears: "20+",
  peerReviewCount: 16,
};

export const recordCounts = {
  publications: publications.length,
  activities: activities.length,
  certifications: certifications.length,
} satisfies Record<string, number>;
