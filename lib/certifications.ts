import "server-only";

import { certifications as referenceCertifications, type Certification } from "../data/certifications";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type CertificationRow = Database["public"]["Tables"]["certifications"]["Row"];

export function mapCertification(row: CertificationRow): Certification {
  return {
    number: row.display_order,
    title: row.title,
    certificateUrl: row.certificate_url ?? undefined,
    fdpUrl: row.fdp_url ?? undefined,
  };
}

export async function getPublicCertifications(): Promise<Certification[]> {
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
    .order("display_order", { ascending: true });

  if (error || !data) throw new Error("Unable to read public Certifications from Supabase");
  return data.map(mapCertification);
}
