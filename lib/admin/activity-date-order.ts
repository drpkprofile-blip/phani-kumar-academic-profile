type DatedActivity = {
  id: number;
  year: string;
  date_text: string | null;
  display_order: number;
};

const monthNames: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function dateKey(year: number, month = 1, day = 1): number | null {
  if (!Number.isInteger(year) || year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.getTime();
}

/** Returns a UTC date key for common Indian academic date formats and date ranges. */
export function activityDateKey(dateText: string | null, fallbackYear: string): number | null {
  const value = dateText?.trim().replace(/[–—]/g, "-").replace(/\s+/g, " ");
  if (!value) return null;

  // For full date ranges, sort using the final day, e.g. 31/08/2026 to 05/09/2026.
  let match = value.match(/\b\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4}\s*(?:to|-)\s*(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\b/i);
  if (match) return dateKey(Number(match[3]), Number(match[2]), Number(match[1]));

  match = value.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (match) return dateKey(Number(match[1]), Number(match[2]), Number(match[3]));

  // Day range followed by a month and year, e.g. 07-08 August 2026.
  match = value.match(/\b\d{1,2}\s*[-/]\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})\b/i);
  if (match) {
    const month = monthNames[match[2].toLowerCase()];
    if (month) return dateKey(Number(match[3]), month, Number(match[1]));
  }

  // Month followed by a day range and year, e.g. August 07-08, 2026.
  match = value.match(/\b([a-z]+)\s+\d{1,2}\s*[-/]\s*(\d{1,2}),?\s+(\d{4})\b/i);
  if (match) {
    const month = monthNames[match[1].toLowerCase()];
    if (month) return dateKey(Number(match[3]), month, Number(match[2]));
  }

  // Day + month + optional year, e.g. 8 August 2026.
  match = value.match(/\b(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?\b/i);
  if (match) {
    const month = monthNames[match[2].toLowerCase()];
    if (month) return dateKey(Number(match[3] ?? fallbackYear), month, Number(match[1]));
  }

  // Month + day + optional year, e.g. August 8, 2026.
  match = value.match(/\b([a-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?\b/i);
  if (match) {
    const month = monthNames[match[1].toLowerCase()];
    if (month) return dateKey(Number(match[3] ?? fallbackYear), month, Number(match[2]));
  }

  // Indian numeric dates: DD/MM/YYYY or DD-MM-YYYY.
  match = value.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\b/);
  if (match) return dateKey(Number(match[3]), Number(match[2]), Number(match[1]));

  // A month and year still sorts more accurately than year-only/undated records.
  match = value.match(/\b([a-z]+)\s+(\d{4})\b/i);
  if (match) {
    const month = monthNames[match[1].toLowerCase()];
    if (month) return dateKey(Number(match[2]), month);
  }
  return null;
}

export function orderActivitiesByDate<T extends DatedActivity>(activities: T[]): T[] {
  return [...activities].sort((a, b) => {
    const yearDifference = Number(b.year) - Number(a.year);
    if (yearDifference) return yearDifference;
    const aDate = activityDateKey(a.date_text, a.year);
    const bDate = activityDateKey(b.date_text, b.year);
    if (aDate !== null && bDate !== null && aDate !== bDate) return bDate - aDate;
    if (aDate !== null && bDate === null) return -1;
    if (aDate === null && bDate !== null) return 1;
    return a.display_order - b.display_order;
  });
}
