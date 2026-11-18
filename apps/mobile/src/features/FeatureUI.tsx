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
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ArrowLeft, ArrowRight, Settings2, Volume2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardOverlap } from './useKeyboardOverlap';
import { MotionEntrance, MotionPressable } from '../motion';
import { ProgressBar } from '../ui';
import { JournalBrand, PaperGrain } from '../Journal';
import { ThemeButton } from '../ThemePicker';

export const InputViewportContext = createContext<{
  revealInput: (input: TextInput | null) => void;
  maxHeight: number;
}>({ revealInput: () => {}, maxHeight: 200 });

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
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  feedback?: React.ReactNode;
  progress?: number;
  stepKey?: string;
  journal?: { onListen?: () => void; onSettings?: () => void };
}) {
  const { colors: palette } = useTheme();
  const f = useFeatureStyles();
  const insets = useSafeAreaInsets();
  const frame = useRef<View>(null);
  const scroll = useRef<ScrollView>(null);
  const { overlap, measureOverlap } = useKeyboardOverlap(frame);
  const focusedInput = useRef<TextInput | null>(null);
  const scrollOffset = useRef(0);
  const pendingFrame = useRef<number | null>(null);
  const [inputMaxHeight, setInputMaxHeight] = useState(200);
  const revealFocusedInput = useCallback(() => {
    if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current);
    pendingFrame.current = requestAnimationFrame(() => {
      pendingFrame.current = null;
      const input = focusedInput.current;
      if (!input) return;
      // Measure the actual scroll viewport: it excludes the header, footer and keyboard.
      scroll.current?.getNativeScrollRef()?.measureInWindow((_x, top, _width, height) => {
        input.measureInWindow((_inputX, inputTop, _inputWidth, inputHeight) => {
          if (focusedInput.current !== input || height <= 0) return;
          const bottom = top + height - 16;
          const delta =
            inputTop < top + 16
              ? inputTop - top - 16
              : Math.max(0, inputTop + inputHeight - bottom);
          if (Math.abs(delta) > 1)
            scroll.current?.scrollTo({
              y: Math.max(0, scrollOffset.current + delta),
              animated: false,
            });
        });
      });
    });
  }, []);
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
  const hasFeedback = !!feedback;

  useEffect(() => {
    // Retrying returns to the question instead of leaving it above the viewport.
    if (!hasFeedback) scroll.current?.scrollTo({ y: 0, animated: false });
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
      {journal && (
        <View style={f.masthead}>
          <View style={f.mastheadContent}>
            <JournalBrand small />
            <View style={f.row}>
              <ThemeButton />
              {journal.onSettings && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Configuración"
                  onPress={journal.onSettings}
                  style={f.journalIcon}
                >
                  <Settings2 size={21} color={palette.ink} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      )}
      <View style={journal ? f.journalTopbar : f.topbar}>
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
          <Text style={f.eyebrow}>{eyebrow}</Text>
          <Text accessibilityRole="header" style={journal ? f.journalTitle : f.topTitle}>
            {title}
          </Text>
        </View>
        {journal ? (
          journal.onListen && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Escuchar ejemplo de la lección"
              onPress={journal.onListen}
              style={[f.close, f.journalControl]}
            >
              <Volume2 size={23} color={palette.ink} />
            </Pressable>
          )
        ) : (
          <View style={f.safetyDot}>
            <View style={f.dot} />
            <Text style={f.safetyText}>A tu ritmo</Text>
          </View>
        )}
      </View>
      {progress !== undefined && (
        <View style={journal && f.journalProgress}>
          <ProgressBar
            accessibilityLabel={`Progreso: ${Math.round(progress * 100)} por ciento`}
            value={progress}
            height={journal ? 8 : 5}
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
        onLayout={(event) => {
          // Leave space around the field; long answers scroll inside the input.
          setInputMaxHeight(Math.max(1, event.nativeEvent.layout.height - 32));
          revealFocusedInput();
        }}
        onScroll={(event) => {
          scrollOffset.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <InputViewportContext.Provider value={{ revealInput, maxHeight: inputMaxHeight }}>
          <View
            style={[f.content, journal && f.journalWidth]}
            onLayout={(event) => {
              contentTop.current = event.nativeEvent.layout.y;
            }}
          >
            <MotionEntrance key={stepKey} style={{ gap: journal ? 16 : 22 }}>
              {children}
              {hasFeedback && (
                <View
                  onLayout={(event) => {
                    // Layout coordinates include all teaching content and expanded help.
                    // Align the start, so even a tall explanation begins on screen.
                    scroll.current?.scrollTo({
                      y: Math.max(0, contentTop.current + event.nativeEvent.layout.y - 12),
                      animated: false,
                    });
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
          {journal && <PaperGrain />}
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
    masthead: { borderBottomWidth: 1, borderBottomColor: palette.line, paddingHorizontal: 18 },
    mastheadContent: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 650,
      minHeight: 55,
      paddingVertical: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    journalIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    journalTopbar: {
      width: '100%',
      maxWidth: 686,
      alignSelf: 'center',
      paddingHorizontal: 18,
      paddingVertical: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },
    journalControl: { width: 46, height: 46, borderColor: palette.line, borderRadius: 14 },
    journalTitle: {
      fontFamily: 'LoraBold',
      fontSize: 23,
      lineHeight: 29,
      marginTop: 2,
      color: palette.ink,
    },
    journalProgress: { width: '100%', maxWidth: 686, alignSelf: 'center', paddingHorizontal: 16 },
    journalScroll: { paddingHorizontal: 18, paddingVertical: 15 },
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
    actionPrimary: {
      backgroundColor: palette.primary,
      borderBottomWidth: 4,
      borderBottomColor: '#105B54',
    },
    journalAction: { borderRadius: 17, borderBottomWidth: 0, minHeight: 49, paddingVertical: 9 },
    journalActionText: { fontFamily: 'LoraBold', fontWeight: 'normal', fontSize: 17 },
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
    title: { fontFamily: 'LoraBold', fontSize: 32, lineHeight: 40, color: palette.ink },
    body: { fontFamily: 'Manrope', fontSize: 15, lineHeight: 25, color: palette.muted },
    card: {
      backgroundColor: tone('white', 'background'),
      borderRadius: 22,
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
