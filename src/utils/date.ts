const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function weekdayName(d: Date): string {
  return WEEKDAYS[d.getDay()];
}

export function weekdayShort(d: Date): string {
  return WEEKDAYS[d.getDay()].slice(0, 3);
}

export function monthName(d: Date): string {
  return MONTHS[d.getMonth()];
}

export function dayOfMonth(d: Date): string {
  return String(d.getDate());
}

/** "1 August" */
export function niceDate(d: Date): string {
  return `${d.getDate()} ${monthName(d)}`;
}

/** "Saturday, 1 August" */
export function fullDate(d: Date): string {
  return `${weekdayName(d)}, ${niceDate(d)}`;
}

export function timeLabel(ms: number): string {
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function daysBetween(aMs: number, bMs: number): number {
  const a = new Date(aMs);
  const b = new Date(bMs);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

export function dayCountLabel(startedAtMs: number | null): string {
  if (!startedAtMs) return 'Day 1';
  return `Day ${daysBetween(startedAtMs, Date.now()) + 1}`;
}

export function relativeWhen(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'yesterday';
  return `${day}d`;
}

/** "4 days ago" — long form used on the People rows, where the metric is "when did I last touch this page", not a contact-frequency signal. */
export function relativeDaysAgo(ms: number): string {
  const days = daysBetween(ms, Date.now());
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

/** "Today" for same-day, else "3 Aug" — used for note dates on a person's page. */
export function noteDateLabel(ms: number): string {
  const d = new Date(ms);
  if (toIso(d) === toIso(new Date())) return 'Today';
  return `${d.getDate()} ${monthName(d).slice(0, 3)}`;
}
