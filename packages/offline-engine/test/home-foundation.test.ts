import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CHAPTER_CATALOG_FILE, parseChapterPack } from '@lingoquest/course-pack';
import {
  getUnifiedMastery,
  homeContentFromPack,
  installHomeContent,
  OfflineEngine,
  type CourseData,
  type OfflineState,
  type QuickReviewState,
  type StoryResponse,
  type TravelOperation,
  type TravelState,
} from '../src/index';

const directory = new URL('../../../apps/mobile/public/chapter-packs/', import.meta.url);

test('Home names share the checkpoint, exact teaching, and archived text remediation', async () => {
  const { chapters } = JSON.parse(readFileSync(new URL(CHAPTER_CATALOG_FILE, directory), 'utf8'));
  const pack = parseChapterPack(
    readFileSync(new URL(`${chapters.home.revision}/home.json`, directory), 'utf8'),
    'home',
  );
  const home = homeContentFromPack(pack);
  assert.ok(home?.audit);
  const content: CourseData = {
    units: [],
    lessons: {},
    placementQuestions: [],
    missions: [],
    speechDrills: [],
    challengeLevels: [],
    challengePools: { grammar_rush: [], cloze_battle: [], reading_quest: [] },
  };
  const storage = new Map<string, string>();
  const now = Date.parse('2026-11-25T12:00:00Z');
  let sequence = 0;
  const open = () =>
    new OfflineEngine({
      store: {
        getItem: async (key) => storage.get(key) ?? null,
        setItem: async (key, value) => {
          storage.set(key, value);
        },
      },
      getContent: () => content,
      clock: () => now,
      randomId: () => `home-foundation-test-${++sequence}`,
    });
  const stateOf = async (engine: OfflineEngine) =>
    (await engine.request<{ state: OfflineState }>('/v1/me/export')).state;
  const targetId = 'grammar.home.letter-order';
  const missionId = 'foundation-names';
  const storyPath = '/v1/story';
  const studyPath = '/v1/travel';
  const reviewPath = `/v1/reviews/quick?source=unified&chapter=home&mission=${missionId}&target=writing%3A${targetId}`;

  try {
    installHomeContent(home);
    const engine = open();
    await engine.request(studyPath, { action: 'practiceName', name: 'Ana María López-García' });
    let travel = await engine.request<TravelState>(studyPath, { action: 'start', missionId });
    let path = studyPath;
    const move = async (operation: Omit<TravelOperation, 'token'> & { answer?: object }) => {
      travel = await engine.request<TravelState>(path, {
        ...operation,
        token: travel.active!.token,
      });
      return travel.active!;
    };
    assert.equal(travel.active?.stepId, 'foundation-names-teach');
    assert.equal((await move({ action: 'answer', answer: { optionId: 'ana' } })).result, undefined);
    assert.equal((await stateOf(engine)).unifiedLearning.evidence.length, 0);
    await move({ action: 'advance' });
    assert.equal(
      (await move({ action: 'answer', answer: { optionId: 'ana' } })).result?.correct,
      true,
    );
    await move({ action: 'advance' });
    await move({ action: 'advance' });
    assert.equal(travel.active?.stepId, 'foundation-names-order-listen');
    assert.equal((await move({ action: 'answer', answer: { optionId: 'luz' } })).result, undefined);
    await move({ action: 'transcript' });
    const supportedToken = travel.active!.token;
    assert.equal(
      (await move({ action: 'answer', answer: { optionId: 'luz' } })).result?.correct,
      true,
    );
    await move({ action: 'advance' });
    await move({ action: 'listened' });
    const writingToken = travel.active!.token;
    const answer = { text: 'U L Z' };
    await move({ action: 'draft', answer });

    let story = await engine.request<StoryResponse>(storyPath);
    story = await engine.request<StoryResponse>(storyPath, {
      action: 'interact',
      hotspotId: 'plaza-sam',
      turn: story.story.turn,
    });
    for (const choiceId of [
      'greet-sam-in-english',
      'greet-luz-in-english',
      'reply-to-luz',
      'continue-opening-with-sam',
      'open-name-foundation',
      `practice-${missionId}`,
    ]) {
      story = await engine.request<StoryResponse>(storyPath, {
        action: 'choose',
        choiceId,
        turn: story.story.turn,
      });
    }
    travel = story.travel;
    path = '/v1/travel?source=story';
    assert.equal(travel.active?.token, writingToken);
    assert.deepEqual(travel.active?.answer, answer);
    assert.equal((await move({ action: 'answer', answer })).result?.correct, true);
    await move({ action: 'advance' });
    const failed = await move({ action: 'answer', answer: { text: 'A N A G A R C I A' } });
    assert.equal(failed.result?.errorType, 'letter_order');
    await move({ action: 'retry' });
    const personal = await move({
      action: 'answer',
      answer: { text: 'A-N-A / M-A-R-I-A / L-O-P-E-Z / G-A-R-C-I-A' },
    });
    assert.equal(personal.result?.correct, true);
    await move({ action: 'advance' });
    const speakingId = travel.active!.stepId;
    assert.equal(speakingId, 'foundation-names-say');
    await engine.request('/v1/speech/practice?chapter=home', {
      id: 'foundation-recording-test',
      source: 'story',
      materialId: missionId,
      itemId: speakingId,
      retry: false,
      recording: true,
    });
    assert.equal((await move({ action: 'advance' })).finished, true);

    const state = await stateOf(engine);
    assert.equal(state.chapterProgress?.home, undefined);
    assert.ok(state.travel?.completed[missionId]);
    assert.equal(state.travel?.stamps.home, undefined);
    const receipt = state.unifiedLearning.evidence.find(
      ({ exerciseId }) => exerciseId === 'foundation-names-spell-teach',
    );
    assert.ok(receipt?.teaches?.some(({ id }) => id === targetId));
    const supported = state.unifiedLearning.evidence.find(({ id }) => id === supportedToken);
    assert.equal(supported?.outcome, 'target');
    assert.equal(supported?.independent, false);
    assert.ok(supported?.aids.includes('transcript'));
    const writing = state.unifiedLearning.evidence.find(({ id }) => id === writingToken);
    assert.equal(writing?.source, 'story');
    assert.equal(writing?.independent, true);
    const recording = state.unifiedLearning.evidence.find(
      ({ id }) => id === 'foundation-recording-test:recording',
    );
    assert.equal(recording?.activity, 'recording');
    assert.equal(recording?.independent, false);
    const archive = state.chapterReviewArchive?.home;
    assert.ok(archive?.practice.some(({ step }) => step.id === 'foundation-review-letter-order'));
    assert.ok(!JSON.stringify(archive).includes('dataBase64'));

    installHomeContent();
    const offline = open();
    const support = await offline.request<QuickReviewState>(reviewPath);
    assert.equal(support.exercise.id, 'foundation-review-letter-order-guided');
    assert.equal(support.chapterId, 'home');
    assert.equal(support.audio, undefined);
    const guided = await offline.request<QuickReviewState>(reviewPath, {
      action: 'answer',
      token: support.token,
      answer: { text: 'L U Z' },
    });
    assert.equal(guided.guidedSuccess, true);
    const confirmation = await offline.request<QuickReviewState>(reviewPath, {
      action: 'continue',
      token: support.token,
    });
    assert.equal(confirmation.exercise.id, 'foundation-review-letter-order');
    const reviewed = await offline.request<QuickReviewState>(reviewPath, {
      action: 'answer',
      token: confirmation.token,
      answer: { text: 'Z U L' },
    });
    assert.equal(reviewed.result?.correct, true);
    const final = await stateOf(offline);
    assert.deepEqual(final.chapterReviewArchive?.home, archive);
    const mastery = getUnifiedMastery(final.unifiedLearning, targetId, 'writing');
    assert.deepEqual(mastery.pendingErrors, []);
    assert.equal(mastery.transfer, 'verified');
    assert.equal(mastery.retention, 'unverified');
  } finally {
    installHomeContent();
  }
});
