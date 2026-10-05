export type ProfessionalMembership = {
  organizationName: string;
  membershipType?: string;
  membershipNumber?: string;
  dateText?: string;
  validityText?: string;
  designation?: string;
  chapter?: string;
  proofUrl?: string;
};

// The single supplied record, split only into the organization and type fields.
export const professionalMemberships: ProfessionalMembership[] = [
  {
    organizationName: "Condition Monitoring Society of India (MCMSI)",
    membershipType: "Member",
  },
];
