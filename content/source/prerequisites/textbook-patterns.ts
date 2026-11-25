type Pattern = readonly [id: string, form: string, example: string];
type LessonPatterns = { patterns: readonly Pattern[] };

export const textbookPatterns: Record<string, LessonPatterns> = {
  u01_l01: {
    patterns: [
      ['first', 'I + am + nombre', 'I am Ana.'],
      ['second', 'you + are + información', 'You are my friend.'],
      ['name', 'saludo + I am / I’m / My name is + nombre', "Hi, I'm Luis."],
    ],
  },
  u01_l02: {
    patterns: [['identity', 'he / she + is + identidad u ocupación', 'She is my sister.']],
  },
  u01_l03: {
    patterns: [
      ['singular', 'it + is + descripción singular', 'It is a good book.'],
      ['plural', 'they + are + adjetivo', 'They are happy.'],
    ],
  },
  u01_l04: {
    patterns: [
      ['where', 'Where + are + you + from?', 'Where are you from?'],
      ['yes-no', 'Are + you + ocupación?', 'Are you a student?'],
      ['origin', 'I am from + lugar', 'I am from'],
    ],
  },
  u02_l01: {
    patterns: [['habit', 'I / you + verbo base + complemento', 'I study English every day.']],
  },
  u02_l02: {
    patterns: [['habit', 'he / she + verbo con -s o -ies', 'He studies English at home.']],
  },
  u02_l03: {
    patterns: [
      ['frequency', 'sujeto + adverbio de frecuencia + verbo', 'She always drinks water.'],
      ['front', 'Usually + sujeto + verbo', 'Usually she eats at home.'],
    ],
  },
  u02_l04: {
    patterns: [
      ['clock', 'actividad + at + hora', 'I get up at six.'],
      ['front-clock', 'at + hora + actividad', 'At noon, I eat.'],
    ],
  },
  u03_l01: {
    patterns: [
      ['question', 'Do / Does + sujeto + verbo base?', 'Does she like tea?'],
      ['you', 'Do you like + objeto?', 'Do you like coffee?'],
    ],
  },
  u03_l02: {
    patterns: [
      ['negative', 'sujeto + do / does + not + verbo base', 'She does not drink milk.'],
      ['order', 'I’d like + bebida + please', "I'd like tea, please."],
    ],
  },
  u03_l03: {
    patterns: [
      ['request', 'Can you + verbo base (+ please)?', 'Can you help me, please?'],
      ['ability', 'sujeto + can + verbo base', 'I can help.'],
    ],
  },
  u03_l04: {
    patterns: [
      ['exists', 'There is + lugar singular + ubicación', 'There is a park near my house.'],
      ['question', 'Is there + lugar singular?', 'Is there a bank here?'],
      ['directions', 'Turn / go + dirección', 'Turn left.'],
    ],
  },
  u04_l01: {
    patterns: [['past', 'sujeto + was / were + lugar o estado', 'They were tired last night.']],
  },
  u04_l02: {
    patterns: [
      ['past', 'sujeto + verbo regular en -ed + complemento', 'I cleaned my room yesterday.'],
    ],
  },
  u04_l03: {
    patterns: [
      ['past', 'sujeto + pasado irregular + complemento', 'I went to the market yesterday.'],
    ],
  },
  u04_l04: {
    patterns: [
      ['question', 'Did + sujeto + verbo base?', 'Did you watch a movie last weekend?'],
      ['negative', 'sujeto + did not + verbo base', 'I did not go to work.'],
    ],
  },
  u05_l01: {
    patterns: [
      ['current', 'I + am + verbo en -ing (+ now)', "I'm learning English now."],
      ['habit', 'I + verbo base + every day', 'I study every day.'],
    ],
  },
  u05_l02: {
    patterns: [
      ['singular', 'he / she + is + verbo en -ing', 'She is making a salad.'],
      ['plural', 'they + are + verbo en -ing', 'They are eating dinner.'],
    ],
  },
  u05_l03: {
    patterns: [['negative', 'sujeto + be + not + verbo en -ing', 'I am not working now.']],
  },
  u05_l04: {
    patterns: [
      ['what', 'What + be + sujeto + verbo en -ing?', 'What are you doing?'],
      ['yes-no', 'Be + sujeto + verbo en -ing?', 'Is she talking to your brother?'],
    ],
  },
  u06_l01: {
    patterns: [['plan', 'sujeto + be going to + verbo base', 'She is going to travel next week.']],
  },
  u06_l02: {
    patterns: [
      ['when', 'When + be + sujeto + going to + verbo base?', 'When are we going to meet?'],
      ['yes-no', 'Be + sujeto + going to + verbo base?', 'Are you going to travel by bus?'],
    ],
  },
  u06_l03: {
    patterns: [['offer', 'sujeto + will + verbo base', "I'll carry your bag."]],
  },
  u06_l04: {
    patterns: [
      ['negative', 'sujeto + will not / won’t + verbo base', 'I will not cancel the trip.'],
    ],
  },
  u07_l01: {
    patterns: [
      ['experience', 'sujeto + have / has + participio', 'She has been to the beach twice.'],
    ],
  },
  u07_l02: {
    patterns: [
      [
        'experience',
        'Have / Has + sujeto + ever + participio?',
        'Have you ever traveled by train?',
      ],
      ['reply', 'Yes / No + sujeto + have / haven’t', "No, I haven't."],
    ],
  },
  u07_l03: {
    patterns: [
      [
        'negative',
        'sujeto + have / has + not + participio con yet',
        "I haven't bought my ticket yet.",
      ],
    ],
  },
  u07_l04: {
    patterns: [
      ['dated', 'sujeto + pasado simple + tiempo terminado', 'I went to the beach last year.'],
      ['experience', 'sujeto + have + participio + lugar', "I've been to this restaurant."],
    ],
  },
  u08_l01: {
    patterns: [
      ['request', 'I would like / I’d like + objeto (+ please)', "I'd like the check, please."],
    ],
  },
  u08_l02: {
    patterns: [
      [
        'route',
        'verbo base + dirección y punto de referencia',
        'Go straight. Then turn left at the corner.',
      ],
    ],
  },
  u08_l03: {
    patterns: [
      [
        'compare',
        'sujeto + be + comparativo en -er + than + referencia',
        'This bus is slower than that train.',
      ],
    ],
  },
  u08_l04: {
    patterns: [
      ['reason', 'idea + because + razón', 'I study English because I want to learn.'],
      [
        'front-reason',
        'Because + razón, + idea',
        "Because I want to help customers, I'd like this job.",
      ],
    ],
  },
};
