import { MoodKey } from '../theme/colors';

// A small on-device keyword lexicon — never a network call, never a real sentiment model.
// It exists only to give the Weather grid honest variety instead of a random color.
const LEXICON: Record<Exclude<MoodKey, 'none'>, string[]> = {
  quiet: ['quiet', 'silence', 'silent', 'alone', 'calm', 'still', 'peace', 'solitude'],
  heavy: ['tired', 'exhausted', 'heavy', 'sad', 'cry', 'drain', 'numb', 'flat', 'low'],
  warm: ['worry', 'worried', 'anxious', 'restless', 'stress', 'nervous', 'cannot', 'fear', 'afraid'],
  tender: ['love', 'miss', 'mother', 'father', 'brother', 'sister', 'friend', 'family', 'gentle'],
  clear: ['grateful', 'relief', 'relieved', 'clear', 'proud', 'good', 'happy', 'done', 'finished'],
};

export function classifyMood(text: string): MoodKey {
  const words = text.toLowerCase().match(/[a-z']+/g) || [];
  const scores: Record<string, number> = { quiet: 0, heavy: 0, warm: 0, tender: 0, clear: 0 };
  for (const w of words) {
    for (const key of Object.keys(LEXICON) as (keyof typeof LEXICON)[]) {
      if (LEXICON[key].includes(w)) scores[key]++;
    }
  }
  let best: MoodKey = 'quiet';
  let bestScore = 0;
  for (const key of Object.keys(scores)) {
    if (scores[key] > bestScore) {
      bestScore = scores[key];
      best = key as MoodKey;
    }
  }
  return best;
}
