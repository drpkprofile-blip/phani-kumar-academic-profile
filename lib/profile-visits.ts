import "server-only";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type CounterRow = Database["public"]["Tables"]["profile_visit_counter"]["Row"];
export const defaultProfileVisitCount = 0;

function missingCounter(error: { code?: string } | null) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

export async function getPublicProfileVisitCount(): Promise<number> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return defaultProfileVisitCount;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_visit_counter")
    .select("total_visits")
    .eq("singleton", true)
    .single();

  if (missingCounter(error)) return defaultProfileVisitCount;
  if (error || !data) {
    console.warn("Unable to read public profile visit count.");
    return defaultProfileVisitCount;
  }
  return Number((data as Pick<CounterRow, "total_visits">).total_visits);
}

export async function recordProfileVisit(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_profile_visit");
  if (error || data === null) throw new Error("Unable to record public profile visit");
  return Number(data);
}
