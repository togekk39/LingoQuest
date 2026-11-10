import { useTheme } from './theme';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { MotionPressable, useReducedMotion } from './motion';

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
    <MotionPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
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
        { opacity: disabled || loading ? 0.45 : pressed ? 0.9 : 1 },
        variant === 'primary' && { borderBottomWidth: 4, borderBottomColor: '#105B54' },
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
    </MotionPressable>
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
  accessibilityLabel,
}: {
  value: number;
  color?: string;
  height?: number;
  accessibilityLabel?: string;
}) {
  const { colors: C } = useTheme();
  color ??= C.teal;
  const reduced = useReducedMotion();
  const target = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const fill = useRef(new Animated.Value(target)).current;
  useEffect(() => {
    if (reduced) {
      fill.setValue(target);
      return;
    }
    const animation = Animated.timing(fill, {
      toValue: target,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [target, reduced, fill]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(target * 100) }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(target * 100)}
      style={{ height, backgroundColor: C.line, borderRadius: 8, overflow: 'hidden' }}
    >
      <Animated.View
        style={{
          height: '100%',
          width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
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
