import React, { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, StyleSheet, Text, View } from 'react-native';
import { Check, Compass, RotateCcw, Stamp, Volume2 } from 'lucide-react-native';
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
import { Button, Heading, Label } from '../ui';
import { QuestBuddy } from '../QuestBuddy';
import {
  JournalArt,
  JournalLeaf,
  JournalStamp,
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
import { drillFeedback, introductionFeedback } from './speakingFeedback';

function Phrase({ en, es, play }: { en: string; es: string; play: (phrase: string) => void }) {
  const s = useStyles();
  return (
    <JournalLeaf testID="travel-reference-phrase" style={s.phrase}>
      <PaperGrain opacity={0.18} />
      <Text accessibilityLanguage="en-US" style={s.phraseEnglish}>
        {en}
      </Text>
      <Text style={s.phraseSpanish}>{es}</Text>
      <Button variant="secondary" icon={Volume2} onPress={() => play(en)} style={s.listen}>
        Escuchar frase
      </Button>
    </JournalLeaf>
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
          <JournalLeaf style={[s.speakerCard, opening && s.overlappingSpeaker]}>
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
              <JournalStamp source={placeIllustration(mission.place)} size={46} />
            </View>
            <Label style={s.storyText}>{step.text}</Label>
          </JournalLeaf>
        </View>
      )}
      {step.line && <Phrase {...step.line} play={play} />}
      {opening && !step.line && (
        <JournalLeaf compact kind="notebook" style={s.missionBrief}>
          <Compass color={C.teal} size={23} />
          <View style={{ flex: 1 }}>
            <Text style={s.missionBriefTitle}>Tu misión</Text>
            <Label style={s.storyText}>{mission.objective}</Label>
          </View>
        </JournalLeaf>
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
  onReview,
}: {
  initial: TravelCheckpoint;
  onUpdate: (travel: TravelState) => void;
  onClose: () => void;
  onPassport: () => void;
  onVoiceSettings: () => void;
  onReview?: (missionId: string) => void;
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
  const referenceAudio = current.finished
    ? undefined
    : (word?.term ??
      (step.type === 'dialogue'
        ? step.line?.en
        : step.type === 'exercise'
          ? step.audio
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
  async function close(exit = onClose) {
    if (actionInFlight.current) return;
    await writes.current;
    if (!current.finished && JSON.stringify(answer) !== JSON.stringify(savedDraft.current)) {
      draft(answer);
      await writes.current;
      if (JSON.stringify(answer) !== JSON.stringify(savedDraft.current)) return;
    }
    if (current.finished && !(await act({ action: 'dismiss', token: current.token }))) return;
    stop();
    exit();
  }
  const advance = () => void act({ action: 'advance', token: current.token });
  const review = onReview ? () => void close(() => onReview(mission.id)) : undefined;
  const lastStep = current.step === mission.steps.length - 1;
  const footer = current.finished ? (
    <Action
      journal
      busy={busy}
      onPress={() => void close(mission.id === 'bag' ? onPassport : onClose)}
    >
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
          {current.result.correct || current.result.communicationOnly
            ? 'Seguir la historia'
            : 'Usar la respuesta de QuestBuddy'}
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
      {lastStep
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
      eyebrow={`${mission.place} · ${mission.minutes.join('–')} min`}
      stepKey={`${current.token}-${wordIndex}`}
      onClose={() => void close()}
      journal={{
        onListen: referenceAudio
          ? () => void play(referenceAudio, step.type === 'exercise')
          : undefined,
      }}
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
          <View style={{ gap: 8 }}>
            <AnswerFeedback
              result={current.result}
              exercise={step.exercise}
              answer={current.answer}
            />
            {review && !current.result.correct && !current.result.communicationOnly && (
              <Button variant="ghost" icon={RotateCcw} disabled={busy} onPress={review}>
                Repasar en otra escena
              </Button>
            )}
          </View>
        ) : null
      }
    >
      {error && <ErrorCard message={error} />}
      {returning && (
        <JournalLeaf compact kind="notebook" style={s.recap}>
          <Compass size={19} color={C.teal} />
          <Label style={{ flex: 1 }}>Retomamos donde lo dejaste. {mission.objective}</Label>
        </JournalLeaf>
      )}
      <View
        key={current.token}
        nativeID={`travel-step-id-${step.id}`}
        testID={`travel-step-${step.type}`}
        style={{ gap: 14 }}
      >
        {current.finished ? (
          <JournalSpread
            source={
              mission.id === 'bag' ? illustrations.passport : placeIllustration(mission.place)
            }
            title="¡Misión completada!"
            detail={mission.success}
          >
            <Celebration size={64}>
              <JournalLeaf compact kind="stamp" style={s.completionSeal}>
                {mission.id === 'bag' ? (
                  <Stamp size={28} color={C.teal} />
                ) : (
                  <Check size={28} color={C.teal} />
                )}
              </JournalLeaf>
            </Celebration>
            {mission.id === 'bag' && (
              <Label style={[s.storyText, s.completionText]}>
                Sello obtenido · {chapter.stamp}
              </Label>
            )}
            {review && (
              <Button variant="secondary" icon={RotateCcw} disabled={busy} onPress={review}>
                Hacer un repaso
              </Button>
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
            {!!step.visual && (
              <JournalArt source={placeIllustration(mission.place)} aspectRatio={2.8} />
            )}
            {!!step.audio && <JournalArt source={illustrations.review} aspectRatio={3.1} taped />}
            <View testID="travel-workbook">
              <Notebook
                title={
                  step.audio
                    ? 'Escucha el mensaje'
                    : step.exercise.passage
                      ? 'Lee el mensaje'
                      : 'Ahora te toca a ti'
                }
              >
                <Label style={s.storyText}>{step.situation}</Label>
                {!!step.visual && (
                  <Label style={f.quiet}>
                    {step.visualDescription ??
                      (step.visual === 'directions'
                        ? 'La parada está junto al parque.'
                        : 'En el mostrador hay una mochila azul y una mochila roja.')}
                  </Label>
                )}

                {step.audio && (
                  <JournalLeaf compact kind="notebook" style={s.audioClue}>
                    <Button
                      variant="secondary"
                      icon={Volume2}
                      onPress={() => void play(step.audio!, true)}
                    >
                      {step.listeningButton ?? 'Escuchar a Sam'}
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
                  </JournalLeaf>
                )}
                <ExerciseInput
                  journal
                  exercise={step.exercise}
                  kindLabel={step.audio ? 'Comprensión auditiva' : undefined}
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
              onDone={(practice) => {
                if (practice) void act({ action: 'speak', token: current.token, practice });
                else advance();
              }}
              onPlay={() => void play(step.phrase, true)}
              onStopReference={stop}
              story={{
                fallback: step.fallback,
                continueLabel: lastStep ? 'Completar misión' : 'Seguir la historia',
                saving: busy,
              }}
              feedback={
                step.learning.conceptId === 'introduction'
                  ? introductionFeedback
                  : (transcript) => drillFeedback(transcript, step.phrase)
              }
            />
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
      borderRadius: 20,
      gap: 2,
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
