import type { ChapterLessonSource } from '@lingoquest/course-pack';
import { mexicoChapterLessons } from './mexico-chapter-lessons';

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
      { en: 'Excuse me.', es: 'Disculpa.' },
      { en: 'Can you help me?', es: '¿Me puedes ayudar?' },
      { en: 'I need help.', es: 'Necesito ayuda.' },
    ],
    grammarEs:
      'Luz puede decir «I am Luz», «I’m Luz» o «My name is Luz». Para presentarte, cambia «Luz» por tu nombre. Con «my name», usa «is». Para pedir ayuda, empieza con «Excuse me. Can you help me?». Si necesitas ayuda de inmediato, di «I need help». Pregunta por un lugar con «Where is…?» y responde con «It’s next to…» para ubicarlo al lado de otro lugar. «It’s» significa «it is».',
    question: {
      promptEs: '¿Dónde queda la parada que busca Sam?',
      options: ['Al lado de la mesa de bienvenida', 'Al lado del parque', 'Dentro del parque'],
      answerIndex: 1,
      feedbackEs: 'Luz dice «It’s next to the park». «Next to» indica que está al lado.',
    },
    practiceEs:
      'Practica en dos turnos. Primero, pídele ayuda a Luz y pregúntale dónde está la parada. Después, saluda a Sam con tu nombre y dile que la parada está al lado del parque.',
    model: {
      en: 'Excuse me. Can you help me? Where is the bus stop? Hi! My name is Alex. The bus stop is next to the park.',
      es: 'Disculpa. ¿Me puedes ayudar? ¿Dónde está la parada del bus? ¡Hola! Me llamo Alex. La parada del bus está al lado del parque.',
    },
  },
  mexico: [
    {
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
        { en: 'go to the market', es: 'ir al mercado' },
        { en: 'buy fruit', es: 'comprar fruta' },
        { en: 'buy bread', es: 'comprar pan' },
        { en: 'come with me', es: 'venir conmigo' },
      ],
      grammarEs:
        'Para hablar de rutinas, compara «I go» con «she goes» y «I buy» con «he buys». Para preguntar, usa «do» con «I», «you», «we» o «they» y «does» con «he», «she» o «it». Luego va el sujeto y el verbo base: «What time do you go?» y «What time does she go?». Practica cambiando «you» por «she» en la primera pregunta. Usa «at» con una hora y «on» con un día: «at eight», «on Saturdays».',
      question: {
        promptEs: '¿Con quién puede ir Eva al mercado mañana y a qué hora?',
        options: [
          'Con Inés a las ocho',
          'Con la hermana de Inés a las ocho',
          'Con Inés a las diez',
        ],
        answerIndex: 0,
        feedbackEs:
          'La hermana de Inés va al mercado a las diez los sábados. Para mañana, Inés invita a Eva a ir con ella a las ocho.',
      },
      practiceEs:
        'Escribe o di un mensaje para una visitante. Tú compras fruta a las nueve y tu hermano compra pan a las diez. Pregúntale a qué hora va al mercado e invítala a acompañarte.',
      model: {
        en: 'I buy fruit at nine. My brother buys bread at ten. What time do you go to the market? You can come with me at nine.',
        es: 'Compro fruta a las nueve. Mi hermano compra pan a las diez. ¿A qué hora vas al mercado? Puedes venir conmigo a las nueve.',
      },
    },
    ...mexicoChapterLessons,
  ],
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
        en: 'I’d like an egg arepa and a lemonade to go.',
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
      { en: 'orange juice', es: 'jugo de naranja' },
    ],
    grammarEs:
      '«I like» expresa un gusto. «I’d like» sirve para pedir algo ahora. «I’d» es la forma corta de «I would». Añade «please» para ser amable y «to go» para pedir algo para llevar. Para una unidad, usa «a» antes de un sonido consonante («a lemonade») y «an» antes de un sonido vocal («an egg arepa»). Usa un número y el plural para dos o más («two egg arepas») y «some» para una cantidad no especificada («some water»). Para preguntar si tienen algo, usa «Do you have…?».',
    question: {
      promptEs: '¿Qué pidió June?',
      options: [
        'Dos arepas de huevo y agua',
        'Una arepa de queso y una limonada',
        'Una arepa de huevo y una limonada para llevar',
      ],
      answerIndex: 2,
      feedbackEs:
        'June dice «I’d like an egg arepa and a lemonade to go». Las otras dos arepas son de Mateo.',
    },
    practiceEs:
      'El local ya no tiene limonada. Pide dos arepas de huevo y agua para llevar. Usa la forma cortés que empieza con «I’d» y pregunta si hay jugo de naranja.',
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
      { en: 'go → went', es: 'ir → fui, fue' },
      { en: 'buy → bought', es: 'comprar → compré, compró' },
      { en: 'meet → met', es: 'encontrarse con alguien → me encontré, se encontró' },
      { en: 'see → saw', es: 'ver → vi, vio' },
      { en: 'main entrance', es: 'entrada principal' },
      { en: 'a fair', es: 'una feria' },
      { en: 'fruit', es: 'fruta' },
      { en: 'arrive', es: 'llegar' },
    ],
    grammarEs:
      'Para contar lo que pasó ayer, usa el pasado. Algunos verbos cambian de forma: «go» pasa a «went», «buy» a «bought», «meet» a «met» y «see» a «saw». Compara «I saw Ana» con «Did you see Ana?» y «I didn’t see Ana». Después de «did» o «didn’t» va el verbo base, sin la forma de pasado. Para preguntar por la hora, empieza con «What time did…?».',
    question: {
      promptEs: '¿Qué hizo Diego antes de encontrarse con Ana?',
      options: ['Llamó a Tomás', 'Compró pan', 'Se reunió con Tomás en el café'],
      answerIndex: 1,
      feedbackEs: 'Diego dice «First, I bought bread. Then I met Ana». Primero compró pan.',
    },
    practiceEs:
      'Cuenta que ayer fuiste a una feria, viste a Ana y después compraste fruta. Usa las tres formas de pasado de la lista. Pregunta a qué hora llegó Tomás con «What time did…?».',
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
      { en: 'put the bowls on the table', es: 'poner los tazones en la mesa' },
      { en: 'then', es: 'luego, después' },
    ],
    grammarEs:
      'Usa el presente simple para hábitos («Jo usually sets the table»). Para una acción en curso, usa «am», «is» o «are» y la forma en «-ing»: «I’m washing», «she’s stirring», «we’re cutting». En «stirring» y «cutting» se duplica la última consonante de «stir» y «cut». Para ordenar tareas, usa «first» para lo primero y «then» para lo siguiente.',
    question: {
      promptEs: 'Escucha el mensaje. ¿Quién está lavando las verduras y qué está haciendo Jo?',
      listening: {
        en: 'Jo is cutting the bread. Rafa is stirring the soup. Alex is washing the vegetables.',
        es: 'Jo está cortando el pan. Rafa está revolviendo la sopa. Alex está lavando las verduras.',
      },
      options: [
        'Jo lava las verduras y Alex corta el pan',
        'Rafa lava las verduras y Jo revuelve la sopa',
        'Alex lava las verduras y Jo corta el pan',
      ],
      answerIndex: 2,
      feedbackEs:
        'Escuchas «Alex is washing the vegetables» y «Jo is cutting the bread». En este mensaje se cambiaron las tareas de Jo y Alex.',
    },
    practiceEs:
      'En otra cocina, tú sueles cortar el pan, pero hoy estás revolviendo la sopa. Jo está cortando el pan. Cuéntale a alguien qué hace cada persona y luego pídele que ponga los tazones en la mesa.',
    model: {
      en: 'I usually cut the bread, but today I’m stirring the soup. Jo is cutting the bread. Then put the bowls on the table, please.',
      es: 'Normalmente corto el pan, pero hoy estoy revolviendo la sopa. Jo está cortando el pan. Después pon los tazones en la mesa, por favor.',
    },
  },
  chile: {
    title: 'Un nuevo plan en Lisboa',
    objectiveEs: 'Confirma cómo cambia un encuentro en Belém y ofrece avisar al grupo. El pronóstico y los horarios son ficticios.',
    dialogue: [
      {
        speaker: 'Luz',
        en: 'We’re going to take the tram to Belém and meet you by the waterfront at four.',
        es: 'Vamos a tomar el tranvía a Belém y nos vemos contigo junto al río a las cuatro.',
      },
      {
        speaker: 'Inês',
        en: 'The forecast says it’s going to rain at three. The cultural center is open until six.',
        es: 'El pronóstico dice que va a llover a las tres. El centro cultural está abierto hasta las seis.',
      },
      {
        speaker: 'Sam',
        en: 'Let’s meet inside the cultural center at four, then. We won’t wait by the river.',
        es: 'Entonces reunámonos dentro del centro cultural a las cuatro. No esperaremos junto al río.',
      },
      {
        speaker: 'Luz',
        en: 'I’ll text the group now. See you inside at four!',
        es: 'Ahora mismo le mandaré un mensaje al grupo. ¡Nos vemos adentro a las cuatro!',
      },
    ],
    vocabulary: [
      { en: 'by the waterfront', es: 'junto a la orilla del río, en este caso el Tajo' },
      { en: 'forecast', es: 'pronóstico' },
      { en: 'until six', es: 'hasta las seis' },
      { en: 'inside', es: 'dentro de' },
      { en: 'text the group', es: 'mandarle un mensaje al grupo' },
      { en: 'library', es: 'biblioteca' },
      { en: 'tram', es: 'tranvía' },
    ],
    grammarEs:
      'Para un plan ya acordado, usa «be going to» más el verbo base: «We’re going to meet at four». También sirve para una predicción basada en lo que sabes: «It’s going to rain». «Let’s meet inside» es una propuesta. Para una decisión o una oferta en el momento, usa «will»: «I’ll text the group». «I’ll» significa «I will» y «won’t» significa «will not».',
    question: {
      promptEs: '¿Dónde y a qué hora se encontrarán en Belém?',
      options: [
        'Dentro del centro cultural a las cuatro',
        'Junto al río a las cuatro',
        'Dentro del centro cultural a las seis',
      ],
      answerIndex: 0,
      feedbackEs:
        'Sam dice «Let’s meet inside the cultural center at four». El centro cierra a las seis, pero el encuentro sigue a las cuatro.',
    },
    practiceEs:
      'En Alfama, el grupo planea reunirse en una plaza a las cinco, pero va a llover. Explica el plan con «going to», propón la biblioteca a la misma hora y ofrece avisar al grupo.',
    model: {
      en: 'We’re going to meet in the square at five, but it’s going to rain. Let’s meet at the library at five instead. I’ll text the group.',
      es: 'Vamos a reunirnos en la plaza a las cinco, pero va a llover. Mejor reunámonos en la biblioteca a las cinco. Le mandaré un mensaje al grupo.',
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
      { en: 'take → took → taken', es: 'formas de «tomar» un medio de transporte' },
      { en: 'buy → bought → bought', es: 'formas de «comprar»' },
      { en: 'bring → brought → brought', es: 'formas de «traer»' },
      { en: 'blanket', es: 'manta' },
    ],
    grammarEs:
      'Forma el presente perfecto con «have» o «has» y un participio. En «take → took → taken», «took» es el pasado y «taken» el participio. Pregunta por una experiencia sin fecha con «Have you ever taken…?». Para ubicarla en un período terminado, usa pasado simple: «I took it last June». En una lista de preparativos, pon «already» o «just» antes del participio («I’ve already bought…», «I’ve just packed…»). Pon «yet» al final de preguntas y negativas («Have you printed them yet?», «I haven’t printed them yet»).',
    question: {
      promptEs: '¿Qué falta hacer con los boletos?',
      options: ['Comprarlos', 'Guardarlos en el teléfono', 'Imprimirlos'],
      answerIndex: 2,
      feedbackEs:
        'Nico ya compró los boletos y los tiene en su teléfono. «I haven’t printed them yet» indica que aún no los imprimió.',
    },
    practiceEs:
      'Organizan un día de campo. Di que ya compraste la comida con «already» y que acabas de guardar el agua con «just». Pregunta a tu compañera si ya trajo una manta con «yet».',
    model: {
      en: 'I’ve already bought the food and I’ve just packed the water. Have you brought a blanket yet?',
      es: 'Ya compré la comida y acabo de guardar el agua. ¿Ya trajiste una manta?',
    },
  },
  'new-york': {
    title: 'Encontrar la mejor ruta',
    objectiveEs: 'Pregunta qué necesita el grupo y compara tres rutas entre Kowloon y la isla de Hong Kong. Los tiempos, precios y avisos son ficticios.',
    dialogue: [
      {
        speaker: 'Sam',
        en: 'We’re meeting in Central. What matters most to you: time, cost, or step-free access?',
        es: 'Nos vemos en Central. ¿Qué te importa más: el tiempo, el costo o el acceso sin escalones?',
      },
      {
        speaker: 'Luz',
        en: 'I need step-free access. I’m traveling with a heavy suitcase.',
        es: 'Necesito acceso sin escalones. Viajo con una maleta pesada.',
      },
      {
        speaker: 'Mei',
        en: 'The MTR takes ten minutes and costs twelve Hong Kong dollars. It’s the fastest option, but our elevator is out of service. The ferry takes twenty minutes and costs five dollars. The pier has a ramp.',
        es: 'El metro tarda diez minutos y cuesta doce dólares de Hong Kong. Es la opción más rápida, pero nuestro elevador está fuera de servicio. El ferry tarda veinte minutos y cuesta cinco dólares. El muelle tiene una rampa.',
      },
      {
        speaker: 'Sam',
        en: 'A taxi takes fifteen minutes and costs sixty dollars. The Star Ferry is the cheapest option. Let’s take it because the pier has a ramp.',
        es: 'Un taxi tarda quince minutos y cuesta sesenta dólares. El Star Ferry es la opción más barata. Tomémoslo porque el muelle tiene una rampa.',
      },
      {
        speaker: 'Luz',
        en: 'It’s slower, so I’ll leave earlier. Which way is the pier?',
        es: 'Es más lento, así que saldré antes. ¿Por dónde se llega al muelle?',
      },
      {
        speaker: 'Mei',
        en: 'Walk toward the waterfront and follow the signs for the Star Ferry.',
        es: 'Camina hacia el puerto y sigue los letreros del Star Ferry.',
      },
    ],
    vocabulary: [
      { en: 'faster than', es: 'más rápido que' },
      { en: 'elevator', es: 'elevador' },
      { en: 'out of service', es: 'fuera de servicio' },
      { en: 'ramp', es: 'rampa' },
      { en: 'step-free access', es: 'acceso sin escalones' },
      { en: 'pier', es: 'muelle' },
      { en: 'ferry', es: 'ferry, transbordador' },
    ],
    grammarEs:
      'Compara dos opciones con «faster than», «slower than» o «more accessible than». Para destacar una opción de un grupo, usa «the fastest» o «the cheapest». Después de «because», indica un motivo. Después de «so», indica un resultado («It’s slower, so I’ll leave earlier»).',
    question: {
      promptEs: '¿Por qué el grupo elige el Star Ferry en este viaje?',
      options: [
        'Es el medio más rápido y los otros dos están fuera de servicio',
        'El muelle tiene rampa y el elevador de la estación de metro está fuera de servicio',
        'El taxi cuesta menos que el ferry y el grupo tiene prisa',
      ],
      answerIndex: 1,
      feedbackEs:
        'El metro tarda menos, pero en este caso el elevador no funciona. Sam elige el ferry porque Luz necesita acceso sin escalones y el muelle tiene una rampa.',
    },
    practiceEs:
      'Entrevista a otro viajero. Pregúntale si prefiere ahorrar dinero o llegar antes. Imagina que tiene tiempo y quiere ahorrar. Compara el ferry con el metro y el taxi, y explica tu recomendación.',
    model: {
      en: 'What matters most to you: time or cost? The ferry is slower than the MTR, but it’s the cheapest option. I’d take the ferry because you want to save money.',
      es: '¿Qué te importa más: el tiempo o el costo? El ferry es más lento que el metro, pero es la opción más barata. Tomaría el ferry porque quieres ahorrar.',
    },
  },
  toronto: {
    title: 'Inscripción en el centro comunitario',
    objectiveEs: 'Solicita un lugar, deletrea tu apellido y confirma qué debes llevar.',
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
      { en: 'How do you spell your last name?', es: '¿Cómo se deletrea tu apellido?' },
      { en: 'A, B, C, D, E, F, G.', es: 'Letras de la A a la G.' },
      { en: 'H, I, J, K, L, M, N.', es: 'Letras de la H a la N.' },
      { en: 'O, P, Q, R, S, T, U.', es: 'Letras de la O a la U.' },
      { en: 'V, W, X, Y, Z.', es: 'Letras de la V a la Z.' },
      { en: 'space, hyphen, apostrophe', es: 'espacio, guion, apóstrofo' },
      { en: 'accent mark', es: 'acento escrito' },
      { en: 'N with a tilde', es: 'Ñ, una N con virgulilla' },
    ],
    grammarEs:
      '«Have to» indica una obligación. «Don’t have to» significa que algo es opcional y «can» indica permiso. «Attend» significa asistir a una clase y «assist» significa ayudar. Si te preguntan «How do you spell your last name?», di «That’s…» y nombra cada letra. Escucha el alfabeto y practica dejando una pausa entre letras. En Estados Unidos, Z suena «zee». En Canadá también puedes oír «zed». En un apellido como «de la Cruz», di «space» entre palabras. Para un guion o apóstrofo, di «hyphen» o «apostrophe». Puedes indicar un acento escrito con «with an accent mark» y la letra ñ con «N with a tilde».',
    question: {
      promptEs: '¿Qué tiene que llevar Cruz a la clase?',
      options: ['Un cuaderno', 'Una identificación con foto', 'Una foto sin identificación'],
      answerIndex: 1,
      feedbackEs:
        'Debe llenar el formulario y llevar una identificación con foto. Puede llevar un cuaderno si quiere.',
    },
    practiceEs:
      'Solicita un cupo en la clase del viernes. Di tu apellido y deletrea cada parte en voz alta con el alfabeto de la lista. Incluye los espacios o signos que correspondan. Luego pregunta si tienes que llevar una identificación con foto.',
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
      'Para un resultado futuro que depende de algo, usa «if» + presente simple y «will» en el resultado: «If I take the bus, I’ll be late». Con «when» das por hecho que algo pasará: «I’ll text when I get there». Usa «when I get there» para el momento de llegada. Practica con dos rutas: «If I take the bus, I’ll be late. If I walk, I’ll get there on time».',
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
      'Escribe a la oficina para avisar que el metro está suspendido y que irás a pie. Usa «if» para decir a qué hora llegarás si sales ahora. Usa «when» para explicar en qué momento enviarás otro mensaje.',
    model: {
      en: 'Subway service is suspended, so I’ll walk. If I leave now, I’ll arrive at nine forty. I’ll text when I get there.',
      es: 'Se suspendió el servicio de metro, así que iré a pie. Si salgo ahora, llegaré a las nueve y cuarenta. Les mandaré un mensaje cuando llegue.',
    },
  },
} satisfies Record<string, ChapterLessonSource>;
