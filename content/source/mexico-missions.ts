import type { Translation } from '@lingoquest/contracts';
import type { PrerequisiteReference } from '../../packages/course-pack/src/prerequisites';
import type { LearningTarget } from '../../packages/offline-engine/src/travel-learning';
import type {
  TravelChapter,
  TravelExerciseStep,
  TravelMission,
  TravelStep,
  TravelVocabulary,
} from '../../packages/offline-engine/src/travel-content';
import { answerVariants } from './contextual-answers';
import { numberLearningId } from './travel-number-words';
import {
  form,
  grammar,
  mexicoAssessmentReferences,
  mexicoNumberRefs,
  mexicoRefs as w,
  mexicoStudyPatterns as p,
} from './mexico-prerequisites';

const readingRoom = 'Sala de lectura';
const market = 'Mercado del barrio';
const routine = { lessonId: 'u02_l01', conceptId: 'grammar.routine_base' };
const others = { lessonId: 'u02_l02', conceptId: 'grammar.routine_third_person' };
const frequency = { lessonId: 'u02_l03', conceptId: 'grammar.frequency' };
const time = { lessonId: 'u02_l04', conceptId: 'grammar.routine_time' };
const questions = { lessonId: 'u03_l01', conceptId: 'grammar.do_questions' };
const negatives = { lessonId: 'u03_l02', conceptId: 'grammar.dont' };
type Target = typeof routine;
type Speaker = 'Inés' | 'Sam' | 'Leo';

const pair = (en: string, es: string): Translation => ({ en, es });
const meetingVerbs = ['We meet', 'We will meet', 'Let’s meet'];
const eightOClock = ['eight', 'eight o’clock', '8', '8:00', 'eight a.m.', '8 a.m.', '8:00 a.m.'];
const halfPastThree = ['half past three', 'three thirty', '3:30', 'three thirty p.m.', '3:30 p.m.'];
const tenOClock = ['ten', 'ten o’clock', '10', '10:00'];
const wordReferences = Object.values(w);
const writingPatterns = new Map([
  [routine.conceptId, p.routine],
  [others.conceptId, p.others],
  [time.conceptId, p.clock],
  [questions.conceptId, p.question],
  [negatives.conceptId, p.negative],
]);

function assessmentRequirements(id: string, target: Target): PrerequisiteReference[] {
  const required = mexicoAssessmentReferences[id];
  if (!required) throw new Error(`Missing assessment prerequisites for ${id}`);
  return [grammar(target.conceptId), ...required];
}

function word(
  term: string,
  meaning: string,
  kind: string,
  en: string,
  es: string,
  explanation = meaning,
  exactReference?: PrerequisiteReference,
): TravelVocabulary {
  const matching = wordReferences.filter(({ form }) => form === term);
  if (!exactReference && matching.length > 1) throw new Error(`Choose an exact sense for ${term}`);
  const reference = exactReference ?? matching[0];
  return {
    term,
    meaning,
    kind,
    explanation,
    example: pair(en, es),
    ...(reference && { teaches: [reference] }),
  };
}

function teach(
  id: string,
  target: Target,
  title: string,
  text: string,
  examples: Translation[],
  references: readonly PrerequisiteReference[],
  vocabularyTerms?: string[],
  speaker: Speaker = 'Inés',
): TravelStep {
  return {
    id,
    type: 'teach',
    title,
    speaker,
    text,
    examples,
    vocabularyTerms,
    instruction: {
      lessonId: target.lessonId,
      stage: 'both',
      references: [grammar(target.conceptId), ...references],
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
    storyPrompt?: { speaker: Speaker; text: string };
    reply?: { speaker: Speaker; line: Translation };
    communicationOnly?: { answers: string[]; feedbackEs: string };
    selfCheck?: true;
  } = {},
): TravelExerciseStep {
  const {
    passage,
    evidence = 'production',
    errors,
    guided,
    remediates,
    requiredReply,
    storyPrompt,
    reply,
    communicationOnly,
    selfCheck,
  } = options;
  const { lessonId, conceptId } = target;
  const pattern = writingPatterns.get(conceptId);
  return {
    id,
    type: 'exercise',
    activityTitle: guided ? 'Practica con una pista' : 'Escribe tu mensaje',
    situation,
    lessonId,
    requiredReply,
    storyPrompt,
    storyReply: reply,
    requires: assessmentRequirements(id, target),
    targets: [
      { targetId: conceptId, dimension: 'grammar_production' },
      ...(pattern ? [{ targetId: pattern.id, dimension: 'writing' as const }] : []),
    ],
    exercise: {
      id,
      type: 'short_text',
      promptEs,
      acceptedAnswers,
      feedbackEs,
      passage,
      communicationOnly,
      ...(selfCheck && { ungradable: { feedbackEs } }),
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
  input: { audio: string; contrastNumbers?: readonly number[] } | { passage: string },
): TravelExerciseStep {
  const audio = 'audio' in input ? input.audio : undefined;
  const numberTargets = 'audio' in input ? (input.contrastNumbers ?? []) : [];

  const { lessonId, conceptId } = target;
  return {
    id,
    type: 'exercise',
    activityTitle: audio ? 'Escucha el horario' : 'Lee la agenda',
    situation,
    lessonId,
    requires: assessmentRequirements(id, target),
    targets: [
      { targetId: conceptId, dimension: audio ? 'listening' : 'reading' },
      ...numberTargets.map((number) => ({
        targetId: numberLearningId(number),
        dimension: 'listening' as const,
      })),
    ],
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
        evidence: numberTargets.length ? 'transfer' : 'understanding',
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
    word(
      'work',
      'trabajar',
      'Verbo',
      'I work every day.',
      'Trabajo todos los días.',
      'trabajar',
      w.work,
    ),
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
    word('I', 'yo', 'Pronombre', 'I work every day.', 'Trabajo todos los días.'),
    word('English', 'inglés', 'Sustantivo', 'I study English.', 'Estudio inglés.'),
    word('first', 'primero', 'Orden', 'First I get up.', 'Primero me levanto.'),
    word('then', 'después o luego', 'Orden', 'Then I have breakfast.', 'Luego desayuno.'),
    word('after', 'después de', 'Orden', 'I study after work.', 'Estudio después del trabajo.'),
    word(
      'after breakfast',
      'después de desayunar',
      'Orden',
      'After breakfast, I work.',
      'Después de desayunar, trabajo.',
    ),
    word(
      'morning',
      'mañana, parte del día',
      'Sustantivo',
      'Morning: I have breakfast.',
      'Por la mañana: desayuno.',
    ),
    word(
      'afternoon',
      'tarde, parte del día',
      'Sustantivo',
      'Afternoon: I study.',
      'Por la tarde: estudio.',
    ),
    word(
      'in the morning',
      'por la mañana',
      'Expresión de tiempo',
      'I get up in the morning.',
      'Me levanto por la mañana.',
    ),
    word(
      'in the afternoon',
      'por la tarde',
      'Expresión de tiempo',
      'I work in the afternoon.',
      'Trabajo por la tarde.',
    ),
    word('walk', 'caminar', 'Verbo', 'I walk every day.', 'Camino todos los días.'),
  ],
  steps: [
    teach(
      'mexico-routine-lesson',
      routine,
      'Quién hace qué',
      'Inés abre tu agenda. Con I, you, we o they, di quién hace la acción y luego el verbo base. Si hay un complemento, colócalo después del verbo. Every day se escribe en dos palabras y puede ir al principio o al final. Para ordenar tu rutina, first indica qué haces primero, then indica qué sigue y after breakfast ubica una acción después de desayunar. Morning y afternoon son encabezados de la agenda. Dentro de una oración, usa in the morning o in the afternoon.',
      [
        pair('We study English every day.', 'Estudiamos inglés todos los días.'),
        pair('I work and I study English.', 'Trabajo y estudio inglés.'),
        pair('You study in the morning.', 'Estudias por la mañana.'),
        pair('We have breakfast at home.', 'Desayunamos en casa.'),
        pair('They work every day.', 'Trabajan todos los días.'),
        pair('I live in Mexico City.', 'Vivo en la Ciudad de México.'),
        pair(
          'First I get up. Then I study. After breakfast, I work.',
          'Primero me levanto. Luego estudio. Después de desayunar, trabajo.',
        ),
      ],
      [p.routine, w.in, w.inPeriod, w.and, w.we, w.you],
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
      'Inés dice First I get up, luego Then I have breakfast y finalmente After breakfast, I work.',
      { audio: 'First I get up. Then I have breakfast. After breakfast, I work.' },
    ),
    comprehension(
      'mexico-routine-planner',
      routine,
      'mexico-visitor-planner',
      'Sam dejó dos renglones en su agenda. Busca el de la tarde.',
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
      'Entrada para la agenda de Inés. Actividad: estudiar inglés. Frecuencia: diaria.',
      'Escribe una frase en primera persona para la agenda. Usa every day para indicar la frecuencia.',
      ['I study English every day.', 'Every day I study English.', 'Every day, I study English.'],
      'Expresa quién realiza la acción con I y usa study sin -s. Every day puede ir al principio o al final.',
      {
        errors: ['subject_omission', 'word_order'],
        storyPrompt: {
          speaker: 'Inés',
          text: 'Estoy anotando los hábitos del grupo. ¿Qué actividad hago constar en tu agenda?',
        },
        reply: {
          speaker: 'Inés',
          line: pair(
            'You study English every day. I study on Saturdays.',
            'Estudias inglés todos los días. Yo estudio los sábados.',
          ),
        },
        communicationOnly: {
          answers: ['I study English daily.', 'I study English each day.'],
          feedbackEs: 'Se entiende la frecuencia. En esta nota, practica la expresión every day.',
        },
      },
    ),
    writing(
      'mexico-routine-self-check',
      routine,
      'mexico-personal-agenda',
      'Inés te deja un espacio para escribir sobre una mañana real o inventada. Tú eliges qué actividades anotar.',
      'Describe dos o tres actividades de tu rutina. Escribe en inglés y ordénalas con first, then o after cuando te sirvan.',
      [],
      'Compara tu nota con este ejemplo: «I get up in the morning. Then I work. After work, I study English.» Revisa si cada oración tiene un sujeto, si el verbo va en su forma base y si se entiende el orden. Puedes conservar tus propias actividades.',
      {
        selfCheck: true,
        storyPrompt: {
          speaker: 'Inés',
          text: '¿Cómo describirías tu mañana si pudieras elegir cualquier actividad?',
        },
      },
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
      'She cooks dinner.',
      'Ella prepara la cena.',
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
    word('watch', 'ver o mirar', 'Verbo', 'I watch a video.', 'Veo un video.'),
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
        pair('She works at home. He reads at home.', 'Ella trabaja en casa. Él lee en casa.'),
        pair('Sam watches a video.', 'Sam ve un video.'),
        pair('Inés studies English.', 'Inés estudia inglés.'),
      ],
      [p.others, w.works, w.studies, w.cooks, w.reads, w.watches, w.she, w.he, w.my],
      ['sister', 'brother', 'cook', 'read', 'at home', 'watch'],
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
      [p.frequency, p.frontFrequency],
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
      'Ficha de la hermana de Inés: Clara · cocinar · en casa. Sam quiere anotar un hábito de Clara.',
      'Escribe una oración sobre el hábito de Clara. Usa su nombre o el pronombre que le corresponde.',
      [
        ...answerVariants(['She', 'Clara', 'Inés’s sister'], ' cooks at home.'),
        ...answerVariants('At home', ['', ','], ' ', ['she', 'Clara'], ' cooks.'),
      ],
      'She se refiere a una sola persona. Escribe cooks y usa at home para indicar dónde.',
      {
        errors: ['third_person', 'subject_omission', 'preposition'],
        storyPrompt: {
          speaker: 'Sam',
          text: '¿Qué hace Clara en casa? Solo me falta ese dato en la ficha.',
        },
        reply: {
          speaker: 'Sam',
          line: pair(
            'Thanks! Now I know what Clara does at home.',
            '¡Gracias! Ahora sé qué hace Clara en casa.',
          ),
        },
      },
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
      'Para un hábito que ocurre los sábados, usa el plural Saturdays.',
      w.saturdays,
    ),
    word(
      'open',
      'abierto',
      'Adjetivo',
      'The market is open.',
      'El mercado está abierto.',
      'Estado de un lugar que ya recibe público.',
      w.openState,
    ),
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
    word('market', 'mercado', 'Sustantivo', 'The market is open.', 'El mercado está abierto.'),
    word('meet', 'encontrarse', 'Verbo', 'We meet on Saturday.', 'Nos encontramos el sábado.'),
    word('Friday', 'viernes', 'Día', 'We meet on Friday.', 'Nos encontramos el viernes.'),
    word('Saturday', 'sábado', 'Día', 'We meet on Saturday.', 'Nos encontramos el sábado.'),
    word(
      'Sunday',
      'domingo',
      'Día',
      'The market is closed on Sunday.',
      'El mercado está cerrado el domingo.',
    ),
    word(
      'Sundays',
      'domingos',
      'Día habitual',
      'We do not work on Sundays.',
      'No trabajamos los domingos.',
    ),
    word(
      'a.m.',
      'antes del mediodía',
      'Horario',
      'The market is open at eight a.m.',
      'El mercado está abierto a las ocho de la mañana.',
    ),
    word(
      'p.m.',
      'después del mediodía',
      'Horario',
      'We meet at two p.m.',
      'Nos encontramos a las dos de la tarde.',
    ),
    word(
      'noon',
      'mediodía',
      'Hora',
      'The market closes at noon.',
      'El mercado cierra al mediodía.',
    ),
  ],
  steps: [
    {
      id: 'mexico-time-numbers',
      type: 'teach',
      speaker: 'Sam',
      title: 'Números que aparecen en un horario',
      storyPrompt: {
        speaker: 'Sam',
        text: 'Tengo que entender dos horas que suenan casi igual. Repasemos los números del tablero.',
      },
      text: 'Del 0 al 12, practica cada número como una palabra. Del 13 al 19 el final suele sonar como teen. Aprende las decenas 20, 30, 40 y 50. Para 21–29, 31–39, 41–49 y 51–59, di la decena seguida de la unidad: twenty-one, thirty-two, forty-seven, fifty-nine. Por escrito, une las dos partes con un guion. Escucha fifteen y fifty. Después escucha thirteen y thirty. Para los minutos del 01 al 09, puedes leer el cero como oh: eight oh five.',
      examples: [
        pair(
          'Zero, one, two, three, four, five, six.',
          'Del 0 al 6: cero, uno, dos, tres, cuatro, cinco, seis.',
        ),
        pair(
          'Seven, eight, nine, ten, eleven, twelve.',
          'Del 7 al 12: siete, ocho, nueve, diez, once, doce.',
        ),
        pair(
          'Thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen.',
          'Del 13 al 19: trece, catorce, quince, dieciséis, diecisiete, dieciocho, diecinueve.',
        ),
        pair('Twenty, thirty, forty, fifty.', 'Veinte, treinta, cuarenta, cincuenta.'),
        pair(
          'Twenty-one, thirty-two, forty-seven, fifty-nine.',
          'Veintiuno, treinta y dos, cuarenta y siete, cincuenta y nueve.',
        ),
        pair('Fifteen, fifty. Thirteen, thirty.', 'Quince, cincuenta. Trece, treinta.'),
        pair('Eight oh five.', 'Ocho y cinco.'),
      ],
      vocabularyTerms: [],
      instruction: {
        lessonId: time.lessonId,
        stage: 'grammar',
        references: [...mexicoNumberRefs, w.zeroMinute],
      },
    },
    teach(
      'mexico-time-lesson',
      time,
      'At para una hora, on para un día',
      'Sam señala tres datos del tablero. Usa at para una hora exacta, on para un día e in para una parte del día. On Saturday señala un sábado y on Saturdays señala un hábito. Lee primero la hora y luego los minutos. Para una hora exacta puedes añadir o’clock. Para los 30 minutos, usa half past y la hora que ya pasó. En el tablero, OPEN y CLOSED son estados. A.M. indica antes del mediodía y P.M. después. El mediodía es noon.',
      [
        pair("at eight o'clock", 'a las ocho en punto'),
        pair('at half past eight', 'a las ocho y media'),
        pair('on Saturday morning', 'el sábado por la mañana'),
        pair('eight fifteen, eight fifty', 'ocho y quince, ocho y cincuenta'),
        pair('nine thirteen, nine thirty', 'nueve y trece, nueve y treinta'),
        pair('ten twenty-five', 'diez y veinticinco'),
        pair('We meet at six on Friday.', 'Nos encontramos el viernes a las seis.'),
        pair('We will meet at noon.', 'Nos encontraremos al mediodía.'),
        pair('Let’s meet on Friday at six.', 'Nos vemos el viernes a las seis.'),
        pair(
          'We can meet on Friday at six or on Saturday at ten.',
          'Podemos vernos el viernes a las seis o el sábado a las diez.',
        ),
        pair('The market is open.', 'El mercado está abierto.'),
        pair('I work in the afternoon.', 'Trabajo por la tarde.'),
      ],
      [
        p.clock,
        w.at,
        w.on,
        w.onDay,
        w.inPeriod,
        w.hourMinutes,
        w.wholeHour,
        w.thirtyMinute,
        w.appointment,
        w.can,
        w.or,
        w.will,
        w.lets,
        w.the,
      ],
      undefined,
      'Sam',
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
      { audio: 'We can meet at eight fifteen or nine thirty.', contrastNumbers: [15, 30] },
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
        passage: 'Market\nFriday: CLOSED\nSaturday: OPEN 8:00 a.m. – 12:00 noon\nSunday: CLOSED',
      },
    ),
    writing(
      'mexico-time-write',
      time,
      'mexico-visit-booking',
      'Borrador del viaje: día de la visita, sábado. Hora, 8:00 a. m. Sam quiere guardar el día y la hora en una frase.',
      'Escribe a Sam una nota en inglés que confirme los dos datos del borrador. Usa meet, on para el día y at para la hora.',
      [
        ...answerVariants(meetingVerbs, ' on Saturday at ', eightOClock, '.'),
        ...answerVariants(meetingVerbs, ' at ', eightOClock, ' on Saturday.'),
        ...answerVariants(
          'On Saturday',
          ['', ','],
          ' ',
          ['we meet', 'we will meet', 'let’s meet'],
          ' at ',
          eightOClock,
          '.',
        ),
      ],
      'On indica el día y at indica la hora. Puedes cambiar el orden de esos dos datos.',
      {
        errors: ['preposition', 'word_order'],
        storyPrompt: {
          speaker: 'Sam',
          text: 'Voy a guardar un horario de prueba. ¿Me confirmas el día y la hora?',
        },
        reply: {
          speaker: 'Sam',
          line: pair(
            'Saturday at eight. I’ll write that down.',
            'El sábado a las ocho. Voy a anotarlo.',
          ),
        },
      },
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
      'Aquí open es la acción de abrir un establecimiento. En The market is open, open describe su estado.',
      w.openAction,
    ),
    word('close', 'cerrar', 'Verbo', 'When does the market close?', '¿Cuándo cierra el mercado?'),
    word(
      'available',
      'disponible',
      'Adjetivo',
      'I am available at noon.',
      'Estoy disponible al mediodía.',
    ),
    word('meet', 'encontrarse', 'Verbo', 'We meet on Saturday.', 'Nos encontramos el sábado.'),
    word('what time', 'a qué hora', 'Pregunta', 'What time do you study?', '¿A qué hora estudias?'),
    word('start', 'empezar', 'Verbo', 'I start work at eight.', 'Empiezo a trabajar a las ocho.'),
    word('go', 'ir', 'Verbo', 'We go to the market.', 'Vamos al mercado.'),
    word('yes', 'sí', 'Respuesta', 'Yes, I do.', 'Sí.'),
    word('no', 'no', 'Respuesta', 'No, I don’t.', 'No.'),
  ],
  steps: [
    teach(
      'mexico-questions-lesson',
      questions,
      'Pregunta por un plan',
      'Inés quiere comprobar si el mercado abre antes de su turno. Pon do antes de I, you, we o they. Usa does antes de he, she o un sujeto singular. Después del sujeto va el verbo base: Does she work? Si quieres el momento, agrega When o What time al comienzo. Fíjate en la diferencia entre open como verbo, Does the market open?, y open como estado, The market is open. Para preguntar cuándo comienza un turno, puedes usar start work o start working. En start work, work es el trabajo o el turno. En Does she work?, work es el verbo trabajar. Excuse me llama la atención y please hace la pregunta amable.',
      [
        pair('When do you work?', '¿Cuándo trabajas?'),
        pair('What time does Sam start work?', '¿A qué hora empieza a trabajar Sam?'),
        pair('When does your brother start working?', '¿Cuándo empieza a trabajar tu hermano?'),
        pair(
          'Excuse me. Does the market open at eight, please?',
          'Disculpa. ¿El mercado abre a las ocho?',
        ),
        pair('Does the market open at eight?', '¿Abre el mercado a las ocho?'),
        pair('Can we meet at eight?', '¿Podemos encontrarnos a las ocho?'),
      ],
      [
        p.question,
        w.do,
        w.does,
        w.timeQuestion,
        w.your,
        w.workActivity,
        w.working,
        w.excuseMe,
        w.please,
      ],
    ),
    teach(
      'mexico-negative-lesson',
      negatives,
      'Explica qué hora no sirve',
      'Inés distingue una hora posible y otra que descarta. Usa do not o don’t con I, you, we o they. Usa does not o doesn’t con he, she o una sola persona. Después coloca el verbo base. Si describes disponibilidad, usa am o is: I am available, she is available. Propón una hora con Let’s meet y luego expresa el horario con at y, si hace falta, el día con on.',
      [
        pair("I don't work at eight.", 'No trabajo a las ocho.'),
        pair("She doesn't go to the market at noon.", 'Ella no va al mercado al mediodía.'),
        pair('She does not go at noon.', 'Ella no va al mediodía.'),
        pair('She is available at eight.', 'Ella está disponible a las ocho.'),
        pair('Let’s meet on Friday at six.', 'Nos vemos el viernes a las seis.'),
      ],
      [
        p.negative,
        w.doNot,
        w.doesNot,
        w.dont,
        w.doesnt,
        form('form.u03_l02.7', 'I'),
        form('form.u03_l02.8', 'she'),
        w.meetProposal,
        w.am,
        w.to,
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
      requires: assessmentRequirements('mexico-agreement-build', questions),
      targets: [{ targetId: questions.conceptId, dimension: 'grammar_production' }],
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
      'Anotación de Inés: su hermana empieza a trabajar el sábado. La hora de inicio quedó en blanco.',
      'Pregúntale a Inés, en inglés, a qué hora empieza el turno de su hermana. Usa una pregunta directa con does.',
      answerVariants(
        ['', 'Excuse me, '],
        ['What time', 'When'],
        ' does your sister start ',
        ['work', 'working'],
        ['?', ', please?'],
      ),
      'Empieza con What time o When, luego does, el sujeto y el verbo base start.',
      {
        errors: ['third_person', 'word_order'],
        storyPrompt: { speaker: 'Inés', text: '¿Qué dato necesitas sobre el turno de mi hermana?' },
        reply: {
          speaker: 'Inés',
          line: pair('She starts work at noon.', 'Empieza a trabajar al mediodía.'),
        },
      },
    ),
    writing(
      'mexico-agreement-confirm',
      negatives,
      'mexico-market-confirmation',
      'Plan para Sam: Inés puede ir al mercado a las 8:00 a. m. A las 10:00 a. m. trabaja y no va al mercado.',
      'Escribe a Sam en inglés. Confirma la hora de encuentro y usa doesn’t o does not para descartar las diez.',
      [
        ...answerVariants(
          meetingVerbs,
          ' at ',
          eightOClock,
          '. ',
          ['She', 'Inés'],
          ' doesn’t go',
          ['', ' to the market'],
          ' at ',
          tenOClock,
          '.',
        ),
        ...answerVariants(
          meetingVerbs,
          ' at ',
          ['eight', '8:00'],
          ', and ',
          ['she', 'Inés'],
          ' doesn’t go',
          ['', ' to the market'],
          ' at ',
          tenOClock,
          '.',
        ),
        ...answerVariants(
          'At eight',
          ['', ','],
          ' we meet. ',
          ['She', 'Inés'],
          ' doesn’t go at ten.',
        ),
      ],
      'En una confirmación puedes decir We meet o Let’s meet. Con she, usa doesn’t o does not, seguido del verbo base go.',
      {
        errors: ['third_person', 'preposition'],
        requiredReply: true,
        storyPrompt: {
          speaker: 'Sam',
          text: 'Ya anoté dos horas distintas. ¿A cuál vamos? ¿Cuál descarta Inés?',
        },
        reply: {
          speaker: 'Sam',
          line: pair(
            'Eight works. See you at the market!',
            'A las ocho está bien. ¡Nos vemos en el mercado!',
          ),
        },
        communicationOnly: {
          answers: answerVariants(
            meetingVerbs,
            ' at ',
            ['eight', '8:00'],
            '. ',
            ['She', 'Inés'],
            [' works at ten.', ' can’t go at ten.', ' is not available at ten.'],
          ),
          feedbackEs:
            'La hora y el motivo se entienden. Para practicar la forma de esta lección, usa doesn’t o does not más go.',
        },
      },
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
    word(
      'study room',
      'sala de estudio',
      'Lugar',
      'The study room is open.',
      'La sala de estudio está abierta.',
    ),
  ],
  steps: [
    {
      id: 'mexico-transfer-intro',
      type: 'teach',
      speaker: 'Leo',
      title: 'Un lugar y un día distintos',
      storyPrompt: {
        speaker: 'Leo',
        text: 'Ya organizaste la visita al mercado. ¿Me ayudas a encontrar otra hora para practicar inglés en la biblioteca?',
      },
      text: 'Leo señala el cartel de la sala de estudio. Usa at the library para indicar el lugar y compara OPEN y CLOSED. This Friday habla del viernes próximo. Para acordar el estudio, combina la hora que hay en el cartel con el turno de su hermana.',
      examples: [
        pair('We study at the library on Friday.', 'Estudiamos en la biblioteca el viernes.'),
        pair('We study at the library this Friday.', 'Estudiamos en la biblioteca este viernes.'),
        pair('The study room is closed on Saturday.', 'La sala de estudio está cerrada el sábado.'),
      ],
      instruction: { lessonId: time.lessonId, stage: 'both', references: [w.this] },
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
      'La biblioteca está abierta el viernes. Aún no sabes si la hermana de Leo trabaja ese día.',
      'Pregúntale a Leo en inglés si su hermana trabaja el viernes. Usa una pregunta directa con does.',
      [
        ...answerVariants(
          ['', 'Excuse me, '],
          'Does your sister work ',
          ['on Friday', 'this Friday', 'Friday'],
          ['?', ', please?'],
        ),
        ...answerVariants('On Friday', ['', ','], ' does your sister work?'),
      ],
      'Your sister es una persona, por eso la pregunta lleva does. Work conserva su forma base.',
      {
        evidence: 'transfer',
        errors: ['third_person', 'word_order'],
        storyPrompt: {
          speaker: 'Leo',
          text: 'Mi hermana también quiere venir. ¿Qué necesitas confirmar antes de escoger la hora?',
        },
        reply: {
          speaker: 'Leo',
          line: pair(
            'Yes. She works until three. She can come at half past three.',
            'Sí. Trabaja hasta las tres. Puede venir a las tres y media.',
          ),
        },
      },
    ),
    writing(
      'mexico-transfer-write',
      time,
      'mexico-library-classmate',
      'Leo trae el plan: biblioteca, viernes. Su hermana llega a las 3:30 p. m. y la sala cierra a las 4:00 p. m.',
      'Confirma a Leo el lugar, el día y la hora en una frase en inglés. Usa meet, on para el día y at para indicar la hora.',
      [
        ...answerVariants(
          meetingVerbs,
          [' at', ' in'],
          ' the library on Friday at ',
          halfPastThree,
          '.',
        ),
        ...answerVariants(
          meetingVerbs,
          [' at', ' in'],
          ' the library at ',
          halfPastThree,
          ' on Friday.',
        ),
        ...answerVariants(meetingVerbs, ' at ', halfPastThree, [
          ' on Friday at the library.',
          ' at the library on Friday.',
        ]),
        ...answerVariants(meetingVerbs, ' on Friday at ', halfPastThree, ' at the library.'),
        ...answerVariants(
          'On Friday',
          ['', ','],
          ' ',
          ['we meet', 'we will meet', 'let’s meet'],
          ' at the library at ',
          halfPastThree,
          '.',
        ),
      ],
      'Confirma los tres datos. Usa at the library, on Friday y at half past three o at three thirty.',
      {
        evidence: 'transfer',
        errors: ['preposition'],
        requiredReply: true,
        storyPrompt: {
          speaker: 'Leo',
          text: 'Escríbeme dónde y cuándo nos vemos para avisarle a mi hermana.',
        },
        reply: {
          speaker: 'Leo',
          line: pair(
            'Friday at half past three at the library. Thanks!',
            'El viernes a las tres y media en la biblioteca. ¡Gracias!',
          ),
        },
      },
    ),
  ],
};

export const mexicoChapter = {
  id: 'mexico',
  revision: 2,
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
