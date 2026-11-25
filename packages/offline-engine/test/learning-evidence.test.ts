import assert from 'node:assert/strict';
import test from 'node:test';
import { lessons, speechDrills } from '../../../apps/api/src/content.ts';
import {
  emptyUnifiedLearning,
  getUnifiedMastery,
  rankUnifiedReviewCandidates,
  recordUnifiedEvidence,
  unifiedLearningSchema,
  unifiedReviewQueue,
  type LearningEvidence,
  type UnifiedLearningState,
} from '../src/learning-evidence.ts';
import {
  buildLearningRegistry,
  canonicalLearningId,
  chapterCardEvidenceTargets,
  exerciseEvidenceTargets,
  homeTeachingEvidenceTargets,
  legacyEvidenceTarget,
} from '../src/learning-registry.ts';
import { travelLesson } from '../src/travel-content.ts';

const start = Date.parse('2026-11-25T08:00:00Z');
const day = 86_400_000;
const writing = { targetId: 'home.introduce', dimension: 'writing' } as const;
const mastery = (state: UnifiedLearningState) =>
  getUnifiedMastery(state, writing.targetId, writing.dimension);

function answer(id: string, overrides: Partial<LearningEvidence> = {}): LearningEvidence {
  return {
    id,
    timestamp: start,
    activity: 'answer',
    source: 'story',
    materialId: travelLesson.id,
    materialVersion: 'home:7',
    exerciseId: id,
    contextId: 'welcome-desk',
    format: 'short_text',
    outcome: 'target',
    aids: [],
    retry: false,
    independent: true,
    targets: [writing],
    ...overrides,
  };
}

test('reviewed Story and Study assessments use the same narrowly scoped objective', () => {
  const story = travelLesson.exercises.find(({ id }) => id === 'travel_hello_write')!;
  const study = lessons.u01_l01.exercises.find(({ id }) => id === 'u01_l01_practice_4')!;
  assert.deepEqual(exerciseEvidenceTargets(story, travelLesson.id), [writing]);
  assert.deepEqual(exerciseEvidenceTargets(study, 'u01_l01'), [writing]);
  assert.equal(canonicalLearningId('pattern.u01_l01.name'), writing.targetId);
  assert.deepEqual(legacyEvidenceTarget('u01_l01_v02', 'vocabulary_recall'), {
    targetId: 'lex.u01_l01_v02',
    dimension: 'vocabulary_recall',
  });
  const listening = travelLesson.exercises.find(({ id }) => id === 'travel_hello_recognize')!;
  assert.deepEqual(exerciseEvidenceTargets(listening, travelLesson.id), [
    { targetId: 'lex.u01_l01_v02', dimension: 'listening' },
    {
      targetId: 'home.greeting-word',
      dimension: 'listening',
    },
  ]);
  assert.ok(
    homeTeachingEvidenceTargets('hello_teach', 'My name is').some(
      (target) => target.targetId === writing.targetId,
    ),
  );
  assert.ok(
    homeTeachingEvidenceTargets('hello_teach', 'Hi').every(
      (target) => target.targetId !== writing.targetId,
    ),
  );
});

test('hi and hello share a greeting objective while keeping exact lexical evidence separate', () => {
  const study = lessons.u01_l01.exercises.find(({ id }) => id === 'u01_l01_practice_3')!;
  const story = travelLesson.exercises.find(({ id }) => id === 'travel_hello_recall')!;
  const hello = { targetId: 'lex.u01_l01_v01', dimension: 'vocabulary_recall' };
  const hi = { targetId: 'lex.u01_l01_v02', dimension: 'vocabulary_recall' };
  const greeting = { targetId: 'home.greeting-word', dimension: 'vocabulary_recall' };
  assert.deepEqual(exerciseEvidenceTargets(study, 'u01_l01'), [hello, greeting]);
  assert.deepEqual(exerciseEvidenceTargets(story, travelLesson.id, { text: 'Hi there!' }), [
    hi,
    greeting,
  ]);
  assert.deepEqual(exerciseEvidenceTargets(story, travelLesson.id, { text: 'Hey!' }), [greeting]);
});

test('the canonical registry covers the published course and travel prerequisites', () => {
  const registry = buildLearningRegistry({ lessons, speechDrills });
  for (const { id, exercises, grammar } of Object.values(lessons)) {
    if (grammar) assert.ok(registry.has(grammar.skillId), grammar.skillId);
    for (const exercise of exercises) {
      const targets = exerciseEvidenceTargets(exercise, id);
      assert.ok(targets.length > 0, exercise.id);
      for (const { targetId } of targets) assert.ok(registry.has(targetId), targetId);
    }
  }
  assert.deepEqual(registry.get('lex.see.vision')?.forms, ['see', 'saw', 'seen']);
  assert.ok(registry.has('published.mexico.card-1.grammar.questions'));
  assert.ok(registry.has('speech.short_long_vowels'));
  assert.deepEqual(chapterCardEvidenceTargets('home', 1, 'vocabulary', 'bus stop'), [
    {
      targetId: 'home.stop',
      dimension: 'vocabulary_recognition',
    },
  ]);
  assert.ok(
    chapterCardEvidenceTargets('mexico', 1, 'question').every(
      ({ dimension }) => dimension === 'reading',
    ),
  );
});

test('stages distinguish exposure, support, distinct independent answers, retention, and transfer', () => {
  const state = emptyUnifiedLearning();
  assert.equal(mastery(state).state, 'not_introduced');
  recordUnifiedEvidence(state, answer('intro', { activity: 'introduced', outcome: undefined }));
  assert.equal(mastery(state).state, 'introduced');
  recordUnifiedEvidence(state, answer('assisted', { aids: ['hint'] }));
  assert.equal(mastery(state).state, 'guided_practice');
  recordUnifiedEvidence(state, answer('first'));
  assert.equal(mastery(state).state, 'independent_performance');
  recordUnifiedEvidence(state, answer('second', { source: 'study', contextId: 'study-form' }));
  assert.equal(mastery(state).state, 'demonstrated');
  assert.equal(getUnifiedMastery(state, writing.targetId, 'speaking').state, 'not_introduced');
  assert.equal(getUnifiedMastery(state, writing.targetId, 'listening').state, 'not_introduced');
  assert.equal(unifiedReviewQueue(state, start + day)[0].needsReview, true);
  recordUnifiedEvidence(
    state,
    answer('delay', { source: 'review', timestamp: start + day, exerciseId: 'first' }),
  );
  assert.equal(mastery(state).state, 'retained');
  assert.equal(mastery(state).nextReviewAt, new Date(start + day * 4).toISOString());
  recordUnifiedEvidence(
    state,
    answer('relabeled-transfer', { source: 'study', timestamp: start + day * 2, transfer: true }),
  );
  assert.equal(mastery(state).state, 'retained');
  recordUnifiedEvidence(
    state,
    answer('transfer', {
      source: 'review',
      timestamp: start + day * 2,
      contextId: 'club',
      transfer: true,
    }),
  );
  assert.equal(mastery(state).state, 'transfer');
});

test('submission IDs survive restore and retries do not create independent evidence', () => {
  const original = emptyUnifiedLearning();
  const response = answer('unique', {
    targets: [writing, { ...writing, targetId: 'pattern.u01_l01.name' }],
  });
  assert.equal(recordUnifiedEvidence(original, response), true);
  const state = unifiedLearningSchema.parse(JSON.parse(JSON.stringify(original)));
  assert.equal(recordUnifiedEvidence(state, { ...response, source: 'study' }), false);
  recordUnifiedEvidence(
    state,
    answer('retry', { exerciseId: 'unique', source: 'review', retry: true }),
  );
  assert.deepEqual(state.evidence[1].aids, ['retry', 'answer_shown']);
  assert.equal(state.evidence[0].targets.length, 1);
  assert.equal(mastery(state).independentSuccesses, 1);
  assert.equal(mastery(state).assistedSuccesses, 1);
});

test('placement, ungradable responses, and speech transcripts cannot verify ability', () => {
  const state = emptyUnifiedLearning();
  recordUnifiedEvidence(state, answer('placement', { source: 'placement' }));
  recordUnifiedEvidence(state, answer('ungradable', { outcome: 'ungradable' }));
  recordUnifiedEvidence(
    state,
    answer('transcript', {
      source: 'speech',
      activity: 'speech_transcript',
      format: 'speaking',
      targets: [{ ...writing, dimension: 'speaking' }],
    }),
  );
  assert.equal(state.evidence.length, 3);
  assert.equal(mastery(state).state, 'not_introduced');
  assert.equal(getUnifiedMastery(state, writing.targetId, 'speaking').state, 'guided_practice');
  recordUnifiedEvidence(state, answer('understood', { outcome: 'communication_only' }));
  assert.equal(mastery(state).state, 'guided_practice');
  assert.equal(mastery(state).communicationSuccesses, 1);
  recordUnifiedEvidence(
    state,
    answer('name-mismatch', {
      outcome: 'incorrect',
      languageOutcome: 'target',
      identityMismatch: true,
    }),
  );
  assert.equal(state.evidence.at(-1)?.outcome, 'incorrect');
  assert.equal(mastery(state).state, 'independent_performance');
  assert.equal(mastery(state).incorrectAttempts, 0);
});

test('forgetting prioritizes the authored guided remedy and an independent follow-up', () => {
  const state = emptyUnifiedLearning();
  recordUnifiedEvidence(state, answer('one'));
  recordUnifiedEvidence(state, answer('two'));
  recordUnifiedEvidence(
    state,
    answer('error', { timestamp: start + day, outcome: 'incorrect', error: 'be_omission' }),
  );
  const guidance = {
    exerciseId: 'remedy',
    contextId: 'guided-card',
    targets: [writing],
    guided: true,
    remediates: ['be_omission' as const],
  };
  const followUp = {
    exerciseId: 'follow-up',
    contextId: 'new-setting',
    targets: [writing],
    errors: ['be_omission' as const],
  };
  assert.equal(mastery(state).state, 'demonstrated');
  assert.deepEqual(mastery(state).pendingErrors, ['be_omission']);
  assert.equal(
    rankUnifiedReviewCandidates(state, mastery(state), [followUp, guidance], start + day)[0],
    guidance,
  );
  recordUnifiedEvidence(
    state,
    answer('remedy', {
      source: 'remediation',
      timestamp: start + day,
      contextId: guidance.contextId,
      aids: ['guided'],
      remediates: guidance.remediates,
    }),
  );
  assert.equal(
    rankUnifiedReviewCandidates(state, mastery(state), [guidance, followUp], start + day)[0],
    followUp,
  );
  recordUnifiedEvidence(
    state,
    answer('unrelated', {
      source: 'remediation',
      timestamp: start + day,
      contextId: 'another-setting',
    }),
  );
  assert.deepEqual(mastery(state).pendingErrors, ['be_omission']);
  recordUnifiedEvidence(
    state,
    answer('follow-up', {
      source: 'remediation',
      timestamp: start + day,
      contextId: followUp.contextId,
      errors: followUp.errors,
    }),
  );
  assert.deepEqual(mastery(state).pendingErrors, []);
  assert.equal(mastery(state).needsReview, false);
});

test('legacy scheduling survives without mastery credit, and challenge replays cannot accumulate', () => {
  const state = emptyUnifiedLearning();
  const nextReviewAt = new Date(start).toISOString();
  state.legacySchedules.push({ ...writing, nextReviewAt });
  assert.equal(mastery(state).state, 'not_introduced');
  assert.equal(mastery(state).nextReviewAt, nextReviewAt);
  assert.equal(unifiedReviewQueue(state, start)[0].needsReview, true);
  recordUnifiedEvidence(
    state,
    answer('challenge-wrong', {
      exerciseId: 'challenge-one',
      source: 'challenge',
      outcome: 'incorrect',
    }),
  );
  for (let i = 1; i < 10; i++)
    recordUnifiedEvidence(
      state,
      answer(`challenge-${i}`, {
        exerciseId: 'challenge-one',
        source: 'challenge',
        timestamp: start + i * day,
      }),
    );
  assert.equal(mastery(state).incorrectAttempts, 1);
  assert.equal(mastery(state).independentSuccesses, 1);
  assert.equal(mastery(state).state, 'independent_performance');
});

test('a first assisted result is scheduled for the next day and wins a due-date tie', () => {
  const state = emptyUnifiedLearning();
  const reading = { targetId: writing.targetId, dimension: 'reading' } as const;
  recordUnifiedEvidence(state, answer('unassisted', { targets: [reading] }));
  recordUnifiedEvidence(state, answer('assisted', { aids: ['hint'] }));
  assert.equal(mastery(state).nextReviewAt, new Date(start + day).toISOString());
  assert.equal(unifiedReviewQueue(state, start + day)[0].dimension, writing.dimension);
});
