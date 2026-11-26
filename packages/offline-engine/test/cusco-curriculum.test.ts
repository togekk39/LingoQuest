import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CHAPTER_CATALOG_FILE,
  chapterCatalogSchema,
  parseChapterPack,
} from '@lingoquest/course-pack';
import { g, p } from '../../../content/source/cusco-lessons';
import { challengeLearningGate, type ChallengeType } from '../src/challenge-learning';
import { formalDefinitions } from '../src/learning-prerequisites';
import {
  getUnifiedMastery,
  OFFLINE_STATE_KEY,
  OfflineEngine,
  travelStepVocabulary,
  type CourseData,
  type OfflineState,
  type QuickReviewState,
  type TravelMission,
  type TravelState,
} from '../src';

const packDir = new URL('../../../apps/mobile/public/chapter-packs/', import.meta.url);
const catalog = chapterCatalogSchema.parse(
  JSON.parse(readFileSync(new URL(CHAPTER_CATALOG_FILE, packDir), 'utf8')),
);
const currentRevision = catalog.chapters.peru.revision;
const packAt = (revision: number) =>
  parseChapterPack(readFileSync(new URL(`${revision}/peru.json`, packDir), 'utf8'), 'peru');
const bundled = JSON.parse(
  readFileSync(
    new URL('../../../apps/mobile/src/content/bundled-course.json', import.meta.url),
    'utf8',
  ),
);
const content = { ...bundled.payload, courseVersion: bundled.manifest.version } as CourseData;

function learner(initialRevision = currentRevision) {
  let pack = packAt(initialRevision);
  let sequence = 0;
  let now = Date.UTC(2026, 10, 25, 17);
  const store = new Map<string, string>();
  const engine = new OfflineEngine({
    getContent: () => content,
    getChapterCards: async (id) => (id === 'peru' ? pack : null),
    clock: () => now,
    randomId: () => `cusco-curriculum-${++sequence}`,
    store: {
      getItem: async (key) => store.get(key) ?? null,
      setItem: async (key, value) => void store.set(key, value),
    },
  });
  const saved = () => JSON.parse(store.get(OFFLINE_STATE_KEY)!) as OfflineState;
  const mastery = (id: string, dimension: Parameters<typeof getUnifiedMastery>[2]) =>
    getUnifiedMastery(saved().unifiedLearning, id, dimension);
  const travel = (body?: unknown, source = 'study') =>
    engine.request<TravelState>(`/v1/travel?chapter=peru&source=${source}`, body);
  const review = (target: string, body?: unknown) =>
    engine.request<QuickReviewState>(
      `/v1/reviews/quick?source=unified&chapter=peru&target=${encodeURIComponent(target)}`,
      body,
    );
  const answer = (token: string, text: string) =>
    travel({ action: 'answer', token, answer: { text } });
  const reviewAnswer = (
    target: string,
    token: string,
    answer: { text: string } | { optionId: string },
  ) => review(target, { action: 'answer', token, answer });
  async function ask(token: string, personId: string, text: string) {
    await travel({ action: 'scenarioSpeaker', token, personId });
    return answer(token, text);
  }
  const advance = (token: string) => travel({ action: 'advance', token });
  return {
    get pack() {
      return pack;
    },
    get missions() {
      return pack.story!.chapter.missions as unknown as TravelMission[];
    },
    upgrade: () => {
      pack = packAt(currentRevision);
    },
    waitDays: (days: number) => {
      now += days * 86400000;
    },
    saved,
    mastery,
    travel,
    review,
    answer,
    reviewAnswer,
    ask,
    advance,
  };
}

type Learner = ReturnType<typeof learner>;
type Override = (
  step: TravelMission['steps'][number],
  token: string,
) => Promise<TravelState | void>;
async function play(player: Learner, mission: TravelMission, override?: Override) {
  let state = await player.travel({ action: 'start', missionId: mission.id });
  for (const step of mission.steps) {
    assert.equal(state.active?.stepId, step.id);
    const token = state.active!.token;
    const custom = await override?.(step, token);
    if (custom) {
      state = custom;
      if (state.active?.stepId === step.id && !state.active.result) return state;
      continue;
    }
    if (step.type === 'teach') {
      for (const [index] of travelStepVocabulary(mission, step).entries())
        await player.travel({ action: 'word', token, position: index + 1 });
    }
    if (step.type === 'exercise') {
      if (step.audio) await player.travel({ action: 'listened', token });
      const { correctOptionId, acceptedAnswers, ungradable } = step.exercise;
      state = await player.travel({
        action: 'answer',
        token,
        answer: correctOptionId ? { optionId: correctOptionId } : { text: acceptedAnswers[0] },
      });
      assert.equal(state.active?.result?.outcome, ungradable ? 'ungradable' : 'target', step.id);
    }
    state = await player.advance(token);
  }
  assert.ok(state.completed[mission.id]);
  return state;
}

test('Cusco story permits Who and When, offers the missing Did form, and qualifies all twelve challenges', async () => {
  const player = learner();
  const story = player.pack.story!;
  assert.ok(story.audit?.challenges && story.challenges);
  const definitions = formalDefinitions(content, [], story.audit.definitions);
  const practice = [
    ...player.missions.flatMap(({ steps }) => steps),
    ...(story.practice as TravelMission['steps']),
  ].flatMap((step) =>
    step.type === 'exercise' && step.lessonId
      ? [
          {
            lessonId: step.lessonId,
            exercise: step.exercise,
            version: `peru:${currentRevision}`,
            requires: step.requires,
            targets: step.targets,
          },
        ]
      : [],
  );
  const pools = Object.entries(story.challenges) as unknown as [
    ChallengeType,
    CourseData['challengePools'][ChallengeType],
  ][];
  const eligibility = (mode: ChallengeType, items: CourseData['challengePools'][ChallengeType]) =>
    challengeLearningGate(player.saved(), content, practice, definitions)(
      'adventure',
      mode,
      items,
      story.audit!.challenges,
    );
  await player.travel();
  assert.equal(pools.flatMap(([, items]) => items).length, 12);
  for (const [mode, items] of pools)
    assert.deepEqual(
      eligibility(mode, items).missingTeaching,
      items.map(({ id }) => id),
    );

  for (const mission of player.missions) {
    await play(player, mission, async ({ id }, token) => {
      if (id === 'cusco-market-inquire') {
        const who = await player.ask(token, 'sam', 'Who took the photo?');
        assert.equal(who.active?.scenarioReply?.line.en, 'Luz did.');
        const evidence = player.saved().unifiedLearning.evidence.at(-1);
        assert.deepEqual(
          new Set(evidence?.targets.map(({ targetId }) => targetId)),
          new Set([p.subject.id]),
        );
        const next = await player.advance(token);
        const again = await player.ask(next.active!.token, 'luz', 'Who took a photo?');
        assert.equal(again.active?.result?.outcome, 'communication_only');
        const another = await player.advance(next.active!.token);
        const when = await player.ask(
          another.active!.token,
          'diego',
          'When did Luz take the photo?',
        );
        assert.equal(when.active?.scenarioReply?.line.en, 'At eleven.');
        return player.advance(another.active!.token);
      }
      if (id === 'cusco-museum-inquire') {
        const where = await player.ask(token, 'nora', 'Where did Ana see Nora?');
        assert.equal(where.active?.scenarioReply?.line.en, 'At the museum entrance.');
        const next = await player.advance(token);
        const when = await player.ask(next.active!.token, 'ana', 'When did you see Nora?');
        assert.equal(when.active?.scenarioReply?.line.en, 'At three.');
        return player.advance(next.active!.token);
      }
    });
  }
  assert.ok((await player.travel()).stamps.peru);
  const restarted = await player.travel({ action: 'start', missionId: player.missions[3].id });
  assert.ok(
    restarted.active?.scenario &&
      'kind' in restarted.active.scenario &&
      restarted.active.scenario.kind === 'timeline',
  );
  assert.deepEqual(restarted.active.scenario.confirmed, []);
  assert.deepEqual(restarted.active.scenario.answers, []);
  assert.deepEqual(restarted.active.scenario.submitted, []);
  assert.equal(player.mastery(p.ask.id, 'grammar_production').independentSuccesses, 0);
  const beforeDelay = player.mastery(p.wh.id, 'writing');
  assert.equal(beforeDelay.transfer, 'verified');
  assert.equal(beforeDelay.retention, 'unverified');
  for (const [mode, items] of pools) {
    const gate = eligibility(mode, items);
    assert.deepEqual(gate.missingTeaching, [], mode);
    assert.deepEqual(
      gate.missingPractice,
      mode === 'reading_quest' ? [] : [`challenge_cusco_${mode}_ask`],
      mode,
    );
  }

  const did = `grammar_production:${p.ask.id}`;
  const today = await player.review(did);
  assert.equal(today.exercise.id, 'cusco-did-base-write');
  assert.equal(
    (await player.reviewAnswer(did, today.token, { text: 'Did you go to the plaza?' })).result
      ?.outcome,
    'target',
  );
  for (const [mode, items] of pools) assert.equal(eligibility(mode, items).ready, true, mode);

  player.waitDays(8);
  const wh = `writing:${p.wh.id}`;
  const delayed = await player.review(wh);
  assert.equal(delayed.exercise.id.startsWith('cusco-did-info-'), true, delayed.exercise.id);
  const item = practice.find(({ exercise }) => exercise.id === delayed.exercise.id);
  assert.ok(item);
  const delayedAnswer = await player.reviewAnswer(wh, delayed.token, {
    text: item.exercise.acceptedAnswers[0],
  });
  assert.equal(delayedAnswer.result?.outcome, 'target');
  assert.equal(player.mastery(p.wh.id, 'writing').retention, 'verified');
});

test('Cusco upgrades a real revision 14 inquiry without losing its draft, witness, or evidence', async () => {
  const player = learner(14);
  for (const mission of player.missions.slice(0, 3)) await play(player, mission);
  const askMission = player.missions[3];
  const original = await play(player, askMission, async ({ id }, token) => {
    if (id !== 'cusco-market-inquire') return;
    const response = await player.ask(token, 'sam', 'Who took the photo?');
    assert.equal(response.active?.scenarioReply?.line.en, 'Luz did.');
    const next = await player.advance(token);
    await player.travel({ action: 'scenarioSpeaker', token: next.active!.token, personId: 'luz' });
    return player.travel({
      action: 'draft',
      token: next.active!.token,
      answer: { text: 'When did you take' },
    });
  });
  const before = player.saved().unifiedLearning.evidence;
  player.upgrade();
  const upgraded = await player.travel(undefined, 'story');
  assert.equal(upgraded.active?.contentRevision, currentRevision);
  assert.equal(upgraded.active?.token, original.active?.token);
  assert.equal(upgraded.active?.scenarioSpeaker, 'luz');
  assert.deepEqual(upgraded.active?.answer, { text: 'When did you take' });
  assert.deepEqual(upgraded.active?.scenario, original.active?.scenario);
  assert.deepEqual(player.saved().unifiedLearning.evidence, before);

  const token = upgraded.active!.token;
  assert.ok(upgraded.active?.prerequisiteInstruction);
  const prepared = await player.travel({ action: 'prepare', token });
  assert.ok(prepared.active?.prerequisitePrepared);
  const when = await player.answer(token, 'When did you take the photo?');
  assert.equal(when.active?.scenarioReply?.line.en, 'At eleven.');
  const note = await player.advance(token);
  assert.equal(note.active?.stepId, 'cusco-market-record');
  if (note.active?.prerequisiteInstruction)
    await player.travel({ action: 'prepare', token: note.active.token });
  const invalid = await player.answer(note.active!.token, "Luz didn't took a photo.");
  assert.equal(invalid.active?.result?.errorType, 'did_base');
  for (const id of [p.negative.id, g.negativeBase.id])
    assert.deepEqual(player.mastery(id, 'grammar_production').pendingErrors, ['did_base']);
  assert.deepEqual(invalid.active?.scenario, note.active?.scenario);
  const retry = await player.travel({ action: 'retry', token: note.active!.token });
  const correction = await player.answer(retry.active!.token, 'Luz took the photo at eleven.');
  assert.equal(correction.active?.result?.outcome, 'target');

  const key = `grammar_production:${p.negative.id}`;
  const guide = await player.review(key);
  assert.equal(guide.exercise.id, 'cusco-didnt-base-guide');
  const guided = await player.reviewAnswer(key, guide.token, {
    text: "I didn't go to the market.",
  });
  assert.equal(guided.guidedSuccess, true);
  assert.deepEqual(player.mastery(p.negative.id, 'grammar_production').pendingErrors, ['did_base']);
  const confirm = await player.review(key, { action: 'continue', token: guided.token });
  assert.equal(confirm.exercise.id, 'cusco-didnt-base-confirm');
  const confirmed = await player.reviewAnswer(key, confirm.token, {
    text: "She didn't buy bread.",
  });
  assert.equal(confirmed.result?.outcome, 'target');
  for (const id of [p.negative.id, g.negativeBase.id])
    assert.deepEqual(player.mastery(id, 'grammar_production').pendingErrors, []);
  assert.equal(player.mastery(p.negative.id, 'grammar_production').retention, 'unverified');
});

test('Cusco targets sound groups, chronology, and verb forms independently during review', async () => {
  const player = learner();
  const [be, regular, irregular] = player.missions;
  const decision = (token: string, optionId: string) =>
    player.travel({ action: 'answer', token, answer: { optionId } });
  const finishRetry = async (token: string, text: string) => {
    const attempt = await player.travel({ action: 'retry', token });
    const next = await player.answer(attempt.active!.token, text);
    assert.equal(next.active?.result?.outcome, 'target');
    return player.advance(attempt.active!.token);
  };

  const was = 'form.u04_l01.1';
  const were = 'form.u04_l01.2';
  await play(player, be, async (step, token) => {
    if (step.id !== 'cusco-was-write') return;
    const error = await player.answer(token, 'Sam were at the hotel.');
    assert.equal(error.active?.result?.errorType, 'past_be');
    return finishRetry(token, 'Sam was at the hotel.');
  });
  assert.deepEqual(player.mastery(was, 'grammar_production').pendingErrors, ['past_be']);
  assert.deepEqual(player.mastery(were, 'grammar_production').pendingErrors, []);

  await play(player, regular, async (step, token) => {
    if (step.id !== 'cusco-sound-t') return;
    await player.travel({ action: 'listened', token });
    const failed = await decision(token, '2');
    assert.equal(failed.active?.result?.errorType, 'past_ending');
    const retry = await player.travel({ action: 'retry', token });
    await player.travel({ action: 'transcript', token: retry.active!.token });
    const assisted = await decision(retry.active!.token, '1');
    assert.equal(assisted.active?.result?.outcome, 'target');
    return player.advance(retry.active!.token);
  });
  const sound = () => player.mastery(g.endingT.id, 'listening');
  assert.equal(sound().independentSuccesses, 0);
  assert.deepEqual(sound().pendingErrors, ['past_ending']);
  assert.equal(player.mastery(g.endingD.id, 'listening').independentSuccesses, 1);
  assert.equal(player.mastery(g.endingId.id, 'listening').independentSuccesses, 1);

  const t = `listening:${g.endingT.id}`;
  const guided = await player.review(t);
  assert.equal(guided.exercise.id, 'cusco-sound-review-t-guide');
  await player.review(t, { action: 'listened', token: guided.token });
  assert.equal((await player.reviewAnswer(t, guided.token, { optionId: '1' })).guidedSuccess, true);
  assert.deepEqual(sound().pendingErrors, ['past_ending']);
  const confirmation = await player.review(t, { action: 'continue', token: guided.token });
  assert.equal(confirmation.exercise.id, 'cusco-sound-review-t-confirm');
  await player.review(t, { action: 'listened', token: confirmation.token });
  await player.reviewAnswer(t, confirmation.token, { optionId: '1' });
  assert.deepEqual(sound().pendingErrors, []);

  await play(player, irregular, async (step, token) => {
    if (step.id === 'cusco-went-write') {
      const wrong = await player.answer(token, 'We goed to the market.');
      assert.equal(wrong.active?.result?.errorType, 'past_spelling');
      return finishRetry(token, 'We went to the market.');
    }
    if (step.id === 'cusco-market-before-after') {
      const wrong = await player.answer(token, 'We went to the market after we ate lunch.');
      assert.equal(wrong.active?.result?.outcome, 'context_mismatch');
      assert.equal(wrong.active?.result?.errorType, 'past_order');
      return finishRetry(token, 'We went to the market before we ate lunch.');
    }
  });
  assert.deepEqual(player.mastery('form.u04_l03.1', 'grammar_production').pendingErrors, [
    'past_spelling',
  ]);
  assert.deepEqual(player.mastery('form.u04_l03.2', 'grammar_production').pendingErrors, []);
  assert.deepEqual(player.mastery(g.sequence.id, 'grammar_production').pendingErrors, [
    'past_order',
  ]);
  assert.deepEqual(player.mastery(p.order.id, 'writing').pendingErrors, []);
  const order = `grammar_production:${g.sequence.id}`;
  const guide = await player.review(order);
  assert.equal(guide.exercise.id, 'cusco-order-guide');
  await player.reviewAnswer(order, guide.token, { text: 'We ate lunch after we bought bread.' });
  assert.deepEqual(player.mastery(g.sequence.id, 'grammar_production').pendingErrors, [
    'past_order',
  ]);
  const confirm = await player.review(order, { action: 'continue', token: guide.token });
  assert.equal(confirm.exercise.id, 'cusco-order-confirm');
  await player.reviewAnswer(order, confirm.token, { text: 'We went to the plaza before lunch.' });
  assert.deepEqual(player.mastery(g.sequence.id, 'grammar_production').pendingErrors, []);
});
