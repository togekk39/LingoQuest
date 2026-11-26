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

function learner() {
  let currentPack: typeof pack | null = pack;
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
  for (const mission of missions) await play(player, mission, 0, true);
  assert.ok((await player.travel()).stamps.brazil);
  const first = player
    .saved()
    .unifiedLearning.evidence.find(
      ({ exerciseId, activity, outcome }) =>
        exerciseId === 'salvador-observe' && activity === 'answer' && outcome === 'target',
    )!;
  assert.ok(first.targets.some(({ targetId }) => targetId === p.now.id));
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
  assert.ok(!request.targets.some(({ targetId }) => targetId === p.now.id));
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
    response(confirmation.token, 'Luz is cutting the bread.'),
  );
  assert.equal(checked.result?.outcome, 'target');
  assert.ok(
    !player.mastery(cut, 'vocabulary_recall').pendingErrors.includes('progressive_spelling'),
  );
});
