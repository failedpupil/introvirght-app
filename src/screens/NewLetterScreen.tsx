import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { useApp } from '../state/AppState';
import { LetterHorizon } from '../state/types';
import { HORIZONS, MIN_LETTER_CHARS } from '../utils/letters';

/**
 * Writing and sealing a letter (RITUALS_ADDENDUM.md §2).
 *
 * Sealing is irreversible, so the footer says so plainly before the button is live rather than
 * asking for a confirmation afterwards.
 */
export function NewLetterScreen() {
  const { goBack, navigate, sealLetter } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [draft, setDraft] = useState('');
  const [horizon, setHorizon] = useState<LetterHorizon>('month');

  const trimmed = draft.trim();
  const canSeal = trimmed.length >= MIN_LETTER_CHARS;

  const seal = () => {
    if (!canSeal) return;
    sealLetter(trimmed, horizon);
    navigate('letters', { replace: true });
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Text style={styles.topLabel}>Cancel</Text>
        </Pressable>
        <Text style={styles.topTitle}>To later</Text>
        <Pressable onPress={seal} hitSlop={8} disabled={!canSeal}>
          <Text style={[styles.topLabel, { color: canSeal ? colors.ink : colors.faint }]}>Seal</Text>
        </Pressable>
      </View>

      <View style={styles.horizonRow}>
        {HORIZONS.map((h) => (
          <Pressable key={h.id} onPress={() => setHorizon(h.id)}>
            <Text
              style={[
                styles.horizonLabel,
                {
                  color: horizon === h.id ? colors.ink : colors.faint,
                  borderBottomColor: horizon === h.id ? colors.ink : 'transparent',
                },
              ]}
            >
              {h.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 22 }} showsVerticalScrollIndicator={false}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Dear you — by the time you read this…"
          placeholderTextColor={colors.placeholder}
          multiline
          textAlignVertical="top"
          style={styles.textarea}
          autoFocus
        />
        <Text style={styles.footnote}>
          {canSeal ? 'You will not be able to open this early.' : 'A few more words first.'}
        </Text>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 58 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 6, paddingBottom: 14 },
    topLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint },
    topTitle: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.ink4 },
    horizonRow: { flexDirection: 'row', gap: 22, paddingHorizontal: 26, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.hair2 },
    horizonLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase', paddingVertical: 3, borderBottomWidth: 1 },
    textarea: { fontFamily: serif(300), fontSize: 21, lineHeight: 35, color: colors.ink, minHeight: 180 },
    footnote: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 0.4, color: colors.faint, lineHeight: 17, marginTop: 18, marginBottom: 30 },
  });
}
