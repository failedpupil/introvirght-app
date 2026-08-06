import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { Kicker, PrimaryButton } from '../components/Basics';
import { useApp } from '../state/AppState';
import { DEFAULT_PLAN, PRICING, PlanChoice } from '../data/pricing';

const FEATURE_ROWS: { tag: 'Free' | 'Quiet'; label: string; note: string }[] = [
  { tag: 'Free', label: 'Unlimited pages, people and echoes', note: 'Forever. Not a trial, not a page limit.' },
  { tag: 'Free', label: 'End-to-end encryption and the lock', note: 'Privacy is not the thing we charge for.' },
  { tag: 'Free', label: 'Export everything as plain text', note: 'You can leave with all of it, any time.' },
  { tag: 'Quiet', label: 'Encrypted sync and backup', note: 'Years of writing survive a lost phone.' },
  { tag: 'Quiet', label: 'The weekly letter', note: 'Written on your device, seen by nobody.' },
  { tag: 'Quiet', label: 'Search every year, and one year ago today', note: 'Free search covers the last twelve months.' },
  { tag: 'Quiet', label: 'Night paper and a second hand', note: 'Appearance beyond the three free papers.' },
  { tag: 'Quiet', label: 'Locked pages', note: 'A second passcode on the entries you choose.' },
  { tag: 'Quiet', label: 'Print your year', note: 'A typeset PDF of any twelve months.' },
];

export function PaywallScreen() {
  const { navigate } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [plan, setPlan] = useState<PlanChoice>(DEFAULT_PLAN);

  const goYou = () => navigate('you', { replace: true });
  const goCheckout = () => navigate('checkout', { planChoice: plan });

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 26 }}>
        <Pressable onPress={goYou} hitSlop={8}>
          <Text style={styles.notNow}>Not now</Text>
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: 26, paddingTop: 24 }}>
        <Kicker>Introvirght Quiet</Kicker>
        <Text style={styles.title}>Writing is free forever. Always will be.</Text>
        <Text style={styles.sub}>Quiet pays for the parts that cost us money — encrypted sync, and the weekly letter.</Text>
      </View>

      <View style={styles.planList}>
        {FEATURE_ROWS.map((p, i) => (
          <View key={i} style={styles.planRow}>
            <Text style={[styles.tag, { color: p.tag === 'Quiet' ? colors.gold : colors.ink }]}>{p.tag.toUpperCase()}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.planLabel}>{p.label}</Text>
              <Text style={styles.planNote}>{p.note}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ padding: 26 }}>
        <View style={{ gap: 2 }}>
          {(Object.keys(PRICING) as PlanChoice[]).map((id) => {
            const def = PRICING[id];
            const selected = plan === id;
            return (
              <Pressable key={id} onPress={() => setPlan(id)} style={styles.priceRow}>
                <View style={[styles.priceDot, selected ? { backgroundColor: colors.ink, borderColor: colors.ink } : { borderColor: colors.hair3 }]} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Text style={[styles.priceAmount, selected && { color: colors.ink }]}>{def.amountLabel}</Text>
                    <Text style={styles.priceTerm}>{def.term}</Text>
                  </View>
                </View>
                <Text style={styles.priceRightNote}>{def.note}</Text>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton label={PRICING[plan].ctaLabel} onPress={goCheckout} style={{ marginTop: 22 }} />
        <View style={styles.linksRow}>
          <Pressable onPress={goYou}>
            <Text style={styles.linkLabel}>Stay on free</Text>
          </Pressable>
          <Pressable onPress={goYou}>
            <Text style={styles.linkLabel}>Restore</Text>
          </Pressable>
        </View>
        <Text style={styles.disclaimer}>No card until day 14. One reminder before it renews. Cancel and your entries stay — they are on your device, not ours.</Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 58 },
    notNow: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint, paddingVertical: 6 },
    title: { fontFamily: serif(400), fontSize: 32, lineHeight: 38, letterSpacing: -0.5, color: colors.ink, marginTop: 12, maxWidth: 290 },
    sub: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 18, lineHeight: 27, color: colors.muted, marginTop: 12 },

    planList: { marginTop: 28, borderTopWidth: 1, borderTopColor: colors.hair },
    planRow: { flexDirection: 'row', gap: 14, paddingVertical: 15, paddingHorizontal: 26, borderBottomWidth: 1, borderBottomColor: colors.hair2 },
    tag: { fontFamily: sans(400), fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase', width: 52 },
    planLabel: { fontFamily: serif(300), fontSize: 18, lineHeight: 24, color: colors.ink2 },
    planNote: { fontFamily: serif(300), fontSize: 15, lineHeight: 20, color: colors.muted, marginTop: 4 },

    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.hair2 },
    priceDot: { width: 6, height: 6, borderRadius: 3, borderWidth: 1 },
    priceAmount: { fontFamily: serif(300), fontSize: 24, letterSpacing: -0.3, color: colors.ink3 },
    priceTerm: { fontFamily: sans(400), fontSize: 11, color: colors.muted },
    priceRightNote: { fontFamily: sans(400), fontSize: 10, color: colors.faint2, maxWidth: 130, textAlign: 'right' },

    linksRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
    linkLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.faint },
    disclaimer: { fontFamily: sans(400), fontSize: 11, lineHeight: 19, color: colors.faint, marginTop: 20 },
  });
}
