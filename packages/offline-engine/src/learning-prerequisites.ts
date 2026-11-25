import type { Translation } from '@lingoquest/contracts';
import { canonicalStringify, sha256Hex, type RpgFormalDefinition } from '@lingoquest/course-pack';
import {
  homeExercises,
  homeReviewExercises,
  homeTargets,
  homeTeaching,
} from '../../../content/source/prerequisites/published-travel';
import {
  formalTargetReference,
  textbookExerciseDependencies,
  textbookExerciseDigest,
  textbookFormalTargets,
  textbookTeachingDigest,
} from '../../../content/source/prerequisites/textbook-dependencies';
import { textbookPatterns } from '../../../content/source/prerequisites/textbook-patterns';
import { textbookReview } from '../../../content/source/prerequisites/textbook-review';
import {
  reviewedHomeReview,
  reviewedHomeSteps,
} from '../../../content/source/prerequisites/published-travel-review';
import { referenceKey, type PrerequisiteReference } from '../../course-pack/src/prerequisites';
import type { CourseData, CourseExercise, CourseLesson } from './index';
import {
  recordUnifiedEvidence,
  type LearningEvidence,
  type UnifiedEvidenceTarget,
  type UnifiedLearningState,
} from './learning-evidence';
import { canonicalLearningId, exerciseEvidenceTargets } from './learning-registry';
import type { TravelExerciseStep, TravelStep, TravelVocabulary } from './travel-content';

export type TeachingReference = PrerequisiteReference;
export type ReviewInstruction = {
  sections: { title: string; examples: Translation[] }[];
  teaches: TeachingReference[];
};
export type FormalDefinition = RpgFormalDefinition;

export function rpgTeachingDigest(
  step: Extract<TravelStep, { type: 'teach' }>,
  visibleWords: readonly TravelVocabulary[],
) {
  return sha256Hex(canonicalStringify({ step, vocabulary: visibleWords }));
}

export function rpgAssessmentDigest(step: TravelExerciseStep) {
  return sha256Hex(canonicalStringify(step));
}

const normalizeForm = (form: string) =>
  form.normalize('NFC').replace(/[’‘]/g, "'").trim().toLowerCase();

const textbookHomeEquivalences: Readonly<Record<string, TeachingReference>> = {
  'form.u01_l01.3': { id: 'home.introduce', form: "I'm" },
  'form.u01_l01.5': { id: 'home.introduce', form: 'My name is' },
  'pattern.u01_l01.first': { id: 'home.introduce', form: 'I am' },
};

export function teachingReferenceKey(reference: TeachingReference) {
  const form = reference.form === undefined ? undefined : normalizeForm(reference.form);
  const id =
    reference.id === 'lex.u01_l01_v01' || reference.id === 'lex.u01_l01_v02'
      ? 'home.greeting-word'
      : canonicalLearningId(reference.id);
  return referenceKey({ id, form });
}

export function homeFormalReferences(itemId: string, word?: string): TeachingReference[] {
  if (!Object.hasOwn(homeTeaching, itemId)) return [];
  const { teaches } = homeTeaching[itemId as keyof typeof homeTeaching];
  return teaches.filter(
    ({ form }) =>
      word === undefined || (form !== undefined && normalizeForm(form) === normalizeForm(word)),
  );
}

export function reviewedHomeInstruction(step: TravelStep | undefined, word?: string) {
  return step?.type === 'teach' &&
    reviewedHomeSteps[step.id] === sha256Hex(canonicalStringify(step))
    ? homeFormalReferences(step.id, word)
    : [];
}

export function reviewedHomeRequirements(step: TravelExerciseStep, forReview = false) {
  const key = forReview ? step.exercise.id : step.id;
  const digests = forReview ? reviewedHomeReview : reviewedHomeSteps;
  const dependencies: Readonly<Record<string, readonly TeachingReference[]>> = forReview
    ? homeReviewExercises
    : homeExercises;
  if (digests[key] !== rpgAssessmentDigest(step) || !Object.hasOwn(dependencies, key)) return;
  return dependencies[key];
}

function legacyHomeLesson(event: LearningEvidence) {
  return event.materialId === 'travel_home' &&
    (event.source === 'story' || event.source === 'study') &&
    event.id.startsWith('home:') &&
    !event.id.includes(':word:') &&
    event.materialVersion === 'home:7' &&
    ['hello', 'bus', 'bag'].includes(event.contextId)
    ? homeFormalReferences(event.exerciseId)
    : [];
}

export function formalTeachingKeys(state: UnifiedLearningState): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const event of state.evidence) {
    if (
      event.activity !== 'introduced' ||
      event.format !== 'instruction' ||
      (event.source !== 'story' && event.source !== 'study' && event.source !== 'review')
    )
      continue;
    const chapterId = event.materialVersion.split(':')[0];
    if (chapterId !== 'home' && event.id.startsWith(`${chapterId}:`)) continue;
    for (const ref of event.teaches ?? legacyHomeLesson(event)) {
      keys.add(teachingReferenceKey(ref));
      const equivalent =
        Object.hasOwn(textbookHomeEquivalences, ref.id) && textbookHomeEquivalences[ref.id];
      if (equivalent) keys.add(teachingReferenceKey(equivalent));
    }
  }
  return keys;
}

function reviewedTeaching(lesson: CourseLesson) {
  return (
    !!lesson.grammar &&
    !!lesson.vocabulary &&
    textbookReview[lesson.id]?.teaching === textbookTeachingDigest(lesson)
  );
}

export function textbookFormalReferences(
  lesson: CourseLesson,
  stage: 'vocabulary' | 'grammar',
  wordId?: string,
): TeachingReference[] {
  const grammar = lesson.grammar;
  if (!grammar || !reviewedTeaching(lesson)) return [];
  const {
    vocabulary,
    forms,
    grammar: rule,
    patterns,
  } = textbookFormalTargets({ ...lesson, grammar });
  const taught =
    stage === 'grammar'
      ? [rule, ...forms, ...patterns]
      : vocabulary.filter(({ id }) => !wordId || id === `lex.${wordId}`);
  return taught.map(formalTargetReference);
}

export function formalDefinitions(
  content: Pick<CourseData, 'lessons'>,
  archived: readonly CourseLesson[] = [],
  authored: readonly RpgFormalDefinition[] = [],
) {
  const definitions = new Map<string, FormalDefinition>();
  for (const target of homeTargets) {
    const labelEs = target.kind === 'lexical' ? target.senseEs : target.descriptionEs;
    definitions.set(target.id, {
      ...target,
      labelEs,
      forms: 'forms' in target ? [...target.forms] : [],
      examples: [],
    });
  }
  for (const lesson of [...archived, ...Object.values(content.lessons)]) {
    const { grammar, vocabulary: words } = lesson;
    if (!grammar || !words || !reviewedTeaching(lesson)) continue;
    const {
      vocabulary,
      forms,
      grammar: rule,
      patterns,
    } = textbookFormalTargets({ ...lesson, grammar });
    for (const [index, word] of vocabulary.entries())
      definitions.set(word.id, {
        ...word,
        labelEs: word.senseEs,
        examples: [words[index].example],
      });
    for (const form of forms)
      definitions.set(form.id, { ...form, labelEs: form.senseEs, examples: [] });
    definitions.set(rule.id, {
      ...rule,
      labelEs: rule.descriptionEs,
      forms: [],
      examples: grammar.examples,
    });
    for (const [index, pattern] of patterns.entries()) {
      const en = textbookPatterns[lesson.id].patterns[index][2];
      const example =
        grammar.examples.find((entry) => entry.en === en) ??
        grammar.taughtForms?.find((entry) => entry.en === en);
      definitions.set(pattern.id, {
        ...pattern,
        labelEs: pattern.descriptionEs,
        examples: example ? [example] : [],
      });
    }
  }
  for (const target of authored)
    if (!definitions.has(target.id)) definitions.set(target.id, target);
  return definitions;
}

export function exactRpgReferences(
  refs: readonly TeachingReference[] | undefined,
  definitions: ReadonlyMap<string, FormalDefinition>,
): refs is readonly TeachingReference[] {
  if (!refs?.length) return false;
  if (new Set(refs.map(teachingReferenceKey)).size !== refs.length) return false;
  return refs.every(({ id, form }) => {
    const target = definitions.get(id) ?? definitions.get(canonicalLearningId(id));
    if (!target) return false;
    if (target.kind === 'grammar') return form === undefined;
    return (
      form !== undefined &&
      target.forms.some((entry) => normalizeForm(entry) === normalizeForm(form))
    );
  });
}

export function exactRpgAssessment(
  step: TravelExerciseStep,
  definitions: ReadonlyMap<string, FormalDefinition>,
) {
  if (!exactRpgReferences(step.requires, definitions) || !step.targets?.length) return false;
  const { exercise } = step;
  const writes =
    !exercise.options?.length && ['short_text', 'cloze', 'correction'].includes(exercise.type);
  const supportedReorder = exercise.type === 'reorder' && exercise.learning?.guided;
  const ids = new Set(step.requires.map(({ id }) => canonicalLearningId(id)));
  const seen = new Set<string>();
  return step.targets.every(({ targetId, dimension }) => {
    const target = canonicalLearningId(targetId);
    const key = `${dimension}:${target}`;
    if (!ids.has(target) || seen.has(key)) return false;
    if (dimension === 'listening' && !step.audio) return false;
    if (dimension === 'speaking') return false;
    if (dimension === 'reading' && !exercise.passage && !exercise.sentence) return false;
    if ((dimension === 'writing' || dimension === 'vocabulary_recall') && !writes) return false;
    if (dimension === 'grammar_production' && !writes && !supportedReorder) return false;
    seen.add(key);
    return true;
  });
}

export function rpgIntroductionTargets(
  teaches: readonly TeachingReference[],
  definitions: ReadonlyMap<string, FormalDefinition>,
): UnifiedEvidenceTarget[] {
  const targets = new Map<string, UnifiedEvidenceTarget>();
  for (const { id } of teaches) {
    const targetId = canonicalLearningId(id);
    const kind = (definitions.get(id) ?? definitions.get(targetId))?.kind;
    const dimension = kind === 'lexical' ? 'vocabulary_recognition' : 'grammar_understanding';
    targets.set(targetId, { targetId, dimension });
  }
  return [...targets.values()];
}

export function reviewPrerequisites(
  content: Pick<CourseData, 'lessons'>,
  lesson: CourseLesson,
  exercise: CourseExercise,
  taught: ReadonlySet<string>,
  definitions = formalDefinitions(content, [lesson]),
  authoredRequirements?: readonly TeachingReference[],
): { missing: TeachingReference[]; instruction?: ReviewInstruction } | undefined {
  let requires = authoredRequirements;
  if (!requires && lesson.id === 'travel_home') {
    if (Object.hasOwn(homeReviewExercises, exercise.id))
      requires = homeReviewExercises[exercise.id as keyof typeof homeReviewExercises];
    else if (Object.hasOwn(homeExercises, exercise.id))
      requires = homeExercises[exercise.id as keyof typeof homeExercises];
  } else if (
    !requires &&
    textbookReview[lesson.id]?.exercises[exercise.id] === textbookExerciseDigest(exercise)
  ) {
    const dependencies = textbookExerciseDependencies(lesson.id, exercise, (id) => {
      const definition = definitions.get(id);
      return { id, form: definition?.forms[0] };
    });
    if (dependencies)
      requires = [
        ...dependencies.vocabularyAndForms,
        ...dependencies.patterns,
        ...(dependencies.grammar ? [dependencies.grammar] : []),
      ];
  }
  if (!requires?.length) return undefined;

  const missing = requires.filter((ref) => !taught.has(teachingReferenceKey(ref)));
  if (!missing.length) return { missing };
  const sections = missing.flatMap((ref) => {
    const definition = definitions.get(ref.id) ?? definitions.get(canonicalLearningId(ref.id));
    if (
      !definition ||
      (definition.kind === 'grammar'
        ? ref.form !== undefined
        : !ref.form ||
          !definition.forms.some((form) => normalizeForm(form) === normalizeForm(ref.form!)))
    )
      return [];
    return [
      {
        title: ref.form ? `${ref.form} · ${definition.labelEs}` : definition.labelEs,
        examples: definition.examples,
      },
    ];
  });
  return {
    missing,
    instruction: sections.length === missing.length ? { sections, teaches: missing } : undefined,
  };
}

export function recordReviewInstruction(
  state: UnifiedLearningState,
  lesson: CourseLesson,
  exercise: CourseExercise,
  instruction: ReviewInstruction,
  now: number,
  id: string,
  version: string,
  authoredTargets?: readonly UnifiedEvidenceTarget[],
) {
  return recordUnifiedEvidence(state, {
    id: `review-teaching:${id}`,
    source: 'review',
    materialId: lesson.id,
    exerciseId: exercise.id,
    materialVersion: version,
    timestamp: now,
    contextId: lesson.id,
    format: 'instruction',
    activity: 'introduced',
    aids: ['guided'],
    retry: false,
    independent: false,
    targets: authoredTargets ? [...authoredTargets] : exerciseEvidenceTargets(exercise, lesson.id),
    teaches: instruction.teaches,
  });
}
