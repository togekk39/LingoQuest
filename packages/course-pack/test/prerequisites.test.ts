import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { westernChapterLessons } from '../../../content/source/chapter-lessons-west';
import { chapterReaderSections } from '../../../tests/curriculum/chapter-reader-sections';
import {
  checkPrerequisites,
  prerequisiteFileSchema,
  type CurriculumLesson,
} from '../src/prerequisites';

const encoded = readFileSync(
  new URL('../../../content/source/prerequisites/early-travel.json', import.meta.url),
  'utf8',
);
const mexico = 'lq-mexico-routines.routine-ask';
const cartagena = 'lq-cartagena-food.order';
const cusco = 'lq-cusco-past.past-irreg';
const curriculum = new Map<string, CurriculumLesson>([
  [mexico, { chapterId: 'mexico', order: 1 }],
  [cartagena, { chapterId: 'colombia', order: 2 }],
  [cusco, { chapterId: 'peru', order: 3 }],
]);

function draft() {
  return prerequisiteFileSchema.parse(JSON.parse(encoded));
}

type ReaderSection = (typeof chapterReaderSections)[number]['id'];

function readerOrder(stages: Partial<Record<ReaderSection, string[]>>) {
  return chapterReaderSections.flatMap(({ id }) => stages[id] ?? []);
}

test('annotated Story and Study paths check with earlier gated instruction and optional context', () => {
  assert.deepEqual(checkPrerequisites([draft()], curriculum), []);
});

test('Mexico fails if a does question is inserted into the translated dialogue before its grammar instruction', () => {
  assert.ok(
    westernChapterLessons.mexico.dialogue.some(({ en }) => en === 'Does she go every day?'),
  );
  const file = draft();
  file.lessons[0].paths[0].stages = readerOrder({
    dialogue: ['chapter-preview', 'market-routine-question'],
    grammar: ['teach-does'],
  });
  const issues = checkPrerequisites([file], curriculum);
  assert.equal(issues.length, 1);
  assert.match(
    issues[0],
    /chapter=mexico .*path=story exercise=market-routine-question missing=grammar\.present\.does-base/,
  );
});

test("Cartagena's grammar can teach I'd like after the dialogue, but preview or bypass cannot", () => {
  assert.match(westernChapterLessons.colombia.dialogue[0].en, /I’d like/);
  assert.match(westernChapterLessons.colombia.grammarEs, /I’d like» sirve para pedir/);
  const file = draft();
  const lesson = file.lessons[1];
  lesson.paths[0].stages = readerOrder({
    dialogue: ['chapter-preview'],
    grammar: ['teach-order'],
    question: ['order-a-replacement'],
  });
  assert.deepEqual(checkPrerequisites([file], curriculum), []);

  lesson.paths[0].stages = readerOrder({
    dialogue: ['chapter-preview', 'order-a-replacement'],
    grammar: ['teach-order'],
  });
  lesson.paths[1].stages = ['order-a-replacement'];
  const issues = checkPrerequisites([file], curriculum);
  assert.equal(issues.length, 2);
  for (const path of ['story', 'study'])
    assert.ok(
      issues.some((issue) =>
        issue.includes(
          'chapter=colombia lesson=' +
            cartagena +
            ' path=' +
            path +
            " exercise=order-a-replacement missing=pattern.polite-order[I'd like]",
        ),
      ),
    );
});

test('Cusco needs the taught past form saw even if see and the irregular-past rule were both taught', () => {
  assert.ok(
    westernChapterLessons.peru.dialogue.some(({ en }) => en === 'Did you see Tomás there?'),
  );
  assert.match(westernChapterLessons.peru.model.en, /I saw Ana/);
  const file = draft();
  const lesson = file.lessons[2];
  const stage = lesson.stages.find((stage) => stage.id === 'teach-saw');
  assert.ok(stage?.type === 'teach');
  stage.teaches = [{ id: 'lex.see.vision', form: 'see' }];
  lesson.paths[0].stages = readerOrder({
    dialogue: ['chapter-preview'],
    grammar: ['teach-past', 'teach-saw'],
    practice: ['retell-sighting'],
  });
  const issues = checkPrerequisites([file], curriculum);
  assert.equal(issues.length, 2);
  assert.ok(
    issues.every((issue) =>
      /chapter=peru .*exercise=retell-sighting missing=lex\.see\.vision\[saw\]/.test(issue),
    ),
  );
});

test('a new sense of a familiar form and an untaught grammar skill both fail independently', () => {
  const file = draft();
  file.targets.push(
    {
      id: 'lex.see.understand',
      kind: 'lexical',
      lemma: 'see',
      senseEs: 'Entender una explicación.',
      forms: ['saw'],
    },
    { id: 'grammar.past.perfect', kind: 'grammar', descriptionEs: 'Pasado perfecto con had.' },
  );
  const stage = file.lessons[2].stages.find((stage) => stage.id === 'retell-sighting');
  assert.ok(stage?.type === 'exercise');
  stage.requires.push({ id: 'lex.see.understand', form: 'saw' }, { id: 'grammar.past.perfect' });
  const issues = checkPrerequisites([file], curriculum);
  assert.equal(issues.length, 4);
  assert.ok(
    issues.every(
      (issue) => issue.includes('chapter=peru') && issue.includes('exercise=retell-sighting'),
    ),
  );
  assert.equal(
    issues.filter((issue) => issue.includes('missing=lex.see.understand[saw]')).length,
    2,
  );
  assert.equal(issues.filter((issue) => issue.includes('missing=grammar.past.perfect')).length, 2);
});

test('a completed prior lesson contributes only what it teaches on every completion path', () => {
  const file = draft();
  file.lessons[0].paths.push({
    id: 'preview-only',
    requiresLessons: [],
    stages: ['chapter-preview'],
  });
  const issues = checkPrerequisites([file], curriculum);
  assert.equal(issues.length, 1);
  assert.match(
    issues[0],
    /chapter=colombia .*path=study-with-review exercise=check-an-ingredient missing=grammar\.present\.does-base/,
  );
});

test('an exercise cannot assume all earlier curriculum material or declare a forward lesson prerequisite', () => {
  const file = draft();
  const path = file.lessons[1].paths[2];
  path.requiresLessons = [];
  assert.match(
    checkPrerequisites([file], curriculum)[0],
    /exercise=check-an-ingredient missing=grammar\.present\.does-base/,
  );
  path.requiresLessons = [cusco];
  const issues = checkPrerequisites([file], curriculum);
  assert.equal(issues.length, 2);
  assert.match(
    issues[0],
    /chapter=colombia .*prerequisite=lq-cusco-past\.past-irreg Must reference an earlier/,
  );
});

test('invalid forms, cosmetic exceptions and unvisited exercises fail validation', () => {
  const file = draft();
  const lesson = file.lessons[2];
  const stage = lesson.stages.find((stage) => stage.id === 'retell-sighting');
  assert.ok(stage?.type === 'exercise');
  stage.requires.push({ id: 'lex.see.vision', form: 'seed' });
  stage.supports?.push({
    use: 'inferable',
    target: { id: 'lex.see.vision', form: 'saw' },
    reasonEs: 'Se intenta excluir la forma que se califica.',
  });
  lesson.stages.push({ id: 'hidden-check', type: 'exercise', requires: stage.requires });
  const issues = checkPrerequisites([file], curriculum);
  assert.equal(issues.length, 5);
  assert.ok(
    issues.some((issue) => issue.includes('lex.see.vision[seed] Unknown target or invalid form')),
  );
  assert.ok(issues.some((issue) => issue.includes('lex.see.vision[saw] A required target cannot')));
  assert.ok(issues.some((issue) => issue.includes('stage=hidden-check Stage absent')));
  assert.throws(() =>
    prerequisiteFileSchema.parse({
      ...file,
      lessons: [{ ...lesson, stages: [{ id: 'undeclared-check', type: 'exercise' }] }],
    }),
  );
});
