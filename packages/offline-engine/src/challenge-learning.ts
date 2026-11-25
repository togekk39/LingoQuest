import { canonicalStringify, sha256Hex } from '@lingoquest/course-pack';
import { attemptSchema, normalizeAnswerText } from '@lingoquest/contracts';
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
  formalDefinitions,
  formalTeachingKeys,
  teachingReferenceKey,
  type TeachingReference,
} from './learning-prerequisites';
import { canonicalLearningId, exerciseEvidenceTargets } from './learning-registry';
import type { LearningEvidence, UnifiedEvidenceTarget } from './learning-evidence';

type ChallengeScope = 'course' | 'home';
export type ChallengeType = keyof CourseData['challengePools'];
type Review = { digest: string; requires: readonly (string | readonly [string, string])[] };
type Definitions = ReturnType<typeof formalDefinitions>;
type Proof = {
  context: 'reading' | 'production' | 'recognition';
  targets: ReadonlySet<string>;
};

const authoredReviews: Record<ChallengeScope, Readonly<Record<string, Review>>> = {
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
): TeachingReference[] | undefined {
  const registry = authoredReviews[scope];
  const review = Object.hasOwn(registry, exercise.id) ? registry[exercise.id] : undefined;
  if (!review || review.digest !== sha256Hex(canonicalStringify(exercise))) return;
  const definitions = 'lessons' in content ? formalDefinitions(content) : content;
  const references: TeachingReference[] = [];
  for (const requirement of review.requires) {
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

function savedTextAnswer(state: OfflineState, event: LearningEvidence) {
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
    return parsed.data.answer.text?.trim();
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

function normalPracticeProof(state: OfflineState, content: CourseData, definitions: Definitions) {
  const lessons = { ...content.lessons, [travelLesson.id]: travelLesson };
  const items = new Map(
    Object.values(lessons).flatMap((lesson) =>
      lesson.exercises.map(
        (exercise) => [`${lesson.id}:${exercise.id}`, { lesson, exercise }] as const,
      ),
    ),
  );
  return state.unifiedLearning.evidence.flatMap((event): Proof[] => {
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
    const { lesson, exercise } = item;
    const text = productionFormats.has(event.format) ? savedTextAnswer(state, event) : undefined;
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
      ...(lesson.id === travelLesson.id && context === 'production' && text
        ? producedHomeLexicalTargets(event.exerciseId, text, definitions)
        : []),
    ]);
    return [{ context, targets }];
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

export function challengeLearningGate(state: OfflineState, content: CourseData) {
  const definitions = formalDefinitions(content);
  const introduced = formalTeachingKeys(state.unifiedLearning);
  const proofs = normalPracticeProof(state, content, definitions);
  const reviewed = new Map<CourseExercise, TeachingReference[] | undefined>();
  return (scope: ChallengeScope, type: ChallengeType, items: readonly CourseExercise[]) => {
    const missingTeaching: string[] = [];
    const missingPractice: string[] = [];
    for (const exercise of items) {
      if (!reviewed.has(exercise))
        reviewed.set(exercise, reviewedChallengeRequirements(exercise, scope, definitions));
      const requirements = reviewed.get(exercise);
      if (
        !requirements?.length ||
        requirements.some((ref) => !introduced.has(teachingReferenceKey(ref)))
      ) {
        missingTeaching.push(exercise.id);
      } else if (!covered(proofs, exercise, requirements, definitions, content, scope, type)) {
        missingPractice.push(exercise.id);
      }
    }
    const taught = !!items.length && !missingTeaching.length;
    return { taught, ready: taught && !missingPractice.length, missingTeaching, missingPractice };
  };
}
