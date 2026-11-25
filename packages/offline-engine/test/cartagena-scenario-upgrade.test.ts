import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CHAPTER_CATALOG_FILE,
  chapterCatalogSchema,
  parseChapterPack,
} from '@lingoquest/course-pack';
import {
  OFFLINE_STATE_KEY,
  OfflineEngine,
  travelStepVocabulary,
  type CourseData,
  type OfflineState,
  type TravelState,
} from '../src/index';
import type { TravelChapter, TravelMission, TravelStep } from '../src/travel-content';

test('an unfinished revision 12 order keeps its draft when the scenario is introduced', async () => {
  const packs = new URL('../../../apps/mobile/public/chapter-packs/', import.meta.url);
  const published = chapterCatalogSchema.parse(
    JSON.parse(readFileSync(new URL(CHAPTER_CATALOG_FILE, packs), 'utf8')),
  );
  const revision = published.chapters.colombia.revision;
  const load = (number: number) =>
    parseChapterPack(readFileSync(new URL(`${number}/colombia.json`, packs), 'utf8'), 'colombia');
  const previous = load(12);
  const current = load(revision);
  const previousChapter = previous.story!.chapter as unknown as TravelChapter;
  const currentChapter = current.story!.chapter as unknown as TravelChapter;
  const bundled = JSON.parse(
    readFileSync(
      new URL('../../../apps/mobile/src/content/bundled-course.json', import.meta.url),
      'utf8',
    ),
  );
  const content = { ...bundled.payload, courseVersion: bundled.manifest.version } as CourseData;
  const storage = new Map<string, string>();
  let sequence = 0;
  const createEngine = (pack: typeof previous) =>
    new OfflineEngine({
      getContent: () => content,
      getChapterCards: async (id) => (id === 'colombia' ? pack : null),
      randomId: () => `cartagena-order-upgrade-${++sequence}`,
      store: {
        getItem: async (key) => storage.get(key) ?? null,
        setItem: async (key, value) => void storage.set(key, value),
      },
    });
  const path = '/v1/travel?chapter=colombia&source=study';
  let engine = createEngine(previous);
  const request = (body?: unknown) => engine.request<TravelState>(path, body);
  const savedState = (): OfflineState => JSON.parse(storage.get(OFFLINE_STATE_KEY)!);

  async function completeStep(mission: TravelMission, travel: TravelState, step: TravelStep) {
    assert.equal(travel.active?.stepId, step.id);
    const token = travel.active!.token;
    if (step.type === 'teach') {
      for (const [index] of travelStepVocabulary(mission, step).entries())
        await request({ action: 'word', token, position: index + 1 });
    }
    if (step.type === 'exercise') {
      if (travel.active?.prerequisiteInstruction) await request({ action: 'prepare', token });
      if (step.audio) await request({ action: 'listened', token });
      const { correctOptionId, acceptedAnswers } = step.exercise;
      const checked = await request({
        action: 'answer',
        token,
        answer: correctOptionId ? { optionId: correctOptionId } : { text: acceptedAnswers[0] },
      });
      assert.equal(checked.active?.result?.outcome, 'target', step.id);
    }
    return request({ action: 'advance', token });
  }

  const orderMission = 'cartagena-order';
  const orderStep = 'cartagena-order-write';
  for (const mission of previousChapter.missions.slice(
    0,
    previousChapter.missions.findIndex(({ id }) => id === orderMission),
  )) {
    let travel = await request({ action: 'start', missionId: mission.id });
    for (const step of mission.steps) travel = await completeStep(mission, travel, step);
    assert.ok(travel.completed[mission.id]);
  }
  const oldMission = previousChapter.missions.find(({ id }) => id === orderMission)!;
  let travel = await request({ action: 'start', missionId: orderMission });
  for (const step of oldMission.steps.slice(
    0,
    oldMission.steps.findIndex(({ id }) => id === orderStep),
  ))
    travel = await completeStep(oldMission, travel, step);
  const oldToken = travel.active!.token;
  const draft = { text: "I'd like chicken with rice and" };
  travel = await request({ action: 'draft', token: oldToken, answer: draft });
  assert.deepEqual(travel.active?.answer, draft);
  assert.equal(travel.active?.scenario, undefined);
  const before = savedState();

  engine = createEngine(current);
  travel = await request();
  const mission = currentChapter.missions.find(({ id }) => id === orderMission)!;
  const firstTurn = mission.steps.findIndex(
    (step) => step.type === 'exercise' && step.scenarioTurn,
  );
  assert.ok(firstTurn >= 0);
  assert.equal(travel.active?.stepId, mission.steps[firstTurn].id);
  assert.equal(travel.active?.contentRevision, revision);
  assert.notEqual(travel.active?.token, oldToken);
  assert.deepEqual(
    travel.active?.scenario && 'lines' in travel.active.scenario
      ? travel.active.scenario.lines
      : undefined,
    [],
  );
  assert.deepEqual(travel.completed, before.chapterProgress?.colombia.travel.completed);
  assert.deepEqual(savedState().unifiedLearning.evidence, before.unifiedLearning.evidence);
  const staleAttempt = await request({ action: 'answer', token: oldToken, answer: draft });
  assert.deepEqual(staleAttempt.active, travel.active);

  const requestTurn = mission.steps.findIndex(({ id }) => id === orderStep);
  assert.ok(requestTurn > firstTurn);
  for (const step of mission.steps.slice(firstTurn, requestTurn))
    travel = await completeStep(mission, travel, step);
  assert.equal(travel.active?.stepId, orderStep);
  assert.deepEqual(travel.active?.answer, draft);
  assert.equal(travel.active?.scenario?.phase, 'menu');
  assert.deepEqual(
    travel.active?.scenario && 'lines' in travel.active.scenario
      ? travel.active.scenario.lines
      : undefined,
    [],
  );

  const requestStep = mission.steps[requestTurn];
  assert.equal(requestStep.type, 'exercise');
  const token = travel.active!.token;
  const submission = {
    action: 'answer',
    token,
    answer: { text: requestStep.exercise.acceptedAnswers[0] },
  };
  const accepted = await request(submission);
  assert.equal(accepted.active?.result?.outcome, 'target');
  assert.equal(
    accepted.active?.scenario && 'lines' in accepted.active.scenario
      ? accepted.active.scenario.lines.length
      : undefined,
    2,
  );
  assert.deepEqual((await request(submission)).active, accepted.active);
  assert.equal(savedState().unifiedLearning.evidence.filter(({ id }) => id === token).length, 1);
});
