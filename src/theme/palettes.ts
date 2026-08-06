import { ColorsShape, DiaryMoodShape, FeelColorShape, EnergyColorShape, AvatarRingShape } from './colors';

export type PaperId = 'ivory' | 'oat' | 'fog' | 'night';
export type FaceId = 'newsreader' | 'instrument' | 'georgia';

export interface PaperDef {
  id: PaperId;
  name: string;
  quiet: boolean;
  colors: ColorsShape;
  diaryMood: DiaryMoodShape;
  feelColor: FeelColorShape;
  energyColor: EnergyColorShape;
  avatarRing: AvatarRingShape;
}

/**
 * Only bg/sunk/ink/muted/faint/hair are given by APPEARANCE_BILLING_ADDENDUM.md §1 —
 * the ~19 secondary tones (hovers, ink2/3/4, hairlines, dot colours) don't have spec'd
 * values for Oat/Fog/Night. Rather than inventing them ad hoc, each is carried over at
 * the same qualitative relationship it holds in Ivory (the one fully-specified palette):
 * e.g. hair2 sits a little darker than paper on Ivory, so Oat/Fog's hair2 sits the same
 * amount darker than *their* paper. Night inverts the direction (secondary tones move
 * lighter, not darker, off a near-black base) since that's how dark surfaces actually
 * read — a mechanical "same delta" would produce unreadable near-black-on-near-black.
 */

const ivoryColors: ColorsShape = {
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
};

const oatColors: ColorsShape = {
  paper: '#F6F1E7',
  paperSunk: '#EFE8DA',
  paperSunkHover: '#E8DFCC',
  paperHover: '#F1EADC',
  ink: '#211E19',
  inkHover: '#34302A',
  ink2: '#2F2B24',
  ink3: '#403B32',
  ink4: '#655E4F',
  muted: '#8B8375',
  faint: '#B3A992',
  faint2: '#C0B69C',
  tabInactive: '#BDB29A',
  placeholder: '#B3A992',
  hair: '#E2DACA',
  hair2: '#E9E1D0',
  hair3: '#D6CBB2',
  chevron: '#C7BC9F',
  gold: '#8E6F4E',
  warn: '#B07A6E',
  dotEmpty: '#EDE5D3',
  dotEmptyBorder: '#E6DCC5',
  dotRing: '#D2C6A9',
  keypadHover: '#EFE7D6',
  bulletDot: '#C4B89B',
  echoHair: '#EAE1CE',
};

const fogColors: ColorsShape = {
  paper: '#F2F3F1',
  paperSunk: '#E9EBE8',
  paperSunkHover: '#E1E4E0',
  paperHover: '#EDEFEC',
  ink: '#1B1E1C',
  inkHover: '#2C2F2C',
  ink2: '#282B28',
  ink3: '#383B38',
  ink4: '#5A5F5A',
  muted: '#7F857F',
  faint: '#AAB0A9',
  faint2: '#B7BCB6',
  tabInactive: '#B4B9B3',
  placeholder: '#AAB0A9',
  hair: '#DDE0DC',
  hair2: '#E5E7E4',
  hair3: '#D0D4CF',
  chevron: '#C2C7C1',
  gold: '#8E6F4E',
  warn: '#B07A6E',
  dotEmpty: '#E7E9E6',
  dotEmptyBorder: '#DFE2DE',
  dotRing: '#CBCFCA',
  keypadHover: '#E9EBE8',
  bulletDot: '#BEC3BD',
  echoHair: '#E4E6E3',
};

/** Night's audit conclusions: gold and warn genuinely needed brighter variants to stay
 * legible on near-black; the mood/energy/feel accent hues did not (they're already
 * mid-toned enough to read on either ground) — left unchanged below, not overlooked. */
const nightColors: ColorsShape = {
  paper: '#16151A',
  paperSunk: '#1F1E25',
  paperSunkHover: '#252430',
  paperHover: '#1C1B22',
  ink: '#E8E4DB',
  inkHover: '#D8D4CB',
  ink2: '#D6D2C8',
  ink3: '#C7C2B6',
  ink4: '#A39E92',
  muted: '#8E8A83',
  faint: '#6B6862',
  faint2: '#7D786F',
  tabInactive: '#6B6862',
  placeholder: '#5F5C56',
  hair: '#2A2833',
  hair2: '#302E38',
  hair3: '#363442',
  chevron: '#4A4752',
  gold: '#C9A576',
  warn: '#C99287',
  dotEmpty: '#242230',
  dotEmptyBorder: '#332F3D',
  dotRing: '#3A3745',
  keypadHover: '#242230',
  bulletDot: '#4A4752',
  echoHair: '#2E2C38',
};

const diaryMoodDefault: DiaryMoodShape = { quiet: '#A9B0A2', heavy: '#9AA3AE', warm: '#C9A98E', tender: '#C0A0A4', clear: '#8E9B85', none: '#F0ECE3' };
const diaryMoodNight: DiaryMoodShape = { ...diaryMoodDefault, none: '#242230' };

const feelColorDefault: FeelColorShape = { quiet: '#A9B0A2', heavy: '#9AA3AE', tender: '#C0A0A4', restless: '#C9A98E', relieved: '#8E9B85', tired: '#B3ACA0' };

const energyColorDefault: EnergyColorShape = { gives: '#8E9B85', neutral: '#B3ACA0', takes: '#9AA3AE' };

const avatarRingDefault: AvatarRingShape = { inner: '#CFC8BC', outer: '#E4E0D6' };

export const PAPERS: PaperDef[] = [
  { id: 'ivory', name: 'Ivory', quiet: false, colors: ivoryColors, diaryMood: diaryMoodDefault, feelColor: feelColorDefault, energyColor: energyColorDefault, avatarRing: avatarRingDefault },
  { id: 'oat', name: 'Oat', quiet: false, colors: oatColors, diaryMood: diaryMoodDefault, feelColor: feelColorDefault, energyColor: energyColorDefault, avatarRing: avatarRingDefault },
  { id: 'fog', name: 'Fog', quiet: false, colors: fogColors, diaryMood: diaryMoodDefault, feelColor: feelColorDefault, energyColor: energyColorDefault, avatarRing: avatarRingDefault },
  { id: 'night', name: 'Night', quiet: true, colors: nightColors, diaryMood: diaryMoodNight, feelColor: feelColorDefault, energyColor: energyColorDefault, avatarRing: avatarRingDefault },
];

export const FACES: { id: FaceId; name: string; note: string; quiet: boolean }[] = [
  { id: 'newsreader', name: 'Newsreader', note: 'The default', quiet: false },
  { id: 'instrument', name: 'Instrument Sans', note: 'Plainer', quiet: false },
  { id: 'georgia', name: 'Georgia', note: 'Quiet', quiet: true },
];

export interface SizeDef {
  px: number;
  label: string;
  lh: number;
}

export const SIZES: SizeDef[] = [
  { px: 17, label: 'Small', lh: 1.62 },
  { px: 19, label: 'Medium', lh: 1.66 },
  { px: 21, label: 'Large', lh: 1.7 },
  { px: 24, label: 'Larger', lh: 1.72 },
];

export const DEFAULT_SIZE_IDX = 1;

export function paperOf(id: PaperId): PaperDef {
  return PAPERS.find((p) => p.id === id) ?? PAPERS[0];
}
