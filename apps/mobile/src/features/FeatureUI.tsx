import { useTheme } from '../theme';
import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ArrowLeft, ArrowRight, Settings2, Volume2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardOverlap } from './useKeyboardOverlap';
import { MotionEntrance, MotionPressable } from '../motion';
import { ProgressBar } from '../ui';
import { JournalLeaf, PaperEdge, PaperGrain } from '../Journal';

export const InputViewportContext = createContext<{
  revealInput: (input: TextInput | null) => void;
  revealItem: (item: View, isCurrent: () => boolean) => void;
  maxHeight: number;
}>({ revealInput: () => {}, revealItem: () => {}, maxHeight: 200 });

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
  journal = false,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  journal?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors: palette, mode } = useTheme();
  const f = useFeatureStyles();
  const clay = journal && !secondary && mode === 'light';

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        f.action,
        secondary ? f.actionSecondary : f.actionPrimary,
        journal && f.journalAction,
        clay && { backgroundColor: disabled ? '#AA6350' : palette.accent },
        (disabled || busy) && !clay && { opacity: 0.48 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? palette.teal : 'white'} />
      ) : (
        <Text
          style={[
            f.actionText,
            journal && f.journalActionText,
            secondary && { color: palette.teal },
          ]}
        >
          {children}
        </Text>
      )}
      {!secondary && !busy && <ArrowRight color="white" size={18} />}
    </MotionPressable>
  );
}
export function FlowFrame({
  title,
  eyebrow,
  onClose,
  children,
  footer,
  feedback,
  progress,
  stepKey,
  journal,
  onVoiceSettings,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  feedback?: React.ReactNode;
  progress?: number;
  stepKey?: string;
  journal?: {
    onListen?: () => void;
    onSettings?: () => void;
    storybook?: boolean;
    wide?: boolean;
    banner?: React.ReactNode;
  };
  onVoiceSettings?: () => void;
}) {
  const { colors: palette } = useTheme();
  const f = useFeatureStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const frame = useRef<View>(null);
  const scroll = useRef<ScrollView>(null);
  const { overlap, measureOverlap } = useKeyboardOverlap(frame);
  const focusedInput = useRef<TextInput | null>(null);
  const scrollOffset = useRef(0);
  const pendingFrame = useRef<number | null>(null);
  const [inputMaxHeight, setInputMaxHeight] = useState(200);
  const hasFeedback = !!feedback;
  const revealItem = useCallback((item: View | TextInput, isCurrent: () => boolean) => {
    scroll.current?.getNativeScrollRef()?.measureInWindow((_x, top, _width, height) => {
      item.measureInWindow((_x, itemTop, _width, itemHeight) => {
        if (!isCurrent() || height <= 0) return;
        const bottom = top + height - 16;
        const delta =
          itemTop < top + 16 ? itemTop - top - 16 : Math.max(0, itemTop + itemHeight - bottom);
        if (Math.abs(delta) > 1)
          scroll.current?.scrollTo({
            y: Math.max(0, scrollOffset.current + delta),
            animated: false,
          });
      });
    });
  }, []);
  const revealFocusedInput = useCallback(() => {
    if (hasFeedback) return;
    if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current);
    pendingFrame.current = requestAnimationFrame(() => {
      pendingFrame.current = null;
      const input = focusedInput.current;
      if (!input) return;
      revealItem(input, () => focusedInput.current === input);
    });
  }, [hasFeedback, revealItem]);
  const revealInput = useCallback(
    (input: TextInput | null) => {
      focusedInput.current = input;
      if (input) revealFocusedInput();
    },
    [revealFocusedInput],
  );
  useEffect(() => {
    return () => {
      focusedInput.current = null;
      if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current);
    };
  }, [revealFocusedInput]);
  const contentTop = useRef(0);
  const feedbackTop = useRef<number | null>(null);
  const feedbackFrame = useRef<number | null>(null);
  const revealFeedback = useCallback(() => {
    if (!hasFeedback || feedbackTop.current === null) return;
    if (feedbackFrame.current !== null) cancelAnimationFrame(feedbackFrame.current);
    feedbackFrame.current = requestAnimationFrame(() => {
      feedbackFrame.current = null;
      if (feedbackTop.current === null) return;
      scroll.current?.scrollTo({
        y: Math.max(0, contentTop.current + feedbackTop.current - 12),
        animated: false,
      });
    });
  }, [hasFeedback]);

  useEffect(() => {
    if (!hasFeedback) {
      feedbackTop.current = null;
      scroll.current?.scrollTo({ y: 0, animated: false });
    }
    return () => {
      if (feedbackFrame.current !== null) cancelAnimationFrame(feedbackFrame.current);
    };
  }, [hasFeedback, stepKey]);

  return (
    <View
      ref={frame}
      style={[
        f.frame,
        journal && { paddingTop: insets.top, paddingBottom: overlap ? 0 : insets.bottom },
      ]}
      onLayout={measureOverlap}
    >
      {journal && <PaperGrain />}
      <View
        style={[
          journal ? f.journalTopbar : f.topbar,
          journal?.storybook && f.storybookTopbar,
          journal?.wide && f.storybookWide,
        ]}
      >
        {!journal && <PaperEdge edge="bottom" tint={palette.white} />}
        <Pressable
          accessibilityLabel="Cerrar y volver"
          accessibilityRole="button"
          onPress={onClose}
          style={[f.close, journal && f.journalControl]}
        >
          {journal ? (
            <ArrowLeft size={24} color={palette.ink} />
          ) : (
            <X size={22} color={palette.ink} />
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[f.eyebrow, journal?.storybook && f.storybookEyebrow]}>{eyebrow}</Text>
          <Text
            accessibilityRole="header"
            style={[
              journal ? f.journalTitle : f.topTitle,
              journal?.storybook && f.storybookTitle,
              journal?.storybook && width < 520 && f.storybookTitleCompact,
            ]}
          >
            {title}
          </Text>
        </View>
        {journal ? (
          <View style={f.journalTools}>
            {journal.onListen && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Escuchar ejemplo de la lección"
                onPress={journal.onListen}
                style={f.journalControl}
              >
                <Volume2 size={23} color={palette.ink} />
              </Pressable>
            )}
            {(journal.onSettings || onVoiceSettings) && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={onVoiceSettings ? 'Configuración de voz' : 'Configuración'}
                onPress={journal.onSettings ?? onVoiceSettings}
                style={f.journalControl}
              >
                <Settings2 size={21} color={palette.ink} />
              </Pressable>
            )}
          </View>
        ) : onVoiceSettings ? (
          <Pressable
            accessibilityLabel="Configuración de voz"
            accessibilityRole="button"
            onPress={onVoiceSettings}
            style={f.close}
          >
            <Volume2 size={20} color={palette.teal} />
          </Pressable>
        ) : (
          <View style={f.safetyDot}>
            <View style={f.dot} />
            <Text style={f.safetyText}>A tu ritmo</Text>
          </View>
        )}
      </View>
      {journal?.banner && (
        <View
          style={[
            f.journalBanner,
            journal.storybook && f.storybookBanner,
            journal.wide && f.storybookWide,
          ]}
        >
          {journal.banner}
        </View>
      )}
      {progress !== undefined && (
        <View style={journal && f.journalProgress}>
          <ProgressBar
            accessibilityLabel={`Progreso: ${Math.round(progress * 100)} por ciento`}
            value={progress}
            height={5}
            color={journal ? palette.accent : palette.primary}
          />
        </View>
      )}
      <ScrollView
        ref={scroll}
        testID="flow-scroll"
        style={{ flex: 1 }}
        contentContainerStyle={[f.scroll, journal && f.journalScroll]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={revealFeedback}
        onLayout={(event) => {
          revealFeedback();
          // Leave space around the field; long answers scroll inside the input.
          setInputMaxHeight(Math.max(1, event.nativeEvent.layout.height - 32));
          revealFocusedInput();
        }}
        onScroll={(event) => {
          scrollOffset.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <InputViewportContext.Provider
          value={{ revealInput, revealItem, maxHeight: inputMaxHeight }}
        >
          <View
            style={[
              f.content,
              journal && f.journalWidth,
              journal?.storybook && f.storybookWidth,
              journal?.wide && f.storybookWide,
            ]}
            onLayout={(event) => {
              contentTop.current = event.nativeEvent.layout.y;
              revealFeedback();
            }}
          >
            <MotionEntrance key={stepKey} style={{ gap: journal ? 16 : 22 }}>
              {children}
              {hasFeedback && (
                <View
                  onLayout={(event) => {
                    feedbackTop.current = event.nativeEvent.layout.y;
                    revealFeedback();
                  }}
                >
                  {feedback}
                </View>
              )}
            </MotionEntrance>
          </View>
        </InputViewportContext.Provider>
      </ScrollView>
      {footer && (
        <View testID="flow-footer" style={journal ? f.journalFooter : f.footer}>
          {journal ? <PaperGrain /> : <PaperEdge edge="top" tint={palette.white} />}
          <View style={[f.footerContent, journal && f.journalWidth]}>{footer}</View>
        </View>
      )}
      {/* A real layout spacer creates scroll room even when the OS overlays the keyboard. */}
      <View testID="keyboard-spacer" style={{ height: overlap, flexShrink: 0 }} />
    </View>
  );
}
export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const f = useFeatureStyles();

  return (
    <JournalLeaf compact kind="notebook" accessibilityRole="alert" style={f.error}>
      <Text style={f.errorTitle}>No pudimos conectar</Text>
      <Text style={f.body}>{message}</Text>
      {onRetry && (
        <Action secondary onPress={onRetry}>
          Intentar de nuevo
        </Action>
      )}
    </JournalLeaf>
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
      backgroundColor: palette.white,
      zIndex: 1,
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
    journalTopbar: {
      width: '100%',
      maxWidth: 686,
      alignSelf: 'center',
      paddingHorizontal: 14,
      paddingVertical: 7,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },
    journalTools: { flexDirection: 'row', alignItems: 'center' },
    journalControl: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
      borderRadius: 13,
      backgroundColor: palette.mint,
    },
    journalTitle: {
      fontFamily: 'LoraBold',
      fontSize: 19,
      lineHeight: 24,
      marginTop: 2,
      color: palette.ink,
    },
    storybookTopbar: { maxWidth: 768, paddingTop: 17, paddingBottom: 8, gap: 12 },
    storybookEyebrow: { fontFamily: 'ManropeBold', fontSize: 11, letterSpacing: 2.4 },
    storybookTitle: { fontSize: 31, lineHeight: 39, marginTop: 1 },
    storybookTitleCompact: { fontSize: 27, lineHeight: 34 },
    storybookWidth: { maxWidth: 736 },
    storybookWide: { maxWidth: 1120 },
    journalBanner: { width: '100%', maxWidth: 686, alignSelf: 'center', paddingHorizontal: 15 },
    storybookBanner: { maxWidth: 766 },
    journalProgress: { width: '100%', maxWidth: 686, alignSelf: 'center', paddingHorizontal: 16 },
    journalScroll: { paddingHorizontal: 15, paddingVertical: 12 },
    journalWidth: { maxWidth: 650 },
    journalFooter: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: palette.paper },
    safetyDot: { flexDirection: 'row', gap: 7, alignItems: 'center' },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.primary },
    safetyText: { fontFamily: 'Manrope', color: palette.muted, fontSize: 11 },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 38 },
    content: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 22 },
    footer: {
      paddingHorizontal: 24,
      paddingVertical: 18,
      zIndex: 1,
      backgroundColor: palette.white,
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
    actionPrimary: {
      backgroundColor: palette.primary,
      borderBottomWidth: 4,
      borderBottomColor: '#61261A',
    },
    journalAction: { borderRadius: 17, borderBottomWidth: 0, minHeight: 49, paddingVertical: 9 },
    journalActionText: { fontFamily: 'LoraBold', fontWeight: 'normal', fontSize: 17 },
    actionSecondary: {
      borderWidth: 1,
      borderColor: palette.line,
      backgroundColor: palette.white,
    },
    actionText: {
      fontFamily: 'Manrope',
      color: tone('white', 'text'),
      fontSize: 14,
      fontWeight: '700',
    },
    title: { fontFamily: 'LoraBold', fontSize: 32, lineHeight: 40, color: palette.ink },
    body: { fontFamily: 'Manrope', fontSize: 15, lineHeight: 25, color: palette.muted },
    card: {
      backgroundColor: palette.white,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.line,
      padding: 25,
      gap: 15,
    },
    cardTitle: { fontFamily: 'LoraBold', fontSize: 21, color: palette.ink },
    error: {
      padding: 22,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: tone('#E8CEC5', 'border'),
      backgroundColor: tone('#FFF8F3', 'background'),
      gap: 14,
    },
    errorTitle: { fontFamily: 'Journal', fontSize: 20, color: palette.ink },
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
