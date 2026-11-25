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
  type QuickReviewState,
  type TravelState,
} from '../src';
import { getUnifiedMastery } from '../src/learning-evidence';
import type { TravelChapter } from '../src/travel-content';

test('Cartagena checks how many in a fresh context before clearing the count question error', async () => {
  const chapterStore = new URL('../../../apps/mobile/public/chapter-packs/', import.meta.url);
  const catalog = chapterCatalogSchema.parse(
    JSON.parse(readFileSync(new URL(CHAPTER_CATALOG_FILE, chapterStore), 'utf8')),
  );
  const pack = parseChapterPack(
    readFileSync(new URL(`${catalog.chapters.colombia.revision}/colombia.json`, chapterStore), 'utf8'),
    'colombia',
  );
  const bundled = JSON.parse(
    readFileSync(new URL('../../../apps/mobile/src/content/bundled-course.json', import.meta.url), 'utf8'),
  );
  const chapter = pack.story?.chapter as unknown as TravelChapter;
  const store = new Map<string, string>();
  let sequence = 0;
  const engine = new OfflineEngine({
    getContent: () => bundled.payload as CourseData,
    getChapterCards: async (id) => (id === 'colombia' ? pack : null),
    randomId: () => `cartagena-remediation-${++sequence}`,
    clock: () => Date.UTC(2026, 10, 25, 17),
    store: {
      getItem: async (key) => store.get(key) ?? null,
      setItem: async (key, value) => void store.set(key, value),
    },
  });
  const travelPath = '/v1/travel?chapter=colombia&source=study';
  const study = (operation: unknown) => engine.request<TravelState>(travelPath, operation);
  const mastery = (id: string, dimension: 'grammar_production' | 'writing') =>
    getUnifiedMastery(
      (JSON.parse(store.get(OFFLINE_STATE_KEY)!) as OfflineState).unifiedLearning,
      id,
      dimension,
    );
  const grammar = () => mastery('grammar.cartagena.quantity', 'grammar_production');
  const count = () => mastery('pattern.cartagena.how-many', 'writing');
  for (const mission of chapter.missions.slice(0, 2)) {
    let travel = await study({ action: 'start', missionId: mission.id });
    for (const step of mission.steps) {
      assert.equal(travel.active?.stepId, step.id);
      const token = travel.active!.token;
      if (step.type === 'teach') {
        for (const [index] of travelStepVocabulary(mission, step).entries())
          await study({ action: 'word', token, position: index + 1 });
      }
      if (step.type === 'exercise') {
        if (step.audio) await study({ action: 'listened', token });
        const wrong = step.id === 'cartagena-quantity-write';
        travel = await study({
          action: 'answer',
          token,
          answer: step.exercise.correctOptionId
            ? { optionId: step.exercise.correctOptionId }
            : { text: wrong ? 'How much bottles of water?' : step.exercise.acceptedAnswers[0] },
        });
        assert.equal(travel.active?.result?.outcome, wrong ? 'incorrect' : 'target', step.id);
      }
      travel = await study({ action: 'advance', token });
    }
    assert.ok(travel.completed[mission.id]);
  }

  assert.ok(grammar().pendingErrors.includes('quantity_count_question'));
  assert.ok(count().pendingErrors.includes('quantity_count_question'));
  const path = (target: string) =>
    `/v1/reviews/quick?source=unified&chapter=colombia&target=${encodeURIComponent(target)}`;
  const countPath = path('grammar_production:grammar.cartagena.quantity');
  const guide = await engine.request<QuickReviewState>(countPath);
  assert.equal(guide.exercise.id, 'cartagena-review-quantity-question-guide');
  assert.equal(guide.remediation?.phase, 'support');
  const guided = await engine.request<QuickReviewState>(countPath, {
    action: 'answer',
    token: guide.token,
    answer: { text: 'How many apples?' },
  });
  assert.equal(guided.guidedSuccess, true);
  assert.ok(grammar().pendingErrors.includes('quantity_count_question'));

  const massPath = path('writing:pattern.cartagena.how-much-quantity');
  const mass = await engine.request<QuickReviewState>(massPath);
  assert.equal(mass.exercise.id, 'cartagena-review-quantity-question-confirm');
  const massAnswer = await engine.request<QuickReviewState>(massPath, {
    action: 'answer',
    token: mass.token,
    answer: { text: 'How much juice do we need?' },
  });
  assert.equal(massAnswer.result?.correct, true);
  assert.ok(grammar().pendingErrors.includes('quantity_count_question'));
  assert.ok(count().pendingErrors.includes('quantity_count_question'));
  assert.ok(mastery('pattern.cartagena.how-much-quantity', 'writing').independentSuccesses > 0);

  const confirmation = await engine.request<QuickReviewState>(countPath, {
    action: 'continue',
    token: guided.token,
  });
  assert.equal(confirmation.exercise.id, 'cartagena-review-quantity-count-question-confirm');
  assert.equal(confirmation.remediation?.phase, 'confirmation');
  const confirmed = await engine.request<QuickReviewState>(countPath, {
    action: 'answer',
    token: confirmation.token,
    answer: { text: 'How many cups of coffee do we need?' },
  });
  assert.equal(confirmed.result?.correct, true);
  assert.equal(grammar().pendingErrors.includes('quantity_count_question'), false);
  assert.equal(count().pendingErrors.includes('quantity_count_question'), false);
  assert.equal(count().retention, 'unverified');
});
