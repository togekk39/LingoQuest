import { z, ZodError } from 'zod';
import {
  answerSchema,
  attemptSchema,
  profileSchema,
  runSchema,
  submissionSchema,
  type Answer,
  type AttemptInput,
  type AttemptResult,
  type ChallengeProgress,
  type Mastery,
  type Progress,
  type PublicExercise,
  type PublicLesson,
  type EvidenceDimension,
  type ExerciseType,
  type RunView,
  type User,
} from '@lingoquest/contracts';

/** Device-local learning only. Scores are personal practice, never verified rankings. */
export interface CourseExercise extends PublicExercise {
  feedbackEs: string;
  acceptedAnswers: string[];
  correctOptionId?: string;
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
}
export interface LocalStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export interface OfflineEngineOptions {
  store: LocalStore;
  getContent: () => Promise<CourseData> | CourseData;
  clock?: () => number;
  randomId?: () => string;
}
interface StoredRun {
  id: string;
  trackId: string;
  type: 'grammar_rush' | 'cloze_battle' | 'reading_quest';
  level: number;
  mode: 'practice';
  relaxed: boolean;
  items: CourseExercise[];
  startedAt: number;
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
  reviewRewards: string[];
  skillDayBaseline: Record<string, { day: string; lastPracticedAt: string | null }>;
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
export const normalize = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
export function grade(exercise: CourseExercise, answer: Answer) {
  if (exercise.type === 'matching') {
    const pairs = exercise.matchingPairs ?? [];
    return (
      pairs.length > 0 &&
      answer.matches !== undefined &&
      Object.keys(answer.matches).length === pairs.length &&
      pairs.every(
        (pair) => Object.hasOwn(answer.matches!, pair.id) && answer.matches![pair.id] === pair.id,
      )
    );
  }
  if (answer.optionId !== undefined)
    return (
      exercise.correctOptionId === answer.optionId ||
      exercise.acceptedAnswers.includes(answer.optionId)
    );
  return exercise.acceptedAnswers.some(
    (value) => normalize(value) === normalize(answer.text ?? answer.tokens?.join(' ') ?? ''),
  );
}
function displayedAnswer(e: CourseExercise) {
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
    titleEs: 'Rutinas de cada día',
    descriptionEs: 'Pon en práctica el presente simple y la tercera persona.',
    requiredUnitId: 'u02',
    defaultType: 'grammar_rush',
  },
  {
    id: 'past_simple',
    titleEs: 'Historias de ayer',
    descriptionEs: 'Cuenta lo que pasó con el pasado simple.',
    requiredUnitId: 'u04',
    defaultType: 'cloze_battle',
  },
  {
    id: 'real_life',
    titleEs: 'Inglés en la vida real',
    descriptionEs: 'Lee, comprende y conecta ideas.',
    requiredUnitId: 'u08',
    defaultType: 'reading_quest',
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
  const unitIndex = content.units.findIndex((u) => u.id === requiredUnitId);
  return unitIndex < 0
    ? []
    : content.units.slice(0, unitIndex + 1).flatMap((u) => u.lessons.map((l) => l.id));
}
function trackUnlocked(state: OfflineState, content: CourseData, requiredUnitId: string) {
  const required = requiredLessons(content, requiredUnitId);
  return required.length > 0 && required.every((id) => state.completedLessons.includes(id));
}
function questions(
  content: CourseData,
  type: StoredRun['type'],
  level: number,
  state: OfflineState,
) {
  const learned = Object.values(content.lessons).filter((l) =>
    state.completedLessons.includes(l.id),
  );
  const vocabulary = new Set(learned.flatMap((l) => (l.vocabulary ?? []).map((v) => v.id)));
  const skills = new Set(learned.flatMap((l) => l.exercises.map((e) => e.skillId)));
  return content.challengePools[type]
    .filter(
      (e) =>
        e.requiredLessonIds?.length &&
        e.requiredLessonIds.every((id) => state.completedLessons.includes(id)) &&
        skills.has(e.skillId) &&
        (e.vocabularyIds ?? []).every((id) => vocabulary.has(id)),
    )
    .sort((a, b) => Math.abs(a.difficulty - level) - Math.abs(b.difficulty - level))
    .slice(0, type === 'grammar_rush' ? 10 : type === 'cloze_battle' ? 5 : 4);
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
  return {
    user: state.user,
    completedLessons: state.completedLessons,
    xp: state.xp,
    learningDays: state.learningDays,
    streak,
    mastery: state.mastery,
    reviewCount: state.mastery.filter((m) => Date.parse(m.nextReviewAt) <= now).length,
    challengeProgress: state.challengeProgress,
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
const resultSchema = z
  .object({
    correct: z.boolean(),
    feedbackEs: z.string().max(5000),
    acceptedAnswer: z.string().max(5000).optional(),
    xpAwarded: z.number().int().min(0).max(1000000),
    pending: z.literal(false),
  })
  .strict();
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
            state = JSON.parse(raw) as OfflineState;
            if (state.formatVersion !== 2)
              throw new LocalError(
                'El curso de desarrollo cambió. Tus datos anteriores siguen guardados. Exporta una copia y restablece el progreso para empezar el nuevo curso; los respaldos de la versión anterior no se pueden restaurar aquí.',
                409,
                'LOCAL_DATA_RESET_REQUIRED',
              );
            if (!state.user || !Array.isArray(state.completedLessons)) throw new Error();
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
        const result = this.dispatch(state, content, path, body, verb);
        await this.options.store.setItem(OFFLINE_STATE_KEY, JSON.stringify(result.state));
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
    const result = this.tail.then(run, run);
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
  private attempt(state: OfflineState, content: CourseData, input: AttemptInput) {
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
    const lesson = own(content.lessons, parsed.lessonId);
    const exercise = lesson?.exercises.find((e) => e.id === parsed.exerciseId);
    if (!lesson || !exercise)
      throw new LocalError('Ejercicio no disponible en el curso instalado.', 404);
    const correct = grade(exercise, parsed.answer);
    const now = this.clock();
    const date = today(now);
    let visited = own(state.visitedExercises, lesson.id);
    if (!visited) {
      visited = [];
      set(state.visitedExercises, lesson.id, visited);
    }
    if (!visited.includes(exercise.id)) visited.push(exercise.id);
    if (!state.learningDays.includes(date)) state.learningDays.push(date);
    let xpAwarded = 0;
    const dimension = exercise.dimension ?? 'grammar_understanding';
    const targets = dimension.startsWith('vocabulary_')
      ? (exercise.vocabularyIds ?? [])
      : [exercise.skillId];
    for (const targetId of new Set(targets)) {
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
        !parsed.hintUsed;
      const baseline = own(state.skillDayBaseline, key)!.lastPracticedAt;
      const delayed = correct && baseline !== null && Date.parse(baseline) <= now - dayMs;
      mastery.evidenceCount++;
      if (correct && independent) mastery.unpromptedSuccessCount++;
      if (correct && !mastery.practicedFormats.includes(exercise.type))
        mastery.practicedFormats.push(exercise.type);
      if (correct && !mastery.practicedExerciseIds.includes(exercise.id))
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
        Math.min(ceiling, mastery.value + (correct ? (independent ? 0.12 : 0.06) : -0.03)),
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
        correct && mastery.lastDelayedSuccessAt
          ? [1, 3, 7, 14][Math.min(3, Math.floor(mastery.evidenceCount / 3))]
          : 1;
      mastery.lastPracticedAt = new Date(now).toISOString();
      mastery.nextReviewAt = new Date(now + interval * dayMs).toISOString();
      state.reviewRewards.push(evidenceKey);
    }
    const result: AttemptResult = {
      correct,
      feedbackEs: `${correct ? '¡Muy bien!' : 'Buen intento. Puedes volver a intentarlo.'} ${exercise.feedbackEs}`,
      acceptedAnswer: displayedAnswer(exercise),
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
  ): { state: OfflineState; value: unknown } {
    const [route, query = ''] = path.split('?');
    const params = new URLSearchParams(query);
    const now = this.clock();
    const done = (value: unknown) => ({ state, value });
    if (route.startsWith('/v1/auth/') || route.startsWith('/v1/sync/'))
      throw new LocalError(
        'Esta edición funciona sin cuenta ni sincronización en línea.',
        410,
        'ONLINE_SERVICE_DISABLED',
      );
    if (route === '/health')
      return done({ status: 'ok', mode: 'offline', storage: 'device', paidProviders: false });
    if (route === '/v1/catalog')
      return done({
        units: content.units,
        contentVersion: 1,
        contentStatus: 'draft',
        locale: 'es-419',
        mode: 'offline',
      });
    if (route === '/v1/me/progress') return done(progress(state, now));
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
        z.object({})
          .strict()
          .parse(body ?? {});
        if (!lesson.exercises.every((e) => own(state.visitedExercises, lesson.id)?.includes(e.id)))
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
        return done({ completed: true, pending: false, xpAwarded, progress: progress(state, now) });
      }
      return done({
        ...lesson,
        exercises: lesson.exercises.map(publicExercise),
        contentVersion: 1,
        contentStatus: 'draft',
        mode: 'offline',
      });
    }
    if (route === '/v1/attempts' && method === 'POST')
      return done(this.attempt(state, content, attemptSchema.parse(body)));
    if (route === '/v1/reviews/today') {
      const reviews = state.mastery
        .filter((m) => params.get('all') === 'true' || Date.parse(m.nextReviewAt) <= now)
        .sort((a, b) => a.value - b.value)
        .map((m) => {
          const related = Object.values(content.lessons).filter(
            (lesson) =>
              own(state.visitedExercises, lesson.id)?.length &&
              lesson.exercises.some(
                (e) =>
                  e.dimension === m.dimension &&
                  (m.dimension.startsWith('vocabulary_')
                    ? e.vocabularyIds?.includes(m.targetId)
                    : e.skillId === m.targetId),
              ),
          );
          const lesson =
            [...related].reverse().find((l) => state.completedLessons.includes(l.id)) ?? related[0];
          const vocabulary = Object.values(content.lessons)
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
            exercises: related
              .flatMap((l) =>
                l.exercises.filter(
                  (e) =>
                    e.dimension === m.dimension &&
                    (m.dimension.startsWith('vocabulary_')
                      ? e.vocabularyIds?.includes(m.targetId)
                      : e.skillId === m.targetId),
                ),
              )
              .slice(0, 4)
              .map(publicExercise),
          };
        });
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
          answers: z
            .array(z.object({ exerciseId: z.string(), answer: answerSchema }).strict())
            .min(1)
            .max(15),
        })
        .strict()
        .parse(body);
      let correct = 0;
      const seen = new Set<string>();
      for (const answer of input.answers) {
        if (seen.has(answer.exerciseId)) throw new LocalError('Responde una vez a cada pregunta.');
        seen.add(answer.exerciseId);
        const exercise = content.placementQuestions.find((e) => e.id === answer.exerciseId);
        if (!exercise) throw new LocalError('Pregunta no instalada.');
        if (grade(exercise, answer.answer)) correct++;
      }
      return done({
        level: correct / input.answers.length >= 0.75 ? 'A2' : 'A1',
        correct,
        total: input.answers.length,
        feedbackEs:
          'Es una orientación personal, no una certificación. Explora las lecciones a tu ritmo.',
      });
    }
    if (route === '/v1/challenges/tracks')
      return done({
        tracks: tracks.map((track) => {
          const required = requiredLessons(content, track.requiredUnitId);
          return {
            ...track,
            unlocked: trackUnlocked(state, content, track.requiredUnitId),
            completedLessons: required.filter((id) => state.completedLessons.includes(id)).length,
            requiredLessons: required.length,
            available: track.id === 'present_simple',
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
      if (!track) throw new LocalError('Tema no disponible.', 404);
      const type = z
        .enum(['grammar_rush', 'cloze_battle', 'reading_quest'])
        .parse(params.get('type') ?? 'grammar_rush');
      const record = state.challengeProgress.find(
        (p) => p.trackId === levelMatch[1] && p.type === type,
      );
      return done({
        levels: content.challengeLevels.map((level) => ({
          level: level.level,
          nameEs: level.name_es,
          hearts: level.hearts,
          seconds: timeBudget(
            content,
            type,
            level.level,
            questions(content, type, level.level, state),
          ),
          unlocked:
            track.id === 'present_simple' && trackUnlocked(state, content, track.requiredUnitId),
          bestScore: record?.bestScores[String(level.level)] ?? 0,
        })),
        practiceOnly: true,
      });
    }
    if (route === '/v1/challenges/runs' && method === 'POST') {
      const input = runSchema.parse(body);
      if (input.mode !== 'practice')
        throw new LocalError(
          'Solo hay práctica local, sin clasificación en línea.',
          403,
          'RANKED_DISABLED',
        );
      if (input.trackId !== 'present_simple')
        throw new LocalError(
          'Este tema aún no forma parte del contenido instalado.',
          404,
          'CONTENT_UNAVAILABLE',
        );
      const track = tracks.find((t) => t.id === input.trackId)!;
      if (!trackUnlocked(state, content, track.requiredUnitId))
        throw new LocalError(
          'Primero completa las lecciones relacionadas. Los desafíos son opcionales y solo usan material aprendido.',
          403,
          'CHALLENGE_LOCKED',
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
      const items = copy(questions(content, input.type, input.level, state));
      const needed = input.type === 'grammar_rush' ? 10 : input.type === 'cloze_battle' ? 5 : 4;
      if (items.length < needed) throw new LocalError('Faltan preguntas para esta práctica.', 404);
      const config = content.challengeLevels.find((l) => l.level === input.level)!;
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
        deadline: input.relaxed
          ? null
          : now + timeBudget(content, input.type, input.level, items) * 1000,
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
        const correct = grade(exercise, input.answer);
        if (correct) run.correctCount++;
        else run.hearts = Math.max(0, run.hearts - 1);
        run.answers.push({
          questionId: exercise.id,
          correct,
          feedbackEs: exercise.feedbackEs,
          acceptedAnswer: displayedAnswer(exercise),
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
