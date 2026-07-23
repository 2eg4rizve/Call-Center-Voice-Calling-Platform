export function localDateToUtcIso(value: string | Date | null | undefined, endOfDay = false): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date.toISOString();
}
