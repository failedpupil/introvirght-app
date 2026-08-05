import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { serif, sans } from '../theme/fonts';
import { Kicker, PrimaryButton } from '../components/Basics';
import { useApp } from '../state/AppState';

const PLAN_ROWS: { tag: 'FREE' | 'QUIET'; label: string }[] = [
  { tag: 'FREE', label: 'Unlimited pages, fragments and echoes — forever' },
  { tag: 'FREE', label: 'Fingerprint lock, daily question, all templates' },
  { tag: 'FREE', label: 'Export everything as plain text' },
  { tag: 'QUIET', label: 'Encrypted sync across your devices' },
  { tag: 'QUIET', label: 'The weekly letter, written on your device' },
  { tag: 'QUIET', label: 'Search across every year, and “one year ago today”' },
];

export function PaywallScreen() {
  const { navigate } = useApp();
  const goYou = () => navigate('you', { replace: true });

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
        {PLAN_ROWS.map((p, i) => (
          <View key={i} style={styles.planRow}>
            <Text style={[styles.tag, { color: p.tag === 'QUIET' ? colors.gold : colors.ink }]}>{p.tag}</Text>
            <Text style={styles.planLabel}>{p.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ padding: 26 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
          <Text style={styles.price}>₹199</Text>
          <Text style={styles.priceNote}>a year · about ₹17 a month</Text>
        </View>
        <PrimaryButton label="Try Quiet for 14 days" onPress={goYou} style={{ marginTop: 20 }} />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingTop: 58 },
  notNow: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint, paddingVertical: 6 },
  title: { fontFamily: serif(400), fontSize: 32, lineHeight: 38, letterSpacing: -0.5, color: colors.ink, marginTop: 12, maxWidth: 290 },
  sub: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 18, lineHeight: 27, color: colors.muted, marginTop: 12 },
  planList: { marginTop: 28, borderTopWidth: 1, borderTopColor: colors.hair },
  planRow: { flexDirection: 'row', alignItems: 'baseline', gap: 14, paddingVertical: 15, paddingHorizontal: 26, borderBottomWidth: 1, borderBottomColor: colors.hair2 },
  tag: { fontFamily: sans(400), fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase', width: 52 },
  planLabel: { fontFamily: serif(300), fontSize: 18, lineHeight: 25, color: colors.ink2, flex: 1 },
  price: { fontFamily: serif(300), fontSize: 32, letterSpacing: -0.4, color: colors.ink },
  priceNote: { fontFamily: sans(400), fontSize: 11, letterSpacing: 0.4, color: colors.muted },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  linkLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.faint },
  disclaimer: { fontFamily: sans(400), fontSize: 11, lineHeight: 19, color: colors.faint, marginTop: 20 },
});
