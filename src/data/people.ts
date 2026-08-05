import { Closeness, Energy } from '../state/types';

export const CLOSENESS_RINGS: { id: Closeness; label: string; note: string; radius: number; diameter: number }[] = [
  { id: 'inner', label: 'In the middle', note: 'four or five people', radius: 52, diameter: 96 },
  { id: 'near', label: 'Close by', note: 'you would call them', radius: 112, diameter: 212 },
  { id: 'outer', label: 'Further out', note: 'good, but occasional', radius: 170, diameter: 330 },
];

export const ENERGY_OPTIONS: { id: Energy; label: string }[] = [
  { id: 'gives', label: 'Lighter' },
  { id: 'neutral', label: 'Unchanged' },
  { id: 'takes', label: 'Emptied' },
];

export function closenessOf(id: Closeness) {
  return CLOSENESS_RINGS.find((r) => r.id === id)!;
}
