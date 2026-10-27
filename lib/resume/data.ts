import "server-only";

import { getPublicAchievements } from "../achievements";
import { getPublicActivities } from "../activities";
import { getPublicCertifications } from "../certifications";
import { getPublicProfessionalMemberships } from "../professional-memberships";
import { getPublicPeerReviews } from "../peer-reviews";
import { getPublicPatents } from "../patents";
import { getPublicProjectsGuided } from "../projects-guided";
import { getPublicPublications } from "../publications";
import { getPublicProfileSettings } from "../profile-settings";
import { getPublicSubjectsTaught } from "../subjects-taught";
import { educationNewestFirst } from "../../data/education";
import { experience } from "../../data/experience";
import { researchAreas } from "../../data/research";
import { buildResumeModel, type ResumeModel } from "./model";

export async function loadResumeModel(): Promise<ResumeModel> {
  const [profileSettings, publications, activityData, certifications, achievements, memberships, subjects, projects, peerReviews, patents] = await Promise.all([
    getPublicProfileSettings(),
    getPublicPublications(),
    getPublicActivities(),
    getPublicCertifications(),
    getPublicAchievements(),
    getPublicProfessionalMemberships(),
    getPublicSubjectsTaught(),
    getPublicProjectsGuided(),
    getPublicPeerReviews(),
    getPublicPatents(),
  ]);
  const profile = profileSettings.profile;
  return buildResumeModel({
    profile,
    experienceCounterText: profileSettings.experienceCounterText,
    education: educationNewestFirst,
    experience,
    researchAreas,
    publications: publications.publications,
    patents,
    activities: activityData.activities,
    certifications,
    achievements,
    memberships,
    subjects,
    projects,
    guidedProjectCounts: { ug: 14, pg: 4 },
    peerReviews: peerReviews.peerReviews.map((review) =>
      `${review.journalName} (${review.reviewDate})`),
    peerReviewCounterText: peerReviews.heroCounterText,
    completedReviewsCount: peerReviews.completedReviewsCount,
    peerReviewManuscriptsCount: peerReviews.manuscriptsCount,
    academicIdentity: profile.academicIdentity,
    profileLinks: profile.profileLinks,
  });
}
