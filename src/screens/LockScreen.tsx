import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { serif, sans } from '../theme/fonts';
import { LogoMark, LockIcon } from '../icons/Icons';
import { Kicker, PrimaryButton } from '../components/Basics';
import { useApp } from '../state/AppState';
import { fullDate } from '../utils/date';

export function LockScreen() {
  const { data, hasPasscode, reset } = useApp();
  const insets = useSafeAreaInsets();
  const line = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    line.setValue(0);
    Animated.timing(line, {
      toValue: 1,
      duration: 1100,
      easing: Easing.bezier(0.2, 0.7, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [line]);

  const open = () => {
    if (!data.onboarded) reset('welcome');
    else if (hasPasscode) reset('passcode');
    else reset('today');
  };

  return (
    <View style={[styles.root, { paddingBottom: Math.max(60, insets.bottom + 40) }]}>
      <View>
        <LogoMark size={40} />
        <Kicker style={{ marginTop: 26 }}>Private journal</Kicker>
        <Text style={styles.wordmark}>introvirght</Text>
        <Animated.View
          style={[
            styles.line,
            { transform: [{ scaleX: line }] },
          ]}
        />
        <Text style={styles.sub}>{fullDate(new Date())}.{'\n'}The page has been waiting.</Text>
      </View>
      <View style={{ gap: 18 }}>
        <PrimaryButton label="Open the diary" onPress={open} />
        <View style={styles.lockedRow}>
          <LockIcon size={13} color={colors.faint} />
          <Text style={styles.lockedText}>Locked with your fingerprint · Nothing leaves this device</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
    justifyContent: 'space-between',
    paddingTop: 120,
    paddingHorizontal: 34,
  },
  wordmark: {
    fontFamily: serif(400),
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -0.9,
    color: colors.ink,
    marginTop: 14,
  },
  line: {
    height: 1,
    backgroundColor: colors.hair,
    marginTop: 26,
    marginBottom: 22,
    transformOrigin: 'left',
  } as any,
  sub: {
    fontFamily: serif(300),
    fontStyle: 'italic',
    fontSize: 19,
    lineHeight: 28,
    color: colors.muted,
    maxWidth: 250,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockedText: {
    fontFamily: sans(400),
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: colors.faint,
  },
});
