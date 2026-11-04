import type { PublicGuidedProject } from "./projects-guided";

export type GuidedProjectCategory = "B.TECH" | "M.TECH" | null;

function normalize(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

export function getGuidedProjectCategory(project: Pick<PublicGuidedProject, "projectLevel" | "degreeProgram">): GuidedProjectCategory {
  const program = normalize(project.degreeProgram);
  if (program.includes("btech") || program.includes("bacheloroftechnology")) return "B.TECH";
  if (program.includes("mtech") || program.includes("masteroftechnology")) return "M.TECH";

  const level = normalize(project.projectLevel);
  if (level === "ug" || level.includes("undergraduate")) return "B.TECH";
  if (level === "pg" || level.includes("postgraduate")) return "M.TECH";

  const combined = `${program} ${level}`;
  if (combined.includes("btech") || combined.includes("bacheloroftechnology")) return "B.TECH";
  if (combined.includes("mtech") || combined.includes("masteroftechnology")) return "M.TECH";
  return null;
}
