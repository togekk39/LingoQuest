import React, { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Check, Compass, Stamp, Volume2 } from 'lucide-react-native';
import {
  chapter,
  type TravelCheckpoint,
  type TravelMission,
  type TravelOperation,
  type TravelState,
} from '@lingoquest/offline-engine';
import samPortrait from '../../assets/journal/sam.jpg';
import { api } from '../lib/api';
import { Action, ErrorCard, FlowFrame, useFeatureStyles } from '../features/FeatureUI';
import { ExerciseInput, hasAnswer, type ExerciseAnswer } from '../features/ExerciseInput';
import { AnswerFeedback } from '../features/LessonStages';
import { SpeakingPanel } from '../features/SpeakingPractice';
import { Button, Card, Heading, Label } from '../ui';
import { QuestBuddy } from '../QuestBuddy';
import {
  JournalArt,
  JournalSpread,
  Notebook,
  PaperGrain,
  PlazaPhoto,
  PlazaPostcard,
} from '../Journal';
import { useTheme } from '../theme';
import { Celebration } from '../motion';
import { useChapterAudio } from './useChapterAudio';
import { illustrations, placeIllustration } from './illustrations';
import { GrammarWorkbench, TravelScene, VocabularyCard } from './TravelAppearance';

function Phrase({ en, es, play }: { en: string; es: string; play: (phrase: string) => void }) {
  const s = useStyles();
  return (
    <View testID="travel-reference-phrase" style={s.phrase}>
      <PaperGrain opacity={0.18} />
      <Text accessibilityLanguage="en-US" style={s.phraseEnglish}>
        {en}
      </Text>
      <Text style={s.phraseSpanish}>{es}</Text>
      <Button variant="secondary" icon={Volume2} onPress={() => play(en)} style={s.listen}>
        Escuchar frase
      </Button>
    </View>
  );
}

function DialoguePostcard({
  mission,
  step,
  opening,
  play,
}: {
  mission: TravelMission;
  step: Extract<TravelMission['steps'][number], { type: 'dialogue' }>;
  opening: boolean;
  play: (phrase: string) => void;
}) {
  const s = useStyles();
  const { colors: C } = useTheme();
  const plaza = mission.id === 'hello';
  const sam = step.speaker === 'Sam';
  const samPostcard = plaza && sam;
  return (
    <View testID="travel-dialogue-postcard" style={s.dialogue}>
      {samPostcard ? (
        <PlazaPostcard />
      ) : (
        <View>
          {opening && (plaza ? <PlazaPhoto /> : <TravelScene place={mission.place} />)}
          <Card style={[s.speakerCard, opening && s.overlappingSpeaker]}>
            <PaperGrain opacity={0.18} />
            <View style={s.speakerRow}>
              {sam ? (
                <Image source={samPortrait} accessible={false} style={s.avatar} />
              ) : step.speaker === 'QuestBuddy' ? (
                <QuestBuddy size={54} />
              ) : (
                <Image source={illustrations.luz} accessible={false} style={s.avatar} />
              )}
              <View style={{ flex: 1 }}>
                <Heading style={{ fontSize: 25 }}>{step.speaker}</Heading>
                <Label>
                  {step.speaker === 'Luz'
                    ? 'Mesa de bienvenida'
                    : sam
                      ? 'Viajero'
                      : 'Tu compañero de viaje'}
                </Label>
              </View>
              <Stamp color={C.accent} size={24} />
            </View>
            <Label style={s.storyText}>{step.text}</Label>
          </Card>
        </View>
      )}
      {step.line && <Phrase {...step.line} play={play} />}
      {opening && !step.line && (
        <View style={s.missionBrief}>
          <Compass color={C.teal} size={23} />
          <View style={{ flex: 1 }}>
            <Text style={s.missionBriefTitle}>Tu misión</Text>
            <Label style={s.storyText}>{mission.objective}</Label>
          </View>
        </View>
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
  const greetingExample =
    !current.finished && step.type === 'exercise' && mission.id === 'hello'
      ? mission.vocabulary[0]?.example
      : undefined;
  const referenceAudio = current.finished
    ? undefined
    : (word?.term ??
      (step.type === 'dialogue'
        ? step.line?.en
        : step.type === 'exercise'
          ? (step.audio ?? greetingExample?.en)
          : undefined));
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

  const inlineAdvance = current.finished || step.type === 'dialogue';
  return (
    <FlowFrame
      title={mission.title}
      eyebrow={`${mission.place} · ${mission.minutes} min`}
      stepKey={`${current.token}-${wordIndex}`}
      onClose={() => void close()}
      journal={{ onListen: referenceAudio ? () => void play(referenceAudio) : undefined }}
      onVoiceSettings={
        step.type !== 'speak'
          ? () => {
              stop();
              onVoiceSettings();
            }
          : undefined
      }
      progress={current.finished ? 1 : (current.step + 1) / mission.steps.length}
      footer={inlineAdvance ? undefined : footer}
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
          <JournalSpread
            source={
              mission.id === 'bag' ? illustrations.passport : placeIllustration(mission.place)
            }
            title="¡Misión completada!"
            detail={mission.success}
          >
            <Celebration size={64}>
              <View style={s.completionSeal}>
                {mission.id === 'bag' ? (
                  <Stamp size={28} color={C.teal} />
                ) : (
                  <Check size={28} color={C.teal} />
                )}
              </View>
            </Celebration>
            {mission.id === 'bag' && (
              <Label style={[s.storyText, s.completionText]}>
                Sello obtenido · {chapter.stamp}
              </Label>
            )}
          </JournalSpread>
        ) : step.type === 'dialogue' ? (
          <DialoguePostcard
            mission={mission}
            step={step}
            opening={current.step === 0}
            play={play}
          />
        ) : word ? (
          <>
            <View style={s.chapterHead}>
              <Heading style={{ flex: 1, fontSize: 26 }}>Palabras del viaje</Heading>
              <Label>
                {wordIndex + 1} / {mission.vocabulary.length}
              </Label>
            </View>
            <VocabularyCard key={word.term} word={word} play={play} recall />
          </>
        ) : step.type === 'teach' ? (
          <GrammarWorkbench step={step} play={play} />
        ) : step.type === 'exercise' ? (
          <>
            {greetingExample && <Phrase {...greetingExample} play={play} />}
            {!!step.visual && (
              <JournalArt source={placeIllustration(mission.place)} aspectRatio={2.8} />
            )}
            {!!step.audio && <JournalArt source={illustrations.review} aspectRatio={3.1} taped />}
            <View testID="travel-workbook">
              <Notebook
                title={
                  step.audio
                    ? 'Escucha y decide'
                    : step.exercise.passage
                      ? 'Lee el mensaje'
                      : 'Ahora te toca a ti'
                }
              >
                <Label style={s.storyText}>{step.situation}</Label>
                {!!step.visual && (
                  <Label style={f.quiet}>
                    {step.visual === 'directions'
                      ? 'La parada está junto al parque.'
                      : 'En el mostrador hay una mochila azul y una mochila roja.'}
                  </Label>
                )}

                {step.audio && (
                  <View style={s.audioClue}>
                    <Button
                      variant="secondary"
                      icon={Volume2}
                      onPress={() => void play(step.audio!)}
                    >
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
                <ExerciseInput
                  journal
                  exercise={step.exercise}
                  answer={answer}
                  setAnswer={draft}
                  disabled={busy || !!current.result}
                />
                {step.hint &&
                  !current.result &&
                  (current.hint ? (
                    <Label style={s.storyText}>{step.hint}</Label>
                  ) : (
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onPress={() => void act({ action: 'hint', token: current.token })}
                      style={s.hint}
                    >
                      Pedir una pista
                    </Button>
                  ))}
              </Notebook>
            </View>
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
      {inlineAdvance && footer}
    </FlowFrame>
  );
}
function useStyles() {
  const { colors: C } = useTheme();
  return StyleSheet.create({
    chapterHead: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    dialogue: { gap: 15 },
    speakerCard: { gap: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: C.accent },
    overlappingSpeaker: { marginTop: -10, marginHorizontal: 6 },
    speakerRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    missionBrief: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 15,
      borderTopWidth: 1,
      borderColor: C.line,
    },
    missionBriefTitle: { fontFamily: 'ManropeBold', color: C.teal, fontSize: 13, marginBottom: 3 },
    phrase: {
      padding: 17,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: C.line,
      backgroundColor: C.white,
      overflow: 'hidden',
    },
    phraseEnglish: { fontFamily: 'LoraBold', fontSize: 25, lineHeight: 32, color: C.ink },
    phraseSpanish: { fontFamily: 'Manrope', fontSize: 16, lineHeight: 23, color: C.muted },
    listen: { alignSelf: 'stretch', marginTop: 11 },
    audioClue: { gap: 5, padding: 10, backgroundColor: C.paper, borderRadius: 12 },
    hint: { alignSelf: 'flex-start', paddingHorizontal: 3 },
    completionSeal: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: C.accent,
      backgroundColor: C.mint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completionText: { textAlign: 'center' },
    storyText: { color: C.ink, fontSize: 16, lineHeight: 24 },
    recap: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      borderRadius: 12,
      padding: 12,
      backgroundColor: C.mint,
    },
    avatar: {
      width: 54,
      height: 54,
      borderRadius: 27,
    },
  });
}
