import {
  coreWord,
  hear,
  mission,
  pair,
  read,
  rule,
  say,
  spell,
  teach,
  word,
  write,
  type Word,
} from './home-foundation-prerequisites';
import { numberLearningId, travelNumberWords } from './travel-number-words';

const plaza = 'La plaza';
const registry = 'Mesa de registro';
const station = 'La parada';
const greetObjective = 'lq-home-start.greet';
const spellObjective = 'lq-home-start.spell';
const nameObjective = 'lq-home-start.name';
const repairObjective = 'lq-home-start.repair';

export const hi = coreWord('Hi', 'hola al saludar', 'home.greeting-word');
export const hello = coreWord('Hello', 'hola al saludar', 'home.greeting-word');
const goodbye = word('Goodbye', 'adiós al despedirte');
const bye = word('Bye', 'adiós en una despedida informal');
const please = coreWord('Please', 'por favor', 'lex.u03_l03_v04');
const thanks = word('Thank you', 'gracias');
const excuse = word('Excuse me', 'disculpa, para llamar la atención con cortesía');
const nameQuestion = word("What's your name?", '¿Cómo te llamas?');
const nameFrame = rule(
  'grammar.home.name-frame',
  'Presentarte con tu propio nombre',
  pair('My name is Luz.', 'Me llamo Luz.'),
);
export const myName = coreWord('My name is', 'me llamo', 'home.introduce');
const myNameShort = coreWord("My name's", 'me llamo, con la forma breve', 'home.introduce');
const iAm = coreWord('I am', 'soy, cuando te presentas', 'home.introduce');
const iAmShort = coreWord("I'm", 'soy, con la forma breve', 'home.introduce');
const spellQuestion = word(
  'How do you spell your name?',
  '¿Cómo se escribe tu nombre, letra por letra?',
);
const spellPlease = word('Can you spell that, please?', '¿Puedes deletrear eso, por favor?');
const name = word('name', 'nombre propio');
const my = coreWord('my', 'mi, de quien habla', 'home.ownership-word');
const is = word('is', 'es o está');
const alphabetOrder = rule(
  'grammar.home.letter-order',
  'Decir o escribir las letras de un nombre en orden',
  pair('L – U – Z.', 'L, U y Z, en ese orden.'),
);

const letter = (en: string) =>
  word(
    en,
    `letra ${en} (mayúscula), ${en.toLowerCase()} (minúscula)`,
    `lex.letter.${en.toLowerCase()}`,
  );
const letters = new Map('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((en) => [en, letter(en)]));
const alphabet = (forms: string) => forms.split('').map((en) => letters.get(en)!);
const zed = word('Zed', 'nombre de Z en otras regiones, como Reino Unido', 'lex.letter.z');
const alphabetSets = [
  {
    id: 'a',
    group: 'AEIHYW',
    title: 'Tu gafete: A, E, I, H, Y, W',
    text: 'El gafete trae la misma letra grande y pequeña. E y e son la letra E. En español y en inglés escribimos estas letras, pero sus nombres pueden sonar distinto. Reproduce A, E e I por separado. Luego compara H, Y y W. Una letra tiene un nombre para deletrear y puede producir otros sonidos al aparecer en una palabra.',
    correct: 'E',
    options: ['I', 'E', 'A'],
    feedback:
      'Oíste la letra E. Vuelve a comparar los audios de E e I. Di el nombre de la letra como en el modelo.',
  },
  {
    id: 'b',
    group: 'BVGJPTZ',
    title: 'La lista de Sam: B, V, G, J, P, T, Z',
    text: 'Sam ordena unos gafetes. Fíjate en el comienzo del nombre al comparar B con V y G con J. E, G, P, T, V y Z comparten un final parecido en inglés estadounidense. En Estados Unidos, Z se llama zee. En algunos lugares, como Reino Unido, se llama zed. Aquí vas a oír zee para Z.',
    correct: 'V',
    options: ['B', 'V', 'P'],
    feedback:
      'Oíste V. El nombre de V empieza con el aire pasando entre los dientes superiores y el labio inferior. B empieza con los labios juntos.',
  },
  {
    id: 'c',
    group: 'CDFKQUX',
    title: 'Tarjetas para un viaje: C, D, F, K, Q, U, X',
    text: 'Cada tarjeta tiene dos formas de la misma letra. Escucha las parejas C / D y Q / U. Q y U se parecen al final, pero el nombre de Q empieza con un sonido de k.',
    correct: 'Q',
    options: ['U', 'Q', 'K'],
    feedback: 'Oíste Q. Compara Q con U y escucha el comienzo de Q.',
  },
  {
    id: 'd',
    group: 'LMNORS',
    title: 'El buzón de Luz: L, M, N, O, R, S',
    text: 'Luz revisa iniciales en el buzón. Escucha M y N. Los nombres empiezan igual. Para terminar M se cierran los labios. Para terminar N la lengua se acerca a la parte de arriba de la boca. Mira también cómo se escriben L, O, R y S en grande y pequeño.',
    correct: 'M',
    options: ['N', 'L', 'M'],
    feedback: 'Oíste M. Sus labios se juntan al final. Escucha M y N de nuevo antes de seguir.',
  },
] as const;

const alphabetMissions = alphabetSets.map(
  ({ id, group, title, text, correct, options, feedback }) => {
    const forms = alphabet(group);
    const target = letters.get(correct)!;
    return mission(
      `foundation-letters-${id}`,
      spellObjective,
      title,
      registry,
      'Reconoce el nombre de una letra y ubícala en mayúscula o minúscula.',
      target,
      [
        teach(
          `foundation-letters-${id}-teach`,
          'Luz',
          title,
          text,
          id === 'b' ? [...forms, zed] : forms,
        ),
        hear(
          {
            id: `foundation-letters-${id}-listen`,
            target,
            requires: alphabet(options.join('')),
            contextId: `home-letter-cards-${id}`,
            situation: 'Luz dicta la letra de una tarjeta de registro.',
            promptEs: 'Escucha y elige la letra que dijo Luz.',
            feedbackEs: feedback,
          },
          correct,
          options.map((form) => [form.toLowerCase(), form.toLowerCase()]),
          correct.toLowerCase(),
        ),
      ],
    );
  },
);

const nameWords = [
  nameQuestion,
  myName,
  myNameShort,
  iAm,
  iAmShort,
  spellQuestion,
  spellPlease,
  my,
  name,
  is,
];
const spellingLetters = alphabet('LUZ');
const names = mission(
  'foundation-names',
  nameObjective,
  'El registro de tu nombre',
  registry,
  'Intercambia tu nombre y practica cómo deletrearlo.',
  nameQuestion,
  [
    teach(
      'foundation-names-teach',
      'Sam',
      '¿Cómo te llamas?',
      'My name is e I am son dos formas de presentarte. El nombre va al final. I significa «yo» y my señala «mi». Para pedir el nombre o su escritura, aprende cada pregunta como una expresión fija.',
      nameWords,
      [pair('My name is Sam.', 'Me llamo Sam.'), pair("I'm Luz.", 'Soy Luz.')],
      [nameFrame],
    ),
    read(
      {
        id: 'foundation-names-read',
        target: myName,
        requires: [nameFrame, my, name, is],
        contextId: 'home-registration-slip',
        situation: 'El gafete de una visitante está en la mesa.',
        promptEs: '¿Cómo se llama la visitante?',
        feedbackEs: 'El nombre va después de My name is. En este gafete es Ana.',
      },
      'My name is Ana.',
      [
        ['ana', 'Ana'],
        ['sam', 'Sam'],
        ['luz', 'Luz'],
      ],
      'ana',
    ),
    teach(
      'foundation-names-spell-teach',
      'Luz',
      'Una letra a la vez',
      'Cada nombre tiene su propio orden de letras. Para deletrear mi nombre, digo L, U y Z, sin leerlo como una palabra. Para un apellido compuesto, conserva el orden de las dos partes. Mantén los acentos, espacios o guiones de tu nombre al escribirlo. En voz alta puedes indicar una pausa o señalar el guion.',
      spellingLetters,
      [pair('L – U – Z.', 'Ele, u y zeta, dichas con sus nombres en inglés.')],
      [alphabetOrder],
    ),
    hear(
      {
        id: 'foundation-names-order-listen',
        target: alphabetOrder,
        requires: spellingLetters,
        guided: true,
        contextId: 'home-nametag-luz',
        situation: 'Luz revisa que su gafete tenga las letras en orden.',
        promptEs: '¿En qué orden dice las letras de su nombre?',
        feedbackEs: 'Luz dice L, U y Z, en ese orden. Escucha el nombre de cada letra.',
      },
      'L – U – Z.',
      [
        ['luz', 'L · U · Z'],
        ['zul', 'Z · U · L'],
        ['lzu', 'L · Z · U'],
      ],
      'luz',
    ),
    {
      ...write(
        {
          id: 'foundation-names-letters-write',
          target: alphabetOrder,
          requires: spellingLetters,
          contextId: 'home-registration-file-code',
          situation: 'La mesa te dicta tres letras de un código de registro.',
          promptEs:
            'Escucha y escribe las tres letras en el orden que oigas. Puedes separarlas con espacios.',
          feedbackEs: 'El código comienza con U, después viene L y termina con Z.',
          errors: ['letter_order'],
          errorAnswers: { letter_order: ['L U Z', 'LUZ', 'L Z U', 'LZU', 'U Z L', 'UZL'] },
        },
        ['U L Z', 'ULZ', 'U-L-Z', 'U, L, Z'],
      ),
      audio: 'U – L – Z.',
      transcript: 'U – L – Z.',
    },
    spell({
      id: 'foundation-names-spell',
      target: alphabetOrder,
      requires: [spellQuestion, spellPlease],
      guided: true,
      errors: ['letter_order'],
      contextId: 'home-registration-your-name',
      situation: 'Sam prepara un gafete para ti.',
      promptEs:
        'Escribe el nombre que quieres usar. Luego escribe sus letras en orden. Puedes usar tu propio nombre o inventar uno.',
      feedbackEs:
        'Escribe las letras en el mismo orden que en el nombre elegido. Puedes separarlas con espacios o mantener la escritura habitual de tu nombre.',
    }),
    say(
      'foundation-names-say',
      nameFrame,
      'home-registration-spoken',
      'My name is Luz.',
      'Di My name is y tu propio nombre o el que elegiste. Deletrea tu nombre. Si quieres, graba y escucha si las letras siguen el orden esperado. El audio de Luz sirve de referencia para la presentación.',
    ),
  ],
);

const numbers = new Map(
  travelNumberWords.map(
    ([number, en, es]) =>
      [number, { ...word(en, es, numberLearningId(number)), es: `${number} · ${es}` }] as [
        number,
        Word,
      ],
  ),
);
export const number = (value: number) => numbers.get(value)!;
const numberRange = (start: number, end: number) =>
  [...numbers].filter(([value]) => value >= start && value <= end).map(([, form]) => form);

const phoneReading = rule(
  'grammar.home.phone-digits',
  'Leer un código o teléfono cifra por cifra',
  pair('Five, zero, eight.', 'Cinco, cero, ocho, como cifras separadas.'),
);
const numberLabel = word('Number', 'número, antes del dato solicitado');
const ohDigit = word('oh', 'cero al decir cifras de un teléfono o código', 'lex.number.zero.code');
const digits = mission(
  'foundation-digits',
  spellObjective,
  'Los números de tu boleto',
  station,
  'Entiende los números del cero al diez y comprueba un código de viaje.',
  number(8),
  [
    teach(
      'foundation-digits-small-teach',
      'Sam',
      'Primeros números: 0–5',
      'Cada número tiene un nombre en inglés. Escucha los nombres y mira las cifras. Para contar cosas, un grupo de tres se dice three. Para un código se lee cada cifra por separado.',
      numberRange(0, 5),
      [pair('Two bags.', 'Dos mochilas.'), pair('Three books.', 'Tres libros.')],
    ),
    hear(
      {
        id: 'foundation-digits-quantity',
        target: number(2),
        requires: [],
        contextId: 'home-bag-count',
        situation: 'Hay que contar el equipaje antes de viajar.',
        promptEs: 'Escucha la cantidad. ¿Cuántas mochilas hay?',
        feedbackEs: 'Two es dos. Sam está contando dos mochilas.',
      },
      'Two',
      [
        ['1', '1'],
        ['2', '2'],
        ['3', '3'],
      ],
      '2',
    ),
    teach(
      'foundation-digits-teach',
      'Sam',
      'Números del 6 al 10',
      'En el boleto, el número identifica el bus. Cuando hay dos cifras, un número de ruta se puede decir de corrido, por ejemplo ten para 10. Un número de teléfono se suele leer cifra por cifra. Para el cero puedes oír zero u oh en un teléfono.',
      [...numberRange(6, 10), numberLabel, ohDigit],
      [
        pair('Number six.', 'Número seis.'),
        pair('Five, zero, eight.', 'Cinco, cero, ocho, como cifras de teléfono.'),
        pair('Five, oh, eight.', 'Cinco, cero, ocho, otra lectura del mismo código.'),
      ],
      [phoneReading],
    ),
    hear(
      {
        id: 'foundation-digits-listen',
        target: number(8),
        requires: [],
        contextId: 'home-bus-ticket',
        situation: 'Sam dice el número del bus que van a tomar.',
        promptEs: 'Escucha y selecciona el número del bus.',
        feedbackEs: 'El boleto es para el bus 8. Eight significa ocho. Nine significa nueve.',
        errors: ['vocabulary_sense'],
      },
      'Eight',
      [
        ['9', '9'],
        ['8', '8'],
        ['6', '6'],
      ],
      '8',
    ),
    hear(
      {
        id: 'foundation-digits-phone',
        target: phoneReading,
        requires: [number(5), ohDigit, number(8)],
        contextId: 'home-contact-number',
        situation: 'Luz lee las últimas tres cifras de un teléfono.',
        promptEs: '¿Qué tres cifras dice Luz?',
        feedbackEs: 'Five es 5, oh representa el 0 aquí y eight es 8. Conserva el orden.',
      },
      'Five, oh, eight.',
      [
        ['580', '580'],
        ['508', '508'],
        ['058', '058'],
      ],
      '508',
    ),
  ],
);

const age = word('years old', 'de edad');
const seat = word('seat', 'asiento');
const teens = mission(
  'foundation-teens',
  spellObjective,
  'Edades y asientos: 11–19',
  station,
  'Escucha números del once al diecinueve en el bus y al hablar de una edad.',
  number(13),
  [
    teach(
      'foundation-teens-start-teach',
      'Luz',
      'Edades y asientos del 11 al 15',
      'Eleven y twelve tienen formas propias. Del 13 al 19 los nombres terminan en -teen. En los números sueltos esa última parte suele recibir más fuerza. En un boleto, seat quiere decir «asiento». Para la edad, years old señala cuántos años tiene alguien.',
      [...numberRange(11, 15), seat, age],
      [
        pair('Seat thirteen.', 'Asiento trece.'),
        pair('Fifteen years old.', 'Quince años de edad.'),
      ],
    ),
    hear(
      {
        id: 'foundation-teens-listen',
        target: number(13),
        requires: [seat],
        contextId: 'home-seat-assignment',
        situation: 'Luz lee el asiento que aparece en un boleto.',
        promptEs: '¿Qué asiento indicó Luz?',
        feedbackEs: 'Oíste thirteen, trece. Escucha la última parte, -teen.',
      },
      'Seat thirteen.',
      [
        ['12', '12'],
        ['13', '13'],
        ['15', '15'],
      ],
      '13',
    ),
    teach(
      'foundation-teens-later-teach',
      'Luz',
      'Cuatro números más: 16–19',
      'Escucha y compara los cuatro números. Presta atención al comienzo, porque todos terminan en -teen. En una frase, el ritmo puede mover la fuerza hacia el principio del número.',
      numberRange(16, 19),
    ),
    hear(
      {
        id: 'foundation-teens-age',
        target: number(17),
        requires: [age],
        contextId: 'home-volunteer-age',
        situation: 'En el registro aparece la edad de una voluntaria.',
        promptEs: 'Escucha y elige la edad.',
        feedbackEs: 'Seventeen significa diecisiete. Sixteen sería dieciséis.',
      },
      'Seventeen years old.',
      [
        ['16', '16'],
        ['17', '17'],
        ['19', '19'],
      ],
      '17',
    ),
  ],
);

const compoundNumber = rule(
  'grammar.number.tens-unit',
  'Formar 21–99 con decena y unidad',
  pair('Twenty-one.', 'Veintiuno.'),
);
const clockReading = rule(
  'grammar.home.hour-minutes',
  'Leer la hora con hora y minutos en orden',
  pair('Eight thirty.', 'Ocho y media.'),
);
const dollars = word('dollars', 'dólares al leer un precio');
const tens = mission(
  'foundation-tens',
  spellObjective,
  'Precios, cuartos y horas: 20–100',
  station,
  'Combina decenas y unidades. Distingue una cantidad, un número de cuarto y una hora.',
  number(30),
  [
    teach(
      'foundation-tens-first-teach',
      'Sam',
      'Las decenas: 20, 30, 40 y 50',
      'Escucha las decenas. En thirty y fifty la fuerza cae al principio. Al decir thirteen o fifteen por separado suele caer al final. Forty se escribe sin la u de four. Usa primero la decena y después la unidad para formar 21–99. Por escrito, únelas con un guion.',
      [
        number(20),
        number(30),
        number(40),
        number(50),
        number(13),
        number(15),
        number(1),
        number(2),
      ],
      [
        pair('Twenty-one.', '21, veintiuno.'),
        pair('Thirty-two.', '32, treinta y dos.'),
        pair('Fifteen, fifty.', '15, 50.'),
        pair('Thirteen, thirty.', '13, 30.'),
      ],
      [compoundNumber],
    ),
    hear(
      {
        id: 'foundation-tens-listen',
        target: number(30),
        requires: [],
        contextId: 'home-room-number',
        situation: 'El registro tiene dos cuartos con números que suenan parecido.',
        promptEs: 'Escucha el número de cuarto y elige la cifra correcta.',
        feedbackEs: 'Thirty es treinta y la primera sílaba lleva la fuerza. Thirteen es trece.',
        errors: ['vocabulary_sense'],
      },
      'Thirty',
      [
        ['13', '13'],
        ['30', '30'],
        ['40', '40'],
      ],
      '30',
    ),
    teach(
      'foundation-tens-later-teach',
      'Sam',
      '60, 70, 80, 90 y 100',
      'Aplica la misma combinación a las demás decenas: 62 es sixty-two. Para 100, di one hundred o a hundred. En un precio, agrega la moneda después del número. Para una hora con minutos, di primero la hora y luego los minutos. En un código, cada cifra se puede decir por separado.',
      [...numberRange(60, 100), number(8), dollars],
      [
        pair('Sixty-one dollars.', 'Sesenta y un dólares.'),
        pair('Seventy-eight.', 'Setenta y ocho.'),
        pair('Eighty-one.', 'Ochenta y uno.'),
        pair('Ninety-two.', 'Noventa y dos.'),
        pair('A hundred.', 'Cien.'),
        pair('Eight fifty.', 'Ocho y cincuenta.'),
        pair('Eight, three, zero.', 'Cifras de un código 830.'),
      ],
      [compoundNumber, clockReading],
    ),
    hear(
      {
        id: 'foundation-tens-price',
        target: compoundNumber,
        requires: [number(60), number(2), dollars],
        contextId: 'home-market-price',
        situation: 'Sam pregunta cuánto cuesta una mochila.',
        promptEs: '¿Qué precio escuchaste?',
        feedbackEs: 'Sixty-two combina sixty (60) y two (2). El precio es 62 dólares.',
      },
      'Sixty-two dollars.',
      [
        ['26', '26 dólares'],
        ['60', '60 dólares'],
        ['62', '62 dólares'],
      ],
      '62',
    ),
    hear(
      {
        id: 'foundation-tens-clock',
        target: clockReading,
        requires: [number(8), number(30)],
        contextId: 'home-departure-time',
        situation: 'El bus tiene una hora de salida.',
        promptEs: '¿A qué hora sale?',
        feedbackEs: 'Eight thirty es 8:30. Primero oyes la hora y luego los minutos.',
      },
      'Eight thirty.',
      [
        ['830', '8:30'],
        ['813', '8:13'],
        ['803', '8:03'],
      ],
      '830',
    ),
  ],
);

const greeting = mission(
  'foundation-greetings',
  greetObjective,
  'Saluda a Sam y a Luz',
  plaza,
  'Saluda y despídete en un intercambio corto.',
  hi,
  [
    teach(
      'foundation-greetings-teach',
      'Sam',
      'Al llegar y al despedirte',
      'Al llegar puedes decir Hi o Hello. Al irte, usa Goodbye o Bye. Please y Thank you son expresiones fijas para pedir algo con cortesía y agradecer. Excuse me te ayuda a llamar la atención de alguien. En hi y hello deja salir un poco de aire al comienzo.',
      [hi, hello, goodbye, bye, please, thanks, excuse],
      [pair('Hi, Luz!', '¡Hola, Luz!'), pair('Goodbye, Sam.', 'Adiós, Sam.')],
    ),
    hear(
      {
        id: 'foundation-greetings-listen',
        target: hi,
        requires: [],
        contextId: 'home-plaza-welcome',
        situation: 'Sam te encuentra en la plaza.',
        promptEs: 'Escucha. ¿Qué hace Sam?',
        feedbackEs: 'Hi es un saludo al llegar. Para despedirte puedes decir Goodbye.',
      },
      'Hi',
      [
        ['bye', 'Se despide'],
        ['hi', 'Saluda'],
        ['thanks', 'Da las gracias'],
      ],
      'hi',
    ),
    read(
      {
        id: 'foundation-greetings-read',
        target: hi,
        requires: [hello],
        contextId: 'home-plaza-greeting-sign',
        situation: 'Luz deja una nota para quien llega a la plaza.',
        promptEs: '¿La nota saluda o se despide?',
        feedbackEs: 'Hello es un saludo. Goodbye o Bye se usan al despedirse.',
      },
      'Hello!',
      [
        ['hi', 'Saluda'],
        ['bye', 'Se despide'],
      ],
      'hi',
    ),
    write(
      {
        id: 'foundation-greetings-write',
        target: goodbye,
        requires: [bye],
        contextId: 'home-registration-postcard',
        situation: 'Dejas un mensaje breve al terminar un intercambio en la mesa de registro.',
        promptEs: 'Escribe una despedida corta para Sam.',
        feedbackEs: 'Goodbye y Bye sirven para despedirte. Hi y Hello son para saludar.',
      },
      ['Goodbye', 'Bye', 'Goodbye, Sam.', 'Bye, Sam.'],
    ),
    say(
      'foundation-greetings-say',
      hi,
      'home-greet-playback',
      'Hi, Luz! Goodbye, Sam.',
      'Imagina que ves a Luz y luego te despides de Sam. Saluda y despídete en voz alta. Puedes grabarte y comparar el comienzo de Hi y el ritmo de cada turno.',
    ),
  ],
);

const instructionWords = [
  word('Listen', 'escucha'),
  word('Look', 'mira'),
  word('Read', 'lee'),
  word('Write', 'escribe'),
  word('Repeat', 'repite'),
  word('Open', 'abre', 'lex.home.open-action'),
  word('Close', 'cierra', 'lex.home.close-action'),
  word('Choose', 'elige'),
];
const [listen, look, listenRead, listenWrite, repeat, open, close, choose] = instructionWords;
const mean = word('What does that mean?', '¿Qué significa eso?');
const repeatPlease = word('Can you repeat that, please?', '¿Puedes repetir eso, por favor?');
const slow = word('Can you speak more slowly, please?', '¿Puedes hablar más despacio, por favor?');
const understand = word("I don't understand.", 'No entiendo.');
const inEnglish = word('How do you say this in English?', '¿Cómo se dice esto en inglés?');
const again = word('Again, please.', 'Otra vez, por favor.');
const slowly = word('Slowly, please.', 'Despacio, por favor.');
export const yes = coreWord('Yes', 'sí, para confirmar', 'lex.u01_l04_v05');
export const no = coreWord('No', 'no, para corregir un dato', 'lex.u01_l04_v06');
const couldRepeat = word('Could you repeat that, please?', '¿Podrías repetir eso, por favor?');
const pleaseRepeat = word('Please repeat that.', 'Por favor, repite eso.');

const instructions = mission(
  'foundation-repair',
  repairObjective,
  'Pide ayuda cuando un mensaje no esté claro',
  station,
  'Entiende indicaciones cortas y pide que repitan, hablen más despacio o aclaren un mensaje.',
  repeatPlease,
  [
    teach(
      'foundation-repair-instructions-teach',
      'Luz',
      'Indicaciones para la mesa de boletos',
      'Primero mira qué acción te pide Luz. Reproduce las palabras en inglés para recordarlas. En una indicación directa, la acción aparece al comienzo: Listen, Read, Choose.',
      [listen, look, listenRead, listenWrite],
    ),
    teach(
      'foundation-repair-instructions-more-teach',
      'Luz',
      'Cuatro acciones más',
      'Al revisar un boleto, Repeat pide repetir, Open pide abrir, Close pide cerrar y Choose pide elegir. Usa la traducción y el modelo de audio para practicarlas.',
      [repeat, open, close, choose],
    ),
    hear(
      {
        id: 'foundation-repair-command',
        target: listenRead,
        requires: [],
        contextId: 'home-ticket-desk-actions',
        situation: 'Luz te pide una acción con el boleto.',
        promptEs: 'Escucha. ¿Qué quiere que hagas?',
        feedbackEs: 'Read significa «lee». Escucha Read y Write para distinguir cuál es cuál.',
      },
      'Read',
      [
        ['listen', 'Escuchar'],
        ['read', 'Leer'],
        ['write', 'Escribir'],
      ],
      'read',
    ),
    teach(
      'foundation-repair-teach',
      'Sam',
      'Si necesitas oírlo otra vez',
      'Aprende las preguntas completas como expresiones fijas. Usa Can you repeat that, please? cuando el sonido se te pasó. Usa Can you speak more slowly, please? cuando lo oíste pero fue muy rápido. Para confirmar un dato, puedes responder Yes o No.',
      [understand, repeatPlease, slow, again, slowly, yes, no, couldRepeat, pleaseRepeat],
    ),
    teach(
      'foundation-repair-meaning-teach',
      'Luz',
      'Si una palabra no se entiende',
      'Puedes oír todas las palabras y aun así desconocer el significado. Usa What does that mean? Si conoces una palabra en español y quieres aprenderla en inglés, usa How do you say this in English? Ambas son expresiones fijas.',
      [mean, inEnglish],
    ),
    read(
      {
        id: 'foundation-repair-meaning',
        target: mean,
        requires: [repeatPlease, slow],
        contextId: 'home-ticket-clarification',
        situation:
          'Luz dijo una palabra que escuchaste con claridad y quieres saber su significado.',
        promptEs: 'Lee las tres frases y elige la que pregunta por el significado.',
        feedbackEs:
          'What does that mean? pregunta «¿Qué significa eso?». Repeat pide que lo vuelvan a decir y more slowly pide bajar la velocidad.',
      },
      'What does that mean?\nCan you repeat that, please?\nCan you speak more slowly, please?',
      [
        ['repeat', 'La segunda'],
        ['slow', 'La tercera'],
        ['mean', 'La primera'],
      ],
      'mean',
    ),
    write(
      {
        id: 'foundation-repair-repeat',
        target: repeatPlease,
        requires: [again, couldRepeat, pleaseRepeat],
        contextId: 'home-bus-window',
        situation: 'El ruido del bus tapó el número que dijo Sam.',
        promptEs: 'Escribe una expresión en inglés para pedir que lo repita.',
        feedbackEs:
          'Can you repeat that, please? o Again, please. sirven para pedir otra vez el mensaje.',
        hint: 'Piensa en repeat o again para pedir otra vez el mensaje.',
      },
      [
        'Can you repeat that, please?',
        'Can you repeat that please?',
        'Could you repeat that, please?',
        'Please repeat that.',
        'Again, please.',
        'Again please.',
      ],
    ),
    say(
      'foundation-repair-say',
      slow,
      'home-repair-speaking',
      'Can you speak more slowly, please?',
      'Imagina que Sam dice tu número muy rápido. Pídele que hable más despacio. Si grabas tu voz, compárala con la pregunta modelo.',
    ),
  ],
);
export const homeFoundationLiteracyMissions = [
  greeting,
  ...alphabetMissions,
  names,
  digits,
  teens,
  tens,
  instructions,
];

export const homeFoundationLiteracyPractice = [
  write(
    {
      id: 'foundation-review-letter-order-guided',
      target: alphabetOrder,
      requires: spellingLetters,
      contextId: 'home-letter-order-coaching',
      situation: 'Luz te ayuda a separar las letras de su nombre.',
      promptEs: 'Copia L U Z en el mismo orden. Puedes dejar un espacio entre las letras.',
      feedbackEs: 'Primero L, luego U y al final Z.',
      guided: true,
      remediates: ['letter_order'],
    },
    ['L U Z', 'LUZ', 'L-U-Z', 'L, U, Z'],
  ),
  write(
    {
      id: 'foundation-review-letter-order',
      target: alphabetOrder,
      requires: spellingLetters,
      contextId: 'home-school-letter-order',
      situation:
        'En el registro de la escuela, un código tiene una Z al comienzo, una U en medio y una L al final.',
      promptEs: 'Escribe el código de tres letras en el orden indicado.',
      feedbackEs: 'Empieza con Z. Conserva U en medio y termina con L.',
      transfer: true,
      errors: ['letter_order'],
    },
    ['Z U L', 'ZUL', 'Z-U-L', 'Z, U, L'],
  ),

  hear(
    {
      id: 'foundation-review-letter-e',
      target: letters.get('E')!,
      requires: [],
      transfer: true,
      contextId: 'home-library-card-letter',
      situation: 'En una biblioteca te dictan la inicial de una tarjeta.',
      promptEs: 'Escucha la letra y elígela.',
      feedbackEs: 'E y e son la misma letra. Compara E con A e I en la explicación si se parecen.',
    },
    'E',
    [
      ['a', 'A'],
      ['e', 'E'],
      ['i', 'I'],
    ],
    'e',
  ),
  hear(
    {
      id: 'foundation-review-eight-guided',
      target: number(8),
      requires: [],
      contextId: 'home-ticket-eight-coaching',
      situation: 'Sam te ayuda a distinguir dos números del boleto.',
      promptEs: 'Escucha eight. Elige 8. Nine significa 9.',
      feedbackEs: 'Eight es ocho y nine es nueve.',
      guided: true,
      remediates: ['vocabulary_sense'],
    },
    'Eight',
    [
      ['8', '8'],
      ['9', '9'],
    ],
    '8',
  ),
  hear(
    {
      id: 'foundation-review-eight',
      target: number(8),
      requires: [numberLabel],
      transfer: true,
      contextId: 'home-boarding-seat-number',
      situation: 'Una persona en el bus dicta tu número de asiento.',
      promptEs: 'Escucha el número y elige la cifra.',
      feedbackEs: 'Eight corresponde a la cifra 8.',
      errors: ['vocabulary_sense'],
    },
    'Number eight.',
    [
      ['8', '8'],
      ['9', '9'],
      ['6', '6'],
    ],
    '8',
  ),
  hear(
    {
      id: 'foundation-review-thirty-guided',
      target: number(30),
      requires: [],
      contextId: 'home-market-thirty-guided',
      situation: 'Una tarjeta de precio te ayuda a comparar dos números.',
      promptEs:
        'Escucha y elige 30. En thirty la fuerza cae al comienzo, en thirteen suele caer al final.',
      feedbackEs: 'Thirty es 30. Thirteen es 13.',
      guided: true,
      remediates: ['vocabulary_sense'],
    },
    'Thirty',
    [
      ['13', '13'],
      ['30', '30'],
    ],
    '30',
  ),
  hear(
    {
      id: 'foundation-review-thirty',
      target: number(30),
      requires: [number(8), clockReading],
      transfer: true,
      contextId: 'home-library-return-time',
      situation: 'La biblioteca te da la hora para recoger tu tarjeta.',
      promptEs: 'Elige los minutos de la hora que escuchaste.',
      feedbackEs: 'Eight thirty es 8:30. Los minutos son treinta.',
      errors: ['vocabulary_sense'],
    },
    'Eight thirty.',
    [
      ['13', '13 minutos'],
      ['30', '30 minutos'],
      ['3', '3 minutos'],
    ],
    '30',
  ),
  write(
    {
      id: 'foundation-review-repeat',
      target: repeatPlease,
      requires: [again, couldRepeat, pleaseRepeat],
      transfer: true,
      contextId: 'home-library-name-call',
      situation: 'En la biblioteca hablan al mismo tiempo y no oyes el apellido que llaman.',
      promptEs: 'Escribe una petición para que repitan el apellido.',
      feedbackEs: 'Puedes decir Can you repeat that, please? o Again, please.',
    },
    [
      'Can you repeat that, please?',
      'Could you repeat that, please?',
      'Please repeat that.',
      'Again, please.',
    ],
  ),
  read(
    {
      id: 'foundation-review-greeting',
      target: hi,
      requires: [],
      contextId: 'home-library-reception',
      situation: 'Hay una nota en la puerta de la biblioteca.',
      promptEs: '¿La nota saluda o se despide?',
      feedbackEs: 'Hi saluda. Goodbye o Bye despiden.',
    },
    'Hi!',
    [
      ['hi', 'Saluda'],
      ['bye', 'Se despide'],
    ],
    'hi',
  ),
];
