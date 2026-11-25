import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chapterReaderSections } from '../../../apps/mobile/src/travel/chapterReaderSections';
import { easternChapterLessons } from '../../../content/source/chapter-lessons-east';
import { westernChapterLessons } from '../../../content/source/chapter-lessons-west';
import { lessons } from '../../../content/source/curriculum';
import { chapterStory } from '../../offline-engine/src/chapter-story';
import type { StoryEncounter } from '../../offline-engine/src/story';
import {
  chapter,
  travelLesson,
  travelPracticeSteps,
} from '../../offline-engine/src/travel-content';
import { inspectPublishedPrerequisites } from '../../../scripts/published-prerequisites';
import type { ChapterLessonSource } from '../src/index';

const published = () => ({
  chapters: structuredClone<Record<string, ChapterLessonSource>>({
    ...westernChapterLessons,
    ...easternChapterLessons,
  }),
  lessons: structuredClone(Object.values(lessons)),
  missions: structuredClone(chapter.missions),
  encounters: structuredClone<readonly StoryEncounter[]>(chapterStory.encounters),
  dialogues: structuredClone(chapterStory.dialogues),
  reviewSteps: structuredClone(travelPracticeSteps),
  reviewStarter: structuredClone(travelLesson.exercises[0]),
});

test('actual sources cover every chapter card, textbook exercise and first-chapter encounter', () => {
  const { issues, statistics } = inspectPublishedPrerequisites(published());
  assert.deepEqual(issues, []);
  assert.equal(statistics.chapterCards, 24);
  assert.equal(statistics.chapterQuestions, statistics.chapterCards);
  assert.equal(statistics.chapterSelfChecks, statistics.chapterCards);
  assert.ok(statistics.chapterExactPatterns > statistics.chapterCards);
  assert.equal(statistics.textbookLessons, Object.keys(lessons).length);
  assert.equal(
    statistics.textbookExercises,
    Object.values(lessons).flatMap((lesson) => lesson.exercises).length,
  );
  assert.equal(statistics.storyMissions, chapter.missions.length);
  assert.equal(statistics.travelAdaptiveItems, travelPracticeSteps.length);
  assert.ok(statistics.travelAdaptivePaths > statistics.storyExercises);
  assert.equal(
    statistics.storyExercises,
    chapter.missions.flatMap((mission) => mission.steps.filter((step) => step.type === 'exercise'))
      .length,
  );
});

test('Salvador progressives still require the taught vocabulary even when the transcript includes it', () => {
  const content = published();
  const { brazil } = content.chapters;
  assert.ok(!Array.isArray(brazil));
  const needs = 'wash the vegetables';
  assert.match(brazil.question.listening!.en, /washing the vegetables/);
  brazil.vocabulary = brazil.vocabulary.filter(({ en }) => en !== needs);
  const { issues } = inspectPublishedPrerequisites(content);
  assert.ok(issues.some((issue) => issue.includes(`Missing card vocabulary: ${needs}`)));
  assert.ok(
    issues.some((issue) =>
      /chapter=brazil .*exercise=chapter-question .*Missing target: wash the vegetables/.test(
        issue,
      ),
    ),
  );
  assert.ok(
    !issues.some(
      (issue) => issue.includes('Missing teaching evidence') && issue.includes('brazil'),
    ),
  );
});

test('a grammatical but unreviewed Story reading is rejected before its existing tags can pass', () => {
  const content = published();
  const read = content.missions
    .find(({ id }) => id === 'bag')
    ?.steps.find(({ id }) => id === 'travel_bag_owner');
  assert.ok(read?.type === 'exercise');
  read.exercise.passage = 'Hi! My name is Luz. My satchel is crimson.';
  const { issues } = inspectPublishedPrerequisites(content);
  assert.ok(
    issues.some((issue) =>
      /step=travel_bag_owner Changed instructional or assessment text/.test(issue),
    ),
  );
});

test('direct Bag Study cannot rely on Hello being taught or on a preview or text passage', () => {
  const content = published();
  const bag = content.missions.find(({ id }) => id === 'bag')!;
  const lesson = bag.steps.find(({ id }) => id === 'bag_teach');
  const opening = bag.steps.find(({ type }) => type === 'dialogue');
  assert.ok(lesson?.type === 'teach' && opening?.type === 'dialogue');
  opening.line = { en: 'My name is Luz.', es: 'Me llamo Luz.' };
  lesson.text = lesson.text.replace(/^Antes de leer .*?\. My bag/u, 'My bag');
  const { issues } = inspectPublishedPrerequisites(content);
  assert.ok(
    issues.some((issue) =>
      /lesson=published\.home\.bag path=direct-study exercise=travel_bag_owner missing=home\.introduce\[My name is\]/.test(
        issue,
      ),
    ),
  );
  assert.ok(
    issues.some((issue) =>
      /adaptive=travel_review_item_owner_read .*Target absent from concept teaching: home\.introduce/.test(
        issue,
      ),
    ),
  );
});

test('a Study explanation hidden in Story cannot cover a missing visible introduction lesson', () => {
  const content = published();
  const intro = content.missions
    .find(({ id }) => id === 'hello')
    ?.steps.find(({ id }) => id === 'hello_teach');
  assert.ok(intro?.type === 'teach' && intro.storyPrompt);
  intro.storyPrompt.text = 'Ahora te presentas ante Sam.';
  const { issues } = inspectPublishedPrerequisites(content);
  assert.ok(
    issues.some((issue) =>
      /path=story-greet-sam exercise=travel_hello_build missing=home\.intro-agreement/.test(issue),
    ),
  );
  assert.ok(
    !issues.some((issue) =>
      /lesson=published\.home\.hello path=direct-study exercise=travel_hello_build missing=/.test(
        issue,
      ),
    ),
  );
});

test('the actual chapter reader fails when a question is moved before teaching', () => {
  const byId = (id: string) => chapterReaderSections.find((section) => section.id === id)!;
  const reordered = ['dialogue', 'question', 'vocabulary', 'grammar', 'practice'].map(byId);
  const { issues } = inspectPublishedPrerequisites(published(), reordered);
  assert.ok(
    issues.some((issue) =>
      /chapter=brazil .*exercise=chapter-question missing=.*progressive/.test(issue),
    ),
  );
  assert.ok(
    issues.some((issue) =>
      /chapter=colombia .*exercise=chapter-question missing=.*request/.test(issue),
    ),
  );
});

test('actual chapter text must teach Cusco past forms and Toronto spelling before use', () => {
  const content = published();
  const { peru, toronto } = content.chapters;
  assert.ok(!Array.isArray(peru) && !Array.isArray(toronto));
  peru.grammarEs = peru.grammarEs.replaceAll('saw', 'see');
  toronto.vocabulary = toronto.vocabulary.filter(({ en }) => !en.startsWith('V, W'));
  const { issues } = inspectPublishedPrerequisites(content);
  assert.ok(
    issues.some((issue) =>
      /chapter=peru .*grammar=irregular .*Missing teaching evidence: saw/.test(issue),
    ),
  );
  assert.ok(issues.some((issue) => /chapter=toronto .*Missing card vocabulary: V, W/.test(issue)));
});

test('a real textbook exercise before the grammar and a Story shortcut that skips teaching both fail', () => {
  const content = published();
  const firstLesson = content.lessons[0];
  const grammar = firstLesson.stages.find((stage) => stage.type === 'grammar')!;
  firstLesson.stages = [...firstLesson.stages.filter((stage) => stage !== grammar), grammar];
  content.encounters = content.encounters.map((encounter) =>
    encounter.id === 'greet-sam'
      ? { ...encounter, freshEntryStepId: 'travel_hello_build' }
      : encounter,
  );
  const { issues } = inspectPublishedPrerequisites(content);
  assert.ok(
    issues.some((issue) =>
      /lesson=u01_l01 path=direct-study exercise=u01_l01_practice_\d+ missing=grammar\./.test(
        issue,
      ),
    ),
  );
  assert.ok(
    issues.some((issue) =>
      /lesson=u01_l01 path=lesson-review exercise=u01_l01_practice_\d+ missing=grammar\./.test(
        issue,
      ),
    ),
  );
  assert.ok(
    issues.some((issue) =>
      /path=story-greet-sam exercise=travel_hello_build missing=home\.introduce\[I am\]/.test(
        issue,
      ),
    ),
  );
});

test('adaptive review detects drift in the concept gate and the local word support', () => {
  const content = published();
  const item = content.reviewSteps.find(({ id }) => id === 'travel_review_place_location')!;
  item.situation = 'Una persona necesita encontrar la mochila.';
  item.exercise.learning = { ...item.exercise.learning!, conceptId: 'introduction' };
  const { issues } = inspectPublishedPrerequisites(content);
  assert.ok(
    issues.some((issue) =>
      /adaptive=travel_review_place_location .*Target absent from concept teaching: home\.adjacency/.test(
        issue,
      ),
    ),
  );
  assert.ok(
    issues.some((issue) =>
      /adaptive=travel_review_place_location .*Missing support evidence: the bag/.test(issue),
    ),
  );
});
