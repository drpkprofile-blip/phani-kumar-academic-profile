import "server-only";

import { achievements as referenceAchievements, type Achievement } from "../data/achievements";
import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type AchievementRow = Database["public"]["Tables"]["achievements"]["Row"];

export function mapAchievement(row: AchievementRow): Achievement {
  return {
    number: String(row.display_order).padStart(2, "0"),
    title: row.title,
    text: row.description,
    proof: row.proof_url ?? undefined,
    extraProof: row.extra_proof_url ?? undefined,
  };
}

export async function getPublicAchievements(): Promise<Achievement[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.warn("Supabase public configuration missing; using the committed Achievements reference.");
    return [...referenceAchievements];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .order("display_order", { ascending: true });

  if (error || !data) throw new Error("Unable to read public Achievements from Supabase");
  return data.map(mapAchievement);
}
