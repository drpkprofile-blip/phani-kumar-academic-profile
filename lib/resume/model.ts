import type { Achievement } from "../../data/achievements";
import type { AcademicIdentity, ProfileLink } from "../../data/profile";
import type { Education } from "../../data/education";
import type { Experience } from "../../data/experience";
import type { ResearchArea } from "../../data/research";
import type { Publication } from "../../data/publications";
import type { AcademicActivity } from "../../data/activities";
import type { PublicCertification } from "../certifications";
import type { ProfessionalMembership } from "../../data/professional-memberships";
import type { PublicSubjectTaught } from "../subjects-taught";
import type { PublicGuidedProject } from "../projects-guided";
import type { ManagedProfile } from "../profile-settings";
import type { Patent } from "../../data/patents";

export type ResumeModel = {
  profile: ManagedProfile;
  experienceCounterText: string;
  education: Education[];
  experience: Experience[];
  researchAreas: ResearchArea[];
  publications: Publication[];
  patents: Patent[];
  activities: AcademicActivity[];
  certifications: PublicCertification[];
  achievements: Achievement[];
  memberships: Array<ProfessionalMembership & { displayOrder: number }>;
  subjects: PublicSubjectTaught[];
  projects: PublicGuidedProject[];
  guidedProjectCounts?: { ug: number; pg: number };
  peerReviews: string[];
  peerReviewCounterText: string;
  completedReviewsCount: number;
  academicIdentity: AcademicIdentity[];
  profileLinks: ProfileLink[];
};

export function buildResumeModel(input: ResumeModel): ResumeModel {
  // Copy arrays so PDF generation can never mutate the page's shared data.
  return {
    ...input,
    education: [...input.education],
    experience: [...input.experience],
    researchAreas: [...input.researchAreas],
    publications: [...input.publications],
    patents: [...input.patents],
    activities: [...input.activities],
    certifications: [...input.certifications],
    achievements: [...input.achievements],
    memberships: [...input.memberships],
    subjects: [...input.subjects],
    projects: [...input.projects],
    guidedProjectCounts: input.guidedProjectCounts ? { ...input.guidedProjectCounts } : undefined,
    peerReviews: [...input.peerReviews],
    academicIdentity: [...input.academicIdentity],
    profileLinks: [...input.profileLinks],
  };
}
