import type { LearningError } from '@lingoquest/contracts';
import type { RpgFormalDefinition } from '@lingoquest/course-pack';
import { chapter, travelLesson } from './home-content';
import type { CourseData, CourseExercise, CourseLesson, OfflineState } from './index';
import type { reviewPrerequisites } from './learning-prerequisites';
import {
  emptyUnifiedMastery,
  isRemediationFollowUp,
  rankUnifiedReviewCandidates,
  unifiedMasteryKey,
  unifiedReviewQueue,
  type UnifiedEvidenceTarget,
  type UnifiedMastery,
} from './learning-evidence';
import {
  buildLearningRegistry,
  canonicalLearningId,
  exerciseEvidenceContext,
  exerciseEvidenceTargets,
  homeSpeakingEvidenceTargets,
} from './learning-registry';
import { writtenLearningErrors, type LearningReviewReason } from './travel-learning';

const dimensionLabels: Record<UnifiedMastery['dimension'], string> = {
  vocabulary_recognition: 'Vocabulario',
  vocabulary_recall: 'Vocabulario',
  grammar_understanding: 'Gramática',
  grammar_production: 'Gramática',
  listening: 'Comprensión auditiva',
  reading: 'Lectura',
  writing: 'Escritura',
  speaking: 'Práctica oral',
};

export interface UnifiedReviewRow {
  key: string;
  targetId: string;
  dimension: UnifiedMastery['dimension'];
  targetLabelEs: string;
  skillLabelEs: string;
  state: UnifiedMastery['state'];
  retention: UnifiedMastery['retention'];
  transfer: UnifiedMastery['transfer'];
  nextReviewAt?: string;
  reason: LearningReviewReason;
  canPractice: boolean;
  independentSuccesses: number;
  assistedSuccesses: number;
}

export function exerciseCheckedErrors(exercise: CourseExercise): LearningError[] {
  if (exercise.learning)
    return [
      ...new Set([
        ...(exercise.learning.errors ?? []),
        ...(Object.keys(exercise.learning.errorAnswers ?? {}) as LearningError[]),
      ]),
    ];
  if (exercise.type === 'meaning' && exercise.vocabularyIds?.length === 1)
    return ['vocabulary_sense'];
  if (exercise.options) return [];
  return writtenLearningErrors(
    exercise.introduction
      ? [...exercise.acceptedAnswers, exercise.introduction.model]
      : exercise.acceptedAnswers,
  );
}

export function reviewCandidate(
  lesson: CourseLesson,
  exercise: CourseExercise,
  prerequisites: ReturnType<typeof reviewPrerequisites>,
  targets: readonly UnifiedEvidenceTarget[] = exerciseEvidenceTargets(exercise, lesson.id),
) {
  return {
    lesson,
    exercise,
    exerciseId: exercise.id,
    contextId: exerciseEvidenceContext(exercise, lesson.id),
    targets: targets.map(({ targetId, dimension }) => ({
      targetId: canonicalLearningId(targetId),
      dimension,
    })),
    guided: !!exercise.learning?.guided || exercise.type === 'reorder',
    errors: exerciseCheckedErrors(exercise),
    remediates: exercise.learning?.remediates,
    prerequisites,
  };
}

export type ReviewCandidate = ReturnType<typeof reviewCandidate>;

export function reviewReady(candidate: ReviewCandidate) {
  return candidate.prerequisites?.missing.length === 0;
}

export interface ReviewPlan {
  row: UnifiedReviewRow;
  mastery: UnifiedMastery;
  candidates: ReviewCandidate[];
}

export type RemediationStep =
  | { phase: 'support' | 'confirmation'; error: LearningError; candidate: ReviewCandidate }
  | { phase: 'waiting'; error: LearningError };

export function reviewTargetsForMission(missionId?: string | null) {
  return new Set(
    chapter.missions
      .find(({ id }) => id === missionId)
      ?.steps.flatMap((step) =>
        step.type === 'exercise'
          ? exerciseEvidenceTargets(step.exercise, travelLesson.id).map(({ targetId }) => targetId)
          : [],
      ),
  );
}

export function planRemediation(
  plan: ReviewPlan,
  recentExercises: ReadonlySet<string>,
  error?: LearningError,
): RemediationStep | undefined {
  const errors = error
    ? plan.mastery.pendingErrors.filter((item) => item === error)
    : plan.mastery.pendingErrors;
  let waiting: RemediationStep | undefined;
  for (const item of errors) {
    const support = plan.mastery.remediationSupport[item];
    if (!support) continue;
    const candidate = plan.candidates.find(
      (entry) =>
        reviewReady(entry) &&
        isRemediationFollowUp(entry, item, support) &&
        !recentExercises.has(entry.exerciseId),
    );
    if (candidate) return { phase: 'confirmation', error: item, candidate };
    waiting ??= { phase: 'waiting', error: item };
  }
  for (const item of errors) {
    if (plan.mastery.remediationSupport[item]) continue;
    const candidate =
      plan.candidates.find((entry) => entry.remediates?.includes(item)) ??
      plan.candidates.find((entry) => entry.errors.includes(item));
    if (candidate) return { phase: 'support', error: item, candidate };
  }
  return waiting;
}

export function unifiedReviewPlans(
  state: OfflineState,
  content: CourseData,
  candidates: ReviewCandidate[],
  now: number,
  missionId?: string | null,
  missionTargets = reviewTargetsForMission(missionId),
  definitions: readonly RpgFormalDefinition[] = [],
): ReviewPlan[] {
  const records = unifiedReviewQueue(state.unifiedLearning, now);
  const knownTargets = new Set(records.map(({ targetId }) => targetId));
  const registry = buildLearningRegistry(content, definitions);
  const available = candidates.filter(
    (candidate) => reviewReady(candidate) || candidate.prerequisites?.instruction,
  );
  const byKey = new Map(records.map((record) => [unifiedMasteryKey(record), record]));
  const speakingTargets = chapter.missions.flatMap(({ steps }) =>
    steps.flatMap((step) =>
      step.type === 'speak' && step.learning ? homeSpeakingEvidenceTargets(step.learning) : [],
    ),
  );
  const missing = [...available.flatMap(({ targets }) => targets), ...speakingTargets].filter(
    (target) => knownTargets.has(target.targetId) && !byKey.has(unifiedMasteryKey(target)),
  );
  for (const target of missing) {
    const key = unifiedMasteryKey(target);
    const taught = available.some(
      (candidate) =>
        reviewReady(candidate) &&
        candidate.targets.some((entry) => unifiedMasteryKey(entry) === key),
    );
    byKey.set(key, { ...emptyUnifiedMastery(target), ...(taught && { state: 'introduced' }) });
  }

  return [...byKey].flatMap(([key, mastery]) => {
    if (missionTargets.size && !missionTargets.has(mastery.targetId)) return [];
    if (missionId && !missionTargets.size) return [];
    const definition = registry.get(mastery.targetId);
    const ranked = rankUnifiedReviewCandidates(state.unifiedLearning, mastery, available, now);
    const alternatives = [
      ...ranked.filter(reviewReady),
      ...ranked.filter((candidate) => candidate.prerequisites?.instruction),
    ];
    const due =
      mastery.needsReview || (!!mastery.nextReviewAt && Date.parse(mastery.nextReviewAt) <= now);
    const reason = mastery.pendingErrors.length ? 'remediation' : due ? 'due' : 'practice';
    return [
      {
        row: {
          key,
          targetId: mastery.targetId,
          dimension: mastery.dimension,
          targetLabelEs: definition?.labelEs ?? alternatives[0]?.lesson.title ?? mastery.targetId,
          skillLabelEs: dimensionLabels[mastery.dimension],
          state: mastery.state,
          retention: mastery.retention,
          transfer: mastery.transfer,
          nextReviewAt: mastery.nextReviewAt,
          reason,
          canPractice: alternatives.length > 0,
          independentSuccesses: mastery.independentSuccesses,
          assistedSuccesses: mastery.assistedSuccesses,
        },
        mastery,
        candidates: alternatives,
      },
    ];
  });
}
