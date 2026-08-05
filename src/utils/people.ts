import { Closeness, Person } from '../state/types';

/** Picks the largest angular gap among existing people in a ring and returns its midpoint, so a new dot never lands on top of another and the map never needs to reshuffle. */
export function assignAngle(existingInRing: Person[]): number {
  const angles = existingInRing.map((p) => ((p.angle % 360) + 360) % 360).sort((a, b) => a - b);
  if (angles.length === 0) return 270; // top of the circle

  let bestGapStart = 0;
  let bestGapSize = -1;
  for (let i = 0; i < angles.length; i++) {
    const a = angles[i];
    const b = i + 1 < angles.length ? angles[i + 1] : angles[0] + 360;
    const gap = b - a;
    if (gap > bestGapSize) {
      bestGapSize = gap;
      bestGapStart = a;
    }
  }
  return ((bestGapStart + bestGapSize / 2) % 360 + 360) % 360;
}

export function peopleInRing(people: Person[], ring: Closeness): Person[] {
  return people.filter((p) => p.closeness === ring);
}

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

export function numberWord(n: number): string {
  return n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : String(n);
}

/** The map summary sentence — always derived from live data, never a stored/cached count. */
export function mapSummary(people: Person[]): string {
  const innerCount = peopleInRing(people, 'inner').length;
  if (innerCount === 0) return 'Nobody in the middle.';
  const word = numberWord(innerCount);
  const noun = innerCount === 1 ? 'person' : 'people';
  return `${word} ${noun} in the middle. Everyone else further out, which is allowed.`;
}
