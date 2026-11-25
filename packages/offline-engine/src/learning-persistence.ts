import { z } from 'zod';
import { answerOutcomeSchema, learningErrorSchema } from '@lingoquest/contracts';
import {
  courseExerciseSchema,
  lessonSchema,
  rpgAnswerEvidenceSchema,
  rpgAssessmentTargetsSchema,
  travelStoryRepliesSchema,
  type RpgFormalDefinition,
} from '@lingoquest/course-pack';
import { chapter, travelLesson } from './home-content';
import type { CourseData, CourseLesson, OfflineState } from './index';
import { emptyUnifiedLearning, type LegacyLearningSchedule } from './learning-evidence';
import {
  exactRpgAssessment,
  formalDefinitions,
  rpgAssessmentDigest,
} from './learning-prerequisites';
import {
  canonicalLearningId,
  exerciseEvidenceTargets,
  homeLearningEvidenceTargets,
  legacyEvidenceTarget,
} from './learning-registry';
import { studyMaterialVersion } from './study-learning';
import { travelPracticeStep } from './travel-review';
import type { TravelChapter, TravelExerciseStep } from './travel-content';

type LegacyState = Pick<OfflineState, 'mastery' | 'travelLearning'> &
  Partial<Pick<OfflineState, 'unifiedLearning'>>;

const challengeRunHistorySchema = z.object({
  id: z.string().min(1).max(100),
  trackId: z.string().min(1).max(100),
  type: z.enum(['grammar_rush', 'cloze_battle', 'reading_quest']),
  level: z.number().int().min(1).max(13),
  startedAt: z.number().int().nonnegative(),
  status: z.enum(['active', 'passed', 'failed', 'abandoned']),
  answers: z
    .array(
      z
        .object({
          questionId: z.string().min(1).max(100),
          correct: z.boolean(),
          outcome: answerOutcomeSchema.optional(),
          feedbackEs: z.string().max(5000),
          acceptedAnswer: z.string().max(5000),
        })
        .strict(),
    )
    .max(50),
  submissions: z.record(z.object({ fingerprint: z.string().max(10000) })),
});
export const challengeHistorySchema = z.array(challengeRunHistorySchema).max(10000);
export type ChallengeHistory = z.infer<typeof challengeHistorySchema>;

export function freezeChallengeHistory(
  history: ChallengeHistory = [],
  runs: Record<string, unknown>,
): ChallengeHistory {
  const saved = new Map(history.map((run) => [run.id, run]));
  for (const value of Object.values(runs)) {
    const run = challengeRunHistorySchema.safeParse(value);
    if (run.success && run.data.answers.length) saved.set(run.data.id, run.data);
  }
  return [...saved.values()];
}

export function migrateUnifiedLearning(state: LegacyState): OfflineState['unifiedLearning'] {
  if (state.unifiedLearning) return state.unifiedLearning;
  const schedules = new Map<string, LegacyLearningSchedule>();
  const remember = (candidate: LegacyLearningSchedule) => {
    const key = JSON.stringify([candidate.targetId, candidate.dimension]);
    const prior = schedules.get(key);
    if (!prior) {
      schedules.set(key, candidate);
      return;
    }
    if (Date.parse(candidate.nextReviewAt) < Date.parse(prior.nextReviewAt))
      prior.nextReviewAt = candidate.nextReviewAt;
    if (
      candidate.lastPracticedAt &&
      (!prior.lastPracticedAt ||
        Date.parse(candidate.lastPracticedAt) > Date.parse(prior.lastPracticedAt))
    )
      prior.lastPracticedAt = candidate.lastPracticedAt;
  };
  for (const entry of state.mastery) {
    remember({
      ...legacyEvidenceTarget(entry.targetId, entry.dimension),
      nextReviewAt: entry.nextReviewAt,
      lastPracticedAt: entry.lastPracticedAt,
    });
  }
  for (const entry of state.travelLearning?.targets ?? []) {
    if (!entry.nextReviewAt) continue;
    for (const target of homeLearningEvidenceTargets({
      conceptId: entry.conceptId,
      skill: entry.skill,
      evidence: entry.lastEvidenceStage ?? 'recognition',
    }))
      remember({
        ...target,
        nextReviewAt: entry.nextReviewAt,
        lastPracticedAt: entry.lastPracticedAt,
      });
  }
  return { ...emptyUnifiedLearning(), legacySchedules: [...schedules.values()] };
}

const travelLearningTargetSchema = z
  .object({
    conceptId: z.string().min(1).max(100),
    skill: z.enum(['vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking']),
    evidence: z.enum(['recognition', 'understanding', 'recall', 'production', 'transfer']),
    contextId: z.string().min(1).max(100),
    guided: z.literal(true).optional(),
    errors: z.array(learningErrorSchema).max(20).optional(),
    optionErrors: z.record(learningErrorSchema).optional(),
    errorAnswers: z.record(learningErrorSchema, z.array(z.string().max(2000)).max(100)).optional(),
    remediates: z.array(learningErrorSchema).max(20).optional(),
  })
  .strict();

const archiveExerciseSchema = courseExerciseSchema.extend({
  acceptedAnswers: z.array(z.string().max(2000)).max(100),
  dimension: courseExerciseSchema.shape.dimension.optional(),
  vocabularyIds: courseExerciseSchema.shape.vocabularyIds.optional(),
  learning: travelLearningTargetSchema.optional(),
});
const archiveLessonSchema = lessonSchema.pick({ id: true, unitId: true, title: true }).extend({
  contextEs: lessonSchema.shape.contextEs.optional(),
  vocabulary: lessonSchema.shape.vocabulary.optional(),
  grammar: lessonSchema.shape.grammar.optional(),
  exercises: z.array(archiveExerciseSchema).max(150),
});
const stepSchema = z
  .object({
    situation: z.string().max(4000).optional(),
    hint: z.string().max(4000).optional(),
  })
  .strict();
const archiveEntrySchema = z
  .object({
    lesson: archiveLessonSchema,
    version: z.string().min(1).max(100),
    steps: z.record(stepSchema).optional(),
  })
  .strict();
export const reviewArchiveSchema = z.record(archiveEntrySchema);
export type ReviewArchive = z.infer<typeof reviewArchiveSchema>;
type ArchivedLesson = z.infer<typeof archiveEntrySchema>;

export interface ChapterPractice {
  step: TravelExerciseStep;
  lesson: CourseLesson;
  version: string;
  chapterId: string;
  authoredAudio?: true;
  definitions?: readonly RpgFormalDefinition[];
  reviewedDigest?: string;
}

const identifier = z.string().min(1).max(250);
const referenceSchema = z.object({ id: identifier, form: identifier.optional() }).strict();
const digestSchema = z.string().regex(/^[a-f0-9]{64}$/);
const translationSchema = z.object({ en: z.string().max(4000), es: z.string().max(4000) }).strict();
const archivedPracticeSchema = stepSchema
  .extend({
    id: identifier,
    type: z.literal('exercise'),
    lessonId: identifier,
    situation: z.string().max(4000),
    response: z.enum(['personal-introduction', 'personal-spelling']).optional(),
    requiredReply: z.literal(true).optional(),
    storyPrompt: z
      .object({ speaker: identifier, text: z.string().max(4000) })
      .strict()
      .optional(),
    storyReply: z.object({ speaker: identifier, line: translationSchema }).strict().optional(),
    storyReplies: travelStoryRepliesSchema.optional(),
    activityTitle: z.string().max(4000).optional(),
    reviewMissionId: identifier.optional(),
    exercise: archiveExerciseSchema,
    requires: z.array(referenceSchema).min(1).max(150),
    targets: rpgAssessmentTargetsSchema.optional(),
    answerEvidence: rpgAnswerEvidenceSchema.optional(),
  })
  .strict();
const chapterArchiveEntrySchema = z
  .object({
    version: z.string().regex(/^[a-z][a-z-]{0,39}:[1-9][0-9]{0,5}$/),
    lessons: z.array(archiveLessonSchema).max(28),
    practice: z
      .array(z.object({ step: archivedPracticeSchema, digest: digestSchema }).strict())
      .max(200),
    missionTargets: z.record(z.array(identifier).max(250)),
    definitions: z
      .array(
        z
          .object({
            id: identifier,
            kind: z.enum(['lexical', 'pattern', 'grammar']),
            labelEs: z.string().min(1).max(4000),
            forms: z.array(z.string().min(1).max(4000)).max(100),
            examples: z.array(translationSchema).max(100),
          })
          .strict(),
      )
      .max(250),
  })
  .strict();
export const chapterReviewArchiveSchema = z.record(chapterArchiveEntrySchema);
export type ChapterReviewArchive = z.infer<typeof chapterReviewArchiveSchema>;

function restoreLesson(lesson: z.infer<typeof archiveLessonSchema>): CourseLesson {
  return { ...lesson, introEs: '', examples: [], speakingText: '', estimatedMinutes: 1 };
}

export function rememberChapterReview(
  state: OfflineState,
  chapter: TravelChapter,
  practice: readonly ChapterPractice[],
  version: string,
  reviewedDefinitions: ReadonlyMap<string, RpgFormalDefinition>,
) {
  const saved = chapter.id === 'home' ? state.travel : state.chapterProgress?.[chapter.id]?.travel;
  if (!saved) return;
  const completed = chapter.missions.filter(({ id }) => Object.hasOwn(saved.completed, id));
  if (!completed.length) return;
  const previous = state.chapterReviewArchive?.[chapter.id];
  if (
    previous &&
    (Number(previous.version.split(':')[1]) > Number(version.split(':')[1]) ||
      (previous.version === version &&
        completed.every(({ id }) => Object.hasOwn(previous.missionTargets, id))))
  )
    return;
  const missionTargets = Object.fromEntries(
    completed.map(({ id, steps }) => [
      id,
      [
        ...new Set(
          [
            ...steps,
            ...practice.filter(({ step }) => step.reviewMissionId === id).map(({ step }) => step),
          ].flatMap((step) =>
            step.type === 'exercise' && (step.lessonId || chapter.reviewedHomeCore)
              ? (
                  step.targets ??
                  exerciseEvidenceTargets(step.exercise, step.lessonId ?? 'travel_home')
                ).map(({ targetId }) => canonicalLearningId(targetId))
              : [],
          ),
        ),
      ],
    ]),
  );
  const targets = new Set(Object.values(missionTargets).flat());
  const lessons = new Map<string, z.infer<typeof archiveLessonSchema>>();
  const definitions = new Map<string, RpgFormalDefinition>();
  const entries = practice.flatMap(({ step, lesson, reviewedDigest }) => {
    if (
      !reviewedDigest ||
      step.audio ||
      step.transcript ||
      step.visual ||
      step.exercise.ungradable ||
      step.exercise.spelling ||
      step.exercise.learning?.skill === 'listening' ||
      step.targets?.some(({ dimension }) => dimension === 'listening') ||
      !(step.targets ?? exerciseEvidenceTargets(step.exercise, lesson.id)).some(({ targetId }) =>
        targets.has(canonicalLearningId(targetId)),
      )
    )
      return [];
    const parsed = archivedPracticeSchema.safeParse(step);
    if (!parsed.success || rpgAssessmentDigest(parsed.data) !== reviewedDigest) return [];
    const { id, title, unitId, contextEs, grammar, vocabulary } = lesson;
    lessons.set(id, { id, title, unitId, contextEs, grammar, vocabulary, exercises: [] });
    for (const { id } of parsed.data.requires) {
      const definition = reviewedDefinitions.get(id);
      if (definition) {
        const { kind, labelEs, forms, examples } = definition;
        definitions.set(id, { id, kind, labelEs, forms, examples });
      }
    }
    return [{ step: parsed.data, digest: reviewedDigest }];
  });
  if (!entries.length) return;
  const parsed = chapterArchiveEntrySchema.safeParse({
    version,
    lessons: [...lessons.values()],
    practice: entries,
    missionTargets,
    definitions: [...definitions.values()],
  });
  if (parsed.success)
    Object.defineProperty((state.chapterReviewArchive ??= {}), chapter.id, {
      value: parsed.data,
      configurable: true,
      enumerable: true,
      writable: true,
    });
}

export function archivedChapterReviews(state: OfflineState) {
  return new Map(
    Object.entries(state.chapterReviewArchive ?? {}).flatMap(([chapterId, entry]) => {
      const parsed = chapterArchiveEntrySchema.safeParse(entry);
      if (!parsed.success || !parsed.data.version.startsWith(`${chapterId}:`)) return [];
      const { lessons, version, definitions, missionTargets } = parsed.data;
      const byId = new Map(lessons.map((lesson) => [lesson.id, restoreLesson(lesson)]));
      const reviewedDefinitions = formalDefinitions(
        { lessons: {} },
        [...byId.values()],
        definitions,
      );
      const practice = parsed.data.practice.flatMap(({ step, digest }): ChapterPractice[] => {
        const lesson = byId.get(step.lessonId);
        return lesson &&
          exactRpgAssessment(step, reviewedDefinitions) &&
          rpgAssessmentDigest(step) === digest
          ? [{ step, lesson, version, chapterId, definitions, reviewedDigest: digest }]
          : [];
      });
      return practice.length ? [[chapterId, { practice, missionTargets, version }] as const] : [];
    }),
  );
}

export function rememberReviewLessons(state: OfflineState, content: CourseData) {
  const seen = new Set([
    ...state.completedLessons,
    ...Object.keys(state.visitedExercises),
    ...Object.keys(state.lessonCheckpoints ?? {}),
    ...state.unifiedLearning.evidence.map((event) => event.materialId),
  ]);
  if (state.travel?.active || Object.keys(state.travel?.completed ?? {}).length)
    seen.add(travelLesson.id);

  for (const id of seen) {
    const home = id === travelLesson.id;
    const lesson = home
      ? travelLesson
      : Object.hasOwn(content.lessons, id)
        ? content.lessons[id]
        : undefined;
    if (!lesson?.exercises.length) continue;
    const version = home ? `home:${chapter.revision}` : studyMaterialVersion(content, id);
    const prior = state.reviewArchive?.[id];
    if (prior?.version === version && (home || !lesson.grammar || prior.lesson.grammar)) continue;

    const steps: NonNullable<ArchivedLesson['steps']> = {};
    const exercises = lesson.exercises.flatMap((exercise) => {
      const step = home ? travelPracticeStep(exercise.id) : undefined;
      if (step?.audio || step?.visual || exercise.learning?.skill === 'listening') return [];
      const embedded = archiveExerciseSchema.safeParse(exercise);
      if (!embedded.success) return [];
      if (step) steps[exercise.id] = { situation: step.situation, hint: step.hint };
      return [embedded.data];
    });
    const parsed = archiveEntrySchema.safeParse({
      version,
      lesson: {
        id,
        unitId: lesson.unitId,
        title: lesson.title,
        contextEs: lesson.contextEs,
        vocabulary: lesson.vocabulary,
        grammar: lesson.grammar,
        exercises,
      },
      ...(home ? { steps } : {}),
    });
    if (parsed.success && exercises.length) (state.reviewArchive ??= {})[id] = parsed.data;
  }
}

export function archivedReviewLessons(
  state: OfflineState,
): { lesson: CourseLesson; version: string }[] {
  return Object.values(state.reviewArchive ?? {}).map(({ lesson, version }) => ({
    lesson: restoreLesson(lesson),
    version,
  }));
}

export function archivedTravelReviewStep(state: OfflineState, exerciseId: string) {
  return state.reviewArchive?.[travelLesson.id]?.steps?.[exerciseId];
}
