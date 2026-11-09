import Fastify, { type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { z, ZodError } from 'zod';
import {
  answerSchema,
  attemptSchema,
  credentialsSchema,
  profileSchema,
  runSchema,
  submissionSchema,
  type AttemptInput,
  type AttemptResult,
  type Progress,
  type PublicExercise,
  type RunView,
} from '@lingoquest/contracts';
import {
  units,
  lessons,
  challengePools,
  challengeLevels,
  placementQuestions,
  missions,
  speechDrills,
  type PrivateExercise,
} from './content.ts';
import { issueToken, passwordHash, verifyPassword, verifyToken } from './auth.ts';
import {
  SQLiteRepository,
  type Repository,
  type StoredRun,
  type StoredState,
} from './repository.ts';
import {
  AuthoredFeedbackProvider,
  DeterministicGradingService,
  NeutralSpeechProvider,
  SystemClock,
  type ChallengeClock,
  type FeedbackProvider,
  type GradingService,
  type SpeechAssessmentProvider,
} from './providers.ts';

class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly code = 'REQUEST_ERROR',
  ) {
    super(message);
  }
}
const digest = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const today = (now: number) => new Date(now).toISOString().slice(0, 10);
const dayMs = 86_400_000;
const trackConfigs = [
  {
    id: 'present_simple',
    titleEs: 'Daily routines',
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
export function publicExercise(e: PrivateExercise): PublicExercise {
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
    vocabularyIds: e.vocabularyIds,
    dimension: e.dimension,
    contextualGlosses: e.contextualGlosses,
    optionsLanguage: e.optionsLanguage,
    matchingPairs: e.matchingPairs,
  };
}
function streak(days: string[], now: number): number {
  const unique = new Set(days);
  let current = today(now);
  if (!unique.has(current)) current = today(now - dayMs);
  let count = 0;
  while (unique.has(current)) {
    count++;
    current = today(Date.parse(`${current}T12:00:00Z`) - dayMs);
  }
  return count;
}
export function getProgress(s: StoredState, now: number): Progress {
  return {
    user: s.user,
    completedLessons: s.completedLessons,
    xp: s.xp,
    learningDays: s.learningDays,
    streak: streak(s.learningDays, now),
    mastery: s.mastery,
    reviewCount: s.mastery.filter((m) => Date.parse(m.nextReviewAt) <= now).length,
    challengeProgress: s.challengeProgress,
  };
}
function trackUnlocked(state: StoredState, trackId: string): boolean {
  const config = trackConfigs.find((t) => t.id === trackId);
  const required = units.find((u) => u.id === config?.requiredUnitId)?.lessons ?? [];
  return required.length > 0 && required.every((l) => state.completedLessons.includes(l.id));
}
export function timeBudget(type: string, level: number, items: PrivateExercise[]): number {
  const rule = challengeLevels[level - 1];
  if (!rule) throw new ApiError(400, 'Nivel inválido.');
  if (type === 'grammar_rush') return rule.grammar_rush_total_seconds;
  const passages = [...new Set(items.map((i) => i.passage ?? i.sentence ?? ''))].join(' ');
  const words = passages.trim().split(/\s+/).filter(Boolean).length;
  if (type === 'reading_quest')
    return Math.max(
      180,
      Math.ceil(((words / 130) * 60 + items.length * 25) * rule.reading_clock_multiplier),
    );
  return Math.max(
    150,
    Math.ceil(((words / 130) * 60 + items.length * 20) * rule.cloze_clock_multiplier),
  );
}
function selectQuestions(type: keyof typeof challengePools, level: number): PrivateExercise[] {
  const count = type === 'grammar_rush' ? 10 : type === 'cloze_battle' ? 5 : 4;
  return [...challengePools[type]]
    .sort((a, b) => Math.abs(a.difficulty - level) - Math.abs(b.difficulty - level))
    .slice(0, count);
}
function finishRun(state: StoredState, run: StoredRun, now: number): void {
  if (run.status !== 'active') return;
  if (run.deadline !== null && now >= run.deadline) {
    run.status = 'failed';
    run.reason = 'timeout';
  } else if (run.hearts <= 0) {
    run.status = 'failed';
    run.reason = 'hearts';
  } else if (run.position >= run.items.length) {
    run.status = 'passed';
  } else return;
  const remaining =
    run.deadline === null ? 0 : Math.max(0, Math.floor((run.deadline - now) / 1000));
  run.score = 100 * run.correctCount + 2 * Math.min(remaining, 300) + 25 * run.hearts;
  if (run.status === 'passed') {
    let p = state.challengeProgress.find(
      (p) => p.trackId === run.trackId && p.type === run.type && p.mode === run.mode,
    );
    if (!p) {
      p = {
        trackId: run.trackId,
        type: run.type,
        mode: run.mode,
        highestLevel: 0,
        bestScores: {},
        badge: false,
      };
      state.challengeProgress.push(p);
    }
    p.highestLevel = Math.max(p.highestLevel, run.level);
    p.bestScores[String(run.level)] = Math.max(p.bestScores[String(run.level)] ?? 0, run.score);
    // Draft practice never awards an official badge or unlocks a ranked level.
    if (run.mode === 'ranked' && run.level === 13) p.badge = true;
  }
}
function runView(run: StoredRun, now: number): RunView {
  return {
    runId: run.id,
    trackId: run.trackId,
    type: run.type,
    level: run.level,
    mode: run.mode,
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
        ? publicExercise(run.items[run.position]!)
        : null,
    questionPosition: run.position + 1,
    ...(run.status !== 'active' ? { feedback: run.answers } : {}),
  };
}
function exerciseAnswer(e: PrivateExercise): string {
  const accepted = e.acceptedAnswers.find((a) => a !== e.correctOptionId);
  return (
    accepted ??
    e.options?.find((o) => o.id === e.correctOptionId)?.text ??
    e.acceptedAnswers[0] ??
    ''
  );
}

export interface ServerOptions {
  repository?: Repository;
  clock?: ChallengeClock;
  grading?: GradingService;
  feedback?: FeedbackProvider;
  speech?: SpeechAssessmentProvider;
  staticRoot?: string;
  logger?: boolean;
  rateLimitMax?: number;
}
export async function buildServer(options: ServerOptions = {}) {
  const app = Fastify({ logger: options.logger ?? false, bodyLimit: 256 * 1024 });
  const repo =
    options.repository ??
    new SQLiteRepository(
      process.env.DATABASE_PATH ?? resolve(process.cwd(), 'data/lingoquest.sqlite'),
    );
  const clock = options.clock ?? new SystemClock();
  const grading = options.grading ?? new DeterministicGradingService();
  const feedback = options.feedback ?? new AuthoredFeedbackProvider();
  const speech = options.speech ?? new NeutralSpeechProvider();
  const origins = process.env.CORS_ORIGINS?.split(',').filter(Boolean);
  await app.register(cors, { origin: origins ?? true, credentials: false });
  await app.register(rateLimit, {
    max: options.rateLimitMax ?? 300,
    allowList: (request) => !request.url.startsWith('/v1/'),
    timeWindow: '1 minute',
  });
  app.addHook('onClose', () => repo.close());
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError)
      return reply.code(400).send({
        error: 'Revisa los datos enviados.',
        code: 'VALIDATION_ERROR',
        fields: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    if (error instanceof ApiError)
      return reply.code(error.statusCode).send({ error: error.message, code: error.code });
    const status = (error as { statusCode?: number }).statusCode;
    if (status && status < 500)
      return reply.code(status).send({
        error:
          status === 429 ? 'Demasiadas solicitudes. Espera un momento.' : 'Solicitud inválida.',
        code: 'REQUEST_ERROR',
      });
    request.log.error(error);
    return reply.code(500).send({
      error: 'No pudimos completar la solicitud. Inténtalo otra vez.',
      code: 'INTERNAL_ERROR',
    });
  });
  function auth(request: FastifyRequest, optional = false) {
    const token = request.headers.authorization?.replace(/^Bearer /, '');
    const session = token ? verifyToken(repo, token, clock.now()) : null;
    if (!session && !optional)
      throw new ApiError(401, 'Tu sesión terminó. Vuelve a entrar.', 'SESSION_EXPIRED');
    return session;
  }
  const userId = (req: FastifyRequest) => auth(req)!.userId;
  const stateFor = (req: FastifyRequest) => repo.get(userId(req))!;
  const getRun = (state: StoredState, id: string) => {
    const run = state.runs[id];
    if (!run) throw new ApiError(404, 'No encontramos este desafío.', 'NOT_FOUND');
    return run;
  };
  function processAttempt(state: StoredState, input: AttemptInput): AttemptResult {
    const parsed = attemptSchema.parse(input);
    const fp = digest(parsed);
    const prior = state.attempts[parsed.clientAttemptId];
    if (prior) {
      if (prior.fingerprint !== fp)
        throw new ApiError(
          409,
          'Esta solicitud ya se utilizó con otra respuesta.',
          'IDEMPOTENCY_CONFLICT',
        );
      return prior.result;
    }
    const lesson = lessons[parsed.lessonId];
    const e = lesson?.exercises.find((e) => e.id === parsed.exerciseId);
    if (!lesson || !e) throw new ApiError(404, 'No encontramos este ejercicio.', 'NOT_FOUND');
    const correct = grading.grade(e, parsed.answer);
    const now = clock.now();
    const date = today(now);
    state.visitedExercises[lesson.id] ??= [];
    if (!state.visitedExercises[lesson.id]!.includes(e.id))
      state.visitedExercises[lesson.id]!.push(e.id);
    if (!state.learningDays.includes(date)) state.learningDays.push(date);
    let mastery = state.mastery.find((m) => m.skillId === e.skillId);
    if (!mastery) {
      mastery = {
        skillId: e.skillId,
        value: 0,
        evidenceCount: 0,
        unpromptedSuccessCount: 0,
        lastPracticedAt: new Date(now).toISOString(),
        nextReviewAt: new Date(now + dayMs).toISOString(),
        lastDelayedSuccessAt: null,
      };
      state.mastery.push(mastery);
    }
    state.skillDayBaseline ??= {};
    if (state.skillDayBaseline[e.skillId]?.day !== date)
      state.skillDayBaseline[e.skillId] = {
        day: date,
        lastPracticedAt: mastery.evidenceCount > 0 ? mastery.lastPracticedAt : null,
      };
    const sameExerciseAlready = Object.values(state.attempts).some((a) => a.fingerprint === fp);
    // One piece of evidence per exercise per day. New request IDs cannot farm mastery.
    const evidenceKey = `${date}:${e.id}`;
    const evidenceSeen = state.reviewRewards.includes(`evidence:${evidenceKey}`);
    let xpAwarded = 0;
    if (!evidenceSeen && !sameExerciseAlready) {
      const unprompted = e.type === 'short_text' && !parsed.hintUsed;
      const baseline = state.skillDayBaseline[e.skillId]!.lastPracticedAt;
      const delayed =
        correct && unprompted && baseline !== null && Date.parse(baseline) < now - dayMs;
      mastery.evidenceCount++;
      if (correct && unprompted) mastery.unpromptedSuccessCount++;
      mastery.value = Math.max(
        0,
        Math.min(
          mastery.lastDelayedSuccessAt !== null || delayed ? 0.95 : 0.85,
          mastery.value + (correct ? (unprompted ? 0.14 : 0.07) : -0.03),
        ),
      );
      if (delayed) {
        mastery.lastDelayedSuccessAt = new Date(now).toISOString();
        const rewardKey = `review:${date}:${e.skillId}`;
        if (!state.reviewRewards.includes(rewardKey)) {
          state.reviewRewards.push(rewardKey);
          state.xp += 5;
          xpAwarded = 5;
        }
      }
      const interval = correct
        ? ([1, 3, 7, 14][Math.min(3, Math.floor(mastery.unpromptedSuccessCount / 2))] ?? 1)
        : 1;
      mastery.nextReviewAt = new Date(now + interval * dayMs).toISOString();
      mastery.lastPracticedAt = new Date(now).toISOString();
      state.reviewRewards.push(`evidence:${evidenceKey}`);
    }
    const result: AttemptResult = {
      correct,
      feedbackEs: feedback.explain(e, correct),
      acceptedAnswer: exerciseAnswer(e),
      xpAwarded,
      pending: false,
    };
    state.attempts[parsed.clientAttemptId] = { fingerprint: fp, result };
    return result;
  }
  app.get('/health', () => ({
    status: 'ok',
    service: 'lingoquest-api',
    storage: 'sqlite',
    contentStatus: 'draft',
    paidProviders: false,
  }));
  app.get('/v1/catalog', () => ({
    units,
    contentVersion: 1,
    contentStatus: 'draft',
    locale: 'es-419',
  }));
  app.get<{ Params: { id: string } }>('/v1/lessons/:id', (req) => {
    const lesson = lessons[req.params.id];
    if (!lesson) throw new ApiError(404, 'Lección no encontrada.', 'NOT_FOUND');
    return {
      ...lesson,
      exercises: lesson.exercises.map(publicExercise),
      contentVersion: 1,
      contentStatus: 'draft',
    };
  });
  app.post(
    '/v1/auth/guest',
    { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    (req) => {
      const body = z
        .object({ name: z.string().trim().min(1).max(60).optional() })
        .strict()
        .parse(req.body ?? {});
      const state = repo.createUser(body.name ?? 'Explorador');
      return { token: issueToken(repo, state.user.id, clock.now()), user: state.user };
    },
  );
  app.post(
    '/v1/auth/register',
    { config: { rateLimit: { max: 15, timeWindow: '1 minute' } } },
    (req) => {
      const input = credentialsSchema.parse(req.body);
      if (repo.getAccountByEmail(input.email))
        throw new ApiError(409, 'Ya existe una cuenta con este correo.', 'EMAIL_EXISTS');
      const current = auth(req, true);
      const candidate = current ? repo.get(current.userId) : undefined;
      const { salt, hash } = passwordHash(input.password);
      let state: StoredState;
      if (candidate?.user.isGuest) {
        repo.upgradeUser(candidate.user.id, input.email, salt, hash);
        if (input.name)
          repo.mutate(candidate.user.id, (s) => {
            s.user.name = input.name!;
          });
        state = repo.get(candidate.user.id)!;
      } else state = repo.createUser(input.name ?? 'Explorador', input.email, salt, hash);
      return { token: issueToken(repo, state.user.id, clock.now()), user: state.user };
    },
  );
  app.post(
    '/v1/auth/login',
    { config: { rateLimit: { max: 15, timeWindow: '1 minute' } } },
    (req) => {
      const input = credentialsSchema.parse(req.body);
      const account = repo.getAccountByEmail(input.email);
      if (
        !account?.salt ||
        !account.hash ||
        !verifyPassword(input.password, account.salt, account.hash)
      )
        throw new ApiError(401, 'El correo o la contraseña no coinciden.', 'INVALID_CREDENTIALS');
      const state = repo.get(account.id)!;
      return { token: issueToken(repo, account.id, clock.now()), user: state.user };
    },
  );
  app.post('/v1/auth/logout', (req) => {
    const session = auth(req)!;
    repo.deleteSession(session.sessionId);
    return { ok: true };
  });
  app.get('/v1/me/progress', (req) => getProgress(stateFor(req), clock.now()));
  app.get('/v1/me/export', (req) => {
    const state = stateFor(req);
    const now = clock.now();
    return {
      exportedAt: new Date(now).toISOString(),
      formatVersion: 1,
      profile: state.user,
      progress: getProgress(state, now),
      attempts: Object.entries(state.attempts).map(([clientAttemptId, a]) => ({
        clientAttemptId,
        ...a.result,
      })),
      challenges: Object.values(state.runs).map((r) => runView(r, now)),
      recordings: [],
      privacy: { recordingsStored: false, accountCredentialsExcluded: true },
    };
  });
  const updateProfile = (req: FastifyRequest) => {
    const input = profileSchema.parse(req.body);
    return repo.mutate(userId(req), (state) => {
      Object.assign(state.user, input);
      return { user: state.user };
    });
  };
  app.post('/v1/me/settings', updateProfile);
  app.patch('/v1/me', updateProfile);
  app.delete('/v1/me', (req) => {
    repo.deleteUser(userId(req));
    return { deleted: true, recordingsStored: false };
  });
  app.post('/v1/attempts', (req) => {
    const input = attemptSchema.parse(req.body);
    return repo.mutate(userId(req), (s) => processAttempt(s, input));
  });
  app.post('/v1/sync/attempts', (req) => {
    const input = z
      .object({ attempts: z.array(attemptSchema).max(100) })
      .strict()
      .parse(req.body);
    return repo.mutate(userId(req), (state) => ({
      results: input.attempts.map((a) => ({
        clientAttemptId: a.clientAttemptId,
        ...processAttempt(state, a),
      })),
      progress: getProgress(state, clock.now()),
    }));
  });
  app.post<{ Params: { id: string } }>('/v1/lessons/:id/complete', (req) => {
    z.object({})
      .strict()
      .parse(req.body ?? {});
    return repo.mutate(userId(req), (state) => {
      const lesson = lessons[req.params.id];
      if (!lesson) throw new ApiError(404, 'Lección no encontrada.');
      if (!lesson.exercises.every((e) => state.visitedExercises[lesson.id]?.includes(e.id)))
        throw new ApiError(
          409,
          'Practica primero los ejercicios de esta lección. Puedes continuar aunque te equivoques.',
          'LESSON_INCOMPLETE',
        );
      let xpAwarded = 0;
      if (!state.completedLessons.includes(lesson.id)) {
        state.completedLessons.push(lesson.id);
        state.xp += 25;
        xpAwarded = 25;
      }
      const day = today(clock.now());
      if (!state.learningDays.includes(day)) state.learningDays.push(day);
      return { completed: true, xpAwarded, progress: getProgress(state, clock.now()) };
    });
  });
  app.get<{ Querystring: { all?: string } }>('/v1/reviews/today', (req) => {
    const state = stateFor(req);
    const now = clock.now();
    const reviews = state.mastery
      .filter((m) => req.query.all === 'true' || Date.parse(m.nextReviewAt) <= now)
      .sort((a, b) => a.value - b.value)
      .map((m) => {
        const lesson = Object.values(lessons).find((l) =>
          l.exercises.some((e) => e.skillId === m.skillId),
        );
        return {
          skillId: m.skillId,
          mastery: m.value,
          dueAt: m.nextReviewAt,
          due: Date.parse(m.nextReviewAt) <= now,
          lessonId: lesson?.id,
          exercises:
            lesson?.exercises
              .filter((e) => e.skillId === m.skillId)
              .slice(0, 3)
              .map(publicExercise) ?? [],
        };
      });
    return { reviews, total: reviews.length };
  });
  app.get('/v1/pronunciation/drills', () => ({
    drills: speechDrills,
    provider: 'not_configured',
    recordingsStored: false,
  }));
  app.post('/v1/speech/assess', async (req) => {
    userId(req);
    z.object({ referenceText: z.string().max(500), consent: z.literal(true) })
      .strict()
      .parse(req.body);
    return speech.assess();
  });
  app.get('/v1/placement', () => ({
    questions: placementQuestions.map(publicExercise),
    optional: true,
    contentStatus: 'draft',
  }));
  app.post('/v1/placement', (req) => {
    const body = z
      .object({
        answers: z
          .array(z.object({ exerciseId: z.string(), answer: answerSchema }).strict())
          .min(1)
          .max(15),
      })
      .strict()
      .parse(req.body);
    let correct = 0;
    const ids = new Set<string>();
    for (const a of body.answers) {
      if (ids.has(a.exerciseId)) throw new ApiError(400, 'Responde una vez a cada pregunta.');
      ids.add(a.exerciseId);
      const e = placementQuestions.find((e) => e.id === a.exerciseId);
      if (!e) throw new ApiError(400, 'Pregunta de diagnóstico inválida.');
      if (grading.grade(e, a.answer)) correct++;
    }
    const level = correct / body.answers.length >= 0.75 ? 'A2' : 'A1';
    return {
      level,
      correct,
      total: body.answers.length,
      feedbackEs:
        'Este diagnóstico es orientativo. Puedes explorar las lecciones a tu ritmo; no es una certificación.',
    };
  });
  app.get('/v1/missions', () => ({
    missions,
    provider: 'authored_finite_state',
    contentStatus: 'draft',
  }));
  app.get('/v1/challenges/tracks', (req) => {
    const state = stateFor(req);
    return {
      tracks: trackConfigs.map((t) => {
        const required = units.find((u) => u.id === t.requiredUnitId)?.lessons ?? [];
        return {
          ...t,
          unlocked: trackUnlocked(state, t.id),
          completedLessons: required.filter((l) => state.completedLessons.includes(l.id)).length,
          requiredLessons: required.length,
          published: false,
          rankedAvailable: false,
          highestPracticeLevel: Math.max(
            0,
            ...state.challengeProgress
              .filter((p) => p.trackId === t.id && p.mode === 'practice')
              .map((p) => p.highestLevel),
          ),
        };
      }),
      draftNoticeEs:
        'Contenido de demostración pendiente de revisión humana. Puedes practicar sin clasificación ni medallas oficiales.',
    };
  });
  app.get<{ Params: { id: string }; Querystring: { type?: string } }>(
    '/v1/challenges/tracks/:id/levels',
    (req) => {
      const state = stateFor(req);
      if (!trackConfigs.some((t) => t.id === req.params.id))
        throw new ApiError(404, 'Tema no encontrado.');
      const type = z
        .enum(['grammar_rush', 'cloze_battle', 'reading_quest'])
        .parse(req.query.type ?? 'grammar_rush');
      const progress = state.challengeProgress.find(
        (p) => p.trackId === req.params.id && p.type === type && p.mode === 'practice',
      );
      return {
        levels: challengeLevels.map((l) => ({
          level: l.level,
          nameEs: l.name_es,
          hearts: l.hearts,
          seconds: timeBudget(type, l.level, selectQuestions(type, l.level)),
          unlocked: true,
          bestScore: progress?.bestScores[String(l.level)] ?? 0,
        })),
        practiceOnly: true,
      };
    },
  );
  app.post('/v1/challenges/runs', (req) => {
    const input = runSchema.parse(req.body);
    const fp = digest(input);
    return repo.mutate(userId(req), (state) => {
      const prior = state.runRequests[input.clientRequestId];
      if (prior) {
        if (prior.fingerprint !== fp)
          throw new ApiError(
            409,
            'La solicitud ya se usó con otras reglas.',
            'IDEMPOTENCY_CONFLICT',
          );
        const run = getRun(state, prior.runId);
        finishRun(state, run, clock.now());
        return runView(run, clock.now());
      }
      if (input.mode === 'ranked')
        throw new ApiError(
          403,
          'Los desafíos oficiales están desactivados hasta revisar el contenido. Prueba el modo de práctica.',
          'CONTENT_NOT_REVIEWED',
        );
      if (input.trackId !== 'present_simple')
        throw new ApiError(
          503,
          'Este tema todavía está en preparación. Puedes practicar Daily routines.',
          'CONTENT_UNAVAILABLE',
        );
      const pool = challengePools[input.type];
      const count = input.type === 'grammar_rush' ? 10 : input.type === 'cloze_battle' ? 5 : 4;
      if (pool.length < count)
        throw new ApiError(503, 'Todavía estamos preparando este tema.', 'CONTENT_UNAVAILABLE');
      // A snapshot, not a live reference: later content changes cannot alter a run's keys.
      const selected = JSON.parse(
        JSON.stringify(selectQuestions(input.type, input.level)),
      ) as PrivateExercise[];
      const now = clock.now();
      const config = challengeLevels[input.level - 1]!;
      const id = crypto.randomUUID();
      const run: StoredRun = {
        id,
        trackId: input.trackId,
        type: input.type,
        level: input.level,
        mode: input.mode,
        relaxed: input.relaxed,
        contentVersion: 1,
        items: selected,
        startedAt: now,
        deadline: input.relaxed ? null : now + timeBudget(input.type, input.level, selected) * 1000,
        heartsInitial: config.hearts,
        hearts: config.hearts,
        position: 0,
        correctCount: 0,
        status: 'active',
        score: 0,
        answers: [],
        submissions: {},
      };
      state.runs[id] = run;
      state.runRequests[input.clientRequestId] = { fingerprint: fp, runId: id };
      return runView(run, now);
    });
  });
  app.get<{ Params: { id: string } }>('/v1/challenges/runs/:id/current', (req) =>
    repo.mutate(userId(req), (state) => {
      const run = getRun(state, req.params.id);
      finishRun(state, run, clock.now());
      return runView(run, clock.now());
    }),
  );
  app.post<{ Params: { id: string } }>('/v1/challenges/runs/:id/answers', (req) => {
    const input = submissionSchema.parse(req.body);
    const fp = digest(input);
    return repo.mutate(userId(req), (state) => {
      const run = getRun(state, req.params.id);
      const prior = run.submissions[input.clientSubmissionId];
      if (prior) {
        if (prior.fingerprint !== fp)
          throw new ApiError(
            409,
            'Esta respuesta ya se envió con otros datos.',
            'IDEMPOTENCY_CONFLICT',
          );
        return prior.result;
      }
      const now = clock.now();
      finishRun(state, run, now);
      if (run.status !== 'active') return runView(run, now);
      if (input.questionPosition !== run.position + 1)
        throw new ApiError(
          409,
          'La pregunta ya cambió. Recupera el estado del desafío.',
          'QUESTION_ORDER',
        );
      const e = run.items[run.position]!;
      const correct = grading.grade(e, input.answer);
      if (correct) run.correctCount++;
      else run.hearts = Math.max(0, run.hearts - 1);
      run.answers.push({
        questionId: e.id,
        correct,
        feedbackEs: e.feedbackEs,
        acceptedAnswer: exerciseAnswer(e),
      });
      run.position++;
      finishRun(state, run, now);
      const result = runView(run, now);
      run.submissions[input.clientSubmissionId] = { fingerprint: fp, result };
      return result;
    });
  });
  app.post<{ Params: { id: string } }>('/v1/challenges/runs/:id/finish', (req) => {
    z.object({})
      .strict()
      .parse(req.body ?? {});
    return repo.mutate(userId(req), (state) => {
      const run = getRun(state, req.params.id);
      finishRun(state, run, clock.now());
      return runView(run, clock.now());
    });
  });
  app.post<{ Params: { id: string } }>('/v1/challenges/runs/:id/abandon', (req) => {
    z.object({})
      .strict()
      .parse(req.body ?? {});
    return repo.mutate(userId(req), (state) => {
      const run = getRun(state, req.params.id);
      if (run.status === 'active') {
        run.status = 'abandoned';
        run.reason = 'user_exit';
      }
      return runView(run, clock.now());
    });
  });
  const staticRoot =
    options.staticRoot ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../mobile/dist');
  if (existsSync(resolve(staticRoot, 'index.html'))) {
    await app.register(staticFiles, { root: staticRoot, prefix: '/', wildcard: false });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/v1/') || req.url.startsWith('/health'))
        return reply.code(404).send({ error: 'Ruta no encontrada.', code: 'NOT_FOUND' });
      return reply.sendFile('index.html');
    });
  }
  return app;
}
