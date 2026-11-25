import assert from 'node:assert/strict';
import test from 'node:test';
import bundled from '../../../apps/mobile/src/content/bundled-course.json';
import {
  OfflineEngine,
  type CourseData,
  type OfflineState,
  type LessonCheckpoint,
} from '../src/index';
import {
  formalTeachingKeys,
  reviewPrerequisites,
  teachingReferenceKey,
} from '../src/learning-prerequisites';

const course = bundled.payload as CourseData;
const lesson = course.lessons.u01_l01;
const exercise = lesson.exercises.find(({ id }) => id === 'u01_l01_practice_4')!;

function setup() {
  let saved: string | null = null;
  const device = {
    getItem: async () => saved,
    setItem: async (_key: string, value: string) => {
      saved = value;
    },
  };
  const reopen = () => new OfflineEngine({ store: device, getContent: () => course });
  return { engine: reopen(), reopen, state: () => JSON.parse(saved!) as OfflineState };
}

const path = `/v1/lessons/${lesson.id}`;
const checkpoint = (stage: number, vocabulary: number): LessonCheckpoint => ({
  eventId: `formal-teaching-${stage}-${vocabulary}`,
  activityId: 'formal-teaching-activity',
  stage,
  vocabulary,
  exercise: -1,
  answer: {},
  hint: false,
  help: false,
  xp: 0,
  weak: [],
  reviewAt: null,
});

test('only the formal Study stages authorize the Phase 5B lexical forms and patterns', async () => {
  const { engine, reopen, state } = setup();
  await engine.request(`${path}/study-events`, { action: 'reference' });
  const initial = formalTeachingKeys(state().unifiedLearning);
  assert.equal(initial.size, 0);
  const missing = reviewPrerequisites(course, lesson, exercise, initial)!.missing;
  assert.ok(missing.some(({ id, form }) => id === 'lex.u01_l01_v02' && form === 'hi'));
  assert.ok(missing.some(({ id }) => id === 'pattern.u01_l01.name'));
  assert.ok(missing.some(({ id }) => id === 'grammar.be_i_you'));

  const vocabularyStage = lesson.stages!.findIndex(({ type }) => type === 'vocabulary');
  await engine.request(`${path}/checkpoint`, checkpoint(vocabularyStage, 1));
  const taught = formalTeachingKeys(state().unifiedLearning);
  assert.ok(taught.has(teachingReferenceKey({ id: 'home.greeting-word', form: 'Hi' })));
  assert.ok(!taught.has(teachingReferenceKey({ id: 'home.greeting-word', form: 'Hello' })));
  const restored = reopen();
  for (const i of lesson.vocabulary!.keys())
    await restored.request(`${path}/checkpoint`, checkpoint(vocabularyStage, i));
  const grammarStage = lesson.stages!.findIndex(({ type }) => type === 'grammar');
  await restored.request(`${path}/checkpoint`, checkpoint(grammarStage, 0));
  const ready = formalTeachingKeys(state().unifiedLearning);
  assert.deepEqual(reviewPrerequisites(course, lesson, exercise, ready)!.missing, []);
  assert.ok(ready.has(teachingReferenceKey({ id: 'home.introduce', form: "I'm" })));
  assert.ok(!ready.has(teachingReferenceKey({ id: 'home.introduce', form: "My name's" })));
});

test('legacy schedules and a correct response cannot substitute for formal review teaching', async () => {
  const { engine, reopen, state } = setup();
  const input = {
    clientAttemptId: 'prerequisite-previous-answer',
    lessonId: lesson.id,
    exerciseId: exercise.id,
    answer: { text: 'Hi! My name is Ana.' },
  };
  await engine.request('/v1/attempts', input);
  const backup = await engine.request<{ state: Partial<OfflineState> }>('/v1/me/export');
  delete backup.state.unifiedLearning;
  await engine.request('/v1/me/import', { backup });
  assert.ok(state().unifiedLearning.legacySchedules.length);
  const restored = reopen();
  const keys = formalTeachingKeys(state().unifiedLearning);
  assert.equal(keys.size, 0);
  const pending = reviewPrerequisites(course, lesson, exercise, keys);
  assert.ok(pending?.missing.length);
  assert.ok(pending.instruction?.sections.length);
  await restored.request('/v1/attempts', {
    ...input,
    clientAttemptId: 'prerequisite-review-answer',
    learningSource: 'review',
  });
  const event = state().unifiedLearning.evidence.find(
    ({ id }) => id === 'prerequisite-review-answer',
  );
  assert.equal(event?.outcome, 'ungradable');
  assert.equal(event?.independent, false);
});
