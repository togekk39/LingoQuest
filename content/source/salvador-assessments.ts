import type { LearningError } from '@lingoquest/contracts';
import type { TeamScenarioTurn } from '@lingoquest/course-pack';
import type { PrerequisiteReference } from '../../packages/course-pack/src/prerequisites';
import type { CourseExercise } from '../../packages/offline-engine/src';
import type { UnifiedEvidenceTarget } from '../../packages/offline-engine/src/learning-evidence';
import type { TravelExerciseStep } from '../../packages/offline-engine/src/travel-content';
import { g, lessonIds, p, refs, w, type SalvadorTopic } from './salvador-lessons';

type Ref = PrerequisiteReference;
type Target = UnifiedEvidenceTarget;
export const target = (ref: Ref, dimension: Target['dimension']): Target => ({
  targetId: ref.id,
  dimension,
});
const production = (ref: Ref) => target(ref, 'grammar_production');
const writing = (ref: Ref) => target(ref, 'writing');

export function requirements(text: readonly string[], rules: readonly Ref[]) {
  const tokens = (value: string) =>
    value
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .match(/[a-z]+(?:'[a-z]+)*/g) ?? [];
  const used = new Set(text.flatMap(tokens));
  const single = new Map(
    Object.values(w)
      .filter(({ term }) => tokens(term).length === 1)
      .map((entry) => [tokens(entry.term)[0], entry]),
  );
  const words = new Set(
    [...used].flatMap((token) => {
      const entry = single.get(token);
      return entry ? [entry] : [];
    }),
  );
  const input = text.map((value) => ` ${tokens(value).join(' ')} `);
  for (const entry of Object.values(w)) {
    const phrase = tokens(entry.term);
    if (phrase.length > 1 && input.some((line) => line.includes(` ${phrase.join(' ')} `)))
      words.add(entry);
  }
  return refs([...words], ...rules);
}

type Fields = Pick<CourseExercise, 'type' | 'promptEs' | 'acceptedAnswers' | 'feedbackEs'> &
  Partial<
    Pick<
      CourseExercise,
      | 'passage'
      | 'sentence'
      | 'options'
      | 'optionsLanguage'
      | 'correctOptionId'
      | 'ungradable'
      | 'contextMismatch'
      | 'communicationOnly'
    >
  >;
type Options = {
  extra?: Ref[];
  audio?: string;
  guided?: true;
  transfer?: true;
  turn?: TeamScenarioTurn;
  errors?: NonNullable<CourseExercise['learning']>['errorAnswers'];
  optionErrors?: NonNullable<CourseExercise['learning']>['optionErrors'];
  remediates?: LearningError[];
  hint?: string;
  review?: true;
};

function activity(
  name: string,
  topic: SalvadorTopic,
  fields: Fields,
  targets: Target[],
  options: Options,
): TravelExerciseStep {
  const id = `salvador-${name}`;
  const conceptId = targets[0].targetId;
  const skill = options.audio
    ? 'listening'
    : fields.options
      ? fields.passage
        ? 'reading'
        : 'grammar'
      : targets[0].dimension === 'writing'
        ? 'writing'
        : 'grammar';
  const errors = [
    ...new Set([
      ...(Object.keys(options.errors ?? {}) as LearningError[]),
      ...Object.values(options.optionErrors ?? {}),
      ...(options.turn?.errorTargets ?? []).map(({ error }) => error),
    ]),
  ];
  return {
    id,
    type: 'exercise',
    lessonId: lessonIds[topic],
    situation: fields.promptEs,
    targets,
    requires: requirements(
      [
        fields.passage ?? '',
        fields.sentence ?? '',
        ...(options.audio ? [options.audio] : []),
        ...(!fields.options ? fields.acceptedAnswers : []),
      ],
      options.extra ?? [],
    ),
    ...(options.review && { recommendUnverified: true }),
    ...(options.audio && {
      audio: options.audio,
      transcript: options.audio,
      listeningButton: 'Escuchar el mensaje',
    }),
    ...(options.turn && { scenarioTurn: options.turn, requiredReply: true }),
    ...(options.hint && { hint: options.hint }),
    exercise: {
      ...fields,
      id,
      skillId: conceptId,
      difficulty: 2,
      learning: {
        conceptId,
        contextId: `salvador.${name}`,
        skill,
        evidence: options.transfer
          ? 'transfer'
          : !fields.options && !options.audio
            ? 'production'
            : 'understanding',
        ...(errors.length && { errors }),
        ...(options.errors && { errorAnswers: options.errors }),
        ...(options.optionErrors && { optionErrors: options.optionErrors }),
        ...(options.remediates && { remediates: options.remediates }),
        ...(options.guided && { guided: true }),
      },
    },
  };
}

export function write(
  name: string,
  topic: SalvadorTopic,
  promptEs: string,
  acceptedAnswers: string[],
  feedbackEs: string,
  reference: Ref,
  options: Options = {},
  passage?: string,
  additional: Target[] = [],
) {
  return activity(
    name,
    topic,
    {
      type: 'short_text',
      promptEs,
      acceptedAnswers,
      feedbackEs,
      ...(passage && { passage }),
    },
    [production(reference), writing(reference), ...additional],
    {
      ...options,
      extra: [reference, ...(options.extra ?? [])],
    },
  );
}

export function choose(
  name: string,
  topic: SalvadorTopic,
  ref: Ref,
  promptEs: string,
  choices: string[],
  correct: number,
  feedbackEs: string,
  options: Options = {},
  passage?: string,
) {
  const answers = choices.map((text, index) => ({ id: String(index + 1), text }));
  return activity(
    name,
    topic,
    {
      type: 'single_choice',
      promptEs,
      optionsLanguage: 'es',
      options: answers,
      acceptedAnswers: [answers[correct].text],
      correctOptionId: answers[correct].id,
      feedbackEs,
      ...(passage && { passage }),
    },
    [target(ref, options.audio ? 'listening' : passage ? 'reading' : 'grammar_understanding')],
    {
      ...options,
      extra: [ref, ...(options.extra ?? [])],
    },
  );
}

const agreement = production(g.agreement);
const context = production(g.team);
const availability = production(g.availability);
const order = production(g.order);
const syntax = (ref: Ref) => [production(ref), writing(ref)];
const formChecks = {
  'progressive-positive': [...syntax(g.now), agreement],
  'progressive-negative': [...syntax(p.negative), production(g.negative), agreement],
  'progressive-question': syntax(g.question),
  'progressive-information': syntax(p.question),
  'progressive-yes-no': syntax(p.yesNo),
  habit: syntax(g.habit),
  'habit-contrast': [...syntax(g.habit), production(g.now), agreement],
  'ability-question': [...syntax(p.canQuestion), production(g.canBase)],
  'ability-positive': [...syntax(p.can), production(g.canBase)],
  'ability-negative': [...syntax(p.canNegative), production(g.canBase)],
  'help-request': [...syntax(p.request), production(g.canBase)],
  'availability-question': syntax(p.availability),
  'owner-question': [],
  'completion-question': [],
  'help-offer': syntax(g.offer),
  instruction: syntax(p.instruction),
  sequence: syntax(g.order),
  handover: [...syntax(p.handover), production(g.now), production(p.instruction), agreement],
} satisfies Record<TeamScenarioTurn['targetForms'][number], Target[]>;

type TeamOptions = Pick<
  TeamScenarioTurn,
  'descriptions' | 'confirmAny' | 'assign' | 'sequence' | 'handover' | 'event' | 'complete'
> & {
  mayUse?: TeamScenarioTurn['targetForms'];
  forms?: TeamScenarioTurn['targetForms'];
  terms?: Readonly<Record<string, Ref>>;
  extra?: Ref[];
  transfer?: true;
};
export function teamTurn(
  name: string,
  topic: SalvadorTopic,
  promptEs: string,
  samples: string[],
  pattern: Ref,
  { forms, mayUse, terms = {}, extra = [], transfer, ...goal }: TeamOptions,
) {
  const targetForms: TeamScenarioTurn['targetForms'] =
    forms ??
    (goal.assign
      ? ['help-request']
      : goal.sequence
        ? ['sequence']
        : goal.handover
          ? ['handover']
          : goal.confirmAny
            ? ['progressive-information', 'progressive-yes-no']
            : ['progressive-positive']);
  const supported = [...new Set([...targetForms, ...(mayUse ?? [])])];
  const formTargets = supported.flatMap((form) =>
    formChecks[form].length ? [{ form, targets: formChecks[form] as Target[] }] : [],
  );
  const taskTargets = Object.entries(terms).map(([taskId, form]) => ({
    taskId,
    targets: [target(form, 'vocabulary_recall')],
  }));
  const wrong = (
    error: LearningError,
    targets: Target[],
    form?: (typeof supported)[number],
    taskId?: string,
  ) => ({
    error,
    targets,
    ...(form && { form }),
    ...(taskId && { taskId }),
  });
  const errorTargets = [
    wrong('team_state', [context]),
    ...(goal.assign ? [wrong('team_availability', [availability])] : []),
    ...(goal.assign || goal.sequence || goal.handover ? [wrong('team_order', [order])] : []),
    ...supported.flatMap((form) => {
      switch (form) {
        case 'handover':
        case 'progressive-positive':
          return [
            wrong('be_omission', [production(g.now)], 'progressive-positive'),
            wrong('be_agreement', [agreement], 'progressive-positive'),
          ];
        case 'progressive-information':
        case 'progressive-yes-no': {
          const question = production(form === 'progressive-information' ? p.question : p.yesNo);
          return [
            wrong('be_omission', [question], form),
            wrong('word_order', [question], form),
            wrong('be_agreement', [agreement, question], form),
          ];
        }
        case 'progressive-negative':
          return [
            wrong('progressive_negative', [production(p.negative)], form),
            wrong('be_agreement', [agreement, production(p.negative)], form),
            wrong('be_omission', [production(p.negative)], form),
          ];
        case 'habit':
        case 'habit-contrast':
          return [
            wrong('third_person', [production(g.third)], form),
            wrong('tense', [production(g.habit)], form),
            wrong('be_agreement', [agreement], form),
            wrong('be_omission', [production(g.habit)], form),
          ];
        case 'ability-positive':
        case 'ability-negative':
        case 'ability-question':
        case 'help-request':
          return [wrong('can_base', [formChecks[form][0], production(g.canBase)], form)];
        default:
          return [];
      }
    }),
    ...Object.entries(terms).map(([task, form]) =>
      wrong('progressive_spelling', [target(form, 'vocabulary_recall')], undefined, task),
    ),
  ].filter(
    (entry, index, entries) =>
      entries.findIndex(
        (other) =>
          other.error === entry.error && other.form === entry.form && other.taskId === entry.taskId,
      ) === index,
  );
  const turn: TeamScenarioTurn = {
    action: 'team',
    targetForms,
    formTargets,
    taskTargets,
    errorTargets,
    ...goal,
  };
  const targets = [
    ...new Map(
      [{ targets: [writing(pattern)] }, ...formTargets, ...taskTargets, ...errorTargets]
        .flatMap(({ targets }) => targets)
        .map((entry) => [`${entry.targetId}:${entry.dimension}`, entry]),
    ).values(),
  ];
  const rules = [...Object.values(g), ...Object.values(p)];
  const mapped = targets.map(
    ({ targetId }) =>
      rules.find(({ id }) => id === targetId) ??
      Object.values(terms).find(({ id }) => id === targetId)!,
  );
  return activity(
    name,
    topic,
    {
      type: 'short_text',
      promptEs,
      acceptedAnswers: samples,
      feedbackEs: 'Comprueba la forma en inglés y lo que muestra el equipo.',
    },
    targets,
    {
      turn,
      transfer,
      extra: [pattern, ...mapped, ...extra],
      hint: goal.assign
        ? 'Usa Can you + verbo base para pedir ayuda a quien seleccionaste.'
        : goal.sequence
          ? 'Escribe una instrucción con First y otra con Then o Next.'
          : goal.confirmAny
            ? 'Empieza con What + is/are, o con Is/Are si esperas una respuesta de sí o no.'
            : 'Usa el sujeto, am/is/are y la forma del verbo en -ing.',
    },
  );
}

export const nowChecks = [
  choose(
    'hear-jo',
    'now',
    g.now,
    'Escucha a Jo. ¿Qué está haciendo?',
    ['Lava las verduras.', 'Prepara el almuerzo.', 'Cocina arroz.'],
    0,
    'I’m washing the vegetables indica una acción que Jo hace ahora.',
    { audio: "I'm washing the vegetables.", extra: [p.i] },
  ),
  choose(
    'hear-rafa',
    'now',
    g.now,
    'Escucha la actualización. ¿Qué está haciendo Rafa?',
    ['Lee un libro.', 'Cocina arroz.', 'Lava las verduras.'],
    1,
    'Rafa is cooking rice indica que Rafa está cocinando arroz.',
    { audio: 'Rafa is cooking rice.', extra: [p.now] },
  ),
  choose(
    'hear-sam',
    'now',
    g.now,
    'Escucha a Sam. ¿Qué está haciendo en casa?',
    ['Prepara el almuerzo.', 'Lee un libro.', 'Cocina arroz.'],
    1,
    'I’m reading a book significa que está leyendo un libro.',
    { audio: "I'm reading a book at home.", extra: [p.i] },
  ),
  choose(
    'read-current',
    'now',
    g.now,
    '¿Qué acción está en curso en la segunda nota?',
    ['El grupo prepara el almuerzo.', 'Jo lava las verduras.', 'El grupo lee en casa.'],
    0,
    'We’re preparing lunch describe lo que el grupo hace ahora.',
    { extra: [p.plural] },
    'Jo is washing the vegetables. We’re preparing lunch.',
  ),
  write(
    'make-lunch',
    'now',
    'Escribe que ella está preparando el almuerzo.',
    ['She is making lunch.', "She's making lunch."],
    'Usa is con she. Make pierde la e final en making.',
    p.now,
    {
      extra: [g.now, g.agreement, g.spelling, w.making.teaches[0]],
      errors: {
        progressive_spelling: ['She is makeing lunch.'],
        be_agreement: ['She are making lunch.'],
        be_omission: ['She making lunch.'],
      },
    },
    undefined,
    [production(g.agreement), target(w.making.teaches[0], 'vocabulary_recall')],
  ),
];

const habitPassage =
  'Jo usually sets the table. Today, she is washing the vegetables. Rafa usually washes the vegetables. Today, he is cooking rice.';
export const habitChecks = [
  choose(
    'read-routine',
    'habit',
    g.habit,
    '¿Qué hace Jo normalmente según el registro?',
    ['Pone la mesa.', 'Lava las verduras.', 'Cocina arroz.'],
    0,
    'Usually introduce la tarea habitual de Jo.',
    { extra: [g.third, p.now] },
    habitPassage,
  ),
  choose(
    'hear-routine',
    'habit',
    g.habit,
    '¿Qué hace Rafa normalmente y qué está haciendo hoy?',
    [
      'Normalmente lava verduras. Hoy cocina arroz.',
      'Normalmente cocina arroz. Hoy lava verduras.',
    ],
    0,
    'Usually señala la rutina. Today, he’s cooking rice indica el cambio.',
    {
      audio: "Rafa usually washes the vegetables, but today he's cooking rice.",
      extra: [g.third, p.now],
    },
  ),
  choose(
    'hear-today',
    'habit',
    g.habit,
    '¿En qué orden escuchas la acción en curso y la habitual?',
    ['Primero la habitual; después la actual.', 'Primero la actual; después la habitual.'],
    1,
    'Is washing indica lo que ocurre hoy. Usually sets indica la rutina.',
    {
      audio: 'Today Jo is washing the vegetables. She usually sets the table.',
      extra: [g.third, p.now],
    },
  ),
  choose(
    'state-today',
    'habit',
    g.state,
    '¿Qué dice Jo sobre lo que necesita hoy?',
    ['Necesita ayuda.', 'Está ayudando.', 'Conoce al equipo.'],
    0,
    'Need va en presente simple para decir qué necesitas incluso si mencionas today.',
    {},
    'I need help today.',
  ),
  write(
    'habit-rafa',
    'habit',
    'Redacta una sola frase para comparar lo habitual con lo que Rafa está haciendo hoy.',
    [
      "Rafa usually washes the vegetables, but today he's cooking rice.",
      'Rafa usually washes the vegetables, but today he is cooking rice.',
    ],
    'Con usually escribe washes. Para hoy escribe is cooking.',
    g.habit,
    { extra: [g.third, p.now] },
    habitPassage,
    [production(g.third), production(p.now)],
  ),
  write(
    'state-need',
    'habit',
    'Escribe en inglés que hoy necesitas ayuda.',
    ['I need help today.', 'Today I need help.'],
    'Need suele ir en presente simple para expresar una necesidad.',
    g.state,
    { errors: { habit_state: ['I am needing help today.'] } },
  ),
];

export const canChecks = [
  choose(
    'hear-cut',
    'can',
    g.canPolarity,
    'Escucha a Sam y a Luz. ¿Quién sabe cortar el pan?',
    ['Luz.', 'Sam.'],
    1,
    'Sam dice I can cut the bread. Luz dice I can’t cut the bread.',
    {
      audio: "Sam can cut the bread. Luz can't cut the bread.",
      extra: [p.can, g.canBase],
      optionErrors: { '1': 'can_polarity' },
    },
  ),
  choose(
    'hear-cook',
    'can',
    g.canPolarity,
    '¿Quién sabe cocinar arroz?',
    ['Jo.', 'Sam.'],
    0,
    'Jo can cook rice. Sam can’t cook rice.',
    {
      audio: "Jo can cook rice. Sam can't cook rice.",
      extra: [p.can, g.canBase],
      optionErrors: { '2': 'can_polarity' },
    },
  ),
  choose(
    'hear-help',
    'can',
    g.canPolarity,
    '¿Quién puede ayudar ahora?',
    ['Rafa.', 'Luz.'],
    1,
    'Can’t help right now indica que Rafa no puede ayudar ahora.',
    {
      audio: "Rafa can't help right now. Luz can help.",
      extra: [p.can, g.availability],
      optionErrors: { '1': 'can_polarity' },
    },
  ),
  choose(
    'read-helper',
    'can',
    g.can,
    '¿A quién puedes pedir que corte el pan ahora?',
    ['A Rafa.', 'A Sam.'],
    1,
    'Rafa sabe cortar pan y no puede ayudar en este momento. Sam puede ayudar.',
    { extra: [p.can, g.availability] },
    "Rafa can cut the bread, but he can't help right now. Sam can cut the bread. Sam can help now.",
  ),
  write(
    'ask-bread',
    'can',
    'Pídele a Sam que corte el pan. Ya estás hablando con él.',
    [
      'Can you cut the bread, please?',
      'Can you cut the bread?',
      'Sam, can you cut the bread, please?',
    ],
    'Usa el verbo base cut después de Can you.',
    p.request,
    {
      extra: [g.canBase],
      errors: { can_base: ['Can you cuts the bread?', 'Can you cutting the bread?'] },
    },
    undefined,
    [production(g.canBase)],
  ),
  write(
    'offer-help',
    'can',
    'Escribe cómo te ofrecerías a ayudar al equipo con una pregunta.',
    ['Can I help?', 'Can I help you?'],
    'Can I help? ofrece tu ayuda.',
    g.offer,
    { extra: [p.can] },
  ),
];

export const teamChecks = [
  choose(
    'hear-order',
    'team',
    g.order,
    '¿Qué indica Jo primero y qué indica después?',
    ['Cortar el pan; poner los tazones.', 'Poner los tazones; cortar el pan.'],
    0,
    'First introduce cortar el pan. Then introduce poner los tazones.',
    {
      audio: 'First, cut the bread. Then put the bowls on the table.',
      extra: [g.team],
      optionErrors: { '2': 'team_order' },
    },
  ),
  choose(
    'hear-helpers',
    'team',
    g.team,
    '¿Qué le piden a Sam y qué le piden a Luz?',
    ['Sam pone los tazones y Luz corta el pan.', 'Sam corta el pan y Luz pone los tazones.'],
    1,
    'La primera petición se dirige a Sam. La segunda se dirige a Luz.',
    {
      audio: 'Sam, can you cut the bread? Luz, can you put the bowls on the table?',
      extra: [p.request],
    },
  ),
  choose(
    'read-next',
    'team',
    g.order,
    'Ya cortaron el pan. ¿Qué falta hacer?',
    ['Poner los tazones en la mesa.', 'Cortar el pan.'],
    0,
    'La segunda línea indica el trabajo que sigue.',
    {},
    'First, cut the bread. Then put the bowls on the table.',
  ),
  write(
    'write-order',
    'team',
    'Para otro almuerzo, primero corta el pan. Después pon los tazones en la mesa. Escribe las dos instrucciones en inglés.',
    [
      'First, cut the bread. Then put the bowls on the table.',
      'First cut the bread. Next put the bowls on the table.',
    ],
    'Indica los pasos en el orden del plan con First y Then o Next.',
    g.order,
    { extra: [p.order] },
  ),
  write(
    'ask-current',
    'team',
    'Pregúntale a Jo qué está haciendo en este momento.',
    ['What are you doing?', 'What are you doing now?'],
    'Pon are antes de you después de what.',
    g.question,
    { extra: [p.question], errors: { word_order: ['What you are doing?'] } },
  ),
  write(
    'negative-current',
    'negative',
    'Jo está cortando pan. Escribe que no está lavando las verduras.',
    [
      "Jo isn't washing the vegetables.",
      'Jo is not washing the vegetables.',
      "She isn't washing the vegetables.",
    ],
    'Con un sujeto singular, usa is not o isn’t antes de washing.',
    p.negative,
    {
      extra: [g.negative],
      errors: { progressive_negative: ['Jo is washing not the vegetables.'] },
    },
  ),
];

export const handover = activity(
  'display-handover',
  'team',
  {
    type: 'short_text',
    acceptedAnswers: [
      'Leo is reading the labels. Bia usually moves the table, but today she is hanging the pictures. Can you help, Nina? First, move the table. Then put the labels on the table.',
    ],
    promptEs:
      'Déjale al equipo una nota de tres a cinco oraciones. Indica una acción en curso, contrasta una tarea habitual con la de hoy, pide ayuda y da dos pasos en orden. Al revisar, comprueba quién hace qué, la forma del verbo, la petición y el orden.',
    feedbackEs: 'Comprueba los cinco elementos de tu nota con la lista y luego con el ejemplo.',
    ungradable: {
      feedbackEs:
        'Compara tu nota con el ejemplo. Busca sujeto + be + -ing, usually y today, can + verbo base y los pasos en el orden acordado.',
    },
  },
  [writing(g.team)],
  {
    guided: true,
    extra: requirements(
      [
        'Leo is reading the labels. Bia usually moves the table, but today she is hanging the pictures. Can you help, Nina? First, move the table. Then put the labels on the table.',
      ],
      [g.team, p.now, g.habit, g.third, p.request, g.order],
    ),
  },
);
