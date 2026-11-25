import assert from 'node:assert/strict';
import test from 'node:test';
import {
  units,
  lessons,
  challengePools,
  challengeLevels,
  placementQuestions,
} from '../../../content/source/curriculum';
import { easternChapterLessons } from '../../../content/source/chapter-lessons-east';
import { westernChapterLessons } from '../../../content/source/chapter-lessons-west';
import { chapterStory } from '../../offline-engine/src/chapter-story';
import {
  chapter,
  travelLesson,
  travelPracticeSteps,
} from '../../offline-engine/src/travel-content';
import { travelChallengePools } from '../../offline-engine/src/travel-challenge-pools';
import { travelPlacementItems } from '../../offline-engine/src/travel-placement-items';
import { inspectPublishedPrerequisites } from '../../../scripts/published-prerequisites';
import { inspectOptionalPrerequisites } from '../../../scripts/published-optional-prerequisites';

function fixture() {
  const { instructionTrace } = inspectPublishedPrerequisites({
    chapters: { ...westernChapterLessons, ...easternChapterLessons },
    lessons: Object.values(lessons),
    missions: chapter.missions,
    encounters: chapterStory.encounters,
    dialogues: chapterStory.dialogues,
    reviewSteps: travelPracticeSteps,
    reviewStarter: travelLesson.exercises[0],
  });
  return structuredClone({
    units,
    lessons,
    challengePools,
    challengeLevels,
    placementQuestions,
    instructionTrace,
    homeChallengePools: travelChallengePools,
    homePlacementItems: travelPlacementItems,
    homeMissionIds: chapter.missions.map(({ id }) => id),
  });
}

test('all optional challenge paths and entry diagnostics have authored prerequisites', () => {
  const { issues, stats } = inspectOptionalPrerequisites(fixture());
  assert.deepEqual(issues, []);
  assert.deepEqual(stats, {
    textbookChallenges: 124,
    homeChallenges: 15,
    textbookDiagnostics: 12,
    homeDiagnostics: 6,
    challengePaths: 48,
  });
  assert.ok(placementQuestions.every(({ requiredLessonIds }) => !requiredLessonIds?.length));
});

test('a grammatical challenge still fails for vocabulary removed from its completed paths', () => {
  const source = fixture();
  const train = source.instructionTrace.targets.find(
    (target) =>
      target.kind === 'lexical' &&
      target.id.startsWith('form.u06_l02.') &&
      target.lemma === 'train',
  )!;
  const lesson = source.instructionTrace.lessons.find(({ id }) => id === 'u06_l02')!;
  const grammar = lesson.stages.find(({ id }) => id === 'teach-grammar');
  assert.ok(grammar?.type === 'teach');
  grammar.teaches = grammar.teaches.filter(({ id }) => id !== train.id);
  const { issues } = inspectOptionalPrerequisites(source);
  assert.ok(
    issues.some(
      (issue) =>
        issue.includes('exercise=challenge_travel_meeting_reading_1') &&
        issue.includes(`target=${train.id}[train]`) &&
        issue.includes('Missing instruction'),
    ),
    issues.join('\n'),
  );
  assert.ok(!issues.some((issue) => issue.includes('target=grammar.going_to ')));
});

test('a grammatically valid changed prompt cannot rely on an unopened textbook word', () => {
  const source = fixture();
  source.challengePools.grammar_rush[0].sentence = 'I ___ archaeology every day.';
  const { issues } = inspectOptionalPrerequisites(source);
  assert.ok(
    issues.some((issue) => issue.includes('challenge_routine_01') && issue.includes('archaeology')),
    issues.join('\n'),
  );
});

test('a Home contraction shown as a hint does not replace instruction of the exact form', () => {
  const source = fixture();
  const id = 'home.statement-be';
  const form = "It's";
  for (const lesson of source.instructionTrace.lessons) {
    const stages = lesson.stages.filter((stage) => stage.type === 'teach');
    for (const stage of stages)
      stage.teaches = stage.teaches.filter((ref) => ref.id !== id || ref.form !== form);
  }
  const bus = source.instructionTrace.lessons.find(({ id }) => id === 'published.home.bus')!;
  const hint = {
    id: 'answer-hint',
    type: 'context' as const,
    supports: [{ use: 'gloss' as const, target: { id, form }, reasonEs: 'Pista de contexto.' }],
  };
  bus.stages.push(hint);
  bus.paths.forEach(({ stages }) => stages.push(hint.id));
  const { issues } = inspectOptionalPrerequisites(source);
  assert.ok(
    issues.some(
      (issue) =>
        issue.includes('home_challenge_directions') &&
        issue.includes("home.statement-be[it's]") &&
        issue.includes('Missing instruction'),
    ),
    issues.join('\n'),
  );
});

test('an unknown required lesson cannot be treated as a completed challenge gate', () => {
  const source = fixture();
  source.challengePools.grammar_rush[0].requiredLessonIds!.push('u99_l01');
  const { issues } = inspectOptionalPrerequisites(source);
  assert.ok(
    issues.some(
      (issue) => issue.includes('challenge_routine_01') && issue.includes('Invalid lesson gates'),
    ),
    issues.join('\n'),
  );
});

test('placement stays accessible before lesson completion', () => {
  const source = fixture();
  source.placementQuestions[0].requiredLessonIds = ['u01_l01'];
  const { issues } = inspectOptionalPrerequisites(source);
  assert.ok(
    issues.some(
      (issue) => issue.includes('placement_01') && issue.includes('Diagnostic must remain ungated'),
    ),
    issues.join('\n'),
  );
});
