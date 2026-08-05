import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { colors } from '../theme/colors';
import { serif, sans } from '../theme/fonts';
import { Kicker, PrimaryButton } from '../components/Basics';
import { useApp } from '../state/AppState';

const TIMES = [
  { label: '21:00', note: 'before the wind-down' },
  { label: '21:30', note: 'suggested' },
  { label: '23:00', note: 'late, like you' },
  { label: 'No reminder', note: 'I’ll remember' },
];

export function RemindScreen() {
  const { data, setRemindAt, completeOnboarding, reset } = useApp();

  const finish = async (askPermission: boolean) => {
    completeOnboarding();
    if (askPermission && data.remindAt !== 'No reminder') {
      try {
        await Notifications.requestPermissionsAsync();
      } catch {
        // permission prompt declined or unavailable — the diary works the same either way
      }
    }
    reset('today');
  };

  return (
    <View style={styles.root}>
      <View style={{ marginTop: 'auto' }}>
        <Kicker style={{ marginBottom: 16 }}>Last thing</Kicker>
        <Text style={styles.title}>One reminder a day. Never a streak.</Text>
        <Text style={styles.sub}>If you miss a day, nothing breaks and nothing is counted.</Text>
        <View style={{ marginTop: 30 }}>
          {TIMES.map((t) => (
            <Pressable
              key={t.label}
              onPress={() => setRemindAt(t.label)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.paperSunk }]}
            >
              <Text style={[styles.rowLabel, { color: data.remindAt === t.label ? colors.ink : colors.ink4 }]}>{t.label}</Text>
              <Text style={styles.rowNote}>{t.note}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={{ marginTop: 'auto', paddingTop: 30, gap: 16 }}>
        <PrimaryButton label="Allow one reminder" onPress={() => finish(true)} />
        <Pressable onPress={() => finish(false)} style={{ padding: 4, alignSelf: 'center' }}>
          <Text style={styles.skip}>I’ll come to it myself</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingTop: 74, paddingHorizontal: 34, paddingBottom: 46 },
  title: { fontFamily: serif(400), fontSize: 31, lineHeight: 38, letterSpacing: -0.5, color: colors.ink, maxWidth: 290 },
  sub: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 18, lineHeight: 27, color: colors.muted, marginTop: 14, maxWidth: 290 },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
  },
  rowLabel: { fontFamily: serif(300), fontSize: 20 },
  rowNote: { fontFamily: sans(400), fontSize: 10, letterSpacing: 0.4, color: colors.faint },
  skip: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint },
});
