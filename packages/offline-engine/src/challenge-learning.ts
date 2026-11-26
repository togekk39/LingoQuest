import { canonicalStringify, sha256Hex } from '@lingoquest/course-pack';
import { attemptSchema, judgeAnswer, normalizeAnswerText } from '@lingoquest/contracts';
import {
  optionalCourseItems,
  optionalHomeItems,
} from '../../../content/source/prerequisites/optional-items';
import {
  homeExercises,
  homeReviewExercises,
} from '../../../content/source/prerequisites/published-travel';
import type { CourseData, CourseExercise, OfflineState } from './index';
import { travelLesson } from './home-content';
import {
  exactRpgReferences,
  formalDefinitions,
  formalTeachingKeys,
  reviewPrerequisites,
  teachingReferenceKey,
  type TeachingReference,
} from './learning-prerequisites';
import { canonicalLearningId, exerciseEvidenceTargets } from './learning-registry';
import type { LearningEvidence, UnifiedEvidenceTarget } from './learning-evidence';

type ChallengeScope = 'course' | 'home' | 'adventure';
export type ChallengeType = keyof CourseData['challengePools'];
type PracticeItem = {
  lessonId: string;
  exercise: CourseExercise;
  version?: string;
  requires?: readonly TeachingReference[];
  targets?: readonly UnifiedEvidenceTarget[];
};
type Review = { digest: string; requires: readonly (string | readonly [string, string])[] };
export type AdventureChallengeReview = { digest: string; requires: readonly TeachingReference[] };
type Definitions = ReturnType<typeof formalDefinitions>;
type Proof = {
  context: 'reading' | 'production' | 'recognition';
  targets: ReadonlySet<string>;
  event: LearningEvidence;
  item: PracticeItem;
  position: number;
};

const authoredReviews: Record<
  Exclude<ChallengeScope, 'adventure'>,
  Readonly<Record<string, Review>>
> = {
  course: optionalCourseItems,
  home: optionalHomeItems,
};
const homePractice: Readonly<Record<string, readonly TeachingReference[]>> = {
  ...homeExercises,
  ...homeReviewExercises,
};
const productionFormats = new Set<LearningEvidence['format']>([
  'short_text',
  'cloze',
  'correction',
]);
const productionDimensions = new Set<UnifiedEvidenceTarget['dimension']>([
  'writing',
  'grammar_production',
  'vocabulary_recall',
]);

export function reviewedChallengeRequirements(
  exercise: CourseExercise,
  scope: ChallengeScope,
  content: CourseData | Definitions,
  adventureReview?: AdventureChallengeReview,
): TeachingReference[] | undefined {
  const review =
    scope === 'adventure'
      ? adventureReview
      : Object.hasOwn(authoredReviews[scope], exercise.id)
        ? authoredReviews[scope][exercise.id]
        : undefined;
  if (!review || review.digest !== sha256Hex(canonicalStringify(exercise))) return;
  const definitions = 'lessons' in content ? formalDefinitions(content) : content;
  if (scope === 'adventure') {
    const references = adventureReview?.requires;
    if (!exactRpgReferences(references, definitions)) return;
    const kinds = new Set(references.map(({ id }) => definitions.get(id)?.kind));
    if (!kinds.has('lexical') || !kinds.has('pattern') || !kinds.has('grammar')) return;
    return [...references];
  }
  const references: TeachingReference[] = [];
  for (const requirement of authoredReviews[scope][exercise.id].requires) {
    const [id, requested] = typeof requirement === 'string' ? [requirement] : requirement;
    const definition = definitions.get(id);
    if (!definition) return;
    const form = requested ?? (definition.forms.length === 1 ? definition.forms[0] : undefined);
    if (
      definition.kind !== 'grammar' &&
      (!form ||
        !definition.forms.some(
          (registered) =>
            teachingReferenceKey({ id, form: registered }) === teachingReferenceKey({ id, form }),
        ))
    )
      return;
    references.push(form === undefined ? { id } : { id, form });
  }
  return references;
}

function proofContext(
  event: LearningEvidence,
  exercise: CourseExercise,
  text?: string,
): Proof['context'] | undefined {
  if (event.targets.some(({ dimension }) => dimension === 'reading') && exercise.passage)
    return 'reading';
  if (
    text &&
    !exercise.options?.length &&
    productionFormats.has(event.format) &&
    event.targets.some(
      ({ dimension }) =>
        productionDimensions.has(dimension) || dimension === 'grammar_understanding',
    )
  )
    return 'production';
  if (
    event.targets.some(
      ({ dimension }) =>
        dimension === 'grammar_understanding' || dimension === 'vocabulary_recognition',
    )
  )
    return 'recognition';
}

function observedWords(text: string) {
  return ` ${normalizeAnswerText(text)
    .replace(/[^\p{L}\p{M}'-]+/gu, ' ')
    .trim()} `;
}

function savedAnswer(state: OfflineState, event: LearningEvidence) {
  const saved = Object.hasOwn(state.attempts, event.id) ? state.attempts[event.id] : undefined;
  if (!saved) return;
  try {
    const parsed = attemptSchema.safeParse(JSON.parse(saved.fingerprint));
    if (
      !parsed.success ||
      parsed.data.lessonId !== event.materialId ||
      parsed.data.exerciseId !== event.exerciseId
    )
      return;
    return parsed.data.answer;
  } catch {
    return;
  }
}

function producedHomeLexicalTargets(exerciseId: string, text: string, definitions: Definitions) {
  const references = homePractice[exerciseId];
  const produced = observedWords(text);
  return (references ?? []).flatMap(({ id, form }) =>
    form && definitions.get(id)?.kind === 'lexical' && produced.includes(observedWords(form))
      ? [canonicalLearningId(id)]
      : [],
  );
}

function normalPracticeProof(
  state: OfflineState,
  content: CourseData,
  definitions: Definitions,
  chapterExercises: readonly PracticeItem[],
) {
  const lessons = { ...content.lessons, [travelLesson.id]: travelLesson };
  const practice = Object.values(lessons).flatMap(({ id: lessonId, exercises }) =>
    exercises.map((exercise) => ({ lessonId, exercise })),
  );
  const items = new Map(
    [...practice, ...chapterExercises].map((item) => [
      `${item.lessonId}:${item.exercise.id}`,
      item,
    ]),
  );
  return state.unifiedLearning.evidence.flatMap((event, position): Proof[] => {
    if (
      event.source === 'challenge' ||
      event.source === 'placement' ||
      event.activity !== 'answer' ||
      (event.languageOutcome ?? event.outcome) !== 'target' ||
      !event.independent ||
      event.retry ||
      event.aids.length
    )
      return [];
    const item = items.get(`${event.materialId}:${event.exerciseId}`);
    if (!item || item.exercise.ungradable || item.exercise.type !== event.format) return [];
    const { lessonId, exercise } = item;
    const text = productionFormats.has(event.format)
      ? savedAnswer(state, event)?.text?.trim()
      : undefined;
    const context = proofContext(event, exercise, text);
    if (!context) return [];
    const proofDimensions: ReadonlySet<UnifiedEvidenceTarget['dimension']> =
      context === 'reading'
        ? new Set(['reading'])
        : context === 'production'
          ? new Set([...productionDimensions, 'grammar_understanding'])
          : new Set(['grammar_understanding', 'vocabulary_recognition']);
    const targets = new Set([
      ...event.targets
        .filter(({ dimension }) => proofDimensions.has(dimension))
        .map(({ targetId }) => canonicalLearningId(targetId)),
      ...(lessonId === travelLesson.id && context === 'production' && text
        ? producedHomeLexicalTargets(event.exerciseId, text, definitions)
        : []),
    ]);
    return [{ context, targets, event, item, position }];
  });
}

function reviewedAdventurePractice(
  state: OfflineState,
  content: CourseData,
  definitions: Definitions,
  proofs: readonly Proof[],
) {
  const firstInstruction = new Map<string, { timestamp: number; position: number }>();
  for (const [position, event] of state.unifiedLearning.evidence.entries()) {
    if (event.activity !== 'introduced' || !event.teaches?.length) continue;
    for (const key of formalTeachingKeys({ evidence: [event], legacySchedules: [] })) {
      const previous = firstInstruction.get(key);
      if (!previous || event.timestamp < previous.timestamp)
        firstInstruction.set(key, { timestamp: event.timestamp, position });
    }
  }
  return proofs.flatMap((proof): Proof[] => {
    const { event, item, position, targets } = proof;
    const answer = savedAnswer(state, event);
    if (!answer || judgeAnswer(item.exercise, answer) !== 'target') return [];
    const lesson = content.lessons[item.lessonId];
    // Brazil 19 revises the postcard. Its reviewed exercises and prerequisites match Brazil 18.
    // Brasil 19 actualiza la postal. Sus ejercicios y requisitos revisados coinciden con Brasil 18.
    const sameSalvadorAssessment =
      item.version === 'brazil:19' && event.materialVersion === 'brazil:18';
    if (item.version && event.materialVersion !== item.version && !sameSalvadorAssessment)
      return [];
    const requires = item.version
      ? item.requires
      : lesson &&
        reviewPrerequisites(content, lesson, item.exercise, new Set(), definitions)?.missing;
    if (
      !requires?.length ||
      !requires.every((ref) => {
        const teaching = firstInstruction.get(teachingReferenceKey(ref));
        return (
          teaching &&
          (teaching.timestamp < event.timestamp ||
            (teaching.timestamp === event.timestamp && teaching.position < position))
        );
      })
    )
      return [];
    const authoredTargets = item.targets ?? exerciseEvidenceTargets(item.exercise, item.lessonId);
    const qualified = new Set(
      authoredTargets.flatMap(({ targetId, dimension }) => {
        const canonical = canonicalLearningId(targetId);
        return targets.has(canonical) &&
          event.targets.some(
            (target) => target.targetId === canonical && target.dimension === dimension,
          )
          ? [canonical]
          : [];
      }),
    );
    return qualified.size ? [{ ...proof, targets: qualified }] : [];
  });
}

const homeReadingTopics: Readonly<Record<string, readonly string[]>> = {
  home_challenge_readname: ['home.introduce', 'home.ownership'],
  home_challenge_readwhere: ['home.ask-location', 'pattern.u03_l04.directions'],
  home_challenge_readpark: ['home.adjacency', 'pattern.u03_l04.directions'],
  home_challenge_readbag: ['home.ownership'],
  home_challenge_readred: ['home.ownership'],
};

const familyRoutineReading = ['pattern.u01_l02.identity', 'pattern.u02_l01.habit'] as const;
const readingAlternatives: Readonly<Record<string, readonly string[]>> = {
  challenge_reading_family_1: familyRoutineReading,
  challenge_reading_family_2: familyRoutineReading,
  challenge_reading_family_3: familyRoutineReading,
  challenge_reading_family_4: familyRoutineReading,
};

function covered(
  proofs: readonly Proof[],
  exercise: CourseExercise,
  requirements: readonly TeachingReference[],
  definitions: Definitions,
  content: CourseData,
  scope: ChallengeScope,
  type: ChallengeType,
) {
  const production = !exercise.options?.length && productionFormats.has(exercise.type);
  const sameAbility = proofs.filter(({ context }) =>
    type === 'reading_quest'
      ? context === 'reading'
      : production
        ? context === 'production'
        : context !== 'reading',
  );
  if (scope === 'home') {
    const assessed =
      (type === 'reading_quest'
        ? homeReadingTopics[exercise.id]
        : exerciseEvidenceTargets(exercise, travelLesson.id).map(({ targetId }) => targetId)) ?? [];
    return sameAbility.some(({ targets }) => assessed.some((id) => targets.has(id)));
  }
  const patterns = requirements
    .filter(({ id }) => definitions.get(id)?.kind === 'pattern')
    .map(({ id }) => id);
  if (scope === 'adventure') {
    const targets = [exercise.skillId, ...patterns.map(canonicalLearningId)];
    return sameAbility.some((proof) => targets.some((id) => proof.targets.has(id)));
  }
  const related = patterns.filter(
    (id) => content.lessons[id.split('.')[1]]?.grammar?.skillId === exercise.skillId,
  );
  const namedPatterns = related.map(canonicalLearningId);
  if (type === 'reading_quest') {
    const applicable = namedPatterns.length ? namedPatterns : [exercise.skillId];
    if (sameAbility.some(({ targets }) => applicable.some((id) => targets.has(id)))) return true;
    const primaryHasReadingExercise = Object.values(content.lessons).some(
      (lesson) =>
        lesson.grammar?.skillId === exercise.skillId &&
        lesson.exercises.some((item) => item.passage && item.type !== 'cloze'),
    );
    const alternatives = readingAlternatives[exercise.id];
    return (
      !primaryHasReadingExercise &&
      (alternatives
        ? alternatives.every((id) => sameAbility.some(({ targets }) => targets.has(id)))
        : sameAbility.some(({ targets }) =>
            patterns.some((id) => targets.has(canonicalLearningId(id))),
          ))
    );
  }
  return sameAbility.some(
    ({ targets }) =>
      targets.has(exercise.skillId) &&
      (!namedPatterns.length || namedPatterns.some((id) => targets.has(id))),
  );
}

export function challengeLearningGate(
  state: OfflineState,
  content: CourseData,
  chapterExercises: readonly PracticeItem[] = [],
  definitions = formalDefinitions(content),
) {
  const introduced = formalTeachingKeys(state.unifiedLearning);
  const proofs = normalPracticeProof(state, content, definitions, chapterExercises);
  const reviewed = new Map<CourseExercise, TeachingReference[] | undefined>();
  let adventureProofs: Proof[] | undefined;
  return (
    scope: ChallengeScope,
    type: ChallengeType,
    items: readonly CourseExercise[],
    reviews?: Readonly<Record<string, AdventureChallengeReview>>,
  ) => {
    const missingTeaching: string[] = [];
    const missingPractice: string[] = [];
    for (const exercise of items) {
      if (!reviewed.has(exercise))
        reviewed.set(
          exercise,
          reviewedChallengeRequirements(
            exercise,
            scope,
            definitions,
            reviews && Object.hasOwn(reviews, exercise.id) ? reviews[exercise.id] : undefined,
          ),
        );
      const requirements = reviewed.get(exercise);
      if (
        !requirements?.length ||
        requirements.some((ref) => !introduced.has(teachingReferenceKey(ref)))
      ) {
        missingTeaching.push(exercise.id);
      } else if (
        !covered(
          scope === 'adventure'
            ? (adventureProofs ??= reviewedAdventurePractice(state, content, definitions, proofs))
            : proofs,
          exercise,
          requirements,
          definitions,
          content,
          scope,
          type,
        )
      ) {
        missingPractice.push(exercise.id);
      }
    }
    const taught = !!items.length && !missingTeaching.length;
    return { taught, ready: taught && !missingPractice.length, missingTeaching, missingPractice };
  };
}

export function selectAdventureChallengeVariation(
  items: CourseExercise[],
  candidates: readonly CourseExercise[],
  level: number,
  variation: number,
  eligible: (item: CourseExercise) => boolean,
) {
  if (!items.length) return items;
  const minimum = level <= 8 ? 1 : level;
  const allowed = candidates.filter(
    (item) => item.difficulty >= minimum && item.difficulty <= level && eligible(item),
  );
  return allowed.length ? [allowed[variation % allowed.length], ...items.slice(1)] : items;
}
