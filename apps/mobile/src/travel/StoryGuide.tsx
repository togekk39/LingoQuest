import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputViewportContext } from '../features/FeatureUI';
import { useTheme } from '../theme';

const guideSteps = {
  sam: {
    number: 1,
    title: 'Habla con los personajes',
    instruction: (label: string) =>
      `Toca a ${label} en la plaza. Escucha su saludo y preséntate en inglés.`,
  },
  object: {
    number: 2,
    title: 'Examina los objetos',
    instruction: (label: string) => `Toca «${label}» para ver el mapa del reverso.`,
  },
  quests: {
    number: 3,
    title: 'Consulta tus misiones',
    instruction: () => 'Abre el resumen de misiones para ver qué hacer y seguir tu progreso.',
  },
} as const;

export type GuideStep = keyof typeof guideSteps;
export type StoryGuideStage = 'sam' | 'postcard-dialogue' | 'done';
export const storyGuideKey = 'storyGuideStage';
const margin = 12;
const gap = 12;
const spotlightPadding = 4;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function roundedCutout({ x, y, width, height }: LayoutRectangle) {
  const right = x + width;
  const bottom = y + height;
  const r = Math.min(9, width / 2, height / 2);
  return `M ${x + r} ${y} H ${right - r} Q ${right} ${y} ${right} ${y + r}
    V ${bottom - r} Q ${right} ${bottom} ${right - r} ${bottom}
    H ${x + r} Q ${x} ${bottom} ${x} ${bottom - r} V ${y + r}
    Q ${x} ${y} ${x + r} ${y} Z`;
}

export function StoryGuide({
  step,
  anchor,
  targetLabel,
  busy,
  error,
  onTarget,
  onSkip,
}: {
  step: GuideStep;
  anchor: View | null;
  targetLabel: string;
  busy: boolean;
  error?: string;
  onTarget: () => void;
  onSkip: () => void;
}) {
  const { colors: C } = useTheme();
  const { revealItem, observeViewport } = useContext(InputViewportContext);
  const inset = useSafeAreaInsets();
  const viewport = useRef<View>(null);
  const heading = useRef<View>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [target, setTarget] = useState<LayoutRectangle>();
  const [cardHeight, setCardHeight] = useState(0);
  const { number, title, instruction } = guideSteps[step];

  useEffect(() => {
    if (!anchor || !size.width || !size.height) return;
    let active = true;
    let frame: number | undefined;
    const measure = () => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        viewport.current?.measureInWindow((left, top) => {
          anchor.measureInWindow((x, y, width, height) => {
            if (!active) return;
            if (width <= 0 || height <= 0) {
              setTarget(undefined);
              return;
            }
            const next = { x: x - left, y: y - top, width, height };
            setTarget((previous) =>
              previous?.x === next.x &&
              previous.y === next.y &&
              previous.width === width &&
              previous.height === height
                ? previous
                : next,
            );
          });
        });
      });
    };
    const stop = observeViewport(measure);
    revealItem(anchor, () => active);
    measure();
    return () => {
      active = false;
      if (frame !== undefined) cancelAnimationFrame(frame);
      stop();
    };
  }, [anchor, observeViewport, revealItem, size]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onSkip();
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onSkip();
      return true;
    });
    return () => back.remove();
  }, [onSkip]);

  const ready = cardHeight > 0;
  useEffect(() => {
    if (!ready) return;
    const frame = requestAnimationFrame(() => {
      const item = heading.current;
      if (!item) return;
      if (Platform.OS === 'web') item.focus();
      else AccessibilityInfo.sendAccessibilityEvent(item, 'focus');
    });
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  const safeLeft = inset.left + margin;
  const safeRight = size.width - inset.right - margin;
  const safeTop = inset.top + margin;
  const safeBottom = size.height - inset.bottom - margin;
  const width = Math.min(330, Math.max(0, safeRight - safeLeft));
  const visibleTarget =
    target &&
    anchor &&
    target.x >= inset.left &&
    target.x + target.width <= size.width - inset.right &&
    target.y >= inset.top &&
    target.y + target.height <= size.height - inset.bottom;
  const verticalPadding = target
    ? Math.max(spotlightPadding, (44 - target.height) / 2)
    : spotlightPadding;
  const cutout = visibleTarget && {
    x: target.x - spotlightPadding,
    y: target.y - verticalPadding,
    width: target.width + spotlightPadding * 2,
    height: target.height + verticalPadding * 2,
  };
  const centerX = cutout ? cutout.x + cutout.width / 2 : size.width / 2;
  const left = clamp(centerX - width / 2, safeLeft, safeRight - width);
  const roomAbove = cutout ? cutout.y - gap - safeTop : 0;
  const roomBelow = cutout ? safeBottom - cutout.y - cutout.height - gap : 0;
  const above = roomAbove >= roomBelow;
  const available = Math.max(roomAbove, roomBelow);
  const attached = cutout && available >= 100;
  const maxHeight = attached ? available : Math.max(0, safeBottom - safeTop);
  const top = attached
    ? above
      ? Math.max(safeTop, cutout.y - gap - cardHeight)
      : cutout.y + cutout.height + gap
    : Math.max(safeTop, (size.height - cardHeight) / 2);

  return (
    <View
      ref={viewport}
      collapsable={false}
      testID="story-guide-overlay"
      accessibilityViewIsModal
      role="dialog"
      aria-modal
      aria-label="Guía rápida"
      onLayout={({ nativeEvent: { layout } }) =>
        setSize((current) =>
          current.width === layout.width && current.height === layout.height
            ? current
            : { width: layout.width, height: layout.height },
        )
      }
      style={styles.overlay}
    >
      {!!size.width && !!size.height && (
        <>
          <View
            testID="story-guide-scene-mask"
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={StyleSheet.absoluteFill}
          >
            <Svg width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`}>
              <Path
                d={`M 0 0 H ${size.width} V ${size.height} H 0 Z ${cutout ? roundedCutout(cutout) : ''}`}
                fill="rgba(13, 21, 17, 0.68)"
                fillRule="evenodd"
              />
            </Svg>
          </View>
          <View
            testID="story-guide"
            onLayout={({ nativeEvent: { layout } }) => setCardHeight(layout.height)}
            style={[styles.card, { top, left, width, maxHeight, backgroundColor: C.white }]}
          >
            {attached && (
              <View
                pointerEvents="none"
                style={[
                  styles.arrow,
                  { left: clamp(centerX - left - 9, 8, width - 26) },
                  above
                    ? { bottom: -9, borderTopWidth: 9, borderTopColor: C.white }
                    : { top: -9, borderBottomWidth: 9, borderBottomColor: C.white },
                ]}
              />
            )}
            <View style={styles.header}>
              <Text style={[styles.progress, { color: C.accent }]}>
                Guía rápida · {number} de 3
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onSkip}
                style={({ pressed }) => [styles.skip, pressed && { opacity: 0.7 }]}
              >
                <Text style={[styles.link, { color: C.ink }]}>Omitir guía</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.copy} keyboardShouldPersistTaps="handled" tabIndex={-1}>
              <View
                ref={heading}
                collapsable={false}
                accessible
                accessibilityRole="header"
                accessibilityLabel={title}
                tabIndex={-1}
              >
                <Text accessible={false} style={[styles.title, { color: C.ink }]}>
                  {title}
                </Text>
              </View>
              <Text style={[styles.instruction, { color: C.ink }]}>{instruction(targetLabel)}</Text>
              {!attached && (
                <Pressable
                  testID="story-guide-target"
                  accessibilityRole="button"
                  accessibilityLabel={targetLabel}
                  disabled={busy}
                  onPress={onTarget}
                  style={styles.skip}
                >
                  <Text style={[styles.link, { color: C.teal }]}>{targetLabel}</Text>
                </Pressable>
              )}
              {!!error && (
                <Text accessibilityRole="alert" style={[styles.instruction, { color: C.red }]}>
                  {error}
                </Text>
              )}
            </ScrollView>
          </View>
          {attached && (
            <Pressable
              testID="story-guide-target"
              accessibilityRole="button"
              accessibilityLabel={targetLabel}
              accessibilityState={{ disabled: busy, busy }}
              disabled={busy}
              onPress={onTarget}
              style={[
                styles.target,
                {
                  top: cutout.y,
                  left: cutout.x,
                  width: cutout.width,
                  height: cutout.height,
                  borderColor: C.gold,
                },
              ]}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  target: { position: 'absolute', borderWidth: 2, borderRadius: 9 },
  card: {
    position: 'absolute',
    zIndex: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingBottom: 13,
    boxShadow: '0 6px 20px rgba(13, 21, 17, 0.3)',
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 8,
  },
  progress: { fontFamily: 'ManropeBold', fontSize: 12 },
  skip: { minHeight: 44, paddingHorizontal: 3, justifyContent: 'center' },
  link: { fontFamily: 'ManropeBold', fontSize: 12, textDecorationLine: 'underline' },
  copy: { flexGrow: 0, flexShrink: 1 },
  title: { fontFamily: 'LoraBold', fontSize: 19, lineHeight: 24 },
  instruction: { fontFamily: 'Manrope', fontSize: 14, lineHeight: 20, marginTop: 5 },
});
