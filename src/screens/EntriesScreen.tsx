import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, diaryMood } from '../theme/colors';
import { serif, sans } from '../theme/fonts';
import { Kicker } from '../components/Basics';
import { EntryRow } from '../components/EntryRow';
import { MagnifierIcon } from '../icons/Icons';
import { useApp } from '../state/AppState';
import { monthName as monthNameOf, toIso } from '../utils/date';

type ViewMode = 'list' | 'weather';

const MOOD_LEGEND: { key: keyof typeof diaryMood; label: string }[] = [
  { key: 'quiet', label: 'Quiet' },
  { key: 'clear', label: 'Clear' },
  { key: 'warm', label: 'Warm' },
  { key: 'heavy', label: 'Heavy' },
  { key: 'tender', label: 'Tender' },
];

const GRID_COLS = 11;
const GRID_GAP = 7;

export function EntriesScreen() {
  const { data, navigate } = useApp();
  const [view, setView] = useState<ViewMode>('list');
  const [gridWidth, setGridWidth] = useState(0);
  const cellSize = gridWidth > 0 ? (gridWidth - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS : 0;
  const onGridLayout = (e: LayoutChangeEvent) => setGridWidth(e.nativeEvent.layout.width);

  const groups = useMemo(() => {
    const byMonth = new Map<string, typeof data.entries>();
    const sorted = [...data.entries].sort((a, b) => (a.iso < b.iso ? 1 : -1));
    for (const e of sorted) {
      const key = e.iso.slice(0, 7);
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(e);
    }
    return Array.from(byMonth.entries());
  }, [data.entries]);

  const weather = useMemo(() => buildWeather(data.entries), [data.entries]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 26 }}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Entries</Text>
          <Pressable onPress={() => navigate('search')} style={styles.findBtn} hitSlop={8}>
            <MagnifierIcon size={14} />
            <Text style={styles.findLabel}>Find</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segRow}>
          <SegButton label="Pages" active={view === 'list'} onPress={() => setView('list')} />
          <SegButton label="Weather" active={view === 'weather'} onPress={() => setView('weather')} />
          <SegButton label="Weekly letter" active={false} onPress={() => navigate('review')} />
        </ScrollView>
      </View>

      {view === 'list' && (
        <View>
          {groups.map(([key, entries]) => {
            const [y, m] = key.split('-').map(Number);
            const label = monthNameOf(new Date(y, m - 1, 1));
            return (
              <View key={key}>
                <Text style={styles.monthKicker}>{label.toUpperCase()} · {entries.length} page{entries.length === 1 ? '' : 's'}</Text>
                {entries.map((e) => (
                  <EntryRow key={e.id} entry={e} onPress={() => navigate('entry', { entryId: e.id })} />
                ))}
              </View>
            );
          })}
        </View>
      )}

      {view === 'weather' && (
        <View style={{ paddingHorizontal: 26, paddingTop: 24 }}>
          <Text style={styles.weatherSummary}>
            You wrote on {weather.writtenCount} of the last 90 days.{' '}
            {weather.writtenCount > 0 ? 'Most of them were quiet ones.' : 'This page fills in as you write.'}
          </Text>
          <View style={{ gap: 24, marginTop: 32 }}>
            {weather.months.map((m) => (
              <View key={m.key}>
                <Kicker style={{ marginBottom: 12 }}>{m.name}</Kicker>
                <View style={styles.grid} onLayout={onGridLayout}>
                  {padToGrid(m.days).map((d, i) => (
                    <View
                      key={i}
                      style={[
                        { width: cellSize, height: cellSize, borderRadius: 999, borderWidth: 1, marginBottom: GRID_GAP },
                        d === null
                          ? { borderColor: 'transparent' }
                          : d.color
                          ? { backgroundColor: d.color, borderColor: d.color }
                          : { backgroundColor: 'transparent', borderColor: colors.dotEmptyBorder },
                      ]}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            {MOOD_LEGEND.map((l) => (
              <View key={l.key} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: diaryMood[l.key] }]} />
                <Text style={styles.legendLabel}>{l.label}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.hair2 }} />
                <Text style={styles.legendCount}>{weather.counts[l.key] ?? 0}</Text>
              </View>
            ))}
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: diaryMood.none, borderWidth: 1, borderColor: colors.dotEmptyBorder }]} />
              <Text style={styles.legendLabel}>Unwritten</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.hair2 }} />
              <Text style={styles.legendCount}>{weather.unwritten}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function SegButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.segBtn}>
      <Text style={[styles.segLabel, { color: active ? colors.ink : colors.faint, borderBottomColor: active ? colors.ink : 'transparent' }]}>{label}</Text>
    </Pressable>
  );
}

function padToGrid(days: { color: string | null }[]): ({ color: string | null } | null)[] {
  const remainder = days.length % GRID_COLS;
  if (remainder === 0) return days;
  return [...days, ...Array(GRID_COLS - remainder).fill(null)];
}

function buildWeather(entries: { iso: string; mood: keyof typeof diaryMood }[]) {
  const byIso = new Map(entries.map((e) => [e.iso, e.mood]));
  const today = new Date();
  const months: { key: string; name: string; days: { color: string | null }[] }[] = [];
  const counts: Partial<Record<keyof typeof diaryMood, number>> = {};
  let writtenCount = 0;
  let totalDays = 0;

  for (let offset = 0; offset < 3; offset++) {
    const ref = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    const lastDay = offset === 0 ? today.getDate() : daysInMonth;
    const days: { color: string | null }[] = [];
    for (let d = 1; d <= lastDay; d++) {
      const iso = toIso(new Date(ref.getFullYear(), ref.getMonth(), d));
      const mood = byIso.get(iso);
      totalDays++;
      if (mood) {
        days.push({ color: diaryMood[mood] });
        counts[mood] = (counts[mood] ?? 0) + 1;
        writtenCount++;
      } else {
        days.push({ color: null });
      }
    }
    months.push({ key: `${ref.getFullYear()}-${ref.getMonth()}`, name: monthNameOf(ref), days });
  }

  return { months, counts, writtenCount, unwritten: Math.max(0, totalDays - writtenCount) };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingTop: 66 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 },
  title: { fontFamily: serif(400), fontSize: 34, letterSpacing: -0.7, color: colors.ink },
  findBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6 },
  findLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.muted },
  segRow: { flexGrow: 0, gap: 22, marginTop: 20, borderBottomWidth: 1, borderBottomColor: colors.hair },
  segBtn: { paddingBottom: 10, marginRight: 22 },
  segLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', borderBottomWidth: 1, paddingBottom: 10 },
  monthKicker: { paddingHorizontal: 26, paddingTop: 22, paddingBottom: 8, fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: colors.faint },
  weatherSummary: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 21, lineHeight: 30, color: colors.ink3, maxWidth: 280 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  legend: { gap: 11, marginTop: 34, paddingTop: 22, borderTopWidth: 1, borderTopColor: colors.hair },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { fontFamily: serif(300), fontSize: 17, color: colors.ink3 },
  legendCount: { fontFamily: sans(400), fontSize: 10, color: colors.faint },
});
