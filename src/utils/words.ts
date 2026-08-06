export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** The tail of an open draft, for the hero's "You left this open" quote. The ellipsis
 * trails, not leads — it marks the sentence as unfinished, not the quote as truncated. */
export function lastWords(text: string, n: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return `${words.slice(-n).join(' ')}…`;
}

export function excerpt(body: string, max = 140): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > max ? flat.slice(0, max).trim() + '…' : flat;
}

/** First non-empty line stands in for a title, mirroring "no title needed" free writing. */
export function deriveTitle(body: string, template: string): string {
  const firstLine = body.split('\n').find((l) => l.trim().length > 0);
  if (!firstLine) return template === 'grat' ? 'Grateful for —' : 'Today’s page';
  const trimmed = firstLine.trim().replace(/[—-]\s*$/, '').trim();
  return trimmed.length > 60 ? trimmed.slice(0, 60).trim() + '…' : trimmed || 'Today’s page';
}
