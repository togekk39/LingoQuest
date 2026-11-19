import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { grade } from '../src/index.ts';
import { chapter, travelLesson, travelPracticeSteps } from '../src/travel-content.ts';
import {
  learningSkills,
  travelConcepts,
  travelCurriculum,
  type TravelConceptId,
} from '../src/travel-curriculum.ts';
import { route } from '../src/travel-route.ts';

test('the route introduces each concept in prerequisite order and practices all six skills', () => {
  assert.equal(travelCurriculum.length, 20);
  assert.equal(travelCurriculum.at(-1)?.destinationId, 'antarctica');
  assert.deepEqual(
    travelCurriculum.map((stage) => [stage.destinationId, stage.band]),
    route.map((stop) => [stop.id, stop.band]),
  );
  const introduced = new Set<TravelConceptId>();

  for (const stage of travelCurriculum) {
    assert.ok(stage.transferEs.trim(), stage.destinationId);
    assert.ok(stage.introduces.length, stage.destinationId);
    assert.deepEqual(Object.keys(stage.objectives).sort(), Object.keys(learningSkills).sort());
    for (const [skill, objective] of Object.entries(stage.objectives))
      assert.ok(objective.trim(), `${stage.destinationId}/${skill}`);
    for (const conceptId of stage.revisits)
      assert.ok(introduced.has(conceptId), `${stage.destinationId} revisits ${conceptId} early`);
    for (const conceptId of stage.introduces) {
      assert.ok(!introduced.has(conceptId), `Duplicate introduction of ${conceptId}`);
      for (const prerequisiteId of travelConcepts[conceptId].prerequisiteIds)
        assert.ok(
          introduced.has(prerequisiteId),
          `${conceptId} requires the earlier introduction of ${prerequisiteId}`,
        );
      introduced.add(conceptId);
    }
  }
  assert.deepEqual([...introduced].sort(), Object.keys(travelConcepts).sort());
  for (const homeConcept of travelCurriculum[0].introduces)
    assert.ok(travelCurriculum.slice(1).some((stage) => stage.revisits.includes(homeConcept)));
});

test('chapter exercises and review tasks use stable IDs and cover every first-stop concept', () => {
  const stepIds = new Set<string>();
  const chapterConcepts = new Set<string>(travelCurriculum[0].introduces);
  const journalSkills = new Set<string>();
  for (const mission of chapter.missions) {
    assert.ok(mission.minutes >= 1 && mission.minutes <= 3, mission.id);
    assert.equal(mission.steps[0].type, 'dialogue');
    assert.ok(mission.steps.some((step) => step.type === 'teach'));
    assert.ok(
      mission.steps.some(
        (step) =>
          step.type === 'exercise' &&
          step.exercise.type === 'short_text' &&
          step.exercise.learning?.evidence === 'transfer',
      ),
      mission.id,
    );
    for (const step of mission.steps) {
      assert.ok(!stepIds.has(step.id), step.id);
      stepIds.add(step.id);
      if (step.type === 'exercise' || step.type === 'speak') {
        const target = step.type === 'exercise' ? step.exercise.learning : step.learning;
        assert.ok(target, step.id);
        assert.ok(chapterConcepts.has(target.conceptId), target.conceptId);
        journalSkills.add(target.skill);
      }
    }
  }
  assert.deepEqual([...journalSkills].sort(), Object.keys(learningSkills).sort());
  assert.equal(
    new Set(travelLesson.exercises.map((exercise) => exercise.id)).size,
    travelLesson.exercises.length,
  );
  for (const conceptId of chapterConcepts) {
    assert.ok(
      travelPracticeSteps.some(
        ({ exercise }) =>
          exercise.learning?.conceptId === conceptId &&
          exercise.learning.evidence === 'transfer' &&
          exercise.type === 'short_text',
      ),
      `No short-text transfer or review for ${conceptId}`,
    );
  }
  for (const { exercise } of travelPracticeSteps) {
    assert.ok(exercise.learning && chapterConcepts.has(exercise.learning.conceptId), exercise.id);
  }

  const exercise = (id: string) => travelLesson.exercises.find((item) => item.id === id)!;
  assert.ok(grade(exercise('travel_hello_transfer'), { text: 'I’m Nico.' }));
  assert.ok(grade(exercise('travel_hello_transfer'), { text: 'My name is Nico.' }));
  assert.ok(grade(exercise('travel_bus_transfer'), { text: 'The park is beside the bus stop.' }));
  assert.ok(grade(exercise('travel_bag_write'), { text: 'The backpack is blue.' }));
  assert.ok(!grade(exercise('travel_bag_transfer'), { text: 'The backpack is blue.' }));
});

test('teaching blocks match their examples and all chapter speech has bundled audio', () => {
  const clipRegistry = readFileSync(
    new URL('../../../apps/mobile/src/travel/audioClips.ts', import.meta.url),
    'utf8',
  );
  const englishLines = new Set<string>();
  for (const mission of chapter.missions) {
    for (const word of mission.vocabulary) {
      englishLines.add(word.term);
      englishLines.add(word.example.en);
    }
    for (const step of mission.steps) {
      if (step.type === 'dialogue' && step.line) englishLines.add(step.line.en);
      if (step.type === 'speak') {
        englishLines.add(step.phrase);
        assert.ok(step.fallback, step.id);
      }
      if (step.type === 'exercise' && step.audio) {
        englishLines.add(step.audio);
        assert.ok(step.transcript, step.id);
      }
      if (step.type === 'teach') {
        for (const example of step.examples) englishLines.add(example.en);
        if (step.patterns) {
          assert.equal(step.patterns.length, step.examples.length, step.id);
          for (const [index, pattern] of step.patterns.entries()) {
            assert.equal(pattern.parts.map((part) => part.text).join(' '), step.examples[index].en);
            if (pattern.es) assert.equal(pattern.es, step.examples[index].es);
          }
        }
      }
    }
  }
  for (const step of travelPracticeSteps) {
    if (step.audio) {
      englishLines.add(step.audio);
      assert.ok(step.transcript, step.id);
    }
  }
  for (const line of englishLines) {
    const escaped = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(clipRegistry, new RegExp(`^\\s+(?:${escaped}|'${escaped}'):`, 'm'), line);
  }
});
