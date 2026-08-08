import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { useApp } from '../state/AppState';
import { SealedLetter } from '../state/types';
import { niceDate } from '../utils/date';
import { excerpt } from '../utils/words';
import { statusLabel, statusOf } from '../utils/letters';

/**
 * The list of sealed letters (RITUALS_ADDENDUM.md §2).
 *
 * A sealed row is inert by construction: it is a plain View, not a Pressable, so there is no
 * press state to suppress and no handler that could later be pointed at `letterOpen`.
 */
export function LettersScreen() {
  const { letters, navigate, openLetter } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const now = Date.now();

  const ordered = useMemo(
    () => [...letters].sort((a, b) => b.writtenAtMs - a.writtenAtMs),
    [letters]
  );

  const open = (letter: SealedLetter) => {
    openLetter(letter.id);
    navigate('letterOpen', { letterId: letter.id });
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Letters to later</Text>
          <Pressable onPress={() => navigate('newLetter')} hitSlop={10}>
            <Text style={styles.write}>+ Write</Text>
          </Pressable>
        </View>
        <Text style={styles.sub}>
          Something you write today, sealed until a date you choose. You will not be able to open it
          early — that is what makes it worth reading.
        </Text>
      </View>

      {ordered.length === 0 && (
        <Text style={styles.empty}>Nothing sealed yet. The first one is usually the hardest to start.</Text>
      )}

      {ordered.map((letter) => {
        const status = statusOf(letter, now);
        const written = `Written ${niceDate(new Date(letter.writtenAtMs))}`;
        const right = statusLabel(letter, now);

        const rowBody =
          status === 'opened' ? (
            <Text style={styles.bodyLine}>{excerpt(letter.body, 120)}</Text>
          ) : status === 'ready' ? (
            <Text style={styles.bodyLine}>Sealed until you open it.</Text>
          ) : (
            <Text style={styles.sealedLine}>You cannot read this yet. That was the point.</Text>
          );

        const inner = (
          <>
            <View style={styles.rowTop}>
              <Text style={[styles.mark, status === 'ready' ? { color: colors.gold } : status === 'opened' ? { color: colors.chevron } : { color: colors.faint }]}>
                {status === 'ready' ? '●' : status === 'opened' ? '○' : '—'}
              </Text>
              <Text style={styles.written}>{written}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.status, status === 'ready' && { color: colors.gold }]}>{right}</Text>
            </View>
            {rowBody}
          </>
        );

        // Sealed letters are not tappable at all — no Pressable, so no hover or press state.
        if (status === 'sealed') {
          return (
            <View key={letter.id} style={styles.row}>
              {inner}
            </View>
          );
        }

        return (
          <Pressable
            key={letter.id}
            onPress={() => open(letter)}
            style={({ pressed }) => [
              styles.row,
              status === 'ready' && { backgroundColor: colors.paperSunk },
              pressed && { backgroundColor: colors.paperSunkHover },
            ]}
          >
            {inner}
          </Pressable>
        );
      })}

      <Text style={styles.footer}>
        A letter cannot be opened before its date — not by editing it, not by deleting it, not by
        asking us. Sealing one is the whole promise.
      </Text>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 66 },
    header: { paddingHorizontal: 26, paddingBottom: 22 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontFamily: serif(400), fontSize: 34, letterSpacing: -0.7, color: colors.ink },
    write: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase', color: colors.ink },
    sub: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 17, lineHeight: 26, color: colors.muted, marginTop: 10 },
    row: { paddingVertical: 22, paddingHorizontal: 26, borderTopWidth: 1, borderTopColor: colors.hair2 },
    rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    mark: { fontSize: 12 },
    written: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 0.4, color: colors.ink4 },
    status: { fontFamily: sans(400), fontSize: 10, letterSpacing: 0.6, color: colors.faint },
    bodyLine: { fontFamily: serif(300), fontSize: 17, lineHeight: 27, color: colors.ink2, marginTop: 11 },
    sealedLine: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 17, lineHeight: 27, color: colors.faint, marginTop: 11 },
    empty: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 17, lineHeight: 27, color: colors.faint, paddingHorizontal: 26, paddingTop: 26, borderTopWidth: 1, borderTopColor: colors.hair2 },
    footer: {
      fontFamily: serif(300),
      fontStyle: 'italic',
      fontSize: 15,
      lineHeight: 24,
      color: colors.faint,
      paddingHorizontal: 26,
      paddingTop: 28,
      paddingBottom: 30,
      borderTopWidth: 1,
      borderTopColor: colors.hair2,
    },
  });
}
