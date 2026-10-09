import { differenceInCalendarDays, format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

export const d = (v: string | Date) => (typeof v === 'string' ? parseISO(v) : v);

export function fmtDate(v?: string | null, pattern = 'MMM d, yyyy') {
  return v ? format(d(v), pattern) : '—';
}

export function fmtShort(v?: string | null) {
  if (!v) return '—';
  const date = d(v);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return format(date, sameYear ? 'MMM d' : 'MMM d, yyyy');
}

export function fmtDateTime(v?: string | null) {
  return v ? format(d(v), 'EEE, MMM d · h:mm a') : '—';
}

export function fmtRelativeDay(v?: string | null) {
  if (!v) return '—';
  const date = d(v);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return fmtShort(v);
}

export function ago(v?: string | null) {
  if (!v) return '—';
  return `${formatDistanceToNowStrict(d(v))} ago`;
}

/** Calendar days until a date (negative when past). */
export function daysLeft(v?: string | null): number | null {
  if (!v) return null;
  return differenceInCalendarDays(d(v), new Date());
}

export function daysLeftLabel(n: number | null) {
  if (n === null) return 'No deadline';
  if (n < 0) return `${Math.abs(n)}d overdue`;
  if (n === 0) return 'Due today';
  if (n === 1) return 'Tomorrow';
  return `${n} days left`;
}

/** Formats a stored instant as a value for <input type="date"> in local time. */
export function toDateInput(v?: string | null) {
  return v ? format(d(v), 'yyyy-MM-dd') : '';
}

export function toDateTimeInput(v?: string | null) {
  return v ? format(d(v), "yyyy-MM-dd'T'HH:mm") : '';
}

/** Converts a local yyyy-MM-dd input into an ISO instant at local midnight. */
export function fromDateInput(v: string) {
  return v ? new Date(`${v}T00:00:00`).toISOString() : null;
}

export function fromDateTimeInput(v: string) {
  return v ? new Date(v).toISOString() : null;
}

export function todayInput(offsetDays = 0) {
  const t = new Date();
  t.setDate(t.getDate() + offsetDays);
  return format(t, 'yyyy-MM-dd');
}

export function money(min?: number | null, max?: number | null, currency?: string | null) {
  if (!min && !max) return '—';
  const f = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n));
  const c = currency ? `${currency} ` : '';
  if (min && max) return `${c}${f(min)}–${f(max)}`;
  return `${c}${f((min ?? max)!)}${min ? '+' : ''}`;
}

export function locationText(x: { location?: string | null; city?: string | null; country?: string | null }) {
  const parts = [x.city, x.country].filter(Boolean);
  return x.location || parts.join(', ') || '—';
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function pct(n: number) {
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`;
}
