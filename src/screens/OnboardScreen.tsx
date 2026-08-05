import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native';
import { Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { serif, sans } from '../theme/fonts';
import { Kicker } from '../components/Basics';
import { useApp } from '../state/AppState';
import { NudgePref, Rhythm } from '../state/types';

interface Option<T extends string> {
  label: string;
  note: string;
  value: T;
}

const RHYTHM_OPTS: Option<Rhythm>[] = [
  { label: 'Early morning', note: 'before anyone', value: 'am' },
  { label: 'Afternoon', note: 'in the gaps', value: 'pm' },
  { label: 'Late night', note: 'after the noise', value: 'night' },
];

const NUDGE_OPTS: Option<NudgePref>[] = [
  { label: 'Yes, gently', note: 'once, no reminders', value: 'yes' },
  { label: 'Only when I stall', note: 'mid-sentence', value: 'stall' },
  { label: 'Never ask', note: 'silence is fine', value: 'no' },
];

export function OnboardScreen() {
  const { data, setName, setRhythm, setNudgePref, onboardStep, setOnboardStep, navigate, goBack } = useApp();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [onboardStep, fade]);

  const back = () => {
    if (onboardStep === 0) goBack();
    else setOnboardStep(onboardStep - 1);
  };

  const next = () => {
    if (onboardStep < 2) {
      setOnboardStep(onboardStep + 1);
    } else if (data.onboarded) {
      goBack();
    } else {
      navigate('remind', { replace: true });
    }
  };

  const kicker = ['One', 'Two', 'Three'][onboardStep];
  const title = [
    'What should the diary call you?',
    'When are you most yourself?',
    'Should it ask you one question a day?',
  ][onboardStep];
  const cta = onboardStep < 2 ? 'Continue' : data.onboarded ? 'Done' : 'Begin';

  return (
    <View style={styles.root}>
      <View style={styles.progress}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: onboardStep >= i ? colors.ink : colors.hair }]} />
        ))}
      </View>
      <Animated.View style={{ opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }}>
        <Kicker style={{ marginBottom: 16 }}>{kicker}</Kicker>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.hairline} />

        {onboardStep === 0 && (
          <TextInput
            value={data.name}
            onChangeText={setName}
            placeholder="your name, or anything"
            placeholderTextColor={colors.placeholder}
            style={styles.nameInput}
          />
        )}

        {onboardStep === 1 && (
          <View>
            {RHYTHM_OPTS.map((opt) => {
              const selected = data.rhythm === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setRhythm(opt.value)}
                  style={({ pressed }) => [styles.optRow, selected && { backgroundColor: colors.paperSunk }, pressed && !selected && { backgroundColor: colors.paperHover }]}
                >
                  <View style={styles.optLabelRow}>
                    <View style={[styles.optDot, selected ? { backgroundColor: colors.ink } : { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.hair3 }]} />
                    <Text style={[styles.optLabel, { color: selected ? colors.ink : colors.ink4 }]}>{opt.label}</Text>
                  </View>
                  <Text style={styles.optNote}>{opt.note}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {onboardStep === 2 && (
          <View>
            {NUDGE_OPTS.map((opt) => {
              const selected = data.nudgePref === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setNudgePref(opt.value)}
                  style={({ pressed }) => [styles.optRow, selected && { backgroundColor: colors.paperSunk }, pressed && !selected && { backgroundColor: colors.paperHover }]}
                >
                  <View style={styles.optLabelRow}>
                    <View style={[styles.optDot, selected ? { backgroundColor: colors.ink } : { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.hair3 }]} />
                    <Text style={[styles.optLabel, { color: selected ? colors.ink : colors.ink4 }]}>{opt.label}</Text>
                  </View>
                  <Text style={styles.optNote}>{opt.note}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Animated.View>

      <View style={styles.footer}>
        <Pressable onPress={back} hitSlop={8}>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Pressable onPress={next} style={({ pressed }) => [styles.ctaBtn, { backgroundColor: pressed ? colors.inkHover : colors.ink }]}>
          <Text style={styles.ctaLabel}>{cta}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingTop: 74, paddingHorizontal: 34, paddingBottom: 40 },
  progress: { flexDirection: 'row', gap: 6, marginBottom: 'auto' },
  bar: { height: 2, width: 26 },
  title: { fontFamily: serif(400), fontSize: 31, lineHeight: 38, letterSpacing: -0.5, color: colors.ink, maxWidth: 290 },
  hairline: { height: 1, backgroundColor: colors.hair, marginVertical: 28 },
  nameInput: {
    fontFamily: serif(300),
    fontStyle: 'italic',
    fontSize: 23,
    color: colors.ink,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
  },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 17,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
  },
  optLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optDot: { width: 9, height: 9, borderRadius: 4.5 },
  optLabel: { fontFamily: serif(300), fontSize: 20 },
  optNote: { fontFamily: sans(400), fontSize: 10, letterSpacing: 0.4, color: colors.faint },
  footer: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 32 },
  backLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint, paddingVertical: 8 },
  ctaBtn: { paddingVertical: 15, paddingHorizontal: 34, borderRadius: 2 },
  ctaLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.7, textTransform: 'uppercase', color: colors.paper },
});
