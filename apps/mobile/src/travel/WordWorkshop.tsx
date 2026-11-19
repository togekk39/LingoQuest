import React, { useState } from 'react';
import { Keyboard, View } from 'react-native';
import type { TravelVocabulary } from '@lingoquest/offline-engine';
import {
  ExerciseInput,
  hasAnswer,
  type Exercise,
  type ExerciseAnswer,
} from '../features/ExerciseInput';
import { JournalLeaf, Notebook } from '../Journal';
import { Button, Label } from '../ui';

export function WordWorkshop({
  words,
  kind,
  onClose,
}: {
  words: TravelVocabulary[];
  kind: 'matching' | 'cloze';
  onClose: () => void;
}) {
  const [answer, setAnswer] = useState<ExerciseAnswer>({});
  const [result, setResult] = useState<boolean>();
  const pairs = words.map((word) => ({ id: word.term, left: word.term, right: word.meaning }));
  const exercise: Exercise = {
    id: `workshop-${kind}`,
    type: kind,
    promptEs:
      kind === 'matching'
        ? 'Relaciona cada palabra con su significado.'
        : 'Escribe solo el verbo que falta.',
    skillId: 'travel.workshop',
    difficulty: 1,
    ...(kind === 'matching' ? { matchingPairs: pairs } : { sentence: 'Hi! My name ___ Sam.' }),
  };
  return (
    <View testID="word-workshop" style={{ gap: 12 }}>
      <Notebook title={kind === 'matching' ? 'Une las parejas' : 'Completa el saludo'}>
        <ExerciseInput
          journal
          exercise={exercise}
          answer={answer}
          setAnswer={setAnswer}
          disabled={result !== undefined}
        />
        {result === undefined ? (
          <Button
            disabled={!hasAnswer(answer, exercise)}
            onPress={() => {
              Keyboard.dismiss();
              setResult(
                kind === 'matching'
                  ? pairs.every(({ id }) => answer.matches?.[id] === id)
                  : answer.text
                      ?.trim()
                      .toLowerCase()
                      .replace(/[.!?]+$/, '') === 'is',
              );
            }}
          >
            Comprobar parejas y frases
          </Button>
        ) : (
          <JournalLeaf tint="mint">
            <View accessibilityLiveRegion="polite">
              <Label>
                {result
                  ? '¡Bien! Ya puedes usar lo que acabas de practicar.'
                  : kind === 'matching'
                    ? 'Revisa qué significa cada palabra e inténtalo otra vez.'
                    : 'La forma es «My name is…». Usa is con «my name».'}
              </Label>
            </View>
            <Button
              variant="secondary"
              onPress={() => {
                setAnswer({});
                setResult(undefined);
              }}
            >
              Intentar otra vez
            </Button>
          </JournalLeaf>
        )}
      </Notebook>
      <Button variant="ghost" onPress={onClose}>
        Volver a las palabras
      </Button>
    </View>
  );
}
