import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputContentSizeChangeEventData,
  View,
} from 'react-native';
import { colors, diaryMood, energyColor } from '../theme/colors';
import { serif, sans } from '../theme/fonts';
import { Kicker } from '../components/Basics';
import { TabPeopleIcon } from '../icons/Icons';
import { useApp } from '../state/AppState';
import { TEMPLATES, NUDGES, PICKABLE_MOODS, TemplateId } from '../data/content';
import { TAGGABLE_RINGS } from '../data/people';
import { PickableMood } from '../state/types';
import { wordCount } from '../utils/words';
import { niceDate } from '../utils/date';

/** Exact — the ruled lines are drawn from this, so text drifts off the rules if it changes. */
const LINE_HEIGHT = 33.6;
const MIN_BODY_HEIGHT = 196;

function timeOnPageLabel(openedAtMs: number | null, nowMs: number): string {
  if (openedAtMs == null) return 'Just opened';
  const seconds = Math.max(0, Math.floor((nowMs - openedAtMs) / 1000));
  if (seconds < 15) return 'Just opened';
  if (seconds < 60) return 'Started a moment ago';
  const minutes = Math.floor(seconds / 60);
  return minutes === 1 ? '1 minute in' : `${minutes} minutes in`;
}

export function WriteScreen() {
  const {
    data,
    people,
    todayIso,
    setDraftText,
    setDraftTemplate,
    setDraftMood,
    beginDraftClock,
    tagDraftPerson,
    foldInFragments,
    sealEntry,
    goBack,
    navigate,
  } = useApp();

  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(MIN_BODY_HEIGHT);
  const [taggerOpen, setTaggerOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [pendingCaret, setPendingCaret] = useState<number | null>(null);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const tpl = TEMPLATES.find((t) => t.id === data.draftTemplate) || TEMPLATES[0];
  const wc = wordCount(data.draftText);
  const nudgesAllowed = data.nudgePref !== 'no';

  useEffect(() => {
    beginDraftClock();
  }, [beginDraftClock]);

  // One 20s tick drives the "4 minutes in" label. Only this small string re-renders.
  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 20_000);
    return () => clearInterval(tick);
  }, []);

  const arm = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (nudgesAllowed && data.draftText.trim().length > 20) setNudgeVisible(true);
    }, 4500);
  }, [nudgesAllowed, data.draftText]);

  useEffect(() => {
    arm();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [arm]);

  useEffect(() => {
    if (nudgeVisible) {
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [nudgeVisible, fade]);

  /** Enter inside a "3. " line continues the list as "4. ". No other markdown behaviour. */
  const onChangeText = (next: string) => {
    const prev = data.draftText;
    setNudgeVisible(false);

    if (next.length === prev.length + 1) {
      let i = 0;
      while (i < prev.length && prev[i] === next[i]) i++;
      if (next[i] === '\n') {
        const lineStart = next.lastIndexOf('\n', i - 1) + 1;
        const match = next.slice(lineStart, i).match(/^(\d+)\.\s/);
        if (match) {
          const marker = `${parseInt(match[1], 10) + 1}. `;
          setDraftText(next.slice(0, i + 1) + marker + next.slice(i + 1));
          setPendingCaret(i + 1 + marker.length);
          return;
        }
      }
    }
    setDraftText(next);
  };

  const onContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    setBodyHeight(Math.max(MIN_BODY_HEIGHT, e.nativeEvent.contentSize.height));
  };

  const pickTemplate = (id: TemplateId) => {
    const t = TEMPLATES.find((x) => x.id === id)!;
    setDraftTemplate(id);
    if (t.scaffold && !data.draftText.trim()) setDraftText(t.scaffold);
    setNudgeVisible(false);
  };

  const useNudge = () => {
    setDraftText(data.draftText.replace(/\s*$/, '') + '\n\n' + NUDGES[data.nudgeIdx % NUDGES.length] + '\n');
    setNudgeVisible(false);
  };

  const toggleMood = (m: PickableMood) => setDraftMood(data.draftMood === m ? null : m);

  const taggablePeople = useMemo(
    () => people.filter((p) => TAGGABLE_RINGS.includes(p.closeness)),
    [people]
  );

  const taggedNames = useMemo(
    () => data.draftPeople.map((id) => people.find((p) => p.id === id)?.name).filter(Boolean).join(', '),
    [data.draftPeople, people]
  );

  const tagPerson = (personId: string, name: string) => {
    tagDraftPerson(personId);
    const existing = data.draftText.replace(/\s*$/, '');
    setDraftText(existing ? `${existing} ${name}` : name);
  };

  const unfoldedFragments =
    data.todayFragmentsIso === todayIso
      ? data.todayFragments.filter((f) => !data.draftFoldedFragmentIds.includes(f.id))
      : [];

  const canSeal = wc > 3;
  const seal = () => {
    if (!canSeal) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    sealEntry();
    navigate('sealed', { replace: true });
  };

  const ruleCount = Math.ceil(bodyHeight / LINE_HEIGHT) + 1;
  const moodLabel = data.draftMood
    ? PICKABLE_MOODS.find((m) => m.id === data.draftMood)!.label
    : 'Optional';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Text style={styles.topLabel}>Close</Text>
        </Pressable>
        <Text style={styles.draftState}>Draft</Text>
        <Pressable onPress={seal} hitSlop={8} disabled={!canSeal}>
          <Text style={[styles.topLabel, { color: canSeal ? colors.ink : colors.faint }]}>Seal</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tplRow}
        contentContainerStyle={{ gap: 18, paddingHorizontal: 22 }}
      >
        {TEMPLATES.map((t) => {
          const active = t.id === data.draftTemplate;
          return (
            <Pressable key={t.id} onPress={() => pickTemplate(t.id)} style={[styles.tplBtn, active && { borderBottomColor: colors.ink }]}>
              <Text style={[styles.tplLabel, { color: active ? colors.ink : colors.faint }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.bodyHeader}>
          <Kicker color={colors.faint2}>{niceDate(new Date())} · {tpl.name}</Kicker>
          <Text style={styles.timeOnPage}>{timeOnPageLabel(data.draftOpenedAtMs, nowMs)}</Text>
        </View>

        {/* Ruled paper: 1px lines behind a transparent input, scrolling with the content. */}
        <View style={{ marginTop: 14 }}>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height: bodyHeight }]}>
            {Array.from({ length: ruleCount }).map((_, i) => (
              <View key={i} style={[styles.rule, { top: LINE_HEIGHT * (i + 1) - 1 }]} />
            ))}
          </View>
          <TextInput
            value={data.draftText}
            onChangeText={onChangeText}
            onContentSizeChange={onContentSizeChange}
            selection={pendingCaret == null ? undefined : { start: pendingCaret, end: pendingCaret }}
            onSelectionChange={() => setPendingCaret(null)}
            placeholder={tpl.ph}
            placeholderTextColor={colors.placeholder}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
            style={[styles.textarea, { height: bodyHeight }]}
            autoFocus
          />
        </View>

        {unfoldedFragments.length > 0 && (
          <Pressable
            onPress={foldInFragments}
            style={({ pressed }) => [styles.foldRow, pressed && { backgroundColor: colors.paperSunkHover }]}
          >
            <Text style={styles.foldPlus}>+</Text>
            <Text style={styles.foldLabel}>
              Fold in {unfoldedFragments.length} fragment{unfoldedFragments.length === 1 ? '' : 's'} from today
            </Text>
            <Text style={styles.foldAction}>Fold in</Text>
          </Pressable>
        )}

        {nudgeVisible && (
          <Animated.View style={[styles.nudge, { opacity: fade }]}>
            <Kicker size={9}>If you've stalled</Kicker>
            <Text style={styles.nudgeText}>{NUDGES[data.nudgeIdx % NUDGES.length]}</Text>
            <View style={{ flexDirection: 'row', gap: 20, marginTop: 16 }}>
              <Pressable onPress={useNudge}>
                <Text style={styles.nudgeAction}>Write to this</Text>
              </Pressable>
              <Pressable onPress={() => setNudgeVisible(false)}>
                <Text style={[styles.nudgeAction, { color: colors.faint }]}>Not now</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {taggerOpen && taggablePeople.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 22, paddingVertical: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {taggablePeople.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => tagPerson(p.id, p.name)}
              style={({ pressed }) => [styles.chip, pressed && { borderColor: colors.ink }]}
            >
              <View style={[styles.chipDot, { backgroundColor: energyColor[p.energy] }]} />
              <Text style={styles.chipName}>{p.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View style={styles.moodRow}>
          <Text style={styles.moodKicker}>Today felt</Text>
          <View style={styles.moodDots}>
            {PICKABLE_MOODS.map((m) => {
              const selected = data.draftMood === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => toggleMood(m.id)}
                  style={[styles.moodBtn, selected && { borderColor: colors.ink }]}
                  hitSlop={4}
                >
                  <View style={[styles.moodDot, { backgroundColor: diaryMood[m.id] }]} />
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.moodLabel}>{moodLabel}</Text>
        </View>

        <View style={styles.actionRow}>
          {taggablePeople.length > 0 && (
            <Pressable onPress={() => setTaggerOpen((v) => !v)} style={styles.action} hitSlop={6}>
              <TabPeopleIcon size={15} color={taggerOpen ? colors.ink : colors.muted} />
              <Text style={[styles.actionLabel, taggerOpen && { color: colors.ink }]} numberOfLines={1}>
                {taggedNames || 'Someone in this'}
              </Text>
            </Pressable>
          )}

          {nudgesAllowed && (
            <Pressable onPress={() => setNudgeVisible(true)} style={styles.action} hitSlop={6}>
              <Text style={styles.askGlyph}>?</Text>
              <Text style={styles.actionLabel}>Ask me something</Text>
            </Pressable>
          )}

          <View style={{ flex: 1 }} />
          <Text style={styles.footerWords}>{wc === 0 ? 'No words yet' : `${wc} words`}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingTop: 58 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 6, paddingBottom: 12 },
  topLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint },
  draftState: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint2 },
  tplRow: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.hair2, paddingBottom: 12 },
  tplBtn: { paddingTop: 2, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  tplLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase' },

  body: { flex: 1 },
  bodyHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  timeOnPage: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 0.4, color: '#D3CCC1' },
  rule: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.echoHair },
  textarea: {
    fontFamily: serif(300),
    fontSize: 20,
    lineHeight: LINE_HEIGHT,
    letterSpacing: -0.06,
    color: colors.ink2,
    padding: 0,
    backgroundColor: 'transparent',
  },

  foldRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.paperSunk, paddingVertical: 13, paddingHorizontal: 16, marginTop: 20 },
  foldPlus: { fontFamily: serif(300), fontSize: 15, color: colors.muted },
  foldLabel: { flex: 1, fontFamily: serif(300), fontSize: 16.5, color: colors.ink3 },
  foldAction: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.muted },

  nudge: { marginTop: 18, padding: 18, paddingHorizontal: 20, backgroundColor: colors.paperSunk },
  nudgeText: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 19, lineHeight: 28, color: colors.ink3, marginTop: 10 },
  nudgeAction: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.ink },

  chipRow: { flexGrow: 0, borderTopWidth: 1, borderTopColor: colors.hair2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.dotRing, borderRadius: 2, paddingVertical: 9, paddingHorizontal: 14 },
  chipDot: { width: 5, height: 5, borderRadius: 2.5 },
  chipName: { fontFamily: serif(300), fontSize: 16, color: colors.ink2 },

  footer: { borderTopWidth: 1, borderTopColor: colors.hair2, backgroundColor: colors.paper, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 18, gap: 14 },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  moodKicker: { fontFamily: sans(400), fontSize: 9, letterSpacing: 1.44, textTransform: 'uppercase', color: colors.faint },
  moodDots: { flexDirection: 'row', gap: 8 },
  moodBtn: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  moodDot: { width: 9, height: 9, borderRadius: 4.5 },
  moodLabel: { flex: 1, textAlign: 'right', fontFamily: sans(400), fontSize: 9.5, letterSpacing: 0.4, color: colors.faint2 },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  actionLabel: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted, flexShrink: 1 },
  askGlyph: { fontFamily: serif(300), fontSize: 15, color: colors.muted, width: 15, textAlign: 'center' },
  footerWords: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 0.4, color: colors.faint2 },
});
