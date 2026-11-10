import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const ReducedMotion = createContext(true);
const nativeDriver = Platform.OS !== 'web';

/** Both the device preference and the saved in-app preference can disable motion. */
export function MotionProvider({
  reducedMotion,
  children,
}: {
  reducedMotion: boolean;
  children: React.ReactNode;
}) {
  const [systemReduced, setSystemReduced] = useState(true);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setSystemReduced(media.matches);
      update();
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      changed = true;
      setSystemReduced(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active && !changed) setSystemReduced(value);
      })
      .catch(() => {});
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return (
    <ReducedMotion.Provider value={systemReduced || reducedMotion}>
      {children}
    </ReducedMotion.Provider>
  );
}
export const useReducedMotion = () => useContext(ReducedMotion);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Keep Pressable's keyboard, focus and disabled behavior while adding a tactile spring. */
export function MotionPressable({
  style,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  disabled,
  ...props
}: PressableProps) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const depth = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (reduced || disabled) {
      scale.stopAnimation();
      depth.stopAnimation();
      scale.setValue(1);
      depth.setValue(0);
    }
    return () => {
      scale.stopAnimation();
      depth.stopAnimation();
    };
  }, [reduced, disabled, scale, depth]);
  function spring(down: boolean, over = hovered) {
    if (reduced || disabled) return;
    Animated.parallel([
      Animated.spring(scale, {
        toValue: down ? 0.97 : over ? 1.015 : 1,
        speed: 28,
        bounciness: down ? 0 : 9,
        useNativeDriver: nativeDriver,
        isInteraction: false,
      }),
      Animated.spring(depth, {
        toValue: down ? 2 : 0,
        speed: 28,
        bounciness: 4,
        useNativeDriver: nativeDriver,
        isInteraction: false,
      }),
    ]).start();
  }
  const baseStyle = typeof style === 'function' ? style({ pressed, hovered }) : style;
  const transforms = StyleSheet.flatten(baseStyle)?.transform;
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        setPressed(true);
        spring(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        spring(false);
        onPressOut?.(event);
      }}
      onHoverIn={(event) => {
        setHovered(true);
        if (!pressed) spring(false, true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        if (!pressed) spring(false, false);
        onHoverOut?.(event);
      }}
      style={[
        baseStyle,
        {
          transform: [
            ...(Array.isArray(transforms) ? transforms : []),
            { scale },
            { translateY: depth },
          ],
        },
      ]}
    />
  );
}

export function MotionEntrance({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativeDriver,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [reduced, progress]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const confetti = Array.from({ length: 14 }, (_, index) => ({
  x: Math.cos((index / 14) * Math.PI * 2) * (52 + (index % 3) * 13),
  y: Math.sin((index / 14) * Math.PI * 2) * 48 - 22,
  color: ['#EFA055', '#167D72', '#91C9AB', '#E8BC57', '#74B9CD'][index % 5],
}));

/** A bounded, decorative burst: never intercepts a touch or loops over lesson text. */
export function Celebration({
  children,
  size = 150,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (reduced) return;
    setFinished(false);
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 1350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: nativeDriver,
      isInteraction: false,
    });
    animation.start(({ finished: completed }) => {
      if (completed) setFinished(true);
    });
    return () => animation.stop();
  }, [reduced, progress]);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {children}
      {!reduced && !finished && (
        <View
          testID="celebration-particles"
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
        >
          {confetti.map((piece, index) => (
            <Animated.View
              key={index}
              style={{
                position: 'absolute',
                left: size / 2,
                top: size / 2,
                width: index % 2 ? 6 : 8,
                height: index % 2 ? 10 : 6,
                borderRadius: index % 3 === 0 ? 5 : 2,
                backgroundColor: piece.color,
                opacity: progress.interpolate({
                  inputRange: [0, 0.08, 0.65, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (piece.x * size) / 150],
                    }),
                  },
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 0.55, 1],
                      outputRange: [0, (piece.y * size) / 150, ((piece.y + 55) * size) / 150],
                    }),
                  },
                  {
                    rotate: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${index % 2 ? 240 : -200}deg`],
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
