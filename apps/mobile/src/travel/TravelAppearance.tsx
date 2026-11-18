import React from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Compass, MapPin, Volume2 } from 'lucide-react-native';
import type { TravelVocabulary } from '@lingoquest/offline-engine';
import { Button, Label } from '../ui';
import { useTheme } from '../theme';
import hometown from '../../assets/travel/hometown.jpg';
import stop from '../../assets/travel/plaza.jpg';

export { hometown, stop };

export function TravelScene({ place, compact = false }: { place: string; compact?: boolean }) {
  const { colors: C } = useTheme();
  return (
    <ImageBackground
      source={place === 'La plaza' ? hometown : stop}
      resizeMode="cover"
      style={[styles.scene, { height: compact ? 135 : 188, borderColor: C.line }]}
      imageStyle={{ borderRadius: 8 }}
      accessibilityIgnoresInvertColors
    >
      <View style={styles.sceneLabel}>
        <MapPin size={15} color="#502A1C" />
        <Text style={styles.sceneText}>{place}</Text>
      </View>
    </ImageBackground>
  );
}

export function VocabularyCard({
  word,
  play,
}: {
  word: TravelVocabulary;
  play: (value: string) => void;
}) {
  const { colors: C } = useTheme();
  return (
    <View
      style={[
        styles.entry,
        { backgroundColor: C.white, borderColor: C.line, borderLeftColor: C.accent },
      ]}
    >
      <View style={styles.wordRow}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={[styles.wordKind, { color: C.accent }]}>{word.kind}</Text>
          <Text accessibilityLanguage="en-US" style={[styles.term, { color: C.ink }]}>
            {word.term}
          </Text>
          <Text style={[styles.meaning, { color: C.teal }]}>{word.meaning}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Escuchar: ${word.term}`}
          onPress={() => play(word.term)}
          style={({ pressed }) => [
            styles.speaker,
            { backgroundColor: C.mint, borderColor: C.line, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Volume2 color={C.teal} size={22} />
        </Pressable>
      </View>
      <Label style={[styles.copy, { color: C.muted }]}>{word.explanation}</Label>
      <View style={[styles.example, { borderColor: C.line }]}>
        <Text accessibilityLanguage="en-US" style={[styles.quotation, { color: C.ink }]}>
          {word.example.en}
        </Text>
        <Label style={[styles.copy, { color: C.muted }]}>{word.example.es}</Label>
        <Button
          variant="ghost"
          icon={Volume2}
          onPress={() => play(word.example.en)}
          style={{ alignSelf: 'flex-start' }}
        >
          Escuchar ejemplo
        </Button>
      </View>
    </View>
  );
}

export function TravelMark({ size = 38, color = '#FFE6B8' }: { size?: number; color?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Compass size={size * 0.59} color={color} strokeWidth={1.5} />
    </View>
  );
}

export function WelcomePicture({ height }: { height: number }) {
  return (
    <Image
      source={hometown}
      accessible={false}
      resizeMode="cover"
      style={{ width: '100%', height }}
    />
  );
}

const styles = StyleSheet.create({
  scene: { borderRadius: 9, borderWidth: 1, padding: 12, justifyContent: 'flex-end' },
  sceneLabel: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#F8E8CB',
    borderRadius: 3,
  },
  sceneText: { color: '#502A1C', fontFamily: 'ManropeBold', fontSize: 12 },
  entry: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 10, padding: 18, gap: 14 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  wordKind: {
    fontFamily: 'ManropeBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  term: { fontFamily: 'Journal', fontSize: 34 },
  meaning: { fontFamily: 'ManropeBold', fontSize: 16 },
  speaker: {
    height: 48,
    width: 48,
    borderWidth: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { fontSize: 15, lineHeight: 22 },
  example: { borderTopWidth: 1, paddingTop: 11, gap: 3 },
  quotation: { fontFamily: 'Journal', fontSize: 20, lineHeight: 29 },
});
