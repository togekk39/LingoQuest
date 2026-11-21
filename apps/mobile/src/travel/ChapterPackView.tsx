import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { BookOpen, Compass, Square, Volume2 } from 'lucide-react-native';
import type { ChapterPack } from '@lingoquest/course-pack';
import { ErrorCard, FlowFrame, useFeatureStyles } from '../features/FeatureUI';
import { getSpeechPreferences } from '../features/offlineSpeech';
import { JournalLeaf, JournalPostcardFrame } from '../Journal';
import { getInstalledChapter } from '../lib/chapterPacks';
import { chapterMediaUri } from '../lib/chapterStorage';
import { useTheme } from '../theme';
import { Button, Heading, Label } from '../ui';
import { useClipPlayer } from './useClipPlayer';

type SpokenPhrase = { en: string; es: string; speaker?: string };
type PlayPhrase = (phrase: string) => void;
const sectionLayout = { gap: 14 };

export function ChapterPackView({
  chapterId,
  onClose,
  onAdventure,
  onOpenTextbookUnit,
}: {
  chapterId: string;
  onClose: () => void;
  onAdventure?: () => void;
  onOpenTextbookUnit?: (unitId: string) => void;
}) {
  const { colors } = useTheme();
  const player = useClipPlayer();
  const playback = useRef<AbortController | null>(null);
  const [content, setContent] = useState<{ pack: ChapterPack; cover: string }>();
  const [failure, setFailure] = useState('');
  const [audioError, setAudioError] = useState('');
  const [playing, setPlaying] = useState<string>();
  const [reload, setReload] = useState(0);
  const [lessonIndex, setLessonIndex] = useState(0);

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
        const cover = await chapterMediaUri(image.mimeType, image.dataBase64);
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
      return;
    }
    const clip = content?.pack.audio[phrase];
    if (!clip) {
      setPlaying(undefined);
      setAudioError('No encontramos el audio de esta frase en el capítulo.');
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;
    playback.current = controller;
    setPlaying(phrase);
    try {
      const [uri, preferences] = await Promise.all([
        chapterMediaUri(clip.mimeType, clip.dataBase64),
        getSpeechPreferences(),
      ]);
      if (!signal.aborted) await player.play(uri, preferences.rate ?? 1, signal);
    } catch {
      if (!signal.aborted) setAudioError('No pudimos reproducir la frase. Inténtalo de nuevo.');
    } finally {
      if (playback.current === controller) {
        playback.current = null;
        setPlaying(undefined);
      }
    }
  }

  const pack = content?.pack;
  const lessons = pack ? [pack.lesson, ...pack.additionalLessons] : [];
  const lesson = lessons[lessonIndex] ?? pack?.lesson;
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
            <Button icon={Compass} variant="secondary" onPress={onAdventure}>
              Explorar aventura de este capítulo
            </Button>
          )}
          <JournalLeaf kind="notebook" style={sectionLayout}>
            <Heading style={{ fontSize: 23 }}>Escucha la conversación</Heading>
            {lesson.dialogue.map(renderLine)}
          </JournalLeaf>
          <JournalLeaf kind="notebook" style={sectionLayout}>
            <Heading style={{ fontSize: 23 }}>Palabras y expresiones</Heading>
            {lesson.vocabulary.map(renderLine)}
          </JournalLeaf>
          <JournalLeaf kind="notebook" style={sectionLayout}>
            <Heading style={{ fontSize: 23 }}>Gramática en contexto</Heading>
            <Label>{lesson.grammarEs}</Label>
          </JournalLeaf>
          <ChapterQuestion key={`${chapterId}-${lessonIndex}`} question={lesson.question} />
          <JournalLeaf kind="notebook" style={sectionLayout}>
            <Heading style={{ fontSize: 23 }}>Practica por tu cuenta</Heading>
            <Label>{lesson.practiceEs}</Label>
            {renderLine(lesson.model, 0)}
          </JournalLeaf>
          {pack.unit && (
            <ChapterUnit
              key={pack.unit.id}
              unit={pack.unit}
              renderLine={renderLine}
              onOpen={onOpenTextbookUnit}
            />
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

function ChapterQuestion({ question }: { question: ChapterPack['lesson']['question'] }) {
  const { colors } = useTheme();
  const f = useFeatureStyles();
  const [selected, setSelected] = useState<number>();
  const [submitted, setSubmitted] = useState(false);
  const correct = selected === question.answerIndex;
  return (
    <JournalLeaf kind="notebook" style={sectionLayout}>
      <Heading style={{ fontSize: 23 }}>Comprueba tu comprensión</Heading>
      <Label>{question.promptEs}</Label>
      <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
        {question.options.map((option, index) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === index }}
            onPress={() => {
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
        disabled={selected === undefined}
        onPress={() => setSubmitted(true)}
      >
        Comprobar respuesta
      </Button>
      {submitted && (
        <Text
          accessibilityLiveRegion="polite"
          style={[f.body, { color: correct ? colors.teal : colors.red }]}
        >
          {correct ? '¡Muy bien!' : 'Intenta de nuevo.'} {question.feedbackEs}
        </Text>
      )}
    </JournalLeaf>
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
