import "server-only";

import { publications as referencePublications, type Publication } from "../data/publications";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type PublicationRow = Database["public"]["Tables"]["publications"]["Row"];

export function mapPublication(row: PublicationRow): Publication {
  const type = row.publication_type;
  if (type !== null && type !== "Journal Article" && type !== "Book Chapter" && type !== "Conference Proceeding") {
    throw new Error("Unsupported publication type in database");
  }
  return {
    id: row.id, status: row.publication_status ?? "Published", title: row.title, year: row.year, journal: row.journal,
    indexing: [...row.indexing], doi: row.doi ?? undefined,
    url: row.article_url ?? undefined, proof: row.proof_url ?? undefined,
    type: type ?? undefined, impactFactor: row.impact_factor ?? undefined,
  };
}

export async function getPublicPublications(): Promise<{
  publications: Publication[];
  publishedCount: number;
  acceptedCount: number;
}> {
  // Unconfigured builds/tests retain the reference site. Configured reads never
  // silently fall back: database errors must remain visible to the operator.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.warn("Supabase public configuration missing; using the committed Publications reference.");
    const fallback = [...referencePublications].sort((a, b) => Number(b.year) - Number(a.year) || a.id - b.id);
    return {
      publications: fallback,
      publishedCount: fallback.filter((publication) => (publication.status ?? "Published") === "Published").length,
      acceptedCount: fallback.filter((publication) => publication.status === "Accepted").length,
    };
  }

  const supabase = await createClient();
  const records = await supabase.from("publications").select("*")
    .order("year", { ascending: false })
    .order("display_order", { ascending: true });
  if (records.error || !records.data) throw new Error("Unable to read public Publications from Supabase");
  const publications = records.data.map(mapPublication);
  return {
    publications,
    publishedCount: publications.filter((publication) => (publication.status ?? "Published") === "Published").length,
    acceptedCount: publications.filter((publication) => publication.status === "Accepted").length,
  };
}
