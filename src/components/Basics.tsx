import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle, PressableStateCallbackType } from 'react-native';
import { sans, serif } from '../theme/fonts';
import { useTheme } from '../theme/ThemeState';
import { ChevronLeft } from '../icons/Icons';

/** A structural micro-label: Instrument Sans, uppercase, tracked. */
export function Kicker({
  children,
  color,
  size = 9.5,
  tracking = 1.7,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
  tracking?: number;
  style?: TextStyle;
}) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: sans(400),
          fontSize: size,
          letterSpacing: tracking,
          textTransform: 'uppercase',
          color: color ?? colors.faint,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Hairline({ style, color }: { style?: ViewStyle; color?: string }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: color ?? colors.hair }, style]} />;
}

export function PrimaryButton({
  label,
  onPress,
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: pressed ? colors.inkHover : colors.ink, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Text style={[styles.primaryLabel, { color: colors.paper }]}>{label}</Text>
    </Pressable>
  );
}

export function BorderedButton({
  label,
  onPress,
  style,
  padding = 18,
}: {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  padding?: number;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.bordered,
        { paddingVertical: padding, borderColor: pressed ? colors.ink : colors.hair3 },
        style,
      ]}
    >
      {({ pressed }) => (
        <Text style={[styles.borderedLabel, { color: pressed ? colors.ink : colors.ink4 }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function TextButton({
  label,
  onPress,
  color,
  hoverColor,
  style,
  icon,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  hoverColor?: string;
  style?: ViewStyle;
  icon?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const base = color ?? colors.faint;
  const hover = hoverColor ?? colors.ink;
  return (
    <Pressable onPress={onPress} style={[styles.textButtonRow, style]}>
      {({ pressed }) => (
        <>
          {icon}
          <Text style={[styles.textButtonLabel, { color: pressed ? hover : base }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function BackLink({ label = 'Back', onPress }: { label?: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.backRow} hitSlop={8}>
      {({ pressed }) => (
        <>
          <ChevronLeft size={13} color={pressed ? colors.ink : colors.faint} />
          <Text style={[styles.textButtonLabel, { color: pressed ? colors.ink : colors.faint }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function ScreenTitle({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { colors } = useTheme();
  return <Text style={[styles.screenTitle, { color: colors.ink }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  primary: {
    width: '100%',
    paddingVertical: 19,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: sans(400),
    fontSize: 11,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  bordered: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderedLabel: {
    fontFamily: sans(400),
    fontSize: 11,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  textButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  textButtonLabel: {
    fontFamily: sans(400),
    fontSize: 10.5,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  screenTitle: {
    fontFamily: serif(400),
    fontSize: 34,
    letterSpacing: -0.7,
  },
});
