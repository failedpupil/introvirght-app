import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { useApp } from '../state/AppState';
import { fullDate } from '../utils/date';

/**
 * The payoff screen (RITUALS_ADDENDUM.md §2). Deliberately the largest reading surface in the
 * app — this is the most important text the product ever shows a user.
 */
export function LetterOpenScreen() {
  const { letters, openLetterId, navigate, goBack } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const letter = letters.find((l) => l.id === openLetterId);

  if (!letter) {
    return (
      <View style={styles.root}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.back}>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.missing}>That letter is not here.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable onPress={goBack} hitSlop={10} style={styles.back}>
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>

      <Text style={styles.eyebrow}>Now opened</Text>
      <Text style={styles.wrote}>You wrote this on {fullDate(new Date(letter.writtenAtMs))}</Text>

      <View style={styles.rule} />
      <Text style={styles.body}>{letter.body}</Text>
      <View style={styles.rule} />

      <Text style={styles.after}>It stays in your letters now. You can read it again whenever.</Text>

      {/* Opening a letter is the best moment to seal the next one. */}
      <Pressable onPress={() => navigate('newLetter')} style={styles.cta}>
        <Text style={styles.ctaLabel}>Write one back</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper },
    content: { paddingTop: 66, paddingHorizontal: 30, paddingBottom: 54 },
    back: { alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 22 },
    backLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint },
    eyebrow: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.71, textTransform: 'uppercase', color: colors.gold },
    wrote: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 22, lineHeight: 32, color: colors.muted, marginTop: 12 },
    rule: { height: 1, backgroundColor: colors.hair, marginVertical: 26 },
    body: { fontFamily: serif(300), fontSize: 22, lineHeight: 37, color: colors.ink },
    after: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 17, lineHeight: 27, color: colors.muted },
    cta: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.ink, paddingVertical: 13, paddingHorizontal: 26, marginTop: 30 },
    ctaLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.ink },
    missing: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 18, color: colors.faint, paddingHorizontal: 30, paddingTop: 20 },
  });
}
