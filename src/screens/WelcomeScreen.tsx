import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { sans, serif } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { LogoMark } from '../icons/Icons';
import { BorderedButton, PrimaryButton } from '../components/Basics';
import { useApp } from '../state/AppState';

const FACTS = [
  'No email, no password, no profile to fill in.',
  'Encrypted on this device before anything is stored.',
  'Free to write in, forever.',
];

export function WelcomeScreen() {
  const { navigate } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      <LogoMark size={40} />
      <Text style={styles.wordmark}>introvirght</Text>
      <Text style={styles.sub}>A diary for the inward. There is nothing to sign up for.</Text>
      <View style={styles.spacer} />
      <View style={{ gap: 14, paddingBottom: 24 }}>
        {FACTS.map((f) => (
          <View key={f} style={styles.factRow}>
            <View style={styles.dot} />
            <Text style={styles.factText}>{f}</Text>
          </View>
        ))}
      </View>
      <PrimaryButton label="Start a new diary" onPress={() => navigate('passcode')} />
      <BorderedButton
        label="I already have one"
        onPress={() => navigate('passcode')}
        padding={18}
        style={{ marginTop: 12 }}
      />
      <Text style={styles.footnote}>
        By starting you agree to nothing. There is no account,{'\n'}no email, and no terms you have to read.
      </Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.paper,
      paddingTop: 96,
      paddingHorizontal: 34,
      paddingBottom: 46,
    },
    wordmark: {
      fontFamily: serif(400),
      fontSize: 38,
      lineHeight: 40,
      letterSpacing: -0.9,
      color: colors.ink,
      marginTop: 26,
    },
    sub: {
      fontFamily: serif(300),
      fontStyle: 'italic',
      fontSize: 20,
      lineHeight: 30,
      color: colors.muted,
      marginTop: 14,
      maxWidth: 270,
    },
    spacer: { flex: 1 },
    factRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.bulletDot, marginTop: 8 },
    factText: { fontFamily: serif(300), fontSize: 16.5, lineHeight: 24, color: colors.ink4, flex: 1 },
    footnote: {
      fontFamily: sans(400),
      fontSize: 10,
      letterSpacing: 0.4,
      color: colors.faint,
      textAlign: 'center',
      marginTop: 18,
      lineHeight: 16,
    },
  });
}
