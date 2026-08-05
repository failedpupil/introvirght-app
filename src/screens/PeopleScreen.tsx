import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, energyColor } from '../theme/colors';
import { serif, sans } from '../theme/fonts';
import { PersonAvatar } from '../components/PersonAvatar';
import { CLOSENESS_RINGS } from '../data/people';
import { useApp } from '../state/AppState';
import { Closeness, Person } from '../state/types';
import { relativeDaysAgo } from '../utils/date';
import { mapSummary, peopleInRing } from '../utils/people';

type ViewMode = 'everyone' | 'map';

const BOX = 350;
const CENTER = BOX / 2;

export function PeopleScreen() {
  const { people, navigate } = useApp();
  const [view, setView] = useState<ViewMode>('everyone');

  const groups = useMemo(
    () => CLOSENESS_RINGS.map((ring) => ({ ring, people: peopleInRing(people, ring.id) })).filter((g) => g.people.length > 0),
    [people]
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 26 }}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>People</Text>
          <Pressable onPress={() => navigate('newPerson')} style={styles.addBtn} hitSlop={8}>
            <Text style={styles.addLabel}>+ Add</Text>
          </Pressable>
        </View>
        <Text style={styles.subline}>Who is actually in your life, and what you keep noticing about them.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segRow}>
          <SegButton label="Everyone" active={view === 'everyone'} onPress={() => setView('everyone')} />
          <SegButton label="The map" active={view === 'map'} onPress={() => setView('map')} />
        </ScrollView>
      </View>

      {view === 'everyone' && (
        <View>
          {groups.map(({ ring, people: inRing }) => (
            <View key={ring.id}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupKicker}>{ring.label.toUpperCase()}</Text>
                <Text style={styles.groupCount}>{inRing.length} {inRing.length === 1 ? 'person' : 'people'}</Text>
              </View>
              {inRing.map((p) => (
                <PersonRow key={p.id} person={p} onPress={() => navigate('person', { personId: p.id })} />
              ))}
            </View>
          ))}
          <View style={styles.footerWrap}>
            <View style={styles.hairline} />
            <Text style={styles.footerNote}>Nobody is notified, nobody is invited, and none of this leaves your device.</Text>
          </View>
        </View>
      )}

      {view === 'map' && <MapView people={people} onOpen={(id) => navigate('person', { personId: id })} />}
    </ScrollView>
  );
}

function PersonRow({ person, onPress }: { person: Person; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.paperHover }]}>
      <PersonAvatar name={person.name} closeness={person.closeness} size={34} fontSize={15} />
      <View style={{ flex: 1 }}>
        <View style={styles.rowNameLine}>
          <Text style={styles.rowName}>{person.name}</Text>
          <Text style={styles.rowRelation}>{person.relation.toUpperCase()}</Text>
        </View>
        {!!person.line && <Text style={styles.rowLine}>{person.line}</Text>}
        <View style={styles.rowMeta}>
          <View style={[styles.energyDot, { backgroundColor: energyColor[person.energy] }]} />
          <Text style={styles.rowWhen}>{relativeDaysAgo(person.updatedAtMs)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function MapView({ people, onOpen }: { people: Person[]; onOpen: (id: string) => void }) {
  const summary = useMemo(() => mapSummary(people), [people]);
  const legendCounts = useMemo(() => {
    const counts = { gives: 0, neutral: 0, takes: 0 } as Record<'gives' | 'neutral' | 'takes', number>;
    people.forEach((p) => { counts[p.energy]++; });
    return counts;
  }, [people]);

  return (
    <View style={{ paddingHorizontal: 26, paddingTop: 26 }}>
      <Text style={styles.mapSummary}>{summary}</Text>
      <View style={styles.mapBoxWrap}>
        <View style={styles.mapBox}>
          {CLOSENESS_RINGS.map((ring) => (
            <View
              key={ring.id}
              style={[
                styles.ringCircle,
                {
                  width: ring.diameter,
                  height: ring.diameter,
                  borderRadius: ring.diameter / 2,
                  left: CENTER - ring.diameter / 2,
                  top: CENTER - ring.diameter / 2,
                  borderColor: ring.id === 'inner' ? colors.hair3 : ring.id === 'near' ? colors.hair2 : colors.paperSunk,
                },
              ]}
            />
          ))}
          <View style={styles.youDot} />
          <Text style={styles.youLabel}>YOU</Text>
          {people.map((p) => {
            const ring = CLOSENESS_RINGS.find((r) => r.id === p.closeness)!;
            const rad = (p.angle * Math.PI) / 180;
            const estWidth = Math.min(72, Math.max(32, p.name.length * 5.4));
            let x = CENTER + Math.cos(rad) * ring.radius;
            let y = CENTER + Math.sin(rad) * ring.radius;
            x = Math.min(BOX - estWidth / 2, Math.max(estWidth / 2, x));
            y = Math.min(BOX - 14, Math.max(10, y));
            return (
              <Pressable
                key={p.id}
                onPress={() => onOpen(p.id)}
                style={({ pressed }) => [
                  styles.personDotWrap,
                  { left: x - estWidth / 2, top: y - 4, width: estWidth, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View style={[styles.personDot, { backgroundColor: energyColor[p.energy] }]} />
                <Text style={styles.personDotLabel} numberOfLines={1}>{p.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.legend}>
        <LegendRow color={energyColor.gives} label="You leave lighter" count={legendCounts.gives} />
        <LegendRow color={energyColor.neutral} label="Nothing changes" count={legendCounts.neutral} />
        <LegendRow color={energyColor.takes} label="You leave emptied" count={legendCounts.takes} />
      </View>
      <Text style={styles.mapFootnote}>Closeness is set by you, by hand. Nothing here is measured from how often you reply.</Text>
    </View>
  );
}

function LegendRow({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.hair2 }} />
      <Text style={styles.legendCount}>{count}</Text>
    </View>
  );
}

function SegButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.segBtn}>
      <Text style={[styles.segLabel, { color: active ? colors.ink : colors.faint, borderBottomColor: active ? colors.ink : 'transparent' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingTop: 66 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 },
  title: { fontFamily: serif(400), fontSize: 34, letterSpacing: -0.7, color: colors.ink },
  addBtn: { paddingVertical: 6 },
  addLabel: { fontFamily: sans(400), fontSize: 14, letterSpacing: 0.3, color: colors.muted },
  subline: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 17, lineHeight: 25, color: colors.muted, marginTop: 12, maxWidth: 300 },
  segRow: { flexGrow: 0, gap: 22, marginTop: 20, borderBottomWidth: 1, borderBottomColor: colors.hair },
  segBtn: { paddingBottom: 10, marginRight: 22 },
  segLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', borderBottomWidth: 1, paddingBottom: 10 },

  groupHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 26, paddingTop: 22, paddingBottom: 8 },
  groupKicker: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.8, color: colors.faint },
  groupCount: { fontFamily: sans(400), fontSize: 10, color: colors.faint2 },

  row: { flexDirection: 'row', gap: 14, paddingVertical: 17, paddingHorizontal: 26, borderTopWidth: 1, borderTopColor: colors.hair2 },
  rowNameLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  rowName: { fontFamily: serif(400), fontSize: 19, letterSpacing: -0.15, color: colors.ink },
  rowRelation: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.2, color: colors.faint },
  rowLine: { fontFamily: serif(300), fontSize: 16, lineHeight: 23, color: colors.muted, marginTop: 4 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 },
  energyDot: { width: 5, height: 5, borderRadius: 3 },
  rowWhen: { fontFamily: sans(400), fontSize: 9.5, color: colors.faint2 },

  footerWrap: { paddingHorizontal: 26, marginTop: 22 },
  hairline: { height: 1, backgroundColor: colors.hair },
  footerNote: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 15, lineHeight: 22, color: colors.faint, marginTop: 18 },

  mapSummary: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 20, lineHeight: 29, color: colors.ink3, maxWidth: 300 },
  mapBoxWrap: { alignItems: 'center', marginTop: 30 },
  mapBox: { width: BOX, height: BOX },
  ringCircle: { position: 'absolute', borderWidth: 1 },
  youDot: { position: 'absolute', width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.ink, left: CENTER - 3.5, top: CENTER - 3.5 },
  youLabel: { position: 'absolute', left: CENTER - 20, top: CENTER + 8, width: 40, textAlign: 'center', fontFamily: sans(400), fontSize: 8.5, letterSpacing: 1.4, color: colors.faint },
  personDotWrap: { position: 'absolute', alignItems: 'center' },
  personDot: { width: 9, height: 9, borderRadius: 4.5 },
  personDotLabel: { fontFamily: sans(400), fontSize: 9, color: colors.ink4, marginTop: 4 },

  legend: { gap: 11, marginTop: 34, paddingTop: 22, borderTopWidth: 1, borderTopColor: colors.hair },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { fontFamily: serif(300), fontSize: 16.5, color: colors.ink3 },
  legendCount: { fontFamily: sans(400), fontSize: 10, color: colors.faint },
  mapFootnote: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 15, lineHeight: 22, color: colors.faint, marginTop: 24, marginBottom: 8 },
});
