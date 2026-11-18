import type { Translation } from '@lingoquest/contracts';
import type { CourseExercise, CourseLesson } from './index';

export type TravelStep =
  | { type: 'dialogue'; speaker: 'Luz' | 'Sam' | 'QuestBuddy'; text: string; line?: Translation }
  | { type: 'teach'; title: string; text: string; examples: Translation[] }
  | {
      type: 'exercise';
      situation: string;
      exercise: CourseExercise;
      hint?: string;
      audio?: string;
      transcript?: string;
      visual?: 'directions' | 'bag';
    }
  | { type: 'speak'; text: string; phrase: string };

export interface TravelMission {
  id: string;
  title: string;
  place: string;
  objective: string;
  minutes: number;
  success: string;
  steps: TravelStep[];
}

interface TravelChapter {
  id: string;
  revision: number;
  title: string;
  stamp: string;
  postcard: string;
  message: string;
  collectible: string;
  missions: TravelMission[];
}

export const chapter: TravelChapter = {
  id: 'home',
  revision: 1,
  title: 'La primera postal',
  stamp: 'Primer encuentro',
  postcard: 'Una postal para el camino',
  message:
    'Hoy di indicaciones en inglés en mi propio barrio. A veces un viaje empieza cuando te animas a hablar con alguien.',
  collectible: 'La postal de Sam',
  missions: [
    {
      id: 'hello',
      title: 'Un saludo en la plaza',
      place: 'La plaza',
      objective: 'Preséntate con la tarjeta de bienvenida de Luz.',
      minutes: 1,
      success: 'Sam te agradece el saludo y te muestra el boleto del bus que busca.',
      steps: [
        {
          type: 'dialogue',
          speaker: 'Luz',
          text: 'Ayudas en la mesa de bienvenida de la plaza. Sam se acerca con un boleto y saluda en inglés. Luz, que organiza la mesa, te presta su tarjeta para practicar.',
        },
        {
          type: 'dialogue',
          speaker: 'Sam',
          text: 'Sam saluda y te dice su nombre.',
          line: { en: 'Hi! My name is Sam.', es: '¡Hola! Me llamo Sam.' },
        },
        {
          type: 'teach',
          title: 'Decir tu nombre',
          text: 'Hi y hello significan «hola». I am y su forma corta I’m sirven para presentarte. My name is va antes de tu nombre y equivale a «me llamo».',
          examples: [
            { en: 'Hi! I am Luz.', es: '¡Hola! Soy Luz.' },
            { en: 'My name is Luz.', es: 'Me llamo Luz.' },
          ],
        },
        {
          type: 'exercise',
          situation:
            'Escribe el saludo que Luz dejó en su tarjeta. Sam puede leerlo en el mostrador.',
          hint: 'Empieza con «Hi!». Después puedes usar «I am» o «My name is».',
          exercise: {
            id: 'travel_hello_write',
            type: 'short_text',
            promptEs: 'Escribe «¡Hola! Soy Luz» en inglés.',
            skillId: 'grammar.be_i_you',
            dimension: 'grammar_production',
            difficulty: 1,
            acceptedAnswers: [
              'Hi! I am Luz.',
              "Hi! I'm Luz.",
              'Hello! I am Luz.',
              "Hello! I'm Luz.",
              'Hi! My name is Luz.',
              'Hello! My name is Luz.',
            ],
            feedbackEs:
              'Después de I am o I’m escribimos el nombre. My name is Luz también funciona.',
          },
        },
        {
          type: 'speak',
          text: 'Ahora saluda a Sam con tu propio nombre. Di «Hi! I am…» y agrega tu nombre.',
          phrase: 'Hi! I am Luz.',
        },
      ],
    },
    {
      id: 'bus',
      title: 'El bus de las ocho',
      place: 'La parada',
      objective: 'Escucha a Sam y explícale dónde tomar el bus.',
      minutes: 2,
      success:
        'Sam encuentra la parada junto al parque. Al llegar, se da cuenta de que dejó su mochila en la mesa.',
      steps: [
        {
          type: 'dialogue',
          speaker: 'Sam',
          text: 'Sam va a tomar el bus de las ocho. Te pregunta por la parada porque el horario está en español.',
          line: { en: 'Where is the bus stop?', es: '¿Dónde está la parada del bus?' },
        },
        {
          type: 'teach',
          title: 'Ubicar un lugar',
          text: 'Where is…? pregunta dónde está algo. Para contestar, usa It’s (it is) y una ubicación. Next to indica que dos lugares o cosas están uno al lado del otro.',
          examples: [
            { en: 'bus stop', es: 'parada de bus' },
            { en: 'park', es: 'parque' },
            { en: 'It’s next to the park.', es: 'Está junto al parque.' },
          ],
        },
        {
          type: 'exercise',
          situation: 'Señala qué lugar te pidió Sam.',
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
          },
        },
        {
          type: 'exercise',
          situation:
            'Sam necesita una indicación que pueda seguir. Mira el croquis y arma tu respuesta.',
          visual: 'directions',
          hint: 'It’s + next to + the park.',
          exercise: {
            id: 'travel_bus_direction',
            type: 'reorder',
            promptEs: 'Dile «Está junto al parque».',
            skillId: 'grammar.be_it_they',
            dimension: 'grammar_production',
            difficulty: 1,
            tokens: ['park', 'It’s', 'to', 'the', 'next'],
            acceptedAnswers: ["It's next to the park."],
            feedbackEs:
              'It’s next to the park. Next siempre va antes de to en la expresión next to.',
          },
        },
        {
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
      minutes: 2,
      success:
        'La mochila vuelve con Sam. Dentro llevaba una postal en blanco. Te la regala para que escribas el primer recuerdo de tu propio viaje.',
      steps: [
        {
          type: 'dialogue',
          speaker: 'Luz',
          text: 'Luz tiene dos mochilas en objetos perdidos. Sam te manda un mensaje en inglés para decirte cuál es la suya.',
          line: { en: 'My bag is blue.', es: 'Mi mochila es azul.' },
        },
        {
          type: 'teach',
          title: 'Describir con colores',
          text: 'Bag puede significar bolso o mochila. Para describir un objeto que ya conocemos, di It’s + color. Blue significa azul y red, rojo.',
          examples: [
            { en: 'a blue bag', es: 'una mochila azul' },
            { en: 'It’s red.', es: 'Es roja.' },
          ],
        },
        {
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
          },
        },
        {
          type: 'exercise',
          situation: 'Confirma por escrito el color para que Sam sepa que encontraste su mochila.',
          hint: 'Puedes empezar con «It’s» o «The bag is».',
          exercise: {
            id: 'travel_bag_write',
            type: 'short_text',
            promptEs: 'Escribe «Es azul» en inglés.',
            skillId: 'grammar.be_it_they',
            dimension: 'grammar_production',
            difficulty: 1,
            acceptedAnswers: [
              "It's blue.",
              'It is blue.',
              'The bag is blue.',
              'The backpack is blue.',
            ],
            feedbackEs:
              'It’s blue sirve cuando ya sabemos de qué objeto hablamos. También puedes decir The bag is blue.',
          },
        },
        {
          type: 'dialogue',
          speaker: 'QuestBuddy',
          text: 'Sam recupera su mochila y te deja una postal. Escribe en ella tu primer recuerdo: ya usaste inglés para ayudar a alguien.',
        },
      ],
    },
  ],
};

export const travelLesson: CourseLesson = {
  id: 'travel_home',
  unitId: 'travel',
  title: chapter.title,
  introEs: 'Inglés para ayudar a alguien en tu barrio.',
  examples: [],
  speakingText: 'Hi! I am Luz.',
  estimatedMinutes: 5,
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
    },
    ...chapter.missions.flatMap((mission) =>
      mission.steps.flatMap((step) => (step.type === 'exercise' ? [step.exercise] : [])),
    ),
  ],
};
