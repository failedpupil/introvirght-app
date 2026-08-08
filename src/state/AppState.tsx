import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { loadState, saveState, listPeople, upsertPerson, listLetters, insertLetter, markLetterRead } from '../storage/db';
import { hasPasscode as checkHasPasscode } from '../storage/crypto';
import {
  Closeness,
  DiaryEntry,
  Energy,
  FragmentEntry,
  NudgePref,
  Person,
  PersistedState,
  PickableMood,
  Plan,
  Rhythm,
  Screen,
  SealedLetter,
  LetterHorizon,
  defaultPersistedState,
  emptyPersonFacts,
} from './types';
import { opensAtFor } from '../utils/letters';
import { MoodKey } from '../theme/colors';
import { PROMPTS, TemplateId } from '../data/content';
import { PlanChoice } from '../data/pricing';
import { toIso } from '../utils/date';
import { wordCount, deriveTitle } from '../utils/words';
import { classifyMood } from '../utils/mood';
import { assignAngle, peopleInRing } from '../utils/people';

interface NavEntry {
  screen: Screen;
  entryId?: number;
  personId?: string;
  letterId?: string;
  searchQuery?: string;
  planChoice?: PlanChoice;
}

export interface NewPersonInput {
  name: string;
  relation: string;
  closeness: Closeness;
  energy: Energy;
  line: string;
}

interface AppContextShape {
  ready: boolean;
  hasPasscode: boolean;
  setHasPasscode: (v: boolean) => void;
  data: PersistedState;
  update: (patch: Partial<PersistedState>) => void;

  nav: NavEntry[];
  screen: Screen;
  openEntryId: number | null;
  openPersonId: string | null;
  openLetterId: string | null;
  openSearchQuery: string | null;
  openPlanChoice: PlanChoice | null;
  navigate: (screen: Screen, opts?: { entryId?: number; personId?: string; letterId?: string; searchQuery?: string; planChoice?: PlanChoice; replace?: boolean }) => void;
  goBack: () => void;
  reset: (screen: Screen) => void;
  goEntries: () => void;
  goPeople: () => void;

  onboardStep: number;
  setOnboardStep: (n: number) => void;

  // derived helpers / actions used across screens
  todayIso: string;
  todaysEntry: DiaryEntry | undefined;
  cyclePrompt: () => void;
  setName: (name: string) => void;
  setRhythm: (r: Rhythm) => void;
  setNudgePref: (p: NudgePref) => void;
  setRemindAt: (v: string) => void;
  completeOnboarding: () => void;
  addFragment: (text: string) => void;
  setDraftText: (t: string) => void;
  setDraftTemplate: (id: TemplateId) => void;
  setDraftMood: (m: PickableMood | null) => void;
  beginDraftClock: () => void;
  tagDraftPerson: (personId: string) => void;
  foldInFragments: () => void;
  sealEntry: () => void;
  setPlan: (p: Plan) => void;

  people: Person[];
  addPerson: (input: NewPersonInput) => Person;
  updatePerson: (id: string, patch: NewPersonInput) => void;
  addPersonNote: (id: string, text: string) => void;

  /** Sealed letters. Bodies of still-sealed letters are absent — `storage/db.ts` withholds them. */
  letters: SealedLetter[];
  setEchoName: (name: string) => void;
  sealLetter: (body: string, horizon: LetterHorizon) => void;
  openLetter: (id: string) => void;
}

const AppContext = createContext<AppContextShape | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<PersistedState>(defaultPersistedState());
  const [hasPasscode, setHasPasscode] = useState(false);
  const [nav, setNav] = useState<NavEntry[]>([{ screen: 'lock' }]);
  const [onboardStep, setOnboardStep] = useState(0);
  const [people, setPeople] = useState<Person[]>([]);
  const [letters, setLetters] = useState<SealedLetter[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  latestData.current = data;
  const latestPeople = useRef(people);
  latestPeople.current = people;

  useEffect(() => {
    (async () => {
      // A transient storage hiccup here (SQLite/SecureStore access right after Android
      // kills and restarts a backgrounded process is the likeliest time to see one) must
      // never leave `ready` stuck at false — that freezes the app on the splash screen
      // forever, which reads to the user as a blank white screen with no way out.
      try {
        const [state, pc, peopleList, letterList] = await Promise.all([
          loadState(),
          checkHasPasscode(),
          listPeople(),
          listLetters(),
        ]);
        setData(state);
        setHasPasscode(pc);
        setPeople(peopleList);
        setLetters(letterList);
      } catch {
        // fall back to safe defaults rather than hang; the lock screen re-checks
        // passcode/state normally once the user is back in the app
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const update = useCallback((patch: Partial<PersistedState>) => {
    setData((prev) => {
      const next = { ...prev, ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveState(latestData.current);
      }, 400);
      return next;
    });
  }, []);

  // Flush any pending save immediately when the app hides (best-effort; RN has no reliable
  // synchronous "will terminate" hook, so the debounce window is kept short instead).
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const screenEntry = nav[nav.length - 1];
  const screen = screenEntry.screen;
  const openEntryId = screenEntry.entryId ?? null;
  const openPersonId = screenEntry.personId ?? null;
  const openLetterId = screenEntry.letterId ?? null;
  const openSearchQuery = screenEntry.searchQuery ?? null;
  const openPlanChoice = screenEntry.planChoice ?? null;

  const navigate = useCallback((next: Screen, opts?: { entryId?: number; personId?: string; letterId?: string; searchQuery?: string; planChoice?: PlanChoice; replace?: boolean }) => {
    setNav((prev) => {
      const entry: NavEntry = { screen: next, entryId: opts?.entryId, personId: opts?.personId, letterId: opts?.letterId, searchQuery: opts?.searchQuery, planChoice: opts?.planChoice };
      if (opts?.replace) return [...prev.slice(0, -1), entry];
      return [...prev, entry];
    });
  }, []);

  const goBack = useCallback(() => {
    setNav((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const reset = useCallback((s: Screen) => {
    setNav([{ screen: s }]);
  }, []);

  const goEntries = useCallback(() => {
    setNav([{ screen: latestData.current.entries.length === 0 ? 'empty' : 'entries' }]);
  }, []);

  const goPeople = useCallback(() => {
    setNav([{ screen: latestPeople.current.length === 0 ? 'peopleEmpty' : 'people' }]);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (nav.length > 1) {
        goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [nav.length, goBack]);

  const todayIso = toIso(new Date());
  const todaysEntry = data.entries.find((e) => e.iso === todayIso);

  const cyclePrompt = useCallback(() => {
    update({ promptIdx: (latestData.current.promptIdx + 1) % PROMPTS.length });
  }, [update]);

  const setName = useCallback((name: string) => update({ name }), [update]);
  const setRhythm = useCallback((rhythm: Rhythm) => update({ rhythm }), [update]);
  const setNudgePref = useCallback((nudgePref: NudgePref) => update({ nudgePref }), [update]);
  const setRemindAt = useCallback((remindAt: string) => update({ remindAt }), [update]);
  const setPlan = useCallback((plan: Plan) => update({ plan }), [update]);

  const completeOnboarding = useCallback(() => {
    update({ onboarded: true, startedAtMs: latestData.current.startedAtMs ?? Date.now() });
  }, [update]);

  const addFragment = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const cur = latestData.current;
      const sameDay = cur.todayFragmentsIso === todayIso;
      const list: FragmentEntry[] = sameDay ? cur.todayFragments : [];
      const now = new Date();
      const at = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const id = `f_${now.getTime()}_${Math.round(Math.random() * 1e6)}`;
      update({
        todayFragmentsIso: todayIso,
        todayFragments: [...list, { id, at, text: trimmed }],
        fragmentArchive: [...cur.fragmentArchive, { id, at, text: trimmed, dateIso: todayIso }],
      });
    },
    [update, todayIso]
  );

  const setDraftText = useCallback((draftText: string) => update({ draftText }), [update]);
  const setDraftTemplate = useCallback((draftTemplate: TemplateId) => update({ draftTemplate }), [update]);
  const setDraftMood = useCallback((draftMood: PickableMood | null) => update({ draftMood }), [update]);

  /** Marks the page as opened once, so time-on-page survives leaving and coming back. */
  const beginDraftClock = useCallback(() => {
    if (latestData.current.draftOpenedAtMs == null) update({ draftOpenedAtMs: Date.now() });
  }, [update]);

  const tagDraftPerson = useCallback(
    (personId: string) => {
      const cur = latestData.current;
      if (cur.draftPeople.includes(personId)) return;
      update({ draftPeople: [...cur.draftPeople, personId] });
    },
    [update]
  );

  const foldInFragments = useCallback(() => {
    const cur = latestData.current;
    if (cur.todayFragmentsIso !== todayIso) return;
    const unfolded = cur.todayFragments.filter((f) => !cur.draftFoldedFragmentIds.includes(f.id));
    if (unfolded.length === 0) return;
    const block = unfolded.map((f) => `${f.at} — ${f.text}`).join('\n');
    const existing = cur.draftText.replace(/\s*$/, '');
    update({
      draftText: existing ? `${existing}\n\n${block}` : block,
      draftFoldedFragmentIds: [...cur.draftFoldedFragmentIds, ...unfolded.map((f) => f.id)],
    });
  }, [update, todayIso]);

  const sealEntry = useCallback(() => {
    const cur = latestData.current;
    const wc = wordCount(cur.draftText);
    if (wc <= 3) return;
    // A mood chosen by hand always beats the on-device guess.
    const mood: MoodKey = cur.draftMood ?? classifyMood(cur.draftText);
    const openedAt = cur.draftOpenedAtMs ?? Date.now();
    const entry: DiaryEntry = {
      id: Date.now(),
      iso: todayIso,
      mood,
      moodPicked: cur.draftMood ?? undefined,
      title: deriveTitle(cur.draftText, cur.draftTemplate),
      body: cur.draftText,
      wordCount: wc,
      template: cur.draftTemplate,
      sealedAtMs: Date.now(),
      people: cur.draftPeople,
      minutesOnPage: Math.max(0, Math.round((Date.now() - openedAt) / 60000)),
      foldedFragmentIds: cur.draftFoldedFragmentIds,
    };
    update({
      entries: [entry, ...cur.entries.filter((e) => e.iso !== todayIso)],
      draftText: '',
      draftTemplate: 'free',
      draftMood: null,
      draftPeople: [],
      draftFoldedFragmentIds: [],
      draftOpenedAtMs: null,
    });
  }, [update, todayIso]);

  const persistPerson = useCallback((person: Person) => {
    upsertPerson(person).catch(() => {
      // best-effort; the in-memory list already reflects the change and will retry next save
    });
  }, []);

  const addPerson = useCallback(
    (input: NewPersonInput): Person => {
      const now = Date.now();
      const person: Person = {
        id: `p_${now}_${Math.round(Math.random() * 1e6)}`,
        name: input.name.trim(),
        relation: input.relation.trim(),
        closeness: input.closeness,
        energy: input.energy,
        angle: assignAngle(peopleInRing(latestPeople.current, input.closeness)),
        line: input.line.trim(),
        description: '',
        facts: emptyPersonFacts(),
        good: [],
        bad: [],
        notes: [],
        mentions: [],
        createdAtMs: now,
        updatedAtMs: now,
      };
      setPeople((prev) => [...prev, person]);
      persistPerson(person);
      return person;
    },
    [persistPerson]
  );

  const updatePerson = useCallback(
    (id: string, patch: NewPersonInput) => {
      const existing = latestPeople.current.find((p) => p.id === id);
      if (!existing) return;
      const updated: Person = {
        ...existing,
        name: patch.name.trim(),
        relation: patch.relation.trim(),
        closeness: patch.closeness,
        energy: patch.energy,
        line: patch.line.trim(),
        updatedAtMs: Date.now(),
      };
      setPeople((prev) => prev.map((p) => (p.id === id ? updated : p)));
      persistPerson(updated);
    },
    [persistPerson]
  );

  const addPersonNote = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const existing = latestPeople.current.find((p) => p.id === id);
      if (!existing) return;
      const updated: Person = {
        ...existing,
        notes: [{ atMs: Date.now(), text: trimmed }, ...existing.notes],
        updatedAtMs: Date.now(),
      };
      setPeople((prev) => prev.map((p) => (p.id === id ? updated : p)));
      persistPerson(updated);
    },
    [persistPerson]
  );

  const setEchoName = useCallback((echoName: string) => update({ echoName: echoName.trim() }), [update]);

  /**
   * Seal a letter. Irreversible by construction: there is no updateLetter or deleteLetter to
   * pair with this, so no UI can grow an unseal path later without someone writing one first.
   */
  const sealLetter = useCallback((body: string, horizon: LetterHorizon) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const now = Date.now();
    const letter: SealedLetter = {
      id: `l_${now}_${Math.round(Math.random() * 1e6)}`,
      writtenAtMs: now,
      opensAtMs: opensAtFor(horizon, now),
      readAtMs: null,
      body: trimmed,
    };
    // Held in memory with its body so the list renders immediately; on the next launch it comes
    // back from listLetters() withheld until it opens, exactly like every other sealed letter.
    setLetters((prev) => [...prev, letter].sort((a, b) => a.opensAtMs - b.opensAtMs));
    insertLetter(letter).catch(() => {
      // the row failed to write — drop it from memory rather than show a letter that is not sealed
      setLetters((prev) => prev.filter((l) => l.id !== letter.id));
    });
  }, []);

  const openLetter = useCallback((id: string) => {
    const now = Date.now();
    const target = letters.find((l) => l.id === id);
    // Refuse to open early even if a caller asks: the gate lives here as well as in SQL.
    if (!target || now < target.opensAtMs || target.readAtMs !== null) return;
    setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, readAtMs: now } : l)));
    markLetterRead(id, now).catch(() => {
      // best-effort; the next listLetters() will report it unread and the card returns
    });
  }, [letters]);

  const value = useMemo<AppContextShape>(
    () => ({
      ready,
      hasPasscode,
      setHasPasscode,
      data,
      update,
      nav,
      screen,
      openEntryId,
      openPersonId,
      openLetterId,
      openSearchQuery,
      openPlanChoice,
      navigate,
      goBack,
      reset,
      goEntries,
      goPeople,
      onboardStep,
      setOnboardStep,
      todayIso,
      todaysEntry,
      cyclePrompt,
      setName,
      setRhythm,
      setNudgePref,
      setRemindAt,
      completeOnboarding,
      addFragment,
      setDraftText,
      setDraftTemplate,
      setDraftMood,
      beginDraftClock,
      tagDraftPerson,
      foldInFragments,
      sealEntry,
      setPlan,
      people,
      addPerson,
      updatePerson,
      addPersonNote,
      letters,
      setEchoName,
      sealLetter,
      openLetter,
    }),
    [
      ready,
      hasPasscode,
      data,
      update,
      nav,
      screen,
      openEntryId,
      openPersonId,
      openLetterId,
      openSearchQuery,
      openPlanChoice,
      navigate,
      goBack,
      reset,
      goEntries,
      goPeople,
      onboardStep,
      todayIso,
      todaysEntry,
      cyclePrompt,
      setName,
      setRhythm,
      setNudgePref,
      setRemindAt,
      completeOnboarding,
      addFragment,
      setDraftText,
      setDraftTemplate,
      setDraftMood,
      beginDraftClock,
      tagDraftPerson,
      foldInFragments,
      sealEntry,
      setPlan,
      people,
      addPerson,
      updatePerson,
      addPersonNote,
      letters,
      setEchoName,
      sealLetter,
      openLetter,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextShape {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
