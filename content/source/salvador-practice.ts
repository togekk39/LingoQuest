import type { LearningError } from '@lingoquest/contracts';
import type { PrerequisiteReference } from '../../packages/course-pack/src/prerequisites';
import type { CourseExercise } from '../../packages/offline-engine/src';
import { choose, requirements, target, write } from './salvador-assessments';
import { g, lessonIds, p, w, type SalvadorTopic } from './salvador-lessons';

type Ref = PrerequisiteReference;
type Repair = {
  name: string;
  topic: SalvadorTopic;
  error: LearningError;
  ref: Ref;
  guided: [string, string];
  independent: [string, string];
  feedback: string;
  wordForm?: true;
};

const repairs: Repair[] = [
  {
    name: 'be',
    topic: 'now',
    error: 'be_omission',
    ref: p.now,
    guided: ['Completa con be: She ___ cooking rice.', 'is'],
    independent: [
      'Sam tiene un libro abierto en casa. Escribe en inglés que Sam está leyendo un libro.',
      'Sam is reading a book.',
    ],
    feedback: 'Pon is entre el sujeto singular y la acción en -ing.',
  },
  {
    name: 'agreement',
    topic: 'now',
    error: 'be_agreement',
    ref: g.agreement,
    guided: ['Completa: They ___ preparing lunch.', 'are'],
    independent: [
      'Tus amigos leen libros en casa. Ahora mismo están leyendo. Escribe en inglés: ellos están leyendo.',
      'They are reading.',
    ],
    feedback: 'Con they se usa are. Con she, he o un nombre singular se usa is.',
  },
  {
    name: 'habit',
    topic: 'habit',
    error: 'tense',
    ref: g.habit,
    guided: ['Escribe: Jo normalmente pone la mesa.', 'Jo usually sets the table.'],
    independent: [
      'En otra casa, Luz suele cocinar arroz, pero hoy está preparando el almuerzo. Escribe el contraste.',
      'Luz usually cooks rice, but today she is making lunch.',
    ],
    feedback:
      'Un hábito puede llevar -s con un sujeto singular. Usa be + -ing para la acción en curso.',
  },
  {
    name: 'third',
    topic: 'habit',
    error: 'third_person',
    ref: g.third,
    guided: ['Completa: Rafa usually ___ rice. Usa cook.', 'cooks'],
    independent: [
      'En la biblioteca, Sam normalmente lee un libro. Escríbelo en inglés.',
      'Sam usually reads a book.',
    ],
    feedback: 'Un sujeto singular como Sam suele llevar -s o -es en presente simple.',
  },
  {
    name: 'state',
    topic: 'habit',
    error: 'habit_state',
    ref: g.state,
    guided: ['Completa: I ___ help today. Expresa que necesitas ayuda.', 'need'],
    independent: ['En casa dices que te gusta la sopa. Escríbelo en inglés.', 'I like soup.'],
    feedback: 'En estas expresiones, like y need suelen ir en presente simple.',
  },
  {
    name: 'question',
    topic: 'team',
    error: 'word_order',
    ref: g.question,
    guided: ['Ordena en una pregunta: what / you / are / doing.', 'What are you doing?'],
    independent: [
      'Luz fue a la sala comunitaria. Escribe una pregunta para averiguar qué hace Luz ahora.',
      'What is Luz doing?',
    ],
    feedback: 'Después de What, pon be antes del sujeto.',
  },
  {
    name: 'negative',
    topic: 'negative',
    error: 'progressive_negative',
    ref: p.negative,
    guided: ['Niega esta frase: Jo is cooking rice.', "Jo isn't cooking rice."],
    independent: ['En casa, Luz no está leyendo. Escríbelo en inglés.', "Luz isn't reading."],
    feedback: 'Usa is not o isn’t antes de la forma en -ing.',
  },
  {
    name: 'can-base',
    topic: 'can',
    error: 'can_base',
    ref: g.canBase,
    guided: ['Completa: Can she ___ rice? Usa cook.', 'cook'],
    independent: [
      'En otra cocina, pregunta si Rafa sabe lavar las verduras.',
      'Can Rafa wash the vegetables?',
    ],
    feedback: 'Después de can va el verbo base sin -s ni -ing.',
  },
  {
    name: 'availability',
    topic: 'can',
    error: 'team_availability',
    ref: g.availability,
    guided: [
      'Sam sabe cocinar arroz y ahora está ocupado. Escribe que no puede ayudar ahora.',
      "Sam can't help right now.",
    ],
    independent: [
      'En la biblioteca, Nina sabe mover una mesa, pero está ocupada. Escribe que sabe mover la mesa y ahora no puede ayudar.',
      "Nina can move the table, but she can't help right now.",
    ],
    feedback: 'Usa can para la capacidad y can’t help right now para la disponibilidad.',
  },
  {
    name: 'status',
    topic: 'team',
    error: 'team_state',
    ref: g.team,
    guided: [
      'En la cocina, Jo está cortando el pan. Comunica quién está cortando el pan.',
      'Jo is cutting the bread.',
    ],
    independent: [
      'En la biblioteca, Luz está leyendo las etiquetas y Sam mueve la mesa. Escribe qué está haciendo Sam.',
      'Sam is moving the table.',
    ],
    feedback: 'Verifica primero el nombre y después la tarea en curso.',
  },
  {
    name: 'order',
    topic: 'team',
    error: 'team_order',
    ref: g.order,
    guided: [
      'Da dos instrucciones. Primero corta el pan y luego pon los tazones en la mesa.',
      'First, cut the bread. Then put the bowls on the table.',
    ],
    independent: [
      'En otra sala, las etiquetas van sobre la mesa. Primero hay que mover la mesa. Escribe los dos pasos.',
      'First, move the table. Then put the labels on the table.',
    ],
    feedback: 'La tarea que deja todo listo va con first. La que sigue va con then.',
  },
  ...(
    [
      [
        'washing',
        w.washing,
        'wash',
        'Luz is washing the cups.',
        'En un café, Luz está lavando las tazas. Escríbelo.',
      ],
      [
        'cooking',
        w.cooking,
        'cook',
        'Luz is cooking at home.',
        'Luz está cocinando en casa. Escríbelo.',
      ],
      [
        'making',
        w.making,
        'make',
        'Sam is making soup.',
        'En un café, Sam está preparando sopa. Escríbelo.',
      ],
      [
        'reading',
        w.reading,
        'read',
        'Bia is reading a book.',
        'En una biblioteca, Bia está leyendo un libro. Escríbelo.',
      ],
      [
        'cutting',
        w.cutting,
        'cut',
        'Luz is cutting the bread.',
        'En otra cocina, Luz está cortando el pan. Escríbelo.',
      ],
      [
        'stirring',
        w.stirring,
        'stir',
        'Sam is stirring the soup.',
        'En otra cocina, Sam está revolviendo la sopa. Escríbelo.',
      ],
      [
        'putting',
        w.putting,
        'put',
        'Bia is putting the cups on the table.',
        'En otra sala, Bia está poniendo las tazas en la mesa. Escríbelo.',
      ],
      [
        'setting',
        w.setting,
        'set',
        'Luz is setting the table.',
        'En casa, Luz está poniendo la mesa. Escríbelo.',
      ],
      [
        'moving',
        w.moving,
        'move',
        'Bia is moving the table.',
        'En otra sala, Bia está moviendo la mesa. Escríbelo.',
      ],
      [
        'hanging',
        w.hanging,
        'hang',
        'Luz is hanging the pictures.',
        'En su casa, Luz está colgando las imágenes. Escríbelo.',
      ],
    ] as const
  ).map(([name, word, base, model, prompt]): Repair => ({
    name,
    topic: 'now',
    error: 'progressive_spelling',
    ref: word.teaches[0],
    wordForm: true,
    guided: [`Escribe la forma en -ing de ${base}.`, word.term],
    independent: [prompt, model],
    feedback: `La forma en -ing de ${base} se escribe ${word.term}.`,
  })),
];

function repairItem(
  { name, topic, error, ref, guided, independent, feedback, wordForm }: Repair,
  guide: boolean,
) {
  const [prompt, model] = guide ? guided : independent;
  const accepted = [
    model,
    ...(!guide && model.includes(" isn't ") ? [model.replace(" isn't ", ' is not ')] : []),
    ...(!guide && model.includes(" can't ") ? [model.replace(" can't ", ' cannot ')] : []),
    ...(!guide && model.includes('. Then ') ? [model.replace('. Then ', '. Next ')] : []),
  ];
  const item = write(
    `repair-${name}-${guide ? 'guide' : 'check'}`,
    topic,
    prompt,
    accepted,
    feedback,
    wordForm ? p.now : ref,
    {
      ...(guide ? { guided: true as const } : { review: true as const }),
      extra: [...(wordForm ? [ref, g.spelling] : []), ...(guide ? requirements([prompt], []) : [])],
      remediates: [error],
    },
  );
  if (wordForm) item.targets = [target(ref, 'vocabulary_recall')];
  return item;
}

export const salvadorPractice = [
  ...repairs.flatMap((item) => [repairItem(item, true), repairItem(item, false)]),
  choose(
    'repair-polarity-guide',
    'can',
    g.canPolarity,
    'Escucha. ¿Escuchas que sí puede o que no puede?',
    ['Sí puede.', 'No puede.'],
    0,
    'La frase dice I can help. Escucha toda la frase otra vez.',
    { guided: true, audio: 'I can help.', extra: [p.can], remediates: ['can_polarity'] },
  ),
  choose(
    'repair-polarity-check',
    'can',
    g.canPolarity,
    'En la biblioteca, ¿quién puede mover la mesa?',
    ['Sam.', 'Bia.'],
    1,
    'Sam dice que no puede. Bia sí puede mover la mesa.',
    {
      audio: "Sam can't move the table. Bia can move the table.",
      extra: [p.can],
      remediates: ['can_polarity'],
      review: true,
    },
  ),
  write(
    'review-negative-can',
    'can',
    'En otro grupo, Luz no sabe cocinar arroz. Escríbelo en inglés.',
    ["Luz can't cook rice.", 'Luz cannot cook rice.'],
    'Usa can’t seguido de cook en forma base.',
    p.can,
    { review: true, extra: [g.can, g.canBase] },
  ),
  write(
    'review-ability',
    'can',
    'Pregunta si Sam sabe preparar el almuerzo.',
    ['Can Sam make lunch?'],
    'Después de can y el sujeto va make.',
    p.can,
    { review: true, extra: [g.can, g.canBase] },
  ),
  write(
    'review-agreement-i',
    'now',
    'Estás cocinando arroz en casa. Escribe qué estás haciendo.',
    ['I am cooking rice at home.', "I'm cooking rice at home."],
    'Usa am con I y el verbo en -ing.',
    p.i,
    { review: true, extra: [g.agreement, g.firstPerson] },
  ),
  write(
    'review-request',
    'can',
    'Pídele a Luz que lave las tazas para una merienda.',
    ['Can you wash the cups, please?', 'Can you wash the cups?', 'Luz, can you wash the cups?'],
    'La petición usa Can you y el verbo en forma base.',
    p.request,
    { review: true, extra: [g.canBase] },
  ),
];

const prompts = [
  {
    topic: 'now',
    ref: p.now,
    grammar: g.now,
    pattern: p.now,
    readingRef: g.now,
    sentence: 'Bia ___ reading a book.',
    answers: ['is', 'are'],
    passage: 'Sam is preparing lunch. Bia is reading a book.',
    question: '¿Quién está preparando el almuerzo?',
    choices: ['Sam.', 'Bia.'],
    feedback: 'Bia usa is. Sam es quien está preparando el almuerzo.',
  },
  {
    topic: 'habit',
    ref: g.habit,
    grammar: g.habit,
    pattern: p.habit,
    readingRef: g.habit,
    sentence: 'Jo usually ___ the table, but today she is cooking rice.',
    answers: ['sets', 'setting'],
    passage: 'Luz usually sets the table. Today she is cooking rice.',
    question: '¿Qué cambió hoy?',
    choices: ['Hoy Luz cocina arroz.', 'Hoy Luz pone la mesa.'],
    feedback: 'Usually señala el hábito; is cooking, la tarea en curso.',
  },
  {
    topic: 'can',
    ref: p.request,
    grammar: g.can,
    pattern: p.request,
    readingRef: g.can,
    sentence: 'Can you ___ the vegetables, please?',
    answers: ['wash', 'washes'],
    passage: "Jo can't help right now. Luz can help.",
    question: '¿Quién puede ayudar ahora?',
    choices: ['Luz.', 'Jo.'],
    feedback: 'Después de Can you usa el verbo base. Luz puede ayudar ahora.',
  },
  {
    topic: 'team',
    ref: g.order,
    grammar: g.order,
    pattern: p.order,
    readingRef: g.order,
    sentence: '___, move the table. Then put the cups on the table.',
    answers: ['First', 'Next'],
    passage: 'First, put the bowls on the table. Then cut the bread.',
    question: '¿Cuál es el primer paso de esta nota?',
    choices: ['Poner los tazones en la mesa.', 'Cortar el pan.'],
    feedback: 'First indica el primer paso de la nota.',
  },
] satisfies {
  topic: SalvadorTopic;
  ref: Ref;
  grammar: Ref;
  pattern: Ref;
  readingRef: Ref;
  sentence: string;
  answers: string[];
  passage: string;
  question: string;
  choices: string[];
  feedback: string;
}[];

type Mode = 'grammar_rush' | 'cloze_battle' | 'reading_quest';
function challenge(mode: Mode, row: (typeof prompts)[number]) {
  const reading = mode === 'reading_quest';
  const cloze = mode === 'cloze_battle';
  const conceptId = (reading ? row.readingRef : row.ref).id;
  const options = reading ? row.choices : row.answers;
  const exercise: CourseExercise = {
    id: `challenge_salvador_${mode}_${row.topic}`,
    type: reading ? 'meaning' : cloze ? 'cloze' : 'single_choice',
    difficulty: 3,
    skillId: conceptId,
    requiredLessonIds: [lessonIds[row.topic]],
    promptEs: reading ? row.question : 'Completa la nota del equipo con la forma adecuada.',
    acceptedAnswers: [options[0]],
    feedbackEs: row.feedback,
    ...(reading
      ? { passage: row.passage, optionsLanguage: 'es' }
      : {
          sentence: row.sentence,
          dimension: cloze ? 'grammar_production' : 'grammar_understanding',
        }),
    ...(!cloze && {
      options: options.map((text, index) => ({ id: String(index + 1), text })),
      correctOptionId: '1',
    }),
    learning: {
      conceptId,
      contextId: `salvador.challenge.${mode}.${row.topic}`,
      skill: reading ? 'reading' : 'grammar',
      evidence: cloze ? 'production' : 'understanding',
    },
  };
  return {
    exercise,
    requires: requirements(
      reading ? [row.passage] : [row.sentence, ...(cloze ? options.slice(0, 1) : options)],
      [row.grammar, row.pattern],
    ),
  };
}
export const salvadorChallenges = {
  grammar_rush: prompts.map((row) => challenge('grammar_rush', row)),
  cloze_battle: prompts.map((row) => challenge('cloze_battle', row)),
  reading_quest: prompts.map((row) => challenge('reading_quest', row)),
};
