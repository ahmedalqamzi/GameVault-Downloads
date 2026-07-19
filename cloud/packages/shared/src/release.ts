const DAY_MS = 86_400_000;

function localDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export type CountdownTone = "new" | "today" | "soon" | "future";

export interface ReleaseCountdown {
  label: string;
  days: number;
  tone: CountdownTone;
}

export function daysUntilRelease(timestamp: number, now = new Date()): number {
  return localDayNumber(new Date(timestamp * 1000)) - localDayNumber(now);
}

export function releaseCountdown(
  timestamp: number | undefined,
  now = new Date(),
): ReleaseCountdown | undefined {
  if (timestamp === undefined) return undefined;
  const days = daysUntilRelease(timestamp, now);
  if (days < -14) return undefined;
  if (days < 0) return { label: `Out · ${Math.abs(days)}d ago`, days, tone: "new" };
  if (days === 0) return { label: "Out today", days, tone: "today" };
  if (days === 1) return { label: "Tomorrow", days, tone: "soon" };
  if (days < 30) return { label: `in ${days}d`, days, tone: "soon" };
  if (days < 365) return { label: `in ${Math.floor(days / 30)}mo`, days, tone: "future" };
  return { label: `in ${Math.floor(days / 365)}y+`, days, tone: "future" };
}

export function releaseDayKey(timestamp: number | undefined): string {
  if (timestamp === undefined) return "tba";
  const date = new Date(timestamp * 1000);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function releaseMonthKey(timestamp: number | undefined): string {
  if (timestamp === undefined) return "tba";
  const date = new Date(timestamp * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatReleaseDate(timestamp: number | undefined, locale?: string): string {
  if (timestamp === undefined) return "Release date TBA";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

export function formatReleaseDay(timestamp: number | undefined, locale?: string): string {
  if (timestamp === undefined) return "Date TBA";
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

export function formatReleaseMonth(timestamp: number | undefined, locale?: string): string {
  if (timestamp === undefined) return "Date TBA";
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}
