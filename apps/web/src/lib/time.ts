// The club runs in Vietnam (UTC+7, no daylight saving). Dates are stored in UTC
// and shown and entered in club time.
import { intlLocale, type Locale } from "./i18n/config";

export const CLUB_TIME_ZONE = "Asia/Ho_Chi_Minh";
const CLUB_UTC_OFFSET = "+07:00";

/** Turns a club-time date ("2026-10-10") and time ("18:30") into a Date. */
export function fromClubTime(date: string, time: string): Date {
  const d = new Date(`${date}T${time}:00${CLUB_UTC_OFFSET}`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date or time: ${date} ${time}`);
  return d;
}

/** The club-time date and time strings for a Date, for form inputs. */
export function toClubInputs(d: Date): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: CLUB_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

/** Today's date in club time, as "YYYY-MM-DD". */
export function clubToday(now = new Date()): string {
  return toClubInputs(now).date;
}

/** Start and end of a club-time day. */
export function clubDayRange(date: string): { start: Date; end: Date } {
  const start = fromClubTime(date, "00:00");
  return { start, end: new Date(start.getTime() + 24 * 3600_000) };
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function fmt(locale: Locale, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}:${JSON.stringify(options)}`;
  let f = formatters.get(key);
  if (!f) formatters.set(key, (f = new Intl.DateTimeFormat(intlLocale[locale], { timeZone: CLUB_TIME_ZONE, ...options })));
  return f;
}

const DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
const TIME: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" };

// Dates are shown in the reader's language; English is the default for callers without one.
export const formatDay = (d: Date, locale: Locale = "en") => fmt(locale, DAY).format(d);
export const formatTime = (d: Date) => fmt("en", TIME).format(d);
export const formatDateTime = (d: Date, locale: Locale = "en") => fmt(locale, { ...DAY, ...TIME }).format(d);
export const formatTimeRange = (a: Date, b: Date) => `${formatTime(a)}–${formatTime(b)}`;
