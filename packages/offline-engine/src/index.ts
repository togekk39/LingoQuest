import { foundationPath } from './foundation-path';
import { z, ZodError } from 'zod';
import type { ChapterPack, RpgAdventureAudit } from '@lingoquest/course-pack';
import {
  answerSchema,
  attemptSchema,
  challengeQuestionCount,
  challengeRequiredUnit,
  equivalentAnswerText,
  judgeAnswer,
  learningErrorSchema,
  matchesIntroductionName,
  normalizeAnswerText,
  playerIntroductionName,
  profileSchema,
  readIntroduction,
  runSchema,
  selectChallengeQuestions,
  spellingModel,
  suggestPlacementLevel,
  submissionSchema,
  type Answer,
  type AnswerKey,
  type AnswerOutcome,
  type AttemptInput,
  type AttemptResult,
  type ChallengeProgress,
  type Mastery,
  type Progress,
  type PublicExercise,
  type PublicLesson,
  type EvidenceDimension,
  type ExerciseType,
  type LearningError,
  type RunView,
  type User,
} from '@lingoquest/contracts';
import { route as travelRoute } from './travel-route';
import {
  chapter,
  chapterStory,
  homeAdventureAudit,
  homeSupportingLessons,
  travelLesson,
  travelPracticeSteps,
} from './home-content';
import {
  emptyStory,
  readStory,
  recordStoryReview,
  resumeStoryEncounter,
  storyStateSchema,
  updateStory,
  upgradeStory,
  type StoryContext,
  type StoryDefinition,
  type StoryState,
  type StoryView,
} from './story';
import { travelPracticeStep, travelReviewPlans, travelReviewRows } from './travel-review';
import type { UnifiedReviewRow } from './unified-review';
import {
  exerciseCheckedErrors,
  planRemediation,
  reviewCandidate,
  reviewTargetsForMission,
  unifiedReviewPlans,
} from './unified-review';
import {
  exactRpgAssessment,
  exactRpgReferences,
  formalDefinitions,
  formalTeachingKeys,
  recordReviewInstruction,
  reviewPrerequisites,
  reviewedHomeInstruction,
  reviewedHomeRequirements,
  rpgAssessmentDigest,
  rpgIntroductionTargets,
  rpgTeachingDigest,
  textbookFormalReferences,
  type ReviewInstruction,
} from './learning-prerequisites';
import type { TravelChapter, TravelExerciseStep } from './travel-content';
import { travelStepVocabulary } from './travel-vocabulary';
import { rpgAnswerTargets } from './rpg-answer-evidence';
import { rpgScenarioDigest, type ScenarioVerdict } from './scenario';
import {
  emptyUnifiedLearning,
  getUnifiedMastery,
  learningEvidenceOutcome,
  masteryAtLeast,
  recordUnifiedEvidence,
  unifiedLearningSchema,
  unifiedReviewQueue,
  type LearningEvidence,
  type UnifiedLearningAid,
  type UnifiedLearningSource,
  type UnifiedLearningState,
} from './learning-evidence';
import {
  canonicalLearningId,
  exerciseEvidenceContext,
  exerciseEvidenceTargets,
  homeChoiceEvidenceTargets,
  homeTeachingEvidenceTargets,
  lessonEvidenceTargets,
} from './learning-registry';
import {
  canSkipStudyExercise,
  studyIntroEventId,
  studyLearningStatus,
  studyMaterialVersion,
} from './study-learning';
export type { StudyLearningStatus } from './study-learning';
import {
  archivedChapterReviews,
  archivedReviewLessons,
  archivedTravelReviewStep,
  chapterReviewArchiveSchema,
  challengeHistorySchema,
  freezeChallengeHistory,
  migrateUnifiedLearning,
  rememberChapterReview,
  rememberReviewLessons,
  reviewArchiveSchema,
  type ChapterPractice,
  type ChapterReviewArchive,
  type ChallengeHistory,
  type ReviewArchive,
} from './learning-persistence';
import { chapterCardEventSchema, recordChapterCardEvent } from './chapter-card-learning';
import {
  findLearningError,
  learningErrorFeedback,
  learningKey,
  recordCommunicationSuccess,
  recordLearningAttempt,
  recordSpeakingPractice,
  travelLearningSchema,
  type LearningAid,
  type LearningReviewReason,
  type LearningTarget,
  type TravelLearningState,
} from './travel-learning';
import { assessTravelPlacement, placementQuestions } from './travel-placement';
import { recordSpeechPractice } from './speech-learning';
import {
  activeTravelCourse,
  availableTravelRanks,
  HOME_TRAVEL_TRACK,
  travelChallengeItems,
} from './travel-challenges';
import {
  challengeLearningGate,
  selectAdventureChallengeVariation,
  type ChallengeType,
} from './challenge-learning';
import {
  emptyTravel,
  travelStateSchema,
  updateTravel,
  upgradeTravelCheckpoints,
  draftAnswerSchema,
  savedResultSchema,
  type TravelState,
} from './travel';
export { activeTravelCourse, travelChallengePools } from './travel-challenges';
export {
  matchesIntroductionName,
  meetsIntroduction,
  playerIntroductionName,
  readIntroduction,
} from '@lingoquest/contracts';
export { chapter, installHomeContent, type HomeContent } from './home-content';
export { homeContentFromPack } from './home-pack';
export * from './learning-evidence';
export * from './learning-registry';
export { learningErrorFeedback } from './travel-learning';
export { learningSkills, travelConcepts, travelCurriculum } from './travel-curriculum';
export type { TravelReviewRow } from './travel-review';
export type { UnifiedReviewRow } from './unified-review';
export type {
  LearningError,
  LearningRecord,
  LearningSkill,
  LearningStage,
  LearningTarget,
  SpeechPractice,
  TravelLearningState,
} from './travel-learning';
export { homeCountries, route, type Destination, type HomeCountry } from './travel-route';
export type { TravelChapter, TravelMission, TravelStep, TravelVocabulary } from './travel-content';
export { travelStepVocabulary } from './travel-vocabulary';
export { canStartTravelMission, nextTravelMission, travelStoryReply } from './travel';
export {
  formatScenarioAmount,
  formatScenarioSelection,
  rpgScenarioDigest,
  scenarioSelectionTotal,
  type ScenarioDefinition,
  type MenuScenarioDefinition,
  type MenuScenarioState,
  type EventScenarioDefinition,
  type TeamScenarioDefinition,
  type ScenarioLine,
  type ScenarioState,
  type ScenarioTurn,
} from './scenario';
export {
  teamAvailability,
  teamWorkVisible,
  teamTurnReady,
  type TeamScenarioState,
} from './team-scenario';
export { confirmedEventFact, eventScenarioReady, type EventScenarioState } from './event-scenario';
export type {
  TravelPlacement,
  TravelPlacementQuestion,
  TravelPlacementResponse,
} from './travel-placement';
export type { TravelCheckpoint, TravelState, TravelOperation } from './travel';
export type { StoryOperation, StoryState, StoryView } from './story';

export interface StoryResponse {
  story: StoryView;
  travel: TravelState;
  firstVisit?: true;
}

/** Device-local learning only. Scores are personal practice, never verified rankings. */
export interface CourseExercise extends PublicExercise, AnswerKey {
  feedbackEs: string;
  learning?: LearningTarget;
}
export interface CourseLesson extends PublicLesson {
  exercises: CourseExercise[];
  estimatedMinutes: number;
}
interface LearningMastery extends Mastery {
  targetId: string;
  dimension: EvidenceDimension;
  practicedFormats: ExerciseType[];
  practicedExerciseIds: string[];
}

export interface CourseUnit {
  id: string;
  title: string;
  titleEs: string;
  description: string;
  cefr: string;
  lessons: { id: string; title: string; estimatedMinutes: number; skills: string[]; seq: number }[];
}
export interface ChallengeLevel {
  level: number;
  name_es: string;
  hearts: number;
  grammar_rush_total_seconds: number;
  reading_clock_multiplier: number;
  cloze_clock_multiplier: number;
  [key: string]: unknown;
}
export interface CourseData {
  units: CourseUnit[];
  lessons: Record<string, CourseLesson>;
  challengePools: {
    grammar_rush: CourseExercise[];
    cloze_battle: CourseExercise[];
    reading_quest: CourseExercise[];
  };
  challengeLevels: ChallengeLevel[];
  placementQuestions: CourseExercise[];
  missions: unknown[];
  speechDrills: unknown[];
  contentStatus?: unknown;
  courseVersion?: string;
  lessonVersions?: Record<string, string>;
}
export interface LocalStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export interface OfflineEngineOptions {
  store: LocalStore;
  getContent: () => Promise<CourseData> | CourseData;
  getChapterCards?: (id: string) => Promise<ChapterContent | null>;
  lock?: <T>(work: () => Promise<T>) => Promise<T>;
  clock?: () => number;
  randomId?: () => string;
}
type ChapterContent = Pick<
  ChapterPack,
  'chapterId' | 'revision' | 'lesson' | 'additionalLessons' | 'story' | 'unit'
>;

interface InstalledAdventure {
  chapter: TravelChapter;
  definition: StoryDefinition;
  lessons: Map<string, CourseLesson>;
  exercises: Map<string, ChapterPractice>;
  practice: ChapterPractice[];
  version: string;
  audit?: RpgAdventureAudit;
  requiresUpdate: boolean;
  definitions: ReturnType<typeof formalDefinitions>;
  challenges?: CourseData['challengePools'];
}

function reviewedAdventure(
  chapter: TravelChapter,
  definition: StoryDefinition,
  chapterLessonList: CourseLesson[],
  practiceSteps: TravelExerciseStep[],
  version: string,
  chapterAudit?: RpgAdventureAudit,
  challenges?: CourseData['challengePools'],
): InstalledAdventure {
  const lessons = new Map(chapterLessonList.map((lesson) => [lesson.id, lesson]));
  const chapterLessons = { lessons: Object.fromEntries(lessons) };
  const existingDefinitions = formalDefinitions(chapterLessons);
  const knownIds = new Set([...existingDefinitions.keys()].map(canonicalLearningId));
  const auditDefinitions = chapterAudit?.definitions ?? [];
  const introducedIds = new Set(auditDefinitions.map(({ id }) => canonicalLearningId(id)));
  const audit =
    introducedIds.size === auditDefinitions.length &&
    [...introducedIds].every((id) => !knownIds.has(id)) &&
    chapter.missions.every(
      ({ scenario }) =>
        !scenario ||
        (chapterAudit?.scenarios &&
          own(chapterAudit.scenarios, scenario.id) === rpgScenarioDigest(scenario)),
    )
      ? chapterAudit
      : undefined;
  const definitions = formalDefinitions(chapterLessons, [], audit?.definitions);
  const exercises = new Map<string, ChapterPractice>();
  const add = (step: TravelExerciseStep, authoredAudio?: true) => {
    const lesson = step.lessonId && lessons.get(step.lessonId);
    if (!lesson) return;
    const reviewedDigest = audit && own(audit.assessments, step.id);
    const entry: ChapterPractice = {
      step,
      lesson,
      version,
      chapterId: chapter.id,
      authoredAudio,
      definitions: audit?.definitions,
      reviewedDigest:
        reviewedDigest &&
        exactRpgAssessment(step, definitions) &&
        reviewedDigest === rpgAssessmentDigest(step)
          ? reviewedDigest
          : undefined,
    };
    exercises.set(step.exercise.id, entry);
    return entry;
  };
  for (const { steps, authoredAudio } of chapter.missions)
    for (const step of steps) if (step.type === 'exercise') add(step, authoredAudio);
  const authoredReviewAudio = chapter.missions.some(({ authoredAudio }) => authoredAudio);
  const practice = practiceSteps.flatMap((step) => {
    const requires =
      chapter.reviewedHomeCore && !step.lessonId ? reviewedHomeRequirements(step, true) : undefined;
    if (requires) {
      const legacyStep = {
        ...step,
        lessonId: travelLesson.id,
        requires,
        targets: exerciseEvidenceTargets(step.exercise, travelLesson.id),
      };
      if (!exactRpgAssessment(legacyStep, definitions)) return [];
      const entry: ChapterPractice = {
        step: legacyStep,
        lesson: travelLesson,
        version,
        chapterId: chapter.id,
        reviewedDigest: rpgAssessmentDigest(legacyStep),
      };
      exercises.set(step.exercise.id, entry);
      return [entry];
    }
    const entry = add(step, authoredReviewAudio || undefined);
    return entry?.reviewedDigest ? [entry] : [];
  });
  return {
    chapter,
    definition,
    lessons,
    version,
    exercises,
    practice,
    audit,
    requiresUpdate: !chapterAudit,
    definitions,
    challenges,
  };
}

function installedAdventure(pack: ChapterContent | null): InstalledAdventure | undefined {
  if (!pack?.story || !pack.unit) return;
  return reviewedAdventure(
    pack.story.chapter as unknown as TravelChapter,
    pack.story.adventure as unknown as StoryDefinition,
    [...pack.unit.lessons, ...(pack.story.supportingLessons ?? [])],
    pack.story.practice as TravelExerciseStep[],
    `${pack.chapterId}:${pack.revision}`,
    pack.story.audit,
    pack.story.challenges as CourseData['challengePools'] | undefined,
  );
}

let cachedHomeAdventure: InstalledAdventure | undefined;
function installedHomeAdventure() {
  if (!homeAdventureAudit) return;
  if (cachedHomeAdventure?.chapter !== chapter || cachedHomeAdventure.audit !== homeAdventureAudit)
    cachedHomeAdventure = reviewedAdventure(
      chapter,
      chapterStory,
      [travelLesson, ...(homeSupportingLessons ?? [])],
      travelPracticeSteps,
      `home:${chapter.revision}`,
      homeAdventureAudit,
    );
  return cachedHomeAdventure;
}

const chapterProgressSchema = z
  .object({ travel: travelStateSchema, story: storyStateSchema.optional() })
  .strict();
type ChapterProgress = z.infer<typeof chapterProgressSchema>;
interface StoredRun {
  id: string;
  trackId: string;
  type: 'grammar_rush' | 'cloze_battle' | 'reading_quest';
  level: number;
  mode: 'practice';
  relaxed: boolean;
  items: CourseExercise[];
  startedAt: number;
  contentVersion?: string;
  itemVersions?: Record<string, string>;
  deadline: number | null;
  heartsInitial: number;
  hearts: number;
  position: number;
  correctCount: number;
  status: RunView['status'];
  score: number;
  reason?: string;
  answers: NonNullable<RunView['feedback']>;
  submissions: Record<string, { fingerprint: string; result: RunView }>;
}
export interface OfflineState {
  formatVersion: 2;
  user: User;
  completedLessons: string[];
  xp: number;
  learningDays: string[];
  mastery: LearningMastery[];
  attempts: Record<string, { fingerprint: string; result: AttemptResult }>;
  visitedExercises: Record<string, string[]>;
  runs: Record<string, StoredRun>;
  runRequests: Record<string, { fingerprint: string; runId: string }>;
  challengeProgress: ChallengeProgress[];
  challengeHistory?: ChallengeHistory;
  reviewRewards: string[];
  skillDayBaseline: Record<string, { day: string; lastPracticedAt: string | null }>;
  travel?: TravelState;
  story?: StoryState;
  chapterProgress?: Record<string, ChapterProgress>;
  travelLearning?: TravelLearningState;
  unifiedLearning: UnifiedLearningState;
  reviewArchive?: ReviewArchive;
  chapterReviewArchive?: ChapterReviewArchive;
  lessonCheckpoints?: Record<string, LessonCheckpoint>;
  quickReview?: QuickCheckpoint;
  travelQuickReview?: QuickCheckpoint;
  travelReviewCheckpoints?: Record<string, QuickCheckpoint>;
}
export const OFFLINE_STATE_KEY = 'lq_offline_state_v1';
export class LocalError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code = 'LOCAL_REQUEST_ERROR',
  ) {
    super(message);
  }
}
const dayMs = 86400000;
const today = (time: number) => new Date(time).toISOString().slice(0, 10);
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
function own<T>(record: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}
function set<T>(record: Record<string, T>, key: string, value: T) {
  Object.defineProperty(record, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}
export const normalize = normalizeAnswerText;
export function grade(exercise: CourseExercise, answer: Answer) {
  return judgeAnswer(exercise, answer) === 'target';
}
function displayedAnswer(e: CourseExercise) {
  if (e.introduction) return e.introduction.model;
  if (e.type === 'matching')
    return (e.matchingPairs ?? []).map((p) => `${p.left} = ${p.right}`).join('; ');
  return (
    e.acceptedAnswers.find((a) => a !== e.correctOptionId) ??
    e.options?.find((o) => o.id === e.correctOptionId)?.text ??
    e.acceptedAnswers[0] ??
    ''
  );
}
export function publicExercise(e: CourseExercise): PublicExercise {
  return {
    id: e.id,
    type: e.type,
    promptEs: e.promptEs,
    sentence: e.sentence,
    options: e.options,
    tokens: e.tokens,
    skillId: e.skillId,
    passage: e.passage,
    difficulty: e.difficulty,
    dimension: e.dimension,
    vocabularyIds: e.vocabularyIds,
    contextualGlosses: e.contextualGlosses,
    optionsLanguage: e.optionsLanguage,
    matchingPairs: e.matchingPairs,
    requiredLessonIds: e.requiredLessonIds,
  };
}
const tracks = [
  {
    id: 'present_simple',
    titleEs: 'Retos del viajero',
    descriptionEs: 'Pon a prueba lo aprendido al viajar, coordinar planes y resolver imprevistos.',
    requiredUnitId: 'u02',
    defaultType: 'grammar_rush',
  },
];
export function timeBudget(
  content: CourseData,
  type: string,
  level: number,
  items: CourseExercise[],
) {
  const rule = content.challengeLevels.find((l) => l.level === level);
  if (!rule) throw new LocalError('Nivel no disponible.');
  if (type === 'grammar_rush') return rule.grammar_rush_total_seconds;
  const words = [...new Set(items.map((i) => i.passage ?? i.sentence ?? ''))]
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return type === 'reading_quest'
    ? Math.max(
        180,
        Math.ceil(((words / 130) * 60 + items.length * 25) * rule.reading_clock_multiplier),
      )
    : Math.max(
        150,
        Math.ceil(((words / 130) * 60 + items.length * 20) * rule.cloze_clock_multiplier),
      );
}
function requiredLessons(content: CourseData, requiredUnitId: string) {
  const stop = travelRoute.findIndex(({ unitId }) => unitId === requiredUnitId);
  if (
    stop >= 0 &&
    travelRoute
      .slice(0, stop + 1)
      .some(({ unitId }) => unitId && !content.units.some(({ id }) => id === unitId))
  )
    return [];
  const unitIndex = content.units.findIndex((u) => u.id === requiredUnitId);
  return unitIndex < 0
    ? []
    : content.units.slice(0, unitIndex + 1).flatMap((u) => u.lessons.map((l) => l.id));
}
function trackUnlocked(state: OfflineState, content: CourseData, requiredUnitId: string) {
  const required = requiredLessons(content, requiredUnitId);
  return required.length > 0 && required.every((id) => state.completedLessons.includes(id));
}
function challengeUnit(content: CourseData, level: number) {
  return challengeRequiredUnit(content.challengePools.grammar_rush, level);
}
function questions(content: CourseData, type: StoredRun['type'], level: number) {
  const required = new Set(requiredLessons(content, challengeUnit(content, level)));
  const learned = Object.values(content.lessons).filter((l) => required.has(l.id));
  const vocabulary = new Set(learned.flatMap((l) => (l.vocabulary ?? []).map((v) => v.id)));
  const skills = new Set(learned.flatMap((l) => l.exercises.map((e) => e.skillId)));
  return selectChallengeQuestions(
    content.challengePools[type],
    type,
    level,
    (e) =>
      !!e.requiredLessonIds?.length &&
      e.requiredLessonIds.every((id) => required.has(id)) &&
      skills.has(e.skillId) &&
      (e.vocabularyIds ?? []).every((id) => vocabulary.has(id)),
  );
}

function recordAssessmentAnswer(
  state: OfflineState,
  exercise: CourseExercise,
  context: Pick<
    LearningEvidence,
    'id' | 'source' | 'materialId' | 'materialVersion' | 'timestamp' | 'outcome'
  >,
  aids: UnifiedLearningAid[] = [],
  lessonId = context.materialId,
  answer?: Answer,
) {
  const error =
    context.outcome === 'incorrect' && exercise.learning && answer
      ? findLearningError(exercise.learning, answer, exercise.acceptedAnswers)
      : undefined;
  recordUnifiedEvidence(state.unifiedLearning, {
    ...context,
    exerciseId: exercise.id,
    contextId: exerciseEvidenceContext(exercise, lessonId),
    format: exercise.type,
    activity: 'answer',
    aids,
    retry: false,
    independent: aids.length === 0,
    targets: exerciseEvidenceTargets(exercise, lessonId),
    error,
  });
}

function taughtForReview(state: OfflineState, lessonId: string, exercise: CourseExercise) {
  return (
    !exercise.ungradable &&
    (state.completedLessons.includes(lessonId) ||
      own(state.visitedExercises, lessonId)?.includes(exercise.id))
  );
}

function reviewStarterWord(lesson: CourseLesson, exercise: CourseExercise) {
  if (exercise.type === 'meaning' && !exercise.ungradable)
    return lesson.vocabulary?.find((entry) => exercise.vocabularyIds?.includes(entry.id));
}

function studyIntroduction(
  state: OfflineState,
  content: CourseData,
  lesson: CourseLesson,
  stage: 'vocabulary' | 'grammar',
  now: number,
  formal?: { wordId?: string },
) {
  const materialVersion = studyMaterialVersion(content, lesson.id);
  const context = formal?.wordId
    ? { ...lesson, vocabulary: lesson.vocabulary?.filter(({ id }) => id === formal.wordId) }
    : lesson;
  const targets = lessonEvidenceTargets(context, stage);
  const teaches = formal ? textbookFormalReferences(lesson, stage, formal.wordId) : [];
  if (teaches.length) {
    const exerciseId = `formal:${stage}:${formal?.wordId ?? lesson.id}`;
    recordUnifiedEvidence(state.unifiedLearning, {
      id: studyIntroEventId(lesson.id, materialVersion, exerciseId),
      source: 'study',
      materialId: lesson.id,
      exerciseId,
      materialVersion,
      timestamp: now,
      contextId: lesson.id,
      format: 'instruction',
      activity: 'introduced',
      aids: ['guided', 'translation'],
      retry: false,
      independent: false,
      targets,
      teaches,
    });
    return;
  }
  for (const target of targets) {
    const exerciseId = `${stage}:${target.targetId}:${target.dimension}`;
    recordUnifiedEvidence(state.unifiedLearning, {
      id: studyIntroEventId(lesson.id, materialVersion, exerciseId),
      source: 'study',
      materialId: lesson.id,
      exerciseId,
      materialVersion,
      timestamp: now,
      contextId: lesson.id,
      format: 'instruction',
      activity: 'introduced',
      aids: ['guided', 'translation'],
      retry: false,
      independent: false,
      targets: [target],
    });
  }
}

function createUnifiedReviewCandidates(
  state: OfflineState,
  content: CourseData,
  archive: ReturnType<typeof archivedReviewLessons>,
  chapterPractice: readonly ChapterPractice[] = [],
) {
  const active = [...Object.values(content.lessons), travelLesson];
  const available = new Set<string>();
  const taught = formalTeachingKeys(state.unifiedLearning);
  const historicLessons = archive.map(({ lesson }) => lesson);
  const definitions = formalDefinitions(content, historicLessons);
  const resolvedDefinitions = new Map<
    NonNullable<ChapterPractice['definitions']>,
    ReturnType<typeof formalDefinitions>
  >();
  const courseCandidates = [...active, ...archive.map(({ lesson }) => lesson)].flatMap((lesson) =>
    lesson.exercises.flatMap((exercise) => {
      const id = `${lesson.id}:${exercise.id}`;
      if (available.has(id) || exercise.ungradable) return [];
      available.add(id);
      if (lesson.id !== travelLesson.id && !taughtForReview(state, lesson.id, exercise)) return [];
      if (exercise.learning?.skill === 'listening' && !travelPracticeStep(exercise.id)?.audio)
        return [];
      return [
        reviewCandidate(
          lesson,
          exercise,
          reviewPrerequisites(content, lesson, exercise, taught, definitions),
        ),
      ];
    }),
  );
  return [
    ...courseCandidates,
    ...chapterPractice.flatMap(({ lesson, step, definitions: chapterDefinitions }) => {
      const { exercise, requires } = step;
      if (exercise.ungradable || exercise.spelling) return [];
      let candidatesDefinitions = chapterDefinitions && resolvedDefinitions.get(chapterDefinitions);
      if (!candidatesDefinitions && chapterDefinitions?.length) {
        candidatesDefinitions = formalDefinitions(content, historicLessons, chapterDefinitions);
        resolvedDefinitions.set(chapterDefinitions, candidatesDefinitions);
      }
      return [
        reviewCandidate(
          lesson,
          exercise,
          reviewPrerequisites(
            content,
            lesson,
            exercise,
            taught,
            candidatesDefinitions ?? definitions,
            requires,
          ),
          step.targets,
          step.recommendUnverified,
        ),
      ];
    }),
  ];
}

function progress(state: OfflineState, now: number): Progress {
  const days = new Set(state.learningDays);
  let current = today(now);
  if (!days.has(current)) current = today(now - dayMs);
  let streak = 0;
  while (days.has(current)) {
    streak++;
    current = today(Date.parse(`${current}T12:00:00Z`) - dayMs);
  }
  const travelStamps = Object.fromEntries(
    travelRoute.flatMap(({ id }) => {
      const destination = own(state.chapterProgress ?? {}, id);
      const earned =
        own(destination?.travel.stamps ?? {}, id) ?? own(state.travel?.stamps ?? {}, id);
      return earned ? [[id, earned]] : [];
    }),
  );
  return {
    user: state.user,
    completedLessons: state.completedLessons,
    xp: state.xp,
    learningDays: state.learningDays,
    streak,
    mastery: state.mastery,
    reviewCount: unifiedReviewQueue(state.unifiedLearning, now).filter(
      ({ needsReview }) => needsReview,
    ).length,
    challengeProgress: state.challengeProgress,
    travelStamps,
  };
}
function finish(state: OfflineState, run: StoredRun, now: number) {
  if (run.status !== 'active') return;
  if (run.deadline !== null && now >= run.deadline) {
    run.status = 'failed';
    run.reason = 'timeout';
  } else if (run.hearts <= 0) {
    run.status = 'failed';
    run.reason = 'hearts';
  } else if (run.position >= run.items.length) run.status = 'passed';
  else return;
  const remaining =
    run.deadline === null ? 0 : Math.max(0, Math.floor((run.deadline - now) / 1000));
  run.score = 100 * run.correctCount + 2 * Math.min(remaining, 300) + 25 * run.hearts;
  if (run.status === 'passed') {
    let record = state.challengeProgress.find(
      (p) => p.trackId === run.trackId && p.type === run.type && p.mode === 'practice',
    );
    if (!record) {
      record = {
        trackId: run.trackId,
        type: run.type,
        mode: 'practice',
        highestLevel: 0,
        bestScores: {},
        badge: false,
      };
      state.challengeProgress.push(record);
    }
    record.highestLevel = Math.max(record.highestLevel, run.level);
    record.bestScores[String(run.level)] = Math.max(
      record.bestScores[String(run.level)] ?? 0,
      run.score,
    );
  }
}
function view(run: StoredRun, now: number): RunView {
  return {
    runId: run.id,
    trackId: run.trackId,
    type: run.type,
    level: run.level,
    mode: 'practice',
    relaxed: run.relaxed,
    status: run.status,
    deadlineAt: run.deadline === null ? null : new Date(run.deadline).toISOString(),
    serverNow: new Date(now).toISOString(),
    heartsRemaining: run.hearts,
    heartsInitial: run.heartsInitial,
    questionsTotal: run.items.length,
    completedQuestions: run.position,
    correctCount: run.status === 'active' ? 0 : run.correctCount,
    score: run.score,
    reason: run.reason,
    question:
      run.status === 'active' && run.items[run.position]
        ? publicExercise(run.items[run.position])
        : null,
    questionPosition: run.position + 1,
    ...(run.status === 'active' ? {} : { feedback: run.answers }),
  };
}

const iso = z.string().datetime();
const resultSchema = savedResultSchema;
const lessonCheckpointSchema = z
  .object({
    eventId: z.string().min(8).max(100),
    stage: z.number().int().min(0).max(30),
    vocabulary: z.number().int().min(0).max(100),
    exercise: z.number().int().min(-1).max(100),
    answer: draftAnswerSchema,
    hint: z.boolean(),
    help: z.boolean(),
    xp: z.number().int().min(0).max(1000000),
    weak: z.array(z.string().max(100)).max(1000),
    reviewAt: iso.nullable(),
    activityId: z.string().min(8).max(100),
    retry: z.boolean().optional(),
    referenceUsed: z.boolean().optional(),
    skipped: z.array(z.string().max(100)).max(30).optional(),
    skippedVersion: z.string().max(250).optional(),
  })
  .strict();
export type LessonCheckpoint = z.infer<typeof lessonCheckpointSchema>;
const reviewReasonSchema = z.enum(['remediation', 'due', 'practice']);
const quickCheckpointSchema = z
  .object({
    token: z.string().min(8).max(100),
    lessonId: z.string().min(1).max(60),
    exerciseId: z.string().min(1).max(100),
    answer: draftAnswerSchema,
    result: resultSchema.optional(),
    starter: z.boolean(),
    hint: z.boolean().optional(),
    transcript: z.boolean().optional(),
    listened: z.boolean().optional(),
    retry: z.boolean().optional(),
    prerequisite: z.literal('prepared').optional(),
    reason: reviewReasonSchema.optional(),
    remediation: z
      .object({
        phase: z.enum(['support', 'confirmation']),
        error: learningErrorSchema,
      })
      .strict()
      .optional(),
    reviewKey: z.string().min(1).max(250).optional(),
  })
  .strict();
type QuickCheckpoint = z.infer<typeof quickCheckpointSchema>;
export type QuickReviewState = QuickCheckpoint & {
  chapterId?: string;
  exercise: PublicExercise;
  situation?: string;
  hintText?: string;
  audio?: string;
  authoredAudio?: true;
  transcriptText?: string;
  explanation?: string;
  guidedSuccess?: true;
  waitingForConfirmation?: true;
  prerequisiteInstruction?: Pick<ReviewInstruction, 'sections'>;
  prerequisiteUnavailable?: true;
};
const userSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(60),
    email: z.string().email().optional(),
    isGuest: z.boolean(),
    goalMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]),
    motivation: z.enum(['travel', 'work', 'life']),
    reducedMotion: z.boolean(),
  })
  .strict();
const masterySchema = z
  .object({
    skillId: z.string().max(100),
    targetId: z.string().min(1).max(100),
    dimension: z.enum([
      'vocabulary_recognition',
      'vocabulary_recall',
      'grammar_understanding',
      'grammar_production',
    ]),
    practicedFormats: z
      .array(
        z.enum([
          'single_choice',
          'meaning',
          'matching',
          'cloze',
          'reorder',
          'correction',
          'short_text',
        ]),
      )
      .max(20),
    practicedExerciseIds: z.array(z.string().min(1).max(100)).max(10000),
    value: z.number().min(0).max(1),
    evidenceCount: z.number().int().min(0).max(10000000),
    unpromptedSuccessCount: z.number().int().min(0).max(10000000),
    lastPracticedAt: iso,
    nextReviewAt: iso,
    lastDelayedSuccessAt: iso.nullable(),
  })
  .strict();
/** Backups contain learning evidence only. Challenge snapshots and provider settings are not restored. */
const backupStateSchema = z
  .object({
    formatVersion: z.literal(2),
    user: userSchema,
    completedLessons: z.array(z.string().max(100)).max(10000),
    xp: z.number().int().min(0).max(1000000000),
    learningDays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(50000),
    mastery: z.array(masterySchema).max(10000),
    attempts: z.record(
      z.object({ fingerprint: z.string().max(10000), result: resultSchema }).strict(),
    ),
    visitedExercises: z.record(z.array(z.string().max(100)).max(10000)),
    runs: z.record(z.unknown()),
    runRequests: z.record(z.unknown()),
    challengeProgress: z
      .array(
        z
          .object({
            trackId: z.string().max(100),
            type: z.enum(['grammar_rush', 'cloze_battle', 'reading_quest']),
            mode: z.literal('practice'),
            highestLevel: z.number().int().min(0).max(13),
            bestScores: z.record(z.number().int().min(0).max(1000000000)),
            badge: z.literal(false),
          })
          .strict(),
      )
      .max(1000),
    reviewRewards: z.array(z.string().max(500)).max(200000),
    travel: travelStateSchema.optional(),
    story: storyStateSchema.optional(),
    chapterProgress: z.record(chapterProgressSchema).optional(),
    travelLearning: travelLearningSchema.optional(),
    challengeHistory: challengeHistorySchema.optional(),
    unifiedLearning: unifiedLearningSchema.optional(),
    reviewArchive: reviewArchiveSchema.optional(),
    chapterReviewArchive: chapterReviewArchiveSchema.optional(),
    lessonCheckpoints: z.record(lessonCheckpointSchema).optional(),
    quickReview: quickCheckpointSchema.optional(),
    travelQuickReview: quickCheckpointSchema.optional(),
    travelReviewCheckpoints: z.record(quickCheckpointSchema).optional(),
    skillDayBaseline: z.record(
      z.object({ day: z.string().max(10), lastPracticedAt: iso.nullable() }).strict(),
    ),
  })
  .strict();
const backupSchema = z
  .object({
    format: z.literal('lingoquest-backup'),
    formatVersion: z.literal(2),
    exportedAt: iso,
    state: backupStateSchema,
    progress: z.unknown().optional(),
    attempts: z.unknown().optional(),
    privacy: z.unknown().optional(),
  })
  .strict();

function storyContext(
  story: StoryState,
  travel: TravelState,
  learning?: TravelLearningState,
  unified?: UnifiedLearningState,
  definition: StoryDefinition = chapterStory,
  travelChapter: TravelChapter = chapter,
  origin = travel.country,
  now = Date.now(),
): StoryContext {
  const encounter = definition.encounters.find((entry) => entry.id === story.encounterId);
  let readyEncounterId: string | undefined;
  if (encounter) {
    const { missionId, endBeforeStepId } = encounter;
    const saved =
      travel.active?.missionId === missionId ? travel.active : travel.paused?.[missionId];
    const boundary = travelChapter.missions
      .find((mission) => mission.id === missionId)
      ?.steps.findIndex((step) => step.id === endBeforeStepId);
    if (
      travel.completed[missionId] ||
      (endBeforeStepId &&
        boundary !== undefined &&
        boundary >= 0 &&
        saved?.contentRevision === travelChapter.revision &&
        saved.step >= boundary)
    )
      readyEncounterId = encounter.id;
  }
  const demonstratedConcepts =
    learning?.targets
      .filter(
        ({ successes }) =>
          (successes.production?.independent ?? 0) > 0 ||
          (successes.transfer?.independent ?? 0) > 0,
      )
      .map(({ conceptId }) => conceptId) ?? [];
  if (
    unified &&
    masteryAtLeast(getUnifiedMastery(unified, 'home.introduce', 'writing').state, 'demonstrated')
  )
    demonstratedConcepts.push('introduction');
  const recommendations = definition.dialogues
    .find(({ id }) => id === story.dialogueId)
    ?.choices.filter(({ recommendation }) => recommendation);
  const path =
    recommendations?.length && unified ? foundationPath(travelChapter, travel, unified, now) : [];
  const eligible = recommendations?.filter(({ recommendation }) => {
    if (!recommendation || !unified) return false;
    const { missionId, diagnosticItem } = recommendation;
    const entry = path.find(({ id }) => id === missionId);
    if (!entry || entry.status === 'ready' || travel.completed[missionId]) return false;
    if (entry.resume) return true;
    return (
      !diagnosticItem ||
      !unified.evidence.some(
        ({ source, exerciseId, materialVersion, outcome, aids }) =>
          source === 'placement' &&
          exerciseId === diagnosticItem &&
          materialVersion === `home:${travelChapter.revision}` &&
          outcome === 'target' &&
          !aids.includes('transcript'),
      )
    );
  });
  const next =
    eligible?.find(({ recommendation }) =>
      path.some(({ id, resume }) => resume && id === recommendation?.missionId),
    ) ?? eligible?.[0];
  return {
    country: origin,
    completedMissions: Object.keys(travel.completed),
    clearedMissions: travel.cleared ?? [],
    demonstratedConcepts,
    readyEncounterId,
    recommendedChoiceId: next?.id,
  };
}

export class OfflineEngine {
  private tail: Promise<unknown> = Promise.resolve();
  private readonly clock: () => number;
  private readonly id: () => string;
  constructor(private readonly options: OfflineEngineOptions) {
    this.clock = options.clock ?? Date.now;
    this.id =
      options.randomId ??
      (() =>
        globalThis.crypto?.randomUUID?.() ??
        `local-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  }
  private initial(): OfflineState {
    return {
      formatVersion: 2,
      user: {
        id: this.id(),
        name: 'Explorador',
        isGuest: false,
        goalMinutes: 10,
        motivation: 'life',
        reducedMotion: false,
      },
      completedLessons: [],
      xp: 0,
      learningDays: [],
      mastery: [],
      attempts: {},
      visitedExercises: {},
      runs: {},
      runRequests: {},
      challengeProgress: [],
      reviewRewards: [],
      skillDayBaseline: {},
      unifiedLearning: emptyUnifiedLearning(),
    };
  }
  async initialize() {
    return this.request<Progress>('/v1/me/progress');
  }
  async request<T = unknown>(path: string, body?: unknown, method?: string): Promise<T> {
    const run = async () => {
      try {
        // A confirmed reset must remain available when stored JSON or the active
        // course cannot be opened. It does not need to read the damaged state.
        const verb = method ?? (body === undefined ? 'GET' : 'POST');
        if (path === '/v1/me' && verb === 'DELETE') {
          await this.options.store.setItem(OFFLINE_STATE_KEY, JSON.stringify(this.initial()));
          return { deleted: true, recordingsStored: false } as T;
        }
        const raw = await this.options.store.getItem(OFFLINE_STATE_KEY);
        let state: OfflineState;
        if (raw) {
          try {
            const saved = JSON.parse(raw) as Omit<OfflineState, 'unifiedLearning'> & {
              unifiedLearning?: OfflineState['unifiedLearning'];
            };
            if (saved.formatVersion !== 2)
              throw new LocalError(
                'El curso de desarrollo cambió. Tus datos anteriores siguen guardados. Exporta una copia y restablece el progreso para empezar el nuevo curso; los respaldos de la versión anterior no se pueden restaurar aquí.',
                409,
                'LOCAL_DATA_RESET_REQUIRED',
              );
            if (!saved.user || !Array.isArray(saved.completedLessons)) throw new Error();
            state = { ...saved, unifiedLearning: migrateUnifiedLearning(saved) };
          } catch (error) {
            if (error instanceof LocalError) throw error;
            throw new LocalError(
              'No pudimos abrir tus datos locales. Conserva una copia antes de restablecerlos.',
              500,
              'LOCAL_DATA_UNREADABLE',
            );
          }
        } else state = this.initial();
        const content = await this.options.getContent();
        let result;
        if (path === '/v1/learning/chapter-card' && verb === 'POST') {
          const event = chapterCardEventSchema.parse(body);
          const pack = await this.options.getChapterCards?.(event.chapterId);
          if (!pack) throw new LocalError('Descarga el capítulo para practicar.', 404);
          if (pack.revision !== event.revision)
            throw new LocalError('Vuelve a abrir el capítulo para ver la versión actual.', 409);
          result = {
            state,
            value: recordChapterCardEvent(state.unifiedLearning, pack, event, this.clock()),
          };
        } else {
          const [route, query] = path.split('?');
          const params = new URLSearchParams(query);
          const chapterId = params.get('chapter');
          const isReview = route.startsWith('/v1/reviews/') && params.get('source') === 'unified';
          const isChallenge = route.startsWith('/v1/challenges/');
          const explicit = chapterId && chapterId !== 'home' ? chapterId : undefined;
          const requested =
            route === '/v1/story' ||
            route === '/v1/story/encounter' ||
            route === '/v1/travel' ||
            route === '/v1/speech/practice' ||
            isReview
              ? explicit
              : undefined;
          const ids = requested
            ? [requested]
            : isReview || isChallenge || route === '/v1/me/export'
              ? Object.keys(state.chapterProgress ?? {})
              : [];
          const adventures = new Map<string, InstalledAdventure>();
          const home =
            !requested &&
            (isReview ||
              isChallenge ||
              [
                '/v1/travel',
                '/v1/story',
                '/v1/story/encounter',
                '/v1/speech/practice',
                '/v1/me/export',
              ].includes(route)) &&
            installedHomeAdventure();
          if (home) adventures.set('home', home);
          for (const id of ids) {
            const pack = await this.options.getChapterCards?.(id);
            const adventure = pack?.chapterId === id ? installedAdventure(pack) : undefined;
            if (adventure) adventures.set(id, adventure);
          }
          if (
            requested &&
            !adventures.has(requested) &&
            (!isReview || !archivedChapterReviews(state).has(requested))
          )
            throw new LocalError('Descarga el capítulo para practicar.', 404);
          result = this.dispatch(state, content, path, body, verb, adventures);
          for (const { chapter, practice, version, definitions } of adventures.values())
            rememberChapterReview(result.state, chapter, practice, version, definitions);
        }
        rememberReviewLessons(result.state, content);
        const serialized = JSON.stringify(result.state);
        if (serialized !== raw) await this.options.store.setItem(OFFLINE_STATE_KEY, serialized);
        return copy(result.value) as T;
      } catch (error) {
        if (error instanceof ZodError)
          throw new LocalError(
            'Revisa los datos: el formato no es válido.',
            400,
            'VALIDATION_ERROR',
          );
        throw error;
      }
    };
    const locked = () => (this.options.lock ? this.options.lock(run) : run());
    const result = this.tail.then(locked, locked);
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
  private attempt(
    state: OfflineState,
    content: CourseData,
    input: AttemptInput,
    aids: LearningAid[] = [],
    playerName?: string,
    context: {
      source?: UnifiedLearningSource;
      aids?: UnifiedLearningAid[];
      retry?: boolean;
      contentVersion?: string;
      contextId?: string;
      remediates?: LearningError[];
      errors?: LearningError[];
      evidenceOutcome?: AnswerOutcome;
      authored?: ChapterPractice;
      scenarioVerdict?: ScenarioVerdict;
    } = {},
  ) {
    const parsed = attemptSchema.parse(input);
    const fingerprint = JSON.stringify(parsed);
    const previous = own(state.attempts, parsed.clientAttemptId);
    if (previous) {
      if (previous.fingerprint !== fingerprint)
        throw new LocalError(
          'Esta actividad ya se guardó con otra respuesta.',
          409,
          'IDEMPOTENCY_CONFLICT',
        );
      return previous.result;
    }
    const lesson =
      context.authored?.lesson ??
      own(content.lessons, parsed.lessonId) ??
      (parsed.lessonId === travelLesson.id ? travelLesson : undefined);
    const exercise =
      context.authored?.step.exercise ?? lesson?.exercises.find((e) => e.id === parsed.exerciseId);
    if (!lesson || !exercise)
      throw new LocalError('Ejercicio no disponible en el curso instalado.', 404);
    const scenarioVerdict: ScenarioVerdict | undefined =
      context.scenarioVerdict ??
      (context.authored?.step.scenarioTurn && {
        outcome: 'ungradable' as const,
        feedbackEs: 'Abre el encuentro para continuar esta conversación.',
      });
    const outcome = scenarioVerdict?.outcome ?? judgeAnswer(exercise, parsed.answer, playerName);
    const correct = outcome === 'target';
    const now = this.clock();
    const learning =
      lesson.id === travelLesson.id || context.authored ? exercise.learning : undefined;
    const date = today(now);
    const introduction =
      exercise.introduction && parsed.answer.text !== undefined
        ? readIntroduction(parsed.answer.text, false, playerName)
        : undefined;
    const identityMismatch = !!(
      playerName &&
      introduction?.name &&
      (introduction.greeting || !exercise.introduction?.greetingRequired) &&
      !matchesIntroductionName(introduction.name, playerName)
    );
    const formCorrect = correct || (identityMismatch && introduction?.form === 'target');
    const contextId = context.contextId ?? exerciseEvidenceContext(exercise, lesson.id);
    const assessesLexicalSense =
      exercise.type === 'meaning' && exercise.vocabularyIds?.length === 1;
    const checksErrors =
      context.errors ?? (exercise.spelling ? ['letter_order'] : exerciseCheckedErrors(exercise));
    const errorType = scenarioVerdict
      ? scenarioVerdict.error
      : outcome === 'context_mismatch' &&
          context.authored?.reviewedDigest &&
          learning?.errorAnswers?.past_order?.some((sample) =>
            equivalentAnswerText(parsed.answer.text ?? '', sample),
          )
        ? 'past_order'
        : !formCorrect && outcome !== 'ungradable' && outcome !== 'context_mismatch'
          ? (introduction?.error ??
            (exercise.spelling ? 'letter_order' : undefined) ??
            (assessesLexicalSense &&
            !learning &&
            exercise.options?.some(({ id }) => id === parsed.answer.optionId)
              ? 'vocabulary_sense'
              : findLearningError(
                  learning ?? {
                    conceptId: exercise.skillId,
                    skill: 'writing',
                    evidence: 'production',
                    contextId,
                    errors: checksErrors,
                  },
                  parsed.answer,
                  exercise.acceptedAnswers,
                )))
          : undefined;
    const supports = new Set<UnifiedLearningAid>([
      ...aids.filter((aid): aid is Exclude<LearningAid, 'none'> => aid !== 'none'),
      ...(context.aids ?? []),
    ]);
    if (parsed.hintUsed && !supports.size) supports.add('hint');
    if (learning?.guided) supports.add('guided');
    const retry = !!context.retry || supports.has('retry');
    if (retry) supports.add('retry');
    const source = context.source ?? (lesson.id === travelLesson.id ? 'story' : 'study');
    const prerequisites =
      (source === 'review' || source === 'remediation') && !supports.has('starter')
        ? reviewPrerequisites(
            content,
            lesson,
            exercise,
            formalTeachingKeys(state.unifiedLearning),
            formalDefinitions(
              content,
              archivedReviewLessons(state).map(({ lesson }) => lesson),
              context.authored?.definitions,
            ),
            context.authored?.step.requires,
          )
        : { missing: [] };
    const evidenceOutcome =
      context.evidenceOutcome ?? (prerequisites?.missing.length === 0 ? undefined : 'ungradable');
    const evidencedTargets = scenarioVerdict
      ? (scenarioVerdict.targets ?? [])
      : outcome === 'context_mismatch' && errorType === 'past_order'
        ? (context.authored?.step.targets ?? []).filter(
            ({ targetId, dimension }) =>
              targetId === learning?.conceptId && dimension === 'grammar_production',
          )
        : context.authored?.step.targets
          ? rpgAnswerTargets(context.authored.step, parsed.answer, outcome)
          : exerciseEvidenceTargets(exercise, lesson.id, parsed.answer);
    const actualAlternative =
      !!scenarioVerdict?.targets?.length && outcome === 'communication_only';
    recordUnifiedEvidence(state.unifiedLearning, {
      id: parsed.clientAttemptId,
      source,
      materialId: lesson.id,
      exerciseId: exercise.id,
      materialVersion:
        context.contentVersion ??
        (lesson.id === travelLesson.id
          ? `home:${chapter.revision}`
          : studyMaterialVersion(content, lesson.id)),
      timestamp: now,
      contextId,
      format: exercise.type,
      activity: 'answer',
      outcome: evidenceOutcome ?? outcome,
      languageOutcome:
        !evidenceOutcome && (actualAlternative || (identityMismatch && formCorrect))
          ? 'target'
          : undefined,
      identityMismatch: identityMismatch ? true : undefined,
      aids: [...supports],
      retry,
      independent: !supports.size,
      targets: [...evidencedTargets],
      error: evidenceOutcome === 'ungradable' ? undefined : errorType,
      errors: checksErrors,
      remediates: context.remediates ?? learning?.remediates,
      transfer: learning?.evidence === 'transfer',
    });
    const identityFeedback = `Usa tu propio nombre para presentarte: ${playerName}.`;
    const model = scenarioVerdict
      ? undefined
      : exercise.introduction && playerName
        ? exercise.introduction.model.replace('[tu nombre]', () => playerName)
        : exercise.spelling
          ? playerName
            ? spellingModel(playerName)
            : exercise.spelling.model
          : displayedAnswer(exercise);
    let visited = own(state.visitedExercises, lesson.id);
    if (!visited) {
      visited = [];
      set(state.visitedExercises, lesson.id, visited);
    }
    if (!visited.includes(exercise.id)) visited.push(exercise.id);
    if (!state.learningDays.includes(date)) state.learningDays.push(date);
    const countLegacy =
      !scenarioVerdict &&
      !context.authored?.step.answerEvidence &&
      (!context.authored || evidenceOutcome !== 'ungradable');
    if (
      outcome === 'communication_only' ||
      outcome === 'ungradable' ||
      (identityMismatch && !formCorrect)
    ) {
      const communicates = outcome === 'communication_only';
      if (communicates && learning && countLegacy)
        recordCommunicationSuccess((state.travelLearning ??= { targets: [] }), learning, {
          exerciseId: exercise.id,
          now,
        });
      const result: AttemptResult = {
        correct: false,
        outcome,
        ...(communicates ? { communicationOnly: true, acceptedAnswer: model } : {}),
        ...(identityMismatch ? { identityMismatch: true, acceptedAnswer: model } : {}),
        feedbackEs: identityMismatch
          ? identityFeedback
          : (scenarioVerdict?.feedbackEs ??
            (communicates
              ? (exercise.communicationOnly?.feedbackEs ??
                'Lograste comunicarte. Puedes practicar la expresión indicada.')
              : (exercise.ungradable?.feedbackEs ?? 'Faltan datos para evaluar esta respuesta.'))),
        xpAwarded: 0,
        pending: false,
      };
      set(state.attempts, parsed.clientAttemptId, { fingerprint, result });
      return result;
    }
    let unassisted = !parsed.hintUsed;
    if (learning && learning.skill !== 'speaking' && countLegacy) {
      const support = parsed.hintUsed && !aids.length ? (['hint'] as const) : aids;
      unassisted = recordLearningAttempt(
        (state.travelLearning ??= { targets: [] }),
        { ...exercise, learning },
        formCorrect,
        [...support],
        errorType,
        now,
      );
    }
    if (learning && correct && exercise.communicationOnly && countLegacy)
      recordCommunicationSuccess((state.travelLearning ??= { targets: [] }), learning);
    let xpAwarded = 0;
    const dimension = exercise.dimension ?? 'grammar_understanding';
    const targets = dimension.startsWith('vocabulary_')
      ? (exercise.vocabularyIds ?? [])
      : [exercise.skillId];
    for (const targetId of countLegacy ? new Set(targets) : []) {
      const key = `${dimension}:${targetId}`;
      let mastery = state.mastery.find((m) => m.targetId === targetId && m.dimension === dimension);
      if (!mastery) {
        mastery = {
          skillId: exercise.skillId,
          targetId,
          dimension,
          practicedFormats: [],
          practicedExerciseIds: [],
          value: 0,
          evidenceCount: 0,
          unpromptedSuccessCount: 0,
          lastPracticedAt: new Date(now).toISOString(),
          nextReviewAt: new Date(now + dayMs).toISOString(),
          lastDelayedSuccessAt: null,
        };
        state.mastery.push(mastery);
      }
      if (own(state.skillDayBaseline, key)?.day !== date)
        set(state.skillDayBaseline, key, {
          day: date,
          lastPracticedAt: mastery.evidenceCount ? mastery.lastPracticedAt : null,
        });
      const evidenceKey = `evidence:${date}:${exercise.id}:${key}`;
      if (state.reviewRewards.includes(evidenceKey)) continue;
      const independent =
        (dimension === 'vocabulary_recall' || dimension === 'grammar_production') &&
        exercise.type === 'short_text' &&
        unassisted;
      const baseline = own(state.skillDayBaseline, key)!.lastPracticedAt;
      const delayed =
        formCorrect && unassisted && baseline !== null && Date.parse(baseline) <= now - dayMs;
      mastery.evidenceCount++;
      if (formCorrect && independent) mastery.unpromptedSuccessCount++;
      if (formCorrect && !mastery.practicedFormats.includes(exercise.type))
        mastery.practicedFormats.push(exercise.type);
      if (formCorrect && !mastery.practicedExerciseIds.includes(exercise.id))
        mastery.practicedExerciseIds.push(exercise.id);
      if (delayed) mastery.lastDelayedSuccessAt = new Date(now).toISOString();
      // Delayed success is always needed beyond the initial range. A production
      // target with one authored prompt can also qualify through repeated unaided
      // answers; evidence deduplication still counts that prompt only once per day.
      // Recognition and independent production remain different targets at every stage.
      const varied =
        mastery.practicedFormats.length >= 2 || mastery.practicedExerciseIds.length >= 2;
      const repeatedProduction =
        dimension === 'grammar_production' && mastery.unpromptedSuccessCount >= 3;
      const ceiling = mastery.lastDelayedSuccessAt && (varied || repeatedProduction) ? 0.95 : 0.65;
      mastery.value = Math.max(
        0,
        Math.min(ceiling, mastery.value + (formCorrect ? (independent ? 0.12 : 0.06) : -0.03)),
      );
      if (delayed && independent) {
        const reward = `review:${date}:${key}`;
        if (!state.reviewRewards.includes(reward)) {
          state.reviewRewards.push(reward);
          state.xp += 5;
          xpAwarded += 5;
        }
      }
      const interval =
        formCorrect && mastery.lastDelayedSuccessAt
          ? [1, 3, 7, 14][Math.min(3, Math.floor(mastery.evidenceCount / 3))]
          : 1;
      mastery.lastPracticedAt = new Date(now).toISOString();
      mastery.nextReviewAt = new Date(now + interval * dayMs).toISOString();
      state.reviewRewards.push(evidenceKey);
    }
    const result: AttemptResult = {
      correct,
      outcome,
      identityMismatch: identityMismatch ? true : undefined,
      feedbackEs: identityMismatch
        ? `La estructura en inglés es correcta. ${identityFeedback}`
        : outcome === 'context_mismatch'
          ? (scenarioVerdict?.feedbackEs ??
            exercise.contextMismatch?.feedbackEs ??
            exercise.feedbackEs)
          : `${correct ? '¡Muy bien!' : 'Buen intento. Puedes volver a intentarlo.'}${errorType ? ` ${learningErrorFeedback[errorType]}` : ''} ${scenarioVerdict?.feedbackEs ?? exercise.feedbackEs}`,
      acceptedAnswer: model,
      errorType,
      xpAwarded,
      pending: false,
    };
    set(state.attempts, parsed.clientAttemptId, { fingerprint, result });
    return result;
  }
  private dispatch(
    state: OfflineState,
    content: CourseData,
    path: string,
    body: unknown,
    method: string,
    adventures: ReadonlyMap<string, InstalledAdventure>,
  ): { state: OfflineState; value: unknown } {
    const [route, query = ''] = path.split('?');
    const params = new URLSearchParams(query);
    const now = this.clock();
    const done = (value: unknown) => ({ state, value });
    const requestedChapterId = params.get('chapter') ?? '';
    const homeJourney = [
      '/v1/story',
      '/v1/story/encounter',
      '/v1/travel',
      '/v1/speech/practice',
    ].includes(route);
    const adventure = adventures.get(requestedChapterId || (homeJourney ? 'home' : ''));
    const activeChapter = adventure?.chapter ?? chapter;
    const definition = adventure?.definition ?? chapterStory;
    const isHomeChapter = activeChapter.id === 'home';
    const reviewedLessons = Object.fromEntries(
      [...adventures.values()].flatMap(({ lessons }) => [...lessons]),
    );
    const reviewContent = adventures.size
      ? { ...content, lessons: { ...reviewedLessons, ...content.lessons } }
      : content;
    const unavailableArchives =
      route.startsWith('/v1/reviews/') && params.get('source') === 'unified'
        ? [...archivedChapterReviews(state)].filter(([id, archive]) => {
            if (requestedChapterId && id !== requestedChapterId) return false;
            const installed = adventures.get(id);
            return (
              !installed ||
              Number(installed.version.split(':')[1]) < Number(archive.version.split(':')[1])
            );
          })
        : [];
    const archivesByChapter = new Map(unavailableArchives);
    const chapterPractice = [
      ...(requestedChapterId ? (adventure ? [adventure] : []) : [...adventures.values()])
        .filter(({ chapter }) => !archivesByChapter.has(chapter.id))
        .flatMap(({ practice }) => practice),
      ...unavailableArchives.flatMap(([, archive]) => archive.practice),
    ];
    const adventureExercises = new Map(
      chapterPractice.map((entry) => [entry.step.exercise.id, entry]),
    );
    const journey = () => {
      if (!adventure || isHomeChapter) return state;
      const progress = (state.chapterProgress ??= {});
      let entry = own(progress, activeChapter.id);
      if (!entry) {
        entry = { travel: emptyTravel() };
        set(progress, activeChapter.id, entry);
      }
      return entry;
    };
    const homeVersion = `home:${chapter.revision}`;
    const auditedExercise = (step: TravelExerciseStep) =>
      !isHomeChapter || !!step.lessonId || !!activeChapter.reviewedHomeCore;
    const adventurePrerequisites = (step: TravelExerciseStep) => {
      if (!adventure) return;
      if (activeChapter.reviewedHomeCore && !step.lessonId) {
        const requires = reviewedHomeRequirements(step);
        if (!requires) return;
        return reviewPrerequisites(
          reviewContent,
          travelLesson,
          step.exercise,
          formalTeachingKeys(state.unifiedLearning),
          adventure.definitions,
          requires,
        );
      }
      const reviewed = adventure.exercises.get(step.exercise.id);
      if (!reviewed?.reviewedDigest) return;
      return reviewPrerequisites(
        reviewContent,
        reviewed.lesson,
        step.exercise,
        formalTeachingKeys(state.unifiedLearning),
        adventure.definitions,
        step.requires,
      );
    };
    const canSkipKnown = (step: TravelExerciseStep) =>
      !step.scenarioTurn &&
      !!step.targets?.length &&
      adventurePrerequisites(step)?.missing.length === 0 &&
      step.targets.every(({ targetId, dimension }) => {
        const mastery = getUnifiedMastery(state.unifiedLearning, targetId, dimension);
        return (
          masteryAtLeast(mastery.state, 'demonstrated') &&
          !mastery.needsReview &&
          (!mastery.nextReviewAt || Date.parse(mastery.nextReviewAt) > now)
        );
      });
    const travelView = (travel: TravelState): TravelState => {
      const current = travel.active;
      if (!adventure || !current || current.finished || current.result) return travel;
      const mission = activeChapter.missions.find(({ id }) => id === current.missionId);
      const step = mission?.steps[current.step];
      if (step?.type !== 'exercise' || !auditedExercise(step)) return travel;
      const prerequisites = adventurePrerequisites(step);
      if (prerequisites?.missing.length === 0)
        return (mission?.optional || (step.skipWhenMastered && step.exercise.learning?.guided)) &&
          canSkipKnown(step)
          ? { ...travel, active: { ...current, canSkipKnown: true } }
          : travel;
      const instruction = prerequisites?.instruction;
      return {
        ...travel,
        active: {
          ...current,
          ...(instruction
            ? { prerequisiteInstruction: { sections: instruction.sections } }
            : { prerequisiteUnavailable: true }),
          ...(adventure.requiresUpdate && { prerequisiteUpdateRequired: true }),
        },
      };
    };
    const exposeHome = (
      source: 'story' | 'study',
      token: string,
      itemId: string,
      contextId: string,
      translation: boolean,
      format: 'instruction' | 'dialogue' | 'single_choice',
      targets: LearningEvidence['targets'],
      outcome?: 'target' | 'incorrect',
      teaches?: LearningEvidence['teaches'],
    ) => {
      if (targets.length || teaches?.length)
        recordUnifiedEvidence(state.unifiedLearning, {
          id: `home:${token}:${itemId}`,
          source,
          materialId: travelLesson.id,
          exerciseId: itemId,
          materialVersion: homeVersion,
          timestamp: now,
          contextId,
          format,
          activity: outcome ? 'answer' : 'introduced',
          outcome,
          aids: [
            ...(translation ? (['translation'] as const) : []),
            ...(outcome ? (['guided'] as const) : []),
          ],
          retry: false,
          independent: false,
          targets,
          teaches,
        } satisfies LearningEvidence);
    };
    const changeTravel = (
      travel: TravelState,
      operation: unknown,
      source: 'story' | 'study',
      entryStepId?: string,
    ) =>
      updateTravel(
        travel,
        operation,
        now,
        this.id,
        (input, aids, conditions) => {
          const authored = adventure?.exercises.get(input.exerciseId);
          if (adventure && (!isHomeChapter || authored) && !authored?.reviewedDigest)
            throw new LocalError('Esta actividad no está instalada.', 404);
          const requiresSelectedName = !!authored?.step.exercise.spelling;
          const identifiesPlayer =
            !!authored?.step.exercise.introduction ||
            (isHomeChapter &&
              (input.exerciseId === 'travel_hello_write' ||
                input.exerciseId === 'travel_hello_transfer'));
          const playerName =
            identifiesPlayer || requiresSelectedName
              ? (travel.practiceName ??
                playerIntroductionName(state.user.name) ??
                travel.introductionName)
              : undefined;
          const result = this.attempt(state, content, input, aids, playerName, {
            source,
            contentVersion: adventure?.version ?? homeVersion,
            authored,
            retry: conditions.retry,
            scenarioVerdict: conditions.scenarioVerdict,
            ...(conditions.referenceAnswer && { aids: ['answer_shown'] }),
            ...(conditions.missingAudio &&
              (!isHomeChapter || !aids.includes('transcript')) && {
                evidenceOutcome: 'ungradable',
              }),
          });
          if (identifiesPlayer && !playerName && (result.correct || result.communicationOnly))
            travel.introductionName = readIntroduction(input.answer.text ?? '').name;
          return result;
        },
        (target, practice) =>
          recordSpeakingPractice((state.travelLearning ??= { targets: [] }), target, practice),
        entryStepId,
        ({ itemId, missionId, token, translation, word }) => {
          const mission = activeChapter.missions.find(({ id }) => id === missionId);
          const step = mission?.steps.find(({ id }) => id === itemId);
          if (adventure && (!isHomeChapter || (step?.type === 'teach' && step.instruction))) {
            if (!mission || step?.type !== 'teach' || !step.instruction || !adventure.audit) return;
            const vocabulary = travelStepVocabulary(mission, step);
            if (own(adventure.audit.teaching, step.id) !== rpgTeachingDigest(step, vocabulary))
              return;
            const { instruction } = step;
            const stage = word === undefined ? 'grammar' : 'vocabulary';
            if (instruction.stage !== 'both' && instruction.stage !== stage) return;
            const teaches =
              stage === 'grammar'
                ? instruction.references
                : vocabulary.find(({ term }) => term === word)?.teaches;
            if (!exactRpgReferences(teaches, adventure.definitions)) return;
            recordUnifiedEvidence(state.unifiedLearning, {
              id: `rpg-instruction:${activeChapter.id}:${token}:${itemId}`,
              source,
              materialId: instruction.lessonId,
              exerciseId: itemId,
              materialVersion: adventure.version,
              timestamp: now,
              contextId: missionId,
              format: 'instruction',
              activity: 'introduced',
              aids: translation ? ['guided', 'translation'] : ['guided'],
              retry: false,
              independent: false,
              targets: rpgIntroductionTargets(teaches, adventure.definitions),
              teaches: [...teaches],
            });
            return;
          }
          exposeHome(
            source,
            token,
            itemId,
            missionId,
            translation,
            'instruction',
            homeTeachingEvidenceTargets(itemId, word),
            undefined,
            reviewedHomeInstruction(step, word),
          );
        },
        activeChapter,
        adventure && {
          appliesToTeaching: (step) => !isHomeChapter || !!step.instruction,
          allow: (step) =>
            !auditedExercise(step) || adventurePrerequisites(step)?.missing.length === 0,
          canSkipKnown,
          prepare: (step, token) => {
            const instruction = adventurePrerequisites(step)?.instruction;
            if (!instruction) return false;
            recordUnifiedEvidence(state.unifiedLearning, {
              id: `rpg-instruction:${activeChapter.id}:${token}:prepare`,
              source,
              materialId: step.lessonId ?? travelLesson.id,
              exerciseId: step.exercise.id,
              materialVersion: adventure.version,
              timestamp: now,
              contextId: exerciseEvidenceContext(step.exercise, step.lessonId ?? travelLesson.id),
              format: 'instruction',
              activity: 'introduced',
              aids: ['guided'],
              retry: false,
              independent: false,
              targets: rpgIntroductionTargets(instruction.teaches, adventure.definitions),
              teaches: instruction.teaches,
            });
            return true;
          },
        },
      );
    if (route.startsWith('/v1/auth/') || route.startsWith('/v1/sync/'))
      throw new LocalError(
        'Esta edición funciona sin cuenta ni sincronización en línea.',
        410,
        'ONLINE_SERVICE_DISABLED',
      );
    if (route === '/health')
      return done({ status: 'ok', mode: 'offline', storage: 'device', paidProviders: false });
    if (route === '/v1/speech/practice' && method === 'POST') {
      const practice = recordSpeechPractice(
        state.unifiedLearning,
        content,
        body,
        now,
        activeChapter,
        adventure?.version,
      );
      if (!practice) throw new LocalError('La práctica oral no está disponible.', 404);
      return done(practice);
    }
    if (route === '/v1/catalog')
      return done({
        units: content.units,
        placementAvailable: content.placementQuestions.length > 0,
        contentVersion: 1,
        contentStatus: 'draft',
        locale: 'es-419',
        mode: 'offline',
      });
    if (route === '/v1/me/progress') return done(progress(state, now));
    if (
      !chapter.missions.length &&
      ((!adventure && route.startsWith('/v1/story')) ||
        route === '/v1/travel/placement' ||
        (route === '/v1/reviews/quick' && params.get('source') === 'travel'))
    )
      throw new LocalError('Descarga La primera postal para continuar.', 404);
    if (route === '/v1/travel/placement') {
      if (method === 'GET') return done({ questions: placementQuestions(publicExercise) });
      const travel = (state.travel ??= emptyTravel());
      const { placement, responses, assessmentId } = assessTravelPlacement(
        body,
        chapter.reviewedHomeCore,
      );
      for (const { exercise, transcript, outcome } of responses)
        recordAssessmentAnswer(
          state,
          exercise,
          {
            id: `placement:home:${assessmentId ?? `${outcome}:${transcript}`}:${exercise.id}`,
            source: 'placement',
            materialId: travelLesson.id,
            materialVersion: `home:${chapter.revision}`,
            timestamp: now,
            outcome,
          },
          transcript ? ['transcript'] : [],
        );
      travel.placement = placement;
      const preceding = chapter.missions.slice(
        0,
        chapter.missions.findIndex((m) => m.id === placement.missionId),
      );
      travel.cleared = (['hello', 'bus'] as const).filter(
        (id) => travel.cleared?.includes(id) || preceding.some((m) => m.id === id),
      );
      return done({ placement, travel });
    }
    if (route === '/v1/travel') {
      const travel = (journey().travel ??= emptyTravel());
      upgradeTravelCheckpoints(travel, activeChapter, this.id);
      if (method === 'POST')
        changeTravel(travel, body, params.get('source') === 'story' ? 'story' : 'study');
      const view = travelView(travel);
      return done(
        method === 'GET' && isHomeChapter
          ? {
              ...view,
              foundationPath: foundationPath(
                activeChapter,
                travel,
                state.unifiedLearning,
                now,
                adventure?.practice.map(({ step }) => step),
              ),
            }
          : view,
      );
    }
    if (route === '/v1/story' || (route === '/v1/story/encounter' && method === 'POST')) {
      const progress = journey();
      const travel = (progress.travel ??= emptyTravel());
      const firstVisit = method === 'GET' && route === '/v1/story' && !progress.story;
      const story = (progress.story ??= emptyStory(definition));
      if (story.revision > definition.revision)
        throw new LocalError(
          !isHomeChapter
            ? 'Actualiza el capítulo para continuar con esta partida.'
            : 'Actualiza La primera postal para continuar con esta partida.',
          409,
        );
      upgradeTravelCheckpoints(travel, activeChapter, this.id);
      upgradeStory(definition, story);
      const context = () =>
        storyContext(
          story,
          travel,
          state.travelLearning,
          state.unifiedLearning,
          definition,
          activeChapter,
          travel.country ?? state.travel?.country,
          now,
        );
      const before = story.encounterId;
      let launch = false;
      if (route === '/v1/story/encounter') {
        const request = z
          .object({ turn: z.number().int().nonnegative().safe() })
          .strict()
          .parse(body);
        launch = resumeStoryEncounter(story, request.turn);
      } else if (method === 'POST') {
        updateStory(
          definition,
          story,
          context(),
          body,
          ({ kind, itemId, dialogueId, token, translation }) => {
            if (!isHomeChapter) return;
            const guided = kind === 'guided';
            exposeHome(
              'story',
              token,
              itemId,
              dialogueId,
              translation,
              guided ? 'single_choice' : 'dialogue',
              guided ? homeChoiceEvidenceTargets(itemId) : homeTeachingEvidenceTargets(itemId),
              guided ? (itemId === 'luz-practice-is' ? 'incorrect' : 'target') : undefined,
            );
          },
        );
        launch = story.encounterId !== before;
        if (launch && before && travel.active?.finished) {
          const previous = definition.encounters.find((entry) => entry.id === before);
          if (travel.active.missionId === previous?.missionId)
            changeTravel(travel, { action: 'dismiss', token: travel.active.token }, 'story');
        }
      }
      const view = readStory(definition, story, context());
      if (
        view.encounter &&
        !view.encounter.ready &&
        (launch ||
          (view.encounter.entryStepId &&
            !view.encounter.suspended &&
            travel.active?.missionId === view.encounter.missionId))
      ) {
        const { missionId, entryStepId } = view.encounter;
        changeTravel(travel, { action: 'start', missionId }, 'story', entryStepId);
        if (travel.active?.missionId !== missionId)
          throw new LocalError('Completa la misión anterior para continuar.', 409);
      }
      return done({
        story: view,
        travel: travelView(travel),
        ...(firstVisit && { firstVisit: true }),
      } satisfies StoryResponse);
    }
    if (route === '/v1/travel/learning' && method === 'GET')
      return done(state.travelLearning ?? { targets: [] });
    if (route === '/v1/lessons/resume') {
      const recent = Object.keys(state.lessonCheckpoints ?? {})
        .reverse()
        .filter((id) => own(content.lessons, id));
      return done(params.get('all') === 'true' ? recent : (recent[0] ?? null));
    }
    const studyMatch = route.match(/^\/v1\/lessons\/([^/]+)\/(learning|study-events)$/);
    if (studyMatch) {
      const lesson = own(content.lessons, studyMatch[1]);
      if (!lesson) throw new LocalError('Esta lección no está instalada.', 404);
      if (studyMatch[2] === 'learning')
        return done(
          studyLearningStatus(state.unifiedLearning, state.completedLessons, content, lesson, now),
        );
      const input = z
        .discriminatedUnion('action', [
          z.object({ action: z.literal('skip'), eventId: z.string().min(8).max(100) }).strict(),
          z.object({ action: z.literal('reference') }).strict(),
        ])
        .parse(body);
      if (input.action === 'reference') {
        studyIntroduction(state, content, lesson, 'vocabulary', now);
        studyIntroduction(state, content, lesson, 'grammar', now);
        return done({ saved: true });
      }
      const checkpoint = own(state.lessonCheckpoints ?? {}, lesson.id);
      const id =
        checkpoint && lesson.stages?.[checkpoint.stage]?.exerciseIds?.[checkpoint.exercise];
      const exercise = lesson.exercises.find((item) => item.id === id);
      if (
        !checkpoint ||
        checkpoint.eventId !== input.eventId ||
        !exercise ||
        !canSkipStudyExercise(
          state.unifiedLearning,
          state.completedLessons,
          content,
          lesson,
          exercise,
          now,
        )
      )
        throw new LocalError(
          'Todavía puedes practicar este ejercicio.',
          409,
          'STUDY_SKIP_UNAVAILABLE',
        );
      const version = studyMaterialVersion(content, lesson.id);
      if (checkpoint.skippedVersion !== version) {
        checkpoint.skippedVersion = version;
        checkpoint.skipped = [];
      }
      if (!checkpoint.skipped?.includes(exercise.id)) (checkpoint.skipped ??= []).push(exercise.id);
      return done({ saved: checkpoint });
    }
    const checkpointMatch = route.match(/^\/v1\/lessons\/([^/]+)\/checkpoint$/);
    if (checkpointMatch) {
      const lesson = own(content.lessons, checkpointMatch[1]);
      if (!lesson) throw new LocalError('Esta lección no está instalada.', 404);
      const checkpoints = (state.lessonCheckpoints ??= {});
      if (method === 'DELETE') delete checkpoints[lesson.id];
      if (method === 'POST') {
        const parsed = lessonCheckpointSchema.parse(body);
        const prior = own(checkpoints, lesson.id);
        const sameActivity = prior?.activityId === parsed.activityId;
        const next = {
          ...parsed,
          skipped: sameActivity ? prior.skipped : undefined,
          skippedVersion: sameActivity ? prior.skippedVersion : undefined,
        };
        const stage = lesson.stages?.[next.stage];
        if (stage?.type === 'vocabulary' && next.exercise < 0) {
          const item = lesson.vocabulary?.[next.vocabulary];
          if (item)
            studyIntroduction(state, content, lesson, 'vocabulary', now, { wordId: item.id });
        }
        if (stage?.type === 'grammar' && next.exercise < 0)
          studyIntroduction(state, content, lesson, 'grammar', now, {});
        delete checkpoints[lesson.id];
        set(checkpoints, lesson.id, next);
      }
      let saved = own(checkpoints, lesson.id);
      const stages = lesson.stages ?? [];
      const stage = saved && stages[saved.stage];
      if (
        !saved ||
        !stage ||
        (stage.type === 'vocabulary' && saved.vocabulary >= (lesson.vocabulary?.length ?? 0)) ||
        saved.exercise >= (stage.exerciseIds?.length ?? 0)
      )
        return done(null);
      // Resume newly added practice before completion. / Retoma la práctica nueva antes de completar.
      if (method === 'GET' && stage.type === 'speaking') {
        const skipped =
          saved.skippedVersion === studyMaterialVersion(content, lesson.id)
            ? saved.skipped
            : undefined;
        const visited = own(state.visitedExercises, lesson.id) ?? [];
        const remaining = stages.map(
          ({ exerciseIds }) =>
            exerciseIds?.findIndex((id) => !visited.includes(id) && !skipped?.includes(id)) ?? -1,
        );
        const nextStage = remaining.findIndex((index) => index >= 0);
        if (nextStage >= 0) {
          saved = {
            ...saved,
            eventId: this.id(),
            stage: nextStage,
            exercise: remaining[nextStage],
            vocabulary: 0,
            answer: {},
            hint: false,
            help: false,
            retry: false,
            referenceUsed: false,
          };
          set(checkpoints, lesson.id, saved);
        }
      }
      const result = own(state.attempts, saved.eventId)?.result;
      return done({ saved, result });
    }
    if (route === '/v1/reviews/quick') {
      const travelOnly = params.get('source') === 'travel';
      const courseOnly = params.get('source') === 'course';
      const unified = params.get('source') === 'unified';
      const target = travelOnly || unified ? params.get('target') : null;
      const mission = travelOnly || unified ? params.get('mission') : null;
      const reviewKey = target ? `target:${target}` : mission ? `mission:${mission}` : undefined;
      const archivedChapter = archivesByChapter.get(requestedChapterId);
      const chapterScoped = !!(adventure || archivedChapter);
      const scopedKey = chapterScoped
        ? `chapter:${requestedChapterId}:${reviewKey ?? 'all'}`
        : reviewKey;
      if (
        chapterScoped &&
        mission &&
        (archivedChapter
          ? !Object.hasOwn(archivedChapter.missionTargets, mission)
          : !activeChapter.missions.some(({ id }) => id === mission))
      )
        throw new LocalError('Esta misión no está disponible.', 404);
      const checkpointKey = travelOnly || unified ? 'travelQuickReview' : 'quickReview';
      const travelStarter = travelLesson.exercises[0];
      const archive = unified ? archivedReviewLessons(state) : [];
      const archiveById = new Map(
        archive.map(({ lesson, version }) => [lesson.id, { lesson, version }]),
      );
      const lessons = travelOnly
        ? [travelLesson]
        : [
            ...Object.values(content.lessons),
            ...(courseOnly ? [] : [travelLesson]),
            ...archive.map(({ lesson }) => lesson),
          ];
      const update =
        method === 'POST'
          ? z
              .discriminatedUnion('action', [
                z
                  .object({
                    action: z.literal('draft'),
                    token: z.string(),
                    answer: draftAnswerSchema,
                  })
                  .strict(),
                z
                  .object({ action: z.literal('answer'), token: z.string(), answer: answerSchema })
                  .strict(),
                z
                  .object({
                    action: z.enum([
                      'dismiss',
                      'hint',
                      'transcript',
                      'listened',
                      'prepare',
                      'continue',
                      'retry',
                    ]),
                    token: z.string(),
                  })
                  .strict(),
              ])
              .parse(body)
          : undefined;
      const checkpoints = state.travelReviewCheckpoints ?? {};
      const missionTargets = archivedChapter
        ? new Set(
            mission
              ? archivedChapter.missionTargets[mission]
              : Object.values(archivedChapter.missionTargets).flat(),
          )
        : adventure
          ? new Set(
              [
                ...activeChapter.missions
                  .filter(({ id }) => !mission || id === mission)
                  .flatMap(({ steps }) => steps),
                ...chapterPractice
                  .filter(({ step }) => !mission || step.reviewMissionId === mission)
                  .map(({ step }) => step),
              ].flatMap((step) =>
                step.type === 'exercise' && (step.lessonId || activeChapter.reviewedHomeCore)
                  ? (
                      step.targets ??
                      exerciseEvidenceTargets(step.exercise, step.lessonId ?? travelLesson.id)
                    ).map(({ targetId }) => canonicalLearningId(targetId))
                  : [],
              ),
            )
          : mission
            ? reviewTargetsForMission(mission)
            : undefined;
      let cachedPlans: ReturnType<typeof unifiedReviewPlans> | undefined;
      const plans = () =>
        (cachedPlans ??= unifiedReviewPlans(
          state,
          content,
          createUnifiedReviewCandidates(state, reviewContent, archive, chapterPractice).filter(
            ({ exerciseId }) => !chapterScoped || adventureExercises.has(exerciseId),
          ),
          now,
          mission,
          missionTargets,
          chapterPractice.flatMap(({ definitions }) => definitions ?? []),
        ));
      let recent: Set<string> | undefined;
      const recentExercises = () =>
        (recent ??= new Set(
          state.unifiedLearning.evidence.flatMap((event) =>
            event.source !== 'placement' &&
            event.activity === 'answer' &&
            learningEvidenceOutcome(event) !== 'ungradable' &&
            event.timestamp <= now &&
            now - event.timestamp < dayMs
              ? [event.exerciseId]
              : [],
          ),
        ));
      const scope = {
        key: scopedKey,
        saved: scopedKey ? own(checkpoints, scopedKey) : state[checkpointKey],
      };
      const recovery = unified
        ? [
            ...Object.entries(checkpoints).map(([key, saved]) => ({ key, saved })),
            { key: undefined, saved: state.travelQuickReview },
          ]
            .filter(
              ({ saved }) =>
                saved?.remediation &&
                saved.reviewKey &&
                (!chapterScoped || adventureExercises.has(saved.exerciseId)) &&
                (!target || saved.reviewKey === target) &&
                (!missionTargets ||
                  missionTargets.has(saved.reviewKey.slice(saved.reviewKey.indexOf(':') + 1))),
            )
            .sort(
              (a, b) =>
                Number(b.key?.startsWith('remediation:')) -
                Number(a.key?.startsWith('remediation:')),
            )
        : [];
      const isWaiting = ({ saved }: typeof scope) => {
        if (!saved?.result?.correct || saved.remediation?.phase !== 'support') return false;
        const plan = plans().find(({ row }) => row.key === saved.reviewKey);
        return (
          plan &&
          planRemediation(plan, recentExercises(), saved.remediation.error)?.phase === 'waiting'
        );
      };
      const slot =
        (update && [scope, ...recovery].find(({ saved }) => saved?.token === update.token)) ||
        recovery.find((entry) => target || !isWaiting(entry)) ||
        scope;
      const previous = slot.saved;
      const savedAuthored = previous && adventureExercises.get(previous.exerciseId);
      const remove = (key: string | undefined) => {
        if (key) delete checkpoints[key];
        else delete state[checkpointKey];
      };
      const save = (next: QuickCheckpoint) => {
        const key =
          unified && next.remediation && next.reviewKey
            ? `remediation:${next.reviewKey}`
            : scopedKey;
        if (key) set((state.travelReviewCheckpoints ??= checkpoints), key, next);
        else state[checkpointKey] = next;
        if (next.remediation && previous?.reviewKey === next.reviewKey && slot.key !== key)
          remove(slot.key);
      };
      const savedLesson =
        savedAuthored?.lesson ??
        (previous &&
          lessons.find(
            (lesson) =>
              lesson.id === previous.lessonId &&
              lesson.exercises.some(({ id }) => id === previous.exerciseId),
          ));
      const savedExercise =
        savedAuthored?.step.exercise ??
        savedLesson?.exercises.find((e) => e.id === previous?.exerciseId);
      const existing =
        savedLesson &&
        savedExercise &&
        (savedAuthored ||
          savedLesson.id === travelLesson.id ||
          taughtForReview(state, savedLesson.id, savedExercise) ||
          reviewStarterWord(savedLesson, savedExercise))
          ? savedExercise
          : undefined;
      if (
        previous &&
        existing &&
        !savedAuthored &&
        savedLesson?.id !== travelLesson.id &&
        !taughtForReview(state, previous.lessonId, existing)
      )
        previous.starter = true;
      let definitions: ReturnType<typeof formalDefinitions> | undefined;
      const archivedLessons = archive.map(({ lesson }) => lesson);
      const definitionsFor = (authored?: ChapterPractice) =>
        authored?.definitions?.length
          ? formalDefinitions(reviewContent, archivedLessons, authored.definitions)
          : (definitions ??= formalDefinitions(reviewContent, archivedLessons));
      const prerequisiteFor = (lesson: CourseLesson, exercise: CourseExercise) => {
        const authored = adventureExercises.get(exercise.id);
        return reviewPrerequisites(
          reviewContent,
          lesson,
          exercise,
          formalTeachingKeys(state.unifiedLearning),
          definitionsFor(authored),
          authored?.step.requires,
        );
      };
      const forReview = (
        saved: QuickCheckpoint,
        exercise: CourseExercise,
        waiting = false,
      ): QuickReviewState => {
        const authored = adventureExercises.get(exercise.id);
        const step =
          authored?.step ??
          (saved.lessonId === travelLesson.id ? travelPracticeStep(exercise.id) : undefined);
        const archivedStep =
          saved.lessonId === travelLesson.id && !step
            ? archivedTravelReviewStep(state, exercise.id)
            : undefined;
        const lesson =
          saved.starter && saved.lessonId !== travelLesson.id
            ? lessons.find((entry) => entry.id === saved.lessonId)
            : undefined;
        const word = lesson && reviewStarterWord(lesson, exercise);
        const material =
          unified && !saved.starter && !saved.result && !waiting
            ? (authored?.lesson ??
              lessons.find(
                ({ id, exercises }) =>
                  id === saved.lessonId && exercises.some((item) => item.id === exercise.id),
              ))
            : undefined;
        const prerequisites = material && prerequisiteFor(material, exercise);
        const instruction = prerequisites?.instruction;
        const unavailable =
          material && (!prerequisites || (prerequisites.missing.length && !instruction));
        const guidedSuccess =
          saved.remediation?.phase === 'support' &&
          !!saved.result?.correct &&
          state.unifiedLearning.evidence.some(
            (event) =>
              event.id === saved.token &&
              learningEvidenceOutcome(event) === 'target' &&
              event.aids.includes('guided') &&
              event.remediates?.includes(saved.remediation!.error),
          );
        return {
          ...saved,
          chapterId: authored?.chapterId,
          exercise: publicExercise(
            word
              ? {
                  ...exercise,
                  promptEs: `«${word.en}» significa «${word.es}». ${exercise.promptEs}`,
                }
              : exercise,
          ),
          situation: step?.situation ?? archivedStep?.situation,
          hintText: step?.hint ?? archivedStep?.hint,
          audio: step?.audio,
          authoredAudio: authored?.authoredAudio,
          transcriptText: step?.transcript,
          explanation:
            saved.remediation?.phase === 'support'
              ? learningErrorFeedback[saved.remediation.error]
              : undefined,
          ...(waiting && { waitingForConfirmation: true }),
          ...(guidedSuccess && { guidedSuccess: true }),
          ...(instruction && { prerequisiteInstruction: { sections: instruction.sections } }),
          ...(unavailable && { prerequisiteUnavailable: true }),
        };
      };
      const create = (
        lesson: CourseLesson,
        exercise: CourseExercise,
        starter = false,
        reason?: LearningReviewReason,
        reviewKey?: string,
        remediation?: QuickCheckpoint['remediation'],
        retry = false,
      ) => {
        const saved: QuickCheckpoint = {
          token: this.id(),
          lessonId: lesson.id,
          exerciseId: exercise.id,
          answer: {},
          starter,
          reason,
          reviewKey,
          remediation,
          ...(retry && { retry }),
        };
        save(saved);
        return done(forReview(saved, exercise));
      };
      const nextRemediation = (reviewKey: string | undefined, error?: LearningError) => {
        const plan = plans().find(({ row }) => row.key === reviewKey);
        return plan && planRemediation(plan, recentExercises(), error);
      };
      const supportAlreadyConfirmed = (saved: QuickCheckpoint) =>
        saved.remediation?.phase === 'support' &&
        !!saved.result?.correct &&
        !!plans().find(
          ({ row, mastery }) =>
            row.key === saved.reviewKey &&
            !mastery.pendingErrors.includes(saved.remediation!.error),
        );
      const resumeSupported = (saved: QuickCheckpoint, exercise: CourseExercise) => {
        if (saved.remediation?.phase !== 'support' || !saved.result?.correct) return;
        const next = nextRemediation(saved.reviewKey, saved.remediation.error);
        if (next?.phase === 'waiting') return done(forReview(saved, exercise, true));
        if (next?.phase === 'confirmation')
          return create(
            next.candidate.lesson,
            next.candidate.exercise,
            false,
            'remediation',
            saved.reviewKey,
            { phase: 'confirmation', error: next.error },
          );
      };
      if (update) {
        if (previous && existing && update.token === previous.token) {
          if (update.action === 'continue' && unified) {
            if (supportAlreadyConfirmed(previous)) {
              remove(slot.key);
              return done(null);
            }
            return resumeSupported(previous, existing) ?? done(forReview(previous, existing));
          }
          if (
            update.action === 'retry' &&
            previous.result &&
            previous.remediation?.phase === 'support'
          ) {
            const next = nextRemediation(previous.reviewKey, previous.remediation.error);
            if (next?.phase === 'confirmation' || next?.phase === 'waiting')
              return done(forReview(previous, existing));
            return create(
              savedLesson!,
              existing,
              previous.starter,
              previous.reason,
              previous.reviewKey,
              previous.remediation,
              true,
            );
          }
          if (update.action === 'dismiss' && previous.result) {
            if (unified && previous.remediation?.phase === 'support')
              return done(forReview(previous, existing));
            remove(slot.key);
            return done(null);
          }
          if (!previous.result) {
            const step =
              savedAuthored?.step ??
              (previous.lessonId === travelLesson.id ? travelPracticeStep(existing.id) : undefined);
            if (update.action === 'draft') {
              previous.answer = update.answer;
              if (unified) return done(null);
            }
            if (
              update.action === 'hint' &&
              (step?.hint || archivedTravelReviewStep(state, existing.id)?.hint)
            )
              previous.hint = true;
            if (update.action === 'transcript' && step?.transcript) previous.transcript = true;
            if (update.action === 'listened' && step?.audio) previous.listened = true;
            const archivedVersion = archiveById.get(previous.lessonId);
            const isArchived = savedLesson === archivedVersion?.lesson;
            const prerequisites =
              unified &&
              !previous.starter &&
              (update.action === 'prepare' || update.action === 'answer')
                ? prerequisiteFor(savedLesson!, existing)
                : undefined;
            if (update.action === 'prepare' && prerequisites?.instruction) {
              const version =
                savedAuthored?.version ??
                (isArchived ? archivedVersion?.version : undefined) ??
                (previous.lessonId === travelLesson.id
                  ? `home:${chapter.revision}`
                  : studyMaterialVersion(content, previous.lessonId));
              recordReviewInstruction(
                state.unifiedLearning,
                savedLesson!,
                existing,
                prerequisites.instruction,
                now,
                previous.token,
                version,
                savedAuthored &&
                  rpgIntroductionTargets(
                    prerequisites.instruction.teaches,
                    definitionsFor(savedAuthored),
                  ),
              );
              previous.prerequisite = 'prepared';
            }
            if (update.action === 'answer') {
              if (unified && !previous.starter && (!prerequisites || prerequisites.missing.length))
                return done(forReview(previous, existing));
              const aids: LearningAid[] = [];
              if (previous.starter) aids.push('starter');
              if (previous.hint) aids.push('hint');
              if (previous.transcript) aids.push('transcript');
              if (previous.remediation?.phase === 'support') aids.push('guided');
              if (previous.retry) aids.push('retry');
              const gradingContent =
                isArchived && savedLesson
                  ? { ...content, lessons: { ...content.lessons, [savedLesson.id]: savedLesson } }
                  : reviewContent;
              previous.result = this.attempt(
                state,
                gradingContent,
                {
                  lessonId: previous.lessonId,
                  exerciseId: previous.exerciseId,
                  clientAttemptId: previous.token,
                  answer: update.answer,
                  hintUsed: aids.length > 0,
                },
                aids,
                undefined,
                {
                  source: previous.reason === 'remediation' ? 'remediation' : 'review',
                  ...(savedAuthored && {
                    authored: savedAuthored,
                    contentVersion: savedAuthored.version,
                  }),
                  ...(previous.prerequisite && { aids: ['guided'] }),
                  ...(isArchived && { contentVersion: archivedVersion?.version }),
                  ...(previous.remediation?.phase === 'support' && {
                    remediates: [previous.remediation.error],
                  }),
                  ...(step?.audio &&
                    !previous.listened &&
                    !(savedAuthored?.authoredAudio && previous.transcript) && {
                      evidenceOutcome: 'ungradable',
                    }),
                },
              );
              previous.answer = update.answer;
              const progress = adventure ? journey() : state;
              if (
                !archivedChapter &&
                progress.story &&
                progress.travel &&
                (travelOnly || unified) &&
                mission &&
                !previous.starter &&
                (!step?.audio || previous.listened) &&
                previous.result.correct
              ) {
                recordStoryReview(
                  definition,
                  progress.story,
                  mission,
                  storyContext(
                    progress.story,
                    progress.travel,
                    state.travelLearning,
                    state.unifiedLearning,
                    definition,
                    activeChapter,
                  ),
                );
              }
            }
          }
        }
      }
      if (previous && existing) {
        const confirmed = unified && !update && supportAlreadyConfirmed(previous);
        if (confirmed) remove(slot.key);
        if (unified && !update) {
          const resumed = resumeSupported(previous, existing);
          if (resumed) return resumed;
        }
        if (!confirmed) return done(forReview(previous, existing));
      }
      if (unified) {
        if (!chapterScoped && mission && !chapter.missions.some((item) => item.id === mission))
          throw new LocalError('Esta misión no está disponible.', 404);
        const availablePlans = plans();
        if (
          mission &&
          activeChapter.missions.some(({ id, optional }) => id === mission && optional)
        ) {
          const priority = ({ row, mastery }: (typeof availablePlans)[number]) =>
            row.reason === 'remediation'
              ? 0
              : row.reason === 'due'
                ? 1
                : mastery.independentSuccesses === 0
                  ? 2
                  : 3;
          availablePlans.sort((a, b) => priority(a) - priority(b));
        }
        for (const plan of availablePlans) {
          if (target && plan.row.key !== target) continue;
          if (plan.mastery.pendingErrors.length) {
            const next = planRemediation(plan, recentExercises());
            if (next && next.phase !== 'waiting')
              return create(
                next.candidate.lesson,
                next.candidate.exercise,
                false,
                'remediation',
                plan.row.key,
                { phase: next.phase, error: next.error },
              );
          } else if (plan.candidates.length) {
            const [candidate] = plan.candidates;
            return create(
              candidate.lesson,
              candidate.exercise,
              false,
              plan.row.reason,
              plan.row.key,
            );
          }
        }
        const waiting = recovery.find(isWaiting)?.saved;
        const waitingExercise =
          waiting &&
          (adventureExercises.get(waiting.exerciseId)?.step.exercise ??
            lessons
              .find(({ id }) => id === waiting.lessonId)
              ?.exercises.find(({ id }) => id === waiting.exerciseId));
        if (waiting && waitingExercise) return done(forReview(waiting, waitingExercise, true));
        if (target)
          throw new LocalError('Por ahora falta otra pregunta para practicar esta habilidad.', 404);
        if (chapterScoped)
          throw new LocalError('Aún no hay un repaso disponible para este capítulo.', 404);
        if (travelStarter) return create(travelLesson, travelStarter, true);
        for (const lesson of lessons) {
          const exercise = lesson.exercises.find((item) => reviewStarterWord(lesson, item));
          if (exercise) return create(lesson, exercise, true);
        }
        throw new LocalError('No hay ejercicios instalados.', 404);
      }
      if (travelOnly) {
        if (mission && !chapter.missions.some((item) => item.id === mission))
          throw new LocalError('Esta misión no está disponible.', 404);
        const plan = travelReviewPlans(state, now, mission).find(
          (entry) => entry.candidates.length && (!target || learningKey(entry.target) === target),
        );
        if (plan) return create(travelLesson, plan.candidates[0].exercise, false, plan.reason);
        if (target)
          throw new LocalError('Esta habilidad todavía no tiene un repaso disponible.', 404);
        return create(travelLesson, travelStarter, true);
      }
      const ranked = [...state.mastery].sort(
        (a, b) =>
          Number(Date.parse(b.nextReviewAt) <= now) - Number(Date.parse(a.nextReviewAt) <= now) ||
          a.value - b.value ||
          Date.parse(a.lastPracticedAt) - Date.parse(b.lastPracticedAt),
      );
      for (const target of ranked) {
        for (const lesson of lessons) {
          const exercise = lesson.exercises.find(
            (e) =>
              e !== travelStarter &&
              taughtForReview(state, lesson.id, e) &&
              e.dimension === target.dimension &&
              (target.dimension.startsWith('vocabulary_')
                ? e.vocabularyIds?.includes(target.targetId)
                : e.skillId === target.targetId),
          );
          if (exercise) return create(lesson, exercise);
        }
      }
      if (courseOnly || !travelStarter) {
        for (const lesson of lessons) {
          const exercise = lesson.exercises.find((item) => reviewStarterWord(lesson, item));
          if (exercise) return create(lesson, exercise, true);
        }
        throw new LocalError('No hay ejercicios instalados.', 404);
      }
      return create(travelLesson, travelStarter, true);
    }
    if (route === '/v1/me/export')
      return done({
        format: 'lingoquest-backup',
        formatVersion: 2,
        exportedAt: new Date(now).toISOString(),
        state,
        progress: progress(state, now),
        privacy: { storedOnDevice: true, recordingsStored: false, onlineServices: false },
      });
    if (route === '/v1/me/import' && method === 'POST') {
      const input = z.object({ backup: z.unknown() }).strict().parse(body);
      if (JSON.stringify(input.backup).length > 10000000)
        throw new LocalError('La copia supera el tamaño permitido.');
      if (
        typeof input.backup === 'object' &&
        input.backup !== null &&
        'formatVersion' in input.backup &&
        input.backup.formatVersion !== 2
      )
        throw new LocalError(
          'Este respaldo pertenece al curso de desarrollo anterior. Conserva el archivo; el nuevo curso necesita progreso nuevo.',
          409,
          'BACKUP_VERSION_UNSUPPORTED',
        );
      const imported = backupSchema.parse(input.backup);
      const next = {
        ...imported.state,
        unifiedLearning: migrateUnifiedLearning(imported.state),
        challengeHistory: freezeChallengeHistory(
          imported.state.challengeHistory,
          imported.state.runs,
        ),
        user: { ...imported.state.user, email: undefined, isGuest: false },
        runs: {},
        runRequests: {},
      } as OfflineState;
      return { state: next, value: { restored: true, progress: progress(next, now) } };
    }
    if (route === '/v1/me' && method === 'DELETE') {
      const next = this.initial();
      return { state: next, value: { deleted: true, recordingsStored: false } };
    }
    if (route === '/v1/me/settings' || (route === '/v1/me' && method === 'PATCH')) {
      Object.assign(state.user, profileSchema.parse(body));
      return done({ user: state.user });
    }
    const lessonMatch = route.match(/^\/v1\/lessons\/([^/]+)(\/complete)?$/);
    if (lessonMatch) {
      const lesson = own(content.lessons, lessonMatch[1]);
      if (!lesson) throw new LocalError('Esta lección no está instalada.', 404);
      if (lessonMatch[2]) {
        const input = z
          .object({ checkpoint: lessonCheckpointSchema.optional() })
          .strict()
          .parse(body ?? {});
        const prior = own(state.lessonCheckpoints ?? {}, lesson.id);
        const version = studyMaterialVersion(content, lesson.id);
        const skipped =
          prior?.skippedVersion === version &&
          (!input.checkpoint || prior.activityId === input.checkpoint.activityId)
            ? prior.skipped
            : undefined;
        if (
          !lesson.exercises.every(
            (e) =>
              own(state.visitedExercises, lesson.id)?.includes(e.id) || skipped?.includes(e.id),
          )
        )
          throw new LocalError(
            'Practica los ejercicios primero. Puedes continuar aunque te equivoques.',
            409,
            'LESSON_INCOMPLETE',
          );
        let xpAwarded = 0;
        if (!state.completedLessons.includes(lesson.id)) {
          state.completedLessons.push(lesson.id);
          state.xp += 25;
          xpAwarded = 25;
        }
        if (!state.learningDays.includes(today(now))) state.learningDays.push(today(now));
        if (input.checkpoint) {
          const checkpoints = (state.lessonCheckpoints ??= {});
          if (
            prior?.activityId === input.checkpoint.activityId &&
            prior.stage === input.checkpoint.stage
          )
            return done({
              completed: true,
              pending: false,
              xpAwarded: 0,
              progress: progress(state, now),
              learning: studyLearningStatus(
                state.unifiedLearning,
                state.completedLessons,
                content,
                lesson,
                now,
              ),
              checkpoint: prior,
            });
          const next = {
            ...input.checkpoint,
            skipped,
            skippedVersion: skipped ? version : undefined,
            xp: input.checkpoint.xp + xpAwarded,
          };
          set(checkpoints, lesson.id, next);
        }
        return done({
          completed: true,
          pending: false,
          xpAwarded,
          progress: progress(state, now),
          learning: studyLearningStatus(
            state.unifiedLearning,
            state.completedLessons,
            content,
            lesson,
            now,
          ),
          checkpoint: own(state.lessonCheckpoints ?? {}, lesson.id),
        });
      }
      return done({
        ...lesson,
        exercises: lesson.exercises.map(publicExercise),
        contentVersion: 1,
        contentStatus: 'draft',
        mode: 'offline',
      });
    }
    if (route === '/v1/attempts' && method === 'POST') {
      const input = z
        .object({
          checkpoint: lessonCheckpointSchema.optional(),
          learningSource: z.enum(['study', 'review']).optional(),
        })
        .passthrough()
        .parse(body);
      const { checkpoint, learningSource, ...answer } = input;
      const parsed = attemptSchema.parse(answer);
      const prior = own(state.lessonCheckpoints ?? {}, parsed.lessonId);
      const studyAids: UnifiedLearningAid[] = [];
      if (checkpoint?.retry) studyAids.push('answer_shown');
      if (checkpoint?.referenceUsed || (checkpoint?.hint && !checkpoint.retry))
        studyAids.push('hint', 'translation');
      const result = this.attempt(state, content, parsed, [], undefined, {
        source: learningSource,
        // The Study correction shows the reference answer. / La corrección del curso muestra la respuesta modelo.
        aids: studyAids,
        retry: checkpoint?.retry,
      });
      if (
        checkpoint?.eventId === parsed.clientAttemptId &&
        (!prior || prior.eventId === checkpoint.eventId)
      )
        set((state.lessonCheckpoints ??= {}), parsed.lessonId, {
          ...checkpoint,
          skipped: prior?.skipped,
          skippedVersion: prior?.skippedVersion,
        });
      return done(result);
    }
    if (route === '/v1/reviews/today') {
      if (params.get('source') === 'unified') {
        const all = params.get('all') === 'true';
        const archive = archivedReviewLessons(state);
        const reviews: UnifiedReviewRow[] = unifiedReviewPlans(
          state,
          content,
          createUnifiedReviewCandidates(state, reviewContent, archive, chapterPractice),
          now,
          undefined,
          undefined,
          chapterPractice.flatMap(({ definitions }) => definitions ?? []),
        )
          .map(({ row }) => row)
          .filter((row) => all || (row.reason !== 'practice' && row.canPractice));
        return done({ reviews, total: reviews.length });
      }
      if (params.get('source') === 'travel') {
        const reviews = travelReviewRows(state, now, params.get('all') === 'true', publicExercise);
        return done({ reviews, total: reviews.length });
      }
      const lessons =
        params.get('source') === 'course'
          ? Object.values(content.lessons)
          : [...Object.values(content.lessons), travelLesson];
      const reviews = state.mastery
        .filter((m) => params.get('all') === 'true' || Date.parse(m.nextReviewAt) <= now)
        .sort((a, b) => a.value - b.value)
        .map((m) => {
          const related = lessons.filter((lesson) =>
            lesson.exercises.some(
              (e) =>
                taughtForReview(state, lesson.id, e) &&
                e.dimension === m.dimension &&
                (m.dimension.startsWith('vocabulary_')
                  ? e.vocabularyIds?.includes(m.targetId)
                  : e.skillId === m.targetId),
            ),
          );
          const lesson =
            [...related].reverse().find((l) => state.completedLessons.includes(l.id)) ?? related[0];
          const vocabulary = lessons
            .flatMap((l) => l.vocabulary ?? [])
            .find((v) => v.id === m.targetId);
          return {
            key: `${m.dimension}:${m.targetId}`,
            skillId: m.skillId,
            targetId: m.targetId,
            dimension: m.dimension,
            targetLabelEs: vocabulary
              ? `${vocabulary.en} · ${vocabulary.es}`
              : (lesson?.title ?? m.skillId),
            mastery: m.value,
            dueAt: m.nextReviewAt,
            due: Date.parse(m.nextReviewAt) <= now,
            lessonId: lesson?.id,
            travel: lesson?.id === travelLesson.id,
            exercises: related
              .flatMap((l) =>
                l.exercises.filter(
                  (e) =>
                    taughtForReview(state, l.id, e) &&
                    e.dimension === m.dimension &&
                    (m.dimension.startsWith('vocabulary_')
                      ? e.vocabularyIds?.includes(m.targetId)
                      : e.skillId === m.targetId),
                ),
              )
              .slice(0, 4)
              .map(publicExercise),
          };
        })
        .filter((review) => params.get('source') !== 'course' || review.lessonId);
      return done({ reviews, total: reviews.length });
    }
    if (route === '/v1/pronunciation/drills')
      return done({ drills: content.speechDrills, provider: 'device', recordingsStored: false });
    if (route === '/v1/speech/assess')
      return done({
        status: 'unscorable',
        provider: 'disabled_offline',
        feedbackEs:
          'Escucha y compara tu grabación en tu dispositivo. No se realiza una evaluación automática ni se envía audio.',
        stored: false,
      });
    if (route === '/v1/missions')
      return done({
        missions: content.missions,
        provider: 'authored_finite_state',
        contentStatus: 'draft',
      });
    if (route === '/v1/placement') {
      if (method === 'GET')
        return done({
          questions: content.placementQuestions.map(publicExercise),
          optional: true,
          contentStatus: 'draft',
        });
      const input = z
        .object({
          assessmentId: z.string().min(8).max(100).optional(),
          answers: z
            .array(z.object({ exerciseId: z.string(), answer: answerSchema }).strict())
            .min(1)
            .max(15),
        })
        .strict()
        .parse(body);
      const correct = new Set<string>();
      const seen = new Set<string>();
      for (const answer of input.answers) {
        if (seen.has(answer.exerciseId)) throw new LocalError('Responde una vez a cada pregunta.');
        seen.add(answer.exerciseId);
        const exercise = content.placementQuestions.find((e) => e.id === answer.exerciseId);
        if (!exercise) throw new LocalError('Pregunta no instalada.');
        const outcome = judgeAnswer(exercise, answer.answer);
        if (outcome === 'target') correct.add(exercise.id);
        recordAssessmentAnswer(
          state,
          exercise,
          {
            id: `placement:course:${input.assessmentId ?? outcome}:${exercise.id}`,
            source: 'placement',
            materialId: 'course-placement',
            materialVersion: studyMaterialVersion(content, exercise.requiredLessonIds?.[0] ?? ''),
            timestamp: now,
            outcome,
          },
          [],
          exercise.requiredLessonIds?.[0],
        );
      }
      return done({
        level: suggestPlacementLevel(content.placementQuestions, input.answers.length, correct),
        correct: correct.size,
        total: input.answers.length,
        feedbackEs:
          'Es una orientación personal, no una certificación. Explora las lecciones a tu ritmo.',
      });
    }
    const requiredHomeMissions = chapter.missions.filter(({ optional }) => !optional);
    const completedHomeMissions = requiredHomeMissions.filter(
      (mission) => state.travel?.completed[mission.id],
    );
    const homeChallengeTaught =
      requiredHomeMissions.length > 0 &&
      completedHomeMissions.length === requiredHomeMissions.length &&
      !!state.travel?.stamps[chapter.id];
    let learningGate: ReturnType<typeof challengeLearningGate> | undefined;
    const chapterExercises = [...adventures.values()].flatMap(({ exercises }) =>
      [...exercises.values()].flatMap(({ step, lesson, version, reviewedDigest }) =>
        reviewedDigest
          ? [
              {
                lessonId: lesson.id,
                exercise: step.exercise,
                version,
                requires: step.requires,
                targets: step.targets,
              },
            ]
          : [],
      ),
    );
    const challengeGate = () =>
      (learningGate ??= challengeLearningGate(
        state,
        reviewContent,
        chapterExercises,
        formalDefinitions(
          reviewContent,
          [],
          [...adventures.values()].flatMap(({ audit }) => audit?.definitions ?? []),
        ),
      ));
    const rankAdmission = (home: boolean, type: ChallengeType, level: number) => {
      const unit = challengeUnit(content, level);
      const taught = home
        ? homeChallengeTaught && level <= availableTravelRanks
        : trackUnlocked(state, content, unit);
      const items = home ? travelChallengeItems(type, level) : questions(content, type, level);
      const complete = items.length === (home ? level + 2 : challengeQuestionCount(type));
      const gate =
        taught && complete ? challengeGate()(home ? 'home' : 'course', type, items) : undefined;
      if (home || !gate?.ready) return { taught, ready: gate?.ready ?? false, items };
      const alternatives = new Map(
        [...adventures.values()].flatMap(({ challenges, audit, version }) =>
          (challenges?.[type] ?? []).map(
            (item) => [item, { version, reviews: audit?.challenges }] as const,
          ),
        ),
      );
      const variation = Object.values(state.runs).filter(
        (run) => run.trackId === 'present_simple' && run.type === type && run.level === level,
      ).length;
      const selected = selectAdventureChallengeVariation(
        items,
        [...alternatives.keys()],
        level,
        variation,
        (item) => challengeGate()('adventure', type, [item], alternatives.get(item)?.reviews).ready,
      );
      const selectedVersion = alternatives.get(selected[0])?.version;
      return {
        taught,
        ready: true,
        items: selected,
        itemVersions: selectedVersion ? { [selected[0].id]: selectedVersion } : undefined,
      };
    };
    const challengeTypes: readonly ChallengeType[] = [
      'grammar_rush',
      'cloze_battle',
      'reading_quest',
    ];
    const firstRankOpen = (home: boolean) =>
      challengeTypes.some((type) => rankAdmission(home, type, 1).ready);
    if (route === '/v1/challenges/tracks' && params.get('source') === 'travel')
      return done({
        tracks: [
          {
            id: HOME_TRAVEL_TRACK,
            titleEs: 'Pruebas de La primera postal',
            descriptionEs:
              'Pon en práctica los saludos, las indicaciones y las descripciones del capítulo.',
            unlocked: firstRankOpen(true),
            needsEvidence: homeChallengeTaught && !firstRankOpen(true),
            available: requiredHomeMissions.length > 0,
            completedLessons: completedHomeMissions.length,
            requiredLessons: requiredHomeMissions.length,
            published: false,
            rankedAvailable: false,
            highestPracticeLevel: Math.max(
              0,
              ...state.challengeProgress
                .filter((p) => p.trackId === HOME_TRAVEL_TRACK)
                .map((p) => p.highestLevel),
            ),
          },
        ],
      });
    if (route === '/v1/challenges/tracks')
      return done({
        tracks: tracks.map((track) => {
          const required = requiredLessons(content, track.requiredUnitId);
          const taught = trackUnlocked(state, content, track.requiredUnitId);
          const unlocked = taught && firstRankOpen(false);
          return {
            ...track,
            unlocked,
            needsEvidence: taught && !unlocked,
            completedLessons: required.filter((id) => state.completedLessons.includes(id)).length,
            requiredLessons: required.length,
            available: track.id === 'present_simple' && content.challengeLevels.length > 0,
            published: false,
            rankedAvailable: false,
            highestPracticeLevel: Math.max(
              0,
              ...state.challengeProgress
                .filter((p) => p.trackId === track.id)
                .map((p) => p.highestLevel),
            ),
          };
        }),
        draftNoticeEs:
          'Práctica local sin clasificación. Los resultados permanecen en este dispositivo.',
      });
    const levelMatch = route.match(/^\/v1\/challenges\/tracks\/([^/]+)\/levels$/);
    if (levelMatch) {
      const track = tracks.find((t) => t.id === levelMatch[1]);
      const isHomeTrack = levelMatch[1] === HOME_TRAVEL_TRACK;
      if (!track && !isHomeTrack) throw new LocalError('Tema no disponible.', 404);
      const challengeContent = isHomeTrack ? activeTravelCourse : content;
      const type = z
        .enum(['grammar_rush', 'cloze_battle', 'reading_quest'])
        .parse(params.get('type') ?? 'grammar_rush');
      const record = state.challengeProgress.find(
        (p) => p.trackId === levelMatch[1] && p.type === type,
      );
      return done({
        levels: challengeContent.challengeLevels.map((level) => {
          const unit = challengeUnit(challengeContent, level.level);
          const { taught, ready: unlocked, items } = rankAdmission(isHomeTrack, type, level.level);
          return {
            level: level.level,
            nameEs: level.name_es,
            hearts: level.hearts,
            seconds: timeBudget(challengeContent, type, level.level, items),
            unlocked,
            needsEvidence: taught && !unlocked,
            unlockUnit: unit,
            planned: isHomeTrack && level.level > availableTravelRanks,
            bestScore: record?.bestScores[String(level.level)] ?? 0,
          };
        }),
        practiceOnly: true,
      });
    }
    if (route === '/v1/challenges/runs' && method === 'POST') {
      const input = runSchema
        .extend({ trackId: runSchema.shape.trackId.or(z.literal(HOME_TRAVEL_TRACK)) })
        .parse(body);
      const isHomeTrack = input.trackId === HOME_TRAVEL_TRACK;
      const challengeContent = isHomeTrack ? activeTravelCourse : content;
      if (input.mode !== 'practice')
        throw new LocalError(
          'Solo hay práctica local, sin clasificación en línea.',
          403,
          'RANKED_DISABLED',
        );
      if (input.trackId !== 'present_simple' && !isHomeTrack)
        throw new LocalError(
          'Este tema aún no forma parte del contenido instalado.',
          404,
          'CONTENT_UNAVAILABLE',
        );
      const fingerprint = JSON.stringify(input);
      const previous = own(state.runRequests, input.clientRequestId);
      if (previous) {
        if (previous.fingerprint !== fingerprint)
          throw new LocalError(
            'Esta solicitud ya se usó con otras reglas.',
            409,
            'IDEMPOTENCY_CONFLICT',
          );
        const run = own(state.runs, previous.runId);
        if (!run) throw new LocalError('La práctica anterior ya no está disponible.', 404);
        finish(state, run, now);
        return done(view(run, now));
      }
      const {
        taught,
        ready,
        items: selected,
        itemVersions,
      } = rankAdmission(isHomeTrack, input.type, input.level);
      if (!ready)
        throw new LocalError(
          taught
            ? 'Practica las ideas necesarias y acierta sin ayuda para abrir este desafío.'
            : 'Primero completa las lecciones relacionadas. Los desafíos son opcionales y solo usan material aprendido.',
          403,
          'CHALLENGE_LOCKED',
        );
      const items = copy(selected);
      const config = challengeContent.challengeLevels.find((l) => l.level === input.level)!;
      const id = this.id();
      const run: StoredRun = {
        id,
        trackId: input.trackId,
        type: input.type,
        level: input.level,
        mode: 'practice',
        relaxed: input.relaxed,
        items,
        startedAt: now,
        contentVersion: isHomeTrack
          ? `home:${chapter.revision}`
          : studyMaterialVersion(content, ''),
        ...(itemVersions && { itemVersions }),
        deadline: input.relaxed
          ? null
          : now + timeBudget(challengeContent, input.type, input.level, items) * 1000,
        heartsInitial: config.hearts,
        hearts: config.hearts,
        position: 0,
        correctCount: 0,
        status: 'active',
        score: 0,
        answers: [],
        submissions: {},
      };
      set(state.runs, id, run);
      set(state.runRequests, input.clientRequestId, { fingerprint, runId: id });
      return done(view(run, now));
    }
    const runMatch = route.match(
      /^\/v1\/challenges\/runs\/([^/]+)\/(current|answers|finish|abandon)$/,
    );
    if (runMatch) {
      const run = own(state.runs, runMatch[1]);
      if (!run) throw new LocalError('No encontramos esta práctica local.', 404);
      const operation = runMatch[2];
      if (operation === 'answers') {
        const input = submissionSchema.parse(body);
        const fingerprint = JSON.stringify(input);
        const previous = own(run.submissions, input.clientSubmissionId);
        if (previous) {
          if (previous.fingerprint !== fingerprint)
            throw new LocalError(
              'La respuesta ya se guardó con otros datos.',
              409,
              'IDEMPOTENCY_CONFLICT',
            );
          return done(previous.result);
        }
        finish(state, run, now);
        if (run.status !== 'active') return done(view(run, now));
        if (input.questionPosition !== run.position + 1)
          throw new LocalError('La pregunta ya cambió.', 409, 'QUESTION_ORDER');
        const exercise = run.items[run.position];
        const outcome = judgeAnswer(exercise, input.answer);
        const materialId = run.trackId === HOME_TRAVEL_TRACK ? travelLesson.id : run.trackId;
        recordAssessmentAnswer(
          state,
          exercise,
          {
            id: `challenge:${run.id}:${run.position}`,
            source: 'challenge',
            materialId,
            materialVersion:
              run.itemVersions?.[exercise.id] ??
              run.contentVersion ??
              (run.trackId === HOME_TRAVEL_TRACK
                ? `home:${chapter.revision}`
                : studyMaterialVersion(content, '')),
            timestamp: now,
            outcome,
          },
          [],
          exercise.requiredLessonIds?.at(-1),
          input.answer,
        );
        const correct = outcome === 'target';
        if (correct) run.correctCount++;
        else if (outcome !== 'ungradable') run.hearts = Math.max(0, run.hearts - 1);
        run.answers.push({
          questionId: exercise.id,
          correct,
          outcome,
          feedbackEs:
            outcome === 'communication_only'
              ? exercise.communicationOnly!.feedbackEs
              : outcome === 'ungradable'
                ? (exercise.ungradable?.feedbackEs ?? 'Faltan datos para evaluar esta respuesta.')
                : outcome === 'context_mismatch'
                  ? exercise.contextMismatch!.feedbackEs
                  : exercise.feedbackEs,
          acceptedAnswer: outcome === 'ungradable' ? '' : displayedAnswer(exercise),
        });
        run.position++;
        finish(state, run, now);
        const value = view(run, now);
        set(run.submissions, input.clientSubmissionId, { fingerprint, result: value });
        return done(value);
      }
      if (operation === 'abandon' && run.status === 'active') {
        run.status = 'abandoned';
        run.reason = 'user_exit';
      } else finish(state, run, now);
      return done(view(run, now));
    }
    throw new LocalError(
      'Esta función no está disponible en la edición sin conexión.',
      404,
      'LOCAL_ROUTE_NOT_FOUND',
    );
  }
}
