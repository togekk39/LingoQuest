import React, { useContext, useEffect, type RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { InputViewportContext } from '../features/FeatureUI';

type Cutout = { left: number; top: number; width: number; height: number };
const shade = 'rgba(13, 21, 17, 0.6)';

function rectangle({ left, top, width, height }: Cutout) {
  return `M ${left} ${top} h ${width} v ${height} h ${-width} Z`;
}

export function StoryGuideShade({
  testID,
  spotlight,
}: {
  testID?: string;
  spotlight?: { width: number; height: number; cutouts: Cutout[] };
}) {
  return (
    <View
      testID={testID}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.overlay, !spotlight && styles.shaded]}
    >
      {spotlight && (
        <Svg width="100%" height="100%" viewBox={`0 0 ${spotlight.width} ${spotlight.height}`}>
          <Path
            d={[
              rectangle({ ...spotlight, left: 0, top: 0 }),
              ...spotlight.cutouts.map(rectangle),
            ].join(' ')}
            fill={shade}
            fillRule="evenodd"
          />
        </Svg>
      )}
    </View>
  );
}

export function RevealStoryGuideTarget({ target }: { target: RefObject<View | null> }) {
  const { revealItem } = useContext(InputViewportContext);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const item = target.current;
      if (item) revealItem(item, () => target.current === item);
    });
    return () => cancelAnimationFrame(frame);
  }, [revealItem, target]);
  return null;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 1, borderRadius: 8 },
  shaded: { backgroundColor: shade },
});
