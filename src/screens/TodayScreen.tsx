import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import { serif, sans } from '../theme/fonts';
import { Kicker } from '../components/Basics';
import { useApp } from '../state/AppState';
import { PROMPTS } from '../data/content';
import { dayCountLabel, fullDate, weekdayName } from '../utils/date';
import { wordCount } from '../utils/words';

function greetingFor(rhythm: string | null, now: Date): string {
  const h = now.getHours();
  if (rhythm === 'night' && (h >= 23 || h < 4)) return 'Late, as usual';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function TodayScreen() {
  const { data, todayIso, todaysEntry, cyclePrompt, addFragment, navigate, setDraftText } = useApp();
  const [frag, setFrag] = useState('');
  const now = useMemo(() => new Date(), []);

  const prompt = PROMPTS[data.promptIdx % PROMPTS.length];
  const wc = wordCount(data.draftText);

  const entryCta = todaysEntry ? 'Today is sealed' : 'Write today’s page';
  const entryCtaSub = todaysEntry
    ? 'Tap to read it back'
    : wc
    ? `${wc} words in progress`
    : 'Blank page · no title needed';

  const openEntryCta = () => {
    if (todaysEntry) navigate('entry', { entryId: todaysEntry.id });
    else navigate('write');
  };

  const answerPrompt = () => {
    setDraftText(prompt + '\n\n');
    navigate('write');
  };

  const submitFrag = () => {
    if (!frag.trim()) return;
    addFragment(frag);
    setFrag('');
  };

  const fragsToday = data.todayFragmentsIso === todayIso ? data.todayFragments : [];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 26 }}>
        <View style={styles.headerRow}>
          <View>
            <Kicker>{weekdayName(now)}</Kicker>
            <Text style={styles.date}>{fullDate(now).split(', ')[1]}</Text>
          </View>
          <Text style={styles.meta}>{greetingFor(data.rhythm, now)}{'\n'}{dayCountLabel(data.startedAtMs)}</Text>
        </View>
        <View style={styles.hairline} />
      </View>

      <View style={styles.promptBlock}>
        <Kicker color="#A39C91">Today's question</Kicker>
        <Text style={styles.prompt}>{prompt}</Text>
        <View style={styles.promptBtns}>
          <Pressable onPress={answerPrompt} style={({ pressed }) => [styles.answerBtn, { backgroundColor: pressed ? colors.inkHover : colors.ink }]}>
            <Text style={styles.answerLabel}>Answer</Text>
          </Pressable>
          <Pressable onPress={cyclePrompt} style={({ pressed }) => [styles.anotherBtn, pressed && { borderColor: colors.ink }]}>
            {({ pressed }) => <Text style={[styles.anotherLabel, pressed && { color: colors.ink }]}>Another</Text>}
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 26, paddingTop: 28 }}>
        <View style={styles.fragHeader}>
          <Kicker>Fragments</Kicker>
          <Text style={styles.fragCount}>{fragsToday.length} today</Text>
        </View>
        <View>
          {fragsToday.map((f, i) => (
            <View key={i} style={styles.fragRow}>
              <Text style={styles.fragAt}>{f.at}</Text>
              <Text style={styles.fragText}>{f.text}</Text>
            </View>
          ))}
        </View>
        <View style={styles.fragComposer}>
          <TextInput
            value={frag}
            onChangeText={setFrag}
            onSubmitEditing={submitFrag}
            placeholder="a line, a thought, anything"
            placeholderTextColor={colors.placeholder}
            style={styles.fragInput}
          />
          <Pressable onPress={submitFrag} hitSlop={8}>
            <Text style={[styles.addLabel, { color: frag.trim() ? colors.ink : colors.faint }]}>Add</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 26, paddingTop: 34 }}>
        <Pressable onPress={openEntryCta} style={({ pressed }) => [styles.pageCta, pressed && { borderColor: colors.ink }]}>
          <Text style={styles.pageCtaTitle}>{entryCta}</Text>
          <Text style={styles.pageCtaSub}>{entryCtaSub}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingTop: 66 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  date: { fontFamily: serif(400), fontSize: 38, lineHeight: 40, letterSpacing: -0.9, color: colors.ink, marginTop: 8 },
  meta: { fontFamily: sans(400), fontSize: 10, letterSpacing: 0.5, color: colors.faint, textAlign: 'right', lineHeight: 16 },
  hairline: { height: 1, backgroundColor: colors.hair, marginTop: 24 },
  promptBlock: { padding: 26, backgroundColor: colors.paperSunk, marginTop: 0 },
  prompt: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 25, lineHeight: 34, letterSpacing: -0.25, color: colors.ink, marginTop: 14 },
  promptBtns: { flexDirection: 'row', gap: 8, marginTop: 22 },
  answerBtn: { paddingVertical: 13, paddingHorizontal: 22, borderRadius: 2 },
  answerLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.paper },
  anotherBtn: { paddingVertical: 13, paddingHorizontal: 20, borderRadius: 2, borderWidth: 1, borderColor: colors.hair3 },
  anotherLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.muted },
  fragHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 },
  fragCount: { fontFamily: sans(400), fontSize: 10, color: colors.faint2 },
  fragRow: { flexDirection: 'row', gap: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.hair2 },
  fragAt: { fontFamily: sans(400), fontSize: 10, letterSpacing: 0.4, color: colors.faint2, width: 40, paddingTop: 4 },
  fragText: { fontFamily: serif(300), fontSize: 18, lineHeight: 27, color: colors.ink3, flex: 1 },
  fragComposer: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.hair2, paddingTop: 14, marginTop: 2 },
  fragInput: { flex: 1, fontFamily: serif(300), fontSize: 18, color: colors.ink },
  addLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', paddingVertical: 6 },
  pageCta: { padding: 24, borderWidth: 1, borderColor: colors.hair, borderRadius: 2, backgroundColor: colors.paper },
  pageCtaTitle: { fontFamily: serif(300), fontSize: 24, letterSpacing: -0.3, color: colors.ink },
  pageCtaSub: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 0.4, color: colors.faint, marginTop: 8 },
});
