import "server-only";

import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type ProjectRow = Database["public"]["Tables"]["projects_guided"]["Row"];

export type PublicGuidedProject = {
  id: number;
  displayOrder: number;
  projectTitle: string;
  projectLevel?: string;
  degreeProgram?: string;
  branch?: string;
  academicYear?: string;
  batch?: string;
  studentNames?: string[];
  guideName?: string;
  coGuideNames?: string[];
  proofUrl?: string;
};

export function mapProjectGuided(row: ProjectRow): PublicGuidedProject {
  return {
    id: row.id,
    displayOrder: row.display_order,
    projectTitle: row.project_title,
    projectLevel: row.project_level ?? undefined,
    degreeProgram: row.degree_program ?? undefined,
    branch: row.branch ?? undefined,
    academicYear: row.academic_year ?? undefined,
    batch: row.batch ?? undefined,
    studentNames: row.student_names ?? undefined,
    guideName: row.guide_name ?? undefined,
    coGuideNames: row.co_guide_names ?? undefined,
    proofUrl: row.proof_url ?? undefined,
  };
}

export async function getPublicProjectsGuided(): Promise<PublicGuidedProject[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.warn("Supabase public configuration missing; showing the empty Projects Guided state.");
    return [];
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects_guided").select("*").order("display_order", { ascending: true });
  if (error || !data) throw new Error("Unable to read public Projects Guided from Supabase");
  return data.map(mapProjectGuided);
}
