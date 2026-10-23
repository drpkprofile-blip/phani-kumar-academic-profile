import "server-only";

import { patents as referencePatents, type Patent } from "../data/patents";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type PatentRow = Database["public"]["Tables"]["patents"]["Row"];

export function mapPatent(row: PatentRow): Patent {
  return {
    id: row.id,
    applicationNumber: row.application_number,
    filingDate: row.filing_date,
    publicationDate: row.publication_date,
    title: row.title,
    journalNumber: row.journal_number,
    pageNumber: row.page_number,
    proofUrl: row.proof_url ?? undefined,
  };
}

export async function getPublicPatents(): Promise<Patent[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.warn("Supabase public configuration missing; using the committed Patents reference.");
    return [...referencePatents];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patents")
    .select("*")
    .order("filing_date", { ascending: false })
    .order("publication_date", { ascending: false });

  if (error?.code === "PGRST205" || error?.code === "42P01") {
    console.warn("Patents migration is not applied yet; showing the committed Patents reference.");
    return [...referencePatents];
  }
  if (error || !data) throw new Error("Unable to read public Patents from Supabase");
  return data.map(mapPatent);
}
