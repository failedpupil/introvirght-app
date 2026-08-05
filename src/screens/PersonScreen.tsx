import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, energyColor } from '../theme/colors';
import { serif, sans } from '../theme/fonts';
import { BackLink, BorderedButton } from '../components/Basics';
import { PersonAvatar } from '../components/PersonAvatar';
import { useApp } from '../state/AppState';
import { noteDateLabel } from '../utils/date';

const CLOSENESS_WORD: Record<string, string> = { inner: 'Inner', near: 'Near', outer: 'Outer' };

export function PersonScreen() {
  const { people, openPersonId, goPeople, navigate, addPersonNote } = useApp();
  const [note, setNote] = useState('');
  const person = people.find((p) => p.id === openPersonId);

  if (!person) {
    return (
      <View style={styles.root}>
        <BackLink label="People" onPress={goPeople} />
      </View>
    );
  }

  const submitNote = () => {
    if (!note.trim()) return;
    addPersonNote(person.id, note);
    setNote('');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 26 }}>
        <BackLink label="People" onPress={goPeople} />

        <View style={styles.header}>
          <PersonAvatar name={person.name} closeness={person.closeness} size={52} fontSize={21} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{person.name}</Text>
            <Text style={styles.subline}>{person.relation.toUpperCase()} · {CLOSENESS_WORD[person.closeness].toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.description}>{person.description || person.line}</Text>

        <View style={styles.factsRow}>
          {person.facts.map(([value, label], i) => (
            <View key={label} style={[styles.factCell, i > 0 && styles.factDivider]}>
              <Text style={[styles.factValue, i === 2 && { color: energyColor[person.energy] }]}>{value}</Text>
              <Text style={styles.factLabel}>{label.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        <Section dotColor={energyColor.gives} kicker="What is good">
          {person.good.length === 0 ? null : person.good.map((g, i) => (
            <Text key={i} style={styles.itemRow}>{g}</Text>
          ))}
        </Section>

        <Section dotColor={energyColor.takes} kicker="What is hard">
          {person.bad.length === 0 ? (
            <Text style={[styles.itemRow, styles.itemNeutral]}>Nothing yet, which is its own kind of information.</Text>
          ) : (
            person.bad.map((b, i) => <Text key={i} style={styles.itemRow}>{b}</Text>)
          )}
          <Text style={styles.hardFootnote}>Written for you, not about them. Nobody will ever read this list.</Text>
        </Section>

        <View style={styles.sectionBlock}>
          <Text style={styles.kicker}>Worth remembering</Text>
          {person.notes.map((n, i) => (
            <View key={i} style={styles.noteRow}>
              <Text style={styles.noteDate}>{noteDateLabel(n.atMs)}</Text>
              <Text style={styles.noteText}>{n.text}</Text>
            </View>
          ))}
          <View style={styles.composer}>
            <TextInput
              value={note}
              onChangeText={setNote}
              onSubmitEditing={submitNote}
              placeholder="something you want to keep about them"
              placeholderTextColor={colors.placeholder}
              style={styles.composerInput}
            />
            <Pressable onPress={submitNote} hitSlop={8}>
              <Text style={[styles.addLabel, { color: note.trim() ? colors.ink : colors.faint }]}>Add</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.kicker}>
            {person.mentions.length === 0 ? 'Not mentioned in your pages yet' : `Mentioned in ${person.mentions.length} page${person.mentions.length === 1 ? '' : 's'}`}
          </Text>
          {person.mentions.map((m, i) => (
            <Pressable key={i} onPress={() => navigate('entry', { entryId: m.entryId })} style={styles.noteRow}>
              <Text style={styles.noteDate}>{m.date}</Text>
              <Text style={styles.mentionQuote}>{m.quote}</Text>
            </Pressable>
          ))}
        </View>

        <BorderedButton
          label="Edit this page"
          onPress={() => navigate('newPerson', { personId: person.id })}
          style={{ marginTop: 34 }}
        />
      </View>
    </ScrollView>
  );
}

function Section({ dotColor, kicker, children }: { dotColor: string; kicker: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: dotColor }]} />
        <Text style={styles.kicker}>{kicker}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingTop: 58 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 },
  name: { fontFamily: serif(400), fontSize: 29, lineHeight: 32, letterSpacing: -0.4, color: colors.ink },
  subline: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.2, color: colors.muted, marginTop: 6 },
  description: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 19, lineHeight: 28, color: colors.ink3, marginTop: 22 },

  factsRow: { flexDirection: 'row', borderWidth: 1, borderColor: colors.hair2, borderRadius: 2, marginTop: 26 },
  factCell: { flex: 1, paddingVertical: 16, paddingHorizontal: 12, gap: 6 },
  factDivider: { borderLeftWidth: 1, borderLeftColor: colors.hair2 },
  factValue: { fontFamily: serif(300), fontSize: 15.5, color: colors.ink2 },
  factLabel: { fontFamily: sans(400), fontSize: 8.5, letterSpacing: 1, color: colors.faint },

  sectionBlock: { marginTop: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionDot: { width: 5, height: 5, borderRadius: 2.5 },
  kicker: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: colors.faint, marginBottom: 8 },
  itemRow: { fontFamily: serif(300), fontSize: 18, color: colors.ink2, paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.hair2 },
  itemNeutral: { fontStyle: 'italic', color: colors.faint },
  hardFootnote: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 15, lineHeight: 22, color: colors.faint, marginTop: 12 },

  noteRow: { flexDirection: 'row', gap: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.hair2 },
  noteDate: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 0.4, color: colors.faint2, width: 54 },
  noteText: { fontFamily: serif(300), fontSize: 18, lineHeight: 26, color: colors.ink2, flex: 1 },
  mentionQuote: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 17, lineHeight: 25, color: colors.ink3, flex: 1 },

  composer: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.hair2, paddingTop: 14, marginTop: 2 },
  composerInput: { flex: 1, fontFamily: serif(300), fontSize: 17, color: colors.ink },
  addLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', paddingVertical: 6 },
});
