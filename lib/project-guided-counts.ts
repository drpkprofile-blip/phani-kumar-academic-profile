export type GuidedProjectLevel = { projectLevel?: string };

export function countGuidedProjectsByLevel(projects: readonly GuidedProjectLevel[]) {
  const ug = projects.filter((project) => /^UG\b/i.test(project.projectLevel?.trim() ?? "")).length;
  const pg = projects.filter((project) => /^PG\b/i.test(project.projectLevel?.trim() ?? "")).length;

  return { ug, pg, total: ug + pg };
}
