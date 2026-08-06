import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { serif } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { Closeness } from '../state/types';

export function PersonAvatar({
  name,
  closeness,
  size,
  fontSize,
}: {
  name: string;
  closeness: Closeness;
  size: number;
  fontSize: number;
}) {
  const { colors, avatarRing } = useTheme();
  const ring = closeness === 'inner' ? avatarRing.inner : avatarRing.outer;
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, borderColor: ring }]}>
      <Text style={[styles.initial, { fontSize, color: colors.ink3 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: serif(300) },
});
