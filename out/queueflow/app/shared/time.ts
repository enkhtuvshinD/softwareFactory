export const MS_PER_MINUTE = 60000;
export const MAX_BOOKING_DAYS_AHEAD = 14;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isoToDate(iso: string): string {
  return iso.slice(0, 10);
}

export function isoToTime(iso: string): string {
  return iso.slice(11, 16);
}

export function combineDateTime(date: string, time: string): string {
  return `${date}T${time}:00.000Z`;
}

export function addMinutesToIso(iso: string, minutes: number): string {
  return new Date(Date.parse(iso) + minutes * MS_PER_MINUTE).toISOString();
}

export function addDaysToDate(date: string, days: number): string {
  return addMinutesToIso(combineDateTime(date, '00:00'), days * 24 * 60).slice(0, 10);
}

export function isWithinOperatingHours(openTime: string, closeTime: string, nowIso: string): boolean {
  const minutesOfDay = timeToMinutes(isoToTime(nowIso));
  return timeToMinutes(openTime) <= minutesOfDay && minutesOfDay < timeToMinutes(closeTime);
}

export function minutesBetween(startIso: string, endIso: string): number {
  return (Date.parse(endIso) - Date.parse(startIso)) / MS_PER_MINUTE;
}
