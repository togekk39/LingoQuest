import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OfflineEngine,
  OFFLINE_STATE_KEY,
  type CourseData,
  type OfflineState,
  type CourseExercise,
  type LocalStore,
} from '../src/index.ts';
import {
  units,
  lessons,
  challengePools,
  challengeLevels,
  placementQuestions,
  missions,
  speechDrills,
} from '../../../apps/api/src/content.ts';
import type { Progress, RunView, AttemptResult } from '@lingoquest/contracts';
const source: CourseData = {
  units,
  lessons,
  challengePools,
  challengeLevels: [...challengeLevels],
  placementQuestions,
  missions,
  speechDrills,
};
class MemoryStore implements LocalStore {
  data = new Map<string, string>();
  fail = false;
  async getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    if (this.fail) throw new Error('storage full');
    this.data.set(key, value);
  }
}
function fixture() {
  const store = new MemoryStore();
  let time = Date.parse('2026-11-08T12:00:00Z');
  let id = 0;
  let content = structuredClone(source);
  const engine = new OfflineEngine({
    store,
    getContent: () => content,
    clock: () => time,
    randomId: () => `local-id-${++id}`,
  });
  return {
    engine,
    store,
    advance: (ms: number) => {
      time += ms;
    },
    content: (next: CourseData) => {
      content = next;
    },
  };
}
const wrong = (e: CourseExercise) =>
  e.type === 'matching'
    ? { matches: Object.fromEntries((e.matchingPairs ?? []).map((p) => [p.id, 'wrong'])) }
    : e.options
      ? { optionId: e.options.find((o) => o.id !== e.correctOptionId)!.id }
      : { text: 'Deliberately wrong.' };
const correct = (e: CourseExercise) =>
  e.type === 'matching'
    ? { matches: Object.fromEntries((e.matchingPairs ?? []).map((p) => [p.id, p.id])) }
    : e.options
      ? { optionId: e.correctOptionId! }
      : { text: e.acceptedAnswers.find((a) => a !== e.correctOptionId)! };
async function solve(engine: OfflineEngine, lessonId: string, right = false, prefix = lessonId) {
  const lesson = source.lessons[lessonId];
  for (const [i, e] of lesson.exercises.entries())
    await engine.request('/v1/attempts', {
      clientAttemptId: `${prefix}-event-${i}`,
      lessonId,
      exerciseId: e.id,
      answer: right ? correct(e) : wrong(e),
    });
  return engine.request<{ xpAwarded: number; completed: boolean }>(
    `/v1/lessons/${lessonId}/complete`,
    {},
  );
}

async function unlock(engine: OfflineEngine) {
  for (const unit of source.units.slice(0, 2))
    for (const lesson of unit.lessons) await solve(engine, lesson.id);
}

test('fresh install has all text course content without ever contacting a service', async () => {
  const { engine, store } = fixture();
  const p = await engine.initialize();
  assert.equal(p.user.name, 'Explorador');
  assert.equal(p.user.email, undefined);
  const catalog = await engine.request<{ units: unknown[] }>('/v1/catalog');
  assert.equal(catalog.units.length, 8);
  const lesson = await engine.request<{ exercises: Record<string, unknown>[] }>(
    '/v1/lessons/u01_l01',
  );
  assert.ok(lesson.exercises.length >= 6);
  assert.ok(!('acceptedAnswers' in lesson.exercises[0]));
  assert.ok(store.data.has(OFFLINE_STATE_KEY));
});
test('wrong attempts are graded immediately offline, speaking is unnecessary and completion awards XP once', async () => {
  const { engine } = fixture();
  const result = await solve(engine, 'u01_l01');
  assert.equal(result.completed, true);
  assert.equal(result.xpAwarded, 25);
  assert.equal(
    (await engine.request<{ xpAwarded: number }>('/v1/lessons/u01_l01/complete', {})).xpAwarded,
    0,
  );
  const p = await engine.request<Progress>('/v1/me/progress');
  assert.deepEqual(p.completedLessons, ['u01_l01']);
  assert.equal(p.xp, 25);
  assert.ok(p.mastery.every((m) => m.value < 1));
});
test('attempt replay and concurrent writes are serial and idempotent; changed replay is rejected', async () => {
  const { engine } = fixture();
  const e = source.lessons.u01_l01.exercises[0];
  const input = {
    clientAttemptId: 'stable-attempt-event',
    lessonId: 'u01_l01',
    exerciseId: e.id,
    answer: correct(e),
  };
  const responses = await Promise.all(
    Array.from({ length: 10 }, () => engine.request<AttemptResult>('/v1/attempts', input)),
  );
  assert.ok(responses.every((r) => r.correct && !r.pending));
  assert.equal((await engine.request<Progress>('/v1/me/progress')).mastery[0].evidenceCount, 1);
  await assert.rejects(
    engine.request('/v1/attempts', { ...input, answer: wrong(e) }),
    /otra respuesta/,
  );
});
test('all 32 integrated lessons complete fully offline without any challenge', async () => {
  const { engine } = fixture();
  for (const unit of source.units)
    for (const lesson of unit.lessons) await solve(engine, lesson.id);
  const p = await engine.request<Progress>('/v1/me/progress');
  assert.equal(p.completedLessons.length, 32);
  assert.equal(p.xp, 800);
  assert.deepEqual(p.challengeProgress, []);
});
test('local progress survives engine restart and content updates with stable identifiers', async () => {
  const f = fixture();
  await solve(f.engine, 'u01_l01', true);
  const updated = structuredClone(source);
  updated.lessons.u01_l01.title = 'Título actualizado';
  f.content(updated);
  assert.equal(
    (await f.engine.request<{ title: string }>('/v1/lessons/u01_l01')).title,
    'Título actualizado',
  );
  const restarted = new OfflineEngine({ store: f.store, getContent: () => updated });
  const p = await restarted.initialize();
  assert.equal(p.xp, 25);
  assert.deepEqual(p.completedLessons, ['u01_l01']);
});
test('related units keep standard track locked until all taught prerequisites are completed', async () => {
  const { engine } = fixture();
  for (const lesson of source.units[0].lessons) await solve(engine, lesson.id);
  for (const id of ['u02_l01', 'u02_l02', 'u02_l03']) await solve(engine, id);
  const locked = await engine.request<{ tracks: { id: string; unlocked: boolean }[] }>(
    '/v1/challenges/tracks',
  );
  assert.equal(locked.tracks[0].unlocked, false);
  await solve(engine, 'u02_l04');
  const open = await engine.request<{ tracks: { id: string; unlocked: boolean }[] }>(
    '/v1/challenges/tracks',
  );
  assert.equal(open.tracks[0].unlocked, true);
  assert.equal((await engine.request<Progress>('/v1/me/progress')).xp, 200);
});
test('thirteen local practice levels are available; official online/ranked modes are disabled', async () => {
  const { engine } = fixture();
  const result = await engine.request<{ levels: unknown[] }>(
    '/v1/challenges/tracks/present_simple/levels',
  );
  assert.equal(result.levels.length, 13);
  await assert.rejects(
    engine.request('/v1/challenges/runs', {
      clientRequestId: 'ranked-disabled-1',
      trackId: 'present_simple',
      level: 1,
      mode: 'ranked',
    }),
    /Solo hay práctica local/,
  );
  for (const path of ['/v1/auth/login', '/v1/sync/attempts'])
    await assert.rejects(engine.request(path, {}), /sin cuenta/);
});
test('challenge wrong answers, timeout and request replay change only local challenge records', async () => {
  const f = fixture();
  await unlock(f.engine);
  const before = await f.engine.request<Progress>('/v1/me/progress');
  const input = {
    clientRequestId: 'local-challenge-13',
    trackId: 'present_simple',
    level: 13,
    mode: 'practice',
    relaxed: true,
  };
  const run = await f.engine.request<RunView>('/v1/challenges/runs', input);
  assert.equal(run.deadlineAt, null);
  const stored = JSON.parse(f.store.data.get(OFFLINE_STATE_KEY)!) as OfflineState;
  const e = stored.runs[run.runId].items[0];
  const answer = { clientSubmissionId: 'wrong-event-13', questionPosition: 1, answer: wrong(e) };
  const failed = await f.engine.request<RunView>(
    `/v1/challenges/runs/${run.runId}/answers`,
    answer,
  );
  assert.equal(failed.status, 'failed');
  assert.equal(failed.heartsRemaining, 0);
  assert.deepEqual(
    await f.engine.request(`/v1/challenges/runs/${run.runId}/answers`, answer),
    failed,
  );
  const timed = await f.engine.request<RunView>('/v1/challenges/runs', {
    ...input,
    clientRequestId: 'local-timer-1',
    level: 1,
    relaxed: false,
  });
  f.advance(181000);
  assert.equal(
    (await f.engine.request<RunView>(`/v1/challenges/runs/${timed.runId}/current`)).reason,
    'timeout',
  );
  const after = await f.engine.request<Progress>('/v1/me/progress');
  assert.equal(after.xp, before.xp);
  assert.deepEqual(after.completedLessons, before.completedLessons);
  assert.deepEqual(after.mastery, before.mastery);
});
test('reading and cloze budgets remain independent of grammar rush', async () => {
  const { engine } = fixture();
  await unlock(engine);
  for (const [type, min] of [
    ['reading_quest', 180],
    ['cloze_battle', 150],
  ] as const) {
    const run = await engine.request<RunView>('/v1/challenges/runs', {
      clientRequestId: `local-budget-${type}`,
      trackId: 'present_simple',
      type,
      level: 13,
      mode: 'practice',
      relaxed: false,
    });
    assert.ok(Date.parse(run.deadlineAt!) - Date.parse(run.serverNow) >= min * 1000);
  }
});
test('delayed recall evidence survives recognition items on a later-day lesson revisit', async () => {
  const f = fixture();
  await solve(f.engine, 'u01_l01', true, 'first-day');
  f.advance(2 * 86400000);
  await solve(f.engine, 'u01_l01', true, 'later-day');
  const p = await f.engine.request<Progress>('/v1/me/progress');
  assert.ok(p.xp > 25);
  assert.ok(p.mastery.some((m) => m.lastDelayedSuccessAt));
});
test('backup restore validates data, preserves learning and personal bests, and resets unfinished challenge snapshots', async () => {
  const f = fixture();
  await solve(f.engine, 'u01_l01');
  await f.engine.request('/v1/me/settings', { name: 'Ana', goalMinutes: 15 });
  const backup = await f.engine.request<any>('/v1/me/export');
  await f.engine.request('/v1/me', undefined, 'DELETE');
  assert.equal((await f.engine.initialize()).xp, 0);
  await f.engine.request('/v1/me/import', { backup });
  const p = await f.engine.initialize();
  assert.equal(p.user.name, 'Ana');
  assert.equal(p.xp, 25);
  const bad = structuredClone(backup);
  bad.state.xp = -1;
  await assert.rejects(f.engine.request('/v1/me/import', { backup: bad }), /formato/);
  assert.equal((await f.engine.initialize()).xp, 25);
});
test('failed device writes do not falsely award or discard progress', async () => {
  const f = fixture();
  await f.engine.initialize();
  f.store.fail = true;
  await assert.rejects(f.engine.request('/v1/me/settings', { name: 'Unsaved' }), /storage full/);
  f.store.fail = false;
  assert.equal((await f.engine.initialize()).user.name, 'Explorador');
});

test('all thirteen local levels finish with personal records and never grant official badges or learning XP', async () => {
  const f = fixture();
  await unlock(f.engine);
  const before = await f.engine.initialize();
  for (let level = 1; level <= 13; level++) {
    let run = await f.engine.request<RunView>('/v1/challenges/runs', {
      clientRequestId: `complete-local-level-${level}`,
      trackId: 'present_simple',
      level,
      mode: 'practice',
      relaxed: true,
    });
    while (run.status === 'active') {
      const state = JSON.parse(f.store.data.get(OFFLINE_STATE_KEY)!) as OfflineState;
      const current = state.runs[run.runId];
      run = await f.engine.request<RunView>(`/v1/challenges/runs/${run.runId}/answers`, {
        clientSubmissionId: `complete-${level}-question-${run.questionPosition}`,
        questionPosition: run.questionPosition,
        answer: correct(current.items[current.position]),
      });
    }
    assert.equal(run.status, 'passed');
  }
  const p = await f.engine.initialize();
  assert.equal(p.challengeProgress[0].highestLevel, 13);
  assert.equal(p.challengeProgress[0].badge, false);
  assert.equal(p.xp, before.xp);
  assert.deepEqual(p.mastery, before.mastery);
  assert.deepEqual(p.completedLessons, before.completedLessons);
});

test('confirmed reset recovers unreadable local JSON without needing to load the old state or course', async () => {
  const store = new MemoryStore();
  store.data.set(OFFLINE_STATE_KEY, '{damaged-json');
  let courseAvailable = false;
  const engine = new OfflineEngine({
    store,
    getContent: () => {
      if (!courseAvailable) throw new Error('damaged course');
      return source;
    },
    randomId: () => 'reset-local-profile',
  });
  await assert.rejects(engine.initialize(), /datos locales/);
  const result = await engine.request<{ deleted: boolean }>('/v1/me', undefined, 'DELETE');
  assert.equal(result.deleted, true);
  const reset = JSON.parse(store.data.get(OFFLINE_STATE_KEY)!) as OfflineState;
  assert.equal(reset.user.id, 'reset-local-profile');
  assert.equal(reset.xp, 0);
  assert.deepEqual(reset.completedLessons, []);
  courseAvailable = true;
  assert.equal((await engine.initialize()).xp, 0);
});

test('untrusted backup dictionary keys stay data and cannot change object prototypes', async () => {
  const f = fixture();
  const backup = await f.engine.request<any>('/v1/me/export');
  backup.state.visitedExercises = JSON.parse(
    '{"__proto__":["pollution"],"constructor":["ordinary-data"]}',
  );
  backup.state.attempts = JSON.parse(
    '{"__proto__":{"fingerprint":"pollution","result":{"correct":false,"feedbackEs":"test","xpAwarded":0,"pending":false}}}',
  );
  await f.engine.request('/v1/me/import', { backup });
  assert.equal(Object.hasOwn(Object.prototype, 'pollution'), false);
  assert.equal(({} as Record<string, unknown>).pollution, undefined);
  const stored = JSON.parse(f.store.data.get(OFFLINE_STATE_KEY)!) as OfflineState;
  assert.ok(!Object.hasOwn(stored.visitedExercises, '__proto__'));
  assert.deepEqual(stored.visitedExercises.constructor, ['ordinary-data']);
  await solve(f.engine, 'u01_l01');
  assert.equal((await f.engine.initialize()).xp, 25);
});

test('recognition, vocabulary recall and grammar evidence have separate targets and never become mastered from one choice', async () => {
  const f = fixture();
  const content = structuredClone(source);
  const lesson = content.lessons.u01_l01;
  const base = lesson.exercises[0];
  const recognition: CourseExercise = {
    ...base,
    id: 'evidence-recognition',
    type: 'meaning',
    dimension: 'vocabulary_recognition',
    vocabularyIds: ['v.hello'],
    options: [
      { id: 'a', text: 'hola' },
      { id: 'b', text: 'adiós' },
    ],
    correctOptionId: 'a',
    acceptedAnswers: ['a'],
    skillId: 'grammar.be_first',
  };
  const recall: CourseExercise = {
    ...base,
    id: 'evidence-recall',
    type: 'short_text',
    dimension: 'vocabulary_recall',
    vocabularyIds: ['v.hello'],
    options: undefined,
    correctOptionId: undefined,
    acceptedAnswers: ['hello'],
    skillId: 'grammar.be_first',
  };
  const grammar: CourseExercise = {
    ...recall,
    id: 'evidence-grammar',
    dimension: 'grammar_production',
    acceptedAnswers: ['I am Ana'],
  };
  const understanding: CourseExercise = {
    ...recognition,
    id: 'evidence-understanding',
    dimension: 'grammar_understanding',
  };
  lesson.exercises = [recognition, recall, understanding, grammar];
  f.content(content);
  for (const e of lesson.exercises)
    await f.engine.request('/v1/attempts', {
      clientAttemptId: `dimension-${e.id}`,
      lessonId: lesson.id,
      exerciseId: e.id,
      answer: correct(e),
    });
  const p = await f.engine.initialize();
  assert.equal(p.mastery.length, 4);
  assert.deepEqual(
    new Set(p.mastery.map((m) => m.dimension)),
    new Set([
      'vocabulary_recognition',
      'vocabulary_recall',
      'grammar_understanding',
      'grammar_production',
    ]),
  );
  assert.equal(
    p.mastery.find((m) => m.dimension === 'vocabulary_recognition')?.unpromptedSuccessCount,
    0,
  );
  assert.equal(
    p.mastery.find((m) => m.dimension === 'vocabulary_recall')?.unpromptedSuccessCount,
    1,
  );
  assert.ok(p.mastery.every((m) => m.value < 0.2 && m.lastDelayedSuccessAt === null));
  const reviews = await f.engine.request<{
    reviews: { key: string; targetId: string; dimension: string }[];
  }>('/v1/reviews/today?all=true');
  assert.equal(new Set(reviews.reviews.map((r) => r.key)).size, 4);
  assert.equal((await f.engine.request<{ total: number }>('/v1/reviews/today')).total, 0);
});

test('matching is graded as a complete one-to-one mapping and wrong retries remain friendly', async () => {
  const f = fixture();
  const content = structuredClone(source);
  const lesson = content.lessons.u01_l01;
  const exercise: CourseExercise = {
    ...lesson.exercises[0],
    type: 'matching',
    matchingPairs: [
      { id: 'hello', left: 'hello', right: 'hola' },
      { id: 'bye', left: 'goodbye', right: 'adiós' },
    ],
    acceptedAnswers: [],
    correctOptionId: undefined,
    options: undefined,
    dimension: 'vocabulary_recognition',
    vocabularyIds: ['v.hello', 'v.bye'],
  };
  lesson.exercises = [exercise];
  f.content(content);
  const submit = (answer: unknown, id: string) =>
    f.engine.request<AttemptResult>('/v1/attempts', {
      clientAttemptId: `matching-${id}`,
      lessonId: lesson.id,
      exerciseId: exercise.id,
      answer,
    });
  assert.equal((await submit({ matches: { hello: 'hello' } }, 'incomplete')).correct, false);
  assert.equal((await submit({ matches: { hello: 'bye', bye: 'hello' } }, 'wrong')).correct, false);
  const result = await submit({ matches: { hello: 'hello', bye: 'bye' } }, 'retry');
  assert.equal(result.correct, true);
  assert.match(result.acceptedAnswer!, /hello = hola/);
  assert.equal((await f.engine.initialize()).xp, 0);
});

test('direct challenge calls cannot bypass related learning even in relaxed mode', async () => {
  const f = fixture();
  await assert.rejects(
    f.engine.request('/v1/challenges/runs', {
      clientRequestId: 'locked-challenge-direct',
      trackId: 'present_simple',
      type: 'grammar_rush',
      level: 1,
      mode: 'practice',
      relaxed: true,
    }),
    (error: unknown) =>
      error instanceof Error && 'code' in error && error.code === 'CHALLENGE_LOCKED',
  );
  const levels = await f.engine.request<{ levels: { unlocked: boolean }[] }>(
    '/v1/challenges/tracks/present_simple/levels',
  );
  assert.equal(levels.levels.length, 13);
  assert.ok(levels.levels.every((l) => !l.unlocked));
});

test('challenge pools exclude questions linked to unfinished lessons', async () => {
  const f = fixture();
  await unlock(f.engine);
  const content = structuredClone(source);
  content.challengePools.grammar_rush.unshift({
    ...content.challengePools.grammar_rush[0],
    id: 'unlearned-future-question',
    difficulty: 1,
    requiredLessonIds: ['u08_l04'],
  });
  f.content(content);
  const run = await f.engine.request<RunView>('/v1/challenges/runs', {
    clientRequestId: 'learned-pool-only',
    trackId: 'present_simple',
    type: 'grammar_rush',
    level: 1,
    mode: 'practice',
    relaxed: true,
  });
  const state = JSON.parse(f.store.data.get(OFFLINE_STATE_KEY)!) as OfflineState;
  assert.ok(state.runs[run.runId].items.every((e) => e.id !== 'unlearned-future-question'));
});

test('previous development state stays untouched until a deliberate reset; previous backups are rejected clearly', async () => {
  const f = fixture();
  const oldState = JSON.stringify({
    formatVersion: 1,
    user: { name: 'Previous learner' },
    completedLessons: ['old_lesson'],
    xp: 250,
  });
  f.store.data.set(OFFLINE_STATE_KEY, oldState);
  await assert.rejects(
    f.engine.initialize(),
    (error: unknown) =>
      error instanceof Error && 'code' in error && error.code === 'LOCAL_DATA_RESET_REQUIRED',
  );
  assert.equal(f.store.data.get(OFFLINE_STATE_KEY), oldState);
  await f.engine.request('/v1/me', undefined, 'DELETE');
  assert.equal((await f.engine.initialize()).xp, 0);
  const backup = await f.engine.request<any>('/v1/me/export');
  assert.equal(backup.formatVersion, 2);
  backup.formatVersion = 1;
  await assert.rejects(
    f.engine.request('/v1/me/import', { backup }),
    /curso de desarrollo anterior/,
  );
  assert.equal((await f.engine.initialize()).xp, 0);
});

test('repeating one recognition question on later days cannot stand in for varied recall or production', async () => {
  const f = fixture();
  const content = structuredClone(source);
  const lesson = content.lessons.u01_l01;
  const exercise: CourseExercise = {
    ...lesson.exercises[0],
    type: 'meaning',
    dimension: 'vocabulary_recognition',
    vocabularyIds: ['v.hello'],
    options: [
      { id: 'a', text: 'hola' },
      { id: 'b', text: 'adiós' },
    ],
    correctOptionId: 'a',
    acceptedAnswers: ['a'],
  };
  lesson.exercises = [exercise];
  f.content(content);
  for (let day = 0; day < 20; day++) {
    await f.engine.request('/v1/attempts', {
      clientAttemptId: `single-format-day-${day}`,
      lessonId: lesson.id,
      exerciseId: exercise.id,
      answer: { optionId: 'a' },
    });
    f.advance(2 * 86400000);
  }
  const p = await f.engine.initialize();
  assert.equal(p.mastery.length, 1);
  assert.equal(p.mastery[0].dimension, 'vocabulary_recognition');
  assert.equal(p.mastery[0].value, 0.65);
  assert.equal(p.mastery[0].unpromptedSuccessCount, 0);
  assert.equal(p.xp, 0);
});
