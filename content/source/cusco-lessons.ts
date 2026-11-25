import type { RpgFormalDefinition } from '@lingoquest/course-pack';
import type { PrerequisiteReference } from '../../packages/course-pack/src/prerequisites';
import type { TravelStep } from '../../packages/offline-engine/src/travel-content';
import { numberLearningId } from './travel-number-words';
import { form, grammar, studyPattern } from './mexico-prerequisites';

const definitions: RpgFormalDefinition[] = [];
export const cuscoDefinitions = definitions;
export const cuscoLessons = {
  be: 'u04_l01',
  regular: 'u04_l02',
  irregular: 'u04_l03',
  ask: 'u04_l04',
} as const;
export type CuscoTopic = keyof typeof cuscoLessons;
export const pair = (en: string, es: string) => ({ en, es });
type Example = ReturnType<typeof pair>;
type Ref = PrerequisiteReference;
type Term = readonly [Ref, Example];

function existing(id: string, en: string, es: string): Term {
  return [form(id, en), pair(en, es)];
}
function newWord(id: string, en: string, es: string): Term {
  definitions.push({ id, kind: 'lexical', labelEs: es, forms: [en], examples: [pair(en, es)] });
  return existing(id, en, es);
}
const word = (id: string, en: string, es: string) => newWord(`lex.cusco.${id}`, en, es);
const textbook = (lesson: string, n: number, en: string, es: string) =>
  existing(`form.${lesson}.${n}`, en, es);

export const w = {
  yesterday: existing('lex.u04_l01_v01', 'yesterday', 'ayer'),
  lastNight: existing('lex.u04_l01_v05', 'last night', 'anoche'),
  work: existing('lex.u02_l01_v01', 'work', 'trabajo o trabajar'),
  atHome: existing('lex.u02_l02_v05', 'at home', 'en casa'),
  atWork: existing('lex.u04_l01_v02', 'at work', 'en el trabajo'),
  tired: existing('lex.u04_l01_v04', 'tired', 'cansado o cansada'),
  busy: existing('lex.u04_l01_v03', 'busy', 'ocupado u ocupada'),
  park: existing('home.park', 'park', 'parque'),
  hotel: word('hotel', 'hotel', 'hotel'),
  museum: word('museum', 'museum', 'museo'),
  room: existing('lex.u04_l02_v06', 'room', 'cuarto'),
  plaza: word('plaza', 'plaza', 'plaza'),
  entrance: word('entrance', 'entrance', 'entrada'),
  shop: word('shop', 'shop', 'tienda'),
  airport: word('airport', 'airport', 'aeropuerto'),
  the: textbook('u04_l03', 7, 'the', 'el, la, los, las'),
  at: existing('form.u02_l04.1', 'at', 'a las o en'),
  to: textbook('u04_l03', 5, 'to', 'a o hacia'),
  in: existing('form.u02_l01.1', 'in', 'en o dentro de'),
  from: word('from', 'from', 'de, para indicar origen'),
  and: existing('form.u01_l03.3', 'and', 'y'),
  i: textbook('u04_l01', 4, 'I', 'yo'),
  they: textbook('u04_l01', 5, 'they', 'ellos o ellas'),
  you: existing('lex.u01_l01_v05', 'you', 'tú o usted'),
  he: textbook('u04_l02', 2, 'he', 'él'),
  she: textbook('u04_l03', 8, 'she', 'ella'),
  we: existing('form.u06_l01.2', 'we', 'nosotros o nosotras'),
  was: textbook('u04_l01', 1, 'was', 'estaba o estuve'),
  were: textbook('u04_l01', 2, 'were', 'estabas o estaban'),
  wasnt: word('wasnt', "wasn't", 'no estaba, forma corta'),
  werent: word('werent', "weren't", 'no estaban, forma corta'),
  not: word('not', 'not', 'no'),
  where: word('where', 'where', 'dónde'),
  when: word('when', 'when', 'cuándo'),
  what: word('what', 'what', 'qué'),
  who: word('who', 'who', 'quién'),
  atSix: existing('lex.u02_l04_v05', 'at six', 'a las seis'),
  nine: newWord(numberLearningId(9), 'nine', 'nueve'),
  ten: newWord(numberLearningId(10), 'ten', 'diez'),
  eleven: newWord(numberLearningId(11), 'eleven', 'once'),
  two: newWord(numberLearningId(2), 'two', 'dos'),
  three: newWord(numberLearningId(3), 'three', 'tres'),
  four: newWord(numberLearningId(4), 'four', 'cuatro'),
  noon: word('noon', 'noon', 'mediodía'),
  am: word('am', 'a.m.', 'antes del mediodía'),
  pm: word('pm', 'p.m.', 'después del mediodía'),
  visit: existing('lex.u04_l02_v01', 'visit', 'visitar'),
  visited: textbook('u04_l02', 3, 'visited', 'visité o visitó'),
  clean: existing('lex.u04_l02_v02', 'clean', 'limpiar'),
  cleaned: textbook('u04_l02', 4, 'cleaned', 'limpié o limpió'),
  finish: existing('lex.u04_l02_v03', 'finish', 'terminar'),
  finished: textbook('u04_l02', 5, 'finished', 'terminé o terminó'),
  call: existing('lex.u04_l02_v04', 'call', 'llamar por teléfono'),
  called: textbook('u04_l02', 6, 'called', 'llamé o llamó'),
  study: existing('lex.u02_l01_v02', 'study', 'estudiar'),
  studied: textbook('u04_l02', 7, 'studied', 'estudié o estudió'),
  walk: existing('lex.u02_l01_v04', 'walk', 'caminar'),
  walked: word('walked', 'walked', 'caminé o caminó'),
  watch: existing('lex.u04_l04_v04', 'watch', 'ver una película o mirar con atención'),
  watched: textbook('u04_l04', 6, 'watched', 'vi o vio una película'),
  play: word('play', 'play', 'jugar'),
  played: word('played', 'played', 'jugué o jugó'),
  want: existing('lex.u03_l02_v05', 'want', 'querer'),
  wanted: word('wanted', 'wanted', 'quise o quiso'),
  need: newWord('lex.quantity.need', 'need', 'necesitar'),
  needed: word('needed', 'needed', 'necesité o necesitó'),
  arrive: word('arrive', 'arrive', 'llegar'),
  arrived: word('arrived', 'arrived', 'llegué o llegó'),
  first: newWord('published.peru.card-1.word-2', 'first', 'primero'),
  then: newWord('published.peru.card-1.word-3', 'then', 'después'),
  before: existing('lex.u07_l02_v06', 'before', 'antes de'),
  after: existing('form.u02_l04.8', 'after', 'después de'),
  go: existing('lex.u04_l03_v01', 'go', 'ir'),
  went: textbook('u04_l03', 1, 'went', 'fui o fue'),
  buy: existing('lex.u04_l03_v02', 'buy', 'comprar'),
  bought: textbook('u04_l03', 2, 'bought', 'compré o compró'),
  see: word('see', 'see', 'ver a una persona o una cosa'),
  saw: newWord('lex.see.vision', 'saw', 'vi o vio a una persona o una cosa'),
  take: existing('lex.u04_l03_v06', 'take', 'tomar'),
  takePhoto: word('take-photo', 'take a photo', 'hacer o sacar una foto'),
  tookPhoto: word('took-photo', 'took a photo', 'hice o sacó una foto'),
  took: textbook('u04_l03', 4, 'took', 'tomé o tomó'),
  bus: existing('lex.u04_l03_v05', 'bus', 'autobús'),
  photo: word('photo', 'photo', 'foto'),
  a: textbook('u04_l04', 11, 'a', 'un o una'),
  market: existing('lex.u04_l03_v03', 'market', 'mercado'),
  bread: existing('lex.u03_l02_v02', 'bread', 'pan'),
  fruit: existing('lex.u03_l01_v06', 'fruit', 'fruta'),
  eat: existing('lex.u02_l02_v03', 'eat', 'comer'),
  ate: textbook('u04_l03', 3, 'ate', 'comí o comió'),
  lunch: existing('lex.u04_l03_v04', 'lunch', 'almuerzo'),
  did: textbook('u04_l04', 1, 'did', 'auxiliar de pregunta en pasado'),
  didNot: textbook('u04_l04', 2, 'did not', 'no, en pasado'),
  didnt: textbook('u04_l04', 3, "didn't", 'did not, forma corta'),
  happen: word('happen', 'happen', 'ocurrir'),
  happened: word('happened', 'happened', 'ocurrió'),
  leave: word('leave', 'leave', 'salir de un lugar'),
  left: word('left', 'left', 'salí o salió de un lugar'),
  lastWeekend: existing('lex.u04_l04_v02', 'last weekend', 'el fin de semana pasado'),
  yes: existing('lex.u01_l04_v05', 'yes', 'sí'),
  no: existing('lex.u01_l04_v06', 'no', 'no'),
  coffee: existing('lex.u03_l01_v02', 'coffee', 'café, la bebida'),
};

function rule(id: string, labelEs: string, example: Example) {
  definitions.push({ id, kind: 'grammar', labelEs, forms: [], examples: [example] });
  return grammar(id);
}
function pattern(id: string, template: string, example: Example) {
  definitions.push({
    id,
    kind: 'pattern',
    labelEs: template,
    forms: [template],
    examples: [example],
  });
  return form(id, template);
}

export const g = {
  be: grammar('grammar.past_be'),
  regular: grammar('grammar.past_regular'),
  irregular: grammar('grammar.past_irregular'),
  ask: grammar('grammar.did'),
  endings: rule(
    'grammar.cusco.ed-sounds',
    'Tres sonidos de -ed',
    pair('Walked, played, visited.', 'Caminó, jugó, visitó.'),
  ),
  endingT: rule('grammar.cusco.ed-sound-t', 'Terminación -ed con /t/', pair('Walked.', 'Caminó.')),
  endingD: rule('grammar.cusco.ed-sound-d', 'Terminación -ed con /d/', pair('Played.', 'Jugó.')),
  endingId: rule(
    'grammar.cusco.ed-sound-id',
    'Terminación -ed con /ɪd/',
    pair('Visited.', 'Visitó.'),
  ),
  sequence: rule(
    'grammar.cusco.sequence',
    'Orden de eventos',
    pair('First we ate lunch. Then we walked.', 'Primero almorzamos. Después caminamos.'),
  ),
};
export const p = {
  be: studyPattern('u04_l01', 'past'),
  regular: studyPattern('u04_l02', 'past'),
  irregular: studyPattern('u04_l03', 'past'),
  ask: studyPattern('u04_l04', 'question'),
  negative: studyPattern('u04_l04', 'negative'),
  beNegative: pattern(
    'pattern.cusco.be-negative',
    'sujeto + was / were + not',
    pair("We weren't at the market.", 'No estábamos en el mercado.'),
  ),
  beQuestion: pattern(
    'pattern.cusco.be-question',
    'Was / Were + sujeto + complemento?',
    pair('Were you tired?', '¿Estabas cansado?'),
  ),
  wh: pattern(
    'pattern.cusco.wh-did',
    'When / Where / What + did + sujeto + verbo base?',
    pair('When did you arrive?', '¿Cuándo llegaste?'),
  ),
  subject: pattern(
    'pattern.cusco.past-subject-question',
    'Who / What + verbo en pasado?',
    pair('Who took the photo?', '¿Quién sacó la foto?'),
  ),
  order: pattern(
    'pattern.cusco.before-after',
    'evento + before / after + evento',
    pair('We ate lunch after we visited the market.', 'Almorzamos después de visitar el mercado.'),
  ),
  sequence: pattern(
    'pattern.cusco.first-then',
    'First, evento. Then, evento.',
    pair(
      'First we went to the market. Then Luz bought bread.',
      'Primero fuimos al mercado. Luego Luz compró pan.',
    ),
  ),
};

export const refs = (words: readonly Term[], ...other: Ref[]) => [
  ...new Map(
    [...words.map(([ref]) => ref), ...other].map((ref) => [JSON.stringify(ref), ref]),
  ).values(),
];

function teach(
  topic: CuscoTopic,
  name: string,
  speaker: string,
  title: string,
  text: string,
  words: readonly Term[],
  examples: Example[],
  ...other: Ref[]
): TravelStep {
  return {
    id: `cusco-${name}-teach`,
    type: 'teach',
    speaker,
    title,
    text,
    examples,
    instruction: {
      lessonId: cuscoLessons[topic],
      stage: 'grammar',
      references: refs(words, ...other),
    },
  };
}

export const beWords = [
  w.i,
  w.you,
  w.he,
  w.she,
  w.we,
  w.they,
  w.was,
  w.were,
  w.wasnt,
  w.werent,
  w.not,
  w.tired,
  w.busy,
  w.yesterday,
  w.lastNight,
];
export const places = [
  w.atHome,
  w.atWork,
  w.work,
  w.the,
  w.at,
  w.park,
  w.hotel,
  w.plaza,
  w.room,
  w.market,
  w.from,
  w.where,
];
export const morning = [w.nine, w.ten, w.eleven, w.noon, w.am, w.atSix];
export const regularWords = [
  w.visit,
  w.visited,
  w.clean,
  w.cleaned,
  w.finish,
  w.finished,
  w.call,
  w.called,
  w.walk,
  w.walked,
  w.study,
  w.studied,
  w.arrive,
  w.arrived,
  w.watch,
  w.watched,
  w.play,
  w.played,
  w.want,
  w.wanted,
  w.need,
  w.needed,
  w.to,
  w.first,
  w.then,
];
export const irregularWords = [
  w.go,
  w.went,
  w.buy,
  w.bought,
  w.see,
  w.saw,
  w.take,
  w.takePhoto,
  w.tookPhoto,
  w.took,
  w.a,
  w.photo,
  w.bus,
  w.bread,
  w.fruit,
  w.eat,
  w.ate,
  w.lunch,
  w.before,
  w.after,
  w.and,
];
export const askWords = [
  w.did,
  w.didNot,
  w.didnt,
  w.happen,
  w.happened,
  w.lastWeekend,
  w.leave,
  w.left,
  w.when,
  w.what,
  w.who,
  w.yes,
  w.no,
  w.coffee,
];
export const museumWords = [
  w.museum,
  w.entrance,
  w.shop,
  w.airport,
  w.in,
  w.two,
  w.three,
  w.four,
  w.pm,
];

export const cuscoTeaching = {
  be: teach(
    'be',
    'be',
    'Sam',
    'Hoy y ayer',
    'La foto es de ayer. Usa was con I, he o she y were con you, we o they. Para negar, agrega not. Wasn’t y weren’t son formas cortas. En una pregunta pon was o were antes de la persona. El pasado aquí no lleva did.',
    [...beWords, ...places, ...morning, w.museum],
    [
      pair('I am tired now. I was tired yesterday.', 'Estoy cansado ahora. Ayer estaba cansado.'),
      pair(
        'They are at the market now. They were at the market yesterday.',
        'Ahora están en el mercado. Ayer estaban en el mercado.',
      ),
      pair(
        'I was at home yesterday. You were at the market.',
        'Ayer estaba en casa. Tú estabas en el mercado.',
      ),
      pair(
        'He was tired. She was busy. We were at the park. They were at the hotel.',
        'Él estaba cansado. Ella estaba ocupada. Estábamos en el parque. Estaban en el hotel.',
      ),
      pair(
        "I wasn't at home. She wasn't busy. We weren't at the market. They weren't tired.",
        'Yo no estaba en casa. Ella no estaba ocupada. No estábamos en el mercado. No estaban cansados.',
      ),
      pair(
        'Sam was not at work. You were not at the plaza.',
        'Sam no estaba en el trabajo. Tú no estabas en la plaza.',
      ),
      pair(
        'Where were you yesterday? Was Sam at the market? Were you tired?',
        '¿Dónde estuviste ayer? ¿Sam estaba en el mercado? ¿Estabas cansado?',
      ),
      pair(
        'From the hotel to the plaza. My room is at the hotel. This is the museum.',
        'Del hotel a la plaza. Mi cuarto está en el hotel. Este es el museo.',
      ),
      pair(
        'At six last night. At nine a.m. At ten. At eleven. At noon.',
        'A las seis de anoche. A las nueve de la mañana. A las diez. A las once. Al mediodía.',
      ),
    ],
    g.be,
    p.be,
    p.beNegative,
    p.beQuestion,
  ),
  regular: teach(
    'regular',
    'regular',
    'Luz',
    'Acciones terminadas en la plaza',
    'Para contar algo que terminó, muchos verbos llevan -ed. Si el verbo termina en e, agrega solo d. Si termina en consonante seguida de y, cambia y por i y agrega -ed. First indica el primer evento; then indica lo que pasó después.',
    [...regularWords, w.and],
    [
      pair(
        'Visit, visited. Clean, cleaned. Finish, finished. Call, called.',
        'Visitar, visitó. Limpiar, limpió. Terminar, terminó. Llamar, llamó.',
      ),
      pair(
        'Walk, walked. Arrive, arrived. Study, studied.',
        'Caminar, caminó. Llegar, llegó. Estudiar, estudió.',
      ),
      pair(
        'Watch, watched. Play, played. Want, wanted. Need, needed.',
        'Mirar, miró. Jugar, jugó. Querer, quiso. Necesitar, necesitó.',
      ),
      pair(
        'I visited the market yesterday. Sam called Luz.',
        'Ayer visité el mercado. Sam llamó a Luz.',
      ),
      pair(
        'First, we visited the plaza. Then we walked to the hotel. We visited the plaza and then we walked to the hotel.',
        'Primero visitamos la plaza. Después caminamos al hotel. Visitamos la plaza y después caminamos al hotel.',
      ),
    ],
    g.regular,
    g.sequence,
    p.regular,
    p.sequence,
  ),
  endings: teach(
    'regular',
    'endings',
    'Luz',
    'Escucha el final de -ed',
    'La letra no te dice cómo suena. Después de un sonido sin voz como /k/ o /sh/, escucha /t/. Después de un sonido con voz como /l/ o /n/, escucha /d/. Después de /t/ o /d/, se oye /ɪd/ y aparece una sílaba más. Walked y played tienen una sílaba. Visited tiene tres. Usa los botones para escuchar cada palabra.',
    [],
    [
      'walked',
      'watched',
      'finished',
      'played',
      'cleaned',
      'called',
      'visited',
      'wanted',
      'needed',
    ].map((en, i) =>
      pair(en, i < 3 ? 'Termina en /t/' : i < 6 ? 'Termina en /d/' : 'Termina en /ɪd/'),
    ),
    g.endings,
    g.endingT,
    g.endingD,
    g.endingId,
  ),
  irregular: teach(
    'irregular',
    'irregular',
    'Diego',
    'Lo que pasó en el mercado',
    'Estos pasados tienen una forma propia. Con take a photo hablamos de hacer una foto. Con take the bus hablamos de viajar en autobús. Took es la forma de pasado en ambos casos. En estas notas, saw significa que viste a alguien.',
    irregularWords.filter((term) => term !== w.before && term !== w.after),
    [
      pair('Go, went. We went to the market.', 'Ir, fue. Fuimos al mercado.'),
      pair('Buy, bought. Luz bought bread and fruit.', 'Comprar, compró. Luz compró pan y fruta.'),
      pair('See, saw. Sam saw Diego.', 'Ver, vio. Sam vio a Diego.'),
      pair('Take a photo. I took a photo.', 'Sacar una foto. Saqué una foto.'),
      pair('Take the bus. I took the bus.', 'Tomar el autobús. Tomé el autobús.'),
      pair('Eat, ate. We ate lunch.', 'Comer, comió. Almorzamos.'),
    ],
    g.irregular,
    p.irregular,
  ),
  order: teach(
    'irregular',
    'order',
    'Diego',
    '¿Cuál pasó antes?',
    'Before significa antes de y after significa después de. Puedes decir primero la acción que pasó después. En el primer ejemplo se menciona el almuerzo al principio, pero la visita al mercado ocurrió antes.',
    [w.before, w.after],
    [
      pair(
        'We ate lunch after we visited the market.',
        'Almorzamos después de visitar el mercado.',
      ),
      pair('Before lunch, we went to the market.', 'Antes de almorzar, fuimos al mercado.'),
      pair('After lunch, we walked to the plaza.', 'Después de almorzar, caminamos a la plaza.'),
    ],
    g.sequence,
    p.order,
  ),
  ask: teach(
    'ask',
    'ask',
    'Nora',
    'Preguntas para completar el diario',
    'Did y didn’t ya indican pasado. Después usa go, buy o take en su forma base. Para preguntar por un dato empieza con Where, When o What. What happened? y Who took the photo? preguntan qué o quién realizó una acción y usan directamente el pasado. Con was y were, pregunta sin did. Did you went?, She didn’t bought bread y He don’t went mezclan formas: usa Did you go?, She didn’t buy bread y He didn’t go. Para Did you was tired? o Where did you were? escribe Were you tired? o Where were you?',
    askWords,
    [
      pair(
        "Did you go to the market? Yes, I did. I didn't buy coffee.",
        '¿Fuiste al mercado? Sí. No compré café.',
      ),
      pair(
        "Did Sam buy bread? Did Luz take a photo? Yes, she did. No, she didn't.",
        '¿Sam compró pan? ¿Luz sacó una foto? Sí. No.',
      ),
      pair(
        'I did not go to the market. Sam did not buy coffee.',
        'No fui al mercado. Sam no compró café.',
      ),
      pair(
        'What did you buy? Where did you go? When did you arrive?',
        '¿Qué compraste? ¿Adónde fuiste? ¿Cuándo llegaste?',
      ),
      pair(
        'Happen, happened. What happened last weekend? Who took the photo?',
        'Ocurrir, ocurrió. ¿Qué pasó el fin de semana pasado? ¿Quién sacó la foto?',
      ),
      pair(
        'She went to the market. Did she go to the market? Was she at the market?',
        'Ella fue al mercado. ¿Ella fue al mercado? ¿Ella estaba en el mercado?',
      ),
      pair('Leave, left. They left at noon.', 'Salir, salieron. Salieron al mediodía.'),
    ],
    g.ask,
    p.ask,
    p.negative,
    p.wh,
    p.subject,
  ),
  museum: teach(
    'ask',
    'museum',
    'Diego',
    'Palabras para el diario del museo',
    'Entrance es la entrada. Shop es una tienda. Observa las horas de la tarde y escucha el vocabulario que usarás para leer las notas del museo.',
    museumWords,
    [
      pair(
        'The museum. The entrance. The shop. The airport.',
        'El museo. La entrada. La tienda. El aeropuerto.',
      ),
      pair(
        'At two p.m. At three p.m. At four p.m.',
        'A las dos de la tarde. A las tres de la tarde. A las cuatro de la tarde.',
      ),
      pair(
        'In the museum. At the entrance. At the shop.',
        'Dentro del museo. En la entrada. En la tienda.',
      ),
    ],
    g.ask,
    p.wh,
  ),
};
