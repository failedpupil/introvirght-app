import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, diaryMood } from '../theme/colors';
import { serif, sans } from '../theme/fonts';
import { BackLink } from '../components/Basics';
import { useApp } from '../state/AppState';
import { fullDate, isoToDate, timeLabel } from '../utils/date';

export function EntryScreen() {
  const { data, openEntryId, goEntries } = useApp();
  const entry = data.entries.find((e) => e.id === openEntryId);

  if (!entry) {
    return (
      <View style={styles.root}>
        <BackLink label="Entries" onPress={goEntries} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 26, paddingTop: 8 }}>
        <BackLink label="Entries" onPress={goEntries} />
      </View>
      <View style={{ paddingHorizontal: 30, paddingTop: 18 }}>
        <View style={styles.dateRow}>
          <View style={[styles.dot, { backgroundColor: diaryMood[entry.mood] }]} />
          <Text style={styles.dateKicker}>{fullDate(isoToDate(entry.iso))}</Text>
        </View>
        <Text style={styles.title}>{entry.title}</Text>
        <View style={styles.hairline} />
        <Text style={styles.body}>{entry.body}</Text>
        <View style={styles.footer}>
          <Text style={styles.footerText}>{entry.wordCount} words</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.footerText}>Sealed</Text>
        </View>
        <View style={{ height: 30 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingTop: 58 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 16 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dateKicker: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: colors.faint },
  title: { fontFamily: serif(400), fontSize: 29, lineHeight: 35, letterSpacing: -0.5, color: colors.ink },
  hairline: { height: 1, backgroundColor: colors.hair, marginVertical: 24 },
  body: { fontFamily: serif(300), fontSize: 19, lineHeight: 33, color: colors.ink2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 34, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.hair2 },
  footerText: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 0.6, color: colors.faint2 },
});
