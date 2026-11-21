import type { CourseExercise } from './index';

export const travelPlacementItems: {
  missionId: string;
  audio?: string;
  exercise: CourseExercise;
}[] = [
  {
    missionId: 'hello',
    exercise: {
      id: 'route_intro_read',
      type: 'meaning',
      promptEs: '¿Qué está haciendo la persona?',
      passage: 'Hi! My name is Sam.',
      options: [
        { id: 'name', text: 'Se está presentando.' },
        { id: 'bag', text: 'Está buscando su mochila.' },
      ],
      optionsLanguage: 'es',
      correctOptionId: 'name',
      acceptedAnswers: ['Se está presentando.'],
      difficulty: 1,
      skillId: 'grammar.be_i_you',
      feedbackEs: 'My name is significa «me llamo».',
    },
  },
  {
    missionId: 'hello',
    exercise: {
      id: 'route_intro_write',
      type: 'short_text',
      promptEs: 'Traduce el ejemplo de Luz: «Soy Luz».',
      acceptedAnswers: ['I am Luz', "I'm Luz", 'My name is Luz', "My name's Luz"],
      difficulty: 1,
      skillId: 'grammar.be_i_you',
      feedbackEs:
        'Puedes decir tu nombre con I am Luz o My name is Luz. Sus formas cortas son I’m Luz y My name’s Luz.',
    },
  },
  {
    missionId: 'bus',
    audio: 'Where is the bus stop?',
    exercise: {
      id: 'route_bus_listen',
      type: 'meaning',
      promptEs: 'Escucha a Sam. ¿Qué está buscando?',
      options: [
        { id: 'park', text: 'El parque.' },
        { id: 'stop', text: 'La parada de bus.' },
      ],
      optionsLanguage: 'es',
      correctOptionId: 'stop',
      acceptedAnswers: ['La parada de bus.'],
      difficulty: 2,
      skillId: 'grammar.be_questions',
      feedbackEs: 'Bus stop es la parada de bus.',
    },
  },
  {
    missionId: 'bus',
    exercise: {
      id: 'route_bus_order',
      type: 'reorder',
      promptEs: 'Indica que la parada está junto al parque.',
      tokens: ['park', 'It’s', 'to', 'the', 'next'],
      acceptedAnswers: ['It’s next to the park'],
      difficulty: 2,
      skillId: 'grammar.be_it_they',
      feedbackEs: 'Next to significa «junto a».',
    },
  },
  {
    missionId: 'bag',
    exercise: {
      id: 'route_bag_read',
      type: 'single_choice',
      promptEs: 'Lee el mensaje. ¿Qué objeto debes devolver?',
      passage: 'My bag is blue.',
      options: [
        { id: 'red', text: 'Una mochila roja.' },
        { id: 'blue', text: 'Una mochila azul.' },
      ],
      optionsLanguage: 'es',
      correctOptionId: 'blue',
      acceptedAnswers: ['Una mochila azul.'],
      difficulty: 3,
      skillId: 'grammar.be_it_they',
      feedbackEs: 'Blue significa «azul».',
    },
  },
  {
    missionId: 'bag',
    exercise: {
      id: 'route_bag_write',
      type: 'short_text',
      promptEs: 'Confirma el color de la mochila. Escribe «Es azul» en inglés.',
      acceptedAnswers: [
        'It is blue',
        "It's blue",
        'The bag is blue',
        "The bag's blue",
        'The backpack is blue',
        "The backpack's blue",
      ],
      difficulty: 3,
      skillId: 'grammar.be_it_they',
      feedbackEs: 'It is blue describe un objeto conocido.',
    },
  },
];
