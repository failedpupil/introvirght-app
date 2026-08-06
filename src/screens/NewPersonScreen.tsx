import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { useApp } from '../state/AppState';
import { CLOSENESS_RINGS, ENERGY_OPTIONS } from '../data/people';
import { Closeness, Energy } from '../state/types';

export function NewPersonScreen() {
  const { people, openPersonId, addPerson, updatePerson, goBack, goPeople } = useApp();
  const { colors, energyColor } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const editing = people.find((p) => p.id === openPersonId);

  const [name, setName] = useState(editing?.name ?? '');
  const [relation, setRelation] = useState(editing?.relation ?? '');
  const [closeness, setCloseness] = useState<Closeness>(editing?.closeness ?? 'near');
  const [energy, setEnergy] = useState<Energy>(editing?.energy ?? 'neutral');
  const [line, setLine] = useState(editing?.line ?? '');

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const input = { name, relation, closeness, energy, line };
    if (editing) updatePerson(editing.id, input);
    else addPerson(input);
    goPeople();
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Text style={styles.topLabel}>Cancel</Text>
        </Pressable>
        <Pressable onPress={save} hitSlop={8} disabled={!canSave}>
          <Text style={[styles.topLabel, { color: canSave ? colors.ink : colors.faint }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 26, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>Someone new</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="their name"
          placeholderTextColor={colors.placeholder}
          style={styles.nameInput}
          autoFocus
        />
        <TextInput
          value={relation}
          onChangeText={setRelation}
          placeholder="how you know them"
          placeholderTextColor={colors.placeholder}
          style={styles.relationInput}
        />

        <Text style={[styles.kicker, { marginTop: 30 }]}>How close, honestly</Text>
        <View>
          {CLOSENESS_RINGS.map((ring) => {
            const selected = closeness === ring.id;
            return (
              <Pressable
                key={ring.id}
                onPress={() => setCloseness(ring.id)}
                style={({ pressed }) => [
                  styles.closeRow,
                  selected && { backgroundColor: colors.paperSunk },
                  pressed && !selected && { backgroundColor: colors.paperHover },
                ]}
              >
                <View style={styles.closeLabelRow}>
                  <View style={[styles.closeSelectedDot, selected ? { backgroundColor: colors.ink } : { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.hair3 }]} />
                  <Text style={[styles.closeLabel, { color: selected ? colors.ink : colors.ink4 }]}>{ring.label}</Text>
                </View>
                <Text style={styles.closeNote}>{ring.note}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.kicker, { marginTop: 30 }]}>Afterwards you feel</Text>
        <View style={styles.energyRow}>
          {ENERGY_OPTIONS.map((opt) => (
            <Pressable key={opt.id} onPress={() => setEnergy(opt.id)} style={styles.energyOpt}>
              <View style={[styles.energyDot, { backgroundColor: energyColor[opt.id] }]} />
              <Text
                style={[
                  styles.energyLabel,
                  { color: energy === opt.id ? colors.ink : colors.ink4, borderBottomColor: energy === opt.id ? energyColor[opt.id] : 'transparent' },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.kicker, { marginTop: 30 }]}>In one line</Text>
        <TextInput
          value={line}
          onChangeText={setLine}
          placeholder="What do you keep noticing about them?"
          placeholderTextColor={colors.placeholder}
          style={styles.lineInput}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.footnote}>The good and hard lists come later, once you have noticed something real.</Text>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 58 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 6, paddingBottom: 14 },
    topLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint },
    kicker: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: colors.faint, marginBottom: 14 },

    nameInput: { fontFamily: serif(300), fontSize: 27, color: colors.ink, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.ink },
    relationInput: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 19, color: colors.ink3, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.hair2, marginTop: 4 },

    closeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.hair },
    closeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    closeSelectedDot: { width: 9, height: 9, borderRadius: 4.5 },
    closeLabel: { fontFamily: serif(300), fontSize: 19 },
    closeNote: { fontFamily: sans(400), fontSize: 10, color: colors.faint },

    energyRow: { flexDirection: 'row', gap: 22, flexWrap: 'wrap' },
    energyOpt: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    energyDot: { width: 7, height: 7, borderRadius: 3.5 },
    energyLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', paddingBottom: 4, borderBottomWidth: 1 },

    lineInput: { fontFamily: serif(300), fontSize: 19, color: colors.ink, minHeight: 90 },
    footnote: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 0.3, color: colors.faint, lineHeight: 16, marginTop: 24 },
  });
}
