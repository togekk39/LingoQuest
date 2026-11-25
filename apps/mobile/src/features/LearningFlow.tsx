import { useTheme } from '../theme';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Text, View } from 'react-native';
import type { AttemptResult, Progress } from '@lingoquest/contracts';
import type { LessonCheckpoint } from '@lingoquest/offline-engine';
import { useOfflineSpeech } from './offlineSpeech';
import { api } from '../lib/api';
import { chapterForUnit } from '../lib/chapterPacks';
import { Notebook, JournalLeaf } from '../Journal';
import { Action, ErrorCard, useFeatureStyles, FlowFrame, newEventId } from './FeatureUI';
import { ExerciseInput, hasAnswer, type ExerciseAnswer } from './ExerciseInput';
import { SpeakingPanel } from './SpeakingPractice';
import {
  AnswerFeedback,
  DialogueStage,
  GoalStage,
  GrammarStage,
  getPlazaExample,
  RecapStage,
  StageProgress,
  VocabularyCard,
  type IntegratedLesson,
} from './LessonStages';

export default function LearningFlow({
  lessonId,
  onClose,
  onComplete,
  onSettings,
  review = false,
}: {
  lessonId: string;
  onClose: () => void;
  onComplete: () => void;
  onSettings?: () => void;
  review?: boolean;
}) {
  const { colors: palette } = useTheme();
  const f = useFeatureStyles();
  const [lesson, setLesson] = useState<IntegratedLesson | null>(null);
  const chapterId = lesson ? chapterForUnit(lesson.unitId) : undefined;
  const { playOffline, speechMessage, stop: stopAudio } = useOfflineSpeech(chapterId);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const fresh = (): LessonCheckpoint => ({
    activityId: newEventId(),
    eventId: newEventId(),
    stage: 0,
    vocabulary: 0,
    exercise: -1,
    answer: {},
    hint: false,
    help: false,
    xp: 0,
    weak: [],
    reviewAt: null,
  });
  const [checkpoint, setCheckpoint] = useState(fresh);
  const latest = useRef(checkpoint);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const writeCount = useRef(0);
  const checkpointPath = `/v1/lessons/${lessonId}/checkpoint`;
  function display(next: LessonCheckpoint) {
    latest.current = next;
    setCheckpoint(next);
  }
  function save(next: LessonCheckpoint) {
    display(next);
    if (review) return;
    const version = ++writeCount.current;
    void api(checkpointPath, next)
      .then(() => {
        if (version === writeCount.current) setError('');
      })
      .catch((e) => {
        if (version === writeCount.current) setError(e.message);
      });
  }
  async function load() {
    setLoading(true);
    setError('');
    try {
      const [nextLesson, initial] = await Promise.all([
        api<IntegratedLesson>(`/v1/lessons/${lessonId}`),
        review
          ? null
          : api<{ saved: LessonCheckpoint; result?: AttemptResult } | null>(checkpointPath),
      ]);
      setLesson(nextLesson);
      display(initial?.saved ?? fresh());
      setResult(initial?.result ?? null);
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
    return stopAudio;
  }, [lessonId, stopAudio]);
  const {
    stage: stagePosition,
    vocabulary: vocabularyPosition,
    exercise: exercisePosition,
    answer,
    help: helpOpen,
    xp,
    reviewAt: nextReviewAt,
    weak: weakExerciseIds,
  } = checkpoint;
  const stage = lesson?.stages[stagePosition];
  const stageExercises = (stage?.exerciseIds ?? []).map((id) =>
    lesson!.exercises.find((item) => item.id === id)!,
  );
  const exercise = exercisePosition >= 0 ? stageExercises[exercisePosition] : undefined;
  const globalExercisePosition = exercise
    ? lesson!.exercises.findIndex((item) => item.id === exercise.id)
    : -1;
  const isPlaza = lesson?.id === 'u01_l01';
  const audioText =
    !lesson || loading || exercise
      ? undefined
      : {
          goal: isPlaza ? getPlazaExample()?.en : undefined,
          vocabulary: lesson.vocabulary[vocabularyPosition]?.en,
          grammar: lesson.grammar.examples[0]?.en,
          dialogue: lesson.dialogue[0]?.en,
          practice: undefined,
          speaking: undefined,
          recap: undefined,
        }[stage?.type ?? 'goal'];
  const onListen = audioText
    ? () => {
        void playOffline(audioText);
      }
    : undefined;
  function afterFeedback(): LessonCheckpoint {
    const current = latest.current;
    const needsPractice = !!result && !result.correct && result.outcome !== 'ungradable';
    const weak =
      needsPractice && exercise && !current.weak.includes(exercise.id)
        ? [...current.weak, exercise.id]
        : current.weak;
    return {
      ...current,
      eventId: newEventId(),
      answer: {},
      hint: needsPractice,
      help: false,
      xp: current.xp + (result?.xpAwarded ?? 0),
      weak,
    };
  }
  function move(changes: Partial<LessonCheckpoint> = {}) {
    const next = { ...afterFeedback(), ...changes };
    setResult(null);
    save(next);
  }
  function advanceStage() {
    stopAudio();
    const next = stagePosition + 1;
    move({
      stage: next,
      vocabulary: 0,
      exercise: lesson?.stages[next]?.type === 'practice' ? 0 : -1,
      hint: false,
    });
  }
  function finishTeaching() {
    if (stageExercises.length) move({ exercise: 0 });
    else advanceStage();
  }
  async function check() {
    const current = latest.current;
    if (!exercise || !hasAnswer(current.answer, exercise)) return;
    Keyboard.dismiss();
    setBusy(true);
    setError('');
    try {
      const response = await api<AttemptResult>('/v1/attempts', {
        clientAttemptId: current.eventId,
        lessonId,
        exerciseId: exercise.id,
        answer: current.answer,
        hintUsed: current.hint,
        ...(!review ? { checkpoint: current } : {}),
      });
      setResult(response);
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
    if (exercisePosition + 1 < stageExercises.length)
      move({ exercise: exercisePosition + 1, hint: false });
    else advanceStage();
  }
  function nextVocabulary() {
    stopAudio();
    if (lesson && vocabularyPosition + 1 < lesson.vocabulary.length)
      save({ ...latest.current, vocabulary: vocabularyPosition + 1 });
    else if (stageExercises.length) move({ exercise: 0 });
    else advanceStage();
  }
  async function complete() {
    setBusy(true);
    setError('');
    try {
      const next = { ...afterFeedback(), stage: stagePosition + 1, exercise: -1, vocabulary: 0 };
      const response = await api<{
        completed: boolean;
        xpAwarded: number;
        progress: Progress;
        checkpoint?: LessonCheckpoint;
      }>(`/v1/lessons/${lessonId}/complete`, review ? {} : { checkpoint: next });
      const targets = new Set([...lesson!.review.vocabularyIds, ...lesson!.review.skillIds]);
      const reviews = response.progress.mastery
        .filter((item) => targets.has(item.targetId ?? item.skillId))
        .map((item) => item.nextReviewAt)
        .sort();
      save({
        ...(response.checkpoint ?? { ...next, xp: next.xp + response.xpAwarded }),
        reviewAt: reviews[0] ?? null,
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No pudimos guardar el resultado en este dispositivo.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function closeRecap() {
    if (!review) {
      try {
        await api(checkpointPath, undefined, 'DELETE');
      } catch (e) {
        setError((e as Error).message);
        return;
      }
    }
    onComplete();
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
          {!result.correct && result.outcome !== 'ungradable' && (
            <Action secondary onPress={() => move()}>
              Intentar otra vez
            </Action>
          )}
          <Action journal onPress={nextExercise}>
            {exercisePosition + 1 === stageExercises.length ? 'Continuar' : 'Siguiente ejercicio'}
          </Action>
        </View>
      ) : (
        <Action
          journal
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
      footer = (
        <Action journal onPress={finishTeaching}>
          Conocer las palabras
        </Action>
      );
    else if (stage.type === 'vocabulary')
      footer = (
        <Action journal onPress={nextVocabulary}>
          {vocabularyPosition + 1 < lesson.vocabulary.length
            ? 'Siguiente palabra'
            : stageExercises.length
              ? 'Practicar estas palabras'
              : 'Ver la gramática'}
        </Action>
      );
    else if (stage.type === 'grammar')
      footer = (
        <Action journal onPress={finishTeaching}>
          Leer la conversación
        </Action>
      );
    else if (stage.type === 'dialogue')
      footer = (
        <Action journal onPress={finishTeaching}>
          {review ? 'Empezar a repasar' : 'Vamos a practicar'}
        </Action>
      );
    else if (stage.type === 'recap')
      footer = (
        <Action journal onPress={() => void closeRecap()}>
          Volver a mi camino
        </Action>
      );
  }
  return (
    <FlowFrame
      stepKey={`${lessonId}-${stagePosition}-${vocabularyPosition}-${exercisePosition}`}
      title={lesson?.title ?? 'Preparando tu lección'}
      eyebrow={
        lesson
          ? `${review ? 'Repasar' : isPlaza ? 'La plaza' : 'Aprender'} · ${lesson.estimatedMinutes} min`
          : 'Aprender'
      }
      journal={{ onListen, onSettings }}
      onClose={onClose}
      progress={progress}
      footer={footer}
      feedback={
        result && exercise ? (
          <AnswerFeedback result={result} exercise={exercise} answer={answer} />
        ) : null
      }
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
        <View testID={`lesson-stage-${stage.type}`} style={{ gap: 14 }}>
          {stage.type !== 'goal' && <StageProgress lesson={lesson} position={stagePosition} />}
          {!!audioText && stage.type !== 'vocabulary' && !!speechMessage && (
            <Text accessibilityRole="alert" style={f.quiet}>
              {speechMessage}
            </Text>
          )}
          {exercise ? (
            <View testID="lesson-exercise" style={{ gap: 22 }}>
              <Text style={f.eyebrow}>
                Práctica {globalExercisePosition + 1} de {lesson.exercises.length}
              </Text>
              <Notebook title="Ahora te toca a ti">
                <ExerciseInput
                  journal
                  key={exercise.id}
                  exercise={exercise}
                  answer={answer}
                  setAnswer={(value: ExerciseAnswer) => save({ ...latest.current, answer: value })}
                  disabled={!!result || busy}
                />
              </Notebook>
              {!result && stage.type === 'practice' && (
                <Action
                  secondary
                  onPress={() => {
                    save({ ...latest.current, help: !latest.current.help, hint: true });
                  }}
                >
                  {helpOpen ? 'Ocultar la ayuda' : 'Volver a ver las palabras'}
                </Action>
              )}
              {helpOpen && (
                <JournalLeaf compact kind="postcard" style={f.card}>
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
                </JournalLeaf>
              )}
            </View>
          ) : stage.type === 'goal' ? (
            <GoalStage lesson={lesson} review={review} onListen={onListen} />
          ) : stage.type === 'vocabulary' ? (
            <VocabularyCard
              key={lesson.vocabulary[vocabularyPosition].id}
              item={lesson.vocabulary[vocabularyPosition]}
              position={vocabularyPosition}
              total={lesson.vocabulary.length}
              playOffline={playOffline}
              stopAudio={stopAudio}
              speechMessage={speechMessage}
            />
          ) : stage.type === 'grammar' ? (
            <GrammarStage lesson={lesson} playOffline={playOffline} />
          ) : stage.type === 'dialogue' ? (
            <DialogueStage lesson={lesson} playOffline={playOffline} />
          ) : stage.type === 'speaking' ? (
            <>
              <SpeakingPanel
                text={lesson.speakingText}
                chapterId={chapterId}
                allowSystemRecognition
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
