const months: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

/** Formats only a clear month-and-year academic date. Ranges and other text stay as supplied. */
export function formatAcademicDate(value: string): string {
  const compact = value.trim().match(/^(0[1-9]|1[0-2])(\d{4})$/);
  if (compact) return `${compact[1]}/${compact[2]}`;
  const match = value.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return value;
  const month = months[match[1].toLowerCase()];
  return month ? `${month}/${match[2]}` : value;
}
