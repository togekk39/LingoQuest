import { useTheme } from '../theme';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ArrowLeft, ArrowRight, X } from 'lucide-react-native';

export const newEventId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });
export function Action({
  children,
  onPress,
  secondary = false,
  disabled = false,
  busy = false,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors: palette } = useTheme();
  const f = useFeatureStyles();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        f.action,
        secondary ? f.actionSecondary : f.actionPrimary,
        (disabled || busy) && { opacity: 0.48 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? palette.teal : 'white'} />
      ) : (
        <Text style={[f.actionText, secondary && { color: palette.teal }]}>{children}</Text>
      )}
      {!secondary && !busy && <ArrowRight color="white" size={18} />}
    </Pressable>
  );
}
export function FlowFrame({
  title,
  eyebrow,
  onClose,
  children,
  footer,
  progress,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  progress?: number;
}) {
  const { colors: palette } = useTheme();
  const f = useFeatureStyles();

  return (
    <View style={f.frame}>
      <View style={f.topbar}>
        <Pressable
          accessibilityLabel="Cerrar y volver"
          accessibilityRole="button"
          onPress={onClose}
          style={f.close}
        >
          <X size={22} color={palette.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={f.eyebrow}>{eyebrow}</Text>
          <Text style={f.topTitle}>{title}</Text>
        </View>
        <View style={f.safetyDot}>
          <View style={f.dot} />
          <Text style={f.safetyText}>A tu ritmo</Text>
        </View>
      </View>
      {progress !== undefined && (
        <View
          accessibilityLabel={`Progreso: ${Math.round(progress * 100)} por ciento`}
          style={f.progressTrack}
        >
          <View
            style={[f.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]}
          />
        </View>
      )}
      <ScrollView contentContainerStyle={f.scroll} keyboardShouldPersistTaps="handled">
        <View style={f.content}>{children}</View>
      </ScrollView>
      {footer && (
        <View style={f.footer}>
          <View style={f.footerContent}>{footer}</View>
        </View>
      )}
    </View>
  );
}
export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const f = useFeatureStyles();

  return (
    <View accessibilityRole="alert" style={f.error}>
      <Text style={f.errorTitle}>No pudimos conectar</Text>
      <Text style={f.body}>{message}</Text>
      {onRetry && (
        <Action secondary onPress={onRetry}>
          Intentar de nuevo
        </Action>
      )}
    </View>
  );
}
export function useFeatureStyles() {
  const { colors: palette, tone } = useTheme();
  return StyleSheet.create({
    frame: { flex: 1, backgroundColor: palette.paper },
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 24,
      paddingVertical: 22,
      backgroundColor: tone('white', 'background'),
      borderBottomWidth: 1,
      borderBottomColor: palette.line,
    },
    close: {
      width: 44,
      height: 44,
      borderWidth: 1,
      borderColor: palette.line,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    eyebrow: {
      fontFamily: 'Manrope',
      fontSize: 10,
      letterSpacing: 1.6,
      fontWeight: '700',
      color: palette.muted,
      textTransform: 'uppercase',
    },
    topTitle: { fontFamily: 'Outfit', fontSize: 19, color: palette.ink, marginTop: 3 },
    safetyDot: { flexDirection: 'row', gap: 7, alignItems: 'center' },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.primary },
    safetyText: { fontFamily: 'Manrope', color: palette.muted, fontSize: 11 },
    progressTrack: { height: 5, backgroundColor: tone('#E5EEE7', 'background') },
    progressFill: { height: 5, backgroundColor: palette.primary },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 38 },
    content: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 22 },
    footer: {
      paddingHorizontal: 24,
      paddingVertical: 18,
      borderTopWidth: 1,
      borderTopColor: palette.line,
      backgroundColor: tone('white', 'background'),
    },
    footerContent: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 12 },
    action: {
      minHeight: 52,
      paddingHorizontal: 22,
      paddingVertical: 14,
      borderRadius: 15,
      flexDirection: 'row',
      gap: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionPrimary: { backgroundColor: palette.primary },
    actionSecondary: {
      borderWidth: 1,
      borderColor: tone('#BED9CD', 'border'),
      backgroundColor: tone('#F8FCF9', 'background'),
    },
    actionText: {
      fontFamily: 'Manrope',
      color: tone('white', 'text'),
      fontSize: 14,
      fontWeight: '700',
    },
    title: { fontFamily: 'Outfit', fontSize: 36, lineHeight: 43, color: palette.ink },
    body: { fontFamily: 'Manrope', fontSize: 15, lineHeight: 25, color: palette.muted },
    card: {
      backgroundColor: tone('white', 'background'),
      borderRadius: 22,
      borderWidth: 1,
      borderColor: palette.line,
      padding: 25,
      gap: 15,
    },
    cardTitle: { fontFamily: 'Outfit', fontSize: 22, color: palette.ink },
    error: {
      padding: 22,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: tone('#E8CEC5', 'border'),
      backgroundColor: tone('#FFF8F3', 'background'),
      gap: 14,
    },
    errorTitle: { fontFamily: 'Outfit', fontSize: 20, color: palette.ink },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    quiet: { fontFamily: 'Manrope', fontSize: 12, lineHeight: 20, color: palette.muted },
    back: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44 },
    backText: { fontFamily: 'Manrope', color: palette.teal, fontSize: 13, fontWeight: '700' },
  });
}
export function BackLink({
  onPress,
  children = 'Volver a aprender',
}: {
  onPress: () => void;
  children?: React.ReactNode;
}) {
  const { colors: palette } = useTheme();
  const f = useFeatureStyles();

  return (
    <Pressable style={f.back} onPress={onPress}>
      <ArrowLeft color={palette.teal} size={17} />
      <Text style={f.backText}>{children}</Text>
    </Pressable>
  );
}
