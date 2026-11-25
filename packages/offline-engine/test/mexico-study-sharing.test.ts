import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CHAPTER_CATALOG_FILE,
  chapterCatalogSchema,
  parseChapterPack,
} from '@lingoquest/course-pack';
import { chapter, OFFLINE_STATE_KEY, OfflineEngine, travelStepVocabulary } from '../src/index';
import type {
  CourseData,
  LessonCheckpoint,
  OfflineState,
  QuickReviewState,
  StoryResponse,
  StudyLearningStatus,
  TravelState,
} from '../src/index';
import { getUnifiedMastery } from '../src/learning-evidence';
import type { TravelChapter } from '../src/travel-content';

const root = new URL('../../../apps/mobile/public/chapter-packs/', import.meta.url);
const catalog = chapterCatalogSchema.parse(
  JSON.parse(readFileSync(new URL(CHAPTER_CATALOG_FILE, root), 'utf8')),
);
const pack = parseChapterPack(
  readFileSync(new URL(`${catalog.chapters.mexico.revision}/mexico.json`, root), 'utf8'),
  'mexico',
);
const lessonId = 'u02_l01';
const writingId = 'u02_l01_practice_4';
const pattern = 'pattern.u02_l01.habit';
const lessonPath = `/v1/lessons/${lessonId}`;
const storyPath = '/v1/story?chapter=mexico';
const travelPath = '/v1/travel?chapter=mexico&source=story';

test('Mexico Story and Study share exact writing evidence, review and skipping without claiming retention', async () => {
  const saved = new Map<string, string>();
  const bundled = JSON.parse(
    readFileSync(
      new URL('../../../apps/mobile/src/content/bundled-course.json', import.meta.url),
      'utf8',
    ),
  );
  const content = { ...bundled.payload, courseVersion: bundled.manifest.version } as CourseData;
  const lesson = content.lessons[lessonId];
  let time = Date.parse('2026-11-25T12:00:00Z');
  let count = 0;
  const engine = new OfflineEngine({
    getContent: () => content,
    getChapterCards: async (id) => (id === 'mexico' ? pack : null),
    randomId: () => `shared-study-${++count}`,
    clock: () => time,
    store: {
      getItem: async (key) => saved.get(key) ?? null,
      setItem: async (key, value) => {
        saved.set(key, value);
      },
    },
  });
  const state = (): OfflineState => JSON.parse(saved.get(OFFLINE_STATE_KEY)!);
  const writing = () => getUnifiedMastery(state().unifiedLearning, pattern, 'writing');
  const activityId = 'mexico-sharing-study';
  const checkpoint = (changes: Partial<LessonCheckpoint>): LessonCheckpoint => ({
    activityId,
    eventId: `study-sharing-${++count}`,
    stage: 0,
    exercise: -1,
    vocabulary: 0,
    answer: {},
    help: false,
    hint: false,
    xp: 0,
    weak: [],
    reviewAt: null,
    ...changes,
  });
  for (const [vocabulary] of (lesson.vocabulary ?? []).entries())
    await engine.request(`${lessonPath}/checkpoint`, checkpoint({ stage: 1, vocabulary }));
  await engine.request(`${lessonPath}/checkpoint`, checkpoint({ stage: 2 }));
  const answer = { text: 'Every day I study English.' };
  const attempt = checkpoint({ stage: 4, exercise: 3, answer });
  await engine.request(`${lessonPath}/checkpoint`, attempt);
  await engine.request('/v1/attempts', {
    clientAttemptId: attempt.eventId,
    lessonId,
    exerciseId: writingId,
    answer,
    checkpoint: attempt,
    hintUsed: false,
  });
  assert.equal(writing().independentSuccesses, 1);
  assert.ok(
    !(
      await engine.request<StudyLearningStatus>(`${lessonPath}/learning`)
    ).skippableExerciseIds.includes(writingId),
  );

  const choose = async (response: StoryResponse, choiceId: string) =>
    engine.request<StoryResponse>(storyPath, {
      action: 'choose',
      choiceId,
      turn: response.story.turn,
    });
  const home = await engine.request<StoryResponse>('/v1/story');
  const mexico = await engine.request<StoryResponse>(storyPath);
  const greeting = await engine.request<StoryResponse>(storyPath, {
    action: 'interact',
    hotspotId: 'mexico-ines-welcome',
    turn: mexico.story.turn,
  });
  const agenda = await choose(greeting, 'mexico-agenda-intro-choice');
  let { travel } = await choose(agenda, 'mexico-start-routine');
  const mission = (pack.story?.chapter as unknown as TravelChapter).missions[0];
  const advance = (token: string) =>
    engine.request<TravelState>(travelPath, { action: 'advance', token });
  for (const step of mission.steps) {
    const { active } = travel;
    assert.equal(active?.stepId, step.id);
    const token = active!.token;
    if (step.type === 'teach') {
      for (const [index] of travelStepVocabulary(mission, step).entries())
        await engine.request(travelPath, { action: 'word', token, position: index + 1 });
    }
    if (step.type === 'exercise') {
      if (step.audio) await engine.request(travelPath, { action: 'listened', token });
      const response = step.exercise.correctOptionId
        ? { optionId: step.exercise.correctOptionId }
        : { text: step.exercise.acceptedAnswers[0] };
      assert.ok(response.optionId || response.text, step.id);
      travel = await engine.request<TravelState>(travelPath, {
        action: 'answer',
        token,
        answer: response,
      });
      assert.equal(
        travel.active?.result?.outcome,
        step.exercise.ungradable ? 'ungradable' : 'target',
        step.id,
      );
      if (step.id === 'mexico-routine-write') break;
    }
    travel = await advance(token);
  }

  const event = state().unifiedLearning.evidence.find(
    ({ exerciseId }) => exerciseId === 'mexico-routine-write',
  );
  assert.equal(event?.independent, true);
  assert.ok(
    event?.targets.some(
      ({ targetId, dimension }) => targetId === pattern && dimension === 'writing',
    ),
  );
  assert.ok(!event?.targets.some(({ dimension }) => dimension.startsWith('vocabulary_')));
  assert.equal(writing().independentSuccesses, 2);
  assert.equal(writing().delayedSuccesses, 0);
  const summary = await engine.request<StudyLearningStatus>(`${lessonPath}/learning`);
  assert.ok(summary.abilities.find(({ dimension }) => dimension === 'writing')?.masteredTargets);
  assert.ok(summary.skippableExerciseIds.includes(writingId));
  assert.ok(!state().completedLessons.includes('u01_l04'));
  const skip = checkpoint({ stage: 4, exercise: 3 });
  await engine.request(`${lessonPath}/checkpoint`, skip);
  const skipped = await engine.request<{ saved: LessonCheckpoint }>(`${lessonPath}/study-events`, {
    action: 'skip',
    eventId: skip.eventId,
  });
  assert.deepEqual(skipped.saved.skipped, [writingId]);

  time += 2 * 86_400_000;
  const review = await engine.request<QuickReviewState>(
    '/v1/reviews/quick?source=unified&chapter=mexico&mission=mexico-routine',
  );
  assert.ok(
    pack.story?.practice.some(
      (step) => step && typeof step === 'object' && 'id' in step && step.id === review.exercise.id,
    ),
  );
  assert.notEqual(review.exercise.id, 'mexico-routine-write');
  assert.equal(writing().delayedSuccesses, 0);
  assert.equal(
    (await engine.request<StoryResponse>('/v1/story')).story.scene.id,
    home.story.scene.id,
  );
  assert.ok(state().story?.storyId === chapter.id);
});
