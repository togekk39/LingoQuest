import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseChapterPack, serializeChapterPack, type ChapterPack } from '@lingoquest/course-pack';
import type { Progress } from '@lingoquest/contracts';
import {
  LocalError,
  OFFLINE_STATE_KEY,
  OfflineEngine,
  type CourseData,
  type OfflineState,
  type QuickReviewState,
  type StoryResponse,
  type TravelState,
} from '../src/index';

const content = JSON.parse(
  readFileSync(
    new URL('../../../apps/mobile/src/content/bundled-course.json', import.meta.url),
    'utf8',
  ),
).payload as CourseData;
const legacy = parseChapterPack(
  readFileSync(
    new URL('../../../apps/mobile/public/chapter-packs/7/mexico.json', import.meta.url),
    'utf8',
  ),
  'mexico',
);
const lessonId = 'u02_l01';
const requires = [{ id: 'grammar.routine_base' }];
const exerciseStep = (id: string) => ({
  id,
  type: 'exercise' as const,
  situation: 'En el mercado',
  lessonId,
  requires,
  exercise: {
    id,
    type: 'short_text' as const,
    promptEs: 'Escribe la rutina en inglés.',
    acceptedAnswers: ['I eat breakfast.'],
    feedbackEs: 'Usa I y el verbo sin -s.',
    difficulty: 1,
    skillId: 'grammar.routine_base',
    learning: {
      conceptId: 'grammar.routine_base',
      skill: 'grammar',
      evidence: 'production',
      contextId: id,
    },
  },
});
const story: NonNullable<ChapterPack['story']> = {
  chapter: {
    id: 'mexico',
    revision: 1,
    title: 'En el mercado',
    stamp: 'Un sello',
    collectible: 'Una postal',
    postcard: 'Un recuerdo del mercado',
    message: 'Visita el mercado.',
    missions: [
      {
        id: 'market',
        title: 'Una rutina',
        place: 'El mercado',
        objective: 'Explica una rutina.',
        success: 'Explicaste tu rutina.',
        minutes: [1, 2],
        vocabulary: [
          {
            term: 'eat breakfast',
            example: { en: 'I eat breakfast.', es: 'Desayuno.' },
            meaning: 'desayunar',
            kind: 'verbo',
            explanation: 'Una actividad de la mañana.',
          },
        ],
        steps: [
          {
            id: 'market-teaching',
            type: 'teach',
            title: 'La rutina',
            text: 'Usa I y el verbo sin -s.',
            examples: [{ en: 'I eat breakfast.', es: 'Desayuno.' }],
            instruction: { lessonId, stage: 'grammar', references: requires },
          },
          exerciseStep('market-answer'),
        ],
      },
    ],
  },
  adventure: {
    id: 'mexico',
    revision: 1,
    initialSceneId: 'market',
    scenes: [
      {
        id: 'market',
        art: 'cover',
        title: 'El mercado',
        description: 'En la entrada del mercado.',
        hotspots: [
          {
            id: 'begin',
            kind: 'object',
            label: 'La rutina',
            effects: [{ type: 'encounter', id: 'market-visit' }],
          },
        ],
      },
    ],
    dialogues: [{ id: 'welcome', text: 'Bienvenido.', choices: [] }],
    encounters: [{ id: 'market-visit', missionId: 'market' }],
    npcs: [],
    items: [],
    quests: [],
  },
  practice: [exerciseStep('another-market-answer')],
};

const { sha256: _digest, ...previous } = legacy;

test('a chapter adventure preserves legacy cards and validates lesson and scene references', () => {
  assert.equal(legacy.story, undefined);
  const text = serializeChapterPack({ ...previous, story });
  assert.equal(parseChapterPack(text, 'mexico').story?.chapter.id, 'mexico');
  const bad = structuredClone(story);
  bad.chapter.missions[0].steps[1].lessonId = 'missing-lesson';
  assert.throws(() =>
    parseChapterPack(serializeChapterPack({ ...previous, story: bad }), 'mexico'),
  );
  bad.chapter.missions[0].steps[1].lessonId = lessonId;
  bad.adventure.scenes[0].art = 'missing-art';
  assert.throws(() =>
    parseChapterPack(serializeChapterPack({ ...previous, story: bad }), 'mexico'),
  );
});

test('installed adventures resume separately and share taught evidence with adaptive review', async () => {
  const installed = parseChapterPack(serializeChapterPack({ ...previous, story }), 'mexico');
  let available = false;
  let count = 0;
  const store = new Map<string, string>();
  const open = () =>
    new OfflineEngine({
      store: {
        async getItem(key) {
          return store.get(key) ?? null;
        },
        async setItem(key, value) {
          store.set(key, value);
        },
      },
      getContent: () => content,
      getChapterCards: async (id) => (available && id === 'mexico' ? installed : null),
      randomId: () => `installed-adventure-${++count}`,
      clock: () => Date.parse('2026-11-25T12:00:00Z'),
    });
  const engine = open();
  const storyPath = '/v1/story?chapter=mexico';
  const travelPath = '/v1/travel?chapter=mexico&source=story';
  const reviewPath = '/v1/reviews/quick?source=unified&chapter=mexico&mission=market';
  await engine.request('/v1/travel', { action: 'country', country: 'HN' });
  const home = await engine.request<StoryResponse>('/v1/story');
  assert.equal(home.story.origin, 'Honduras');
  await assert.rejects(
    engine.request(storyPath),
    (error) => error instanceof LocalError && error.status === 404,
  );
  available = true;

  const mexico = await engine.request<StoryResponse>(storyPath);
  assert.equal(mexico.firstVisit, true);
  assert.equal(mexico.story.origin, 'Honduras');
  const activity = await engine.request<StoryResponse>(storyPath, {
    action: 'interact',
    hotspotId: 'begin',
    turn: mexico.story.turn,
  });
  assert.equal(activity.travel.active?.stepId, 'market-teaching');
  const exercise = await engine.request<TravelState>(travelPath, {
    action: 'advance',
    token: activity.travel.active!.token,
  });
  const token = exercise.active!.token;
  const answer = { text: 'I eat breakfast.' };
  const draft = await engine.request<TravelState>(travelPath, { action: 'draft', token, answer });
  assert.deepEqual(await open().request(travelPath), draft);
  const result = await open().request<TravelState>(travelPath, { action: 'answer', token, answer });
  assert.equal(result.active?.result?.correct, true);

  const review = await engine.request<QuickReviewState>(reviewPath);
  assert.equal(review.exercise.id, 'another-market-answer');
  assert.equal(review.chapterId, 'mexico');
  const reviewed = await open().request<QuickReviewState>(reviewPath, {
    action: 'answer',
    token: review.token,
    answer,
  });
  assert.equal(reviewed.result?.correct, true);
  const evidence = (JSON.parse(store.get(OFFLINE_STATE_KEY)!) as OfflineState).unifiedLearning
    .evidence;
  assert.deepEqual(
    evidence.find(({ exerciseId }) => exerciseId === 'market-teaching')?.teaches,
    requires,
  );
  for (const [id, source] of [
    [token, 'story'],
    [review.token, 'review'],
  ]) {
    const entry = evidence.find((event) => event.id === id);
    assert.equal(entry?.materialId, lessonId);
    assert.equal(entry?.source, source);
    assert.equal(entry?.independent, true);
    assert.equal(entry?.outcome, 'target');
    assert.ok(entry?.targets.some(({ targetId }) => targetId === 'grammar.routine_base'));
  }

  const completed = await engine.request<TravelState>(travelPath, { action: 'advance', token });
  assert.ok(completed.stamps.mexico);
  const progress = await engine.request<Progress>('/v1/me/progress');
  assert.deepEqual(progress.travelStamps, { mexico: completed.stamps.mexico });
  await engine.request(storyPath, { action: 'finishEncounter', turn: activity.story.turn });
  const savedStory = await engine.request(storyPath);
  const backup = await engine.request('/v1/me/export');
  await engine.request('/v1/me', undefined, 'DELETE');
  await open().request('/v1/me/import', { backup });
  assert.deepEqual(await open().request(storyPath), savedStory);
  const { firstVisit: _firstVisit, ...savedHome } = home;
  assert.deepEqual(await open().request('/v1/story'), savedHome);
});
