import type { ChapterLesson } from '@lingoquest/course-pack';

export const mexicoChapterLessons: ChapterLesson[] = [
  {
    title: 'Tres momentos de la mañana',
    objectiveEs: 'Ordena las actividades que oyes y cuenta tres cosas que haces en un día normal.',
    dialogue: [
      {
        speaker: 'Leo',
        en: 'I get up at six. I have breakfast at seven.',
        es: 'Me levanto a las seis. Desayuno a las siete.',
      },
      {
        speaker: 'Inés',
        en: 'I study in the morning. I work in the afternoon.',
        es: 'Estudio por la mañana. Trabajo por la tarde.',
      },
      {
        speaker: 'Leo',
        en: 'We study English together every day.',
        es: 'Estudiamos inglés juntos todos los días.',
      },
    ],
    vocabulary: [
      { en: 'work', es: 'trabajar' },
      { en: 'study', es: 'estudiar' },
      { en: 'live', es: 'vivir' },
      { en: 'get up', es: 'levantarse' },
      { en: 'have breakfast', es: 'desayunar' },
      { en: 'every day', es: 'todos los días' },
      { en: 'in the morning', es: 'por la mañana' },
      { en: 'in the afternoon', es: 'por la tarde' },
      { en: 'together', es: 'juntos o juntas' },
      { en: 'first', es: 'primero' },
      { en: 'then', es: 'después' },
      { en: 'after breakfast', es: 'después de desayunar' },
    ],
    grammarEs:
      'El presente simple sirve para contar lo que haces habitualmente. Con I, you, we o they, di primero el sujeto, luego el verbo base y finalmente el complemento, si lo hay. «I study English every day» significa «Estudio inglés todos los días». Con «we», di «We study English» y con «they», «They work». Usa el sujeto aunque en español quede implícito. Para contar el orden de un día, puedes empezar con «First, I get up» y seguir con «Then I have breakfast». «After breakfast» indica que la actividad ocurre después de desayunar.',
    question: {
      promptEs: 'Escucha otro mensaje de Leo. ¿En qué orden hace las tres actividades?',
      options: [
        'Desayuna, se levanta y estudia.',
        'Se levanta, desayuna y estudia.',
        'Se levanta, estudia y desayuna.',
      ],
      answerIndex: 1,
      feedbackEs:
        'Primero dice «I get up». Luego desayuna. «I study after breakfast» indica que estudia después de desayunar.',
      listening: {
        en: 'First, I get up. Then I have breakfast. I study after breakfast.',
        es: 'Primero me levanto. Luego desayuno. Estudio después de desayunar.',
      },
    },
    practiceEs:
      'Cuéntale a un compañero tres cosas que haces en un día normal. Elige actividades reales o inventadas. Escribe tres oraciones con I y luego dilas en voz alta. Revisa que cada oración tenga un sujeto y un verbo base y que el orden de tu día se entienda.',
    model: {
      en: 'First, I get up. Then I have breakfast. I work after breakfast.',
      es: 'Primero me levanto. Luego desayuno. Trabajo después de desayunar.',
    },
  },
  {
    title: 'Dos rutinas del barrio',
    objectiveEs: 'Describe hábitos de otras personas y explica con qué frecuencia ocurren.',
    dialogue: [
      {
        speaker: 'Inés',
        en: 'My sister usually reads in the morning.',
        es: 'Mi hermana normalmente lee por la mañana.',
      },
      {
        speaker: 'Leo',
        en: 'My brother cooks in the morning. He never reads in the morning.',
        es: 'Mi hermano cocina por la mañana. Nunca lee por la mañana.',
      },
      {
        speaker: 'Inés',
        en: 'I read in the afternoon. My sister usually cooks in the afternoon.',
        es: 'Yo leo por la tarde. Mi hermana normalmente cocina por la tarde.',
      },
    ],
    vocabulary: [
      { en: 'sister', es: 'hermana' },
      { en: 'brother', es: 'hermano' },
      { en: 'cook', es: 'cocinar' },
      { en: 'read', es: 'leer' },
      { en: 'wash', es: 'lavar' },
      { en: 'usually', es: 'normalmente' },
      { en: 'never', es: 'nunca' },
      { en: 'in the morning', es: 'por la mañana' },
      { en: 'in the afternoon', es: 'por la tarde' },
      { en: 'cooks', es: 'cocina' },
      { en: 'reads', es: 'lee' },
      { en: 'washes', es: 'lava' },
    ],
    grammarEs:
      'Con he, she o un sujeto que nombra a una sola persona, el presente simple cambia: «I cook» → «she cooks», «I read» → «he reads», «I wash» → «she washes». Después de sh, agrega -es. En «cooks» el final suena /s/, en «reads» suena /z/ y en «washes» se agrega una sílaba que suena /ɪz/. Escucha las tres formas del vocabulario y repítelas. Pon usually o never normalmente antes del verbo de acción: «She usually reads» y «He never reads». Never ya expresa negación.',
    question: {
      promptEs:
        'Lee estos dos perfiles. «Nora usually cooks in the morning. Eli never cooks in the morning.» ¿Cuál coincide con lo que leíste?',
      options: [
        'Los dos cocinan por la mañana.',
        'Nora nunca cocina por la mañana.',
        'Eli nunca cocina por la mañana.',
      ],
      answerIndex: 2,
      feedbackEs:
        '«Eli never cooks in the morning» indica que Eli nunca cocina por la mañana. Nora suele cocinar a esa hora.',
    },
    practiceEs:
      'Inventa una rutina para cada persona de una familia. Escribe lo que una persona hace normalmente y lo que la otra nunca hace. Dilo en voz alta y revisa el sujeto, el lugar de usually o never y la terminación del verbo.',
    model: {
      en: 'My sister usually cooks in the afternoon. My brother never reads in the afternoon.',
      es: 'Mi hermana normalmente cocina por la tarde. Mi hermano nunca lee por la tarde.',
    },
  },
  {
    title: 'El reloj y la agenda del barrio',
    objectiveEs: 'Distingue horas que suenan parecidas y localiza un horario en una agenda.',
    dialogue: [
      {
        speaker: 'Leo',
        en: 'On Saturdays the market opens at eight o’clock.',
        es: 'Los sábados el mercado abre a las ocho en punto.',
      },
      {
        speaker: 'Inés',
        en: 'I work at half past ten. I can go to the market in the morning.',
        es: 'Trabajo a las diez y media. Puedo ir al mercado por la mañana.',
      },
      { speaker: 'Leo', en: 'The market closes at noon.', es: 'El mercado cierra al mediodía.' },
    ],
    vocabulary: [
      { en: 'o’clock', es: 'en punto' },
      { en: 'half past', es: 'y media' },
      { en: 'at noon', es: 'al mediodía' },
      { en: 'in the morning', es: 'por la mañana' },
      { en: 'in the afternoon', es: 'por la tarde' },
      { en: 'on Saturdays', es: 'los sábados' },
      { en: 'on Friday', es: 'el viernes' },
      { en: 'on Saturday', es: 'el sábado' },
      { en: 'open', es: 'abrir al público, en el caso de un negocio' },
      { en: 'close', es: 'cerrar al público, en el caso de un negocio' },
      { en: 'seven fifteen', es: 'siete y quince (7:15)' },
      { en: 'seven fifty', es: 'siete y cincuenta (7:50)' },
      { en: 'ten thirteen', es: 'diez y trece (10:13)' },
      { en: 'ten thirty', es: 'diez y treinta (10:30)' },
      { en: 'bus stop', es: 'parada del bus' },
    ],
    grammarEs:
      'Usa at + hora («at eight»), on + día («on Saturday») e in + parte del día («in the morning»). «On Saturdays» indica que ocurre los sábados. Para decir 8:00 puedes decir «eight o’clock». Para 8:30 di «eight thirty» o «half past eight». En un horario digital, di primero la hora y luego los minutos. Para 8:05 puedes decir «eight oh five». Los minutos de 10 a 19 tienen formas propias: ten, eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen. Para 20 a 59, combinas twenty, thirty, forty o fifty con la unidad según el número: 8:24 se lee «eight twenty-four». Compara «seven fifteen» (7:15) con «seven fifty» (7:50) y «ten thirteen» (10:13) con «ten thirty» (10:30). Escucha la diferencia entre los finales de fifteen y fifty, y de thirteen y thirty.',
    question: {
      promptEs: 'Escucha el mensaje que confirma las horas de los dos buses. ¿Qué par oyes?',
      options: ['7:15 y 10:13.', '7:50 y 10:13.', '7:50 y 10:30.', '7:15 y 10:30.'],
      answerIndex: 1,
      feedbackEs:
        '«Seven fifty» da 7:50. «Ten thirteen» da 10:13. Repite los minutos de cada hora y vuelve a escucharlos.',
      listening: {
        en: 'On Saturdays, the buses come at seven fifty and ten thirteen.',
        es: 'Los sábados, los buses llegan a las siete y cincuenta y a las diez y trece.',
      },
    },
    practiceEs:
      'Agenda de otro mercado: viernes 2:00 p. m.–5:00 p. m. y sábado 8:30 a. m.–12:00 p. m. Tu compañera solo puede ir por la mañana. Elige un día y una hora dentro del horario. Escríbelos en inglés y dilos en voz alta. Después, di en inglés un día y una hora de la tarde como alternativa para otro visitante.',
    model: {
      en: 'Saturday at half past nine in the morning. Friday at three in the afternoon.',
      es: 'El sábado a las nueve y media de la mañana. El viernes a las tres de la tarde.',
    },
  },
  {
    title: 'Acordamos la hora',
    objectiveEs: 'Pregunta por dos horarios, descarta una opción y confirma un encuentro.',
    dialogue: [
      {
        speaker: 'Leo',
        en: 'What time do you work on Fridays?',
        es: '¿A qué hora trabajas los viernes?',
      },
      {
        speaker: 'Inés',
        en: 'I work at four. I don’t meet friends on Friday afternoons.',
        es: 'Trabajo a las cuatro. No me reúno con mis amigos los viernes por la tarde.',
      },
      {
        speaker: 'Leo',
        en: 'Does your sister work on Saturdays?',
        es: '¿Tu hermana trabaja los sábados?',
      },
      {
        speaker: 'Inés',
        en: 'No, she doesn’t work on Saturdays. She’s available at half past ten.',
        es: 'No, no trabaja los sábados. Está disponible a las diez y media.',
      },
      {
        speaker: 'Leo',
        en: 'Let’s meet on Saturday at half past ten.',
        es: 'Nos vemos el sábado a las diez y media.',
      },
    ],
    vocabulary: [
      { en: 'when', es: 'cuándo' },
      { en: 'what time', es: 'a qué hora' },
      { en: 'open', es: 'abierto si describe el estado de un lugar' },
      { en: 'closed', es: 'cerrado' },
      { en: 'available', es: 'disponible' },
      { en: 'meet', es: 'reunirse con alguien' },
      { en: 'let’s meet', es: 'reunámonos o nos vemos, para proponer un encuentro' },
      { en: 'on Friday', es: 'el viernes' },
      { en: 'on Saturday', es: 'el sábado' },
      { en: 'in the afternoon', es: 'por la tarde' },
      { en: 'half past', es: 'y media' },
      { en: 'community center', es: 'centro comunitario' },
    ],
    grammarEs:
      'Para preguntar por un horario, di «What time do you work?» o «What time does she work?». When también pregunta cuándo. Usa do con I, you, we o they y does con he, she o el nombre de una sola persona. Después del sujeto en una pregunta, va el verbo base: «Does she work?». En respuestas negativas, usa don’t o doesn’t + verbo base: «I don’t work» y «She doesn’t work». En un aviso, «is open» significa «está abierto» y «is closed», «está cerrado». Confirma el encuentro con «Let’s meet» y añade on + día y at + hora: «Let’s meet on Saturday at half past ten».',
    question: {
      promptEs:
        'Cruza estos dos avisos. «Community center: Friday at four, open. Saturday at ten, closed.» «Leo: I work on Saturday. I’m available on Friday at four.» ¿Cuándo pueden verse en el centro comunitario?',
      options: [
        'El sábado a las diez.',
        'El viernes a las cuatro.',
        'En ninguno de los dos horarios.',
      ],
      answerIndex: 1,
      feedbackEs:
        'El centro está abierto el viernes a las cuatro, cuando Leo está disponible. El sábado está cerrado y Leo trabaja.',
    },
    practiceEs:
      'Un compañero te propone estudiar el sábado. Pregúntale a qué hora estudia y si su hermana trabaja los sábados. Para ensayar, imagina que tu compañero estudia a las nueve y que tú trabajas a las diez. Escribe un mensaje para confirmar las nueve y explicar por qué las diez no funcionan. Revisa que se entienda el día, la hora y la razón.',
    model: {
      en: 'What time do you study? Does your sister work on Saturdays? Let’s meet on Saturday at nine. I don’t study at ten. I work at ten.',
      es: '¿A qué hora estudias? ¿Tu hermana trabaja los sábados? Nos vemos el sábado a las nueve. No estudio a las diez. Trabajo a las diez.',
    },
  },
];
