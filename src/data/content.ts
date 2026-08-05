import { MoodKey } from '../theme/colors';

export const PROMPTS = [
  'What did you get through today that nobody saw?',
  'What have you been carrying around all week?',
  'Which part of today would you like to keep?',
  'What did you avoid, and what was underneath it?',
  'Who were you around today, and who were you with them?',
];

export const NUDGES = [
  'And what did that feel like, in your body?',
  'What would you say if nobody would read it?',
  'Was there a moment today you wanted to last longer?',
  'What is the part you keep circling back to?',
];

export type TemplateId = 'free' | 'grat' | 'worry' | 'recap';

export interface TemplateDef {
  id: TemplateId;
  label: string;
  name: string;
  ph: string;
  scaffold: string;
}

export const TEMPLATES: TemplateDef[] = [
  { id: 'free', label: 'Freeform', name: 'Freeform', ph: 'Start anywhere. The first sentence does not have to be good.', scaffold: '' },
  { id: 'grat', label: 'Grateful', name: 'Grateful for', ph: 'Three, or one. No pressure.', scaffold: 'Grateful for —\n\n1. \n2. \n3. ' },
  { id: 'worry', label: 'Worry', name: 'Worry', ph: 'Write it down so it stops repeating.', scaffold: 'What I am worried about —\n\n\nWhat is actually in my hands —\n\n' },
  { id: 'recap', label: 'What happened', name: 'What happened', ph: 'Just the facts of the day.', scaffold: 'Morning —\n\nAfternoon —\n\nEvening —\n' },
];

export type FeelId = 'quiet' | 'heavy' | 'tender' | 'restless' | 'relieved' | 'tired';

export interface FeelDef {
  id: FeelId;
  label: string;
  color: MoodKey;
}

export const FEELS: { id: FeelId; label: string }[] = [
  { id: 'quiet', label: 'Quiet' },
  { id: 'heavy', label: 'Heavy' },
  { id: 'tender', label: 'Tender' },
  { id: 'restless', label: 'Restless' },
  { id: 'relieved', label: 'Relieved' },
  { id: 'tired', label: 'Tired' },
];

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'to', 'of', 'in', 'on', 'at', 'for', 'with', 'about', 'as', 'it', 'its', 'this', 'that',
  'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'they', 'them', 'their', 'not', 'no', 'so', 'did', 'do', 'does', 'have', 'has', 'had',
  'if', 'than', 'then', 'when', 'what', 'which', 'who', 'all', 'just', 'from', 'up', 'out',
  'there', 'here', 'was', 'am', 'again', 'still', 'even', 'one', 'get', 'got', 'into',
]);

export function significantWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z']+/g) || []).filter((w) => w.length > 3 && !STOPWORDS.has(w));
}
