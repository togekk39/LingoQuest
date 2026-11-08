import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { stopOfflineSpeech, useOfflineSpeech } from './offlineSpeech';
import { BookOpen, Check, CheckCheck, Lightbulb, Sparkles, Volume2 } from 'lucide-react-native';
import { api } from '../lib/api';
import { Action, ErrorCard, f, FlowFrame, newEventId, palette } from './FeatureUI';
import { ExerciseInput, hasAnswer, type Exercise, type ExerciseAnswer } from './ExerciseInput';
import { SpeakingPanel } from './SpeakingPractice';
interface Lesson {
  id: string;
  unitId: string;
  title: string;
  introEs: string;
  examples: { en: string; es: string }[];
  speakingText: string;
  exercises: Exercise[];
}
interface AttemptResult {
  correct: boolean;
  feedbackEs: string;
  acceptedAnswer?: string;
  xpAwarded: number;
}
type Stage = 'intro' | 'exercise' | 'speak' | 'complete';
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
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>('intro');
  const [position, setPosition] = useState(0);
  const [answer, setAnswer] = useState<ExerciseAnswer>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [xp, setXp] = useState(0);
  const { playOffline, speechMessage } = useOfflineSpeech();
  const eventId = useRef(newEventId());
  async function load() {
    setLoading(true);
    setError('');
    try {
      setLesson(await api<Lesson>(`/v1/lessons/${lessonId}`));
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
  const exercise = lesson?.exercises[position];
  async function check() {
    if (!exercise || !hasAnswer(answer)) return;
    setBusy(true);
    setError('');
    try {
      const response = await api<AttemptResult>('/v1/attempts', {
        clientAttemptId: eventId.current,
        lessonId,
        exerciseId: exercise.id,
        answer,
      });
      setResult(response);
      setXp((v) => v + (response.xpAwarded ?? 0));
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
  function retry() {
    setResult(null);
    setAnswer({});
    eventId.current = newEventId();
  }
  function next() {
    setResult(null);
    setAnswer({});
    eventId.current = newEventId();
    if (lesson && position + 1 < lesson.exercises.length) setPosition(position + 1);
    else setStage('speak');
  }
  async function complete() {
    setBusy(true);
    setError('');
    try {
      const response = await api<{ completed: boolean; xpAwarded: number }>(
        `/v1/lessons/${lessonId}/complete`,
        {},
      );
      if (!response.completed)
        throw new Error('No pudimos completar esta lección. Intenta guardar otra vez.');
      setXp((v) => v + (response.xpAwarded ?? 0));
      setStage('complete');
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
  const progress = !lesson
    ? 0
    : stage === 'intro'
      ? 0
      : stage === 'speak' || stage === 'complete'
        ? 1
        : (position + (result ? 1 : 0)) / lesson.exercises.length;
  let footer: React.ReactNode;
  if (stage === 'intro' && lesson)
    footer = (
      <Action onPress={() => setStage('exercise')}>
        {review ? 'Empezar a repasar' : 'Vamos a practicar'}
      </Action>
    );
  if (stage === 'exercise' && exercise)
    footer = result ? (
      <View style={{ gap: 12 }}>
        {!result.correct && (
          <Action secondary onPress={retry}>
            Intentar otra vez
          </Action>
        )}
        <Action onPress={next}>
          {position + 1 === lesson?.exercises.length ? 'Continuar' : 'Siguiente ejercicio'}
        </Action>
      </View>
    ) : (
      <Action
        busy={busy}
        disabled={!hasAnswer(answer)}
        onPress={() => {
          void check();
        }}
      >
        Comprobar respuesta
      </Action>
    );
  if (stage === 'complete') footer = <Action onPress={onComplete}>Volver a mi camino</Action>;
  return (
    <FlowFrame
      title={lesson?.title ?? 'Preparando tu lección'}
      eyebrow={review ? 'Repasar · Sin prisa' : 'Aprender · Paso a paso'}
      onClose={onClose}
      progress={progress}
      footer={footer}
    >
      {loading && (
        <View style={s.loading}>
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
      {!loading && lesson && stage === 'intro' && (
        <>
          <View style={s.lessonIcon}>
            <BookOpen color={palette.teal} size={35} strokeWidth={1.5} />
          </View>
          <Text style={f.eyebrow}>Una idea que abre puertas</Text>
          <Text style={f.title}>{lesson.title}</Text>
          <Text style={f.body}>{lesson.introEs}</Text>
          <View style={f.card}>
            <View style={f.row}>
              <Lightbulb size={19} color={palette.teal} />
              <Text style={f.cardTitle}>Mira cómo funciona</Text>
            </View>
            {lesson.examples.map((example, index) => (
              <View key={`${example.en}-${index}`} style={s.example}>
                <View style={{ flex: 1, gap: 5 }}>
                  <Text style={s.english}>{example.en}</Text>
                  <Text style={f.body}>{example.es}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Escuchar: ${example.en}`}
                  style={s.sound}
                  onPress={() => {
                    void playOffline(example.en, 0.85);
                  }}
                >
                  <Volume2 size={20} color={palette.teal} />
                </Pressable>
              </View>
            ))}
          </View>
          {!!speechMessage && (
            <Text accessibilityRole="alert" style={f.quiet}>
              {speechMessage}
            </Text>
          )}
          <View style={s.supportive}>
            <Sparkles size={18} color={palette.teal} />
            <Text style={[f.quiet, { flex: 1 }]}>
              Puedes equivocarte y volver a intentar. Cada intento es parte del camino.
            </Text>
          </View>
        </>
      )}
      {!loading && lesson && stage === 'exercise' && exercise && (
        <>
          <View style={s.exerciseHeading}>
            <Text style={f.eyebrow}>
              Práctica {position + 1} de {lesson.exercises.length}
            </Text>
            <View style={s.smallPill}>
              <Text style={s.smallPillText}>Inglés · {lesson.unitId.toUpperCase()}</Text>
            </View>
          </View>
          <ExerciseInput
            exercise={exercise}
            answer={answer}
            setAnswer={setAnswer}
            disabled={!!result || busy}
          />
          {result && (
            <View
              accessibilityRole="alert"
              style={[
                s.feedback,
                result.correct
                  ? { backgroundColor: '#E6F5EB', borderColor: '#B8DBC6' }
                  : { backgroundColor: '#FFF3E7', borderColor: '#ECD2B6' },
              ]}
            >
              <View style={f.row}>
                {result.correct ? (
                  <Check size={23} color={palette.teal} />
                ) : (
                  <Lightbulb size={23} color="#B17734" />
                )}
                <Text style={f.cardTitle}>
                  {result.correct ? '¡Muy bien!' : 'Buen intento. Veamos por qué…'}
                </Text>
              </View>
              <Text style={[f.body, { color: palette.ink }]}>{result.feedbackEs}</Text>
              {result.acceptedAnswer && !result.correct && (
                <Text style={s.accepted}>Una respuesta posible: {result.acceptedAnswer}</Text>
              )}
              {!result.correct && (
                <Text style={f.quiet}>
                  Puedes volver a intentar o continuar. Aquí se aprende practicando.
                </Text>
              )}
            </View>
          )}
        </>
      )}
      {!loading && lesson && stage === 'speak' && (
        <SpeakingPanel
          text={lesson.speakingText}
          onDone={() => {
            void complete();
          }}
        />
      )}
      {!loading && stage === 'speak' && busy && <ActivityIndicator color={palette.teal} />}
      {stage === 'complete' && (
        <View style={{ alignItems: 'center', gap: 23, paddingVertical: 18 }}>
          <View style={s.completeIcon}>
            <CheckCheck color={palette.teal} size={44} />
          </View>
          <Text style={[f.eyebrow, { textAlign: 'center' }]}>Un paso más en tu camino</Text>
          <Text style={[f.title, { textAlign: 'center' }]}>¡Lección completada!</Text>
          <Text style={[f.body, { textAlign: 'center', maxWidth: 480 }]}>
            Tu progreso está guardado en este dispositivo. Repasar en los próximos días te ayudará a
            recordar lo que aprendiste.
          </Text>
          <View style={s.xp}>
            <Sparkles size={23} color="#BC8130" />
            <Text style={s.xpText}>+{xp} XP de aprendizaje</Text>
          </View>
          <View style={[f.card, { width: '100%' }]}>
            <Text style={f.cardTitle}>Aprender hoy. Recordar mañana.</Text>
            <Text style={f.body}>
              Agregamos estas habilidades a tu plan de repaso local. Completar una lección es el
              comienzo; recordarla con el tiempo es el siguiente paso.
            </Text>
          </View>
        </View>
      )}
    </FlowFrame>
  );
}
const s = StyleSheet.create({
  loading: { alignItems: 'center', paddingVertical: 70, gap: 20 },
  lessonIcon: {
    width: 80,
    height: 80,
    borderRadius: 25,
    backgroundColor: palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  example: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: '#EDF1EC',
  },
  english: { fontFamily: 'Outfit', fontSize: 23, color: palette.ink },
  sound: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#EDF6EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportive: { flexDirection: 'row', gap: 13, alignItems: 'center', padding: 17 },
  exerciseHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 5,
  },
  smallPill: {
    backgroundColor: '#E9F1E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallPillText: { fontFamily: 'Manrope', color: palette.muted, fontSize: 10 },
  feedback: { padding: 23, gap: 13, borderRadius: 19, borderWidth: 1, marginTop: 8 },
  accepted: {
    fontFamily: 'Manrope',
    fontSize: 15,
    color: palette.ink,
    fontWeight: '700',
    lineHeight: 24,
  },
  completeIcon: {
    height: 104,
    width: 104,
    borderRadius: 36,
    backgroundColor: palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xp: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#FAEDCE',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 25,
  },
  xpText: { fontFamily: 'Outfit', color: '#956924', fontSize: 22 },
});

export { LearningFlow };
