import type { PrerequisiteReference } from '../../packages/course-pack/src/prerequisites';
import type { CourseExercise } from '../../packages/offline-engine/src';
import digests from './cartagena-challenge-review.json';
import {
  cartagenaGrammar as g,
  cartagenaLessonIds,
  cartagenaNumbers as numbers,
  cartagenaPatterns as p,
  cartagenaRefs as w,
} from './cartagena-prerequisites';

type Topic = keyof typeof cartagenaLessonIds;
type Item = {
  name: string;
  topic: Topic;
  concept: PrerequisiteReference;
  patterns: readonly PrerequisiteReference[];
  words: readonly PrerequisiteReference[];
  difficulty: number;
  promptEs: string;
  feedbackEs: string;
  sentence?: string;
  passage?: string;
  answers: [string, string, ...string[]] | [string];
  correct?: number;
};

function define(mode: 'grammar_rush' | 'cloze_battle' | 'reading_quest', authored: Item) {
  const isReading = mode === 'reading_quest';
  const isCloze = mode === 'cloze_battle';
  const index = authored.correct ?? 0;
  const id = `challenge_cartagena_${mode}_${authored.name}`;
  const exercise: CourseExercise = {
    id,
    type: isReading ? 'meaning' : isCloze ? 'cloze' : 'single_choice',
    difficulty: authored.difficulty,
    requiredLessonIds: [cartagenaLessonIds[authored.topic]],
    skillId: authored.concept.id,
    promptEs: authored.promptEs,
    feedbackEs: authored.feedbackEs,
    ...(authored.sentence && { sentence: authored.sentence }),
    ...(authored.passage && { passage: authored.passage }),
    ...(isCloze
      ? { acceptedAnswers: authored.answers, dimension: 'grammar_production' }
      : {
          acceptedAnswers: [authored.answers[index]],
          options: authored.answers.map((text, position) => ({ id: String(position + 1), text })),
          correctOptionId: String(index + 1),
          ...(isReading ? { optionsLanguage: 'es' } : { dimension: 'grammar_understanding' }),
        }),
    learning: {
      conceptId: authored.concept.id,
      contextId: `cartagena.challenge.${mode}.${authored.name}`,
      skill: isReading ? 'reading' : 'grammar',
      evidence: isCloze ? 'production' : 'understanding',
    },
  };
  return { exercise, requires: [authored.concept, ...authored.patterns, ...authored.words] };
}

const grammar = [
  define('grammar_rush', {
    name: 'likes',
    topic: 'likes',
    concept: g.thirdPerson,
    patterns: [p.thirdPerson],
    words: [w.he, w.like, w.likes, w.tea],
    difficulty: 2,
    sentence: 'He ___ tea.',
    promptEs: 'Leo elige té para una merienda. Selecciona la forma que completa la nota.',
    answers: ['like', 'likes'],
    correct: 1,
    feedbackEs: 'He va con likes en presente simple.',
  }),
  define('grammar_rush', {
    name: 'quantity',
    topic: 'quantity',
    concept: g.quantity,
    patterns: [p.howMany, p.howMuch],
    words: [w.howMany, w.howMuch, w.glasses, w.of, w.water],
    difficulty: 3,
    sentence: '___ glasses of water?',
    promptEs: 'Una mesa pidió vasos de agua. Elige cómo preguntar cuántos vasos son.',
    answers: ['How many', 'How much'],
    feedbackEs: 'Usa how many porque glasses se cuenta en vasos.',
  }),
  define('grammar_rush', {
    name: 'prices',
    topic: 'prices',
    concept: g.price,
    patterns: [p.priceQuestion],
    words: [w.howMuchPrice, w.are, w.is, w.the, w.bananas],
    difficulty: 3,
    sentence: 'How much ___ the bananas?',
    promptEs: 'Alguien pregunta por un precio en otro puesto. Completa la pregunta.',
    answers: ['is', 'are'],
    correct: 1,
    feedbackEs: 'Bananas está en plural, así que usa are.',
  }),
  define('grammar_rush', {
    name: 'order',
    topic: 'order',
    concept: g.order,
    patterns: [p.order, p.canHave, p.confirm],
    words: [w.idLike, w.with, w.eggs, w.bread, w.please, w.anythingElse, w.whatWouldYouLike],
    difficulty: 4,
    promptEs: 'Eres cliente en el muelle. Elige la frase que pide los huevos con pan.',
    answers: ['Anything else?', 'What would you like?', "I'd like eggs with bread, please."],
    correct: 2,
    feedbackEs: 'I’d like sirve para que el cliente pida un plato.',
  }),
];

const cloze = [
  define('cloze_battle', {
    name: 'likes',
    topic: 'likes',
    concept: g.thirdPerson,
    patterns: [p.thirdPerson],
    words: [w.she, w.like, w.likes, w.beans],
    difficulty: 2,
    sentence: 'She ___ beans.',
    promptEs:
      'Ella elige los frijoles para otra comida. Completa la nota con el verbo like en presente.',
    answers: ['likes'],
    feedbackEs: 'Con she, like lleva -s: likes.',
  }),
  define('cloze_battle', {
    name: 'quantity',
    topic: 'quantity',
    concept: g.quantity,
    patterns: [p.howMany],
    words: [w.howMany, w.bottles, w.of, w.milk],
    difficulty: 3,
    sentence: '___ bottles of milk?',
    promptEs:
      'Estás organizando otra compra. Escribe dos palabras para preguntar el número de botellas.',
    answers: ['How many'],
    feedbackEs: 'How many bottles of milk? Las botellas se cuentan en unidades.',
  }),
  define('cloze_battle', {
    name: 'prices',
    topic: 'prices',
    concept: g.price,
    patterns: [p.priceAnswer, p.pesos],
    words: [w.the, w.total, w.is, w.thousand, w.pesos, ...numbers(20)],
    difficulty: 3,
    sentence: 'The total is twenty ___ pesos.',
    promptEs: 'Una mesa pagará COP 20,000. Escribe una palabra para completar el número.',
    answers: ['thousand'],
    feedbackEs: 'Twenty thousand pesos representa COP 20,000.',
  }),
  define('cloze_battle', {
    name: 'order',
    topic: 'order',
    concept: g.order,
    patterns: [p.order, p.preferences],
    words: [w.idLike, w.chicken, w.with, w.without, w.cheese, w.please],
    difficulty: 4,
    sentence: "I'd like chicken ___ cheese, please.",
    promptEs:
      'Haz un pedido de pollo para otra mesa. Pide que no le pongan queso. Escribe una palabra.',
    answers: ['without'],
    feedbackEs: 'Without cheese indica que el pedido va sin queso.',
  }),
];

const reading = [
  define('reading_quest', {
    name: 'likes',
    topic: 'likes',
    concept: g.thirdPerson,
    patterns: [p.thirdPerson, p.negative],
    words: [g.negative, w.she, w.he, w.like, w.likes, w.doesnt, w.eggs, w.fruit, w.bread, w.cheese],
    difficulty: 2,
    passage: "Luz likes fruit. She doesn't like cheese.\nLeo likes bread. He doesn't like eggs.",
    promptEs: 'Lee las notas para una merienda. ¿Qué le gusta a Leo?',
    answers: ['El pan.', 'Los huevos.', 'La fruta.'],
    feedbackEs: 'Leo likes bread indica que a él le gusta el pan.',
  }),
  define('reading_quest', {
    name: 'quantity',
    topic: 'quantity',
    concept: g.quantity,
    patterns: [p.countable, p.plural, p.someAny],
    words: [w.cups, w.of, w.tea, w.apples, w.some, w.cheese, ...numbers(3, 4)],
    difficulty: 3,
    passage: 'Three cups of tea\nFour apples\nSome cheese',
    promptEs: 'Lee la lista de un picnic. ¿Qué cantidad de té indica?',
    answers: ['Cuatro vasos.', 'Tres tazas.', 'Una botella.'],
    correct: 1,
    feedbackEs: 'Three cups of tea significa tres tazas de té.',
  }),
  define('reading_quest', {
    name: 'prices',
    topic: 'prices',
    concept: g.price,
    patterns: [p.priceAnswer, p.pesos],
    words: [w.cop, w.tea, w.coffee, w.orangeJuice],
    difficulty: 3,
    passage: 'Tea — COP 4,000\nCoffee — COP 6,000\nOrange juice — COP 8,000',
    promptEs: 'Hay otra pizarra de precios en el muelle. ¿Qué bebida cuesta COP 6,000?',
    answers: ['El jugo de naranja.', 'El té.', 'El café.'],
    correct: 2,
    feedbackEs: 'Coffee aparece con COP 6,000 en esta pizarra.',
  }),
  define('reading_quest', {
    name: 'order',
    topic: 'order',
    concept: g.order,
    patterns: [p.order, p.preferences, p.confirm],
    words: [
      w.idLike,
      w.eggs,
      w.without,
      w.onions,
      w.and,
      w.some,
      w.tea,
      w.please,
      w.anythingElse,
      w.thatsAll,
      w.thankYou,
    ],
    difficulty: 4,
    passage:
      "I'd like eggs without onions and some tea, please.\nAnything else?\nThat's all, thank you.",
    promptEs: 'Lee el pedido de otra mesa. ¿Qué anotó quien tomó el pedido?',
    answers: ['Huevos con cebolla y té.', 'Huevos sin cebolla y té.', 'Huevos sin cebolla y café.'],
    correct: 1,
    feedbackEs: 'Without onions quiere decir sin cebolla. El cliente también pidió té.',
  }),
];

const reviewedCartagenaChallenges = [...grammar, ...cloze, ...reading];

export const cartagenaChallengePools = {
  grammar_rush: grammar.map(({ exercise }) => exercise),
  cloze_battle: cloze.map(({ exercise }) => exercise),
  reading_quest: reading.map(({ exercise }) => exercise),
};

export const cartagenaChallengeReviews = Object.fromEntries(
  reviewedCartagenaChallenges.map(({ exercise, requires }) => {
    const digest = digests[exercise.id as keyof typeof digests];
    if (!digest) throw new Error(`Missing Cartagena challenge review for ${exercise.id}`);
    return [exercise.id, { digest, requires }];
  }),
);
