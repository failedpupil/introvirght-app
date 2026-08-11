import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { Kicker, PrimaryButton } from '../components/Basics';
import { useApp } from '../state/AppState';
import { DEFAULT_PLAN, PLANS, PLAN_ORDER, PlanChoice } from '../data/pricing';
import { useBilling } from '../billing/BillingState';

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

/**
 * The six states from RELEASE_ADDENDUM.md §3.5, in the app's own register — plain,
 * no exclamation marks, no "Oops". Each says what happened and what to do next.
 */
const STATUS_LINE: Record<string, string> = {
  loading_prices: 'Asking Google Play what this costs where you are…',
  prices_unavailable: 'Google Play did not answer, so we cannot show you a price we are sure of.',
  purchase_pending: 'Your bank is still deciding. This can take a few days with some payment methods, and Quiet turns on by itself the moment it clears.',
  purchase_failed: 'That did not go through, and you have not been charged.',
  already_subscribed: 'You already have Quiet on this Google account.',
  restore_found_nothing: 'Nothing to restore on this Google account. If you paid with a different one, sign in to Google Play with that account first.',
};

export function PaywallScreen() {
  const { navigate } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [plan, setPlan] = useState<PlanChoice>(DEFAULT_PLAN);
  const { status, priceFor, entitled, busy, buy, restore, retryPrices } = useBilling();

  // Only a *transition* into entitlement means "you just bought it" — arriving here
  // already subscribed should show the paywall's already-subscribed line instead of
  // bouncing someone to a thank-you screen they did not earn this session.
  const wasEntitled = useRef(entitled);
  useEffect(() => {
    if (entitled && !wasEntitled.current) navigate('purchased', { replace: true, planChoice: plan });
    wasEntitled.current = entitled;
  }, [entitled, navigate, plan]);

  const goYou = () => navigate('you', { replace: true });
  const pricesReady = PLAN_ORDER.some((p) => priceFor(p) !== null);
  const statusLine = STATUS_LINE[status];

  // The button says what tapping it does, and stops claiming a price we do not have.
  const ctaLabel = entitled
    ? 'You already have Quiet'
    : status === 'loading_prices'
      ? 'One moment'
      : !pricesReady
        ? 'Try again'
        : plan === 'lifetime'
          ? `Pay once · ${priceFor('lifetime')}`
          : `Subscribe · ${priceFor(plan)} ${PLANS[plan].term}`;

  const onPrimary = () => {
    if (entitled) return;
    if (!pricesReady) return void retryPrices();
    void buy(plan);
  };

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
          {PLAN_ORDER.map((id) => {
            const def = PLANS[id];
            const selected = plan === id;
            const price = priceFor(id);
            return (
              <Pressable key={id} onPress={() => setPlan(id)} style={styles.priceRow} disabled={busy}>
                <View style={[styles.priceDot, selected ? { backgroundColor: colors.ink, borderColor: colors.ink } : { borderColor: colors.hair3 }]} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    {/* Never a hardcoded amount: until Play answers there is a dash, not a guess. */}
                    <Text style={[styles.priceAmount, selected && { color: colors.ink }]}>{price ?? '—'}</Text>
                    <Text style={styles.priceTerm}>{def.term}</Text>
                  </View>
                </View>
                <Text style={styles.priceRightNote}>{def.note}</Text>
              </Pressable>
            );
          })}
        </View>

        {!!statusLine && (
          <View style={styles.statusBlock}>
            {status === 'loading_prices' ? (
              <View style={styles.statusLoadingRow}>
                <ActivityIndicator size="small" color={colors.faint} />
                <Text style={styles.statusText}>{statusLine}</Text>
              </View>
            ) : (
              <Text style={styles.statusText}>{statusLine}</Text>
            )}
          </View>
        )}

        <PrimaryButton
          label={busy ? 'Talking to Google Play…' : ctaLabel}
          onPress={onPrimary}
          disabled={busy || entitled || status === 'loading_prices'}
          style={{ marginTop: 22 }}
        />
        <View style={styles.linksRow}>
          <Pressable onPress={goYou} disabled={busy}>
            <Text style={styles.linkLabel}>Stay on free</Text>
          </Pressable>
          <Pressable onPress={() => void restore()} disabled={busy}>
            <Text style={styles.linkLabel}>Restore purchases</Text>
          </Pressable>
        </View>
        <Text style={styles.disclaimer}>
          Google Play takes the payment and holds the card; we never see it. Cancel any time in Play, and your entries stay either way — they are on your device, not ours.
        </Text>
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

    statusBlock: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.hair2 },
    statusLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statusText: { flex: 1, fontFamily: serif(300), fontSize: 15.5, lineHeight: 22, color: colors.muted },

    linksRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
    linkLabel: { fontFamily: sans(400), fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.faint },
    disclaimer: { fontFamily: sans(400), fontSize: 11, lineHeight: 19, color: colors.faint, marginTop: 20 },
  });
}
