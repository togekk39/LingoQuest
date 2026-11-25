import React, { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { judgeAnswer, type AnswerOutcome } from '@lingoquest/contracts';
import { travelChallengePools, type TravelVocabulary } from '@lingoquest/offline-engine';
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
  const [result, setResult] = useState<AnswerOutcome>();
  const cloze = travelChallengePools.grammar_rush.find(({ id }) => id === 'home_challenge_name');
  if (kind === 'cloze' && !cloze) return <Button onPress={onClose}>Volver a las palabras</Button>;
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
    ...(kind === 'matching' ? { matchingPairs: pairs } : { sentence: cloze?.sentence }),
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
                judgeAnswer(
                  cloze && kind === 'cloze'
                    ? cloze
                    : {
                        ...exercise,
                        acceptedAnswers: [],
                      },
                  answer,
                ),
              );
            }}
          >
            Comprobar parejas y frases
          </Button>
        ) : (
          <JournalLeaf tint="mint">
            <View accessibilityLiveRegion="polite">
              <Label>
                {result === 'target'
                  ? '¡Bien! Ya puedes usar lo que acabas de practicar.'
                  : result === 'ungradable'
                    ? 'Faltan datos para evaluar esta respuesta.'
                    : result === 'communication_only'
                      ? cloze?.communicationOnly?.feedbackEs
                      : kind === 'matching'
                        ? 'Revisa qué significa cada palabra e inténtalo otra vez.'
                        : cloze?.feedbackEs}
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
