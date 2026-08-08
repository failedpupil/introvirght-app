import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { PAPERS } from '../theme/palettes';
import { BorderedButton } from '../components/Basics';
import { ChevronRight } from '../icons/Icons';
import { useApp } from '../state/AppState';
import { useEchoes } from '../echoes/EchoesState';
import { fullDate } from '../utils/date';
import { exportEntriesAsPlainText } from '../utils/export';
import { isReadyUnread, sealedCount } from '../utils/letters';
import { buildThread, daysWritten, THREAD_DAYS, whatThePagesKnow } from '../utils/thread';
import { DiaryEntry } from '../state/types';

export function YouScreen() {
  const { data, navigate, setOnboardStep, reset, letters } = useApp();
  const { signedIn, signOut } = useEchoes();
  const { colors, paper } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const readyCount = letters.filter((l) => isReadyUnread(l)).length;
  const sealedNow = sealedCount(letters);

  const pages = data.entries.length;
  const words = data.entries.reduce((s, e) => s + e.wordCount, 0);
  const since = data.startedAtMs ? fullDate(new Date(data.startedAtMs)) : fullDate(new Date());
  const paperName = PAPERS.find((p) => p.id === paper)?.name ?? 'Ivory';

  const onEchoesAccount = () => {
    if (!signedIn) return navigate('signin');
    Alert.alert('Echoes account', 'Sign out of Echoes on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const rows: { label: string; value: string; color: string; onPress: () => void }[] = [
    { label: 'Introvirght Quiet', value: data.plan === 'quiet' ? 'Quiet plan' : 'Free plan', color: colors.gold, onPress: () => navigate('paywall') },
    { label: 'Appearance', value: paperName, color: colors.ink, onPress: () => navigate('appearance') },
    { label: 'Echoes account', value: signedIn ? 'Google · signed in' : 'Not signed in', color: signedIn ? colors.ink : colors.muted, onPress: onEchoesAccount },
    { label: 'Echoes name', value: data.echoName || 'Not chosen', color: data.echoName ? colors.ink : colors.muted, onPress: () => navigate('naming') },
    {
      label: 'Letters to later',
      value: readyCount > 0 ? `${readyCount} ready` : `${sealedNow} sealed`,
      color: readyCount > 0 ? colors.gold : colors.ink,
      onPress: () => navigate('letters'),
    },
    { label: 'Rage page', value: 'Nothing is kept', color: colors.muted, onPress: () => navigate('rage') },
    { label: 'Privacy & encryption', value: 'End-to-end', color: colors.ink, onPress: () => navigate('privacy') },
    { label: 'Fingerprint lock', value: 'On', color: colors.ink, onPress: () => {} },
    {
      label: 'Daily question',
      value: data.nudgePref === 'no' ? 'Off' : 'One a day',
      color: colors.ink,
      onPress: () => {
        setOnboardStep(2);
        navigate('onboard');
      },
    },
    { label: 'Nudge when I stall', value: data.nudgePref === 'no' ? 'Off' : 'On', color: colors.ink, onPress: () => {} },
    { label: 'Evening reminder', value: data.remindAt, color: colors.muted, onPress: () => navigate('remind') },
    { label: 'Export everything', value: 'Plain text', color: colors.muted, onPress: () => exportEntriesAsPlainText(data.entries) },
  ];

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 26 }}>
        <Text style={styles.name}>{data.name || 'You'}</Text>
        <Text style={styles.since}>Writing here since {since}.</Text>
      </View>
      <View style={styles.statsRow}>
        <Stat n={String(pages)} label="Pages" />
        <Stat n={words.toLocaleString()} label="Words" />
        <Stat n="0" label="Readers" last />
      </View>
      <View style={{ paddingHorizontal: 26 }}>
        {rows.map((r) => (
          <Pressable key={r.label} onPress={r.onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: r.color }]}>{r.value}</Text>
              <ChevronRight size={13} />
            </View>
          </Pressable>
        ))}
      </View>
      <Thread entries={data.entries} />
      <PagesKnow entries={data.entries} />

      <Text style={styles.footnote}>Everything you write stays on this device. There is no feed, no follower count, nobody to perform for.</Text>
      <View style={{ paddingHorizontal: 26, paddingTop: 22 }}>
        <BorderedButton label="Close the diary" onPress={() => reset('lock')} />
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

/**
 * A frequency visual with no fail state (RITUALS_ADDENDUM.md §3). Deliberately not a streak:
 * height and colour encode how much was written, and a day with nothing is a thinner stroke
 * rather than a break. Nothing here is red, nothing says "missed", and there is no target.
 */
function Thread({ entries }: { entries: DiaryEntry[] }) {
  const { colors } = useTheme();
  const thread = useMemo(() => buildThread(entries), [entries]);
  const written = daysWritten(thread);
  const missed = THREAD_DAYS - written;

  if (entries.length === 0) return null;

  const strokeFor = (count: number) => {
    if (count === 0) return { height: 7, color: colors.hair };
    if (count === 1) return { height: 15, color: colors.chevron };
    if (count === 2) return { height: 22, color: colors.faint };
    return { height: 29, color: colors.ink };
  };

  return (
    <View style={{ paddingHorizontal: 26, paddingTop: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 34, gap: 4 }}>
        {thread.map((d, i) => {
          const s = strokeFor(d.count);
          return <View key={i} style={{ flex: 1, height: s.height, backgroundColor: s.color }} />;
        })}
      </View>
      <Text style={{ fontFamily: serif(300), fontSize: 18, lineHeight: 27, color: colors.ink, marginTop: 16 }}>
        You wrote on {written} of the last {THREAD_DAYS} days.
      </Text>
      {missed > 0 && (
        <Text style={{ fontFamily: serif(300), fontStyle: 'italic', fontSize: 16, lineHeight: 25, color: colors.muted, marginTop: 6 }}>
          {missed} you did not. The line thins there — it does not break, and you did not lose anything.
        </Text>
      )}
    </View>
  );
}

/** Identity feedback rather than scorekeeping. A row with too little data behind it is omitted. */
function PagesKnow({ entries }: { entries: DiaryEntry[] }) {
  const { colors } = useTheme();
  const facts = useMemo(() => whatThePagesKnow(entries), [entries]);
  if (facts.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: 26, paddingTop: 30 }}>
      <Text style={{ fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.faint }}>
        What the pages know
      </Text>
      <View style={{ marginTop: 16, gap: 14 }}>
        {facts.map((f) => (
          <View key={f.label} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Text style={{ width: 108, fontFamily: sans(400), fontSize: 10, letterSpacing: 0.4, color: colors.faint, paddingTop: 5 }}>
              {f.label}
            </Text>
            <Text style={{ flex: 1, fontFamily: serif(300), fontSize: 18, lineHeight: 27, color: colors.ink }}>{f.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Stat({ n, label, last }: { n: string; label: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[{ flex: 1, paddingVertical: 20, paddingHorizontal: 16 }, !last && { borderRightWidth: 1, borderRightColor: colors.hair }]}>
      <Text style={{ fontFamily: serif(300), fontSize: 27, letterSpacing: -0.4, color: colors.ink }}>{n}</Text>
      <Text style={{ fontFamily: sans(400), fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase', color: colors.faint, marginTop: 6 }}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 66 },
    name: { fontFamily: serif(400), fontSize: 34, letterSpacing: -0.7, color: colors.ink },
    since: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 18, color: colors.muted, marginTop: 10 },
    statsRow: { flexDirection: 'row', marginTop: 28, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.hair },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 19, borderBottomWidth: 1, borderBottomColor: colors.hair2 },
    rowLabel: { fontFamily: serif(300), fontSize: 19, color: colors.ink },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    rowValue: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 0.4 },
    footnote: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 16, lineHeight: 24, color: colors.faint, paddingHorizontal: 26, paddingTop: 26 },
  });
}
