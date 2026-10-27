// Public-safe record shape. Manuscript titles live in the admin-only table.
export type PublicPeerReview = {
  journalName: string;
  reviewDate: string;
  displayOrder: number;
};

// Verified against the signed-in Web of Science summary: 20 review dates across 14 manuscripts.
// This fallback intentionally contains no manuscript titles.
export const peerReviews: PublicPeerReview[] = [
  { journalName: "Journal of Polymer Research", reviewDate: "2026-10-27", displayOrder: 1 },
  { journalName: "Engineering Research Express", reviewDate: "2026-10-12", displayOrder: 2 },
  { journalName: "Journal of the Brazilian Society of Mechanical Sciences and Engineering", reviewDate: "2026-09-08", displayOrder: 3 },
  { journalName: "Engineering Research Express", reviewDate: "2026-08-23", displayOrder: 4 },
  { journalName: "Engineering Research Express", reviewDate: "2026-07-24", displayOrder: 5 },
  { journalName: "Engineering Research Express", reviewDate: "2026-05-24", displayOrder: 6 },
  { journalName: "Proceedings of the Institution of Mechanical Engineers, Part G: Journal of Aerospace Engineering", reviewDate: "2026-04-27", displayOrder: 7 },
  { journalName: "Measurement Science and Technology", reviewDate: "2026-03-22", displayOrder: 8 },
  { journalName: "Measurement Science and Technology", reviewDate: "2026-02-27", displayOrder: 9 },
  { journalName: "Measurement Science and Technology", reviewDate: "2026-02-22", displayOrder: 10 },
  { journalName: "Measurement Science and Technology", reviewDate: "2026-01-12", displayOrder: 11 },
  { journalName: "Engineering Research Express", reviewDate: "2025-09-30", displayOrder: 12 },
  { journalName: "Engineering Research Express", reviewDate: "2025-08-24", displayOrder: 13 },
  { journalName: "Engineering Research Express", reviewDate: "2025-06-14", displayOrder: 14 },
  { journalName: "Engineering Research Express", reviewDate: "2025-05-27", displayOrder: 15 },
  { journalName: "Engineering Research Express", reviewDate: "2025-04-29", displayOrder: 16 },
  { journalName: "Engineering Research Express", reviewDate: "2025-04-08", displayOrder: 17 },
  { journalName: "Engineering Research Express", reviewDate: "2025-02-23", displayOrder: 18 },
  { journalName: "Physica Scripta", reviewDate: "2024-11-18", displayOrder: 19 },
  { journalName: "Physica Scripta", reviewDate: "2024-10-15", displayOrder: 20 },
];
