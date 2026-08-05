export const colors = {
  paper: '#FCFBF8',
  paperSunk: '#F5F2EB',
  paperSunkHover: '#EFEBE1',
  paperHover: '#F7F4ED',
  ink: '#1A1815',
  inkHover: '#2E2B26',
  ink2: '#2A2721',
  ink3: '#3A362F',
  ink4: '#5C5850',
  muted: '#8F8981',
  faint: '#B6B0A6',
  faint2: '#C3BCB1',
  tabInactive: '#C0BAB0',
  placeholder: '#B6B0A6',
  hair: '#E8E4DB',
  hair2: '#EFEBE2',
  hair3: '#DCD6CA',
  chevron: '#CFC8BC',
  gold: '#8E6F4E',
  warn: '#B07A6E',
  dotEmpty: '#F0ECE3',
  dotEmptyBorder: '#EAE6DC',
  dotRing: '#D6D0C4',
  keypadHover: '#F2EFE7',
  bulletDot: '#C9C2B6',
  echoHair: '#F1EDE4',
} as const;

/** Diary entry mood dots and the Weather grid — a different, smaller vocabulary than Echoes' feelings. */
export const diaryMood = {
  quiet: '#A9B0A2',
  heavy: '#9AA3AE',
  warm: '#C9A98E',
  tender: '#C0A0A4',
  clear: '#8E9B85',
  none: '#F0ECE3',
} as const;

export type MoodKey = keyof typeof diaryMood;

/** Echoes' feeling tags — a separate vocabulary that happens to share some hexes with diaryMood. */
export const feelColor = {
  quiet: '#A9B0A2',
  heavy: '#9AA3AE',
  tender: '#C0A0A4',
  restless: '#C9A98E',
  relieved: '#8E9B85',
  tired: '#B3ACA0',
} as const;

/** People — a third small vocabulary: how you feel afterwards, not how close someone is. */
export const energyColor = {
  gives: '#8E9B85',
  neutral: '#B3ACA0',
  takes: '#9AA3AE',
} as const;

/** Avatar ring colour depends only on whether someone is in the inner circle. */
export const avatarRing = {
  inner: '#CFC8BC',
  outer: '#E4E0D6',
} as const;
