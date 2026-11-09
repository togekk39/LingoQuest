import { useTheme } from '../theme';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { AttemptResult, Progress } from '@lingoquest/contracts';
import { stopOfflineSpeech } from './offlineSpeech';
import { api } from '../lib/api';
import { Action, ErrorCard, useFeatureStyles, FlowFrame, newEventId } from './FeatureUI';
import { ExerciseInput, hasAnswer, type ExerciseAnswer } from './ExerciseInput';
import { SpeakingPanel } from './SpeakingPractice';
import {
  AnswerFeedback,
  DialogueStage,
  GoalStage,
  GrammarStage,
  RecapStage,
  StageProgress,
  VocabularyCard,
  type IntegratedLesson,
} from './LessonStages';

export default function LearningFlow({
  lessonId,
  onClose,
  onComplete,
  review = false,
}: {
  lessonId: string;
  onClose: () => void;
  onComplete: () => void;
  review?: boolean;
}) {
  const { colors: palette } = useTheme();
  const f = useFeatureStyles();

  const [lesson, setLesson] = useState<IntegratedLesson | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stagePosition, setStagePosition] = useState(0);
  const [vocabularyPosition, setVocabularyPosition] = useState(0);
  const [exercisePosition, setExercisePosition] = useState(-1);
  const [answer, setAnswer] = useState<ExerciseAnswer>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [xp, setXp] = useState(0);
  const [weakExerciseIds, setWeakExerciseIds] = useState<string[]>([]);
  const [nextReviewAt, setNextReviewAt] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const eventId = useRef(newEventId());
  async function load() {
    setLoading(true);
    setError('');
    try {
      const nextLesson = await api<IntegratedLesson>(`/v1/lessons/${lessonId}`);
      setLesson(nextLesson);
      setStagePosition(0);
      setVocabularyPosition(0);
      setExercisePosition(-1);
      setAnswer({});
      setResult(null);
      setXp(0);
      setWeakExerciseIds([]);
      setNextReviewAt(null);
      setHintUsed(false);
      setHelpOpen(false);
      eventId.current = newEventId();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Esta lección no está disponible. Intenta de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    return () => {
      void stopOfflineSpeech();
    };
  }, [lessonId]);
  const stage = lesson?.stages[stagePosition];
  const stageExercises = (stage?.exerciseIds ?? []).map((id) =>
    lesson!.exercises.find((item) => item.id === id)!,
  );
  const exercise = exercisePosition >= 0 ? stageExercises[exercisePosition] : undefined;
  const globalExercisePosition = exercise
    ? lesson!.exercises.findIndex((item) => item.id === exercise.id)
    : -1;
  function clearAnswer() {
    setAnswer({});
    setResult(null);
    setHintUsed(false);
    setHelpOpen(false);
    eventId.current = newEventId();
  }
  function advanceStage() {
    void stopOfflineSpeech();
    clearAnswer();
    const nextPosition = stagePosition + 1;
    setStagePosition(nextPosition);
    setVocabularyPosition(0);
    setExercisePosition(lesson?.stages[nextPosition]?.type === 'practice' ? 0 : -1);
  }
  function finishTeaching() {
    if (stageExercises.length) {
      clearAnswer();
      setExercisePosition(0);
    } else advanceStage();
  }
  async function check() {
    if (!exercise || !hasAnswer(answer, exercise)) return;
    setBusy(true);
    setError('');
    try {
      const response = await api<AttemptResult>('/v1/attempts', {
        clientAttemptId: eventId.current,
        lessonId,
        exerciseId: exercise.id,
        answer,
        hintUsed,
      });
      setResult(response);
      setXp((value) => value + response.xpAwarded);
      if (!response.correct)
        setWeakExerciseIds((ids) => (ids.includes(exercise.id) ? ids : [...ids, exercise.id]));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No pudimos revisar tu respuesta. Puedes intentar de nuevo.',
      );
    } finally {
      setBusy(false);
    }
  }
  function nextExercise() {
    clearAnswer();
    if (exercisePosition + 1 < stageExercises.length) setExercisePosition(exercisePosition + 1);
    else advanceStage();
  }
  function nextVocabulary() {
    void stopOfflineSpeech();
    if (lesson && vocabularyPosition + 1 < lesson.vocabulary.length)
      setVocabularyPosition(vocabularyPosition + 1);
    else if (stageExercises.length) {
      clearAnswer();
      setExercisePosition(0);
    } else advanceStage();
  }
  async function complete() {
    setBusy(true);
    setError('');
    try {
      const response = await api<{ completed: boolean; xpAwarded: number; progress: Progress }>(
        `/v1/lessons/${lessonId}/complete`,
        {},
      );
      if (!response.completed)
        throw new Error('No pudimos completar esta lección. Intenta guardar otra vez.');
      setXp((value) => value + response.xpAwarded);
      const targets = new Set([
        ...(lesson?.review.vocabularyIds ?? []),
        ...(lesson?.review.skillIds ?? []),
      ]);
      const reviews = response.progress.mastery
        .filter((item) => targets.has(item.targetId ?? item.skillId))
        .map((item) => item.nextReviewAt)
        .sort();
      setNextReviewAt(reviews[0] ?? null);
      advanceStage();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No pudimos guardar el resultado en este dispositivo. Intenta otra vez antes de salir.',
      );
    } finally {
      setBusy(false);
    }
  }
  const withinStage = !lesson
    ? 0
    : stage?.type === 'vocabulary'
      ? (exercise
          ? lesson.vocabulary.length + exercisePosition + (result ? 1 : 0)
          : vocabularyPosition) / Math.max(1, lesson.vocabulary.length + stageExercises.length)
      : exercise
        ? (exercisePosition + (result ? 1 : 0)) / Math.max(stageExercises.length, 1)
        : 0;
  const progress = !lesson
    ? 0
    : stage?.type === 'recap'
      ? 1
      : (stagePosition + withinStage) / lesson.stages.length;
  let footer: React.ReactNode;
  if (lesson && stage) {
    if (exercise)
      footer = result ? (
        <View style={{ gap: 12 }}>
          {!result.correct && (
            <Action secondary onPress={clearAnswer}>
              Intentar otra vez
            </Action>
          )}
          <Action onPress={nextExercise}>
            {exercisePosition + 1 === stageExercises.length ? 'Continuar' : 'Siguiente ejercicio'}
          </Action>
        </View>
      ) : (
        <Action
          busy={busy}
          disabled={!hasAnswer(answer, exercise)}
          onPress={() => {
            void check();
          }}
        >
          Comprobar respuesta
        </Action>
      );
    else if (stage.type === 'goal')
      footer = <Action onPress={finishTeaching}>Conocer las palabras</Action>;
    else if (stage.type === 'vocabulary')
      footer = (
        <Action onPress={nextVocabulary}>
          {vocabularyPosition + 1 < lesson.vocabulary.length
            ? 'Siguiente palabra'
            : stageExercises.length
              ? 'Practicar estas palabras'
              : 'Ver la gramática'}
        </Action>
      );
    else if (stage.type === 'grammar')
      footer = <Action onPress={finishTeaching}>Leer la conversación</Action>;
    else if (stage.type === 'dialogue')
      footer = (
        <Action onPress={finishTeaching}>
          {review ? 'Empezar a repasar' : 'Vamos a practicar'}
        </Action>
      );
    else if (stage.type === 'recap')
      footer = <Action onPress={onComplete}>Volver a mi camino</Action>;
  }
  return (
    <FlowFrame
      key={`${lessonId}-${stagePosition}-${vocabularyPosition}-${exercisePosition}`}
      title={lesson?.title ?? 'Preparando tu lección'}
      eyebrow={review ? 'Repasar · Sin prisa' : 'Aprender · Paso a paso'}
      onClose={onClose}
      progress={progress}
      footer={footer}
    >
      {loading && (
        <View style={{ alignItems: 'center', paddingVertical: 70, gap: 20 }}>
          <ActivityIndicator color={palette.teal} size="large" />
          <Text style={f.body}>Preparando tu próximo paso…</Text>
        </View>
      )}
      {!!error && (
        <ErrorCard
          message={error}
          onRetry={
            lesson
              ? undefined
              : () => {
                  void load();
                }
          }
        />
      )}
      {!loading && lesson && stage && (
        <View testID={`lesson-stage-${stage.type}`} style={{ gap: 22 }}>
          <StageProgress lesson={lesson} position={stagePosition} />
          {exercise ? (
            <View testID="lesson-exercise" style={{ gap: 22 }}>
              <Text style={f.eyebrow}>
                Práctica {globalExercisePosition + 1} de {lesson.exercises.length}
              </Text>
              <ExerciseInput
                key={exercise.id}
                exercise={exercise}
                answer={answer}
                setAnswer={setAnswer}
                disabled={!!result || busy}
              />
              {!result && stage.type === 'practice' && (
                <Action
                  secondary
                  onPress={() => {
                    setHelpOpen((open) => !open);
                    setHintUsed(true);
                  }}
                >
                  {helpOpen ? 'Ocultar la ayuda' : 'Volver a ver las palabras'}
                </Action>
              )}
              {helpOpen && (
                <View style={f.card}>
                  <Text style={f.cardTitle}>Una ayuda para seguir</Text>
                  {lesson.vocabulary.map((item) => (
                    <Text key={item.id} style={f.body}>
                      {item.en} · {item.es}
                    </Text>
                  ))}
                  {lesson.grammar.examples.map((example) => (
                    <Text key={example.en} style={f.body}>
                      {example.en} · {example.es}
                    </Text>
                  ))}
                  <Text style={f.quiet}>
                    Usar esta ayuda también es aprender. En el repaso volverás a intentarlo sin
                    apoyo.
                  </Text>
                </View>
              )}
              {result && <AnswerFeedback result={result} />}
            </View>
          ) : stage.type === 'goal' ? (
            <GoalStage lesson={lesson} review={review} />
          ) : stage.type === 'vocabulary' ? (
            <VocabularyCard
              key={lesson.vocabulary[vocabularyPosition].id}
              item={lesson.vocabulary[vocabularyPosition]}
              position={vocabularyPosition}
              total={lesson.vocabulary.length}
            />
          ) : stage.type === 'grammar' ? (
            <GrammarStage lesson={lesson} />
          ) : stage.type === 'dialogue' ? (
            <DialogueStage lesson={lesson} />
          ) : stage.type === 'speaking' ? (
            <>
              <SpeakingPanel
                text={lesson.speakingText}
                onDone={() => {
                  if (!busy) void complete();
                }}
              />
              {busy && <ActivityIndicator color={palette.teal} />}
            </>
          ) : stage.type === 'recap' ? (
            <RecapStage
              lesson={lesson}
              xp={xp}
              nextReviewAt={nextReviewAt}
              weakExerciseIds={weakExerciseIds}
            />
          ) : null}
        </View>
      )}
    </FlowFrame>
  );
}
export { LearningFlow };
