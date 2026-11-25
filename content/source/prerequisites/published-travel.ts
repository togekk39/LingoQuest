import type { PrerequisiteFile } from '../../../packages/course-pack/src/prerequisites';

type Target = PrerequisiteFile['targets'][number];
type Reference = { id: string; form?: string };

type ChapterCard = {
  grammar: readonly { id: string; descriptionEs: string; evidence: readonly string[] }[];
  vocabulary: readonly string[];
  question: readonly string[];
  practice: readonly string[];
};

export const travelCards: Record<string, readonly ChapterCard[]> = {
  home: [
    {
      grammar: [
        {
          id: 'introduction',
          descriptionEs: 'Presentarse con I am o My name is y el nombre.',
          evidence: ['I am', 'My name is'],
        },
        {
          id: 'location',
          descriptionEs: 'Preguntar Where is e indicar una ubicación con next to.',
          evidence: ['Where is', 'next to'],
        },
      ],
      vocabulary: ['Hi', 'bus stop', 'next to', 'park', 'Can you help me?'],
      question: ['location', 'bus stop', 'next to', 'park'],
      practice: [
        'introduction',
        'location',
        'Hi',
        'bus stop',
        'next to',
        'park',
        'Can you help me?',
      ],
    },
  ],
  mexico: [
    {
      grammar: [
        {
          id: 'present',
          descriptionEs: 'Presente simple con I go y she goes para hablar de rutinas.',
          evidence: ['I go', 'she goes'],
        },
        {
          id: 'questions',
          descriptionEs: 'Pregunta de rutina con do o does y un verbo base.',
          evidence: ['Do you', 'Does she go'],
        },
        { id: 'schedule', descriptionEs: 'Indicar la hora con at.', evidence: ['at'] },
      ],
      vocabulary: [
        'at eight',
        'every day',
        'on Saturdays',
        'go to the market',
        'buy fruit',
        'buy bread',
        'come with me',
      ],
      question: ['at eight', 'schedule', 'go to the market', 'come with me'],
      practice: [
        'present',
        'questions',
        'schedule',
        'go to the market',
        'buy fruit',
        'buy bread',
        'come with me',
      ],
    },
  ],
  colombia: [
    {
      grammar: [
        {
          id: 'request',
          descriptionEs: 'Pedir algo con I’d like, distinto de I like.',
          evidence: ['I’d like', 'I like'],
        },
        {
          id: 'quantity',
          descriptionEs: 'Indicar una unidad con a o an y una cantidad no especificada con some.',
          evidence: ['a lemonade', 'an egg arepa', 'some water'],
        },
        {
          id: 'availability',
          descriptionEs: 'Preguntar si hay un producto con Do you have.',
          evidence: ['Do you have'],
        },
      ],
      vocabulary: ['egg', 'some water', 'a lemonade', 'to go', 'orange juice'],
      question: ['request', 'quantity', 'egg', 'a lemonade', 'to go'],
      practice: [
        'request',
        'quantity',
        'availability',
        'egg',
        'some water',
        'to go',
        'orange juice',
      ],
    },
  ],
  peru: [
    {
      grammar: [
        {
          id: 'irregular',
          descriptionEs: 'Usar formas irregulares al contar hechos terminados.',
          evidence: ['went', 'bought', 'met', 'saw'],
        },
        {
          id: 'questions',
          descriptionEs: 'Preguntar en pasado con did y la forma base.',
          evidence: ['did'],
        },
      ],
      vocabulary: [
        'first',
        'then',
        'go → went',
        'buy → bought',
        'meet → met',
        'see → saw',
        'yesterday',
        'a fair',
        'arrive',
      ],
      question: ['first', 'then', 'buy → bought', 'meet → met'],
      practice: [
        'irregular',
        'questions',
        'yesterday',
        'go → went',
        'buy → bought',
        'see → saw',
        'a fair',
        'arrive',
      ],
    },
  ],
  brazil: [
    {
      grammar: [
        {
          id: 'progressive',
          descriptionEs: 'Usar am, is o are y -ing para una acción en curso.',
          evidence: ['am', 'is', 'are', '-ing'],
        },
      ],
      vocabulary: [
        'wash the vegetables',
        'stir the soup',
        'cut the bread',
        'put the bowls on the table',
        'then',
      ],
      question: ['progressive', 'wash the vegetables', 'stir the soup', 'cut the bread'],
      practice: [
        'progressive',
        'stir the soup',
        'cut the bread',
        'put the bowls on the table',
        'then',
      ],
    },
  ],
  chile: [
    {
      grammar: [
        {
          id: 'future',
          descriptionEs: 'Distinguir un plan acordado con be going to de una oferta con will.',
          evidence: ['going to', 'I’ll text the group'],
        },
      ],
      vocabulary: ['inside', 'until six', 'text the group', 'library'],
      question: ['future', 'inside', 'until six'],
      practice: ['future', 'text the group', 'library'],
    },
  ],
  miami: [
    {
      grammar: [
        {
          id: 'experience',
          descriptionEs: 'Preguntar por una experiencia sin fecha con Have you ever.',
          evidence: ['Have you ever'],
        },
        {
          id: 'completion',
          descriptionEs: 'Combinar have y participio con already, just o yet según lo ocurrido.',
          evidence: ['participio', 'already', 'just', 'yet'],
        },
      ],
      vocabulary: [
        'already',
        'just',
        'yet',
        'buy → bought → bought',
        'bring → brought → brought',
        'blanket',
      ],
      question: ['completion', 'yet'],
      practice: [
        'completion',
        'already',
        'just',
        'yet',
        'buy → bought → bought',
        'bring → brought → brought',
        'blanket',
      ],
    },
  ],
  'new-york': [
    {
      grammar: [
        {
          id: 'comparison',
          descriptionEs: 'Comparar opciones con -er than y more … than.',
          evidence: ['slower than', 'more accessible than'],
        },
        {
          id: 'reason',
          descriptionEs: 'Explicar el motivo con because y el resultado con so.',
          evidence: ['because', 'so'],
        },
      ],
      vocabulary: ['elevator', 'out of service', 'ramp'],
      question: ['reason', 'elevator', 'out of service', 'ramp'],
      practice: ['comparison', 'reason'],
    },
  ],
  toronto: [
    {
      grammar: [
        {
          id: 'obligation',
          descriptionEs: 'Distinguir obligación con have to de lo opcional con don’t have to.',
          evidence: ['have to', 'don’t have to'],
        },
        {
          id: 'spelling',
          descriptionEs: 'Introducir las letras del apellido antes de deletrearlo.',
          evidence: ['How do you spell your last name?', 'nombra cada letra', 'zee'],
        },
      ],
      vocabulary: [
        'a spot',
        'photo ID',
        'A, B, C, D, E, F, G.',
        'H, I, J, K, L, M, N.',
        'O, P, Q, R, S, T, U.',
        'V, W, X, Y, Z.',
        'space, hyphen, apostrophe',
        'accent mark',
        'N with a tilde',
      ],
      question: ['obligation', 'photo ID'],
      practice: [
        'obligation',
        'spelling',
        'a spot',
        'photo ID',
        'A, B, C, D, E, F, G.',
        'H, I, J, K, L, M, N.',
        'O, P, Q, R, S, T, U.',
        'V, W, X, Y, Z.',
        'space, hyphen, apostrophe',
        'accent mark',
        'N with a tilde',
      ],
    },
  ],
  london: [
    {
      grammar: [
        {
          id: 'condition',
          descriptionEs: 'Usar presente simple en la cláusula de condición futura con if.',
          evidence: ['If I take', 'presente simple'],
        },
      ],
      vocabulary: ['service is suspended', 'exit', 'a fifteen-minute walk'],
      question: ['exit', 'a fifteen-minute walk'],
      practice: ['condition', 'service is suspended'],
    },
  ],
  paris: [
    {
      grammar: [
        {
          id: 'description',
          descriptionEs: 'Especificar qué persona con who o qué cosa con that.',
          evidence: ['artists who', 'art that'],
        },
        {
          id: 'reason',
          descriptionEs: 'Justificar una recomendación con because.',
          evidence: ['because'],
        },
      ],
      vocabulary: ['recommend', 'everyday life', 'art market', 'local artists', 'sculpture'],
      question: ['reason', 'everyday life', 'sculpture'],
      practice: ['description', 'reason', 'recommend', 'art market', 'local artists'],
    },
  ],
  rome: [
    {
      grammar: [
        {
          id: 'interruption',
          descriptionEs:
            'Usar was o were más -ing para una acción interrumpida por un hecho pasado.',
          evidence: ['was', 'were', 'when'],
        },
        {
          id: 'request',
          descriptionEs: 'Hacer una petición cortés con Could you o Would it be possible to.',
          evidence: ['Could you', 'Would it be possible to'],
        },
      ],
      vocabulary: ['repair'],
      question: ['repair'],
      practice: ['interruption', 'request'],
    },
  ],
  cairo: [
    {
      grammar: [
        {
          id: 'exception',
          descriptionEs: 'Indicar una condición con if y una excepción con unless.',
          evidence: ['unless', 'If you'],
        },
        {
          id: 'instruction',
          descriptionEs:
            'Transmitir una instrucción con tell, el destinatario y to seguido del verbo.',
          evidence: ['tell', 'verbo'],
        },
      ],
      vocabulary: ['main entrance', 'ramp'],
      question: ['exception', 'main entrance', 'ramp'],
      practice: ['exception', 'instruction'],
    },
  ],
  singapore: [
    {
      grammar: [
        {
          id: 'duration',
          descriptionEs:
            'Describir un síntoma vigente con since para su comienzo y for para la duración.',
          evidence: ['since', 'for', 'I’ve had', 'I’ve been coughing'],
        },
        {
          id: 'verification',
          descriptionEs: 'Confirmar una indicación con Should I más el verbo.',
          evidence: ['Should I'],
        },
      ],
      vocabulary: ['check in', 'follow-up'],
      question: ['verification', 'check in', 'follow-up'],
      practice: ['duration', 'verification'],
    },
  ],
  tokyo: [
    {
      grammar: [
        {
          id: 'permission',
          descriptionEs: 'Pedir permiso con can, could o may según el registro.',
          evidence: ['Can I', 'Could I', 'May I'],
        },
        {
          id: 'preference',
          descriptionEs: 'Expresar una preferencia con would rather y verbo base.',
          evidence: ['would rather', 'I’d rather wait'],
        },
      ],
      vocabulary: ['turn off the flash', 'workshop'],
      question: ['permission', 'turn off the flash'],
      practice: ['permission', 'preference', 'workshop'],
    },
  ],
  australia: [
    {
      grammar: [
        {
          id: 'possibility',
          descriptionEs: 'Expresar posibilidad con may o could.',
          evidence: ['may', 'could'],
        },
        {
          id: 'concession',
          descriptionEs: 'Reconocer otro factor con although antes de la conclusión.',
          evidence: ['Although'],
        },
      ],
      vocabulary: ['gust', 'sheltered trail', 'postpone'],
      question: ['possibility', 'gust', 'sheltered trail'],
      practice: ['possibility', 'concession', 'postpone'],
    },
  ],
  'new-zealand': [
    {
      grammar: [
        {
          id: 'attribution',
          descriptionEs: 'Atribuir observaciones a una fuente con said o reported.',
          evidence: ['said that', 'reported that'],
        },
        {
          id: 'proposal',
          descriptionEs: 'Proponer una medida tentativa con might help.',
          evidence: ['might help'],
        },
      ],
      vocabulary: ['footprints', 'observe', 'field notes'],
      question: ['footprints', 'observe'],
      practice: ['attribution', 'proposal', 'field notes'],
    },
  ],
  kenya: [
    {
      grammar: [
        {
          id: 'agreement',
          descriptionEs: 'Negociar una condición con provided e indicar un plazo con by.',
          evidence: ['provided', 'by'],
        },
      ],
      vocabulary: ['take over', 'sign-in sheet', 'deadline'],
      question: ['agreement', 'take over', 'sign-in sheet'],
      practice: ['agreement', 'take over', 'sign-in sheet'],
    },
  ],
  'south-africa': [
    {
      grammar: [
        {
          id: 'sources',
          descriptionEs: 'Atribuir información a una fuente y distinguir si sigue sin confirmar.',
          evidence: ['thought', 'said', 'hasn’t been confirmed'],
        },
      ],
      vocabulary: ['departure board', 'pull away', 'next to the dock', 'terminal log'],
      question: ['sources', 'departure board'],
      practice: ['sources', 'pull away', 'next to the dock', 'terminal log'],
    },
  ],
  antarctica: [
    {
      grammar: [
        {
          id: 'protocol',
          descriptionEs: 'Reconocer must como obligación y only after como requisito previo.',
          evidence: ['must', 'only after'],
        },
        {
          id: 'report',
          descriptionEs: 'Distinguir la fuente del dato y la decisión en un informe.',
          evidence: ['The protocol says', 'The field team reports'],
        },
      ],
      vocabulary: ['landing', 'marked route'],
      question: ['protocol', 'landing'],
      practice: ['protocol', 'report', 'landing'],
    },
  ],
};

type ChapterPatterns = {
  readonly question: Readonly<Record<string, readonly string[]>>;
  readonly practice: Readonly<Record<string, readonly string[]>>;
};

export const chapterPatterns: Readonly<Record<string, ChapterPatterns>> = {
  home: {
    question: { location: ['It’s next to'] },
    practice: { introduction: ['I am', 'My name is'], location: ['Where is', 'It’s next to'] },
  },
  mexico: {
    question: { schedule: ['at eight'] },
    practice: {
      present: ['I buy', 'he buys'],
      questions: ['What time do you go?'],
      schedule: ['at'],
    },
  },
  colombia: {
    question: { request: ['I’d like'], quantity: ['an egg arepa'] },
    practice: {
      request: ['I’d like'],
      quantity: ['two egg arepas', 'some water'],
      availability: ['Do you have'],
    },
  },
  peru: { question: {}, practice: { irregular: ['I saw'], questions: ['What time did'] } },
  brazil: {
    question: { progressive: ['I’m washing', 'she’s stirring', 'we’re cutting'] },
    practice: {
      progressive: ['Jo usually sets the table', 'I’m washing', 'she’s stirring', 'we’re cutting'],
    },
  },
  chile: {
    question: { future: ['Let’s meet inside'] },
    practice: {
      future: [
        'We’re going to meet at four',
        'It’s going to rain',
        'Let’s meet inside',
        'I’ll text the group',
      ],
    },
  },
  miami: {
    question: { completion: ['Have you printed them yet?', 'I haven’t printed them yet'] },
    practice: {
      completion: ['I’ve already bought', 'I’ve just packed', 'Have you printed them yet?'],
    },
  },
  'new-york': {
    question: { reason: ['because'] },
    practice: { comparison: ['slower than'], reason: ['It’s slower, so I’ll leave earlier'] },
  },
  toronto: {
    question: { obligation: ['have to'] },
    practice: { obligation: ['have to'], spelling: ['How do you spell your last name?', 'That’s'] },
  },
  london: {
    question: {},
    practice: { condition: ['If I walk, I’ll get there on time', 'when I get there'] },
  },
  paris: {
    question: { reason: ['because'] },
    practice: { description: ['artists who work with wood'], reason: ['I’d recommend'] },
  },
  rome: {
    question: {},
    practice: {
      interruption: ['I was unpacking when water started dripping'],
      request: ['Could you', 'Would it be possible to'],
    },
  },
  cairo: {
    question: { exception: ['If you use the ramp'] },
    practice: {
      exception: ['unless', 'If you use the ramp'],
      instruction: ['Tell the group to wait inside'],
    },
  },
  singapore: {
    question: { verification: ['Should I'] },
    practice: {
      duration: ['since Tuesday', 'for two days', 'I’ve had', 'I’ve been coughing'],
      verification: ['Should I'],
    },
  },
  tokyo: {
    question: { permission: ['Can I'] },
    practice: { permission: ['Can I', 'Could I'], preference: ['I’d rather wait'] },
  },
  australia: {
    question: { possibility: ['may', 'could'] },
    practice: { possibility: ['may', 'could'], concession: ['Although'] },
  },
  'new-zealand': {
    question: {},
    practice: { attribution: ['said that', 'reported that'], proposal: ['might help'] },
  },
  kenya: {
    question: { agreement: ['provided', 'by'] },
    practice: { agreement: ['provided', 'by'] },
  },
  'south-africa': {
    question: { sources: ['hasn’t been confirmed'] },
    practice: { sources: ['hasn’t been confirmed', 'while Sofia said'] },
  },
  antarctica: {
    question: { protocol: ['We must wait until the guide checks the route'] },
    practice: {
      protocol: ['We may land only after the guide checks the route'],
      report: ['The protocol says', 'The field team reports'],
    },
  },
};

export const chapterLexicalForms: Readonly<
  Record<string, Readonly<Record<string, readonly string[]>>>
> = {
  peru: {
    'go → went': ['go', 'went'],
    'buy → bought': ['buy', 'bought'],
    'meet → met': ['meet', 'met'],
    'see → saw': ['see', 'saw'],
  },
  miami: {
    'buy → bought → bought': ['buy', 'bought'],
    'bring → brought → brought': ['bring', 'brought'],
  },
};

const grammar = (id: string, descriptionEs: string): Target => ({
  id: 'home.' + id,
  kind: 'grammar',
  descriptionEs,
});
const expression = (id: string, descriptionEs: string, forms: string[]): Target => ({
  id: 'home.' + id,
  kind: 'pattern',
  descriptionEs,
  forms,
});
const word = (id: string, lemma: string, senseEs: string, forms = [lemma]): Target => ({
  id: 'home.' + id,
  kind: 'lexical',
  lemma,
  senseEs,
  forms,
});

export const homeTargets: Target[] = [
  expression('greeting', 'Saludar a otra persona.', ['Hi', 'Hello']),
  expression('introduce', 'Presentarse con el nombre propio.', [
    'I am',
    "I'm",
    'My name is',
    "My name's",
  ]),
  expression('ask-location', 'Preguntar dónde queda un lugar.', ['Where is']),
  expression('adjacency', 'Indicar posición al lado de otro lugar.', ['next to']),
  expression('statement-be', 'Construir una afirmación con un sujeto y be.', [
    'It is',
    "It's",
    'is',
  ]),
  grammar('intro-agreement', 'Am concuerda con I e is concuerda con My name.'),
  grammar('subject-be', 'Expresar ubicación o color con un sujeto y una forma de be.'),
  grammar('ownership', 'Indicar que el objeto es propio con my antes del sustantivo.'),
  grammar(
    'definite-article',
    'Usar the antes del sustantivo para referirse a un lugar u objeto conocido.',
  ),
  grammar(
    'indefinite-description',
    'Colocar a y el color antes del nombre de un objeto en singular.',
  ),
  word('greeting-word', 'Hi', 'hola como saludo', ['Hi', 'Hello']),
  word('pronoun-i', 'I', 'yo, quien habla'),
  word('ownership-word', 'my', 'mi, de quien habla'),
  word('article-word', 'the', 'el o la cuando la referencia es conocida'),
  word('stop', 'bus stop', 'parada del bus'),
  word('park', 'park', 'parque'),
  word('bag', 'bag', 'mochila'),
  word('backpack', 'backpack', 'mochila de espalda'),
  word('bus', 'bus', 'autobús'),
  word('blue', 'blue', 'azul'),
  word('red', 'red', 'rojo'),
];

const ref = (id: string, form?: string): Reference => ({ id: 'home.' + id, ...(form && { form }) });
const hi = ref('greeting', 'Hi');
const hello = ref('greeting', 'Hello');
const iAm = ref('introduce', 'I am');
const im = ref('introduce', "I'm");
const myName = ref('introduce', 'My name is');
const myNames = ref('introduce', "My name's");
const where = ref('ask-location', 'Where is');
const next = ref('adjacency', 'next to');
const be = ref('subject-be');
const my = ref('ownership');
const agreement = ref('intro-agreement');
const speaker = ref('pronoun-i', 'I');
const hiWord = ref('greeting-word', 'Hi');
const helloWord = ref('greeting-word', 'Hello');
const mine = ref('ownership-word', 'my');
const itIs = ref('statement-be', 'It is');
const its = ref('statement-be', "It's");
const is = ref('statement-be', 'is');
const the = ref('article-word', 'the');
const definite = ref('definite-article');
const aColorObject = ref('indefinite-description');
const stop = ref('stop', 'bus stop');
const park = ref('park', 'park');
const bag = ref('bag', 'bag');
const backpack = ref('backpack', 'backpack');
const bus = ref('bus', 'bus');
const blue = ref('blue', 'blue');
const red = ref('red', 'red');

export const homeTeaching = {
  hello_teach: {
    teaches: [hi, hello, hiWord, helloWord, iAm, im, myName, myNames, agreement, speaker],
    evidence: [
      'Hi y Hello significan «hola»',
      'I am',
      "I'm",
      'My name is',
      "My name's",
      'Con I va am y con My name va is',
    ],
    storyEvidence: [
      'Significa «hola» y lo usamos al saludar',
      'También puedes decir «Hello»',
      '«I’m» es la forma corta',
      '«My name is», que significa «me llamo»',
      'También puedo decir «My name’s»',
      'Con «I» digo «am», y con «My name» digo «is»',
    ],
  },
  bus_teach: {
    teaches: [where, next, be, itIs, its, is, the, definite, stop, park],
    evidence: [
      'Where is',
      'is va antes del lugar',
      'bus stop',
      'parada',
      'next to',
      'junto a',
      'park',
      'parque',
      'It’s es la forma corta de It is',
      'Usa the cuando las dos personas saben de qué lugar hablan',
    ],
  },
  bag_teach: {
    teaches: [
      bag,
      backpack,
      my,
      mine,
      myName,
      be,
      itIs,
      its,
      is,
      the,
      definite,
      aColorObject,
      blue,
      red,
    ],
    evidence: [
      'My name is…» significa «Me llamo…»',
      'nombre de quien escribe',
      'my delante del nombre',
      'My bag es «mi mochila»',
      'Backpack nombra específicamente una mochila',
      'is une la mochila con su color',
      'It is blue o la forma corta It’s blue',
      'the bag («la mochila»)',
      'a blue bag, «una mochila azul»',
      'It’s red describe cualquier objeto rojo',
    ],
  },
} satisfies Record<string, { teaches: Reference[]; evidence: string[]; storyEvidence?: string[] }>;

export const homeExercises = {
  travel_hello_recognize: [hi, hiWord],
  travel_hello_build: [iAm, agreement, speaker],
  travel_hello_recall: [hi, hello, hiWord, helloWord],
  travel_hello_write: [hi, hiWord, iAm, im, myName, myNames, agreement, speaker],
  travel_hello_transfer: [iAm, im, myName, myNames, agreement, speaker],
  hello_speak: [hi, hiWord, iAm, agreement, speaker],
  travel_bus_listen: [where, the, definite, stop],
  travel_bus_direction: [be, its, next, the, definite, park],
  travel_bus_dictation: [be, itIs, its, next, the, definite, park],
  travel_bus_ask: [where, the, definite, stop],
  travel_bus_transfer: [be, is, itIs, next, the, definite, park, stop],
  travel_bag_read: [my, mine, be, is, aColorObject, bag, blue, red],
  travel_bag_owner: [myName, my, mine, be, is, bag, red],
  travel_bag_write: [be, itIs, its, blue],
  travel_bag_transfer: [be, itIs, its, red],
  bag_speak: [be, its, red],
} satisfies Record<string, Reference[]>;

export const homeReviewExercises = {
  travel_review_greeting: [hi, hello, hiWord, helloWord],
  travel_review_introduction: [iAm, myName, agreement, speaker],
  travel_remedy_introduction_be: [iAm, agreement, speaker],
  travel_remedy_introduction_subject: [iAm, agreement, speaker],
  travel_review_place_question: [where, the, definite, park],
  travel_review_place_question_audio: [where, the, definite, stop],
  travel_remedy_place_question_order: [where, the, definite, park],
  travel_review_place_location: [be, is, next, the, definite, stop],
  travel_remedy_place_location_preposition: [be, is, next, the, definite, park],
  travel_remedy_place_location_order: [be, is, next, the, definite, park],
  travel_review_item_owner_read: [my, mine, myName, bag, be, is, red, blue],
  travel_review_item_owner_write: [my, mine, bag, be, is, red],
  travel_review_item_color_read: [bag, be, is, the, definite, blue, red],
  travel_review_item_color: [be, is, the, definite, red],
  travel_remedy_item_color_be: [be, is, the, definite, bag, red],
  travel_review_place_location_audio: [be, its, next, the, definite, park],
} satisfies Record<string, Reference[]>;

export const homeReviewGlosses: Record<string, { target: Reference; text: string }> = {
  travel_review_place_location: { target: bag, text: 'the bag' },
  travel_remedy_place_location_preposition: { target: bag, text: 'the bag' },
  travel_remedy_place_location_order: { target: bag, text: 'the bag' },
  travel_review_item_color_read: { target: bus, text: '«Bus» significa «autobús»' },
  travel_review_item_color: { target: bus, text: '«bus» significa «autobús»' },
};

export const homeLocalTeaching = {
  luz: { teaches: [iAm, agreement, speaker], evidence: ['I am Luz', 'Con «I» va «am»'] },
  starter: { teaches: [hi, hello, hiWord, helloWord], evidence: ['Hi', 'Hello', 'hola'] },
};
