import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';
import { ArrowLeft, ArrowRight, Backpack, TreeDeciduous } from 'lucide-react-native';
import type { StoryView } from '@lingoquest/offline-engine';
import { JournalPostcardFrame } from '../Journal';
import { useTheme } from '../theme';
import { storyArt, storyFigures, storyLostPropertyAfterPickup } from './illustrations';

type Hotspot = StoryView['hotspots'][number];
type FigureId = keyof typeof storyFigures;
type ArtId = keyof typeof storyArt;
type Point = { x: number; y: number };
type Bounds = Point & { width: number; height: number };
type Target = { bounds: Bounds; labelAt?: 'top' | 'bottom' };
type Figure = Target & { art: ViewStyle };

const figures: Record<ArtId, Partial<Record<FigureId, Figure>>> = {
  plaza: {
    sam: {
      art: { left: '-1.5%', bottom: 0, width: '52%' },
      bounds: { x: 0, y: 34, width: 41, height: 65 },
      labelAt: 'bottom',
    },
    luz: {
      art: { right: '-0.5%', bottom: '-1.5%', width: '49%' },
      bounds: { x: 66, y: 43, width: 34, height: 34 },
      labelAt: 'bottom',
    },
  },
  bus: {
    sam: {
      art: { right: '-9%', bottom: '-10%', width: '47%', transform: [{ scaleX: -1 }] },
      bounds: { x: 66, y: 51, width: 34, height: 48 },
      labelAt: 'bottom',
    },
  },
  bag: {
    sam: {
      art: { right: '-7%', bottom: '-16%', width: '35%', transform: [{ scaleX: -1 }] },
      bounds: { x: 75, y: 77, width: 25, height: 23 },
      labelAt: 'bottom',
    },
    luz: {
      art: { left: '-7%', bottom: '-7%', width: '43%' },
      bounds: { x: 0, y: 53, width: 34, height: 25 },
      labelAt: 'bottom',
    },
  },
};

const landmarks: Record<string, Target> = {
  'plaza-origin': { bounds: { x: 46, y: 78, width: 30, height: 22 }, labelAt: 'bottom' },
  'plaza-ticket': { bounds: { x: 41, y: 26, width: 25, height: 36 }, labelAt: 'bottom' },
  'plaza-to-stop': { bounds: { x: 72, y: 19, width: 28, height: 22 } },
  'stop-to-plaza': { bounds: { x: 0, y: 83, width: 32, height: 17 } },
  'stop-sign': { bounds: { x: 23, y: 22, width: 30, height: 30 }, labelAt: 'bottom' },
  'stop-bench': { bounds: { x: 3, y: 55, width: 28, height: 23 }, labelAt: 'top' },
  'stop-to-lost-property': { bounds: { x: 33, y: 81, width: 32, height: 19 } },
  'lost-to-stop': { bounds: { x: 0, y: 82, width: 34, height: 18 } },
  'lost-blue-bag': { bounds: { x: 37, y: 34, width: 26, height: 43 }, labelAt: 'bottom' },
  'lost-red-bag': { bounds: { x: 65, y: 34, width: 25, height: 43 }, labelAt: 'bottom' },
};

const parkSigns = {
  plaza: { id: 'plaza-ticket', at: { x: 57, y: 35 }, pointsToPark: true },
  bus: { id: 'stop-sign', at: { x: 38, y: 32 }, pointsToPark: false },
  bag: undefined,
} as const;

const backpacks = [
  { id: 'lost-blue-bag', color: '#2866a0', x: 50 },
  { id: 'lost-red-bag', color: '#ab3630', x: 77 },
] as const;

const figureIds = ['sam', 'luz'] as const;

function placement(bounds: Bounds, width: number, height: number) {
  const centerX = (width * (bounds.x + bounds.width / 2)) / 100;
  const centerY = (height * (bounds.y + bounds.height / 2)) / 100;
  const targetWidth = Math.min(width, Math.max(44, (width * bounds.width) / 100));
  const targetHeight = Math.min(height, Math.max(44, (height * bounds.height) / 100));
  return {
    left: Math.max(0, Math.min(centerX - targetWidth / 2, width - targetWidth)),
    top: Math.max(0, Math.min(centerY - targetHeight / 2, height - targetHeight)),
    width: targetWidth,
    height: targetHeight,
  };
}

export function StoryScene({
  chapterId,
  scene,
  sceneImage,
  hotspots,
  activeNpc,
  blueBagCollected,
  guideHotspotId,
  onGuideAnchor,
  disabled,
  onInteract,
}: {
  chapterId: string;
  scene: StoryView['scene'];
  sceneImage?: ImageSourcePropType;
  hotspots: ReadonlyArray<Hotspot>;
  activeNpc?: string;
  blueBagCollected?: boolean;
  guideHotspotId?: string;
  onGuideAnchor: (view: View | null) => void;
  disabled?: boolean;
  onInteract: (id: string) => void;
}) {
  const { colors, mode } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [focused, setFocused] = useState<string>();
  const homeArt =
    chapterId === 'home'
      ? scene.art === 'bus' || scene.art === 'bag'
        ? scene.art
        : 'plaza'
      : undefined;
  const sceneFigures = homeArt ? figures[homeArt] : undefined;
  const parkSign = homeArt ? parkSigns[homeArt] : undefined;
  const artwork =
    sceneImage ??
    (homeArt === 'bag' && blueBagCollected
      ? storyLostPropertyAfterPickup
      : homeArt && storyArt[homeArt]);
  const visibleFigures = new Set([activeNpc, ...hotspots.map((hotspot) => hotspot.npcId)]);
  const signSize = Math.max(24, Math.min(45, size.width * 0.088));
  const signWidth = parkSign?.pointsToPark ? signSize * 1.38 : signSize;
  const bagSize = Math.max(34, Math.min(90, size.width * 0.16));
  const light = mode === 'light';
  const tag = {
    backgroundColor: light ? '#FFF1D5' : colors.white,
    borderColor: light ? '#DFBA86' : colors.line,
  };
  const highlightedTag = {
    backgroundColor: light ? '#FFDC9E' : colors.mint,
    borderColor: light ? '#845526' : colors.ink,
  };

  return (
    <View testID={`story-scene-${scene.id}`}>
      <JournalPostcardFrame taped>
        <View
          testID="story-scene-art"
          style={[styles.art, { backgroundColor: colors.mint }]}
          onLayout={({ nativeEvent: { layout } }) =>
            setSize((current) =>
              current.width === layout.width && current.height === layout.height
                ? current
                : { width: layout.width, height: layout.height },
            )
          }
        >
          {artwork && (
            <Image
              testID="story-scene-background"
              source={artwork}
              accessible={false}
              resizeMode="cover"
              style={styles.image}
            />
          )}
          {homeArt === 'bag' && !artwork && (
            <View pointerEvents="none" style={styles.lostPropertyCounter}>
              {backpacks.map(({ id, color, x }) =>
                id === 'lost-blue-bag' && blueBagCollected ? null : (
                  <View
                    key={id}
                    style={[
                      styles.prop,
                      {
                        left: (size.width * x) / 100 - bagSize / 2,
                        top: size.height * 0.53 - bagSize / 2,
                      },
                    ]}
                  >
                    <Backpack size={bagSize} fill={color} color="#fff1d5" />
                  </View>
                ),
              )}
              <View style={styles.counterEdge} />
            </View>
          )}
          {parkSign && size.width > 0 && (
            <View
              testID={`story-scene-prop-${parkSign.id}`}
              pointerEvents="none"
              style={[
                styles.prop,
                styles.sign,
                {
                  left: (size.width * parkSign.at.x) / 100 - signWidth / 2,
                  top: (size.height * parkSign.at.y) / 100 - signSize / 2,
                  width: signWidth,
                },
              ]}
            >
              <View style={[styles.signFace, { width: signWidth, height: signSize }]}>
                <TreeDeciduous size={signSize * 0.67} color="#f5e2b2" />
                {parkSign.pointsToPark && <ArrowRight size={signSize * 0.37} color="#f5e2b2" />}
              </View>
              <View style={[styles.signPost, { height: signSize * 0.3 }]} />
            </View>
          )}
          {figureIds.map((npcId) => {
            const figure = sceneFigures?.[npcId];
            return figure && visibleFigures.has(npcId) ? (
              <View
                key={npcId}
                testID={`story-scene-figure-${npcId}`}
                pointerEvents="none"
                style={[
                  styles.prop,
                  { aspectRatio: npcId === 'sam' ? 640 / 645 : 640 / 615 },
                  figure.art,
                ]}
              >
                <Image
                  source={storyFigures[npcId]}
                  accessible={false}
                  resizeMode="contain"
                  style={styles.image}
                />
              </View>
            ) : null;
          })}
          {size.width > 0 &&
            hotspots.map((hotspot) => {
              const npcId = hotspot.npcId;
              const figure = npcId === 'sam' || npcId === 'luz' ? sceneFigures?.[npcId] : undefined;
              const { x = 50, y = 50 } = hotspot.position ?? {};
              const { bounds, labelAt } = figure ??
                landmarks[hotspot.id] ?? {
                  bounds: { x: x - 13, y: y - 12, width: 26, height: 24 },
                };
              const selected = npcId !== undefined && npcId === activeNpc;
              const guided = hotspot.id === guideHotspotId;
              const isFocused = hotspot.id === focused;
              const Icon =
                hotspot.id === 'stop-to-plaza' || hotspot.id === 'lost-to-stop'
                  ? ArrowLeft
                  : ArrowRight;
              return (
                <Pressable
                  key={hotspot.id}
                  testID={`story-hotspot-${hotspot.id}`}
                  ref={guided ? onGuideAnchor : undefined}
                  collapsable={!guided}
                  accessibilityRole="button"
                  accessibilityLabel={hotspot.label}
                  accessibilityState={{
                    disabled,
                    expanded: hotspot.kind === 'npc' ? selected : undefined,
                  }}
                  disabled={disabled}
                  onPress={() => onInteract(hotspot.id)}
                  onFocus={() => setFocused(hotspot.id)}
                  onBlur={() => setFocused(undefined)}
                  style={[
                    styles.target,
                    placement(bounds, size.width, size.height),
                    labelAt === 'top' && styles.labelTop,
                    labelAt === 'bottom' && styles.labelBottom,
                  ]}
                >
                  {({ pressed }) => (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.tag,
                        hotspot.kind === 'npc' && styles.nameTag,
                        selected || pressed || guided || isFocused ? highlightedTag : tag,
                        (guided || isFocused) && styles.emphasizedTag,
                      ]}
                    >
                      {hotspot.kind === 'exit' && <Icon size={12} color={colors.ink} />}
                      <Text
                        accessible={false}
                        style={[
                          styles.tagText,
                          { color: colors.ink },
                          hotspot.kind === 'npc' && styles.nameText,
                        ]}
                      >
                        {hotspot.label}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
        </View>
      </JournalPostcardFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  art: { aspectRatio: 1.25, overflow: 'hidden', borderRadius: 4 },
  prop: { position: 'absolute' },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  lostPropertyCounter: { ...StyleSheet.absoluteFillObject, backgroundColor: '#99724f' },
  counterEdge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '36%',
    borderTopWidth: 5,
    borderTopColor: '#a8784c',
    backgroundColor: '#755033',
  },
  sign: { alignItems: 'center' },
  signFace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#45624b',
    borderWidth: 2,
    borderColor: '#e0ba81',
    borderRadius: 4,
  },
  signPost: { width: 4, backgroundColor: '#80512f' },
  target: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  labelTop: { justifyContent: 'flex-start', paddingTop: 3 },
  labelBottom: { justifyContent: 'flex-end', paddingBottom: 3 },
  tag: {
    minWidth: 31,
    minHeight: 26,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 5,
    paddingVertical: 2,
    boxShadow: '0 2px 5px rgba(61, 37, 18, 0.34)',
  },
  nameTag: { minHeight: 29, paddingHorizontal: 12, borderRadius: 11 },
  emphasizedTag: { borderWidth: 2 },
  tagText: { flexShrink: 1, textAlign: 'center', fontFamily: 'ManropeBold', fontSize: 11 },
  nameText: { fontFamily: 'LoraBold', fontSize: 16 },
});
