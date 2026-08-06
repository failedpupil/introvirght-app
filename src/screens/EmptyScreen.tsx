import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { serif } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { PrimaryButton } from '../components/Basics';
import { useApp } from '../state/AppState';

export function EmptyScreen() {
  const { navigate } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Entries</Text>
      <View style={styles.hairline} />
      <View style={styles.center}>
        <View style={styles.circle}>
          <Text style={styles.circleNum}>1</Text>
        </View>
        <Text style={styles.headline}>Nothing here yet, which is exactly right for day one.</Text>
        <Text style={styles.sub}>Write four sentences tonight. In a month this page will be the reason you keep coming back.</Text>
        <PrimaryButton label="Open a page" onPress={() => navigate('write')} style={{ width: undefined, alignSelf: 'flex-start', paddingHorizontal: 26, paddingVertical: 15, marginTop: 28 }} />
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, paddingTop: 74, paddingHorizontal: 26, paddingBottom: 20 },
    title: { fontFamily: serif(400), fontSize: 34, letterSpacing: -0.7, color: colors.ink },
    hairline: { height: 1, backgroundColor: colors.hair, marginTop: 20 },
    center: { flex: 1, justifyContent: 'center', maxWidth: 290 },
    circle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.hair3, alignItems: 'center', justifyContent: 'center' },
    circleNum: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 14, color: colors.faint },
    headline: { fontFamily: serif(300), fontSize: 26, lineHeight: 34, letterSpacing: -0.3, color: colors.ink, marginTop: 26 },
    sub: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 18, lineHeight: 27, color: colors.muted, marginTop: 14 },
  });
}
