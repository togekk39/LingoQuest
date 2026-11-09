/** Original es-419 / en-US course. Each task is authored for a communication goal.
 * No text, dialogue, illustration, or audio was copied from a textbook. */
export type Word = readonly [
  en: string,
  es: string,
  exampleEn: string,
  exampleEs: string,
  partOfSpeech?: string,
];
export type Task =
  | { type: 'cloze'; prompt: string; sentence: string; answers: string[]; reason: string }
  | { type: 'reorder'; prompt: string; answer: string; reason: string }
  | { type: 'correction'; prompt: string; sentence: string; answers: string[]; reason: string }
  | { type: 'short_text'; prompt: string; answers: string[]; reason: string; recall?: boolean };
export interface LessonAuthoring {
  title: string;
  goal: string;
  scene: string;
  words: Word[];
  recycle: string[];
  skill: string;
  rule: string;
  forms: [string, string][];
  examples: [string, string][];
  dialogue: [string, string, string][];
  tasks: Task[];
}
const fill = (sentence: string, answers: string[], reason: string): Task => ({
  type: 'cloze',
  prompt: 'Completa solo la parte que falta.',
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
export const authoredUnits: {
  title: string;
  description: string;
  cefr: 'A1' | 'A2';
  lessons: LessonAuthoring[];
}[] = [
  {
    title: '¡Hola! Mucho gusto',
    description: 'Saluda, presenta a tu familia y haz preguntas sencillas.',
    cefr: 'A1',
    lessons: [
      {
        title: 'Me presento',
        goal: 'Saludar y decir quién eres con I am; reconocer a otra persona con You are.',
        scene:
          'Llegas a un encuentro de vecinos. Vas a saludar y presentarte con dos frases cortas. Ana y Luis son nombres de personas; no necesitas traducirlos.',
        words: [
          ['hello', 'hola', 'Hello, Ana.', 'Hola, Ana.', 'saludo'],
          ['hi', 'hola (informal)', 'Hi, Luis.', 'Hola, Luis.', 'saludo'],
          ['goodbye', 'adiós', 'Goodbye, Ana.', 'Adiós, Ana.', 'despedida'],
          ['I', 'yo', 'I am Ana.', 'Soy Ana.', 'pronombre'],
          ['you', 'tú; usted; ustedes', 'You are Luis.', 'Tú eres Luis.', 'pronombre'],
          ['my', 'mi', 'my friend', 'mi amigo o amiga', 'posesivo'],
          ['name', 'nombre', 'my name', 'mi nombre', 'sustantivo'],
          ['friend', 'amigo o amiga', 'my friend', 'mi amigo o amiga', 'sustantivo'],
        ],
        recycle: [],
        skill: 'grammar.be_i_you',
        rule: 'I significa yo. Para decir quién eres, combina I + am + tu nombre: I am Ana. Am expresa soy con I. You significa tú y lleva are: You are Luis. En inglés no omitas I o you. My friend significa mi amigo o amiga. Aprenderemos a decir “mi nombre es” después; aquí basta I am.',
        forms: [
          ['am', 'soy (con I)'],
          ['are', 'eres; son (con you)'],
        ],
        examples: [
          ['I am Ana.', 'Soy Ana.'],
          ['You are my friend.', 'Tú eres mi amigo o amiga.'],
        ],
        dialogue: [
          ['Ana', 'Hello. I am Ana.', 'Hola. Soy Ana.'],
          ['Luis', 'Hi. I am Luis.', 'Hola. Soy Luis.'],
          ['Ana', 'Goodbye, Luis.', 'Adiós, Luis.'],
          ['Luis', 'Goodbye, Ana.', 'Adiós, Ana.'],
        ],
        tasks: [
          fill('I ____ Ana.', ['am'], 'I se combina con am para decir soy.'),
          fill('You ____ Luis.', ['are'], 'You se combina con are. Luis es un nombre de persona.'),
          recall(
            'Sin opciones, escribe la palabra inglesa que significa «hola» (la forma de cinco letras).',
            'hello',
            'Hello es un saludo; hi también saluda, pero tiene dos letras.',
          ),
          write(
            'Preséntate como Ana: saluda con Hello o Hi y di «Soy Ana».',
            ['Hello. I am Ana.', 'Hi. I am Ana.', 'Hello, I am Ana.', 'Hi, I am Ana.'],
            'Un saludo y I am Ana forman una presentación breve. Puedes usar tu propio nombre al practicar la voz.',
          ),
        ],
      },
      {
        title: 'Esta es mi familia',
        goal: 'Presentar a una persona de tu familia con he is o she is.',
        scene:
          'Muestras a una amiga una foto de tu familia. Cada oración presenta a una sola persona.',
        words: [
          ['mother', 'mamá; madre', 'She is my mother.', 'Ella es mi mamá.'],
          ['father', 'papá; padre', 'He is my father.', 'Él es mi papá.'],
          ['brother', 'hermano', 'He is my brother.', 'Él es mi hermano.'],
          ['sister', 'hermana', 'She is my sister.', 'Ella es mi hermana.'],
          ['teacher', 'docente; profesor o profesora', 'She is a teacher.', 'Ella es docente.'],
          ['student', 'estudiante', 'He is a student.', 'Él es estudiante.'],
        ],
        recycle: ['my', 'friend'],
        skill: 'grammar.be_he_she',
        rule: 'He significa él y she significa ella. Ambos llevan is: He is my brother. Is aquí significa es. Para una ocupación usa a antes de una palabra que empieza con sonido consonante: a teacher, a student. My indica mi y no cambia según el género.',
        forms: [
          ['he', 'él'],
          ['she', 'ella'],
          ['is', 'es; está'],
          ['a', 'un; una'],
        ],
        examples: [
          ['She is my sister.', 'Ella es mi hermana.'],
          ['He is a student.', 'Él es estudiante.'],
        ],
        dialogue: [
          ['Ana', 'He is my brother.', 'Él es mi hermano.'],
          ['Luis', 'Hello. I am Luis.', 'Hola. Soy Luis.'],
          ['Ana', 'She is my mother. She is a teacher.', 'Ella es mi mamá. Es docente.'],
        ],
        tasks: [
          fill('She ____ my mother.', ['is'], 'She lleva is.'),
          build('He is my father.', 'He is presenta a un hombre; my father significa mi papá.'),
          recall(
            'Recuerda la palabra inglesa para «hermana».',
            'sister',
            'Sister significa hermana; brother significa hermano.',
          ),
          write(
            'Presenta a tu hermano: «Él es mi hermano».',
            ['He is my brother.'],
            'He + is + my brother presenta a tu hermano.',
          ),
        ],
      },
      {
        title: 'Personas y cosas',
        goal: 'Describir una cosa con it is y varias personas con they are.',
        scene:
          'Ordenas una mesa con tu familia. Hablas de un objeto y de cómo se sienten las personas.',
        words: [
          ['book', 'libro', 'It is a book.', 'Es un libro.'],
          ['phone', 'teléfono', 'It is my phone.', 'Es mi teléfono.'],
          ['house', 'casa', 'It is a small house.', 'Es una casa pequeña.'],
          ['happy', 'feliz; felices', 'They are happy.', 'Están felices.', 'adjetivo'],
          ['good', 'bueno; buena', 'It is a good book.', 'Es un buen libro.', 'adjetivo'],
          ['small', 'pequeño; pequeña', 'It is small.', 'Es pequeño.', 'adjetivo'],
        ],
        recycle: ['student', 'friend'],
        skill: 'grammar.be_it_they',
        rule: 'It se usa para una cosa y lleva is. They se usa para varias personas o cosas y lleva are. Una descripción va después de be: They are happy. Antes de un sustantivo, el adjetivo va primero: a small house. El adjetivo no agrega una s para el plural.',
        forms: [
          ['it', 'eso; pronombre para una cosa'],
          ['they', 'ellos; ellas'],
          ['and', 'y'],
        ],
        examples: [
          ['It is a good book.', 'Es un buen libro.'],
          ['They are happy.', 'Están felices.'],
        ],
        dialogue: [
          ['Luis', 'It is my phone.', 'Es mi teléfono.'],
          ['Ana', 'It is small.', 'Es pequeño.'],
          [
            'Luis',
            'They are my mother and my father. They are happy.',
            'Ellos son mi mamá y mi papá. Están felices.',
          ],
        ],
        tasks: [
          fill('It ____ a book.', ['is'], 'Una cosa: it is.'),
          build('They are happy.', 'Varias personas: they are. Happy no cambia.'),
          write(
            'Describe el objeto: «Es una casa pequeña».',
            ['It is a small house.'],
            'Small va antes de house: a small house.',
          ),
        ],
      },
      {
        title: '¿Quién eres?',
        goal: 'Preguntar quién es alguien y de dónde es usando be.',
        scene:
          'Conoces a otra persona en una reunión. Usas preguntas breves y respondes con tu nombre u origen.',
        words: [
          ['who', 'quién', 'Who are you?', '¿Quién eres?', 'palabra interrogativa'],
          [
            'what',
            'qué; cuál',
            'What is your name?',
            '¿Cuál es tu nombre?',
            'palabra interrogativa',
          ],
          ['where', 'dónde', 'Where are you from?', '¿De dónde eres?', 'palabra interrogativa'],
          ['from', 'de (origen)', 'I am from Peru.', 'Soy de Perú.', 'preposición'],
          ['yes', 'sí', 'Yes, I am.', 'Sí.', 'respuesta'],
          ['no', 'no', 'No, I am not.', 'No.', 'respuesta'],
        ],
        recycle: ['name', 'student'],
        skill: 'grammar.be_questions',
        rule: 'En una pregunta, coloca am, is o are antes de la persona: Are you a student? Who are you? pregunta quién eres. Where are you from? pregunta de dónde eres. Responde Yes, I am o No, I am not. Not añade la negación. My name is Ana significa mi nombre es Ana; name es singular y lleva is.',
        forms: [
          ['not', 'no (negación)'],
          ['your', 'tu; tus; su (de usted o ustedes)'],
        ],
        examples: [
          ['Where are you from?', '¿De dónde eres?'],
          ['My name is Ana.', 'Mi nombre es Ana.'],
        ],
        dialogue: [
          ['Luis', 'Hello. What is your name?', 'Hola. ¿Cuál es tu nombre?'],
          ['Ana', 'My name is Ana. I am from Peru.', 'Mi nombre es Ana. Soy de Perú.'],
          ['Luis', 'Are you a student?', '¿Eres estudiante?'],
          ['Ana', 'Yes, I am.', 'Sí.'],
        ],
        tasks: [
          fill('Where ____ you from?', ['are'], 'You lleva are; en preguntas va antes de you.'),
          build('Are you a student?', 'Pregunta con are + you.'),
          recall(
            'Escribe la palabra inglesa para preguntar «dónde».',
            'where',
            'Where pregunta por un lugar.',
          ),
          write(
            'Responde «Soy de Perú». Usa Peru sin tilde en inglés.',
            ['I am from Peru.'],
            'I am from + lugar expresa tu origen.',
          ),
        ],
      },
    ],
  },
  {
    title: 'Mi día a día',
    description: 'Habla de hábitos y comparte una rutina sencilla.',
    cefr: 'A1',
    lessons: [
      {
        title: 'Así es mi día',
        goal: 'Contar dos hábitos con I y un verbo en presente.',
        scene: 'Conversas sobre lo que haces en un día normal, no solo en este instante.',
        words: [
          ['work', 'trabajar', 'I work.', 'Trabajo.', 'verbo'],
          ['study', 'estudiar', 'I study English.', 'Estudio inglés.', 'verbo'],
          ['live', 'vivir', 'I live in Peru.', 'Vivo en Perú.', 'verbo'],
          ['walk', 'caminar', 'I walk every day.', 'Camino todos los días.', 'verbo'],
          ['drink', 'beber; tomar', 'I drink water.', 'Tomo agua.', 'verbo'],
          ['water', 'agua', 'I drink water.', 'Tomo agua.'],
          ['English', 'inglés', 'I study English.', 'Estudio inglés.'],
          [
            'every day',
            'todos los días',
            'I study every day.',
            'Estudio todos los días.',
            'expresión de tiempo',
          ],
        ],
        recycle: ['I', 'you'],
        skill: 'grammar.routine_base',
        rule: 'Para un hábito con I o you usa el verbo sin am ni are: I work, You study. Every day indica todos los días. In significa en: I live in Peru. La palabra English lleva mayúscula.',
        forms: [['in', 'en']],
        examples: [
          ['I study English every day.', 'Estudio inglés todos los días.'],
          ['You drink water.', 'Tú tomas agua.'],
        ],
        dialogue: [
          ['Ana', 'I study English every day.', 'Estudio inglés todos los días.'],
          ['Luis', 'I work. I walk every day.', 'Trabajo. Camino todos los días.'],
          ['Ana', 'I drink water.', 'Tomo agua.'],
        ],
        tasks: [
          fill('I ____ English.', ['study'], 'I + study expresa un hábito; no necesita am.'),
          build('I drink water every day.', 'I drink + lo que tomas + every day.'),
          recall('Escribe el verbo inglés que significa «trabajar».', 'work', 'Work es trabajar.'),
          write(
            'Cuenta tu hábito: «Estudio inglés todos los días».',
            ['I study English every day.', 'Every day I study English.'],
            'Usa I study y every day para expresar el hábito.',
          ),
        ],
      },
      {
        title: 'Un día en familia',
        goal: 'Describir el hábito de otra persona con he o she.',
        scene: 'Cuentas cómo comparten las tareas en casa. Ahora hablas de una sola persona.',
        words: [
          ['cook', 'cocinar', 'She cooks dinner.', 'Ella prepara la cena.', 'verbo'],
          ['read', 'leer', 'He reads a book.', 'Él lee un libro.', 'verbo'],
          ['eat', 'comer', 'She eats at home.', 'Ella come en casa.', 'verbo'],
          ['dinner', 'cena', 'I cook dinner.', 'Preparo la cena.'],
          ['at home', 'en casa', 'He works at home.', 'Él trabaja en casa.', 'expresión'],
          ['together', 'juntos; juntas', 'They eat together.', 'Comen juntos.', 'adverbio'],
        ],
        recycle: ['mother', 'study'],
        skill: 'grammar.routine_third_person',
        rule: 'Con he, she o el nombre de una persona, el verbo suele agregar -s: work → works, cook → cooks, read → reads. Study cambia a studies. Con I, you o they conserva la forma base. Solo practicamos estas formas; no necesitas memorizar todas las terminaciones hoy.',
        forms: [
          ['works', 'trabaja'],
          ['studies', 'estudia'],
          ['lives', 'vive'],
          ['walks', 'camina'],
          ['drinks', 'toma'],
          ['cooks', 'cocina'],
          ['reads', 'lee'],
          ['eats', 'come'],
        ],
        examples: [
          ['She cooks dinner.', 'Ella prepara la cena.'],
          ['He studies English at home.', 'Él estudia inglés en casa.'],
        ],
        dialogue: [
          ['Ana', 'My mother works at home.', 'Mi mamá trabaja en casa.'],
          ['Luis', 'My father cooks dinner.', 'Mi papá prepara la cena.'],
          ['Ana', 'They eat together.', 'Comen juntos.'],
        ],
        tasks: [
          fill('She ____ dinner. (cocinar)', ['cooks'], 'Con she agrega -s: cooks.'),
          build('He reads a book at home.', 'He lleva reads; at home indica dónde.'),
          fix('She study English.', 'She studies English.', 'Study cambia a studies con she.'),
          write(
            'Di «Mi papá prepara la cena».',
            ['My father cooks dinner.'],
            'My father es una persona: cooks.',
          ),
        ],
      },
      {
        title: '¿Con qué frecuencia?',
        goal: 'Contar con qué frecuencia haces una actividad.',
        scene: 'Comparas hábitos con una amiga sin calificar unos hábitos como mejores que otros.',
        words: [
          ['always', 'siempre', 'I always drink water.', 'Siempre tomo agua.', 'adverbio'],
          ['usually', 'normalmente', 'I usually walk.', 'Normalmente camino.', 'adverbio'],
          ['sometimes', 'a veces', 'I sometimes cook.', 'A veces cocino.', 'adverbio'],
          ['never', 'nunca', 'I never work at night.', 'Nunca trabajo por la noche.', 'adverbio'],
          [
            'in the morning',
            'por la mañana',
            'I read in the morning.',
            'Leo por la mañana.',
            'expresión de tiempo',
          ],
          [
            'at night',
            'por la noche',
            'She studies at night.',
            'Ella estudia por la noche.',
            'expresión de tiempo',
          ],
        ],
        recycle: ['drink', 'at home'],
        skill: 'grammar.frequency',
        rule: 'Always, usually, sometimes y never suelen ir entre la persona y el verbo: I usually walk. Con she o he se conserva la -s: She always reads. Never ya significa nunca; no agregues otra negación.',
        forms: [['the', 'el; la; los; las']],
        examples: [
          ['I usually study at night.', 'Normalmente estudio por la noche.'],
          ['She always drinks water.', 'Ella siempre toma agua.'],
        ],
        dialogue: [
          ['Luis', 'I usually study at night.', 'Normalmente estudio por la noche.'],
          ['Ana', 'I sometimes study in the morning.', 'A veces estudio por la mañana.'],
          ['Luis', 'I never work at night.', 'Nunca trabajo por la noche.'],
        ],
        tasks: [
          fill(
            'I ____ drink water. (siempre)',
            ['always'],
            'Always significa siempre y va antes de drink.',
          ),
          build('She usually eats at home.', 'Usually va antes de eats.'),
          recall(
            'Recuerda la expresión inglesa para «a veces».',
            'sometimes',
            'Sometimes expresa que algo ocurre algunas veces.',
          ),
          write(
            'Di «Nunca trabajo por la noche».',
            ['I never work at night.'],
            'Never va antes de work y ya expresa negación.',
          ),
        ],
      },
      {
        title: 'Organizo mi rutina',
        goal: 'Indicar a qué hora ocurre un hábito.',
        scene:
          'Describes una mañana de trabajo. Seis y ocho son horas de ejemplo; puedes usar tus horarios al hablar.',
        words: [
          ['get up', 'levantarse', 'I get up at six.', 'Me levanto a las seis.', 'verbo'],
          ['start', 'empezar', 'I start work at eight.', 'Empiezo a trabajar a las ocho.', 'verbo'],
          [
            'have breakfast',
            'desayunar',
            'I have breakfast at home.',
            'Desayuno en casa.',
            'expresión verbal',
          ],
          [
            'go home',
            'ir a casa',
            'I go home after work.',
            'Voy a casa después del trabajo.',
            'expresión verbal',
          ],
          [
            'at six',
            'a las seis',
            'I get up at six.',
            'Me levanto a las seis.',
            'expresión de tiempo',
          ],
          [
            'at eight',
            'a las ocho',
            'I start work at eight.',
            'Empiezo a trabajar a las ocho.',
            'expresión de tiempo',
          ],
          [
            'after work',
            'después del trabajo',
            'I read after work.',
            'Leo después del trabajo.',
            'expresión de tiempo',
          ],
          ['at noon', 'al mediodía', 'I eat at noon.', 'Como al mediodía.', 'expresión de tiempo'],
        ],
        recycle: ['every day', 'dinner'],
        skill: 'grammar.routine_time',
        rule: 'Usa at para una hora o el mediodía: at six, at eight, at noon. Puedes poner el momento al final: I eat at noon. Get up y have breakfast funcionan como expresiones completas. Con he o she cambian a gets up y has breakfast.',
        forms: [
          ['at', 'a; en (hora o lugar)'],
          ['gets up', 'se levanta'],
          ['has breakfast', 'desayuna'],
          ['starts', 'empieza'],
          ['goes home', 'va a casa'],
        ],
        examples: [
          ['I get up at six.', 'Me levanto a las seis.'],
          ['She has breakfast at eight.', 'Ella desayuna a las ocho.'],
        ],
        dialogue: [
          [
            'Ana',
            'I get up at six. I have breakfast at home.',
            'Me levanto a las seis. Desayuno en casa.',
          ],
          ['Luis', 'I start work at eight.', 'Empiezo a trabajar a las ocho.'],
          ['Ana', 'I go home after work.', 'Voy a casa después del trabajo.'],
        ],
        tasks: [
          fill('I get up ____ six.', ['at'], 'At conecta un hábito con una hora.'),
          build('She has breakfast at eight.', 'Con she la expresión es has breakfast.'),
          write(
            'Cuenta dos momentos: «Me levanto a las seis. Como al mediodía».',
            ['I get up at six. I eat at noon.'],
            'Dos oraciones breves pueden organizar tu día con claridad.',
          ),
        ],
      },
    ],
  },
  {
    title: 'Lo que necesito',
    description: 'Pregunta por gustos, expresa necesidades y ubica servicios.',
    cefr: 'A1',
    lessons: [
      {
        title: 'Conozco tus gustos',
        goal: 'Preguntar por gustos con do y does.',
        scene: 'Planeas una comida sencilla y preguntas qué le gusta a otra persona.',
        words: [
          ['like', 'gustar', 'I like coffee.', 'Me gusta el café.', 'verbo'],
          ['coffee', 'café', 'Do you like coffee?', '¿Te gusta el café?'],
          ['tea', 'té', 'She likes tea.', 'A ella le gusta el té.'],
          ['music', 'música', 'Do you like music?', '¿Te gusta la música?'],
          ['rice', 'arroz', 'I like rice.', 'Me gusta el arroz.'],
          ['fruit', 'fruta', 'He likes fruit.', 'A él le gusta la fruta.'],
        ],
        recycle: ['you', 'dinner'],
        skill: 'grammar.do_questions',
        rule: 'Para preguntar por un hábito o gusto usa Do + you + verbo. Con he o she usa Does + persona + verbo base: Does she like tea? Does ya marca la tercera persona; like no lleva -s en esa pregunta.',
        forms: [
          ['do', 'auxiliar de pregunta con I/you/they'],
          ['does', 'auxiliar de pregunta con he/she/it'],
          ['likes', 'le gusta'],
        ],
        examples: [
          ['Do you like coffee?', '¿Te gusta el café?'],
          ['Does she like tea?', '¿A ella le gusta el té?'],
        ],
        dialogue: [
          ['Ana', 'Do you like coffee?', '¿Te gusta el café?'],
          ['Luis', 'Yes, I do.', 'Sí.'],
          ['Ana', 'Does your sister like tea?', '¿A tu hermana le gusta el té?'],
          ['Luis', 'Yes, she does.', 'Sí.'],
        ],
        tasks: [
          fill('____ you like rice?', ['Do'], 'You requiere Do para preguntar por gustos.'),
          build('Does she like music?', 'Does + she + like; like va en forma base.'),
          fix('Does he likes fruit?', 'Does he like fruit?', 'Después de does usa like.'),
          write(
            'Pregunta «¿Te gusta el té?».',
            ['Do you like tea?'],
            'Do you like + cosa pregunta por un gusto.',
          ),
        ],
      },
      {
        title: 'Lo que prefiero',
        goal: 'Expresar un gusto o hábito negativo con do not y does not.',
        scene: 'Eliges algo para comer y explicas tus preferencias sin tener que justificarlas.',
        words: [
          ['milk', 'leche', 'I do not drink milk.', 'No tomo leche.'],
          ['bread', 'pan', 'She likes bread.', 'A ella le gusta el pan.'],
          ['meat', 'carne', 'I do not eat meat.', 'No como carne.'],
          ['juice', 'jugo', 'I drink juice.', 'Tomo jugo.'],
          ['want', 'querer', 'I want water.', 'Quiero agua.', 'verbo'],
          ['today', 'hoy', 'I do not work today.', 'Hoy no trabajo.', 'expresión de tiempo'],
        ],
        recycle: ['like', 'drink'],
        skill: 'grammar.dont',
        rule: 'Para negar con I o you, usa do not antes del verbo: I do not eat meat. Con she o he usa does not y el verbo base: She does not drink milk. Las formas cortas don’t y doesn’t expresan lo mismo.',
        forms: [
          ['do not', 'no (con I/you/they)'],
          ['does not', 'no (con he/she/it)'],
          ["don't", 'do not, forma corta'],
          ["doesn't", 'does not, forma corta'],
        ],
        examples: [
          ['I do not eat meat.', 'No como carne.'],
          ['She does not drink milk.', 'Ella no toma leche.'],
        ],
        dialogue: [
          ['Luis', 'Do you want milk?', '¿Quieres leche?'],
          ['Ana', 'No. I do not drink milk. I want juice.', 'No. No tomo leche. Quiero jugo.'],
          ['Luis', 'I do not want juice today. I want water.', 'Hoy no quiero jugo. Quiero agua.'],
        ],
        tasks: [
          fill('She ____ not drink milk.', ['does'], 'Con she usa does not + verbo base.'),
          build('I do not eat meat.', 'Do not va antes de eat.'),
          recall('Escribe la palabra inglesa para «jugo».', 'juice', 'Juice significa jugo.'),
          write(
            'Di «No quiero café».',
            ['I do not want coffee.', "I don't want coffee."],
            'Ambas formas, do not y don’t, sirven para negar.',
          ),
        ],
      },
      {
        title: 'Pido ayuda',
        goal: 'Pedir y ofrecer ayuda con can.',
        scene: 'No entiendes una indicación y pides a otra persona que hable más despacio.',
        words: [
          ['help', 'ayudar; ayuda', 'Can you help?', '¿Puedes ayudar?'],
          ['speak', 'hablar', 'I can speak English.', 'Puedo hablar inglés.', 'verbo'],
          ['slowly', 'despacio', 'Can you speak slowly?', '¿Puedes hablar despacio?', 'adverbio'],
          ['please', 'por favor', 'Help, please.', 'Ayuda, por favor.', 'cortesía'],
          ['understand', 'entender', 'I understand.', 'Entiendo.', 'verbo'],
          ['repeat', 'repetir', 'Can you repeat?', '¿Puedes repetir?', 'verbo'],
        ],
        recycle: ['English', 'you'],
        skill: 'grammar.can',
        rule: 'Can expresa poder o saber hacer algo. No cambia con he o she y lleva el verbo base: She can help. Para pedir ayuda, cambia el orden: Can you help? Can you repeat, please? es una petición cortés. Cannot y can’t expresan no poder.',
        forms: [
          ['can', 'poder; saber hacer'],
          ['cannot', 'no poder'],
          ["can't", 'cannot, forma corta'],
        ],
        examples: [
          ['Can you speak slowly, please?', '¿Puedes hablar despacio, por favor?'],
          ['I can help.', 'Puedo ayudar.'],
        ],
        dialogue: [
          ['Ana', 'Can you repeat, please?', '¿Puedes repetir, por favor?'],
          ['Luis', 'Yes. I can speak slowly.', 'Sí. Puedo hablar despacio.'],
          ['Ana', 'I understand.', 'Entiendo.'],
        ],
        tasks: [
          fill('Can you ____ slowly? (hablar)', ['speak'], 'Can lleva el verbo base speak.'),
          build('Can you help, please?', 'Can antes de you forma la petición.'),
          write(
            'Pide «¿Puedes repetir, por favor?».',
            ['Can you repeat, please?', 'Can you please repeat?'],
            'Puedes poner please al final o antes de repeat.',
          ),
        ],
      },
      {
        title: 'En mi barrio',
        goal: 'Decir que hay un lugar cerca y preguntar por él.',
        scene: 'Buscas servicios de tu barrio y preguntas si hay un lugar cercano.',
        words: [
          ['park', 'parque', 'There is a park.', 'Hay un parque.'],
          ['store', 'tienda', 'There is a store.', 'Hay una tienda.'],
          ['bank', 'banco', 'There is a bank.', 'Hay un banco.'],
          ['bus stop', 'parada de autobús', 'There is a bus stop.', 'Hay una parada de autobús.'],
          [
            'near',
            'cerca de',
            'The park is near my house.',
            'El parque está cerca de mi casa.',
            'preposición',
          ],
          ['here', 'aquí', 'There is a store here.', 'Hay una tienda aquí.', 'adverbio'],
        ],
        recycle: ['house', 'small'],
        skill: 'grammar.there_is',
        rule: 'There is significa hay para una cosa o lugar: There is a park. Aquí usamos la expresión completa para presentar un solo lugar. Para preguntar cambia el orden: Is there a bank? Usamos a antes de un lugar singular.',
        forms: [['there', 'parte de there is = hay']],
        examples: [
          ['There is a park near my house.', 'Hay un parque cerca de mi casa.'],
          ['Is there a bank here?', '¿Hay un banco aquí?'],
        ],
        dialogue: [
          ['Luis', 'Is there a store here?', '¿Hay una tienda aquí?'],
          ['Ana', 'Yes. There is a store near my house.', 'Sí. Hay una tienda cerca de mi casa.'],
          ['Luis', 'Thank you.', 'Gracias.'],
        ],
        tasks: [
          fill('There ____ a bank here.', ['is'], 'There is expresa hay para un lugar singular.'),
          build('Is there a bus stop here?', 'Is there pregunta si hay algo.'),
          write(
            'Di «Hay un parque cerca de mi casa».',
            ['There is a park near my house.'],
            'There is + a park presenta el lugar; near indica cercanía.',
          ),
        ],
      },
    ],
  },
  {
    title: 'Historias de ayer',
    description: 'Cuenta dónde estuviste y qué hiciste en un día terminado.',
    cefr: 'A1',
    lessons: [
      {
        title: '¿Dónde estuviste?',
        goal: 'Decir dónde estabas ayer con was y were.',
        scene: 'Le cuentas a una amiga dónde estuviste ayer.',
        words: [
          [
            'yesterday',
            'ayer',
            'I was at home yesterday.',
            'Ayer estaba en casa.',
            'expresión de tiempo',
          ],
          [
            'at work',
            'en el trabajo',
            'She was at work.',
            'Ella estaba en el trabajo.',
            'expresión',
          ],
          ['busy', 'ocupado; ocupada', 'I was busy.', 'Estaba ocupado.', 'adjetivo'],
          ['tired', 'cansado; cansada', 'You were tired.', 'Estabas cansado.', 'adjetivo'],
          [
            'last night',
            'anoche',
            'They were at home last night.',
            'Anoche estaban en casa.',
            'expresión de tiempo',
          ],
          ['ready', 'listo; lista', 'I was ready.', 'Estaba listo.', 'adjetivo'],
        ],
        recycle: ['at home', 'happy'],
        skill: 'grammar.past_be',
        rule: 'Para hablar de un momento pasado, am e is cambian a was. Are cambia a were: I was at home; You were at work. Yesterday y last night indican momentos terminados.',
        forms: [
          ['was', 'era; estaba; fui; estuve'],
          ['were', 'eras; estabas; eran; estaban'],
        ],
        examples: [
          ['I was at home yesterday.', 'Ayer estaba en casa.'],
          ['They were tired last night.', 'Anoche estaban cansados.'],
        ],
        dialogue: [
          ['Ana', 'I was at work yesterday.', 'Ayer estaba en el trabajo.'],
          ['Luis', 'I was at home. I was tired.', 'Estaba en casa. Estaba cansado.'],
          ['Ana', 'You were busy.', 'Estabas ocupado.'],
        ],
        tasks: [
          fill('I ____ at home yesterday.', ['was'], 'El pasado de am con I es was.'),
          build('They were happy yesterday.', 'They usa were en el pasado.'),
          write(
            'Di «Anoche estaba cansado». Usa I.',
            ['I was tired last night.', 'Last night I was tired.'],
            'I was tired describe cómo te sentías en un momento terminado.',
          ),
        ],
      },
      {
        title: 'Un día de tareas',
        goal: 'Contar una actividad terminada con un verbo regular en pasado.',
        scene: 'Al final del día cuentas qué tareas terminaste.',
        words: [
          ['visit', 'visitar', 'I visited my mother.', 'Visité a mi mamá.', 'verbo'],
          ['clean', 'limpiar', 'I cleaned my house.', 'Limpié mi casa.', 'verbo'],
          ['finish', 'terminar', 'I finished work.', 'Terminé el trabajo.', 'verbo'],
          ['call', 'llamar', 'She called my sister.', 'Ella llamó a mi hermana.', 'verbo'],
          [
            'last week',
            'la semana pasada',
            'I worked last week.',
            'Trabajé la semana pasada.',
            'expresión de tiempo',
          ],
          ['room', 'habitación', 'I cleaned my room.', 'Limpié mi habitación.'],
        ],
        recycle: ['work', 'yesterday'],
        skill: 'grammar.past_regular',
        rule: 'Muchos verbos forman el pasado agregando -ed: work → worked, clean → cleaned. Visit cambia a visited; finish a finished; call a called. La forma no cambia con I, he o they. Study cambia a studied. Aprende cada forma junto con la acción.',
        forms: [
          ['worked', 'trabajé; trabajó'],
          ['visited', 'visité; visitó'],
          ['cleaned', 'limpié; limpió'],
          ['finished', 'terminé; terminó'],
          ['called', 'llamé; llamó'],
          ['studied', 'estudié; estudió'],
        ],
        examples: [
          ['I cleaned my room yesterday.', 'Ayer limpié mi habitación.'],
          ['She visited my mother last week.', 'Ella visitó a mi mamá la semana pasada.'],
        ],
        dialogue: [
          ['Luis', 'I finished work. I called my mother.', 'Terminé el trabajo. Llamé a mi mamá.'],
          ['Ana', 'I cleaned my room yesterday.', 'Ayer limpié mi habitación.'],
          ['Luis', 'I visited my sister last week.', 'Visité a mi hermana la semana pasada.'],
        ],
        tasks: [
          fill(
            'I ____ my room yesterday. (limpiar)',
            ['cleaned'],
            'Clean forma el pasado con -ed: cleaned.',
          ),
          build('She visited my mother last week.', 'Visited no cambia con she.'),
          fix(
            'He work yesterday.',
            'He worked yesterday.',
            'Yesterday sitúa work en el pasado: worked.',
          ),
          write(
            'Di «Llamé a mi hermana ayer».',
            ['I called my sister yesterday.', 'Yesterday I called my sister.'],
            'Called expresa una llamada terminada.',
          ),
        ],
      },
      {
        title: 'Mi salida al mercado',
        goal: 'Contar una salida con went, ate y bought.',
        scene: 'Cuentas una visita al mercado y lo que comiste o compraste.',
        words: [
          ['go', 'ir', 'I went to the market.', 'Fui al mercado.', 'verbo'],
          ['buy', 'comprar', 'I bought fruit.', 'Compré fruta.', 'verbo'],
          [
            'market',
            'mercado',
            'The market is near my house.',
            'El mercado está cerca de mi casa.',
          ],
          ['lunch', 'almuerzo', 'I ate lunch at home.', 'Almorcé en casa.'],
          ['bus', 'autobús', 'I took the bus.', 'Tomé el autobús.'],
          ['take', 'tomar; llevar', 'I took the bus.', 'Tomé el autobús.', 'verbo'],
        ],
        recycle: ['fruit', 'eat'],
        skill: 'grammar.past_irregular',
        rule: 'Algunos verbos tienen una forma especial en pasado. Aprende estas parejas: go → went, buy → bought, eat → ate, take → took. No agregues -ed. To indica hacia un lugar: to the market.',
        forms: [
          ['went', 'fui; fue'],
          ['bought', 'compré; compró'],
          ['ate', 'comí; comió'],
          ['took', 'tomé; tomó'],
          ['to', 'a; hacia'],
        ],
        examples: [
          ['I went to the market yesterday.', 'Ayer fui al mercado.'],
          ['She bought fruit.', 'Ella compró fruta.'],
        ],
        dialogue: [
          ['Ana', 'I went to the market yesterday.', 'Ayer fui al mercado.'],
          ['Luis', 'I took the bus. I bought fruit.', 'Tomé el autobús. Compré fruta.'],
          ['Ana', 'I ate lunch at home.', 'Almorcé en casa.'],
        ],
        tasks: [
          fill('I ____ fruit yesterday. (comprar)', ['bought'], 'El pasado de buy es bought.'),
          build('She went to the market.', 'Went es el pasado de go.'),
          recall(
            'Recuerda la palabra inglesa para «mercado».',
            'market',
            'Market significa mercado.',
          ),
          write(
            'Cuenta «Ayer tomé el autobús».',
            ['I took the bus yesterday.', 'Yesterday I took the bus.'],
            'Usa took para una acción de take terminada.',
          ),
        ],
      },
      {
        title: 'Pregunto por el fin de semana',
        goal: 'Hacer una pregunta y una negación sobre una acción pasada con did.',
        scene: 'Intercambias noticias del fin de semana con una amiga.',
        words: [
          [
            'weekend',
            'fin de semana',
            'I worked last weekend.',
            'Trabajé el fin de semana pasado.',
          ],
          [
            'last weekend',
            'el fin de semana pasado',
            'Did you work last weekend?',
            '¿Trabajaste el fin de semana pasado?',
            'expresión de tiempo',
          ],
          ['movie', 'película', 'I watched a movie.', 'Vi una película.'],
          ['watch', 'ver; mirar', 'Did you watch a movie?', '¿Viste una película?', 'verbo'],
          ['stay', 'quedarse', 'I stayed at home.', 'Me quedé en casa.', 'verbo'],
          ['with', 'con', 'I stayed with my sister.', 'Me quedé con mi hermana.', 'preposición'],
        ],
        recycle: ['go', 'yesterday'],
        skill: 'grammar.did',
        rule: 'Did + persona + verbo base pregunta por el pasado: Did you go? Para negar usa did not + verbo base: I did not go. Did ya expresa pasado, así que no uses went después de did. Didn’t es la forma corta de did not.',
        forms: [
          ['did', 'auxiliar de pregunta en pasado'],
          ['did not', 'no (en pasado)'],
          ["didn't", 'did not, forma corta'],
          ['watched', 'vi; vio'],
          ['stayed', 'me quedé; se quedó'],
        ],
        examples: [
          ['Did you watch a movie last weekend?', '¿Viste una película el fin de semana pasado?'],
          ['I did not go to work.', 'No fui al trabajo.'],
        ],
        dialogue: [
          ['Luis', 'Did you work last weekend?', '¿Trabajaste el fin de semana pasado?'],
          ['Ana', 'No. I did not work. I stayed at home.', 'No. No trabajé. Me quedé en casa.'],
          ['Luis', 'I watched a movie with my sister.', 'Vi una película con mi hermana.'],
        ],
        tasks: [
          fill('Did you ____ to the market? (ir)', ['go'], 'Después de did usa go, no went.'),
          build('I did not work yesterday.', 'Did not va antes del verbo base work.'),
          fix('Did she went home?', 'Did she go home?', 'Did ya expresa pasado; usa go.'),
          write(
            'Pregunta «¿Viste una película ayer?».',
            ['Did you watch a movie yesterday?'],
            'Did + you + watch forma la pregunta sobre ayer.',
          ),
        ],
      },
    ],
  },
  {
    title: 'Lo que pasa ahora',
    description: 'Describe acciones en curso y pregunta qué está pasando.',
    cefr: 'A1',
    lessons: [
      {
        title: 'Ahora estoy aprendiendo',
        goal: 'Decir qué estás haciendo ahora con I am y un verbo en -ing.',
        scene:
          'Escribes un mensaje corto sobre lo que haces en este momento, sin confundirlo con un hábito.',
        words: [
          ['now', 'ahora', 'I am studying now.', 'Estoy estudiando ahora.', 'expresión de tiempo'],
          ['learn', 'aprender', 'I am learning English.', 'Estoy aprendiendo inglés.', 'verbo'],
          ['write', 'escribir', 'I am writing.', 'Estoy escribiendo.', 'verbo'],
          ['message', 'mensaje', 'I am writing a message.', 'Estoy escribiendo un mensaje.'],
          ['listen', 'escuchar', 'I am listening.', 'Estoy escuchando.', 'verbo'],
          [
            'right now',
            'ahora mismo',
            'I am working right now.',
            'Estoy trabajando ahora mismo.',
            'expresión de tiempo',
          ],
        ],
        recycle: ['study', 'English'],
        skill: 'grammar.continuous_i',
        rule: 'Para una acción en curso usa I am + verbo en -ing. Study cambia a studying; learn a learning. Write pierde la e final: writing. I study every day es un hábito; I am studying now ocurre ahora.',
        forms: [
          ['studying', 'estudiando'],
          ['learning', 'aprendiendo'],
          ['writing', 'escribiendo'],
          ['listening', 'escuchando'],
          ['working', 'trabajando'],
        ],
        examples: [
          ['I am learning English now.', 'Estoy aprendiendo inglés ahora.'],
          ['I am writing a message.', 'Estoy escribiendo un mensaje.'],
        ],
        dialogue: [
          ['Ana', 'I am writing a message.', 'Estoy escribiendo un mensaje.'],
          ['Luis', 'I am studying English right now.', 'Estoy estudiando inglés ahora mismo.'],
          ['Ana', 'I am learning English.', 'Estoy aprendiendo inglés.'],
        ],
        tasks: [
          fill(
            'I am ____ English now. (estudiar)',
            ['studying'],
            'Am + studying describe la acción en curso.',
          ),
          build('I am writing a message.', 'Write cambia a writing después de am.'),
          recall(
            'Recuerda la palabra inglesa para «mensaje».',
            'message',
            'Message es un mensaje.',
          ),
          write(
            'Di «Estoy aprendiendo inglés ahora».',
            ['I am learning English now.', 'Now I am learning English.'],
            'I am learning expresa una acción que ocurre ahora.',
          ),
        ],
      },
      {
        title: 'En la cocina',
        goal: 'Describir qué está haciendo otra persona ahora.',
        scene: 'Compartes noticias de casa: una persona prepara comida y otra está lavando.',
        words: [
          ['kitchen', 'cocina (lugar)', 'She is in the kitchen.', 'Ella está en la cocina.'],
          ['wash', 'lavar', 'He is washing a cup.', 'Él está lavando una taza.', 'verbo'],
          ['cup', 'taza', 'It is a cup.', 'Es una taza.'],
          [
            'make',
            'hacer; preparar',
            'She is making dinner.',
            'Ella está preparando la cena.',
            'verbo',
          ],
          ['salad', 'ensalada', 'She is making a salad.', 'Ella está preparando una ensalada.'],
          ['table', 'mesa', 'The cup is on the table.', 'La taza está sobre la mesa.'],
        ],
        recycle: ['cook', 'dinner'],
        skill: 'grammar.continuous_others',
        rule: 'Usa is con he o she y are con they, más el verbo en -ing: She is cooking; They are eating. Make pierde la e: making. El verbo en -ing no lleva otra -s. On significa sobre una superficie.',
        forms: [
          ['cooking', 'cocinando'],
          ['washing', 'lavando'],
          ['making', 'haciendo; preparando'],
          ['eating', 'comiendo'],
          ['on', 'sobre; en'],
        ],
        examples: [
          ['She is making a salad.', 'Ella está preparando una ensalada.'],
          ['They are eating dinner.', 'Están cenando.'],
        ],
        dialogue: [
          ['Luis', 'My mother is making a salad.', 'Mi mamá está preparando una ensalada.'],
          ['Ana', 'My brother is washing a cup.', 'Mi hermano está lavando una taza.'],
          ['Luis', 'They are in the kitchen.', 'Están en la cocina.'],
        ],
        tasks: [
          fill('She ____ cooking dinner now.', ['is'], 'She lleva is antes del verbo en -ing.'),
          build('They are eating in the kitchen.', 'They requiere are + eating.'),
          fix('He are washing a cup.', 'He is washing a cup.', 'He lleva is, no are.'),
          write(
            'Di «Ella está preparando una ensalada».',
            ['She is making a salad.'],
            'She + is + making describe lo que hace ella ahora.',
          ),
        ],
      },
      {
        title: 'Hoy no estoy trabajando',
        goal: 'Decir qué no está ocurriendo ahora usando be + not + -ing.',
        scene: 'Estás en un momento de descanso y aclaras qué haces y qué no haces.',
        words: [
          ['rest', 'descansar', 'I am resting now.', 'Estoy descansando ahora.', 'verbo'],
          ['wait', 'esperar', 'I am waiting.', 'Estoy esperando.', 'verbo'],
          [
            'outside',
            'afuera',
            'She is waiting outside.',
            'Ella está esperando afuera.',
            'adverbio',
          ],
          ['inside', 'adentro', 'I am resting inside.', 'Estoy descansando adentro.', 'adverbio'],
          ['rain', 'llover; lluvia', 'It is raining.', 'Está lloviendo.', 'verbo'],
          ['sunny', 'soleado', 'It is sunny today.', 'Hoy está soleado.', 'adjetivo'],
        ],
        recycle: ['work', 'now'],
        skill: 'grammar.continuous_negative',
        rule: 'Para negar una acción en curso, coloca not después de am, is o are: I am not working. La acción sigue en -ing. It is raining significa está lloviendo; el it aparece aunque en español no digamos un sujeto.',
        forms: [
          ['resting', 'descansando'],
          ['waiting', 'esperando'],
          ['raining', 'lloviendo'],
          ["isn't", 'is not, forma corta'],
        ],
        examples: [
          ['I am not working now.', 'No estoy trabajando ahora.'],
          ['She is not waiting outside.', 'Ella no está esperando afuera.'],
        ],
        dialogue: [
          [
            'Ana',
            'I am not working now. I am resting.',
            'No estoy trabajando ahora. Estoy descansando.',
          ],
          ['Luis', 'I am waiting outside.', 'Estoy esperando afuera.'],
          ['Ana', 'It is not raining. It is sunny.', 'No está lloviendo. Está soleado.'],
        ],
        tasks: [
          fill('I am ____ working now. (no)', ['not'], 'Not va después de am.'),
          build('She is not waiting outside.', 'Is not + waiting niega la acción en curso.'),
          recall(
            'Recuerda la palabra inglesa para «afuera».',
            'outside',
            'Outside significa afuera.',
          ),
          write(
            'Di «No está lloviendo».',
            ['It is not raining.', "It isn't raining."],
            'It is not raining niega la lluvia en este momento.',
          ),
        ],
      },
      {
        title: '¿Qué estás haciendo?',
        goal: 'Preguntar por una acción que está ocurriendo ahora.',
        scene: 'Buscas a una amiga en un encuentro y preguntas qué está haciendo.',
        words: [
          [
            'look for',
            'buscar',
            'I am looking for my phone.',
            'Estoy buscando mi teléfono.',
            'verbo',
          ],
          [
            'talk',
            'conversar; hablar',
            'She is talking to my brother.',
            'Ella está hablando con mi hermano.',
            'verbo',
          ],
          [
            'sit',
            'sentarse; estar sentado',
            'He is sitting here.',
            'Él está sentado aquí.',
            'verbo',
          ],
          ['stand', 'estar de pie', 'They are standing outside.', 'Están de pie afuera.', 'verbo'],
          ['do', 'hacer', 'What are you doing?', '¿Qué estás haciendo?', 'verbo'],
          [
            'over there',
            'allá',
            'She is sitting over there.',
            'Ella está sentada allá.',
            'adverbio',
          ],
        ],
        recycle: ['where', 'phone'],
        skill: 'grammar.continuous_questions',
        rule: 'Para preguntar, coloca am, is o are antes de la persona: Are you working? Con what pregunta qué hace: What are you doing? Sit duplica la t en sitting. Look for significa buscar y conserva for en looking for.',
        forms: [
          ['looking for', 'buscando'],
          ['talking', 'hablando'],
          ['sitting', 'sentado; sentada'],
          ['standing', 'de pie'],
          ['doing', 'haciendo'],
        ],
        examples: [
          ['What are you doing?', '¿Qué estás haciendo?'],
          ['Is she talking to your brother?', '¿Ella está hablando con tu hermano?'],
        ],
        dialogue: [
          ['Luis', 'What are you doing?', '¿Qué estás haciendo?'],
          ['Ana', 'I am looking for my phone.', 'Estoy buscando mi teléfono.'],
          ['Luis', 'Is your sister sitting over there?', '¿Tu hermana está sentada allá?'],
          ['Ana', 'Yes, she is.', 'Sí.'],
        ],
        tasks: [
          fill('What ____ you doing?', ['are'], 'You requiere are antes de doing.'),
          build('Is she sitting over there?', 'Is + she + sitting forma la pregunta.'),
          fix('What you are doing?', 'What are you doing?', 'En preguntas are va antes de you.'),
          write(
            'Pregunta «¿Estás buscando tu teléfono?».',
            ['Are you looking for your phone?'],
            'Are you + looking for pregunta por la búsqueda que ocurre ahora.',
          ),
        ],
      },
    ],
  },
  {
    title: 'Mis próximos pasos',
    description: 'Comparte planes y ofrece ayuda para el futuro.',
    cefr: 'A2',
    lessons: [
      {
        title: 'Mi plan para mañana',
        goal: 'Expresar un plan con be going to y un verbo base.',
        scene: 'Organizas una visita y cuentas un plan que ya decidiste.',
        words: [
          [
            'tomorrow',
            'mañana (día siguiente)',
            'I am going to travel tomorrow.',
            'Voy a viajar mañana.',
            'expresión de tiempo',
          ],
          ['travel', 'viajar', 'I am going to travel.', 'Voy a viajar.', 'verbo'],
          [
            'next week',
            'la próxima semana',
            'We are going to travel next week.',
            'Vamos a viajar la próxima semana.',
            'expresión de tiempo',
          ],
          ['ticket', 'boleto', 'I am going to buy a ticket.', 'Voy a comprar un boleto.'],
          ['family', 'familia', 'I am going to visit my family.', 'Voy a visitar a mi familia.'],
          ['plan', 'plan', 'It is my plan.', 'Es mi plan.'],
        ],
        recycle: ['visit', 'buy'],
        skill: 'grammar.going_to',
        rule: 'Para un plan decidido usa am/is/are + going to + verbo base: I am going to travel. Aquí going to es una expresión para el futuro; no es necesario estar caminando. Con we, que significa nosotros o nosotras, usa are.',
        forms: [
          ['going to', 'ir a (plan futuro)'],
          ['we', 'nosotros; nosotras'],
        ],
        examples: [
          ['I am going to visit my family tomorrow.', 'Voy a visitar a mi familia mañana.'],
          ['We are going to buy a ticket.', 'Vamos a comprar un boleto.'],
        ],
        dialogue: [
          ['Ana', 'I am going to visit my family tomorrow.', 'Voy a visitar a mi familia mañana.'],
          ['Luis', 'I am going to travel next week.', 'Voy a viajar la próxima semana.'],
          ['Ana', 'We are going to buy a ticket.', 'Vamos a comprar un boleto.'],
        ],
        tasks: [
          fill(
            'I am going to ____ my family. (visitar)',
            ['visit'],
            'Going to lleva el verbo base visit.',
          ),
          build('She is going to travel tomorrow.', 'Con she usa is going to + travel.'),
          recall('Recuerda la palabra inglesa para «boleto».', 'ticket', 'Ticket es un boleto.'),
          write(
            'Cuenta «Voy a visitar a mi familia mañana».',
            ['I am going to visit my family tomorrow.', 'Tomorrow I am going to visit my family.'],
            'Going to expresa tu plan decidido.',
          ),
        ],
      },
      {
        title: 'Coordinamos una salida',
        goal: 'Preguntar por un plan con be going to.',
        scene: 'Coordinas una salida al parque y preguntas por el momento y el transporte.',
        words: [
          [
            'when',
            'cuándo',
            'When are you going to travel?',
            '¿Cuándo vas a viajar?',
            'palabra interrogativa',
          ],
          [
            'meet',
            'encontrarse; conocer',
            'We are going to meet tomorrow.',
            'Vamos a encontrarnos mañana.',
            'verbo',
          ],
          [
            'at two',
            'a las dos',
            'We are going to meet at two.',
            'Vamos a encontrarnos a las dos.',
            'expresión de tiempo',
          ],
          [
            'next Saturday',
            'el próximo sábado',
            'Are you going to work next Saturday?',
            '¿Vas a trabajar el próximo sábado?',
            'expresión de tiempo',
          ],
          [
            'by bus',
            'en autobús',
            'I am going to travel by bus.',
            'Voy a viajar en autobús.',
            'expresión',
          ],
          [
            'by train',
            'en tren',
            'She is going to travel by train.',
            'Ella va a viajar en tren.',
            'expresión',
          ],
        ],
        recycle: ['park', 'tomorrow'],
        skill: 'grammar.going_to_questions',
        rule: 'En preguntas sobre planes, am/is/are va antes de la persona: Are you going to travel? When pregunta cuándo: When are we going to meet? La parte going to + verbo base se conserva.',
        forms: [['by', 'en; por (medio de transporte)']],
        examples: [
          ['When are we going to meet?', '¿Cuándo vamos a encontrarnos?'],
          ['Are you going to travel by bus?', '¿Vas a viajar en autobús?'],
        ],
        dialogue: [
          ['Luis', 'When are we going to meet?', '¿Cuándo vamos a encontrarnos?'],
          ['Ana', 'We are going to meet at two.', 'Vamos a encontrarnos a las dos.'],
          ['Luis', 'Are you going to go to the park by bus?', '¿Vas a ir al parque en autobús?'],
          ['Ana', 'Yes, I am.', 'Sí.'],
        ],
        tasks: [
          fill('When ____ we going to meet?', ['are'], 'We usa are antes de going to.'),
          build('Are you going to travel by train?', 'Are you abre la pregunta sobre el plan.'),
          write(
            'Pregunta «¿Cuándo vas a visitar a tu familia?».',
            ['When are you going to visit your family?'],
            'When + are you going to pregunta por el momento del plan.',
          ),
        ],
      },
      {
        title: 'Te ayudo',
        goal: 'Ofrecer ayuda o decidir algo en el momento con will.',
        scene: 'Ves que alguien necesita ayuda y respondes con una decisión breve.',
        words: [
          ['carry', 'cargar; llevar', 'I will carry your bag.', 'Llevaré tu bolso.', 'verbo'],
          ['bag', 'bolso; bolsa', 'It is my bag.', 'Es mi bolso.'],
          ['open', 'abrir', 'I will open the door.', 'Abriré la puerta.', 'verbo'],
          ['door', 'puerta', 'The door is small.', 'La puerta es pequeña.'],
          ['later', 'más tarde', 'I will call later.', 'Llamaré más tarde.', 'expresión de tiempo'],
          ['thanks', 'gracias (informal)', 'Thanks, Ana.', 'Gracias, Ana.', 'cortesía'],
        ],
        recycle: ['help', 'call'],
        skill: 'grammar.will',
        rule: 'Will + verbo base sirve para ofrecer ayuda o decidir en el momento: I will help. Will no cambia con he o she. I’ll es la forma corta de I will. Una promesa no es una certeza sobre lo que pasará; aquí practicas cómo ofrecerte.',
        forms: [
          ['will', 'auxiliar de futuro u ofrecimiento'],
          ["I'll", 'I will, forma corta'],
        ],
        examples: [
          ['I will carry your bag.', 'Llevaré tu bolso.'],
          ['She will open the door.', 'Ella abrirá la puerta.'],
        ],
        dialogue: [
          ['Ana', 'Can you help, please?', '¿Puedes ayudar, por favor?'],
          ['Luis', 'I will carry your bag.', 'Llevaré tu bolso.'],
          ['Ana', 'Thanks. I will open the door.', 'Gracias. Abriré la puerta.'],
        ],
        tasks: [
          fill('She will ____ the door. (abrir)', ['open'], 'Después de will usa open sin -s.'),
          build('I will call you later.', 'Will + call expresa la decisión.'),
          recall(
            'Recuerda el verbo inglés que significa «abrir».',
            'open',
            'Open significa abrir.',
          ),
          write(
            'Ofrece «Llevaré tu bolso».',
            ['I will carry your bag.', "I'll carry your bag."],
            'Will o I’ll + carry expresa un ofrecimiento.',
          ),
        ],
      },
      {
        title: 'Si cambia el plan',
        goal: 'Comunicar una decisión futura negativa con will not.',
        scene: 'Cambias un plan de viaje y avisas con un mensaje claro.',
        words: [
          ['trip', 'viaje', 'I will not cancel the trip.', 'No cancelaré el viaje.'],
          ['cancel', 'cancelar', 'I will not cancel.', 'No cancelaré.', 'verbo'],
          ['arrive', 'llegar', 'I will arrive later.', 'Llegaré más tarde.', 'verbo'],
          ['early', 'temprano', 'I will not arrive early.', 'No llegaré temprano.', 'adverbio'],
          ['late', 'tarde; con retraso', 'I will not be late.', 'No llegaré tarde.', 'adjetivo'],
          [
            'this time',
            'esta vez',
            'I will travel by bus this time.',
            'Esta vez viajaré en autobús.',
            'expresión',
          ],
        ],
        recycle: ['travel', 'later'],
        skill: 'grammar.will_negative',
        rule: 'Will not + verbo base niega una decisión o predicción futura: I will not cancel. Won’t significa lo mismo. Para describir cómo estarás, usa be después de will: I will not be late. Be es la forma base de am/is/are.',
        forms: [
          ['will not', 'no (futuro)'],
          ["won't", 'will not, forma corta'],
          ['be', 'ser; estar (forma base)'],
          ['this', 'este; esta'],
        ],
        examples: [
          ['I will not arrive early.', 'No llegaré temprano.'],
          ['I will not cancel the trip.', 'No cancelaré el viaje.'],
        ],
        dialogue: [
          ['Luis', 'I will not arrive early this time.', 'Esta vez no llegaré temprano.'],
          ['Ana', 'I will wait at the bus stop.', 'Esperaré en la parada de autobús.'],
          ['Luis', 'Thanks. I will not cancel the trip.', 'Gracias. No cancelaré el viaje.'],
        ],
        tasks: [
          fill('I will ____ cancel the trip. (no)', ['not'], 'Not va después de will.'),
          build('She will not be late.', 'Después de will not usa be.'),
          fix(
            'He will not is late.',
            'He will not be late.',
            'Will not requiere be, la forma base de is.',
          ),
          write(
            'Escribe «No cancelaré el viaje».',
            ['I will not cancel the trip.', "I won't cancel the trip."],
            'Will not y won’t expresan la misma negación futura.',
          ),
        ],
      },
    ],
  },
];
