import { useTheme } from '../theme';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CourseLesson } from '@lingoquest/course-pack';
import type { AttemptResult, PublicExercise } from '@lingoquest/contracts';
import { BookOpen, Check, CheckCheck, Lightbulb, Sparkles, Volume2 } from 'lucide-react-native';
import { useFeatureStyles } from './FeatureUI';
import { stopOfflineSpeech, useOfflineSpeech } from './offlineSpeech';

export type IntegratedLesson = Omit<CourseLesson, 'exercises'> & { exercises: PublicExercise[] };
export type StageKind = CourseLesson['stages'][number]['type'];
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
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();

  return (
    <View style={{ gap: 10 }}>
      <Text accessibilityLiveRegion="polite" style={f.eyebrow}>
        Paso {position + 1} de {lesson.stages.length} · {stageLabels[lesson.stages[position].type]}
      </Text>
      <View style={s.stageList}>
        {lesson.stages.map((stage, index) => (
          <View key={stage.type} style={[s.stagePill, index === position && s.currentStage]}>
            {index < position && <Check size={12} color={palette.teal} />}
            <Text style={[s.stageText, index === position && { color: palette.teal }]}>
              {stageLabels[stage.type]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
export function GoalStage({ lesson, review }: { lesson: IntegratedLesson; review: boolean }) {
  const { colors: palette } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();

  return (
    <>
      <View style={s.lessonIcon}>
        <BookOpen color={palette.teal} size={35} strokeWidth={1.5} />
      </View>
      <Text style={f.eyebrow}>{review ? 'Volver a usar lo que aprendiste' : 'Meta de hoy'}</Text>
      <Text style={f.title}>{lesson.objectiveEs}</Text>
      <Text style={f.body}>{lesson.contextEs}</Text>
      <View style={f.card}>
        <Text style={f.cardTitle}>Una situación, paso a paso</Text>
        <Text style={f.body}>
          Primero conocerás las palabras. Después verás cómo se conectan en una conversación y las
          usarás a tu manera.
        </Text>
        <Text style={f.quiet}>
          {lesson.cefr} · Aproximadamente {lesson.estimatedMinutes} minutos · Sin prisa
        </Text>
      </View>
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
      <View style={[f.card, { gap: 18 }]}>
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
        <View style={s.example}>
          <Text style={f.eyebrow}>En esta situación</Text>
          <Text style={s.english}>{item.example.en}</Text>
          <Text style={f.body}>{item.example.es}</Text>
        </View>
      </View>
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Escuchar: ${text}`}
      style={s.sound}
      onPress={() => {
        void onPlay(text);
      }}
    >
      <Volume2 size={20} color={palette.teal} />
    </Pressable>
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
      <View style={f.card}>
        <View style={f.row}>
          <Lightbulb size={22} color={palette.teal} />
          <Text style={f.cardTitle}>Mira cómo funciona</Text>
        </View>
        <Text style={f.body}>{lesson.grammar.explanationEs}</Text>
        {!!lesson.grammar.taughtForms?.length && (
          <View style={s.forms}>
            <Text style={f.eyebrow}>Estas pequeñas palabras también cuentan</Text>
            {lesson.grammar.taughtForms.map((form) => (
              <Text key={form.en} style={f.body}>
                <Text style={{ color: palette.ink }}>{form.en}</Text> · {form.es}
              </Text>
            ))}
          </View>
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
      </View>
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
        <View
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
        </View>
      ))}
      {!!speechMessage && (
        <Text accessibilityRole="alert" style={f.quiet}>
          {speechMessage}
        </Text>
      )}
    </>
  );
}
export function AnswerFeedback({ result }: { result: AttemptResult }) {
  const { colors: palette, tone } = useTheme();
  const s = useStyles();
  const f = useFeatureStyles();

  return (
    <View
      accessibilityRole="alert"
      style={[
        s.feedback,
        !result.correct && {
          backgroundColor: tone('#FFF3E7', 'background'),
          borderColor: tone('#ECD2B6', 'border'),
        },
      ]}
    >
      <View style={f.row}>
        {result.correct ? (
          <Check size={23} color={palette.teal} />
        ) : (
          <Lightbulb size={23} color="#B17734" />
        )}
        <Text style={[f.cardTitle, { flex: 1 }]}>
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
        <View style={s.completeIcon}>
          <CheckCheck color={palette.teal} size={44} />
        </View>
        <Text style={[f.title, { textAlign: 'center' }]}>¡Lección completada!</Text>
        <Text style={[f.body, { textAlign: 'center' }]}>
          Tu progreso está guardado en este dispositivo. Ya diste un paso para: {lesson.objectiveEs}
        </Text>
        <View style={s.xp}>
          <Sparkles size={23} color="#BC8130" />
          <Text style={s.xpText}>+{xp} XP de aprendizaje</Text>
        </View>
      </View>
      <View style={f.card}>
        <Text style={f.cardTitle}>Palabras para recordar</Text>
        {vocabulary.map((item) => (
          <Text key={item.id} style={f.body}>
            <Text style={{ color: palette.ink }}>{item.en}</Text> · {item.es}
          </Text>
        ))}
      </View>
      <View style={f.card}>
        <Text style={f.cardTitle}>Una idea que ya puedes usar</Text>
        <Text style={f.body}>{lesson.grammar.explanationEs}</Text>
        <Text style={s.english}>{lesson.grammar.examples[0].en}</Text>
        <Text style={f.body}>{lesson.grammar.examples[0].es}</Text>
      </View>
      <View style={f.card}>
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
      </View>
    </>
  );
}
export function useStyles() {
  const { colors: palette, tone } = useTheme();
  return StyleSheet.create({
    stageList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    stagePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 9,
      backgroundColor: tone('#EDF2ED', 'background'),
      paddingVertical: 6,
      paddingHorizontal: 9,
    },
    currentStage: {
      backgroundColor: palette.mint,
      borderWidth: 1,
      borderColor: tone('#B0D3C5', 'border'),
    },
    stageText: { fontFamily: 'Manrope', color: palette.muted, fontSize: 10 },
    lessonIcon: {
      width: 80,
      height: 80,
      borderRadius: 25,
      backgroundColor: palette.mint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    supportive: { flexDirection: 'row', gap: 13, alignItems: 'center', padding: 12 },
    wordHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    word: { fontFamily: 'Outfit', color: palette.teal, fontSize: 40, lineHeight: 48 },
    meaning: { fontFamily: 'Outfit', color: palette.ink, fontSize: 27, lineHeight: 34 },
    english: { fontFamily: 'Outfit', fontSize: 23, lineHeight: 32, color: palette.ink },
    sound: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor: tone('#E0F1E7', 'background'),
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
      padding: 22,
      gap: 13,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: tone('#B8DBC6', 'border'),
      backgroundColor: tone('#E6F5EB', 'background'),
      marginTop: 8,
    },
    accepted: {
      fontFamily: 'Manrope',
      fontSize: 15,
      color: palette.ink,
      fontWeight: '700',
      lineHeight: 24,
    },
    completeHeading: { alignItems: 'center', gap: 22, paddingVertical: 12 },
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
      backgroundColor: tone('#FAEDCE', 'background'),
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 25,
    },
    xpText: { fontFamily: 'Outfit', color: tone('#956924', 'text'), fontSize: 22 },
  });
}
