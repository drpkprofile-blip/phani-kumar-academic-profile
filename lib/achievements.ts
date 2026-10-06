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

function explicitYear(text: string): number {
  const match = text.match(/\b(?:19|20)\d{2}\b/);
  return match ? Number(match[0]) : 0;
}

function orderAchievements<T extends { title: string; description: string }>(rows: T[]): T[] {
  return rows.map((row, index) => ({ row, index, year: explicitYear(row.description) }))
    .sort((a, b) => b.year - a.year || a.index - b.index)
    .map(({ row }) => row);
}

export async function getPublicAchievements(): Promise<Achievement[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.warn("Supabase public configuration missing; using the committed Achievements reference.");
    return [...referenceAchievements].sort((a, b) => explicitYear(b.text) - explicitYear(a.text));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .order("display_order", { ascending: true });

  if (error || !data) throw new Error("Unable to read public Achievements from Supabase");
  return orderAchievements(data).map((row, index) => ({ ...mapAchievement(row), number: String(index + 1).padStart(2, "0") }));
}
