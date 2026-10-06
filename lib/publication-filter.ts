import type { Publication } from "../data/publications";

export function getPublicationYears(publications: readonly Publication[]): string[] {
  return [...new Set(publications.map((publication) => publication.year))]
    .sort((a, b) => Number(b) - Number(a));
}

export function filterPublications(
  publications: readonly Publication[],
  selectedYear: string,
): Publication[] {
  return selectedYear === "ALL"
    ? [...publications]
    : publications.filter((publication) => publication.year === selectedYear);
}
