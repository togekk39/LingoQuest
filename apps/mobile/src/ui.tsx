import { useTheme } from './theme';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

export function Label({ children, style }: { children: React.ReactNode; style?: any }) {
  const u = useStyles();

  return <Text style={[u.label, style]}>{children}</Text>;
}
export function Heading({ children, style }: { children: React.ReactNode; style?: any }) {
  const u = useStyles();

  return <Text style={[u.heading, style]}>{children}</Text>;
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const u = useStyles();

  return <View style={[u.card, style]}>{children}</View>;
}
export function Button({
  children,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled,
  loading,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors: C, tone } = useTheme();
  const u = useStyles();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        u.button,
        variant === 'primary'
          ? { backgroundColor: C.primary }
          : variant === 'secondary'
            ? { backgroundColor: C.mint }
            : variant === 'danger'
              ? { backgroundColor: tone('#FBEAEB', 'background') }
              : { backgroundColor: 'transparent' },
        style,
        { opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : C.teal} />
      ) : (
        <>
          {Icon && <Icon size={18} color={variant === 'primary' ? 'white' : C.teal} />}
          <Text
            style={[
              u.buttonText,
              {
                color:
                  variant === 'primary'
                    ? tone('white', 'text')
                    : variant === 'danger'
                      ? C.red
                      : C.teal,
              },
            ]}
          >
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}
export function Pill({
  children,
  color,
  bg,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
  const { colors: C } = useTheme();
  color ??= C.teal;
  bg ??= C.mint;

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: bg,
      }}
    >
      <Text style={{ fontFamily: 'ManropeBold', fontSize: 10, color, letterSpacing: 0.6 }}>
        {children}
      </Text>
    </View>
  );
}
export function ProgressBar({
  value,
  color,
  height = 7,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const { colors: C } = useTheme();
  color ??= C.teal;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{ height, backgroundColor: C.line, borderRadius: 8, overflow: 'hidden' }}
    >
      <View
        style={{
          height: '100%',
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          backgroundColor: color,
          borderRadius: 8,
        }}
      />
    </View>
  );
}
export function useStyles() {
  const { colors: C, tone } = useTheme();
  return StyleSheet.create({
    label: { fontFamily: 'Manrope', fontSize: 13, color: C.muted, lineHeight: 21 },
    heading: { fontFamily: 'OutfitSemiBold', fontSize: 25, color: C.ink },
    card: {
      backgroundColor: tone('white', 'background'),
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 20,
      padding: 24,
    },
    button: {
      minHeight: 47,
      borderRadius: 12,
      paddingHorizontal: 21,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
    },
    buttonText: { fontFamily: 'ManropeBold', fontSize: 12 },
  });
}
