import type { AnswerKey, LearningError } from '@lingoquest/contracts';
import type { ScenarioTurn } from '@lingoquest/course-pack';
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
import { cartagenaCafeMenu, cartagenaSeaMenu } from './cartagena-scenarios';

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
  scenarioTurn?: ScenarioTurn;
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
    ...(item.scenarioTurn && { scenarioTurn: item.scenarioTurn }),
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
  w.couldIHave,
  w.please,
  w.and,
  w.with,
  w.without,
  w.no,
  w.some,
  w.a,
  w.an,
  w.of,
  w.bottle,
  w.bottles,
  w.glass,
  w.glasses,
  w.cup,
  w.cups,
  w.for,
  w.coffees,
  ...numbers(1, 2, 3),
];
export { cartagenaCafeMenu, cartagenaSeaMenu } from './cartagena-scenarios';

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
  choice({
    id: 'likes-food-listen',
    topic: 'likes',
    context: 'market-specials-audio',
    situation: 'Mar anuncia uno de los acompañamientos del puesto.',
    concept: w.coconutRice,
    patterns: [],
    words: [],
    prompt: 'Escucha el nombre y elige lo que ofrece.',
    audio: 'Coconut rice.',
    choices: ['Arroz con coco.', 'Pescado frito.', 'Patacones.'],
    feedback: 'Coconut rice es arroz con coco.',
  }),
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
      quantity_count_question: [
        'How many water?',
        'How much bottles of water?',
        'How many water do we need?',
      ],
    },
    writingPattern: p.howMany,
    feedback: 'Usa how many con bottles of water. How much water pregunta por la cantidad de agua.',
  }),
  writing({
    id: 'quantity-mass-write',
    topic: 'quantity',
    context: 'market-mass-question',
    situation: 'La leche está en una jarra grande. Necesitas saber cuánta usar.',
    concept: g.quantity,
    patterns: [p.howMuch, p.howMany],
    words: [w.milk, w.howMuch, w.howMany, w.do, w.we, w.need],
    prompt: 'Pregunta en inglés por la cantidad de leche, sin especificar envases.',
    answers: ['How much milk?', 'How much milk do we need?'],
    errors: { quantity_mass_question: ['How many milk?', 'How many milk do we need?'] },
    writingPattern: p.howMuch,
    feedback: 'Para preguntar por una cantidad sin envases, usa how much milk.',
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
    patterns: [p.priceQuestion, p.priceIs, p.howMany, p.howMuch],
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
    patterns: [p.priceQuestion, p.priceAre, p.howMany, p.howMuch],
    words: [...priceQuestionWords, ...measureWords, w.egg, w.eggs, w.coffee],
    prompt: 'Pregunta en inglés cuánto cuestan los huevos.',
    answers: ['How much are the eggs?', 'How much are eggs?'],
    contextMismatch: contextMismatch(
      ['How much is the coffee?', 'How many eggs?'],
      'Pregunta por el precio de los huevos.',
    ),
    errors: {
      price_question: ['How much is the eggs?', 'How much eggs?', 'How many is the eggs?'],
    },
    writingPattern: p.priceAre,
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

const grammarTarget = (target: PrerequisiteReference): UnifiedEvidenceTarget => ({
  targetId: target.id,
  dimension: 'grammar_production',
});
const writingTarget = (target: PrerequisiteReference): UnifiedEvidenceTarget => ({
  targetId: target.id,
  dimension: 'writing',
});

const cafeRequestWords = [...cafeMenuWords, ...orderWords, w.cheese, w.milk, w.plate, w.plates];
const seaRequestWords = [...seaMenuWords, ...orderWords, w.milk, w.plate, w.plates];
const requestPatterns = [p.order, p.canHaveExact, p.couldHave, p.countable];
const orderTarget = "I'd like ";
const orderAlternate = 'Can I have ';
const confirmWords = [w.yes, w.thatsRight, w.thats, w.isThatRight, w.noThankYou, w.yesPlease];
const finishWords = [w.thatsAll, w.noThankYou, w.yesPlease, w.thankYou];

function menuRequest(location: 'order' | 'transfer') {
  return writing({
    id: `${location}-menu`,
    topic: 'order',
    context: `${location}-menu-request`,
    situation: 'Alba tiene la carta. Pídele que te la muestre antes de decidir.',
    concept: g.politeOrder,
    patterns: [p.canSee, p.canHaveExact],
    words: [w.canISee, w.canIHave, w.the, w.menu, w.please],
    prompt: 'Pide el menú con cortesía.',
    answers: ['Can I see the menu, please?', 'Please, can I have the menu?'],
    scenarioTurn: {
      action: 'menu',
      targetForms: ['can-see', 'can-have'],
      formTargets: [
        { form: 'can-see', targets: [grammarTarget(g.politeOrder), writingTarget(p.canSee)] },
        {
          form: 'can-have',
          targets: [grammarTarget(g.politeOrder), writingTarget(p.canHaveExact)],
        },
      ],
    },
    writingPattern: p.canSee,
    extraTargets: [writingTarget(p.canHaveExact)],
    requiredReply: true,
    storyPrompt: { speaker: 'Alba', text: '¿Quieres ver la carta antes de decidir?' },
    feedback: 'Puedes pedir que te muestren la carta o que te la traigan.',
  });
}

function placeOrder({
  id,
  context,
  situation,
  words,
  sample,
  alternative,
  mismatch,
  feedback,
  transfer,
}: {
  id: 'order-write' | 'transfer-order';
  context: string;
  situation: string;
  words: PrerequisiteReference[];
  sample: string;
  alternative: string;
  mismatch: string[];
  feedback: string;
  transfer?: true;
}) {
  return writing({
    id,
    topic: 'order',
    context,
    situation,
    concept: g.order,
    patterns: requestPatterns,
    words: [...words, g.politeOrder],
    prompt: 'Escribe tu pedido con I’d like. Incluye un plato y la bebida o bebidas que eliges.',
    answers: [sample],
    communicationOnly: {
      answers: [alternative],
      feedbackEs:
        'Alba entiende el pedido. Puedes usar I’d like para practicar la forma de esta actividad.',
    },
    contextMismatch: contextMismatch(mismatch, feedback),
    scenarioTurn: {
      action: 'request',
      targetForms: ['would-like'],
      formTargets: [
        { form: 'would-like', targets: [grammarTarget(g.order), writingTarget(p.order)] },
      ],
      feedback: {
        communication_only:
          'Alba entiende el pedido. Puedes usar I’d like para practicar la forma de esta actividad.',
      },
    },
    writingPattern: p.order,
    requiredReply: true,
    ...(transfer && { evidence: 'transfer' }),
    storyPrompt: { speaker: 'Alba', text: '¿Qué eligen del menú?' },
    feedback,
  });
}

function recapConfirmation(id: string, context: string) {
  return writing({
    id,
    topic: 'order',
    context,
    situation: 'Lee lo que Alba anotó. Si coincide con lo que pediste, díselo.',
    concept: g.politeOrder,
    patterns: [p.confirm, p.affirmRecap],
    words: confirmWords,
    prompt: 'Confirma en inglés que el pedido es correcto.',
    answers: ["That's right.", "Yes, that's right."],
    scenarioTurn: {
      action: 'confirm',
      targetForms: ['confirm'],
      formTargets: [{ form: 'confirm', targets: [writingTarget(p.affirmRecap)] }],
    },
    writingPattern: p.affirmRecap,
    requiredReply: true,
    storyPrompt: { speaker: 'Alba', text: '¿Está bien así?' },
    feedback: 'Confirma solo cuando coincidan el plato, la bebida y la cantidad.',
  });
}

function replaceSelection({
  id,
  context,
  situation,
  words,
  sample,
  mismatch,
  targetFrame,
  transfer,
}: {
  id: 'order-correct' | 'transfer-change';
  context: string;
  situation: string;
  words: PrerequisiteReference[];
  sample: string;
  mismatch: string[];
  targetFrame: 'can-have' | 'could-have';
  transfer?: true;
}) {
  return writing({
    id,
    topic: 'order',
    context,
    situation,
    concept: g.politeOrder,
    patterns: [...requestPatterns, p.insteadOf],
    words: [...words, w.insteadOf, g.order],
    prompt: 'Usa instead of. Nombra primero el producto nuevo y luego el que vas a quitar.',
    answers: [sample],
    contextMismatch: contextMismatch(
      mismatch,
      'Revisa el pedido actual antes de sustituir un producto.',
    ),
    scenarioTurn: {
      action: 'replace',
      targetForms: [
        targetFrame,
        targetFrame === 'can-have' ? 'could-have' : 'can-have',
        'would-like',
      ],
      formTargets: [
        {
          form: 'can-have',
          targets: [
            grammarTarget(g.politeOrder),
            writingTarget(p.canHaveExact),
            writingTarget(p.insteadOf),
          ],
        },
        {
          form: 'could-have',
          targets: [
            grammarTarget(g.politeOrder),
            writingTarget(p.couldHave),
            writingTarget(p.insteadOf),
          ],
        },
        {
          form: 'would-like',
          targets: [grammarTarget(g.order), writingTarget(p.order), writingTarget(p.insteadOf)],
        },
      ],
    },
    writingPattern: p.insteadOf,
    extraTargets: [
      writingTarget(p.canHaveExact),
      writingTarget(p.couldHave),
      writingTarget(p.order),
      grammarTarget(g.order),
    ],
    requiredReply: true,
    ...(transfer && { evidence: 'transfer' }),
    storyPrompt: { speaker: 'Alba', text: '¿Qué quieres cambiar de lo que anoté?' },
    feedback: 'Revisa el producto sustituido y las demás líneas del pedido.',
  });
}

function closeOrder(id: string, context: string) {
  return writing({
    id,
    topic: 'order',
    context,
    situation: 'Alba espera para saber si quieres agregar algo más al pedido confirmado.',
    concept: g.politeOrder,
    patterns: [p.confirm, p.closeOrder],
    words: finishWords,
    prompt: 'Indica en inglés que es todo y agradece.',
    answers: ["That's all, thank you.", 'No, thank you.'],
    scenarioTurn: {
      action: 'finish',
      targetForms: ['finish'],
      formTargets: [{ form: 'finish', targets: [writingTarget(p.closeOrder)] }],
    },
    writingPattern: p.closeOrder,
    requiredReply: true,
    storyPrompt: { speaker: 'Alba', text: '¿Algo más?' },
    feedback: 'Puedes cerrar con That’s all, thank you o No, thank you.',
  });
}

function requestCheck(id: string, context: string) {
  return writing({
    id,
    topic: 'order',
    context,
    situation: 'Ya terminaron de comer y quieren pagar el pedido que se confirmó.',
    concept: g.politeOrder,
    patterns: [p.check, p.canHaveExact, p.priceIs],
    words: [w.canIHave, w.the, w.check, w.bill, w.please, w.howMuchPrice, w.total, w.is, g.price],
    prompt: 'Pide la cuenta con cortesía o pregunta cuánto deben pagar en total.',
    answers: [
      'Can I have the check, please?',
      'Can I have the bill, please?',
      'How much is the total?',
    ],
    scenarioTurn: {
      action: 'bill',
      targetForms: ['can-have', 'price'],
      formTargets: [
        {
          form: 'can-have',
          targets: [
            grammarTarget(g.politeOrder),
            writingTarget(p.canHaveExact),
            writingTarget(p.check),
          ],
        },
        { form: 'price', targets: [grammarTarget(g.price), writingTarget(p.priceIs)] },
      ],
    },
    writingPattern: p.check,
    extraTargets: [writingTarget(p.priceIs), writingTarget(p.canHaveExact), grammarTarget(g.price)],
    requiredReply: true,
    storyPrompt: { speaker: 'Alba', text: '¿Qué necesitas antes de pagar?' },
    feedback: 'El total se calcula con los productos y cantidades del pedido confirmado.',
  });
}

const order = [
  menuRequest('order'),
  choice({
    id: 'order-read',
    topic: 'order',
    context: 'cafe-menu-ingredients',
    situation: 'Sam quiere arroz. Luz prefiere evitar el queso. Consulta las opciones de la carta.',
    concept: g.price,
    patterns: [p.preferences],
    words: cafeMenuWords,
    passage: cartagenaCafeMenu,
    prompt: '¿Qué opción de la lista lleva arroz y aparece sin queso?',
    choices: ['Huevos con queso.', 'Pollo con arroz.', 'Café.'],
    correct: 1,
    feedback: 'Chicken with rice indica pollo con arroz.',
  }),
  choice({
    id: 'order-recognize',
    topic: 'order',
    context: 'cafe-guest-and-server',
    situation: 'Lee lo que indica cada persona mientras Luz y Alba organizan la mesa.',
    concept: g.order,
    patterns: [p.order, p.canHaveExact],
    words: [w.idLike, w.canIHave, w.some, w.water, w.tea, w.please, w.whatWouldYouLike],
    passage: "Alba: What would you like?\nLuz: I'd like some tea, please.",
    prompt: '¿Qué hace Luz en este diálogo?',
    choices: ['Pregunta por el precio.', 'Pide té.', 'Pide agua.'],
    correct: 1,
    feedback: 'I’d like some tea es una petición cortés para pedir té.',
  }),
  placeOrder({
    id: 'order-write',
    context: 'cafe-first-order',
    situation:
      'Pide un plato para compartir con arroz y sin queso. Elige una o dos bebidas de la carta. Tienen COP 35,000 para todo.',
    words: cafeRequestWords,
    sample: "I'd like chicken with rice and a cup of coffee, please.",
    alternative: 'Could I have a glass of water and fish with rice, please?',
    mismatch: [
      "I'd like eggs with cheese and some water, please.",
      "I'd like chicken without rice and coffee, please.",
      "I'd like two plates of chicken with rice and some water, please.",
    ],
    feedback: 'Revisa el arroz, las preferencias, las porciones y el presupuesto de la mesa.',
  }),
  recapConfirmation('order-confirm', 'cafe-check-your-recap'),
  replaceSelection({
    id: 'order-correct',
    context: 'cafe-change-your-order',
    situation:
      'Antes de que Alba lleve el pedido, elige otro plato o bebida del menú. El pedido nuevo deberá seguir cumpliendo las necesidades de la mesa y el presupuesto.',
    words: cafeRequestWords,
    sample: 'Can I have water instead of coffee?',
    mismatch: ['Can I have milk instead of coffee?'],
    targetFrame: 'can-have',
  }),
  recapConfirmation('order-confirm-updated', 'cafe-check-the-changed-order'),
  choice({
    id: 'order-listen',
    topic: 'order',
    context: 'cafe-server-follow-up',
    situation: 'Ahora que Alba anotó tu cambio y confirmó el pedido, hace otra pregunta.',
    concept: g.politeOrder,
    patterns: [p.confirm, p.closeOrder],
    words: [w.anythingElse, w.thatsAll],
    prompt: '¿Qué quiere confirmar Alba?',
    audio: 'Anything else?',
    choices: ['Si quieren algo más.', 'Cuánto cuesta el agua.', 'Si faltan sillas.'],
    storyPrompt: { speaker: 'Alba', text: 'Escucha mi pregunta para saber si quieres algo más.' },
    feedback: 'Anything else? pregunta si quieres añadir algo más.',
  }),
  closeOrder('order-close', 'cafe-final-confirmation'),
  requestCheck('order-check', 'cafe-bill-request'),
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
  menuRequest('transfer'),
  placeOrder({
    id: 'transfer-order',
    context: 'sea-first-order',
    situation:
      'Tienen COP 34,000 para compartir un plato sin cebolla y una o dos bebidas. La carta tiene opciones distintas de las del café. Elige lo que pedirás para la mesa.',
    words: seaRequestWords,
    sample: "I'd like eggs with bread and some tea, please.",
    alternative: 'Could I have chicken with rice and a glass of orange juice, please?',
    mismatch: [
      "I'd like fish with onions and some tea, please.",
      "I'd like chicken with rice and three cups of tea, please.",
    ],
    feedback: 'Revisa la restricción de Luz, la cantidad de bebidas y el presupuesto de la mesa.',
    transfer: true,
  }),
  recapConfirmation('transfer-confirm', 'sea-check-your-recap'),
  replaceSelection({
    id: 'transfer-change',
    context: 'sea-change-after-recapping',
    situation:
      'Ahora tus compañeros quieren probar algo diferente. Cambia el plato o una bebida del pedido. Revisa la restricción de Luz y el precio del pedido completo.',
    words: seaRequestWords,
    sample: 'Could I have chicken with rice instead of eggs with bread?',
    mismatch: ['Could I have fish with onions instead of eggs with bread?'],
    targetFrame: 'could-have',
    transfer: true,
  }),
  recapConfirmation('transfer-confirm-updated', 'sea-check-the-changed-order'),
  closeOrder('transfer-close', 'sea-final-confirmation'),
  requestCheck('transfer-check', 'sea-bill-request'),
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
const countabilityErrors: LearningError[] = ['countability'];
const articleErrors: LearningError[] = ['article'];

const reviewWouldLike = "I'd like ";
const reviewCanHave = 'Can I have ';
const reviewReplacement = 'water instead of orange juice';
const reviewCanReplace = answerVariants(reviewCanHave, reviewReplacement, ['?', ', please?']);
const reviewCouldReplace = answerVariants('Could I have ', reviewReplacement, ['?', ', please?']);

const contextualReviewSteps = [
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
    remediates: ['quantity_count_question'],
    feedback: 'How many apples? Apples se cuenta en unidades.',
  }),
  writing({
    id: 'review-quantity-count-question-confirm',
    topic: 'quantity',
    context: 'review-shared-coffee-tray',
    situation: 'En el club de lectura van a servir café. Quieres saber cuántas tazas preparar.',
    concept: g.quantity,
    patterns: [p.howMany, p.countable],
    words: [w.howMany, w.cups, w.of, w.coffee, w.do, w.we, w.need, g.question],
    prompt: 'Pregunta en inglés por el número de tazas de café que necesitan.',
    answers: ['How many cups of coffee?', 'How many cups of coffee do we need?'],
    writingPattern: p.howMany,
    evidence: 'transfer',
    errors: {
      quantity_count_question: ['How much cups of coffee?', 'How much cups of coffee do we need?'],
    },
    remediates: ['quantity_count_question'],
    feedback: 'Cups es una unidad en plural. Pregunta con How many cups of coffee?',
  }),
  writing({
    id: 'review-quantity-mass-question-guide',
    topic: 'quantity',
    context: 'review-cooking-rice',
    situation:
      'Para preguntar por una cantidad sin contar vasos o botellas, usa how much. Ejemplo: How much water?',
    concept: g.quantity,
    patterns: [p.howMuch],
    words: [w.howMuch, w.water, w.rice],
    prompt: 'Pregunta cuánto arroz hace falta para cocinar.',
    answers: ['How much rice?'],
    writingPattern: p.howMuch,
    guided: true,
    remediates: ['quantity_mass_question'],
    feedback: 'How much rice? Rice es lo que quieres medir en esta receta.',
  }),
  writing({
    id: 'review-quantity-question-confirm',
    topic: 'quantity',
    context: 'review-picnic-juice-pitcher',
    situation: 'En un picnic van a repartir jugo de una jarra. Averigua la cantidad que necesitan.',
    concept: g.quantity,
    patterns: [p.howMany, p.howMuch, p.countable],
    words: [...measureWords, w.juice, w.do, g.question],
    prompt: 'Pregunta en inglés cuánto jugo necesitan, sin contar envases.',
    answers: ['How much juice?', 'How much juice do we need?'],
    contextMismatch: contextMismatch(
      ['How many bottles of juice?', 'How much water?'],
      'Piden la cantidad de jugo sin contar envases.',
    ),
    writingPattern: p.howMuch,
    evidence: 'transfer',
    errors: { quantity_mass_question: ['How many juice?', 'How many juice do we need?'] },
    remediates: ['quantity_mass_question'],
    feedback: 'How much juice? pregunta por la cantidad de jugo.',
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
      'En una pregunta de precio con un nombre en plural, usa how much are. Ejemplo: How much are the eggs?',
    concept: g.price,
    patterns: [p.priceQuestion, p.priceAre],
    words: [...priceQuestionWords, w.eggs, w.apples],
    prompt: 'Ahora pregunta cuánto cuestan las manzanas en inglés.',
    answers: ['How much are the apples?', 'How much are apples?'],
    writingPattern: p.priceAre,
    guided: true,
    remediates: ['be_agreement', 'price_question'],
    feedback: 'How much are the apples? Usa are porque apples está en plural.',
  }),
  writing({
    id: 'review-price-confirm',
    topic: 'prices',
    context: 'review-street-fruit-price',
    situation: 'En otro puesto quieres saber el precio de las bananas de la bandeja.',
    concept: g.price,
    patterns: [p.priceQuestion, p.priceAre, p.howMany],
    words: [...priceQuestionWords, w.banana, w.bananas, w.howMany],
    prompt: 'Pregunta el precio en inglés.',
    answers: ['How much are the bananas?', 'How much are bananas?'],
    contextMismatch: contextMismatch(
      ['How many bananas?'],
      'Quieres saber el precio de las bananas.',
    ),
    writingPattern: p.priceAre,
    evidence: 'transfer',
    errors: {
      be_agreement: ['How much is the bananas?'],
      price_question: ['How much bananas?', 'How many is the bananas?'],
    },
    remediates: ['be_agreement', 'price_question'],
    feedback: 'Bananas está en plural. Usa How much are the bananas?',
  }),
  writing({
    id: 'review-price-singular',
    topic: 'prices',
    context: 'review-train-station-tea',
    situation: 'En la cafetería de una estación quieres saber cuánto cuesta el té.',
    concept: g.price,
    patterns: [p.priceQuestion, p.priceIs],
    words: [w.howMuchPrice, w.is, w.the, w.tea],
    prompt: 'Pregunta el precio en inglés.',
    answers: ['How much is the tea?', 'How much is tea?'],
    writingPattern: p.priceIs,
    evidence: 'transfer',
    feedback: 'How much is the tea? Usa is para preguntar el precio de esta bebida.',
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
      reviewWouldLike,
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
    answers: answerVariants(
      reviewWouldLike,
      ['two coffees', 'two cups of coffee'],
      ['', ', please'],
    ),
    communicationOnly: {
      answers: answerVariants(
        reviewCanHave,
        ['two coffees', 'two cups of coffee'],
        ['', ', please'],
      ),
      feedbackEs:
        'Tu pedido comunica dos tazas. Para practicar la expresión de esta actividad, usa I’d like.',
    },
    contextMismatch: contextMismatch(
      answerVariants(
        reviewWouldLike,
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
    answers: answerVariants(
      reviewWouldLike,
      ['two coffees', 'two cups of coffee'],
      ['', ', please'],
    ),
    communicationOnly: {
      answers: answerVariants(
        reviewCanHave,
        ['two coffees', 'two cups of coffee'],
        ['', ', please'],
      ),
      feedbackEs: 'Tu pedido comunica lo necesario. Usa I’d like para practicar el modelo.',
    },
    contextMismatch: contextMismatch(
      answerVariants(
        reviewWouldLike,
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
    concept: g.politeOrder,
    patterns: [p.check, p.canHaveExact],
    words: [w.canIHave, w.the, w.check, w.bill, w.please, w.menu],
    prompt: 'Escribe en inglés una petición cortés para pedir la cuenta.',
    answers: answerVariants('Can I have the ', ['check', 'bill'], [', please?', '?']),
    contextMismatch: contextMismatch(
      ['Can I have the menu, please?'],
      'Quieres pagar. Pide el check o bill.',
    ),
    writingPattern: p.check,
    extraTargets: [{ targetId: p.canHaveExact.id, dimension: 'writing' }],
    evidence: 'transfer',
    feedback: 'Can I have the check, please? También puedes pedir the bill.',
  }),
  writing({
    id: 'review-order-request-guide',
    topic: 'order',
    context: 'review-park-kiosk-example',
    situation: 'Para pedir algo, empieza con I’d like. Modelo: I’d like some tea, please.',
    concept: g.order,
    patterns: [p.order],
    words: [w.idLike, w.wouldLike, w.i, w.some, w.tea, w.water, w.please],
    prompt: 'Pide agua para tu mesa con I’d like.',
    answers: answerVariants("I'd like ", ['water', 'some water'], ['', ', please']),
    writingPattern: p.order,
    guided: true,
    remediates: ['request_form'],
    feedback: 'I’d like some water, please expresa un pedido.',
  }),
  writing({
    id: 'review-order-request-confirm',
    topic: 'order',
    context: 'review-ferry-coffee-counter',
    situation: 'En el muelle vas a pedir café para tomar antes de subir al barco.',
    concept: g.order,
    patterns: [p.order],
    words: [w.idLike, w.wouldLike, w.i, w.some, w.coffee, w.please],
    prompt: 'Haz un pedido cortés de café con I’d like.',
    answers: answerVariants("I'd like ", ['coffee', 'some coffee'], ['', ', please']),
    writingPattern: p.order,
    evidence: 'transfer',
    errors: { request_form: ['I like coffee, please.', 'I would coffee, please.'] },
    remediates: ['request_form'],
    feedback: 'I’d like some coffee, please expresa lo que deseas pedir.',
  }),
  writing({
    id: 'review-order-replacement-guide',
    topic: 'order',
    context: 'review-hotel-breakfast-example',
    situation:
      'Para cambiar un pedido, di primero lo nuevo. En Can I have water instead of coffee?, quieres agua y quitas el café.',
    concept: g.politeOrder,
    patterns: [p.canHaveExact, p.insteadOf],
    words: [w.canIHave, w.water, w.coffee, w.insteadOf, w.tea, w.please],
    prompt: 'Ahora pide té en vez de café.',
    answers: ['Can I have tea instead of coffee?', 'Can I have tea instead of coffee, please?'],
    writingPattern: p.insteadOf,
    guided: true,
    remediates: ['replacement_form'],
    feedback: 'Can I have tea instead of coffee? Tea es la bebida nueva.',
  }),
  {
    ...writing({
      id: 'review-order-replacement-confirm',
      topic: 'order',
      context: 'review-picnic-drink-change',
      situation: 'En el puesto de un picnic ya pediste jugo de naranja. Prefieres agua.',
      concept: g.politeOrder,
      patterns: [p.canHaveExact, p.couldHave, p.insteadOf],
      words: [w.canIHave, w.couldIHave, w.water, w.insteadOf, w.orangeJuice, w.please],
      prompt: 'Pide el cambio por agua en inglés. Indica qué bebida vas a cambiar.',
      answers: [...reviewCanReplace, ...reviewCouldReplace],
      extraTargets: [writingTarget(p.canHaveExact), writingTarget(p.couldHave)],
      writingPattern: p.insteadOf,
      evidence: 'transfer',
      errors: {
        replacement_form: [
          'Can I have water instead orange juice?',
          'Could I have water instead orange juice?',
        ],
      },
      remediates: ['replacement_form'],
      contextMismatch: contextMismatch(
        ['Can I have orange juice instead of water?'],
        'El cambio es de jugo a agua.',
      ),
      feedback: 'Di water primero y orange juice después de instead of.',
    }),
    answerEvidence: [
      {
        answers: reviewCanReplace,
        targets: [
          grammarTarget(g.politeOrder),
          writingTarget(p.insteadOf),
          writingTarget(p.canHaveExact),
        ],
      },
      {
        answers: reviewCouldReplace,
        targets: [
          grammarTarget(g.politeOrder),
          writingTarget(p.insteadOf),
          writingTarget(p.couldHave),
        ],
      },
    ],
  },
];

type LexicalReview = {
  id: string;
  topic: Topic;
  context: string;
  target: PrerequisiteReference;
  situation: string;
  prompt: string;
  feedback: string;
  words?: PrerequisiteReference[];
  passage?: string;
  audio?: string;
  guided?: true;
  remediates?: LearningError[];
  errors?: LearningTarget['errorAnswers'];
} & (
  | { choices: [string, string, ...string[]]; correct?: number }
  | { answer: string; sentence?: string }
);

function lexicalReview(item: LexicalReview): TravelExerciseStep {
  const keyed = 'answer' in item;
  const step = assessment({
    id: `review-lex-${item.id}`,
    topic: item.topic,
    context: `review-${item.context}`,
    situation: item.situation,
    concept: item.target,
    patterns: [],
    words: item.words ?? [],
    skill: item.audio ? 'listening' : 'vocabulary',
    dimension: item.audio ? 'listening' : keyed ? 'vocabulary_recall' : 'vocabulary_recognition',
    evidence: keyed ? 'recall' : 'recognition',
    ...(item.audio && { audio: item.audio }),
    ...(item.guided && { guided: true }),
    ...(item.remediates && { remediates: item.remediates }),
    ...(item.errors && { errors: item.errors }),
    exercise: {
      type: keyed ? 'short_text' : 'meaning',
      promptEs: item.prompt,
      acceptedAnswers: keyed ? [item.answer] : [],
      feedbackEs: item.feedback,
      ...(item.passage && { passage: item.passage }),
      ...(keyed && item.sentence && { sentence: item.sentence }),
      ...(!keyed && {
        options: item.choices.map((text, index) => ({ id: String(index + 1), text })),
        correctOptionId: String((item.correct ?? 0) + 1),
        optionsLanguage: 'es',
      }),
    },
  });
  return { ...step, reviewMissionId: `cartagena-${item.topic}` };
}

const lexicalReviews: LexicalReview[] = [
  {
    id: 'chicken-sense',
    topic: 'likes',
    context: 'snack-table-chicken',
    target: w.chicken,
    situation: 'Ves esta opción en un menú.',
    passage: 'Chicken with rice',
    words: [w.with, w.rice],
    prompt: '¿Qué significa chicken en este menú?',
    choices: ['Pollo como alimento.', 'Una gallina viva.', 'Arroz.'],
    feedback: 'Chicken se refiere al pollo que vas a comer.',
  },
  {
    id: 'egg-arepa',
    topic: 'likes',
    context: 'bakery-list-arepa',
    target: w.eggArepa,
    situation: 'Consulta el letrero del puesto.',
    passage: 'Egg arepa',
    prompt: '¿Cuál de estas opciones ofrece el letrero?',
    choices: ['Arroz con coco.', 'Una arepa con huevo.', 'Pescado frito.'],
    correct: 1,
    feedback: 'Egg arepa es una arepa con huevo.',
  },
  {
    id: 'coconut-rice-listen',
    topic: 'likes',
    context: 'lunch-announcement-rice',
    target: w.coconutRice,
    situation: 'Escucha qué ofrece la persona del puesto.',
    audio: 'Coconut rice.',
    prompt: '¿Qué alimento escuchaste?',
    choices: ['Pescado frito.', 'Arepa con huevo.', 'Arroz con coco.'],
    correct: 2,
    feedback: 'Coconut rice es arroz con coco.',
  },
  {
    id: 'coffee-serving',
    topic: 'quantity',
    context: 'cash-register-coffee',
    target: w.coffees,
    situation: 'Encuentras esta nota de la persona que tomó el pedido.',
    passage: 'Two coffees.',
    words: numbers(2),
    prompt: '¿Qué se pidió?',
    choices: ['Dos porciones de café.', 'Café sin cantidad indicada.', 'Una taza vacía.'],
    feedback: 'En este pedido, coffees se refiere a porciones de café.',
  },
  {
    id: 'coffee-drink-listen',
    topic: 'quantity',
    context: 'home-breakfast-coffee',
    target: w.coffee,
    situation: 'Escucha el mensaje de la persona que prepara el desayuno.',
    audio: 'Some coffee.',
    words: [w.some],
    prompt: '¿Qué se menciona?',
    choices: ['Exactamente dos cafés.', 'Café sin indicar cuántas tazas.', 'Algo de leche.'],
    correct: 1,
    feedback: 'Some coffee se refiere a la bebida sin indicar una cantidad exacta.',
  },
  {
    id: 'cup-form',
    topic: 'quantity',
    context: 'picnic-water-cups',
    target: w.cups,
    situation: 'Son tres tazas de agua para el picnic.',
    sentence: 'Three ___ of water.',
    words: [...numbers(3), w.cup, w.of, w.water],
    prompt: 'Completa con la forma de la palabra para tazas.',
    answer: 'cups',
    errors: { vocabulary_form: ['cup'] },
    feedback: 'Para indicar varias tazas, escribe cups.',
  },
  {
    id: 'cup-form-guide',
    topic: 'quantity',
    context: 'bakery-coffee-cups',
    target: w.cups,
    situation: 'Cup es singular. Usa cups para varias tazas. Modelo: two cups of tea.',
    sentence: 'Four ___ of coffee.',
    words: [...numbers(2, 4), w.cup, w.of, w.tea, w.coffee],
    prompt: 'Completa el pedido de cuatro tazas.',
    answer: 'cups',
    guided: true,
    remediates: ['vocabulary_form'],
    feedback: 'Con four, la forma es cups.',
  },
  {
    id: 'cup-form-confirm',
    topic: 'quantity',
    context: 'cake-recipe-milk-cups',
    target: w.cups,
    situation: 'La receta pide dos tazas de leche.',
    sentence: 'Two ___ of milk.',
    words: [...numbers(2), w.cup, w.of, w.milk],
    prompt: 'Completa con la palabra correspondiente.',
    answer: 'cups',
    errors: { vocabulary_form: ['cup'] },
    remediates: ['vocabulary_form'],
    feedback: 'Two cups of milk son dos tazas de leche.',
  },
  {
    id: 'cop',
    topic: 'prices',
    context: 'souvenir-menu-cop',
    target: w.cop,
    situation: 'En el mostrador ves el código COP al lado del precio.',
    passage: 'COP 8,000',
    prompt: '¿En qué moneda está el precio?',
    choices: ['Dólares estadounidenses.', 'Pesos mexicanos.', 'Pesos colombianos.'],
    correct: 2,
    feedback: 'COP identifica el peso colombiano.',
  },
  {
    id: 'without-listen',
    topic: 'order',
    context: 'takeout-ingredient-message',
    target: w.without,
    situation: 'Escucha cómo pidió el pollo otra mesa.',
    audio: 'Chicken without cheese.',
    words: [w.chicken, w.cheese],
    prompt: '¿Cómo pidieron el pollo?',
    choices: ['Sin queso.', 'Con queso.', 'Con queso aparte.'],
    feedback: 'Without cheese significa sin queso.',
  },
  {
    id: 'check-recall',
    topic: 'order',
    context: 'outdoor-table-payment',
    target: w.check,
    situation: 'Ya deseas pagar en un restaurante en Estados Unidos.',
    prompt: 'Escribe la palabra que se usa para pedir la cuenta en inglés estadounidense.',
    answer: 'check',
    feedback:
      'Check es la palabra habitual para la cuenta en Estados Unidos. También puedes oír bill.',
  },
  {
    id: 'confirmation-listen',
    topic: 'order',
    context: 'food-truck-confirmation',
    target: w.thatsRight,
    situation: 'La persona acaba de oír su pedido. Escucha qué responde.',
    audio: "That's right.",
    prompt: '¿Qué indica su respuesta?',
    choices: ['Pide la cuenta.', 'Confirma que el pedido coincide.', 'Quiere cambiar el pedido.'],
    correct: 1,
    feedback: 'That’s right confirma que lo que oyó coincide con su pedido.',
  },
];

export const cartagenaReviewSteps = [
  ...contextualReviewSteps,
  ...lexicalReviews.map(lexicalReview),
];
export const cartagenaPractice = cartagenaReviewSteps;
