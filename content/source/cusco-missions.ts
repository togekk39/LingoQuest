import type {
  TravelChapter,
  TravelMission,
  TravelStep,
} from '../../packages/offline-engine/src/travel-content';
import {
  askChecks,
  beChecks,
  endingChecks,
  formChecks,
  irregularChecks,
  marketExchange,
  museumExchange,
  regularChecks,
} from './cusco-assessments';
import { cuscoTeaching as teach, g, p, pair, refs, w } from './cusco-lessons';
import { marketTimeline, museumTimeline } from './cusco-scenarios';

function dialogue(id: string, speaker: string, text: string, en?: string, es?: string): TravelStep {
  return {
    id: `cusco-${id}`,
    type: 'dialogue',
    speaker,
    text,
    ...(en && es && { line: pair(en, es) }),
  };
}

function speaking(
  id: string,
  speaker: string,
  conceptId: string,
  text: string,
  phrase: string,
): TravelStep {
  return {
    id: `cusco-${id}-speak`,
    type: 'speak',
    text,
    phrase,
    speech: { selfCheck: true, allowSystemRecognition: true },
    storyPrompt: { speaker, text: 'Tu grabación te ayudará a comparar tu respuesta.' },
    exampleLabel: 'Modelo para tu comparación',
    learning: {
      conceptId,
      contextId: `cusco.${id}.oral`,
      skill: 'speaking',
      evidence: 'production',
      guided: true,
    },
  };
}

const where: TravelMission = {
  id: 'cusco-past-be',
  objectiveId: 'lq-cusco-past.past-be',
  authoredAudio: true,
  title: '¿Dónde estabas ayer?',
  place: 'La plaza de Cusco',
  objective: 'Ayuda a Sam y Luz a recordar dónde estaban ayer y cómo se sentían.',
  minutes: [7, 11],
  success:
    'El diario ya tiene los lugares de ayer. Luz quiere ordenar las actividades de la visita.',
  vocabulary: [],
  steps: [
    dialogue(
      'be-opening',
      'Sam',
      'Guardaste la postal de Alba. Ayer Nora nos acompañó por Cusco. Hoy Sam abre el diario y busca la primera nota.',
      'Where were you yesterday?',
      '¿Dónde estuviste ayer?',
    ),
    teach.be,
    beChecks[0],
    teach.beDetails,
    dialogue(
      'be-notes',
      'Luz',
      'Estas dos notas se refieren a la misma hora. Lee qué persona estaba en cada lugar.',
    ),
    ...beChecks.slice(1),
    ...formChecks('be'),
    speaking(
      'be',
      'Sam',
      g.be.id,
      'Di dónde estabas ayer y dónde estaba otra persona. Al escucharte, comprueba el lugar y si usaste was o were con cada sujeto.',
      'I was at home yesterday. Luz was at the park.',
    ),
  ],
};

const regular: TravelMission = {
  id: 'cusco-past-ed',
  objectiveId: 'lq-cusco-past.past-ed',
  authoredAudio: true,
  title: 'Lo que hicimos ayer',
  place: 'La plaza de Cusco',
  objective: 'Pon en orden las actividades de la plaza y escribe dos entradas para el diario.',
  minutes: [8, 13],
  success: 'Las fotos de la plaza ya están en orden. Diego te espera en el mercado.',
  vocabulary: [],
  steps: [
    dialogue(
      'regular-opening',
      'Luz',
      'Luz mira las fotos de la plaza. Quiere escribir una frase para la primera y otra para la siguiente.',
      'We visited the plaza.',
      'Visitamos la plaza.',
    ),
    teach.regular,
    regularChecks[0],
    formChecks('regular')[0],
    teach.regularDetails,
    ...formChecks('regular').slice(1),
    dialogue(
      'regular-audio',
      'Luz',
      'Las notas de voz también ayudan a recordar. Fíjate en cómo suena el final de cada acción.',
    ),
    teach.endings,
    ...endingChecks,
    speaking(
      'endings',
      'Luz',
      g.endings.id,
      'Escucha y repite walked, played y visited. Grábate. Compara el último sonido de cada palabra y cuenta las sílabas.',
      'Walked. Played. Visited.',
    ),
    ...regularChecks.slice(1),
    speaking(
      'regular',
      'Luz',
      g.regular.id,
      'Cuéntale a Luz dos acciones terminadas en el orden en que ocurrieron. Al escucharte, comprueba los verbos en pasado y la palabra then.',
      'First, we visited the plaza. Then we walked to the hotel.',
    ),
  ],
};

const irregular: TravelMission = {
  id: 'cusco-past-irreg',
  objectiveId: 'lq-cusco-past.past-irreg',
  authoredAudio: true,
  title: 'Recuerdos del mercado',
  place: 'El mercado de Cusco',
  objective: 'Compara las notas del mercado y cuenta qué pasó antes y después.',
  minutes: [8, 13],
  success:
    'Diego ordenó los recuerdos. Una foto quedó con el nombre en blanco y una hora por revisar.',
  vocabulary: [],
  steps: [
    dialogue(
      'market-opening',
      'Diego',
      'Diego ayuda a ordenar los recuerdos. Pone sobre el mostrador una nota de la visita y otra de la compra del pan.',
      'First, we went to the market.',
      'Primero fuimos al mercado.',
    ),
    teach.irregular,
    ...formChecks('irregular').slice(0, 2),
    teach.irregularDetails,
    ...formChecks('irregular').slice(2),
    teach.order,
    ...irregularChecks,
    speaking(
      'market',
      'Diego',
      p.irregular.id,
      'Cuenta tres cosas que pasaron en un mercado. Usa dos verbos irregulares distintos y comprueba que se escuche el orden.',
      'First we went to the market. Then Luz bought bread. Sam saw Diego.',
    ),
  ],
};

const ask: TravelMission = {
  id: 'cusco-past-ask',
  objectiveId: 'lq-cusco-past.past-ask',
  authoredAudio: true,
  title: 'El detalle que falta',
  place: 'El patio del hotel',
  objective: 'Pregúntales a tus compañeros qué ocurrió y corrige la entrada de la foto.',
  minutes: [8, 13],
  success: 'El diario del mercado ya tiene la persona y la hora correctas.',
  vocabulary: [],
  scenario: marketTimeline,
  replacedSteps: {
    'cusco-did-base-write': 'cusco-did-read',
    'cusco-didnt-base-write': 'cusco-did-read',
  },
  steps: [
    dialogue(
      'ask-opening',
      'Nora',
      'En el patio del hotel, Nora compara el diario con las fotos. Solo con las notas no se puede saber quién sacó una foto ni si la hora es correcta.',
    ),
    teach.ask,
    askChecks[0],
    teach.askDetails,
    ...marketExchange,
    ...askChecks.slice(1),
    speaking(
      'ask',
      'Nora',
      p.wh.id,
      'Pregunta en voz alta quién sacó otra foto y a qué hora. Escucha si las dos preguntas piden datos diferentes.',
      'Who took the photo? When did you take it?',
    ),
  ],
};

const transfer: TravelMission = {
  id: 'cusco-transfer',
  authoredAudio: true,
  title: 'Un nuevo recuerdo',
  place: 'El museo de Cusco',
  objective: 'Confirma los datos de un diario distinto y escribe tu propio relato de la visita.',
  minutes: [8, 14],
  success: 'El diario del museo está listo. Nora dejó una postal para tu siguiente parada.',
  vocabulary: [],
  scenario: museumTimeline,
  steps: [
    dialogue(
      'museum-opening',
      'Nora',
      'Nora te presta un diario del museo. Ana y Diego recuerdan partes diferentes de la visita. Pregunta por los datos que faltan.',
    ),
    teach.museum,
    ...museumExchange,
    {
      id: 'cusco-museum-own-account',
      type: 'exercise',
      lessonId: 'u04_l04',
      situation: 'Escribe para la persona que leerá el diario del museo.',
      exercise: {
        id: 'cusco-museum-own-account',
        type: 'short_text',
        difficulty: 2,
        skillId: g.ask.id,
        promptEs:
          'Escribe de tres a cinco frases sobre la visita. Incluye un verbo regular, uno irregular, una hora o un conector y un dato negativo si puedes.',
        acceptedAnswers: [
          'Diego visited the museum at two. Then Ana saw Nora at the entrance. Nora left at four. Ana did not see Nora at the shop.',
        ],
        feedbackEs:
          'Al comparar, comprueba quién hizo cada cosa, el orden, la hora o el lugar y si usaste el pasado correcto. Después de did not, usa la forma base.',
        ungradable: {
          feedbackEs:
            'Compara tu relato con el ejemplo que aparece después de escribir. Tu relato puede usar otras frases que respeten los datos.',
        },
        learning: {
          conceptId: g.ask.id,
          skill: 'writing',
          contextId: 'cusco.museum.open-account',
          evidence: 'transfer',
          guided: true,
        },
      },
      requires: refs(
        [
          w.visited,
          w.the,
          w.museum,
          w.at,
          w.two,
          w.then,
          w.saw,
          w.entrance,
          w.left,
          w.four,
          w.didNot,
          w.see,
          w.shop,
        ],
        g.ask,
        g.regular,
        g.irregular,
        p.negative,
        p.sequence,
      ),
      targets: [{ targetId: g.ask.id, dimension: 'writing' }],
    },
    speaking(
      'museum',
      'Nora',
      p.irregular.id,
      'Cuéntale a Nora dos hechos del museo. En tu grabación busca los sujetos, los verbos en pasado y un detalle que confirmaste.',
      'Diego visited the museum at two. At three, Ana saw Nora at the entrance.',
    ),
  ],
};

export const cuscoChapter = {
  id: 'peru',
  revision: 15,
  title: 'Cusco',
  stamp: 'Cusco',
  postcard: 'Un nuevo recuerdo',
  message: 'Completaste dos diarios de Cusco. La próxima postal te invita a Salvador, Brasil.',
  collectible: 'Postal para Salvador',
  missions: [where, regular, irregular, ask, transfer],
} satisfies TravelChapter;
