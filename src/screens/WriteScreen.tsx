import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/colors';
import { serif, sans } from '../theme/fonts';
import { Kicker } from '../components/Basics';
import { useApp } from '../state/AppState';
import { TEMPLATES, NUDGES, TemplateId } from '../data/content';
import { wordCount } from '../utils/words';
import { niceDate } from '../utils/date';

export function WriteScreen() {
  const { data, setDraftText, setDraftTemplate, sealEntry, goBack, navigate } = useApp();
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const tpl = TEMPLATES.find((t) => t.id === data.draftTemplate) || TEMPLATES[0];
  const wc = wordCount(data.draftText);

  const arm = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (data.nudgePref !== 'no' && data.draftText.trim().length > 20) {
        setNudgeVisible(true);
      }
    }, 4500);
  };

  useEffect(() => {
    arm();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (nudgeVisible) {
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [nudgeVisible, fade]);

  const onChangeText = (t: string) => {
    setDraftText(t);
    setNudgeVisible(false);
    arm();
  };

  const pickTemplate = (id: TemplateId) => {
    const t = TEMPLATES.find((x) => x.id === id)!;
    setDraftTemplate(id);
    if (t.scaffold && !data.draftText.trim()) setDraftText(t.scaffold);
    setNudgeVisible(false);
    arm();
  };

  const useNudge = () => {
    setDraftText(data.draftText.replace(/\s*$/, '') + '\n\n' + NUDGES[data.nudgeIdx % NUDGES.length] + '\n');
    setNudgeVisible(false);
    arm();
  };

  const dropNudge = () => {
    setNudgeVisible(false);
    arm();
  };

  const canSeal = wc > 3;
  const seal = () => {
    if (!canSeal) return;
    sealEntry();
    navigate('sealed', { replace: true });
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Text style={styles.topLabel}>Close</Text>
        </Pressable>
        <Text style={styles.wordCount}>{wc ? `${wc} words` : '—'}</Text>
        <Pressable onPress={seal} hitSlop={8} disabled={!canSeal}>
          <Text style={[styles.topLabel, { color: canSeal ? colors.ink : colors.faint }]}>Seal</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tplRow} contentContainerStyle={{ gap: 18, paddingHorizontal: 22 }}>
        {TEMPLATES.map((t) => {
          const active = t.id === data.draftTemplate;
          return (
            <Pressable key={t.id} onPress={() => pickTemplate(t.id)} style={[styles.tplBtn, active && { borderBottomColor: colors.ink }]}>
              <Text style={[styles.tplLabel, { color: active ? colors.ink : colors.faint }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView style={styles.body} contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 22 }} showsVerticalScrollIndicator={false}>
        <Kicker color={colors.faint2}>{niceDate(new Date())} · {tpl.name}</Kicker>
        <TextInput
          value={data.draftText}
          onChangeText={onChangeText}
          placeholder={tpl.ph}
          placeholderTextColor={colors.placeholder}
          multiline
          textAlignVertical="top"
          style={styles.textarea}
          autoFocus
        />
        {nudgeVisible && (
          <Animated.View style={[styles.nudge, { opacity: fade }]}>
            <Kicker size={9}>If you've stalled</Kicker>
            <Text style={styles.nudgeText}>{NUDGES[data.nudgeIdx % NUDGES.length]}</Text>
            <View style={{ flexDirection: 'row', gap: 20, marginTop: 16 }}>
              <Pressable onPress={useNudge}>
                <Text style={styles.nudgeAction}>Write to this</Text>
              </Pressable>
              <Pressable onPress={dropNudge}>
                <Text style={[styles.nudgeAction, { color: colors.faint }]}>Not now</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingTop: 58 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 6, paddingBottom: 12 },
  topLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint },
  wordCount: { fontFamily: sans(400), fontSize: 10, letterSpacing: 0.6, color: colors.faint2 },
  tplRow: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.hair2, paddingBottom: 12 },
  tplBtn: { paddingTop: 2, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  tplLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase' },
  body: { flex: 1 },
  textarea: { fontFamily: serif(300), fontSize: 20, lineHeight: 34, letterSpacing: -0.1, color: colors.ink2, minHeight: 210, marginTop: 14 },
  nudge: { marginTop: 8, padding: 18, paddingHorizontal: 20, backgroundColor: colors.paperSunk },
  nudgeText: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 19, lineHeight: 28, color: colors.ink3, marginTop: 10 },
  nudgeAction: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.ink },
});
