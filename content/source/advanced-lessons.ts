import type { LessonAuthoring, Task } from './integrated-lessons.ts';

// Original situations authored for this course; no external text or media.
const fill = (
  sentence: string,
  answers: string[],
  reason: string,
  prompt = 'Completa solo la parte que falta.',
): Task => ({
  type: 'cloze',
  prompt,
  sentence,
  answers,
  reason,
});
const build = (answer: string, reason: string): Task => ({
  type: 'reorder',
  prompt: 'Ordena las palabras para expresar la idea.',
  answer,
  reason,
});
const write = (prompt: string, answers: string[], reason: string): Task => ({
  type: 'short_text',
  prompt,
  answers,
  reason,
});
const recall = (prompt: string, answer: string, reason: string): Task => ({
  type: 'short_text',
  prompt,
  answers: [answer],
  reason,
  recall: true,
});
const fix = (sentence: string, answer: string, reason: string): Task => ({
  type: 'correction',
  prompt: 'Corrige la oración. Escríbela completa.',
  sentence,
  answers: [answer],
  reason,
});

export const advancedUnits: {
  title: string;
  description: string;
  cefr: 'A1' | 'A2';
  lessons: LessonAuthoring[];
}[] = [
  {
    title: 'Experiencias que compartimos',
    description: 'Habla de experiencias, pregunta por ellas y distingue un momento terminado.',
    cefr: 'A2',
    lessons: [
      {
        title: 'Lo he probado',
        goal: 'Contar una experiencia sin indicar cuándo ocurrió con have o has + participio.',
        scene:
          'Compartes experiencias de comida y viajes. Aquí interesa si algo ha ocurrido en tu vida, sin dar una fecha.',
        words: [
          [
            'try',
            'probar; intentar',
            'I have tried this food.',
            'He probado esta comida.',
            'verbo',
          ],
          ['food', 'comida', 'She has tried this food.', 'Ella ha probado esta comida.'],
          ['city', 'ciudad', 'I have been to this city.', 'He estado en esta ciudad.'],
          ['beach', 'playa', 'I have been to the beach.', 'He estado en la playa.'],
          [
            'once',
            'una vez',
            'I have tried this food once.',
            'He probado esta comida una vez.',
            'adverbio',
          ],
          [
            'twice',
            'dos veces',
            'She has been to the beach twice.',
            'Ella ha estado en la playa dos veces.',
            'adverbio',
          ],
        ],
        recycle: ['rice', 'go'],
        skill: 'grammar.perfect_experiences',
        rule: 'Para contar una experiencia sin decir cuándo, usa have con I/you/they y has con he/she, seguido de un participio. Hoy aprende been (estado; visitado) y tried (probado). I have been to the beach expresa una visita en algún momento. No lo combines aquí con yesterday: ese momento terminado necesita pasado simple.',
        forms: [
          ['have', 'auxiliar: he; has; hemos; han'],
          ['has', 'auxiliar con he/she: ha'],
          ['been', 'participio de be: estado; visitado'],
          ['tried', 'participio de try: probado'],
          ['this', 'este; esta'],
        ],
        examples: [
          ['I have tried this food.', 'He probado esta comida.'],
          ['She has been to the beach twice.', 'Ella ha estado en la playa dos veces.'],
        ],
        dialogue: [
          ['Ana', 'I have been to this city once.', 'He estado en esta ciudad una vez.'],
          ['Luis', 'I have tried this food.', 'He probado esta comida.'],
          [
            'Ana',
            'My sister has tried this food twice.',
            'Mi hermana ha probado esta comida dos veces.',
          ],
        ],
        tasks: [
          fill('She ____ tried this food.', ['has'], 'She lleva has antes del participio tried.'),
          build(
            'I have been to the beach once.',
            'Have + been expresa la experiencia; once indica una vez.',
          ),
          recall(
            'Recuerda la palabra inglesa para «comida».',
            'food',
            'Food significa comida en general.',
          ),
          write(
            'Di «He probado esta comida».',
            ['I have tried this food.'],
            'Con I usa have y el participio tried; no añadas una fecha.',
          ),
        ],
      },
      {
        title: '¿Alguna vez?',
        goal: 'Preguntar por una experiencia con Have you ever y responder brevemente.',
        scene:
          'Conversas con otra persona sobre lugares y medios de transporte que conocen. No necesitas haber viajado para practicar las preguntas.',
        words: [
          [
            'ever',
            'alguna vez (en preguntas)',
            'Have you ever been abroad?',
            '¿Alguna vez has estado en el extranjero?',
            'adverbio',
          ],
          [
            'abroad',
            'en el extranjero',
            'I have been abroad once.',
            'He estado en el extranjero una vez.',
            'adverbio',
          ],
          ['train', 'tren', 'I have traveled by train.', 'He viajado en tren.'],
          [
            'by train',
            'en tren',
            'Have you ever traveled by train?',
            '¿Alguna vez has viajado en tren?',
            'expresión',
          ],
          [
            'museum',
            'museo',
            'Have you ever been to this museum?',
            '¿Alguna vez has estado en este museo?',
          ],
          [
            'before',
            'antes',
            'I have been to this museum before.',
            'He estado en este museo antes.',
            'adverbio',
          ],
          ['travel', 'viajar', 'I have traveled by train.', 'He viajado en tren.', 'verbo'],
        ],
        recycle: ['city', 'once'],
        skill: 'grammar.perfect_questions',
        rule: 'Para preguntar por una experiencia coloca Have o Has antes de la persona: Have you ever been abroad? Ever significa alguna vez y va antes del participio. Una respuesta breve es Yes, I have. Travel tiene el participio regular traveled, con una sola l en inglés estadounidense.',
        forms: [
          ['traveled', 'viajado (participio de travel)'],
          ['by', 'en; por (medio de transporte)'],
        ],
        examples: [
          ['Have you ever traveled by train?', '¿Alguna vez has viajado en tren?'],
          ['Has she ever been to this museum?', '¿Alguna vez ha estado ella en este museo?'],
        ],
        dialogue: [
          ['Luis', 'Have you ever been abroad?', '¿Alguna vez has estado en el extranjero?'],
          ['Ana', 'Yes, I have. I have traveled by train.', 'Sí. He viajado en tren.'],
          ['Luis', 'Have you ever been to this museum?', '¿Alguna vez has estado en este museo?'],
          ['Ana', 'Yes, I have been to this museum before.', 'Sí, he estado en este museo antes.'],
        ],
        tasks: [
          fill(
            '____ you ever been to this museum?',
            ['Have'],
            'Con you la pregunta empieza con Have.',
          ),
          build(
            'Has she ever traveled by train?',
            'Has + she + ever + traveled forma la pregunta.',
          ),
          recall(
            'Recuerda la palabra para «alguna vez» en estas preguntas.',
            'ever',
            'Ever pregunta si algo ocurrió en algún momento.',
          ),
          write(
            'Pregunta «¿Alguna vez has estado en el extranjero?».',
            ['Have you ever been abroad?'],
            'Have you ever + been pregunta por la experiencia.',
          ),
        ],
      },
      {
        title: 'Todavía no',
        goal: 'Expresar que algo aún no ha ocurrido con have not + participio + yet.',
        scene:
          'Preparas un viaje con calma. Dices qué preparativos todavía faltan, sin convertirlo en una carrera.',
        words: [
          [
            'yet',
            'todavía; aún (en negativas)',
            'I have not packed my bag yet.',
            'Todavía no he preparado mi bolso.',
            'adverbio',
          ],
          [
            'pack',
            'preparar el equipaje; empacar',
            'She has packed her suitcase.',
            'Ella ha preparado su maleta.',
            'verbo',
          ],
          [
            'bag',
            'bolso; bolsa',
            'I have not packed my bag yet.',
            'Todavía no he preparado mi bolso.',
          ],
          ['suitcase', 'maleta', 'I have packed my suitcase.', 'He preparado mi maleta.'],
          [
            'ticket',
            'boleto',
            'I have not bought my ticket yet.',
            'Todavía no he comprado mi boleto.',
          ],
          ['passport', 'pasaporte', 'My passport is here.', 'Mi pasaporte está aquí.'],
          [
            'airport',
            'aeropuerto',
            'The airport is near this city.',
            'El aeropuerto está cerca de esta ciudad.',
          ],
        ],
        recycle: ['buy', 'travel'],
        skill: 'grammar.perfect_yet',
        rule: 'Para decir que algo todavía no ha ocurrido, coloca not después de have o has y yet al final: I have not packed my bag yet. Packed es el participio regular de pack. Bought sirve como pasado y como participio de buy. Haven’t y hasn’t son formas cortas de have not y has not.',
        forms: [
          ['packed', 'preparado; empacado'],
          ['bought', 'comprado (participio de buy)'],
          ["haven't", 'have not, forma corta'],
          ["hasn't", 'has not, forma corta'],
          ['her', 'su; de ella'],
        ],
        examples: [
          ['I have not bought my ticket yet.', 'Todavía no he comprado mi boleto.'],
          ['She has not packed her suitcase yet.', 'Ella todavía no ha preparado su maleta.'],
        ],
        dialogue: [
          ['Ana', 'I have not packed my bag yet.', 'Todavía no he preparado mi bolso.'],
          ['Luis', 'I have not bought my ticket yet.', 'Todavía no he comprado mi boleto.'],
          [
            'Ana',
            'My passport is here. I have packed my suitcase.',
            'Mi pasaporte está aquí. He preparado mi maleta.',
          ],
        ],
        tasks: [
          fill(
            'I have ____ bought my ticket yet.',
            ['not'],
            'Not va después de have para negar.',
            'Completa la negación con la palabra que significa «no».',
          ),
          build('She has not packed her suitcase yet.', 'Has not + packed; yet va al final.'),
          recall(
            'Recuerda la palabra inglesa para «pasaporte».',
            'passport',
            'Passport significa pasaporte.',
          ),
          write(
            'Di «Todavía no he comprado mi boleto».',
            ['I have not bought my ticket yet.', "I haven't bought my ticket yet."],
            'Usa have not o haven’t, después bought y al final yet.',
          ),
        ],
      },
      {
        title: 'Una experiencia y un día',
        goal: 'Distinguir una experiencia sin fecha de una acción en un momento terminado.',
        scene:
          'Primero cuentas una experiencia; después das un detalle con una fecha. Cada oración tiene una función diferente.',
        words: [
          [
            'last year',
            'el año pasado',
            'I went to the beach last year.',
            'Fui a la playa el año pasado.',
            'expresión de tiempo',
          ],
          ['trip', 'viaje', 'The trip was good.', 'El viaje estuvo bien.'],
          [
            'first time',
            'primera vez',
            'It was my first time.',
            'Fue mi primera vez.',
            'expresión',
          ],
          ['photo', 'foto', 'I took a photo yesterday.', 'Ayer tomé una foto.'],
          [
            'beautiful',
            'bonito; hermoso',
            'The beach was beautiful.',
            'La playa estaba hermosa.',
            'adjetivo',
          ],
          [
            'restaurant',
            'restaurante',
            'I ate at this restaurant yesterday.',
            'Ayer comí en este restaurante.',
          ],
        ],
        recycle: ['beach', 'yesterday'],
        skill: 'grammar.past_vs_perfect',
        rule: 'Have been o have tried cuenta una experiencia sin fecha: I have been to the beach. Si dices cuándo, usa pasado simple: I went to the beach last year. Yesterday, last week y last year son momentos terminados. No uses have been en la misma oración que yesterday para este significado.',
        forms: [
          ['have been', 'he estado; experiencia sin fecha'],
          ['went', 'fui; acción pasada terminada'],
          ['been', 'estado; participio para una experiencia'],
        ],
        examples: [
          ['I have been to this restaurant.', 'He estado en este restaurante.'],
          ['I ate at this restaurant yesterday.', 'Ayer comí en este restaurante.'],
        ],
        dialogue: [
          ['Luis', 'Have you ever been to the beach?', '¿Alguna vez has estado en la playa?'],
          [
            'Ana',
            'Yes, I have. I went to the beach last year.',
            'Sí. Fui a la playa el año pasado.',
          ],
          [
            'Luis',
            'I took a photo yesterday. The beach was beautiful.',
            'Ayer tomé una foto. La playa estaba hermosa.',
          ],
        ],
        tasks: [
          fill(
            'I ____ to the beach yesterday.',
            ['went'],
            'Yesterday pide un pasado terminado: went.',
            'Completa con el pasado de go (ir).',
          ),
          build(
            'I have been to this restaurant.',
            'Sin una fecha terminada puedes hablar de la experiencia con have been.',
          ),
          fix(
            'I have been to the beach yesterday.',
            'I went to the beach yesterday.',
            'Con yesterday usa went, no have been.',
          ),
          write(
            'Cuenta el momento: «Fui a la playa el año pasado».',
            ['I went to the beach last year.', 'Last year I went to the beach.'],
            'Last year es un momento terminado: usa pasado simple.',
          ),
        ],
      },
    ],
  },
  {
    title: 'Viajo y trabajo con confianza',
    description: 'Pide con cortesía, sigue indicaciones y explica una elección.',
    cefr: 'A2',
    lessons: [
      {
        title: 'Una petición amable',
        goal: 'Pedir algo de manera cortés con I would like + nombre de lo que necesitas.',
        scene:
          'Llegas a un hotel o pides algo en un restaurante. Una petición breve puede ser amable y clara.',
        words: [
          [
            'would like',
            'quisiera; me gustaría',
            'I would like water, please.',
            'Quisiera agua, por favor.',
            'expresión verbal',
          ],
          [
            'a glass of',
            'un vaso de',
            'I would like a glass of water.',
            'Quisiera un vaso de agua.',
            'expresión',
          ],
          ['menu', 'menú', 'I would like the menu, please.', 'Quisiera el menú, por favor.'],
          [
            'check',
            'cuenta (en un restaurante)',
            'I would like the check, please.',
            'Quisiera la cuenta, por favor.',
          ],
          [
            'window seat',
            'asiento junto a la ventana',
            'I would like a window seat.',
            'Quisiera un asiento junto a la ventana.',
            'expresión',
          ],
          [
            'aisle seat',
            'asiento junto al pasillo',
            'I would like an aisle seat.',
            'Quisiera un asiento junto al pasillo.',
            'expresión',
          ],
          ['reservation', 'reserva; reservación', 'I have a reservation.', 'Tengo una reserva.'],
          [
            'hotel',
            'hotel',
            'The hotel is near the airport.',
            'El hotel está cerca del aeropuerto.',
          ],
        ],
        recycle: ['please', 'room'],
        skill: 'grammar.would_like',
        rule: 'I would like significa quisiera y permite pedir con cortesía. Hoy úsalo con una cosa: I would like the menu, please. No agregues -s después de would. I’d like es la forma corta de I would like. Usa an antes de un sonido vocal: an aisle seat; la s de aisle no se pronuncia.',
        forms: [
          ['would', 'auxiliar de una petición con would like'],
          ["I'd like", 'I would like, forma corta'],
          ['an', 'un; una (antes de sonido vocal)'],
          ['have', 'tener (con una cosa)'],
        ],
        examples: [
          ['I would like a glass of water, please.', 'Quisiera un vaso de agua, por favor.'],
          ['I would like an aisle seat.', 'Quisiera un asiento junto al pasillo.'],
        ],
        dialogue: [
          ['Ana', 'Hello. I have a reservation.', 'Hola. Tengo una reserva.'],
          ['Luis', 'A small room?', '¿Una habitación pequeña?'],
          [
            'Ana',
            'Yes. I would like a small room, please.',
            'Sí. Quisiera una habitación pequeña, por favor.',
          ],
        ],
        tasks: [
          fill(
            'I would ____ a glass of water, please.',
            ['like'],
            'Would like expresa una petición cortés.',
            'Completa la expresión para pedir «quisiera».',
          ),
          build('I would like the check, please.', 'Would like + the check pide la cuenta.'),
          recall(
            'Recuerda la palabra para «cuenta» en un restaurante de Estados Unidos.',
            'check',
            'Check es la cuenta en este contexto.',
          ),
          write(
            'Pide «Quisiera el menú, por favor».',
            ['I would like the menu, please.', "I'd like the menu, please."],
            'Puedes usar I would like o I’d like para la petición.',
          ),
        ],
      },
      {
        title: 'Encuentro el camino',
        goal: 'Dar dos indicaciones breves con el verbo en forma base.',
        scene:
          'Ayudas a una persona a llegar a un banco cercano. Lees o dices una indicación por paso.',
        words: [
          ['turn', 'girar; dar vuelta', 'Turn left.', 'Gira a la izquierda.', 'verbo'],
          ['left', 'izquierda', 'Turn left at the corner.', 'Gira a la izquierda en la esquina.'],
          ['right', 'derecha', 'Turn right.', 'Gira a la derecha.'],
          ['go straight', 'seguir derecho', 'Go straight.', 'Sigue derecho.', 'expresión verbal'],
          ['street', 'calle', 'The bank is on this street.', 'El banco está en esta calle.'],
          ['corner', 'esquina', 'Turn right at the corner.', 'Gira a la derecha en la esquina.'],
          [
            'next to',
            'junto a; al lado de',
            'The bank is next to the store.',
            'El banco está junto a la tienda.',
            'preposición',
          ],
          [
            'on',
            'en; sobre',
            'The hotel is on this street.',
            'El hotel está en esta calle.',
            'preposición',
          ],
        ],
        recycle: ['bank', 'store'],
        skill: 'grammar.imperatives',
        rule: 'Para dar una indicación directa usa el verbo base sin you: Turn left. Go straight. Puedes agregar please para pedirlo con amabilidad. Da primero una acción y luego otra. At the corner indica en la esquina; next to indica al lado de.',
        forms: [['straight', 'derecho; sin girar']],
        examples: [
          [
            'Go straight. Turn left at the corner.',
            'Sigue derecho. Gira a la izquierda en la esquina.',
          ],
          ['Turn right, please.', 'Gira a la derecha, por favor.'],
        ],
        dialogue: [
          ['Luis', 'Where is the bank?', '¿Dónde está el banco?'],
          [
            'Ana',
            'Go straight. Turn left at the corner.',
            'Sigue derecho. Gira a la izquierda en la esquina.',
          ],
          ['Luis', 'The bank is next to the store?', '¿El banco está junto a la tienda?'],
          ['Ana', 'Yes. It is on this street.', 'Sí. Está en esta calle.'],
        ],
        tasks: [
          fill(
            '____ left at the corner.',
            ['Turn'],
            'Turn inicia una indicación; no hace falta you.',
            'Completa con el verbo que significa «girar».',
          ),
          build('Go straight. Turn right.', 'Primero sigue derecho y después gira a la derecha.'),
          recall(
            'Recuerda la palabra inglesa para «esquina».',
            'corner',
            'Corner significa esquina.',
          ),
          write(
            'Da esta indicación: «Gira a la izquierda, por favor».',
            ['Turn left, please.', 'Please turn left.'],
            'Una indicación usa turn en forma base; please puede ir al inicio o al final.',
          ),
        ],
      },
      {
        title: 'Elijo cómo viajar',
        goal: 'Comparar dos opciones con un adjetivo corto + er + than.',
        scene:
          'Comparas dos opciones de transporte. Más barato o más rápido depende de la situación, no de una regla fija sobre los transportes.',
        words: [
          [
            'cheap',
            'barato; económico',
            'This ticket is cheap.',
            'Este boleto es barato.',
            'adjetivo',
          ],
          ['fast', 'rápido', 'This bus is fast.', 'Este autobús es rápido.', 'adjetivo'],
          ['slow', 'lento', 'This train is slow.', 'Este tren es lento.', 'adjetivo'],
          [
            'than',
            'que (al comparar)',
            'This bus is faster than that bus.',
            'Este autobús es más rápido que ese autobús.',
            'conector',
          ],
          [
            'that',
            'ese; esa; aquel; aquella',
            'That ticket is cheap.',
            'Ese boleto es barato.',
            'determinante',
          ],
          [
            'taxi',
            'taxi',
            'This taxi is faster than that bus.',
            'Este taxi es más rápido que ese autobús.',
          ],
          ['option', 'opción', 'This option is cheaper.', 'Esta opción es más barata.'],
        ],
        recycle: ['bus', 'ticket'],
        skill: 'grammar.comparatives',
        rule: 'Para comparar con estos adjetivos cortos agrega -er: cheap → cheaper, fast → faster, slow → slower. Usa than antes de la segunda opción: This ticket is cheaper than that ticket. Por ahora practica solo estas tres formas. This indica este; that indica ese.',
        forms: [
          ['cheaper', 'más barato; más barata'],
          ['faster', 'más rápido; más rápida'],
          ['slower', 'más lento; más lenta'],
        ],
        examples: [
          ['This ticket is cheaper than that ticket.', 'Este boleto es más barato que ese boleto.'],
          ['This bus is slower than that train.', 'Este autobús es más lento que ese tren.'],
        ],
        dialogue: [
          ['Ana', 'This ticket is cheap.', 'Este boleto es barato.'],
          [
            'Luis',
            'That ticket is cheaper. This train is faster than that bus.',
            'Ese boleto es más barato. Este tren es más rápido que ese autobús.',
          ],
          ['Ana', 'I would like that ticket, please.', 'Quisiera ese boleto, por favor.'],
        ],
        tasks: [
          {
            type: 'cloze',
            prompt: 'Completa con la forma que significa «más rápido».',
            sentence: 'This bus is ____ than that bus.',
            answers: ['faster'],
            reason: 'Fast cambia a faster para comparar.',
          },
          build(
            'This ticket is cheaper than that ticket.',
            'Cheaper expresa más barato; than presenta la otra opción.',
          ),
          recall(
            'Recuerda la palabra inglesa para «opción».',
            'option',
            'Option significa opción.',
          ),
          write(
            'Compara: «Este autobús es más lento que ese tren».',
            ['This bus is slower than that train.'],
            'Slow cambia a slower; usa than antes de that train.',
          ),
        ],
      },
      {
        title: 'Explico lo que busco',
        goal: 'Presentarte para una oportunidad de trabajo y dar una razón con because.',
        scene:
          'Practicas una presentación breve para una oportunidad de trabajo. Puedes cambiar la situación al practicar por tu cuenta; no compartas datos personales reales.',
        words: [
          ['job', 'trabajo; empleo', 'I would like this job.', 'Quisiera este empleo.'],
          ['team', 'equipo', 'I like this team.', 'Me gusta este equipo.'],
          ['learn', 'aprender', 'I want to learn.', 'Quiero aprender.', 'verbo'],
          [
            'because',
            'porque',
            'I study English because I want to learn.',
            'Estudio inglés porque quiero aprender.',
            'conector',
          ],
          ['experience', 'experiencia', 'I have experience.', 'Tengo experiencia.'],
          ['customer', 'cliente', 'I can help a customer.', 'Puedo ayudar a un cliente.'],
          ['available', 'disponible', 'I am available.', 'Estoy disponible.', 'adjetivo'],
        ],
        recycle: ['help', 'work'],
        skill: 'grammar.because',
        rule: 'Because une una idea con su razón: I would like this job because I like this team. Después de because usa una oración con persona y verbo. No confundas because (porque) con una pregunta. Want to learn significa querer aprender; to conecta want con otro verbo.',
        forms: [
          ['want to learn', 'querer aprender'],
          ['learn', 'aprender'],
          ['have experience', 'tener experiencia'],
        ],
        examples: [
          [
            'I would like this job because I like this team.',
            'Quisiera este empleo porque me gusta este equipo.',
          ],
          ['I study English because I want to learn.', 'Estudio inglés porque quiero aprender.'],
        ],
        dialogue: [
          ['Luis', 'Hello. I am Luis. I have experience.', 'Hola. Soy Luis. Tengo experiencia.'],
          ['Ana', 'Can you help a customer?', '¿Puedes ayudar a un cliente?'],
          [
            'Luis',
            'Yes. I would like this job because I like this team.',
            'Sí. Quisiera este empleo porque me gusta este equipo.',
          ],
        ],
        tasks: [
          fill(
            'I study English ____ I want to learn.',
            ['because'],
            'Because presenta la razón para estudiar inglés.',
            'Conecta la razón con la palabra que significa «porque».',
          ),
          build(
            'I would like this job because I like this team.',
            'Primero expresa lo que buscas y después da la razón con because.',
          ),
          recall('Recuerda la palabra inglesa para «equipo».', 'team', 'Team significa equipo.'),
          write(
            'Da esta razón: «Estudio inglés porque quiero aprender».',
            ['I study English because I want to learn.'],
            'Después de because la razón es una oración completa: I want to learn.',
          ),
        ],
      },
    ],
  },
];
