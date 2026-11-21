import type { TravelExerciseStep } from './travel-content';
import type { PublicExercise } from '@lingoquest/contracts';
import type { OfflineState } from './index';
import { chapter, travelLesson, travelPracticeSteps } from './home-content';
import { learningSkills, travelConcepts, type TravelConceptId } from './travel-curriculum';
import {
  learningKey,
  rankPractice,
  type LearningRecord,
  type LearningReviewReason,
  type LearningSkill,
} from './travel-learning';

export interface TravelReviewRow {
  key: string;
  skill: LearningSkill;
  skillLabelEs: string;
  targetLabelEs: string;
  dueAt?: string;
  due: boolean;
  reason: LearningReviewReason;
  canPractice: boolean;
  successes: LearningRecord['successes'];
  communicationSuccesses: number;
  independentSuccesses: number;
  assistedSuccesses: number;
  delayedSuccesses: number;
  transferSuccesses: number;
  speakingPractice: LearningRecord['speakingPractice'];
  exercises: PublicExercise[];
}

const priority: Record<LearningReviewReason, number> = { remediation: 0, due: 1, practice: 2 };

export function travelPracticeStep(exerciseId: string) {
  return (
    travelPracticeSteps.find((step) => step.exercise.id === exerciseId) ??
    chapter.missions
      .flatMap((mission) => mission.steps)
      .find(
        (step): step is TravelExerciseStep =>
          step.type === 'exercise' && step.exercise.id === exerciseId,
      )
  );
}

function reviewCandidates(missionId?: string | null) {
  const mission = chapter.missions.find((item) => item.id === missionId);
  const concepts = new Set(
    mission?.steps.flatMap((step) => {
      const learning =
        step.type === 'exercise'
          ? step.exercise.learning
          : step.type === 'speak'
            ? step.learning
            : undefined;
      return learning ? [learning.conceptId] : [];
    }),
  );
  const relevant = (step: TravelExerciseStep) =>
    !missionId || (!!step.exercise.learning && concepts.has(step.exercise.learning.conceptId));
  return [
    ...travelPracticeSteps,
    ...chapter.missions.flatMap((item) =>
      item.steps.filter((step): step is TravelExerciseStep => step.type === 'exercise'),
    ),
  ].filter(relevant);
}

function legacyRecords(
  state: OfflineState,
  candidates: TravelExerciseStep[],
  existing: Set<string>,
) {
  const visited = Object.hasOwn(state.visitedExercises, travelLesson.id)
    ? state.visitedExercises[travelLesson.id]
    : [];
  const result: LearningRecord[] = [];
  for (const mastery of state.mastery) {
    const match = candidates.find(
      ({ exercise }) =>
        visited.includes(exercise.id) &&
        exercise.learning &&
        exercise.dimension === mastery.dimension &&
        (mastery.dimension.startsWith('vocabulary_')
          ? exercise.vocabularyIds?.includes(mastery.targetId)
          : exercise.skillId === mastery.targetId),
    );
    const target = match?.exercise.learning;
    if (!target || existing.has(learningKey(target))) continue;
    existing.add(learningKey(target));
    result.push({
      conceptId: target.conceptId,
      skill: target.skill,
      attempts: 0,
      successes: {},
      assistance: {},
      delayedSuccesses: 0,
      transferSuccesses: 0,
      errors: {},
      speakingPractice: {},
      seenExercises: {},
      seenContexts: [],
      lastPracticedAt: mastery.lastPracticedAt,
      intervalIndex: 0,
      nextReviewAt: mastery.nextReviewAt,
    });
  }
  return result;
}

export function travelReviewPlans(state: OfflineState, now: number, missionId?: string | null) {
  const candidates = reviewCandidates(missionId);
  const records = state.travelLearning ?? { targets: [] };
  const existing = new Set(records.targets.map(learningKey));
  return [...records.targets, ...legacyRecords(state, candidates, existing)]
    .map((target) => ({ target, ...rankPractice(records, target, candidates, now) }))
    .sort(
      (a, b) =>
        priority[a.reason] - priority[b.reason] ||
        Number(b.target.lastOutcome === 'incorrect') -
          Number(a.target.lastOutcome === 'incorrect') ||
        Date.parse(a.target.lastPracticedAt ?? '1970-01-01') -
          Date.parse(b.target.lastPracticedAt ?? '1970-01-01'),
    );
}

export function travelReviewRows(
  state: OfflineState,
  now: number,
  includeAll: boolean,
  project: (exercise: TravelExerciseStep['exercise']) => PublicExercise,
): TravelReviewRow[] {
  return travelReviewPlans(state, now)
    .filter(({ reason }) => includeAll || reason !== 'practice')
    .map(({ target, reason, candidates }) => {
      const totals = Object.values(target.successes);
      return {
        key: learningKey(target),
        skill: target.skill,
        skillLabelEs: learningSkills[target.skill],
        targetLabelEs:
          travelConcepts[target.conceptId as TravelConceptId]?.labelEs ?? target.conceptId,
        dueAt: target.nextReviewAt,
        due: target.nextReviewAt !== undefined && Date.parse(target.nextReviewAt) <= now,
        reason,
        canPractice: candidates.length > 0,
        successes: target.successes,
        communicationSuccesses: target.communicationSuccesses ?? 0,
        independentSuccesses: totals.reduce((sum, stage) => sum + stage.independent, 0),
        assistedSuccesses: totals.reduce((sum, stage) => sum + stage.assisted, 0),
        delayedSuccesses: target.delayedSuccesses,
        transferSuccesses: target.transferSuccesses,
        speakingPractice: target.speakingPractice,
        exercises: candidates.slice(0, 4).map(({ exercise }) => project(exercise)),
      };
    });
}
