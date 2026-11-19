import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Eye, MapPin, Volume2 } from 'lucide-react-native';
import type { TravelMission, TravelVocabulary } from '@lingoquest/offline-engine';
import { Button, Label } from '../ui';
import { useTheme } from '../theme';
import { JournalArt, JournalLeaf, Notebook } from '../Journal';
import { illustrations, placeIllustration, wordIllustration } from './illustrations';
import stop from '../../assets/travel/plaza.jpg';

export { stop };

export function TravelScene({ place, compact = false }: { place: string; compact?: boolean }) {
  const { colors: C } = useTheme();
  return (
    <View>
      <JournalArt source={placeIllustration(place)} aspectRatio={compact ? 2.65 : 2.1} taped />
      <View style={[styles.sceneLabel, { backgroundColor: C.white }]}>
        <MapPin size={14} color={C.accent} />
        <Text style={[styles.sceneText, { color: C.ink }]}>{place}</Text>
      </View>
    </View>
  );
}

export function VocabularyCard({
  word,
  play,
  recall = false,
}: {
  word: TravelVocabulary;
  play: (value: string) => void;
  recall?: boolean;
}) {
  const { colors: C } = useTheme();
  const [revealed, reveal] = useState(!recall);
  return (
    <View testID="illustrated-vocabulary" style={styles.entry}>
      <JournalArt source={wordIllustration(word.term)} aspectRatio={2.25} taped />
      <JournalLeaf style={styles.wordSlip}>
        <View style={styles.wordRow}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={[styles.wordKind, { color: C.accent }]}>{word.kind}</Text>
            <Text accessibilityLanguage="en-US" style={[styles.term, { color: C.ink }]}>
              {word.term}
            </Text>
            {revealed && (
              <Text accessibilityLiveRegion="polite" style={[styles.meaning, { color: C.teal }]}>
                {word.meaning}
              </Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Escuchar: ${word.term}`}
            onPress={() => play(word.term)}
            style={({ pressed }) => [
              styles.speaker,
              { backgroundColor: C.mint, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Volume2 color={C.teal} size={22} />
          </Pressable>
        </View>
        {!revealed && (
          <Button variant="secondary" icon={Eye} onPress={() => reveal(true)}>
            Revelar significado
          </Button>
        )}
        {revealed && <Label style={[styles.copy, { color: C.muted }]}>{word.explanation}</Label>}
      </JournalLeaf>
      <Notebook title="En una conversación">
        <Text accessibilityLanguage="en-US" style={[styles.quotation, { color: C.ink }]}>
          {word.example.en}
        </Text>
        <Label style={[styles.copy, { color: C.muted }]}>{word.example.es}</Label>
        <Button
          variant="secondary"
          icon={Volume2}
          onPress={() => play(word.example.en)}
          style={{ alignSelf: 'flex-start' }}
        >
          Escuchar ejemplo
        </Button>
      </Notebook>
    </View>
  );
}

export function GrammarWorkbench({
  step,
  play,
}: {
  step: Extract<TravelMission['steps'][number], { type: 'teach' }>;
  play: (value: string) => void;
}) {
  const { colors: C } = useTheme();
  const [selected, select] = useState(0);
  const [showTranslation, reveal] = useState(false);
  const example = step.examples[selected];
  return (
    <View testID="grammar-workbench" style={{ gap: 12 }}>
      <JournalArt source={illustrations.writing} aspectRatio={3.1} taped />
      <Notebook title={step.title}>
        <Label style={styles.copy}>{step.text}</Label>
        <View style={styles.samples}>
          {step.examples.map((item, index) => (
            <Pressable
              key={item.en}
              accessibilityRole="tab"
              accessibilityState={{ selected: index === selected }}
              onPress={() => {
                select(index);
                reveal(false);
              }}
              style={[styles.sample, { backgroundColor: index === selected ? C.primary : C.white }]}
            >
              <Text style={[styles.meaning, { color: index === selected ? C.onPrimary : C.ink }]}>
                Ejemplo {index + 1}
              </Text>
            </Pressable>
          ))}
        </View>
        {!!example && (
          <View style={{ gap: 10 }}>
            <View
              accessible
              accessibilityLabel={example.en}
              accessibilityLanguage="en-US"
              style={styles.samples}
            >
              {example.en.split(/\s+/).map((token, i) => (
                <View key={i} style={[styles.token, { backgroundColor: i < 2 ? C.mint : C.white }]}>
                  <Text style={[styles.quotation, { color: C.ink }]}>{token}</Text>
                </View>
              ))}
            </View>
            <View style={styles.samples}>
              <Button variant="secondary" icon={Volume2} onPress={() => play(example.en)}>
                Escuchar frase
              </Button>
              <Button variant="ghost" icon={Eye} onPress={() => reveal(!showTranslation)}>
                {showTranslation ? 'Ocultar traducción' : 'Ver traducción'}
              </Button>
            </View>
            {showTranslation && (
              <Text accessibilityLiveRegion="polite" style={[styles.copy, { color: C.ink }]}>
                {example.es}
              </Text>
            )}
          </View>
        )}
      </Notebook>
    </View>
  );
}

const styles = StyleSheet.create({
  sceneLabel: {
    alignSelf: 'flex-start',
    marginTop: -22,
    marginLeft: 15,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sceneText: { fontFamily: 'ManropeBold', fontSize: 12 },
  entry: { gap: 12 },
  wordSlip: { marginTop: -27, marginHorizontal: 13 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordKind: {
    fontFamily: 'ManropeBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  term: { fontFamily: 'LoraBold', fontSize: 28 },
  meaning: { fontFamily: 'ManropeBold', fontSize: 14 },
  speaker: {
    minHeight: 48,
    minWidth: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { fontFamily: 'Manrope', fontSize: 14, lineHeight: 21 },
  quotation: { fontFamily: 'LoraBold', fontSize: 18 },
  samples: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  sample: { justifyContent: 'center', minHeight: 44, borderRadius: 11, paddingHorizontal: 12 },
  token: { paddingVertical: 7, paddingHorizontal: 9, borderRadius: 6 },
});
