import "server-only";

import { publications as referencePublications, type Publication } from "../data/publications";
import { counters } from "../data/counters";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type PublicationRow = Database["public"]["Tables"]["publications"]["Row"];

export function mapPublication(row: PublicationRow): Publication {
  const type = row.publication_type;
  if (type !== null && type !== "Journal Article" && type !== "Book Chapter" && type !== "Conference Proceeding") {
    throw new Error("Unsupported publication type in database");
  }
  return {
    id: row.id, title: row.title, year: row.year, journal: row.journal,
    indexing: [...row.indexing], doi: row.doi ?? undefined,
    url: row.article_url ?? undefined, proof: row.proof_url ?? undefined,
    type: type ?? undefined, impactFactor: row.impact_factor ?? undefined,
  };
}

export async function getPublicPublications(): Promise<{
  publications: Publication[];
  heroPublications: string;
}> {
  // Unconfigured builds/tests retain the reference site. Configured reads never
  // silently fall back: database errors must remain visible to the operator.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.warn("Supabase public configuration missing; using the committed Publications reference.");
    return {
      publications: [...referencePublications].sort((a, b) => Number(b.year) - Number(a.year) || a.id - b.id),
      heroPublications: counters.heroPublications,
    };
  }

  const supabase = await createClient();
  const [records, settings] = await Promise.all([
    supabase.from("publications").select("*").order("display_order", { ascending: true }),
    supabase.from("publication_settings").select("hero_publications").eq("id", true).single(),
  ]);
  if (records.error || !records.data) throw new Error("Unable to read public Publications from Supabase");
  if (settings.error || !settings.data) throw new Error("Unable to read the independent publication counter from Supabase");
  return { publications: records.data.map(mapPublication), heroPublications: settings.data.hero_publications };
}
