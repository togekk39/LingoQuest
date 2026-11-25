import { exerciseEvidenceTargets, lessonEvidenceTargets } from './learning-registry';
import { sha256Hex } from '@lingoquest/course-pack';
import {
  unifiedMastery,
  unifiedMasteryKey,
  type UnifiedEvidenceTarget,
  type UnifiedLearningDimension,
  type UnifiedLearningState,
  type UnifiedMastery,
} from './learning-evidence';
import type { CourseData, CourseExercise, CourseLesson } from './index';

const abilityDimensions = ['listening', 'speaking', 'reading', 'writing'] as const;
type AbilityDimension = (typeof abilityDimensions)[number];
type AbilityStatus = 'unverified' | 'practicing' | 'verified' | 'needs_review';

export interface StudyLearningStatus {
  abilities: { dimension: AbilityDimension; status: AbilityStatus }[];
  skippableExerciseIds: string[];
  nextReviewAt: string | null;
}

const verifiedStates = new Set(['demonstrated', 'retained', 'transfer']);

function masteryByTarget(learning: UnifiedLearningState) {
  return new Map(unifiedMastery(learning).map((mastery) => [unifiedMasteryKey(mastery), mastery]));
}

function provenExercise(
  evidence: ReadonlyMap<string, UnifiedMastery>,
  completedLessons: readonly string[],
  content: CourseData,
  lesson: CourseLesson,
  exercise: CourseExercise,
  now: number,
) {
  if (
    exercise.ungradable ||
    exercise.requiredLessonIds?.some((id) => !completedLessons.includes(id))
  )
    return false;
  const prerequisites = lesson.grammar?.prerequisiteSkillIds ?? [];
  if (
    !prerequisites.every((skill) =>
      completedLessons.some((id) => content.lessons[id]?.grammar?.skillId === skill),
    )
  )
    return false;
  const targets = exerciseEvidenceTargets(exercise, lesson.id);
  return (
    targets.length > 0 &&
    targets.every((target) => {
      const mastery = evidence.get(unifiedMasteryKey(target));
      return (
        mastery &&
        verifiedStates.has(mastery.state) &&
        !mastery.needsReview &&
        (!mastery.nextReviewAt || Date.parse(mastery.nextReviewAt) > now)
      );
    })
  );
}

export function canSkipStudyExercise(
  learning: UnifiedLearningState,
  completedLessons: readonly string[],
  content: CourseData,
  lesson: CourseLesson,
  exercise: CourseExercise,
  now: number,
) {
  return provenExercise(
    masteryByTarget(learning),
    completedLessons,
    content,
    lesson,
    exercise,
    now,
  );
}

function belongsTo(dimension: AbilityDimension, target: UnifiedLearningDimension) {
  return dimension === target || (dimension === 'writing' && target === 'grammar_production');
}

export function studyLearningStatus(
  learning: UnifiedLearningState,
  completedLessons: readonly string[],
  content: CourseData,
  lesson: CourseLesson,
  now: number,
): StudyLearningStatus {
  const evidence = masteryByTarget(learning);
  const targets = lesson.exercises.flatMap((exercise) =>
    exerciseEvidenceTargets(exercise, lesson.id),
  );
  const oralTargets = new Set([
    ...lessonEvidenceTargets(lesson, 'grammar').map(({ targetId }) => targetId),
    ...targets.map(({ targetId }) => targetId),
  ]);
  const oral = [...oralTargets].flatMap((targetId): UnifiedEvidenceTarget[] => [
    { dimension: 'listening', targetId },
    { dimension: 'speaking', targetId },
  ]);
  const records = [...new Set([...targets, ...oral].map(unifiedMasteryKey))].flatMap((key) => {
    const mastery = evidence.get(key);
    return mastery ? [mastery] : [];
  });
  const nextReviewAt = records.flatMap(({ nextReviewAt }) => nextReviewAt ?? []).sort()[0] ?? null;
  const abilities = abilityDimensions.map((dimension): StudyLearningStatus['abilities'][number] => {
    const relevant = records.filter((record) => belongsTo(dimension, record.dimension));
    const measured = relevant.some(({ state }) => verifiedStates.has(state));
    const due = relevant.some(
      ({ needsReview, nextReviewAt }) =>
        needsReview || (nextReviewAt && Date.parse(nextReviewAt) <= now),
    );
    const practiced = relevant.some(
      ({ state }) => state === 'guided_practice' || state === 'independent_performance',
    );
    return {
      dimension,
      status: due
        ? 'needs_review'
        : measured
          ? 'verified'
          : practiced
            ? 'practicing'
            : 'unverified',
    };
  });
  return {
    abilities,
    skippableExerciseIds: lesson.exercises
      .filter((exercise) =>
        provenExercise(evidence, completedLessons, content, lesson, exercise, now),
      )
      .map(({ id }) => id),
    nextReviewAt,
  };
}

export function studyMaterialVersion(content: CourseData, lessonId: string) {
  return content.lessonVersions?.[lessonId] ?? content.courseVersion ?? 'legacy-unversioned';
}

export function studyIntroEventId(lessonId: string, materialVersion: string, exerciseId: string) {
  return `study-intro:${sha256Hex(JSON.stringify([lessonId, materialVersion, exerciseId]))}`;
}
