import assert from 'node:assert/strict';
import test from 'node:test';
import { OFFLINE_STATE_KEY, OfflineEngine, type CourseData, type OfflineState } from '../src/index';
import { getUnifiedMastery } from '../src/learning-evidence';

test('spoken transcript and recording are saved separately without upgrading writing or spoken mastery', async () => {
  let saved: string | null = null;
  const content: CourseData = {
    units: [],
    lessons: {},
    placementQuestions: [],
    missions: [],
    challengeLevels: [],
    challengePools: { grammar_rush: [], cloze_battle: [], reading_quest: [] },
    speechDrills: [{ id: 'speech_1_1', category: 'short_long_vowels' }],
    courseVersion: '2.2.1',
  };
  const engine = new OfflineEngine({
    store: {
      getItem: async (key) => (key === OFFLINE_STATE_KEY ? saved : null),
      setItem: async (key, value) => {
        if (key === OFFLINE_STATE_KEY) saved = value;
      },
    },
    getContent: () => content,
  });
  const body = {
    id: 'native-speech-practice-1',
    source: 'story',
    materialId: 'hello',
    itemId: 'hello_speak',
    retry: false,
    recognition: 'matched',
    recording: true,
  };
  await engine.request('/v1/speech/practice', body);
  await engine.request('/v1/speech/practice', body);
  await engine.request('/v1/speech/practice', {
    id: 'web-speech-practice-2',
    source: 'drill',
    materialId: 'short_long_vowels',
    itemId: 'speech_1_1',
    retry: false,
    recognition: 'empty',
    recording: false,
  });
  await assert.rejects(
    engine.request('/v1/speech/practice', { ...body, transcript: 'My name is Ana.' }),
  );
  const { unifiedLearning } = JSON.parse(saved!) as OfflineState;
  assert.deepEqual(
    unifiedLearning.evidence.map(({ activity, outcome, independent }) => ({
      activity,
      outcome,
      independent,
    })),
    [
      { activity: 'speech_transcript', outcome: 'target', independent: false },
      { activity: 'recording', outcome: undefined, independent: false },
      { activity: 'speech_transcript', outcome: 'ungradable', independent: false },
    ],
  );
  assert.equal(
    getUnifiedMastery(unifiedLearning, 'home.introduce', 'speaking').state,
    'guided_practice',
  );
  assert.equal(
    getUnifiedMastery(unifiedLearning, 'home.introduce', 'writing').state,
    'not_introduced',
  );
  assert.equal(
    getUnifiedMastery(unifiedLearning, 'speech.short_long_vowels', 'speaking').state,
    'not_introduced',
  );
  assert.doesNotMatch(saved!, /My name is Ana/);
});
