import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { BackLink, Kicker } from '../components/Basics';
import { GoogleMark } from '../icons/Icons';
import { useApp } from '../state/AppState';
import { useEchoes } from '../echoes/EchoesState';
import { useGoogleSignIn } from '../echoes/authClient';

const FACTS = [
  'Your diary is never signed in. It stays on this device with no account.',
  'You choose the name you write under. It can be your own or not.',
  'We keep a hash of your email so one person cannot become a hundred.',
];

export function SigninScreen() {
  const { goBack, navigate, data } = useApp();
  const { completeGoogleSignIn } = useEchoes();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [error, setError] = useState<string | null>(null);

  const google = useGoogleSignIn(
    (session) => {
      // A first-time signer has no name yet, and picking one is the next thing that has to
      // happen — replace, so Back does not walk into the sign-in screen again (§1).
      completeGoogleSignIn(session).then(() => {
        if (!data.echoName) navigate('naming', { replace: true });
        else goBack();
      });
    },
    (message) => setError(message)
  );

  return (
    <View style={styles.root}>
      <BackLink label="Back" onPress={goBack} />

      <View style={{ marginTop: 30 }}>
        <Kicker>Echoes only</Kicker>
        <Text style={styles.title}>To read other people, we need to know you are one.</Text>
        <Text style={styles.sub}>Signing in keeps Echoes free of bots. Your diary stays exactly as it was — no account, no email, nothing.</Text>

        <View style={{ marginTop: 26, gap: 14 }}>
          {FACTS.map((f, i) => (
            <View key={i} style={styles.factRow}>
              <View style={styles.factDot} />
              <Text style={styles.factText}>{f}</Text>
            </View>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.bottom}>
        <Pressable
          onPress={() => google.signIn()}
          disabled={!google.ready || google.exchanging}
          style={({ pressed }) => [styles.googleBtn, pressed && { backgroundColor: colors.paperSunk }]}
        >
          <GoogleMark size={17} />
          <Text style={styles.googleLabel}>{google.exchanging ? 'Signing in…' : 'Continue with Google'}</Text>
        </Pressable>
        {!google.configured && <Text style={styles.notConfigured}>Google sign-in isn't configured on this build yet.</Text>}

        <Pressable onPress={goBack} style={{ marginTop: 16, alignSelf: 'center' }} hitSlop={8}>
          <Text style={styles.keepPrivate}>Keep writing privately instead</Text>
        </Pressable>

        <Text style={styles.footnote}>
          We store a hash of your email, nothing else. It is never shown{'\n'}beside your name, and never used to contact you.
        </Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 74, paddingHorizontal: 34, paddingBottom: 30 },
    title: { fontFamily: serif(400), fontSize: 30, lineHeight: 36, letterSpacing: -0.57, color: colors.ink, marginTop: 14, maxWidth: 300 },
    sub: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 18, lineHeight: 26, color: colors.muted, marginTop: 16, maxWidth: 300 },
    factRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    factDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.chevron, marginTop: 8 },
    factText: { fontFamily: serif(300), fontSize: 16.5, lineHeight: 24, color: colors.ink4, flex: 1 },
    error: { fontFamily: sans(400), fontSize: 11, color: colors.warn, marginTop: 20 },
    bottom: { marginTop: 'auto' },
    // Google branding requires the unmodified mark on a non-brand-colour ground; on Night
    // this naturally becomes a dark background + light border/text, which matches
    // Google's own documented dark-theme button treatment rather than fighting it.
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      width: '100%',
      borderWidth: 1,
      borderColor: colors.ink,
      borderRadius: 2,
      paddingVertical: 17,
      backgroundColor: colors.paper,
    },
    googleLabel: { fontFamily: sans(400), fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.ink },
    notConfigured: { fontFamily: sans(400), fontSize: 10, color: colors.faint, textAlign: 'center', marginTop: 10 },
    keepPrivate: { fontFamily: sans(400), fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase', color: colors.faint },
    footnote: { fontFamily: sans(400), fontSize: 10, lineHeight: 16, color: colors.faint, textAlign: 'center', marginTop: 20 },
  });
}
