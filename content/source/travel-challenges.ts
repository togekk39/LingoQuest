import type { PrivateExercise } from './curriculum.ts';

type Fill = [
  sentence: string,
  answer: string,
  skill: string,
  feedback: string,
  variants?: string[],
];
type Reading = [
  question: string,
  correct: string,
  distractors: [string, string],
  feedback: string,
  skill: string,
];
type Scenario = {
  id: string;
  difficulty: number;
  throughUnit: number;
  passage: string;
  cloze: string;
  blanks: Fill[];
  grammar: Fill[];
  reading: Reading[];
};

const scenarios: Scenario[] = [
  {
    id: 'market',
    difficulty: 10,
    throughUnit: 4,
    passage:
      'Yesterday, Ana was at work in the morning. Leo was at home. At noon they went to the market together. Ana bought fruit. Leo bought bread. After lunch, Ana took the bus home. Leo went to the park.',
    cloze:
      'Yesterday, Ana [1] at work. At noon she [2] to the market. She [3] fruit. After lunch, she [4] the bus. [5] Leo go home with Ana? No, he went to the park.',
    blanks: [
      [
        'Yesterday, Ana [1] at work. (usa be en pasado simple)',
        'was',
        'past_be',
        'Ana equivale a she. En pasado usamos was.',
      ],
      [
        'At noon she [2] to the market. (usa go en pasado simple)',
        'went',
        'past_irregular',
        'Went es el pasado de go.',
      ],
      [
        'She [3] fruit. (usa buy en pasado simple)',
        'bought',
        'past_irregular',
        'Bought es el pasado de buy.',
      ],
      [
        'After lunch, she [4] the bus. (usa take en pasado simple)',
        'took',
        'past_irregular',
        'Took es el pasado de take.',
      ],
      [
        '[5] Leo go home with Ana? (pregunta sobre ayer)',
        'did',
        'did',
        'Para una pregunta en pasado, usa did + sujeto + verbo base.',
      ],
    ],
    grammar: [
      [
        'I ___ at home yesterday. (usa be en pasado simple)',
        'was',
        'past_be',
        'En el pasado, I se combina con was.',
      ],
      [
        'They ___ at the market yesterday. (usa be en pasado simple)',
        'were',
        'past_be',
        'En el pasado, they se combina con were.',
      ],
      [
        'She ___ the room yesterday. (usa clean en pasado simple)',
        'cleaned',
        'past_regular',
        'Clean añade -ed para formar el pasado.',
      ],
      [
        'I ___ my sister at eight. (usa call en pasado simple)',
        'called',
        'past_regular',
        'Call añade -ed para formar el pasado.',
      ],
      [
        'They ___ lunch at noon yesterday. (usa eat en pasado simple)',
        'ate',
        'past_irregular',
        'Ate es el pasado de eat.',
      ],
    ],
    reading: [
      [
        '¿Dónde estaba Leo por la mañana?',
        'En casa',
        ['En el trabajo', 'En el parque'],
        'Leo was at home. Ana estaba en el trabajo.',
        'past_be',
      ],
      [
        '¿Qué compraron entre los dos?',
        'Fruta y pan',
        ['Pan y arroz', 'Fruta y té'],
        'Ana compró fruta y Leo compró pan.',
        'past_irregular',
      ],
      [
        '¿En qué parte del día estuvieron juntos?',
        'Cuando fueron al mercado',
        ['Cuando Ana estaba en el trabajo', 'Cuando Leo fue al parque'],
        'At noon they went to the market together dice que fueron juntos al mercado al mediodía.',
        'past_irregular',
      ],
      [
        '¿Quién volvió a casa en autobús después de almorzar?',
        'Ana',
        ['Leo', 'Los dos'],
        'Ana took the bus home. Leo fue al parque.',
        'past_irregular',
      ],
    ],
  },
  {
    id: 'meeting',
    difficulty: 12,
    throughUnit: 6,
    passage:
      'Yesterday, Leo bought a ticket for next Saturday. He is going to travel by bus. He is going to meet Ana at two. Ana is going to travel by train. Right now, Ana is writing a message. The train is going to arrive late. She will call Leo later. Leo will wait outside.',
    cloze:
      'Yesterday, Leo [1] a ticket. He is [2] to travel by bus next Saturday. Ana is [3] a message right now. The train is going [4] arrive late. She [5] call Leo later.',
    blanks: [
      [
        'Leo [1] a ticket yesterday. (usa buy en pasado simple)',
        'bought',
        'past_irregular',
        'Yesterday sitúa la compra en el pasado. Buy cambia a bought.',
      ],
      [
        'He is [2] to travel by bus next Saturday. (plan)',
        'going',
        'going_to',
        'Para el plan, combina is going to con travel.',
      ],
      [
        'Ana is [3] a message right now. (usa write)',
        'writing',
        'continuous_others',
        'Usa is + writing para hablar de lo que hace justo ahora.',
      ],
      [
        'The train is going [4] arrive late.',
        'to',
        'going_to',
        'To une going con el verbo base arrive.',
      ],
      [
        'She [5] call Leo later. (completa «llamará» con una palabra)',
        'will',
        'will',
        'Will va antes del verbo base call.',
      ],
    ],
    grammar: [
      [
        'I ___ going to meet Ana at two. (plan)',
        'am',
        'going_to',
        'Usa I am going to para introducir tu plan.',
      ],
      [
        'What are you ___ right now? (usa do)',
        'doing',
        'continuous_questions',
        'Are you doing pregunta por la acción actual.',
      ],
      [
        'When ___ they going to meet? (plan)',
        'are',
        'going_to_questions',
        'Con they, la pregunta empieza con When are.',
      ],
      [
        'I ___ carry your bag. (ofrecimiento: cargaré)',
        'will',
        'will',
        'I will carry es un ofrecimiento de ayuda.',
      ],
      [
        'We will ___ cancel the trip. (no cancelaremos)',
        'not',
        'will_negative',
        'Para negar en futuro, agrega not justo después de will.',
      ],
    ],
    reading: [
      [
        '¿Qué ocurrió antes del mensaje?',
        'Leo compró el boleto',
        ['Ana llegó en tren', 'Leo esperó afuera'],
        'Yesterday ubica la compra antes de right now, cuando Ana escribe.',
        'continuous_others',
      ],
      [
        '¿A quién afecta directamente el retraso del tren?',
        'A Ana, que planea ir en tren',
        ['A Leo, que ya tomó el tren', 'A ambos, porque compraron el mismo boleto'],
        'Ana planea ir en tren; Leo planea ir en autobús.',
        'going_to',
      ],
      [
        '¿Para qué podría servir la llamada?',
        'Para coordinar el encuentro si cambia la hora de llegada',
        [
          'Para cancelar un boleto que aún no se compró',
          'Para confirmar lo que pasó ayer después del viaje',
        ],
        'Todavía planean verse y el tren llegará tarde. La llamada puede servir para coordinarse.',
        'will',
      ],
      [
        '¿Dónde esperará Leo?',
        'Esperar afuera',
        ['Esperar dentro del tren', 'Volver al mercado'],
        'Leo will wait outside. Outside significa afuera.',
        'will',
      ],
    ],
  },
  {
    id: 'arrival',
    difficulty: 13,
    throughUnit: 8,
    passage:
      'Ana has traveled by bus before, but she has not traveled by train yet. Yesterday she bought a bus ticket. The bus is cheaper than the train, and she can still arrive early. Leo would like a window seat. He is going to wait for Ana at the hotel because they have a reservation there. His directions say: Turn left at the bank. The hotel is next to the bank.',
    cloze:
      'Ana has not traveled by train [1]. She [2] a bus ticket yesterday. The bus is [3] than the train. Leo [4] like a window seat. His directions say: [5] left at the bank.',
    blanks: [
      [
        'Ana has not traveled by train [1]. (todavía)',
        'yet',
        'perfect_yet',
        'Yet se coloca al final y significa todavía en una oración negativa.',
      ],
      [
        'She [2] a bus ticket yesterday. (usa el pasado simple de buy)',
        'bought',
        'past_vs_perfect',
        'Yesterday pide el pasado simple, por eso usamos bought.',
      ],
      [
        'The bus is [3] than the train. (usa el comparativo de cheap)',
        'cheaper',
        'comparatives',
        'Cheap cambia a cheaper antes de than.',
      ],
      [
        'Leo [4] like a window seat. (preferiría)',
        'would',
        'would_like',
        'Would like sirve para pedir o decir qué quieres con cortesía.',
      ],
      [
        '[5] left at the bank. (da la indicación con turn)',
        'turn',
        'imperatives',
        'Usa turn al inicio para indicar un giro.',
      ],
    ],
    grammar: [
      [
        'Ana has ___ to the beach twice. (usa el participio de be)',
        'been',
        'perfect_experiences',
        'Been es el participio de be. Has been to the beach expresa una visita, sin indicar cuándo fue.',
      ],
      [
        'Have you ___ traveled abroad? (alguna vez)',
        'ever',
        'perfect_questions',
        'Ever va entre you y traveled en esta pregunta.',
      ],
      [
        'He has not packed the bag ___. (todavía)',
        'yet',
        'perfect_yet',
        'Yet va al final de esta oración negativa.',
      ],
      [
        'I ___ to the beach last year. (usa go en pasado simple)',
        'went',
        'past_vs_perfect',
        'Last year indica un momento pasado. Usa went.',
      ],
      [
        'I would ___ an aisle seat, please. (quisiera)',
        'like',
        'would_like',
        'Would like es una petición amable.',
      ],
      [
        '___ straight to the hotel after you turn left. (sigue)',
        'go',
        'imperatives',
        'Go straight significa «sigue derecho». En una indicación como esta, usa el verbo base al principio.',
        ['continue'],
      ],
      [
        'This taxi is ___ than the bus. (usa el comparativo de slow)',
        'slower',
        'comparatives',
        'Slow cambia a slower antes de than.',
      ],
      [
        'The train is ___ than that bus. (usa el comparativo de fast)',
        'faster',
        'comparatives',
        'Con fast, añade -er para comparar.',
      ],
      [
        'I want this job ___ I like to help. (conector de causa)',
        'because',
        'because',
        'Because introduce la razón por la que quieres el trabajo.',
        ['since', 'as'],
      ],
      [
        'I have not ___ a ticket yet. (usa el participio de buy)',
        'bought',
        'perfect_yet',
        'Bought es también el participio que acompaña a have not.',
      ],
    ],
    reading: [
      [
        'Si la prioridad de Ana fuera ahorrar sin llegar tarde, ¿qué opción del texto cumple las dos condiciones?',
        'El bus',
        ['El tren', 'Esperar en el hotel'],
        'El bus cuesta menos y Ana puede llegar temprano. Las dos pistas están unidas en la misma oración.',
        'comparatives',
      ],
      [
        '¿Qué dato expresa una preferencia, sin demostrar una compra?',
        'Leo quiere un asiento de ventana',
        ['Ana compró un boleto de bus', 'Leo tiene una reservación en un hotel'],
        'Would like expresa una preferencia. Bought y have indican hechos en esta lectura.',
        'would_like',
      ],
      [
        'Según las indicaciones, ¿qué hay que hacer al llegar al banco?',
        'Que gire a la izquierda al llegar al banco',
        ['Que gire a la derecha al llegar al banco', 'Que espere adentro del banco'],
        'Turn left at the bank es la indicación. La frase siguiente dice dónde está el hotel.',
        'imperatives',
      ],
      [
        '¿Qué plan y motivo están vinculados de forma explícita?',
        'Leo esperará en el hotel porque tienen una reservación ahí',
        [
          'Ana viajará en tren porque compró un boleto',
          'Leo cambiará de hotel porque quiere viajar en bus',
        ],
        'Because conecta el plan de esperar en el hotel con el hecho de que tienen una reservación ahí.',
        'because',
      ],
    ],
  },
];

const names = [{ en: 'Leo', es: 'nombre de una persona' }];
const arrivalGlosses = [
  { en: 'but', es: 'pero' },
  { en: 'still', es: 'aun así' },
  { en: 'for Ana', es: 'a Ana' },
  { en: 'there', es: 'ahí' },
  { en: 'his directions say', es: 'sus indicaciones dicen' },
];

function withCue(prompt: string, sentence: string) {
  const [line, cue] = sentence.split(' (');
  return {
    sentence: line.replace(/\[\d\]/, '___'),
    promptEs: cue ? `${prompt} Pista: ${cue.slice(0, -1)}.` : prompt,
  };
}
function prereqs(throughUnit: number) {
  return Array.from(
    { length: throughUnit * 4 },
    (_, i) => `u0${Math.floor(i / 4) + 1}_l0${(i % 4) + 1}`,
  );
}

export const travelChallengePools = {
  grammar_rush: scenarios.flatMap(({ id, difficulty, throughUnit, blanks, grammar }) =>
    [...grammar, ...(grammar.length < 10 ? blanks : [])].map(
      ([sentence, answer, skill, feedbackEs, variants = []], i): PrivateExercise => ({
        id: `challenge_travel_${id}_grammar_${i}`,
        difficulty,
        type: 'short_text',
        ...withCue('Escribe la palabra que falta según el contexto.', sentence),
        skillId: `grammar.${skill}`,
        acceptedAnswers: [answer, ...variants],
        feedbackEs,
        vocabularyIds: [],
        dimension: 'grammar_production',
        contextualGlosses: [
          ...names,
          ...(id === 'arrival'
            ? [
                { en: 'after you turn left', es: 'después de girar a la izquierda' },
                { en: 'continue', es: 'seguir' },
                { en: 'since; as', es: 'ya que; como (causa)' },
              ]
            : []),
        ],
        requiredLessonIds: prereqs(throughUnit),
      }),
    ),
  ),
  cloze_battle: scenarios.flatMap(({ id, difficulty, throughUnit, blanks, cloze }) =>
    blanks.map(([sentence, answer, skill, feedbackEs, variants = []], i): PrivateExercise => ({
      id: `challenge_travel_${id}_cloze_${i}`,
      difficulty,
      type: 'short_text',
      ...withCue(
        `Completa el espacio [${i + 1}]. Lee toda la nota para entender el contexto.`,
        sentence,
      ),
      passage: cloze,
      skillId: `grammar.${skill}`,
      acceptedAnswers: [answer, ...variants],
      feedbackEs,
      vocabularyIds: [],
      dimension: 'grammar_production',
      contextualGlosses: [...names, ...(id === 'arrival' ? arrivalGlosses : [])],
      requiredLessonIds: prereqs(throughUnit),
    })),
  ),
  reading_quest: scenarios.flatMap(({ id, difficulty, throughUnit, passage, reading }) =>
    reading.map(([promptEs, answer, distractors, feedbackEs, skill], i): PrivateExercise => {
      const values = [...distractors];
      values.splice((i + 1) % 3, 0, answer);
      return {
        id: `challenge_travel_${id}_reading_${i}`,
        difficulty,
        type: 'single_choice',
        passage,
        promptEs,
        options: values.map((text, n) => ({ id: String(n), text })),
        optionsLanguage: 'es',
        correctOptionId: String((i + 1) % 3),
        acceptedAnswers: [answer],
        skillId: `grammar.${skill}`,
        feedbackEs,
        vocabularyIds: [],
        dimension: 'grammar_understanding',
        contextualGlosses: [...names, ...(id === 'arrival' ? arrivalGlosses : [])],
        requiredLessonIds: prereqs(throughUnit),
      };
    }),
  ),
};
