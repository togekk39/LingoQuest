import { unifiedMastery, unifiedMasteryKey, type UnifiedLearningState } from './learning-evidence';
import { formalTeachingKeys, teachingReferenceKey } from './learning-prerequisites';
import type { TravelChapter, TravelExerciseStep, TravelMission } from './travel-content';
import type { TravelState } from './travel';

export type FoundationStatus = 'new' | 'taught' | 'guided' | 'ready' | 'review';

export function foundationPath(
  chapter: TravelChapter,
  travel: TravelState,
  learning: UnifiedLearningState,
  now: number,
  practice: readonly TravelExerciseStep[] = [],
) {
  const teaching = formalTeachingKeys(learning);
  const mastery = new Map(
    unifiedMastery(learning).map((entry) => [unifiedMasteryKey(entry), entry]),
  );
  const status = (mission: TravelMission): FoundationStatus => {
    const checks = [
      ...mission.steps,
      ...practice.filter(({ reviewMissionId }) => reviewMissionId === mission.id),
    ].flatMap((step) =>
      step.type === 'exercise' && !step.exercise.learning?.guided && step.targets?.length
        ? [step]
        : [],
    );
    if (!checks.length) return 'new';
    const results = checks.flatMap(({ targets }) =>
      targets!.map((target) => mastery.get(unifiedMasteryKey(target))),
    );
    if (results.some((entry) => entry?.pendingErrors.length)) return 'guided';
    if (
      results.some(
        (entry) =>
          entry?.needsReview || (entry?.nextReviewAt && Date.parse(entry.nextReviewAt) <= now),
      )
    )
      return 'review';
    if (
      checks.every(({ requires }) =>
        requires?.every((ref) => teaching.has(teachingReferenceKey(ref))),
      ) &&
      results.every((entry) => (entry?.independentSuccesses ?? 0) > 0)
    )
      return 'ready';
    if (
      results.some(
        (entry) => !!entry && (entry.assistedSuccesses > 0 || entry.independentSuccesses > 0),
      )
    )
      return 'guided';
    if (
      checks.some(({ requires }) =>
        requires?.every((ref) => teaching.has(teachingReferenceKey(ref))),
      )
    )
      return 'taught';
    return 'new';
  };
  return chapter.missions
    .filter(({ foundationObjectiveId }) => foundationObjectiveId)
    .map((mission) => ({
      id: mission.id,
      status: status(mission),
      resume:
        (travel.active?.missionId === mission.id && !travel.active.finished) ||
        !!travel.paused?.[mission.id],
    }));
}

export type FoundationPathEntry = ReturnType<typeof foundationPath>[number];
