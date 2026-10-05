import "server-only";

import { createClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";

type SubjectRow = Database["public"]["Tables"]["subjects_taught"]["Row"];

export type PublicSubjectTaught = {
  id: number;
  displayOrder: number;
  subjectName: string;
  courseCode?: string;
  program?: string;
  branch?: string;
  semester?: string;
  academicYear?: string;
  subjectType?: string;
  proofUrl?: string;
};

export function mapSubjectTaught(row: SubjectRow): PublicSubjectTaught {
  return {
    id: row.id,
    displayOrder: row.display_order,
    subjectName: row.subject_name,
    courseCode: row.course_code ?? undefined,
    program: row.program ?? undefined,
    branch: row.branch ?? undefined,
    semester: row.semester ?? undefined,
    academicYear: row.academic_year ?? undefined,
    subjectType: row.subject_type ?? undefined,
    proofUrl: row.proof_url ?? undefined,
  };
}

export async function getPublicSubjectsTaught(): Promise<PublicSubjectTaught[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.warn("Supabase public configuration missing; showing the empty Subjects Taught state.");
    return [];
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("subjects_taught").select("*").order("display_order", { ascending: true });
  if (error || !data) throw new Error("Unable to read public Subjects Taught from Supabase");
  return data.map(mapSubjectTaught);
}
