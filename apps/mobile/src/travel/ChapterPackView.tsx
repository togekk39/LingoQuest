import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { BookOpen, Compass, Square, Volume2 } from 'lucide-react-native';
import type { ChapterPack } from '@lingoquest/course-pack';
import {
  canStartTravelMission,
  type TravelChapter,
  type TravelState,
} from '@lingoquest/offline-engine';
import { ErrorCard, FlowFrame, useFeatureStyles } from '../features/FeatureUI';
import { getSpeechPreferences } from '../features/offlineSpeech';
import { JournalLeaf, JournalPostcardFrame } from '../Journal';
import { api, newId } from '../lib/api';
import { getInstalledChapter } from '../lib/chapterPacks';
import { chapterMediaUri } from '../lib/chapterStorage';
import { useTheme } from '../theme';
import { Button, Heading, Label } from '../ui';
import { useClipPlayer } from './useClipPlayer';
import { chapterReaderSections } from './chapterReaderSections';

type SpokenPhrase = { en: string; es: string; speaker?: string };
type PlayPhrase = (phrase: string) => void;
type CardActivity =
  | { stage: 'grammar' | 'practice' }
  | { stage: 'vocabulary'; word: string }
  | { stage: 'question'; selected: number; transcript: boolean; heard: boolean; retry: boolean };
const sectionLayout = { gap: 14 };

export function ChapterPackView({
  chapterId,
  onClose,
  onAdventure,
  adventureError,
  adventureBusy,
  onOpenTextbookUnit,
  onStudyMission,
  onRemoveDownload,
}: {
  chapterId: string;
  onClose: () => void;
  onAdventure?: (pack: ChapterPack) => void;
  adventureError?: string;
  adventureBusy?: boolean;
  onOpenTextbookUnit?: (unitId: string) => void;
  onStudyMission?: (chapter: TravelChapter, missionId: string) => Promise<void>;
  onRemoveDownload?: (chapterId: string) => Promise<void>;
}) {
  const { colors } = useTheme();
  const player = useClipPlayer();
  const playback = useRef<AbortController | null>(null);
  const [content, setContent] = useState<{ pack: ChapterPack; cover?: string }>();
  const [failure, setFailure] = useState('');
  const [audioError, setAudioError] = useState('');
  const [playing, setPlaying] = useState<string>();
  const [reload, setReload] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [study, setStudy] = useState<TravelState>();
  const [studyBusy, setStudyBusy] = useState(false);
  const [studyError, setStudyError] = useState('');
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');

  useEffect(() => {
    let current = true;
    setFailure('');
    setContent(undefined);
    setAudioError('');
    setPlaying(undefined);
    setLessonIndex(0);
    void (async () => {
      try {
        const pack = await getInstalledChapter(chapterId);
        if (!pack) throw new Error('Descarga el capítulo para abrirlo sin conexión.');
        const image = pack.images.cover;
        const cover = await chapterMediaUri(chapterId, image.mimeType, image.dataBase64).catch(
          () => undefined,
        );
        if (current) setContent({ pack, cover });
      } catch (error) {
        if (current) {
          setFailure(
            error instanceof Error ? error.message : 'No pudimos abrir el capítulo descargado.',
          );
        }
      }
    })();
    return () => {
      current = false;
      playback.current?.abort();
    };
  }, [chapterId, reload]);

  async function play(phrase: string) {
    playback.current?.abort();
    player.stop();
    setAudioError('');
    if (playing === phrase) {
      setPlaying(undefined);
      return false;
    }
    const clip = content?.pack.audio[phrase];
    if (!clip) {
      setPlaying(undefined);
      setAudioError('No encontramos el audio de esta frase en el capítulo.');
      return false;
    }
    const controller = new AbortController();
    const { signal } = controller;
    playback.current = controller;
    setPlaying(phrase);
    try {
      const [uri, preferences] = await Promise.all([
        chapterMediaUri(chapterId, clip.mimeType, clip.dataBase64),
        getSpeechPreferences(),
      ]);
      return !signal.aborted && (await player.play(uri, preferences.rate ?? 1, signal));
    } catch {
      if (!signal.aborted) setAudioError('No pudimos reproducir la frase. Inténtalo de nuevo.');
      return false;
    } finally {
      if (playback.current === controller) {
        playback.current = null;
        setPlaying(undefined);
      }
    }
  }

  const pack = content?.pack;
  const travelChapter = pack?.story?.chapter as unknown as TravelChapter | undefined;
  const lessons = pack ? [pack.lesson, ...pack.additionalLessons] : [];
  const lesson = lessons[lessonIndex] ?? pack?.lesson;
  useEffect(() => {
    if (!pack) return;
    void api('/v1/learning/chapter-card', {
      id: `${chapterId}-${pack.revision}-card-${lessonIndex + 1}-grammar`,
      chapterId,
      revision: pack.revision,
      cardNumber: lessonIndex + 1,
      stage: 'grammar',
    }).catch(() => {});
  }, [chapterId, lessonIndex, pack]);

  async function recordActivity(activity: CardActivity, id: string = newId()) {
    if (!pack) return;
    await api('/v1/learning/chapter-card', {
      ...activity,
      id,
      chapterId,
      revision: pack.revision,
      cardNumber: lessonIndex + 1,
    });
  }

  async function openStudy() {
    setStudyBusy(true);
    setStudyError('');
    try {
      setStudy(await api<TravelState>(`/v1/travel?chapter=${encodeURIComponent(chapterId)}`));
    } catch (error) {
      setStudyError((error as Error).message);
    } finally {
      setStudyBusy(false);
    }
  }

  const renderLine = (line: SpokenPhrase, index: number) => (
    <ChapterPhrase
      key={`${index}-${line.en}`}
      phrase={line}
      playing={playing === line.en}
      onPlay={(phrase) => void play(phrase)}
    />
  );
  function switchLesson(index: number) {
    playback.current?.abort();
    player.stop();
    setPlaying(undefined);
    setAudioError('');
    setLessonIndex(index);
  }

  function renderSections(card: ChapterPack['lesson']) {
    const sections = {
      dialogue: card.dialogue.map(renderLine),
      vocabulary: card.vocabulary.map((line) => (
        <ChapterPhrase
          key={line.en}
          phrase={line}
          playing={playing === line.en}
          onPlay={(word) => {
            void play(word);
            void recordActivity({ stage: 'vocabulary', word }).catch(() => {});
          }}
        />
      )),
      grammar: <Label>{card.grammarEs}</Label>,
      question: (
        <ChapterQuestion
          question={card.question}
          listeningPlaying={playing === card.question.listening?.en}
          onPlay={play}
          onSubmit={(answer, id) => recordActivity({ stage: 'question', ...answer }, id)}
        />
      ),
      practice: (
        <>
          <Label>{card.practiceEs}</Label>
          <ChapterPracticeModel
            model={renderLine(card.model, 0)}
            onReveal={() => void recordActivity({ stage: 'practice' }).catch(() => {})}
          />
        </>
      ),
    };
    return chapterReaderSections.map(({ id, heading }) => (
      <JournalLeaf key={`${chapterId}-${lessonIndex}-${id}`} kind="notebook" style={sectionLayout}>
        <Heading style={{ fontSize: 23 }}>{heading}</Heading>
        {sections[id]}
      </JournalLeaf>
    ));
  }

  return (
    <FlowFrame
      title={lesson?.title ?? 'Capítulo descargado'}
      eyebrow="Paquete sin conexión"
      onClose={onClose}
      stepKey={String(lessonIndex)}
      journal={{}}
      footer={
        audioError ? (
          <Text accessibilityRole="alert" style={{ color: colors.red }}>
            {audioError}
          </Text>
        ) : undefined
      }
    >
      {failure ? (
        <ErrorCard message={failure} onRetry={() => setReload((value) => value + 1)} />
      ) : !content || !pack || !lesson ? (
        <ActivityIndicator color={colors.teal} accessibilityLabel="Abriendo capítulo" />
      ) : (
        <View testID={`chapter-lesson-${chapterId}`} style={sectionLayout}>
          {content.cover && (
            <JournalPostcardFrame taped>
              <Image
                testID={`chapter-cover-${chapterId}`}
                accessible
                accessibilityLabel={`Ilustración de ${lesson.title}`}
                accessibilityRole="image"
                resizeMode="cover"
                source={{ uri: content.cover }}
                style={{ width: '100%', aspectRatio: 2.35, borderRadius: 10 }}
              />
            </JournalPostcardFrame>
          )}
          {lessons.length > 1 && (
            <JournalLeaf kind="notebook" style={sectionLayout}>
              <Heading style={{ fontSize: 23 }}>Lecciones del capítulo</Heading>
              {lessons.map((item, index) => (
                <Button
                  key={`${index}-${item.title}`}
                  icon={BookOpen}
                  variant={index === lessonIndex ? 'secondary' : 'ghost'}
                  onPress={() => switchLesson(index)}
                >
                  {item.title}
                </Button>
              ))}
            </JournalLeaf>
          )}
          <Label style={{ fontSize: 17 }}>{lesson.objectiveEs}</Label>
          {pack.story && onAdventure && (
            <>
              <Button
                icon={Compass}
                variant="secondary"
                loading={adventureBusy}
                onPress={() => onAdventure(pack)}
              >
                Explorar aventura de este capítulo
              </Button>
              {!!adventureError && <ErrorCard message={adventureError} />}
            </>
          )}
          {travelChapter && chapterId !== 'home' && onStudyMission && (
            <JournalLeaf kind="notebook" style={sectionLayout}>
              <Button icon={BookOpen} variant="secondary" loading={studyBusy} onPress={openStudy}>
                Practicar las misiones
              </Button>
              {study &&
                travelChapter.missions.map((mission) => (
                  <Button
                    key={mission.id}
                    variant="ghost"
                    disabled={!canStartTravelMission(study, mission.id, travelChapter)}
                    onPress={() => {
                      setStudyError('');
                      void onStudyMission(travelChapter, mission.id).catch((error) =>
                        setStudyError(error.message),
                      );
                    }}
                  >
                    {mission.title}
                  </Button>
                ))}
              {!!studyError && <ErrorCard message={studyError} />}
            </JournalLeaf>
          )}
          {renderSections(lesson)}
          {pack.unit && (
            <ChapterUnit
              key={pack.unit.id}
              unit={pack.unit}
              renderLine={renderLine}
              onOpen={onOpenTextbookUnit}
            />
          )}
          {onRemoveDownload && (
            <JournalLeaf kind="notebook" style={sectionLayout}>
              <Button variant="ghost" onPress={() => setConfirmRemoval(!confirmRemoval)}>
                {confirmRemoval ? 'Cancelar' : 'Quitar descarga'}
              </Button>
              {confirmRemoval && (
                <>
                  <Label>
                    Libera espacio en este dispositivo. Tu progreso y el repaso de texto seguirán
                    disponibles.
                  </Label>
                  <Button
                    variant="danger"
                    loading={removing}
                    onPress={() => {
                      setRemoving(true);
                      setRemoveError('');
                      void onRemoveDownload(chapterId)
                        .catch((error) => setRemoveError(error.message))
                        .finally(() => setRemoving(false));
                    }}
                  >
                    Quitar recursos del dispositivo
                  </Button>
                  {!!removeError && <ErrorCard message={removeError} />}
                </>
              )}
            </JournalLeaf>
          )}
        </View>
      )}
    </FlowFrame>
  );
}

function ChapterPhrase({
  phrase,
  playing,
  onPlay,
}: {
  phrase: SpokenPhrase;
  playing: boolean;
  onPlay: PlayPhrase;
}) {
  const { colors } = useTheme();
  const f = useFeatureStyles();
  const Icon = playing ? Square : Volume2;
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        {!!phrase.speaker && <Text style={f.quiet}>{phrase.speaker}</Text>}
        <Text accessibilityLanguage="en-US" style={f.cardTitle}>
          {phrase.en}
        </Text>
        {!!phrase.es && <Text style={f.quiet}>{phrase.es}</Text>}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? `Detener ${phrase.en}` : `Escuchar ${phrase.en}`}
        onPress={() => onPlay(phrase.en)}
        style={({ pressed }) => [
          {
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
            minWidth: 44,
            padding: 8,
            backgroundColor: colors.mint,
            borderRadius: 12,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Icon size={20} color={colors.teal} />
      </Pressable>
    </View>
  );
}

function ChapterPracticeModel({
  model,
  onReveal,
}: {
  model: React.ReactNode;
  onReveal: () => void;
}) {
  const [showModel, setShowModel] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        onPress={() => {
          if (!showModel) onReveal();
          setShowModel(!showModel);
        }}
      >
        {showModel ? 'Ocultar el modelo' : 'Ver un modelo'}
      </Button>
      {showModel && model}
    </>
  );
}

function ChapterQuestion({
  question,
  listeningPlaying,
  onPlay,
  onSubmit,
}: {
  question: ChapterPack['lesson']['question'];
  listeningPlaying: boolean;
  onPlay: (phrase: string) => Promise<boolean>;
  onSubmit: (
    answer: { selected: number; transcript: boolean; heard: boolean; retry: boolean },
    id: string,
  ) => Promise<void>;
}) {
  const { colors } = useTheme();
  const f = useFeatureStyles();
  const [selected, setSelected] = useState<number>();
  const [submitted, setSubmitted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const attempt = useRef(newId());
  const pending = useRef(false);
  const transcript = useRef(false);
  const heard = useRef(false);
  const tried = useRef(false);
  const correct = selected === question.answerIndex;
  const listening = question.listening;
  async function submit() {
    if (selected === undefined || pending.current || submitted) return;
    pending.current = true;
    setSaving(true);
    setSaveError('');
    try {
      await onSubmit(
        { selected, transcript: transcript.current, heard: heard.current, retry: tried.current },
        attempt.current,
      );
      tried.current = true;
      setSubmitted(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No pudimos guardar tu respuesta.');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  return (
    <>
      <Label>{question.promptEs}</Label>
      {listening && (
        <>
          <Button
            icon={listeningPlaying ? Square : Volume2}
            variant="secondary"
            onPress={() =>
              void onPlay(listening.en).then((played) => {
                if (played) heard.current = true;
              })
            }
          >
            {listeningPlaying ? 'Detener el mensaje' : 'Escuchar el mensaje'}
          </Button>
          <Button
            variant="ghost"
            onPress={() => {
              if (!showTranscript) transcript.current = true;
              setShowTranscript(!showTranscript);
            }}
          >
            {showTranscript ? 'Ocultar la transcripción' : 'Ver la transcripción'}
          </Button>
          {showTranscript && (
            <View style={sectionLayout}>
              <Text accessibilityLanguage="en-US" style={f.cardTitle}>
                {listening.en}
              </Text>
              <Text style={f.quiet}>{listening.es}</Text>
            </View>
          )}
        </>
      )}
      <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
        {question.options.map((option, index) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === index }}
            disabled={saving}
            onPress={() => {
              if (index !== selected) attempt.current = newId();
              setSelected(index);
              setSubmitted(false);
            }}
            style={({ pressed }) => [
              {
                padding: 12,
                borderWidth: 1,
                borderColor: selected === index ? colors.teal : colors.line,
                borderRadius: 10,
                backgroundColor: selected === index ? colors.mint : colors.white,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={f.body}>{option}</Text>
          </Pressable>
        ))}
      </View>
      <Button
        variant="secondary"
        disabled={selected === undefined || saving || submitted}
        onPress={() => void submit()}
      >
        Comprobar respuesta
      </Button>
      {saveError && (
        <Text accessibilityRole="alert" style={{ color: colors.red }}>
          {saveError}
        </Text>
      )}
      {submitted && (
        <Text
          accessibilityLiveRegion="polite"
          style={[f.body, { color: correct ? colors.teal : colors.red }]}
        >
          {correct ? '¡Muy bien!' : 'Intenta de nuevo.'} {question.feedbackEs}
        </Text>
      )}
    </>
  );
}

function ChapterUnit({
  unit,
  renderLine,
  onOpen,
}: {
  unit: NonNullable<ChapterPack['unit']>;
  renderLine: (line: SpokenPhrase, index: number) => React.ReactNode;
  onOpen?: (unitId: string) => void;
}) {
  const [expanded, setExpanded] = useState<string>();
  return (
    <JournalLeaf kind="notebook" style={sectionLayout}>
      <Heading style={{ fontSize: 23 }}>{unit.titleEs}</Heading>
      {unit.lessons.map((lesson) => (
        <View key={lesson.id} style={sectionLayout}>
          <Button
            variant="ghost"
            icon={BookOpen}
            onPress={() => setExpanded((id) => (id === lesson.id ? undefined : lesson.id))}
          >
            {lesson.title}
          </Button>
          {expanded === lesson.id && (
            <View style={sectionLayout}>
              <Label>{lesson.objectiveEs}</Label>
              {lesson.examples.map(renderLine)}
              <Heading style={{ fontSize: 19 }}>Vocabulario</Heading>
              {lesson.vocabulary.map((word, index) => (
                <View key={word.id} style={sectionLayout}>
                  {renderLine(word, index)}
                  {renderLine(word.example, index)}
                </View>
              ))}
              <Heading style={{ fontSize: 19 }}>Gramática</Heading>
              <Label>{lesson.grammar.explanationEs}</Label>
              {lesson.grammar.examples.map(renderLine)}
              <Heading style={{ fontSize: 19 }}>Conversación</Heading>
              {lesson.dialogue.map(renderLine)}
              <Heading style={{ fontSize: 19 }}>Modelo para hablar</Heading>
              {renderLine({ en: lesson.speakingText, es: '' }, 0)}
            </View>
          )}
        </View>
      ))}
      {onOpen && (
        <Button icon={BookOpen} variant="secondary" onPress={() => onOpen(unit.id)}>
          Hacer las lecciones del curso
        </Button>
      )}
    </JournalLeaf>
  );
}
