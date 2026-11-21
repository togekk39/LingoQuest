import type { ChapterLessonSource } from '@lingoquest/course-pack';

export const westernChapterLessons = {
  home: {
    title: 'Un saludo en la plaza',
    objectiveEs: 'Preséntate y ayuda a Sam a encontrar la parada y su mochila.',
    dialogue: [
      { speaker: 'Sam', en: 'Hi! My name is Sam.', es: '¡Hola! Me llamo Sam.' },
      { speaker: 'Luz', en: 'Hi! I am Luz.', es: '¡Hola! Soy Luz.' },
      { speaker: 'Sam', en: 'Where is the bus stop?', es: '¿Dónde está la parada del bus?' },
      { speaker: 'Luz', en: 'It’s next to the park.', es: 'Está al lado del parque.' },
      { speaker: 'Sam', en: 'My bag is blue.', es: 'Mi mochila es azul.' },
    ],
    vocabulary: [
      { en: 'Hi', es: 'Hola' },
      { en: 'bus stop', es: 'parada del bus' },
      { en: 'next to', es: 'al lado de' },
      { en: 'park', es: 'parque' },
      { en: 'a blue bag', es: 'una mochila azul' },
    ],
    grammarEs:
      'Di «I am Luz» para presentarte. Con «my name», usa «is» («My name is Luz»). Pregunta por un lugar con «Where is…?» e indica su ubicación con «It’s next to…».',
    question: {
      promptEs: '¿Dónde queda la parada que busca Sam?',
      options: ['Al lado de la mesa de bienvenida', 'Al lado del parque', 'Dentro del parque'],
      answerIndex: 1,
      feedbackEs: 'Luz dice «It’s next to the park». «Next to» indica que está al lado.',
    },
    practiceEs:
      'Saluda a Sam con tu nombre. Dile que la parada está al lado del parque. Usa el modelo de Luz y cambia su nombre por el tuyo.',
    model: {
      en: 'Hi! My name is Luz. The bus stop is next to the park.',
      es: '¡Hola! Me llamo Luz. La parada del bus está al lado del parque.',
    },
  },
  mexico: {
    title: 'Una mañana en el mercado',
    objectiveEs: 'Compara rutinas y usa los horarios para organizar una visita al mercado.',
    dialogue: [
      {
        speaker: 'Eva',
        en: 'I have breakfast at seven. When do you go to the market?',
        es: 'Desayuno a las siete. ¿Cuándo vas al mercado?',
      },
      {
        speaker: 'Inés',
        en: 'I usually go at eight. My sister goes at ten.',
        es: 'Normalmente voy a las ocho. Mi hermana va a las diez.',
      },
      {
        speaker: 'Eva',
        en: 'Does she go every day?',
        es: '¿Ella va todos los días?',
      },
      {
        speaker: 'Inés',
        en: 'No, she goes on Saturdays. You can come with me at eight tomorrow.',
        es: 'No, va los sábados. Mañana puedes venir conmigo a las ocho.',
      },
    ],
    vocabulary: [
      { en: 'have breakfast', es: 'desayunar' },
      { en: 'usually', es: 'normalmente' },
      { en: 'every day', es: 'todos los días' },
      { en: 'on Saturdays', es: 'los sábados' },
      { en: 'at eight', es: 'a las ocho' },
    ],
    grammarEs:
      'En presente simple, usa «I go» con «I» y «she goes» con «she». En preguntas, «Does she go?» lleva «go» sin la terminación de «goes». Usa «at» para indicar la hora.',
    question: {
      promptEs: '¿Con quién puede ir Eva al mercado mañana y a qué hora?',
      options: ['Con Inés a las ocho', 'Con la hermana de Inés a las ocho', 'Con Inés a las diez'],
      answerIndex: 0,
      feedbackEs:
        'La hermana sale a las diez los sábados. Inés invita a Eva a ir con ella a las ocho.',
    },
    practiceEs:
      'Escribe o di un mensaje para una visitante. Tú compras fruta a las nueve y tu hermano compra pan a las diez. Invítala a acompañarte.',
    model: {
      en: 'I buy fruit at nine. My brother buys bread at ten. You can come with me at nine.',
      es: 'Compro fruta a las nueve. Mi hermano compra pan a las diez. Puedes venir conmigo a las nueve.',
    },
  },
  colombia: {
    title: 'Un pedido para llevar',
    objectiveEs:
      'Pide cantidades concretas y elige una alternativa cuando se acaba un ingrediente.',
    dialogue: [
      {
        speaker: 'Mateo',
        en: 'I like cheese arepas. I’d like two cheese arepas and some water, please.',
        es: 'Me gustan las arepas de queso. Quisiera dos arepas de queso y agua, por favor.',
      },
      {
        speaker: 'Elena',
        en: 'We’re out of cheese, but we have egg arepas.',
        es: 'Se nos acabó el queso, pero tenemos arepas de huevo.',
      },
      {
        speaker: 'Mateo',
        en: 'Okay, two egg arepas for me. What would you like, June?',
        es: 'Bueno, dos arepas de huevo para mí. ¿Qué quisieras, June?',
      },
      {
        speaker: 'June',
        en: 'I’d like an egg arepa and a lemonade, to go.',
        es: 'Quisiera una arepa de huevo y una limonada para llevar.',
      },
      {
        speaker: 'Elena',
        en: 'That’s three egg arepas, some water, and one lemonade.',
        es: 'Son tres arepas de huevo, agua y una limonada.',
      },
    ],
    vocabulary: [
      { en: 'we’re out of', es: 'se nos acabó' },
      { en: 'egg', es: 'huevo' },
      { en: 'some water', es: 'un poco de agua' },
      { en: 'a lemonade', es: 'una limonada' },
      { en: 'to go', es: 'para llevar' },
    ],
    grammarEs:
      '«I like» expresa un gusto. «I’d like» sirve para pedir. Para una sola unidad, usa «a» antes de un sonido consonante («a lemonade») y «an» antes de un sonido vocal («an egg arepa»). Usa «some» para una cantidad no especificada («some water»).',
    question: {
      promptEs: '¿Qué pidió June?',
      options: [
        'Dos arepas de huevo y agua',
        'Una arepa de queso y una limonada',
        'Una arepa de huevo y una limonada para llevar',
      ],
      answerIndex: 2,
      feedbackEs:
        'June dice «I’d like an egg arepa and a lemonade, to go». Las dos arepas son de Mateo.',
    },
    practiceEs:
      'El local ya no tiene limonada. Pide dos arepas de huevo y agua para llevar. Luego pregunta si hay jugo de naranja.',
    model: {
      en: 'I’d like two egg arepas and some water to go, please. Do you have orange juice?',
      es: 'Quisiera dos arepas de huevo y agua para llevar, por favor. ¿Tienen jugo de naranja?',
    },
  },
  peru: {
    title: '¿Qué pasó en el mercado?',
    objectiveEs: 'Ordena dos recuerdos de una visita y pregunta por un dato que falta.',
    dialogue: [
      {
        speaker: 'Nora',
        en: 'Did you go to the market yesterday?',
        es: '¿Fuiste al mercado ayer?',
      },
      {
        speaker: 'Diego',
        en: 'Yes. First, I bought bread. Then I met Ana by the main entrance.',
        es: 'Sí. Primero compré pan. Después me encontré con Ana junto a la entrada principal.',
      },
      {
        speaker: 'Nora',
        en: 'Did you see Tomás there?',
        es: '¿Viste a Tomás ahí?',
      },
      {
        speaker: 'Diego',
        en: 'No, I didn’t see him. Ana called him, and he met us at the café at eleven.',
        es: 'No, no lo vi. Ana lo llamó y él se reunió con nosotros en el café a las once.',
      },
    ],
    vocabulary: [
      { en: 'yesterday', es: 'ayer' },
      { en: 'first', es: 'primero' },
      { en: 'then', es: 'después' },
      { en: 'bought', es: 'compró, compré' },
      { en: 'main entrance', es: 'entrada principal' },
    ],
    grammarEs:
      'Cuenta hechos terminados con el pasado del verbo («I bought bread»). Usa la forma base después de «did» y «didn’t» («Did you buy bread?», «I didn’t buy bread»).',
    question: {
      promptEs: '¿Qué hizo Diego antes de encontrarse con Ana?',
      options: ['Llamó a Tomás', 'Compró pan', 'Se reunió con Tomás en el café'],
      answerIndex: 1,
      feedbackEs: 'Diego dice «First, I bought bread. Then I met Ana». Primero compró pan.',
    },
    practiceEs:
      'Cuenta que ayer fuiste a una feria, viste a Ana y después compraste fruta. Pregunta a qué hora llegó Tomás.',
    model: {
      en: 'Yesterday I went to a fair. I saw Ana, and then I bought fruit. What time did Tomás arrive?',
      es: 'Ayer fui a una feria. Vi a Ana y después compré fruta. ¿A qué hora llegó Tomás?',
    },
  },
  brazil: {
    title: 'El almuerzo en equipo',
    objectiveEs: 'Distingue tareas habituales y tareas en curso para orientar al equipo de cocina.',
    dialogue: [
      {
        speaker: 'Rafa',
        en: 'Jo usually sets the table, but today she’s washing the vegetables.',
        es: 'Jo normalmente pone la mesa, pero hoy está lavando las verduras.',
      },
      {
        speaker: 'Jo',
        en: 'Rafa is stirring the soup. Can you cut the bread, Alex?',
        es: 'Rafa está revolviendo la sopa. ¿Puedes cortar el pan, Alex?',
      },
      { speaker: 'Alex', en: 'Sure. What comes next?', es: 'Claro. ¿Qué sigue?' },
      {
        speaker: 'Jo',
        en: 'First, cut the bread. Then put the bowls on the table.',
        es: 'Primero corta el pan. Luego pon los tazones en la mesa.',
      },
    ],
    vocabulary: [
      { en: 'set the table', es: 'poner la mesa' },
      { en: 'wash the vegetables', es: 'lavar las verduras' },
      { en: 'stir the soup', es: 'revolver la sopa' },
      { en: 'cut the bread', es: 'cortar el pan' },
      { en: 'bowl', es: 'tazón' },
    ],
    grammarEs:
      'Usa el presente simple para hábitos («Jo usually sets the table»). Para una acción en curso, combina «am», «is» o «are» con la forma en «-ing» («Jo is washing the vegetables»).',
    question: {
      promptEs: '¿Qué está haciendo Rafa y qué hará Alex después de cortar el pan?',
      options: [
        'Rafa corta el pan y Alex pone los tazones',
        'Rafa lava las verduras y Alex revuelve la sopa',
        'Rafa revuelve la sopa y Alex pone los tazones',
      ],
      answerIndex: 2,
      feedbackEs:
        'Jo dice que Rafa está revolviendo la sopa. «Then» señala la segunda tarea de Alex, poner los tazones en la mesa.',
    },
    practiceEs:
      'Preparan un juego de mesa. Di que hoy estás ordenando las cartas y que Jo está contando las fichas. Indica que después deben poner las fichas en la mesa.',
    model: {
      en: 'I’m sorting the cards and Jo is counting the pieces. Then, let’s put the pieces on the table.',
      es: 'Estoy ordenando las cartas y Jo está contando las fichas. Después, pongamos las fichas en la mesa.',
    },
  },
  chile: {
    title: 'Un plan bajo techo',
    objectiveEs: 'Explica un plan anterior y ofrece una solución cuando cambia el pronóstico.',
    dialogue: [
      {
        speaker: 'Sol',
        en: 'We’re going to meet by the water at four.',
        es: 'Vamos a reunirnos junto al mar a las cuatro.',
      },
      {
        speaker: 'Ari',
        en: 'The forecast says it’s going to rain at three. The cultural center is open until six.',
        es: 'El pronóstico dice que va a llover a las tres. El centro cultural está abierto hasta las seis.',
      },
      {
        speaker: 'Sol',
        en: 'Let’s meet inside the cultural center at four, then.',
        es: 'Entonces reunámonos dentro del centro cultural a las cuatro.',
      },
      {
        speaker: 'Ari',
        en: 'I’ll text the group now.',
        es: 'Ahora mismo le mandaré un mensaje al grupo.',
      },
    ],
    vocabulary: [
      { en: 'by the water', es: 'junto al agua' },
      { en: 'forecast', es: 'pronóstico' },
      { en: 'until six', es: 'hasta las seis' },
      { en: 'inside', es: 'dentro de' },
      { en: 'text the group', es: 'mandarle un mensaje al grupo' },
    ],
    grammarEs:
      'Usa «be going to» para un plan ya acordado («We’re going to meet at four»). Usa «will» para una oferta o decisión que haces en el momento («I’ll text the group»). «I’ll» es la forma corta de «I will».',
    question: {
      promptEs: '¿Dónde y a qué hora se reunirán al final?',
      options: [
        'Dentro del centro cultural a las cuatro',
        'Junto al mar a las cuatro',
        'Dentro del centro cultural a las seis',
      ],
      answerIndex: 0,
      feedbackEs:
        'El pronóstico cambia el lugar de la reunión. Las seis es la hora de cierre. La reunión sigue a las cuatro.',
    },
    practiceEs:
      'Iban a reunirse en un parque a las cinco. Propón verse en la biblioteca a las cinco y ofrece avisar al grupo.',
    model: {
      en: 'Let’s meet in the library at five. I’ll text the group.',
      es: 'Reunámonos en la biblioteca a las cinco. Le mandaré un mensaje al grupo.',
    },
  },
  miami: {
    title: 'Antes de salir',
    objectiveEs: 'Pregunta por experiencias y separa lo que ya está listo de lo que falta.',
    dialogue: [
      {
        speaker: 'Kim',
        en: 'Have you ever taken the train to the airport?',
        es: '¿Alguna vez tomaste el tren al aeropuerto?',
      },
      {
        speaker: 'Nico',
        en: 'Yes, I took it last June. I’ve already bought our tickets.',
        es: 'Sí, lo tomé en junio pasado. Ya compré nuestros boletos.',
      },
      {
        speaker: 'Kim',
        en: 'Great. I’ve just packed my bag. Have you printed the tickets yet?',
        es: 'Genial. Acabo de preparar mi maleta. ¿Ya imprimiste los boletos?',
      },
      {
        speaker: 'Nico',
        en: 'I haven’t printed them yet, but I have them on my phone.',
        es: 'Todavía no los imprimí, pero los tengo en mi teléfono.',
      },
    ],
    vocabulary: [
      { en: 'ever', es: 'alguna vez' },
      { en: 'already', es: 'ya' },
      { en: 'just', es: 'acabar de, en «I’ve just packed»' },
      { en: 'yet', es: 'ya en preguntas, todavía en negativas' },
      { en: 'pack my bag', es: 'preparar mi maleta' },
    ],
    grammarEs:
      'Pregunta por una experiencia sin fecha con «Have you ever…?». Si dices cuándo sucedió, usa el pasado simple («I took it last June»). Con «have» y un participio, «already» marca algo que ya hiciste, «just» algo reciente y «yet» algo pendiente en una pregunta o negativa.',
    question: {
      promptEs: '¿Qué falta hacer con los boletos?',
      options: ['Comprarlos', 'Guardarlos en el teléfono', 'Imprimirlos'],
      answerIndex: 2,
      feedbackEs:
        'Nico ya compró los boletos y los tiene en su teléfono. «I haven’t printed them yet» indica que aún no los imprimió.',
    },
    practiceEs:
      'Organizan un día de campo. Di que ya compraste la comida y que acabas de guardar el agua. Pregunta a tu compañera si ya trajo una manta.',
    model: {
      en: 'I’ve already bought the food and I’ve just packed the water. Have you brought a blanket yet?',
      es: 'Ya compré la comida y acabo de guardar el agua. ¿Ya trajiste una manta?',
    },
  },
  'new-york': {
    title: 'La mejor ruta a la entrevista',
    objectiveEs: 'Compara dos trayectos y explica cuál cumple tus necesidades.',
    dialogue: [
      {
        speaker: 'Riley',
        en: 'The subway is faster than the bus. It takes twenty minutes.',
        es: 'El metro es más rápido que el bus. Tarda veinte minutos.',
      },
      {
        speaker: 'Jo',
        en: 'Is there an elevator at the subway station near the office?',
        es: '¿Hay elevador en la estación del metro cerca de la oficina?',
      },
      {
        speaker: 'Riley',
        en: 'The elevator is out of service today. The bus takes thirty minutes, but it has a ramp.',
        es: 'El elevador está fuera de servicio hoy. El bus tarda treinta minutos, pero tiene una rampa.',
      },
      {
        speaker: 'Jo',
        en: 'I’ll take the bus because I need step-free access. It’s slower, so I’ll leave earlier.',
        es: 'Tomaré el bus porque necesito un acceso sin escalones. Es más lento, así que saldré antes.',
      },
    ],
    vocabulary: [
      { en: 'faster than', es: 'más rápido que' },
      { en: 'elevator', es: 'elevador' },
      { en: 'out of service', es: 'fuera de servicio' },
      { en: 'ramp', es: 'rampa' },
      { en: 'step-free access', es: 'acceso sin escalones' },
    ],
    grammarEs:
      'Compara con «faster than», «slower than» o «more accessible than». Después de «because», indica un motivo. Después de «so», indica un resultado («It’s slower, so I’ll leave earlier»).',
    question: {
      promptEs: '¿Por qué Jo elige el bus?',
      options: [
        'El bus llega diez minutos antes',
        'El bus tiene rampa y el elevador del metro está fuera de servicio',
        'El metro tarda treinta minutos y Jo prefiere salir tarde',
      ],
      answerIndex: 1,
      feedbackEs:
        'El metro tarda menos, pero el elevador no funciona. La rampa del bus le permite viajar sin usar escaleras.',
    },
    practiceEs:
      'Avisa a la oficina que tomarás el bus. Di que es más lento que el metro y explica cuándo saldrás para llegar a tiempo.',
    model: {
      en: 'I’ll take the bus. It’s slower than the subway, so I’ll leave at eight to get to the interview on time.',
      es: 'Tomaré el bus. Es más lento que el metro, así que saldré a las ocho para llegar a tiempo a la entrevista.',
    },
  },
  toronto: {
    title: 'Inscripción en el centro comunitario',
    objectiveEs:
      'Solicita un lugar y confirma qué debes llevar, qué puedes llevar y qué no hace falta.',
    dialogue: [
      {
        speaker: 'Cruz',
        en: 'Is there a spot in the Saturday art class?',
        es: '¿Hay cupo en la clase de arte del sábado?',
      },
      {
        speaker: 'Taylor',
        en: 'Yes. To attend, you have to fill out this form and bring a photo ID.',
        es: 'Sí. Para asistir, tienes que llenar este formulario y traer una identificación con foto.',
      },
      {
        speaker: 'Cruz',
        en: 'Do I have to bring a notebook?',
        es: '¿Tengo que traer un cuaderno?',
      },
      {
        speaker: 'Taylor',
        en: 'You don’t have to bring a notebook. You can bring one if you like.',
        es: 'No tienes que traer un cuaderno. Puedes traer uno si quieres.',
      },
      {
        speaker: 'Cruz',
        en: 'Thanks. My last name is Cruz. That’s C, R, U, Z.',
        es: 'Gracias. Mi apellido es Cruz. Se escribe C, R, U, Z.',
      },
    ],
    vocabulary: [
      { en: 'a spot', es: 'un cupo' },
      { en: 'attend', es: 'asistir a un evento' },
      { en: 'assist', es: 'ayudar' },
      { en: 'fill out a form', es: 'llenar un formulario' },
      { en: 'photo ID', es: 'identificación con foto' },
    ],
    grammarEs:
      '«Have to» indica una obligación. «Don’t have to» significa que no es obligatorio. «Can» indica permiso. Para asistir a una clase, usa «attend». «Assist» significa ayudar.',
    question: {
      promptEs: '¿Qué tiene que llevar Cruz a la clase?',
      options: ['Un cuaderno', 'Una identificación con foto', 'Una foto sin identificación'],
      answerIndex: 1,
      feedbackEs:
        'Debe llenar el formulario y llevar una identificación con foto. Puede llevar un cuaderno si quiere.',
    },
    practiceEs:
      'Solicita un cupo en la clase del viernes. Da y deletrea tu apellido. Pregunta si tienes que llevar una identificación con foto.',
    model: {
      en: 'Is there a spot in the Friday class? My last name is Cruz. That’s C, R, U, Z. Do I have to bring a photo ID?',
      es: '¿Hay cupo en la clase del viernes? Mi apellido es Cruz. Se escribe C, R, U, Z. ¿Tengo que llevar una identificación con foto?',
    },
  },
  london: {
    title: 'Un transbordo imprevisto',
    objectiveEs:
      'Combina dos avisos de transporte y confirma una alternativa para llegar a una cita.',
    dialogue: [
      {
        speaker: 'Aviso del metro',
        en: 'Service to the town center is suspended until ten. Use the replacement bus from Exit Two.',
        es: 'El servicio al centro está suspendido hasta las diez. Usa el bus de reemplazo que sale de la salida dos.',
      },
      {
        speaker: 'Aviso del bus',
        en: 'The next replacement bus leaves at nine thirty and arrives downtown at nine fifty.',
        es: 'El próximo bus de reemplazo sale a las nueve y treinta y llega al centro a las nueve y cincuenta.',
      },
      {
        speaker: 'Ellis',
        en: 'My interview starts at nine forty-five. If I take the bus, I’ll be late.',
        es: 'Mi entrevista empieza a las nueve y cuarenta y cinco. Si tomo el bus, llegaré tarde.',
      },
      {
        speaker: 'Robin',
        en: 'It’s a fifteen-minute walk from Exit One. When you reach the library, turn left.',
        es: 'Son quince minutos a pie desde la salida uno. Cuando llegues a la biblioteca, gira a la izquierda.',
      },
      {
        speaker: 'Ellis',
        en: 'It’s nine twenty-five now. I’ll walk and text the office when I get there.',
        es: 'Son las nueve y veinticinco. Iré a pie y le mandaré un mensaje a la oficina cuando llegue.',
      },
    ],
    vocabulary: [
      { en: 'service is suspended', es: 'el servicio está suspendido' },
      { en: 'replacement bus', es: 'bus de reemplazo' },
      { en: 'exit', es: 'salida' },
      { en: 'a fifteen-minute walk', es: 'quince minutos a pie' },
      { en: 'turn left', es: 'girar a la izquierda' },
    ],
    grammarEs:
      'Con «if» expresa una condición («If I take the bus, I’ll be late»). Con «when» indica una acción futura que esperas que ocurra («I’ll text when I get there»). Usa presente simple en la parte que comienza con «if» o «when».',
    question: {
      promptEs: '¿Qué recorrido le permite a Ellis llegar antes de su entrevista?',
      options: [
        'Esperar el metro hasta las diez',
        'Tomar el bus de reemplazo desde la salida dos',
        'Ir a pie desde la salida uno',
      ],
      answerIndex: 2,
      feedbackEs:
        'La entrevista empieza a las nueve y cuarenta y cinco. A pie llega a las nueve y cuarenta, diez minutos antes que el bus.',
    },
    practiceEs:
      'Escribe a la oficina para avisar que el metro está suspendido y que irás a pie. Di que llegarás a las nueve y cuarenta si sales ahora.',
    model: {
      en: 'The subway service is suspended, so I’ll walk. If I leave now, I’ll arrive at nine forty.',
      es: 'El servicio de metro está suspendido, así que iré a pie. Si salgo ahora, llegaré a las nueve y cuarenta.',
    },
  },
} satisfies Record<string, ChapterLessonSource>;
