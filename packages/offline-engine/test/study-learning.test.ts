import assert from 'node:assert/strict';
import test from 'node:test';
import bundled from '../../../apps/mobile/src/content/bundled-course.json';
import {
  OFFLINE_STATE_KEY,
  OfflineEngine,
  type CourseData,
  type LessonCheckpoint,
  type OfflineState,
  type StudyLearningStatus,
} from '../src/index.ts';
import { getUnifiedMastery } from '../src/learning-evidence.ts';

const lessonId = 'u01_l01';
const writingId = 'u01_l01_practice_4';
const path = `/v1/lessons/${lessonId}`;
const writing = { text: 'Hello! My name is Ana.' };
const content = { ...bundled.payload, courseVersion: bundled.manifest.version } as CourseData;

function fixture() {
  const items = new Map<string, string>();
  const store = {
    async getItem(key: string) {
      return items.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      items.set(key, value);
    },
  };
  let time = Date.parse('2026-11-24T12:00:00Z');
  const reopen = () => new OfflineEngine({ store, getContent: () => content, clock: () => time });
  return {
    engine: reopen(),
    reopen,
    advance: (duration: number) => {
      time += duration;
    },
    state: (): OfflineState => JSON.parse(items.get(OFFLINE_STATE_KEY)!),
  };
}

function draft(eventId: string, changes: Partial<LessonCheckpoint> = {}): LessonCheckpoint {
  return {
    activityId: 'study-activity',
    eventId,
    stage: 4,
    exercise: 3,
    vocabulary: 0,
    answer: {},
    help: false,
    hint: false,
    xp: 0,
    weak: [],
    reviewAt: null,
    ...changes,
  };
}

test('Study reference, translation and retry are distinct from independent writing after reload', async () => {
  const { engine, state, reopen } = fixture();
  await engine.request(`${path}/study-events`, { action: 'reference' });
  assert.equal(
    getUnifiedMastery(state().unifiedLearning, 'home.introduce', 'writing').state,
    'introduced',
  );

  const checkpoint = draft('study-first-answer', { hint: true, help: true, answer: writing });
  await engine.request(`${path}/checkpoint`, checkpoint);
  const input = {
    clientAttemptId: checkpoint.eventId,
    lessonId,
    exerciseId: writingId,
    answer: writing,
    checkpoint,
    hintUsed: true,
  };
  const result = await engine.request('/v1/attempts', input);
  const restored = reopen();
  assert.deepEqual(await restored.request('/v1/attempts', input), result);
  const retry = draft('study-retry-answer', { retry: true, answer: writing });
  await restored.request(`${path}/checkpoint`, retry);
  await restored.request('/v1/attempts', {
    ...input,
    clientAttemptId: retry.eventId,
    checkpoint: retry,
    hintUsed: false,
  });

  const saved = state().unifiedLearning;
  const events = saved.evidence.filter(({ exerciseId }) => exerciseId === writingId);
  assert.equal(events.length, 2);
  assert.equal(events[0].materialVersion, bundled.manifest.version);
  assert.deepEqual(events[0].aids, ['hint', 'translation']);
  assert.ok(events[1].retry && events[1].aids.includes('answer_shown'));
  assert.ok(events.every((event) => !event.independent));
  assert.equal(getUnifiedMastery(saved, 'home.introduce', 'writing').state, 'guided_practice');
});

test('Study skips only current, demonstrated writing and persists the choice without additional evidence', async () => {
  const { engine, state, reopen, advance } = fixture();
  const checkpoint = draft('study-skip-event', { skipped: [writingId] });
  await engine.request(`${path}/checkpoint`, checkpoint);
  await assert.rejects(
    engine.request(`${path}/study-events`, { action: 'skip', eventId: checkpoint.eventId }),
    /Todavía puedes practicar/,
  );
  const first = await engine.request<{ saved: LessonCheckpoint }>(`${path}/checkpoint`);
  assert.equal(first.saved.skipped, undefined);

  for (const exerciseId of ['travel_hello_write', 'travel_hello_transfer']) {
    await engine.request('/v1/attempts', {
      clientAttemptId: `story-${exerciseId}`,
      lessonId: 'travel_home',
      exerciseId,
      answer: writing,
    });
  }
  const before = state().unifiedLearning.evidence.length;
  const summary = await engine.request<StudyLearningStatus>(`${path}/learning`);
  assert.ok(summary.skippableExerciseIds.includes(writingId));
  assert.equal(
    summary.abilities.find(({ dimension }) => dimension === 'writing')?.status,
    'verified',
  );
  assert.ok(
    summary.abilities
      .filter(({ dimension }) => dimension === 'listening' || dimension === 'speaking')
      .every(({ status }) => status === 'unverified'),
  );
  await engine.request(`${path}/study-events`, { action: 'skip', eventId: checkpoint.eventId });

  const restored = reopen();
  const after = await restored.request<{ saved: LessonCheckpoint }>(`${path}/checkpoint`);
  assert.deepEqual(after.saved.skipped, [writingId]);
  assert.equal(state().unifiedLearning.evidence.length, before);
  assert.ok(!state().visitedExercises[lessonId]?.includes(writingId));

  advance(2 * 86_400_000);
  const due = await restored.request<StudyLearningStatus>(`${path}/learning`);
  assert.equal(
    due.abilities.find(({ dimension }) => dimension === 'writing')?.status,
    'needs_review',
  );
  assert.ok(!due.skippableExerciseIds.includes(writingId));
});
