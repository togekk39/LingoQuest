import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { ArrowRight, Search } from 'lucide-react-native';
import type { StoryView } from '@lingoquest/offline-engine';
import { JournalPostcardFrame } from '../Journal';
import { useTheme } from '../theme';
import { storyArt, storyFigures } from './illustrations';

type Hotspot = StoryView['hotspots'][number];
type FigureId = keyof typeof storyFigures;
type ArtId = keyof typeof storyArt;
type Bounds = { x: number; y: number; width: number; height: number };
type Figure = { art: ViewStyle; bounds: Bounds; labelInset: number };

const figures: Record<ArtId, Partial<Record<FigureId, Figure>>> = {
  plaza: {
    sam: {
      art: { left: '-1.5%', bottom: 0, width: '52%' },
      bounds: { x: 0, y: 34, width: 50, height: 65 },
      labelInset: 0.15,
    },
    luz: {
      art: { right: '-0.5%', bottom: '-1.5%', width: '49%' },
      bounds: { x: 62, y: 43, width: 37, height: 38 },
      labelInset: 0.06,
    },
  },
  bus: {
    sam: {
      art: { right: '-9%', bottom: '-10%', width: '47%', transform: [{ scaleX: -1 }] },
      bounds: { x: 65, y: 51, width: 34, height: 48 },
      labelInset: 0.12,
    },
  },
  bag: {
    sam: {
      art: { right: '-8%', bottom: '-15%', width: '44%', transform: [{ scaleX: -1 }] },
      bounds: { x: 65, y: 60, width: 34, height: 39 },
      labelInset: 0.07,
    },
    luz: {
      art: { left: '-5%', bottom: '-4%', width: '49%' },
      bounds: { x: 0, y: 45, width: 41, height: 35 },
      labelInset: 0.06,
    },
  },
};

const markers: Record<string, { bounds: Bounds; label: string }> = {
  'plaza-origin': { bounds: { x: 53, y: 81, width: 27, height: 19 }, label: 'Postales' },
  'plaza-ticket': { bounds: { x: 46, y: 25, width: 27, height: 19 }, label: 'Boleto' },
  'plaza-to-stop': { bounds: { x: 74, y: 24, width: 25, height: 19 }, label: 'Parque' },
  'stop-to-plaza': { bounds: { x: 0, y: 79, width: 32, height: 21 }, label: 'Plaza' },
  'stop-sign': { bounds: { x: 5, y: 21, width: 32, height: 23 }, label: 'Señal' },
  'stop-bench': { bounds: { x: 4, y: 53, width: 34, height: 23 }, label: 'Banco' },
  'stop-to-lost-property': { bounds: { x: 38, y: 72, width: 26, height: 28 }, label: 'Mostrador' },
  'lost-to-stop': { bounds: { x: 0, y: 80, width: 40, height: 20 }, label: 'Parada' },
  'lost-blue-bag': { bounds: { x: 42, y: 48, width: 23, height: 21 }, label: 'Azul' },
  'lost-red-bag': { bounds: { x: 68, y: 21, width: 31, height: 23 }, label: 'Roja' },
};

function figureId(id: string | undefined): FigureId | undefined {
  return id === 'sam' || id === 'luz' ? id : undefined;
}

function placement(bounds: Bounds, width: number, height: number) {
  const targetWidth = Math.max(44, (width * bounds.width) / 100);
  const targetHeight = Math.max(44, (height * bounds.height) / 100);
  return {
    left: Math.max(0, Math.min((width * bounds.x) / 100, width - targetWidth)),
    top: Math.max(0, Math.min((height * bounds.y) / 100, height - targetHeight)),
    width: targetWidth,
    height: targetHeight,
  };
}

export function StoryScene({
  scene,
  hotspots,
  activeNpc,
  guidedKind,
  disabled,
  onInteract,
}: {
  scene: StoryView['scene'];
  hotspots: ReadonlyArray<Hotspot>;
  activeNpc?: string;
  guidedKind?: 'npc' | 'object';
  disabled?: boolean;
  onInteract: (id: string) => void;
}) {
  const { colors, mode } = useTheme();
  const { fontScale } = useWindowDimensions();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const artId = scene.art === 'bus' || scene.art === 'bag' ? scene.art : 'plaza';
  const sceneFigures = figures[artId];
  const visibleFigures = new Set([activeNpc, ...hotspots.map((hotspot) => hotspot.npcId)]);
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
            setSize({ width: layout.width, height: layout.height })
          }
        >
          <Image
            source={storyArt[artId]}
            accessible={false}
            resizeMode="cover"
            style={styles.image}
          />
          {(['sam', 'luz'] as const).map((npcId) => {
            const figure = sceneFigures[npcId];
            return figure && visibleFigures.has(npcId) ? (
              <View
                key={npcId}
                pointerEvents="none"
                style={[
                  styles.figure,
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
              const id = figureId(hotspot.npcId);
              const figure = id && sceneFigures[id];
              const marker = markers[hotspot.id];
              const { x = 50, y = 50 } = hotspot.position ?? {};
              const bounds = figure?.bounds ??
                marker?.bounds ?? {
                  x: x - 13,
                  y: y - 12,
                  width: 26,
                  height: 24,
                };
              const target = placement(bounds, size.width, size.height);
              const selected = hotspot.npcId !== undefined && hotspot.npcId === activeNpc;
              const guided = hotspot.kind === guidedKind;
              const Icon = hotspot.kind === 'exit' ? ArrowRight : Search;
              const label = marker?.label ?? hotspot.label;
              const iconOnly =
                hotspot.kind !== 'npc' && target.width < fontScale * label.length * 7;
              return (
                <Pressable
                  key={hotspot.id}
                  testID={`story-hotspot-${hotspot.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={hotspot.label}
                  accessibilityState={{
                    disabled,
                    expanded: hotspot.kind === 'npc' ? selected : undefined,
                  }}
                  disabled={disabled}
                  onPress={() => onInteract(hotspot.id)}
                  style={[
                    styles.target,
                    target,
                    figure && {
                      justifyContent: 'flex-end',
                      paddingBottom: target.height * figure.labelInset,
                    },
                  ]}
                >
                  {({ pressed }) => (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.tag,
                        hotspot.kind === 'npc' && styles.nameTag,
                        selected || pressed || guided ? highlightedTag : tag,
                        guided && styles.guidedTag,
                      ]}
                    >
                      {iconOnly ? (
                        <Icon size={18} color={colors.ink} />
                      ) : (
                        <Text
                          accessible={false}
                          numberOfLines={1}
                          style={[
                            styles.tagText,
                            { color: colors.ink },
                            hotspot.kind === 'npc' && styles.nameText,
                          ]}
                        >
                          {label}
                        </Text>
                      )}
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
  figure: { position: 'absolute' },
  image: { position: 'absolute', width: '100%', height: '100%' },
  target: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    minWidth: 31,
    minHeight: 26,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 2,
    boxShadow: '0 2px 5px rgba(61, 37, 18, 0.34)',
  },
  nameTag: { minHeight: 29, paddingHorizontal: 12, borderRadius: 11 },
  guidedTag: { borderWidth: 2 },
  tagText: { fontFamily: 'ManropeBold', fontSize: 11 },
  nameText: { fontFamily: 'LoraBold', fontSize: 16 },
});
