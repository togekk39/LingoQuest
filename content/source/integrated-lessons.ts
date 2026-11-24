/** Original es-419 / en-US course. Each task is authored for a communication goal.
 * No text, dialogue, illustration, or audio was copied from a textbook. */
export type Word = readonly [
  en: string,
  es: string,
  exampleEn: string,
  exampleEs: string,
  partOfSpeech?: string,
];
type ProductionTask =
  | { type: 'cloze'; prompt: string; sentence: string; answers: string[]; reason: string }
  | { type: 'reorder'; prompt: string; answer: string; alternatives?: string[]; reason: string }
  | { type: 'correction'; prompt: string; sentence: string; answers: string[]; reason: string }
  | {
      type: 'short_text';
      prompt: string;
      answers: string[];
      reason: string;
      recall?: boolean;
      introduction?: { greetingRequired: boolean; model: string };
    };
export type Task =
  | (ProductionTask & { communicationOnly?: { answers: string[]; feedbackEs: string } })
  | {
      type: 'single_choice';
      passage: string;
      prompt: string;
      options: string[];
      correctIndex: number;
      reason: string;
    };
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
export const build = (
  answer: string,
  reason: string,
  alternatives?: string[],
  prompt = 'Ordena las palabras para expresar la idea.',
): Task => ({
  type: 'reorder',
  prompt,
  answer,
  alternatives,
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
export const fix = (
  sentence: string,
  answer: string,
  reason: string,
  {
    prompt = 'Corrige la oración. Escríbela completa.',
    alternatives = [],
  }: {
    prompt?: string;
    alternatives?: string[];
  } = {},
): Task => ({
  type: 'correction',
  prompt,
  sentence,
  answers: [answer, ...alternatives],
  reason,
});
export const read = (
  passage: string,
  prompt: string,
  options: string[],
  correctIndex: number,
  reason: string,
): Task => ({ type: 'single_choice', passage, prompt, options, correctIndex, reason });
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
        goal: 'Saludar, presentarte con tu nombre y reconocer a otra persona con You are.',
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
        rule: 'Para presentarte, di I am y tu nombre: I am Ana. I’m Ana significa lo mismo. El apóstrofo marca la forma corta, muy común al hablar. También puedes decir My name is Ana, que significa «Me llamo Ana». Con you, usa are: You are Luis o You’re Luis. En estas oraciones, incluye I o you aunque en español puedas omitir yo o tú.',
        forms: [
          ['am', 'soy (con I)'],
          ['are', 'eres; es; son (con you)'],
          ["I'm", 'forma corta de I am'],
          ["you're", 'forma corta de you are'],
          ['my name is', 'me llamo; mi nombre es'],
          ["my name's", 'forma corta de my name is'],
        ],
        examples: [
          ['I am Ana.', 'Soy Ana.'],
          ['You are my friend.', 'Tú eres mi amigo o amiga.'],
          ["Hi, I'm Luis.", 'Hola, soy Luis.'],
        ],
        dialogue: [
          ['Ana', 'Hello. I am Ana.', 'Hola. Soy Ana.'],
          ['Luis', "Hi, I'm Luis.", 'Hola, soy Luis.'],
          ['Ana', 'Goodbye, Luis.', 'Adiós, Luis.'],
          ['Luis', 'Goodbye, Ana.', 'Adiós, Ana.'],
        ],
        tasks: [
          fill('I ____ Ana. (Soy Ana)', ['am'], 'I se combina con am para decir soy.'),
          fill('You ____ Luis. (Eres Luis)', ['are'], 'You se combina con are para decir eres.'),
          recall(
            'Sin opciones, escribe la palabra inglesa que significa «hola» (la forma de cinco letras).',
            'hello',
            'Hello es un saludo; hi también saluda, pero tiene dos letras.',
          ),
          {
            type: 'short_text',
            prompt:
              'Saluda con Hello o Hi y preséntate con I am, I’m o My name is. Usa tu nombre o elige uno para practicar.',
            answers: ['Hello. I am Ana.'],
            reason:
              'Primero saluda. Después combina I am, I’m o My name is con el nombre que elegiste.',
            introduction: { greetingRequired: true, model: 'Hello. I am [tu nombre].' },
          },
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
        rule: 'He significa él y she significa ella. Usa is con los dos: He is my brother. Al hablar también se usa He’s o She’s. Para mencionar una profesión o un rol en singular, usa a si la palabra siguiente empieza con sonido consonante: a teacher, a student. My significa mi con cualquier género.',
        forms: [
          ['he', 'él'],
          ['she', 'ella'],
          ['is', 'es (en estas presentaciones)'],
          ['a', 'un; una'],
          ["he's", 'forma corta de he is'],
          ["she's", 'forma corta de she is'],
        ],
        examples: [
          ['She is my sister.', 'Ella es mi hermana.'],
          ['He is a student.', 'Él es estudiante.'],
        ],
        dialogue: [
          ['Ana', 'He is my brother.', 'Él es mi hermano.'],
          ['Luis', 'Hello. I am Luis.', 'Hola. Soy Luis.'],
          ['Ana', "She's my mother. She's a teacher.", 'Ella es mi mamá. Es docente.'],
        ],
        tasks: [
          fill('She ____ my mother. (Ella es mi mamá)', ['is'], 'She lleva is.'),
          build(
            'He is my father.',
            'He is presenta a un hombre. My father significa mi papá.',
            undefined,
            'Ordena las palabras para decir «Él es mi papá».',
          ),
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
          read(
            'She is my sister. She is a teacher. He is my brother. He is a student.',
            'Lee la nota de Ana. ¿Quién es estudiante?',
            ['Su hermana', 'Su hermano', 'Su mamá'],
            1,
            'Ana escribe He is my brother. He is a student. Las dos oraciones con he hablan de su hermano.',
          ),
        ],
      },
      {
        title: 'Personas y cosas',
        goal: 'Describir un objeto con it is y decir cómo se sienten varias personas con they are.',
        scene:
          'Estás con tu familia. Una persona comenta cómo es su teléfono y cómo se sienten sus papás.',
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
        rule: 'Usa it is para describir una cosa y they are para describir varias personas o cosas. También puedes decir it’s y they’re. El adjetivo va después de is o are (They are happy) o antes del sustantivo (a small house). El adjetivo conserva su forma en plural: happy significa feliz o felices.',
        forms: [
          ['it', 'pronombre para una cosa ya identificada; en español a veces se omite'],
          ['they', 'ellos; ellas'],
          ['and', 'y'],
          ['a', 'un; una'],
          ['is', 'es o está, según la descripción'],
          ['are', 'son o están, según la descripción'],
          ["it's", 'forma corta de it is'],
          ["they're", 'forma corta de they are'],
        ],
        examples: [
          ['It is a good book.', 'Es un buen libro.'],
          ['They are happy.', 'Están felices.'],
        ],
        dialogue: [
          ['Luis', 'It is my phone.', 'Es mi teléfono.'],
          ['Ana', "It's small.", 'Es pequeño.'],
          ['Luis', 'My mother and father are happy.', 'Mi mamá y mi papá están felices.'],
        ],
        tasks: [
          fill('It ____ a book. (Es un libro)', ['is'], 'Una cosa: it is.'),
          build(
            'They are happy.',
            'Con they, usa are. Happy no cambia.',
            undefined,
            'Ordena las palabras para decir «Están felices».',
          ),
          write(
            'Ya están hablando de la casa. Dile a tu amiga «Es una casa pequeña». Usa it.',
            ['It is a small house.'],
            'Small va antes de house: a small house.',
          ),
        ],
      },
      {
        title: '¿Cómo te llamas?',
        goal: 'Preguntar el nombre o el lugar de origen de alguien usando be.',
        scene:
          'Conoces a otra persona en una reunión. Usas preguntas breves y respondes con tu nombre u origen.',
        words: [
          ['who', 'quién', 'Who is she?', '¿Quién es ella?', 'palabra interrogativa'],
          ['what', 'qué; cuál', 'What is your name?', '¿Cómo te llamas?', 'palabra interrogativa'],
          ['where', 'dónde', 'Where are you from?', '¿De dónde eres?', 'palabra interrogativa'],
          ['from', 'de (origen)', 'I am from Peru.', 'Soy de Perú.', 'preposición'],
          ['yes', 'sí', 'Yes, I am.', 'Sí, lo soy.', 'respuesta'],
          ['no', 'no', 'No, I am not.', 'No, no lo soy.', 'respuesta'],
        ],
        recycle: ['name', 'student', 'you'],
        skill: 'grammar.be_questions',
        rule: 'En Are you a student?, are va antes de you. Con una palabra interrogativa, colócala primero: Where are you from? Para pedir el nombre en una presentación, usa What is your name? Responde My name is Ana. A una pregunta de sí o no puedes responder Yes, I am o No, I’m not. En la respuesta afirmativa breve, usa I am completo.',
        forms: [
          ['are', 'forma de be que acompaña a you'],
          ['is', 'forma de be que acompaña a name en singular'],
          ['a student', 'estudiante; en inglés se usa a aquí'],
          ['not', 'no (negación)'],
          ['your', 'tu; tus; su (de usted o ustedes)'],
          ["what's", 'forma corta de what is'],
          ['I am from', 'soy de (para indicar origen)'],
        ],
        examples: [
          ['Where are you from?', '¿De dónde eres?'],
          ['My name is Ana.', 'Mi nombre es Ana.'],
          ['Are you a student?', '¿Eres estudiante?'],
        ],
        dialogue: [
          ['Luis', "Hi! What's your name?", '¡Hola! ¿Cómo te llamas?'],
          ['Ana', "I'm Ana. I'm from Peru.", 'Soy Ana. Soy de Perú.'],
          ['Luis', 'Are you a student?', '¿Eres estudiante?'],
          ['Ana', 'Yes, I am.', 'Sí.'],
        ],
        tasks: [
          fill(
            'Where ____ you from? (¿De dónde eres?)',
            ['are'],
            'You lleva are. En esta pregunta, are va antes de you.',
          ),
          build(
            'Are you a student?',
            'En la pregunta, are va antes de you.',
            undefined,
            'Ordena las palabras para preguntar «¿Eres estudiante?».',
          ),
          recall(
            'Escribe la palabra inglesa para preguntar «dónde».',
            'where',
            'Where pregunta por un lugar.',
          ),
          write(
            'En la reunión te preguntan de dónde eres. Responde «Soy de Perú». Escribe Peru sin tilde.',
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
        goal: 'Contar tus hábitos con I y reconocer hábitos en un mensaje breve.',
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
        rule: 'Para contar un hábito con I o you, pon el verbo en su forma básica después del pronombre: I work, You study. En esas oraciones, el verbo de la acción va sin am o are. Every day, en dos palabras, significa todos los días. Escribe English con mayúscula.',
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
          fill(
            'I ____ English. (estudiar)',
            ['study'],
            'Para decir «estudio», usa I study. La forma study va después de I.',
          ),
          build(
            'I drink water every day.',
            'Every day puede aparecer al principio o al final de la oración.',
            ['Every day I drink water.'],
          ),
          recall('Escribe el verbo inglés que significa «trabajar».', 'work', 'Work es trabajar.'),
          write(
            'Cuenta tu hábito: «Estudio inglés todos los días».',
            ['I study English every day.', 'Every day I study English.'],
            'Usa I study y every day para expresar el hábito.',
          ),
          read(
            'I live in Peru. I work every day. I study English. I drink water.',
            'Lee el mensaje de Rosa. ¿Qué dice que hace todos los días?',
            ['Estudia inglés', 'Toma agua', 'Trabaja'],
            2,
            'Rosa escribe I work every day. Habla de estudiar y de tomar agua sin decir que lo hace todos los días.',
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
        recycle: ['mother', 'study', 'book'],
        skill: 'grammar.routine_third_person',
        rule: 'Para un hábito, he (él), she (ella) y expresiones para una sola persona como my father (mi papá) suelen llevar el verbo con -s: work → works, cook → cooks, read → reads. En study, cambia la y por -ies: studies. Con I, you o they, usa la forma base.',
        forms: [
          ['works', 'trabaja'],
          ['studies', 'estudia'],
          ['lives', 'vive'],
          ['walks', 'camina'],
          ['drinks', 'toma'],
          ['cooks', 'cocina'],
          ['reads', 'lee'],
          ['eats', 'come'],
          ['my father', 'mi papá'],
          ['English', 'inglés'],
          ['a book', 'un libro'],
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
          fill('She ____ dinner. (verbo cook: cocinar)', ['cooks'], 'Con she agrega -s: cooks.'),
          build(
            'He reads a book at home.',
            'Con he, read cambia a reads. At home indica dónde y puede ir al principio o al final.',
            ['At home he reads a book.'],
          ),
          fix('She study English.', 'She studies English.', 'Study cambia a studies con she.', {
            prompt:
              'Corrige el verbo para hablar de un hábito en presente. Escribe la oración completa.',
          }),
          write(
            'Cuenta un hábito de tu papá: «Mi papá prepara la cena». Usa father y el verbo cook.',
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
        recycle: ['drink', 'at home', 'eat', 'work', 'water'],
        skill: 'grammar.frequency',
        rule: 'Always, usually, sometimes y never suelen ir antes de un verbo de acción: I usually walk. Con she o he, el verbo conserva la -s: She always reads. Usually y sometimes también pueden encabezar la oración. Never ya significa nunca. Di I never work, sin agregar not.',
        forms: [
          ['the', 'el; la; los; las'],
          ['she eats', 'ella come'],
        ],
        examples: [
          ['I usually study at night.', 'Normalmente estudio por la noche.'],
          ['She always drinks water.', 'Ella siempre toma agua.'],
          ['Usually she eats at home.', 'Por lo general, come en casa.'],
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
          build(
            'She usually eats at home.',
            'Usually puede ir antes de eats o al principio de esta oración.',
            ['Usually she eats at home.'],
          ),
          recall(
            'Escribe la palabra de esta lección que significa «a veces».',
            'sometimes',
            'Sometimes expresa que algo ocurre algunas veces.',
          ),
          write(
            'Tu amiga quiere saber si trabajas de noche. Contesta «Nunca trabajo por la noche» con never.',
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
        recycle: ['every day', 'dinner', 'eat', 'at home'],
        skill: 'grammar.routine_time',
        rule: 'Para una hora o el mediodía, usa at: at six, at eight, at noon. Puedes indicar la hora al final (I eat at noon) o al principio (At noon, I eat). Get up significa levantarse. Para decir que una persona desayuna, usa has breakfast con he o she: She has breakfast at eight.',
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
          ['At noon, I eat.', 'Al mediodía, como.'],
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
          fill(
            'I get up ____ six. (Me levanto a las seis)',
            ['at'],
            'At conecta un hábito con una hora.',
          ),
          build(
            'She has breakfast at eight.',
            'Con she, usa has breakfast. La hora puede ir al principio o al final.',
            ['At eight she has breakfast.'],
          ),
          write(
            'Cuenta dos momentos: «Me levanto a las seis. Como al mediodía». Usa get up y eat. Puedes empezar cada oración con la hora o ponerla al final.',
            [
              'I get up at six. I eat at noon.',
              'At six, I get up. I eat at noon.',
              'I get up at six. At noon, I eat.',
              'At six, I get up. At noon, I eat.',
            ],
            'At six marca la hora de levantarte. At noon indica que comes al mediodía.',
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
        rule: 'Para preguntar por un gusto, usa Do you like...? Con he, she o una persona como your sister (tu hermana), usa Does + persona + like: Does she like tea? En la pregunta, like va sin -s. Puedes responder Yes, I do o Yes, she does, según de quién estés hablando.',
        forms: [
          ['do', 'auxiliar con I, you, we o they'],
          ['does', 'auxiliar de pregunta con he/she/it'],
          ['likes', 'le gusta'],
          ['Yes, I do.', 'Sí. (al responder sobre ti)'],
          ['Yes, she does.', 'Sí. (al responder sobre ella)'],
          ['he', 'él'],
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
          fill(
            '____ you like rice? (¿Te gusta el arroz?)',
            ['Do'],
            'You requiere do para preguntar por gustos.',
          ),
          build(
            'Does she like music?',
            'Empieza con Does she. Like va en forma base.',
            undefined,
            'Ordena las palabras para preguntar «¿A ella le gusta la música?».',
          ),
          fix('Does he likes fruit?', 'Does he like fruit?', 'Después de does usa like.', {
            prompt: 'Corrige el verbo después de he. Escribe la pregunta completa.',
          }),
          write(
            'Planean qué servir. Pregúntale a tu amiga «¿Te gusta el té?». Usa Do you like.',
            ['Do you like tea?'],
            'Do you like + cosa pregunta por un gusto.',
          ),
        ],
      },
      {
        title: 'Lo que quiero pedir',
        goal: 'Decir qué quieres o qué evitas, y reconocer una manera cortés de pedir una bebida.',
        scene: 'Eliges algo para tomar. Puedes decir qué no tomas y pedir otra bebida.',
        words: [
          ['milk', 'leche', 'I do not drink milk.', 'No tomo leche.'],
          ['bread', 'pan', 'She likes bread.', 'A ella le gusta el pan.'],
          ['meat', 'carne', 'I do not eat meat.', 'No como carne.'],
          ['juice', 'jugo', 'I drink juice.', 'Tomo jugo.'],
          ['want', 'querer', 'I want water.', 'Quiero agua.', 'verbo'],
          ['today', 'hoy', 'I do not work today.', 'Hoy no trabajo.', 'expresión de tiempo'],
        ],
        recycle: ['like', 'drink', 'coffee', 'tea', 'eat'],
        skill: 'grammar.dont',
        rule: 'Para negar con I o you, usa do not o don’t antes del verbo: I don’t eat meat. Con she o he, usa does not o doesn’t y el verbo base: She doesn’t drink milk. Para pedir una bebida con cortesía, aprende esta expresión completa: I’d like tea, please significa «Quisiera té, por favor».',
        forms: [
          ['do not', 'no (con I/you/they)'],
          ['does not', 'no (con he/she/it)'],
          ["don't", 'do not, forma corta'],
          ["doesn't", 'does not, forma corta'],
          ["I'd like", 'quisiera; me gustaría (para pedir algo)'],
          ['please', 'por favor'],
        ],
        examples: [
          ['I do not eat meat.', 'No como carne.'],
          ['She does not drink milk.', 'Ella no toma leche.'],
          ["I'd like tea, please.", 'Quisiera té, por favor.'],
        ],
        dialogue: [
          ['Luis', 'Do you want milk?', '¿Quieres leche?'],
          [
            'Ana',
            "No, I don't drink milk. I'd like juice, please.",
            'No, no tomo leche. Quisiera jugo, por favor.',
          ],
          ['Luis', 'I want water.', 'Yo quiero agua.'],
        ],
        tasks: [
          fill(
            'She ____ not drink milk. (Ella no toma leche)',
            ['does'],
            'Con she usa does not y el verbo base.',
          ),
          build(
            'I do not eat meat.',
            'Do not va antes de eat.',
            undefined,
            'Ordena las palabras para decir «No como carne».',
          ),
          recall('Escribe la palabra inglesa para «jugo».', 'juice', 'Juice significa jugo.'),
          write(
            'Ya te ofrecieron café. Di «No quiero café» con do not o don’t y el verbo want.',
            ['I do not want coffee.', "I don't want coffee."],
            'Ambas formas, do not y don’t, sirven para negar.',
          ),
          read(
            "I don't want coffee. I don't drink milk. I'd like tea, please.",
            'Lees un pedido para la mesa. ¿Qué bebida debes llevar?',
            ['Leche', 'Té', 'Café'],
            1,
            'En I’d like tea, please, I’d like introduce lo que la persona pide: té.',
          ),
        ],
      },
      {
        title: 'Pido ayuda',
        goal: 'Pedir y ofrecer ayuda con can.',
        scene: 'No entiendes una indicación y pides a otra persona que hable más despacio.',
        words: [
          ['help', 'ayudar', 'Can you help me?', '¿Puedes ayudarme?', 'verbo'],
          ['speak', 'hablar', 'I can speak English.', 'Puedo hablar inglés.', 'verbo'],
          ['slowly', 'despacio', 'Can you speak slowly?', '¿Puedes hablar despacio?', 'adverbio'],
          [
            'please',
            'por favor',
            'Can you help me, please?',
            '¿Puedes ayudarme, por favor?',
            'cortesía',
          ],
          ['understand', 'entender', 'I understand.', 'Entiendo.', 'verbo'],
          ['repeat', 'repetir', 'Can you repeat?', '¿Puedes repetir?', 'verbo'],
        ],
        recycle: ['English', 'you'],
        skill: 'grammar.can',
        rule: 'Para pedirle algo a alguien, usa Can you + verbo: Can you help me? (¿Puedes ayudarme?). En una afirmación, pon can después de la persona: I can help. El verbo siguiente va en forma base: She can help. Para negar, usa cannot o can’t.',
        forms: [
          ['can', 'poder; saber hacer'],
          ['cannot', 'no poder'],
          ["can't", 'cannot, forma corta'],
          ['me', 'me; a mí'],
        ],
        examples: [
          ['Can you speak slowly, please?', '¿Puedes hablar despacio, por favor?'],
          ['Can you help me, please?', '¿Puedes ayudarme, por favor?'],
          ['I can help.', 'Puedo ayudar.'],
        ],
        dialogue: [
          ['Ana', 'Can you repeat, please?', '¿Puedes repetir, por favor?'],
          ['Luis', 'Yes. I can speak slowly.', 'Sí. Puedo hablar despacio.'],
          ['Ana', 'I understand.', 'Entiendo.'],
        ],
        tasks: [
          fill('Can you ____ slowly? (hablar)', ['speak'], 'Can lleva el verbo base speak.'),
          build(
            'Can you help, please?',
            'Can va antes de you. En esta pregunta, please puede ir al principio, antes de help o al final.',
            ['Can you please help?', 'Please can you help?'],
            'Ordena las palabras para pedir ayuda con can y please.',
          ),
          {
            type: 'short_text',
            prompt:
              'No entendiste la indicación. Pide «¿Puedes repetir, por favor?». Practica la petición con can y repeat.',
            answers: [
              'Can you repeat, please?',
              'Can you please repeat?',
              'Please, can you repeat?',
            ],
            reason:
              'Para pedir con can, empieza con Can you o coloca please antes. También puedes poner please antes de repeat o al final.',
            communicationOnly: {
              answers: ['Could you repeat, please?', 'Could you please repeat?', 'Please repeat.'],
              feedbackEs:
                'Tu petición se entiende. Para practicar esta lección, vuelve a escribirla con Can you y repeat.',
            },
          },
        ],
      },
      {
        title: 'En mi barrio',
        goal: 'Preguntar si hay un lugar cerca y entender una indicación corta para llegar.',
        scene:
          'Buscas una parada de autobús. Preguntas si hay una cerca y entiendes los primeros pasos para llegar.',
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
        rule: 'Para decir que hay un lugar, usa There is a o There’s a: There is a park. Para preguntar si existe, usa Is there a bank? Si sabes que el lugar existe y quieres ubicarlo, pregunta Where is the bus stop? (¿Dónde está la parada de autobús?). Para entender las indicaciones, aprende Go straight (Sigue derecho) y Turn left (Gira a la izquierda).',
        forms: [
          ['there is', 'hay (con una cosa o un lugar)'],
          ["there's", 'forma corta de there is'],
          ['Is there ...?', '¿Hay ...?'],
          ['Where is the bus stop?', '¿Dónde está la parada de autobús?'],
          ['a', 'un; una al mencionar un lugar por primera vez'],
          ['my', 'mi'],
          ['Go straight.', 'Sigue derecho.'],
          ['Turn left.', 'Gira a la izquierda.'],
          ['turn right', 'girar a la derecha'],
        ],
        examples: [
          ['There is a park near my house.', 'Hay un parque cerca de mi casa.'],
          ['Is there a bank here?', '¿Hay un banco aquí?'],
          ['Where is the bus stop?', '¿Dónde está la parada de autobús?'],
        ],
        dialogue: [
          ['Luis', 'Is there a bus stop here?', '¿Hay una parada de autobús por aquí?'],
          ['Ana', "Yes. There's a bus stop near the bank.", 'Sí. Hay una parada cerca del banco.'],
          ['Luis', 'Where is the bank?', '¿Dónde está el banco?'],
          ['Ana', 'Go straight. Turn left.', 'Sigue derecho. Gira a la izquierda.'],
          ['Luis', 'Thank you.', 'Gracias.'],
        ],
        tasks: [
          fill(
            'There ____ a bank here. (Hay un banco aquí)',
            ['is'],
            'There is expresa hay con un lugar singular.',
          ),
          build(
            'Is there a bus stop here?',
            'Is there sirve para preguntar si hay algo. Here indica el lugar.',
            undefined,
            'Ordena las palabras para preguntar «¿Hay una parada de autobús aquí?». Empieza con Is there.',
          ),
          write(
            'Una vecina busca un espacio al aire libre. Dile «Hay un parque cerca de mi casa». Usa there is o there’s.',
            ['There is a park near my house.'],
            'There is + a park presenta el lugar; near indica cercanía.',
          ),
          read(
            'Turn left. Go straight. There is a park near the bus stop.',
            'Te dejaron estas indicaciones. ¿Qué haces primero?',
            ['Giras a la izquierda', 'Sigues derecho', 'Giras a la derecha'],
            0,
            'Turn left significa que gires a la izquierda. Go straight es la segunda indicación.',
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
        rule: 'Para decir cómo o dónde estaba alguien, usa was con I, he, she o it y were con you, we o they. Yesterday significa ayer y last night significa anoche. La pregunta Where were you yesterday? significa «¿Dónde estuviste ayer?».',
        forms: [
          ['was', 'estaba o estuve (con I, he, she o it, según el contexto)'],
          ['were', 'estabas, estuviste, estaban o estuvieron (con you o they, según el contexto)'],
          ['Where were you yesterday?', '¿Dónde estuviste ayer?'],
        ],
        examples: [
          ['I was at home yesterday.', 'Ayer estaba en casa.'],
          ['They were tired last night.', 'Anoche estaban cansados.'],
        ],
        dialogue: [
          ['Ana', 'Where were you yesterday?', '¿Dónde estuviste ayer?'],
          ['Luis', 'I was at home. I was tired.', 'Estuve en casa. Estaba cansado.'],
          ['Ana', 'I was at work. I was busy.', 'Estuve en el trabajo. Estaba ocupada.'],
        ],
        tasks: [
          fill(
            'I ____ at home yesterday. (Ayer estaba en casa)',
            ['was'],
            'Con I, usa was para decir estaba.',
          ),
          build(
            'They were happy yesterday.',
            'Con they, usa were. Yesterday puede ir al principio o al final.',
            ['Yesterday they were happy.'],
          ),
          write(
            'Explica cómo te sentías «Anoche estaba cansado». Usa I, tired y last night.',
            ['I was tired last night.', 'Last night I was tired.'],
            'I was tired describe cómo te sentías en un momento terminado.',
          ),
          read(
            'Ana was at work yesterday. Luis was at home. They were tired last night.',
            'Lee lo que pasó ayer. ¿Quién estaba en casa?',
            ['Ana', 'Ana y Luis', 'Luis'],
            2,
            'El texto dice Luis was at home. Were describe cómo se sentían los dos anoche.',
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
          ['finish', 'terminar', 'I finished work.', 'Terminé de trabajar.', 'verbo'],
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
        recycle: ['work', 'yesterday', 'mother', 'sister'],
        skill: 'grammar.past_regular',
        rule: 'Para una acción terminada, agrega -ed a muchos verbos: work → worked, clean → cleaned, visit → visited. La forma es la misma con I, he o they. En study, cambia la y por -ied: studied. Escucha los ejemplos. La terminación agrega una sílaba en visited, pero no en cleaned.',
        forms: [
          ['worked', 'trabajé; trabajó'],
          ['he', 'él'],
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
          ['Luis', 'I finished work. I called my mother.', 'Terminé de trabajar. Llamé a mi mamá.'],
          ['Ana', 'I cleaned my room yesterday.', 'Ayer limpié mi habitación.'],
          ['Luis', 'I visited my sister last week.', 'Visité a mi hermana la semana pasada.'],
        ],
        tasks: [
          fill(
            'I ____ my room yesterday. (verbo clean: limpiar)',
            ['cleaned'],
            'Clean forma el pasado con -ed: cleaned.',
          ),
          build(
            'She visited my mother last week.',
            'Visited no cambia con she. Last week puede ir al principio o al final.',
            ['Last week she visited my mother.'],
          ),
          fix(
            'He work yesterday.',
            'He worked yesterday.',
            'Yesterday sitúa work en el pasado: worked.',
            {
              prompt:
                'Corrige work para contar lo que él sí hizo ayer. Escribe la oración completa.',
            },
          ),
          write(
            'En un mensaje, cuenta «Llamé a mi hermana ayer». Usa call y yesterday.',
            ['I called my sister yesterday.', 'Yesterday I called my sister.'],
            'Called expresa una llamada terminada.',
          ),
        ],
      },
      {
        title: 'Mi salida al mercado',
        goal: 'Contar cómo te moviste y qué hiciste con went, took, ate y bought.',
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
        recycle: ['fruit', 'eat', 'yesterday', 'at home'],
        skill: 'grammar.past_irregular',
        rule: 'Algunos verbos cambian de forma en el pasado: go → went, buy → bought, eat → ate, take → took. Aprende cada pareja con una idea: went to the market, bought fruit, ate lunch, took the bus. Usa estas formas sin agregar -ed.',
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
          ['I took the bus.', 'Tomé el autobús.'],
        ],
        dialogue: [
          ['Ana', 'I went to the market yesterday.', 'Ayer fui al mercado.'],
          ['Luis', 'I took the bus. I bought fruit.', 'Tomé el autobús. Compré fruta.'],
          ['Ana', 'I ate lunch at home.', 'Almorcé en casa.'],
        ],
        tasks: [
          fill(
            'I ____ fruit yesterday. (verbo buy: comprar)',
            ['bought'],
            'El pasado de buy es bought.',
          ),
          build(
            'She went to the market.',
            'Went es el pasado de go. To the market indica adónde fue.',
            undefined,
            'Ordena las palabras para decir «Ella fue al mercado». Empieza con She.',
          ),
          recall(
            'Escribe la palabra inglesa de esta lección para «mercado».',
            'market',
            'Market significa mercado.',
          ),
          write(
            'Tu amiga pregunta cómo te moviste. Cuenta «Ayer tomé el autobús». Usa take en pasado.',
            ['I took the bus yesterday.', 'Yesterday I took the bus.'],
            'Usa took para una acción de take terminada.',
          ),
          read(
            'I took the bus. I went to the market. I bought fruit. I ate lunch at home.',
            'Lee el mensaje de Luis. ¿Qué hizo en el mercado y qué hizo en casa?',
            [
              'Almorzó en el mercado y compró fruta en casa',
              'Compró fruta en el mercado y almorzó en casa',
              'Tomó el autobús en casa y almorzó en el mercado',
            ],
            1,
            'I bought fruit aparece después de la ida al mercado. I ate lunch at home indica dónde almorzó.',
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
        recycle: ['go', 'yesterday', 'market', 'work', 'go home'],
        skill: 'grammar.did',
        rule: 'Para preguntar sobre una acción pasada, usa Did + persona + verbo base: Did you go? Para decir que no sucedió, usa did not o didn’t antes del verbo base: I didn’t go. Did ya marca el pasado. Usa go en estas preguntas y negaciones, y went para afirmar: I went home.',
        forms: [
          ['did', 'auxiliar de pregunta en pasado'],
          ['did not', 'no (en pasado)'],
          ["didn't", 'did not, forma corta'],
          ['to the market', 'al mercado'],
          ['she', 'ella'],
          ['watched', 'vi; vio'],
          ['stayed', 'me quedé; se quedó'],
        ],
        examples: [
          ['Did you watch a movie last weekend?', '¿Viste una película el fin de semana pasado?'],
          ['I did not go to work.', 'No fui al trabajo.'],
          ['I went home.', 'Me fui a casa.'],
        ],
        dialogue: [
          ['Luis', 'Did you work last weekend?', '¿Trabajaste el fin de semana pasado?'],
          ['Ana', 'No. I did not work. I stayed at home.', 'No. No trabajé. Me quedé en casa.'],
          ['Luis', 'I watched a movie with my sister.', 'Vi una película con mi hermana.'],
        ],
        tasks: [
          fill('Did you ____ to the market? (ir)', ['go'], 'Después de did usa go, no went.'),
          build(
            'I did not work yesterday.',
            'Did not va antes de work. Yesterday puede ir al principio o al final.',
            ['Yesterday I did not work.'],
          ),
          fix('Did she went home?', 'Did she go home?', 'Did ya expresa pasado; usa go.', {
            prompt: 'Corrige el verbo después de she. Escribe la pregunta completa.',
          }),
          write(
            'Para seguir la conversación, pregunta «¿Viste una película ayer?». Usa watch.',
            ['Did you watch a movie yesterday?', 'Yesterday, did you watch a movie?'],
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
        rule: 'Para una acción en curso usa I am + verbo en -ing. I’m significa lo mismo que I am. Study cambia a studying y learn a learning. Write pierde la e final: writing. Compara «I study every day» (estudio todos los días) con «I’m studying now» (estoy estudiando ahora). Right now enfatiza que ocurre en este mismo momento.',
        forms: [
          ['studying', 'estudiando'],
          ['learning', 'aprendiendo'],
          ['writing', 'escribiendo'],
          ['listening', 'escuchando'],
          ['working', 'trabajando'],
          ["I'm", 'I am, forma corta'],
        ],
        examples: [
          ["I'm learning English now.", 'Estoy aprendiendo inglés ahora.'],
          ['I am writing a message.', 'Estoy escribiendo un mensaje.'],
          ['I study every day.', 'Estudio todos los días.'],
        ],
        dialogue: [
          ['Ana', "I'm writing a message in English.", 'Estoy escribiendo un mensaje en inglés.'],
          [
            'Luis',
            "I'm studying English right now, too.",
            'Yo también estoy estudiando inglés ahora mismo.',
          ],
        ],
        tasks: [
          fill(
            'I am ____ English now. (estudiar)',
            ['studying'],
            'Am + studying describe la acción en curso.',
          ),
          build('I am writing a message.', 'Write cambia a writing después de am.'),
          recall(
            'Recuerda el sustantivo de esta lección para «mensaje», como en I am writing a ____. Escribe solo la palabra.',
            'message',
            'Message es un mensaje.',
          ),
          write(
            'En un mensaje de voz, cuentas qué haces: «Estoy aprendiendo inglés ahora». Usa learn.',
            [
              'I am learning English now.',
              'Now I am learning English.',
              'I am learning English right now.',
              'Right now I am learning English.',
            ],
            'I am learning expresa una acción que ocurre ahora.',
          ),
          read(
            "I study every day. Right now, I'm writing a message in English.",
            '¿Qué está haciendo la persona en este momento?',
            [
              'Está escribiendo un mensaje en inglés.',
              'Está escuchando un mensaje.',
              'Está trabajando.',
            ],
            0,
            'Right now y I’m writing señalan la acción en curso. I study every day habla de un hábito.',
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
        rule: 'Primero identifica quién hace la acción. Usa is con he o she y are con they, seguido de -ing. She’s y they’re son las formas cortas en «She’s cooking» y «They’re eating». Make pierde la e (making). La marca de persona queda en is o are, así que el verbo en -ing no lleva -s.',
        forms: [
          ['cooking', 'cocinando'],
          ['washing', 'lavando'],
          ['making', 'haciendo; preparando'],
          ['eating', 'comiendo'],
          ['on', 'sobre; en'],
          ["she's", 'she is, forma corta en she’s cooking'],
          ["he's", 'he is, forma corta en he’s washing'],
          ["they're", 'they are, forma corta'],
        ],
        examples: [
          ['She is making a salad.', 'Ella está preparando una ensalada.'],
          ['They are eating dinner.', 'Están cenando.'],
        ],
        dialogue: [
          ['Luis', 'My mom is making a salad.', 'Mi mamá está preparando una ensalada.'],
          ['Ana', 'My brother is washing a cup.', 'Mi hermano está lavando una taza.'],
          ['Luis', "They're both in the kitchen.", 'Los dos están en la cocina.'],
        ],
        tasks: [
          fill('She ____ cooking dinner now.', ['is'], 'She lleva is antes del verbo en -ing.'),
          build(
            'They are eating in the kitchen.',
            'They requiere are + eating.',
            ['In the kitchen they are eating.'],
            'Ordena las palabras para afirmar «Están comiendo en la cocina».',
          ),
          fix('He are washing a cup.', 'He is washing a cup.', 'He lleva is, no are.', {
            prompt: 'Cambia are para que concuerde con he y escribe la oración completa.',
          }),
          write(
            'Alguien te pregunta por ella. Usa make para decir «Ella está preparando una ensalada».',
            ['She is making a salad.', 'She is making salad.'],
            'She + is + making describe lo que hace ella ahora.',
          ),
          read(
            "Ana is washing a cup. Luis is making dinner. They're in the kitchen.",
            '¿Qué está haciendo Luis?',
            ['Está lavando una taza.', 'Está preparando la cena.', 'Está comiendo una ensalada.'],
            1,
            'Luis is making dinner significa que Luis está preparando la cena.',
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
          ['rain', 'llover', 'It is raining.', 'Está lloviendo.', 'verbo'],
          ['sunny', 'soleado', 'It is sunny today.', 'Hoy está soleado.', 'adjetivo'],
        ],
        recycle: ['work', 'now'],
        skill: 'grammar.continuous_negative',
        rule: 'Para negar una acción en curso, pon not después de am, is o are y conserva el verbo en -ing. «I’m not working» es la forma corta de «I am not working». «It isn’t raining» y «It’s not raining» significan «It is not raining». En inglés usamos it para hablar del clima, aunque en español no digamos un sujeto.',
        forms: [
          ['resting', 'descansando'],
          ['waiting', 'esperando'],
          ['raining', 'lloviendo'],
          ["isn't", 'is not, forma corta'],
          ["aren't", 'are not, forma corta'],
          ["it's", 'it is, forma corta en it’s not raining'],
          ["I'm not", 'I am not, forma corta'],
        ],
        examples: [
          ['I am not working now.', 'No estoy trabajando ahora.'],
          ["She isn't waiting outside.", 'Ella no está esperando afuera.'],
          ["It's not raining.", 'No está lloviendo.'],
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
            'Escribe el adverbio de esta lección que significa «afuera» y es lo contrario de inside.',
            'outside',
            'Outside significa afuera.',
          ),
          {
            type: 'short_text',
            prompt:
              'Al mirar por la ventana, di «No está lloviendo». Usa it + be + not y el verbo rain en -ing.',
            answers: ['It is not raining.'],
            reason: 'It is not raining niega la lluvia en este momento.',
            communicationOnly: {
              answers: ['There is no rain right now.'],
              feedbackEs:
                'Tu mensaje dice que no llueve. Para practicar una acción en curso, usa it + is not + raining.',
            },
          },
          read(
            "I'm not waiting outside. I'm resting inside. It isn't raining now.",
            '¿Dónde está descansando la persona?',
            ['Afuera.', 'En el trabajo.', 'Adentro.'],
            2,
            'Inside significa adentro. La primera oración dice dónde no está la persona.',
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
        recycle: ['where', 'phone', 'sister'],
        skill: 'grammar.continuous_questions',
        rule: 'En una pregunta de sí o no, mueve am, is o are antes del sujeto: «You are working» → «Are you working?». Para preguntar por una acción, pon what al inicio: «What are you doing?». Aquí doing viene de do (hacer). Sit duplica la t (sitting) y look for conserva for (looking for).',
        forms: [
          ['looking for', 'buscando'],
          ['talking', 'hablando'],
          ['sitting', 'sentado; sentada'],
          ['standing', 'de pie'],
          ['doing', 'haciendo'],
        ],
        examples: [
          ['What are you doing?', '¿Qué estás haciendo?'],
          ['Is she talking to your brother?', '¿Está hablando con tu hermano?'],
          ['Are you looking for your phone?', '¿Estás buscando tu teléfono?'],
        ],
        dialogue: [
          ['Luis', 'What are you doing?', '¿Qué estás haciendo?'],
          ['Ana', 'I am looking for my phone.', 'Estoy buscando mi teléfono.'],
          ['Luis', 'Is your sister sitting over there?', '¿Tu hermana está sentada allá?'],
          ['Ana', 'Yes, she is.', 'Sí.'],
        ],
        tasks: [
          fill('What ____ you doing?', ['are'], 'You requiere are antes de doing.'),
          build(
            'Is she sitting over there?',
            'Is + she + sitting forma la pregunta.',
            undefined,
            'Ordena las palabras para preguntar si ella está sentada allá.',
          ),
          fix('What you are doing?', 'What are you doing?', 'En preguntas are va antes de you.', {
            prompt: 'Conserva what al inicio y cambia de lugar are. Escribe la pregunta completa.',
          }),
          write(
            'Pregunta «¿Estás buscando tu teléfono?».',
            ['Are you looking for your phone?'],
            'Are you + looking for pregunta por la búsqueda que ocurre ahora.',
          ),
          read(
            'Luis: Are you looking for your phone? Ana: No. I am talking to my sister. She is sitting over there.',
            '¿Qué está haciendo Ana?',
            ['Está hablando con su hermana.', 'Está buscando su teléfono.', 'Está sentada allá.'],
            0,
            'Ana dice I am talking to my sister. She is sitting se refiere a su hermana.',
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
          ['plan', 'plan', 'My plan is to travel tomorrow.', 'Mi plan es viajar mañana.'],
        ],
        recycle: ['visit', 'buy'],
        skill: 'grammar.going_to',
        rule: 'Para hablar de un plan que ya decidiste, elige am, is o are según quién lo hará. Luego agrega going to y el verbo base: «I’m going to travel tomorrow». En este patrón, el plan es travel, no going. Con we usa are: «We’re going to buy two tickets».',
        forms: [
          ['going to', 'ir a (plan futuro)'],
          ['we', 'nosotros; nosotras'],
          ["we're", 'we are, forma corta'],
          ['tickets', 'boletos'],
        ],
        examples: [
          ["I'm going to visit my family tomorrow.", 'Voy a visitar a mi familia mañana.'],
          ["We're going to buy two tickets.", 'Vamos a comprar dos boletos.'],
          ['She is going to travel next week.', 'Ella va a viajar la próxima semana.'],
        ],
        dialogue: [
          ['Ana', "I'm going to visit my family tomorrow.", 'Voy a visitar a mi familia mañana.'],
          [
            'Luis',
            "I'm going to buy a ticket tomorrow. I'm going to travel next week.",
            'Voy a comprar un boleto mañana. Voy a viajar la próxima semana.',
          ],
        ],
        tasks: [
          fill(
            'I am going to ____ my family. (visitar)',
            ['visit'],
            'Going to lleva el verbo base visit.',
          ),
          build('She is going to travel tomorrow.', 'Con she usa is going to + travel.', [
            'Tomorrow she is going to travel.',
          ]),
          recall('Recuerda la palabra inglesa para «boleto».', 'ticket', 'Ticket es un boleto.'),
          write(
            'En un mensaje, cuenta «Voy a visitar a mi familia mañana». Usa be going to + visit.',
            ['I am going to visit my family tomorrow.', 'Tomorrow I am going to visit my family.'],
            'Going to expresa tu plan decidido.',
          ),
          read(
            "I'm going to buy a ticket tomorrow. I'm going to visit my family next week.",
            '¿Cuál de los planes es para mañana?',
            ['Visitar a su familia.', 'Comprar un boleto.', 'Comprar dos boletos.'],
            1,
            'Voy a comprar un boleto mañana es I’m going to buy a ticket tomorrow.',
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
        recycle: ['park', 'tomorrow', 'visit', 'family'],
        skill: 'grammar.going_to_questions',
        rule: 'Para convertir un plan en una pregunta de sí o no, mueve am, is o are antes del sujeto: «You are going to travel» → «Are you going to travel?». Para pedir la hora o el día, empieza con when: «When are we going to meet?». Going to y el verbo base siguen juntos.',
        forms: [['by', 'en; por (medio de transporte)']],
        examples: [
          ['When are we going to meet?', '¿Cuándo nos vamos a encontrar?'],
          ['Are you going to travel by bus?', '¿Vas a viajar en autobús?'],
          ['Is she going to travel by train?', '¿Va a viajar en tren?'],
        ],
        dialogue: [
          ['Luis', 'When are we going to meet?', '¿Cuándo nos vamos a encontrar?'],
          ['Ana', 'We’re going to meet at two.', 'Nos vamos a encontrar a las dos.'],
          [
            'Luis',
            'Are you going to take the bus to the park?',
            '¿Vas a tomar el autobús para ir al parque?',
          ],
          ['Ana', 'Yes, I am.', 'Sí.'],
        ],
        tasks: [
          fill('When ____ we going to meet?', ['are'], 'We usa are antes de going to.'),
          build(
            'Are you going to travel by train?',
            'Are you abre la pregunta sobre el plan.',
            undefined,
            'Ordena las palabras para preguntar si la otra persona va a viajar en tren.',
          ),
          write(
            'Coordina una visita. Usa be going to + visit para preguntar «¿Cuándo vas a visitar a tu familia?».',
            ['When are you going to visit your family?'],
            'When + are you going to pregunta por el momento del plan.',
          ),
          read(
            'Luis: When are we going to meet? Ana: We are going to meet at two. I am going to travel by train next Saturday.',
            '¿Qué responde Ana a la pregunta sobre el encuentro?',
            ['Va a viajar en tren.', 'Va a viajar el sábado.', 'Se van a encontrar a las dos.'],
            2,
            'When pide un momento. La respuesta a cuándo se van a encontrar es at two.',
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
          ['thanks', 'gracias (forma breve)', 'Thanks, Ana.', 'Gracias, Ana.', 'cortesía'],
        ],
        recycle: ['help', 'call'],
        skill: 'grammar.will',
        rule: 'Para ofrecerte a hacer algo en el momento, usa I will + verbo base. Si alguien necesita ayuda, puedes decir «I’ll carry your bag». I’ll es la forma corta de I will. Will no cambia con el sujeto y el verbo que sigue tampoco lleva -s: «She will open the door».',
        forms: [
          ['will', 'auxiliar de futuro u ofrecimiento'],
          ["I'll", 'I will, forma corta'],
        ],
        examples: [
          ["I'll carry your bag.", 'Yo llevo tu bolso.'],
          ['She will open the door.', 'Ella abrirá la puerta.'],
        ],
        dialogue: [
          ['Ana', 'Can you help me, please?', '¿Me puedes ayudar, por favor?'],
          ['Luis', "Sure. I'll carry your bag.", 'Claro. Yo llevo tu bolso.'],
          ['Ana', "Thanks. I'll open the door.", 'Gracias. Yo abro la puerta.'],
        ],
        tasks: [
          fill('She will ____ the door. (abrir)', ['open'], 'Después de will usa open sin -s.'),
          build('I will call you later.', 'Will + call expresa la decisión.', [
            'Later I will call you.',
          ]),
          recall(
            'Recuerda el verbo inglés que significa «abrir».',
            'open',
            'Open significa abrir.',
          ),
          {
            type: 'short_text',
            prompt: 'Ofrece llevar el bolso de otra persona. Usa I will o I’ll con carry.',
            answers: ['I will carry your bag.', 'I will carry your bag for you.'],
            reason: 'Will o I’ll + carry expresa un ofrecimiento.',
            communicationOnly: {
              answers: ['I can carry your bag.', 'I can carry your bag for you.'],
              feedbackEs:
                'Con can se entiende tu ofrecimiento. Para practicar una decisión en el momento, prueba con I’ll.',
            },
          },
          read(
            "Ana: I will open the door. Luis: I'll carry your bag. I will call you later.",
            '¿Qué se ofrece a hacer Luis además de llamar más tarde?',
            ['Llevar el bolso.', 'Abrir la puerta.', 'Comprar un bolso.'],
            0,
            'Luis se ofrece a llevar el bolso cuando dice I’ll carry your bag.',
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
          [
            'late',
            'tarde; con retraso',
            'I will not be late.',
            'No llegaré tarde.',
            'adjetivo o adverbio',
          ],
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
        rule: 'Para decir que algo no pasará, usa will not o won’t y después el verbo base. «I’ll cancel» significa que sí vas a cancelar. «I won’t cancel» significa que no. Si dices cómo estarás, usa be, la forma base de am/is/are: «I won’t be late».',
        forms: [
          ['will not', 'no (futuro)'],
          ["won't", 'will not, forma corta'],
          ['be', 'ser; estar (forma base)'],
          ['this', 'este; esta'],
        ],
        examples: [
          ["I won't arrive early.", 'No llegaré temprano.'],
          ['I will not cancel the trip.', 'No cancelaré el viaje.'],
          ["I won't be late.", 'No llegaré tarde.'],
        ],
        dialogue: [
          ['Luis', "I won't arrive early this time.", 'Esta vez no llegaré temprano.'],
          [
            'Ana',
            "That's OK. I'll wait at the bus stop.",
            'Está bien. Esperaré en la parada de autobús.',
          ],
          ['Luis', "Thanks. I won't be late.", 'Gracias. No llegaré tarde.'],
        ],
        tasks: [
          fill('I will ____ cancel the trip. (no)', ['not'], 'Not va después de will.'),
          build('She will not be late.', 'Después de will not usa be.'),
          fix(
            'He will not is late.',
            'He will not be late.',
            'Will not requiere be, la forma base de is.',
            {
              prompt:
                'Cambia is por la forma que va después de will not. Escribe la oración completa.',
            },
          ),
          write(
            'Envía un aviso: «No cancelaré el viaje». Usa will not o won’t.',
            ['I will not cancel the trip.', "I won't cancel the trip."],
            'Will not y won’t expresan la misma negación futura.',
          ),
          read(
            "I won't cancel the trip. I will travel by bus this time. I won't arrive early.",
            '¿Qué cambio confirma la persona que viaja?',
            [
              'Va a cancelar el viaje.',
              'Esta vez va a viajar en autobús.',
              'Va a llegar temprano.',
            ],
            1,
            'I will travel by bus se afirma. Won’t niega la cancelación y la llegada temprana.',
          ),
        ],
      },
    ],
  },
];
