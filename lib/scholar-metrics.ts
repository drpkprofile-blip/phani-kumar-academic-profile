/** Render only the primary Google Scholar count from stored `All (Since 2021)` values. */
export function primaryScholarMetric(value: string): string {
  const match = value.trim().match(/^(\d+)(?:\s*\((\d+)\))?$/);
  return match ? match[1] : value;
}
