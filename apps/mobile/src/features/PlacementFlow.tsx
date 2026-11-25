import { JournalLeaf } from '../Journal';
import { useTheme } from '../theme';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Compass, Sparkles } from 'lucide-react-native';
import { api, newId } from '../lib/api';
import { Action, ErrorCard, useFeatureStyles, FlowFrame } from './FeatureUI';
import { ExerciseInput, hasAnswer, type Exercise, type ExerciseAnswer } from './ExerciseInput';
interface PlacementResult {
  level: 'A1' | 'A2';
  correct: number;
  total: number;
  feedbackEs: string;
}
export default function PlacementFlow({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete?: (result: PlacementResult) => void;
}) {
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();

  const [questions, setQuestions] = useState<Exercise[]>([]);
  const [position, setPosition] = useState(-1);
  const [answer, setAnswer] = useState<ExerciseAnswer>({});
  const [answers, setAnswers] = useState<{ exerciseId: string; answer: ExerciseAnswer }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [assessmentId] = useState(newId);
  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await api<{ questions: Exercise[] }>('/v1/placement');
      setQuestions(response.questions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos preparar la orientación.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function next() {
    if (busy || result || !questions[position] || !hasAnswer(answer)) return;
    const nextAnswers = [...answers, { exerciseId: questions[position].id, answer }];
    if (position + 1 < questions.length) {
      setAnswers(nextAnswers);
      setPosition(position + 1);
      setAnswer({});
      return;
    }
    setBusy(true);
    setError('');
    try {
      setResult(
        await api<PlacementResult>('/v1/placement', { assessmentId, answers: nextAnswers }),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No pudimos revisar las respuestas en este dispositivo. Puedes intentar otra vez.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <FlowFrame
      title="Encuentra tu punto de partida"
      eyebrow="Orientación de nivel · Opcional"
      onClose={onClose}
      progress={result ? 1 : Math.max(0, position) / Math.max(questions.length, 1)}
      footer={
        result ? (
          <Action onPress={() => (onComplete ? onComplete(result) : onClose())}>
            Seguir aprendiendo
          </Action>
        ) : position < 0 && questions.length ? (
          <View style={{ gap: 9 }}>
            <Action onPress={() => setPosition(0)}>Explorar mi nivel</Action>
            <Action secondary onPress={onClose}>
              Empiezo desde cero
            </Action>
          </View>
        ) : questions[position] ? (
          <Action disabled={!hasAnswer(answer)} busy={busy} onPress={next}>
            {position + 1 === questions.length ? 'Ver mi orientación' : 'Siguiente pregunta'}
          </Action>
        ) : undefined
      }
    >
      {loading && <ActivityIndicator size="large" color={palette.teal} />}
      {!!error && (
        <ErrorCard
          message={error}
          onRetry={
            questions.length
              ? undefined
              : () => {
                  void load();
                }
          }
        />
      )}
      {!loading && position < 0 && !result && (
        <>
          <JournalLeaf compact kind="stamp" style={s.icon}>
            <Compass color={palette.teal} size={42} strokeWidth={1.5} />
          </JournalLeaf>
          <Text style={f.title}>Tu camino empieza donde tú estás.</Text>
          <Text style={f.body}>
            Prueba {questions.length} pequeñas preguntas para orientarte. No es un examen: puedes
            tomarte el tiempo que necesites y omitirlo cuando quieras.
          </Text>
          <JournalLeaf compact kind="postcard" style={f.card}>
            <Text style={f.cardTitle}>Un punto de partida, no una etiqueta.</Text>
            <Text style={f.body}>
              Vas a reconocer frases, ordenar ideas y escribir en inglés. Esta orientación no
              certifica tu nivel ni cambia tus lecciones completadas.
            </Text>
            <Text style={f.quiet}>Sin micrófono. Sin presión. A tu ritmo.</Text>
          </JournalLeaf>
        </>
      )}
      {!result && questions[position] && (
        <>
          <Text style={f.eyebrow}>
            Pregunta {position + 1} de {questions.length}
          </Text>
          <ExerciseInput
            exercise={questions[position]}
            answer={answer}
            setAnswer={setAnswer}
            onSubmit={next}
            disabled={busy}
          />
        </>
      )}
      {result && (
        <View style={{ alignItems: 'center', gap: 23 }}>
          <JournalLeaf compact kind="stamp" style={s.icon}>
            <Sparkles color={palette.teal} size={40} />
          </JournalLeaf>
          <Text style={f.eyebrow}>Una orientación para tu camino</Text>
          <Text style={[f.title, { textAlign: 'center' }]}>
            Tu próximo paso:{' '}
            {result.level === 'A1' ? 'construir una buena base' : 'conectar lo que ya sabes'}.
          </Text>
          <JournalLeaf compact kind="stamp" style={s.levelBadge}>
            <Text style={s.levelText}>{result.level}</Text>
            <Text style={f.quiet}>Nivel sugerido · No certificado</Text>
          </JournalLeaf>
          <Text style={[f.body, { textAlign: 'center' }]}>{result.feedbackEs}</Text>
          <JournalLeaf compact kind="postcard" style={[f.card, { width: '100%' }]}>
            <Text style={f.cardTitle}>Cada habilidad tiene su propio camino.</Text>
            <Text style={f.body}>
              Puedes explorar las unidades y elegir qué practicar. El repaso a lo largo de los días
              te ayudará a descubrir lo que ya recuerdas.
            </Text>
          </JournalLeaf>
        </View>
      )}
    </FlowFrame>
  );
}
export function useStyles() {
  const { colors: palette, tone } = useTheme();
  return StyleSheet.create({
    icon: {
      width: 88,
      height: 88,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.mint,
    },
    levelBadge: {
      padding: 23,
      alignItems: 'center',
      backgroundColor: tone('#EAF4E9', 'background'),
      width: '100%',
      borderRadius: 23,
      gap: 7,
    },
    levelText: { fontFamily: 'Outfit', fontSize: 50, color: palette.teal },
  });
}

export { PlacementFlow };
