import { useWindowDimensions } from 'react-native';

export const radius = {
  button: 2,
  none: 0,
} as const;

export const spacing = {
  screenH: 26,
  screenHWide: 34,
  topTabbed: 66,
  topBack: 58,
  topIntro: 74,
} as const;

/** Instrument Sans micro-label base style: uppercase, tracked, structural only. */
export const kicker = {
  fontFamily: 'InstrumentSans-Regular',
  fontSize: 9.5,
  letterSpacing: 1.7, // ~.18em at 9.5px
  textTransform: 'uppercase' as const,
};

export const tabLabel = {
  fontFamily: 'InstrumentSans-Regular',
  fontSize: 9,
  letterSpacing: 1.26, // .14em
  textTransform: 'uppercase' as const,
};

export const buttonLabel = {
  fontFamily: 'InstrumentSans-Regular',
  fontSize: 11,
  letterSpacing: 1.6, // .14-.16em
  textTransform: 'uppercase' as const,
};

/**
 * The φ system — home screen only (HOME_SCREEN_ADDENDUM.md §2). Deliberately not
 * folded into `spacing`/the rest of the app yet: the addendum has the home screen
 * ship on this first so it can be judged in place before rolling 21px gutters out
 * everywhere. Values are derived, not rounded to convenient numbers.
 */
export const PHI = 1.618;

/** Fibonacci spacing — replaces the ad-hoc 22/26/28/30 set, home screen only. */
export const phiSpace = {
  gutter: 21,
  top: 55,
  section: 34,
  gap: 13,
  tight: 8,
} as const;

/** The width the home screen was drawn at. Only a reference point now — see below. */
export const DESIGN_WIDTH = 402;

/** Card width is the screen minus both gutters; heights are the golden section of the
 * block above — computed, then rounded to the pixel a screen can actually render (the
 * addendum's own 222/137 are that same rounding of 222.497.../137.207..., not picked).
 *
 * These are the values *at the design width*, kept for reference. Do not lay out with
 * them: a fixed 360 is wider than the column on any screen under 402pt, and the card
 * then runs off the right edge. Use `usePhiCard()`, which keeps both gutters equal as
 * the design intends and lets the golden-section heights follow the real width.
 */
export const CARD_WIDTH = DESIGN_WIDTH - phiSpace.gutter * 2; // 360
export const HERO_HEIGHT = Math.round(CARD_WIDTH / PHI); // 222
export const SURFACED_HEIGHT = Math.round(HERO_HEIGHT / PHI); // 137

/** The φ card metrics for the screen this is actually running on. */
export function usePhiCard() {
  const { width } = useWindowDimensions();
  const cardWidth = width - phiSpace.gutter * 2;
  const heroHeight = Math.round(cardWidth / PHI);
  return { cardWidth, heroHeight, surfacedHeight: Math.round(heroHeight / PHI) };
}

/** Type scale on √φ (1.272) — coarser full-φ steps don't fit a phone. */
export const phiType = {
  label: 9.5,
  label2: 10.5,
  small: 13,
  fragment: 17,
  surfacedBody: 19,
  counter: 21,
  heroBody: 27,
  heroDate: 44,
} as const;
