import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { Answer } from '@lingoquest/contracts';
import {
  chapter,
  OfflineEngine,
  type CourseData,
  type OfflineState,
  type QuickReviewState,
  type StoryOperation,
  type StoryResponse,
  type TravelStep,
  type TravelOperation,
  type TravelState,
} from '../src/index.ts';
import { travelLesson } from '../src/travel-content.ts';

const content = JSON.parse(
  readFileSync(
    new URL('../../../apps/mobile/src/content/bundled-course.json', import.meta.url),
    'utf8',
  ),
).payload as CourseData;

function device() {
  let raw: string | null = null;
  let nonce = 0;
  let fail = false;
  let now = Date.parse('2026-11-20T12:00:00Z');
  const open = () =>
    new OfflineEngine({
      store: {
        async getItem() {
          return raw;
        },
        async setItem(_, value) {
          if (fail) throw new Error('write failed');
          raw = value;
        },
      },
      getContent: () => content,
      clock: () => now,
      randomId: () => `chapter-story-${++nonce}`,
    });
  return {
    open,
    reopen(backup: unknown) {
      return open().request('/v1/me/import', { backup });
    },
    state: () => JSON.parse(raw!) as OfflineState,
    setFailure: (value: boolean) => {
      fail = value;
    },
    nextDay: () => {
      now += 86_400_000;
    },
  };
}

const storyPath = '/v1/story';
const journey = (engine: OfflineEngine, operation?: TravelOperation) =>
  engine.request<TravelState>('/v1/travel', operation);

const answerFor = (exercise: (typeof travelLesson.exercises)[number]): Answer => {
  if (exercise.correctOptionId) return { optionId: exercise.correctOptionId };
  if (exercise.tokens)
    return {
      tokens: exercise.acceptedAnswers[0].replace(/\./g, '').replace("It's", 'It’s').split(' '),
    };
  return { text: exercise.acceptedAnswers[0] };
};

async function finishLesson(engine: OfflineEngine, endBefore?: string) {
  let saved = await journey(engine);
  const mission = chapter.missions.find(({ id }) => id === saved.active?.missionId);
  assert.ok(mission);
  while (saved.active && !saved.active.finished) {
    const { step, token } = saved.active;
    const activity: TravelStep = mission.steps[step];
    if (activity.id === endBefore) break;
    if (activity.type === 'exercise') {
      const checked = await journey(engine, {
        action: 'answer',
        token,
        answer: answerFor(activity.exercise),
      });
      assert.equal(checked.active?.result?.correct, true, activity.id);
    }
    saved = await journey(engine, { action: 'advance', token });
  }
  return saved;
}

type StoryAction = StoryOperation extends infer Op
  ? Op extends { turn: number }
    ? Omit<Op, 'turn'>
    : never
  : never;

test('story launch restores a pre-RPG format-2 checkpoint and is atomic on write failure', async () => {
  const storage = device();
  const legacy = storage.open();
  await journey(legacy, { action: 'country', country: 'PE' });
  await journey(legacy, { action: 'start', missionId: 'hello' });
  const first = (await journey(legacy)).active!;
  const saved = await journey(legacy, { action: 'advance', token: first.token });
  const backup = await legacy.request('/v1/me/export');
  assert.equal(storage.state().story, undefined);
  await storage.reopen(backup);

  const engine = storage.open();
  const entry = await engine.request<StoryResponse>(storyPath);
  assert.equal(entry.story.origin, 'Perú');
  assert.deepEqual(entry.travel, saved);
  const sam = await engine.request<StoryResponse>(storyPath, {
    action: 'interact',
    hotspotId: 'plaza-sam',
    turn: entry.story.turn,
  });
  const introduce = { action: 'choose', choiceId: 'introduce-yourself', turn: sam.story.turn };
  storage.setFailure(true);
  await assert.rejects(engine.request(storyPath, introduce), /write failed/);
  assert.deepEqual(await storage.open().request(storyPath), sam);
  storage.setFailure(false);
  const opened = await storage.open().request<StoryResponse>(storyPath, introduce);
  assert.equal(opened.story.encounter?.missionId, 'hello');
  assert.deepEqual(opened.travel, saved);
  assert.deepEqual(await storage.open().request(storyPath, introduce), opened);

  const pending = { action: 'finishEncounter', turn: opened.story.turn };
  assert.deepEqual(await engine.request(storyPath, pending), opened);
  const storyBackup = await engine.request('/v1/me/export');
  await engine.request('/v1/me', undefined, 'DELETE');
  await storage.reopen(storyBackup);
  assert.deepEqual(await storage.open().request(storyPath), opened);
});

test('bag story requires canonical learning and item use before one passport reward', async () => {
  const storage = device();
  let engine = storage.open();
  let snapshot = await engine.request<StoryResponse>(storyPath);
  async function act(operation: StoryAction) {
    snapshot = await engine.request<StoryResponse>(storyPath, {
      ...operation,
      turn: snapshot.story.turn,
    });
  }
  const interact = async (hotspotId: string) => act({ action: 'interact', hotspotId });
  const choose = async (choiceId: string) => act({ action: 'choose', choiceId });
  const close = async () => act({ action: 'closeDialogue' });
  const finish = async () => act({ action: 'finishEncounter' });

  await interact('plaza-sam');
  await choose('introduce-yourself');
  await finishLesson(engine);
  await finish();
  assert.ok(snapshot.story.hotspots.some(({ id }) => id === 'plaza-luz-after-introduction'));
  await interact('plaza-ticket');
  await choose('read-ticket');
  await close();
  await interact('plaza-to-stop');
  await interact('stop-sign');
  await close();
  await interact('stop-sam-directions');
  await choose('give-directions');
  await finishLesson(engine);
  await finish();
  await interact('stop-sam-search');
  await choose('search-bench');
  await close();
  await interact('stop-bench');
  await choose('read-bench-note');
  await close();
  await interact('stop-to-lost-property');
  await interact('lost-sam-return');
  assert.equal(snapshot.story.dialogue, undefined);
  await interact('lost-luz');
  await choose('read-sam-message');
  const boundary = await finishLesson(engine, 'bag_postcard');
  assert.equal(boundary.active?.stepId, 'bag_postcard');
  assert.equal(boundary.stamps.home, undefined);

  engine = storage.open();
  snapshot = await engine.request<StoryResponse>(storyPath);
  assert.equal(snapshot.story.encounter?.ready, true);
  await finish();
  await interact('lost-blue-bag');
  await choose('take-blue-bag');
  await close();
  await interact('lost-sam-return');
  await choose('show-blue-bag');
  assert.equal(snapshot.travel.active?.token, boundary.active?.token);
  await finishLesson(engine);
  const finishRequest = { action: 'finishEncounter', turn: snapshot.story.turn };
  await finish();
  const after = storage.state();
  assert.equal(Object.keys(after.travel!.stamps).length, 1);
  assert.equal(snapshot.story.inventory.filter(({ id }) => id === 'sam-postcard').length, 1);
  assert.equal(snapshot.story.inventory.find(({ id }) => id === 'sam-blue-bag')?.used, true);
  assert.deepEqual(await storage.open().request(storyPath, finishRequest), snapshot);
  assert.deepEqual(storage.state(), after);
  assert.ok(
    after.travelLearning?.targets.every(
      ({ speakingPractice }) => Object.keys(speakingPractice).length === 0,
    ),
  );

  storage.nextDay();
  const reviewPath = '/v1/reviews/quick?source=travel&mission=bag';
  const review = await engine.request<QuickReviewState>(reviewPath);
  const exercise = travelLesson.exercises.find(({ id }) => id === review.exerciseId);
  assert.ok(exercise && !review.starter);
  const submission = { action: 'answer', token: review.token, answer: answerFor(exercise) };
  const reviewed = await engine.request<QuickReviewState>(reviewPath, submission);
  assert.equal(reviewed.result?.correct, true);
  const reviewCompleted = storage.state();
  assert.equal(reviewCompleted.story?.quests['review-bag'].status, 'completed');
  assert.deepEqual(await engine.request(reviewPath, submission), reviewed);
  assert.deepEqual(storage.state(), reviewCompleted);
});
