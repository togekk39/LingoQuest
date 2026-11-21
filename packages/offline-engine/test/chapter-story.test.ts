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
  return {
    text: exercise.introduction
      ? exercise.introduction.greetingRequired
        ? "Hi, I'm Ana Pérez."
        : 'My name is Ana Pérez.'
      : exercise.acceptedAnswers[0],
  };
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
  assert.equal(saved.active?.stepId, 'hello_sam');
  assert.equal(opened.travel.active?.stepId, 'hello_teach');
  assert.deepEqual(opened.travel.active?.answer, saved.active?.answer);
  assert.deepEqual(await storage.open().request(storyPath, introduce), opened);

  const pending = { action: 'finishEncounter', turn: opened.story.turn };
  assert.deepEqual(await engine.request(storyPath, pending), opened);
  const storyBackup = await engine.request('/v1/me/export');
  await engine.request('/v1/me', undefined, 'DELETE');
  await storage.reopen(storyBackup);
  assert.deepEqual(await storage.open().request(storyPath), opened);
});

test('another conversation can pause and restore a story lesson without losing a draft', async () => {
  const storage = device();
  let engine = storage.open();
  let snapshot = await engine.request<StoryResponse>(storyPath);
  async function act(operation: StoryAction) {
    snapshot = await engine.request<StoryResponse>(storyPath, {
      ...operation,
      turn: snapshot.story.turn,
    });
  }

  await act({ action: 'interact', hotspotId: 'plaza-sam' });
  assert.equal(snapshot.story.dialogue?.npc?.id, 'sam');
  assert.equal(snapshot.story.dialogue?.line?.en, "Hi! My name is Sam. What's your name?");
  await act({ action: 'interact', hotspotId: 'plaza-luz' });
  assert.equal(snapshot.story.dialogue?.npc?.id, 'luz');
  assert.equal(snapshot.story.dialogue?.line?.en, 'Hi! I am Luz.');
  assert.equal(snapshot.story.dialogue?.exampleLabel, 'Ejemplo de Luz');
  assert.ok(snapshot.story.dialogue?.tip);
  await act({ action: 'interact', hotspotId: 'plaza-sam' });
  await act({ action: 'choose', choiceId: 'introduce-yourself' });
  assert.equal(snapshot.story.encounter?.npc?.id, 'sam');
  assert.equal(snapshot.story.encounter?.suspended, false);

  const atWriting = await finishLesson(engine, 'travel_hello_write');
  const draft = await journey(engine, {
    action: 'draft',
    token: atWriting.active!.token,
    answer: { text: 'Hi! I am Ana' },
  });
  const introductionTurn = snapshot.story.turn;
  await act({ action: 'suspendEncounter' });
  assert.equal(snapshot.story.encounter?.suspended, true);
  await act({ action: 'interact', hotspotId: 'plaza-sam' });
  assert.equal(snapshot.story.dialogue?.id, 'sam-introduction');
  assert.deepEqual(snapshot.story.dialogue?.choices, []);
  const unchanged = snapshot;
  await act({ action: 'choose', choiceId: 'introduce-yourself' });
  assert.deepEqual(snapshot, unchanged);
  await act({ action: 'interact', hotspotId: 'plaza-luz' });
  assert.equal(snapshot.story.dialogue?.npc?.id, 'luz');
  assert.equal(snapshot.story.encounter?.suspended, true);
  assert.deepEqual(snapshot.travel, draft);

  engine = storage.open();
  assert.deepEqual(await engine.request(storyPath), snapshot);
  const resumePath = '/v1/story/encounter';
  assert.deepEqual(await engine.request(resumePath, { turn: introductionTurn }), snapshot);
  storage.setFailure(true);
  await assert.rejects(engine.request(resumePath, { turn: snapshot.story.turn }), /write failed/);
  storage.setFailure(false);
  assert.deepEqual(await engine.request(storyPath), snapshot);
  const resumed = await engine.request<StoryResponse>(resumePath, { turn: snapshot.story.turn });
  assert.equal(resumed.story.encounter?.suspended, false);
  assert.equal(resumed.story.dialogue, undefined);
  assert.deepEqual(resumed.travel, draft);
  snapshot = resumed;
  await act({ action: 'interact', hotspotId: 'plaza-luz' });
  assert.equal(snapshot.story.encounter?.suspended, true);
  assert.equal(snapshot.story.dialogue?.npc?.id, 'luz');
  snapshot = await engine.request<StoryResponse>(resumePath, { turn: snapshot.story.turn });

  const atSpeaking = await finishLesson(engine, 'hello_speak');
  await journey(engine, {
    action: 'speak',
    token: atSpeaking.active!.token,
    practice: 'imitated',
  });
  await act({ action: 'finishEncounter' });
  assert.equal(snapshot.story.dialogue?.id, 'sam-after-introduction');
  assert.deepEqual(
    storage.state().travelLearning?.targets.find(({ skill }) => skill === 'speaking')
      ?.speakingPractice,
    { imitated: 1 },
  );
  assert.equal(snapshot.story.quests.find(({ id }) => id === 'meet-sam')?.status, 'completed');
  assert.equal(snapshot.story.inventory.filter(({ id }) => id === 'bus-ticket').length, 1);
});

test('Luz search route requires canonical learning and item use before one passport reward', async () => {
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
  await choose('ask-luz');
  await close();
  await interact('stop-to-plaza');
  await interact('plaza-luz-search');
  await choose('hear-luz-clue');
  assert.equal(snapshot.story.dialogue?.npc?.id, 'luz');
  await close();
  await interact('plaza-to-stop');
  await interact('stop-to-lost-property');
  await interact('lost-sam-return');
  assert.equal(snapshot.story.dialogue, undefined);
  await interact('lost-luz');
  await choose('read-sam-message');
  assert.ok(!snapshot.story.hotspots.some(({ id }) => id === 'lost-to-stop'));
  const readingMessage = snapshot;
  await interact('lost-to-stop');
  assert.deepEqual(snapshot, readingMessage);
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
  await interact('lost-sam-finale-luz');
  assert.equal(snapshot.story.dialogue?.id, 'sam-finale-luz');
  await close();
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

test('Sam separates story identity from English evidence and remembers an unset player’s chosen name', async () => {
  for (const [profile, name] of [
    ['Ana O’Connor', 'Ana O’Connor'],
    ['  Mai-Linh Nguyễn  ', 'Mai-Linh Nguyễn'],
    [undefined, 'Amaya'],
  ] as const) {
    const storage = device();
    const engine = storage.open();
    if (profile)
      await engine.request('/v1/me/settings', {
        name: profile,
        goalMinutes: 10,
        reducedMotion: false,
      });
    let snapshot = await engine.request<StoryResponse>(storyPath);
    snapshot = await engine.request<StoryResponse>(storyPath, {
      action: 'interact',
      hotspotId: 'plaza-sam',
      turn: snapshot.story.turn,
    });
    snapshot = await engine.request<StoryResponse>(storyPath, {
      action: 'choose',
      choiceId: 'introduce-yourself',
      turn: snapshot.story.turn,
    });
    assert.equal(snapshot.travel.active?.stepId, 'hello_teach');
    let current = (await finishLesson(engine, 'travel_hello_write')).active!;
    async function gradeReply(text: string) {
      return journey(engine, { action: 'answer', token: current.token, answer: { text } });
    }
    if (profile) {
      const wrongName = await gradeReply('Hi! I am Luz.');
      const result = wrongName.active?.result;
      assert.equal(result?.correct, false);
      assert.equal(result?.identityMismatch, true);
      assert.equal(result?.errorType, undefined);
      assert.match(result?.feedbackEs ?? '', /La estructura en inglés es correcta/);
      const record = storage
        .state()
        .travelLearning?.targets.find(
          (item) => item.conceptId === 'introduction' && item.skill === 'writing',
        );
      assert.equal(record?.successes.production?.independent, 1);
      assert.deepEqual(record?.errors, {});
      assert.equal(record?.communicationSuccesses ?? 0, 0);
      assert.deepEqual(
        await journey(engine, { action: 'advance', token: current.token }),
        wrongName,
      );
      current = (await journey(engine, { action: 'retry', token: current.token })).active!;
      assert.equal(current.hint, false);
    }
    const correct = await gradeReply(`Hello! My name is ${name}.`);
    assert.equal(correct.active?.result?.correct, true);
    if (!profile) {
      assert.equal(correct.introductionName, name);
      assert.equal((await journey(storage.open())).introductionName, name);
      assert.equal(storage.state().user.name, 'Explorador');
    }
    current = (await journey(engine, { action: 'advance', token: current.token })).active!;
    const transfer = await gradeReply(`I'm ${name}.`);
    assert.equal(transfer.active?.stepId, 'travel_hello_transfer');
    assert.equal(transfer.active?.result?.correct, true);
  }
});

test('an unfinished tile draft keeps its order when the name tile becomes personal', async () => {
  const storage = device();
  const engine = storage.open();
  const backup = await engine.request<{ state: OfflineState }>('/v1/me/export');
  backup.state.travel = {
    completed: {},
    stamps: {},
    active: {
      missionId: 'hello',
      contentRevision: 2,
      step: chapter.missions[0].steps.findIndex(({ id }) => id === 'travel_hello_build'),
      token: 'old-name-tiles',
      answer: { tokens: ['I', 'Luz'] },
      finished: false,
      hint: false,
      transcript: false,
    },
  };
  await storage.reopen(backup);
  const restored = await journey(storage.open());
  assert.equal(restored.active?.stepId, 'travel_hello_build');
  assert.equal(restored.active?.token, 'old-name-tiles');
  assert.deepEqual(restored.active?.answer.tokens, ['I', '[tu nombre]']);
});
