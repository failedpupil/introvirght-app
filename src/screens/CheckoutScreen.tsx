import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { BackLink, Kicker } from '../components/Basics';
import { useApp } from '../state/AppState';
import { DEFAULT_PLAN, PRICING } from '../data/pricing';

/**
 * PART THREE's compliance constraint: a real store build only ever runs on one
 * platform, so the method list is never actually "swapped by the user" — it's fixed
 * per build, one row, no section heading. Web checkout (Razorpay) is a possible
 * future *build*, not a runtime branch on this one; adding it later means adding
 * more entries to this single array, not new logic here.
 */
const PAYMENT_METHODS: { label: string }[] = [{ label: Platform.OS === 'ios' ? 'App Store billing' : 'Play billing' }];

const STORE_NAME = Platform.OS === 'ios' ? 'Apple' : 'Google Play';

export function CheckoutScreen() {
  const { navigate, goBack, setPlan } = useApp();
  const { colors, energyColor } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [pending, setPending] = useState(false);
  const firing = useRef(false);

  // No paywall selection reaching this screen (e.g. a direct deep link) falls back
  // to the default plan rather than crashing on a missing choice.
  const { openPlanChoice } = useApp();
  const plan = openPlanChoice ?? DEFAULT_PLAN;
  const def = PRICING[plan];
  const isAnnual = plan === 'annual';

  const title = isAnnual ? `Fourteen days first, then ${def.amountLabel} a year.` : 'Pay once, and never again.';
  const subline = isAnnual
    ? 'Nothing is taken today. We remind you two days before it renews.'
    : 'One payment. Every future version of Quiet is included.';

  const pay = () => {
    // Guards against double-firing from a fast double-tap; `firing` (a ref, not
    // state) blocks re-entry synchronously, before the next render even happens.
    if (firing.current) return;
    firing.current = true;
    setPending(true);

    // PLACEHOLDER: no real App Store/Play Billing product exists to charge yet (that
    // needs products configured in App Store Connect / Play Console, which this
    // session can't provision) — this simulates the round trip so the UI/UX is fully
    // real and testable. Swap this block for the actual purchase call once products
    // exist; POST /v1/entitlement/receipt on the server is what verifies the result.
    setTimeout(() => {
      setPlan('quiet');
      setPending(false);
      firing.current = false;
      navigate('purchased', { replace: true, planChoice: plan });
    }, 1400);
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 26 }}>
        <BackLink label="Paywall" onPress={goBack} />
        <Kicker style={{ marginTop: 20 }}>Introvirght Quiet</Kicker>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subline}>{subline}</Text>

        <View style={styles.lineBlock}>
          {isAnnual ? (
            <>
              <LineItem label="Quiet one year" value={`₹${def.base}`} />
              <LineItem label="GST 18%" value={`₹${def.gst}`} />
              <LineItem label="Free until 15 August" value={`−₹${def.total}`} color={energyColor.gives} />
            </>
          ) : (
            <>
              <LineItem label="Quiet lifetime" value={`₹${def.base}`} />
              <LineItem label="GST 18%" value={`₹${def.gst}`} />
              <LineItem label="Billed once, no renewal" value="—" />
            </>
          )}
          <View style={styles.dueRow}>
            <Text style={styles.dueLabel}>Due today</Text>
            <Text style={styles.dueAmount}>₹{def.dueToday}</Text>
          </View>
        </View>

        {/* No section heading on a store-billing-only build — a bare single row. */}
        <View style={styles.methodBlock}>
          {PAYMENT_METHODS.map((m) => (
            <View key={m.label} style={styles.methodRow}>
              <View style={[styles.methodDot, { backgroundColor: colors.ink }]} />
              <Text style={styles.methodLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={pay} disabled={pending} style={[styles.payBtn, { backgroundColor: pending ? colors.inkHover : colors.ink }]}>
          {pending ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator size="small" color={colors.paper} />
              <Text style={styles.payLabel}>Talking to your bank…</Text>
            </View>
          ) : (
            <Text style={styles.payLabel}>{def.ctaLabel}</Text>
          )}
        </Pressable>

        <Text style={styles.footnote}>Cancelling takes two taps. Lifetime purchases carry a seven-day no-questions refund.</Text>
        <View style={styles.padlockRow}>
          <View style={styles.padlockDot} />
          <Text style={styles.padlockText}>We never see your card. Payment is handled by {STORE_NAME}, and no diary data is attached to it.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function LineItem({ label, value, color }: { label: string; value: string; color?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.hair2 }}>
      <Text style={{ fontFamily: serif(300), fontSize: 16, color: colors.ink3 }}>{label}</Text>
      <Text style={{ fontFamily: sans(400), fontSize: 13, color: color ?? colors.ink3 }}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 58, paddingBottom: 30 },
    title: { fontFamily: serif(400), fontSize: 27, lineHeight: 34, letterSpacing: -0.4, color: colors.ink, marginTop: 10, maxWidth: 300 },
    subline: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 16, lineHeight: 23, color: colors.muted, marginTop: 10, maxWidth: 300 },

    lineBlock: { borderWidth: 1, borderColor: colors.hair, marginTop: 26, paddingHorizontal: 16 },
    dueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingVertical: 16 },
    dueLabel: { fontFamily: serif(400), fontSize: 19, color: colors.ink },
    dueAmount: { fontFamily: serif(300), fontSize: 24, letterSpacing: -0.3, color: colors.ink },

    methodBlock: { marginTop: 26 },
    methodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.hair2 },
    methodDot: { width: 6, height: 6, borderRadius: 3 },
    methodLabel: { fontFamily: serif(300), fontSize: 18, color: colors.ink },

    payBtn: { marginTop: 24, paddingVertical: 18, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
    payLabel: { fontFamily: sans(400), fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.paper },

    footnote: { fontFamily: sans(400), fontSize: 10.5, lineHeight: 16, color: colors.faint, marginTop: 18, textAlign: 'center' },
    padlockRow: { flexDirection: 'row', gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.hair2 },
    padlockDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.faint2, marginTop: 6 },
    padlockText: { flex: 1, fontFamily: sans(400), fontSize: 10.5, lineHeight: 16, color: colors.faint },
  });
}
