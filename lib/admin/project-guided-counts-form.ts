export function parseProjectGuidedCounts(form: FormData) {
  const parse = (name: string) => {
    const value = form.get(name);
    if (typeof value !== "string" || !/^(0|[1-9]\d*)$/.test(value)) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) && number <= 2147483647 ? number : null;
  };
  const ug = parse("ug_project_count");
  const pg = parse("pg_project_count");
  const timestamp = form.get("updated_at");
  return ug === null || pg === null || typeof timestamp !== "string" || !Number.isFinite(Date.parse(timestamp))
    ? null
    : { ug, pg, updatedAt: timestamp };
}
