import { normalizeAnswerText, type Answer, type EvidenceDimension } from '@lingoquest/contracts';
import earlyTravel from '../../../content/source/prerequisites/early-travel.json';
import {
  chapterLexicalForms,
  chapterPatterns,
  homeLocalTeaching,
  homeTargets,
  homeTeaching,
  travelCards,
} from '../../../content/source/prerequisites/published-travel';
import { textbookPatterns } from '../../../content/source/prerequisites/textbook-patterns';
import { textbookReview } from '../../../content/source/prerequisites/textbook-review';
import type { CourseData, CourseExercise, CourseLesson } from './index';
import type { UnifiedEvidenceTarget, UnifiedLearningDimension } from './learning-evidence';
import type { LearningTarget } from './travel-learning';

type RegisteredKind = 'lexical' | 'pattern' | 'grammar' | 'speech';

export interface CanonicalLearningTarget {
  id: string;
  kind: RegisteredKind;
  labelEs: string;
  forms: readonly string[];
  aliases: readonly string[];
  prerequisiteIds: readonly string[];
}

const aliases: Readonly<Record<string, string>> = {
  'pattern.u01_l01.name': 'home.introduce',
  'pattern.u01_l03.singular': 'home.statement-be',
  'lex.u01_l01_v04': 'home.pronoun-i',
  'lex.u01_l01_v06': 'home.ownership-word',
  'lex.u03_l04_v01': 'home.park',
  'lex.u03_l04_v04': 'home.stop',
  'lex.u08_l02_v07': 'home.adjacency',
  'form.u08_l02.4': 'home.article-word',
  'form.u03_l04.4': 'home.ask-location',
  'published.home.card-1.grammar.introduction': 'home.introduce',
  'published.home.card-1.pattern.introduction': 'home.introduce',
  'published.home.card-1.word-1': 'home.greeting-word',
  'published.home.card-1.word-2': 'home.stop',
  'published.home.card-1.word-3': 'home.adjacency',
  'published.home.card-1.word-4': 'home.park',
  introduction: 'home.introduce',
  greeting: 'home.greeting-word',
  'place-question': 'home.ask-location',
  'place-location': 'home.adjacency',
  'item-ownership': 'home.ownership',
  'item-color': 'home.statement-be',
};

export function canonicalLearningId(id: string) {
  return Object.hasOwn(aliases, id) ? aliases[id] : id;
}

const registered = new Map<string, CanonicalLearningTarget>();
const greetingLexemes = { hello: 'lex.u01_l01_v01', hi: 'lex.u01_l01_v02' } as const;
for (const [word, id] of Object.entries(greetingLexemes)) {
  const meaning = word === 'hi' ? 'hola (informal)' : 'hola';
  registered.set(id, {
    id,
    kind: 'lexical',
    labelEs: `${word} · ${meaning}`,
    forms: [word],
    aliases: [],
    prerequisiteIds: [],
  });
}
for (const target of [...homeTargets, ...earlyTravel.targets]) {
  const labelEs = 'senseEs' in target ? target.senseEs : target.descriptionEs;
  registered.set(target.id, {
    id: target.id,
    kind: target.kind as RegisteredKind,
    labelEs: labelEs ?? target.id,
    forms: ('forms' in target && target.forms) || [],
    aliases: Object.keys(aliases).filter((id) => canonicalLearningId(id) === target.id),
    prerequisiteIds: [],
  });
}
for (const [lessonId, { patterns }] of Object.entries(textbookPatterns)) {
  for (const [name, form] of patterns) {
    const id = `pattern.${lessonId}.${name}`;
    if (registered.has(canonicalLearningId(id))) continue;
    registered.set(id, {
      id,
      kind: 'pattern',
      labelEs: form,
      forms: [form],
      aliases: [],
      prerequisiteIds: [],
    });
  }
}
for (const [chapterId, cards] of Object.entries(travelCards)) {
  for (const [index, card] of cards.entries()) {
    const prefix = `published.${chapterId}.card-${index + 1}`;
    const patterns = card.patterns ?? chapterPatterns[chapterId];
    const register = (
      id: string,
      kind: RegisteredKind,
      labelEs: string,
      forms: readonly string[],
    ) => {
      if (!registered.has(canonicalLearningId(id)))
        registered.set(id, { id, kind, labelEs, forms, aliases: [], prerequisiteIds: [] });
    };
    for (const [position, term] of card.vocabulary.entries()) {
      if (card.canonical?.[term]) continue;
      register(
        `${prefix}.word-${position + 1}`,
        'lexical',
        term,
        chapterLexicalForms[chapterId]?.[term] ?? [term],
      );
    }
    for (const { id, descriptionEs } of card.grammar) {
      if (card.canonical?.[id]) continue;
      register(`${prefix}.grammar.${id}`, 'grammar', descriptionEs, []);
      const forms = [
        ...new Set([...(patterns?.question[id] ?? []), ...(patterns?.practice[id] ?? [])]),
      ];
      if (forms.length) register(`${prefix}.pattern.${id}`, 'pattern', descriptionEs, forms);
    }
  }
}

export function describeLearningTarget(targetId: string) {
  return registered.get(canonicalLearningId(targetId));
}

export function buildLearningRegistry(content?: Pick<CourseData, 'lessons' | 'speechDrills'>) {
  const index = new Map(registered);
  const register = (
    id: string,
    kind: RegisteredKind,
    labelEs: string,
    forms: string[],
    prerequisiteIds: string[] = [],
  ) => {
    const canonical = canonicalLearningId(id);
    if (index.has(canonical)) return;
    index.set(canonical, { id: canonical, kind, labelEs, forms, aliases: [], prerequisiteIds });
  };
  for (const lesson of Object.values(content?.lessons ?? {})) {
    for (const word of lesson.vocabulary ?? [])
      register(`lex.${word.id}`, 'lexical', `${word.en} · ${word.es}`, [word.en]);
    if (!lesson.grammar) continue;
    register(
      lesson.grammar.skillId,
      'grammar',
      lesson.title,
      [],
      lesson.grammar.prerequisiteSkillIds,
    );
    for (const [index, form] of (lesson.grammar.taughtForms ?? []).entries())
      register(`form.${lesson.id}.${index + 1}`, 'lexical', `${form.en} · ${form.es}`, [form.en]);
  }
  for (const drill of content?.speechDrills ?? []) {
    if (typeof drill !== 'object' || !drill || !('category' in drill) || !('titleEs' in drill))
      continue;
    if (typeof drill.category === 'string' && typeof drill.titleEs === 'string')
      register(`speech.${drill.category}`, 'speech', drill.titleEs, []);
  }
  return index;
}

function target(targetId: string, dimension: UnifiedLearningDimension): UnifiedEvidenceTarget {
  return { targetId: canonicalLearningId(targetId), dimension };
}

function vocabularyTarget(vocabularyId: string) {
  return vocabularyId.startsWith('lex.') ? vocabularyId : `lex.${vocabularyId}`;
}

function vocabularyEvidenceTargets(vocabularyId: string, dimension: UnifiedLearningDimension) {
  const id = vocabularyTarget(vocabularyId);
  const primary = target(id, dimension);
  return id === greetingLexemes.hi || id === greetingLexemes.hello
    ? [primary, target('home.greeting-word', dimension)]
    : [primary];
}

function distinct(targets: UnifiedEvidenceTarget[]) {
  return [
    ...new Map(
      targets.map((target) => [`${target.dimension}:${target.targetId}`, target]),
    ).values(),
  ];
}

export function legacyEvidenceTarget(targetId: string, dimension: EvidenceDimension) {
  const known = describeLearningTarget(targetId);
  return target(
    dimension.startsWith('vocabulary_') && !known ? vocabularyTarget(targetId) : targetId,
    dimension,
  );
}

export function homeLearningEvidenceTargets(
  learning: Pick<LearningTarget, 'conceptId' | 'skill'> & Partial<Pick<LearningTarget, 'evidence'>>,
) {
  const produces = learning.evidence === 'production' || learning.evidence === 'transfer';
  const dimension =
    learning.skill === 'grammar'
      ? produces
        ? 'grammar_production'
        : 'grammar_understanding'
      : learning.skill === 'vocabulary'
        ? learning.evidence === 'recall' || produces
          ? 'vocabulary_recall'
          : 'vocabulary_recognition'
        : learning.skill;
  return [target(learning.conceptId, dimension)];
}

export function homeSpeakingEvidenceTargets(learning: Pick<LearningTarget, 'conceptId'>) {
  return homeLearningEvidenceTargets({ ...learning, skill: 'speaking' });
}

const homeAuditoryExercises: Readonly<Record<string, string>> = {
  travel_hello_recognize: 'home.greeting-word',
  travel_bus_listen: 'home.ask-location',
  travel_bus_dictation: 'home.adjacency',
  travel_review_place_question_audio: 'home.ask-location',
  travel_review_place_location_audio: 'home.adjacency',
  route_bus_listen: 'home.ask-location',
};

const homeOptionalTargets: Readonly<Record<string, UnifiedEvidenceTarget>> = {
  home_challenge_name: target('home.introduce', 'grammar_production'),
  home_challenge_introduce: target('home.introduce', 'grammar_production'),
  home_challenge_directions: target('home.adjacency', 'vocabulary_recall'),
  home_challenge_color: target('home.statement-be', 'grammar_production'),
  home_challenge_where: target('home.ask-location', 'grammar_production'),
  home_challenge_plaza: target('home.stop', 'vocabulary_recall'),
  home_challenge_park: target('home.park', 'vocabulary_recall'),
  home_challenge_blue: target('home.blue', 'vocabulary_recall'),
  home_challenge_red: target('home.red', 'vocabulary_recall'),
  home_challenge_readname: target('home.introduce', 'reading'),
  home_challenge_readwhere: target('home.ask-location', 'reading'),
  home_challenge_readpark: target('home.adjacency', 'reading'),
  home_challenge_readbag: target('home.ownership', 'reading'),
  home_challenge_readred: target('home.ownership', 'reading'),
  route_intro_read: target('home.introduce', 'reading'),
  route_intro_write: target('home.introduce', 'writing'),
  route_bus_order: target('home.adjacency', 'grammar_understanding'),
  route_bag_read: target('home.ownership', 'reading'),
  route_bag_write: target('home.statement-be', 'writing'),
};

type EvidenceExercise = Pick<
  CourseExercise,
  'id' | 'type' | 'skillId' | 'dimension' | 'vocabularyIds' | 'passage' | 'learning'
>;

export function exerciseEvidenceTargets(
  exercise: EvidenceExercise,
  lessonId: string,
  answer?: Answer,
): UnifiedEvidenceTarget[] {
  const { id, type, skillId, learning, passage, vocabularyIds = [] } = exercise;
  if (id === 'travel_hello_recognize')
    return vocabularyEvidenceTargets(greetingLexemes.hi, 'listening');
  if (Object.hasOwn(homeAuditoryExercises, id))
    return [target(homeAuditoryExercises[id], 'listening')];
  if (Object.hasOwn(homeOptionalTargets, id)) return [homeOptionalTargets[id]];
  if (id === 'home_challenge_message') return [target('home.bag', 'vocabulary_recall')];
  if (learning) {
    if (id === 'travel_quick_hello')
      return vocabularyEvidenceTargets(greetingLexemes.hi, 'vocabulary_recognition');
    if ((id === 'travel_hello_recall' || id === 'travel_review_greeting') && answer?.text) {
      const word = normalizeAnswerText(answer.text).replace(/ there$/, '');
      if (word === 'hi' || word === 'hello')
        return vocabularyEvidenceTargets(greetingLexemes[word], 'vocabulary_recall');
    }
    if (learning.skill === 'grammar' && exercise.dimension === 'grammar_production')
      return [target(learning.conceptId, 'grammar_production')];
    return homeLearningEvidenceTargets(learning);
  }
  if (id === 'u01_l01_practice_4') return [target('home.introduce', 'writing')];
  const practiced = textbookReview[lessonId]?.practice[id];
  if (exercise.dimension?.startsWith('vocabulary_')) {
    return distinct(
      vocabularyIds.flatMap((wordId) => vocabularyEvidenceTargets(wordId, exercise.dimension!)),
    );
  }
  const patterns = (practiced?.patterns ?? []).map((name) => `pattern.${lessonId}.${name}`);
  if (passage && type !== 'cloze') {
    return distinct((patterns.length ? patterns : [skillId]).map((id) => target(id, 'reading')));
  }
  const dimension = exercise.dimension ?? 'grammar_understanding';
  const targets = [target(skillId, dimension)];
  for (const id of patterns)
    targets.push(target(id, dimension === 'grammar_production' ? 'writing' : dimension));
  return distinct(targets);
}

export function exerciseEvidenceContext(
  exercise: Pick<CourseExercise, 'id' | 'learning'>,
  lessonId: string,
) {
  return exercise.learning?.contextId ?? lessonId;
}

function introducedTargets(ids: string[]) {
  return distinct(
    ids.flatMap((id) => {
      const kind = describeLearningTarget(id)?.kind;
      if (kind === 'lexical') return [target(id, 'vocabulary_recognition')];
      if (kind === 'pattern') return [target(id, 'grammar_understanding'), target(id, 'writing')];
      return [target(id, 'grammar_understanding')];
    }),
  );
}

const homeDialogueTeaching: Readonly<Record<string, { id: string }[]>> = {
  'sam-introduction': homeTeaching.hello_teach.teaches,
  'sam-asks-name': homeTeaching.hello_teach.teaches,
  'luz-introduction-practice': homeLocalTeaching.luz.teaches,
  'luz-introduction-practice-feedback': homeLocalTeaching.luz.teaches,
  'luz-introduction-practice-retry': homeLocalTeaching.luz.teaches,
  travel_quick_hello: homeLocalTeaching.starter.teaches,
};

export function homeTeachingEvidenceTargets(stepId: string, word?: string) {
  if (stepId === 'travel_hello_recognize')
    return vocabularyEvidenceTargets(greetingLexemes.hi, 'listening');
  if (Object.hasOwn(homeAuditoryExercises, stepId))
    return [target(homeAuditoryExercises[stepId], 'listening')];
  if (Object.hasOwn(homeDialogueTeaching, stepId))
    return introducedTargets(homeDialogueTeaching[stepId].map(({ id }) => id));
  if (!Object.hasOwn(homeTeaching, stepId)) return [];
  const { teaches } = homeTeaching[stepId as keyof typeof homeTeaching];
  const normalize = (value: string) => value.normalize('NFC').toLowerCase().replace(/[’‘]/g, "'");
  const shown = teaches.filter(
    ({ form }) => !word || (form && normalize(form) === normalize(word)),
  );
  return introducedTargets(
    shown.flatMap(({ id, form }) => {
      const greeting = form && normalize(form);
      return id === 'home.greeting-word' && (greeting === 'hi' || greeting === 'hello')
        ? [id, greetingLexemes[greeting]]
        : [id];
    }),
  );
}

export function homeChoiceEvidenceTargets(choiceId: string) {
  if (choiceId === 'greet-sam-in-english' || choiceId === 'greet-luz-in-english')
    return [target('home.greeting', 'grammar_understanding')];
  if (choiceId === 'luz-practice-am' || choiceId === 'luz-practice-is')
    return [target('home.introduce', 'grammar_understanding')];
  return [];
}

export function lessonEvidenceTargets(
  lesson: Pick<CourseLesson, 'id' | 'grammar' | 'vocabulary'>,
  stage: 'vocabulary' | 'grammar',
) {
  if (stage === 'vocabulary')
    return distinct(
      (lesson.vocabulary ?? []).flatMap(({ id }) =>
        vocabularyEvidenceTargets(id, 'vocabulary_recognition'),
      ),
    );
  if (!lesson.grammar) return [];
  const patterns = textbookPatterns[lesson.id]?.patterns ?? [];
  return introducedTargets([
    lesson.grammar.skillId,
    ...patterns.map(([id]) => `pattern.${lesson.id}.${id}`),
  ]);
}

export function chapterCardEvidenceTargets(
  chapterId: string,
  cardNumber: number,
  stage: 'vocabulary' | 'grammar' | 'question' | 'practice',
  word?: string,
) {
  const source = Object.hasOwn(travelCards, chapterId)
    ? travelCards[chapterId][cardNumber - 1]
    : undefined;
  if (!source) return [];
  const prefix = `published.${chapterId}.card-${cardNumber}`;
  const ids = new Map<string, string[]>();
  for (const [index, term] of source.vocabulary.entries())
    ids.set(term, [
      source.canonical?.[term] ?? `${prefix}.word-${index + 1}`,
      ...(chapterId === 'home' && term === 'Hi' ? [greetingLexemes.hi] : []),
    ]);
  for (const { id } of source.grammar) {
    const canonical = source.canonical?.[id];
    if (canonical) {
      ids.set(id, [canonical]);
      continue;
    }
    const pattern = `${prefix}.pattern.${id}`;
    if (chapterId === 'home' && id === 'location') {
      ids.set(id, ['home.ask-location', 'home.adjacency']);
      continue;
    }
    ids.set(id, [`${prefix}.grammar.${id}`, ...(describeLearningTarget(pattern) ? [pattern] : [])]);
  }
  if (stage === 'vocabulary') {
    const terms = word ? source.vocabulary.filter((term) => term === word) : source.vocabulary;
    return distinct(
      terms.flatMap((term) =>
        (ids.get(term) ?? []).map((id) => target(id, 'vocabulary_recognition')),
      ),
    );
  }
  if (stage === 'grammar')
    return introducedTargets(source.grammar.flatMap(({ id }) => ids.get(id) ?? []));
  const dimension = stage === 'question' ? 'reading' : 'writing';
  return distinct(
    source[stage].flatMap((name) => (ids.get(name) ?? []).map((id) => target(id, dimension))),
  );
}
