import { chapter, travelLesson } from './home-content';
import type { CourseData, CourseExercise, CourseLesson, OfflineState } from './index';
import {
  rankUnifiedReviewCandidates,
  unifiedMasteryKey,
  unifiedReviewQueue,
  type UnifiedMastery,
} from './learning-evidence';
import {
  buildLearningRegistry,
  exerciseEvidenceContext,
  exerciseEvidenceTargets,
  homeLearningEvidenceTargets,
  homeSpeakingEvidenceTargets,
} from './learning-registry';
import { travelConcepts, type TravelConceptId } from './travel-curriculum';
import type { LearningReviewReason } from './travel-learning';

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
  nextReviewAt?: string;
  reason: LearningReviewReason;
  canPractice: boolean;
  independentSuccesses: number;
  assistedSuccesses: number;
}

export function reviewCandidate(lesson: CourseLesson, exercise: CourseExercise) {
  return {
    lesson,
    exercise,
    exerciseId: exercise.id,
    contextId: exerciseEvidenceContext(exercise, lesson.id),
    targets: exerciseEvidenceTargets(exercise, lesson.id),
    guided: !!exercise.learning?.guided || exercise.type === 'reorder',
    errors: [...(exercise.learning?.errors ?? []), ...(exercise.learning?.remediates ?? [])],
    remediates: exercise.learning?.remediates,
  };
}

export type ReviewCandidate = ReturnType<typeof reviewCandidate>;

interface ReviewPlan {
  row: UnifiedReviewRow;
  mastery: UnifiedMastery;
  candidates: ReviewCandidate[];
}

export function unifiedReviewPlans(
  state: OfflineState,
  content: CourseData,
  candidates: ReviewCandidate[],
  now: number,
  missionId?: string | null,
): ReviewPlan[] {
  const records = unifiedReviewQueue(state.unifiedLearning, now);
  const knownTargets = new Set(records.map(({ targetId }) => targetId));
  const taughtHomeConcepts = new Set(
    state.travelLearning?.targets.map(({ conceptId }) => conceptId),
  );
  const missionTargets = new Set(
    chapter.missions
      .find(({ id }) => id === missionId)
      ?.steps.flatMap((step) =>
        step.type === 'exercise'
          ? exerciseEvidenceTargets(step.exercise, travelLesson.id).map(({ targetId }) => targetId)
          : [],
      ),
  );
  const registry = buildLearningRegistry(content);
  const available = candidates.filter((candidate) => {
    if (candidate.lesson.id !== travelLesson.id) return true;
    const concept = candidate.exercise.learning?.conceptId as TravelConceptId | undefined;
    return (
      !concept ||
      (travelConcepts[concept]?.prerequisiteIds ?? []).every(
        (id) =>
          taughtHomeConcepts.has(id) ||
          homeLearningEvidenceTargets({ conceptId: id, skill: 'grammar' }).some(({ targetId }) =>
            knownTargets.has(targetId),
          ),
      )
    );
  });
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
    byKey.set(unifiedMasteryKey(target), {
      ...target,
      state: 'not_introduced',
      needsReview: false,
      independentSuccesses: 0,
      assistedSuccesses: 0,
      communicationSuccesses: 0,
      incorrectAttempts: 0,
      delayedSuccesses: 0,
      transferSuccesses: 0,
      pendingErrors: [],
      errorCounts: {},
      legacy: false,
    });
  }

  return [...byKey].flatMap(([key, mastery]) => {
    if (missionId && !missionTargets.has(mastery.targetId)) return [];
    const definition = registry.get(mastery.targetId);
    const alternatives = rankUnifiedReviewCandidates(
      state.unifiedLearning,
      mastery,
      available,
      now,
    );
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
