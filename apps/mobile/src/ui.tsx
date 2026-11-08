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
export const C = {
  ink: '#173F43',
  teal: '#167D72',
  mint: '#DCF3E9',
  orange: '#EFA055',
  paper: '#F7FAF7',
  muted: '#6F8380',
  line: '#E3EBE5',
  white: '#FFFFFF',
  red: '#B84B50',
};
export function Label({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[u.label, style]}>{children}</Text>;
}
export function Heading({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[u.heading, style]}>{children}</Text>;
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
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
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        u.button,
        variant === 'primary'
          ? { backgroundColor: C.teal }
          : variant === 'secondary'
            ? { backgroundColor: C.mint }
            : variant === 'danger'
              ? { backgroundColor: '#FBEAEB' }
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
              { color: variant === 'primary' ? 'white' : variant === 'danger' ? C.red : C.teal },
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
  color = C.teal,
  bg = C.mint,
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}) {
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
  color = C.teal,
  height = 7,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
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
const u = StyleSheet.create({
  label: { fontFamily: 'Manrope', fontSize: 13, color: C.muted, lineHeight: 21 },
  heading: { fontFamily: 'OutfitSemiBold', fontSize: 25, color: C.ink },
  card: {
    backgroundColor: 'white',
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
