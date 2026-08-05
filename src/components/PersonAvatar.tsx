import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, avatarRing } from '../theme/colors';
import { serif } from '../theme/fonts';
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
  const ring = closeness === 'inner' ? avatarRing.inner : avatarRing.outer;
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, borderColor: ring }]}>
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: serif(300), color: colors.ink3 },
});
