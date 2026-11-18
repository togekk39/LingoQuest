import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import type { Answer } from '@lingoquest/contracts';
import {
  chapter,
  OfflineEngine,
  OFFLINE_STATE_KEY,
  route,
  type CourseData,
  type OfflineState,
  type QuickReviewState,
  type TravelOperation,
  type TravelState,
} from '../src/index.ts';

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

test('the twenty-stage route covers every continent and references real curriculum units', () => {
  assert.equal(route.length, 20);
  assert.equal(new Set(route.map((item) => item.id)).size, 20);
  assert.equal(new Set(route.map((item) => item.continent)).size, 7);
  assert.equal(route[19].id, 'antarctica');
  assert.match(route[19].location, /Ushuaia/);
  assert.ok(route.filter((item) => item.continent === 'América del Sur').length >= 4);
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
            : { text: e.acceptedAnswers[0] };
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
  assert.equal(Object.keys(phone.state().attempts).length, 5);
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
