import {
  hello,
  hi,
  myName,
  number,
  yes as repairYes,
  no as repairNo,
} from './home-foundation-literacy';
import {
  coreWord,
  hear,
  mission,
  pair,
  read,
  rule,
  say,
  teach,
  word,
  write,
} from './home-foundation-prerequisites';

const plaza = 'La plaza';
const station = 'La parada';
const lostDesk = 'Mesa de objetos perdidos';

const name = word('name', 'nombre propio');
const i = coreWord('I', 'yo, la persona que habla', 'home.pronoun-i');
const you = coreWord('you', 'tú o usted, la persona a quien hablas', 'lex.u01_l01_v05');
const he = coreWord('he', 'él, el hombre o niño del que hablas', 'form.u02_l02.13');
const she = coreWord('she', 'ella, la mujer o niña de la que hablas', 'form.u02_l02.12');
const it = word('it', 'eso, la cosa de la que ya hablas');
const they = word('they', 'ellos o ellas, dos o más en estos ejemplos');
const friend = word('friend', 'amiga o amigo');
const student = word('student', 'estudiante');
const from = word('from', 'de, para indicar origen');
const am = coreWord('am', 'soy con I', 'form.u01_l01.1');
const are = word('are', 'eres con you o son con they');
const is = word('is', 'es o está con he, she o it');
const a = word('a', 'un o una, ante un sonido consonante');
const an = word('an', 'un o una, ante un sonido vocálico');
const the = coreWord(
  'the',
  'el o la, cuando ya sabemos a qué cosa te refieres',
  'home.article-word',
);
const mexico = word('Mexico', 'México, país');
const colombia = word('Colombia', 'Colombia, país');
const peru = word('Peru', 'Perú, país');
const mexican = word('Mexican', 'mexicana o mexicano, nacionalidad');
const colombian = word('Colombian', 'colombiana o colombiano, nacionalidad');
const peruvian = word('Peruvian', 'peruana o peruano, nacionalidad');
const iAmShort = word("I'm", 'soy, al decir tu origen');
const not = word('not', 'no, para negar después de am, is o are');
const where = word('where', 'dónde o de dónde, en una pregunta');
const originsAgreement = rule(
  'grammar.home.origin-be',
  'Elegir am, are o is al decir de dónde es alguien',
  pair('I am from Mexico. She is from Colombia.', 'Soy de México. Ella es de Colombia.'),
);
const origins = mission(
  'foundation-origins',
  'lq-home-plaza.origins',
  '¿De dónde somos?',
  plaza,
  'Di de dónde son dos personas y distingue país de nacionalidad.',
  from,
  [
    teach(
      'foundation-origins-people-teach',
      'Luz',
      'Las personas de la plaza',
      'I es yo. You puede ser tú o usted. He y she se refieren a una persona de la que hablamos. Una amiga o amigo es friend. Una persona que estudia es student.',
      [i, you, he, she, friend, student],
    ),
    teach(
      'foundation-origins-country-teach',
      'Luz',
      'Países y nacionalidades',
      'Escucha primero los países y luego cómo suena la nacionalidad. Por ejemplo, Mexico es el país y Mexican es la nacionalidad.',
      [mexico, colombia, peru, mexican, colombian, peruvian],
      [
        pair('Mexico. Mexican.', 'México. Mexicana o mexicano.'),
        pair('Colombia. Colombian.', 'Colombia. Colombiana o colombiano.'),
      ],
    ),
    teach(
      'foundation-origins-teach',
      'Luz',
      'I am from, she is from',
      'Primero di quién. Después usa am con I, are con you o is con he y she. Agrega from y el nombre del país. Puedes mencionar la nacionalidad sin from. Para negar, pon not después de am, are o is. Where are you from? pregunta el lugar de origen.',
      [am, are, is, from, not, where, iAmShort],
      [
        pair('I am from Peru.', 'Soy de Perú.'),
        pair("I'm from Peru.", 'Soy de Perú.'),
        pair('You are Colombian.', 'Eres de Colombia.'),
        pair('He is from Peru.', 'Él es de Perú.'),
        pair('She is from Mexico.', 'Ella es de México.'),
        pair('She is not from Peru.', 'Ella no es de Perú.'),
        pair('Where are you from?', '¿De dónde eres?'),
      ],
      [originsAgreement],
    ),
    hear(
      {
        id: 'foundation-origins-listen',
        target: from,
        requires: [i, am, mexico, she, is, colombia],
        contextId: 'home-plaza-profiles',
        situation: 'Dos personas comparan los datos de sus gafetes.',
        promptEs: '¿De dónde es la persona de la que habla Luz al decir she?',
        feedbackEs: 'She is from Colombia significa que ella es de Colombia.',
      },
      'I am from Mexico. She is from Colombia.',
      [
        ['mexico', 'De México'],
        ['colombia', 'De Colombia'],
        ['peru', 'De Perú'],
      ],
      'colombia',
    ),
    write(
      {
        id: 'foundation-origins-write',
        target: originsAgreement,
        requires: [i, am, from, mexico, iAmShort],
        contextId: 'home-volunteer-profile',
        situation:
          'El formulario de una feria te invita a probar con un perfil inventado que dice «País: México».',
        promptEs:
          'Escribe una frase sobre tu origen como si completaras ese perfil. Usa I am from o I’m from.',
        feedbackEs:
          'I am from Mexico o I’m from Mexico comunica que tu perfil es de México. Usa am con I.',
        errors: ['subject_omission', 'be_agreement'],
      },
      ['I am from Mexico.', "I'm from Mexico."],
      true,
    ),
    say(
      'foundation-origins-say',
      originsAgreement,
      'home-friend-introduction',
      'I am from Mexico. She is from Colombia.',
      'Habla de ti y de una amiga o amigo real o imaginario. Menciona los dos lugares de origen. Si grabas tu respuesta, verifica que usaste I am para ti e is con he o she.',
    ),
  ],
);

const book = word('book', 'libro');
const books = word('books', 'libros', book.ref.id);
const phone = word('phone', 'teléfono');
const phones = word('phones', 'teléfonos', phone.ref.id);
const people = word('people', 'personas');
const small = word('small', 'pequeño o pequeña');
const happy = word('happy', 'feliz');
const thisWord = word('this', 'este o esta, una cosa cerca de quien habla');
const that = word('that', 'ese o esa, una cosa a cierta distancia');
const these = word('these', 'estos o estas, varias cosas cercanas');
const those = word('those', 'esos o esas, varias cosas a cierta distancia');
const singularPlural = rule(
  'grammar.home.one-or-many',
  'Identificar uno o varios objetos con this, these, is y are',
  pair('This is a book. These are books.', 'Este es un libro. Estos son libros.'),
);
const peopleThings = mission(
  'foundation-people-things',
  'lq-home-plaza.people-things',
  'Quién es y qué es',
  plaza,
  'Identifica y describe personas u objetos, uno o varios.',
  book,
  [
    teach(
      'foundation-people-things-words-teach',
      'Luz',
      'Objetos y personas',
      'Primero escucha los objetos de la mesa. Con book y phone, agrega s al final para hablar de más de uno. People ya significa personas. Small describe tamaño y happy describe cómo se siente alguien.',
      [book, books, phone, phones, people, small, happy],
    ),
    teach(
      'foundation-people-things-teach',
      'Luz',
      'This is y these are',
      'Para señalar un objeto, usa this si está cerca y that si está más lejos. Usa these y those al señalar varios. It retoma un objeto. They se refiere aquí a varios objetos o personas. Con it, this y that usa is. Con they, these y those usa are. Small va antes de book si los dices juntos: a small book.',
      [thisWord, that, these, those, it, they, is, are, a],
      [
        pair('This is a book.', 'Este es un libro.'),
        pair('That is a phone.', 'Ese es un teléfono.'),
        pair('These are books.', 'Estos son libros.'),
        pair('Those are phones.', 'Esos son teléfonos.'),
        pair('It is a small book.', 'Es un libro pequeño.'),
        pair('This is a small phone.', 'Este es un teléfono pequeño.'),
        pair('They are happy.', 'Están felices.'),
      ],
      [singularPlural],
    ),
    read(
      {
        id: 'foundation-people-things-read',
        target: singularPlural,
        requires: [these, thisWord, is, are, book, books, phone, a],
        contextId: 'home-belongings-captions',
        situation: 'Dos letreros identifican objetos en la mesa.',
        promptEs: '¿Cuál letrero identifica varios objetos?',
        feedbackEs:
          'These are books habla de varios libros. This is a phone señala un solo teléfono.',
      },
      'These are books.\nThis is a phone.',
      [
        ['books', 'El de los libros'],
        ['phone', 'El del teléfono'],
      ],
      'books',
    ),
    hear(
      {
        id: 'foundation-people-things-listen',
        target: singularPlural,
        requires: [that, is, a, small, book],
        contextId: 'home-volunteer-supplies',
        situation: 'Sam encuentra uno de los objetos que necesita un visitante.',
        promptEs: 'Escucha. ¿Qué encontró Sam?',
        feedbackEs: 'That is a small book señala un solo libro pequeño.',
      },
      'That is a small book.',
      [
        ['books', 'Varios libros'],
        ['book', 'Un libro pequeño'],
        ['phone', 'Un teléfono pequeño'],
      ],
      'book',
    ),
    write(
      {
        id: 'foundation-people-things-write',
        target: singularPlural,
        requires: [these, are, phones],
        contextId: 'home-help-desk-phones',
        situation: 'Luz tiene delante dos teléfonos y necesita un letrero.',
        promptEs: 'Escribe una frase que empiece con These y señale que son teléfonos.',
        feedbackEs:
          'These are phones significa «Estos son teléfonos». Usa are y la s de phones para el plural.',
        errors: ['be_agreement', 'word_order'],
      },
      ['These are phones.'],
      true,
    ),
  ],
);

const bus = coreWord('bus', 'autobús', 'home.bus');
const busStop = coreWord('bus stop', 'parada del autobús', 'home.stop');
const park = coreWord('park', 'parque', 'home.park');
const nextTo = coreWord('next to', 'justo al lado de', 'home.adjacency');
const nextToWord = word('next to', 'justo al lado de');
const near = word('near', 'cerca de, con algo de distancia posible');
const sign = word('sign', 'letrero o señal');
const library = word('library', 'biblioteca');
const itIsShort = word("It's", 'está, con la forma breve');
const whereIsShort = word("Where's", 'dónde está, con la forma breve');
const askLocation = { id: 'home.ask-location', form: 'Where is' };
const place = mission(
  'foundation-place',
  'lq-home-plaza.place',
  'Dónde está la parada',
  station,
  'Localiza una parada y haz una pregunta de ubicación.',
  busStop,
  [
    teach(
      'foundation-place-words-teach',
      'Sam',
      'Parque, letrero y parada',
      'Bus stop es la parada donde se detiene el bus. Cerca de la plaza hay un park y un sign. Library es biblioteca. Escucha cada nombre y mira qué lugar representa.',
      [bus, busStop, park, sign, library],
    ),
    teach(
      'foundation-place-teach',
      'Sam',
      'Where is…?',
      'Para preguntar dónde está un lugar, di Where is y el nombre del lugar. Where’s suena en un solo bloque. Para responder, comienza con It is o It’s. Next to indica justo al lado. Near solo indica que queda cerca.',
      [where, is, the, it, itIsShort, whereIsShort, nextTo, nextToWord, near],
      [
        pair('Where is the bus stop?', '¿Dónde está la parada?'),
        pair("Where's the bus stop?", '¿Dónde está la parada?'),
        pair("It's next to the library.", 'Está al lado de la biblioteca.'),
        pair('It is near the library.', 'Está cerca de la biblioteca.'),
      ],
      [askLocation],
    ),
    hear(
      {
        id: 'foundation-place-listen',
        target: nextTo,
        requires: [itIsShort, nextToWord, the, park],
        contextId: 'home-bus-station-plan',
        situation:
          'En el plano, la parada A está justo al lado del parque. La B queda junto a la biblioteca.',
        promptEs: 'Escucha a Sam. ¿Cuál es la parada correcta?',
        feedbackEs:
          'It’s next to the park significa que la parada está al lado del parque. Es la A.',
      },
      "It's next to the park.",
      [
        ['a', 'Parada A'],
        ['b', 'Parada B'],
      ],
      'a',
    ),
    write(
      {
        id: 'foundation-place-write',
        target: askLocation,
        requires: [where, is, whereIsShort, the, library],
        contextId: 'home-trip-information-booth',
        situation: 'En un punto de información necesitas saber dónde está la biblioteca.',
        promptEs: 'Escribe la pregunta para localizar la biblioteca.',
        feedbackEs: 'Usa Where is seguido de the library. La forma breve Where’s también funciona.',
        errors: ['word_order', 'be_omission'],
      },
      ['Where is the library?', "Where's the library?"],
      true,
    ),
  ],
);

const left = word('left', 'izquierda');
const right = word('right', 'derecha');
const straight = word('straight', 'derecho o de frente');
const turn = word('turn', 'gira');
const go = coreWord('go', 've hacia ese lugar', 'lex.u04_l03_v01');
const then = coreWord('then', 'después, para ordenar acciones', 'form.u08_l02.2');
const entrance = word('entrance', 'entrada');
const routeCommands = rule(
  'grammar.home.ordered-directions',
  'Dar indicaciones en el orden en que ocurren',
  pair('Go straight. Then turn left.', 'Sigue de frente. Luego gira a la izquierda.'),
);
const direction = mission(
  'foundation-direction',
  'lq-home-plaza.direction',
  'Dos pasos para llegar',
  station,
  'Sigue y da dos instrucciones en orden.',
  left,
  [
    teach(
      'foundation-direction-words-teach',
      'Sam',
      'De frente y a los lados',
      'En el cruce, left es izquierda y right es derecha. Straight indica seguir de frente. Entrance es la entrada. Escucha las palabras y señala la dirección con la mano.',
      [left, right, straight, entrance, turn, go, then],
    ),
    teach(
      'foundation-direction-teach',
      'Sam',
      'Primero sigue. Luego gira.',
      'Para dar una instrucción corta, empieza por la acción: Go o Turn. Luego di la dirección. Then introduce el segundo paso. Escucha cómo straight empieza directamente con el grupo de sonidos str, sin añadir una e antes.',
      [],
      [
        pair('Go straight.', 'Sigue de frente.'),
        pair('Turn left.', 'Gira a la izquierda.'),
        pair('Turn right.', 'Gira a la derecha.'),
        pair('Turn right. Then go straight.', 'Gira a la derecha. Luego sigue de frente.'),
      ],
      [routeCommands],
    ),
    hear(
      {
        id: 'foundation-direction-listen',
        target: routeCommands,
        requires: [go, straight, then, turn, left],
        contextId: 'home-station-fork',
        situation:
          'Desde la plaza, el camino sigue derecho hasta una bifurcación. La entrada A queda a la izquierda. La B queda a la derecha.',
        promptEs: 'Escucha los dos pasos. ¿A cuál entrada llegas?',
        feedbackEs:
          'Go straight indica ir de frente. Then turn left manda girar a la izquierda. Llegas a A.',
      },
      'Go straight. Then turn left.',
      [
        ['a', 'Entrada A'],
        ['b', 'Entrada B'],
      ],
      'a',
    ),
    write(
      {
        id: 'foundation-direction-write',
        target: routeCommands,
        requires: [go, straight, then, turn, right],
        contextId: 'home-library-fork',
        situation:
          'Desde otro punto del mapa, el camino a la biblioteca va de frente y luego a la derecha.',
        promptEs: 'Escribe los dos pasos en inglés. Usa then para introducir el segundo.',
        feedbackEs: 'Go straight. Then turn right. da las dos indicaciones en orden.',
        errors: ['word_order'],
      },
      ['Go straight. Then turn right.', 'Go straight, then turn right.'],
      true,
    ),
  ],
);

const under = word('under', 'debajo de');
const on = word('on', 'encima de una superficie, en contacto');
const inWord = word('in', 'dentro de');
const between = word('between', 'entre dos cosas');
const inFrontOf = word('in front of', 'delante de');
const shelf = word('shelf', 'estante');
const bench = word('bench', 'banca');
const table = word('table', 'mesa');
const and = coreWord('and', 'y, para unir dos cosas', 'form.u01_l03.3');
const objectPlace = rule(
  'grammar.home.object-place',
  'Colocar la posición después de la cosa y el verbo',
  pair('The book is under the bench.', 'El libro está debajo de la banca.'),
);
const objects = mission(
  'foundation-objects-map',
  'lq-home-plaza.objects-map',
  'Coloca los objetos en el mapa',
  lostDesk,
  'Sigue indicaciones sobre dónde están los objetos de la plaza.',
  under,
  [
    teach(
      'foundation-objects-map-words-teach',
      'Luz',
      'Banca, estante y mesa',
      'Busca un bench para sentarse, un shelf para guardar cosas y una table donde apoyarlas. Book quiere decir libro y phone quiere decir teléfono. Escucha los objetos.',
      [bench, shelf, table, book, phone],
    ),
    teach(
      'foundation-objects-map-teach',
      'Luz',
      'Dentro, encima o debajo',
      'Usa in para decir «dentro», on para una cosa apoyada en una superficie y under para «debajo». Between une dos puntos de referencia con and. In front of significa «delante de». En un mensaje de ubicación, menciona el objeto, di is y luego la ubicación.',
      [inWord, on, under, between, and, inFrontOf, the, is],
      [
        pair('The book is on the shelf.', 'El libro está encima del estante.'),
        pair('The book is under the bench.', 'El libro está debajo de la banca.'),
        pair(
          'The book is between the bench and the shelf.',
          'El libro está entre la banca y el estante.',
        ),
        pair('The phone is in front of the table.', 'El teléfono está delante de la mesa.'),
      ],
      [objectPlace],
    ),
    hear(
      {
        id: 'foundation-objects-map-listen',
        target: objectPlace,
        requires: [the, phone, is, between, bench, and, shelf],
        contextId: 'home-plaza-object-layout',
        situation:
          'En el dibujo, A marca lo que está debajo de la banca y B marca lo que está entre la banca y el estante.',
        promptEs: 'Escucha la ubicación del teléfono y elige su punto.',
        feedbackEs:
          'Between the bench and the shelf significa entre la banca y el estante. Es el punto B.',
      },
      'The phone is between the bench and the shelf.',
      [
        ['a', 'Punto A'],
        ['b', 'Punto B'],
      ],
      'b',
    ),
    write(
      {
        id: 'foundation-objects-map-write',
        target: objectPlace,
        requires: [the, book, is, under, bench],
        contextId: 'home-bench-object-note',
        situation: 'Ves un libro debajo de una banca. Deja una nota para quien lo busca.',
        promptEs: 'Escribe dónde está el libro. Usa under para «debajo de».',
        feedbackEs: 'The book is under the bench indica que el libro está debajo de la banca.',
        errors: ['preposition', 'word_order'],
      },
      ['The book is under the bench.'],
      true,
    ),
  ],
);

const bag = coreWord('bag', 'mochila o bolso', 'home.bag');
const blue = coreWord('blue', 'azul', 'home.blue');
const red = coreWord('red', 'rojo', 'home.red');
const green = word('green', 'verde');
const yellow = word('yellow', 'amarillo');
const lost = word('lost', 'perdido, en un aviso');
const umbrella = word('umbrella', 'paraguas');
const my = coreWord('my', 'mi, de la persona que habla', 'home.ownership-word');
const your = coreWord('your', 'tu, de la persona a quien se habla', 'form.u01_l04.5');
const mine = word('mine', 'mío o mía, en lugar de repetir el objeto');
const yours = word('yours', 'tuyo o tuya, en lugar de repetir el objeto');
const ownership = { id: 'home.ownership' };
const isThisYour = rule(
  'grammar.home.confirm-ownership',
  'Preguntar si una cosa le pertenece a alguien',
  pair('Is this your bag?', '¿Esta mochila es tuya?'),
);
const bagWords = [bag, blue, red, green, yellow, lost, umbrella];
const bagMission = mission(
  'foundation-bag',
  'lq-home-plaza.bag',
  '¿Es tu mochila?',
  lostDesk,
  'Identifica una mochila y confirma de quién es.',
  bag,
  [
    teach(
      'foundation-bag-words-teach',
      'Luz',
      'Mochilas, paraguas y colores',
      'Primero mira el nombre de los objetos. Escucha los colores. Cuando describes un objeto en un grupo de palabras, el color va antes del nombre. Blue bag dice «mochila azul». Se usa a antes del sonido de b y an antes del primer sonido de umbrella.',
      [...bagWords, a, an],
      [
        pair('A blue bag.', 'Una mochila azul.'),
        pair('A red bag.', 'Una mochila roja.'),
        pair('An umbrella.', 'Un paraguas.'),
        pair('A yellow umbrella.', 'Un paraguas amarillo.'),
      ],
    ),
    teach(
      'foundation-bag-teach',
      'Luz',
      'My bag y your bag',
      'Para indicar de quién es algo, coloca my o your antes del objeto. Para responder sin repetir el objeto, usa mine o yours. Para confirmar, pregunta Is this your…? Para describir la mochila, di My bag is y después el color.',
      [my, your, mine, yours, is, it, thisWord, repairYes, repairNo],
      [
        pair('My bag is red.', 'Mi mochila es roja.'),
        pair('Is this your bag?', '¿Esta mochila es tuya?'),
        pair('Yes, it is mine.', 'Sí, es mía.'),
        pair('No, it is yours.', 'No, es tuya.'),
      ],
      [ownership, isThisYour],
    ),
    hear(
      {
        id: 'foundation-bag-listen',
        target: ownership,
        requires: [my, bag, is, blue],
        contextId: 'home-lost-bag-owner',
        situation: 'Luz y Sam dejaron cada quien una mochila en la plaza. Escucha a Luz.',
        promptEs: 'Escucha. ¿Cuál mochila es de Luz?',
        feedbackEs: 'Luz dice My bag is blue. My se refiere a quien habla y blue es azul.',
      },
      'My bag is blue.',
      [
        ['blue', 'La azul'],
        ['red', 'La roja'],
        ['green', 'La verde'],
      ],
      'blue',
    ),
    write(
      {
        id: 'foundation-bag-write',
        target: isThisYour,
        requires: [is, thisWord, your, bag],
        contextId: 'home-lost-desk-handoff',
        situation: 'Encontraste una mochila. Una persona se acerca a buscar la suya.',
        promptEs: 'Escribe una pregunta para saber si la mochila es suya.',
        feedbackEs:
          'Is this your bag? pregunta si la mochila le pertenece a esa persona. Your va antes de bag.',
        errors: ['word_order'],
      },
      ['Is this your bag?'],
      true,
    ),
  ],
);

const ships = [
  word('ship', 'barco'),
  word('sheep', 'oveja'),
  word('bit', 'pedacito'),
  word('beat', 'ritmo o pulso', 'lex.home.beat-pulse'),
];
const [ship, sheep, bit, beat] = ships;
const vowelContrast = rule(
  'grammar.home.sound-short-long-i',
  'Distinguir los sonidos de ship y sheep',
  pair('Ship. Sheep.', 'Barco. Oveja.'),
);
const bV = [word('boat', 'bote'), word('vote', 'voto')];
const [boat, vote] = bV;
const thin = word('thin', 'delgado o delgada');
const thSound = rule(
  'grammar.home.sound-th',
  'Oír los dos sonidos comunes escritos th',
  pair('Thin. This.', 'Delgado. Este.'),
);
const clusters = [word('school', 'escuela'), word('stop', 'alto, en una señal')];
const [school, stop] = clusters;
const soundEnd = rule(
  'grammar.home.sound-ending',
  'Oír y decir la consonante final',
  pair('Stop. Sit.', 'Detente. Siéntate.'),
);
const sit = word('sit', 'siéntate');
const sounds = mission(
  'foundation-sounds',
  'lq-home-start.spell',
  'Así suenan las palabras',
  station,
  'Distingue sonidos y compara tu grabación con una frase corta.',
  ship,
  [
    teach(
      'foundation-sounds-vowels-teach',
      'Luz',
      'Un sonido puede cambiar una palabra',
      'La i se llama I al deletrear. En ship y bit, su sonido es más relajado y se hace con la lengua un poco más baja. Sheep y beat llevan una vocal más tensa, parecida a una i sostenida. Escucha las dos parejas. El cambio afecta a la calidad de la vocal y muchas veces a su duración. En español estas vocales tienden a parecer un solo sonido, pero en inglés distinguen palabras.',
      ships,
      [pair('Ship. Sheep.', 'Barco. Oveja.'), pair('Bit. Beat.', 'Pedacito. Ritmo.')],
      [vowelContrast],
    ),
    hear(
      {
        id: 'foundation-sounds-vowel-listen',
        target: vowelContrast,
        requires: [ship, sheep, bit, beat],
        contextId: 'home-picture-card-vowels',
        situation: 'Luz nombra una de las imágenes para preparar una postal.',
        promptEs: 'Escucha y elige lo que nombró.',
        feedbackEs: 'Sheep significa oveja. Su vocal es más tensa que la de ship.',
      },
      'Sheep',
      [
        ['ship', 'Barco'],
        ['sheep', 'Oveja'],
        ['bit', 'Pedacito'],
      ],
      'sheep',
    ),
    teach(
      'foundation-sounds-consonants-teach',
      'Sam',
      'Tres comienzos distintos',
      'En hello suelta un poco de aire al comienzo, como en una exhalación suave. Para la b de boat, junta los dos labios. En vote, acerca el labio inferior a los dientes de arriba y deja pasar aire. En thin y this, acerca la lengua a los dientes. En thin pasa aire sin vibración de la voz. En this hay vibración. Escucha el contraste antes de intentar decirlo.',
      [hello, boat, vote, thin, thisWord],
      [pair('Boat. Vote.', 'Bote. Voto.'), pair('Thin. This.', 'Delgado. Este.')],
      [thSound],
    ),
    hear(
      {
        id: 'foundation-sounds-bv-listen',
        target: vote,
        requires: [boat],
        contextId: 'home-poster-sound-contrast',
        situation: 'Sam revisa el audio de dos carteles de ejemplo.',
        promptEs: 'Escucha. ¿Qué palabra dijo Sam?',
        feedbackEs:
          'Vote empieza con el labio inferior cerca de los dientes de arriba. Boat empieza con los labios juntos.',
      },
      'Vote',
      [
        ['boat', 'Bote'],
        ['vote', 'Voto'],
      ],
      'vote',
    ),
    teach(
      'foundation-sounds-rhythm-teach',
      'Luz',
      'Comienzos, finales y ritmo',
      'Empieza school y stop directamente con s, sin anteponer una e. Mantén la consonante al final de stop y sit. Puedes cerrar los labios o colocar la lengua para terminar el sonido sin agregar una vocal. Dentro de una palabra, una sílaba suele oírse con más fuerza, como la primera de thirty. En una frase, la información importante suele recibir más fuerza. Compara el modelo hablado con tu propia versión sin buscar un ritmo de sílabas iguales.',
      [school, stop, sit, number(30)],
      [
        pair('School. Stop. Sit.', 'Escuela. Alto. Siéntate.'),
        pair('Stop at the school.', 'Detente en la escuela.'),
      ],
      [soundEnd],
    ),
    hear(
      {
        id: 'foundation-sounds-end-listen',
        target: soundEnd,
        requires: [stop, sit, school],
        contextId: 'home-school-sign',
        situation: 'Luz modela cómo dice una señal cerca de la escuela.',
        promptEs: 'Escucha. ¿Cuál fue la indicación?',
        feedbackEs:
          'Stop empieza con st y termina con p. Conserva el cierre de los labios al final.',
      },
      'Stop',
      [
        ['sit', 'Siéntate'],
        ['stop', 'Alto'],
        ['school', 'Escuela'],
      ],
      'stop',
    ),
    say(
      'foundation-sounds-say',
      soundEnd,
      'home-compare-rhythm',
      'Stop at the school.',
      'Escucha. Di la frase y graba tu voz si quieres. Al comparar, fíjate si comienzas stop y school directamente con s, si mantienes el cierre final de stop y qué palabras reciben más fuerza.',
    ),
  ],
);
const transfer = mission(
  'foundation-transfer',
  'lq-home-plaza.bag',
  'Una visita a la biblioteca',
  'Biblioteca del barrio',
  'Usa un saludo, un nombre, un número y una descripción para orientar a otra persona.',
  umbrella,
  [
    teach(
      'foundation-transfer-prep-teach',
      'Sam',
      'Tu turno de ayudar',
      'Sam te invita a una biblioteca del barrio. Para que puedas entrar desde cualquier ruta, aquí tienes modelos para saludar, decir un nombre y pedir ayuda. Hello es un saludo. El nombre que sigue a My name is identifica a quien habla. La ficha y el bus llevan números. Asegúrate de reconocer cuáles se mencionan.',
      [hello, hi, myName, my, is, name, bus, number(6), number(8), number(9)],
      [pair('Hello! My name is Luz.', '¡Hola! Me llamo Luz.'), pair('Bus six.', 'Bus seis.')],
    ),
    read(
      {
        id: 'foundation-transfer-name-read',
        target: myName,
        requires: [hello, my, name, is],
        contextId: 'home-library-visitor-form',
        situation: 'Una visitante dejó esta nota en la mesa de la biblioteca.',
        promptEs: '¿Qué nombre debes apuntar en la lista de visitas?',
        feedbackEs: 'El nombre aparece después de My name is. La visitante es Ana.',
        transfer: true,
      },
      'Hello! My name is Ana.',
      [
        ['luz', 'Luz'],
        ['ana', 'Ana'],
        ['sam', 'Sam'],
      ],
      'ana',
    ),
    hear(
      {
        id: 'foundation-transfer-bus-listen',
        target: number(8),
        requires: [bus],
        contextId: 'home-library-return-bus',
        situation:
          'Una visitante necesita volver a casa. Escucha el número del bus que le recomienda Luz.',
        promptEs: '¿Qué bus le recomienda?',
        feedbackEs: 'Bus eight es el bus número ocho.',
        transfer: true,
      },
      'Bus eight.',
      [
        ['6', '6'],
        ['8', '8'],
        ['9', '9'],
      ],
      '8',
    ),
    teach(
      'foundation-transfer-object-teach',
      'Luz',
      'Un objeto olvidado',
      'En la biblioteca hay un paraguas olvidado. Umbrella significa «paraguas», blue quiere decir «azul» y under indica qué queda debajo de algo. Para saber si pertenece a una persona, pregunta Is this your…? Para indicar dónde se encuentra, di el objeto, is y la posición.',
      [umbrella, blue, yellow, bench, under, your, thisWord, it, the],
      [
        pair('A yellow umbrella.', 'Un paraguas amarillo.'),
        pair('The bag is under the bench.', 'La mochila está debajo de la banca.'),
        pair('Is this your bag?', '¿Esta mochila es tuya?'),
      ],
      [objectPlace, isThisYour],
    ),
    write(
      {
        id: 'foundation-transfer-location-write',
        target: objectPlace,
        requires: [the, umbrella, is, under, bench],
        contextId: 'home-library-umbrella-location',
        situation:
          'Ves un paraguas debajo de la banca de la biblioteca. La encargada no sabe dónde está.',
        promptEs: 'Escribe dónde está el paraguas.',
        feedbackEs:
          'The umbrella is under the bench indica que el paraguas está debajo de la banca.',
        transfer: true,
        errors: ['preposition'],
      },
      ['The umbrella is under the bench.'],
      true,
    ),
    write(
      {
        id: 'foundation-transfer-ownership-write',
        target: isThisYour,
        requires: [is, thisWord, your, umbrella],
        contextId: 'home-library-umbrella-handoff',
        situation:
          'Una visitante busca un paraguas azul. Tienes uno en la mano y quieres confirmar de quién es.',
        promptEs: 'Escribe una pregunta para saber si el paraguas es de la visitante.',
        feedbackEs:
          'Is this your umbrella? confirma si el paraguas es suyo. Coloca your antes de umbrella.',
        transfer: true,
        errors: ['word_order'],
      },
      ['Is this your umbrella?'],
      true,
    ),
    say(
      'foundation-transfer-say',
      isThisYour,
      'home-library-completion',
      'Hello! Is this your umbrella?',
      'Imagina todo el encuentro. Saluda, di tu nombre, confirma un número de bus y describe el paraguas que encontraste. Puedes grabarte y revisar si la otra persona podría identificar tu nombre, el número y el objeto.',
    ),
  ],
);

export const homeFoundationLanguageMissions = [
  origins,
  peopleThings,
  place,
  direction,
  objects,
  bagMission,
  sounds,
  transfer,
];

export const homeFoundationLanguagePractice = [
  write(
    {
      id: 'foundation-review-origin',
      target: originsAgreement,
      requires: [i, am, from, peru, iAmShort],
      contextId: 'home-community-registration-origin',
      situation:
        'En un centro comunitario practicas cómo llenar una ficha. El país de tu ejemplo es Perú.',
      promptEs: 'Escribe de dónde eres según esa ficha.',
      feedbackEs: 'I am from Peru o I’m from Peru comunica el origen del ejemplo.',
      transfer: true,
      errors: ['subject_omission', 'be_agreement'],
    },
    ['I am from Peru.', "I'm from Peru."],
    true,
  ),
  write(
    {
      id: 'foundation-review-people-things',
      target: singularPlural,
      requires: [these, are, books],
      contextId: 'home-classroom-library-books',
      situation: 'En un salón, quieres señalar los libros que tienes cerca.',
      promptEs: 'Escribe «Estos son libros» en inglés.',
      feedbackEs: 'These are books. Para varios objetos, usa these, are y books con s.',
      transfer: true,
      errors: ['be_agreement', 'word_order'],
    },
    ['These are books.'],
    true,
  ),
  write(
    {
      id: 'foundation-review-ask-location',
      target: askLocation,
      requires: [where, is, whereIsShort, the, park],
      contextId: 'home-train-station-where',
      situation: 'Desde la estación de tren quieres preguntar dónde queda el parque.',
      promptEs: 'Escribe la pregunta en inglés.',
      feedbackEs: 'Where is the park? pregunta dónde está el parque. También puedes usar Where’s.',
      transfer: true,
      errors: ['word_order', 'be_omission'],
    },
    ['Where is the park?', "Where's the park?"],
    true,
  ),
  write(
    {
      id: 'foundation-review-object-place-guided',
      target: objectPlace,
      requires: [the, phone, is, on, shelf],
      contextId: 'home-review-phone-location',
      situation: 'Luz te ayuda a dejar una nota para un teléfono.',
      promptEs: 'Ordena la frase usando este modelo: The phone is on the shelf.',
      feedbackEs: 'Primero el objeto (The phone), luego is y al final la posición (on the shelf).',
      guided: true,
      remediates: ['preposition', 'word_order'],
    },
    ['The phone is on the shelf.'],
    true,
  ),
  write(
    {
      id: 'foundation-review-object-place',
      target: objectPlace,
      requires: [the, book, is, on, shelf],
      contextId: 'home-classroom-object-location',
      situation: 'El libro está encima del estante de un salón de clase.',
      promptEs: 'Escribe una nota corta que indique la ubicación del libro.',
      feedbackEs: 'The book is on the shelf indica que el libro está encima del estante.',
      transfer: true,
      errors: ['preposition', 'word_order'],
    },
    ['The book is on the shelf.'],
    true,
  ),
  write(
    {
      id: 'foundation-review-direction',
      target: routeCommands,
      requires: [go, straight, then, turn, right],
      contextId: 'home-community-center-direction',
      situation:
        'La entrada del centro comunitario queda después de seguir de frente y girar a la derecha.',
      promptEs: 'Escribe dos instrucciones en inglés para ayudar a una visitante.',
      feedbackEs:
        'Escribe Go straight. Then turn right. Coloca el primer movimiento antes de then.',
      transfer: true,
      errors: ['word_order'],
    },
    ['Go straight. Then turn right.', 'Go straight, then turn right.'],
    true,
  ),
];
