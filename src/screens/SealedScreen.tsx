import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { serif, sans } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { useApp } from '../state/AppState';

export function SealedScreen() {
  const { todaysEntry, goEntries } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 800,
      easing: Easing.bezier(0.2, 0.7, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const dayNum = new Date().getDate();
  const words = todaysEntry?.wordCount ?? 0;

  return (
    <View style={styles.root}>
      <Animated.View
        style={{
          opacity: anim,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
          alignItems: 'center',
        }}
      >
        <View style={styles.circle}>
          <Text style={styles.circleNum}>{dayNum}</Text>
        </View>
        <Text style={styles.title}>Today is sealed.</Text>
        <Text style={styles.note}>{words} words · nobody else will see them</Text>
        <View style={styles.rule} />
        <Pressable onPress={goEntries} hitSlop={8}>
          <Text style={styles.readBack}>Read it back</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 90 },
    circle: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
    circleNum: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 15, color: colors.ink },
    title: { fontFamily: serif(300), fontSize: 29, letterSpacing: -0.46, color: colors.ink, marginTop: 30 },
    note: { fontFamily: serif(300), fontStyle: 'italic', fontSize: 18, color: colors.muted, marginTop: 12, textAlign: 'center' },
    rule: { height: 1, width: 60, backgroundColor: colors.hair, marginVertical: 32 },
    readBack: { fontFamily: sans(400), fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.muted, padding: 8 },
  });
}
