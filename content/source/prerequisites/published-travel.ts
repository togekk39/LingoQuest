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
      vocabulary: ['Hi', 'bus stop', 'next to', 'park'],
      question: ['location', 'bus stop', 'park'],
      practice: ['introduction', 'location', 'Hi', 'bus stop', 'park'],
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
      vocabulary: ['at eight', 'every day', 'on Saturdays'],
      question: ['at eight', 'schedule'],
      practice: ['present', 'questions', 'schedule'],
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
      vocabulary: ['inside', 'text the group'],
      question: ['future', 'inside'],
      practice: ['future', 'text the group'],
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
      vocabulary: ['already', 'just', 'yet'],
      question: ['completion', 'yet'],
      practice: ['completion', 'already', 'just', 'yet'],
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
      vocabulary: ['recommend'],
      question: ['reason'],
      practice: ['description', 'reason', 'recommend'],
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
      vocabulary: [],
      question: ['request'],
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
      vocabulary: ['check in'],
      question: ['verification', 'check in'],
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
      vocabulary: ['turn off the flash'],
      question: ['permission', 'turn off the flash'],
      practice: ['permission', 'preference'],
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
      vocabulary: ['footprints'],
      question: ['footprints'],
      practice: ['attribution', 'proposal'],
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
      vocabulary: ['departure board', 'pull away'],
      question: ['sources', 'departure board'],
      practice: ['sources', 'pull away'],
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
const word = (id: string, lemma: string, senseEs: string): Target => ({
  id: 'home.' + id,
  kind: 'lexical',
  lemma,
  senseEs,
  forms: [lemma],
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
  grammar('subject-be', 'Expresar ubicación o color con un sujeto y una forma de be.'),
  grammar('ownership', 'Indicar que el objeto es propio con my antes del sustantivo.'),
  word('stop', 'bus stop', 'parada del bus'),
  word('park', 'park', 'parque'),
  word('bag', 'bag', 'mochila'),
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
const stop = ref('stop', 'bus stop');
const park = ref('park', 'park');
const bag = ref('bag', 'bag');
const blue = ref('blue', 'blue');
const red = ref('red', 'red');

export const homeTeaching = {
  hello_teach: {
    teaches: [hi, hello, iAm, im, myName, myNames],
    evidence: ['Hi', 'Hello', 'I am', "I'm", 'My name is', "My name's"],
  },
  bus_teach: {
    teaches: [where, next, be, stop, park],
    evidence: ['Where is', 'bus stop', 'next to', 'park', 'It is'],
  },
  bag_teach: { teaches: [bag, my, be, blue, red], evidence: ['my', 'bag', 'is', 'blue', 'red'] },
} satisfies Record<string, { teaches: Reference[]; evidence: string[] }>;

export const homeExercises = {
  travel_hello_recognize: [hi],
  travel_hello_build: [iAm],
  travel_hello_recall: [hi, hello],
  travel_hello_write: [hi, iAm, myName],
  travel_hello_transfer: [iAm, myName],
  hello_speak: [hi, iAm],
  travel_bus_listen: [where, stop],
  travel_bus_direction: [be, next, park],
  travel_bus_dictation: [be, next, park],
  travel_bus_ask: [where, stop],
  travel_bus_transfer: [be, next, park, stop],
  travel_bag_read: [my, bag, blue],
  travel_bag_owner: [my, bag, red],
  travel_bag_write: [be, blue],
  travel_bag_transfer: [be, red],
  bag_speak: [be, red],
} satisfies Record<string, Reference[]>;

export const homeReviewExercises = {
  travel_review_greeting: [hi, hello],
  travel_review_introduction: [iAm, myName],
  travel_remedy_introduction_be: [iAm, myName],
  travel_remedy_introduction_subject: [iAm],
  travel_review_place_question: [where, park],
  travel_review_place_question_audio: [where, stop],
  travel_remedy_place_question_order: [where, park],
  travel_review_place_location: [be, next, stop],
  travel_remedy_place_location_preposition: [next],
  travel_remedy_place_location_order: [be, next, park],
  travel_review_item_owner_read: [my, bag, be, red, blue],
  travel_review_item_owner_write: [my, bag, be, red],
  travel_review_item_color_read: [bag, blue, red],
  travel_review_item_color: [be, red],
  travel_remedy_item_color_be: [be, red],
  travel_review_place_location_audio: [next, park],
} satisfies Record<string, Reference[]>;

export const homeReviewGlosses: Record<string, { target: Reference; text: string }> = {
  travel_review_place_location: { target: bag, text: 'the bag' },
  travel_remedy_place_location_preposition: { target: bag, text: 'the bag' },
  travel_remedy_place_location_order: { target: bag, text: 'the bag' },
};
