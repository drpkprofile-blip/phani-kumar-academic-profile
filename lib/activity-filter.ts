import type { AcademicActivity } from "../data/activities";

export type ActivityFilter = "ALL" | string;

export function filterActivities(
  activities: readonly AcademicActivity[],
  selected: ActivityFilter,
): AcademicActivity[] {
  return selected === "ALL"
    ? [...activities]
    : activities.filter((activity) => activity.type === selected);
}

export function groupActivitiesByYear(
  activities: readonly AcademicActivity[],
  years: readonly string[],
): Array<{ year: string; activities: AcademicActivity[] }> {
  return years
    .map((year) => ({ year, activities: activities.filter((activity) => activity.year === year) }))
    .filter((group) => group.activities.length > 0);
}
