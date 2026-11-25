import type { PrivateExercise } from './curriculum.ts';
import { travelChallengePools } from './travel-challenges.ts';

// Ranks 1–8 use routines taught in Units 1–2. / Los niveles 1–8 usan rutinas de las unidades 1–2.
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
    'I ___ dinner at home.',
    'always eat',
    'eat always',
    frequency,
    'Con un verbo de acción, always suele ir antes del verbo: I always eat dinner at home.',
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
    base,
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
    'in',
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
const routineStages = [
  [1, 2, 3, 4, 34],
  [5, 6, 7, 8, 16],
  [13, 14, 15, 23, 24],
  [9, 10, 11, 12, 28],
  [17, 19, 20, 25, 30],
  [18, 21, 22, 26, 27],
  [29, 31, 32, 33, 37],
  [35, 36, 38, 39, 40],
];
const grammarRush: PrivateExercise[] = grammarItems.map(
  ([sentence, answer, wrong, skillId, feedbackEs], index) => ({
    id: `challenge_routine_${String(index + 1).padStart(2, '0')}`,
    type: 'single_choice',
    promptEs:
      index === 8
        ? 'Elige cómo decir «Siempre ceno en casa».'
        : 'Elige la forma que completa la oración.',
    sentence,
    ...choices(answer, wrong, index),
    skillId,
    vocabularyIds: allWords,
    dimension: 'grammar_understanding',
    requiredLessonIds: learnedLessons,
    feedbackEs,
    difficulty: routineStages.findIndex((items) => items.includes(index + 1)) + 1,
  }),
);

type ReadingQuestion = readonly [
  promptEs: string,
  answer: string,
  wrong: string,
  feedbackEs: string,
  skillId: string,
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
    difficulty: 1,
    passage:
      'I am Ana. My sister is Eva. I work at home. Eva studies English every day. In the morning, I drink water. I have breakfast at eight.',
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
        third,
      ],
      ['¿Dónde trabaja Ana?', 'at home', 'in Peru', 'I work at home: Ana trabaja en casa.', base],
      [
        '¿Qué hace Ana por la mañana?',
        'drinks water',
        'studies English',
        'I drink water: Ana toma agua. La que estudia es Eva.',
        base,
      ],
      [
        '¿A qué hora desayuna Ana?',
        'at eight',
        'at six',
        'I have breakfast at eight: desayuna a las ocho.',
        time,
      ],
    ],
  },
  {
    id: 'family',
    difficulty: 4,
    passage:
      'My name is Leo. My mother works at home. My father studies English at night. My sister usually cooks dinner. I get up at six. My sister gets up at eight. I go home after work.',
    glosses: [{ en: 'Leo', es: 'nombre de una persona' }],
    questions: [
      [
        '¿Quién trabaja en casa?',
        'My mother',
        'My father',
        'My mother works at home: la mamá de Leo trabaja en casa.',
        third,
      ],
      [
        '¿Cuándo estudia inglés el papá?',
        'at night',
        'in the morning',
        'My father studies English at night: estudia por la noche.',
        frequency,
      ],
      [
        '¿Quién cocina la cena normalmente?',
        'My sister',
        'My father',
        'My sister usually cooks dinner: la hermana cocina normalmente.',
        frequency,
      ],
      [
        '¿A qué hora se levanta Leo?',
        'at six',
        'at eight',
        'I get up at six: Leo se levanta a las seis.',
        time,
      ],
    ],
  },
  {
    id: 'neighbors',
    difficulty: 8,
    passage:
      'I am Sara. My friend Ana and I usually walk together in the morning. She works at home. I go home after work. I study English at night. Ana never studies at night, but she sometimes reads then. I have breakfast at eight. Ana starts work at eight.',
    glosses: [
      { en: 'Sara', es: 'nombre de una persona' },
      { en: 'Ana', es: 'nombre de una persona' },
      { en: 'but', es: 'pero' },
      { en: 'then', es: 'en ese momento' },
    ],
    questions: [
      [
        '¿Cuándo tienen Ana y Sara un hábito en común?',
        'in the morning',
        'at night',
        'Ana and I indica que caminan juntas. Lo hacen por la mañana.',
        frequency,
      ],
      [
        '¿A quién se refiere she en She works at home?',
        'Ana',
        'Sara',
        'Sara habla de sí misma con I. She works at home se refiere a Ana.',
        third,
      ],
      [
        '¿Qué hace Ana a veces por la noche en lugar de estudiar?',
        'reads',
        'studies',
        'Never indica que no estudia de noche; sometimes indica que a veces lee a esa hora.',
        frequency,
      ],
      [
        '¿Qué hace Ana mientras Sara desayuna?',
        'starts work',
        'reads',
        'Sara desayuna a las ocho. Ana empieza a trabajar a esa misma hora.',
        time,
      ],
    ],
  },
];
const readingQuest: PrivateExercise[] = readingContexts.flatMap((context) =>
  context.questions.map(([promptEs, answer, wrong, feedbackEs, skillId], index) => ({
    id: `challenge_reading_${context.id}_${index + 1}`,
    type: 'single_choice',
    promptEs,
    passage: context.passage,
    ...choices(answer, wrong, index),
    skillId,
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
  glosses?: { en: string; es: string }[];
}[] = [
  {
    id: 'morning',
    difficulty: 1,
    passage:
      'I [1] up at six. I have breakfast [2] eight. I [3] water in the morning. My sister [4] English every day. I [5] dinner at home.',
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
        'Espacio [5]: I ___ dinner at home.',
        'eat',
        'eats',
        base,
        'Con I usamos eat, sin -s: ceno en casa.',
      ],
    ],
  },
  {
    id: 'evening',
    difficulty: 4,
    passage:
      'My father [1] at home. My mother usually [2] dinner. I [3] English at night. I always [4] water. My mother and my father sometimes [5] together after work.',
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
        'Espacio [5]: My mother and my father sometimes ___ together after work.',
        'walk',
        'walks',
        base,
        'My mother and my father nombra a dos personas, así que usamos walk, sin -s.',
      ],
    ],
  },
  {
    id: 'week',
    difficulty: 8,
    passage:
      'I have breakfast at eight and I usually [1] up before breakfast. My brother always [2] in the morning. I start work [3] eight. My sister reads at night, but she never [4] in the morning. On Monday, my brother eats dinner at home and my sister eats at work. They [5] eat dinner together on Monday.',
    glosses: [
      { en: 'before breakfast', es: 'antes de desayunar' },
      { en: 'but', es: 'pero' },
      { en: 'on Monday', es: 'el lunes' },
      { en: 'at work', es: 'en el trabajo' },
    ],
    questions: [
      [
        'Espacio [1]: I usually ___ up before breakfast.',
        'get',
        'gets',
        time,
        'Get up significa «levantarse». Después de I usually va get, sin -s.',
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
        'in',
        time,
        'At eight significa a las ocho. Start work significa empezar a trabajar.',
      ],
      [
        'Espacio [4]: My sister reads at night, but she never ___ in the morning.',
        'reads',
        'read',
        third,
        'La oración contrasta cuándo lee la hermana: lee por la noche y nunca lee por la mañana.',
      ],
      [
        'Espacio [5]: They ___ eat dinner together on Monday.',
        'never',
        'always',
        frequency,
        'Los lunes él cena en casa y ella cena en el trabajo. Never expresa que no cenan juntos ese día.',
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
    contextualGlosses: context.glosses,
    feedbackEs,
    difficulty: context.difficulty,
  })),
);

export const challengePools: Record<
  'grammar_rush' | 'cloze_battle' | 'reading_quest',
  PrivateExercise[]
> = {
  grammar_rush: [...grammarRush, ...travelChallengePools.grammar_rush],
  cloze_battle: [...clozeBattle, ...travelChallengePools.cloze_battle],
  reading_quest: [...readingQuest, ...travelChallengePools.reading_quest],
};
