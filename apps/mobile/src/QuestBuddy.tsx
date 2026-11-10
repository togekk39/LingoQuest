import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { useReducedMotion } from './motion';

/** LingoQuest's original compass companion, drawn locally for offline use. */
export function QuestBuddy({
  size = 120,
  mood = 'idle',
}: {
  size?: number;
  mood?: 'idle' | 'happy' | 'encouraging';
}) {
  const reduced = useReducedMotion();
  const float = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    float.setValue(0);
    blink.setValue(1);
    if (reduced) return;
    const timing = (toValue: number, duration: number) =>
      Animated.timing(float, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: Platform.OS !== 'web',
        isInteraction: false,
      });
    const floating =
      mood === 'happy'
        ? Animated.sequence([timing(1, 180), timing(0, 220), timing(0.65, 160), timing(0, 220)])
        : Animated.loop(Animated.sequence([timing(1, 1500), timing(0, 1500)]));
    const blinking = Animated.loop(
      Animated.sequence([
        Animated.delay(2800),
        Animated.timing(blink, {
          toValue: 0.08,
          duration: 85,
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 115,
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
        Animated.delay(1200),
      ]),
    );
    floating.start();
    blinking.start();
    return () => {
      floating.stop();
      blinking.stop();
    };
  }, [reduced, mood, float, blink]);
  return (
    <View
      testID="quest-buddy"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 140 140" style={{ position: 'absolute' }}>
        <Ellipse cx="70" cy="129" rx="31" ry="5" fill="#173F43" opacity="0.12" />
      </Svg>
      <Animated.View
        testID="buddy-body"
        style={{
          width: size,
          height: size,
          transform: [
            {
              translateY: float.interpolate({
                inputRange: [0, 1],
                outputRange: [0, mood === 'happy' ? -12 : -5],
              }),
            },
            { rotate: float.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) },
          ],
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 140 140">
          <Path
            d={
              mood === 'happy'
                ? 'M31 75Q12 70 11 52M108 75Q128 70 129 52'
                : 'M31 77Q14 77 12 91M108 77Q125 74 129 60'
            }
            stroke="#28786D"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M53 111L49 122M86 111L91 122"
            stroke="#173F43"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <Path
            d="M61 24L70 9L80 24"
            stroke="#D7953F"
            strokeWidth="7"
            strokeLinejoin="round"
            fill="#F8DB91"
          />
          <Circle cx="70" cy="71" r="48" fill="#D7953F" />
          <Circle cx="70" cy="66" r="47" fill="#F3BF62" />
          <Circle cx="70" cy="66" r="38" fill="#FFF5D9" />
          <Path d="M70 33L77 47L70 44L63 47Z" fill="#28786D" />
          <Path
            d="M35 65H40M100 65H105M70 96V101"
            stroke="#D7BC86"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Ellipse cx="47" cy="78" rx="7" ry="4" fill="#EFA088" opacity="0.6" />
          <Ellipse cx="94" cy="78" rx="7" ry="4" fill="#EFA088" opacity="0.6" />
          <Path
            d={
              mood === 'happy'
                ? 'M57 78Q70 99 83 78Z'
                : mood === 'encouraging'
                  ? 'M62 82Q70 88 78 82'
                  : 'M59 80Q70 93 81 80'
            }
            fill={mood === 'happy' ? '#173F43' : 'none'}
            stroke="#173F43"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {mood === 'happy' && <Path d="M63 86Q70 82 77 86Q70 94 63 86" fill="#EFA088" />}
        </Svg>
        <Animated.View
          style={{
            position: 'absolute',
            top: size * 0.414,
            left: size * 0.364,
            width: size * 0.286,
            flexDirection: 'row',
            justifyContent: 'space-between',
            transform: [{ scaleY: blink }],
          }}
        >
          {[0, 1].map((eye) => (
            <View
              key={eye}
              style={{
                width: size * 0.064,
                height: size * 0.093,
                borderRadius: size,
                backgroundColor: '#173F43',
              }}
            />
          ))}
        </Animated.View>
      </Animated.View>
    </View>
  );
}
