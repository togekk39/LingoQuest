import { registerHooks } from 'node:module';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import { CHAPTER_CATALOG_FILE } from '@lingoquest/course-pack';
import type { CourseData, HomeContent, OfflineState, StoryResponse } from '../src/index';

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
    const catalog = JSON.parse(await readFile(new URL(CHAPTER_CATALOG_FILE, directory), 'utf8'));
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

    const previous = JSON.parse(await readFile(new URL('2/home.json', directory), 'utf8')).story;
    const before = snapshot;
    installHomeContent({ ...previous, ...previous.runtime } as HomeContent);
    await assert.rejects(engine.request('/v1/story'), /Actualiza La primera postal/);
    assert.equal(snapshot, before);
    installHomeContent({ ...story, ...story.runtime } as HomeContent);
    assert.equal(
      (await engine.request<{ story: { scene: { id: string } } }>('/v1/story')).story.scene.id,
      'plaza',
    );

    const placement = await engine.request<{ placement: { correct: number } }>(
      '/v1/travel/placement',
      {
        answers: story.runtime.placement.map(({ exercise }: { exercise: { id: string } }) => ({
          answer:
            exercise.id === 'route_intro_write' ? { text: 'My name’s María-José O’Connor.' } : null,
          transcript: false,
        })),
      },
    );
    assert.equal(placement.placement.correct, 1);

    const priorHome = JSON.parse(await readFile(new URL('4/home.json', directory), 'utf8')).story;
    assert.equal(
      priorHome.adventure.encounters.find(({ id }: { id: string }) => id === 'greet-sam')
        .freshEntryStepId,
      'travel_hello_write',
    );
    snapshot = null;
    const priorContent = { ...priorHome, ...priorHome.runtime } as HomeContent;
    installHomeContent(priorContent);
    let greeting = await engine.request<StoryResponse>('/v1/story');
    greeting = await engine.request<StoryResponse>('/v1/story', {
      action: 'interact',
      hotspotId: 'plaza-sam',
      turn: greeting.story.turn,
    });
    for (const choiceId of [
      'greet-sam-in-english',
      'greet-luz-in-english',
      'reply-to-luz',
      'continue-opening-with-sam',
      'introduce-yourself',
    ]) {
      greeting = await engine.request<StoryResponse>('/v1/story', {
        action: 'choose',
        choiceId,
        turn: greeting.story.turn,
      });
    }
    assert.equal(greeting.travel.active?.stepId, 'hello_teach');

    const oldState = JSON.parse(snapshot!) as OfflineState;
    const draft = {
      ...greeting.travel.active!,
      step: priorContent.chapter.missions[0].steps.findIndex(
        ({ id }) => id === 'travel_hello_write',
      ),
      stepId: 'travel_hello_write',
      answer: { text: 'Hi! My name is' },
    };
    oldState.travel = { ...greeting.travel, active: draft };
    snapshot = JSON.stringify(oldState);
    installHomeContent({ ...story, ...story.runtime } as HomeContent);
    const restored = await engine.request<StoryResponse>('/v1/story');
    assert.deepEqual(restored.travel.active, { ...draft, contentRevision: story.chapter.revision });
  } finally {
    resolution.deregister();
  }
});
