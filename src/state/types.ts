import { MoodKey } from '../theme/colors';
import { TemplateId } from '../data/content';

export type Rhythm = 'am' | 'pm' | 'night';
export type NudgePref = 'yes' | 'stall' | 'no';
export type Plan = 'free' | 'quiet';

export interface FragmentEntry {
  at: string;
  text: string;
}

export interface DiaryEntry {
  id: number;
  iso: string; // YYYY-MM-DD, the calendar day this page belongs to
  mood: MoodKey;
  title: string;
  body: string;
  wordCount: number;
  template: TemplateId;
  sealedAtMs: number;
}

export type Closeness = 'inner' | 'near' | 'outer';
export type Energy = 'gives' | 'neutral' | 'takes';

export interface PersonNote {
  atMs: number;
  text: string;
}

export interface PersonMention {
  entryId: number;
  date: string;
  quote: string;
}

/** A person's private page. Lives entirely in the `blob` table as kind:'person' — never in this vault JSON. */
export interface Person {
  id: string;
  name: string;
  relation: string;
  closeness: Closeness;
  energy: Energy;
  angle: number; // degrees, assigned once on create; never recomputed
  line: string;
  description: string;
  facts: [string, string][]; // [value, label] — Last saw / Usually / Afterwards
  good: string[];
  bad: string[];
  notes: PersonNote[];
  mentions: PersonMention[];
  createdAtMs: number;
  updatedAtMs: number;
}

export function emptyPersonFacts(): [string, string][] {
  return [
    ['—', 'Last saw'],
    ['—', 'Usually'],
    ['—', 'Afterwards'],
  ];
}

/** Everything that survives an app restart. Encrypted as one AES-256-GCM blob at rest. */
export interface PersistedState {
  version: 1;
  name: string;
  rhythm: Rhythm | null;
  nudgePref: NudgePref | null;
  remindAt: string;
  onboarded: boolean;
  startedAtMs: number | null;
  promptIdx: number;
  nudgeIdx: number;
  draftText: string;
  draftTemplate: TemplateId;
  todayFragmentsIso: string | null;
  todayFragments: FragmentEntry[];
  entries: DiaryEntry[];
  plan: Plan;
}

export function defaultPersistedState(): PersistedState {
  return {
    version: 1,
    name: '',
    rhythm: null,
    nudgePref: null,
    remindAt: '21:30',
    onboarded: false,
    startedAtMs: null,
    promptIdx: 0,
    nudgeIdx: 0,
    draftText: '',
    draftTemplate: 'free',
    todayFragmentsIso: null,
    todayFragments: [],
    entries: [],
    plan: 'free',
  };
}

export type Screen =
  | 'lock'
  | 'welcome'
  | 'passcode'
  | 'onboard'
  | 'remind'
  | 'today'
  | 'write'
  | 'sealed'
  | 'entries'
  | 'entry'
  | 'empty'
  | 'review'
  | 'search'
  | 'people'
  | 'person'
  | 'newPerson'
  | 'peopleEmpty'
  | 'echoes'
  | 'compose'
  | 'signin'
  | 'you'
  | 'privacy'
  | 'paywall';

export const TABBED_SCREENS: Screen[] = [
  'today', 'entries', 'entry', 'echoes', 'you', 'search', 'empty', 'review', 'privacy', 'paywall',
  'people', 'person', 'peopleEmpty',
];
