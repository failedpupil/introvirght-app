import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { DiaryEntry } from '../state/types';
import { fullDate, isoToDate, timeLabel } from './date';

export async function exportEntriesAsPlainText(entries: DiaryEntry[]): Promise<void> {
  const sorted = [...entries].sort((a, b) => (a.iso < b.iso ? 1 : -1));
  const body = sorted
    .map((e) => {
      const header = `${fullDate(isoToDate(e.iso))} — ${e.title}\nSealed ${timeLabel(e.sealedAtMs)} · ${e.wordCount} words\n`;
      return `${header}${'-'.repeat(40)}\n${e.body}\n`;
    })
    .join('\n\n');

  const file = new File(Paths.cache, `introvirght-export-${Date.now()}.txt`);
  if (file.exists) file.delete();
  file.create();
  file.write(body || 'No pages yet.');

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/plain', dialogTitle: 'Export your diary' });
  }
}
