import type { AnswerKey, LearningError } from '@lingoquest/contracts';
import type { EventScenarioTurn } from '@lingoquest/course-pack';
import type { PrerequisiteReference } from '../../packages/course-pack/src/prerequisites';
import type { CourseExercise } from '../../packages/offline-engine/src';
import type { UnifiedEvidenceTarget } from '../../packages/offline-engine/src/learning-evidence';
import type { TravelExerciseStep } from '../../packages/offline-engine/src/travel-content';
import { cuscoLessons, g, p, refs, w, type CuscoTopic } from './cusco-lessons';

type Ref = PrerequisiteReference;
type Words = readonly (typeof w)[keyof typeof w][];
type Dimension = UnifiedEvidenceTarget['dimension'];
type Target = UnifiedEvidenceTarget;
type Fields = Pick<CourseExercise, 'type' | 'promptEs' | 'acceptedAnswers' | 'feedbackEs'> &
  Partial<
    Pick<
      CourseExercise,
      | 'options'
      | 'optionsLanguage'
      | 'correctOptionId'
      | 'passage'
      | 'sentence'
      | 'contextMismatch'
      | 'ungradable'
    >
  >;
type Item = {
  name: string;
  topic: CuscoTopic;
  requires: Ref[];
  targets: Target[];
  skill: NonNullable<CourseExercise['learning']>['skill'];
  evidence?: NonNullable<CourseExercise['learning']>['evidence'];
  fields: Fields;
  audio?: string;
  guided?: true;
  hint?: string;
  errors?: NonNullable<CourseExercise['learning']>['errorAnswers'];
  optionErrors?: NonNullable<CourseExercise['learning']>['optionErrors'];
  remediates?: LearningError[];
  turn?: EventScenarioTurn;
};

const target = (ref: Ref, dimension: Dimension): Target => ({ targetId: ref.id, dimension });
const grammar = (ref: Ref) => target(ref, 'grammar_production');

function item({
  name,
  topic,
  requires,
  targets,
  skill,
  evidence,
  fields,
  audio,
  guided,
  hint,
  errors,
  optionErrors,
  remediates,
  turn,
}: Item): TravelExerciseStep {
  const id = `cusco-${name}`;
  const conceptId = targets[0].targetId;
  return {
    id,
    type: 'exercise',
    lessonId: cuscoLessons[topic],
    situation: fields.promptEs,
    requires,
    targets,
    ...(audio && { audio, transcript: audio, listeningButton: 'Escuchar el mensaje' }),
    ...(hint && { hint }),
    ...(turn && { scenarioTurn: turn, requiredReply: true }),
    exercise: {
      ...fields,
      id,
      skillId: conceptId,
      difficulty: 2,
      learning: {
        conceptId,
        skill,
        contextId: `cusco.${name}`,
        evidence:
          evidence ??
          (skill === 'grammar' && fields.type === 'short_text' ? 'production' : 'understanding'),
        ...(guided && { guided }),
        ...(errors && { errors: Object.keys(errors) as LearningError[], errorAnswers: errors }),
        ...(optionErrors && { errors: [...new Set(Object.values(optionErrors))], optionErrors }),
        ...(remediates && { remediates }),
      },
    },
  };
}

type Choice = Omit<Item, 'fields' | 'skill' | 'targets' | 'requires'> & {
  reference: Ref;
  words: Words;
  rules: Ref[];
  prompt: string;
  options: string[];
  correct: number;
  feedback: string;
  passage?: string;
  sentence?: string;
};

function choice({
  reference,
  words,
  rules,
  prompt,
  options,
  correct,
  feedback,
  passage,
  sentence,
  ...input
}: Choice) {
  const skill = input.audio ? 'listening' : passage ? 'reading' : 'grammar';
  return item({
    ...input,
    skill,
    requires: refs(words, reference, ...rules),
    targets: [target(reference, skill === 'grammar' ? 'grammar_understanding' : skill)],
    fields: {
      type: 'single_choice',
      promptEs: prompt,
      acceptedAnswers: [options[correct]],
      optionsLanguage: 'es',
      correctOptionId: String(correct + 1),
      options: options.map((text, index) => ({ id: String(index + 1), text })),
      feedbackEs: feedback,
      ...(passage && { passage }),
      ...(sentence && { sentence }),
    },
  });
}

type Writing = Omit<Item, 'fields' | 'skill'> & {
  prompt: string;
  answers: string[];
  feedback: string;
  passage?: string;
  mismatch?: AnswerKey['contextMismatch'];
};

function writing({ prompt, answers, feedback, passage, mismatch, ...input }: Writing) {
  return item({
    ...input,
    skill: 'grammar',
    fields: {
      type: 'short_text',
      promptEs: prompt,
      acceptedAnswers: answers,
      feedbackEs: feedback,
      ...(passage && { passage }),
      ...(mismatch && { contextMismatch: mismatch }),
    },
  });
}

const mismatch = (answers: string[], feedbackEs: string): AnswerKey['contextMismatch'] => ({
  answers,
  feedbackEs,
});
const records = 'Sam was at the hotel. Luz was not at the hotel. She was at the park.';
const levels = ['Termina en /t/', 'Termina en /d/', 'Termina en /ɪd/'];
const whereabouts = [
  w.was,
  w.were,
  w.wasnt,
  w.werent,
  w.not,
  w.at,
  w.the,
  w.hotel,
  w.park,
  w.market,
  w.she,
  w.we,
];
const regularOrderWords = [
  w.we,
  w.the,
  w.to,
  w.first,
  w.then,
  w.plaza,
  w.hotel,
  w.visited,
  w.walked,
  w.and,
];
const sequenceWords = [
  w.we,
  w.the,
  w.to,
  w.before,
  w.after,
  w.market,
  w.plaza,
  w.lunch,
  w.ate,
  w.went,
  w.bought,
  w.bread,
];
const regularRules = [g.regular, p.regular];
const irregularRules = [g.irregular, p.irregular];
const beRules = [g.be, p.be, p.beNegative];
const didRules = [g.ask, p.ask, p.wh, p.negative];

export const beChecks = [
  choice({
    name: 'be-listen',
    topic: 'be',
    reference: g.be,
    words: [...whereabouts, w.atSix, w.lastNight],
    rules: [p.be],
    audio: 'Sam was at the park at six last night. Luz was at the hotel.',
    prompt: 'Escucha el mensaje de Sam. ¿Dónde estaban él y Luz a las seis de anoche?',
    options: [
      'Sam en el hotel y Luz en el parque.',
      'Sam en el parque y Luz en el hotel.',
      'Los dos en el mercado.',
    ],
    correct: 1,
    feedback: 'Sam dijo at the park. Luz estaba at the hotel.',
  }),
  choice({
    name: 'be-read',
    topic: 'be',
    reference: g.be,
    words: whereabouts,
    rules: beRules,
    passage: records,
    prompt: 'Lee las notas del hotel. ¿Quién no estaba allí?',
    options: ['Sam', 'Sam y Luz', 'Luz'],
    correct: 2,
    feedback: 'Was not indica que Luz no estaba en el hotel.',
  }),
  writing({
    name: 'be-compare-write',
    topic: 'be',
    requires: refs(whereabouts, ...beRules),
    targets: [grammar(g.be), target(p.be, 'writing')],
    prompt: 'Escribe dos notas. Sam estaba en el hotel. Nosotros no estábamos en el mercado.',
    answers: [
      "Sam was at the hotel. We weren't at the market.",
      "We weren't at the market. Sam was at the hotel.",
    ],
    mismatch: mismatch(
      ['Sam was at the hotel. We were at the market.'],
      'La segunda nota dice que el grupo no estaba en el mercado.',
    ),
    feedback: 'Sam usa was. La nota con we es negativa: weren’t o were not.',
    errors: { past_be: ["Sam were at the hotel. We wasn't at the market."] },
  }),
  writing({
    name: 'be-question-write',
    topic: 'be',
    requires: refs(
      [w.was, w.were, w.the, w.at, w.market, w.where, w.you, w.yesterday],
      g.be,
      p.beQuestion,
    ),
    targets: [grammar(p.beQuestion), target(p.beQuestion, 'writing')],
    prompt: 'Hazle dos preguntas a Nora. Pregunta dónde estaba ayer y si Sam estaba en el mercado.',
    answers: [
      'Where were you yesterday? Was Sam at the market?',
      'Was Sam at the market? Where were you yesterday?',
      'Where were you yesterday? Was Sam at the market yesterday?',
    ],
    feedback:
      'Para preguntar por el lugar usa Where were you. Para una pregunta de sí o no con Sam, empieza con Was.',
    errors: { past_be: ['Where did you were yesterday? Did Sam was at the market?'] },
  }),
];

const regularLog =
  'First, Luz called Sam. Then they visited the plaza. Then they walked to the hotel.';
export const regularChecks = [
  choice({
    name: 'regular-read',
    topic: 'regular',
    reference: g.regular,
    words: [...regularOrderWords, w.called, w.they],
    rules: [p.regular, p.sequence],
    passage: regularLog,
    prompt: '¿Qué hizo Luz primero?',
    options: ['Caminó al hotel.', 'Llamó a Sam.', 'Visitó la plaza.'],
    correct: 1,
    feedback: 'First aparece con called. La llamada ocurrió primero.',
  }),
  choice({
    name: 'regular-listen',
    topic: 'regular',
    reference: g.regular,
    words: [...regularOrderWords, w.called, w.they],
    rules: [p.regular, p.sequence],
    audio: 'First, Luz called Diego. Then they walked to the plaza. Then they visited the hotel.',
    prompt: 'Escucha el mensaje y elige el orden de las tres acciones.',
    options: [
      'Llamaron a Diego, caminaron a la plaza y visitaron el hotel.',
      'Visitaron el hotel, llamaron a Diego y caminaron a la plaza.',
      'Caminaron a la plaza, visitaron el hotel y llamaron a Diego.',
    ],
    correct: 0,
    feedback: 'Escucha called primero, después walked y por último visited.',
  }),
  writing({
    name: 'regular-order-write',
    topic: 'regular',
    requires: refs(regularOrderWords, ...regularRules, g.sequence, p.sequence),
    targets: [grammar(g.regular), target(p.sequence, 'writing')],
    prompt:
      'La nota dice que visitamos la plaza primero y después caminamos al hotel. Escribe las dos acciones en inglés y usa then.',
    answers: [
      'First, we visited the plaza. Then we walked to the hotel.',
      'We visited the plaza. Then we walked to the hotel.',
      'We visited the plaza, and then we walked to the hotel.',
      'First we visited the plaza and then we walked to the hotel.',
    ],
    feedback: 'Usa visited y walked. Then enlaza la primera acción con la siguiente.',
    mismatch: mismatch(
      ['First, we walked to the hotel. Then we visited the plaza.'],
      'El orden del diario empieza con la visita a la plaza.',
    ),
  }),
];

function sounds(name: string, word: (typeof w)[keyof typeof w], correct: number, guided?: true) {
  return choice({
    name,
    topic: 'regular',
    reference: [g.endingT, g.endingD, g.endingId][correct],
    words: [word],
    rules: [g.endings],
    prompt: 'Escucha la palabra. ¿Qué sonido oyes al final?',
    options: levels,
    correct,
    audio: word[1].en,
    feedback: `Escucha la última parte: ${levels[correct].toLowerCase()}.`,
    optionErrors: Object.fromEntries(
      levels.flatMap((_, index) => (index === correct ? [] : [[String(index + 1), 'past_ending']])),
    ),
    ...(guided && {
      guided,
      remediates: ['past_ending'],
      hint: 'Fíjate si se agrega una sílaba. Si no se agrega, compara el último sonido con t y d.',
    }),
  });
}

export const endingChecks = [
  sounds('sound-t', w.finished, 0),
  sounds('sound-d', w.cleaned, 1),
  sounds('sound-id', w.wanted, 2),
];

const marketLog =
  'At nine, Sam went to the market. At ten, Luz bought bread. At noon, Diego ate lunch.';
export const irregularChecks = [
  choice({
    name: 'market-read',
    topic: 'irregular',
    reference: g.irregular,
    words: [...sequenceWords, w.at, w.nine, w.ten, w.noon],
    rules: [p.irregular, p.order, g.sequence],
    passage: marketLog,
    prompt: '¿Qué ocurrió después de la visita y antes del almuerzo?',
    options: ['Diego almorzó.', 'Luz compró pan.', 'Sam fue al mercado.'],
    correct: 1,
    feedback: 'Entre las nueve y el mediodía está la compra de las diez.',
  }),
  choice({
    name: 'market-listen',
    topic: 'irregular',
    reference: g.irregular,
    words: [...sequenceWords, w.at, w.nine, w.ten, w.noon],
    rules: [p.irregular, p.sequence],
    audio: 'At nine, Luz bought bread. At ten, Sam went to the plaza. At noon, Diego ate lunch.',
    prompt: 'Escucha la nota de otra salida. ¿En qué orden ocurrieron las tres acciones?',
    options: ['Mercado, almuerzo y plaza.', 'Plaza, pan y almuerzo.', 'Pan, plaza y almuerzo.'],
    correct: 2,
    feedback:
      'Bought bread fue primero, went to the plaza fue segundo y ate lunch fue al mediodía.',
  }),
  writing({
    name: 'market-irregular-write',
    topic: 'irregular',
    requires: refs(
      [...sequenceWords, w.saw, w.photo, w.a, w.tookPhoto, w.took],
      ...irregularRules,
      g.sequence,
      p.sequence,
    ),
    targets: [
      grammar(w.went[0]),
      grammar(w.bought[0]),
      grammar(w.saw[0]),
      target(p.irregular, 'writing'),
    ],
    prompt:
      'Escribe tres hechos en inglés. Sam fue al mercado. Luz compró pan. Sam vio a Diego. Puedes cambiar el orden en que los cuentas.',
    answers: [
      ...[
        ['Sam went to the market', 'Luz bought bread', 'Sam saw Diego'],
        ['Sam went to the market', 'Sam saw Diego', 'Luz bought bread'],
        ['Luz bought bread', 'Sam went to the market', 'Sam saw Diego'],
        ['Luz bought bread', 'Sam saw Diego', 'Sam went to the market'],
        ['Sam saw Diego', 'Sam went to the market', 'Luz bought bread'],
        ['Sam saw Diego', 'Luz bought bread', 'Sam went to the market'],
      ].map((facts) => facts.join('. ') + '.'),
    ],
    feedback: 'Usa went para ir, bought para comprar y saw para ver a alguien.',
  }),
  writing({
    name: 'market-before-after',
    topic: 'irregular',
    requires: refs(sequenceWords, ...irregularRules, g.sequence, p.order),
    targets: [grammar(g.sequence), target(p.order, 'writing')],
    prompt:
      'Usa before o after para relacionar estos hechos: fuimos al mercado primero y almorzamos después.',
    answers: [
      'We ate lunch after we went to the market.',
      'After we went to the market, we ate lunch.',
      'We went to the market before we ate lunch.',
      'Before we ate lunch, we went to the market.',
      'Before lunch, we went to the market.',
      'We went to the market before lunch.',
    ],
    mismatch: mismatch(
      [
        'We went to the market after we ate lunch.',
        'Before we went to the market, we ate lunch.',
        'We ate lunch before we went to the market.',
      ],
      'El mercado ocurrió antes que el almuerzo.',
    ),
    feedback: 'Encuentra qué evento sigue a before o after y compara su posición en el tiempo.',
    errors: { past_order: ['We went to the market after before lunch.'] },
  }),
];

type FormDrill = {
  name: string;
  topic: CuscoTopic;
  reference: Ref;
  words: Words;
  rules: Ref[];
  feedback: string;
  error: LearningError;
  samples: readonly [Sample, Sample, Sample];
};
type Sample = { en: string; prompt: string; wrong: string; more?: string[]; mismatch?: string[] };

function formPractice(drill: FormDrill, index: 0 | 1 | 2) {
  const { name, topic, reference, words, rules, feedback, error } = drill;
  const { en, prompt, wrong, more, mismatch: wrongContext } = drill.samples[index];
  const guide = index === 1;
  const role = index === 0 ? 'write' : guide ? 'guide' : 'confirm';
  return writing({
    name: `${name}-${role}`,
    topic,
    requires: refs(words, reference, ...rules),
    targets: [grammar(reference)],
    prompt,
    answers: [en, ...(more ?? [])],
    feedback,
    ...(wrongContext?.length && {
      mismatch: mismatch(
        wrongContext,
        'La forma es válida. Revisa la persona, el lugar o si el hecho ocurrió.',
      ),
    }),
    errors: { [error]: [wrong] },
    ...(guide && { guided: true, remediates: [error], hint: feedback }),
  });
}

const formDrills: FormDrill[] = [
  {
    name: 'was',
    topic: 'be',
    reference: w.was[0],
    words: whereabouts,
    rules: beRules,
    feedback: 'Con Sam, Luz, I, he o she, usa was.',
    error: 'past_be',
    samples: [
      {
        en: 'Sam was at the hotel.',
        prompt: 'Escribe que Sam estaba en el hotel.',
        wrong: 'Sam were at the hotel.',
        mismatch: ['Sam was at the park.', 'Luz was at the hotel.'],
      },
      {
        en: 'Luz was at the market.',
        prompt: 'Escribe que Luz estaba en el mercado.',
        wrong: 'Luz were at the market.',
      },
      {
        en: 'Nora was at the park.',
        prompt: 'Escribe que Nora estaba en el parque.',
        wrong: 'Nora were at the park.',
      },
    ],
  },
  {
    name: 'were',
    topic: 'be',
    reference: w.were[0],
    words: [...whereabouts, w.they, w.tired],
    rules: beRules,
    feedback: 'Con we, you o they, usa were.',
    error: 'past_be',
    samples: [
      {
        en: 'We were at the park.',
        prompt: 'Escribe que estábamos en el parque.',
        wrong: 'We was at the park.',
        mismatch: ['We were at the market.', "We weren't at the park."],
      },
      { en: 'They were tired.', prompt: 'Escribe que tenían cansancio.', wrong: 'They was tired.' },
      {
        en: 'They were at the hotel.',
        prompt: 'Escribe que ellos estaban en el hotel.',
        wrong: 'They was at the hotel.',
      },
    ],
  },
  {
    name: 'wasnt',
    topic: 'be',
    reference: w.wasnt[0],
    words: whereabouts,
    rules: beRules,
    feedback: 'Con un nombre singular, usa was not o wasn’t.',
    error: 'past_be',
    samples: [
      {
        en: "Luz wasn't at the hotel.",
        prompt: 'Escribe que Luz no estaba en el hotel.',
        wrong: "Luz weren't at the hotel.",
        mismatch: ['Luz was at the hotel.'],
      },
      {
        en: "Sam wasn't at the park.",
        prompt: 'Escribe que Sam no estaba en el parque.',
        wrong: "Sam weren't at the park.",
      },
      {
        en: "Ana wasn't at the market.",
        prompt: 'Escribe que Ana no estaba en el mercado.',
        wrong: "Ana weren't at the market.",
      },
    ],
  },
  {
    name: 'werent',
    topic: 'be',
    reference: w.werent[0],
    words: [...whereabouts, w.they, w.tired],
    rules: beRules,
    feedback: 'Con we, you o they, usa were not o weren’t.',
    error: 'past_be',
    samples: [
      {
        en: "We weren't at the market.",
        prompt: 'Escribe que no estábamos en el mercado.',
        wrong: "We wasn't at the market.",
        mismatch: ['We were at the market.'],
      },
      {
        en: "They weren't tired.",
        prompt: 'Escribe que ellos no estaban cansados.',
        wrong: "They wasn't tired.",
      },
      {
        en: "We weren't at the hotel.",
        prompt: 'Escribe que no estábamos en el hotel.',
        wrong: "We wasn't at the hotel.",
      },
    ],
  },
  {
    name: 'visited',
    topic: 'regular',
    reference: w.visited[0],
    words: [w.visit, w.we, w.visited, w.the, w.plaza, w.park, w.market],
    rules: regularRules,
    feedback: 'Visit termina en consonante. Agrega -ed y escribe visited.',
    error: 'past_spelling',
    samples: [
      {
        en: 'We visited the plaza.',
        prompt: 'Escribe que visitamos la plaza.',
        wrong: 'We visit the plaza.',
      },
      {
        en: 'Luz visited the market.',
        prompt: 'Escribe que Luz visitó el mercado.',
        wrong: 'Luz visit the market.',
      },
      {
        en: 'Nora visited the park.',
        prompt: 'Escribe que Nora visitó el parque.',
        wrong: 'Nora visit the park.',
      },
    ],
  },
  {
    name: 'studied',
    topic: 'regular',
    reference: w.studied[0],
    words: [w.study, w.studied, w.i, w.they, w.yesterday, w.lastNight],
    rules: regularRules,
    feedback: 'Study termina en consonante más y. Cambia la y por -ied: studied.',
    error: 'past_spelling',
    samples: [
      {
        en: 'I studied yesterday.',
        prompt: 'Escribe que estudiaste ayer.',
        wrong: 'I studyed yesterday.',
        more: ['Yesterday I studied.'],
      },
      {
        en: 'Sam studied last night.',
        prompt: 'Escribe que Sam estudió anoche.',
        wrong: 'Sam studyed last night.',
        more: ['Last night, Sam studied.'],
      },
      {
        en: 'They studied yesterday.',
        prompt: 'Escribe que ellos estudiaron ayer.',
        wrong: 'They studyed yesterday.',
        more: ['Yesterday, they studied.'],
      },
    ],
  },
  {
    name: 'arrived',
    topic: 'regular',
    reference: w.arrived[0],
    words: [w.arrive, w.arrived, w.i, w.at, w.the, w.hotel, w.park, w.plaza],
    rules: regularRules,
    feedback: 'Arrive termina en e. Agrega solo d para escribir arrived.',
    error: 'past_spelling',
    samples: [
      {
        en: 'I arrived at the hotel.',
        prompt: 'Escribe que llegaste al hotel.',
        wrong: 'I arriveed at the hotel.',
      },
      {
        en: 'Sam arrived at the park.',
        prompt: 'Escribe que Sam llegó al parque.',
        wrong: 'Sam arriveed at the park.',
      },
      {
        en: 'Diego arrived at the plaza.',
        prompt: 'Escribe que Diego llegó a la plaza.',
        wrong: 'Diego arriveed at the plaza.',
      },
    ],
  },
  {
    name: 'went',
    topic: 'irregular',
    reference: w.went[0],
    words: [w.go, w.went, w.we, w.the, w.to, w.market, w.plaza, w.hotel],
    rules: irregularRules,
    feedback: 'El pasado de go es went.',
    error: 'past_spelling',
    samples: [
      {
        en: 'We went to the market.',
        prompt: 'Escribe que fuimos al mercado.',
        wrong: 'We goed to the market.',
        mismatch: ['We went to the hotel.'],
      },
      {
        en: 'Luz went to the plaza.',
        prompt: 'Escribe que Luz fue a la plaza.',
        wrong: 'Luz goed to the plaza.',
      },
      {
        en: 'Ana went to the hotel.',
        prompt: 'Escribe que Ana fue al hotel.',
        wrong: 'Ana goed to the hotel.',
      },
    ],
  },
  {
    name: 'bought',
    topic: 'irregular',
    reference: w.bought[0],
    words: [w.buy, w.bought, w.bread, w.fruit],
    rules: irregularRules,
    feedback: 'El pasado de buy es bought.',
    error: 'past_spelling',
    samples: [
      {
        en: 'Luz bought bread.',
        prompt: 'Escribe que Luz compró pan.',
        wrong: 'Luz buyed bread.',
        mismatch: ['Luz bought fruit.', 'Sam bought bread.'],
      },
      {
        en: 'Sam bought fruit.',
        prompt: 'Escribe que Sam compró fruta.',
        wrong: 'Sam buyed fruit.',
      },
      {
        en: 'Nora bought bread.',
        prompt: 'Escribe que Nora compró pan.',
        wrong: 'Nora buyed bread.',
      },
    ],
  },
  {
    name: 'saw',
    topic: 'irregular',
    reference: w.saw[0],
    words: [w.see, w.saw, w.at, w.the, w.park, w.plaza],
    rules: irregularRules,
    feedback: 'Para decir que viste a alguien, usa saw, el pasado de see.',
    error: 'past_spelling',
    samples: [
      {
        en: 'Sam saw Diego.',
        prompt: 'Escribe que Sam vio a Diego.',
        wrong: 'Sam seed Diego.',
        mismatch: ['Diego saw Sam.'],
      },
      {
        en: 'Luz saw Nora at the plaza.',
        prompt: 'Escribe que Luz vio a Nora en la plaza.',
        wrong: 'Luz seed Nora at the plaza.',
      },
      {
        en: 'Ana saw Sam at the park.',
        prompt: 'Escribe que Ana vio a Sam en el parque.',
        wrong: 'Ana seed Sam at the park.',
      },
    ],
  },
  {
    name: 'took-photo',
    topic: 'irregular',
    reference: w.took[0],
    words: [
      w.take,
      w.takePhoto,
      w.took,
      w.tookPhoto,
      w.a,
      w.photo,
      w.i,
      w.at,
      w.the,
      w.plaza,
      w.hotel,
    ],
    rules: irregularRules,
    feedback: 'El pasado de take es took. Took a photo significa que hiciste una foto.',
    error: 'past_spelling',
    samples: [
      {
        en: 'I took a photo.',
        prompt: 'Escribe que sacaste una foto.',
        wrong: 'I taked a photo.',
        mismatch: ['Sam took a photo.'],
      },
      {
        en: 'Sam took a photo at the plaza.',
        prompt: 'Escribe que Sam sacó una foto en la plaza.',
        wrong: 'Sam taked a photo at the plaza.',
      },
      {
        en: 'Ana took a photo at the hotel.',
        prompt: 'Escribe que Ana sacó una foto en el hotel.',
        wrong: 'Ana taked a photo at the hotel.',
      },
    ],
  },
  {
    name: 'did-base',
    topic: 'ask',
    reference: g.ask,
    words: [
      w.you,
      w.did,
      w.buy,
      w.bread,
      w.the,
      w.take,
      w.a,
      w.photo,
      w.at,
      w.museum,
      w.go,
      w.to,
      w.market,
    ],
    rules: [p.ask],
    feedback: 'Forma una pregunta con Did, la persona y el verbo en su forma base.',
    error: 'did_base',
    samples: [
      {
        en: 'Did you go to the market?',
        prompt: 'Pregúntale a Diego si fue al mercado.',
        wrong: 'Did you went to the market?',
        mismatch: ['Did Luz go to the market?'],
      },
      {
        en: 'Did you buy bread?',
        prompt: 'Pregúntale a Luz si compró pan.',
        wrong: 'Did you bought bread?',
      },
      {
        en: 'Did Luz take a photo at the museum?',
        prompt: 'Pregúntale a Diego si Luz sacó una foto en el museo.',
        wrong: 'Did Luz took a photo at the museum?',
      },
    ],
  },
  {
    name: 'didnt-base',
    topic: 'ask',
    reference: p.negative,
    words: [w.didnt, w.didNot, w.buy, w.bread, w.coffee, w.go, w.to, w.the, w.i, w.she, w.market],
    rules: [g.ask],
    feedback: 'Después de didn’t o did not, usa el verbo base.',
    error: 'did_base',
    samples: [
      {
        en: "Sam didn't buy coffee.",
        prompt: 'Escribe que Sam no compró café.',
        wrong: "Sam didn't bought coffee.",
        mismatch: ['Sam bought coffee.'],
      },
      {
        en: "I didn't go to the market.",
        prompt: 'Escribe que no fuiste al mercado.',
        wrong: "I didn't went to the market.",
      },
      {
        en: "She didn't buy bread.",
        prompt: 'Escribe que ella no compró pan.',
        wrong: "She didn't bought bread.",
      },
    ],
  },
];

export const formChecks = (topic: CuscoTopic) =>
  formDrills.filter((drill) => drill.topic === topic).map((drill) => formPractice(drill, 0));
const photoVocabulary = [
  w.did,
  w.who,
  w.when,
  w.where,
  w.what,
  w.you,
  w.the,
  w.take,
  w.a,
  w.photo,
  w.takePhoto,
  w.tookPhoto,
  w.took,
  w.at,
  w.eleven,
  w.nine,
  w.ten,
  w.am,
  w.yesterday,
];
const museumVocabulary = [
  w.did,
  w.when,
  w.where,
  w.you,
  w.see,
  w.saw,
  w.at,
  w.the,
  w.museum,
  w.entrance,
  w.shop,
  w.three,
  w.four,
  w.pm,
  w.in,
];

function inquiry(museum: boolean) {
  const yesNo = [grammar(g.ask), grammar(p.ask), target(p.ask, 'writing')];
  const wh = [grammar(g.ask), grammar(p.wh), target(p.wh, 'writing')];
  const subject = [grammar(p.subject), target(p.subject, 'writing')];
  const all = [...yesNo, ...wh.filter((entry) => entry.targetId !== g.ask.id), ...subject];
  return writing({
    name: museum ? 'museum-inquire' : 'market-inquire',
    topic: 'ask',
    requires: refs(museum ? museumVocabulary : photoVocabulary, g.ask, p.ask, p.wh, p.subject),
    targets: all,
    evidence: museum ? 'transfer' : 'production',
    prompt: museum
      ? 'Escribe una pregunta en inglés para averiguar a qué hora Ana vio a Nora o en qué lugar del museo. Elige a quién le preguntas.'
      : 'Elige a alguien y escribe una pregunta en inglés. Averigua quién sacó la foto y a qué hora la sacó.',
    answers: museum
      ? ['When did Ana see Nora?', 'Where did Ana see Nora?']
      : ['Did you take the photo?', 'When did you take the photo?', 'Who took the photo?'],
    feedback: 'Comprueba que tu pregunta pide un dato del diario.',
    hint: museum
      ? 'Para pedir la hora, empieza con When. Para pedir el lugar, empieza con Where. Sigue con did, la persona y el verbo base.'
      : 'Usa Did al principio para comprobar quién realizó la acción. Empieza con When did para preguntar por la hora.',
    turn: {
      action: 'inquire',
      focusEventIds: [museum ? 'sighting' : 'photo'],
      targetForms: ['did-question', 'wh-question', 'subject-question'],
      formTargets: [
        { form: 'did-question', targets: yesNo },
        { form: 'wh-question', targets: wh },
        { form: 'subject-question', targets: subject },
      ],
    },
  });
}

function record(museum: boolean) {
  const word = museum ? w.saw[0] : w.took[0];
  const targets = [grammar(word), target(p.irregular, 'writing')];
  return writing({
    name: museum ? 'museum-record' : 'market-record',
    topic: museum ? 'ask' : 'irregular',
    requires: refs(museum ? museumVocabulary : photoVocabulary, ...irregularRules),
    targets,
    evidence: museum ? 'transfer' : 'production',
    prompt: museum
      ? 'Corrige la nota en inglés. Escribe a quién vio Ana, dónde y a qué hora. Incluye el lugar y la hora confirmados.'
      : 'Corrige la nota en inglés. Escribe quién sacó la foto y a qué hora.',
    answers: museum
      ? ['Ana saw Nora at the museum entrance at three.', 'At three, Ana saw Nora at the entrance.']
      : ['Luz took a photo at eleven.', 'At eleven, Luz took the photo.'],
    feedback: 'Comprueba el nombre, el verbo en pasado y los datos que confirmaste.',
    turn: {
      action: 'record',
      focusEventIds: [museum ? 'sighting' : 'photo'],
      targetForms: ['past-statement'],
      eventTargets: [{ eventId: museum ? 'sighting' : 'photo', targets }],
    },
  });
}

const museumRecord =
  'At two, Diego visited the museum. At three, Ana saw Nora at the entrance. At four, Nora left the museum.';
const museumSequence = choice({
  name: 'museum-sequence',
  topic: 'ask',
  reference: g.sequence,
  words: [w.at, w.the, w.two, w.three, w.four, w.visited, w.museum, w.saw, w.entrance, w.left],
  rules: [p.order, g.irregular, g.regular],
  passage: museumRecord,
  evidence: 'transfer',
  prompt: 'Lee la cronología del museo y elige el orden correcto.',
  options: [
    'Diego visita el museo, Ana ve a Nora y Nora sale.',
    'Nora sale, Diego visita el museo y Ana ve a Nora.',
    'Ana ve a Nora, Nora sale y Diego visita el museo.',
  ],
  correct: 0,
  feedback: 'Las horas ordenan los eventos: dos, tres y cuatro.',
});

export const marketExchange = [inquiry(false), record(false)];
export const museumExchange = [inquiry(true), record(true), museumSequence];

export const askChecks = [
  choice({
    name: 'did-read',
    topic: 'ask',
    reference: g.ask,
    words: [w.did, w.you, w.buy, w.coffee, w.no, w.i, w.didnt, w.bought, w.bread],
    rules: didRules,
    passage: "Nora: Did you buy coffee? Diego: No, I didn't. I bought bread.",
    prompt: 'Lee lo que contó Diego. ¿Qué es cierto?',
    options: ['Compró café.', 'Compró pan y café.', 'Compró pan y no compró café.'],
    correct: 2,
    feedback: 'No, I didn’t rechaza la compra del café. I bought bread confirma la compra de pan.',
  }),
  choice({
    name: 'did-listen',
    topic: 'ask',
    reference: p.wh,
    words: [
      w.when,
      w.did,
      w.you,
      w.arrive,
      w.i,
      w.arrived,
      w.at,
      w.nine,
      w.ten,
      w.where,
      w.the,
      w.plaza,
      w.no,
      w.market,
    ],
    rules: didRules,
    audio: 'When did you arrive? I arrived at nine. Where did you arrive? At the plaza.',
    prompt: 'Escucha las dos respuestas de Nora. ¿A qué hora y a qué lugar llegó?',
    options: ['A las diez, a la plaza.', 'A las nueve, a la plaza.', 'A las nueve, al mercado.'],
    correct: 1,
    feedback: 'La primera respuesta da la hora, at nine. La segunda da el lugar, at the plaza.',
  }),
  writing({
    name: 'did-what-write',
    topic: 'ask',
    requires: refs([w.what, w.did, w.buy], g.ask, p.wh),
    targets: [grammar(p.wh), target(p.wh, 'writing')],
    prompt: 'Pregúntale a Nora qué compró Diego en el mercado.',
    answers: ['What did Diego buy?'],
    feedback: 'Usa What did, el nombre de Diego y el verbo base buy.',
    mismatch: mismatch(['What did Nora buy?'], 'La pregunta es por lo que compró Diego.'),
    errors: { did_base: ['What did Diego bought?'] },
  }),
];

export const cuscoPractice = [
  ...formDrills.flatMap((drill) => [formPractice(drill, 1), formPractice(drill, 2)]),
  sounds('sound-review-t-guide', w.walked, 0, true),
  sounds('sound-review-d-guide', w.played, 1, true),
  sounds('sound-review-id-guide', w.visited, 2, true),
  sounds('sound-review-t-confirm', w.watched, 0),
  sounds('sound-review-d-confirm', w.called, 1),
  sounds('sound-review-id-confirm', w.needed, 2),
  writing({
    name: 'order-guide',
    topic: 'irregular',
    guided: true,
    remediates: ['past_order'],
    requires: refs(sequenceWords, g.sequence, p.order, ...irregularRules),
    targets: [grammar(g.sequence)],
    prompt: 'Compraste pan y luego almorzaste. Escribe «Almorcé después de comprar pan» usando we.',
    answers: ['We ate lunch after we bought bread.', 'After we bought bread, we ate lunch.'],
    feedback: 'After introduce el evento anterior en esta frase: compramos pan y luego almorzamos.',
    hint: 'Empieza con We ate lunch after y agrega la acción anterior en pasado.',
    errors: { past_order: ['We ate lunch before we bought bread.'] },
  }),
  writing({
    name: 'order-confirm',
    topic: 'irregular',
    requires: refs(sequenceWords, g.sequence, p.order, ...irregularRules),
    targets: [grammar(g.sequence)],
    prompt:
      'En una nueva salida fuimos a la plaza a las nueve y luego almorzamos. Une los dos hechos con before o after.',
    answers: [
      'We went to the plaza before we ate lunch.',
      'Before we ate lunch, we went to the plaza.',
      'We went to the plaza before lunch.',
      'We ate lunch after we went to the plaza.',
      'After we went to the plaza, we ate lunch.',
    ],
    feedback: 'La visita a la plaza ocurrió antes del almuerzo.',
    errors: { past_order: ['We ate lunch before we went to the plaza.'] },
  }),
  writing({
    name: 'photo-review',
    topic: 'irregular',
    requires: refs([...photoVocabulary, w.two, w.pm], ...irregularRules),
    targets: [grammar(w.took[0])],
    prompt: 'Lee el dato de otra foto y escribe la nota en inglés. Incluye la persona y la hora.',
    passage: 'Ana · 2:00 p.m. · photo',
    answers: [
      'Ana took a photo at two.',
      'At two, Ana took a photo.',
      'Ana took a photo at 2:00 p.m.',
    ],
    mismatch: mismatch(
      ['Sam took a photo at two.', 'Ana took a photo at eleven.'],
      'Revisa el nombre y la hora en la ficha.',
    ),
    feedback: 'Usa took y at para la acción pasada y la hora.',
    errors: { past_spelling: ['Ana take a photo at two.'] },
  }),
];
