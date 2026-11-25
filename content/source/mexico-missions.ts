import type { Translation } from '@lingoquest/contracts';
import type { LearningTarget } from '../../packages/offline-engine/src/travel-learning';
import type {
  TravelChapter,
  TravelExerciseStep,
  TravelMission,
  TravelStep,
  TravelVocabulary,
} from '../../packages/offline-engine/src/travel-content';

const readingRoom = 'Sala de lectura';
const market = 'Mercado del barrio';
const routine = { lessonId: 'u02_l01', conceptId: 'grammar.routine_base' };
const others = { lessonId: 'u02_l02', conceptId: 'grammar.routine_third_person' };
const frequency = { lessonId: 'u02_l03', conceptId: 'grammar.frequency' };
const time = { lessonId: 'u02_l04', conceptId: 'grammar.routine_time' };
const questions = { lessonId: 'u03_l01', conceptId: 'grammar.do_questions' };
const negatives = { lessonId: 'u03_l02', conceptId: 'grammar.dont' };
type Target = typeof routine;

const pair = (en: string, es: string): Translation => ({ en, es });

function word(
  term: string,
  meaning: string,
  kind: string,
  en: string,
  es: string,
  explanation = meaning,
): TravelVocabulary {
  return { term, meaning, kind, explanation, example: pair(en, es) };
}

function teach(
  id: string,
  target: Target,
  title: string,
  text: string,
  examples: Translation[],
  referenceIds: string[],
  vocabularyTerms?: string[],
): TravelStep {
  return {
    id,
    type: 'teach',
    title,
    text,
    examples,
    vocabularyTerms,
    instruction: {
      lessonId: target.lessonId,
      stage: 'both',
      references: [target.conceptId, ...referenceIds].map((id) => ({ id })),
    },
  };
}

function writing(
  id: string,
  target: Target,
  contextId: string,
  situation: string,
  promptEs: string,
  acceptedAnswers: string[],
  feedbackEs: string,
  options: {
    passage?: string;
    evidence?: LearningTarget['evidence'];
    errors?: LearningTarget['errors'];
    guided?: true;
    requiredReply?: true;
    remediates?: LearningTarget['remediates'];
  } = {},
): TravelExerciseStep {
  const { passage, evidence = 'production', errors, guided, remediates, requiredReply } = options;
  const { lessonId, conceptId } = target;
  return {
    id,
    type: 'exercise',
    activityTitle: guided ? 'Practica con una pista' : 'Escribe tu mensaje',
    situation,
    lessonId,
    requiredReply,
    requires: [{ id: conceptId }],
    exercise: {
      id,
      type: 'short_text',
      promptEs,
      acceptedAnswers,
      feedbackEs,
      passage,
      difficulty: 1,
      skillId: conceptId,
      dimension: 'grammar_production',
      learning: { conceptId, skill: 'grammar', contextId, evidence, errors, guided, remediates },
    },
  };
}

function comprehension(
  id: string,
  target: Target,
  contextId: string,
  situation: string,
  promptEs: string,
  options: string[],
  correctIndex: number,
  feedbackEs: string,
  input: { audio: string } | { passage: string },
): TravelExerciseStep {
  const audio = 'audio' in input ? input.audio : undefined;
  const { lessonId, conceptId } = target;
  return {
    id,
    type: 'exercise',
    activityTitle: audio ? 'Escucha el horario' : 'Lee la agenda',
    situation,
    lessonId,
    requires: [{ id: conceptId }],
    ...(audio && { audio, transcript: audio, listeningButton: 'Escuchar el mensaje' }),
    exercise: {
      id,
      type: 'single_choice',
      promptEs,
      options: options.map((text, index) => ({ id: String(index + 1), text })),
      optionsLanguage: 'es',
      correctOptionId: String(correctIndex + 1),
      acceptedAnswers: [],
      feedbackEs,
      ...('passage' in input && { passage: input.passage }),
      difficulty: 1,
      skillId: conceptId,
      learning: {
        conceptId,
        skill: audio ? 'listening' : 'reading',
        contextId,
        evidence: 'understanding',
      },
    },
  };
}

function speak(
  id: string,
  target: Target,
  contextId: string,
  phrase: string,
  text: string,
): TravelStep {
  return {
    id,
    type: 'speak',
    text,
    phrase,
    exampleLabel: 'Modelo para comparar',
    learning: { conceptId: target.conceptId, skill: 'speaking', contextId, evidence: 'production' },
  };
}

const dailyRoutine: TravelMission = {
  id: 'mexico-routine',
  title: 'Tu día en la agenda',
  place: readingRoom,
  objective: 'Cuenta tus hábitos y ordena los de otra persona para preparar la visita.',
  minutes: [5, 8],
  success:
    'Inés ya sabe qué haces en un día normal. Ahora puede contarte cómo se organiza su familia.',
  vocabulary: [
    word('work', 'trabajar', 'Verbo', 'I work every day.', 'Trabajo todos los días.'),
    word('study', 'estudiar', 'Verbo', 'We study English.', 'Estudiamos inglés.'),
    word('live', 'vivir', 'Verbo', 'I live in Mexico City.', 'Vivo en la Ciudad de México.'),
    word(
      'get up',
      'levantarse',
      'Expresión verbal',
      'I get up in the morning.',
      'Me levanto por la mañana.',
    ),
    word(
      'have breakfast',
      'desayunar',
      'Expresión verbal',
      'I have breakfast at home.',
      'Desayuno en casa.',
    ),
    word(
      'every day',
      'todos los días',
      'Expresión de tiempo',
      'They study every day.',
      'Estudian todos los días.',
    ),
  ],
  steps: [
    teach(
      'mexico-routine-lesson',
      routine,
      'Quién hace qué',
      'Antes de escoger cuándo ir al mercado, Inés quiere saber cómo es tu día. Con I, you, we o they, di quién hace la acción y luego el verbo base. Si hay un complemento, colócalo después del verbo. Every day se escribe en dos palabras y puede ir al principio o al final.',
      [
        pair('I study English every day.', 'Estudio inglés todos los días.'),
        pair('We have breakfast at home.', 'Desayunamos en casa.'),
        pair('They work every day.', 'Trabajan todos los días.'),
      ],
      ['pattern.u02_l01.habit', 'form.u02_l01.1'],
    ),
    comprehension(
      'mexico-routine-audio',
      routine,
      'mexico-host-agenda',
      'Inés describe tres actividades de su día en orden.',
      '¿En qué orden cuenta las actividades?',
      [
        'Estudia, trabaja y desayuna.',
        'Se levanta, desayuna y trabaja.',
        'Desayuna, se levanta y trabaja.',
      ],
      1,
      'Inés dice I get up, I have breakfast y luego I work.',
      { audio: 'I get up. Then I have breakfast. Then I work.' },
    ),
    comprehension(
      'mexico-routine-planner',
      routine,
      'mexico-visitor-planner',
      'Sam dejó escrito su plan. Work indica trabajo y study indica estudio.',
      '¿Qué actividades hace Sam por la tarde?',
      ['Trabaja y estudia inglés.', 'Estudia inglés y camina.', 'Desayuna y trabaja.'],
      0,
      'Sam escribe que trabaja y estudia inglés por la tarde.',
      { passage: 'Morning: I have breakfast. Afternoon: I work and I study English.' },
    ),
    writing(
      'mexico-routine-write',
      routine,
      'mexico-host-agenda',
      'Inés tiene espacio para anotar una actividad habitual tuya.',
      'Escribe «Estudio inglés todos los días».',
      ['I study English every day.', 'Every day I study English.'],
      'Expresa quién realiza la acción con I y usa study sin -s. Every day puede ir al principio o al final.',
      { errors: ['subject_omission', 'word_order'] },
    ),
    speak(
      'mexico-routine-say',
      routine,
      'mexico-own-schedule',
      'I get up. I have breakfast. I study English.',
      'Cuéntale a Inés tres cosas que haces en un día real o inventado. Escúchate y comprueba que cada acción tiene un sujeto, que usas el verbo base y que se entiende el orden de tus actividades.',
    ),
  ],
};

const familyRoutine: TravelMission = {
  id: 'mexico-others',
  title: 'Los hábitos de la familia',
  place: readingRoom,
  objective: 'Distingue las rutinas de dos personas y cuéntale a Sam quién hace qué.',
  minutes: [6, 9],
  success: 'Sam ya distingue los hábitos de Inés y su familia. Falta comparar las horas de visita.',
  vocabulary: [
    word('sister', 'hermana', 'Sustantivo', 'My sister cooks.', 'Mi hermana cocina.'),
    word('brother', 'hermano', 'Sustantivo', 'My brother reads.', 'Mi hermano lee.'),
    word(
      'cook',
      'cocinar',
      'Verbo',
      'She cooks at home.',
      'Ella cocina en casa.',
      'Con she, cooks termina con el sonido /s/.',
    ),
    word(
      'read',
      'leer',
      'Verbo',
      'He reads in the morning.',
      'Él lee por la mañana.',
      'En presente, read rima con need. Reads termina con el sonido /z/.',
    ),
    word('usually', 'normalmente', 'Adverbio', 'He usually reads.', 'Él normalmente lee.'),
    word(
      'never',
      'nunca',
      'Adverbio',
      'She never cooks in the morning.',
      'Ella nunca cocina por la mañana.',
    ),
    word('at home', 'en casa', 'Expresión de lugar', 'She works at home.', 'Ella trabaja en casa.'),
    word(
      'at night',
      'por la noche',
      'Expresión de tiempo',
      'I read at night.',
      'Leo por la noche.',
    ),
  ],
  steps: [
    teach(
      'mexico-others-lesson',
      others,
      'Una sola persona, un cambio en el verbo',
      'Cuando dices lo que hace una sola persona, usa he, she o su nombre. Agrega -s a muchos verbos: cook → cooks, read → reads. Después de -ch, agrega -es: watch → watches. Cambia la y de study por -ies: studies. Escucha las terminaciones: cooks /s/, reads /z/, watches /ɪz/.',
      [
        pair('My sister cooks.', 'Mi hermana cocina.'),
        pair('My brother reads.', 'Mi hermano lee.'),
        pair('Sam watches a video.', 'Sam ve un video.'),
        pair('Inés studies English.', 'Inés estudia inglés.'),
      ],
      [
        'pattern.u02_l02.habit',
        'form.u02_l02.1',
        'form.u02_l02.2',
        'form.u02_l02.6',
        'form.u02_l02.7',
        'form.u02_l02.12',
        'form.u02_l02.13',
      ],
      ['sister', 'brother', 'cook', 'read', 'at home'],
    ),
    teach(
      'mexico-frequency-lesson',
      frequency,
      'Distingue normalmente y nunca',
      'Usually y never suelen ir antes del verbo de acción. En una oración con she o he, el verbo conserva la terminación. Never ya dice que la actividad no ocurre. Usually también puede ir al principio.',
      [
        pair('She usually cooks.', 'Ella normalmente cocina.'),
        pair('He never cooks.', 'Él nunca cocina.'),
        pair('Usually he reads.', 'Por lo general, él lee.'),
      ],
      ['pattern.u02_l03.frequency', 'pattern.u02_l03.front'],
      ['usually', 'never', 'at night'],
    ),
    comprehension(
      'mexico-others-audio',
      frequency,
      'mexico-ines-family',
      'Escucha cómo Inés describe los hábitos de su hermana y su hermano.',
      '¿Con qué frecuencia lee su hermano por la mañana?',
      ['Normalmente.', 'Todos los días.', 'Nunca.'],
      2,
      'Inés dice My brother never reads in the morning. Nunca lee por la mañana.',
      { audio: 'My sister usually reads in the morning. My brother never reads in the morning.' },
    ),
    comprehension(
      'mexico-others-read',
      frequency,
      'mexico-family-notes',
      'Lee las dos notas que Inés escribió de su familia.',
      'Según las notas, ¿quién nunca cocina por la mañana?',
      ['Leo.', 'Inés.', 'Clara.'],
      0,
      'La nota de Leo dice He never cooks in the morning.',
      {
        passage:
          'Clara: She usually cooks in the morning. She reads at night.\nLeo: He never cooks in the morning. He studies English at night.',
      },
    ),
    writing(
      'mexico-others-write',
      others,
      'mexico-ines-family',
      'Sam quiere saber un hábito de la hermana de Inés.',
      'Dile «Ella cocina en casa».',
      ['She cooks at home.'],
      'She se refiere a una sola persona. Escribe cooks y usa at home para indicar dónde.',
      { errors: ['third_person', 'subject_omission', 'preposition'] },
    ),
    speak(
      'mexico-others-say',
      others,
      'mexico-household-voice',
      'My brother reads. My sister cooks.',
      'Di un hábito de cada una de dos personas reales o inventadas. Después, escucha si nombraste a las dos personas y si el verbo de cada oración lleva la terminación correspondiente.',
    ),
  ],
};

const clocks: TravelMission = {
  id: 'mexico-time',
  title: 'El tablero de horarios',
  place: readingRoom,
  objective: 'Lee el horario de práctica y encuentra una hora en que el mercado esté abierto.',
  minutes: [6, 9],
  success:
    'El sábado por la mañana hay dos horas posibles. Ahora puedes preguntar cuál le sirve a Inés.',
  vocabulary: [
    word(
      "o'clock",
      'en punto',
      'Expresión de tiempo',
      "We meet at eight o'clock.",
      'Nos encontramos a las ocho en punto.',
    ),
    word(
      'half past',
      'y media',
      'Expresión de tiempo',
      'We meet at half past eight.',
      'Nos encontramos a las ocho y media.',
    ),
    word(
      'at noon',
      'al mediodía',
      'Expresión de tiempo',
      'We eat at noon.',
      'Comemos al mediodía.',
    ),
    word(
      'in the morning',
      'por la mañana',
      'Expresión de tiempo',
      'We walk in the morning.',
      'Caminamos por la mañana.',
    ),
    word(
      'in the afternoon',
      'por la tarde',
      'Expresión de tiempo',
      'We study in the afternoon.',
      'Estudiamos por la tarde.',
    ),
    word(
      'on Saturdays',
      'los sábados',
      'Expresión de tiempo',
      'We meet on Saturdays.',
      'Nos encontramos los sábados.',
    ),
    word('open', 'abierto', 'Adjetivo', 'The market is open.', 'El mercado está abierto.'),
    word('closed', 'cerrado', 'Adjetivo', 'The market is closed.', 'El mercado está cerrado.'),
    word(
      'at six',
      'a las seis',
      'Expresión de tiempo',
      'I get up at six.',
      'Me levanto a las seis.',
    ),
    word(
      'at eight',
      'a las ocho',
      'Expresión de tiempo',
      'I start work at eight.',
      'Empiezo a trabajar a las ocho.',
    ),
    word('start', 'empezar', 'Verbo', 'I start work at eight.', 'Empiezo a trabajar a las ocho.'),
  ],
  steps: [
    teach(
      'mexico-time-lesson',
      time,
      'At para una hora, on para un día',
      'Usa at para una hora exacta, on para un día e in para una parte del día. On Saturday señala un sábado y on Saturdays señala un hábito. Para los minutos de 21 a 59, combina una decena (twenty, thirty, forty, fifty) con el número del uno al nueve. Compara fifTEEN con FIFty y thirTEEN con THIRty. Para los primeros nueve minutos, lee el cero como oh: 8:05 es eight oh five.',
      [
        pair("at eight o'clock", 'a las ocho en punto'),
        pair('at half past eight', 'a las ocho y media'),
        pair('on Saturday morning', 'el sábado por la mañana'),
        pair('eight fifteen, eight fifty', 'ocho y quince, ocho y cincuenta'),
        pair('nine thirteen, nine thirty', 'nueve y trece, nueve y treinta'),
        pair('ten twenty-five', 'diez y veinticinco'),
      ],
      ['pattern.u02_l04.clock', 'form.u02_l04.1'],
    ),
    comprehension(
      'mexico-time-audio',
      time,
      'mexico-time-voice-message',
      'Sam te deja un mensaje sobre dos horarios de prueba.',
      '¿Cuáles son las dos horas que menciona?',
      ['8:50 y 9:13', '8:15 y 9:30', '8:15 y 9:13'],
      1,
      'Dice eight fifteen (8:15) y nine thirty (9:30).',
      { audio: 'We can meet at eight fifteen or nine thirty.' },
    ),
    comprehension(
      'mexico-time-read',
      time,
      'mexico-posted-hours',
      'Este horario pertenece al mercado ficticio de la historia.',
      '¿Cuál de estas horas está dentro del horario del sábado?',
      ['Sábado a las siete.', 'Domingo a las diez.', 'Sábado a las ocho.'],
      2,
      'El mercado del juego abre el sábado a las ocho y el domingo permanece cerrado.',
      {
        passage:
          'Neighborhood market\nFriday: CLOSED\nSaturday: OPEN 8:00 a.m. – 12:00 noon\nSunday: CLOSED',
      },
    ),
    writing(
      'mexico-time-write',
      time,
      'mexico-visit-booking',
      'Deja una nota en inglés para la visita del sábado a las ocho. Aún falta confirmar con Inés.',
      'Completa el mensaje escribiendo «Nos encontramos el sábado a las ocho».',
      [
        'We meet on Saturday at eight.',
        'We meet at eight on Saturday.',
        "We meet on Saturday at eight o'clock.",
        "We meet at eight o'clock on Saturday.",
        'We meet on Saturday at 8:00.',
        'We meet at 8:00 on Saturday.',
        'On Saturday we meet at eight.',
      ],
      'On indica el día y at indica la hora. Puedes cambiar el orden de esos dos datos.',
      { errors: ['preposition', 'word_order'] },
    ),
    speak(
      'mexico-time-say',
      time,
      'mexico-planner-voice',
      'We can meet on Saturday at eight or on Sunday at half past nine.',
      'Propón oralmente dos horas y días en un horario inventado. Comprueba que cada hora tiene at, cada día tiene on y se distingue una hora de la otra.',
    ),
  ],
};

const agreement: TravelMission = {
  id: 'mexico-agreement',
  title: 'Una hora para ir al mercado',
  place: market,
  objective: 'Pregunta por la disponibilidad de Inés y acuerda la visita de las ocho.',
  minutes: [7, 10],
  success:
    'Confirmaste con Inés la visita del sábado a las ocho. Ya puedes usar la misma habilidad al hacer otro plan.',
  vocabulary: [
    word('when', 'cuándo', 'Pregunta', 'When do you work?', '¿Cuándo trabajas?'),
    word(
      'open',
      'abrir',
      'Verbo',
      'Does the market open at eight?',
      '¿Abre el mercado a las ocho?',
    ),
    word('close', 'cerrar', 'Verbo', 'When does the market close?', '¿Cuándo cierra el mercado?'),
    word(
      'available',
      'disponible',
      'Adjetivo',
      'I am available at eight.',
      'Estoy disponible a las ocho.',
    ),
    word('meet', 'encontrarse', 'Verbo', 'We meet on Saturday.', 'Nos encontramos el sábado.'),
  ],
  steps: [
    teach(
      'mexico-questions-lesson',
      questions,
      'Pregunta por un plan',
      'Pon do antes de you, we o they, y does antes de he, she o un sujeto singular. Después del sujeto va el verbo base: Does she work? Si quieres el momento, agrega When o What time al comienzo. Para proponer una cita, puedes usar Can we meet at…?',
      [
        pair('When do you work?', '¿Cuándo trabajas?'),
        pair('What time does your sister work?', '¿A qué hora trabaja tu hermana?'),
        pair('Does the market open at eight?', '¿Abre el mercado a las ocho?'),
        pair('Can we meet at eight?', '¿Podemos encontrarnos a las ocho?'),
      ],
      ['pattern.u03_l01.question', 'form.u03_l01.1', 'form.u03_l01.2'],
    ),
    teach(
      'mexico-negative-lesson',
      negatives,
      'Explica qué hora no sirve',
      'Usa do not o don’t con I, you, we o they. Usa does not o doesn’t con he, she o una sola persona. Después coloca el verbo base. Si describes disponibilidad, usa am o is: I am available, she is available.',
      [
        pair("I don't work at eight.", 'No trabajo a las ocho.'),
        pair("She doesn't go at ten.", 'Ella no va a las diez.'),
        pair('She is available at eight.', 'Ella está disponible a las ocho.'),
      ],
      [
        'pattern.u03_l02.negative',
        'form.u03_l02.1',
        'form.u03_l02.2',
        'form.u03_l02.3',
        'form.u03_l02.4',
        'form.u03_l02.7',
        'form.u03_l02.8',
      ],
      [],
    ),
    {
      id: 'mexico-agreement-build',
      type: 'exercise',
      activityTitle: 'Reconstruye la pregunta',
      situation:
        'El tablero muestra un horario. Practica cómo confirmar la hora de apertura con Inés.',
      lessonId: questions.lessonId,
      requires: [{ id: questions.conceptId }],
      exercise: {
        id: 'mexico-agreement-build',
        type: 'reorder',
        promptEs: 'Ordena «¿Abre el mercado a las ocho?» en inglés.',
        tokens: ['open', 'market', 'eight?', 'Does', 'at', 'the'],
        acceptedAnswers: ['Does the market open at eight?'],
        skillId: questions.conceptId,
        difficulty: 1,
        feedbackEs: 'Does introduce la pregunta. Después de the market, usa open sin -s.',
        learning: {
          conceptId: questions.conceptId,
          skill: 'grammar',
          evidence: 'production',
          contextId: 'mexico-market-question-example',
          guided: true,
        },
      },
    },
    comprehension(
      'mexico-agreement-listen',
      questions,
      'mexico-market-conversation',
      'Escucha los dos turnos del diálogo con Inés.',
      '¿A qué hora pueden encontrarse y qué hora descartan?',
      [
        'Pueden a las diez y descartan las ocho.',
        'Pueden a las ocho y descartan las diez.',
        'Pueden al mediodía y descartan las diez.',
      ],
      1,
      'Inés está disponible a las ocho y trabaja a las diez.',
      { audio: 'Do you work at eight? No, I work at ten. I am available at eight.' },
    ),
    comprehension(
      'mexico-agreement-read',
      questions,
      'mexico-market-notebook-question',
      'En el cuaderno aparece una pregunta de Sam para Inés.',
      '¿Qué dato quiere averiguar Sam?',
      [
        'La hora a la que trabaja el hermano de Inés.',
        'La hora a la que abre el mercado.',
        'La hora a la que trabaja Inés.',
      ],
      0,
      'What time does your brother work? pregunta a qué hora trabaja el hermano de Inés.',
      { passage: 'Sam: What time does your brother work?\nInés: He works at noon.' },
    ),
    writing(
      'mexico-agreement-question',
      questions,
      'mexico-market-host',
      'Confirma con Inés cuándo comienza a trabajar su hermana.',
      'Escribe «¿A qué hora empieza a trabajar tu hermana?» en inglés.',
      [
        'What time does your sister start work?',
        'What time does your sister start working?',
        'When does your sister start work?',
        'When does your sister start working?',
      ],
      'Empieza con What time o When, luego does, el sujeto y el verbo base start.',
      { errors: ['third_person', 'word_order'] },
    ),
    writing(
      'mexico-agreement-confirm',
      negatives,
      'mexico-market-confirmation',
      'Inés te dice que empieza a trabajar a las diez. Escríbele a Sam la hora elegida y la que Inés descarta.',
      'Escribe «Nos encontramos a las ocho. Ella no va a las diez».',
      [
        "We meet at eight. She doesn't go at ten.",
        'We meet at eight. She does not go at ten.',
        "We meet at eight. She doesn't go at 10.",
        'We meet at 8:00. She does not go at 10:00.',
        "At eight, we meet. She doesn't go at ten.",
        "Let's meet at eight. She doesn't go at ten.",
        "Let's meet at eight. She does not go at ten.",
      ],
      'En una confirmación puedes decir We meet o Let’s meet. Con she, usa doesn’t o does not, seguido del verbo base go.',
      { errors: ['third_person', 'preposition'], requiredReply: true },
    ),
    speak(
      'mexico-agreement-say',
      questions,
      'mexico-market-pair',
      'Do you work on Saturdays? What time does your sister work? Can we meet at eight?',
      'Haz dos preguntas sobre horarios, una sobre la persona que te escucha y otra sobre un familiar. Propón una hora común. Comprueba do o does, el verbo base y la hora clara.',
    ),
  ],
};

const transfer: TravelMission = {
  id: 'mexico-transfer',
  title: 'Una cita para estudiar',
  place: readingRoom,
  objective: 'Aplica lo aprendido con otro horario y un compañero de intercambio.',
  minutes: [4, 7],
  success:
    'El plan con Leo queda anotado. El intercambio de comida de Cartagena es la siguiente parada.',
  vocabulary: [
    word(
      'library',
      'biblioteca',
      'Sustantivo',
      'We study at the library.',
      'Estudiamos en la biblioteca.',
    ),
    word(
      'on Friday',
      'el viernes',
      'Expresión de tiempo',
      'We meet on Friday.',
      'Nos encontramos el viernes.',
    ),
  ],
  steps: [
    {
      id: 'mexico-transfer-intro',
      type: 'teach',
      title: 'Un lugar y un día distintos',
      text: 'Leo quiere practicar inglés contigo en la biblioteca. Esta vez, usa el horario de la sala de estudio y el turno de trabajo de su hermana.',
      examples: [
        pair('We study at the library on Friday.', 'Estudiamos en la biblioteca el viernes.'),
      ],
    },
    comprehension(
      'mexico-transfer-read',
      time,
      'mexico-library-room',
      'La sala solo se puede usar durante la hora indicada en el cartel.',
      '¿Qué horario puedes proponer para la biblioteca?',
      ['Viernes a las dos y media.', 'Viernes a las tres y media.', 'Sábado a las tres y media.'],
      1,
      'El cartel indica que el viernes abren a las tres y cierran a las cuatro.',
      { passage: 'Study room\nFriday: OPEN 3:00–4:00 p.m.\nSaturday: CLOSED' },
    ),
    writing(
      'mexico-transfer-ask',
      questions,
      'mexico-library-classmate',
      'Leo quiere saber si su hermana podrá acompañarlos. Pregúntale por su trabajo.',
      'Escribe «¿Trabaja tu hermana el viernes?» en inglés.',
      [
        'Does your sister work on Friday?',
        'On Friday, does your sister work?',
        'Does your sister work this Friday?',
      ],
      'Your sister es una persona, por eso la pregunta lleva does. Work conserva su forma base.',
      { evidence: 'transfer', errors: ['third_person', 'word_order'] },
    ),
    writing(
      'mexico-transfer-write',
      time,
      'mexico-library-classmate',
      'Confirma con Leo el viernes a las tres y media en el lugar indicado.',
      'Escribe «Nos encontramos en la biblioteca el viernes a las tres y media».',
      ['half past three', 'three thirty', '3:30'].flatMap((hour) => [
        `We meet at the library on Friday at ${hour}.`,
        `We meet at the library at ${hour} on Friday.`,
        `We meet at ${hour} on Friday at the library.`,
        `We meet on Friday at ${hour} at the library.`,
        `On Friday, we meet at the library at ${hour}.`,
      ]),
      'Confirma los tres datos. Usa at the library, on Friday y at half past three o at three thirty.',
      { evidence: 'transfer', errors: ['preposition'], requiredReply: true },
    ),
  ],
};

export const mexicoChapter = {
  id: 'mexico',
  revision: 1,
  title: 'Ciudad de México',
  stamp: 'Ciudad de México',
  postcard: 'Una mañana en el mercado',
  message:
    'Un horario en inglés ayudó a organizar dos encuentros: en el mercado y en la biblioteca.',
  collectible: 'Postal del mercado de las ocho',
  missions: [dailyRoutine, familyRoutine, clocks, agreement, transfer],
} satisfies TravelChapter;

export const mexicoPractice = [
  writing(
    'mexico-review-routine',
    routine,
    'mexico-review-study-group',
    'Deja una nota para un grupo de estudio.',
    'Escribe «Estudiamos inglés todos los días».',
    ['We study English every day.', 'Every day we study English.'],
    'Con we, usa la forma base study y coloca every day al principio o al final.',
    { evidence: 'transfer', errors: ['subject_omission', 'word_order'] },
  ),
  writing(
    'mexico-review-others-guide',
    others,
    'mexico-review-household-guidance',
    'Con she, normalmente agregas -s al verbo base. Observa cook → cooks.',
    'Completa la idea escribiendo «Ella cocina por la mañana».',
    ['She cooks in the morning.', 'In the morning she cooks.'],
    'She lleva cooks con -s y la parte del día lleva in.',
    { guided: true, remediates: ['third_person', 'subject_omission'] },
  ),
  writing(
    'mexico-review-others',
    others,
    'mexico-review-reading-club',
    'Tu compañero prepara un anuncio sobre un club de lectura.',
    'Escribe «Él lee en casa».',
    ['He reads at home.', 'At home he reads.'],
    'Con he, read lleva -s. Usa at home para decir en casa.',
    {
      evidence: 'transfer',
      errors: ['third_person', 'subject_omission'],
      remediates: ['third_person', 'subject_omission'],
    },
  ),
  writing(
    'mexico-review-time-guide',
    time,
    'mexico-review-time-guidance',
    'Para la hora, usa at. Para el día, usa on. Modelo: We meet on Saturday at eight.',
    'Escribe «Nos encontramos el viernes a las ocho».',
    ['We meet on Friday at eight.', 'We meet at eight on Friday.'],
    'El día lleva on y la hora lleva at.',
    { guided: true, remediates: ['preposition'] },
  ),
  writing(
    'mexico-review-time',
    time,
    'mexico-review-library-hours',
    'Confirma una hora distinta para el club de lectura.',
    'Escribe «Nos encontramos el sábado a las diez y media».',
    [
      'We meet on Saturday at half past ten.',
      'We meet at half past ten on Saturday.',
      'We meet on Saturday at ten thirty.',
      'We meet at ten thirty on Saturday.',
      'We meet at 10:30 on Saturday.',
      'We meet on Saturday at 10:30.',
    ],
    'On va con Saturday. At va con half past ten, ten thirty o 10:30.',
    { evidence: 'transfer', errors: ['preposition'], remediates: ['preposition'] },
  ),
  writing(
    'mexico-review-ask-guide',
    questions,
    'mexico-review-question-guidance',
    'Modelo: Does she work? Después de does, usa el verbo base.',
    'Escribe «¿Ella estudia en casa?».',
    ['Does she study at home?'],
    'Does indica que preguntas por ella. Study va sin -s.',
    { guided: true, remediates: ['third_person', 'word_order'] },
  ),
  writing(
    'mexico-review-ask',
    questions,
    'mexico-review-weekend-call',
    'Negocia el fin de semana con un compañero distinto.',
    'Escribe «¿Trabaja tu hermano los sábados?».',
    [
      'Does your brother work on Saturdays?',
      'Does your brother work Saturdays?',
      'On Saturdays, does your brother work?',
    ],
    'Your brother lleva does y el verbo work va en forma base.',
    {
      evidence: 'transfer',
      errors: ['third_person', 'word_order'],
      remediates: ['third_person', 'word_order'],
    },
  ),
  writing(
    'mexico-review-negative',
    negatives,
    'mexico-review-sunday-call',
    'Comunica qué día no puedes trabajar.',
    'Escribe «No trabajo los domingos».',
    ["I don't work on Sundays.", "I don't work Sundays.", "On Sundays I don't work."],
    'Con I, usa don’t o do not y después el verbo work.',
    { evidence: 'transfer' },
  ),
];
