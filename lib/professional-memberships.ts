import "server-only";

import { professionalMemberships as referenceMemberships, type ProfessionalMembership } from "../data/professional-memberships";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type MembershipRow = Database["public"]["Tables"]["professional_memberships"]["Row"];

export function mapProfessionalMembership(row: MembershipRow): ProfessionalMembership & { displayOrder: number } {
  return {
    displayOrder: row.display_order,
    organizationName: row.organization_name,
    membershipType: row.membership_type ?? undefined,
    membershipNumber: row.membership_number ?? undefined,
    dateText: row.date_text ?? undefined,
    validityText: row.validity_text ?? undefined,
    designation: row.designation ?? undefined,
    chapter: row.chapter ?? undefined,
    proofUrl: row.proof_url ?? undefined,
  };
}

export async function getPublicProfessionalMemberships(): Promise<Array<ProfessionalMembership & { displayOrder: number }>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.warn("Supabase public configuration missing; using the supplied Professional Bodies reference.");
    return referenceMemberships.map((membership, index) => ({ ...membership, displayOrder: index + 1 }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("professional_memberships").select("*").order("display_order", { ascending: true });
  if (error || !data) throw new Error("Unable to read public Professional Bodies from Supabase");
  return data.map(mapProfessionalMembership);
}
