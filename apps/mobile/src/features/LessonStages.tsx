import { useTheme } from '../theme';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CourseLesson } from '@lingoquest/course-pack';
import type { Answer, AttemptResult, PublicExercise } from '@lingoquest/contracts';
import { Lightbulb, Sparkles, Volume2 } from 'lucide-react-native';
import { useFeatureStyles } from './FeatureUI';
import { stopOfflineSpeech, useOfflineSpeech } from './offlineSpeech';
import { Celebration, MotionEntrance, MotionPressable } from '../motion';
import { QuestBuddy } from '../QuestBuddy';
import { Notebook, PaperGrain, PlazaPostcard, JournalLeaf } from '../Journal';

export type IntegratedLesson = Omit<CourseLesson, 'exercises'> & { exercises: PublicExercise[] };
export type StageKind = CourseLesson['stages'][number]['type'];
export const plazaExample = { en: 'Hi! My name is Sam.', es: '¡Hola! Me llamo Sam.' };
export const stageLabels: Record<StageKind, string> = {
  goal: 'Meta',
  vocabulary: 'Vocabulario',
  grammar: 'Gramática',
  dialogue: 'Conversación',
  practice: 'Práctica',
  speaking: 'Hablar',
  recap: 'Recordar',
};
export function StageProgress({
  lesson,
  position,
}: {
  lesson: IntegratedLesson;
  position: number;
}) {
  const f = useFeatureStyles();

  return (
    <Text accessibilityLiveRegion="polite" style={f.eyebrow}>
      Paso {position + 1} de {lesson.stages.length} · {stageLabels[lesson.stages[position].type]}
    </Text>
  );
}
export function GoalStage({
  lesson,
  review,
  onListen,
}: {
  lesson: IntegratedLesson;
  review: boolean;
  onListen?: () => void;
}) {
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();

  return (
    <>
      {lesson.id === 'u01_l01' ? (
        <>
          <PlazaPostcard />
          <JournalLeaf compact kind="postcard" style={[f.card, s.phraseCard]}>
            <PaperGrain opacity={0.32} />
            <Text accessibilityLanguage="en-US" style={s.phrase}>
              {plazaExample.en}
            </Text>
            <Text style={s.phraseTranslation}>{plazaExample.es}</Text>
            <MotionPressable accessibilityRole="button" style={s.phraseButton} onPress={onListen}>
              <Volume2 color={palette.ink} size={21} />
              <Text style={s.phraseButtonText}>Escuchar frase</Text>
            </MotionPressable>
          </JournalLeaf>
        </>
      ) : (
        <QuestBuddy size={80} />
      )}
      <Notebook title={review ? 'Volver a usar lo que aprendiste' : 'Meta de hoy'}>
        <Text style={f.cardTitle}>{lesson.objectiveEs}</Text>
        <Text style={f.body}>{lesson.contextEs}</Text>
      </Notebook>
      <JournalLeaf compact kind="postcard" style={f.card}>
        <Text style={f.cardTitle}>Una situación, paso a paso</Text>
        <Text style={f.body}>
          Primero conocerás las palabras. Después verás cómo se conectan en una conversación y las
          usarás a tu manera.
        </Text>
        <Text style={f.quiet}>
          {lesson.cefr} · Aproximadamente {lesson.estimatedMinutes} minutos · Sin prisa
        </Text>
      </JournalLeaf>
      <View style={s.supportive}>
        <Sparkles size={19} color={palette.teal} />
        <Text style={[f.body, { flex: 1 }]}>
          Puedes equivocarte y volver a intentar. Cada intento es parte del camino. Hablar es
          opcional.
        </Text>
      </View>
    </>
  );
}
export function VocabularyCard({
  item,
  position,
  total,
}: {
  item: CourseLesson['vocabulary'][number];
  position: number;
  total: number;
}) {
  const s = useStyles();
  const f = useFeatureStyles();

  const { playOffline, speechMessage } = useOfflineSpeech();
  useEffect(() => {
    // Defer until after mounting so a discarded effect never starts playback.
    const timer = setTimeout(() => {
      void playOffline(item.en);
    }, 0);
    return () => {
      clearTimeout(timer);
      void stopOfflineSpeech();
    };
  }, [item.id, item.en, playOffline]);
  return (
    <>
      <Text style={f.eyebrow}>
        Palabra o expresión {position + 1} de {total}
      </Text>
      <Text style={f.title}>Palabras para esta situación</Text>
      <JournalLeaf compact kind="postcard" style={[f.card, { gap: 18 }]}>
        <View style={s.wordHeader}>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={s.word}>{item.en}</Text>
            <Text style={s.meaning}>{item.es}</Text>
          </View>
          <AudioButton text={item.en} onPlay={playOffline} />
        </View>
        <Text style={f.quiet}>
          {item.partOfSpeech} · {item.status === 'new' ? 'Una palabra nueva' : 'La volvemos a usar'}
        </Text>
        <JournalLeaf compact kind="notebook" style={s.example}>
          <Text style={f.eyebrow}>En esta situación</Text>
          <Text style={s.english}>{item.example.en}</Text>
          <Text style={f.body}>{item.example.es}</Text>
        </JournalLeaf>
      </JournalLeaf>
      <Text accessibilityLiveRegion="polite" style={f.quiet}>
        {speechMessage ||
          'Escucha con la voz sin conexión del dispositivo. Puedes cambiar la voz y la velocidad en Configuración.'}
      </Text>
      <Text style={f.body}>
        Mira el significado y el ejemplo. Primero reconocerás estas palabras; después las
        escribirás.
      </Text>
    </>
  );
}
function AudioButton({ text, onPlay }: { text: string; onPlay: (text: string) => Promise<void> }) {
  const { colors: palette } = useTheme();
  const s = useStyles();

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={`Escuchar: ${text}`}
      style={s.sound}
      onPress={() => {
        void onPlay(text);
      }}
    >
      <Volume2 size={20} color={palette.teal} />
    </MotionPressable>
  );
}
export function GrammarStage({ lesson }: { lesson: IntegratedLesson }) {
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();

  const { playOffline, speechMessage } = useOfflineSpeech();
  return (
    <>
      <Text style={f.eyebrow}>Gramática en contexto</Text>
      <Text style={f.title}>Una idea para usar estas palabras</Text>
      <JournalLeaf compact kind="postcard" style={f.card}>
        <View style={f.row}>
          <Lightbulb size={22} color={palette.teal} />
          <Text style={f.cardTitle}>Mira cómo funciona</Text>
        </View>
        <Text style={f.body}>{lesson.grammar.explanationEs}</Text>
        {!!lesson.grammar.taughtForms?.length && (
          <JournalLeaf compact kind="notebook" style={s.forms}>
            <Text style={f.eyebrow}>Estas pequeñas palabras también cuentan</Text>
            {lesson.grammar.taughtForms.map((form) => (
              <Text key={form.en} style={f.body}>
                <Text style={{ color: palette.ink }}>{form.en}</Text> · {form.es}
              </Text>
            ))}
          </JournalLeaf>
        )}
        {lesson.grammar.examples.map((example, index) => (
          <View key={`${example.en}-${index}`} style={s.exampleRow}>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={s.english}>{example.en}</Text>
              <Text style={f.body}>{example.es}</Text>
            </View>
            <AudioButton text={example.en} onPlay={playOffline} />
          </View>
        ))}
      </JournalLeaf>
      {!!speechMessage && (
        <Text accessibilityRole="alert" style={f.quiet}>
          {speechMessage}
        </Text>
      )}
    </>
  );
}
export function DialogueStage({ lesson }: { lesson: IntegratedLesson }) {
  const { tone } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();

  const { playOffline, speechMessage } = useOfflineSpeech();
  return (
    <>
      <Text style={f.eyebrow}>Conversación</Text>
      <Text style={f.title}>Una conversación cercana</Text>
      <Text style={f.body}>{lesson.contextEs}</Text>
      {lesson.dialogue.map((turn, index) => (
        <JournalLeaf
          compact
          kind="postcard"
          key={`${turn.speaker}-${index}`}
          style={[f.card, index % 2 === 1 && { backgroundColor: tone('#EEF7F0', 'background') }]}
        >
          <Text style={f.eyebrow}>{turn.speaker}</Text>
          <View style={s.exampleRow}>
            <Text style={[s.english, { flex: 1 }]}>{turn.en}</Text>
            <AudioButton text={turn.en} onPlay={playOffline} />
          </View>
          <Text style={f.body}>{turn.es}</Text>
          {turn.glosses.map((gloss) => (
            <Text key={gloss.en} style={f.quiet}>
              {gloss.en} · {gloss.es}
            </Text>
          ))}
        </JournalLeaf>
      ))}
      {!!speechMessage && (
        <Text accessibilityRole="alert" style={f.quiet}>
          {speechMessage}
        </Text>
      )}
    </>
  );
}
export function AnswerFeedback({
  result,
  exercise,
  answer,
  speaker,
}: {
  result: AttemptResult;
  exercise: PublicExercise;
  answer: Partial<Answer>;
  speaker?: React.ReactNode;
}) {
  const { colors: palette, tone } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();
  const feedbackTitle = result.identityMismatch
    ? 'Usa tu nombre'
    : result.communicationOnly
      ? 'Lograste comunicarte'
      : result.correct
        ? '¡Muy bien!'
        : 'Buen intento. Veamos por qué…';
  const submittedAnswer = exercise.matchingPairs?.length
    ? exercise.matchingPairs
        .map((pair) => {
          const meaning = exercise.matchingPairs!.find(
            (item) => item.id === answer.matches?.[pair.id],
          );
          return `${pair.left} → ${meaning?.right ?? '—'}`;
        })
        .join('\n')
    : (exercise.options?.find((option) => option.id === answer.optionId)?.text ??
      answer.tokens?.join(' ') ??
      answer.text ??
      '');

  return (
    <MotionEntrance>
      <JournalLeaf
        compact
        kind="notebook"
        testID="answer-feedback"
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[
          s.feedback,
          !result.correct &&
            !result.communicationOnly && {
              backgroundColor: tone('#FFF1DD', 'background'),
            },
        ]}
      >
        <PaperGrain />
        <View style={f.row}>
          {speaker ??
            (result.correct ? (
              <Celebration size={72}>
                <QuestBuddy size={68} mood="happy" />
              </Celebration>
            ) : (
              <QuestBuddy size={64} mood="encouraging" />
            ))}
          <Text style={[f.cardTitle, { flex: 1 }]}>{feedbackTitle}</Text>
        </View>
        {!result.correct && (
          <View style={{ gap: 8 }}>
            {!!exercise.sentence && (
              <Text style={[f.body, { color: palette.ink }]}>{exercise.sentence}</Text>
            )}
            <Text testID="submitted-answer" style={[f.body, { color: palette.ink }]}>
              Tu respuesta: {submittedAnswer}
            </Text>
          </View>
        )}
        {result.acceptedAnswer && !result.correct && (
          <Text style={s.accepted}>
            {result.communicationOnly
              ? 'Ejemplo de la forma practicada:'
              : 'Una respuesta posible:'}{' '}
            {result.acceptedAnswer}
          </Text>
        )}
        <Text style={[f.body, { color: palette.ink }]}>{result.feedbackEs}</Text>
      </JournalLeaf>
    </MotionEntrance>
  );
}

export function RecapStage({
  lesson,
  xp,
  nextReviewAt,
  weakExerciseIds,
}: {
  lesson: IntegratedLesson;
  xp: number;
  nextReviewAt: string | null;
  weakExerciseIds: string[];
}) {
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();

  const vocabulary = lesson.vocabulary.filter((item) =>
    lesson.review.vocabularyIds.includes(item.id),
  );
  const weakVocabularyIds = new Set(
    lesson.exercises
      .filter((exercise) => weakExerciseIds.includes(exercise.id))
      .flatMap((exercise) => exercise.vocabularyIds ?? []),
  );
  const weakWords = vocabulary.filter((item) => weakVocabularyIds.has(item.id));
  return (
    <>
      <View style={s.completeHeading}>
        <Celebration>
          <QuestBuddy size={132} mood="happy" />
        </Celebration>
        <Text style={[f.title, { textAlign: 'center' }]}>¡Lección completada!</Text>
        <Text style={[f.body, { textAlign: 'center' }]}>
          Tu progreso está guardado en este dispositivo. Ya diste un paso para: {lesson.objectiveEs}
        </Text>
        <JournalLeaf compact kind="stamp" style={s.xp}>
          <Sparkles size={23} color="#BC8130" />
          <Text style={s.xpText}>+{xp} XP de aprendizaje</Text>
        </JournalLeaf>
      </View>
      <JournalLeaf compact kind="postcard" style={f.card}>
        <Text style={f.cardTitle}>Palabras para recordar</Text>
        {vocabulary.map((item) => (
          <Text key={item.id} style={f.body}>
            <Text style={{ color: palette.ink }}>{item.en}</Text> · {item.es}
          </Text>
        ))}
      </JournalLeaf>
      <JournalLeaf compact kind="postcard" style={f.card}>
        <Text style={f.cardTitle}>Una idea que ya puedes usar</Text>
        <Text style={f.body}>{lesson.grammar.explanationEs}</Text>
        <Text style={s.english}>{lesson.grammar.examples[0].en}</Text>
        <Text style={f.body}>{lesson.grammar.examples[0].es}</Text>
      </JournalLeaf>
      <JournalLeaf compact kind="postcard" style={f.card}>
        <Text style={f.cardTitle}>Aprender hoy. Recordar mañana.</Text>
        <Text style={f.body}>
          {nextReviewAt
            ? `Tu próximo repaso está programado para el ${new Date(nextReviewAt).toLocaleDateString('es-MX')}.`
            : 'Vuelve mañana a Repasar para seguir practicando.'}{' '}
          Repasarás por separado el significado de las palabras, cómo recordarlas y cómo usar la
          gramática.
        </Text>
        {!!weakWords.length && (
          <Text style={f.body}>
            Dales otra oportunidad: {weakWords.map((item) => item.en).join(', ')}.
          </Text>
        )}
        <Text style={f.quiet}>
          Completar la lección es un logro. Recordar con el tiempo necesita varias prácticas. Tus
          desafíos tienen su propio progreso.
        </Text>
      </JournalLeaf>
    </>
  );
}
export function useStyles() {
  const { colors: palette, tone } = useTheme();
  return StyleSheet.create({
    phraseCard: { gap: 4, padding: 17, overflow: 'hidden' },
    phrase: { fontFamily: 'LoraBold', fontSize: 25, color: palette.ink, lineHeight: 32 },
    phraseTranslation: { fontFamily: 'Manrope', fontSize: 17, color: palette.muted },
    phraseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
      gap: 9,
      minHeight: 44,
      minWidth: '60%',
      marginTop: 9,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: palette.mint,
    },
    phraseButtonText: { fontFamily: 'ManropeBold', fontSize: 14, color: palette.ink },
    supportive: { flexDirection: 'row', gap: 13, alignItems: 'center', padding: 12 },
    wordHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    word: { fontFamily: 'LoraBold', color: palette.ink, fontSize: 36, lineHeight: 45 },
    meaning: { fontFamily: 'Manrope', color: palette.muted, fontSize: 24, lineHeight: 32 },
    english: { fontFamily: 'LoraBold', fontSize: 21, lineHeight: 29, color: palette.ink },
    sound: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor: palette.mint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    example: { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 18, gap: 9 },
    exampleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    forms: {
      backgroundColor: tone('#EFF6EF', 'background'),
      padding: 16,
      borderRadius: 15,
      gap: 8,
    },
    feedback: {
      padding: 16,
      gap: 9,
      borderRadius: 20,
      backgroundColor: palette.mint,
      shadowColor: '#53402C',
      shadowOpacity: 0.16,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 14,
      elevation: 2,
    },
    accepted: {
      fontFamily: 'Manrope',
      fontSize: 15,
      color: palette.ink,
      fontWeight: '700',
      lineHeight: 24,
    },
    completeHeading: { alignItems: 'center', gap: 22, paddingVertical: 12 },
    xp: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      backgroundColor: tone('#FAEDCE', 'background'),
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 25,
    },
    xpText: { fontFamily: 'Outfit', color: tone('#956924', 'text'), fontSize: 22 },
  });
}
