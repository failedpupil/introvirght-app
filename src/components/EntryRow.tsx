import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { DiaryEntry } from '../state/types';
import { excerpt } from '../utils/words';
import { isoToDate, weekdayShort, timeLabel } from '../utils/date';

export function EntryRow({
  entry,
  onPress,
  showMoodAndMeta = true,
}: {
  entry: DiaryEntry;
  onPress: () => void;
  showMoodAndMeta?: boolean;
}) {
  const { colors, diaryMood } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const d = isoToDate(entry.iso);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.paperHover }]}>
      <View style={styles.dayCol}>
        <Text style={styles.day}>{d.getDate()}</Text>
        <Text style={styles.dow}>{weekdayShort(d)}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.titleRow}>
          {showMoodAndMeta && <View style={[styles.dot, { backgroundColor: diaryMood[entry.mood] }]} />}
          <Text style={styles.title} numberOfLines={1}>{entry.title}</Text>
        </View>
        <Text style={styles.excerpt} numberOfLines={2}>{excerpt(entry.body)}</Text>
        {showMoodAndMeta && (
          <Text style={styles.meta}>{entry.wordCount} words · sealed {timeLabel(entry.sealedAtMs)}</Text>
        )}
      </View>
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: 18, paddingHorizontal: 26, paddingVertical: 18, borderTopWidth: 1, borderTopColor: colors.hair2 },
    dayCol: { width: 34 },
    day: { fontFamily: serif(300), fontSize: 22, lineHeight: 22, color: colors.ink },
    dow: { fontFamily: sans(400), fontSize: 9, letterSpacing: 0.9, textTransform: 'uppercase', color: colors.faint2, marginTop: 5 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    title: { fontFamily: serif(400), fontSize: 18, letterSpacing: -0.14, color: colors.ink, flexShrink: 1 },
    excerpt: { fontFamily: serif(300), fontSize: 16, lineHeight: 23, color: colors.muted, marginTop: 5 },
    meta: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 0.3, color: colors.faint2, marginTop: 8 },
  });
}
