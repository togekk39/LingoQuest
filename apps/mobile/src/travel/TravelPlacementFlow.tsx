import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Text, View } from 'react-native';
import { Compass, CornerDownRight, MapPin, Volume2 } from 'lucide-react-native';
import {
  chapter,
  type TravelPlacement,
  type TravelPlacementQuestion,
  type TravelPlacementResponse,
  type TravelState,
} from '@lingoquest/offline-engine';
import { ExerciseInput, hasAnswer, type ExerciseAnswer } from '../features/ExerciseInput';
import { Action, ErrorCard, FlowFrame, useFeatureStyles } from '../features/FeatureUI';
import { api } from '../lib/api';
import { useTheme } from '../theme';
import { Button, Card, Heading, Label } from '../ui';
import { TravelScene } from './TravelAppearance';
import { useChapterAudio } from './useChapterAudio';

export function TravelPlacementFlow({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: (missionId: string, travel: TravelState) => Promise<void>;
}) {
  const { colors: C } = useTheme();
  const f = useFeatureStyles();
  const { play, stop, speechMessage } = useChapterAudio();
  const [questions, setQuestions] = useState<TravelPlacementQuestion[]>([]);
  const [answers, setAnswers] = useState<TravelPlacementResponse[]>([]);
  const [answer, setAnswer] = useState<ExerciseAnswer>({});
  const [transcript, setTranscript] = useState(false);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<{ placement: TravelPlacement; travel: TravelState }>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  const item = questions[answers.length];
  const recommended = chapter.missions.find(
    (mission) => mission.id === result?.placement.missionId,
  );

  async function load() {
    setError('');
    try {
      setQuestions(
        (await api<{ questions: TravelPlacementQuestion[] }>('/v1/travel/placement')).questions,
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function submit(skip = false) {
    if (pending.current || !item || (!skip && !hasAnswer(answer, item.exercise))) return;
    pending.current = true;
    Keyboard.dismiss();
    stop();
    setError('');
    const next = [...answers, { answer: skip ? null : answer, transcript }];
    try {
      if (next.length === questions.length) {
        setBusy(true);
        setResult(await api('/v1/travel/placement', { answers: next }));
      }
      setAnswers(next);
      setAnswer({});
      setTranscript(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function openMission() {
    if (!result || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await onStart(result.placement.missionId, result.travel);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  const footer = result ? (
    <Action busy={busy} onPress={() => void openMission()}>
      Ir a mi misión
    </Action>
  ) : !started && questions.length ? (
    <Action onPress={() => setStarted(true)}>Empezar la prueba</Action>
  ) : started && item ? (
    <View style={{ gap: 8 }}>
      <Action
        busy={busy}
        disabled={!hasAnswer(answer, item.exercise)}
        onPress={() => void submit()}
      >
        {answers.length + 1 === questions.length ? 'Ver mi punto de partida' : 'Siguiente pregunta'}
      </Action>
      <Action secondary disabled={busy} onPress={() => void submit(true)}>
        No lo sé todavía
      </Action>
    </View>
  ) : undefined;
  return (
    <FlowFrame
      title="Tu punto de partida"
      eyebrow="La primera postal"
      onClose={onClose}
      stepKey={result ? 'result' : started ? item?.exercise.id : 'intro'}
      progress={started ? answers.length / questions.length : undefined}
      footer={footer}
    >
      {!!error && (
        <ErrorCard message={error} onRetry={!questions.length ? () => void load() : undefined} />
      )}
      {!questions.length && !error && <ActivityIndicator color={C.accent} />}
      {result && recommended ? (
        <>
          <TravelScene place={recommended.place} />
          <Card style={{ gap: 12, borderLeftWidth: 4, borderLeftColor: C.accent }}>
            <MapPin size={23} color={C.accent} />
            <Label>Tu misión sugerida</Label>
            <Heading style={{ fontSize: 28 }}>{recommended.title}</Heading>
            <Label style={f.body}>{recommended.objective}</Label>
            <Label>
              {result.placement.correct} de {result.placement.total} respuestas acertadas sin ayuda.
            </Label>
            {recommended.id !== 'hello' && (
              <Label>Puedes volver a las misiones anteriores desde Aprender.</Label>
            )}
          </Card>
        </>
      ) : started && item ? (
        <>
          <Text style={f.eyebrow}>
            Pregunta {answers.length + 1} de {questions.length}
          </Text>
          {item.audio && (
            <Card style={{ gap: 8 }}>
              <Button variant="secondary" icon={Volume2} onPress={() => void play(item.audio!)}>
                Escuchar a Sam
              </Button>
              {transcript ? (
                <Text style={f.cardTitle}>{item.audio}</Text>
              ) : (
                <Button variant="ghost" onPress={() => setTranscript(true)}>
                  Leer la transcripción
                </Button>
              )}
              {!!speechMessage && <Label>{speechMessage}</Label>}
            </Card>
          )}
          <ExerciseInput
            key={item.exercise.id}
            exercise={item.exercise}
            answer={answer}
            setAnswer={setAnswer}
            disabled={busy}
          />
        </>
      ) : (
        questions.length > 0 && (
          <>
            <TravelScene place="La plaza" />
            <Heading style={{ fontSize: 30 }}>¿Por dónde seguimos?</Heading>
            <Label style={f.body}>
              Son seis preguntas sobre el inglés que usarás con Sam. Al final te proponemos una
              misión de este capítulo.
            </Label>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Compass color={C.accent} size={20} />
              <Label>Sin reloj, desde este dispositivo.</Label>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <CornerDownRight color={C.accent} size={20} />
              <Label>Puedes saltar cualquier pregunta.</Label>
            </View>
          </>
        )
      )}
    </FlowFrame>
  );
}
