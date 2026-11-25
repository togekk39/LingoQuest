import React, { useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { Check, Compass, RotateCcw, Stamp, Volume2 } from 'lucide-react-native';
import {
  chapter as homeChapter,
  travelStepVocabulary,
  travelStoryReply,
  type TravelChapter,
  type TravelCheckpoint,
  type TravelMission,
  type TravelOperation,
  type TravelState,
} from '@lingoquest/offline-engine';
import { api } from '../lib/api';
import {
  Action,
  ErrorCard,
  FlowFrame,
  InputViewportContext,
  useFeatureStyles,
} from '../features/FeatureUI';
import { ExerciseInput, hasAnswer, type ExerciseAnswer } from '../features/ExerciseInput';
import { AnswerFeedback } from '../features/LessonStages';
import { SpeakingPanel, type SpeakingPanelHandle } from '../features/SpeakingPractice';
import { Button, Heading, Label, ProgressBar } from '../ui';
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
import {
  GrammarWorkbench,
  PrerequisiteNotice,
  TravelScene,
  VocabularyCard,
} from './TravelAppearance';
import {
  StoryActivity,
  StoryPhrase,
  StorySpeaker,
  type StoryTranslation,
} from './StoryDialogueAppearance';
import {
  drillFeedback,
  introductionFeedback,
  matchesPersonalIntroduction,
} from './speakingFeedback';

const english = Platform.OS === 'web' ? { lang: 'en-US' } : { accessibilityLanguage: 'en-US' };

function Phrase({ en, es, play }: { en: string; es: string; play: (phrase: string) => void }) {
  const s = useStyles();
  return (
    <JournalLeaf testID="travel-reference-phrase" style={s.phrase}>
      <PaperGrain opacity={0.18} />
      <Text {...english} style={s.phraseEnglish}>
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
  portrait,
}: {
  mission: TravelMission;
  step: Extract<TravelMission['steps'][number], { type: 'dialogue' }>;
  opening: boolean;
  play: (phrase: string) => void;
  portrait?: ImageSourcePropType;
}) {
  const s = useStyles();
  const { colors: C } = useTheme();
  const plaza = mission.id === 'hello';
  const sam = step.speaker === 'Sam';
  const luz = step.speaker === 'Luz';
  const buddy = step.speaker === 'QuestBuddy';
  const samPostcard = plaza && sam;
  const avatar = portrait ?? (sam ? illustrations.sam : luz ? illustrations.luz : undefined);
  const role = sam
    ? 'Viajero'
    : luz
      ? 'Mesa de bienvenida'
      : buddy
        ? 'Tu compañero de viaje'
        : undefined;
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
              {avatar ? (
                <Image source={avatar} accessible={false} style={s.avatar} />
              ) : buddy ? (
                <QuestBuddy size={54} />
              ) : null}
              <View style={{ flex: 1 }}>
                <Heading style={{ fontSize: 25 }}>{step.speaker}</Heading>
                {role && <Label>{role}</Label>}
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

export type TravelFlowHandle = {
  suspend: () => Promise<boolean>;
};

export function travelStoryCue(mission: TravelMission, checkpoint: TravelCheckpoint) {
  const step = mission.steps[checkpoint.step];
  if (checkpoint.finished || !step) return;
  if (step.type === 'dialogue') return { speaker: step.speaker };
  const word = step.type === 'teach' && travelStepVocabulary(mission, step)[checkpoint.word ?? 0];
  const prompt = word ? word.storyPrompt : step.storyPrompt;
  return {
    speaker: prompt?.speaker ?? (step.type === 'teach' ? step.speaker : undefined),
    text: prompt?.text,
  };
}

export function TravelFlow({
  chapter = homeChapter,
  portraits,
  sceneImage,
  initial,
  playerName,
  onEditName,
  onUpdate,
  onClose,
  onPassport,
  onVoiceSettings,
  onReview,
  embedded,
  ref,
}: {
  chapter?: TravelChapter;
  portraits?: Readonly<Record<string, ImageSourcePropType>>;
  sceneImage?: ImageSourcePropType;
  initial: TravelCheckpoint;
  playerName?: string;
  onEditName: () => void;
  onUpdate: (travel: TravelState) => void;
  onClose: () => void;
  onPassport: () => void;
  onVoiceSettings: () => void;
  onReview?: (missionId: string) => void;
  embedded?: StoryTranslation & { entryStepId?: string };
  ref?: React.Ref<TravelFlowHandle>;
}) {
  const [current, setCurrent] = useState(initial);
  const [answer, setAnswer] = useState<ExerciseAnswer>(initial.answer);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [returning, setReturning] = useState(
    !initial.finished && initial.step > 0 && initial.stepId !== embedded?.entryStepId,
  );
  const { colors: C } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();
  const actionInFlight = useRef(false);
  const writes = useRef(Promise.resolve());
  const latestDraft = useRef(initial.answer);
  const savedDraft = useRef(initial.answer);
  const mission: TravelMission = chapter.missions.find((m) => m.id === current.missionId)!;
  const step = mission.steps[current.step];
  const instruction = current.prerequisiteInstruction;
  const prerequisiteUnavailable = current.prerequisiteUnavailable;
  const prerequisiteBlocked = !!(instruction || prerequisiteUnavailable);
  const inline = !!embedded;
  const travelPath =
    chapter.id === 'home'
      ? inline
        ? '/v1/travel?source=story'
        : '/v1/travel'
      : `/v1/travel?chapter=${encodeURIComponent(chapter.id)}&source=${inline ? 'story' : 'study'}`;
  const briefing = inline && step.type === 'teach' && step.presentation === 'reply-briefing';
  const requiredReply =
    step.type === 'exercise' && (step.requiredReply || step.response === 'personal-introduction');
  const selfCheck = step.type === 'exercise' && !!step.exercise.ungradable;
  const cue = inline ? travelStoryCue(mission, current) : undefined;
  const speaker = cue?.speaker;
  const storyPrompt = cue?.text;
  const personalResponse =
    (step.type === 'exercise' || step.type === 'speak') &&
    step.response === 'personal-introduction';
  const personalSpelling = step.type === 'exercise' && step.response === 'personal-spelling';
  const nameTile = step.id === 'travel_hello_build';
  const tokenLabel =
    nameTile && playerName
      ? (token: string) => (token === '[tu nombre]' ? playerName : token)
      : undefined;
  const responseContext = (personalResponse || personalSpelling || nameTile) && (
    <View style={{ gap: 3 }}>
      <Text style={f.eyebrow}>Tu respuesta</Text>
      {!!playerName && !personalSpelling && <Label style={f.quiet}>Tu nombre: {playerName}</Label>}
      <Button
        variant="ghost"
        disabled={busy}
        onPress={() => {
          stop();
          onEditName();
        }}
        style={{ alignSelf: 'flex-start' }}
      >
        {playerName ? 'Cambiar mi nombre' : 'Escribir mi nombre'}
      </Button>
    </View>
  );
  const Section = inline ? StoryActivity : Notebook;
  const { play, playSequence, stop, speechMessage } = useChapterAudio(
    chapter.id,
    mission.authoredAudio,
  );
  const wordIndex = current.word ?? 0;
  const vocabulary = step.type === 'teach' ? travelStepVocabulary(mission, step) : [];
  const word = current.finished ? undefined : vocabulary[wordIndex];
  const translationKey = `${current.token}:${wordIndex}`;
  const lastTranslation = useRef('');
  const markTranslationShown = () => {
    lastTranslation.current = translationKey;
  };
  const translationShown = () =>
    lastTranslation.current === translationKey ||
    (!!mission.optional && step.type === 'teach') ||
    (embedded?.translationsVisible ?? (step.type === 'dialogue' || !!word));
  function toggleTeachingTranslation() {
    if (!embedded) return;
    if (!embedded.translationsVisible) markTranslationShown();
    embedded.onToggleTranslation();
  }
  const speakingText =
    step.type === 'speak'
      ? personalResponse && playerName
        ? `${step.phrase} ${playerName}.`
        : step.phrase
      : '';
  const speakingTemplate = personalResponse && !playerName;
  const openSpeech =
    step.type === 'speak' &&
    !step.response &&
    !step.acceptedPhrases?.length &&
    !step.learning.guided;
  const storyReply =
    step.type === 'exercise' && (embedded || step.storyReplies)
      ? travelStoryReply(step, current)
      : undefined;
  const line = !current.finished && step.type === 'dialogue' ? step.line : storyReply?.line;
  const referenceAudio =
    word?.term ??
    line?.en ??
    (!current.finished && !prerequisiteBlocked && step.type === 'exercise'
      ? step.audio
      : undefined);
  const activity = useRef<View>(null);
  const feedbackView = useRef<View>(null);
  const speaking = useRef<SpeakingPanelHandle>(null);
  const { revealItem } = useContext(InputViewportContext);
  const hasFeedback = !!current.result;
  useEffect(() => {
    const text = word?.term ?? line?.en;
    if (text) void play(text, inline);
  }, [inline, line, play, word]);
  useEffect(() => {
    if (embedded?.translationsVisible && (step.type === 'teach' || step.type === 'dialogue'))
      lastTranslation.current = translationKey;
  }, [embedded?.translationsVisible, step.type, translationKey]);
  useEffect(() => {
    if (!inline) return;
    const target = hasFeedback ? feedbackView : activity;
    const frame = requestAnimationFrame(() => {
      const view = target.current;
      if (view) revealItem(view, () => target.current === view);
    });
    return () => cancelAnimationFrame(frame);
  }, [current.token, hasFeedback, inline, prerequisiteBlocked, revealItem, wordIndex]);

  function draft(next: ExerciseAnswer) {
    if (actionInFlight.current) return;
    latestDraft.current = next;
    setAnswer(next);
    saveDraft(next);
  }

  function saveDraft(next: ExerciseAnswer) {
    const token = current.token;
    writes.current = writes.current
      .then(() =>
        api<TravelState>(travelPath, {
          action: 'draft',
          token,
          answer: next,
        } satisfies TravelOperation),
      )
      .then((travel) => {
        if (travel.active?.token === token && !travel.active.result) {
          savedDraft.current = travel.active.answer;
          setError('');
        }
      })
      .catch((e) => setError(e.message));
    return writes.current;
  }

  async function flushDraft() {
    await writes.current;
    const unsaved = () =>
      JSON.stringify(latestDraft.current) !== JSON.stringify(savedDraft.current);
    if (!current.finished && unsaved()) await saveDraft(latestDraft.current);
    return current.finished || !unsaved();
  }

  async function act(operation: TravelOperation) {
    if (actionInFlight.current) return false;
    actionInFlight.current = true;
    setBusy(true);
    setReturning(false);
    setError('');
    try {
      if (!(await flushDraft())) return false;
      const travel = await api<TravelState>(travelPath, operation);
      onUpdate(travel);
      if (travel.active) {
        if (travel.active.token !== current.token || travel.active.word !== current.word) stop();
        setCurrent(travel.active);
        setAnswer(travel.active.answer);
        latestDraft.current = travel.active.answer;
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

  async function suspend() {
    if (actionInFlight.current) return false;
    actionInFlight.current = true;
    setBusy(true);
    try {
      if (speaking.current) speaking.current.stop();
      else stop();
      Keyboard.dismiss();
      return await flushDraft();
    } finally {
      actionInFlight.current = false;
      setBusy(false);
    }
  }

  useImperativeHandle(ref, () => ({ suspend }));

  async function close(exit = onClose) {
    if (!(await suspend())) return;
    if (!inline && current.finished && !(await act({ action: 'dismiss', token: current.token })))
      return;
    exit();
  }
  const advance = () =>
    void act({
      action: 'advance',
      token: current.token,
      translationShown: translationShown(),
    });
  function listenExercise(audio: string) {
    void play(audio, true, () => {
      if (!current.audioPlayed && !current.result)
        void act({ action: 'listened', token: current.token });
    });
  }
  const review = onReview ? () => void close(() => onReview(mission.id)) : undefined;
  const lastStep = current.step === mission.steps.length - 1;
  const canSubmit =
    !prerequisiteBlocked &&
    step.type === 'exercise' &&
    (!personalSpelling || !!playerName) &&
    (!mission.authoredAudio || !step.audio || current.audioPlayed || current.transcript) &&
    hasAnswer(answer, step.exercise);
  function submitAnswer() {
    if (!canSubmit || current.finished || current.result || actionInFlight.current) return;
    Keyboard.dismiss();
    void act({ action: 'answer', token: current.token, answer: latestDraft.current });
  }
  const footer = current.finished ? (
    <Action
      journal
      busy={busy}
      onPress={() => void close(mission.id === 'bag' ? onPassport : onClose)}
    >
      {mission.id === 'bag' ? 'Abrir pasaporte' : 'Volver al viaje'}
    </Action>
  ) : prerequisiteBlocked ? (
    <Action
      journal
      busy={busy}
      onPress={
        instruction
          ? () => void act({ action: 'prepare', token: current.token })
          : () => void close()
      }
    >
      {instruction
        ? 'Practicar con esta explicación'
        : inline
          ? 'Volver a la escena'
          : 'Volver al viaje'}
    </Action>
  ) : step.type === 'exercise' ? (
    current.result ? (
      <View style={{ gap: 8 }}>
        {!current.result.correct && !selfCheck && (
          <Action
            journal
            secondary
            disabled={busy}
            onPress={() => void act({ action: 'retry', token: current.token })}
          >
            Intentar otra vez
          </Action>
        )}
        {!current.result.identityMismatch &&
          (!requiredReply || current.result.correct || current.result.communicationOnly) && (
            <Action journal busy={busy} onPress={advance} style={inline && s.storyAction}>
              {current.result.correct || current.result.communicationOnly || selfCheck
                ? 'Seguir la historia'
                : 'Usar la respuesta de QuestBuddy'}
            </Action>
          )}
      </View>
    ) : (
      <Action
        journal
        busy={busy}
        disabled={!canSubmit}
        style={inline && [s.storyAction, !canSubmit && s.inactiveStoryAction]}
        onPress={submitAnswer}
      >
        {selfCheck ? 'Revisar mi respuesta' : 'Comprobar respuesta'}
      </Action>
    )
  ) : word ? (
    <Action
      journal
      busy={busy}
      style={inline && s.storyAction}
      onPress={() =>
        void act({
          action: 'word',
          token: current.token,
          position: wordIndex + 1,
          translationShown: translationShown(),
        })
      }
    >
      {wordIndex + 1 < vocabulary.length ? 'Siguiente palabra' : 'Ver la explicación'}
    </Action>
  ) : step.type !== 'speak' ? (
    <Action journal busy={busy} onPress={advance} style={inline && s.storyAction}>
      {lastStep
        ? 'Completar misión'
        : briefing
          ? chapter.id === 'home'
            ? 'Escuchar a Sam'
            : 'Escuchar la conversación'
          : step.type === 'teach'
            ? 'Probar en la historia'
            : 'Continuar'}
    </Action>
  ) : undefined;

  const inlineAdvance = current.finished || step.type === 'dialogue';
  const progress = current.finished ? 1 : (current.step + 1) / mission.steps.length;
  const feedback = !prerequisiteBlocked && step.type === 'exercise' && current.result && (
    <View ref={feedbackView} collapsable={false} style={{ gap: 8 }}>
      <AnswerFeedback
        result={
          selfCheck
            ? { ...current.result, acceptedAnswer: step.exercise.acceptedAnswers[0] }
            : tokenLabel
              ? {
                  ...current.result,
                  acceptedAnswer: current.result.acceptedAnswer?.replace(
                    '[tu nombre]',
                    () => playerName!,
                  ),
                }
              : current.result
        }
        exercise={step.exercise}
        selfCheck={selfCheck}
        answer={
          tokenLabel
            ? { ...current.answer, tokens: current.answer.tokens?.map(tokenLabel) }
            : current.answer
        }
      />
      {storyReply && (
        <View testID="travel-story-reply" style={s.dialogue}>
          <StorySpeaker name={storyReply.speaker} portrait={portraits?.[storyReply.speaker]} />
          {embedded ? (
            <StoryPhrase
              line={storyReply.line}
              showTranslation={embedded.translationsVisible}
              onToggleTranslation={embedded.onToggleTranslation}
              onListen={() => void play(storyReply.line.en, true)}
              disabled={busy}
            />
          ) : (
            <Phrase {...storyReply.line} play={(text) => void play(text)} />
          )}
        </View>
      )}
      {review &&
        !selfCheck &&
        !current.result.correct &&
        !current.result.identityMismatch &&
        !current.result.communicationOnly && (
          <Button variant="ghost" icon={RotateCcw} disabled={busy} onPress={review}>
            Repasar en otra escena
          </Button>
        )}
    </View>
  );
  const content = (
    <>
      {error && <ErrorCard message={error} />}
      {inline && !current.finished && (
        <View ref={activity} collapsable={false}>
          {!prerequisiteBlocked && speaker && (
            <StorySpeaker name={speaker} portrait={portraits?.[speaker]}>
              {storyPrompt && <Label style={s.storyText}>{storyPrompt}</Label>}
            </StorySpeaker>
          )}
          <ProgressBar
            value={progress}
            accessibilityLabel={`Paso ${current.step + 1} de ${mission.steps.length}`}
            color={C.accent}
            height={3}
          />
        </View>
      )}
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
              sceneImage ??
              (mission.id === 'bag' ? illustrations.passport : placeIllustration(mission.place))
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
        ) : prerequisiteBlocked ? (
          <PrerequisiteNotice
            instruction={instruction}
            inline={inline}
            updateRequired={current.prerequisiteUpdateRequired}
          />
        ) : step.type === 'dialogue' ? (
          embedded ? (
            <View testID="travel-dialogue-postcard" style={s.dialogue}>
              <Label style={s.storyText}>{step.text}</Label>
              {step.line && (
                <StoryPhrase
                  line={step.line}
                  showTranslation={embedded.translationsVisible}
                  onToggleTranslation={toggleTeachingTranslation}
                  onListen={() => void play(step.line!.en, true)}
                  disabled={busy}
                  testID="travel-reference-phrase"
                />
              )}
            </View>
          ) : (
            <DialoguePostcard
              mission={mission}
              step={step}
              opening={current.step === 0}
              play={play}
              portrait={portraits?.[step.speaker]}
            />
          )
        ) : word && embedded && storyPrompt && chapter.id === 'home' ? (
          <>
            <Button variant="secondary" icon={Volume2} onPress={() => void play(word.term, true)}>
              Escuchar: {word.term}
            </Button>
            <StoryPhrase
              line={word.example}
              showTranslation={embedded.translationsVisible}
              onToggleTranslation={toggleTeachingTranslation}
              onListen={() => void play(word.example.en, true)}
              disabled={busy}
              testID="travel-reference-phrase"
            />
          </>
        ) : word ? (
          <>
            <View style={s.chapterHead}>
              <Heading style={{ flex: 1, fontSize: 26 }}>Palabras del viaje</Heading>
              <Label>
                {wordIndex + 1} / {vocabulary.length}
              </Label>
            </View>
            <VocabularyCard
              key={word.term}
              word={word}
              play={(phrase) => void play(phrase, inline)}
              recall={chapter.id === 'home' && (!inline || mission.id !== 'hello')}
              inline={inline}
            />
          </>
        ) : step.type === 'teach' ? (
          <GrammarWorkbench
            step={step}
            play={(phrase) => void play(phrase, inline)}
            playSequence={playSequence}
            stop={stop}
            embedded={embedded}
            onTranslationShown={markTranslationShown}
            showExplanation={chapter.id !== 'home' || mission.optional ? true : undefined}
            showAll={chapter.id !== 'home' || mission.optional}
            showBilingual={mission.optional}
          />
        ) : step.type === 'exercise' ? (
          <>
            {!!step.visual && (
              <JournalArt
                source={sceneImage ?? placeIllustration(mission.place)}
                aspectRatio={2.8}
              />
            )}
            {!!step.audio && !inline && (
              <JournalArt source={illustrations.review} aspectRatio={3.1} taped />
            )}
            <View testID="travel-workbook">
              <Section
                title={
                  step.activityTitle ??
                  (step.audio
                    ? 'Escucha el mensaje'
                    : step.exercise.passage
                      ? 'Lee el mensaje'
                      : 'Ahora te toca a ti')
                }
              >
                {(!storyPrompt || chapter.id !== 'home') && (
                  <Label style={s.storyText}>{step.situation}</Label>
                )}
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
                      onPress={() => listenExercise(step.audio!)}
                    >
                      {step.listeningButton ??
                        (chapter.id === 'home' ? 'Escuchar a Sam' : 'Escuchar el mensaje')}
                    </Button>
                    {current.transcript || current.result ? (
                      <Text {...english} style={f.body}>
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
                {responseContext}
                <ExerciseInput
                  journal
                  inline={inline}
                  exercise={step.exercise}
                  tokenLabel={tokenLabel}
                  kindLabel={step.audio ? 'Comprensión auditiva' : undefined}
                  answer={answer}
                  setAnswer={draft}
                  onSubmit={submitAnswer}
                  disabled={busy || !!current.result}
                />
                {current.canSkipKnown && !current.result && (
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onPress={() => void act({ action: 'skipKnown', token: current.token })}
                  >
                    Omitir esta práctica que ya demostré
                  </Button>
                )}
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
              </Section>
            </View>
          </>
        ) : (
          <>
            {(!storyPrompt || chapter.id !== 'home') && (
              <Label style={s.storyText}>{step.text}</Label>
            )}
            {responseContext}
            <SpeakingPanel
              ref={speaking}
              inline={inline}
              text={speakingText}
              chapterId={chapter.id}
              selfCheck={step.speech?.selfCheck ?? openSpeech}
              allowSystemRecognition={
                step.speech ? !!step.speech.allowSystemRecognition : openSpeech || undefined
              }
              authoredAudio={mission.authoredAudio}
              evidenceScope={{
                source: inline ? 'story' : 'study',
                materialId: mission.id,
                itemId: step.id,
              }}
              displayText={speakingTemplate ? `${speakingText} [tu nombre].` : undefined}
              onDone={(practice) => {
                if (practice) void act({ action: 'speak', token: current.token, practice });
                else advance();
              }}
              onPlay={() => void play(speakingText, true)}
              onStopReference={stop}
              acceptedPhrases={step.acceptedPhrases}
              exampleLabel={step.exampleLabel}
              matchesTranscript={
                personalResponse
                  ? (text) => matchesPersonalIntroduction(text, playerName)
                  : undefined
              }
              story={{
                continueLabel:
                  personalResponse && inline
                    ? 'Responder a Sam'
                    : lastStep
                      ? 'Completar misión'
                      : 'Seguir la historia',
                saving: busy,
              }}
              feedback={
                step.learning.conceptId === 'introduction'
                  ? (transcript) => introductionFeedback(transcript, playerName)
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
      {inline && feedback}
      {(inline || inlineAdvance) && footer}
    </>
  );

  if (inline)
    return (
      <View testID="story-learning" style={s.lesson}>
        {content}
      </View>
    );

  return (
    <FlowFrame
      title={mission.title}
      eyebrow={`${mission.place} · ${mission.minutes.join('–')} min`}
      stepKey={`${current.token}-${wordIndex}`}
      onClose={() => void close()}
      journal={{
        onListen: referenceAudio
          ? () =>
              step.type === 'exercise' ? listenExercise(referenceAudio) : void play(referenceAudio)
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
      progress={progress}
      footer={inlineAdvance ? undefined : footer}
      feedback={feedback}
    >
      {content}
    </FlowFrame>
  );
}
function useStyles() {
  const { colors: C, mode } = useTheme();
  return StyleSheet.create({
    lesson: { gap: 12 },
    storyAction: { backgroundColor: mode === 'light' ? C.ink : C.primary },
    inactiveStoryAction: { opacity: 0.54 },
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
