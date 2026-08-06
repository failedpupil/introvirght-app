import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { sans, serif } from '../theme/fonts';
import { useTheme, readingFontFor } from '../theme/ThemeState';
import { FACES, FaceId, PAPERS, PaperId, SIZES } from '../theme/palettes';
import { phiSpace } from '../theme/metrics';
import { BackLink, Kicker } from '../components/Basics';
import { useApp } from '../state/AppState';

const PREVIEW_SENTENCE = 'The rain finally stopped, and I sat by the window for longer than I meant to.';

export function AppearanceScreen() {
  const { data, navigate, reset } = useApp();
  const { colors, paper, face, sizeIdx, ruled, askBeforeSealing, quietHours, readingFont, readingSize, setPaper, setFace, setSizeIdx, setRuled, setAskBeforeSealing, setQuietHours, resetLook } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isQuiet = data.plan === 'quiet';

  const pickPaper = (id: PaperId) => {
    const def = PAPERS.find((p) => p.id === id)!;
    if (def.quiet && !isQuiet) return navigate('paywall');
    setPaper(id);
  };

  const pickFace = (id: FaceId) => {
    const def = FACES.find((f) => f.id === id)!;
    if (def.quiet && !isQuiet) return navigate('paywall');
    setFace(id);
  };

  const previewLineHeight = Math.round(readingSize.px * readingSize.lh);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={styles.gutter}>
        <BackLink label="You" onPress={() => reset('you')} />
        <Text style={styles.title}>Appearance</Text>
        <Text style={styles.subline}>Make it look like your diary, not ours.</Text>

        {/* Preview */}
        <View style={styles.previewBox}>
          <Kicker style={{ marginBottom: 12 }}>Preview</Kicker>
          <Text
            style={{
              fontFamily: readingFont(300),
              fontSize: readingSize.px,
              lineHeight: previewLineHeight,
              color: colors.ink2,
            }}
          >
            {PREVIEW_SENTENCE}
          </Text>
        </View>

        {/* Paper */}
        <Section title="Paper">
          <View style={styles.paperRow}>
            {PAPERS.map((p) => {
              const selected = p.id === paper;
              return (
                <Pressable key={p.id} onPress={() => pickPaper(p.id)} style={styles.paperItem}>
                  <View style={[styles.swatch, { backgroundColor: p.colors.paper, borderColor: selected ? colors.ink : colors.hair3 }]} />
                  <Text style={styles.paperName}>{p.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Reading size */}
        <Section title="Reading size" right={SIZES[sizeIdx].label}>
          <View style={styles.sizeRow}>
            {SIZES.map((s, i) => {
              const selected = i === sizeIdx;
              const glyphSize = [11, 15, 19, 23][i];
              return (
                <Pressable key={s.label} onPress={() => setSizeIdx(i)} style={styles.sizeItem}>
                  <Text style={[styles.sizeGlyph, { fontSize: glyphSize, color: selected ? colors.ink : colors.muted }]}>Aa</Text>
                  <View style={[styles.sizeBar, { backgroundColor: selected ? colors.ink : 'transparent' }]} />
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Hand */}
        <Section title="Hand">
          <View>
            {FACES.map((f) => {
              const selected = f.id === face;
              const locked = f.quiet && !isQuiet;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => pickFace(f.id)}
                  style={({ pressed }) => [styles.handRow, pressed && { backgroundColor: colors.paperSunk }]}
                >
                  <View style={[styles.handDot, selected ? { backgroundColor: colors.ink } : { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.hair3 }]} />
                  <Text style={[styles.handName, { fontFamily: readingFontFor(f.id) }]} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <Text style={[styles.handNote, locked && { color: colors.gold }]}>{locked ? 'Quiet' : f.note}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Toggles */}
        <Section title="Behaviour">
          <ToggleRow
            label="Ruled paper"
            note="Faint lines behind what you write."
            value={ruled}
            onChange={setRuled}
          />
          <ToggleRow
            label="Ask before sealing"
            note="One confirmation, so a day is never closed by accident."
            value={askBeforeSealing}
            onChange={setAskBeforeSealing}
          />
          <ToggleRow
            label="Nothing after 23:00"
            note="The reminder stays quiet late, even if you are awake."
            value={quietHours}
            onChange={setQuietHours}
          />
        </Section>

        {/* Quiet upsell */}
        {!isQuiet && (
          <Pressable onPress={() => navigate('paywall')} style={styles.upsell}>
            <Text style={styles.upsellKicker}>Quiet</Text>
            <Text style={styles.upsellBody}>Night paper and the second hand are part of Quiet. Everything else here is free.</Text>
          </Pressable>
        )}

        {/* Reset */}
        <Pressable onPress={resetLook} style={styles.resetRow} hitSlop={8}>
          <Text style={styles.resetLabel}>Back to how it was</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Section({ title, right, children }: { title: string; right?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: phiSpace.section }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: phiSpace.gap }}>
        <Kicker>{title}</Kicker>
        {right && <Text style={{ fontFamily: sans(400), fontSize: 10.5, color: colors.muted }}>{right}</Text>}
      </View>
      {children}
    </View>
  );
}

function ToggleRow({ label, note, value, onChange }: { label: string; note: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[toggleStyles.row, { borderTopColor: colors.hair2 }]}>
      <View style={{ flex: 1, paddingRight: 14 }}>
        <Text style={[toggleStyles.label, { color: colors.ink }]}>{label}</Text>
        <Text style={[toggleStyles.note, { color: colors.faint }]}>{note}</Text>
      </View>
      <Text style={[toggleStyles.value, { color: value ? colors.ink : colors.faint2 }]}>{value ? 'On' : 'Off'}</Text>
      <Pressable
        onPress={() => onChange(!value)}
        style={[toggleStyles.pill, { backgroundColor: value ? colors.ink : colors.hair3 }]}
        hitSlop={8}
      >
        <View style={[toggleStyles.knob, { backgroundColor: colors.paper, alignSelf: value ? 'flex-end' : 'flex-start' }]} />
      </Pressable>
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderTopWidth: 1 },
  label: { fontFamily: serif(300), fontSize: 17 },
  note: { fontFamily: sans(400), fontSize: 10.5, marginTop: 4, maxWidth: 220 },
  value: { fontFamily: sans(400), fontSize: 9.5, marginRight: 10 },
  pill: { width: 26, height: 15, borderRadius: 7.5, padding: 1.5, justifyContent: 'center' },
  knob: { width: 12, height: 12, borderRadius: 6 },
});

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: phiSpace.top },
    gutter: { paddingHorizontal: phiSpace.gutter },
    title: { fontFamily: serif(400), fontSize: 34, letterSpacing: -0.7, color: colors.ink, marginTop: 20 },
    subline: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 17, lineHeight: 25, color: colors.muted, marginTop: 10 },

    previewBox: { borderWidth: 1, borderColor: colors.hair, padding: phiSpace.gutter, marginTop: phiSpace.section },

    paperRow: { flexDirection: 'row', gap: 22 },
    paperItem: { alignItems: 'center', gap: 8 },
    swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 2 },
    paperName: { fontFamily: sans(400), fontSize: 9.5, color: colors.muted },

    sizeRow: { flexDirection: 'row', gap: 26, alignItems: 'flex-end' },
    sizeItem: { alignItems: 'center', gap: 8, minWidth: 30 },
    sizeGlyph: { fontFamily: serif(400) },
    sizeBar: { width: 20, height: 2 },

    handRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.hair2 },
    handDot: { width: 6, height: 6, borderRadius: 3 },
    handName: { flex: 1, fontSize: 21, color: colors.ink },
    handNote: { fontFamily: sans(400), fontSize: 9.5, color: colors.faint },

    upsell: { backgroundColor: colors.paperSunk, padding: phiSpace.gutter, marginTop: phiSpace.section },
    upsellKicker: { fontFamily: sans(400), fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: colors.gold, marginBottom: 8 },
    upsellBody: { fontFamily: serif(300), fontSize: 16, lineHeight: 23, color: colors.ink3 },

    resetRow: { marginTop: phiSpace.section, alignSelf: 'flex-start' },
    resetLabel: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.3, textTransform: 'uppercase', color: colors.faint },
  });
}
