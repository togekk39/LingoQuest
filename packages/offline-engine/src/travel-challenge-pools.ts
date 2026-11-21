import type { CourseExercise } from './index';

const afterTrip = 'grammar.be_it_they';
function fill(id: string, sentence: string, answer: string, gloss: string): CourseExercise {
  return {
    id: `home_challenge_${id}`,
    type: 'short_text',
    sentence,
    promptEs: 'Escribe la palabra que falta.',
    acceptedAnswers: [answer],
    feedbackEs: gloss,
    skillId: afterTrip,
    difficulty: 1,
  };
}
function read(
  id: string,
  passage: string,
  promptEs: string,
  answer: string,
  other: string,
  feedbackEs: string,
): CourseExercise {
  return {
    id: `home_challenge_${id}`,
    type: 'meaning',
    passage,
    promptEs,
    optionsLanguage: 'es',
    options: [
      { id: 'other', text: other },
      { id: 'right', text: answer },
    ],
    correctOptionId: 'right',
    acceptedAnswers: [answer],
    feedbackEs,
    skillId: afterTrip,
    difficulty: 1,
  };
}

export const travelChallengePools = {
  grammar_rush: [
    fill('name', 'My name ___ Sam.', 'is', 'Después de My name usamos is.'),
    fill('introduce', 'I ___ Luz.', 'am', 'Con I usamos am, como en I am Luz.'),
    fill(
      'directions',
      'It’s next ___ the park.',
      'to',
      'Next to es una expresión completa para decir «junto a».',
    ),
    fill('color', 'My bag ___ blue.', 'is', 'Is conecta la mochila con su color.'),
    fill('where', 'Where ___ the bus stop?', 'is', 'Where is…? sirve para preguntar por un lugar.'),
  ],
  cloze_battle: [
    fill(
      'plaza',
      'Hi! My name is Sam. Where is the bus ___?',
      'stop',
      'La parada del bus es the bus stop.',
    ),
    fill(
      'park',
      'Where is the bus stop? It’s next to the ___. (parque)',
      'park',
      'Park significa «parque».',
    ),
    fill('message', 'My ___ is blue. (mochila)', 'bag', 'Bag puede referirse a una mochila.'),
    fill('blue', 'My bag is ___. (azul)', 'blue', 'Blue significa «azul».'),
    fill('red', 'Where is my bag? It’s ___. (roja)', 'red', 'Red significa «rojo» o «roja».'),
  ],
  reading_quest: [
    read(
      'readname',
      'Hi! My name is Luz.',
      '¿Quién se presenta?',
      'Luz.',
      'Sam.',
      'My name is Luz significa «Me llamo Luz».',
    ),
    read(
      'readwhere',
      'Where is the bus stop?',
      '¿Qué busca la persona?',
      'La parada del bus.',
      'Su mochila.',
      'Where is…? introduce una pregunta de ubicación.',
    ),
    read(
      'readpark',
      'Where is the bus stop? It’s next to the park.',
      '¿Qué lugar te ayuda a ubicar la parada?',
      'El parque.',
      'La mesa de bienvenida.',
      'Next to the park significa «junto al parque».',
    ),
    read(
      'readbag',
      'Hi! My name is Sam. My bag is blue.',
      '¿Qué mochila pertenece a Sam?',
      'La azul.',
      'La roja.',
      'Sam dice My bag is blue, «Mi mochila es azul».',
    ),
    read(
      'readred',
      'My bag is blue. It’s next to the red bag.',
      '¿Cuál de las dos mochilas es de quien escribe?',
      'La azul.',
      'La roja.',
      'La mochila azul es de quien habla. La roja solo marca la ubicación.',
    ),
  ],
};
