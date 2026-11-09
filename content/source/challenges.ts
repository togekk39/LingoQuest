import type { PrivateExercise } from './curriculum.ts';

/** Original local practice. All English comes from Units 1–2 or an explicit gloss.
 * Higher ranks shorten the clock/reduce hearts; they never smuggle later grammar
 * into a beginner's unlocked pool. This is not certified/ranked assessment. */
const learnedLessons = [
  'u01_l01',
  'u01_l02',
  'u01_l03',
  'u01_l04',
  'u02_l01',
  'u02_l02',
  'u02_l03',
  'u02_l04',
];
const base = 'grammar.routine_base';
const third = 'grammar.routine_third_person';
const frequency = 'grammar.frequency';
const time = 'grammar.routine_time';
const routineWords = [
  'u02_l01_v01',
  'u02_l01_v02',
  'u02_l01_v03',
  'u02_l01_v04',
  'u02_l01_v05',
  'u02_l01_v06',
  'u02_l01_v07',
  'u02_l01_v08',
];
const homeWords = [
  'u02_l02_v01',
  'u02_l02_v02',
  'u02_l02_v03',
  'u02_l02_v04',
  'u02_l02_v05',
  'u02_l02_v06',
];
const frequencyWords = [
  'u02_l03_v01',
  'u02_l03_v02',
  'u02_l03_v03',
  'u02_l03_v04',
  'u02_l03_v05',
  'u02_l03_v06',
];
const timeWords = [
  'u02_l04_v01',
  'u02_l04_v02',
  'u02_l04_v03',
  'u02_l04_v04',
  'u02_l04_v05',
  'u02_l04_v06',
  'u02_l04_v07',
  'u02_l04_v08',
];
const allWords = [...routineWords, ...homeWords, ...frequencyWords, ...timeWords];
// Wrong options are already taught forms, rather than unexplained new words.
type GrammarItem = readonly [
  sentence: string,
  answer: string,
  distractor: string,
  skill: string,
  explanation: string,
];
const grammarItems: readonly GrammarItem[] = [
  [
    'I ___ English every day.',
    'study',
    'studies',
    base,
    'Con I usamos study, sin -s: estudio inglés todos los días.',
  ],
  ['You ___ at home.', 'work', 'works', base, 'Con you usamos work: trabajas en casa.'],
  ['They ___ water.', 'drink', 'drinks', base, 'Con they usamos drink, sin -s: beben agua.'],
  ['I ___ every day.', 'walk', 'walks', base, 'Con I usamos walk: camino todos los días.'],
  [
    'She ___ English.',
    'studies',
    'study',
    third,
    'Con she, study cambia a studies: ella estudia inglés.',
  ],
  ['He ___ at home.', 'works', 'work', third, 'Con he agregamos -s: él trabaja en casa.'],
  [
    'My sister ___ dinner.',
    'cooks',
    'cook',
    third,
    'My sister equivale a she: cooks. Mi hermana cocina la cena.',
  ],
  [
    'My brother ___ every day.',
    'reads',
    'read',
    third,
    'My brother equivale a he: reads. Mi hermano lee todos los días.',
  ],
  [
    'I ___ eat dinner at home.',
    'always',
    'am',
    frequency,
    'Always va antes de eat y significa siempre.',
  ],
  [
    'She usually ___ water.',
    'drinks',
    'drink',
    third,
    'Usually no cambia la forma del verbo: she drinks.',
  ],
  [
    'They sometimes ___ together.',
    'eat',
    'eats',
    base,
    'Con they usamos eat, aunque haya sometimes: a veces comen juntos.',
  ],
  [
    'He never ___ at night.',
    'works',
    'work',
    third,
    'Never significa nunca. Con he mantenemos works.',
  ],
  ['I get up ___ six.', 'at', 'am', time, 'Para una hora usamos at: at six significa a las seis.'],
  [
    'I ___ breakfast at eight.',
    'have',
    'is',
    time,
    'Have breakfast significa desayunar: desayuno a las ocho.',
  ],
  [
    'I ___ home after work.',
    'go',
    'is',
    time,
    'Go home significa ir a casa: voy a casa después del trabajo.',
  ],
  [
    'They ___ dinner together.',
    'eat',
    'eats',
    base,
    'Con they usamos eat, sin -s. Together significa juntos.',
  ],
  [
    'My mother always ___ at home.',
    'cooks',
    'cook',
    third,
    'My mother equivale a she; always se coloca antes de cooks.',
  ],
  [
    'I usually ___ English at night.',
    'study',
    'studies',
    base,
    'Con I usamos study. At night significa por la noche.',
  ],
  [
    'My father sometimes ___ in the morning.',
    'reads',
    'read',
    third,
    'Con my father usamos reads. In the morning significa por la mañana.',
  ],
  [
    'You always ___ water in the morning.',
    'drink',
    'drinks',
    base,
    'You lleva drink: siempre bebes agua por la mañana.',
  ],
  [
    'She ___ at home every day.',
    'works',
    'work',
    third,
    'She lleva works. Every day señala una rutina.',
  ],
  [
    'They never ___ at night.',
    'study',
    'studies',
    base,
    'They lleva study. Never significa nunca.',
  ],
  [
    'I start work ___ eight.',
    'at',
    'are',
    time,
    'At eight significa a las ocho. Start work significa empezar a trabajar.',
  ],
  [
    'I have breakfast ___ six.',
    'at',
    'is',
    time,
    'La expresión para una hora es at six: a las seis.',
  ],
  [
    'My sister usually ___ dinner at home.',
    'eats',
    'eat',
    third,
    'My sister es singular: eats. Usually significa normalmente.',
  ],
  [
    'I always ___ home after work.',
    'go',
    'is',
    time,
    'Go home no lleva to. After work significa después del trabajo.',
  ],
  [
    'He ___ English every day.',
    'studies',
    'study',
    third,
    'Con he, study cambia a studies; every day significa todos los días.',
  ],
  [
    'You sometimes ___ dinner.',
    'cook',
    'cooks',
    base,
    'Con you usamos cook: a veces cocinas la cena.',
  ],
  [
    'My father ___ water in the morning.',
    'drinks',
    'drink',
    third,
    'My father equivale a he: drinks.',
  ],
  [
    'They usually ___ at home.',
    'work',
    'works',
    base,
    'Con they usamos work: normalmente trabajan en casa.',
  ],
  [
    'I ___ water at noon.',
    'drink',
    'drinks',
    time,
    'Con I usamos drink. At noon significa al mediodía.',
  ],
  [
    'My brother never ___ at night.',
    'cooks',
    'cook',
    third,
    'Never no elimina la -s: my brother cooks.',
  ],
  [
    'She always ___ English at home.',
    'studies',
    'study',
    third,
    'She always studies: always va antes de studies.',
  ],
  ['They ___ every day.', 'walk', 'walks', base, 'Con they usamos walk: caminan todos los días.'],
  [
    'I usually ___ water after work.',
    'drink',
    'drinks',
    base,
    'Con I usamos drink: normalmente bebo agua después del trabajo.',
  ],
  [
    'He sometimes ___ dinner at home.',
    'eats',
    'eat',
    third,
    'Con he usamos eats, aunque aparezca sometimes.',
  ],
  [
    'You ___ English in the morning.',
    'study',
    'studies',
    base,
    'Con you usamos study: estudias inglés por la mañana.',
  ],
  ['My mother ___ at home every day.', 'works', 'work', third, 'My mother equivale a she: works.'],
  [
    'I get up at six. I have breakfast ___ eight.',
    'at',
    'am',
    time,
    'Ambas horas usan at: a las seis y a las ocho.',
  ],
  [
    'They always ___ dinner together at home.',
    'eat',
    'eats',
    base,
    'They always eat: verbo base después del adverbio de frecuencia.',
  ],
];
function choices(answer: string, wrong: string, index: number) {
  const values = index % 2 ? [wrong, answer] : [answer, wrong];
  return {
    options: values.map((text, i) => ({ id: i ? 'b' : 'a', text })),
    correctOptionId: index % 2 ? 'b' : 'a',
    acceptedAnswers: [answer],
  };
}
const grammarRush: PrivateExercise[] = grammarItems.map(
  ([sentence, answer, wrong, skillId, feedbackEs], index) => ({
    id: `challenge_routine_${String(index + 1).padStart(2, '0')}`,
    type: 'single_choice',
    promptEs: 'Completa esta rutina con una forma que ya practicaste.',
    sentence,
    ...choices(answer, wrong, index),
    skillId,
    vocabularyIds: allWords,
    dimension: 'grammar_understanding',
    requiredLessonIds: learnedLessons,
    contextualGlosses: [
      { en: 'at', es: 'a (una hora); forma parte de at six y at eight' },
      { en: 'have', es: 'tener; en have breakfast significa desayunar' },
      { en: 'go', es: 'ir; en go home significa ir a casa' },
      { en: 'start work', es: 'empezar a trabajar' },
    ],
    feedbackEs,
    difficulty: Math.min(13, 1 + Math.floor(index / 3)),
  }),
);

type ReadingQuestion = readonly [
  promptEs: string,
  answer: string,
  wrong: string,
  feedbackEs: string,
];
const readingContexts: {
  id: string;
  difficulty: number;
  passage: string;
  glosses: { en: string; es: string }[];
  questions: ReadingQuestion[];
}[] = [
  {
    id: 'home',
    difficulty: 2,
    passage:
      'I am Ana. My sister is Eva. I work at home. Eva studies English every day. In the morning, I drink water. I have breakfast at eight. They eat dinner together at home.',
    glosses: [
      { en: 'Ana', es: 'nombre de una persona' },
      { en: 'Eva', es: 'nombre de una persona' },
    ],
    questions: [
      [
        '¿Quién estudia inglés todos los días?',
        'Eva',
        'Ana',
        'El texto dice Eva studies English every day.',
      ],
      ['¿Dónde trabaja Ana?', 'at home', 'at night', 'I work at home: Ana trabaja en casa.'],
      ['¿Qué bebe Ana por la mañana?', 'water', 'dinner', 'I drink water: Ana bebe agua.'],
      [
        '¿A qué hora desayuna Ana?',
        'at eight',
        'at six',
        'I have breakfast at eight: desayuna a las ocho.',
      ],
    ],
  },
  {
    id: 'family',
    difficulty: 7,
    passage:
      'My name is Leo. My mother works at home. My father studies English at night. My sister usually cooks dinner. I read in the morning. I get up at six. I go home after work. They eat dinner together.',
    glosses: [{ en: 'Leo', es: 'nombre de una persona' }],
    questions: [
      [
        '¿Quién trabaja en casa?',
        'My mother',
        'My father',
        'My mother works at home: la mamá de Leo trabaja en casa.',
      ],
      [
        '¿Cuándo estudia inglés el papá?',
        'at night',
        'in the morning',
        'My father studies English at night: estudia por la noche.',
      ],
      [
        '¿Quién cocina la cena normalmente?',
        'My sister',
        'My father',
        'My sister usually cooks dinner: la hermana cocina normalmente.',
      ],
      [
        '¿A qué hora se levanta Leo?',
        'at six',
        'at eight',
        'I get up at six: Leo se levanta a las seis.',
      ],
    ],
  },
  {
    id: 'neighbors',
    difficulty: 13,
    passage:
      'I am Sara. I usually walk in the morning. My friend is Ana. She works at home every day. She sometimes reads at night. I study English after work. I always drink water. I have breakfast at eight. They cook dinner at home.',
    glosses: [
      { en: 'Sara', es: 'nombre de una persona' },
      { en: 'Ana', es: 'nombre de una persona' },
    ],
    questions: [
      [
        '¿Cuándo suele caminar Sara?',
        'in the morning',
        'at night',
        'I usually walk in the morning: Sara suele caminar por la mañana.',
      ],
      [
        '¿Quién trabaja en casa todos los días?',
        'Ana',
        'Sara',
        'She works at home every day se refiere a Ana.',
      ],
      [
        '¿Qué hace Ana a veces por la noche?',
        'reads',
        'cooks',
        'She sometimes reads at night: a veces lee por la noche.',
      ],
      [
        '¿Cuándo estudia inglés Sara?',
        'after work',
        'at noon',
        'I study English after work: Sara estudia después del trabajo.',
      ],
    ],
  },
];
const readingQuest: PrivateExercise[] = readingContexts.flatMap((context) =>
  context.questions.map(([promptEs, answer, wrong, feedbackEs], index) => ({
    id: `challenge_reading_${context.id}_${index + 1}`,
    type: 'single_choice',
    promptEs,
    passage: context.passage,
    ...choices(answer, wrong, index),
    skillId: 'grammar.routine_base',
    vocabularyIds: allWords,
    dimension: 'grammar_understanding',
    requiredLessonIds: learnedLessons,
    contextualGlosses: context.glosses,
    feedbackEs,
    difficulty: context.difficulty,
  })),
);

type ClozeQuestion = readonly [
  sentence: string,
  answer: string,
  wrong: string,
  skillId: string,
  feedbackEs: string,
];
const clozeContexts: {
  id: string;
  difficulty: number;
  passage: string;
  questions: ClozeQuestion[];
}[] = [
  {
    id: 'morning',
    difficulty: 3,
    passage:
      'I [1] up at six. I have breakfast [2] eight. I [3] water in the morning. My sister [4] English every day. They [5] dinner together at home.',
    questions: [
      [
        'Espacio [1]: I ___ up at six.',
        'get',
        'is',
        time,
        'Get up significa levantarse: me levanto a las seis.',
      ],
      [
        'Espacio [2]: I have breakfast ___ eight.',
        'at',
        'am',
        time,
        'At eight significa a las ocho.',
      ],
      ['Espacio [3]: I ___ water in the morning.', 'drink', 'drinks', base, 'Con I usamos drink.'],
      [
        'Espacio [4]: My sister ___ English every day.',
        'studies',
        'study',
        third,
        'My sister equivale a she: studies.',
      ],
      [
        'Espacio [5]: They ___ dinner together at home.',
        'eat',
        'eats',
        base,
        'Con they usamos eat: comen la cena juntos en casa.',
      ],
    ],
  },
  {
    id: 'evening',
    difficulty: 8,
    passage:
      'My father [1] at home. My mother usually [2] dinner. I [3] English at night. I always [4] water. They sometimes [5] together after work.',
    questions: [
      [
        'Espacio [1]: My father ___ at home.',
        'works',
        'work',
        third,
        'My father equivale a he: works.',
      ],
      [
        'Espacio [2]: My mother usually ___ dinner.',
        'cooks',
        'cook',
        third,
        'My mother equivale a she: cooks.',
      ],
      [
        'Espacio [3]: I ___ English at night.',
        'study',
        'studies',
        base,
        'Con I usamos study, sin -s.',
      ],
      [
        'Espacio [4]: I always ___ water.',
        'drink',
        'drinks',
        base,
        'Always va antes del verbo; con I usamos drink.',
      ],
      [
        'Espacio [5]: They sometimes ___ together after work.',
        'walk',
        'walks',
        base,
        'They lleva walk. Together significa juntos.',
      ],
    ],
  },
  {
    id: 'week',
    difficulty: 13,
    passage:
      'I usually [1] up at six. My brother always [2] in the morning. I start work [3] eight. My sister never [4] at night. They [5] dinner together every day.',
    questions: [
      [
        'Espacio [1]: I usually ___ up at six.',
        'get',
        'is',
        time,
        'I usually get up: normalmente me levanto.',
      ],
      [
        'Espacio [2]: My brother always ___ in the morning.',
        'reads',
        'read',
        third,
        'My brother equivale a he: reads.',
      ],
      [
        'Espacio [3]: I start work ___ eight.',
        'at',
        'am',
        time,
        'At eight significa a las ocho. Start work significa empezar a trabajar.',
      ],
      [
        'Espacio [4]: My sister never ___ at night.',
        'works',
        'work',
        third,
        'Never no elimina la -s de works.',
      ],
      [
        'Espacio [5]: They ___ dinner together every day.',
        'eat',
        'eats',
        base,
        'Con they usamos eat. Every day significa todos los días.',
      ],
    ],
  },
];
const clozeBattle: PrivateExercise[] = clozeContexts.flatMap((context) =>
  context.questions.map(([sentence, answer, wrong, skillId, feedbackEs], index) => ({
    id: `challenge_cloze_${context.id}_${index + 1}`,
    type: 'cloze',
    promptEs: `Lee la rutina. Elige la forma para el espacio [${index + 1}].`,
    sentence: sentence.replace(/^Espacio \[\d+\]: /, ''),
    passage: context.passage,
    ...choices(answer, wrong, index),
    skillId,
    vocabularyIds: allWords,
    dimension: 'grammar_understanding',
    requiredLessonIds: learnedLessons,
    contextualGlosses: [
      { en: 'get', es: 'en get up significa levantarse' },
      { en: 'start work', es: 'empezar a trabajar' },
    ],
    feedbackEs,
    difficulty: context.difficulty,
  })),
);

export const challengePools: Record<
  'grammar_rush' | 'cloze_battle' | 'reading_quest',
  PrivateExercise[]
> = {
  grammar_rush: grammarRush,
  cloze_battle: clozeBattle,
  reading_quest: readingQuest,
};
