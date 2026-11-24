import { build, fix, read, type LessonAuthoring, type Task } from './integrated-lessons.ts';

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
          ['try', 'probar (comida)', 'I have tried this food.', 'He probado esta comida.', 'verbo'],
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
        recycle: ['rice', 'go', 'sister'],
        skill: 'grammar.perfect_experiences',
        rule: 'Para decir si algo ha ocurrido en tu vida, usa have con I, you, we y they, o has con he, she e it. Después agrega el participio: try → tried (probado) y be → been (estado). En «I’ve tried this food», I’ve significa I have. En «She has been to the beach twice», has been to habla de visitas y twice cuenta cuántas. Para decir cuándo ocurrió esa visita, usa el pasado simple: «I went to the beach yesterday».',
        forms: [
          ['have', 'auxiliar: he; has; hemos; han'],
          ['has', 'auxiliar con he/she: ha'],
          ['been', 'participio de be: estado'],
          ['been to', 'haber estado en un lugar o haberlo visitado, junto con have o has'],
          ['tried', 'participio de try: probado'],
          ['this', 'este; esta'],
          ["I've", 'I have, forma corta'],
          ['too', 'también, al final de la oración'],
        ],
        examples: [
          ["I've tried this food.", 'He probado esta comida.'],
          ['She has been to the beach twice.', 'Ella ha estado en la playa dos veces.'],
          ['I went to the beach yesterday.', 'Fui a la playa ayer.'],
        ],
        dialogue: [
          ['Ana', "I've been to this city once before.", 'Ya he estado una vez en esta ciudad.'],
          ['Luis', "I've tried this rice before.", 'Ya he probado este arroz.'],
          ['Ana', 'My sister has tried it, too.', 'Mi hermana también lo ha probado.'],
        ],
        tasks: [
          fill(
            'She ____ tried this food.',
            ['has'],
            'She lleva has antes del participio tried.',
            'Completa la experiencia con have o has.',
          ),
          build(
            'I have been to the beach once.',
            'Have + been expresa la experiencia; once indica una vez.',
            ['I have once been to the beach.'],
          ),
          recall(
            'Recuerda la palabra inglesa para «comida».',
            'food',
            'Food significa comida en general.',
          ),
          write(
            'Cuenta que has probado esta comida. Usa have + el participio de try.',
            ['I have tried this food.'],
            'Con I usa have y el participio tried; no añadas una fecha.',
          ),
          read(
            "I've been to the beach once. My sister has been to the beach twice. She has tried this food, too.",
            '¿Quién ha visitado la playa dos veces?',
            ['La hermana de la persona que habla.', 'La persona que habla.', 'Las dos personas.'],
            0,
            'My sister has been to the beach twice expresa que la hermana la visitó dos veces.',
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
        rule: 'En una pregunta de experiencia, mueve have o has al inicio: «You have traveled by train» → «Have you traveled by train?». Si quieres saber si la persona lo ha hecho alguna vez, pon ever antes del participio: «Have you ever traveled by train?». Usa el mismo auxiliar para responder: «Yes, I have» o «No, I haven’t». En inglés estadounidense, traveled se escribe con una sola l.',
        forms: [
          ['traveled', 'viajado (participio de travel)'],
          ['by', 'en; por (medio de transporte)'],
          ["haven't", 'have not, forma corta'],
        ],
        examples: [
          ['Have you ever traveled by train?', '¿Alguna vez has viajado en tren?'],
          ['Has she ever been to this museum?', '¿Alguna vez ha visitado este museo?'],
          ["No, I haven't.", 'No.'],
        ],
        dialogue: [
          ['Luis', 'Have you ever been abroad?', '¿Alguna vez has estado en el extranjero?'],
          ['Ana', 'Yes, I have.', 'Sí.'],
          ['Luis', 'Have you ever been to this museum?', '¿Alguna vez has estado en este museo?'],
          ['Ana', "No, I haven't.", 'No.'],
        ],
        tasks: [
          fill(
            '____ you ever been to this museum?',
            ['Have'],
            'Con you la pregunta empieza con Have.',
            'Completa la pregunta con have o has.',
          ),
          build(
            'Has she ever traveled by train?',
            'Has + she + ever + traveled forma la pregunta.',
            undefined,
            'Ordena las palabras para preguntar si ella ha viajado alguna vez en tren. Pon ever antes del participio.',
          ),
          recall(
            'Escribe la palabra que va antes de been en Have you ____ been abroad? y significa «alguna vez».',
            'ever',
            'Ever pregunta si algo ocurrió en algún momento.',
          ),
          {
            type: 'short_text',
            prompt:
              'Pregunta si la otra persona ha estado en el extranjero. Usa Have you ever + been.',
            answers: ['Have you ever been abroad?', 'Have you ever been abroad before?'],
            reason: 'Have you ever + been pregunta por la experiencia.',
            communicationOnly: {
              answers: ['Have you been abroad?', 'Have you been abroad before?'],
              feedbackEs:
                'Tu pregunta se entiende. Para practicar la forma de esta lección, agrega ever antes de been.',
            },
          },
          read(
            "Luis: Have you ever been abroad? Ana: No, I haven't. Luis: Have you ever traveled by train? Ana: Yes, I have.",
            '¿Qué experiencia dice Ana que sí tiene?',
            ['Estar en el extranjero.', 'Visitar un museo.', 'Viajar en tren.'],
            2,
            'Yes, I have responde a Have you ever traveled by train? La pregunta sobre el extranjero recibió un no.',
          ),
        ],
      },
      {
        title: 'Todavía no',
        goal: 'Expresar que algo aún no ha ocurrido con have not + participio + yet.',
        scene: 'Antes de un viaje, comparas lo que ya tienes listo con lo que aún falta por hacer.',
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
        rule: 'Para decir que un preparativo está pendiente, pon not después de have o has y normalmente deja yet al final. Compara «I’ve packed my bag» (ya preparé mi bolso) con «I haven’t packed my bag yet» (todavía no lo he preparado). Packed es el participio regular de pack. Bought es el participio irregular de buy. Con he o she usa hasn’t: «She hasn’t bought her ticket yet».',
        forms: [
          ['packed', 'preparado; empacado'],
          ['bought', 'comprado (participio de buy)'],
          ["haven't", 'have not, forma corta'],
          ["hasn't", 'has not, forma corta'],
          ['her', 'su; de ella'],
          ['still', 'todavía; aún, en still haven’t'],
        ],
        examples: [
          ["I haven't bought my ticket yet.", 'Todavía no he comprado mi boleto.'],
          ['She has not packed her suitcase yet.', 'Ella todavía no ha preparado su maleta.'],
          ["I've packed my bag.", 'Ya preparé mi bolso.'],
        ],
        dialogue: [
          [
            'Ana',
            "I have my passport, but I haven't packed my bag yet.",
            'Tengo mi pasaporte, pero todavía no he preparado mi bolso.',
          ],
          [
            'Luis',
            "I've packed my suitcase. I haven't bought my ticket yet.",
            'Ya preparé mi maleta. Todavía no he comprado mi boleto.',
          ],
        ],
        tasks: [
          fill(
            'I have ____ bought my ticket yet.',
            ['not'],
            'Not va después de have para negar.',
            'Completa la negación con la palabra que significa «no».',
          ),
          build(
            'She has not packed her suitcase yet.',
            'Has not niega la acción y yet indica que todavía queda pendiente.',
            ['She has not yet packed her suitcase.'],
            'Ordena las palabras para decir que ella todavía no ha preparado su maleta.',
          ),
          recall(
            'Recuerda la palabra inglesa para «pasaporte».',
            'passport',
            'Passport significa pasaporte.',
          ),
          {
            type: 'short_text',
            prompt:
              'Avisa que aún no has comprado tu boleto. Usa have not o haven’t con bought y yet.',
            answers: ['I have not bought my ticket yet.', 'I have not yet bought my ticket.'],
            reason: 'Bought va con have not o haven’t. Yet puede ir al final o después de not.',
            communicationOnly: {
              answers: ['I still have not bought my ticket.'],
              feedbackEs:
                'Con still se entiende que falta comprar el boleto. Agrega yet en lugar de still para practicar la estructura de esta lección.',
            },
          },
          read(
            "Ana has bought her ticket. She hasn't packed her suitcase yet. Her passport is here.",
            '¿Qué paso tiene pendiente Ana?',
            ['Comprar el boleto.', 'Preparar su maleta.', 'Buscar el pasaporte.'],
            1,
            'Hasn’t packed … yet indica que la maleta aún no está lista. Has bought indica que compró el boleto.',
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
          ['trip', 'viaje', 'The trip was good.', 'El viaje salió bien.'],
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
            'La playa estaba muy bonita.',
            'adjetivo',
          ],
          [
            'restaurant',
            'restaurante',
            'I ate at this restaurant yesterday.',
            'Ayer comí en este restaurante.',
          ],
        ],
        recycle: ['beach', 'yesterday', 'before'],
        skill: 'grammar.past_vs_perfect',
        rule: 'Primero pregunta si la experiencia ha ocurrido: «Have you ever been to the beach?». Responde «Yes, I have». Para contar la fecha de esa visita, pasa al pasado simple: «I went to the beach last year». Yesterday, last week y last year fijan un momento que terminó. Si ubicas la visita en ese momento, usa went en vez de have been to.',
        forms: [
          ['have been', 'he estado; experiencia sin fecha'],
          ['went', 'fui; acción pasada terminada'],
          ['been', 'estado; participio para una experiencia'],
          ['took a photo', 'tomé una foto'],
          ['ate', 'comí; pasado de eat'],
        ],
        examples: [
          ["I've been to this restaurant.", 'He estado en este restaurante.'],
          ['I ate at this restaurant yesterday.', 'Ayer comí en este restaurante.'],
          ['I went to the beach last year.', 'Fui a la playa el año pasado.'],
        ],
        dialogue: [
          ['Luis', 'Have you ever been to the beach?', '¿Alguna vez has estado en la playa?'],
          [
            'Ana',
            'Yes, I have. I went to the beach last year.',
            'Sí. Fui a la playa el año pasado.',
          ],
          ['Luis', 'I went yesterday. I took a photo.', 'Yo fui ayer. Tomé una foto.'],
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
            {
              prompt:
                'Conserva yesterday y el lugar. Cambia have been por el pasado de go. Escribe la oración completa.',
              alternatives: ['Yesterday I went to the beach.'],
            },
          ),
          write(
            'Responde cuándo fuiste a la playa: «Fui a la playa el año pasado». Usa go en pasado simple.',
            ['I went to the beach last year.', 'Last year I went to the beach.'],
            'Last year es un momento terminado: usa pasado simple.',
          ),
          read(
            "Ana: I've been to this restaurant before. Luis: I ate at this restaurant yesterday. Ana: I went to the beach yesterday.",
            '¿Quién dice que comió en este restaurante ayer?',
            ['Ana.', 'Luis.', 'Los dos.'],
            1,
            'Luis dice I ate at that restaurant yesterday. Ana sí conoce el restaurante, pero ayer fue a la playa.',
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
          'Pides agua y la cuenta en un restaurante. También puedes usar la misma fórmula para pedir un asiento en un avión.',
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
        rule: 'Para pedir una cosa con cortesía, usa I would like o I’d like y después lo que pides: «I’d like the menu, please». The menu se refiere al menú del lugar. A glass of water pide un vaso, y an aisle seat pide un asiento junto al pasillo. Usa an porque aisle empieza con sonido de vocal y su s es muda.',
        forms: [
          ['would', 'auxiliar de una petición con would like'],
          ["I'd like", 'I would like, forma corta'],
          ['an', 'un; una (antes de sonido vocal)'],
          ['have', 'tener (con una cosa)'],
        ],
        examples: [
          ["I'd like a glass of water, please.", 'Quisiera un vaso de agua, por favor.'],
          ['I would like an aisle seat.', 'Quisiera un asiento junto al pasillo.'],
          ["I'd like the check, please.", 'Quisiera la cuenta, por favor.'],
        ],
        dialogue: [
          ['Luis', 'Hello. Do you have a reservation?', 'Hola. ¿Tiene una reserva?'],
          ['Ana', 'Yes, I do.', 'Sí.'],
          ['Luis', 'This is your table.', 'Esta es su mesa.'],
          [
            'Ana',
            "I'd like the menu and a glass of water, please.",
            'Quisiera el menú y un vaso de agua, por favor.',
          ],
        ],
        tasks: [
          fill(
            'I would ____ a glass of water, please.',
            ['like'],
            'Would like expresa una petición cortés.',
            'Completa la expresión para pedir «quisiera».',
          ),
          build(
            'I would like the check, please.',
            'Would like + the check pide la cuenta. Please puede ir al inicio o al final.',
            ['Please, I would like the check.'],
          ),
          {
            type: 'short_text',
            prompt:
              'Escribe solo el sustantivo en inglés estadounidense que practicamos para pedir la «cuenta» en un restaurante.',
            answers: ['check'],
            reason: 'Check es la cuenta en este contexto.',
            recall: true,
            communicationOnly: {
              answers: ['bill'],
              feedbackEs:
                'Bill también se entiende como «cuenta». En esta lección practicamos check, una forma común en Estados Unidos.',
            },
          },
          {
            type: 'short_text',
            prompt:
              'Pide el menú con cortesía. Practica I would like o I’d like seguido de the menu. Incluye please.',
            answers: ['I would like the menu, please.', 'Please, I would like the menu.'],
            reason: 'I would like o I’d like + the menu permite pedirlo con cortesía.',
            communicationOnly: {
              answers: [
                'Can I have the menu, please?',
                'May I have the menu, please?',
                'The menu, please.',
              ],
              feedbackEs:
                'Pediste el menú con cortesía. Para practicar esta lección, usa I’d like antes de the menu.',
            },
          },
          read(
            "Ana: I'd like a window seat, please. Luis: I'd like an aisle seat. Ana: I'd like a glass of water, too.",
            'Además del agua, ¿qué pide Ana?',
            ['Un asiento junto al pasillo.', 'Un asiento junto a la ventana.', 'La cuenta.'],
            1,
            'Window seat es un asiento junto a la ventana. El asiento junto al pasillo lo pide Luis.',
          ),
        ],
      },
      {
        title: 'Encuentro el camino',
        goal: 'Preguntar por un lugar y dar indicaciones breves con el verbo en forma base.',
        scene:
          'Ayudas a una persona a llegar a un banco cercano. Lees o dices una indicación por paso.',
        words: [
          ['turn', 'girar; dar vuelta', 'Turn left.', 'Gira a la izquierda.', 'verbo'],
          [
            'left',
            'a la izquierda',
            'Turn left at the corner.',
            'Gira a la izquierda en la esquina.',
            'adverbio de dirección',
          ],
          ['right', 'a la derecha', 'Turn right.', 'Gira a la derecha.', 'adverbio de dirección'],
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
        rule: 'Para preguntar por un lugar, usa «Where is the bank?». Para dar una indicación, empieza con el verbo base y omite el sujeto you: «Go straight» (sigue derecho) o «Turn left» (gira a la izquierda). Usa then para indicar el paso siguiente. At the corner indica dónde girar y next to indica que dos lugares están uno al lado del otro.',
        forms: [
          ['straight', 'derecho; sin girar'],
          ['then', 'luego; después'],
        ],
        examples: [
          [
            'Go straight. Then turn left at the corner.',
            'Sigue derecho. Luego gira a la izquierda en la esquina.',
          ],
          ['Turn right, please.', 'Gira a la derecha, por favor.'],
        ],
        dialogue: [
          ['Luis', 'Excuse me. Where is the bank?', 'Disculpa. ¿Dónde está el banco?'],
          [
            'Ana',
            'Go straight. Then turn left at the corner.',
            'Sigue derecho. Luego gira a la izquierda en la esquina.',
          ],
          ['Luis', 'Is the bank next to the store?', '¿El banco está junto a la tienda?'],
          ['Ana', "Yes, it's next to the store.", 'Sí, está junto a la tienda.'],
        ],
        tasks: [
          fill(
            '____ left at the corner.',
            ['Turn'],
            'Turn inicia una indicación; no hace falta you.',
            'Completa con el verbo que significa «girar».',
          ),
          build(
            'Go straight. Turn right.',
            'Primero sigue derecho y después gira a la derecha.',
            undefined,
            'Ordena las palabras para indicar primero que siga derecho y luego que gire a la derecha.',
          ),
          recall(
            'Recuerda la palabra de esta lección para la «esquina» de una calle.',
            'corner',
            'Corner significa esquina.',
          ),
          write(
            'Dile a alguien «Gira a la izquierda, por favor». Usa turn y please.',
            ['Turn left, please.', 'Please turn left.'],
            'Una indicación usa turn en forma base; please puede ir al inicio o al final.',
          ),
          read(
            'Go straight. Then turn right at the corner. The bank is next to the store.',
            '¿Qué debes hacer al llegar a la esquina?',
            ['Seguir derecho.', 'Girar a la izquierda.', 'Girar a la derecha.'],
            2,
            'Turn right at the corner indica que debes girar a la derecha en la esquina.',
          ),
        ],
      },
      {
        title: 'Elijo cómo viajar',
        goal: 'Comparar dos opciones de transporte con un adjetivo en -er seguido de than.',
        scene:
          'En la terminal, comparas el precio de dos boletos y la rapidez de dos opciones de transporte.',
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
        rule: 'Para estas tres palabras, agrega -er: cheap → cheaper, fast → faster, slow → slower. Nombra primero lo que describes y luego la otra opción con than: «This ticket is cheaper than that ticket». This apunta a este boleto y that al otro. Si ya se sabe que hablas de boletos, puedes decir that one en vez de that ticket.',
        forms: [
          ['cheaper', 'más barato; más barata'],
          ['faster', 'más rápido; más rápida'],
          ['slower', 'más lento; más lenta'],
          ['that one', 'ese; esa (en lugar del sustantivo ya mencionado)'],
        ],
        examples: [
          ['This ticket is cheaper than that ticket.', 'Este boleto es más barato que ese boleto.'],
          ['This bus is slower than that train.', 'Este autobús es más lento que ese tren.'],
        ],
        dialogue: [
          ['Ana', 'This ticket is cheap.', 'Este boleto es barato.'],
          [
            'Luis',
            'That one is cheaper. The train is faster than the bus.',
            'Ese es más barato. El tren es más rápido que el autobús.',
          ],
          ['Ana', 'I would like that ticket, please.', 'Quisiera ese boleto, por favor.'],
        ],
        tasks: [
          {
            type: 'cloze',
            prompt: 'Completa con el comparativo de fast («rápido»).',
            sentence: 'This bus is ____ than that bus.',
            answers: ['faster'],
            reason: 'Fast cambia a faster para comparar.',
          },
          build(
            'This ticket is cheaper than that ticket.',
            'Cheaper expresa más barato; than presenta la otra opción.',
            undefined,
            'Ordena las palabras para decir «Este boleto es más barato que ese boleto».',
          ),
          {
            type: 'short_text',
            prompt: 'Recuerda el sustantivo de esta lección que significa «opción».',
            answers: ['option'],
            reason: 'Option significa opción.',
            recall: true,
            communicationOnly: {
              answers: ['choice'],
              feedbackEs:
                'Choice también puede significar «opción». Recuerda el sustantivo que viste en esta lección: option.',
            },
          },
          {
            type: 'short_text',
            prompt:
              'Compara este autobús con ese tren. Usa slow para decir que el autobús es más lento.',
            answers: ['This bus is slower than that train.'],
            reason: 'Slow cambia a slower. Usa than antes de la segunda opción.',
            communicationOnly: {
              answers: [
                'That train is faster than this bus.',
                'This bus is not as fast as that train.',
              ],
              feedbackEs:
                'Tu comparación comunica lo mismo. Aquí practica slow con el final -er: slower than.',
            },
          },
          read(
            'The bus is cheaper than the train. The train is faster than the bus. The taxi is slower than the train.',
            'La persona tiene prisa y puede pagar cualquier opción. ¿Cuál es la más rápida?',
            ['El tren.', 'El autobús.', 'El taxi.'],
            0,
            'El tren es faster than the bus, y el taxi es slower than the train. El tren es más rápido que ambos.',
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
        rule: 'Usa because para explicar un motivo. En «I’d like this job because I want to help customers», la primera parte dice qué quieres y la segunda dice por qué. Después de because va una idea completa, como «I want to help customers». También puedes empezar con la razón: «Because I want to help customers, I’d like this job».',
        forms: [
          ['want to learn', 'querer aprender'],
          ['learn', 'aprender'],
          ['have experience', 'tener experiencia'],
          ['customers', 'clientes'],
          ['why', 'por qué (en una pregunta)'],
        ],
        examples: [
          [
            "I'd like this job because I want to help customers.",
            'Quisiera este empleo porque quiero ayudar a los clientes.',
          ],
          ['I study English because I want to learn.', 'Estudio inglés porque quiero aprender.'],
          [
            "Because I want to help customers, I'd like this job.",
            'Como quiero ayudar a los clientes, quisiera este empleo.',
          ],
        ],
        dialogue: [
          ['Luis', 'Hello. I am Luis. I have experience.', 'Hola. Soy Luis. Tengo experiencia.'],
          ['Ana', 'Why would you like this job?', '¿Por qué te gustaría este empleo?'],
          [
            'Luis',
            "I'd like this job because I want to help customers.",
            'Quisiera este empleo porque quiero ayudar a los clientes.',
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
            'Because introduce la razón. Puedes decirla al inicio o al final.',
            ['Because I like this team, I would like this job.'],
            'Ordena las palabras para decir que quieres este empleo porque te gusta este equipo.',
          ),
          recall('Recuerda la palabra inglesa para «equipo».', 'team', 'Team significa equipo.'),
          write(
            'Te preguntan por qué estudias inglés. Usa because y expresa «Estudio inglés porque quiero aprender».',
            [
              'I study English because I want to learn.',
              'Because I want to learn, I study English.',
            ],
            'Después de because la razón es una oración completa: I want to learn.',
          ),
          read(
            'Ana: I am available. I would like this job because I like this team. Luis: I study English because I want to help customers.',
            '¿Por qué estudia inglés Luis?',
            [
              'Para conseguir ese empleo.',
              'Porque le gusta el equipo.',
              'Para ayudar a los clientes.',
            ],
            2,
            'Luis explica su motivo después de because: I want to help customers.',
          ),
        ],
      },
    ],
  },
];
