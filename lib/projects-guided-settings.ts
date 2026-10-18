import "server-only";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type SettingsRow = Database["public"]["Tables"]["project_guided_settings"]["Row"];
export type GuidedProjectCounts = { ug: number; pg: number };
export const defaultGuidedProjectCounts: GuidedProjectCounts = { ug: 14, pg: 4 };

export function mapGuidedProjectCounts(row: SettingsRow): GuidedProjectCounts {
  return { ug: row.ug_project_count, pg: row.pg_project_count };
}

export async function getPublicGuidedProjectCounts(): Promise<GuidedProjectCounts> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return defaultGuidedProjectCounts;
  const supabase = await createClient();
  const { data, error } = await supabase.from("project_guided_settings").select("*").eq("singleton", true).single();
  if (error?.code === "PGRST205" || error?.code === "42P01") return defaultGuidedProjectCounts;
  if (error || !data) throw new Error("Unable to read public Projects Guided counters from Supabase");
  return mapGuidedProjectCounts(data);
}
