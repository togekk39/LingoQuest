import type { Translation } from '@lingoquest/contracts';
import type { PrerequisiteReference } from '../../packages/course-pack/src/prerequisites';
import { textbookPatterns } from './prerequisites/textbook-patterns';
import { numberLearningId, travelNumberWords } from './travel-number-words';

type Definition = {
  id: string;
  kind: 'lexical' | 'pattern' | 'grammar';
  labelEs: string;
  forms: string[];
  examples: Translation[];
};

export const form = (id: string, value: string): PrerequisiteReference => ({ id, form: value });
export const grammar = (id: string): PrerequisiteReference => ({ id });

export function studyPattern(lessonId: string, name: string): PrerequisiteReference {
  const pattern = textbookPatterns[lessonId].patterns.find(([entry]) => entry === name);
  if (!pattern) throw new Error(`Missing Study pattern ${lessonId}.${name}`);
  return form(`pattern.${lessonId}.${name}`, pattern[1]);
}

const vocabulary = {
  i: form('lex.u01_l01_v04', 'I'),
  you: form('lex.u01_l01_v05', 'you'),
  my: form('lex.u01_l01_v06', 'my'),
  am: form('form.u01_l01.1', 'am'),
  and: form('form.u01_l03.3', 'and'),
  your: form('form.u01_l04.5', 'your'),
  work: form('lex.u02_l01_v01', 'work'),
  study: form('lex.u02_l01_v02', 'study'),
  live: form('lex.u02_l01_v03', 'live'),
  walk: form('lex.u02_l01_v04', 'walk'),
  english: form('lex.u02_l01_v07', 'English'),
  everyDay: form('lex.u02_l01_v08', 'every day'),
  getUp: form('lex.u02_l04_v01', 'get up'),
  start: form('lex.u02_l04_v02', 'start'),
  breakfast: form('lex.u02_l04_v03', 'have breakfast'),
  atSix: form('lex.u02_l04_v05', 'at six'),
  atEight: form('lex.u02_l04_v06', 'at eight'),
  atNoon: form('lex.u02_l04_v08', 'at noon'),
  after: form('form.u02_l04.8', 'after'),
  brother: form('lex.u01_l02_v03', 'brother'),
  sister: form('lex.u01_l02_v04', 'sister'),
  cook: form('lex.u02_l02_v01', 'cook'),
  read: form('lex.u02_l02_v02', 'read'),
  atHome: form('lex.u02_l02_v05', 'at home'),
  works: form('form.u02_l02.1', 'works'),
  studies: form('form.u02_l02.2', 'studies'),
  cooks: form('form.u02_l02.6', 'cooks'),
  reads: form('form.u02_l02.7', 'reads'),
  she: form('form.u02_l02.12', 'she'),
  he: form('form.u02_l02.13', 'he'),
  usually: form('lex.u02_l03_v02', 'usually'),
  never: form('lex.u02_l03_v04', 'never'),
  inMorning: form('lex.u02_l03_v05', 'in the morning'),
  atNight: form('lex.u02_l03_v06', 'at night'),
  when: form('lex.u06_l02_v01', 'when'),
  meet: form('lex.u06_l02_v02', 'meet'),
  available: form('lex.u08_l04_v07', 'available'),
  go: form('lex.u04_l03_v01', 'go'),
  market: form('lex.u04_l03_v03', 'market'),
  yes: form('lex.u01_l04_v05', 'yes'),
  no: form('lex.u01_l04_v06', 'no'),
  at: form('form.u02_l04.1', 'at'),
  in: form('form.u02_l01.1', 'in'),
  the: form('form.u02_l03.1', 'the'),
  do: form('form.u03_l01.1', 'do'),
  does: form('form.u03_l01.2', 'does'),
  doNot: form('form.u03_l02.1', 'do not'),
  doesNot: form('form.u03_l02.2', 'does not'),
  dont: form('form.u03_l02.3', "don't"),
  doesnt: form('form.u03_l02.4', "doesn't"),
  can: form('form.u03_l03.1', 'can'),
  please: form('lex.u03_l03_v04', 'please'),
  to: form('form.u04_l03.5', 'to'),
  working: form('form.u05_l03.10', 'working'),
  we: form('form.u06_l01.2', 'we'),
  will: form('form.u06_l03.1', 'will'),
  this: form('form.u06_l04.4', 'this'),
  then: form('form.u08_l02.2', 'then'),
  watch: form('lex.u04_l04_v04', 'watch'),
};

const definitions: Definition[] = [];

function define(id: string, kind: Definition['kind'], en: string, es: string) {
  definitions.push({ id, kind, labelEs: es, forms: [en], examples: [{ en, es }] });
  return form(id, en);
}

const lexical = (id: string, en: string, es: string) => define(id, 'lexical', en, es);
const pattern = (id: string, en: string, es: string) => define(id, 'pattern', en, es);

export const mexicoRefs = {
  ...vocabulary,
  workActivity: lexical('lex.work.employment', 'work', 'trabajo o turno que va a empezar'),
  first: lexical('published.mexico.card-2.word-10', 'first', 'primero, al ordenar acciones'),
  afterBreakfast: lexical(
    'published.mexico.card-2.word-12',
    'after breakfast',
    'después de desayunar',
  ),
  morning: lexical('lex.time.morning', 'morning', 'mañana, la primera parte del día'),
  afternoon: lexical(
    'lex.time.afternoon',
    'afternoon',
    'tarde, la parte del día después del mediodía',
  ),
  inAfternoon: lexical('published.mexico.card-2.word-8', 'in the afternoon', 'por la tarde'),
  watches: lexical(
    'form.present.watch.third-person',
    'watches',
    've o mira en presente, con he o she',
  ),
  oclock: lexical('published.mexico.card-4.word-1', "o'clock", 'en punto'),
  halfPast: lexical('published.mexico.card-4.word-2', 'half past', 'y media'),
  friday: lexical('lex.weekday.friday', 'Friday', 'viernes'),
  onFriday: lexical('published.mexico.card-4.word-7', 'on Friday', 'el viernes'),
  saturday: lexical('lex.weekday.saturday', 'Saturday', 'sábado'),
  sunday: lexical('lex.weekday.sunday', 'Sunday', 'domingo'),
  saturdays: lexical('form.weekday.saturday.plural', 'Saturdays', 'sábados'),
  sundays: lexical('form.weekday.sunday.plural', 'Sundays', 'domingos'),
  noon: lexical('lex.time.noon', 'noon', 'mediodía'),
  amClock: lexical('lex.time.a-m', 'a.m.', 'antes del mediodía'),
  pm: lexical('lex.time.p-m', 'p.m.', 'después del mediodía'),
  openState: lexical('published.mexico.card-5.word-3', 'open', 'abierto al público'),
  closedState: lexical('published.mexico.card-5.word-4', 'closed', 'cerrado al público'),
  openAction: lexical(
    'published.mexico.card-4.word-9',
    'open',
    'abrir un establecimiento al público',
  ),
  closeAction: lexical(
    'published.mexico.card-4.word-10',
    'close',
    'cerrar un establecimiento al público',
  ),
  whatTime: lexical('published.mexico.card-5.word-2', 'what time', 'a qué hora'),
  or: lexical('lex.conjunction.or', 'or', 'o, para ofrecer una alternativa'),
  on: lexical('form.time.on-day', 'on', 'preposición que indica un día'),
  lets: lexical(
    'form.invite.lets',
    "let's",
    'introductor de una propuesta que incluye a quien habla',
  ),
  excuseMe: lexical(
    'lex.politeness.excuse-me',
    'excuse me',
    'disculpa o disculpe, para llamar la atención',
  ),
  library: lexical('lex.place.library', 'library', 'biblioteca'),
  studyRoom: lexical('lex.place.study-room', 'study room', 'sala de estudio'),
  onDay: pattern('pattern.time.on-day', 'on + día', 'usar on para indicar el día'),
  inPeriod: pattern(
    'pattern.time.in-period',
    'in + parte del día',
    'usar in para indicar la parte del día',
  ),
  hourMinutes: pattern(
    'pattern.time.hour-minutes',
    'hora + minutos',
    'decir la hora seguida de los minutos',
  ),
  zeroMinute: lexical('form.time.zero-minute', 'oh', 'cero en minutos de 01 a 09 al decir la hora'),
  thirtyMinute: pattern(
    'pattern.time.half-past',
    'half past + hora',
    'decir y media después de la hora indicada',
  ),
  wholeHour: pattern('pattern.time.o-clock', "hora + o'clock", 'decir una hora en punto'),
  timeQuestion: pattern(
    'pattern.time.question-do',
    'What time + do/does + sujeto + verbo base?',
    'preguntar a qué hora ocurre algo',
  ),
  meetProposal: pattern(
    'pattern.meeting.proposal',
    "Let's meet + horario o lugar",
    'proponer una cita con día, hora o lugar',
  ),
  appointment: pattern(
    'pattern.meeting.confirm',
    'sujeto + meet + lugar u horario',
    'confirmar dónde o cuándo será una cita',
  ),
};

const numberRefs = new Map<number, PrerequisiteReference>(
  travelNumberWords
    .filter(([number]) => number <= 50)
    .map(([number, en, es]) => [number, lexical(numberLearningId(number), en, es)]),
);

export function numberForms(...values: number[]): PrerequisiteReference[] {
  return values.map((number) => {
    const target = numberRefs.get(number);
    if (!target) throw new Error(`Missing pronunciation for ${number}`);
    return target;
  });
}

export const mexicoNumberRefs = [...numberRefs.values()];
export const mexicoLearningDefinitions: readonly Definition[] = definitions;

export const mexicoStudyPatterns = {
  routine: studyPattern('u02_l01', 'habit'),
  others: studyPattern('u02_l02', 'habit'),
  frequency: studyPattern('u02_l03', 'frequency'),
  frontFrequency: studyPattern('u02_l03', 'front'),
  clock: studyPattern('u02_l04', 'clock'),
  question: studyPattern('u03_l01', 'question'),
  negative: studyPattern('u03_l02', 'negative'),
};

const w = mexicoRefs;
const p = mexicoStudyPatterns;
export const mexicoAssessmentReferences: Readonly<
  Record<string, readonly PrerequisiteReference[]>
> = {
  'mexico-routine-audio': [
    p.routine,
    w.i,
    w.first,
    w.getUp,
    w.then,
    w.breakfast,
    w.afterBreakfast,
    w.work,
  ],
  'mexico-routine-planner': [
    p.routine,
    w.i,
    w.and,
    w.morning,
    w.afternoon,
    w.breakfast,
    w.work,
    w.study,
    w.english,
  ],
  'mexico-routine-write': [p.routine, w.i, w.study, w.english, w.everyDay],
  'mexico-routine-self-check': [p.routine, w.i, w.first, w.then, w.after],
  'mexico-others-audio': [
    p.frequency,
    w.my,
    w.sister,
    w.brother,
    w.usually,
    w.never,
    w.reads,
    w.inMorning,
  ],
  'mexico-others-read': [
    p.frequency,
    w.he,
    w.she,
    w.reads,
    w.english,
    w.usually,
    w.never,
    w.cooks,
    w.inMorning,
    w.atNight,
    w.studies,
  ],
  'mexico-others-write': [p.others, w.she, w.sister, w.cooks, w.atHome],
  'mexico-time-audio': [
    w.hourMinutes,
    w.we,
    w.can,
    w.meet,
    w.at,
    w.or,
    ...numberForms(8, 9, 13, 15, 30, 50),
  ],
  'mexico-time-read': [
    w.market,
    w.friday,
    w.saturday,
    w.sunday,
    w.openState,
    w.closedState,
    w.amClock,
    w.noon,
    ...numberForms(7, 8, 10, 12),
  ],
  'mexico-time-write': [
    p.clock,
    w.onDay,
    w.saturday,
    w.meet,
    w.wholeHour,
    w.we,
    w.on,
    w.at,
    w.oclock,
    w.amClock,
    w.will,
    w.lets,
    ...numberForms(8),
  ],
  'mexico-agreement-build': [p.question, p.clock, w.does, w.openAction, w.market, w.atEight, w.the],
  'mexico-agreement-listen': [
    p.question,
    p.clock,
    w.do,
    w.no,
    w.work,
    w.available,
    w.atEight,
    w.i,
    w.you,
    w.am,
    ...numberForms(10),
  ],
  'mexico-agreement-read': [
    p.question,
    w.timeQuestion,
    w.does,
    w.whatTime,
    w.brother,
    w.work,
    w.works,
    w.atNoon,
    w.your,
    w.he,
  ],
  'mexico-agreement-question': [
    p.question,
    w.timeQuestion,
    w.does,
    w.whatTime,
    w.when,
    w.sister,
    w.start,
    w.workActivity,
    w.your,
    w.working,
    w.please,
    w.excuseMe,
  ],
  'mexico-agreement-confirm': [
    p.negative,
    p.clock,
    w.doesNot,
    w.doesnt,
    w.she,
    w.go,
    w.meet,
    w.atEight,
    w.we,
    w.to,
    w.the,
    w.market,
    w.and,
    w.oclock,
    w.amClock,
    w.will,
    w.lets,
    ...numberForms(10),
  ],
  'mexico-transfer-read': [
    w.studyRoom,
    w.library,
    w.friday,
    w.saturday,
    w.openState,
    w.closedState,
    w.pm,
    ...numberForms(3, 4, 30),
  ],
  'mexico-transfer-ask': [
    p.question,
    w.does,
    w.sister,
    w.work,
    w.onDay,
    w.friday,
    w.your,
    w.on,
    w.this,
    w.please,
    w.excuseMe,
  ],
  'mexico-transfer-write': [
    p.clock,
    w.onDay,
    w.friday,
    w.library,
    w.meet,
    w.thirtyMinute,
    w.we,
    w.at,
    w.in,
    w.the,
    w.on,
    w.halfPast,
    w.will,
    w.lets,
    w.pm,
    ...numberForms(3, 30),
  ],
  'mexico-review-routine': [p.routine, w.we, w.study, w.english, w.everyDay],
  'mexico-review-others-guide': [p.others, w.she, w.cooks, w.inMorning],
  'mexico-review-others': [p.others, w.he, w.reads, w.atHome],
  'mexico-review-time-guide': [p.clock, w.meet, w.onDay, w.friday, w.atEight, w.we, w.on],
  'mexico-review-time': [
    p.clock,
    w.meet,
    w.onDay,
    w.saturday,
    w.thirtyMinute,
    w.we,
    w.on,
    w.at,
    w.halfPast,
    ...numberForms(10, 30),
  ],
  'mexico-review-ask-guide': [p.question, w.does, w.she, w.study, w.atHome],
  'mexico-review-ask': [p.question, w.does, w.brother, w.work, w.onDay, w.saturdays, w.on, w.your],
  'mexico-review-negative': [p.negative, w.doNot, w.dont, w.work, w.onDay, w.sundays, w.on, w.i],
};
