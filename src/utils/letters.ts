import { LetterHorizon, SealedLetter } from '../state/types';
import { monthName } from './date';

/** The whole range. Three choices instead of a date picker — see RITUALS_ADDENDUM.md §2. */
export const HORIZONS: { id: LetterHorizon; label: string }[] = [
  { id: 'month', label: 'In a month' },
  { id: 'sixMonths', label: 'In six months' },
  { id: 'year', label: 'In a year' },
];

/** Below this a letter is not worth sealing for a year — Seal stays inert. */
export const MIN_LETTER_CHARS = 15;

/**
 * Calendar-accurate rather than 30/180/365 days: someone sealing "in a year" on 29 February
 * means next February, and month arithmetic here clamps that to the 28th rather than drifting
 * into March.
 */
export function opensAtFor(horizon: LetterHorizon, fromMs: number): number {
  const d = new Date(fromMs);
  const months = horizon === 'month' ? 1 : horizon === 'sixMonths' ? 6 : 12;
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // setMonth rolls a too-short target month over into the next one (31 Jan + 1 => 3 Mar);
  // pulling back to the last day of the intended month is the honest reading of "in a month".
  if (d.getDate() !== day) d.setDate(0);
  return d.getTime();
}

export type LetterStatus = 'sealed' | 'ready' | 'opened';

export function statusOf(letter: SealedLetter, nowMs = Date.now()): LetterStatus {
  if (letter.readAtMs !== null) return 'opened';
  return nowMs >= letter.opensAtMs ? 'ready' : 'sealed';
}

export function isReadyUnread(letter: SealedLetter, nowMs = Date.now()): boolean {
  return statusOf(letter, nowMs) === 'ready';
}

/** The one letter the home screen offers, oldest-ready first so nothing waits behind a newer one. */
export function firstReadyLetter(letters: SealedLetter[], nowMs = Date.now()): SealedLetter | null {
  const ready = letters.filter((l) => isReadyUnread(l, nowMs));
  if (ready.length === 0) return null;
  return ready.reduce((a, b) => (a.opensAtMs <= b.opensAtMs ? a : b));
}

export function daysUntilOpen(letter: SealedLetter, nowMs = Date.now()): number {
  return Math.max(0, Math.ceil((letter.opensAtMs - nowMs) / 86400000));
}

/** Right-hand status on a list row. */
export function statusLabel(letter: SealedLetter, nowMs = Date.now()): string {
  const status = statusOf(letter, nowMs);
  if (status === 'opened') return 'Opened';
  if (status === 'ready') return 'Ready now';
  const days = daysUntilOpen(letter, nowMs);
  if (days === 1) return 'Opens tomorrow';
  return `Opens in ${days} days`;
}

/** "Next opens in 47 days" for the home row. Null when nothing is still sealed. */
export function nextOpeningLabel(letters: SealedLetter[], nowMs = Date.now()): string | null {
  const sealed = letters.filter((l) => statusOf(l, nowMs) === 'sealed');
  if (sealed.length === 0) return null;
  const soonest = sealed.reduce((a, b) => (a.opensAtMs <= b.opensAtMs ? a : b));
  const days = daysUntilOpen(soonest, nowMs);
  return days === 1 ? 'Next opens tomorrow' : `Next opens in ${days} days`;
}

/** "Sealed in February. You have not read it." — the home card's second line. */
export function sealedInLabel(letter: SealedLetter): string {
  return `Sealed in ${monthName(new Date(letter.writtenAtMs))}. You have not read it.`;
}

export function sealedCount(letters: SealedLetter[], nowMs = Date.now()): number {
  return letters.filter((l) => statusOf(l, nowMs) === 'sealed').length;
}
