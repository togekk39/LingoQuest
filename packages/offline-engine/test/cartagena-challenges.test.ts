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
import { challengeLearningGate, type ChallengeType } from '../src/challenge-learning';
import { formalDefinitions } from '../src/learning-prerequisites';
import type { TravelChapter } from '../src/travel-content';

test('Cartagena normal Study activities qualify the corresponding chapter challenge questions', async () => {
  const packDir = new URL('../../../apps/mobile/public/chapter-packs/', import.meta.url);
  const catalog = chapterCatalogSchema.parse(
    JSON.parse(readFileSync(new URL(CHAPTER_CATALOG_FILE, packDir), 'utf8')),
  );
  const { revision } = catalog.chapters.colombia;
  const pack = parseChapterPack(
    readFileSync(new URL(`${revision}/colombia.json`, packDir), 'utf8'),
    'colombia',
  );
  const story = pack.story;
  assert.ok(story?.audit?.challenges && story.challenges);
  const reviews = story.audit.challenges;
  const chapter = story.chapter as unknown as TravelChapter;
  const bundled = JSON.parse(
    readFileSync(
      new URL('../../../apps/mobile/src/content/bundled-course.json', import.meta.url),
      'utf8',
    ),
  );
  const content = { ...bundled.payload, courseVersion: bundled.manifest.version } as CourseData;
  const practice = chapter.missions.flatMap(({ steps }) =>
    steps.flatMap((step) =>
      step.type === 'exercise' && step.lessonId
        ? [
            {
              lessonId: step.lessonId,
              exercise: step.exercise,
              version: `colombia:${revision}`,
              requires: step.requires,
              targets: step.targets,
            },
          ]
        : [],
    ),
  );
  const definitions = formalDefinitions(content, [], story.audit.definitions);
  const storage = new Map<string, string>();
  let sequence = 0;
  const engine = new OfflineEngine({
    getContent: () => content,
    getChapterCards: async (id) => (id === 'colombia' ? pack : null),
    randomId: () => `cartagena-challenges-${++sequence}`,
    store: {
      getItem: async (key) => storage.get(key) ?? null,
      setItem: async (key, value) => void storage.set(key, value),
    },
  });

  const path = '/v1/travel?chapter=colombia&source=study';
  const request = (body?: unknown) => engine.request<TravelState>(path, body);
  const gate = () => {
    const state: OfflineState = JSON.parse(storage.get(OFFLINE_STATE_KEY)!);
    return challengeLearningGate(state, content, practice, definitions);
  };
  const pools = Object.entries(story.challenges) as unknown as [
    ChallengeType,
    CourseData['challengePools'][ChallengeType],
  ][];
  await request();
  for (const [mode, items] of pools) {
    assert.deepEqual(
      gate()('adventure', mode, items, reviews).missingTeaching,
      items.map(({ id }) => id),
    );
  }

  for (const mission of chapter.missions.filter(({ objectiveId }) => objectiveId)) {
    let travel = await request({ action: 'start', missionId: mission.id });
    for (const step of mission.steps) {
      assert.equal(travel.active?.stepId, step.id);
      const token = travel.active!.token;
      if (step.type === 'teach') {
        for (const [index] of travelStepVocabulary(mission, step).entries())
          await request({ action: 'word', token, position: index + 1 });
      }
      if (step.type === 'exercise') {
        if (step.audio) await request({ action: 'listened', token });
        const { correctOptionId, acceptedAnswers } = step.exercise;
        travel = await request({
          action: 'answer',
          token,
          answer: correctOptionId ? { optionId: correctOptionId } : { text: acceptedAnswers[0] },
        });
        assert.equal(travel.active?.result?.outcome, 'target', step.id);
      }
      travel = await request({ action: 'advance', token });
    }
    assert.ok(travel.completed[mission.id]);
  }

  for (const [mode, items] of pools) {
    const result = gate()('adventure', mode, items, reviews);
    assert.deepEqual(result.missingTeaching, [], mode);
    assert.deepEqual(result.missingPractice, [], mode);
    assert.equal(result.ready, true, mode);
  }
});
