import type { Translation } from '@lingoquest/contracts';
import type { CourseExercise, CourseLesson } from './index';
import type { LearningTarget } from './travel-learning';
import { homeChapterDetails } from './travel-route';

export interface TravelVocabulary {
  term: string;
  meaning: string;
  kind: string;
  explanation: string;
  example: Translation;
  exampleBy?: 'Sam' | 'Luz';
}

export interface TravelPattern {
  parts: { text: string; role: string }[];
  es?: string;
}

export interface TravelExerciseStep {
  id: string;
  type: 'exercise';
  situation: string;
  response?: 'personal-introduction';
  activityTitle?: string;
  exercise: CourseExercise;
  hint?: string;
  audio?: string;
  transcript?: string;
  listeningButton?: string;
  visual?: 'directions' | 'bag';
  visualDescription?: string;
}

export type TravelStep =
  | {
      id: string;
      type: 'dialogue';
      speaker: 'Luz' | 'Sam' | 'QuestBuddy';
      text: string;
      line?: Translation;
    }
  | {
      id: string;
      type: 'teach';
      title: string;
      speaker?: 'Luz';
      exampleLabel?: string;
      text: string;
      examples: Translation[];
      presentation?: 'question-answer' | 'reply-briefing';
      patterns?: TravelPattern[];
    }
  | TravelExerciseStep
  | {
      id: string;
      type: 'speak';
      text: string;
      phrase: string;
      acceptedPhrases?: string[];
      exampleLabel?: string;
      response?: 'personal-introduction';
      learning: LearningTarget;
    };

export interface TravelMission {
  id: string;
  title: string;
  place: string;
  objective: string;
  minutes: readonly [minimum: number, maximum: number];
  success: string;
  vocabulary: TravelVocabulary[];
  steps: TravelStep[];
}

export interface TravelChapter {
  id: string;
  revision: number;
  title: string;
  stamp: string;
  postcard: string;
  message: string;
  collectible: string;
  missions: TravelMission[];
}

const informalGreetings = ['Hi', 'Hello', 'Hey', 'Hi there', 'Hello there', 'Hey there'];
export const samGreeting = {
  en: "Hi! My name is Sam. What's your name?",
  es: '¡Hola! Me llamo Sam. ¿Cómo te llamas?',
};

function personalIntroduction(
  greetingRequired = false,
): Pick<CourseExercise, 'introduction' | 'acceptedAnswers' | 'communicationOnly' | 'feedbackEs'> {
  const model = greetingRequired ? 'Hi! I am [tu nombre].' : 'I am [tu nombre].';
  return {
    introduction: { greetingRequired, model },
    acceptedAnswers: [],
    communicationOnly: {
      answers: [],
      feedbackEs:
        'Se entiende tu nombre. Para practicar esta estructura, usa I am o My name is antes de tu nombre.',
    },
    feedbackEs:
      (greetingRequired ? 'Empieza con un saludo como Hi o Hello. ' : '') +
      'Para decir tu nombre, usa I am, I’m, My name is o My name’s antes de tu nombre.',
  };
}

const redBagAnswers = [
  "It's red.",
  'It is red.',
  'The bag is red.',
  'The backpack is red.',
  "Luz's bag is red.",
  "Luz's backpack is red.",
  'Her bag is red.',
  'Her backpack is red.',
  "The bag's red.",
  "The backpack's red.",
  "Luz's bag's red.",
  "Luz's backpack's red.",
  "Her bag's red.",
  "Her backpack's red.",
];

function locationQuestion(location: string) {
  const direct = [`Where is ${location}?`, `Where's ${location}?`];
  const alternatives = [
    `Where can I find ${location}?`,
    `Where do I find ${location}?`,
    `Where is ${location} located?`,
    `Where's ${location} located?`,
    `Can you tell me where ${location} is?`,
    `Could you tell me where ${location} is?`,
    `Do you know where ${location} is?`,
  ];
  const withPoliteness = (forms: string[]) =>
    forms.flatMap((form) => [form, `Excuse me, ${form}`, `${form.slice(0, -1)}, please?`]);
  return {
    acceptedAnswers: withPoliteness(direct),
    communicationOnly: {
      answers: withPoliteness(alternatives),
      feedbackEs: `Tu pregunta pide la ubicación adecuada. Para practicar la forma de la lección, usa Where is ${location}?, con is antes del lugar y sin otro verbo.`,
    },
  };
}

function adjacentLocation(subjects: string[], reference: string) {
  const position = [`next to ${reference}`, `right next to ${reference}`];
  const alternatives = [
    `beside ${reference}`,
    `right beside ${reference}`,
    `right by ${reference}`,
    `adjacent to ${reference}`,
    `alongside ${reference}`,
  ];
  return {
    acceptedAnswers: position.flatMap((location) => subjects.map((s) => `${s} ${location}.`)),
    communicationOnly: {
      answers: [
        ...position,
        ...alternatives,
        ...alternatives.flatMap((location) => subjects.map((subject) => `${subject} ${location}.`)),
        ...[...position, ...alternatives].flatMap((location) =>
          subjects.map((subject) => `${subject} located ${location}.`),
        ),
      ],
      feedbackEs: `Diste la ubicación correcta. Para practicar la forma de la lección, usa el sujeto y be seguidos de next to ${reference}.`,
    },
  };
}

export const chapter: TravelChapter = {
  ...homeChapterDetails,
  revision: 3,
  missions: [
    {
      id: 'hello',
      title: 'Un saludo en la plaza',
      place: 'La plaza',
      objective: 'Preséntate a Sam en inglés con tu propio nombre.',
      minutes: [7, 11],
      success: 'Sam te agradece el saludo y te muestra el boleto del bus que busca.',
      vocabulary: [
        {
          term: 'Hi',
          meaning: 'hola',
          kind: 'saludo',
          explanation: 'Úsalo para saludar a alguien. Hello también funciona.',
          exampleBy: 'Sam',
          example: {
            en: 'Hi! My name is Sam.',
            es: '¡Hola! Me llamo Sam.',
          },
        },
        {
          term: 'I am',
          meaning: 'soy / estoy',
          kind: 'verbo',
          explanation: 'Para presentarte, di I am y agrega tu nombre. La forma breve es I’m.',
          exampleBy: 'Luz',
          example: {
            en: 'Hi! I am Luz.',
            es: '¡Hola! Soy Luz.',
          },
        },
        {
          term: 'My name is',
          meaning: 'me llamo',
          kind: 'expresión',
          explanation:
            'My indica que hablas de tu propio nombre. My name’s es la forma breve de My name is.',
          exampleBy: 'Luz',
          example: {
            en: 'My name is Luz.',
            es: 'Me llamo Luz.',
          },
        },
      ],
      steps: [
        {
          id: 'hello_welcome',
          type: 'dialogue',
          speaker: 'Sam',
          text: '¡Hola! Acabo de llegar a la plaza. Escucha mi pregunta y luego dime cómo te llamas.',
        },
        {
          id: 'hello_sam',
          type: 'dialogue',
          speaker: 'Sam',
          text: 'Sam se presenta y te pregunta cómo te llamas.',
          line: samGreeting,
        },
        {
          id: 'hello_teach',
          type: 'teach',
          presentation: 'reply-briefing',
          title: 'Prepara tu respuesta para Sam',
          text: 'Hi y Hello significan «hola». Para responderle a Sam, empieza con uno de esos saludos. Luego usa I am, I’m, My name is o My name’s y completa con tu nombre. Con I va am y con My name va is.',
          examples: [
            { en: 'I am', es: 'Soy' },
            { en: 'My name is', es: 'Me llamo' },
          ],
          patterns: [
            {
              parts: [
                { text: 'I', role: 'Sujeto' },
                { text: 'am', role: 'Verbo' },
              ],
              es: 'Soy',
            },
            {
              parts: [
                { text: 'My name', role: 'Sujeto' },
                { text: 'is', role: 'Verbo' },
              ],
              es: 'Me llamo',
            },
          ],
        },
        {
          id: 'travel_hello_recognize',
          type: 'exercise',
          activityTitle: 'Reconoce el saludo de Sam',
          situation: 'Escucha a Sam y reconoce cómo empieza la conversación.',
          audio: samGreeting.en,
          transcript: samGreeting.en,
          listeningButton: 'Escuchar el saludo de Sam',
          exercise: {
            id: 'travel_hello_recognize',
            type: 'meaning',
            promptEs: '¿Qué significa el primer saludo de Sam?',
            skillId: 'grammar.be_i_you',
            dimension: 'vocabulary_recognition',
            vocabularyIds: ['u01_l01_v02'],
            difficulty: 1,
            optionsLanguage: 'es',
            options: [
              { id: 'bye', text: 'Adiós' },
              { id: 'hello', text: 'Hola' },
            ],
            correctOptionId: 'hello',
            acceptedAnswers: ['Hola'],
            feedbackEs:
              'Hi y hello se usan para saludar cuando llegas. Para despedirte, puedes decir bye.',
            learning: {
              conceptId: 'greeting',
              skill: 'vocabulary',
              evidence: 'recognition',
              contextId: 'welcome-desk',
            },
          },
        },
        {
          id: 'travel_hello_build',
          type: 'exercise',
          activityTitle: 'Ordena tu respuesta para Sam',
          situation: 'Prepara tu respuesta para Sam con I am y tu nombre.',
          hint: 'Empieza con la persona que habla. Luego pon el verbo y, al final, el nombre.',
          exercise: {
            id: 'travel_hello_build',
            type: 'reorder',
            promptEs: 'Ordena las fichas para presentarte en inglés.',
            skillId: 'grammar.be_i_you',
            dimension: 'grammar_understanding',
            difficulty: 1,
            tokens: ['am', '[tu nombre]', 'I'],
            acceptedAnswers: ['I am [tu nombre].'],
            feedbackEs: 'I se refiere a ti. Pon I primero, después am y al final tu nombre.',
            learning: {
              conceptId: 'introduction',
              skill: 'grammar',
              evidence: 'understanding',
              contextId: 'welcome-desk',
              guided: true,
              errors: ['word_order'],
            },
          },
        },
        {
          id: 'travel_hello_recall',
          type: 'exercise',
          activityTitle: 'Recuerda el saludo',
          situation: 'Antes de decirle tu nombre a Sam, recuerda cómo saludar en inglés.',
          exercise: {
            id: 'travel_hello_recall',
            type: 'short_text',
            promptEs: 'Escribe «hola» en inglés.',
            skillId: 'grammar.be_i_you',
            dimension: 'vocabulary_recall',
            vocabularyIds: ['u01_l01_v02'],
            difficulty: 1,
            acceptedAnswers: informalGreetings,
            feedbackEs:
              'Hi y hello son dos saludos que puedes usar aquí. Hey también funciona en un saludo informal.',
            learning: {
              conceptId: 'greeting',
              skill: 'vocabulary',
              evidence: 'recall',
              contextId: 'welcome-desk',
            },
          },
        },
        {
          id: 'travel_hello_write',
          type: 'exercise',
          response: 'personal-introduction',
          activityTitle: 'Tu saludo para Sam',
          situation: 'Sam quiere saber cómo te llamas.',
          hint: 'Empieza con «Hi!». Después puedes usar «I am» o «My name is».',
          exercise: {
            id: 'travel_hello_write',
            type: 'short_text',
            promptEs:
              'Escribe tu propio saludo para Sam. Saluda en inglés y preséntate con tu nombre.',
            skillId: 'grammar.be_i_you',
            dimension: 'grammar_production',
            difficulty: 1,
            ...personalIntroduction(true),
            learning: {
              conceptId: 'introduction',
              skill: 'writing',
              evidence: 'production',
              contextId: 'welcome-desk',
              errors: ['subject_omission', 'be_omission', 'be_agreement', 'word_order'],
            },
          },
        },
        {
          id: 'travel_hello_transfer',
          type: 'exercise',
          response: 'personal-introduction',
          activityTitle: 'Tu ficha en el puesto de fotos',
          situation:
            'Sam quiere una foto de recuerdo del viaje. En el puesto de fotos te piden que te presentes para anotar tu nombre en tu ficha.',
          exercise: {
            id: 'travel_hello_transfer',
            type: 'short_text',
            promptEs: 'Preséntate en inglés con tu nombre para la ficha de fotos.',
            skillId: 'grammar.be_i_you',
            dimension: 'grammar_production',
            difficulty: 2,
            ...personalIntroduction(),
            learning: {
              conceptId: 'introduction',
              skill: 'writing',
              evidence: 'transfer',
              contextId: 'photo-signup',
              errors: ['subject_omission', 'be_omission', 'be_agreement', 'word_order'],
            },
          },
        },
        {
          id: 'hello_speak',
          type: 'speak',
          text: 'Vuelves con Sam. Saluda a Sam y preséntate con tu propio nombre en voz alta.',
          phrase: 'Hi! I am',
          exampleLabel: 'Tu modelo para responder',
          response: 'personal-introduction',
          learning: {
            conceptId: 'introduction',
            skill: 'speaking',
            evidence: 'production',
            contextId: 'welcome-desk',
            guided: true,
          },
        },
      ],
    },
    {
      id: 'bus',
      title: 'El bus de las ocho',
      place: 'La parada',
      objective: 'Escucha a Sam y explícale dónde tomar el bus.',
      minutes: [7, 10],
      success:
        'Sam encuentra la parada junto al parque. Al llegar, se da cuenta de que dejó su mochila en la mesa.',
      vocabulary: [
        {
          term: 'bus stop',
          meaning: 'parada de bus',
          kind: 'sustantivo',
          explanation: 'Úsalo para el lugar donde se espera el bus, como en «the bus stop».',
          example: {
            en: 'Where is the bus stop?',
            es: '¿Dónde está la parada de bus?',
          },
        },
        {
          term: 'park',
          meaning: 'parque',
          kind: 'sustantivo',
          explanation: 'Aquí «park» nombra un espacio público. The park es el parque.',
          example: {
            en: 'It’s next to the park.',
            es: 'Está junto al parque.',
          },
        },
        {
          term: 'next to',
          meaning: 'junto a',
          kind: 'preposición',
          explanation: 'Usa next to para indicar que algo está justo al lado de un lugar u objeto.',
          example: {
            en: 'It’s next to the park.',
            es: 'Está junto al parque.',
          },
        },
      ],
      steps: [
        {
          id: 'bus_sam',
          type: 'dialogue',
          speaker: 'Sam',
          text: 'Sam va a tomar el bus de las ocho. Como no conoce el barrio, te pregunta dónde está la parada.',
          line: { en: 'Where is the bus stop?', es: '¿Dónde está la parada del bus?' },
        },
        {
          id: 'bus_teach',
          type: 'teach',
          presentation: 'question-answer',
          title: 'Ubicar un lugar',
          text: 'En «Where is the bus stop?», is va antes del lugar que buscas. En la respuesta, it se refiere a la parada. It’s es la forma corta de It is. Next to significa «junto a». Usa the cuando las dos personas saben de qué lugar hablan.',
          examples: [
            { en: 'Where is the bus stop?', es: '¿Dónde está la parada de bus?' },
            { en: 'It’s next to the park.', es: 'Está junto al parque.' },
          ],
          patterns: [
            {
              parts: [
                { text: 'Where', role: 'Palabra interrogativa' },
                { text: 'is', role: 'Verbo' },
                { text: 'the bus stop?', role: 'Sujeto' },
              ],
              es: '¿Dónde está la parada de bus?',
            },
            {
              parts: [
                { text: 'It’s', role: 'Sujeto y verbo' },
                { text: 'next to the park.', role: 'Ubicación' },
              ],
              es: 'Está junto al parque.',
            },
          ],
        },
        {
          id: 'travel_bus_listen',
          type: 'exercise',
          situation: 'Vuelve a escuchar la pregunta de Sam y señala el lugar que busca.',
          audio: 'Where is the bus stop?',
          transcript: 'Where is the bus stop?',
          exercise: {
            id: 'travel_bus_listen',
            type: 'meaning',
            promptEs: 'Escucha la pregunta. ¿Qué lugar busca Sam?',
            skillId: 'grammar.be_questions',
            vocabularyIds: ['u03_l04_v04'],
            dimension: 'vocabulary_recognition',
            difficulty: 1,
            optionsLanguage: 'es',
            options: [
              { id: 'park', text: 'El parque' },
              { id: 'bus', text: 'La parada de bus' },
            ],
            correctOptionId: 'bus',
            acceptedAnswers: ['La parada de bus'],
            feedbackEs:
              'Bus stop significa parada de bus. Where is…? te indica que Sam pregunta dónde está.',
            learning: {
              conceptId: 'place-question',
              skill: 'listening',
              evidence: 'understanding',
              contextId: 'bus-map',
              guided: true,
            },
          },
        },
        {
          id: 'travel_bus_direction',
          type: 'exercise',
          situation:
            'Sam necesita una indicación que pueda seguir. Mira la ubicación y arma tu respuesta.',
          visual: 'directions',
          hint: 'It’s + next to + the park.',
          exercise: {
            id: 'travel_bus_direction',
            type: 'reorder',
            promptEs: 'Dile «Está junto al parque».',
            skillId: 'grammar.be_it_they',
            dimension: 'grammar_understanding',
            difficulty: 1,
            tokens: ['park', 'It’s', 'to', 'the', 'next'],
            acceptedAnswers: ["It's next to the park."],
            feedbackEs:
              'It’s next to the park. Next siempre va antes de to en la expresión next to.',
            learning: {
              conceptId: 'place-location',
              skill: 'grammar',
              evidence: 'understanding',
              contextId: 'bus-map',
              guided: true,
              errors: ['preposition', 'article', 'word_order'],
            },
          },
        },
        {
          id: 'travel_bus_dictation',
          type: 'exercise',
          situation:
            'Escucha cómo Luz confirma la indicación. Anótala para que Sam pueda llevarla.',
          audio: 'It’s next to the park.',
          transcript: 'It’s next to the park.',
          listeningButton: 'Escuchar la indicación',
          exercise: {
            id: 'travel_bus_dictation',
            type: 'short_text',
            promptEs: 'Escribe en inglés la frase que escuchas.',
            skillId: 'grammar.be_it_they',
            dimension: 'grammar_understanding',
            difficulty: 2,
            acceptedAnswers: ["It's next to the park.", 'It is next to the park.'],
            feedbackEs:
              'It’s se escucha como una sílaba. Puedes anotarla como It’s o escribir la forma completa It is.',
            learning: {
              conceptId: 'place-location',
              skill: 'listening',
              evidence: 'understanding',
              contextId: 'bus-map',
              guided: true,
              errors: ['subject_omission', 'be_omission', 'preposition', 'article'],
            },
          },
        },
        {
          id: 'travel_bus_ask',
          type: 'exercise',
          situation:
            'Sam quiere mostrar su pregunta a la persona del mostrador. Escríbela de memoria.',
          exercise: {
            id: 'travel_bus_ask',
            type: 'short_text',
            promptEs:
              'Pregunta en inglés dónde está la parada de bus. Para practicar la forma de la lección, empieza con where y usa una forma de be antes del lugar, sin otro verbo.',
            skillId: 'grammar.be_questions',
            dimension: 'grammar_production',
            difficulty: 2,
            ...locationQuestion('the bus stop'),
            feedbackEs:
              'Una forma directa es Where is the bus stop? En esa pregunta, is va delante de the bus stop.',
            learning: {
              conceptId: 'place-question',
              skill: 'grammar',
              evidence: 'recall',
              contextId: 'bus-map',
              errors: ['be_omission', 'article', 'word_order'],
              errorAnswers: { word_order: ['Where the bus stop is?', 'Where the bus stop is'] },
            },
          },
        },
        {
          id: 'travel_bus_transfer',
          type: 'exercise',
          situation:
            'Alguien que ya está en la parada quiere encontrar el parque. Esta vez la parada es el punto de referencia.',
          visual: 'directions',
          visualDescription: 'El parque está junto a la parada de bus.',
          exercise: {
            id: 'travel_bus_transfer',
            type: 'short_text',
            promptEs:
              'Indica en inglés que el parque está junto a la parada de bus. Para practicar, escribe el sujeto y be, seguidos de la expresión de dos palabras con next que significa «junto a».',
            skillId: 'grammar.be_it_they',
            dimension: 'grammar_production',
            difficulty: 2,
            ...adjacentLocation(['The park is', "The park's", 'It is', "It's"], 'the bus stop'),
            feedbackEs:
              'Ahora el lugar que buscas es the park. The park is next to the bus stop usa la parada para ubicarlo.',
            learning: {
              conceptId: 'place-location',
              skill: 'writing',
              evidence: 'transfer',
              contextId: 'park-visit',
              errors: [
                'subject_omission',
                'be_omission',
                'be_agreement',
                'preposition',
                'article',
                'word_order',
              ],
              errorAnswers: {
                preposition: ['It is next the bus stop.', 'The park is next the bus stop.'],
              },
            },
          },
        },
        {
          id: 'bus_lost',
          type: 'dialogue',
          speaker: 'Sam',
          text: 'Sam encuentra la parada. Antes de subir, se toca el hombro: ya no tiene su mochila.',
          line: { en: 'My bag!', es: '¡Mi mochila!' },
        },
      ],
    },
    {
      id: 'bag',
      title: 'Una mochila y una postal',
      place: 'Objetos perdidos',
      objective: 'Describe la mochila correcta para devolvérsela a Sam.',
      minutes: [7, 11],
      success:
        'La mochila vuelve con Sam. Dentro llevaba una postal en blanco. Te la regala para que escribas el primer recuerdo de tu propio viaje.',
      vocabulary: [
        {
          term: 'bag',
          meaning: 'bolso / mochila',
          kind: 'sustantivo',
          explanation:
            'Es una palabra general para algo que llevas en la mano o al hombro. Backpack especifica que va en la espalda.',
          example: {
            en: 'My bag is blue.',
            es: 'Mi mochila es azul.',
          },
        },
        {
          term: 'blue',
          meaning: 'azul',
          kind: 'adjetivo',
          explanation:
            'Después de is describe el color. Antes de un sustantivo, di a blue bag, «una mochila azul».',
          example: {
            en: 'My bag is blue.',
            es: 'Mi mochila es azul.',
          },
        },
        {
          term: 'red',
          meaning: 'rojo / roja',
          kind: 'adjetivo',
          explanation:
            'En inglés el color no cambia con el género. It’s red describe cualquier objeto rojo.',
          example: {
            en: 'It’s red.',
            es: 'Es roja.',
          },
        },
      ],
      steps: [
        {
          id: 'bag_luz',
          type: 'dialogue',
          speaker: 'Sam',
          text: 'En objetos perdidos hay dos mochilas. Sam te manda un mensaje en inglés para decirte cuál es la suya.',
          line: { en: 'My bag is blue.', es: 'Mi mochila es azul.' },
        },
        {
          id: 'bag_teach',
          type: 'teach',
          title: 'Describir con colores',
          text: 'My bag es «mi mochila». Usa my delante del nombre del objeto para decir que algo es tuyo. En My bag is blue, is une la mochila con su color. Si ya sabemos qué objeto describes, puedes decir It’s blue.',
          examples: [
            { en: 'My bag is blue.', es: 'Mi mochila es azul.' },
            { en: 'a blue bag', es: 'una mochila azul' },
            { en: 'It’s red.', es: 'Es roja.' },
          ],
          patterns: [
            {
              parts: [
                { text: 'My bag', role: 'Sujeto' },
                { text: 'is', role: 'Verbo' },
                { text: 'blue.', role: 'Color' },
              ],
              es: 'Mi mochila es azul.',
            },
            {
              parts: [
                { text: 'a', role: 'Artículo' },
                { text: 'blue', role: 'Color' },
                { text: 'bag', role: 'Objeto' },
              ],
              es: 'una mochila azul',
            },
            {
              parts: [
                { text: 'It’s', role: 'Sujeto y verbo' },
                { text: 'red.', role: 'Color' },
              ],
              es: 'Es roja.',
            },
          ],
        },
        {
          id: 'travel_bag_read',
          type: 'exercise',
          situation:
            'Luz necesita saber qué mochila devolver. Lee el mensaje y elige la descripción.',
          visual: 'bag',
          exercise: {
            id: 'travel_bag_read',
            type: 'single_choice',
            promptEs: '¿Cuál es la mochila de Sam?',
            passage: 'My bag is blue.',
            skillId: 'grammar.be_it_they',
            dimension: 'grammar_understanding',
            difficulty: 1,
            options: [
              { id: 'blue', text: 'A blue bag' },
              { id: 'red', text: 'A red bag' },
            ],
            correctOptionId: 'blue',
            acceptedAnswers: ['A blue bag'],
            feedbackEs: 'Blue significa azul. A blue bag es una mochila azul.',
            learning: {
              conceptId: 'item-color',
              skill: 'reading',
              evidence: 'understanding',
              contextId: 'lost-property',
            },
          },
        },
        {
          id: 'travel_bag_owner',
          type: 'exercise',
          situation:
            'Antes de mover las mochilas, revisa el otro mensaje del mostrador para saber de quién es la roja.',
          exercise: {
            id: 'travel_bag_owner',
            type: 'single_choice',
            promptEs: '¿De quién es la mochila roja?',
            passage: 'Hi! My name is Luz. My bag is red.',
            skillId: 'grammar.be_it_they',
            dimension: 'grammar_understanding',
            difficulty: 1,
            options: [
              { id: 'sam', text: 'Sam' },
              { id: 'luz', text: 'Luz' },
            ],
            correctOptionId: 'luz',
            acceptedAnswers: ['Luz'],
            feedbackEs:
              'Quien escribe se presenta como Luz. Cuando dice My bag, habla de su propia mochila.',
            learning: {
              conceptId: 'item-ownership',
              skill: 'reading',
              evidence: 'understanding',
              contextId: 'lost-property',
            },
          },
        },
        {
          id: 'travel_bag_write',
          type: 'exercise',
          situation: 'Confirma por escrito el color para que Sam sepa que encontraste su mochila.',
          hint: 'Puedes empezar con «It’s» o «The bag is».',
          exercise: {
            id: 'travel_bag_write',
            type: 'short_text',
            promptEs:
              'Escribe «Es azul» en inglés. Usa un sujeto, una forma de be y después el color.',
            skillId: 'grammar.be_it_they',
            dimension: 'grammar_production',
            difficulty: 1,
            acceptedAnswers: [
              "It's blue.",
              'It is blue.',
              'The bag is blue.',
              'The backpack is blue.',
              'Your bag is blue.',
              'Your backpack is blue.',
              "The bag's blue.",
              "The backpack's blue.",
              "Your bag's blue.",
              "Your backpack's blue.",
            ],
            communicationOnly: {
              answers: [
                'Blue.',
                'The blue one.',
                "It's a blue bag.",
                'It is a blue bag.',
                "It's a blue backpack.",
                'It is a blue backpack.',
              ],
              feedbackEs:
                'Sam puede identificar el color. Para practicar esta estructura, di It’s blue, con blue directamente después del verbo.',
            },
            feedbackEs:
              'It’s blue sirve cuando ya sabemos de qué objeto hablamos. También puedes decir The bag is blue.',
            learning: {
              conceptId: 'item-color',
              skill: 'writing',
              evidence: 'production',
              contextId: 'lost-property',
              errors: ['subject_omission', 'be_omission', 'be_agreement', 'article', 'word_order'],
            },
          },
        },
        {
          id: 'travel_bag_transfer',
          type: 'exercise',
          situation:
            'Una persona de otro puesto te pregunta por la mochila de Luz. Esta vez necesitas confirmar el color de la otra mochila.',
          exercise: {
            id: 'travel_bag_transfer',
            type: 'short_text',
            promptEs:
              'Di en inglés de qué color es la mochila de Luz. Para practicar, escribe un sujeto, una forma de be y después el color.',
            skillId: 'grammar.be_it_they',
            dimension: 'grammar_production',
            difficulty: 2,
            acceptedAnswers: redBagAnswers,
            communicationOnly: {
              answers: [
                'Red.',
                'The red one.',
                "It's a red bag.",
                'It is a red bag.',
                "It's a red backpack.",
                'It is a red backpack.',
              ],
              feedbackEs:
                'La persona entiende el color. Para practicar la estructura, escribe It’s red o The bag is red.',
            },
            feedbackEs:
              'Luz dice que la suya es roja. Puedes hablar del objeto con It’s red o nombrarlo con The bag is red.',
            learning: {
              conceptId: 'item-color',
              skill: 'writing',
              evidence: 'transfer',
              contextId: 'plaza-stall',
              errors: ['subject_omission', 'be_omission', 'be_agreement', 'article', 'word_order'],
            },
          },
        },
        {
          id: 'bag_speak',
          type: 'speak',
          text: 'Dile a la otra persona que la mochila de Luz es roja. Usa un sujeto, una forma de be y el color.',
          phrase: 'It’s red.',
          acceptedPhrases: redBagAnswers,
          learning: {
            conceptId: 'item-color',
            skill: 'speaking',
            evidence: 'production',
            contextId: 'plaza-stall',
            guided: true,
          },
        },
        {
          id: 'bag_postcard',
          type: 'dialogue',
          speaker: 'QuestBuddy',
          text: 'Sam recupera su mochila y te deja una postal. Escribe en ella tu primer recuerdo: ya usaste inglés para ayudar a alguien.',
        },
      ],
    },
  ],
};

function practice(
  situation: string,
  exercise: CourseExercise,
  cues?: Pick<TravelExerciseStep, 'audio' | 'transcript' | 'listeningButton' | 'hint'>,
): TravelExerciseStep {
  return { id: exercise.id, type: 'exercise', situation, exercise, ...cues };
}

export const travelPracticeSteps: TravelExerciseStep[] = [
  practice('En un alojamiento, alguien llega al mostrador. Salúdalo antes de darle información.', {
    id: 'travel_review_greeting',
    type: 'short_text',
    promptEs: 'Escribe un saludo breve en inglés.',
    skillId: 'grammar.be_i_you',
    dimension: 'vocabulary_recall',
    vocabularyIds: ['u01_l01_v02'],
    difficulty: 2,
    acceptedAnswers: [...informalGreetings, 'Good morning!', 'Good afternoon!', 'Good evening!'],
    feedbackEs:
      'Hi y hello funcionan a cualquier hora. También puedes usar good morning por la mañana.',
    learning: {
      conceptId: 'greeting',
      skill: 'vocabulary',
      evidence: 'transfer',
      contextId: 'hostel-counter',
    },
  }),
  practice('Un grupo de dibujo pide que cada participante se presente por escrito.', {
    id: 'travel_review_introduction',
    type: 'short_text',
    promptEs: 'Preséntate en inglés con tu propio nombre para el grupo de dibujo.',
    skillId: 'grammar.be_i_you',
    dimension: 'grammar_production',
    difficulty: 2,
    ...personalIntroduction(),
    learning: {
      conceptId: 'introduction',
      skill: 'writing',
      evidence: 'transfer',
      contextId: 'drawing-group',
      errors: ['subject_omission', 'be_omission', 'be_agreement', 'word_order'],
    },
  }),
  practice('Ada prepara su tarjeta. Ayúdala a elegir el verbo que va con I.', {
    id: 'travel_remedy_introduction_be',
    type: 'short_text',
    promptEs: 'Escribe la palabra que falta. Fíjate en quién habla.',
    sentence: 'I ___ Ada.',
    skillId: 'grammar.be_i_you',
    difficulty: 1,
    acceptedAnswers: ['am'],
    feedbackEs:
      'Con I usamos am. Con My name usamos is. Lee las dos frases: I am Ada. My name is Ada.',
    learning: {
      conceptId: 'introduction',
      skill: 'writing',
      evidence: 'understanding',
      contextId: 'drawing-group-card',
      guided: true,
      remediates: ['be_omission', 'be_agreement'],
      errorAnswers: { be_agreement: ['is', 'are'] },
    },
  }),
  practice(
    'En la recepción del alojamiento, las fichas tienen un espacio para presentarte. Arma la presentación de Ada.',
    {
      id: 'travel_remedy_introduction_subject',
      type: 'reorder',
      promptEs: 'Ordena las palabras del ejemplo de Ada: «Soy Ada».',
      tokens: ['am', 'Ada', 'I'],
      skillId: 'grammar.be_i_you',
      difficulty: 1,
      acceptedAnswers: ['I am Ada.'],
      feedbackEs: 'Para decir que eres Ada, escribe I primero, después am y al final el nombre.',
      learning: {
        conceptId: 'introduction',
        skill: 'writing',
        evidence: 'understanding',
        contextId: 'hostel-registration',
        guided: true,
        errors: ['word_order'],
        remediates: ['subject_omission', 'word_order'],
      },
    },
  ),
  practice('Llegas a otro barrio. Necesitas encontrar el parque para reunirte con alguien.', {
    id: 'travel_review_place_question',
    type: 'short_text',
    promptEs:
      'Pregunta en inglés dónde está el parque. Para practicar la forma de la lección, empieza con where y usa una forma de be antes del lugar, sin otro verbo.',
    skillId: 'grammar.be_questions',
    dimension: 'grammar_production',
    difficulty: 2,
    ...locationQuestion('the park'),
    feedbackEs:
      'En la pregunta directa Where is the park?, is va después de where y antes de the park.',
    learning: {
      conceptId: 'place-question',
      skill: 'grammar',
      evidence: 'transfer',
      contextId: 'neighborhood-meeting',
      errors: ['be_omission', 'article', 'word_order'],
      errorAnswers: { word_order: ['Where the park is?'] },
    },
  }),
  practice(
    'Estás en la entrada del parque. Una persona te deja una pregunta en audio. Anota el lugar por el que pregunta.',
    {
      id: 'travel_review_place_question_audio',
      type: 'short_text',
      promptEs: 'Escribe en inglés solo el nombre del lugar que busca la persona.',
      skillId: 'grammar.be_questions',
      dimension: 'vocabulary_recall',
      difficulty: 2,
      acceptedAnswers: ['Bus stop', 'The bus stop'],
      feedbackEs: 'Bus stop es la parada de bus. Where is…? indica que busca su ubicación.',
      learning: {
        conceptId: 'place-question',
        skill: 'listening',
        evidence: 'understanding',
        contextId: 'park-voice-note',
      },
    },
    {
      audio: 'Where is the bus stop?',
      transcript: 'Where is the bus stop?',
      listeningButton: 'Escuchar la pregunta',
    },
  ),
  practice(
    'En el plano del barrio, la pregunta por el parque está desordenada. Ayuda a arreglarla.',
    {
      id: 'travel_remedy_place_question_order',
      type: 'reorder',
      promptEs: 'Ordena la pregunta «¿Dónde está el parque?»',
      tokens: ['park', 'the', 'Where', 'is'],
      skillId: 'grammar.be_questions',
      difficulty: 1,
      acceptedAnswers: ['Where is the park?'],
      feedbackEs: 'Primero va Where, luego is y después el nombre completo del lugar, the park.',
      learning: {
        conceptId: 'place-question',
        skill: 'grammar',
        evidence: 'understanding',
        contextId: 'map-repair',
        guided: true,
        errors: ['word_order'],
        remediates: ['be_omission', 'article', 'word_order'],
      },
    },
  ),
  practice(
    'Encuentras una mochila junto a la parada de bus. Alguien pide por escrito su ubicación.',
    {
      id: 'travel_review_place_location',
      type: 'short_text',
      promptEs:
        'Di en inglés que la mochila está junto a la parada de bus. Para practicar, escribe el sujeto y be, seguidos de la expresión de dos palabras con next que significa «junto a».',
      skillId: 'grammar.be_it_they',
      dimension: 'grammar_production',
      difficulty: 2,
      ...adjacentLocation(
        ['The bag is', 'The backpack is', "The bag's", "The backpack's", 'It is', "It's"],
        'the bus stop',
      ),
      feedbackEs:
        'The bag is next to the bus stop ubica el objeto usando la parada como referencia.',
      learning: {
        conceptId: 'place-location',
        skill: 'writing',
        evidence: 'transfer',
        contextId: 'bus-stop-notice',
        errors: [
          'subject_omission',
          'be_omission',
          'be_agreement',
          'preposition',
          'article',
          'word_order',
        ],
      },
    },
  ),
  practice(
    'Preparas una nota para decir dónde está la mochila. Revisa cómo se escribe «junto a».',
    {
      id: 'travel_remedy_place_location_preposition',
      type: 'short_text',
      sentence: 'The bag is next ___ the park.',
      promptEs: 'Completa «La mochila está junto al parque» con la palabra que falta.',
      skillId: 'grammar.be_it_they',
      difficulty: 1,
      acceptedAnswers: ['to'],
      feedbackEs:
        'Para decir «al lado de», escribe next seguido de to. The bag is next to the park.',
      learning: {
        conceptId: 'place-location',
        skill: 'grammar',
        evidence: 'understanding',
        contextId: 'field-note',
        guided: true,
        remediates: ['preposition'],
      },
    },
  ),
  practice(
    'En el punto de encuentro del parque anotaron una indicación con las palabras revueltas. Ordénalas.',
    {
      id: 'travel_remedy_place_location_order',
      type: 'reorder',
      promptEs: 'Arma «La mochila está junto al parque».',
      tokens: ['park', 'to', 'bag', 'the', 'is', 'the', 'next'],
      skillId: 'grammar.be_it_they',
      difficulty: 1,
      acceptedAnswers: ['The bag is next to the park.'],
      feedbackEs:
        'La frase empieza con the bag. Después va is y la ubicación completa, next to the park.',
      learning: {
        conceptId: 'place-location',
        skill: 'grammar',
        evidence: 'understanding',
        contextId: 'park-meeting-clue',
        guided: true,
        errors: ['word_order'],
        remediates: ['subject_omission', 'be_omission', 'be_agreement', 'article', 'word_order'],
      },
    },
  ),
  practice(
    'En un mercado encontraron dos mochilas. Lee el mensaje de Emma y anota de qué color es la suya.',
    {
      id: 'travel_review_item_owner_read',
      type: 'short_text',
      promptEs: 'Escribe en inglés el color de la mochila de Emma.',
      passage: 'Hi! My name is Emma. My bag is red. It’s next to the blue bag.',
      skillId: 'grammar.be_it_they',
      dimension: 'grammar_understanding',
      difficulty: 2,
      acceptedAnswers: [
        'Red',
        'The red one.',
        'A red bag.',
        'A red backpack.',
        'It is red.',
        "It's red.",
        'The bag is red.',
        'The backpack is red.',
        "Emma's bag is red.",
        "Emma's backpack is red.",
        'Her bag is red.',
        'Her backpack is red.',
      ],
      feedbackEs:
        'My bag se refiere a quien escribe, Emma. La mochila azul solo sirve para ubicar la roja.',
      learning: {
        conceptId: 'item-ownership',
        skill: 'reading',
        evidence: 'transfer',
        contextId: 'market-lost-property',
      },
    },
  ),
  practice('Encontraron dos mochilas en el parque. Explica que la tuya es roja.', {
    id: 'travel_review_item_owner_write',
    type: 'short_text',
    promptEs:
      'Escribe en inglés «Mi mochila es roja». Usa my antes del sustantivo y pon el color después del verbo be.',
    skillId: 'grammar.be_it_they',
    dimension: 'grammar_production',
    difficulty: 2,
    acceptedAnswers: [
      'My bag is red.',
      'My backpack is red.',
      "My bag's red.",
      "My backpack's red.",
    ],
    communicationOnly: {
      answers: [
        'Mine is red.',
        "Mine's red.",
        'My bag is the red one.',
        'My backpack is the red one.',
      ],
      feedbackEs:
        'La persona puede identificar tu mochila. Para practicar la estructura, escribe My bag is red o My backpack is red.',
    },
    feedbackEs:
      'My bag is red describe el color de tu mochila. I have a red bag significa «Tengo una mochila roja».',
    learning: {
      conceptId: 'item-ownership',
      skill: 'writing',
      evidence: 'transfer',
      contextId: 'park-lost-property',
      errors: ['be_omission', 'be_agreement', 'article', 'word_order'],
      errorAnswers: { article: ['The my bag is red.', 'My the bag is red.'] },
    },
  }),
  practice(
    'En el mercado te mandan una nota que describe un bus y una mochila. Anota el color del bus.',
    {
      id: 'travel_review_item_color_read',
      type: 'short_text',
      promptEs: '¿De qué color es el bus? Escribe el color en inglés.',
      passage: 'The bus is red. The bag is blue.',
      skillId: 'grammar.be_it_they',
      dimension: 'grammar_understanding',
      difficulty: 2,
      acceptedAnswers: [
        'Red',
        'It is red.',
        "It's red.",
        'The bus is red.',
        "The bus's red.",
        'The red one.',
        'A red bus.',
      ],
      feedbackEs: 'The bus is red dice que el bus es rojo. Blue describe la mochila.',
      learning: {
        conceptId: 'item-color',
        skill: 'reading',
        evidence: 'transfer',
        contextId: 'market-transport-message',
      },
    },
  ),
  practice(
    'En el puesto de información te piden distinguir el bus rojo de otro bus. Confírmales cuál es.',
    {
      id: 'travel_review_item_color',
      type: 'short_text',
      promptEs:
        'Di en inglés que el bus es rojo. Para practicar, escribe un sujeto, una forma de be y después el color.',
      skillId: 'grammar.be_it_they',
      dimension: 'grammar_production',
      difficulty: 2,
      acceptedAnswers: ['The bus is red.', "The bus's red.", "It's red.", 'It is red.'],
      communicationOnly: {
        answers: ['Red.', 'The red one.', "It's a red bus.", 'It is a red bus.'],
        feedbackEs:
          'El color se entiende. Para practicar la estructura, escribe The bus is red o It’s red.',
      },
      feedbackEs:
        'El orden es The bus + is + red. Puedes decir It’s red si la otra persona ya sabe de qué bus hablas.',
      learning: {
        conceptId: 'item-color',
        skill: 'writing',
        evidence: 'transfer',
        contextId: 'bus-information',
        errors: ['subject_omission', 'be_omission', 'be_agreement', 'article', 'word_order'],
      },
    },
  ),
  practice('La oficina de objetos perdidos prepara una etiqueta para una mochila roja.', {
    id: 'travel_remedy_item_color_be',
    type: 'short_text',
    sentence: 'The bag ___ red.',
    promptEs: 'Elige el verbo que conecta el objeto con su color. Escríbelo en inglés.',
    skillId: 'grammar.be_it_they',
    difficulty: 1,
    acceptedAnswers: ['is'],
    feedbackEs: 'Con the bag como sujeto, usa is. La frase completa es The bag is red.',
    learning: {
      conceptId: 'item-color',
      skill: 'writing',
      evidence: 'understanding',
      contextId: 'lost-property-tag',
      guided: true,
      remediates: ['be_omission', 'be_agreement'],
      errorAnswers: { be_agreement: ['am', 'are'] },
    },
  }),
  practice(
    'Una viajera te deja un mensaje de voz sobre su mochila. Anota dónde está con respecto al lugar que menciona.',
    {
      id: 'travel_review_place_location_audio',
      type: 'short_text',
      promptEs:
        'Escribe en inglés la ubicación y el lugar de referencia. Puedes dar una respuesta breve.',
      skillId: 'grammar.be_it_they',
      dimension: 'vocabulary_recall',
      difficulty: 2,
      acceptedAnswers: [
        'Next to the park.',
        "It's next to the park.",
        'It is next to the park.',
        'The bag is next to the park.',
        'The backpack is next to the park.',
        'Right next to the park.',
        'Beside the park.',
        "It's beside the park.",
        'It is beside the park.',
        'The bag is beside the park.',
        'The backpack is beside the park.',
        'Right by the park.',
      ],
      feedbackEs:
        'La mochila está junto al parque. Next to dice cómo se relaciona la ubicación de la mochila con the park.',
      learning: {
        conceptId: 'place-location',
        skill: 'listening',
        evidence: 'understanding',
        contextId: 'lost-bag-audio',
      },
    },
    {
      audio: 'It’s next to the park.',
      transcript: 'It’s next to the park.',
      listeningButton: 'Escuchar el mensaje',
    },
  ),
];

export const travelLesson: CourseLesson = {
  id: 'travel_home',
  unitId: 'travel',
  title: chapter.title,
  introEs: 'Inglés para ayudar a alguien en tu barrio.',
  examples: [],
  speakingText: 'Hi! I am Luz.',
  estimatedMinutes: chapter.missions.reduce((total, mission) => total + mission.minutes[1], 0),
  exercises: [
    {
      id: 'travel_quick_hello',
      type: 'meaning',
      promptEs: 'Una viajera te saluda: “Hi!” ¿Qué te dijo?',
      skillId: 'grammar.be_i_you',
      vocabularyIds: ['u01_l01_v02'],
      dimension: 'vocabulary_recognition',
      difficulty: 1,
      optionsLanguage: 'es',
      options: [
        { id: 'bye', text: 'Adiós' },
        { id: 'hello', text: 'Hola' },
      ],
      correctOptionId: 'hello',
      acceptedAnswers: ['Hola'],
      feedbackEs: 'Hi es una forma común de decir hola. También puedes decir hello.',
      learning: {
        conceptId: 'greeting',
        skill: 'vocabulary',
        evidence: 'recognition',
        contextId: 'quick-welcome',
        guided: true,
      },
    },
    ...chapter.missions.flatMap((mission) =>
      mission.steps.flatMap((step) => (step.type === 'exercise' ? [step.exercise] : [])),
    ),
    ...travelPracticeSteps.map((step) => step.exercise),
  ],
};
