import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lessons } from '../../../content/source/curriculum';
import { buildTextbookPrerequisites } from '../../../scripts/published-textbook-prerequisites';
import { checkPrerequisites, prerequisiteFileSchema } from '../src/prerequisites';
import type { CourseLesson } from '../src/index';

function inspect(change?: (current: typeof lessons) => void) {
  const current = structuredClone(lessons);
  change?.(current);
  const result = buildTextbookPrerequisites(Object.values(current));
  const curriculum = new Map(
    result.traces.map(({ id, chapterId }, index) => [id, { chapterId, order: index }]),
  );
  const file = prerequisiteFileSchema.parse({
    version: 1,
    targets: result.targets,
    lessons: result.traces,
  });
  return { ...result, issues: [...result.issues, ...checkPrerequisites([file], curriculum)] };
}

function exercise(lesson: CourseLesson, position: number) {
  return lesson.exercises.find(({ id }) => id === lesson.id + '_practice_' + position)!;
}

test('published textbook exercises reference formal vocabulary and require their local grammar and patterns where assessed', () => {
  const { targets, traces, issues, exerciseCount } = inspect();
  assert.deepEqual(issues, []);
  assert.equal(traces.length, 32);
  assert.equal(exerciseCount, 382);
  const kinds = new Map(targets.map(({ id, kind }) => [id, kind]));
  const items = traces.flatMap(({ stages }) => stages.filter((stage) => stage.type === 'exercise'));
  for (const item of items)
    assert.ok(
      item.requires.some(({ id, form }) => kinds.get(id) === 'lexical' && form),
      item.id,
    );
  const grammarItem = items.find(({ id }) => id === 'u08_l01_practice_1')!;
  assert.ok(grammarItem.requires.some(({ id }) => id === 'grammar.would_like'));
  assert.ok(grammarItem.requires.some(({ id }) => id === 'pattern.u08_l01.request'));
  assert.ok(grammarItem.requires.some(({ form }) => form === 'water'));
});

test('a grammatical exercise that introduces a prior-unit word still needs local teaching and a lexical annotation', () => {
  const { issues } = inspect((current) => {
    const item = exercise(current.u08_l04, 5);
    item.passage = item.passage!.replace('I am available.', 'I am available at the airport.');
  });
  assert.ok(
    issues.some((issue) =>
      /exercise=u08_l04_practice_5 .*Vocabulary has no annotated requirement: .*airport/.test(
        issue,
      ),
    ),
  );
  assert.ok(!issues.some((issue) => /exercise=u08_l04_practice_5 missing=grammar\./.test(issue)));
});

test('a required lexical form must be taught before a grammatical exercise despite preview, model and visible gloss', () => {
  const { issues } = inspect((current) => {
    const lesson = current.u08_l01;
    lesson.grammar.taughtForms = lesson.grammar.taughtForms!.filter(({ en }) => en !== 'water');
    lesson.dialogue[0].glosses.push({ en: 'water', es: 'agua' });
    exercise(lesson, 1).contextualGlosses = [{ en: 'water', es: 'agua' }];
    exercise(lesson, 1).feedbackEs += ' Ejemplo: I would like a glass of water, please.';
  });
  for (const route of ['direct-study', 'lesson-review'])
    assert.ok(
      issues.some((issue) =>
        issue.includes(`path=${route} exercise=u08_l01_practice_1 target=form.u08_l01.6[water]`),
      ),
    );
  assert.ok(!issues.some((issue) => /exercise=u08_l01_practice_1 missing=grammar\./.test(issue)));
});

test('changing the sense under an identical surface form triggers review', () => {
  const { issues } = inspect((current) => {
    const item = exercise(current.u03_l04, 1);
    item.promptEs = item.promptEs.replace('un banco', 'una orilla');
  });
  assert.ok(
    issues.some((issue) => /exercise=u03_l04_practice_1 .*Review changed exercise/.test(issue)),
  );
});

test('a published pattern example moved to bilingual dialogue does not satisfy the formal dependency', () => {
  const { issues } = inspect((current) => {
    const lesson = current.u03_l03;
    const anchor = lesson.grammar.examples.find(({ en }) => en === 'Can you help me, please?')!;
    lesson.grammar.examples = lesson.grammar.examples.filter((item) => item !== anchor);
    lesson.dialogue.push({ speaker: 'Ana', ...anchor, glosses: [] });
  });
  assert.ok(
    issues.some((issue) =>
      /path=direct-study exercise=u03_l03_practice_1 missing=pattern\.u03_l03\.request/.test(issue),
    ),
  );
});
