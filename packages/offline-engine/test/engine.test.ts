import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  OfflineEngine,
  OFFLINE_STATE_KEY,
  chapter,
  getUnifiedMastery,
  type CourseData,
  type OfflineState,
  type CourseExercise,
  type LessonCheckpoint,
  type LocalStore,
  type QuickReviewState,
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
import {
  challengeQuestionCount,
  challengeRequiredUnit,
  selectChallengeQuestions,
  type Progress,
  type RunView,
  type AttemptResult,
} from '@lingoquest/contracts';
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

async function unlock(engine: OfflineEngine, throughUnit = 8) {
  for (const unit of source.units.slice(0, throughUnit))
    for (const lesson of unit.lessons) await solve(engine, lesson.id, true);
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
test('an in-progress lesson resumes appended practice once and retains progress', async () => {
  const { engine, store, content } = fixture();
  const lessonId = 'u01_l02';
  const previousContent = structuredClone(source);
  const previousLesson = previousContent.lessons[lessonId];
  const practice = previousLesson.stages!.findIndex(({ type }) => type === 'practice');
  const speaking = previousLesson.stages!.findIndex(({ type }) => type === 'speaking');
  const addedExercise = previousLesson.exercises.pop()!;
  assert.equal(addedExercise.id, 'u01_l02_practice_5');
  previousLesson.stages![practice].exerciseIds!.pop();
  content(previousContent);

  await solve(engine, 'u01_l01', true);
  for (const exercise of previousLesson.exercises) {
    await engine.request('/v1/attempts', {
      clientAttemptId: `previous-${exercise.id}`,
      lessonId,
      exerciseId: exercise.id,
      answer: correct(exercise),
    });
  }
  const path = `/v1/lessons/${lessonId}/checkpoint`;
  const saved: LessonCheckpoint = {
    activityId: 'original-activity',
    eventId: 'original-event',
    stage: speaking,
    vocabulary: 0,
    exercise: -1,
    answer: {},
    hint: false,
    help: false,
    xp: 5,
    weak: [previousLesson.exercises[0].id],
    reviewAt: null,
  };
  await engine.request(path, saved);
  assert.deepEqual((await engine.request<{ saved: LessonCheckpoint }>(path)).saved, saved);
  const priorState: OfflineState = JSON.parse((await store.getItem(OFFLINE_STATE_KEY))!);

  content(source);
  const resumed = await engine.request<{ saved: LessonCheckpoint }>(path);
  assert.equal(resumed.saved.stage, practice);
  assert.equal(resumed.saved.exercise, previousLesson.stages![practice].exerciseIds!.length);
  assert.equal(resumed.saved.activityId, saved.activityId);
  assert.notEqual(resumed.saved.eventId, saved.eventId);
  assert.equal(resumed.saved.xp, saved.xp);
  assert.deepEqual(resumed.saved.weak, saved.weak);
  assert.deepEqual(await engine.request(path), resumed);
  const resumedState: OfflineState = JSON.parse((await store.getItem(OFFLINE_STATE_KEY))!);
  assert.deepEqual(resumedState.completedLessons, priorState.completedLessons);
  assert.deepEqual(resumedState.attempts, priorState.attempts);
  assert.deepEqual(resumedState.mastery, priorState.mastery);

  await engine.request('/v1/attempts', {
    clientAttemptId: resumed.saved.eventId,
    lessonId,
    exerciseId: addedExercise.id,
    answer: correct(addedExercise),
  });
  await engine.request(`/v1/lessons/${lessonId}/complete`, {});
  assert.deepEqual((await engine.initialize()).completedLessons, ['u01_l01', lessonId]);
});
test('standard challenges require taught lessons and independent production', async () => {
  const { engine, advance } = fixture();
  for (const lesson of source.units[0].lessons) await solve(engine, lesson.id);
  for (const id of ['u02_l01', 'u02_l02', 'u02_l03']) await solve(engine, id);
  const locked = await engine.request<{ tracks: { id: string; unlocked: boolean }[] }>(
    '/v1/challenges/tracks',
  );
  assert.equal(locked.tracks[0].unlocked, false);
  await solve(engine, 'u02_l04');
  const completed = await engine.request<{
    tracks: { unlocked: boolean; needsEvidence: boolean }[];
  }>('/v1/challenges/tracks');
  assert.deepEqual(
    [completed.tracks[0].unlocked, completed.tracks[0].needsEvidence],
    [false, true],
  );
  assert.equal((await engine.request<Progress>('/v1/me/progress')).xp, 200);
  advance(86_400_000);
  for (const unit of source.units.slice(0, 2))
    for (const lesson of unit.lessons)
      await solve(engine, lesson.id, true, `verified-${lesson.id}`);
  const open = await engine.request<{ tracks: { id: string; unlocked: boolean }[] }>(
    '/v1/challenges/tracks',
  );
  assert.equal(open.tracks[0].unlocked, true);
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
test('bundling the textbook preserves the travel challenge rules and keeps rank progress separate', async () => {
  const { engine, store } = fixture();
  await engine.initialize();
  const state = JSON.parse(store.data.get(OFFLINE_STATE_KEY)!) as OfflineState;
  const date = '2026-11-08T12:00:00.000Z';
  state.travel = {
    completed: { bag: date },
    cleared: ['hello', 'bus'],
    stamps: { [chapter.id]: date },
  };
  store.data.set(OFFLINE_STATE_KEY, JSON.stringify(state));

  type Rank = { nameEs: string; seconds: number; hearts: number; unlocked: boolean };
  const homeLevels = '/v1/challenges/tracks/home_journey/levels';
  const runPath = '/v1/challenges/runs';
  const input = {
    clientRequestId: 'travel-rank-with-textbook',
    trackId: 'home_journey',
    type: 'grammar_rush',
    level: 1,
    mode: 'practice',
  };
  const placed = await engine.request<{ levels: Rank[] }>(homeLevels);
  assert.ok(placed.levels.every((rank) => !rank.unlocked));
  await assert.rejects(engine.request(runPath, input), /Primero completa las lecciones/);

  state.travel.completed = Object.fromEntries(
    chapter.missions.map((mission) => [mission.id, date]),
  );
  store.data.set(OFFLINE_STATE_KEY, JSON.stringify(state));
  for (const [exerciseId, text] of [
    ['travel_hello_write', 'Hi! I am Ana.'],
    ['travel_bus_ask', 'Where is the bus stop?'],
    ['travel_bag_write', 'It is blue.'],
  ])
    await engine.request('/v1/attempts', {
      lessonId: 'travel_home',
      exerciseId,
      answer: { text },
      clientAttemptId: `verified-${exerciseId}`,
    });
  const [travel, textbook] = await Promise.all([
    engine.request<{ levels: Rank[] }>(homeLevels),
    engine.request<{ levels: Rank[] }>('/v1/challenges/tracks/present_simple/levels'),
  ]);
  assert.equal(travel.levels[0].nameEs, 'Explorador');
  assert.equal(travel.levels[0].hearts, 3);
  assert.equal(travel.levels[0].seconds, 85);
  assert.equal(travel.levels.filter((rank) => rank.unlocked).length, 3);
  assert.equal(textbook.levels[0].nameEs, 'Primeros pasos');
  assert.equal(textbook.levels[0].seconds, 180);
  assert.equal(textbook.levels.filter((rank) => rank.unlocked).length, 0);
  const run = await engine.request<RunView>(runPath, input);
  assert.equal(run.heartsRemaining, 3);
  assert.equal(Date.parse(run.deadlineAt!) - Date.parse(run.serverNow), 85_000);
  const submit = (runId: string) =>
    engine.request<RunView>(`${runPath}/${runId}/answers`, {
      clientSubmissionId: 'verified-home-challenge-answer',
      questionPosition: 1,
      answer: { text: 'is' },
    });
  assert.deepEqual(await submit(run.runId), await submit(run.runId));
  const repeat = await engine.request<RunView>(runPath, {
    ...input,
    clientRequestId: 'travel-rank-repeat',
  });
  await submit(repeat.runId);

  const beforeUpdate = JSON.parse(store.data.get(OFFLINE_STATE_KEY)!) as OfflineState;
  const challengeEvidence = beforeUpdate.unifiedLearning.evidence.filter(
    (entry) => entry.source === 'challenge',
  );
  assert.equal(challengeEvidence.length, 2);
  assert.equal(
    getUnifiedMastery(beforeUpdate.unifiedLearning, 'home.introduce', 'grammar_understanding')
      .independentSuccesses,
    1,
  );
  beforeUpdate.travel!.completed = { bag: date };
  store.data.set(OFFLINE_STATE_KEY, JSON.stringify(beforeUpdate));
  const resumed = await engine.request<RunView>(runPath, input);
  assert.equal(resumed.runId, run.runId);
  assert.equal(resumed.heartsRemaining, run.heartsRemaining);
});
test('upper travel ranks require the matching lessons and use production without options', async () => {
  const { engine } = fixture();
  await unlock(engine, 2);
  const view = await engine.request<{ levels: { unlocked: boolean; unlockUnit: string }[] }>(
    '/v1/challenges/tracks/present_simple/levels',
  );
  assert.equal(view.levels[7].unlocked, true);
  assert.equal(view.levels[8].unlocked, false);
  assert.equal(view.levels[8].unlockUnit, 'u04');
  const request = {
    trackId: 'present_simple',
    mode: 'practice',
    level: 13,
    clientRequestId: 'travel-advanced-test',
  };
  await assert.rejects(engine.request('/v1/challenges/runs', request), /Completa|completa/);
  for (const unit of source.units.slice(2))
    for (const lesson of unit.lessons) await solve(engine, lesson.id, true);
  const run = await engine.request<RunView>('/v1/challenges/runs', request);
  assert.equal(run.question?.type, 'short_text');
  assert.equal(run.question?.options, undefined);
  assert.ok(run.question?.requiredLessonIds?.includes('u08_l04'));
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
test('backup restore preserves previous challenge answers without resuming a timed run', async () => {
  const { engine } = fixture();
  await unlock(engine, 2);
  const run = await engine.request<RunView>('/v1/challenges/runs', {
    clientRequestId: 'legacy-history-request',
    trackId: 'present_simple',
    type: 'grammar_rush',
    level: 1,
    mode: 'practice',
    relaxed: false,
  });
  const question = source.challengePools.grammar_rush.find(({ id }) => id === run.question?.id)!;
  const reply = {
    clientSubmissionId: 'legacy-history-reply',
    questionPosition: 1,
    answer: correct(question),
  };
  await engine.request(`/v1/challenges/runs/${run.runId}/answers`, reply);
  const backup = await engine.request<{ state: Partial<OfflineState> }>('/v1/me/export');
  delete backup.state.unifiedLearning;
  await engine.request('/v1/me/import', { backup });
  const restored = await engine.request<{ state: OfflineState }>('/v1/me/export');
  assert.deepEqual(restored.state.runs, {});
  assert.deepEqual(restored.state.challengeProgress, backup.state.challengeProgress);
  assert.deepEqual(restored.state.unifiedLearning.evidence, []);
  assert.equal(restored.state.challengeHistory?.[0].answers[0].questionId, question.id);
  assert.equal(
    JSON.parse(
      restored.state.challengeHistory![0].submissions[reply.clientSubmissionId].fingerprint,
    ).clientSubmissionId,
    reply.clientSubmissionId,
  );
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
  await unlock(f.engine, 2);
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

test('every challenge mode uses distinct content across 13 ranks and reaches every authored item', () => {
  for (const type of ['grammar_rush', 'cloze_battle', 'reading_quest'] as const) {
    const pool = challengePools[type];
    const rankSignatures = new Set<string>();
    const reachable = new Set<string>();
    for (let rank = 1; rank <= 13; rank++) {
      const lastUnit = challengeRequiredUnit(challengePools.grammar_rush, rank);
      const taught = new Set(
        units
          .slice(0, Number(lastUnit.slice(1)))
          .flatMap((unit) => unit.lessons.map(({ id }) => id)),
      );
      const selection = selectChallengeQuestions(pool, type, rank, (item) =>
        item.requiredLessonIds!.every((id) => taught.has(id)),
      );
      assert.equal(selection.length, challengeQuestionCount(type), `${type}, rank ${rank}`);
      rankSignatures.add(
        selection
          .map(({ id }) => id)
          .sort()
          .join(','),
      );
      for (const item of selection) reachable.add(item.id);
    }
    assert.equal(rankSignatures.size, 13, `${type} changes from rank to rank`);
    assert.equal(reachable.size, pool.length, `${type} reaches every authored question`);
  }
});

test('course quick review teaches its starter word before assessment and reuses visited material', async () => {
  const { engine } = fixture();
  const path = '/v1/reviews/quick?source=course';
  const starter = await engine.request<QuickReviewState>(path);
  assert.equal(starter.starter, true);
  assert.match(starter.exercise.promptEs, /«hello» significa «hola»/i);
  const question = lessons[starter.lessonId].exercises.find(({ id }) => id === starter.exerciseId)!;
  await engine.request(path, { action: 'answer', token: starter.token, answer: correct(question) });
  const review = await engine.request<{ reviews: { exercises: { id: string }[] }[] }>(
    '/v1/reviews/today?source=course&all=true',
  );
  assert.deepEqual(
    review.reviews.flatMap(({ exercises }) => exercises.map(({ id }) => id)),
    [question.id],
  );
});

test('course placement recommends A2 only after evidence on later material', async () => {
  const { engine } = fixture();
  const answers = placementQuestions.map((question) => ({
    exerciseId: question.id,
    answer:
      question.type === 'reorder'
        ? { tokens: question.acceptedAnswers[0]!.replace(/[.?!]$/, '').split(' ') }
        : correct(question),
  }));
  const assess = (responses: typeof answers) =>
    engine.request<{ level: string; correct: number }>('/v1/placement', { answers: responses });
  assert.equal((await assess(answers.slice(0, 1))).level, 'A1');
  const onlyEarlier = answers.map((entry, index) =>
    index < 9 ? entry : { ...entry, answer: wrong(placementQuestions[index]) },
  );
  assert.equal((await assess(onlyEarlier)).level, 'A1');
  const result = await assess(answers);
  assert.equal(result.correct, 12);
  assert.equal(result.level, 'A2');
});

test('placement is idempotent diagnostic evidence and cannot unlock a Home challenge', async () => {
  const { engine, store } = fixture();
  const path = '/v1/travel/placement';
  const request = {
    assessmentId: 'home-orientation-session',
    answers: [
      { answer: { optionId: 'name' }, transcript: false },
      { answer: { text: 'My name is Ana.' }, transcript: false },
      { answer: { optionId: 'stop' }, transcript: false },
      { answer: { tokens: ['It’s', 'next', 'to', 'the', 'park'] }, transcript: false },
      { answer: { optionId: 'blue' }, transcript: false },
      { answer: { text: 'It is blue.' }, transcript: false },
    ],
  };
  await engine.request(path, request);
  await engine.request(path, request);
  const state = JSON.parse(store.data.get(OFFLINE_STATE_KEY)!) as OfflineState;
  assert.equal(state.unifiedLearning.evidence.length, 6);
  assert.ok(state.unifiedLearning.evidence.every(({ source }) => source === 'placement'));
  assert.equal(
    getUnifiedMastery(state.unifiedLearning, 'home.introduce', 'writing').state,
    'not_introduced',
  );
  const result = await engine.request<{ levels: { unlocked: boolean }[] }>(
    '/v1/challenges/tracks/home_journey/levels',
  );
  assert.ok(result.levels.every(({ unlocked }) => !unlocked));
});

test('canonical review persists guided support then checks the same skill in another context', async () => {
  const { engine, store } = fixture();
  async function storyAnswer(exerciseId: string, answer: object) {
    return engine.request('/v1/attempts', {
      lessonId: 'travel_home',
      exerciseId,
      answer,
      clientAttemptId: `initial-${exerciseId}`,
    });
  }
  await storyAnswer('travel_hello_recognize', { optionId: 'hello' });
  await storyAnswer('travel_hello_write', { text: 'Hi! I is Ana.' });
  await storyAnswer('travel_hello_transfer', { text: 'I is Ana.' });
  const target = 'writing:home.introduce';
  const path = `/v1/reviews/quick?source=unified&target=${encodeURIComponent(target)}`;
  const queue = await engine.request<{ reviews: { key: string; reason: string }[] }>(
    '/v1/reviews/today?source=unified',
  );
  assert.ok(queue.reviews.some((row) => row.key === target && row.reason === 'remediation'));
  const guided = await engine.request<QuickReviewState>(path);
  assert.equal(guided.remediation?.phase, 'support');
  assert.match(guided.explanation ?? '', /I am/);
  const support = { action: 'answer', token: guided.token, answer: { text: 'am' } };
  await engine.request(path, support);
  await engine.request(path, support);
  const independent = await engine.request<QuickReviewState>(path, {
    action: 'continue',
    token: guided.token,
  });
  assert.equal(independent.remediation?.phase, 'confirmation');
  assert.notEqual(independent.exerciseId, guided.exerciseId);
  const proof = await engine.request<QuickReviewState>(path, {
    action: 'answer',
    token: independent.token,
    answer: { text: 'My name is Ana.' },
  });
  assert.equal(proof.result?.correct, true);
  const state = JSON.parse(store.data.get(OFFLINE_STATE_KEY)!) as OfflineState;
  const evidence = state.unifiedLearning.evidence.filter(({ source }) => source === 'remediation');
  assert.equal(evidence.length, 2);
  assert.deepEqual(
    evidence.map(({ independent }) => independent),
    [false, true],
  );
  assert.deepEqual(
    getUnifiedMastery(state.unifiedLearning, 'home.introduce', 'writing').pendingErrors,
    [],
  );
});

test('an audio review needs playback or transcript before it supplies listening evidence', async () => {
  const { engine, store } = fixture();
  await engine.request('/v1/attempts', {
    lessonId: 'travel_home',
    exerciseId: 'travel_bus_listen',
    clientAttemptId: 'initial-listening',
    answer: { optionId: 'stop' },
  });
  const path = '/v1/reviews/quick?source=unified&target=listening%3Ahome.ask-location';
  const first = await engine.request<QuickReviewState>(path);
  assert.equal(first.exerciseId, 'travel_review_place_question_audio');
  const submit = (token: string) =>
    engine.request(path, {
      action: 'answer',
      token,
      answer: { text: 'Bus stop' },
    });
  await submit(first.token);
  await engine.request(path, { action: 'dismiss', token: first.token });
  const next = await engine.request<QuickReviewState>(path);
  assert.equal(next.exerciseId, first.exerciseId);
  const listened = await engine.request<QuickReviewState>(path, {
    action: 'listened',
    token: next.token,
  });
  assert.equal(listened.listened, true);
  await submit(next.token);
  const state = JSON.parse(store.data.get(OFFLINE_STATE_KEY)!) as OfflineState;
  const evidence = state.unifiedLearning.evidence.filter(({ source }) => source === 'review');
  assert.deepEqual(
    evidence.map(({ languageOutcome, outcome, independent }) => [
      languageOutcome ?? outcome,
      independent,
    ]),
    [
      ['ungradable', false],
      ['target', true],
    ],
  );
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

test('all bundled grammar-production targets reach 95% through scheduled reviews', async () => {
  const f = fixture();
  const bundled = JSON.parse(
    readFileSync(
      new URL('../../../apps/mobile/src/content/bundled-course.json', import.meta.url),
      'utf8',
    ),
  ).payload as CourseData;
  f.content(bundled);
  const targets = Object.values(bundled.lessons).flatMap((lesson) =>
    lesson.exercises
      .filter((exercise) => exercise.dimension === 'grammar_production')
      .map((exercise) => ({ lesson, exercise })),
  );
  assert.equal(new Set(targets.map(({ exercise }) => exercise.skillId)).size, 32);
  for (const { lesson, exercise } of targets)
    await f.engine.request('/v1/attempts', {
      clientAttemptId: `initial-${exercise.id}`,
      lessonId: lesson.id,
      exerciseId: exercise.id,
      answer: correct(exercise),
    });
  for (let session = 1; session <= 7; session++) {
    f.advance(14 * 86400000);
    const { reviews } = await f.engine.request<{
      reviews: { dimension: string; targetId: string; lessonId: string }[];
    }>('/v1/reviews/today');
    const productionReviews = reviews.filter((review) => review.dimension === 'grammar_production');
    assert.equal(productionReviews.length, 32);
    for (const review of productionReviews) {
      const lesson = bundled.lessons[review.lessonId];
      for (const exercise of lesson.exercises.filter(
        (e) => e.dimension === 'grammar_production' && e.skillId === review.targetId,
      ))
        await f.engine.request('/v1/attempts', {
          clientAttemptId: `review-${session}-${exercise.id}`,
          lessonId: lesson.id,
          exerciseId: exercise.id,
          answer: correct(exercise),
        });
    }
  }
  const p = await f.engine.initialize();
  assert.equal(p.mastery.length, 32);
  for (const mastery of p.mastery) {
    assert.equal(mastery.dimension, 'grammar_production');
    assert.equal(mastery.value, 0.95, mastery.targetId);
    assert.ok(mastery.lastDelayedSuccessAt);
  }
});

test('single-exercise production needs three unprompted successes and counts only once per day', async () => {
  const f = fixture();
  const lesson = source.lessons.u01_l01;
  const exercise = lesson.exercises.find((e) => e.dimension === 'grammar_production')!;
  const attempt = (id: string, hintUsed: boolean) =>
    f.engine.request('/v1/attempts', {
      clientAttemptId: id,
      lessonId: lesson.id,
      exerciseId: exercise.id,
      answer: correct(exercise),
      hintUsed,
    });
  for (let day = 0; day < 12; day++) {
    await attempt(`hinted-${day}`, true);
    f.advance(86400000);
  }
  let mastery = (await f.engine.initialize()).mastery[0];
  assert.equal(mastery.value, 0.65);
  assert.equal(mastery.unpromptedSuccessCount, 0);
  for (let repeat = 0; repeat < 20; repeat++) await attempt(`same-day-${repeat}`, false);
  mastery = (await f.engine.initialize()).mastery[0];
  assert.equal(mastery.unpromptedSuccessCount, 1);
  assert.equal(mastery.value, 0.65);
  f.advance(86400000);
  await attempt('second-independent-day', false);
  assert.equal((await f.engine.initialize()).mastery[0].value, 0.65);
  f.advance(86400000);
  await attempt('third-independent-day', false);
  mastery = (await f.engine.initialize()).mastery[0];
  assert.equal(mastery.unpromptedSuccessCount, 3);
  assert.ok(mastery.value > 0.65);
  assert.ok(mastery.lastDelayedSuccessAt);
});
