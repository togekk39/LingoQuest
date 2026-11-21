import { registerHooks } from 'node:module';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import type { CourseData, HomeContent } from '../src/index';

test('Android starts with a local shell and opens the installed adventure and course', async () => {
  const resolution = registerHooks({
    resolve(specifier, context, next) {
      const path =
        specifier === './home-content' && context.parentURL?.includes('/offline-engine/src/')
          ? './home-content.native.ts'
          : specifier;
      return next(path, context);
    },
  });
  try {
    const { OfflineEngine, chapter, installHomeContent } = await import('../src/index');
    const directory = new URL('../../../apps/mobile/public/chapter-packs/', import.meta.url);
    const catalog = JSON.parse(await readFile(new URL('catalog.json', directory), 'utf8'));
    const { story, unit } = JSON.parse(
      await readFile(new URL(`${catalog.chapters.home.revision}/home.json`, directory), 'utf8'),
    );
    let snapshot: string | null = null;
    let content: CourseData = {
      units: [],
      lessons: {},
      challengePools: { grammar_rush: [], cloze_battle: [], reading_quest: [] },
      challengeLevels: [],
      placementQuestions: [],
      missions: [],
      speechDrills: [],
    };
    const engine = new OfflineEngine({
      store: {
        getItem: async () => snapshot,
        setItem: async (_key, text) => {
          snapshot = text;
        },
      },
      getContent: () => content,
    });
    assert.equal(chapter.missions.length, 0);
    await engine.initialize();
    assert.equal(
      (await engine.request<{ total: number }>('/v1/reviews/today?source=travel')).total,
      0,
    );
    await assert.rejects(engine.request('/v1/story'), /Descarga La primera postal/);
    assert.equal(JSON.parse(snapshot!).story, undefined);

    installHomeContent({ ...story, ...story.runtime } as HomeContent);
    content = {
      ...story.runtime.course,
      units: [],
      lessons: Object.fromEntries(
        unit.lessons.map((lesson: { id: string }) => [lesson.id, lesson]),
      ),
    };
    assert.equal(
      (await engine.request<{ questions: unknown[] }>('/v1/travel/placement')).questions.length,
      6,
    );
    const { story: adventure } = await engine.request<{ story: { scene: { id: string } } }>(
      '/v1/story',
    );
    assert.equal(adventure.scene.id, 'plaza');
    assert.equal((await engine.request<{ id: string }>('/v1/lessons/u01_l01')).id, 'u01_l01');
    const review = await engine.request<{ exercise: { id: string } }>(
      '/v1/reviews/quick?source=travel',
    );
    assert.equal(review.exercise.id, 'travel_quick_hello');
  } finally {
    resolution.deregister();
  }
});
