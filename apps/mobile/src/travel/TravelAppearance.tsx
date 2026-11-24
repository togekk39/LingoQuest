import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Eye, MapPin, Volume2 } from 'lucide-react-native';
import type { TravelMission, TravelVocabulary } from '@lingoquest/offline-engine';
import { Button, Label } from '../ui';
import { useTheme } from '../theme';
import { JournalArt, JournalLeaf, Notebook } from '../Journal';
import { illustrations, placeIllustration, wordIllustration } from './illustrations';
import { StoryActivity, type StoryTranslation } from './StoryDialogueAppearance';

const english = Platform.OS === 'web' ? { lang: 'en-US' } : { accessibilityLanguage: 'en-US' };

export function TravelScene({ place, compact = false }: { place: string; compact?: boolean }) {
  const { colors: C } = useTheme();
  return (
    <View>
      <JournalArt source={placeIllustration(place)} aspectRatio={compact ? 2.65 : 2.1} taped />
      <JournalLeaf compact kind="stamp" style={styles.sceneLabel}>
        <MapPin size={14} color={C.accent} />
        <Text style={[styles.sceneText, { color: C.ink }]}>{place}</Text>
      </JournalLeaf>
    </View>
  );
}

export function VocabularyCard({
  word,
  play,
  recall = false,
  inline = false,
}: {
  word: TravelVocabulary;
  play: (value: string) => void;
  recall?: boolean;
  inline?: boolean;
}) {
  const { colors: C } = useTheme();
  const [revealed, reveal] = useState(!recall);
  const Section = inline ? StoryActivity : Notebook;
  const WordSlip = inline ? View : JournalLeaf;
  return (
    <View testID="illustrated-vocabulary" style={styles.entry}>
      {!inline && <JournalArt source={wordIllustration(word.term)} aspectRatio={2.25} taped />}
      <WordSlip style={inline ? styles.entry : styles.wordSlip}>
        <View style={styles.wordRow}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={[styles.wordKind, { color: C.accent }]}>{word.kind}</Text>
            <Text {...english} style={[styles.term, { color: C.ink }]}>
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
      </WordSlip>
      <Section title={word.exampleBy ? `Ejemplo de ${word.exampleBy}` : 'En una conversación'}>
        <Text {...english} style={[styles.quotation, { color: C.ink }]}>
          {word.example.en}
        </Text>
        {revealed && <Label style={[styles.copy, { color: C.muted }]}>{word.example.es}</Label>}
        <Button
          variant="secondary"
          icon={Volume2}
          onPress={() => play(word.example.en)}
          style={{ alignSelf: 'flex-start' }}
        >
          Escuchar ejemplo
        </Button>
      </Section>
    </View>
  );
}

export function GrammarWorkbench({
  step,
  play,
  playSequence,
  stop,
  embedded,
}: {
  step: Extract<TravelMission['steps'][number], { type: 'teach' }>;
  play: (value: string) => void;
  playSequence: (
    phrases: readonly string[],
    onSelect?: (index: number) => void,
    useBundledIfUnavailable?: boolean,
  ) => Promise<void>;
  stop: () => void;
  embedded?: StoryTranslation;
}) {
  const { colors: C } = useTheme();
  const [selected, select] = useState(0);
  const [showTranslation, reveal] = useState(false);
  const [compare, setCompare] = useState(false);
  const [dialogueTranslations, setDialogueTranslations] = useState<Record<number, boolean>>({});
  const dialogue = step.presentation === 'question-answer';
  const inline = !!embedded;
  const replyBriefing = inline && step.presentation === 'reply-briefing';
  const showAllExamples = dialogue || replyBriefing;
  const Section = inline ? StoryActivity : Notebook;
  const alternative = showAllExamples
    ? undefined
    : step.examples.find((_, index) => index !== selected);
  const showExample = useCallback((index: number) => {
    select(index);
    reveal(false);
    setCompare(false);
  }, []);
  useEffect(() => {
    if (replyBriefing) return;
    void playSequence(
      step.examples.map(({ en }) => en),
      dialogue ? undefined : showExample,
      inline,
    );
  }, [dialogue, inline, playSequence, replyBriefing, showExample, step.examples]);
  return (
    <View testID="grammar-workbench" style={{ gap: 12 }}>
      {!inline && <JournalArt source={illustrations.writing} aspectRatio={3.1} taped />}
      <Section title={step.title}>
        {(!inline || !step.storyPrompt) && <Label style={styles.copy}>{step.text}</Label>}
        {!!step.exampleLabel && (
          <Text style={[styles.meaning, { color: C.teal }]}>{step.exampleLabel}</Text>
        )}
        {!showAllExamples && (
          <View style={styles.samples}>
            {step.examples.map((item, index) => (
              <Pressable
                key={item.en}
                accessibilityRole="tab"
                accessibilityState={{ selected: index === selected }}
                aria-selected={index === selected}
                onPress={() => {
                  stop();
                  showExample(index);
                }}
                style={[
                  styles.sample,
                  { backgroundColor: index === selected ? C.primary : C.white },
                ]}
              >
                <Text style={[styles.meaning, { color: index === selected ? C.onPrimary : C.ink }]}>
                  Ejemplo {index + 1}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {step.examples.map((example, index) => {
          if (!showAllExamples && index !== selected) return null;
          const pattern = step.patterns?.[index];
          const translationVisible =
            embedded?.translationsVisible ??
            (dialogue ? dialogueTranslations[index] : showTranslation);
          const label = index === 0 ? 'pregunta' : 'respuesta';
          return (
            <View key={example.en} style={{ gap: 10 }}>
              {dialogue && (
                <Text accessibilityRole="header" style={[styles.meaning, { color: C.ink }]}>
                  {index === 0 ? 'Pregunta' : 'Respuesta'}
                </Text>
              )}
              {pattern ? (
                <View style={styles.samples}>
                  {pattern.parts.map(({ text, role }, index) => (
                    <JournalLeaf
                      compact
                      kind="notebook"
                      key={index}
                      style={[
                        styles.token,
                        {
                          backgroundColor: C.white,
                          borderTopWidth: 3,
                          borderTopColor: [C.teal, C.accent, C.gold][index % 3],
                        },
                      ]}
                    >
                      <Text {...english} style={[styles.quotation, { color: C.ink }]}>
                        {text}
                      </Text>
                      <Text style={[styles.part, { color: C.muted }]}>{role}</Text>
                    </JournalLeaf>
                  ))}
                </View>
              ) : (
                <Text {...english} style={[styles.quotation, { color: C.ink }]}>
                  {example.en}
                </Text>
              )}
              <View style={styles.samples}>
                <Button variant="secondary" icon={Volume2} onPress={() => play(example.en)}>
                  {dialogue
                    ? `Escuchar ${label === 'pregunta' ? 'la pregunta' : 'la respuesta'}`
                    : replyBriefing
                      ? `Escuchar: ${example.en}`
                      : 'Escuchar frase'}
                </Button>
                {!replyBriefing && (
                  <Button
                    variant="ghost"
                    icon={Eye}
                    onPress={() => {
                      if (embedded) {
                        embedded.onToggleTranslation();
                      } else if (dialogue) {
                        setDialogueTranslations((shown) => ({ ...shown, [index]: !shown[index] }));
                      } else {
                        stop();
                        reveal(!showTranslation);
                      }
                    }}
                  >
                    {`${translationVisible ? 'Ocultar traducción' : inline ? 'Mostrar traducción' : 'Ver traducción'}${dialogue ? ` de la ${label}` : ''}`}
                  </Button>
                )}
                {!!alternative && (
                  <Button
                    variant="ghost"
                    onPress={() => {
                      stop();
                      setCompare(!compare);
                    }}
                  >
                    {compare ? 'Cerrar comparación' : 'Comparar ejemplos'}
                  </Button>
                )}
              </View>
              {translationVisible && (
                <Text accessibilityLiveRegion="polite" style={[styles.copy, { color: C.ink }]}>
                  {example.es}
                </Text>
              )}
              {compare && alternative && (
                <JournalLeaf compact kind="notebook" accessibilityLiveRegion="polite">
                  <Text {...english} style={[styles.quotation, { color: C.ink }]}>
                    {alternative.en}
                  </Text>
                  {(!embedded || embedded.translationsVisible) && (
                    <Label style={styles.copy}>{alternative.es}</Label>
                  )}
                </JournalLeaf>
              )}
            </View>
          );
        })}
        {replyBriefing && embedded && (
          <Button
            variant="ghost"
            icon={Eye}
            onPress={embedded.onToggleTranslation}
            style={{ alignSelf: 'flex-start' }}
          >
            {embedded.translationsVisible ? 'Ocultar traducción' : 'Mostrar traducción'}
          </Button>
        )}
      </Section>
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
  part: { fontFamily: 'ManropeBold', fontSize: 12 },
});
