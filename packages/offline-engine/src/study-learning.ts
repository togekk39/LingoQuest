import { exerciseEvidenceTargets, lessonEvidenceTargets } from './learning-registry';
import { sha256Hex } from '@lingoquest/course-pack';
import { travelLesson } from './home-content';
import { formalTeachingKeys, reviewPrerequisites } from './learning-prerequisites';
import {
  masteryAtLeast,
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
type AbilityStatus =
  'unverified' | 'in_progress' | 'partially_mastered' | 'mastered' | 'needs_review';

interface StudyAbilityStatus {
  dimension: AbilityDimension;
  status: AbilityStatus;
  assessedTargets: number;
  masteredTargets: number;
}

export interface StudyLearningStatus {
  abilities: StudyAbilityStatus[];
  skippableExerciseIds: string[];
  nextReviewAt: string | null;
}

function masteryByTarget(learning: UnifiedLearningState) {
  return new Map(unifiedMastery(learning).map((mastery) => [unifiedMasteryKey(mastery), mastery]));
}

function provenExercise(
  learning: UnifiedLearningState,
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
  const targets = exerciseEvidenceTargets(exercise, lesson.id);
  const demonstrated =
    targets.length > 0 &&
    targets.every((target) => {
      const mastery = evidence.get(unifiedMasteryKey(target));
      return (
        mastery &&
        masteryAtLeast(mastery.state, 'demonstrated') &&
        !mastery.needsReview &&
        (!mastery.nextReviewAt || Date.parse(mastery.nextReviewAt) > now)
      );
    });
  if (!demonstrated) return false;

  const prerequisites = lesson.grammar?.prerequisiteSkillIds ?? [];
  if (
    prerequisites.every((skill) =>
      completedLessons.some((id) => content.lessons[id]?.grammar?.skillId === skill),
    )
  )
    return true;
  return (
    reviewPrerequisites(content, lesson, exercise, formalTeachingKeys(learning))?.missing.length ===
    0
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
    learning,
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

function lessonAssessments(lesson: CourseLesson) {
  return lesson.exercises.flatMap((exercise) => {
    if (exercise.ungradable) return [];
    return exerciseEvidenceTargets(exercise, lesson.id).filter(
      ({ dimension }) =>
        dimension !== 'grammar_production' ||
        (exercise.type === 'short_text' && !exercise.options?.length),
    );
  });
}

function hasAssessment(mastery: UnifiedMastery) {
  return (
    mastery.independentSuccesses > 0 ||
    mastery.assistedSuccesses > 0 ||
    mastery.communicationSuccesses > 0 ||
    mastery.incorrectAttempts > 0
  );
}

function summarizeAbility(
  dimension: AbilityDimension,
  targets: UnifiedEvidenceTarget[],
  evidence: ReadonlyMap<string, UnifiedMastery>,
  now: number,
): StudyAbilityStatus {
  const assessedTargets = targets.length;
  const assessed = targets.flatMap((target) => {
    const mastery = evidence.get(unifiedMasteryKey(target));
    return mastery && hasAssessment(mastery) ? [mastery] : [];
  });
  const demonstrated = (mastery: UnifiedMastery) => masteryAtLeast(mastery.state, 'demonstrated');
  const masteredTargets = assessed.filter(demonstrated).length;
  const due = assessed.some(
    (mastery) =>
      (mastery.nextReviewAt !== undefined && Date.parse(mastery.nextReviewAt) <= now) ||
      (demonstrated(mastery) && mastery.needsReview),
  );
  let status: AbilityStatus = 'unverified';
  if (due) status = 'needs_review';
  else if (masteredTargets > 0)
    status = masteredTargets === assessedTargets ? 'mastered' : 'partially_mastered';
  else if (assessed.length) status = 'in_progress';
  return { dimension, status, assessedTargets, masteredTargets };
}

export function studyLearningStatus(
  learning: UnifiedLearningState,
  completedLessons: readonly string[],
  content: CourseData,
  lesson: CourseLesson,
  now: number,
): StudyLearningStatus {
  const evidence = masteryByTarget(learning);
  const targets = lessonAssessments(lesson);
  const linkedGoals = new Set([
    ...lessonEvidenceTargets(lesson, 'grammar').map(({ targetId }) => targetId),
    ...targets.map(({ targetId }) => targetId),
  ]);
  const shared = [
    ...lessonAssessments(travelLesson),
    ...[...evidence.values()].filter(hasAssessment),
  ].filter(
    (target) =>
      linkedGoals.has(target.targetId) &&
      abilityDimensions.some((dimension) => dimension === target.dimension),
  );
  const scoped = [
    ...new Map(
      [...targets, ...shared].map((target) => [unifiedMasteryKey(target), target]),
    ).values(),
  ];
  const nextReviewAt =
    scoped
      .flatMap((target) => evidence.get(unifiedMasteryKey(target))?.nextReviewAt ?? [])
      .sort()[0] ?? null;
  const abilities = abilityDimensions.map((dimension) =>
    summarizeAbility(
      dimension,
      scoped.filter((target) => belongsTo(dimension, target.dimension)),
      evidence,
      now,
    ),
  );
  return {
    abilities,
    skippableExerciseIds: lesson.exercises
      .filter((exercise) =>
        provenExercise(learning, evidence, completedLessons, content, lesson, exercise, now),
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
