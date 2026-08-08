import { DiaryEntry } from '../state/types';
import { significantWords } from '../data/content';
import { isoToDate, monthName, toIso, weekdayName } from './date';

/**
 * The thread and "What the pages know" — RITUALS_ADDENDUM.md §3.
 *
 * Everything here is derived from decrypted entries on device. None of it is ever sent
 * anywhere: these values only exist because the sealed plane is local, and putting any of
 * them in a request body would hand the server a summary of a diary it cannot read.
 *
 * Every function returns null when the data is too thin to be honest. A missing row is the
 * correct output — inventing a plausible one would be lying about the user to themselves.
 */

export const THREAD_DAYS = 28;

export interface ThreadDay {
  /** Entries written that day. Height and colour encode volume, never a pass/fail. */
  count: number;
}

/** One stroke per day for the last four weeks, oldest first. */
export function buildThread(entries: DiaryEntry[], now = new Date()): ThreadDay[] {
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.iso, (counts.get(e.iso) ?? 0) + 1);

  const days: ThreadDay[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = THREAD_DAYS - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    days.push({ count: counts.get(toIso(d)) ?? 0 });
  }
  return days;
}

export function daysWritten(thread: ThreadDay[]): number {
  return thread.filter((d) => d.count > 0).length;
}

export interface PageFact {
  label: string;
  value: string;
}

/** "Tuesday, around 10pm" — needs enough entries for a weekday to actually be a pattern. */
function writesMost(entries: DiaryEntry[]): PageFact | null {
  if (entries.length < 5) return null;

  const byDay = new Map<number, number>();
  const hours: number[] = [];
  for (const e of entries) {
    const day = isoToDate(e.iso).getDay();
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    hours.push(new Date(e.sealedAtMs).getHours());
  }

  let bestDay = -1;
  let bestCount = 0;
  for (const [day, count] of byDay) {
    if (count > bestCount) {
      bestDay = day;
      bestCount = count;
    }
  }
  if (bestDay < 0) return null;

  // A weekday that is merely the most common in a flat spread is not a pattern worth stating.
  if (bestCount < 2 || bestCount / entries.length < 0.2) return null;

  hours.sort((a, b) => a - b);
  const medianHour = hours[Math.floor(hours.length / 2)];
  const label =
    medianHour === 0 ? 'midnight'
      : medianHour === 12 ? 'midday'
      : medianHour < 12 ? `${medianHour}am`
      : `${medianHour - 12}pm`;

  const dayName = weekdayName(new Date(2024, 0, 7 + bestDay));
  return { label: 'You write most', value: `${dayName}, around ${label}` };
}

/** The thinnest month, said plainly and without reproach. */
function shortestMonth(entries: DiaryEntry[]): PageFact | null {
  if (entries.length < 8) return null;

  const byMonth = new Map<string, number>();
  for (const e of entries) {
    const d = isoToDate(e.iso);
    byMonth.set(`${d.getFullYear()}-${d.getMonth()}`, (byMonth.get(`${d.getFullYear()}-${d.getMonth()}`) ?? 0) + 1);
  }
  // One month of data has no "shortest" — there is nothing to compare it against.
  if (byMonth.size < 2) return null;

  let bestKey = '';
  let bestCount = Infinity;
  for (const [key, count] of byMonth) {
    if (count < bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }
  if (!bestKey) return null;

  const [, monthIdx] = bestKey.split('-').map(Number);
  const name = monthName(new Date(2024, monthIdx, 1));
  const pages = `${bestCount} page${bestCount === 1 ? '' : 's'}`;
  return { label: 'Your shortest month', value: `${name} — ${pages}, and that was enough` };
}

/** The word that keeps coming back. Needs real repetition, not a single mention. */
function mostUsedWord(entries: DiaryEntry[]): PageFact | null {
  if (entries.length < 5) return null;

  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const w of significantWords(e.body)) counts.set(w, (counts.get(w) ?? 0) + 1);
  }

  let best = '';
  let bestCount = 0;
  for (const [word, count] of counts) {
    if (count > bestCount) {
      best = word;
      bestCount = count;
    }
  }
  if (!best || bestCount < 4) return null;
  return { label: 'The word you use most', value: `${best} — ${bestCount} times` };
}

/**
 * How writing tends to leave you, out of ten. Only counts entries where the mood was chosen
 * by hand: an on-device guess is not a statement the user made about themselves.
 */
function afterWriting(entries: DiaryEntry[]): PageFact | null {
  const picked = entries.filter((e) => e.moodPicked);
  if (picked.length < 5) return null;

  const counts = new Map<string, number>();
  for (const e of picked) counts.set(e.moodPicked!, (counts.get(e.moodPicked!) ?? 0) + 1);

  let best = '';
  let bestCount = 0;
  for (const [mood, count] of counts) {
    if (count > bestCount) {
      best = mood;
      bestCount = count;
    }
  }
  if (!best) return null;

  const outOfTen = Math.round((bestCount / picked.length) * 10);
  if (outOfTen < 1) return null;
  return { label: 'After writing you feel', value: `${best} — ${outOfTen} night${outOfTen === 1 ? '' : 's'} out of 10` };
}

/** The four rows, with any that cannot be stated honestly left out entirely. */
export function whatThePagesKnow(entries: DiaryEntry[]): PageFact[] {
  return [writesMost(entries), shortestMonth(entries), mostUsedWord(entries), afterWriting(entries)].filter(
    (f): f is PageFact => f !== null
  );
}
