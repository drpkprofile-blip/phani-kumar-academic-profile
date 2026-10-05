const months: Record<string, string> = {
  jan: "01", january: "01", feb: "02", february: "02", mar: "03", march: "03",
  apr: "04", april: "04", may: "05", jun: "06", june: "06", jul: "07", july: "07",
  aug: "08", august: "08", sep: "09", sept: "09", september: "09", oct: "10",
  october: "10", nov: "11", november: "11", dec: "12", december: "12",
};

function validDay(day: number, month: number, year: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Formats only unambiguous exact dates and month/year values. Ranges and ambiguous text stay as supplied. */
export function formatAcademicDate(value: string): string {
  const text = value.trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, yearText, monthText, dayText] = iso;
    const year = Number(yearText), month = Number(monthText), day = Number(dayText);
    return validDay(day, month, year) ? `${dayText}/${monthText}/${yearText}` : value;
  }

  const namedDayFirst = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  const namedMonthFirst = text.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  const named = namedDayFirst
    ? { dayText: namedDayFirst[1], monthName: namedDayFirst[2], yearText: namedDayFirst[3] }
    : namedMonthFirst
      ? { dayText: namedMonthFirst[2], monthName: namedMonthFirst[1], yearText: namedMonthFirst[3] }
      : null;
  if (named) {
    const monthText = months[named.monthName.toLowerCase()];
    const day = Number(named.dayText), month = Number(monthText), year = Number(named.yearText);
    if (monthText && validDay(day, month, year)) return `${String(day).padStart(2, "0")}/${monthText}/${named.yearText}`;
    return value;
  }

  const numeric = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (numeric) {
    let day = Number(numeric[1]), month = Number(numeric[2]);
    if (day <= 12 && month <= 12) return value;
    if (day <= 12) [day, month] = [month, day];
    if (validDay(day, month, Number(numeric[3]))) {
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${numeric[3]}`;
    }
    return value;
  }

  const compact = text.match(/^(0[1-9]|1[0-2])(\d{4})$/);
  if (compact) return `${compact[1]}/${compact[2]}`;
  const numericMonthYear = text.match(/^(\d{1,2})\/(\d{4})$/);
  if (numericMonthYear && Number(numericMonthYear[1]) >= 1 && Number(numericMonthYear[1]) <= 12) {
    return `${numericMonthYear[1].padStart(2, "0")}/${numericMonthYear[2]}`;
  }
  const monthYear = text.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const month = months[monthYear[1].toLowerCase()];
    return month ? `${month}/${monthYear[2]}` : value;
  }
  return value;
}
