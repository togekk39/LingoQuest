import type { Translation } from '@lingoquest/contracts';
import type { RpgFormalDefinition } from '@lingoquest/course-pack';
import type { PrerequisiteReference } from '../../packages/course-pack/src/prerequisites';
import type {
  TravelStep,
  TravelVocabulary,
} from '../../packages/offline-engine/src/travel-content';
import { form, grammar, studyPattern } from './mexico-prerequisites';

export const lessonIds = {
  now: 'u05_l02',
  habit: 'u05_l01',
  can: 'u03_l03',
  team: 'u05_l04',
  negative: 'u05_l03',
} as const;
export type SalvadorTopic = keyof typeof lessonIds;
export const pair = (en: string, es: string) => ({ en, es });
export const salvadorDefinitions: RpgFormalDefinition[] = [];
type Ref = PrerequisiteReference;
type Word = TravelVocabulary & { teaches: [Ref] };
const word = (id: string, en: string, es: string, example = pair(en, es)): Word => ({
  term: en,
  meaning: es,
  kind: 'Inglés',
  teaches: [form(id, en)],
  explanation: es,
  example,
});
const textbook = (lesson: string, index: number, en: string, es: string) =>
  word(`form.${lesson}.${index}`, en, es);
const lex = (lesson: string, index: string, en: string, es: string) =>
  word(`lex.${lesson}_v${index}`, en, es);

function local(id: string, en: string, es: string, example = pair(en, es)) {
  salvadorDefinitions.push({ id, kind: 'lexical', labelEs: es, forms: [en], examples: [example] });
  return word(id, en, es, example);
}
const newWord = (id: string, en: string, es: string, example?: Translation) =>
  local(`lex.salvador.${id}`, en, es, example);

export const w = {
  i: textbook('u05_l01', 7, 'I', 'yo'),
  am: textbook('u05_l01', 8, 'am', 'forma de be con I'),
  is: textbook('u05_l02', 11, 'is', 'forma de be con una persona o cosa'),
  are: textbook('u05_l02', 15, 'are', 'forma de be con you, we y they'),
  she: textbook('u05_l02', 9, 'she', 'ella'),
  he: textbook('u05_l02', 16, 'he', 'él'),
  you: lex('u01_l01', '05', 'you', 'tú o ustedes'),
  we: textbook('u06_l01', 2, 'we', 'nosotros o nosotras'),
  they: textbook('u05_l02', 14, 'they', 'ellos o ellas'),
  im: textbook('u05_l01', 6, "I'm", 'forma corta de I am'),
  shes: textbook('u05_l02', 6, "she's", 'forma corta de she is'),
  hes: textbook('u05_l02', 7, "he's", 'forma corta de he is'),
  theyre: textbook('u05_l02', 8, "they're", 'forma corta de they are'),
  youre: newWord('you-are', "you're", 'forma corta de you are'),
  were: newWord('we-are', "we're", 'forma corta de we are'),
  the: textbook('u05_l02', 13, 'the', 'el, la, los o las'),
  a: textbook('u05_l01', 9, 'a', 'un o una'),
  on: textbook('u05_l02', 5, 'on', 'encima de, sobre'),
  in: textbook('u05_l02', 12, 'in', 'en, dentro de'),
  it: textbook('u05_l03', 13, 'it', 'eso, para referirse a una cosa'),
  not: textbook('u01_l04', 4, 'not', 'no, para negar'),
  isnt: textbook('u05_l03', 4, "isn't", 'forma corta de is not'),
  arent: textbook('u05_l03', 5, "aren't", 'forma corta de are not'),
  what: lex('u01_l04', '02', 'what', 'qué'),
  do: lex('u05_l04', '05', 'do', 'hacer'),
  doing: textbook('u05_l04', 5, 'doing', 'haciendo'),
  now: lex('u05_l01', '01', 'now', 'ahora'),
  rightNow: lex('u05_l01', '06', 'right now', 'en este mismo momento'),
  kitchen: lex('u05_l02', '01', 'kitchen', 'cocina, el lugar'),
  table: lex('u05_l02', '06', 'table', 'mesa'),
  vegetable: local('lex.food.vegetable', 'vegetables', 'verduras'),
  wash: lex('u05_l02', '02', 'wash', 'lavar'),
  washing: textbook('u05_l02', 2, 'washing', 'lavando'),
  washes: newWord('washes', 'washes', 'lava'),
  make: lex('u05_l02', '04', 'make', 'hacer o preparar'),
  making: textbook('u05_l02', 3, 'making', 'haciendo o preparando'),
  makes: newWord('makes', 'makes', 'prepara'),
  lunch: lex('u04_l03', '04', 'lunch', 'almuerzo'),
  cook: lex('u02_l02', '01', 'cook', 'cocinar'),
  cooking: textbook('u05_l02', 1, 'cooking', 'cocinando'),
  cooks: textbook('u02_l02', 6, 'cooks', 'cocina, prepara comida'),
  rice: lex('u03_l01', '05', 'rice', 'arroz'),
  bread: lex('u03_l02', '02', 'bread', 'pan'),
  soup: newWord('soup', 'soup', 'sopa'),
  read: lex('u02_l02', '02', 'read', 'leer'),
  reads: textbook('u02_l02', 7, 'reads', 'lee'),
  reading: newWord('reading', 'reading', 'leyendo'),
  book: lex('u01_l03', '01', 'book', 'libro'),
  atHome: lex('u02_l02', '05', 'at home', 'en casa'),
  together: lex('u02_l02', '06', 'together', 'juntos'),
  working: textbook('u05_l01', 5, 'working', 'trabajando'),
  prepare: newWord('prepare', 'prepare', 'preparar'),
  preparing: newWord('preparing', 'preparing', 'preparando'),
  prepares: newWord('prepares', 'prepares', 'prepara'),
  usually: lex('u02_l03', '02', 'usually', 'normalmente'),
  today: lex('u03_l02', '06', 'today', 'hoy'),
  but: newWord('but', 'but', 'pero'),
  stir: local('published.brazil.card-1.word-2', 'stir the soup', 'revolver la sopa'),
  stirBase: newWord('stir', 'stir', 'revolver'),
  stirring: newWord('stirring', 'stirring', 'revolviendo'),
  stirs: newWord('stirs', 'stirs', 'revuelve'),
  bowl: newWord('bowl', 'bowl', 'tazón'),
  bowls: newWord('bowls', 'bowls', 'tazones'),
  set: newWord('set-the-table', 'set the table', 'poner la mesa'),
  setting: newWord('setting', 'setting', 'poniendo, en setting the table'),
  sets: newWord('sets', 'sets', 'pone, en sets the table'),
  like: lex('u03_l01', '01', 'like', 'gustar'),
  know: newWord('know', 'know', 'saber'),
  want: lex('u03_l02', '05', 'want', 'querer'),
  need: local('lex.quantity.need', 'need', 'necesitar'),
  needs: newWord('needs', 'needs', 'necesita'),
  help: lex('u03_l03', '01', 'help', 'ayudar o ayuda'),
  helping: newWord('helping', 'helping', 'ayudando'),
  slowly: lex('u03_l03', '03', 'slowly', 'despacio'),
  please: lex('u03_l03', '04', 'please', 'por favor'),
  me: textbook('u03_l03', 4, 'me', 'me, a mí'),
  break: newWord('take-a-break', 'take a break', 'tomar un descanso'),
  carryOut: newWord('carry-out-task', 'carry out a task', 'hacer una tarea hasta completarla'),
  carry: newWord('carry', 'carry', 'llevar algo cargado'),
  can: textbook('u03_l03', 1, 'can', 'poder, saber hacer'),
  cant: textbook('u03_l03', 3, "can't", 'forma corta de cannot (no poder)'),
  cannot: textbook('u03_l03', 2, 'cannot', 'no poder'),
  yes: lex('u01_l04', '05', 'yes', 'sí'),
  no: lex('u01_l04', '06', 'no', 'no'),
  sorry: newWord('sorry', 'sorry', 'lo siento'),
  sure: newWord('sure', 'sure', 'claro, para aceptar'),
  cut: local('published.brazil.card-1.word-3', 'cut the bread', 'cortar el pan'),
  cutBase: newWord('cut', 'cut', 'cortar'),
  cutting: newWord('cutting', 'cutting', 'cortando'),
  cuts: newWord('cuts', 'cuts', 'corta'),
  put: local(
    'published.brazil.card-1.word-4',
    'put the bowls on the table',
    'poner los tazones en la mesa',
  ),
  putBase: newWord('put', 'put', 'poner algo en un lugar'),
  putting: newWord('putting', 'putting', 'poniendo'),
  puts: newWord('puts', 'puts', 'pone'),
  still: newWord('still', 'still', 'todavía, para una acción que sigue'),
  next: newWord('next', 'next', 'a continuación'),
  first: local('published.mexico.card-2.word-10', 'first', 'primero'),
  then: textbook('u08_l02', 2, 'then', 'luego'),
  cups: local('form.portion.cup.plural', 'cups', 'tazas'),
  here: newWord('here', 'here', 'aquí'),
  display: newWord('display', 'display', 'exhibición'),
  photos: newWord('photos', 'photos', 'fotos'),
  picture: newWord('picture', 'picture', 'imagen'),
  pictures: newWord('pictures', 'pictures', 'imágenes'),
  hang: newWord('hang', 'hang', 'colgar'),
  hanging: newWord('hanging', 'hanging', 'colgando'),
  hangs: newWord('hangs', 'hangs', 'cuelga'),
  move: newWord('move', 'move', 'mover'),
  moving: newWord('moving', 'moving', 'moviendo'),
  moves: newWord('moves', 'moves', 'mueve'),
  labels: newWord('labels', 'labels', 'etiquetas'),
  yesterday: lex('u04_l01', '01', 'yesterday', 'ayer'),
  cooked: local('lex.cusco.cooked', 'cooked', 'cocinó'),
  atTwelve: lex('u02_l04', '08', 'at noon', 'al mediodía'),
  us: newWord('us', 'us', 'nos, a nosotros'),
};

function rule(id: string, labelEs: string, example: Translation) {
  const target = `grammar.salvador.${id}`;
  salvadorDefinitions.push({
    id: target,
    kind: 'grammar',
    labelEs,
    forms: [],
    examples: [example],
  });
  return grammar(target);
}

export const g = {
  firstPerson: grammar('grammar.continuous_i'),
  now: grammar('grammar.continuous_others'),
  agreement: rule(
    'be-agreement',
    'Concordancia con am, is y are',
    pair('She is cooking. They are cooking.', 'Ella está cocinando. Ellos están cocinando.'),
  ),
  spelling: rule(
    'ing-spelling',
    'Cómo se escribe -ing',
    pair('make → making; cut → cutting', 'hacer → haciendo; cortar → cortando'),
  ),
  habit: rule(
    'habit-now',
    'Lo habitual frente a lo que pasa ahora',
    pair(
      'Jo usually sets the table, but today she is washing the vegetables.',
      'Jo normalmente pone la mesa, pero hoy está lavando las verduras.',
    ),
  ),
  third: grammar('grammar.routine_third_person'),
  state: rule(
    'state',
    'Presente simple para un estado',
    pair('I need help today.', 'Hoy necesito ayuda.'),
  ),
  can: grammar('grammar.can'),
  canBase: rule(
    'can-base',
    'Verbo base después de can o can’t',
    pair('She can cook.', 'Ella sabe cocinar.'),
  ),
  canPolarity: rule(
    'can-polarity',
    'Escuchar can y can’t',
    pair("I can help. I can't help.", 'Puedo ayudar. No puedo ayudar.'),
  ),
  availability: rule(
    'availability',
    'Distinguir capacidad de disponibilidad actual',
    pair(
      "I can cook, but I can't help right now.",
      'Sé cocinar, pero ahora mismo no puedo ayudar.',
    ),
  ),
  offer: rule('offer', 'Ofrecer ayuda', pair('Can I help?', '¿Puedo ayudar?')),
  question: grammar('grammar.continuous_questions'),
  negative: grammar('grammar.continuous_negative'),
  team: rule(
    'team-state',
    'Confirmar qué tarea está en curso',
    pair('Jo is washing the vegetables now.', 'Jo está lavando las verduras ahora.'),
  ),
  order: rule(
    'sequence',
    'Orden de instrucciones',
    pair(
      'First, cut the bread. Then put the bowls on the table.',
      'Primero corta el pan. Luego pon los tazones en la mesa.',
    ),
  ),
};
function pattern(id: string, template: string, example: Translation) {
  const target = `pattern.salvador.${id}`;
  salvadorDefinitions.push({
    id: target,
    kind: 'pattern',
    labelEs: template,
    forms: [template],
    examples: [example],
  });
  return form(target, template);
}

export const p = {
  now: studyPattern('u05_l02', 'singular'),
  habit: pattern(
    'habit-now',
    'sujeto + usually + presente simple, but today + be + -ing',
    pair(
      'Jo usually sets the table, but today she is washing the vegetables.',
      'Jo normalmente pone la mesa, pero hoy está lavando las verduras.',
    ),
  ),
  order: pattern(
    'first-then',
    'First + verbo base, Then + verbo base',
    pair(
      'First, cut the bread. Then put the bowls on the table.',
      'Primero corta el pan. Luego pon los tazones en la mesa.',
    ),
  ),
  plural: studyPattern('u05_l02', 'plural'),
  i: studyPattern('u05_l01', 'current'),
  can: studyPattern('u03_l03', 'ability'),
  request: studyPattern('u03_l03', 'request'),
  negative: studyPattern('u05_l03', 'negative'),
  question: studyPattern('u05_l04', 'what'),
  yesNo: studyPattern('u05_l04', 'yes-no'),
};

export const refs = (words: readonly Word[], ...rules: Ref[]) => [
  ...new Map(
    [...words.flatMap(({ teaches }) => teaches), ...rules].map((ref) => [
      `${ref.id}:${ref.form ?? ''}`,
      ref,
    ]),
  ).values(),
];

export function teach(
  name: string,
  topic: SalvadorTopic,
  title: string,
  text: string,
  words: readonly Word[],
  examples: Translation[],
  ...rules: Ref[]
): TravelStep {
  return {
    id: `salvador-${name}-teach`,
    type: 'teach',
    title,
    text,
    examples,
    vocabularyTerms: [...new Set(words.map(({ term }) => term))],
    instruction: {
      lessonId: lessonIds[topic],
      stage: rules.length ? 'both' : 'vocabulary',
      ...(rules.length && { references: rules }),
    },
  };
}

export const subjects = [
  w.i,
  w.am,
  w.she,
  w.he,
  w.you,
  w.we,
  w.they,
  w.is,
  w.are,
  w.im,
  w.shes,
  w.hes,
  w.youre,
  w.were,
  w.theyre,
];
export const basic = [w.the, w.a, w.on, w.in, w.now, w.rightNow];
export const kitchenWords = [
  w.wash,
  w.washing,
  w.vegetable,
  w.kitchen,
  w.table,
  w.cook,
  w.cooking,
  w.rice,
  w.make,
  w.making,
  w.lunch,
  w.read,
  w.reading,
  w.book,
  w.atHome,
  w.prepare,
  w.preparing,
  w.working,
  w.together,
];
export const habitWords = [
  w.usually,
  w.today,
  w.but,
  w.set,
  w.sets,
  w.setting,
  w.washes,
  w.cooks,
  w.makes,
  w.stir,
  w.stirBase,
  w.stirs,
  w.stirring,
  w.soup,
  w.bowl,
  w.bowls,
  w.prepares,
  w.reads,
  w.like,
  w.know,
  w.want,
  w.need,
  w.needs,
];
export const canWords = [
  w.can,
  w.cant,
  w.cannot,
  w.help,
  w.helping,
  w.please,
  w.me,
  w.us,
  w.slowly,
  w.break,
  w.carryOut,
  w.carry,
  w.yes,
  w.no,
  w.sorry,
  w.sure,
  w.cut,
  w.cutBase,
  w.cuts,
  w.bread,
];
export const teamWords = [
  w.what,
  w.do,
  w.doing,
  w.not,
  w.isnt,
  w.arent,
  w.it,
  w.still,
  w.cutting,
  w.put,
  w.putBase,
  w.puts,
  w.putting,
  w.first,
  w.then,
  w.next,
  w.cups,
  w.here,
];
export const displayWords = [
  w.photos,
  w.picture,
  w.pictures,
  w.hang,
  w.hanging,
  w.hangs,
  w.move,
  w.moving,
  w.moves,
  w.labels,
  w.display,
];
