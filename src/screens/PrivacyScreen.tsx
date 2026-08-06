import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { BackLink } from '../components/Basics';
import { useApp } from '../state/AppState';

const ROWS = [
  { title: 'Encrypted before it leaves the app', body: 'Every page is sealed on this device. What syncs is unreadable text.' },
  { title: 'No account to create', body: 'You are not a row in a users table. There is nothing to sign in to.' },
  { title: 'Nothing in analytics', body: 'We count app opens. We never see a word you wrote, a mood, or a title.' },
  { title: 'Yours to take away', body: 'Export the whole diary as plain text files at any time, no subscription needed.' },
];

export function PrivacyScreen() {
  const { navigate } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: 26 }}>
        <BackLink label="You" onPress={() => navigate('you', { replace: true })} />
      </View>
      <View style={{ paddingHorizontal: 26, paddingTop: 22 }}>
        <Text style={styles.title}>We cannot read your diary.</Text>
        <Text style={styles.sub}>That is not a promise in a policy. It is what the encryption makes possible.</Text>
        <View style={{ marginTop: 30 }}>
          {ROWS.map((r) => (
            <View key={r.title} style={styles.row}>
              <Text style={styles.rowTitle}>{r.title}</Text>
              <Text style={styles.rowBody}>{r.body}</Text>
            </View>
          ))}
        </View>
        <View style={styles.explainer}>
          <Text style={styles.explainerText}>
            Entries are encrypted on your device with a key held in your keychain. Sync moves ciphertext only. If you lose the key, nobody — including us — can recover the text.
          </Text>
        </View>
        <View style={{ height: 26 }} />
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 58 },
    title: { fontFamily: serif(400), fontSize: 31, lineHeight: 37, letterSpacing: -0.5, color: colors.ink, maxWidth: 280 },
    sub: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 19, lineHeight: 28, color: colors.muted, marginTop: 14 },
    row: { paddingVertical: 20, borderTopWidth: 1, borderTopColor: colors.hair2 },
    rowTitle: { fontFamily: serif(400), fontSize: 19, letterSpacing: -0.1, color: colors.ink },
    rowBody: { fontFamily: serif(300), fontSize: 16.5, lineHeight: 25, color: colors.muted, marginTop: 7 },
    explainer: { marginTop: 26, padding: 20, backgroundColor: colors.paperSunk },
    explainerText: { fontFamily: sans(400), fontSize: 11, lineHeight: 19, color: colors.ink4 },
  });
}
