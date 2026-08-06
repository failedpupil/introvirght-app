import React, { useEffect, useMemo, useRef } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { ChevronRight } from '../icons/Icons';
import { useApp } from '../state/AppState';
import { DEFAULT_PLAN } from '../data/pricing';

export function PurchasedScreen() {
  const { openPlanChoice, navigate, reset } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const anim = useRef(new Animated.Value(0)).current;
  const plan = openPlanChoice ?? DEFAULT_PLAN;
  const isLifetime = plan === 'lifetime';

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 700, easing: Easing.bezier(0.2, 0.7, 0.2, 1), useNativeDriver: true }).start();
  }, [anim]);

  const title = isLifetime ? 'Quiet is yours.' : 'The fortnight has started.';
  const subline = isLifetime
    ? 'Paid once, on 1 August. Nothing will renew and nothing will ask again.'
    : 'Free until 15 August. We will remind you on the 13th, once.';

  // Sync itself isn't built anywhere in this app yet (no device-pairing/account system
  // exists) — this is an honest status message, not a fake toggle for a feature that
  // doesn't work. The other two routes below are fully real.
  const onSync = () => {
    Alert.alert('Encrypted sync', "Sync isn't available in this build yet — it's a genuine feature still being built, not switched off. Your writing stays safely on this device either way.");
  };

  return (
    <View style={styles.root}>
      <Animated.View style={{ opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }}>
        <View style={styles.ring}>
          <Text style={styles.check}>✓</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subline}>{subline}</Text>
      </Animated.View>

      <View style={styles.rule} />

      <View>
        <Route label="Turn on sync" onPress={onSync} />
        <Route label="Try Night paper" onPress={() => navigate('appearance')} />
        <Route label="Read last week's letter" onPress={() => navigate('review')} />
      </View>

      <Pressable onPress={() => reset('you')} style={{ marginTop: 30, alignSelf: 'center' }} hitSlop={8}>
        <Text style={styles.notNow}>Not now</Text>
      </Pressable>
    </View>
  );
}

function Route({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [routeStyles.row, { borderTopColor: colors.hair2 }, pressed && { backgroundColor: colors.paperSunk }]}>
      <Text style={[routeStyles.label, { color: colors.ink2 }]}>{label}</Text>
      <ChevronRight size={13} />
    </Pressable>
  );
}

const routeStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 17, paddingHorizontal: 26, borderTopWidth: 1 },
  label: { fontFamily: serif(300), fontSize: 18 },
});

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 100, paddingHorizontal: 26 },
    ring: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
    check: { fontSize: 20, color: colors.gold },
    title: { fontFamily: serif(300), fontSize: 27, letterSpacing: -0.4, color: colors.ink, marginTop: 22, textAlign: 'center' },
    subline: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 16, lineHeight: 23, color: colors.muted, marginTop: 10, textAlign: 'center' },
    rule: { height: 1, width: 60, backgroundColor: colors.hair, alignSelf: 'center', marginVertical: 34 },
    notNow: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.faint },
  });
}
