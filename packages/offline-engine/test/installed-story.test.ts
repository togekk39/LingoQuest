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
  type TravelStep,
  type TravelState,
} from '../src/index';
import type { TravelExerciseStep } from '../src/travel-content';
import { rpgAssessmentDigest, rpgTeachingDigest } from '../src/learning-prerequisites';

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
const pattern = {
  id: 'pattern.u02_l01.habit',
  form: 'I / you + verbo base + complemento',
};
const requires = [{ id: 'grammar.routine_base' }, pattern];
const exerciseStep = (id: string) =>
  ({
    id,
    type: 'exercise' as const,
    situation: 'En el mercado',
    lessonId,
    requires,
    targets: [{ targetId: pattern.id, dimension: 'writing' }],
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
  }) satisfies TravelExerciseStep;
const teach = {
  id: 'market-teaching',
  type: 'teach',
  title: 'La rutina',
  text: 'Usa I y el verbo sin -s.',
  examples: [{ en: 'I eat breakfast.', es: 'Desayuno.' }],
  vocabularyTerms: [],
  instruction: { lessonId, stage: 'grammar', references: requires },
} satisfies Extract<TravelStep, { type: 'teach' }>;
const marketExercise = exerciseStep('market-answer');
const reviewExercise = exerciseStep('another-market-answer');
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
        steps: [teach, marketExercise],
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
  practice: [reviewExercise],
  audit: {
    definitions: [],
    teaching: { [teach.id]: rpgTeachingDigest(teach, []) },
    assessments: {
      [marketExercise.id]: rpgAssessmentDigest(marketExercise),
      [reviewExercise.id]: rpgAssessmentDigest(reviewExercise),
    },
  },
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

function device(adventure = story, revision = 9) {
  const install = (value: typeof story, version: number) =>
    parseChapterPack(
      serializeChapterPack({ ...previous, revision: version, story: value }),
      'mexico',
    );
  let installed = install(adventure, revision);
  let available = true;
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
  return {
    open,
    install(value: typeof story, version: number) {
      installed = install(value, version);
    },
    enable(value: boolean) {
      available = value;
    },
    state: () => JSON.parse(store.get(OFFLINE_STATE_KEY)!) as OfflineState,
    save: (state: OfflineState) => store.set(OFFLINE_STATE_KEY, JSON.stringify(state)),
  };
}

const storyPath = '/v1/story?chapter=mexico';
const travelPath = '/v1/travel?chapter=mexico&source=story';
const reviewPath = '/v1/reviews/quick?source=unified&chapter=mexico&mission=market';

test('installed adventures resume separately and share precise writing evidence with adaptive review', async () => {
  const { open, enable, state } = device();
  enable(false);
  const engine = open();
  await engine.request('/v1/travel', { action: 'country', country: 'HN' });
  const home = await engine.request<StoryResponse>('/v1/story');
  assert.equal(home.story.origin, 'Honduras');
  await assert.rejects(
    engine.request(storyPath),
    (error) => error instanceof LocalError && error.status === 404,
  );
  enable(true);

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
  const evidence = state().unifiedLearning.evidence;
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
    assert.deepEqual(entry?.targets, [{ targetId: pattern.id, dimension: 'writing' }]);
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

test('edited teaching and broad old receipts cannot unlock a graded item', async () => {
  const changed = structuredClone(story);
  changed.chapter.missions[0].steps[0].text = 'Todo listo.';
  changed.chapter.missions[0].steps[0].examples = [];
  const storage = device(changed);
  const engine = storage.open();
  const entry = await engine.request<StoryResponse>(storyPath);
  const activity = await engine.request<StoryResponse>(storyPath, {
    action: 'interact',
    hotspotId: 'begin',
    turn: entry.story.turn,
  });
  const saved = storage.state();
  saved.unifiedLearning.evidence.push({
    id: `mexico:${activity.travel.active!.token}:market-teaching`,
    source: 'story',
    materialId: lessonId,
    exerciseId: 'market-teaching',
    materialVersion: 'mexico:8',
    timestamp: 1,
    contextId: 'market',
    format: 'instruction',
    activity: 'introduced',
    aids: ['guided'],
    retry: false,
    independent: false,
    targets: [],
    teaches: requires,
  });
  storage.save(saved);
  const paused = await engine.request<TravelState>(travelPath, {
    action: 'advance',
    token: activity.travel.active!.token,
  });
  const token = paused.active!.token;
  assert.equal(paused.active?.prerequisiteInstruction?.sections.length, requires.length);
  const answer = { text: 'I eat breakfast.' };
  const blocked = await storage.open().request<TravelState>(travelPath, {
    action: 'answer',
    token,
    answer,
  });
  assert.ok(blocked.active?.prerequisiteInstruction);
  assert.equal(blocked.active?.result, undefined);
  assert.equal(storage.state().attempts[token], undefined);
  const ready = await storage.open().request<TravelState>(travelPath, { action: 'prepare', token });
  assert.equal(ready.active?.prerequisiteInstruction, undefined);
  assert.equal(ready.active?.prerequisitePrepared, true);
  await storage.open().request<TravelState>(travelPath, { action: 'answer', token, answer });
  const evidence = storage.state().unifiedLearning.evidence;
  const response = evidence.find((event) => event.id === token);
  assert.ok(response);
  assert.ok(response.aids.includes('guided'));
  assert.equal(response.independent, false);
  assert.equal(response.outcome, 'target');
  assert.ok(evidence.some((event) => event.id === `rpg-instruction:mexico:${token}:prepare`));
});

test('one reviewed sense of a word cannot unlock assessment of a different sense', async () => {
  const changed = structuredClone(story);
  const openState = { id: 'lex.market.open.state', form: 'open' };
  const openAction = { id: 'lex.market.open.action', form: 'open' };
  const taughtWord = {
    term: 'open',
    meaning: 'abierto al público',
    kind: 'adjetivo',
    explanation: 'Indica el estado del mercado.',
    example: { en: 'The market is open.', es: 'El mercado está abierto.' },
    teaches: [openState],
  };
  const annotatedTeach = {
    ...teach,
    vocabularyTerms: ['open'],
    instruction: { ...teach.instruction, stage: 'both' as const },
  };
  const assessed = {
    ...marketExercise,
    requires: [openAction],
    targets: [{ targetId: openAction.id, dimension: 'vocabulary_recall' as const }],
  };
  const mission = changed.chapter.missions[0];
  mission.vocabulary = [taughtWord];
  mission.steps = [annotatedTeach, assessed];
  changed.audit!.teaching[teach.id] = rpgTeachingDigest(annotatedTeach, [taughtWord]);
  changed.audit!.assessments[assessed.id] = rpgAssessmentDigest(assessed);
  changed.audit!.definitions = [
    {
      kind: 'lexical',
      id: openState.id,
      forms: [openState.form],
      labelEs: taughtWord.meaning,
      examples: [taughtWord.example],
    },
    {
      kind: 'lexical',
      id: openAction.id,
      forms: [openAction.form],
      labelEs: 'abrir un establecimiento',
      examples: [{ en: 'They open the market at eight.', es: 'Abren el mercado a las ocho.' }],
    },
  ];
  const { open, state } = device(changed);
  const engine = open();
  const entry = await engine.request<StoryResponse>(storyPath);
  const activity = await engine.request<StoryResponse>(storyPath, {
    action: 'interact',
    hotspotId: 'begin',
    turn: entry.story.turn,
  });
  const token = activity.travel.active!.token;
  const skippedWord = await engine.request<TravelState>(travelPath, { action: 'advance', token });
  assert.equal(skippedWord.active?.stepId, teach.id);
  await engine.request(travelPath, { action: 'word', token, position: 1 });
  const blocked = await engine.request<TravelState>(travelPath, { action: 'advance', token });
  assert.match(blocked.active?.prerequisiteInstruction?.sections[0].title ?? '', /abrir/);
  const receipt = state().unifiedLearning.evidence.find((event) => event.id.includes(':word:'));
  assert.deepEqual(receipt?.teaches, [openState]);
});

test('an assessment cannot claim an untaught sense or unknown form despite matching item digest', async () => {
  for (const reference of [
    { id: 'lex.market.breakfast.sense', form: 'eat breakfast' },
    { ...pattern, form: 'I / you + verbo con -s' },
  ]) {
    const changed = structuredClone(story);
    const step = structuredClone(marketExercise);
    step.requires = [reference];
    step.targets = [{ targetId: reference.id, dimension: 'writing' }];
    changed.chapter.missions[0].steps[1] = step;
    changed.audit!.assessments[step.id] = rpgAssessmentDigest(step);
    const { open } = device(changed);
    const engine = open();
    const entry = await engine.request<StoryResponse>(storyPath);
    const started = await engine.request<StoryResponse>(storyPath, {
      action: 'interact',
      hotspotId: 'begin',
      turn: entry.story.turn,
    });
    const blocked = await engine.request<TravelState>(travelPath, {
      action: 'advance',
      token: started.travel.active!.token,
    });
    assert.equal(blocked.active?.prerequisiteUnavailable, true);
    const after = await open().request<TravelState>(travelPath, {
      action: 'prepare',
      token: blocked.active!.token,
    });
    assert.equal(after.active?.prerequisiteUnavailable, true);
  }
});

test('an old offline pack preserves its draft and the updated package teaches before resuming', async () => {
  const old = structuredClone(story);
  delete old.audit;
  const storage = device(old, 8);
  const engine = storage.open();
  const entry = await engine.request<StoryResponse>(storyPath);
  const started = await engine.request<StoryResponse>(storyPath, {
    action: 'interact',
    hotspotId: 'begin',
    turn: entry.story.turn,
  });
  const blocked = await engine.request<TravelState>(travelPath, {
    action: 'advance',
    token: started.travel.active!.token,
  });
  assert.equal(blocked.active?.prerequisiteUpdateRequired, true);
  const saved = storage.state();
  const draft = { text: 'I eat breakfast.' };
  saved.chapterProgress!.mexico.travel.active!.answer = draft;
  storage.save(saved);
  const token = blocked.active!.token;
  const oldPack = await storage.open().request<TravelState>(travelPath, {
    action: 'answer',
    token,
    answer: draft,
  });
  assert.deepEqual(oldPack.active?.answer, draft);
  assert.equal(oldPack.active?.prerequisiteUpdateRequired, true);
  assert.equal(oldPack.active?.result, undefined);

  const current = structuredClone(story);
  current.chapter.revision++;
  storage.install(current, 9);
  const upgraded = await storage.open().request<TravelState>(travelPath);
  assert.deepEqual(upgraded.active?.answer, draft);
  assert.equal(upgraded.active?.token, token);
  assert.equal(upgraded.active?.prerequisiteUpdateRequired, undefined);
  assert.ok(upgraded.active?.prerequisiteInstruction);
});
