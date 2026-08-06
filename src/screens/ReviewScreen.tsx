import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { BackLink, Kicker } from '../components/Basics';
import { useApp } from '../state/AppState';
import { computeWeeklyLetter } from '../utils/review';

export function ReviewScreen() {
  const { data, goEntries } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const letter = useMemo(() => computeWeeklyLetter(data.entries), [data.entries]);

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 26 }}>
        <BackLink label="Entries" onPress={goEntries} />
      </View>
      <View style={{ paddingHorizontal: 26, paddingTop: 20 }}>
        <Kicker>{letter.rangeLabel}</Kicker>
        <Text style={styles.title}>Your week, without a score.</Text>
        <View style={styles.hairline} />
        <View style={{ gap: 20 }}>
          {letter.noticed.map((n) => (
            <View key={n.label}>
              <Text style={styles.noticedLabel}>{n.label.toUpperCase()}</Text>
              <Text style={styles.noticedText}>{n.text}</Text>
            </View>
          ))}
        </View>
        <View style={styles.questionsBlock}>
          <Text style={styles.noticedLabel}>Two questions for next week</Text>
          <View style={{ gap: 14, marginTop: 14 }}>
            <Text style={styles.question}>{letter.questions[0]}</Text>
            <Text style={styles.question}>{letter.questions[1]}</Text>
          </View>
        </View>
        <Text style={styles.footnote}>Written by looking at word patterns on your device only. No one else has seen this, including us.</Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 58 },
    title: { fontFamily: serif(400), fontSize: 28, lineHeight: 35, letterSpacing: -0.5, color: colors.ink, marginTop: 12, maxWidth: 300 },
    hairline: { height: 1, backgroundColor: colors.hair, marginVertical: 24 },
    noticedLabel: { fontFamily: sans(400), fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.faint2, marginBottom: 8 },
    noticedText: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 20, lineHeight: 30, color: colors.ink2 },
    questionsBlock: { marginTop: 30, paddingVertical: 22, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.hair2 },
    question: { fontFamily: serif(300), fontSize: 19, lineHeight: 28, color: colors.ink },
    footnote: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 15, lineHeight: 24, color: colors.faint, paddingVertical: 18 },
  });
}
