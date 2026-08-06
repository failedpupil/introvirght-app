import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { Kicker } from '../components/Basics';
import { EntryRow } from '../components/EntryRow';
import { useApp } from '../state/AppState';
import { fullDate, isoToDate, toIso } from '../utils/date';

export function SearchScreen() {
  const { data, goEntries, navigate, openSearchQuery } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [q, setQ] = useState(openSearchQuery ?? '');
  const [recents, setRecents] = useState<string[]>([]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data.entries;
    return data.entries.filter((e) => (e.title + ' ' + e.body).toLowerCase().includes(term));
  }, [q, data.entries]);

  const resultCount = (() => {
    const term = q.trim();
    if (!term) return `All ${data.entries.length} page${data.entries.length === 1 ? '' : 's'}`;
    const n = results.length;
    return n ? `${n} page${n === 1 ? '' : 's'} mention “${term}”` : `Nothing yet for “${term}”`;
  })();

  const oneYearAgoIso = toIso(new Date(new Date().setFullYear(new Date().getFullYear() - 1)));
  const oneYearAgo = data.entries.find((e) => e.iso === oneYearAgoIso);

  const commit = () => {
    const term = q.trim();
    if (!term) return;
    setRecents((r) => [term, ...r.filter((x) => x !== term)].slice(0, 4));
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 26 }}>
        <View style={styles.inputRow}>
          <TextInput
            value={q}
            onChangeText={setQ}
            onSubmitEditing={commit}
            placeholder="a word, a person, a feeling"
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            autoFocus
          />
          <Pressable onPress={goEntries} hitSlop={8}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>
        {recents.length > 0 && (
          <View style={styles.chips}>
            {recents.map((r) => (
              <Pressable key={r} onPress={() => setQ(r)} style={({ pressed }) => [styles.chip, pressed && { borderColor: colors.ink }]}>
                <Text style={styles.chipLabel}>{r}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Kicker style={{ marginTop: 28 }}>{resultCount}</Kicker>
      </View>
      <View>
        {results.map((e) => (
          <EntryRow key={e.id} entry={e} onPress={() => navigate('entry', { entryId: e.id })} showMoodAndMeta={false} />
        ))}
      </View>
      {oneYearAgo && (
        <View style={styles.oneYear}>
          <Kicker>One year ago today</Kicker>
          <Text style={styles.quote}>“{oneYearAgo.body.slice(0, 220)}{oneYearAgo.body.length > 220 ? '…' : ''}”</Text>
          <Text style={styles.quoteMeta}>{fullDate(isoToDate(oneYearAgo.iso)).split(', ')[1]}, last year</Text>
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 66 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: 12 },
    input: { flex: 1, fontFamily: serif(300), fontSize: 22, color: colors.ink },
    done: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.hair },
    chipLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted },
    oneYear: { paddingHorizontal: 26, paddingTop: 30, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.hair2 },
    quote: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 19, lineHeight: 29, color: colors.ink3, marginTop: 14 },
    quoteMeta: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 0.3, color: colors.faint2, marginTop: 12 },
  });
}
