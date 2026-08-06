import { ArchivedFragment, DiaryEntry, Person, PersistedState } from '../state/types';
import { significantWords } from '../data/content';
import { isoToDate, monthName, weekdayName } from './date';
import { trailingWeek, computeWeeklyLetter } from './review';

/**
 * "Surfaced" — HOME_SCREEN_ADDENDUM.md §5. Every candidate is computed on device from
 * local SQLite/state; nothing here ever calls a server or a model. Each function
 * returns null when its data source is unavailable (§4) rather than a placeholder —
 * the pool builder below drops nulls, and an empty pool means the whole card hides.
 */
export type SurfacedKind = 'year_ago' | 'recurring_word' | 'quiet_person' | 'loose_fragment' | 'letter_teaser';

export interface Surfaced {
  kind: SurfacedKind;
  kicker: string;
  body: string;
  cta: string;
  // Where "opens" leads, resolved per-kind by the screen rather than a generic router.
  entryId?: number;
  personId?: string;
  query?: string;
  seedText?: string;
}

const MIN_SEALED_FOR_SURFACED = 7;

/** Every Surfaced body must fit two lines at 19px/1.45 (~85 characters) — a design
 * constraint, not a UI overflow to clip after the fact. */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + '…';
}

/** Picks the sentence closest to a comfortable quoting length, rather than just the longest. */
function strongestSentence(body: string): string {
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20);
  if (sentences.length === 0) return truncate(body.trim(), 90);
  const best = sentences.reduce((a, b) => (Math.abs(b.length - 65) < Math.abs(a.length - 65) ? b : a));
  return truncate(best, 90);
}

function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`;
}

/** An entry within ±3 days of exactly one year ago. */
function yearAgoVariant(entries: DiaryEntry[]): Surfaced | null {
  const now = new Date();
  const target = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const targetMs = target.getTime();
  let best: DiaryEntry | null = null;
  let bestDiffDays = 4; // exclusive upper bound; only accept <= 3
  for (const e of entries) {
    const diffDays = Math.abs(isoToDate(e.iso).getTime() - targetMs) / 86400000;
    if (diffDays <= 3 && diffDays < bestDiffDays) {
      best = e;
      bestDiffDays = diffDays;
    }
  }
  if (!best) return null;
  return {
    kind: 'year_ago',
    kicker: 'One year ago today',
    body: strongestSentence(best.body),
    cta: 'Read that page',
    entryId: best.id,
  };
}

/** Stopword-filtered term frequency across every sealed entry, >=5 occurrences. */
function recurringWordVariant(entries: DiaryEntry[]): Surfaced | null {
  const freq = new Map<string, DiaryEntry[]>();
  for (const e of entries) {
    for (const w of new Set(significantWords(e.body))) {
      const list = freq.get(w) ?? [];
      list.push(e);
      freq.set(w, list);
    }
  }
  // Occurrence count (not distinct-entry count) is what has to clear 5, per §5.
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const w of significantWords(e.body)) counts.set(w, (counts.get(w) ?? 0) + 1);
  }

  let bestWord: string | null = null;
  let bestCount = 4;
  for (const [w, c] of counts) {
    if (c > bestCount) {
      bestWord = w;
      bestCount = c;
    }
  }
  if (!bestWord) return null;
  const pages = (freq.get(bestWord) ?? []).sort((a, b) => (a.iso < b.iso ? -1 : 1));
  const since = monthName(isoToDate(pages[0].iso));

  const byWeekday = new Map<string, number>();
  for (const p of pages) {
    const wd = weekdayName(isoToDate(p.iso));
    byWeekday.set(wd, (byWeekday.get(wd) ?? 0) + 1);
  }
  let topDay = '';
  let topDayCount = 0;
  for (const [d, c] of byWeekday) {
    if (c > topDayCount) {
      topDay = d;
      topDayCount = c;
    }
  }
  const pageWord = pages.length === 1 ? 'page' : 'pages';
  const dayClause = topDayCount >= 2 ? ` ${topDayCount} of them a ${topDay}.` : '';

  return {
    kind: 'recurring_word',
    kicker: 'A word you keep using',
    body: truncate(`“${bestWord}”, in ${pages.length} ${pageWord} since ${since}.${dayClause}`, 90),
    cta: 'See where',
    query: bestWord,
  };
}

/** A person in the inner/near rings untouched for 14+ days. `updatedAtMs` (last edit or
 * note) stands in for "mentioned" — People's own mention-linking is manual and usually
 * empty (PEOPLE_ADDENDUM.md's open question), so it isn't a usable signal here. */
function quietPersonVariant(people: Person[]): Surfaced | null {
  const pool = people.filter((p) => p.closeness === 'inner' || p.closeness === 'near');
  if (pool.length < 2) return null;

  const now = Date.now();
  let quietest: Person | null = null;
  let mostDays = 13; // exclusive floor; only accept >= 14
  for (const p of pool) {
    const days = Math.floor((now - p.updatedAtMs) / 86400000);
    if (days > mostDays) {
      quietest = p;
      mostDays = days;
    }
  }
  if (!quietest) return null;

  const energyClause =
    quietest.energy === 'gives'
      ? 'You leave lighter every time.'
      : quietest.energy === 'takes'
      ? 'It costs you a little every time.'
      : 'Nothing really changes, either way.';

  return {
    kind: 'quiet_person',
    kicker: 'Not written about lately',
    body: `${quietest.name}, not since the ${ordinal(new Date(quietest.updatedAtMs).getDate())}. ${energyClause}`,
    cta: `Open ${quietest.name.split(' ')[0]}`,
    personId: quietest.id,
  };
}

/** A fragment never folded into any entry, 7+ days old. Needs `fragmentArchive` — the
 * durable record introduced alongside this feature, since `todayFragments` only ever
 * holds the current day's and can't answer "7 days old" on its own. */
function looseFragmentVariant(
  archive: ArchivedFragment[],
  entries: DiaryEntry[],
  draftFolded: string[]
): Surfaced | null {
  const foldedIds = new Set([...entries.flatMap((e) => e.foldedFragmentIds), ...draftFolded]);
  const now = Date.now();
  const eligible = archive.filter((f) => {
    if (foldedIds.has(f.id)) return false;
    const [h, m] = f.at.split(':').map(Number);
    const created = isoToDate(f.dateIso);
    created.setHours(h || 0, m || 0);
    return (now - created.getTime()) / 86400000 >= 7;
  });
  if (eligible.length === 0) return null;
  const chosen = eligible[eligible.length - 1];
  return {
    kind: 'loose_fragment',
    kicker: 'A fragment left on its own',
    body: `“${truncate(chosen.text, 80)}”`,
    cta: 'Take it further',
    seedText: chosen.text,
  };
}

/** One observation from the most recent real weekly letter (not the "not enough pages yet" filler). */
function letterTeaserVariant(entries: DiaryEntry[]): Surfaced | null {
  if (trailingWeek(entries).length < 2) return null;
  const letter = computeWeeklyLetter(entries);
  return {
    kind: 'letter_teaser',
    kicker: 'Waiting for you on Sunday',
    body: truncate(letter.noticed[0].text, 90),
    cta: "Read last week's",
  };
}

export function buildSurfacedPool(data: PersistedState, people: Person[]): Surfaced[] {
  if (data.entries.length < MIN_SEALED_FOR_SURFACED) return [];
  const pool: (Surfaced | null)[] = [
    yearAgoVariant(data.entries),
    recurringWordVariant(data.entries),
    quietPersonVariant(people),
    looseFragmentVariant(data.fragmentArchive, data.entries, data.draftFoldedFragmentIds),
    letterTeaserVariant(data.entries),
  ];
  return pool.filter((s): s is Surfaced => s !== null);
}

/** Whether the user has ever had a real weekly letter (proxy: ever had a week with
 * enough entries to clear the same threshold computeWeeklyLetter itself uses). */
export function hasEverHadLetter(entries: DiaryEntry[]): boolean {
  return entries.length >= 2;
}

export function daysUntilSunday(now = new Date()): number {
  const dow = now.getDay(); // 0 = Sunday
  return dow === 0 ? 7 : 7 - dow;
}

export function letterReadyToday(entries: DiaryEntry[], now = new Date()): boolean {
  return now.getDay() === 0 && trailingWeek(entries, now).length >= 2;
}
