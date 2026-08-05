import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { colors } from '../theme/colors';
import { serif, sans } from '../theme/fonts';
import { BackLink, TextButton } from '../components/Basics';
import { BiometricIcon } from '../icons/Icons';
import { useApp } from '../state/AppState';
import { setPasscode, checkPasscode } from '../storage/crypto';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function PasscodeScreen() {
  const { hasPasscode, setHasPasscode, reset, navigate } = useApp();
  const [code, setCode] = useState('');
  const [firstCode, setFirstCode] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyWidth = gridWidth > 0 ? gridWidth / 3 : 0;
  const onGridLayout = (e: LayoutChangeEvent) => setGridWidth(e.nativeEvent.layout.width);

  const creating = !hasPasscode;
  const confirming = creating && firstCode !== null;

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(async (hw) => {
      const enrolled = hw && (await LocalAuthentication.isEnrolledAsync());
      setBiometricAvailable(!!enrolled);
    });
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const title = code.length === 4 ? 'Unlocking…' : confirming ? 'Confirm your passcode' : 'Your diary passcode';
  const sub = wrong
    ? 'That is not it. Two tries left before the diary waits an hour.'
    : confirming
    ? 'Enter the same four digits again.'
    : creating
    ? 'Choose four digits. Only this device will ever check them.'
    : 'Four digits you chose when you first opened it. Only this device can check them.';

  const onDigit = (k: string) => {
    if (!k || code.length >= 4) return;
    setWrong(false);
    const next = code + k;
    setCode(next);
    if (next.length === 4) {
      timer.current = setTimeout(() => finish(next), 420);
    }
  };

  const onBackspace = () => {
    setWrong(false);
    setCode((c) => c.slice(0, -1));
  };

  const finish = async (value: string) => {
    if (creating) {
      if (!confirming) {
        setFirstCode(value);
        setCode('');
        return;
      }
      if (value === firstCode) {
        await setPasscode(value);
        setHasPasscode(true);
        navigate('onboard', { replace: true });
      } else {
        setWrong(true);
        setFirstCode(null);
        setCode('');
      }
      return;
    }
    const ok = await checkPasscode(value);
    if (ok) {
      reset('today');
    } else {
      setWrong(true);
      setCode('');
    }
  };

  const useFaceId = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock introvirght',
      cancelLabel: 'Cancel',
    });
    if (result.success) reset('today');
  };

  const lostIt = () => setWrong(true);

  const onBack = () => {
    if (creating && confirming) {
      setFirstCode(null);
      setCode('');
      return;
    }
    navigate('welcome', { replace: true });
  };

  return (
    <View style={styles.root}>
      <BackLink onPress={onBack} />
      <View style={{ marginTop: 44 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < code.length
                ? { backgroundColor: colors.ink, borderColor: colors.ink }
                : { backgroundColor: 'transparent', borderColor: colors.dotRing },
            ]}
          />
        ))}
      </View>
      <View style={styles.grid} onLayout={onGridLayout}>
        {KEYS.map((k, i) => (
          <Pressable
            key={i}
            onPress={() => (k === '⌫' ? onBackspace() : onDigit(k))}
            disabled={!k}
            style={({ pressed }) => [styles.key, { width: keyWidth }, pressed && k ? { backgroundColor: colors.keypadHover } : null]}
          >
            <Text style={[styles.keyLabel, { color: k ? colors.ink : 'transparent' }]}>{k}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.footer}>
        {!creating && biometricAvailable ? (
          <TextButton label="Use fingerprint" color={colors.ink4} hoverColor={colors.ink} onPress={useFaceId} icon={<BiometricIcon size={14} />} />
        ) : (
          <View />
        )}
        {!creating ? <TextButton label="Lost it" onPress={lostIt} /> : <View />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper, paddingTop: 74, paddingHorizontal: 34, paddingBottom: 40 },
  title: { fontFamily: serif(400), fontSize: 29, lineHeight: 35, letterSpacing: -0.5, color: colors.ink, maxWidth: 270 },
  sub: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 17, lineHeight: 26, color: colors.muted, marginTop: 12, maxWidth: 270 },
  dots: { flexDirection: 'row', gap: 16, marginTop: 36 },
  dot: { width: 13, height: 13, borderRadius: 7, borderWidth: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 'auto' },
  key: { paddingVertical: 19, alignItems: 'center', borderRadius: 2 },
  keyLabel: { fontFamily: serif(300), fontSize: 26 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.hair2,
  },
});
