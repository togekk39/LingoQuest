import type { AnswerKey, LearningError } from '@lingoquest/contracts';
import type { PrerequisiteReference } from '../../packages/course-pack/src/prerequisites';
import type { CourseExercise } from '../../packages/offline-engine/src';
import type { UnifiedEvidenceTarget } from '../../packages/offline-engine/src/learning-evidence';
import type {
  TravelExerciseStep,
  TravelStep,
} from '../../packages/offline-engine/src/travel-content';
import type { LearningTarget } from '../../packages/offline-engine/src/travel-learning';
import {
  cartagenaGrammar as g,
  cartagenaLessonIds,
  cartagenaNumbers as numbers,
  cartagenaPatterns as p,
  cartagenaRefs as w,
} from './cartagena-prerequisites';
import { answerVariants } from './contextual-answers';

type Topic = keyof typeof cartagenaLessonIds;
type ExerciseFields = Pick<CourseExercise, 'promptEs' | 'acceptedAnswers' | 'feedbackEs' | 'type'> &
  Partial<
    Pick<
      CourseExercise,
      | 'options'
      | 'correctOptionId'
      | 'optionsLanguage'
      | 'passage'
      | 'sentence'
      | 'communicationOnly'
      | 'contextMismatch'
      | 'ungradable'
    >
  >;

type Item = {
  id: string;
  topic: Topic;
  context: string;
  situation: string;
  concept: PrerequisiteReference;
  patterns: readonly PrerequisiteReference[];
  words: readonly PrerequisiteReference[];
  skill: LearningTarget['skill'];
  dimension: UnifiedEvidenceTarget['dimension'];
  evidence?: LearningTarget['evidence'];
  exercise: ExerciseFields;
  audio?: string;
  guided?: true;
  errors?: LearningTarget['errorAnswers'];
  remediates?: LearningError[];
  extraTargets?: UnifiedEvidenceTarget[];
  requiredReply?: true;
  hint?: string;
  storyPrompt?: TravelExerciseStep['storyPrompt'];
  storyReply?: TravelExerciseStep['storyReply'];
  storyReplies?: TravelExerciseStep['storyReplies'];
  skipWhenMastered?: true;
};

function assessment(item: Item): TravelExerciseStep {
  const id = `cartagena-${item.id}`;
  const conceptId = item.concept.id;
  const references = [item.concept, ...item.patterns, ...item.words];
  const requires = [...new Map(references.map((ref) => [JSON.stringify(ref), ref])).values()];
  return {
    id,
    type: 'exercise',
    lessonId: cartagenaLessonIds[item.topic],
    situation: item.situation,
    requires,
    targets: [{ targetId: conceptId, dimension: item.dimension }, ...(item.extraTargets ?? [])],
    ...(item.audio && {
      audio: item.audio,
      transcript: item.audio,
      listeningButton: 'Escuchar el mensaje',
    }),
    ...(item.requiredReply && { requiredReply: true }),
    ...(item.hint && { hint: item.hint }),
    ...(item.storyPrompt && { storyPrompt: item.storyPrompt }),
    ...(item.storyReply && { storyReply: item.storyReply }),
    ...(item.storyReplies && { storyReplies: item.storyReplies }),
    ...(item.skipWhenMastered && { skipWhenMastered: true }),
    exercise: {
      ...item.exercise,
      id,
      skillId: conceptId,
      difficulty: 1,
      ...(item.dimension.startsWith('grammar_') && {
        dimension: item.dimension as 'grammar_understanding' | 'grammar_production',
      }),
      learning: {
        conceptId,
        skill: item.skill,
        contextId: `cartagena.${item.context}`,
        evidence: item.evidence ?? (item.dimension === 'writing' ? 'production' : 'understanding'),
        ...(item.guided && { guided: true }),
        ...(item.errors && {
          errors: Object.keys(item.errors) as LearningError[],
          errorAnswers: item.errors,
        }),
        ...(item.remediates && { remediates: item.remediates }),
      },
    },
  };
}

type ChoiceItem = Omit<Item, 'exercise' | 'skill' | 'dimension'> & {
  prompt: string;
  choices: [string, string, ...string[]];
  correct?: number;
  feedback: string;
  passage?: string;
  sentence?: string;
  english?: true;
};

function choice({
  prompt,
  choices,
  correct = 0,
  feedback,
  passage,
  sentence,
  english,
  ...item
}: ChoiceItem) {
  return assessment({
    ...item,
    skill: item.audio ? 'listening' : passage ? 'reading' : 'grammar',
    dimension: item.audio ? 'listening' : passage ? 'reading' : 'grammar_understanding',
    exercise: {
      type: 'single_choice',
      promptEs: prompt,
      acceptedAnswers: [],
      options: choices.map((text, index) => ({ id: String(index + 1), text })),
      correctOptionId: String(correct + 1),
      optionsLanguage: english ? 'en' : 'es',
      feedbackEs: feedback,
      ...(passage && { passage }),
      ...(sentence && { sentence }),
    },
  });
}

type WritingItem = Omit<Item, 'exercise' | 'skill' | 'dimension'> & {
  prompt: string;
  answers: string[];
  feedback: string;
  passage?: string;
  communicationOnly?: AnswerKey['communicationOnly'];
  contextMismatch?: AnswerKey['contextMismatch'];
  ungradable?: AnswerKey['ungradable'];
  writingPattern?: PrerequisiteReference;
};

function writing({
  prompt,
  answers,
  feedback,
  passage,
  communicationOnly,
  contextMismatch,
  ungradable,
  writingPattern,
  ...item
}: WritingItem) {
  return assessment({
    ...item,
    skill: 'grammar',
    dimension: 'grammar_production',
    evidence: item.evidence ?? 'production',
    extraTargets: [
      ...(item.extraTargets ?? []),
      ...(writingPattern ? [{ targetId: writingPattern.id, dimension: 'writing' as const }] : []),
    ],
    exercise: {
      type: 'short_text',
      promptEs: prompt,
      acceptedAnswers: answers,
      feedbackEs: feedback,
      ...(passage && { passage }),
      ...(communicationOnly && { communicationOnly }),
      ...(contextMismatch && { contextMismatch }),
      ...(ungradable && { ungradable }),
    },
  });
}

const contextMismatch = (answers: string[], feedback: string): AnswerKey['contextMismatch'] => ({
  answers,
  feedbackEs: `La forma en inglés es válida. ${feedback}`,
});

const likeWords = [w.i, w.like, w.she, w.he, w.likes];
const questionWords = [w.do, w.does, w.you, w.he, w.she, w.like];
const negativeWords = [w.i, w.he, w.like, w.dont, w.doesnt, w.dontLong, w.doesntLong];
const measureWords = [w.howMany, w.howMuch, w.bottle, w.bottles, w.of, w.water, w.need, w.we];
const priceQuestionWords = [w.howMuchPrice, w.is, w.are, w.the];
const pesoWords = [w.cop, w.thousand, w.pesos, w.colombianPesos];
const orderWords = [
  w.idLike,
  w.wouldLike,
  w.canIHave,
  w.please,
  w.and,
  w.with,
  w.without,
  w.no,
  w.some,
  w.a,
  w.of,
  w.bottle,
  w.glass,
  w.cup,
];

export const cartagenaCafeMenu = [
  'Coffee — COP 5,000',
  'Water — COP 3,000',
  'Eggs with cheese — COP 10,000',
  'Chicken with rice — COP 25,000',
  'Fish with rice — COP 30,000',
].join('\n');

export const cartagenaSeaMenu = [
  'Eggs with bread — COP 12,000',
  'Chicken with rice — COP 22,000',
  'Fish with onions — COP 28,000',
  'Tea — COP 4,000',
  'Orange juice — COP 6,000',
].join('\n');

const cafeMenuWords = [
  w.coffee,
  w.water,
  w.eggs,
  w.with,
  w.cheese,
  w.chicken,
  w.rice,
  w.fish,
  w.cop,
];
const seaMenuWords = [
  w.eggs,
  w.with,
  w.bread,
  w.chicken,
  w.rice,
  w.fish,
  w.onions,
  w.tea,
  w.orangeJuice,
  w.cop,
];

const likes = [
  writing({
    id: 'likes-aux-guide',
    topic: 'likes',
    context: 'market-questions-practice',
    situation:
      'Luz pregunta por otra persona. Recuerda: con he o she, usa does y deja like en su forma base.',
    concept: g.question,
    patterns: [p.question],
    words: [...questionWords, w.fish],
    prompt: 'Escribe la pregunta por Sam. Usa he o su nombre.',
    answers: ['Does he like fish?', 'Does Sam like fish?'],
    guided: true,
    skipWhenMastered: true,
    feedback: 'Does he like fish? Con he, empieza con does y usa like.',
  }),
  choice({
    id: 'likes-listen',
    topic: 'likes',
    context: 'market-food-stall-audio',
    situation: 'Luz te cuenta qué quiere probar en el mercado.',
    concept: g.present,
    patterns: [p.like, p.negative],
    words: [...negativeWords, w.rice, w.fish, g.negative],
    prompt: 'Escucha a Luz. ¿Qué le gusta y qué no le gusta?',
    audio: "I like rice. I don't like fish.",
    choices: [
      'Le gusta el pescado y no le gusta el arroz.',
      'Le gusta el arroz y no le gusta el pescado.',
      'Le gustan ambos.',
    ],
    correct: 1,
    extraTargets: [
      { targetId: w.rice.id, dimension: 'listening' },
      { targetId: w.fish.id, dimension: 'listening' },
    ],
    feedback: 'Luz dice que le gusta el arroz y que no le gusta el pescado.',
  }),
  choice({
    id: 'likes-read',
    topic: 'likes',
    context: 'market-tasting-note',
    situation: 'Lee las notas de tus compañeros antes de acercarte al puesto.',
    concept: g.thirdPerson,
    patterns: [p.thirdPerson, p.negative],
    words: [...likeWords, ...negativeWords, w.chicken, w.fish, w.coffee, w.milk, g.negative],
    prompt: '¿Qué alimento puedes ofrecerle a Luz según la nota?',
    passage: "Luz likes chicken. She doesn't like fish.\nSam likes coffee. He doesn't like milk.",
    choices: ['Pollo.', 'Pescado.', 'Leche.'],
    feedback: 'Luz likes chicken indica que a Luz le gusta el pollo.',
  }),
  choice({
    id: 'likes-recognize',
    topic: 'likes',
    context: 'market-recommendation-note',
    situation: 'Vas a dejar una nota sobre el gusto de Luz.',
    concept: g.thirdPerson,
    patterns: [p.thirdPerson],
    words: [...likeWords, w.fruit],
    prompt: 'Elige la forma correcta para hablar de Luz.',
    sentence: 'She ___ fruit.',
    choices: ['like', 'likes'],
    correct: 1,
    english: true,
    feedback: 'Con she o con el nombre de una persona, agrega -s a like.',
  }),
  writing({
    id: 'likes-write',
    topic: 'likes',
    context: 'market-message-for-sam',
    situation: 'Sam está en otro puesto. Dile en inglés qué alimento de la ficha le gusta a Luz.',
    concept: g.thirdPerson,
    patterns: [p.thirdPerson, p.negative],
    words: [...likeWords, ...negativeWords, g.negative, w.chicken, w.fish],
    passage: "Luz: I like chicken. I don't like fish.",
    prompt: 'Escribe lo que le gusta a Luz usando she o su nombre.',
    answers: ['She likes chicken.', 'Luz likes chicken.'],
    contextMismatch: contextMismatch(
      ['She likes fish.', 'Luz likes fish.', 'He likes chicken.'],
      'La nota indica que a Luz le gusta el pollo.',
    ),
    errors: { third_person: ['She like chicken.', 'Luz like chicken.'] },
    writingPattern: p.thirdPerson,
    feedback: 'Usa she o Luz seguido de likes y el alimento que le gusta.',
  }),
  writing({
    id: 'likes-question',
    topic: 'likes',
    context: 'market-seafood-question',
    situation:
      'El puesto de pescado llama la atención de Luz. Pregúntale si a Sam le gusta el pescado.',
    concept: g.question,
    patterns: [p.question],
    words: [...questionWords, w.fish, w.chicken],
    prompt: 'Escribe una pregunta en inglés sobre Sam.',
    answers: ['Does he like fish?', 'Does Sam like fish?'],
    contextMismatch: contextMismatch(
      ['Does she like fish?', 'Does Sam like chicken?'],
      'Pregunta por Sam y por el pescado.',
    ),
    errors: { third_person: ['Does he likes fish?', 'Does Sam likes fish?', 'Do he like fish?'] },
    writingPattern: p.question,
    feedback: 'Empieza con Does y usa like en forma base.',
  }),
  writing({
    id: 'likes-negative',
    topic: 'likes',
    context: 'market-coffee-preference',
    situation:
      'El café es para Sam. Imagínate que tú prefieres otra bebida y que no te gusta el café.',
    concept: g.negative,
    patterns: [p.negative],
    words: [...negativeWords, w.coffee, w.tea],
    prompt: 'Dile a la vendedora en inglés qué bebida no te gusta.',
    answers: ["I don't like coffee."],
    contextMismatch: contextMismatch(
      ["I don't like tea.", 'I like coffee.'],
      'En tu papel, el café es la bebida que no te gusta.',
    ),
    errors: { third_person: ["I doesn't like coffee.", 'I does not like coffee.'] },
    writingPattern: p.negative,
    feedback: 'Con I usa don’t o do not seguido de like.',
  }),
];

const quantity = [
  choice({
    id: 'quantity-listen',
    topic: 'quantity',
    context: 'market-packing-audio',
    situation: 'Sam hizo la lista de bebidas para las tres personas.',
    concept: g.quantity,
    patterns: [p.countable, p.plural],
    words: [...measureWords, ...numbers(3)],
    prompt: 'Escucha y elige cuántas botellas necesitan.',
    audio: 'We need three bottles of water.',
    choices: ['Dos botellas.', 'Cuatro botellas.', 'Tres botellas.'],
    correct: 2,
    extraTargets: [{ targetId: numbers(3)[0].id, dimension: 'listening' }],
    feedback: 'Sam dice three bottles of water, tres botellas de agua.',
  }),
  choice({
    id: 'quantity-read',
    topic: 'quantity',
    context: 'market-snack-note',
    situation: 'Lee la ficha de compras. Las cantidades indican qué llevar.',
    concept: g.quantity,
    patterns: [p.plural, p.someAny],
    words: [w.apples, w.eggs, w.bananas, w.some, w.bread, ...numbers(2, 3, 4)],
    prompt: '¿Qué debes llevar según la ficha?',
    passage: 'Two apples\nThree eggs\nFour bananas\nSome bread',
    choices: [
      'Dos manzanas, tres huevos, cuatro bananas y algo de pan.',
      'Tres manzanas, dos huevos, cuatro bananas y algo de pan.',
      'Dos manzanas, tres huevos, cuatro bananas y cuatro panes.',
    ],
    feedback: 'Cada número va con su alimento. Some bread no fija un número de porciones.',
  }),
  choice({
    id: 'quantity-recognize',
    topic: 'quantity',
    context: 'market-container-label',
    situation: 'Ves una botella y quieres saber cuántas botellas quedan.',
    concept: g.quantity,
    patterns: [p.howMany, p.howMuch],
    words: measureWords,
    prompt: 'Elige la expresión que pregunta por el número de botellas.',
    sentence: '___ bottles of water?',
    choices: ['How much', 'How many'],
    correct: 1,
    english: true,
    feedback: 'Bottles se cuenta en unidades, así que usa how many.',
  }),
  writing({
    id: 'quantity-write',
    topic: 'quantity',
    context: 'market-packing-question',
    situation: 'Quieres confirmar cuántas botellas comprar antes de pagar.',
    concept: g.quantity,
    patterns: [p.howMany, p.howMuch, p.countable],
    words: [...measureWords, w.do, g.question],
    prompt: 'Pregunta en inglés por el número de botellas de agua.',
    answers: ['How many bottles of water?', 'How many bottles of water do we need?'],
    contextMismatch: contextMismatch(
      ['How much water?', 'How much water do we need?'],
      'Aquí necesitas el número de botellas.',
    ),
    errors: {
      quantity_question: [
        'How many water?',
        'How much bottles of water?',
        'How many water do we need?',
      ],
    },
    writingPattern: p.howMany,
    feedback: 'Usa how many con bottles of water. How much water pregunta por la cantidad de agua.',
  }),
  writing({
    id: 'quantity-bread',
    topic: 'quantity',
    context: 'market-bread-tray',
    situation: 'Luz prepara una bandeja. Ya cortaron el pan y hacen falta dos porciones.',
    concept: g.quantity,
    patterns: [p.countable, p.plural],
    words: [w.we, w.need, w.piece, w.pieces, w.of, w.bread, ...numbers(1, 2, 3)],
    prompt: 'Escribe en inglés lo que necesitan. Menciona las piezas de pan.',
    answers: ['We need two pieces of bread.', 'Two pieces of bread.'],
    contextMismatch: contextMismatch(
      ['We need three pieces of bread.', 'Three pieces of bread.'],
      'La bandeja requiere dos piezas.',
    ),
    errors: {
      countability: [
        'Two breads.',
        'We need two breads.',
        'Two piece of bread.',
        'We need two piece of bread.',
      ],
    },
    writingPattern: p.countable,
    feedback: 'Para estas porciones usa two pieces of bread. Se cuentan las piezas.',
  }),
  writing({
    id: 'quantity-orange',
    topic: 'quantity',
    context: 'market-fruit-reminder',
    situation: 'Te falta una naranja para el camino. Deja en inglés un recordatorio muy corto.',
    concept: g.quantity,
    patterns: [p.article],
    words: [w.a, w.an, w.orange, w.oranges, w.i, w.need, ...numbers(2)],
    prompt: 'Nombra lo que necesitas en inglés usando el artículo.',
    answers: ['An orange.', 'I need an orange.'],
    communicationOnly: {
      answers: ['One orange.', 'I need one orange.'],
      feedbackEs: 'La cantidad se entiende. Para practicar el artículo usa an orange.',
    },
    contextMismatch: contextMismatch(
      ['Two oranges.', 'I need two oranges.'],
      'Solo hace falta una naranja.',
    ),
    errors: { article: ['A orange.', 'I need a orange.'] },
    writingPattern: p.article,
    feedback: 'Orange empieza con un sonido vocálico. Usa an orange.',
  }),
  choice({
    id: 'quantity-some-any',
    topic: 'quantity',
    context: 'market-stock-note',
    situation: 'Lee la nota sobre lo que queda en el puesto.',
    concept: g.quantity,
    patterns: [p.someAny],
    words: [w.we, w.have, w.some, w.any, w.cheese, w.milk, w.dont, g.negative],
    passage: "We have some cheese. We don't have any milk.",
    prompt: '¿Qué puedes conseguir en el puesto?',
    choices: ['Leche.', 'Queso.', 'Leche y queso.'],
    correct: 1,
    feedback: 'Some cheese indica que hay queso. Don’t have any milk dice que no hay leche.',
  }),
];

const prices = [
  choice({
    id: 'prices-listen',
    topic: 'prices',
    context: 'cafe-total-audio',
    situation: 'Alba dice en voz alta el total de una cuenta. Toda la pizarra está en COP.',
    concept: g.price,
    patterns: [p.priceAnswer, p.pesos],
    words: [w.the, w.total, w.is, ...pesoWords, ...numbers(25)],
    prompt: 'Escucha el total. ¿Qué cifra debes anotar?',
    audio: 'The total is twenty-five thousand pesos.',
    choices: ['COP 5,000.', 'COP 25,000.', 'COP 250,000.'],
    correct: 1,
    extraTargets: [{ targetId: numbers(25)[0].id, dimension: 'listening' }],
    feedback: 'Twenty-five thousand pesos son veinticinco mil pesos colombianos.',
  }),
  choice({
    id: 'prices-read',
    topic: 'prices',
    context: 'cafe-price-board',
    situation: 'Sam tiene COP 10,000 para una bebida y quiere gastar lo menos posible.',
    concept: g.price,
    patterns: [p.priceAnswer, p.pesos],
    words: cafeMenuWords,
    passage: cartagenaCafeMenu,
    prompt: 'Lee la pizarra. ¿Qué bebida cuesta menos?',
    choices: ['El agua, COP 3,000.', 'El café, COP 5,000.', 'Los huevos con queso, COP 10,000.'],
    feedback: 'Water cuesta COP 3,000. Coffee cuesta COP 5,000.',
  }),
  choice({
    id: 'prices-distinguish',
    topic: 'prices',
    context: 'cafe-price-or-volume',
    situation: 'Quieren saber cuánto deben pagar por el agua.',
    concept: g.price,
    patterns: [p.priceQuestion, p.howMany, p.howMuch],
    words: [...priceQuestionWords, ...measureWords],
    prompt: 'Elige la pregunta de precio.',
    choices: ['How much water?', 'How many bottles of water?', 'How much is the water?'],
    correct: 2,
    english: true,
    feedback: 'How much is the water? pregunta el precio. Las otras preguntas piden cantidad.',
  }),
  writing({
    id: 'prices-write',
    topic: 'prices',
    context: 'cafe-price-request',
    situation: 'Quieres confirmar el precio de los huevos antes de pedir.',
    concept: g.price,
    patterns: [p.priceQuestion, p.howMany, p.howMuch],
    words: [...priceQuestionWords, ...measureWords, w.egg, w.eggs, w.coffee],
    prompt: 'Pregunta en inglés cuánto cuestan los huevos.',
    answers: ['How much are the eggs?', 'How much are eggs?'],
    contextMismatch: contextMismatch(
      ['How much is the coffee?', 'How many eggs?'],
      'Pregunta por el precio de los huevos.',
    ),
    errors: {
      be_agreement: ['How much is the eggs?'],
      quantity_question: ['How much eggs?', 'How many is the eggs?'],
    },
    writingPattern: p.priceQuestion,
    feedback: 'Para preguntar un precio usa how much. Con eggs en plural, usa are.',
  }),
  writing({
    id: 'prices-amount',
    topic: 'prices',
    context: 'cafe-menu-price-note',
    situation: 'Alba te pide que le digas en inglés el precio del café de la pizarra.',
    concept: g.price,
    patterns: [p.priceAnswer, p.pesos],
    words: [...cafeMenuWords, ...pesoWords, w.it, w.is, w.its, w.the, w.dollars, ...numbers(5, 10)],
    passage: cartagenaCafeMenu,
    prompt: 'Escribe la cifra en palabras e indica la moneda. Puedes usar it o nombrar el café.',
    answers: answerVariants(
      ["It's ", 'The coffee is '],
      ['five thousand pesos.', 'five thousand Colombian pesos.'],
    ),
    contextMismatch: contextMismatch(
      ["It's five dollars.", "It's ten thousand pesos.", 'The coffee is five dollars.'],
      'La pizarra usa COP. El café cuesta cinco mil pesos colombianos.',
    ),
    writingPattern: p.priceAnswer,
    feedback: 'Five thousand pesos expresa COP 5,000 en palabras.',
  }),
];

const cafeChoices = [
  {
    main: 'fish with rice',
    mainEs: 'pescado con arroz',
  },
  {
    main: 'chicken with rice',
    mainEs: 'pollo con arroz',
  },
];

const seaChoices = [
  { main: 'eggs with bread', mainEs: 'huevos con pan' },
  { main: 'chicken with rice', mainEs: 'pollo con arroz' },
];

const cafeDrinks = [
  ['water', 'agua'],
  ['some water', 'agua'],
  ['a glass of water', 'un vaso de agua'],
  ['a bottle of water', 'una botella de agua'],
  ['coffee', 'café'],
  ['some coffee', 'café'],
  ['a cup of coffee', 'una taza de café'],
] as const;

const seaDrinks = [
  ['tea', 'té'],
  ['some tea', 'té'],
  ['a cup of tea', 'una taza de té'],
  ['orange juice', 'jugo de naranja'],
  ['some orange juice', 'jugo de naranja'],
  ['a glass of orange juice', 'un vaso de jugo de naranja'],
] as const;

function orderPhrases(prefix: string, mains: string[], drinks: string[]) {
  const contents = [
    ...answerVariants(mains, ' and ', drinks),
    ...answerVariants(drinks, ' and ', mains),
  ];
  return answerVariants(prefix, contents, ['', ', please']);
}

const orderTarget = "I'd like ";
const orderAlternate = 'Can I have ';

function menuOrder(
  mains: readonly { main: string; mainEs: string }[],
  drinks: readonly (readonly [drink: string, drinkEs: string])[],
): {
  answers: string[];
  alternatives: string[];
  replies: NonNullable<TravelExerciseStep['storyReplies']>;
} {
  const groups = mains.flatMap(({ main, mainEs }) =>
    drinks.map(([drink, drinkEs]) => {
      const target = orderPhrases(orderTarget, [main], [drink]);
      const alternate = orderPhrases(orderAlternate, [main], [drink]);
      return {
        target,
        alternate,
        reply: {
          answers: [...target, ...alternate],
          speaker: 'Alba',
          line: {
            en: `${main[0].toUpperCase()}${main.slice(1)} and ${drink}.`,
            es: `${mainEs} y ${drinkEs}.`,
          },
        },
      };
    }),
  );
  return {
    answers: groups.flatMap(({ target }) => target),
    alternatives: groups.flatMap(({ alternate }) => alternate),
    replies: groups.map(({ reply }) => reply),
  };
}

const orderForms = menuOrder(cafeChoices, cafeDrinks);
const transferForms = menuOrder(seaChoices, seaDrinks);
const order = [
  writing({
    id: 'order-menu',
    topic: 'order',
    context: 'cafe-menu-request',
    situation: 'Alba acerca una silla y espera a que le pidas la carta.',
    concept: g.order,
    patterns: [p.canHave, p.order],
    words: [
      w.canISee,
      w.canIHave,
      w.the,
      w.menu,
      w.please,
      w.idLike,
      w.without,
      w.cheese,
      w.no,
      w.onions,
      w.with,
      w.rice,
      w.water,
      w.and,
    ],
    prompt: 'Pide ver el menú en inglés con please.',
    answers: [
      'Can I see the menu, please?',
      'Can I have the menu, please?',
      'Please, can I see the menu?',
      'Please, can I have the menu?',
    ],
    writingPattern: p.canHave,
    requiredReply: true,
    storyPrompt: { speaker: 'Alba', text: '¿Quieres ver la carta antes de ordenar?' },
    storyReply: { speaker: 'Alba', line: { en: 'The menu.', es: 'La carta.' } },
    feedback: 'Can I see the menu, please? es una forma de pedir la carta.',
  }),
  choice({
    id: 'order-read',
    topic: 'order',
    context: 'cafe-menu-ingredients',
    situation: 'Para este pedido buscan arroz y una bebida. Luz prefiere una comida sin queso.',
    concept: g.order,
    patterns: [p.preferences, p.order],
    words: [...cafeMenuWords, w.no, w.without],
    passage: cartagenaCafeMenu,
    prompt: '¿Qué comida de la pizarra lleva arroz y aparece sin queso?',
    choices: ['Huevos con queso.', 'Pollo con arroz.', 'Café.'],
    correct: 1,
    feedback: 'Chicken with rice se anuncia con arroz. Puedes aclarar la preferencia al pedir.',
  }),
  choice({
    id: 'order-recognize',
    topic: 'order',
    context: 'cafe-guest-and-server',
    situation: 'Tú quieres pedir agua. Alba todavía no ha tomado el pedido.',
    concept: g.order,
    patterns: [p.order, p.canHave, p.confirm],
    words: [w.canIHave, w.some, w.water, w.please, w.whatWouldYouLike, w.anythingElse],
    prompt: 'Elige la frase que dirías como cliente para pedir agua.',
    choices: ['What would you like?', 'Can I have some water, please?', 'Anything else?'],
    correct: 1,
    english: true,
    feedback:
      'Can I have some water, please? es una petición. Las otras frases las puede decir Alba.',
  }),
  writing({
    id: 'order-write',
    topic: 'order',
    context: 'cafe-first-order',
    situation:
      'Pide pollo con arroz o pescado con arroz. Elige agua o café. Es un pedido para compartir y acordaron evitar el plato con queso.',
    concept: g.order,
    patterns: [p.order, p.canHave, p.preferences, p.countable],
    words: [...cafeMenuWords, ...orderWords],
    passage: cartagenaCafeMenu,
    prompt: 'Escribe el plato y la bebida en un pedido cortés con I’d like.',
    answers: orderForms.answers,
    communicationOnly: {
      answers: orderForms.alternatives,
      feedbackEs:
        'Alba entiende tu pedido. Para practicar la expresión de esta actividad, usa I’d like.',
    },
    contextMismatch: contextMismatch(
      [
        ...orderPhrases(
          orderTarget,
          ['eggs with cheese', 'fish', 'chicken'],
          ['water', 'some water', 'coffee', 'some coffee'],
        ),
        ...orderPhrases(
          orderAlternate,
          ['eggs with cheese', 'fish', 'chicken'],
          ['water', 'some water', 'coffee', 'some coffee'],
        ),
        ...answerVariants(
          orderTarget,
          cafeChoices.map(({ main }) => main),
          ['', ', please'],
        ),
      ],
      'El pedido requiere un plato con arroz que figure sin queso y una bebida.',
    ),
    writingPattern: p.order,
    requiredReply: true,
    storyPrompt: { speaker: 'Alba', text: 'Escucho cuál plato con arroz y cuál bebida quieren.' },
    storyReplies: orderForms.replies,
    feedback: 'Usa I’d like seguido de un plato con arroz y de agua o café. Puedes añadir please.',
  }),
  writing({
    id: 'order-confirm',
    topic: 'order',
    context: 'cafe-check-your-recap',
    situation:
      'Alba acaba de repetir el plato y la bebida de tu pedido. Confirma que lo anotó bien.',
    concept: g.order,
    patterns: [p.confirm],
    words: [w.yes, w.thatsRight, w.yesPlease, w.noThankYou],
    prompt: 'Responde en inglés para confirmar el pedido que acaba de repetir.',
    answers: ["That's right.", "Yes, that's right.", 'Yes, please.'],
    contextMismatch: contextMismatch(
      ['No, thank you.'],
      'El plato y la bebida coinciden con tu pedido.',
    ),
    writingPattern: p.confirm,
    requiredReply: true,
    feedback: 'Puedes decir That’s right para confirmar que el pedido coincide.',
  }),
  writing({
    id: 'order-correct',
    topic: 'order',
    context: 'cafe-correct-sams-drink',
    situation:
      'Ahora hacen un pedido aparte para Sam. Él pidió agua, pero Alba anotó leche. Corrige la bebida con cortesía.',
    concept: g.order,
    patterns: [p.order, p.canHave, p.confirm],
    words: [w.milk, w.water, w.idLike, w.wouldLike, w.canIHave, w.no, w.some, w.please],
    prompt: 'Pide agua en vez de leche.',
    answers: answerVariants(
      ['Can I have ', "I'd like "],
      ['water', 'some water'],
      [', please?', '?'],
    ),
    contextMismatch: contextMismatch(
      ['Can I have milk, please?', "I'd like milk, please."],
      'Sam pidió agua.',
    ),
    writingPattern: p.canHave,
    requiredReply: true,
    storyPrompt: {
      speaker: 'Alba',
      text: 'Para Sam anoté leche. ¿Qué debe llevar su pedido aparte?',
    },
    storyReply: { speaker: 'Alba', line: { en: 'Water for Sam.', es: 'Agua para Sam.' } },
    feedback: 'Pide water para que Alba pueda corregir la bebida de Sam.',
  }),
  choice({
    id: 'order-listen',
    topic: 'order',
    context: 'cafe-server-follow-up',
    situation: 'Después de anotar la corrección, Alba hace una pregunta.',
    concept: g.order,
    patterns: [p.confirm, p.order],
    words: [w.anythingElse, w.thatsAll],
    prompt: '¿Qué quiere confirmar Alba?',
    audio: 'Anything else?',
    choices: ['Si quieren algo más.', 'Cuánto cuesta el agua.', 'Si faltan sillas.'],
    storyPrompt: { speaker: 'Alba', text: '¿Puedes entender mi siguiente pregunta?' },
    feedback: 'Anything else? pregunta si quieres añadir algo más.',
  }),
  writing({
    id: 'order-close',
    topic: 'order',
    context: 'cafe-final-confirmation',
    situation: 'El plato y las bebidas ya están anotados. No quieres agregar nada.',
    concept: g.order,
    patterns: [p.confirm],
    words: [w.thatsAll, w.noThankYou, w.yesPlease, w.thankYou],
    prompt: 'Confirma en inglés que eso es todo. Agradece a Alba.',
    answers: ["That's all, thank you.", 'No, thank you.', "No, that's all, thank you."],
    contextMismatch: contextMismatch(['Yes, please.'], 'El pedido ya está completo.'),
    writingPattern: p.confirm,
    requiredReply: true,
    feedback: 'That’s all, thank you cierra el pedido con cortesía.',
  }),
  writing({
    id: 'order-check',
    topic: 'order',
    context: 'cafe-bill-request',
    situation: 'Ya terminaron de comer. Pide la cuenta para poder pagar.',
    concept: g.order,
    patterns: [p.check, p.canHave],
    words: [w.canIHave, w.the, w.check, w.bill, w.please, w.menu],
    prompt: 'Escribe tu petición cortés en inglés.',
    answers: answerVariants('Can I have the ', ['check', 'bill'], [', please?', '?']),
    contextMismatch: contextMismatch(
      ['Can I have the menu, please?'],
      'Ahora necesitan la cuenta para pagar.',
    ),
    writingPattern: p.check,
    requiredReply: true,
    storyReply: { speaker: 'Alba', line: { en: 'The check.', es: 'La cuenta.' } },
    feedback:
      'Can I have the check, please? es común en inglés de Estados Unidos. También se entiende bill.',
  }),
];

const transfer = [
  choice({
    id: 'transfer-likes',
    topic: 'likes',
    context: 'sea-friends-food-notes',
    situation:
      'Después del paseo te reúnes con Luz y Sam. Revisa lo que cada persona quiere esta vez.',
    concept: g.thirdPerson,
    patterns: [p.thirdPerson, p.negative],
    words: [...likeWords, ...negativeWords, w.eggs, w.chicken, w.fish, w.onions, g.negative],
    passage: "Luz likes eggs. She doesn't like onions.\nSam likes chicken. He doesn't like fish.",
    prompt: '¿Qué plato sugiere la nota para Sam?',
    choices: ['Pescado.', 'Huevos.', 'Pollo.'],
    correct: 2,
    evidence: 'transfer',
    feedback: 'Sam likes chicken indica que a Sam le gusta el pollo.',
  }),
  writing({
    id: 'transfer-quantity',
    topic: 'quantity',
    context: 'sea-table-water',
    situation: 'Las tres personas quieren un vaso de agua cada una antes de comer.',
    concept: g.quantity,
    patterns: [p.countable, p.plural],
    words: [w.we, w.need, w.glass, w.glasses, w.of, w.water, ...numbers(2, 3, 4)],
    prompt: 'Anota en inglés cuántos vasos de agua necesitan. Nombra la unidad.',
    answers: ['Three glasses of water.', 'We need three glasses of water.'],
    contextMismatch: contextMismatch(
      ['Two glasses of water.', 'Four glasses of water.', 'We need two glasses of water.'],
      'Cada una de las tres personas quiere un vaso.',
    ),
    errors: {
      countability: ['Three waters.', 'Three glass of water.', 'We need three glass of water.'],
    },
    writingPattern: p.countable,
    evidence: 'transfer',
    feedback: 'Escribe three glasses of water para indicar tres vasos.',
  }),
  choice({
    id: 'transfer-price-listen',
    topic: 'prices',
    context: 'sea-tea-price-audio',
    situation: 'La persona que atiende anuncia el precio del té en pesos colombianos.',
    concept: g.price,
    patterns: [p.priceAnswer, p.pesos],
    words: [w.the, w.tea, w.is, ...pesoWords, ...numbers(4)],
    prompt: 'Escucha. ¿Qué cifra corresponde al precio del té?',
    audio: 'The tea is four thousand pesos.',
    choices: ['COP 4,000.', 'COP 400.', 'COP 40,000.'],
    evidence: 'transfer',
    feedback: 'Four thousand pesos son cuatro mil pesos.',
  }),
  choice({
    id: 'transfer-price-read',
    topic: 'prices',
    context: 'sea-menu-budget',
    situation: 'Luz quiere huevos o pollo. Puede pagar hasta COP 15,000 por su plato.',
    concept: g.price,
    patterns: [p.priceAnswer, p.pesos],
    words: seaMenuWords,
    passage: cartagenaSeaMenu,
    prompt: '¿Qué plato del menú cumple el presupuesto?',
    choices: [
      'Pollo con arroz, COP 22,000.',
      'Huevos con pan, COP 12,000.',
      'Pescado con cebolla, COP 28,000.',
    ],
    correct: 1,
    evidence: 'transfer',
    feedback: 'Eggs with bread cuesta COP 12,000 y cabe en el presupuesto.',
  }),
  writing({
    id: 'transfer-order',
    topic: 'order',
    context: 'sea-first-order',
    situation:
      'Pide para una persona del grupo. Elige los huevos con pan para Luz o el pollo con arroz para Sam. Ambos quieren evitar el plato con cebolla. Escoge té o jugo para acompañar.',
    concept: g.order,
    patterns: [p.order, p.canHave, p.preferences, p.countable],
    words: [...seaMenuWords, ...orderWords],
    passage: cartagenaSeaMenu,
    prompt: 'Haz tu pedido en inglés con I’d like e incluye un plato y una bebida.',
    answers: transferForms.answers,
    communicationOnly: {
      answers: transferForms.alternatives,
      feedbackEs:
        'Alba entiende el pedido. Para demostrar la fórmula de esta actividad, puedes usar I’d like.',
    },
    contextMismatch: contextMismatch(
      [
        ...orderPhrases(
          orderTarget,
          ['fish with onions', 'fish'],
          ['tea', 'some tea', 'orange juice', 'some orange juice'],
        ),
        ...orderPhrases(
          orderAlternate,
          ['fish with onions', 'fish'],
          ['tea', 'some tea', 'orange juice', 'some orange juice'],
        ),
        ...answerVariants(
          orderTarget,
          seaChoices.map(({ main }) => main),
          ['', ', please'],
        ),
      ],
      'Pide el plato acordado para Luz o Sam y una de las bebidas del menú.',
    ),
    writingPattern: p.order,
    requiredReply: true,
    evidence: 'transfer',
    storyPrompt: { speaker: 'Alba', text: 'Cuéntame qué plato y qué bebida lleva este pedido.' },
    storyReplies: transferForms.replies,
    feedback: 'Pide huevos con pan o pollo con arroz y elige té o jugo de naranja.',
  }),
  writing({
    id: 'transfer-open',
    topic: 'order',
    context: 'sea-independent-diet-preference',
    situation:
      'En otra mesa del paseo quieres elegir tu propio plato y preguntar por un ingrediente. Puedes usar una opción del menú o imaginar una alternativa.',
    concept: g.order,
    patterns: [p.order, p.preferences, p.canHave],
    words: [...seaMenuWords, ...orderWords, w.isThere, w.milk, w.in, w.this, w.cheese],
    passage: cartagenaSeaMenu,
    prompt:
      'Escribe tu pedido a Alba y una pregunta sobre los ingredientes. Antes de comparar, revisa que indique el plato, use una petición cortés y mencione el ingrediente.',
    answers: ["I'd like eggs with bread, please. Is there milk in this?"],
    ungradable: {
      feedbackEs:
        'Revisa que Alba pueda identificar el plato y el ingrediente. Comprueba que tu pedido y tu pregunta tengan un propósito claro. Puedes comparar con el modelo cuando termines.',
    },
    writingPattern: p.order,
    feedback: 'El modelo muestra un pedido completo. Compáralo con el que construiste.',
  }),
];

export const cartagenaAssessmentSteps = {
  likes,
  quantity,
  prices,
  order,
  transfer,
} satisfies Record<Topic | 'transfer', TravelStep[]>;

const thirdPersonErrors: LearningError[] = ['third_person'];
const quantityQuestionErrors: LearningError[] = ['quantity_question'];
const countabilityErrors: LearningError[] = ['countability'];
const articleErrors: LearningError[] = ['article'];

export const cartagenaReviewSteps = [
  writing({
    id: 'review-likes-guide',
    topic: 'likes',
    context: 'review-snack-stand-example',
    situation: 'Con she, el verbo like lleva -s. Modelo: She likes tea.',
    concept: g.thirdPerson,
    patterns: [p.thirdPerson],
    words: [w.she, w.like, w.likes, w.tea, w.fruit],
    prompt: 'Ahora cuenta en inglés que a ella le gusta la fruta.',
    answers: ['She likes fruit.'],
    writingPattern: p.thirdPerson,
    guided: true,
    remediates: thirdPersonErrors,
    feedback: 'She likes fruit. Agrega -s a like con she.',
  }),
  writing({
    id: 'review-likes-confirm',
    topic: 'likes',
    context: 'review-library-picnic',
    situation:
      'El club de lectura de Inés organiza un picnic en Ciudad de México. Leo eligió el arroz para el almuerzo.',
    concept: g.thirdPerson,
    patterns: [p.thirdPerson],
    words: [w.he, w.like, w.likes, w.rice],
    prompt: 'Escribe en inglés con he o Leo que a Leo le gusta el arroz.',
    answers: ['He likes rice.', 'Leo likes rice.'],
    writingPattern: p.thirdPerson,
    evidence: 'transfer',
    errors: { third_person: ['He like rice.', 'Leo like rice.'] },
    remediates: thirdPersonErrors,
    feedback: 'Con he o Leo escribe likes con -s.',
  }),
  writing({
    id: 'review-question-guide',
    topic: 'likes',
    context: 'review-hot-drinks-example',
    situation:
      'Con he, usa Does + he + like. Modelo: Does he like tea? Después de does, like va sin -s.',
    concept: g.question,
    patterns: [p.question],
    words: [...questionWords, w.tea, w.coffee],
    prompt: 'Pregunta en inglés si a él le gusta el café.',
    answers: ['Does he like coffee?'],
    writingPattern: p.question,
    guided: true,
    remediates: thirdPersonErrors,
    feedback: 'Does he like coffee? Escribe la -s en does y deja like en su forma base.',
  }),
  writing({
    id: 'review-question-confirm',
    topic: 'likes',
    context: 'review-breakfast-at-home',
    situation: 'Antes de preparar el desayuno en casa, quieres saber si a Luz le gusta la fruta.',
    concept: g.question,
    patterns: [p.question],
    words: [...questionWords, w.fruit],
    prompt: 'Haz la pregunta en inglés usando she o Luz.',
    answers: ['Does she like fruit?', 'Does Luz like fruit?'],
    writingPattern: p.question,
    evidence: 'transfer',
    errors: {
      third_person: ['Does she likes fruit?', 'Does Luz likes fruit?', 'Do she like fruit?'],
    },
    remediates: thirdPersonErrors,
    feedback: 'Con she o Luz usa Does y deja like sin -s.',
  }),
  writing({
    id: 'review-negative-guide',
    topic: 'likes',
    context: 'review-tasting-table-example',
    situation: 'Usa don’t con I y doesn’t con he o she. Modelo: I don’t like tea.',
    concept: g.negative,
    patterns: [p.negative],
    words: [...negativeWords, w.tea, w.fruit],
    prompt: 'Escribe en inglés con I que no te gusta la fruta.',
    answers: ["I don't like fruit."],
    writingPattern: p.negative,
    guided: true,
    remediates: thirdPersonErrors,
    feedback: 'I don’t like fruit. Don’t y do not van con I.',
  }),
  writing({
    id: 'review-negative-confirm',
    topic: 'likes',
    context: 'review-morning-milk-note',
    situation:
      'Deja una nota para otra persona que prepara el desayuno. En este caso, la leche no te gusta.',
    concept: g.negative,
    patterns: [p.negative],
    words: [...negativeWords, w.milk],
    prompt: 'Escribe tu gusto en inglés usando I.',
    answers: ["I don't like milk."],
    writingPattern: p.negative,
    evidence: 'transfer',
    errors: { third_person: ["I doesn't like milk.", 'I does not like milk.'] },
    remediates: thirdPersonErrors,
    feedback: 'Con I usa don’t o do not y después like.',
  }),
  writing({
    id: 'review-quantity-question-guide',
    topic: 'quantity',
    context: 'review-measuring-water-example',
    situation:
      'How much water? pregunta una cantidad de agua. How many bottles? pregunta cuántas botellas hay.',
    concept: g.quantity,
    patterns: [p.howMany, p.howMuch, p.plural],
    words: [...measureWords, w.apple, w.apples],
    prompt: 'Ahora pregunta en inglés por el número de manzanas.',
    answers: ['How many apples?'],
    writingPattern: p.howMany,
    guided: true,
    remediates: quantityQuestionErrors,
    feedback: 'How many apples? Apples se cuenta en unidades.',
  }),
  writing({
    id: 'review-quantity-question-confirm',
    topic: 'quantity',
    context: 'review-kitchen-milk',
    situation:
      'En la cocina de casa necesitan leche para una receta. Te interesa la cantidad de leche.',
    concept: g.quantity,
    patterns: [p.howMany, p.howMuch, p.countable],
    words: [...measureWords, w.milk, w.do, g.question],
    prompt: 'Haz la pregunta en inglés sobre la leche.',
    answers: ['How much milk?', 'How much milk do we need?'],
    contextMismatch: contextMismatch(
      ['How many bottles of milk?', 'How much water?'],
      'Piden la cantidad de leche de la receta sin contar envases.',
    ),
    writingPattern: p.howMuch,
    evidence: 'transfer',
    errors: { quantity_question: ['How many milk?', 'How many milk do we need?'] },
    remediates: quantityQuestionErrors,
    feedback: 'How much milk? pregunta por la cantidad de leche.',
  }),
  writing({
    id: 'review-bread-guide',
    topic: 'quantity',
    context: 'review-bread-portion-example',
    situation:
      'Para el pan ya cortado se cuentan pedazos. Modelo: a piece of bread → two pieces of bread.',
    concept: g.quantity,
    patterns: [p.countable, p.plural],
    words: [w.a, w.piece, w.pieces, w.of, w.bread, ...numbers(2, 3)],
    prompt: 'Escribe la etiqueta en inglés para tres porciones de pan.',
    answers: ['Three pieces of bread.'],
    writingPattern: p.countable,
    guided: true,
    remediates: countabilityErrors,
    feedback: 'Three pieces of bread. El plural corresponde a pieces.',
  }),
  writing({
    id: 'review-bread-confirm',
    topic: 'quantity',
    context: 'review-cafe-sharing-cheese',
    situation:
      'En la merienda de un club, el queso ya está dividido en cuatro pedazos para tu mesa.',
    concept: g.quantity,
    patterns: [p.countable, p.plural],
    words: [w.piece, w.pieces, w.of, w.cheese, w.we, w.need, ...numbers(3, 4)],
    prompt:
      'Sin cambiar la cantidad, escribe en inglés lo que necesitan. Usa la unidad de la situación.',
    answers: ['Four pieces of cheese.', 'We need four pieces of cheese.'],
    contextMismatch: contextMismatch(
      ['Three pieces of cheese.'],
      'La mesa tiene cuatro porciones.',
    ),
    writingPattern: p.countable,
    evidence: 'transfer',
    errors: { countability: ['Four cheeses.', 'Four piece of cheese.'] },
    remediates: countabilityErrors,
    feedback: 'En este caso se cuentan los pedazos: four pieces of cheese.',
  }),
  writing({
    id: 'review-article-guide',
    topic: 'quantity',
    context: 'review-school-snack-label-example',
    situation:
      'Usa an antes de un sonido vocálico. Modelo: an orange. Usa a antes de un sonido consonántico: a banana.',
    concept: g.quantity,
    patterns: [p.article],
    words: [w.a, w.an, w.orange, w.banana, w.apple],
    prompt: 'Escribe en inglés una manzana usando el artículo.',
    answers: ['An apple.'],
    writingPattern: p.article,
    guided: true,
    remediates: articleErrors,
    feedback: 'Apple empieza con sonido vocálico: an apple.',
  }),
  writing({
    id: 'review-article-confirm',
    topic: 'quantity',
    context: 'review-abuelas-kitchen',
    situation: 'Para otra receta, solo necesitas un huevo. Etiqueta el ingrediente en inglés.',
    concept: g.quantity,
    patterns: [p.article],
    words: [w.a, w.an, w.egg, w.eggs, w.i, w.need, ...numbers(2)],
    prompt: 'Escribe la cantidad con el artículo.',
    answers: ['An egg.', 'I need an egg.'],
    contextMismatch: contextMismatch(['Two eggs.'], 'La receta lleva un huevo.'),
    writingPattern: p.article,
    evidence: 'transfer',
    errors: { article: ['A egg.', 'I need a egg.'] },
    remediates: articleErrors,
    feedback: 'Egg empieza con un sonido vocálico. Usa an egg.',
  }),
  writing({
    id: 'review-price-guide',
    topic: 'prices',
    context: 'review-market-price-example',
    situation:
      'Para un precio usa How much is + singular o How much are + plural. Modelo: How much are the eggs?',
    concept: g.price,
    patterns: [p.priceQuestion, p.howMany, p.howMuch],
    words: [...priceQuestionWords, ...measureWords, w.eggs, w.coffee],
    prompt: 'Ahora pregunta cuánto cuesta el café en inglés.',
    answers: ['How much is the coffee?', 'How much is coffee?'],
    writingPattern: p.priceQuestion,
    guided: true,
    remediates: ['be_agreement', 'quantity_question'],
    feedback: 'How much is the coffee? Usa is para el café del menú.',
  }),
  writing({
    id: 'review-price-confirm',
    topic: 'prices',
    context: 'review-street-fruit-price',
    situation: 'En otro puesto quieres saber el precio de las bananas de la bandeja.',
    concept: g.price,
    patterns: [p.priceQuestion, p.howMany],
    words: [...priceQuestionWords, w.banana, w.bananas, w.howMany],
    prompt: 'Pregunta el precio en inglés.',
    answers: ['How much are the bananas?', 'How much are bananas?'],
    contextMismatch: contextMismatch(
      ['How many bananas?'],
      'Quieres saber el precio de las bananas.',
    ),
    writingPattern: p.priceQuestion,
    evidence: 'transfer',
    errors: {
      be_agreement: ['How much is the bananas?'],
      quantity_question: ['How much bananas?', 'How many is the bananas?'],
    },
    remediates: ['be_agreement', 'quantity_question'],
    feedback: 'Bananas está en plural. Usa How much are the bananas?',
  }),
  writing({
    id: 'review-price-total',
    topic: 'prices',
    context: 'review-ferry-snack-price',
    situation:
      'En el muelle, una persona quiere saber en inglés cuánto cuestan los huevos de este puesto.',
    concept: g.price,
    patterns: [p.priceAnswer, p.pesos],
    words: [
      w.cop,
      w.eggs,
      w.are,
      w.the,
      w.they,
      w.theyre,
      w.pesos,
      w.colombianPesos,
      w.thousand,
      w.dollars,
      ...numbers(10),
    ],
    passage: 'Eggs — COP 10,000',
    prompt: 'Dile el precio en palabras. Puedes nombrar los huevos o usar they.',
    answers: answerVariants(
      ["They're ", 'The eggs are '],
      ['ten thousand pesos.', 'ten thousand Colombian pesos.'],
    ),
    contextMismatch: contextMismatch(
      ["They're ten dollars.", 'The eggs are ten dollars.'],
      'La moneda del menú es el peso colombiano.',
    ),
    writingPattern: p.priceAnswer,
    evidence: 'transfer',
    feedback: 'Ten thousand pesos son diez mil pesos colombianos.',
  }),
  writing({
    id: 'review-order-coffee-guide',
    topic: 'order',
    context: 'review-coffee-tray-example',
    situation:
      'Para pedir dos tazas puedes decir two cups of coffee. En una cafetería también se dice two coffees para dos porciones.',
    concept: g.order,
    patterns: [p.order, p.canHave, p.countable, p.plural],
    words: [...orderWords, w.cups, w.coffee, w.coffees, ...numbers(2, 3)],
    prompt: 'Pide tres cafés con I’d like. Expresa el número de porciones.',
    answers: answerVariants(
      orderTarget,
      ['three coffees', 'three cups of coffee'],
      ['', ', please'],
    ),
    writingPattern: p.order,
    guided: true,
    remediates: countabilityErrors,
    feedback: 'Three coffees o three cups of coffee expresa tres porciones.',
  }),
  writing({
    id: 'review-order-coffee-confirm',
    topic: 'order',
    context: 'review-station-coffee-order',
    situation:
      'En el pequeño café al lado del transporte, Sam y Luz quieren un café cada uno. Haz el pedido.',
    concept: g.order,
    patterns: [p.order, p.canHave, p.countable, p.plural],
    words: [...orderWords, w.coffee, w.coffees, w.cups, ...numbers(2, 3)],
    prompt:
      'Pide en inglés dos tazas de café usando I’d like. Deja claro cuántas porciones quieres.',
    answers: answerVariants(orderTarget, ['two coffees', 'two cups of coffee'], ['', ', please']),
    communicationOnly: {
      answers: answerVariants(
        orderAlternate,
        ['two coffees', 'two cups of coffee'],
        ['', ', please'],
      ),
      feedbackEs:
        'Tu pedido comunica dos tazas. Para practicar la expresión de esta actividad, usa I’d like.',
    },
    contextMismatch: contextMismatch(
      answerVariants(
        orderTarget,
        ['some coffee', 'three coffees', 'three cups of coffee'],
        ['', ', please'],
      ),
      'Sam y Luz necesitan una taza cada uno. Indica dos porciones.',
    ),
    writingPattern: p.order,
    evidence: 'transfer',
    errors: {
      countability: [
        "I'd like two coffee.",
        "I'd like two coffee, please.",
        "I'd like two cup of coffee, please.",
      ],
    },
    remediates: countabilityErrors,
    feedback:
      'Two coffees y two cups of coffee son formas naturales de pedir dos porciones en un café.',
  }),
  writing({
    id: 'review-order-coffee',
    topic: 'order',
    context: 'review-pastry-counter',
    situation: 'En el puesto de pan, Sam y Luz acuerdan comprar dos cafés, uno para cada persona.',
    concept: g.order,
    patterns: [p.order, p.canHave, p.countable, p.plural],
    words: [...orderWords, w.coffee, w.coffees, w.cups, ...numbers(2, 4)],
    prompt: 'Haz el pedido con I’d like. Pide la cantidad acordada.',
    answers: answerVariants(orderTarget, ['two coffees', 'two cups of coffee'], ['', ', please']),
    communicationOnly: {
      answers: answerVariants(
        orderAlternate,
        ['two coffees', 'two cups of coffee'],
        ['', ', please'],
      ),
      feedbackEs: 'Tu pedido comunica lo necesario. Usa I’d like para practicar el modelo.',
    },
    contextMismatch: contextMismatch(
      answerVariants(
        orderTarget,
        ['some coffee', 'four coffees', 'four cups of coffee'],
        ['', ', please'],
      ),
      'En este puesto pidieron dos porciones.',
    ),
    writingPattern: p.order,
    evidence: 'transfer',
    errors: {
      countability: [
        "I'd like two coffee.",
        "I'd like two coffee, please.",
        "I'd like two cup of coffee, please.",
      ],
    },
    feedback: 'Two coffees y two cups of coffee expresan las dos porciones.',
  }),
  writing({
    id: 'review-order-check',
    topic: 'order',
    context: 'review-library-cafe-check',
    situation: 'Después de comer en el café de la biblioteca de Inés, ya quieres pagar.',
    concept: g.order,
    patterns: [p.check, p.canHave],
    words: [w.canIHave, w.the, w.check, w.bill, w.please, w.menu],
    prompt: 'Escribe en inglés una petición cortés para pedir la cuenta.',
    answers: answerVariants('Can I have the ', ['check', 'bill'], [', please?', '?']),
    contextMismatch: contextMismatch(
      ['Can I have the menu, please?'],
      'Quieres pagar. Pide el check o bill.',
    ),
    writingPattern: p.check,
    evidence: 'transfer',
    feedback: 'Can I have the check, please? También puedes pedir the bill.',
  }),
];

export const cartagenaPractice = cartagenaReviewSteps;
