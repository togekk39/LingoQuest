import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import type { Answer, AttemptResult } from '@lingoquest/contracts';
import {
  chapter,
  normalize,
  OfflineEngine,
  OFFLINE_STATE_KEY,
  route,
  travelStoryReply,
  type CourseData,
  type OfflineState,
  type QuickReviewState,
  type TravelOperation,
  type TravelPlacement,
  type TravelPlacementQuestion,
  type TravelState,
  type TravelReviewRow,
  type TravelLearningState,
} from '../src/index.ts';
import { travelLesson, type TravelExerciseStep } from '../src/travel-content.ts';

const content = JSON.parse(
  readFileSync(
    new URL('../../../apps/mobile/src/content/bundled-course.json', import.meta.url),
    'utf8',
  ),
).payload as CourseData;

function device() {
  let raw: string | null = null;
  let ms = Date.parse('2026-11-18T10:00:00Z');
  let fail = false;
  let nonce = 0;
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
      clock: () => ms,
      randomId: () => `travel-test-${++nonce}`,
    });
  return {
    open,
    state: () => JSON.parse(raw!) as OfflineState,
    later: (n: number) => {
      ms += n;
    },
    fail: (value: boolean) => {
      fail = value;
    },
    raw: () => raw,
  };
}
const update = (engine: OfflineEngine, action: TravelOperation) =>
  engine.request<TravelState>('/v1/travel', action);

test('an NPC confirms the submitted order variant after a valid graded reply', () => {
  const fish = { en: 'Fish with rice and water.', es: 'Pescado con arroz y agua.' };
  const chicken = { en: 'Chicken with rice and coffee.', es: 'Pollo con arroz y café.' };
  const step: TravelExerciseStep = {
    id: 'server-selects-reply',
    type: 'exercise',
    situation: 'Pide comida.',
    exercise: {
      id: 'server-selects-reply',
      type: 'short_text',
      promptEs: 'Haz tu pedido en inglés.',
      acceptedAnswers: ["I'd like fish with rice and water, please."],
      feedbackEs: 'Confirma el plato y la bebida.',
      difficulty: 1,
      skillId: 'grammar.order',
    },
    storyReplies: [
      { answers: ["I'd like fish with rice and water, please."], speaker: 'Alba', line: fish },
      { answers: ['Can I have chicken with rice and coffee?'], speaker: 'Alba', line: chicken },
    ],
  };
  const result = { correct: true, feedbackEs: '', xpAwarded: 0, pending: false } as const;
  const saved = JSON.parse(
    JSON.stringify({
      result,
      answer: { text: 'I would like fish with rice and water please.' },
    }),
  );
  assert.deepEqual(travelStoryReply(step, saved)?.line, fish);
  const alternative = {
    result: { ...result, correct: false, communicationOnly: true as const },
    answer: { text: 'Can I have chicken with rice and coffee?' },
  };
  assert.deepEqual(travelStoryReply(step, alternative)?.line, chicken);
  assert.equal(
    travelStoryReply(step, { ...alternative, result: { ...result, correct: false } }),
    undefined,
  );
  assert.equal(travelStoryReply(step, { ...alternative, answer: { text: 'Coffee.' } }), undefined);
  assert.equal(travelStoryReply(step, { ...alternative, result: undefined }), undefined);
});

test('the twenty-stage route covers every continent and references real curriculum units', () => {
  assert.equal(route.length, 20);
  assert.equal(new Set(route.map((item) => item.id)).size, 20);
  assert.equal(new Set(route.map((item) => item.continent)).size, 7);
  assert.equal(route[19].id, 'antarctica');
  assert.match(route[19].location, /Ushuaia/);
  assert.deepEqual(
    route.filter((item) => item.continent === 'América del Sur').map(({ id }) => id),
    ['colombia', 'peru', 'brazil'],
  );
  assert.equal(
    route.findIndex(({ continent }) => continent === 'Europa'),
    5,
  );
  assert.equal(
    route.findIndex(({ continent }) => continent === 'Asia'),
    7,
  );
  for (const stop of route)
    assert.ok(!stop.unitId || content.units.some((unit) => unit.id === stop.unitId));
  const skills = new Set(
    Object.values(content.lessons).flatMap((lesson) => lesson.exercises.map((e) => e.skillId)),
  );
  for (const mission of chapter.missions)
    for (const step of mission.steps)
      if (step.type === 'exercise') assert.ok(skills.has(step.exercise.skillId));
});

test('travel writes drafts, exact feedback, evidence, and a single stamp across process restarts', async () => {
  const phone = device();
  let engine = phone.open();
  await update(engine, { action: 'country', country: 'HN' });
  assert.equal((await update(engine, { action: 'start', missionId: 'bag' })).active, undefined);
  for (const mission of chapter.missions) {
    let state = await update(engine, { action: 'start', missionId: mission.id });
    for (const step of mission.steps) {
      const token = state.active!.token;
      if (step.type === 'exercise') {
        const e = step.exercise;
        const answer: Answer = e.correctOptionId
          ? { optionId: e.correctOptionId }
          : e.tokens
            ? { tokens: e.acceptedAnswers[0].replace(/\./g, '').replace("It's", 'It’s').split(' ') }
            : {
                text: (e.introduction?.model ?? e.acceptedAnswers[0]).replace(
                  '[tu nombre]',
                  'Camila',
                ),
              };
        if (e.type === 'short_text') {
          await update(engine, { action: 'draft', token, answer: { text: 'Hi!' } });
          engine = phone.open();
          const restored = await engine.request<TravelState>('/v1/travel');
          assert.deepEqual(restored.active?.answer, { text: 'Hi!' });
        }
        const attempt = { action: 'answer', token, answer } as const;
        phone.fail(true);
        const before = phone.raw();
        await assert.rejects(update(engine, attempt), /write failed/);
        assert.equal(phone.raw(), before);
        phone.fail(false);
        const checked = await update(engine, attempt);
        engine = phone.open();
        const restored = await update(engine, attempt);
        assert.deepEqual(restored, checked);
        assert.equal(restored.active?.result?.correct, true);
      }
      state = await update(engine, { action: 'advance', token });
      assert.deepEqual(await update(engine, { action: 'advance', token }), state);
    }
    assert.ok(state.active?.finished);
    await update(engine, { action: 'dismiss', token: state.active!.token });
    engine = phone.open();
  }
  const progress = await engine.initialize();
  const completed = await engine.request<TravelState>('/v1/travel');
  assert.equal(completed.country, 'HN');
  assert.equal(Object.keys(completed.completed).length, 3);
  assert.equal(Object.keys(completed.stamps).length, 1);
  assert.equal(
    Object.keys(phone.state().attempts).length,
    chapter.missions.flatMap((mission) => mission.steps.filter((step) => step.type === 'exercise'))
      .length,
  );
  assert.ok(progress.mastery.some((evidence) => evidence.targetId === 'grammar.be_i_you'));
  assert.deepEqual(progress.completedLessons, []);
  assert.equal(progress.xp, 0);

  await update(engine, { action: 'note', text: 'It is next to the park.' });
  const backup = await engine.request('/v1/me/export');
  await engine.request('/v1/me', undefined, 'DELETE');
  await engine.request('/v1/me/import', { backup });
  assert.equal((await engine.request<TravelState>('/v1/travel')).note, 'It is next to the park.');
  assert.equal(phone.state().travel?.stamps.home, completed.stamps.home);

  phone.later(2 * 86400000);
  const quick = await engine.request<QuickReviewState>('/v1/reviews/quick');
  assert.equal(quick.starter, false);
  assert.notEqual(quick.exerciseId, 'travel_quick_hello');
  assert.equal(await engine.request(OFFLINE_STATE_KEY).catch(() => 'private'), 'private');
});

test('a new traveler can finish a tiny practice and resume its feedback without creating extra attempts', async () => {
  const phone = device();
  let engine = phone.open();
  const quick = await engine.request<QuickReviewState>('/v1/reviews/quick');
  assert.ok(quick.starter);
  const draft = { action: 'draft', token: quick.token, answer: { optionId: 'hello' } };
  await engine.request('/v1/reviews/quick', draft);
  engine = phone.open();
  assert.deepEqual(
    (await engine.request<QuickReviewState>('/v1/reviews/quick')).answer,
    draft.answer,
  );
  const submit = { ...draft, action: 'answer' };
  await engine.request('/v1/reviews/quick', submit);
  engine = phone.open();
  assert.ok((await engine.request<QuickReviewState>('/v1/reviews/quick', submit)).result?.correct);
  assert.equal(Object.keys(phone.state().attempts).length, 1);
});

const travelTestAnswers = [
  { optionId: 'name' },
  { text: 'I’m María-José de la Cruz.' },
  { optionId: 'stop' },
  { tokens: ['It’s', 'next', 'to', 'the', 'park'] },
  { optionId: 'blue' },
  { text: 'It is blue.' },
];

test('travel placement recommends the first unverified skill and does not complete missions', async () => {
  const phone = device();
  const engine = phone.open();
  for (const [limit, recommended] of [
    [0, 'hello'],
    [2, 'bus'],
    [6, 'bag'],
  ] as const) {
    const replies = travelTestAnswers.map((answer, i) => ({
      answer: i < limit ? answer : null,
      transcript: false,
    }));
    const { placement, travel } = await engine.request<{
      placement: { missionId: string };
      travel: TravelState;
    }>('/v1/travel/placement', { answers: replies });
    assert.equal(placement.missionId, recommended);
    assert.deepEqual(travel.completed, {});
    assert.deepEqual(travel.stamps, {});
    assert.equal(phone.state().xp, 0);
  }
  assert.equal(
    (await update(engine, { action: 'start', missionId: 'bag' })).active?.missionId,
    'bag',
  );
});

test('travel placement accepts a real or practice name without changing player identity', async () => {
  const phone = device();
  const engine = phone.open();
  await engine.request('/v1/me', { name: 'María-José de la Cruz' }, 'PATCH');
  const { questions } = await engine.request<{ questions: TravelPlacementQuestion[] }>(
    '/v1/travel/placement',
  );
  const introduction = questions[1].exercise;
  assert.equal(introduction.id, 'route_intro_write');
  assert.match(introduction.promptEs, /tu nombre.*nombre de práctica/);
  assert.doesNotMatch(introduction.promptEs, /Sam|Luz/);
  assert.equal(Object.hasOwn(introduction, 'introduction'), false);
  assert.equal(Object.hasOwn(introduction, 'acceptedAnswers'), false);

  for (const [text, accepted] of [
    ['I’m María-José de la Cruz.', true],
    ['My name is J. R. O’Neill.', true],
    ['Hello! You can call me Núria.', true],
    ['I am Running Deer.', true],
    ['I are María-José de la Cruz.', false],
    ['My name María-José de la Cruz.', false],
    ['I am not Sofía.', false],
    ['Luz is my friend.', false],
    ['I am running late.', false],
    ['I am able to help.', false],
    ['I am first in line.', false],
    ['I am Ana and.', false],
  ] as const) {
    const { placement, travel } = await engine.request<{
      placement: TravelPlacement;
      travel: TravelState;
    }>('/v1/travel/placement', {
      answers: travelTestAnswers.map((answer, index) => ({
        answer: index === 1 ? { text } : index === 0 ? answer : null,
        transcript: false,
      })),
    });
    assert.equal(placement.correct, accepted ? 2 : 1, text);
    assert.equal(placement.missionId, accepted ? 'bus' : 'hello', text);
    assert.equal(phone.state().user.name, 'María-José de la Cruz');
    assert.equal(travel.introductionName, undefined);
    assert.deepEqual(travel.stamps, {});
    assert.deepEqual(travel.completed, {});
    assert.equal(phone.state().xp, 0);
  }
});

test('a learner can change missions after placement and recover a vocabulary checkpoint', async () => {
  const phone = device();
  const engine = phone.open();
  let state = await update(engine, { action: 'start', missionId: 'hello' });
  for (let i = 0; i < 2; i++)
    state = await update(engine, { action: 'advance', token: state.active!.token });
  state = await update(engine, { action: 'word', token: state.active!.token, position: 2 });
  const saved = state.active;
  await engine.request('/v1/travel/placement', {
    answers: travelTestAnswers.map((answer, i) => ({ answer, transcript: i === 2 })),
  });
  assert.equal(phone.state().travel?.placement?.missionId, 'bus');
  assert.equal(
    (await update(engine, { action: 'start', missionId: 'bus' })).active?.missionId,
    'bus',
  );
  assert.deepEqual(
    (await update(phone.open(), { action: 'start', missionId: 'hello' })).active,
    saved,
  );
});

const day = 86400000;
const evidencePath = '/v1/travel/learning';
const quickPath = '/v1/reviews/quick?source=travel';
const practice = (engine: OfflineEngine, exerciseId: string, id: string, answer: Answer) =>
  engine.request<AttemptResult>('/v1/attempts', {
    lessonId: 'travel_home',
    exerciseId,
    clientAttemptId: `attempt-${id}`,
    answer,
  });

test('authored variants preserve meaning and the skill targeted by story and review', async () => {
  const cases = [
    ['travel_hello_transfer', "My name's Nico.", 'target'],
    ['travel_hello_transfer', 'MY NAME’S NICO!', 'target'],
    ['travel_hello_transfer', 'My name is Ada.', 'target'],
    ['travel_hello_transfer', 'Nico here.', 'communication'],
    ['travel_review_introduction', "My name's Ada.", 'target'],
    ['travel_review_introduction', 'Ada here.', 'communication'],
    ['travel_hello_write', 'Good morning, my name’s Raquel O’Connor.', 'target'],
    ['travel_hello_write', 'Good evening, Raquel here.', 'communication'],
    ['travel_hello_write', 'Goodbye, Raquel here.', 'incorrect'],
    ['travel_hello_write', 'Hi Sam, I am Mei Lin.', 'target'],
    ['travel_hello_write', 'Hello, I am Ái Añez.', 'target'],
    ['travel_hello_write', 'Hello, I am called Jean-Luc.', 'communication'],
    ['travel_hello_write', 'My name is Mei Lin.', 'incorrect'],
    ['travel_hello_write', 'Hi, I am fine today.', 'incorrect'],
    ['travel_hello_write', 'Hi, I am María. How are you?', 'incorrect'],
    ['travel_hello_write', 'Hi, I am [tu nombre].', 'incorrect'],
    ['travel_bus_ask', "Where's the bus stop?", 'target'],
    ['travel_bus_ask', 'Where is the bus stop, please?', 'target'],
    ['travel_bus_ask', 'Where can I find the bus stop?', 'communication'],
    ['travel_bus_ask', 'Excuse me, where can I find the bus stop?', 'communication'],
    ['travel_bus_ask', 'Where can I find the bus stop, please?', 'communication'],
    ['travel_bus_ask', 'Where’s the bus stop located?', 'communication'],
    ['travel_bus_ask', 'Where can I find the bus station?', 'incorrect'],
    ['travel_bus_ask', 'Where can I find the bus stop or the park?', 'incorrect'],
    ['travel_bus_ask', 'Can I find the bus stop?', 'incorrect'],
    ['travel_bus_ask', 'Can you tell me where the bus stop is?', 'communication'],
    ['travel_bus_ask', 'Where the bus stop is?', 'incorrect'],
    ['travel_bus_ask', 'Where is the park?', 'incorrect'],
    ['travel_review_place_question', 'Where can I find the park?', 'communication'],
    ['travel_bus_transfer', 'The park’s next to the bus stop.', 'target'],
    ['travel_bus_transfer', 'The park is beside the bus stop.', 'communication'],
    ['travel_bus_transfer', 'The park’s located next to the bus stop.', 'communication'],
    ['travel_bus_transfer', 'The park is right beside the bus stop.', 'communication'],
    ['travel_bus_transfer', 'The bus stop is beside the park.', 'incorrect'],
    ['travel_bus_transfer', 'The park is near the bus stop.', 'incorrect'],
    ['travel_bus_transfer', 'The park is not beside the bus stop.', 'incorrect'],
    ['travel_bus_transfer', 'The bus stop is across from the park.', 'incorrect'],
    ['travel_review_place_location', 'The backpack is right next to the bus stop.', 'target'],
    ['travel_review_place_location', 'Next to the bus stop.', 'communication'],
    ['travel_bus_dictation', 'It’s next to the park.', 'target'],
    ['travel_bus_dictation', 'It is next to the park.', 'target'],
    ['travel_bus_dictation', 'It’s beside the park.', 'incorrect'],
    ['travel_review_place_location_audio', 'Beside the park.', 'target'],
    ['travel_review_place_location_audio', 'Near the park.', 'incorrect'],
    ['travel_review_place_location_audio', 'The park.', 'incorrect'],
    ['travel_bag_write', 'Blue.', 'communication'],
    ['travel_bag_write', 'It is a blue backpack.', 'communication'],
    ['travel_bag_write', 'It is a red backpack.', 'incorrect'],
    ['travel_review_item_color_read', 'Red.', 'target'],
    ['travel_review_item_owner_write', 'My backpack is red.', 'target'],
    ['travel_review_item_owner_write', 'My backpack’s red.', 'target'],
    ['travel_review_item_owner_write', 'Mine is red.', 'communication'],
    ['travel_review_item_owner_write', 'I have a red bag.', 'incorrect'],
    ['travel_review_item_owner_write', 'I have a red backpack.', 'incorrect'],
    ['travel_review_item_owner_write', 'My bag is blue.', 'incorrect'],
  ] as const;
  for (const [exerciseId, text, outcome] of cases) {
    const phone = device();
    const engine = phone.open();
    const result = await practice(engine, exerciseId, 'variant', { text });
    const actual = result.correct
      ? 'target'
      : result.communicationOnly
        ? 'communication'
        : 'incorrect';
    assert.equal(actual, outcome, `${exerciseId}: ${text}`);
    const item = travelLesson.exercises.find((exercise) => exercise.id === exerciseId)!;
    assert.equal(
      phone.state().travelLearning?.targets[0]?.communicationSuccesses ?? 0,
      item.communicationOnly && outcome !== 'incorrect' ? 1 : 0,
      `${exerciseId}: communication count for ${text}`,
    );
  }
  for (const exercise of travelLesson.exercises) {
    if (!exercise.communicationOnly) continue;
    assert.equal(exercise.type, 'short_text', exercise.id);
    assert.ok(
      exercise.communicationOnly.feedbackEs.trim() &&
        (exercise.introduction || exercise.communicationOnly.answers.length),
      exercise.id,
    );
    const targets = new Set(exercise.acceptedAnswers.map(normalize));
    for (const variant of exercise.communicationOnly.answers)
      assert.ok(!targets.has(normalize(variant)), `${exercise.id}: ${variant}`);
  }
});

test('communication-only answers preserve due skill evidence and survive quick review restore', async () => {
  const phone = device();
  const engine = phone.open();
  await practice(engine, 'travel_hello_write', 'prior-production', { text: "Hi! I'm Luz." });
  phone.later(day);
  const writing = `${quickPath}&target=writing%3Aintroduction`;
  const review = await engine.request<QuickReviewState>(writing);
  assert.equal(review.exerciseId, 'travel_review_introduction');
  const before = phone.state();

  const submit = { action: 'answer', token: review.token, answer: { text: 'Ada here.' } };
  const checked = await engine.request<QuickReviewState>(writing, submit);
  assert.equal(checked.result?.communicationOnly, true);
  assert.equal(checked.result.correct, false);
  assert.equal(checked.result.xpAwarded, 0);
  assert.equal(checked.result.errorType, undefined);
  assert.ok(checked.result.acceptedAnswer);
  const after = phone.state();
  assert.equal(after.xp, before.xp);
  assert.deepEqual(after.mastery, before.mastery);
  assert.deepEqual(after.reviewRewards, before.reviewRewards);
  const evidence = before.travelLearning!.targets[0];
  const exposed = after.travelLearning!.targets[0];
  const exercise = travelLesson.exercises.find(({ id }) => id === review.exerciseId)!;
  assert.deepEqual(exposed, {
    ...evidence,
    communicationSuccesses: 2,
    seenContexts: [...evidence.seenContexts, exercise.learning!.contextId],
    seenExercises: {
      ...evidence.seenExercises,
      [review.exerciseId]: exposed.seenExercises[review.exerciseId],
    },
  });

  const backup = await engine.request('/v1/me/export');
  await engine.request('/v1/me', undefined, 'DELETE');
  await engine.request('/v1/me/import', { backup });
  const restarted = phone.open();
  assert.deepEqual(
    (await restarted.request<QuickReviewState>(writing, submit)).result,
    checked.result,
  );
  assert.deepEqual(phone.state().travelLearning, after.travelLearning);
  const rows = await restarted.request<{ reviews: TravelReviewRow[] }>(
    '/v1/reviews/today?source=travel&all=true',
  );
  assert.equal(
    rows.reviews.find(({ key }) => key === 'writing:introduction')?.communicationSuccesses,
    2,
  );
  const replay = await practice(restarted, review.exerciseId, 'after-model', {
    text: 'My name is Ada.',
  });
  assert.equal(replay.correct, true);
  assert.equal(replay.xpAwarded, 0);
  const afterModel = phone.state().travelLearning!.targets[0];
  assert.equal(afterModel.assistance.answer_shown, 1);
  assert.equal(afterModel.delayedSuccesses, 0);
  assert.equal(afterModel.transferSuccesses, 0);
});

test('recurrent independent errors lead to guided support and a different independent confirmation', async () => {
  const phone = device();
  const engine = phone.open();
  const first = await practice(engine, 'travel_hello_write', 'one', { text: 'Hi! I is Luz.' });
  assert.equal(first.correct, false);
  assert.equal(first.errorType, 'be_agreement');
  assert.match(first.feedbackEs, /I am, you are/);
  await practice(engine, 'travel_hello_write', 'same-prompt', { text: 'Hi! I is Luz.' });
  let { targets } = await engine.request<TravelLearningState>(evidencePath);
  assert.equal(targets[0].errors.be_agreement?.pending, 1);
  assert.equal(targets[0].assistance.answer_shown, 1);
  const second = await practice(engine, 'travel_hello_transfer', 'two', { text: 'I is Nico.' });
  assert.equal(second.errorType, 'be_agreement');
  const list = await engine.request<{ reviews: TravelReviewRow[] }>(
    '/v1/reviews/today?source=travel',
  );
  assert.equal(list.reviews[0].reason, 'remediation');
  const reviewPath = `${quickPath}&target=${encodeURIComponent(list.reviews[0].key)}`;
  const guided = await engine.request<QuickReviewState>(reviewPath);
  assert.equal(guided.exerciseId, 'travel_remedy_introduction_be');
  assert.equal(guided.reason, 'remediation');
  await engine.request(reviewPath, {
    action: 'answer',
    token: guided.token,
    answer: { text: 'am' },
  });
  await engine.request(reviewPath, { action: 'dismiss', token: guided.token });
  ({ targets } = await engine.request<TravelLearningState>(evidencePath));
  assert.equal(targets[0].errors.be_agreement?.pending, 2);
  assert.deepEqual(targets[0].successes.understanding, { independent: 0, assisted: 1 });
  const followUp = await engine.request<QuickReviewState>(reviewPath);
  assert.equal(followUp.exerciseId, 'travel_review_introduction');
  assert.equal(followUp.reason, 'remediation');
  const correct = await engine.request<QuickReviewState>(reviewPath, {
    action: 'answer',
    token: followUp.token,
    answer: { text: 'I’m Ada.' },
  });
  assert.equal(correct.result?.correct, true);
  ({ targets } = await engine.request<TravelLearningState>(evidencePath));
  assert.equal(targets[0].transferSuccesses, 1);
  assert.equal(targets[0].errors.be_agreement?.pending, 0);
  assert.equal(targets[0].errors.be_agreement?.occurrences, 3);
});

test('an unassisted delayed answer lengthens review while a transcript-assisted answer does not', async () => {
  const phone = device();
  let engine = phone.open();
  const direct = await practice(engine, 'travel_hello_write', 'correct', { text: "Hi!I'm Luz." });
  assert.equal(direct.correct, true);
  phone.later(day);
  const writing = `${quickPath}&target=writing%3Aintroduction`;
  const review = await engine.request<QuickReviewState>(writing);
  assert.equal(review.reason, 'due');
  assert.equal(review.exerciseId, 'travel_review_introduction');
  await engine.request(writing, {
    action: 'answer',
    token: review.token,
    answer: { text: 'My name is Ada.' },
  });
  const record = phone.state().travelLearning!.targets.find((item) => item.skill === 'writing')!;
  assert.equal(record.delayedSuccesses, 1);
  assert.equal(record.transferSuccesses, 1);
  assert.equal(Date.parse(record.nextReviewAt!) - Date.parse(record.lastPracticedAt!), 3 * day);

  await practice(engine, 'travel_bus_listen', 'first-listening', { optionId: 'stop' });
  phone.later(day);
  const listening = `${quickPath}&target=listening%3Aplace-question`;
  const listened = await engine.request<QuickReviewState>(listening);
  assert.ok(listened.audio && listened.transcriptText);
  await engine.request(listening, { action: 'transcript', token: listened.token });
  const e = travelLesson.exercises.find((item) => item.id === listened.exerciseId)!;
  await engine.request(listening, {
    action: 'draft',
    token: listened.token,
    answer: { text: 'a draft' },
  });
  engine = phone.open();
  const resumed = await engine.request<QuickReviewState>(listening);
  assert.ok(resumed.transcript);
  assert.deepEqual(resumed.answer, { text: 'a draft' });
  assert.equal((await engine.request<QuickReviewState>(writing)).token, review.token);
  await engine.request(listening, {
    action: 'answer',
    token: resumed.token,
    answer: e.correctOptionId
      ? { optionId: e.correctOptionId }
      : { text: (e.introduction?.model ?? e.acceptedAnswers[0]).replace('[tu nombre]', 'Camila') },
  });
  const listeningRecord = phone
    .state()
    .travelLearning!.targets.find((item) => item.skill === 'listening')!;
  assert.equal(listeningRecord.assistance.transcript, 1);
  assert.equal(listeningRecord.delayedSuccesses, 0);
  assert.equal(
    Date.parse(listeningRecord.nextReviewAt!) - Date.parse(listeningRecord.lastPracticedAt!),
    day,
  );
});

test('revision-one travel checkpoints migrate with their token, pending answer and feedback', async () => {
  const phone = device();
  const engine = phone.open();
  const backup = await engine.request<{ state: OfflineState }>('/v1/me/export');
  const old = {
    missionId: 'hello',
    contentRevision: 1,
    step: 3,
    token: 'original-read-token',
    answer: { text: 'Hi! I am' },
    hint: true,
    transcript: false,
    finished: false,
  };
  backup.state.travel = { active: old, completed: {}, stamps: {} };
  await engine.request('/v1/me/import', { backup });
  const restored = await phone.open().request<TravelState>('/v1/travel');
  assert.deepEqual(restored.active, {
    ...old,
    step: chapter.missions[0].steps.findIndex((step) => step.id === 'travel_hello_write'),
    stepId: 'travel_hello_write',
    contentRevision: chapter.revision,
  });
  assert.deepEqual((await engine.request<TravelLearningState>(evidencePath)).targets, []);
  const answered = await update(engine, {
    action: 'answer',
    token: old.token,
    answer: { text: 'Hi! I am Luz.' },
  });
  assert.ok(answered.active?.result?.correct);
  const record = phone.state().travelLearning!.targets[0];
  assert.deepEqual(record.successes.production, { independent: 0, assisted: 1 });
  assert.equal(record.assistance.hint, 1);
  const current = await engine.request('/v1/me/export');
  await engine.request('/v1/me', undefined, 'DELETE');
  await engine.request('/v1/me/import', { backup: current });
  assert.deepEqual((await engine.request<TravelLearningState>(evidencePath)).targets, [record]);
});

test('legacy indexed introduction checkpoints still resolve to transfer and speaking practice', async () => {
  const phone = device();
  const engine = phone.open();
  for (const [step, stepId] of [
    [7, 'travel_hello_transfer'],
    [8, 'hello_speak'],
  ] as const) {
    const backup = await engine.request<{ state: OfflineState }>('/v1/me/export');
    const saved = {
      missionId: 'hello',
      contentRevision: 2,
      step,
      token: `original-${stepId}`,
      answer: step === 7 ? { text: 'My name is Ana.' } : {},
      hint: false,
      transcript: false,
      finished: false,
    };
    backup.state.travel = { active: saved, completed: {}, stamps: {} };
    await engine.request('/v1/me/import', { backup });
    const restored = await phone.open().request<TravelState>('/v1/travel');
    assert.deepEqual(restored.active, {
      ...saved,
      step: chapter.missions[0].steps.findIndex((entry) => entry.id === stepId),
      stepId,
      contentRevision: chapter.revision,
    });
  }
});

test('speaking self-review advances atomically and records practice without a grade', async () => {
  const phone = device();
  const engine = phone.open();
  const backup = await engine.request<{ state: OfflineState }>('/v1/me/export');
  backup.state.travel = {
    completed: {},
    stamps: {},
    active: {
      missionId: 'hello',
      contentRevision: 1,
      step: 4,
      token: 'old-speak-checkpoint',
      answer: {},
      hint: false,
      transcript: false,
      finished: false,
    },
  };
  await engine.request('/v1/me/import', { backup });
  const action = { action: 'speak', token: 'old-speak-checkpoint', practice: 'recorded' } as const;
  phone.fail(true);
  await assert.rejects(update(engine, action), /write failed/);
  phone.fail(false);
  const advanced = await update(engine, action);
  assert.deepEqual(await update(phone.open(), action), advanced);
  const {
    targets: [speaking],
  } = await engine.request<TravelLearningState>(evidencePath);
  assert.equal(speaking.skill, 'speaking');
  assert.deepEqual(speaking.speakingPractice, { recorded: 1 });
  assert.deepEqual(speaking.successes, {});
  assert.equal(speaking.attempts, 0);
  assert.equal(speaking.nextReviewAt, undefined);
});
