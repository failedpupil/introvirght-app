import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { useApp } from '../state/AppState';
import { useEchoes } from '../echoes/EchoesState';

const MAX_NAME = 24;
const MIN_NAME = 2;

/**
 * Choosing the name that sits under your echoes (RITUALS_ADDENDUM.md §1).
 *
 * The live preview is the point of the screen: the consequence of the name is visible before
 * it is committed, so nobody discovers what they picked by seeing it on the feed.
 */
export function NamingScreen() {
  const { goBack, navigate, data, setEchoName } = useApp();
  const { renameEchoes } = useEchoes();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [draft, setDraft] = useState(data.echoName);

  const trimmed = draft.trim();
  const canSave = trimmed.length >= MIN_NAME;

  const save = () => {
    if (!canSave) return;
    setEchoName(trimmed);
    // Renaming reaches the echoes already on the feed, so the byline never disagrees with
    // the name just chosen (§1). Harmless on first naming — there is nothing to rename yet.
    renameEchoes(trimmed);
    // Replace, so Back from Echoes never lands the user on the naming screen again.
    navigate('echoes', { replace: true });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable onPress={goBack} hitSlop={10} style={styles.back}>
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>

      <Text style={styles.eyebrow}>Your name in Echoes</Text>
      <Text style={styles.title}>What should sit under what you write?</Text>
      <Text style={styles.sub}>
        Your own name, a first name, or something only you understand. You can change it whenever you like.
      </Text>

      <TextInput
        value={draft}
        onChangeText={(t) => setDraft(t.slice(0, MAX_NAME))}
        placeholder="your name"
        placeholderTextColor={colors.placeholder}
        style={styles.input}
        autoFocus
        maxLength={MAX_NAME}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={save}
      />

      <View style={styles.preview}>
        <Text style={styles.previewEyebrow}>How it will look</Text>
        <Text style={styles.previewBody}>
          Some days the quiet is the best thing in the house.
        </Text>
        <View style={styles.previewByline}>
          <Text style={styles.previewMark}>○</Text>
          <Text style={styles.previewName}>{trimmed || 'your name'}</Text>
        </View>
      </View>

      <Pressable
        onPress={save}
        disabled={!canSave}
        style={[styles.cta, { borderColor: canSave ? colors.ink : colors.faint }]}
      >
        <Text style={[styles.ctaLabel, { color: canSave ? colors.ink : colors.faint }]}>Write as this</Text>
      </Pressable>

      <Text style={styles.footer}>
        This name is the only thing others see. No email, no photo, no follower count, no profile to visit.
      </Text>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper },
    content: { paddingTop: 74, paddingHorizontal: 34, paddingBottom: 44 },
    back: { alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 22 },
    backLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint },
    eyebrow: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.71, textTransform: 'uppercase', color: colors.faint },
    title: { fontFamily: serif(400), fontSize: 30, lineHeight: 36, letterSpacing: -0.57, color: colors.ink, marginTop: 14 },
    sub: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 18, lineHeight: 27, color: colors.muted, marginTop: 12 },
    input: {
      fontFamily: serif(300),
      fontSize: 28,
      color: colors.ink,
      paddingVertical: 10,
      marginTop: 30,
      borderBottomWidth: 1,
      borderBottomColor: colors.hair3,
    },
    preview: { backgroundColor: colors.paperSunk, paddingVertical: 20, paddingHorizontal: 22, marginTop: 28 },
    previewEyebrow: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.faint },
    previewBody: { fontFamily: serif(300), fontSize: 19, lineHeight: 30, color: colors.ink2, marginTop: 12 },
    previewByline: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
    previewMark: { fontSize: 12, color: colors.faint },
    previewName: { fontFamily: sans(400), fontSize: 10, letterSpacing: 0.4, color: colors.muted },
    cta: { alignSelf: 'flex-start', borderWidth: 1, paddingVertical: 13, paddingHorizontal: 26, marginTop: 32 },
    ctaLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase' },
    footer: { fontFamily: sans(400), fontSize: 10, lineHeight: 17, letterSpacing: 0.3, color: colors.faint, marginTop: 26 },
  });
}
