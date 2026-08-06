import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { useApp } from '../state/AppState';
import { useEchoes } from '../echoes/EchoesState';
import { FEELS, FeelId } from '../data/content';

const MAX = 280;

export function ComposeScreen() {
  const { goBack, navigate } = useApp();
  const { post } = useEchoes();
  const { colors, feelColor } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [draft, setDraft] = useState('');
  const [feel, setFeel] = useState<FeelId>('quiet');

  const left = MAX - draft.length;
  const canPost = draft.trim().length > 3;

  const release = () => {
    if (!canPost) return;
    post(feel, draft);
    navigate('echoes', { replace: true });
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Text style={styles.topLabel}>Cancel</Text>
        </Pressable>
        <Text style={[styles.counter, { color: left < 30 ? colors.warn : colors.faint2 }]}>{left} left</Text>
        <Pressable onPress={release} hitSlop={8} disabled={!canPost}>
          <Text style={[styles.topLabel, { color: canPost ? colors.ink : colors.faint }]}>Release</Text>
        </Pressable>
      </View>
      <View style={styles.feelRow}>
        {FEELS.map((f) => (
          <Pressable key={f.id} onPress={() => setFeel(f.id)}>
            <Text style={[styles.feelLabel, { color: feel === f.id ? colors.ink : colors.faint, borderBottomColor: feel === f.id ? feelColor[f.id] : 'transparent' }]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 22 }} showsVerticalScrollIndicator={false}>
        <TextInput
          value={draft}
          onChangeText={(t) => setDraft(t.slice(0, MAX))}
          placeholder="Only the feeling. No names, no story you would regret."
          placeholderTextColor={colors.placeholder}
          multiline
          textAlignVertical="top"
          style={styles.textarea}
          autoFocus
        />
        <Text style={styles.footnote}>Posted without a name · 280 characters · fades in 7 days</Text>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 58 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 6, paddingBottom: 14 },
    topLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint },
    counter: { fontFamily: sans(400), fontSize: 10, letterSpacing: 0.6 },
    feelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingHorizontal: 26, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.hair2 },
    feelLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase', paddingVertical: 3, borderBottomWidth: 1 },
    textarea: { fontFamily: serif(300), fontSize: 21, lineHeight: 34, color: colors.ink, minHeight: 150 },
    footnote: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 0.4, color: colors.faint, lineHeight: 17, marginTop: 18 },
  });
}
