import type { PrivateExercise } from './curriculum.ts';

type Fill = [sentence: string, answer: string, skill: string, feedback: string];
type Reading = [question: string, correct: string, distractors: [string, string], feedback: string];
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
    difficulty: 9,
    throughUnit: 4,
    passage:
      'Yesterday, Ana was at work in the morning. Leo was at home. At noon they went to the market together. Ana bought fruit. Leo bought bread. After lunch, Ana took the bus home. Leo went to the park.',
    cloze:
      'Yesterday, Ana [1] at work. At noon she [2] to the market. She [3] fruit. After lunch, she [4] the bus. [5] Leo go home with Ana? No, he went to the park.',
    blanks: [
      ['Ana [1] at work.', 'was', 'past_be', 'Ana equivale a she. En pasado usamos was.'],
      ['She [2] to the market.', 'went', 'past_irregular', 'Went es el pasado de go.'],
      ['She [3] fruit.', 'bought', 'past_irregular', 'Bought es el pasado de buy.'],
      ['She [4] the bus.', 'took', 'past_irregular', 'Took es el pasado de take.'],
      [
        '[5] Leo go home with Ana?',
        'did',
        'did',
        'Para una pregunta en pasado, usa did + sujeto + verbo base.',
      ],
    ],
    grammar: [
      ['I ___ at home yesterday. (estar)', 'was', 'past_be', 'I se combina con was.'],
      ['They ___ at the market yesterday. (estar)', 'were', 'past_be', 'They se combina con were.'],
      [
        'She ___ the room yesterday. (limpiar)',
        'cleaned',
        'past_regular',
        'Clean añade -ed para formar el pasado.',
      ],
      [
        'I ___ my sister at eight. (llamar, ayer)',
        'called',
        'past_regular',
        'Call añade -ed para formar el pasado.',
      ],
      [
        'They ___ lunch at noon yesterday. (comer)',
        'ate',
        'past_irregular',
        'Ate es el pasado de eat.',
      ],
    ],
    reading: [
      [
        'Leo no se reunió con Ana antes del mercado. ¿Dónde estaba Leo esa mañana?',
        'En casa',
        ['En el trabajo', 'En el parque'],
        'Leo was at home. Ana era quien trabajaba por la mañana.',
      ],
      [
        '¿Qué compraron entre los dos?',
        'Fruta y pan',
        ['Pan y arroz', 'Fruta y té'],
        'Ana compró fruta y Leo compró pan.',
      ],
      [
        '¿Vivieron juntos todo lo que cuenta el texto?',
        'Solo coincidieron durante parte del día',
        ['Pasaron juntos del trabajo al parque', 'Cada quien fue a un mercado distinto'],
        'Fueron juntos al mercado, pero se separaron después de comer.',
      ],
      [
        '¿Quién pudo volver a casa en el bus después de almorzar?',
        'Ana',
        ['Leo', 'Los dos'],
        'Ana took the bus home. Leo se fue al parque.',
      ],
    ],
  },
  {
    id: 'meeting',
    difficulty: 11,
    throughUnit: 6,
    passage:
      'Yesterday, Leo bought a ticket for next Saturday. He is going to travel by bus. He is going to meet Ana at two. Ana is going to travel by train. Right now, Ana is writing a message. The train is going to arrive late. She will call Leo later. Leo will wait outside.',
    cloze:
      'Yesterday, Leo [1] a ticket. He is [2] to travel by bus next Saturday. Ana is [3] a message right now. The train is going [4] arrive late. She [5] call Leo later.',
    blanks: [
      [
        'Leo [1] a ticket yesterday. (comprar)',
        'bought',
        'past_irregular',
        'Yesterday sitúa la compra en el pasado. Buy cambia a bought.',
      ],
      [
        'He is [2] to travel by bus. (plan)',
        'going',
        'going_to',
        'Para el plan, combina is going to con travel.',
      ],
      [
        'Ana is [3] a message right now. (escribir)',
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
      ['She [5] call Leo later. (llamará)', 'will', 'will', 'Will va antes del verbo base call.'],
    ],
    grammar: [
      [
        'I ___ going to meet Ana at two. (plan)',
        'am',
        'going_to',
        'I am going to introduce el plan.',
      ],
      [
        'What are you ___ right now? (hacer)',
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
        'We will ___ cancel the trip. (forma negativa larga)',
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
      ],
      [
        '¿A quién afecta directamente el retraso del tren?',
        'A Ana, que planea ir en tren',
        ['A Leo, que ya tomó el tren', 'A ambos, porque compraron el mismo boleto'],
        'Ana planea ir en tren; Leo planea ir en bus.',
      ],
      [
        '¿Para qué podría servir la llamada?',
        'Para coordinar el encuentro si cambia la hora de llegada',
        [
          'Para cancelar un boleto que aún no se compró',
          'Para confirmar lo que pasó ayer después del viaje',
        ],
        'Todavía planean verse y el tren llegará tarde. La llamada puede servir para coordinarse.',
      ],
      [
        '¿Qué plan tiene Leo si necesita esperar?',
        'Esperar afuera',
        ['Esperar dentro del tren', 'Volver al mercado'],
        'Leo will wait outside. Outside significa afuera.',
      ],
    ],
  },
  {
    id: 'arrival',
    difficulty: 13,
    throughUnit: 8,
    passage:
      'Ana has traveled by bus before. She has not traveled by train yet. Yesterday she bought a bus ticket. Leo has a reservation at a hotel. He would like a window seat. The bus is cheaper than the train. The train is faster. Ana can arrive early by bus. Leo is going to wait at the hotel because he is looking for a job. The hotel is next to the bank.',
    cloze:
      'Ana has not traveled by train [1]. She [2] a bus ticket yesterday. The bus is [3] than the train. Leo [4] like a window seat. The hotel is [5] to the bank.',
    blanks: [
      [
        'Ana has not traveled by train [1]. (todavía)',
        'yet',
        'perfect_yet',
        'Yet se coloca al final y significa todavía en una oración negativa.',
      ],
      [
        'She [2] a bus ticket yesterday. (comprar)',
        'bought',
        'past_vs_perfect',
        'Yesterday pide el pasado simple, por eso usamos bought.',
      ],
      [
        'The bus is [3] than the train. (barato)',
        'cheaper',
        'comparatives',
        'Cheap cambia a cheaper antes de than.',
      ],
      [
        'Leo [4] like a window seat. (quisiera)',
        'would',
        'would_like',
        'Would like sirve para pedir o decir qué quieres con cortesía.',
      ],
      [
        'The hotel is [5] to the bank. (al lado)',
        'next',
        'imperatives',
        'Next to significa al lado de.',
      ],
    ],
    grammar: [
      [
        'Ana has ___ by bus twice. (viajar)',
        'traveled',
        'perfect_experiences',
        'Después de has va el participio traveled.',
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
        'I ___ to the beach last year. (ir)',
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
        'The hotel is next ___ the bank. (junto a)',
        'to',
        'imperatives',
        'Next to es la expresión completa.',
      ],
      [
        'This taxi is ___ than the bus. (lento)',
        'slower',
        'comparatives',
        'Slow cambia a slower antes de than.',
      ],
      [
        'The train is ___ than that bus. (rápido)',
        'faster',
        'comparatives',
        'Con fast, añade -er para comparar.',
      ],
      [
        'I want this job ___ I like to help. (motivo)',
        'because',
        'because',
        'Because introduce la razón por la que quieres el trabajo.',
      ],
      [
        'I have not ___ a ticket yet. (comprar)',
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
        'The bus is cheaper y Ana can arrive early by bus. El tren es más rápido pero cuesta más.',
      ],
      [
        '¿Qué dato expresa una preferencia, sin demostrar una compra?',
        'Leo quiere un asiento de ventana',
        ['Ana compró un boleto de bus', 'Leo tiene una reservación en un hotel'],
        'Would like expresa una preferencia. Bought y has indican hechos en esta lectura.',
      ],
      [
        '¿Qué detalle le permite a Ana encontrar a Leo sin conocer el nombre del hotel?',
        'El hotel está junto al banco',
        ['El tren es más rápido', 'Ana ya viajó en bus'],
        'The hotel is next to the bank vincula el hotel con una referencia visible.',
      ],
      [
        '¿Qué plan y motivo están vinculados de forma explícita?',
        'Leo esperará en el hotel porque busca trabajo',
        [
          'Ana viajará en tren porque compró un boleto',
          'Leo cambiará de hotel porque quiere viajar en bus',
        ],
        'Because conecta el plan de esperar en el hotel con la búsqueda de trabajo.',
      ],
    ],
  },
];

const names = [{ en: 'Leo', es: 'nombre de una persona' }];

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
      ([sentence, answer, skill, feedbackEs], i): PrivateExercise => ({
        id: `challenge_travel_${id}_grammar_${i}`,
        difficulty,
        type: 'short_text',
        ...withCue('Escribe la palabra que falta según el contexto.', sentence),
        skillId: `grammar.${skill}`,
        acceptedAnswers: [answer],
        feedbackEs,
        vocabularyIds: [],
        dimension: 'grammar_production',
        contextualGlosses: names,
        requiredLessonIds: prereqs(throughUnit),
      }),
    ),
  ),
  cloze_battle: scenarios.flatMap(({ id, difficulty, throughUnit, blanks, cloze }) =>
    blanks.map(([sentence, answer, skill, feedbackEs], i): PrivateExercise => ({
      id: `challenge_travel_${id}_cloze_${i}`,
      difficulty,
      type: 'short_text',
      ...withCue(
        `Completa el espacio [${i + 1}]. Lee toda la nota para entender el contexto.`,
        sentence,
      ),
      passage: cloze,
      skillId: `grammar.${skill}`,
      acceptedAnswers: [answer],
      feedbackEs,
      vocabularyIds: [],
      dimension: 'grammar_production',
      contextualGlosses: names,
      requiredLessonIds: prereqs(throughUnit),
    })),
  ),
  reading_quest: scenarios.flatMap(({ id, difficulty, throughUnit, passage, reading }) =>
    reading.map(([promptEs, answer, distractors, feedbackEs], i): PrivateExercise => {
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
        skillId: 'grammar.past_irregular',
        feedbackEs,
        vocabularyIds: [],
        dimension: 'grammar_understanding',
        contextualGlosses: names,
        requiredLessonIds: prereqs(throughUnit),
      };
    }),
  ),
};
