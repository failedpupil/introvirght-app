import { DiaryEntry } from '../state/types';
import { significantWords } from '../data/content';
import { fullDate, isoToDate, weekdayName } from './date';

const QUESTION_POOL = [
  'What would a week with two empty evenings in it look like?',
  'Who did you want to reach out to but didn’t?',
  'What is a conversation you have been putting off?',
  'What would you do differently if nobody would notice either way?',
  'What did you say yes to that you would like to take back?',
  'Which hour of this week would you like to live again?',
];

export interface WeeklyLetter {
  rangeLabel: string;
  noticed: { label: string; text: string }[];
  questions: [string, string];
}

export function computeWeeklyLetter(allEntries: DiaryEntry[]): WeeklyLetter {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const week = allEntries.filter((e) => {
    const d = isoToDate(e.iso);
    return d >= new Date(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate()) && d <= now;
  });

  const rangeLabel = `${weekdayName(weekAgo)}, ${fullDate(weekAgo).split(', ')[1]} — ${fullDate(now).split(', ')[1]}`;

  if (week.length < 2) {
    return {
      rangeLabel,
      noticed: [
        { label: 'A word that kept coming back', text: 'Not enough pages this week to notice a pattern yet.' },
        { label: 'A pattern in the days', text: 'Write on a couple more days and this will have something to say.' },
        { label: 'Something you softened about', text: 'This fills in once there is more than one page to compare.' },
      ],
      questions: pickQuestions(now),
    };
  }

  // 1. word frequency
  const freq = new Map<string, { count: number; days: Set<string> }>();
  for (const e of week) {
    for (const w of significantWords(e.body)) {
      const cur = freq.get(w) || { count: 0, days: new Set<string>() };
      cur.count++;
      cur.days.add(e.iso);
      freq.set(w, cur);
    }
  }
  let topWord: string | null = null;
  let topInfo = { count: 0, days: new Set<string>() };
  for (const [w, info] of freq) {
    if (info.count > topInfo.count) {
      topWord = w;
      topInfo = info;
    }
  }
  const wordText =
    topWord && topInfo.count >= 2
      ? `You wrote “${topWord}” ${topInfo.count} times this week — across ${topInfo.days.size} page${topInfo.days.size === 1 ? '' : 's'}.`
      : 'No single word repeated enough this week to call it a pattern.';

  // 2. length vs time-of-day
  const byLength = [...week].sort((a, b) => b.wordCount - a.wordCount);
  const half = Math.max(1, Math.floor(byLength.length / 2));
  const longer = byLength.slice(0, half);
  const shorter = byLength.slice(half);
  const avgHour = (list: DiaryEntry[]) => list.reduce((s, e) => s + new Date(e.sealedAtMs).getHours(), 0) / list.length;
  let patternText = 'Your pages this week were a fairly even length, wherever you wrote them.';
  if (shorter.length > 0) {
    const longHour = avgHour(longer);
    const shortHour = avgHour(shorter);
    if (Math.abs(longHour - shortHour) >= 1.5) {
      patternText =
        longHour > shortHour
          ? 'Your longest pages this week came later in the evening than the shorter ones.'
          : 'Your longest pages this week came earlier in the day than the shorter ones.';
    }
  }

  // 3. relational words mentioned more than once
  const RELATION_WORDS = ['mother', 'father', 'brother', 'sister', 'friend', 'partner', 'daughter', 'son'];
  let softened: string | null = null;
  for (const w of RELATION_WORDS) {
    const info = freq.get(w);
    if (info && info.count >= 2) {
      softened = `You mentioned your ${w} ${info.count} times this week.`;
      break;
    }
  }

  return {
    rangeLabel,
    noticed: [
      { label: 'A word that kept coming back', text: wordText },
      { label: 'A pattern in the days', text: patternText },
      { label: 'Something you softened about', text: softened ?? 'Nothing repeated enough this week to point to — some weeks are like that.' },
    ],
    questions: pickQuestions(now),
  };
}

function pickQuestions(now: Date): [string, string] {
  const weekNum = Math.floor(now.getTime() / (7 * 86400000));
  const a = QUESTION_POOL[weekNum % QUESTION_POOL.length];
  const b = QUESTION_POOL[(weekNum + 3) % QUESTION_POOL.length];
  return [a, b];
}
