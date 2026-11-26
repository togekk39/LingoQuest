import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CHAPTER_CATALOG_FILE,
  chapterCatalogSchema,
  parseChapterPack,
} from '@lingoquest/course-pack';
import { g, p, w } from '../../../content/source/salvador-lessons';
import { salvadorScenarioPaths } from '../../../content/source/salvador-scenario-review';
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

const root = new URL('../../../apps/mobile/public/chapter-packs/', import.meta.url);
const catalog = chapterCatalogSchema.parse(
  JSON.parse(readFileSync(new URL(CHAPTER_CATALOG_FILE, root), 'utf8')),
);
const packAt = (revision: number) =>
  parseChapterPack(readFileSync(new URL(`${revision}/brazil.json`, root), 'utf8'), 'brazil');
const pack = packAt(catalog.chapters.brazil.revision);
const bundled = JSON.parse(
  readFileSync(
    new URL('../../../apps/mobile/src/content/bundled-course.json', import.meta.url),
    'utf8',
  ),
);
const content = { ...bundled.payload, courseVersion: bundled.manifest.version } as CourseData;
const missions = pack.story!.chapter.missions as unknown as TravelMission[];
const practice = [
  ...missions.flatMap(({ steps }) => steps),
  ...(pack.story!.practice as TravelMission['steps']),
].flatMap((step) =>
  step.type === 'exercise' && step.lessonId
    ? [
        {
          lessonId: step.lessonId,
          exercise: step.exercise,
          version: `brazil:${pack.revision}`,
          requires: step.requires,
          targets: step.targets,
        },
      ]
    : [],
);
const definitions = formalDefinitions(content, [], pack.story!.audit!.definitions);

function learner(initial = pack) {
  let currentPack: typeof pack | null = initial;
  let now = Date.UTC(2026, 10, 26, 17);
  let sequence = 0;
  const values = new Map<string, string>();
  const makeEngine = () =>
    new OfflineEngine({
      getContent: () => content,
      getChapterCards: async (id) => (id === 'brazil' ? currentPack : null),
      clock: () => now,
      randomId: () => `salvador-test-${++sequence}`,
      store: {
        getItem: async (key) => values.get(key) ?? null,
        setItem: async (key, value) => void values.set(key, value),
      },
    });
  let engine = makeEngine();
  const saved = () => JSON.parse(values.get(OFFLINE_STATE_KEY)!) as OfflineState;
  const travel = (body?: unknown, source = 'study') =>
    engine.request<TravelState>(`/v1/travel?chapter=brazil&source=${source}`, body);
  const review = (key: string, body?: unknown) =>
    engine.request<QuickReviewState>(
      `/v1/reviews/quick?source=unified&chapter=brazil&target=${encodeURIComponent(key)}`,
      body,
    );
  return {
    travel,
    saved,
    review,
    removePack: () => {
      currentPack = null;
    },
    upgrade: () => {
      currentPack = pack;
    },
    restart: () => {
      engine = makeEngine();
    },
    waitDays: (days: number) => {
      now += days * 86_400_000;
    },
    gate: (mode: ChallengeType, exercises: CourseData['challengePools'][ChallengeType]) =>
      challengeLearningGate(saved(), content, practice, definitions)(
        'adventure',
        mode,
        exercises,
        pack.story!.audit!.challenges,
      ),
    mastery: (ref: { id: string }, dimension: Parameters<typeof getUnifiedMastery>[2]) =>
      getUnifiedMastery(saved().unifiedLearning, ref.id, dimension),
  };
}

type Learner = ReturnType<typeof learner>;
const team = (state: TravelState) => {
  const scenario = state.active?.scenario;
  assert.ok(scenario && 'kind' in scenario && scenario.kind === 'team');
  return scenario;
};
const response = (token: string, text: string) => ({ action: 'answer', token, answer: { text } });

async function play(player: Learner, mission: TravelMission, route = 0, checkResume = false) {
  let state = await player.travel({ action: 'start', missionId: mission.id });
  const path = mission.scenario ? salvadorScenarioPaths[mission.scenario.id][route] : [];
  if (mission.id === 'salvador-team') {
    assert.equal(team(state).work.find(({ taskId }) => taskId === 'wash')?.status, 'done');
    assert.equal(team(state).work.find(({ taskId }) => taskId === 'wash-final')?.status, 'active');
  }
  const priorWorld = state.teamHistory?.['salvador-lunch-observe'];
  let probeIndex = 0;
  for (const step of mission.steps) {
    assert.equal(state.active?.stepId, step.id);
    const token = state.active!.token;
    if (step.type === 'teach') {
      for (const [index] of travelStepVocabulary(mission, step).entries())
        await player.travel({ action: 'word', token, position: index + 1 });
    }
    if (step.type === 'exercise' && step.scenarioTurn?.action === 'team') {
      while (probeIndex < path.length) {
        const { input, person, expected = 'target', reply, advance } = path[probeIndex++];
        const activeToken = state.active!.token;
        assert.equal(state.active?.prerequisiteInstruction, undefined, step.id);
        if (person)
          await player.travel({ action: 'scenarioSpeaker', token: activeToken, personId: person });
        const before = team(state);
        if (checkResume && input.startsWith('Sam, can you')) {
          await player.travel({
            action: 'draft',
            token: activeToken,
            answer: { text: 'Sam, can you cut' },
          });
          player.restart();
          const restored = await player.travel(undefined, 'story');
          assert.deepEqual(team(restored), before);
          assert.equal(restored.active?.scenarioSpeaker, 'sam');
          assert.equal(restored.active?.answer.text, 'Sam, can you cut');
        }
        state = await player.travel(response(activeToken, input));
        assert.equal(state.active?.result?.outcome, expected, `${step.id}: ${input}`);
        if (reply) assert.equal(state.active?.scenarioReply?.line.en, reply);
        if (expected === 'target' || expected === 'communication_only') {
          if (input.startsWith('Can Sam ')) assert.deepEqual(team(state).work, before.work);
          if (step.scenarioTurn.assign && expected === 'target') {
            const taskId: string = step.scenarioTurn.assign[0];
            assert.equal(
              team(state).work.find((entry) => entry.taskId === taskId)?.status,
              'assigned',
            );
            if (checkResume) {
              const evidence = player.saved().unifiedLearning.evidence;
              const duplicate = await player.travel(response(activeToken, input));
              assert.deepEqual(team(duplicate), team(state));
              assert.deepEqual(player.saved().unifiedLearning.evidence, evidence);
            }
          }
          state = await player.travel({ action: 'advance', token: activeToken });
        } else {
          assert.deepEqual(team(state), before);
          state = await player.travel({ action: 'retry', token: activeToken });
        }
        if (advance) break;
      }
      continue;
    }
    if (step.type === 'exercise') {
      assert.equal(state.active?.prerequisiteInstruction, undefined, step.id);
      if (step.audio) {
        const blocked = await player.travel({
          action: 'answer',
          token,
          answer: { optionId: step.exercise.correctOptionId },
        });
        assert.equal(blocked.active?.result, undefined);
        await player.travel({ action: 'listened', token });
      }
      const { correctOptionId, acceptedAnswers, ungradable } = step.exercise;
      state = await player.travel({
        action: 'answer',
        token,
        answer: correctOptionId ? { optionId: correctOptionId } : { text: acceptedAnswers[0] },
      });
      assert.equal(state.active?.result?.outcome, ungradable ? 'ungradable' : 'target', step.id);
    }
    state = await player.travel({ action: 'advance', token });
  }
  assert.ok(state.completed[mission.id], mission.id);
  if (mission.scenario) assert.equal(team(state).phase, 'complete');
  if (mission.scenario && 'snapshot' in mission.scenario && mission.scenario.snapshot)
    assert.deepEqual(state.teamHistory?.['salvador-lunch-observe'], priorWorld);
  if (mission.id === 'salvador-display') {
    assert.deepEqual(
      team(state).work.map(({ status }) => status),
      ['active', 'active', 'done', 'done'],
    );
  }
  assert.equal(probeIndex, path.length);
  return state;
}

test('Salvador gates every challenge and completes two distinct team paths with saved work and precise evidence', async () => {
  const player = learner();
  const pools = Object.entries(pack.story!.challenges!) as unknown as [
    ChallengeType,
    CourseData['challengePools'][ChallengeType],
  ][];
  await player.travel();
  for (const [mode, items] of pools)
    assert.deepEqual(
      player.gate(mode, items).missingTeaching,
      items.map(({ id }) => id),
    );
  for (const mission of missions.filter(({ optional }) => !optional))
    await play(player, mission, 0, true);
  assert.ok((await player.travel()).stamps.brazil);
  const first = player
    .saved()
    .unifiedLearning.evidence.find(
      ({ exerciseId, activity, outcome }) =>
        exerciseId === 'salvador-observe' && activity === 'answer' && outcome === 'target',
    )!;
  assert.ok(first.targets.some(({ targetId }) => targetId === g.now.id));
  assert.ok(first.targets.some(({ targetId }) => targetId === w.washing.teaches[0].id));
  assert.ok(
    !first.targets.some(({ targetId }) =>
      [g.question.id, g.negative.id, w.cooking.teaches[0].id].includes(targetId),
    ),
  );
  const request = player
    .saved()
    .unifiedLearning.evidence.find(
      ({ exerciseId, activity }) => exerciseId === 'salvador-ask-bread' && activity === 'answer',
    )!;
  assert.ok(request.targets.some(({ targetId }) => targetId === p.request.id));
  assert.ok(!request.targets.some(({ targetId }) => targetId === g.now.id));
  for (const [mode, items] of pools) assert.equal(player.gate(mode, items).ready, true, mode);

  const before = player.mastery(g.order, 'writing');
  assert.equal(before.transfer, 'verified');
  assert.equal(before.retention, 'unverified');
  player.waitDays(8);
  const order = `writing:${g.order.id}`;
  const delayed = await player.review(order);
  const item = practice.find(({ exercise }) => exercise.id === delayed.exercise.id)!;
  assert.ok(item && !item.exercise.options, delayed.exercise.id);
  const result = await player.review(
    order,
    response(delayed.token, item.exercise.acceptedAnswers[0]),
  );
  assert.equal(result.result?.outcome, 'target');
  assert.equal(player.mastery(g.order, 'writing').retention, 'verified');

  const alternate = learner();
  for (const mission of missions.slice(0, 3)) await play(alternate, mission);
  const secondTeam = team(await play(alternate, missions[3], 1));
  assert.deepEqual(
    secondTeam.history
      .filter(({ status }) => status === 'assigned')
      .map(({ personId }) => personId),
    ['jo', 'sam'],
  );
  await play(alternate, missions[4]);
  assert.ok((await alternate.travel()).stamps.brazil);
  const restarted = await alternate.travel({ action: 'start', missionId: missions[3].id });
  assert.deepEqual(team(restarted).history, []);
  assert.deepEqual(team(restarted).confirmed, []);
});

test('Salvador review repairs the exact -ing form using archived text after the offline pack is removed', async () => {
  const player = learner();
  for (const mission of missions.slice(0, 3)) await play(player, mission);
  await play(player, missions[3], 1);
  assert.ok(player.mastery(p.question, 'grammar_production').pendingErrors.includes('be_omission'));
  const questionKey = `grammar_production:${p.question.id}`;
  const questionGuide = await player.review(questionKey);
  assert.equal(questionGuide.exercise.id, 'salvador-repair-question-be-guide');
  await player.review(questionKey, response(questionGuide.token, 'is'));
  assert.ok(player.mastery(p.question, 'grammar_production').pendingErrors.includes('be_omission'));
  const questionCheck = await player.review(questionKey, {
    action: 'continue',
    token: questionGuide.token,
  });
  assert.equal(questionCheck.exercise.id, 'salvador-repair-question-be-check');
  const repairedQuestion = await player.review(
    questionKey,
    response(questionCheck.token, 'What is Luz doing?'),
  );
  assert.equal(repairedQuestion.result?.outcome, 'target');
  assert.ok(
    !player.mastery(p.question, 'grammar_production').pendingErrors.includes('be_omission'),
  );
  const cut = w.cutting.teaches[0];
  assert.ok(
    player.mastery(cut, 'vocabulary_recall').pendingErrors.includes('progressive_spelling'),
  );
  assert.ok(
    !player
      .mastery(w.making.teaches[0], 'vocabulary_recall')
      .pendingErrors.includes('progressive_spelling'),
  );

  player.removePack();
  player.restart();
  const key = `vocabulary_recall:${cut.id}`;
  const guide = await player.review(key);
  assert.equal(guide.exercise.id, 'salvador-repair-cutting-guide');
  await player.review(key, response(guide.token, 'cutting'));
  assert.ok(
    player.mastery(cut, 'vocabulary_recall').pendingErrors.includes('progressive_spelling'),
  );
  const confirmation = await player.review(key, { action: 'continue', token: guide.token });
  assert.equal(confirmation.exercise.id, 'salvador-repair-cutting-check');
  const checked = await player.review(
    key,
    response(confirmation.token, 'Luz is cutting the vegetables.'),
  );
  assert.equal(checked.result?.outcome, 'target');
  assert.ok(
    !player.mastery(cut, 'vocabulary_recall').pendingErrors.includes('progressive_spelling'),
  );
});

test('revision 16 in-progress lunch upgrades with its selected NPC, draft, assignment and prior evidence', async () => {
  const old = packAt(16);
  const player = learner(old);
  const previous = old.story!.chapter.missions as unknown as TravelMission[];
  const send = (token: string, action: string, data = {}) =>
    player.travel({ action, token, ...data });
  let state = await player.travel();
  for (const mission of previous.slice(0, 4)) {
    state = await player.travel({ action: 'start', missionId: mission.id });
    for (const step of mission.steps) {
      const token = state.active!.token;
      assert.equal(state.active?.stepId, step.id);
      if (step.id === 'salvador-lunch-bread-live') break;
      if (step.type === 'teach') {
        for (const [index] of travelStepVocabulary(mission, step).entries())
          await send(token, 'word', { position: index + 1 });
      }
      if (step.type === 'exercise') {
        if (step.audio) await send(token, 'listened');
        const { correctOptionId, acceptedAnswers } = step.exercise;
        if (step.id === 'salvador-lunch-check')
          await send(token, 'scenarioSpeaker', { personId: 'rafa' });
        if (step.id === 'salvador-lunch-bread')
          await send(token, 'scenarioSpeaker', { personId: 'sam' });
        state = await send(token, 'answer', {
          answer: correctOptionId
            ? { optionId: correctOptionId }
            : {
                text:
                  step.id === 'salvador-lunch-check' ? 'What is Rafa doing?' : acceptedAnswers[0],
              },
        });
        assert.equal(state.active?.result?.outcome, 'target', step.id);
        if (step.id === 'salvador-observe') {
          state = await send(token, 'advance');
          const again = state.active!.token;
          state = await send(again, 'answer', { answer: { text: 'Rafa is cooking rice.' } });
          assert.equal(state.active?.result?.outcome, 'target');
        }
      }
      state = await send(state.active!.token, 'advance');
    }
  }
  const draft = 'Sam is cutting the bread.';
  await send(state.active!.token, 'draft', { answer: { text: draft } });
  const evidence = player.saved().unifiedLearning.evidence;
  assert.equal(team(state).work.find(({ taskId }) => taskId === 'bread')?.status, 'active');
  player.upgrade();
  player.restart();
  const upgraded = await player.travel(undefined, 'story');
  assert.equal(upgraded.active?.stepId, 'salvador-lunch-bread-live');
  assert.equal(upgraded.active?.contentRevision, pack.revision);
  assert.equal(upgraded.active?.scenarioSpeaker, 'sam');
  assert.equal(upgraded.active?.answer.text, draft);
  assert.equal(team(upgraded).work.find(({ taskId }) => taskId === 'bread')?.status, 'active');
  assert.equal(team(upgraded).work.find(({ taskId }) => taskId === 'wash')?.status, 'done');
  assert.equal(team(upgraded).work.find(({ taskId }) => taskId === 'wash-final')?.status, 'done');
  assert.deepEqual(player.saved().unifiedLearning.evidence, evidence);
  const token = upgraded.active!.token;
  if (upgraded.active?.prerequisiteInstruction) await send(token, 'prepare');
  const answer = await send(token, 'answer', {
    answer: { text: draft + ' Then put the bowls on the table.' },
  });
  assert.equal(answer.active?.result?.outcome, 'target');
  const next = await send(token, 'advance');
  assert.equal(team(next).work.find(({ taskId }) => taskId === 'bread')?.status, 'done');
  assert.equal(team(next).work.find(({ taskId }) => taskId === 'bowls')?.status, 'unassigned');
});

test('the optional lunch note has complete prerequisite teaching on a fresh Study route', async () => {
  const player = learner();
  const optional = missions.find(({ optional }) => optional)!;
  await play(player, optional);
  assert.equal((await player.travel()).stamps.brazil, undefined);
  for (const step of optional.steps) {
    if (step.type !== 'exercise') continue;
    const event = player
      .saved()
      .unifiedLearning.evidence.find(
        ({ exerciseId, activity }) => exerciseId === step.id && activity === 'answer',
      );
    assert.deepEqual(
      new Set(event?.targets.map(({ targetId }) => targetId)),
      new Set([step.exercise.skillId]),
    );
  }
});
