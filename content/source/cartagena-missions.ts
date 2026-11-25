import type {
  TravelChapter,
  TravelMission,
  TravelStep,
} from '../../packages/offline-engine/src/travel-content';
import { cartagenaAssessmentSteps, cartagenaReviewSteps } from './cartagena-assessments';
import { cartagenaTeaching } from './cartagena-lessons';
import { cartagenaGrammar, cartagenaPatterns } from './cartagena-prerequisites';

const market = 'El mercado de Cartagena';
const cafe = 'El café del intercambio';
const seaside = 'La terraza junto al mar';

function speaking(
  topic: string,
  conceptId: string,
  contextId: string,
  speaker: string,
  text: string,
  phrase: string,
): TravelStep {
  return {
    id: `cartagena-${topic}-speak`,
    type: 'speak',
    text,
    phrase,
    exampleLabel: 'Modelo para tu comparación',
    speech: { selfCheck: true, allowSystemRecognition: true },
    storyPrompt: { speaker, text: 'Prueba tu respuesta en voz alta.' },
    learning: {
      conceptId,
      contextId: `cartagena.${contextId}`,
      skill: 'speaking',
      evidence: 'production',
      guided: true,
    },
  };
}

const likes: TravelMission = {
  id: 'cartagena-likes',
  objectiveId: 'lq-cartagena-food.likes',
  authoredAudio: true,
  title: 'El mercado de Cartagena',
  place: market,
  objective: 'Pregunta y cuenta qué comidas y bebidas les gustan a las personas de tu grupo.',
  minutes: [8, 12],
  success: 'Mar y Luz ya saben qué opciones les gustan a quienes van a comer.',
  vocabulary: cartagenaTeaching.likes.vocabulary,
  steps: [
    ...cartagenaTeaching.likes.steps,
    ...cartagenaAssessmentSteps.likes,
    speaking(
      'likes',
      cartagenaGrammar.question.id,
      'market-preference-interview',
      'Luz',
      'Pregúntale a Sam si a Luz le gusta la fruta u otra comida. Escucha tu grabación y comprueba que usaste does, el sujeto y la forma like.',
      'Does she like fruit?',
    ),
  ],
};

const quantity: TravelMission = {
  id: 'cartagena-quantity',
  objectiveId: 'lq-cartagena-food.quantity',
  authoredAudio: true,
  title: '¿Cuánto necesitamos?',
  place: market,
  objective: 'Prepara con Sam una lista de cantidades para tres personas.',
  minutes: [8, 12],
  success: 'Mar anota las cantidades que pidió el grupo.',
  vocabulary: cartagenaTeaching.quantity.vocabulary,
  steps: [
    ...cartagenaTeaching.quantity.steps,
    ...cartagenaAssessmentSteps.quantity,
    speaking(
      'quantity',
      cartagenaGrammar.quantity.id,
      'market-supplies-question',
      'Sam',
      'Pregúntale a Sam por el número de botellas. Al escucharte, comprueba que dijiste how many y bottles of water.',
      'How many bottles of water do we need?',
    ),
  ],
};

const prices: TravelMission = {
  id: 'cartagena-prices',
  objectiveId: 'lq-cartagena-food.prices',
  authoredAudio: true,
  title: '¿Cuánto cuesta?',
  place: cafe,
  objective: 'Lee el menú, pregunta por los precios y elige según el presupuesto.',
  minutes: [7, 11],
  success: 'Ya tienen opciones para comer en el café.',
  vocabulary: cartagenaTeaching.prices.vocabulary,
  steps: [
    ...cartagenaTeaching.prices.steps,
    ...cartagenaAssessmentSteps.prices,
    speaking(
      'prices',
      cartagenaGrammar.price.id,
      'cafe-price-voice-question',
      'Sam',
      'Pregúntale a Alba el precio del café. Al escucharte, comprueba que dijiste how much is y que nombraste el producto.',
      'How much is the coffee?',
    ),
  ],
};

const order: TravelMission = {
  id: 'cartagena-order',
  objectiveId: 'lq-cartagena-food.order',
  authoredAudio: true,
  title: 'Una mesa para tres',
  place: cafe,
  objective: 'Pide comida y bebida, confirma los detalles con Alba y pide la cuenta.',
  minutes: [9, 14],
  success: 'Alba recibió el pedido y el grupo pagó antes de ir a la terraza.',
  vocabulary: cartagenaTeaching.order.vocabulary,
  steps: [
    ...cartagenaTeaching.order.steps,
    ...cartagenaAssessmentSteps.order,
    speaking(
      'order',
      cartagenaPatterns.check.id,
      'cafe-check-voice-request',
      'Alba',
      'Pide la cuenta en voz alta. Escucha si incluiste una petición con Can I have y nombraste la cuenta. Puedes usar check o bill.',
      'Can I have the check, please?',
    ),
  ],
};

const transfer: TravelMission = {
  id: 'cartagena-transfer',
  authoredAudio: true,
  title: 'Una comida junto al mar',
  place: seaside,
  objective: 'Usa el menú, los precios y las nuevas preferencias para hacer otro pedido.',
  minutes: [7, 12],
  success: 'Se sirvió la comida en la terraza y Alba dejó una postal para tu siguiente parada.',
  vocabulary: cartagenaTeaching.order.vocabulary,
  steps: [
    ...cartagenaAssessmentSteps.transfer,
    speaking(
      'transfer',
      cartagenaPatterns.order.id,
      'seaside-takeaway-voice-order',
      'Alba',
      'Imagina que alguien llegará más tarde a la terraza. Pide para esa persona un plato y una bebida para llevar. Al escucharte, busca los dos productos y la expresión to go.',
      "I'd like eggs with bread and some tea to go, please.",
    ),
  ],
};

export const cartagenaChapter = {
  id: 'colombia',
  revision: 12,
  title: 'Cartagena',
  stamp: 'Cartagena',
  postcard: 'Una comida junto al mar',
  message:
    'Comparamos dos menús y pedimos en inglés. La próxima invitación nos lleva a Cusco, Perú.',
  collectible: 'Postal para Cusco',
  missions: [likes, quantity, prices, order, transfer],
} satisfies TravelChapter;

export const cartagenaPractice = cartagenaReviewSteps;
