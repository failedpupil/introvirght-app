import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ColorsShape, DiaryMoodShape, EnergyColorShape, FeelColorShape, AvatarRingShape } from './colors';
import { sans, serif } from './fonts';
import { DEFAULT_SIZE_IDX, FACES, FaceId, PAPERS, PaperId, SIZES, SizeDef, paperOf } from './palettes';

const STORAGE_KEY = 'introvirght.appearance.v1';

interface StoredLook {
  paper: PaperId;
  face: FaceId;
  sizeIdx: number;
  ruled: boolean;
  askBeforeSealing: boolean;
  quietHours: boolean;
}

const DEFAULT_LOOK: StoredLook = {
  paper: 'ivory',
  face: 'newsreader',
  sizeIdx: DEFAULT_SIZE_IDX,
  ruled: true,
  askBeforeSealing: false,
  quietHours: false,
};

interface ThemeShape {
  ready: boolean;
  paper: PaperId;
  face: FaceId;
  sizeIdx: number;
  ruled: boolean;
  askBeforeSealing: boolean;
  quietHours: boolean;

  colors: ColorsShape;
  diaryMood: DiaryMoodShape;
  feelColor: FeelColorShape;
  energyColor: EnergyColorShape;
  avatarRing: AvatarRingShape;
  readingSize: SizeDef;
  /** Hand-aware body font — scoped to the entry body / write textarea / Appearance
   * preview only, per the addendum. Every other serif() call in the app is unaffected;
   * the app's structural chrome isn't part of what "Hand" means here. */
  readingFont: (weight?: 300 | 400 | 500) => string;

  // Setters apply unconditionally — the paywall gate (is this option Quiet, is the
  // user Quiet) is a product decision made by the calling screen, not this store.
  setPaper: (id: PaperId) => void;
  setFace: (id: FaceId) => void;
  setSizeIdx: (i: number) => void;
  setRuled: (v: boolean) => void;
  setAskBeforeSealing: (v: boolean) => void;
  setQuietHours: (v: boolean) => void;
  resetLook: () => void;
}

const ThemeContext = createContext<ThemeShape | null>(null);

/** Real Georgia ships as an iOS system font; Android has no built-in Georgia and bundling
 * Microsoft's font file isn't something this app has a licence to do, so Android falls
 * back to the platform's generic serif face. Every italic instance in the app already
 * applies RN's own `fontStyle: 'italic'` rather than calling serif(_, true) (verified —
 * nothing in this codebase calls it with the italic flag), so that fallback costs nothing
 * further: synthetic italic layers on top of whichever family is selected here. */
export function readingFontFor(face: FaceId, weight: 300 | 400 | 500 = 400): string {
  if (face === 'instrument') return sans(weight === 500 ? 500 : 400);
  if (face === 'georgia') return Platform.OS === 'ios' ? 'Georgia' : 'serif';
  return serif(weight);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [look, setLook] = useState<StoredLook>(DEFAULT_LOOK);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (raw) setLook({ ...DEFAULT_LOOK, ...JSON.parse(raw) });
      } catch {
        // fall back to defaults rather than block the app on a storage hiccup
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback((next: StoredLook) => {
    setLook(next);
    SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setPaper = useCallback((paper: PaperId) => persist({ ...look, paper }), [look, persist]);
  const setFace = useCallback((face: FaceId) => persist({ ...look, face }), [look, persist]);
  const setSizeIdx = useCallback((sizeIdx: number) => persist({ ...look, sizeIdx }), [look, persist]);
  const setRuled = useCallback((ruled: boolean) => persist({ ...look, ruled }), [look, persist]);
  const setAskBeforeSealing = useCallback((askBeforeSealing: boolean) => persist({ ...look, askBeforeSealing }), [look, persist]);
  const setQuietHours = useCallback((quietHours: boolean) => persist({ ...look, quietHours }), [look, persist]);

  /** "Back to how it was" — resets paper/hand/size/rules only; the three toggles are
   * left alone per the addendum (they're behaviour preferences, not "look"). */
  const resetLook = useCallback(() => {
    persist({ ...look, paper: DEFAULT_LOOK.paper, face: DEFAULT_LOOK.face, sizeIdx: DEFAULT_LOOK.sizeIdx, ruled: DEFAULT_LOOK.ruled });
  }, [look, persist]);

  const activePaper = useMemo(() => paperOf(look.paper), [look.paper]);
  const readingSize = SIZES[look.sizeIdx] ?? SIZES[DEFAULT_SIZE_IDX];
  const readingFont = useCallback((weight?: 300 | 400 | 500) => readingFontFor(look.face, weight), [look.face]);

  const value = useMemo<ThemeShape>(
    () => ({
      ready,
      paper: look.paper,
      face: look.face,
      sizeIdx: look.sizeIdx,
      ruled: look.ruled,
      askBeforeSealing: look.askBeforeSealing,
      quietHours: look.quietHours,
      colors: activePaper.colors,
      diaryMood: activePaper.diaryMood,
      feelColor: activePaper.feelColor,
      energyColor: activePaper.energyColor,
      avatarRing: activePaper.avatarRing,
      readingSize,
      readingFont,
      setPaper,
      setFace,
      setSizeIdx,
      setRuled,
      setAskBeforeSealing,
      setQuietHours,
      resetLook,
    }),
    [ready, look, activePaper, readingSize, readingFont, setPaper, setFace, setSizeIdx, setRuled, setAskBeforeSealing, setQuietHours, resetLook]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeShape {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { PAPERS, FACES, SIZES };
