import { Notebook, PlazaPhoto } from '../Journal';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import {
  ArrowRight,
  Backpack,
  BusFront,
  Check,
  Compass,
  LocateFixed,
  MapPin,
  Stamp,
  Trees,
  Volume2,
} from 'lucide-react-native';
import {
  chapter,
  type TravelCheckpoint,
  type TravelMission,
  type TravelOperation,
  type TravelState,
} from '@lingoquest/offline-engine';
import { api } from '../lib/api';
import { Action, ErrorCard, FlowFrame, useFeatureStyles } from '../features/FeatureUI';
import { ExerciseInput, hasAnswer, type ExerciseAnswer } from '../features/ExerciseInput';
import { AnswerFeedback } from '../features/LessonStages';
import { SpeakingPanel } from '../features/SpeakingPractice';
import { Button, Card, Heading, Label } from '../ui';
import { QuestBuddy } from '../QuestBuddy';
import { useTheme } from '../theme';
import { useChapterAudio } from './useChapterAudio';
import { TravelScene, VocabularyCard } from './TravelAppearance';

function Phrase({ en, es, play }: { en: string; es: string; play: (phrase: string) => void }) {
  const f = useFeatureStyles();
  return (
    <View style={f.card}>
      <Text accessibilityLanguage="en-US" style={f.cardTitle}>
        {en}
      </Text>
      <Text style={f.body}>{es}</Text>
      <Button variant="secondary" icon={Volume2} onPress={() => play(en)}>
        Escuchar frase
      </Button>
    </View>
  );
}
function SceneClue({ type }: { type: 'directions' | 'bag' }) {
  const { colors: C } = useTheme();
  const s = useStyles();
  return (
    <View style={s.clue}>
      {type === 'directions' ? (
        <>
          <View style={s.landmark}>
            <BusFront size={28} color={C.teal} />
            <Label>Parada de bus</Label>
          </View>
          <LocateFixed size={19} color={C.muted} />
          <View style={s.landmark}>
            <Trees size={28} color={C.teal} />
            <Label>Parque</Label>
          </View>
        </>
      ) : (
        <>
          <View style={s.landmark}>
            <Backpack size={36} color="#3582B9" />
            <Label>Mochila azul</Label>
          </View>
          <View style={s.landmark}>
            <Backpack size={36} color={C.red} />
            <Label>Mochila roja</Label>
          </View>
        </>
      )}
    </View>
  );
}

export function TravelFlow({
  initial,
  onUpdate,
  onClose,
  onPassport,
  onVoiceSettings,
}: {
  initial: TravelCheckpoint;
  onUpdate: (travel: TravelState) => void;
  onClose: () => void;
  onPassport: () => void;
  onVoiceSettings: () => void;
}) {
  const [current, setCurrent] = useState(initial);
  const [answer, setAnswer] = useState<ExerciseAnswer>(initial.answer);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [returning, setReturning] = useState(!initial.finished && initial.step > 0);
  const { colors: C } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();
  const actionInFlight = useRef(false);
  const writes = useRef(Promise.resolve());
  const savedDraft = useRef(initial.answer);
  const mission: TravelMission = chapter.missions.find((m) => m.id === current.missionId)!;
  const step = mission.steps[current.step];
  const { play, stop, speechMessage } = useChapterAudio();
  const wordIndex = current.word ?? 0;
  const word =
    !current.finished && step.type === 'teach' ? mission.vocabulary[wordIndex] : undefined;
  useEffect(() => {
    if (word) void play(word.term);
  }, [play, word]);

  function draft(next: ExerciseAnswer) {
    setAnswer(next);
    const token = current.token;
    writes.current = api<TravelState>('/v1/travel', {
      action: 'draft',
      token,
      answer: next,
    } satisfies TravelOperation)
      .then((travel) => {
        if (travel.active?.token === token && !travel.active.result) {
          savedDraft.current = travel.active.answer;
          setError('');
        }
      })
      .catch((e) => setError(e.message));
  }
  async function act(operation: TravelOperation) {
    if (actionInFlight.current) return false;
    actionInFlight.current = true;
    setBusy(true);
    setReturning(false);
    setError('');
    try {
      await writes.current;
      const travel = await api<TravelState>('/v1/travel', operation);
      onUpdate(travel);
      if (travel.active) {
        if (travel.active.token !== current.token || travel.active.word !== current.word) stop();
        setCurrent(travel.active);
        setAnswer(travel.active.answer);
        savedDraft.current = travel.active.answer;
      }
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      actionInFlight.current = false;
      setBusy(false);
    }
  }
  async function close(passport = false) {
    if (actionInFlight.current) return;
    await writes.current;
    if (!current.finished && JSON.stringify(answer) !== JSON.stringify(savedDraft.current)) {
      draft(answer);
      await writes.current;
      if (JSON.stringify(answer) !== JSON.stringify(savedDraft.current)) return;
    }
    if (current.finished && !(await act({ action: 'dismiss', token: current.token }))) return;
    stop();
    if (passport) onPassport();
    else onClose();
  }
  const advance = () => void act({ action: 'advance', token: current.token });
  const footer = current.finished ? (
    <Action journal busy={busy} onPress={() => void close(mission.id === 'bag')}>
      {mission.id === 'bag' ? 'Abrir pasaporte' : 'Volver al viaje'}
    </Action>
  ) : step.type === 'exercise' ? (
    current.result ? (
      <View style={{ gap: 8 }}>
        {!current.result.correct && (
          <Action
            journal
            secondary
            disabled={busy}
            onPress={() => void act({ action: 'retry', token: current.token })}
          >
            Intentar otra vez
          </Action>
        )}
        <Action journal busy={busy} onPress={advance}>
          {current.result.correct ? 'Seguir la historia' : 'Usar la respuesta de QuestBuddy'}
        </Action>
      </View>
    ) : (
      <Action
        journal
        busy={busy}
        disabled={!hasAnswer(answer, step.exercise)}
        onPress={() => {
          Keyboard.dismiss();
          void act({ action: 'answer', token: current.token, answer });
        }}
      >
        Comprobar respuesta
      </Action>
    )
  ) : word ? (
    <Action
      journal
      busy={busy}
      onPress={() => void act({ action: 'word', token: current.token, position: wordIndex + 1 })}
    >
      {wordIndex + 1 < mission.vocabulary.length ? 'Siguiente palabra' : 'Ver la explicación'}
    </Action>
  ) : step.type !== 'speak' ? (
    <Action journal busy={busy} onPress={advance}>
      {current.step === mission.steps.length - 1
        ? 'Completar misión'
        : step.type === 'teach'
          ? 'Probar en la historia'
          : 'Continuar'}
    </Action>
  ) : undefined;

  return (
    <FlowFrame
      title={mission.title}
      eyebrow={`${mission.place} · ${mission.minutes} min`}
      stepKey={`${current.token}-${wordIndex}`}
      onClose={() => void close()}
      journal={{}}
      onVoiceSettings={
        step.type !== 'speak'
          ? () => {
              stop();
              onVoiceSettings();
            }
          : undefined
      }
      progress={current.finished ? 1 : (current.step + 1) / mission.steps.length}
      footer={footer}
      feedback={
        step.type === 'exercise' && current.result ? (
          <AnswerFeedback
            result={current.result}
            exercise={step.exercise}
            answer={current.answer}
          />
        ) : null
      }
    >
      {error && <ErrorCard message={error} />}
      {returning && (
        <View style={s.recap}>
          <Compass size={19} color={C.teal} />
          <Label style={{ flex: 1 }}>Retomamos donde lo dejaste. {mission.objective}</Label>
        </View>
      )}
      <View key={current.token} testID={`travel-step-${step.type}`} style={{ gap: 14 }}>
        {current.finished ? (
          <Card style={s.story}>
            <View style={s.npc}>
              {mission.id === 'bag' ? (
                <Stamp size={28} color={C.teal} />
              ) : (
                <Check size={28} color={C.teal} />
              )}
              <Heading style={{ flex: 1 }}>¡Misión completada!</Heading>
            </View>
            <Label style={s.storyText}>{mission.success}</Label>
            {mission.id === 'bag' && (
              <Label style={s.storyText}>Sello obtenido · {chapter.stamp}</Label>
            )}
          </Card>
        ) : step.type === 'dialogue' ? (
          <>
            {current.step === 0 &&
              (/plaza/i.test(mission.place) ? (
                <PlazaPhoto />
              ) : (
                <TravelScene place={mission.place} />
              ))}
            <Card style={s.story}>
              <View style={s.npc}>
                {step.speaker === 'QuestBuddy' ? (
                  <QuestBuddy size={53} />
                ) : (
                  <View
                    style={[s.portrait, step.speaker === 'Sam' && { backgroundColor: '#F5CBB0' }]}
                  >
                    <Text style={s.initial}>{step.speaker[0]}</Text>
                  </View>
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Heading style={{ fontSize: 24 }}>{step.speaker}</Heading>
                  <Label>
                    {step.speaker === 'Luz'
                      ? 'Mesa de bienvenida'
                      : step.speaker === 'Sam'
                        ? 'Viajera'
                        : 'Tu compañero de viaje'}
                  </Label>
                </View>
              </View>
              <Label style={s.storyText}>{step.text}</Label>
            </Card>
            {step.line && <Phrase {...step.line} play={(value) => void play(value)} />}
          </>
        ) : word ? (
          <>
            <View style={s.chapterHead}>
              <Heading style={{ flex: 1, fontSize: 26 }}>Palabras del viaje</Heading>
              <Label>
                {wordIndex + 1} / {mission.vocabulary.length}
              </Label>
            </View>
            <VocabularyCard word={word} play={(value) => void play(value)} />
          </>
        ) : step.type === 'teach' ? (
          <>
            <Text style={f.title}>{step.title}</Text>
            <Text style={f.body}>{step.text}</Text>
            {step.examples.map((example) => (
              <Phrase key={example.en} {...example} play={(value) => void play(value)} />
            ))}
          </>
        ) : step.type === 'exercise' ? (
          <>
            <View style={s.recap}>
              <MapPin size={19} color={C.teal} />
              <Label style={[s.storyText, { flex: 1 }]}>{step.situation}</Label>
            </View>
            {step.visual && <SceneClue type={step.visual} />}
            {step.audio && (
              <View style={{ gap: 9 }}>
                <Button variant="secondary" icon={Volume2} onPress={() => void play(step.audio!)}>
                  Escuchar a Sam
                </Button>
                {current.transcript || current.result ? (
                  <Text accessibilityLanguage="en-US" style={f.body}>
                    {step.transcript}
                  </Text>
                ) : (
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onPress={() => void act({ action: 'transcript', token: current.token })}
                  >
                    Leer la transcripción
                  </Button>
                )}
              </View>
            )}
            <Notebook title="Ahora te toca a ti">
              <ExerciseInput
                journal
                exercise={step.exercise}
                answer={answer}
                setAnswer={draft}
                disabled={busy || !!current.result}
              />
            </Notebook>
            {step.hint &&
              !current.result &&
              (current.hint ? (
                <Label style={s.storyText}>{step.hint}</Label>
              ) : (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onPress={() => void act({ action: 'hint', token: current.token })}
                >
                  Pedir una pista
                </Button>
              ))}
          </>
        ) : (
          <>
            <Label style={s.storyText}>{step.text}</Label>
            <SpeakingPanel
              text={step.phrase}
              onDone={advance}
              onPlay={() => void play(step.phrase)}
              onStopReference={stop}
              offlineOnly
            />
            <Button variant="ghost" icon={ArrowRight} loading={busy} onPress={advance}>
              Completar misión
            </Button>
          </>
        )}
      </View>
      {speechMessage && (
        <Text accessibilityRole="alert" style={f.quiet}>
          {speechMessage}
        </Text>
      )}
    </FlowFrame>
  );
}
function useStyles() {
  const { colors: C } = useTheme();
  return StyleSheet.create({
    chapterHead: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    story: { gap: 15, padding: 18, borderLeftWidth: 4, borderLeftColor: C.accent },
    npc: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    storyText: { color: C.ink, fontSize: 16, lineHeight: 24 },
    recap: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      borderRadius: 12,
      padding: 12,
      backgroundColor: C.mint,
    },
    portrait: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#C9DCCC',
    },
    initial: { fontFamily: 'OutfitSemiBold', fontSize: 26, color: '#24463B' },
    clue: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 14,
      backgroundColor: C.paper,
      borderRadius: 12,
      padding: 12,
    },
    landmark: { alignItems: 'center', gap: 5, padding: 7, flexShrink: 1 },
  });
}
