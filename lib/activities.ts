import "server-only";

import { activities as referenceActivities, activityTypes as referenceTypes, type AcademicActivity } from "../data/activities";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];
export type PublicActivities = {
  activities: AcademicActivity[];
  activityTypes: string[];
  activityYears: string[];
};

export function mapActivity(row: ActivityRow): AcademicActivity {
  return {
    year: row.year, title: row.title,
    // The category foreign key is authoritative; labels remain plain display text.
    type: row.activity_type as AcademicActivity["type"],
    institution: row.institution, date: row.date_text ?? undefined,
    duration: row.duration_text ?? undefined, details: row.details ?? undefined,
    proofUrl: row.proof_url ?? undefined,
  };
}

function result(activities: AcademicActivity[], labels: string[]): PublicActivities {
  const present = new Set<string>(activities.map(activity => activity.type));
  if ([...present].some(label => !labels.includes(label))) {
    throw new Error("Unable to resolve public Activities category order");
  }
  return {
    activities,
    activityTypes: labels.filter(label => present.has(label)),
    activityYears: [...new Set(activities.map(activity => activity.year))].sort((a,b) => Number(b)-Number(a)),
  };
}

export async function getPublicActivities(): Promise<PublicActivities> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.warn("Supabase public configuration missing; using the committed Activities reference.");
    return result([...referenceActivities].sort((a,b) => Number(b.year)-Number(a.year)), referenceTypes);
  }
  const supabase = await createClient();
  const [records, categories] = await Promise.all([
    supabase.from("activities").select("*").order("year", {ascending:false}).order("display_order", {ascending:true}),
    supabase.from("activity_categories").select("label,display_order").order("display_order", {ascending:true}),
  ]);
  if (records.error || !records.data) throw new Error("Unable to read public Activities from Supabase");
  if (categories.error || !categories.data) throw new Error("Unable to read public Activities categories from Supabase");
  return result(records.data.map(mapActivity), categories.data.map(category => category.label));
}
