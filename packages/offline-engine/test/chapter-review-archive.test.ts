import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseChapterPack, type ChapterPack } from '@lingoquest/course-pack';
import {
  getUnifiedMastery,
  LocalError,
  OFFLINE_STATE_KEY,
  OfflineEngine,
  type CourseData,
  type OfflineState,
  type QuickReviewState,
  type TravelState,
  type UnifiedReviewRow,
} from '../src/index';
import { rpgAssessmentDigest, rpgTeachingDigest } from '../src/learning-prerequisites';
import type { TravelExerciseStep, TravelStep } from '../src/travel-content';

const legacy = parseChapterPack(
  readFileSync(
    new URL('../../../apps/mobile/public/chapter-packs/7/mexico.json', import.meta.url),
    'utf8',
  ),
  'mexico',
);
const emptyCourse: CourseData = {
  units: [],
  lessons: {},
  challengePools: { grammar_rush: [], cloze_battle: [], reading_quest: [] },
  challengeLevels: [],
  placementQuestions: [],
  missions: [],
  speechDrills: [],
};
const lessonId = 'u02_l01';
const targetId = 'pattern.mexico.archive-test';
const reference = { id: targetId, form: 'opens at' };
const example = { en: 'It opens at eight.', es: 'Abre a las ocho.' };
const teaching = {
  id: 'archive-teaching',
  type: 'teach',
  title: 'La hora de apertura',
  text: 'Usa opens at antes de la hora de apertura.',
  examples: [example],
  vocabularyTerms: [],
  instruction: { lessonId, stage: 'grammar', references: [reference] },
} satisfies Extract<TravelStep, { type: 'teach' }>;

function item(id: string, hour: string, { guided = false, listening = false } = {}) {
  const phrase = `It opens at ${hour}.`;
  return {
    id,
    type: 'exercise',
    lessonId,
    situation: guided ? 'Recuerda: it opens at.' : 'Confirma el horario.',
    requires: [reference],
    targets: [{ targetId, dimension: listening ? 'listening' : 'writing' }],
    ...(listening && { audio: phrase, transcript: phrase }),
    exercise: {
      id,
      type: 'short_text',
      promptEs: 'Escribe el horario en inglés.',
      acceptedAnswers: [listening ? hour : phrase],
      feedbackEs: 'Agrega -s al verbo con it.',
      difficulty: 1,
      skillId: targetId,
      learning: {
        conceptId: targetId,
        skill: listening ? 'listening' : 'grammar',
        contextId: id,
        evidence: 'transfer',
        ...(guided && { guided: true }),
        errors: ['third_person'],
        remediates: ['third_person'],
      },
    },
  } satisfies TravelExerciseStep;
}

const writing = item('archive-story-writing', 'eight');
const guided = item('archive-guided-writing', 'nine', { guided: true });
const independent = item('archive-independent-writing', 'ten');
const listening = item('archive-story-audio', 'five', { listening: true });
const reviewAudio = item('archive-review-audio', 'six', { listening: true });
const pack: ChapterPack = {
  ...legacy,
  story: {
    chapter: {
      id: 'mexico',
      revision: 1,
      title: 'El horario',
      stamp: 'El horario',
      postcard: 'El horario',
      message: 'El horario del mercado.',
      collectible: 'Una postal',
      missions: [
        {
          id: 'market',
          title: 'El horario del mercado',
          place: 'El mercado',
          objective: 'Compara las horas de apertura.',
          success: 'Confirmaste el horario.',
          minutes: [1, 2],
          vocabulary: [{ term: 'opens', example }],
          steps: [teaching, writing, listening],
        },
      ],
    },
    adventure: {
      id: 'mexico',
      revision: 1,
      initialSceneId: 'market',
      scenes: [{ id: 'market', art: 'cover', hotspots: [] }],
      dialogues: [{ id: 'welcome', choices: [] }],
      encounters: [],
      npcs: [],
      quests: [],
      items: [],
    },
    practice: [guided, independent, reviewAudio],
    audit: {
      definitions: [
        {
          id: targetId,
          kind: 'pattern',
          labelEs: 'Hora de apertura',
          forms: ['opens at'],
          examples: [example],
        },
      ],
      teaching: { [teaching.id]: rpgTeachingDigest(teaching, []) },
      assessments: Object.fromEntries(
        [writing, listening, guided, independent, reviewAudio].map((step) => [
          step.id,
          rpgAssessmentDigest(step),
        ]),
      ),
    },
  },
};

test('completed RPG review remains available offline with exact feedback, remediation, and backup', async () => {
  const now = Date.parse('2026-11-25T12:00:00Z');
  let time = now;
  let installed = true;
  let sequence = 0;
  const storage = new Map<string, string>();
  const open = () =>
    new OfflineEngine({
      store: {
        async getItem(key) {
          return storage.get(key) ?? null;
        },
        async setItem(key, value) {
          storage.set(key, value);
        },
      },
      getContent: () => emptyCourse,
      getChapterCards: async (id) => (id === 'mexico' && installed ? pack : null),
      clock: () => time,
      randomId: () => `archive-test-${++sequence}`,
    });
  const engine = open();
  const state = () => JSON.parse(storage.get(OFFLINE_STATE_KEY)!) as OfflineState;
  const travelPath = '/v1/travel?chapter=mexico&source=story';
  const chapterReviewPath = '/v1/reviews/quick?source=unified&chapter=mexico&mission=market';
  const targetQuery = (dimension: 'writing' | 'listening') =>
    `&target=${encodeURIComponent(`${dimension}:${targetId}`)}`;
  const homeReviewPath = '/v1/reviews/quick?source=unified&mission=hello';
  const home = await engine.request<QuickReviewState>(homeReviewPath);
  assert.equal(home.lessonId, 'travel_home');

  let travel = await engine.request<TravelState>(travelPath, {
    action: 'start',
    missionId: 'market',
  });
  const move = (action: string, answer?: { text: string }) =>
    engine.request<TravelState>(travelPath, {
      action,
      token: travel.active!.token,
      ...(answer && { answer }),
    });
  await move('advance').then((next) => (travel = next));
  assert.equal(travel.active?.stepId, writing.id);
  const incorrect = await move('answer', { text: 'It open at eight.' });
  assert.equal(incorrect.active?.result?.errorType, 'third_person');
  await move('advance').then((next) => (travel = next));
  assert.equal(travel.active?.stepId, listening.id);
  await move('listened');
  assert.equal((await move('answer', { text: 'five' })).active?.result?.correct, true);
  await move('advance').then((next) => (travel = next));
  assert.ok(travel.stamps.mexico);

  const archive = state().chapterReviewArchive?.mexico;
  assert.equal(archive?.version, `mexico:${pack.revision}`);
  assert.deepEqual(
    archive?.practice.map(({ step }) => step.id),
    [guided.id, independent.id],
  );
  assert.deepEqual(archive?.definitions[0].examples, [example]);
  assert.ok(!JSON.stringify(archive).includes('dataBase64'));
  assert.ok(!JSON.stringify(archive).includes(reviewAudio.audio!));
  const listeningBefore = getUnifiedMastery(state().unifiedLearning, targetId, 'listening');
  assert.equal(listeningBefore.independentSuccesses, 1);
  const listeningPath = chapterReviewPath + targetQuery('listening');
  const audio = await engine.request<QuickReviewState>(listeningPath);
  assert.equal(audio.exercise.id, reviewAudio.id);
  await engine.request(listeningPath, { action: 'transcript', token: audio.token });
  await engine.request(listeningPath, {
    action: 'answer',
    token: audio.token,
    answer: { text: 'six' },
  });
  const transcriptEvidence = state().unifiedLearning.evidence.find(({ id }) => id === audio.token);
  assert.equal(transcriptEvidence?.outcome, 'ungradable');

  installed = false;
  const offline = open();
  assert.equal((await offline.request<QuickReviewState>(homeReviewPath)).token, home.token);
  const rows = await offline.request<{ reviews: UnifiedReviewRow[] }>(
    '/v1/reviews/today?source=unified&all=true',
  );
  assert.equal(rows.reviews.find(({ key }) => key === `listening:${targetId}`)?.canPractice, false);
  await assert.rejects(
    offline.request(listeningPath),
    (error) => error instanceof LocalError && error.status === 404,
  );

  const textPath = chapterReviewPath + targetQuery('writing');
  const support = await offline.request<QuickReviewState>(textPath);
  assert.equal(support.exercise.id, guided.id);
  assert.equal(support.chapterId, 'mexico');
  assert.equal(support.remediation?.phase, 'support');
  const answer = { text: 'It opens at nine.' };
  await offline.request(textPath, { action: 'draft', token: support.token, answer });
  const backup = await offline.request<{ state: OfflineState }>('/v1/me/export');
  await offline.request('/v1/me', undefined, 'DELETE');
  const restored = open();
  await restored.request('/v1/me/import', { backup });
  assert.deepEqual(state().chapterReviewArchive?.mexico, archive);
  assert.deepEqual(state().unifiedLearning, backup.state.unifiedLearning);
  assert.equal((await restored.request<QuickReviewState>(homeReviewPath)).token, home.token);
  const reloaded = await restored.request<QuickReviewState>(textPath);
  assert.equal(reloaded.token, support.token);
  assert.deepEqual(reloaded.answer, answer);
  const feedback = await restored.request<QuickReviewState>(textPath, {
    action: 'answer',
    token: support.token,
    answer,
  });
  assert.equal(feedback.guidedSuccess, true);
  const confirmation = await restored.request<QuickReviewState>(textPath, {
    action: 'continue',
    token: support.token,
  });
  assert.equal(confirmation.exercise.id, independent.id);
  assert.equal(confirmation.remediation?.phase, 'confirmation');
  time += 86_400_000;
  const result = await restored.request<QuickReviewState>(textPath, {
    action: 'answer',
    token: confirmation.token,
    answer: { text: 'It opens at ten.' },
  });
  assert.equal(result.result?.correct, true);
  const evidence = state().unifiedLearning.evidence.find(({ id }) => id === confirmation.token);
  assert.equal(evidence?.materialVersion, archive?.version);
  assert.equal(evidence?.independent, true);
  assert.deepEqual(evidence?.targets, [{ targetId, dimension: 'writing' }]);
  assert.deepEqual(
    getUnifiedMastery(state().unifiedLearning, targetId, 'writing').pendingErrors,
    [],
  );
  assert.deepEqual(
    getUnifiedMastery(state().unifiedLearning, targetId, 'listening'),
    listeningBefore,
  );

  const olderTeaching = structuredClone(backup);
  olderTeaching.state.unifiedLearning.evidence =
    olderTeaching.state.unifiedLearning.evidence.filter(
      ({ exerciseId }) => exerciseId !== teaching.id,
    );
  await restored.request('/v1/me/import', { backup: olderTeaching });
  const review = await restored.request<QuickReviewState>(textPath);
  assert.deepEqual(review.prerequisiteInstruction?.sections, [
    { title: 'opens at · Hora de apertura', examples: [example] },
  ]);
  const blocked = await restored.request<QuickReviewState>(textPath, {
    action: 'answer',
    token: review.token,
    answer,
  });
  assert.equal(blocked.result, undefined);
  await restored.request(textPath, { action: 'prepare', token: review.token });
  const preparation = state().unifiedLearning.evidence.find(
    ({ id }) => id === `review-teaching:${review.token}`,
  );
  assert.deepEqual(preparation?.teaches, [reference]);
  assert.deepEqual(preparation?.targets, [{ targetId, dimension: 'grammar_understanding' }]);
  assert.equal(preparation?.materialVersion, archive?.version);
});
