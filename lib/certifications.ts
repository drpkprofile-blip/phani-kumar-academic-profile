import "server-only";

import { certifications as referenceCertifications, type Certification } from "../data/certifications";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type CertificationRow = Database["public"]["Tables"]["certifications"]["Row"];
export type PublicCertification = Certification & { year?: number };

export function mapCertification(row: CertificationRow): PublicCertification {
  return {
    number: row.display_order,
    title: row.title,
    year: row.year ?? undefined,
    certificateUrl: row.certificate_url ?? undefined,
    fdpUrl: row.fdp_url ?? undefined,
  };
}

export async function getPublicCertifications(): Promise<PublicCertification[]> {
  // Keep builds and tests usable without local Supabase configuration. Once
  // configured, database errors remain visible instead of masking stale data.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.warn("Supabase public configuration missing; using the committed Certifications reference.");
    return [...referenceCertifications];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certifications")
    .select("*")
    .order("year", { ascending: false, nullsFirst: false })
    .order("display_order", { ascending: true });

  if (error || !data) throw new Error("Unable to read public Certifications from Supabase");
  return data.map((row, index) => ({ ...mapCertification(row), number: index + 1 }));
}
