/** Original integrated curriculum authoring source. Runtime uses generated offline JSON.
 * Vocabulary recognition scaffolds authored contextual tasks; there is no seed-sentence grammar generator. */
import type {
  CourseExercise,
  CourseLesson,
  CourseUnit,
} from '../../packages/course-pack/src/index.ts';
import { authoredUnits, type LessonAuthoring } from './integrated-lessons.ts';
import { advancedUnits } from './advanced-lessons.ts';
export type PrivateExercise = CourseExercise;
export type PrivateLesson = CourseLesson;
export type Unit = CourseUnit;
export type ExerciseType = CourseExercise['type'];
export type ChallengeType = 'grammar_rush' | 'cloze_battle' | 'reading_quest';
export const contentStatus = {
  version: 'integrated-original-draft-2',
  status: 'draft_needs_human_review',
  rankedPublished: false,
  source: 'original_authored_integrated_curriculum',
} as const;
export const lessons: Record<string, PrivateLesson> = {};
const vocabularyByText = new Map<string, CourseLesson['vocabulary'][number]>();
const supportForDialogue: Record<string, string> = {
  'Thank you': 'Gracias',
  your: 'tu; tus; su',
  and: 'y',
};
const englishTokens = (value: string) =>
  value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .match(/[a-z]+(?:'[a-z]+)*/g) ?? [];
function containsPhrase(text: string, phrase: string) {
  const source = englishTokens(text);
  const words = englishTokens(phrase);
  return (
    words.length > 0 &&
    source.some((_, index) => words.every((word, offset) => source[index + offset] === word))
  );
}
let previousSkill: string | undefined;
let order = 0;
function authorLesson(
  definition: LessonAuthoring,
  unitId: string,
  index: number,
  cefr: 'A1' | 'A2',
): PrivateLesson {
  const id = `${unitId}_l${String(index + 1).padStart(2, '0')}`;
  const recycled = definition.recycle.map((en) => {
    const item = vocabularyByText.get(en.toLowerCase());
    if (!item) throw new Error(`No existe vocabulario previo para reciclar: ${id}/${en}`);
    return { ...item, status: 'review' as const };
  });
  const introduced = definition.words.map(
    ([en, es, exampleEn, exampleEs, partOfSpeech], position) => {
      const previous = vocabularyByText.get(en.toLowerCase());
      if (previous)
        return {
          ...previous,
          example: { en: exampleEn, es: exampleEs },
          status: 'review' as const,
        };
      return {
        id: `${id}_v${String(position + 1).padStart(2, '0')}`,
        en,
        es,
        partOfSpeech: partOfSpeech ?? 'sustantivo',
        example: { en: exampleEn, es: exampleEs },
        status: 'new' as const,
      };
    },
  );
  introduced.forEach((item) => vocabularyByText.set(item.en.toLowerCase(), item));
  const vocabulary = [...introduced, ...recycled];
  const difficulty = Math.min(8, Number(unitId.slice(1)));
  const recognition: PrivateExercise[] = introduced.map((item, position) => {
    const wrong = introduced[(position + Math.floor(introduced.length / 2)) % introduced.length]!;
    const correctOptionId = position % 2 ? 'b' : 'a';
    return {
      id: `${id}_meaning_${position + 1}`,
      type: 'meaning',
      promptEs: `¿Qué significa «${item.en}» en esta situación?`,
      options: [
        { id: 'a', text: position % 2 ? wrong.es : item.es },
        { id: 'b', text: position % 2 ? item.es : wrong.es },
      ],
      optionsLanguage: 'es',
      correctOptionId,
      acceptedAnswers: [item.es],
      skillId: definition.skill,
      vocabularyIds: [item.id],
      dimension: 'vocabulary_recognition',
      feedbackEs: `«${item.en}» significa «${item.es}». En contexto: ${item.example.en} (${item.example.es})`,
      difficulty,
    };
  });
  const pairWords = [
    introduced[0]!,
    introduced[Math.floor(introduced.length / 2)]!,
    introduced[introduced.length - 1]!,
  ];
  recognition.push({
    id: `${id}_matching`,
    type: 'matching',
    promptEs:
      'Relaciona cada palabra con su significado. Puedes cambiar tus parejas antes de comprobar.',
    matchingPairs: pairWords.map((item, position) => ({
      id: `pair${position + 1}`,
      left: item.en,
      right: item.es,
    })),
    acceptedAnswers: [pairWords.map((item) => `${item.en} = ${item.es}`).join('; ')],
    skillId: definition.skill,
    vocabularyIds: pairWords.map((item) => item.id),
    dimension: 'vocabulary_recognition',
    feedbackEs: pairWords.map((item) => `«${item.en}» = ${item.es}`).join('. '),
    difficulty,
  });
  const practice: PrivateExercise[] = definition.tasks.map((task, position) => {
    const answers = task.type === 'reorder' ? [task.answer] : task.answers;
    const text = answers.join(' ').toLowerCase();
    const linked = [...vocabularyByText.values()].filter((item) => containsPhrase(text, item.en));
    // A recall item credits only the word that is actually retrieved, never every word in its example.
    const recalled =
      task.type === 'short_text' && task.recall
        ? [...vocabularyByText.values()].filter(
            (item) => item.en.toLowerCase() === answers[0]!.toLowerCase(),
          )
        : [];
    if (task.type === 'short_text' && task.recall && recalled.length === 0)
      throw new Error(`La evocación necesita un vocabulario explícito: ${id}/${answers[0]}`);
    const exercise: PrivateExercise = {
      id: `${id}_practice_${position + 1}`,
      type: task.type,
      promptEs: task.prompt,
      acceptedAnswers: answers,
      skillId: definition.skill,
      vocabularyIds: (recalled.length ? recalled : linked).map((item) => item.id).slice(0, 30),
      dimension:
        task.type === 'short_text'
          ? task.recall
            ? 'vocabulary_recall'
            : 'grammar_production'
          : 'grammar_understanding',
      feedbackEs: task.reason,
      difficulty,
    };
    if (task.type === 'reorder') {
      const tokens = task.answer.split(' ');
      // Stable rotation keeps repeat words available and does not change authored answers.
      const split = Math.ceil(tokens.length / 2);
      exercise.tokens = [...tokens.slice(split), ...tokens.slice(0, split)];
    } else if (task.type !== 'short_text') {
      // Spanish hints belong to the instruction, never to the English sentence checked for unknown words.
      const hint = task.sentence.match(/\s*\(([^)]+)\)\s*$/);
      exercise.sentence = hint ? task.sentence.slice(0, hint.index).trim() : task.sentence;
      if (hint) exercise.promptEs += ` Pista: ${hint[1]}.`;
    }
    return exercise;
  });
  const prerequisiteSkillIds = previousSkill ? [previousSkill] : [];
  previousSkill = definition.skill;
  return {
    id,
    unitId,
    title: definition.title,
    introEs: definition.scene,
    objectiveEs: definition.goal,
    contextEs: definition.scene,
    cefr,
    order: ++order,
    properNames: [
      'Ana',
      'Luis',
      'Rosa',
      'Maya',
      'Diego',
      'Eva',
      'Peru',
      'Mexico',
      'Miami',
      'Colombia',
      'Chile',
      'Lima',
    ],
    vocabulary,
    grammar: {
      skillId: definition.skill,
      prerequisiteSkillIds,
      explanationEs: definition.rule,
      examples: definition.examples.map(([en, es]) => ({ en, es })),
      taughtForms: definition.forms.map(([en, es]) => ({ en, es })),
    },
    examples: definition.examples.map(([en, es]) => ({ en, es })),
    dialogue: definition.dialogue.map(([speaker, en, es]) => ({
      speaker,
      en,
      es,
      glosses: Object.entries(supportForDialogue)
        .filter(([expression]) => containsPhrase(en, expression))
        .map(([en, es]) => ({ en, es })),
    })),
    exercises: [...recognition, ...practice],
    speakingText: definition.examples[0]![0],
    estimatedMinutes: index === 0 && unitId === 'u01' ? 9 : 8,
    stages: [
      { type: 'goal' },
      { type: 'vocabulary', exerciseIds: recognition.map((exercise) => exercise.id) },
      { type: 'grammar' },
      { type: 'dialogue' },
      { type: 'practice', exerciseIds: practice.map((exercise) => exercise.id) },
      { type: 'speaking' },
      { type: 'recap' },
    ],
    review: { vocabularyIds: vocabulary.map((item) => item.id), skillIds: [definition.skill] },
  };
}
export const units: Unit[] = [...authoredUnits, ...advancedUnits].map((unit, unitIndex) => {
  const id = `u${String(unitIndex + 1).padStart(2, '0')}`;
  return {
    id,
    title: unit.title,
    titleEs: unit.title,
    description: unit.description,
    cefr: unit.cefr,
    lessons: unit.lessons.map((definition, index) => {
      const lesson = authorLesson(definition, id, index, unit.cefr);
      lessons[lesson.id] = lesson;
      return {
        id: lesson.id,
        title: lesson.title,
        estimatedMinutes: lesson.estimatedMinutes,
        skills: [lesson.grammar.skillId],
        seq: index + 1,
      };
    }),
  };
});
export function publicExercise(exercise: PrivateExercise) {
  const {
    acceptedAnswers: _answers,
    correctOptionId: _option,
    feedbackEs: _feedback,
    ...publicData
  } = exercise;
  return publicData;
}
export { challengePools, challengePools as challengeQuestions } from './challenges.ts';
// Placement remains optional and samples progressively harder, already authored material.
export const placementQuestions: PrivateExercise[] = [
  'u01_l01',
  'u01_l02',
  'u02_l01',
  'u02_l02',
  'u03_l01',
  'u03_l02',
  'u04_l02',
  'u04_l03',
  'u05_l01',
  'u06_l01',
  'u07_l01',
  'u07_l04',
].map((lessonId, index) => {
  const source = lessons[lessonId]!.exercises.find((exercise) => exercise.type === 'cloze')!;
  return {
    ...source,
    id: `placement_${String(index + 1).padStart(2, '0')}`,
    promptEs: `${source.promptEs} Este diagnóstico es opcional; puedes empezar desde cero.`,
  };
});

export interface SpeechDrill {
  id: string;
  category: string;
  titleEs: string;
  textEn: string;
  tipEs: string;
}
const speechGroups = [
  {
    category: 'short_long_vowels',
    titleEs: 'Vocales: /ɪ/ y /iː/',
    tipEs: 'Escucha el contraste entre una vocal breve y una más larga. Tu acento no es un error.',
    texts: [
      'The ship is near the sheep.',
      'Please sit in this seat.',
      'I live here, but I leave tomorrow.',
      'A little bit of a steady beat.',
      'Fill the glass and feel the water.',
    ],
  },
  {
    category: 'b_v',
    titleEs: 'Sonidos /b/ y /v/',
    tipEs:
      'Para /v/, acerca los dientes superiores al labio inferior. Compara con el cierre de ambos labios en /b/.',
    texts: [
      'This berry is very sweet.',
      'The best vest is blue.',
      'The van is next to the bank.',
      'We vote near the boat.',
      'The blue bow is very bright.',
    ],
  },
  {
    category: 'th_voiceless',
    titleEs: 'El sonido /θ/',
    tipEs:
      'Deja pasar el aire suavemente entre la lengua y los dientes en think. Practica sin presión.',
    texts: [
      'I think we can do it.',
      'There are three books.',
      'Thank you for your help.',
      'The paper is very thin.',
      'The bath is warm.',
    ],
  },
  {
    category: 'th_voiced',
    titleEs: 'El sonido /ð/',
    tipEs:
      'En this, deja vibrar la voz suavemente. No se evalúa tu acento; aquí solo puedes escuchar y comparar.',
    texts: [
      'This is my notebook.',
      'That is a good idea.',
      'Those are my friends.',
      'My mother is a teacher.',
      'The weather is nice today.',
    ],
  },
  {
    category: 's_clusters',
    titleEs: 'Palabras que empiezan con s',
    tipEs: 'Escucha cómo la s se une con la consonante siguiente. No hace falta hablar rápido.',
    texts: [
      'The school opens at eight.',
      'We live on this street.',
      'I study after work.',
      'Please speak slowly.',
      'Spring is my favorite season.',
    ],
  },
  {
    category: 'final_consonants',
    titleEs: 'Consonantes al final',
    tipEs:
      'Escucha la terminación de la palabra. Conserva los sonidos finales sin añadir una vocal extra.',
    texts: [
      'I worked at home yesterday.',
      'She asked a question.',
      'They helped their neighbor.',
      'We need some milk.',
      'The next stop is downtown.',
    ],
  },
  {
    category: 'sh_ch',
    titleEs: 'Sonidos /ʃ/ y /tʃ/',
    tipEs:
      'Compara el aire continuo de sh con el inicio breve de ch. Escucha y vuelve a intentarlo cuando quieras.',
    texts: [
      'The ship has a small chip.',
      'We shop before we chop vegetables.',
      'The sheep is not cheap.',
      'Wash your hands and watch the water.',
      'Please share this chair.',
    ],
  },
  {
    category: 'stress_schwa',
    titleEs: 'Ritmo y acento de palabras',
    tipEs:
      'Escucha qué sílaba recibe más fuerza. Las demás pueden sonar más suaves; no todas necesitan igual énfasis.',
    texts: [
      'Tell me about your day.',
      'Today is a good day.',
      'The hotel is near the station.',
      'I would like a banana.',
      'Your ideas are important.',
    ],
  },
] as const;
export const speechDrills: SpeechDrill[] = speechGroups.flatMap((group, groupIndex) =>
  group.texts.map((textEn, index) => ({
    id: `speech_${groupIndex + 1}_${index + 1}`,
    category: group.category,
    titleEs: group.titleEs,
    textEn,
    tipEs: group.tipEs,
  })),
);

export interface MissionStep {
  id: string;
  speaker: string;
  promptEn: string;
  hintEs: string;
  options: { id: string; text: string; nextStepId?: string }[];
}
export interface Mission {
  id: string;
  titleEs: string;
  descriptionEs: string;
  steps: MissionStep[];
}
export const missions: Mission[] = [
  {
    id: 'airport',
    titleEs: 'Tu vuelo empieza aquí',
    descriptionEs:
      'Practica una conversación en el aeropuerto. Elige cómo responder y avanza sin límite de tiempo.',
    steps: [
      {
        id: 'welcome',
        speaker: 'Agente',
        promptEn: 'Good morning. Where are you flying today?',
        hintEs: 'Saluda e indica tu destino.',
        options: [
          { id: 'a', text: 'Good morning. I am flying to Miami.', nextStepId: 'passport' },
          { id: 'b', text: 'Hello. My flight is to Miami.', nextStepId: 'passport' },
        ],
      },
      {
        id: 'passport',
        speaker: 'Agente',
        promptEn: 'May I see your passport, please?',
        hintEs: 'Puedes entregar tu pasaporte con una frase cortés.',
        options: [
          { id: 'a', text: 'Of course. Here is my passport.', nextStepId: 'seat' },
          { id: 'b', text: 'Yes, here you are.', nextStepId: 'seat' },
        ],
      },
      {
        id: 'seat',
        speaker: 'Agente',
        promptEn: 'Would you like a window seat or an aisle seat?',
        hintEs: 'Window es ventana; aisle es pasillo.',
        options: [
          { id: 'a', text: 'I would like a window seat, please.', nextStepId: 'gate' },
          { id: 'b', text: 'An aisle seat, please.', nextStepId: 'gate' },
        ],
      },
      {
        id: 'gate',
        speaker: 'Agente',
        promptEn: 'Your flight leaves from gate twelve at two. Do you have any questions?',
        hintEs: 'Confirma la puerta o pregunta cuándo empieza el abordaje.',
        options: [
          { id: 'a', text: 'What time does boarding start?', nextStepId: 'boarding' },
          { id: 'b', text: 'Gate twelve. Thank you for your help.', nextStepId: 'goodbye' },
        ],
      },
      {
        id: 'boarding',
        speaker: 'Agente',
        promptEn: 'Boarding starts at one thirty.',
        hintEs: 'Agradece la información. Ya tienes lo necesario para tu vuelo.',
        options: [
          { id: 'a', text: 'Thank you. Have a nice day.', nextStepId: 'goodbye' },
          { id: 'b', text: 'Great, thank you for your help.', nextStepId: 'goodbye' },
        ],
      },
      {
        id: 'goodbye',
        speaker: 'Agente',
        promptEn: 'You are welcome. Have a good flight!',
        hintEs: '¡Misión completada! Pediste información y confirmaste los detalles de tu viaje.',
        options: [],
      },
    ],
  },
  {
    id: 'job',
    titleEs: 'Tu próxima oportunidad',
    descriptionEs:
      'Preséntate en una entrevista breve. Puedes pedir que repitan y elegir respuestas que te ayuden a practicar.',
    steps: [
      {
        id: 'welcome',
        speaker: 'Entrevistadora',
        promptEn: 'Welcome. Please tell me a little about yourself.',
        hintEs: 'Comparte una presentación breve.',
        options: [
          {
            id: 'a',
            text: 'Thank you. I am a student and I enjoy helping people.',
            nextStepId: 'experience',
          },
          {
            id: 'b',
            text: 'Thank you. I am a designer, and I work well with a team.',
            nextStepId: 'experience',
          },
        ],
      },
      {
        id: 'experience',
        speaker: 'Entrevistadora',
        promptEn: 'What experience do you have?',
        hintEs: 'Cuenta una experiencia relevante. También puedes pedir que repitan.',
        options: [
          { id: 'a', text: 'I have worked in customer service.', nextStepId: 'strength' },
          { id: 'b', text: 'Could you repeat that, please?', nextStepId: 'repeat' },
        ],
      },
      {
        id: 'repeat',
        speaker: 'Entrevistadora',
        promptEn: 'Of course. Have you worked with customers before?',
        hintEs: 'Pedir una aclaración es parte de comunicarse bien.',
        options: [
          { id: 'a', text: 'Yes. I helped customers in a small store.', nextStepId: 'strength' },
          { id: 'b', text: 'Not yet, but I am ready to learn.', nextStepId: 'strength' },
        ],
      },
      {
        id: 'strength',
        speaker: 'Entrevistadora',
        promptEn: 'What is one of your strengths?',
        hintEs: 'Menciona una habilidad de forma sencilla.',
        options: [
          { id: 'a', text: 'I listen carefully and I learn quickly.', nextStepId: 'availability' },
          { id: 'b', text: 'I am organized and I enjoy teamwork.', nextStepId: 'availability' },
        ],
      },
      {
        id: 'availability',
        speaker: 'Entrevistadora',
        promptEn: 'When can you start?',
        hintEs: 'Expresa tu disponibilidad.',
        options: [
          { id: 'a', text: 'I can start next Monday.', nextStepId: 'goodbye' },
          { id: 'b', text: 'I am available next week.', nextStepId: 'goodbye' },
        ],
      },
      {
        id: 'goodbye',
        speaker: 'Entrevistadora',
        promptEn: 'Thank you for your time. We will contact you soon.',
        hintEs: '¡Misión completada! Te presentaste y explicaste tu experiencia y disponibilidad.',
        options: [],
      },
    ],
  },
];

/** Provisional game rules from the supplied specification; calibration is pending. */
export const challengeLevels = [
  {
    level: 1,
    name_es: 'Primeros pasos',
    hearts: 5,
    grammar_rush_total_seconds: 180,
    grammar_rush_questions: 10,
    difficulty_tier: 'intro',
    reading_clock_multiplier: 1.7,
    cloze_clock_multiplier: 1.5,
  },
  {
    level: 2,
    name_es: 'Explorador',
    hearts: 5,
    grammar_rush_total_seconds: 160,
    grammar_rush_questions: 10,
    difficulty_tier: 'intro',
    reading_clock_multiplier: 1.642,
    cloze_clock_multiplier: 1.458,
  },
  {
    level: 3,
    name_es: 'Aprendiz',
    hearts: 4,
    grammar_rush_total_seconds: 150,
    grammar_rush_questions: 10,
    difficulty_tier: 'intro',
    reading_clock_multiplier: 1.583,
    cloze_clock_multiplier: 1.417,
  },
  {
    level: 4,
    name_es: 'Aventurero',
    hearts: 4,
    grammar_rush_total_seconds: 140,
    grammar_rush_questions: 10,
    difficulty_tier: 'intermediate',
    reading_clock_multiplier: 1.525,
    cloze_clock_multiplier: 1.375,
  },
  {
    level: 5,
    name_es: 'Competidor',
    hearts: 4,
    grammar_rush_total_seconds: 130,
    grammar_rush_questions: 10,
    difficulty_tier: 'intermediate',
    reading_clock_multiplier: 1.467,
    cloze_clock_multiplier: 1.333,
  },
  {
    level: 6,
    name_es: 'Experto',
    hearts: 3,
    grammar_rush_total_seconds: 120,
    grammar_rush_questions: 10,
    difficulty_tier: 'intermediate',
    reading_clock_multiplier: 1.408,
    cloze_clock_multiplier: 1.292,
  },
  {
    level: 7,
    name_es: 'Maestro',
    hearts: 3,
    grammar_rush_total_seconds: 110,
    grammar_rush_questions: 10,
    difficulty_tier: 'intermediate',
    reading_clock_multiplier: 1.35,
    cloze_clock_multiplier: 1.25,
  },
  {
    level: 8,
    name_es: 'Veterano',
    hearts: 3,
    grammar_rush_total_seconds: 100,
    grammar_rush_questions: 10,
    difficulty_tier: 'advanced',
    reading_clock_multiplier: 1.292,
    cloze_clock_multiplier: 1.208,
  },
  {
    level: 9,
    name_es: 'Élite',
    hearts: 2,
    grammar_rush_total_seconds: 95,
    grammar_rush_questions: 10,
    difficulty_tier: 'advanced',
    reading_clock_multiplier: 1.233,
    cloze_clock_multiplier: 1.167,
  },
  {
    level: 10,
    name_es: 'Campeón',
    hearts: 2,
    grammar_rush_total_seconds: 90,
    grammar_rush_questions: 10,
    difficulty_tier: 'advanced',
    reading_clock_multiplier: 1.175,
    cloze_clock_multiplier: 1.125,
  },
  {
    level: 11,
    name_es: 'Leyenda',
    hearts: 2,
    grammar_rush_total_seconds: 75,
    grammar_rush_questions: 10,
    difficulty_tier: 'extreme',
    reading_clock_multiplier: 1.117,
    cloze_clock_multiplier: 1.083,
  },
  {
    level: 12,
    name_es: 'Imparable',
    hearts: 1,
    grammar_rush_total_seconds: 65,
    grammar_rush_questions: 10,
    difficulty_tier: 'extreme',
    reading_clock_multiplier: 1.058,
    cloze_clock_multiplier: 1.042,
  },
  {
    level: 13,
    name_es: 'Invencible',
    hearts: 1,
    grammar_rush_total_seconds: 55,
    grammar_rush_questions: 10,
    difficulty_tier: 'extreme',
    reading_clock_multiplier: 1.0,
    cloze_clock_multiplier: 1.0,
  },
] as const;
