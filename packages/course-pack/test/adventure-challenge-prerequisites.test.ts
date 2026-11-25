import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalStringify, sha256Hex, type RpgAdventureAudit } from '@lingoquest/course-pack';
import { inspectAdventureChallenges } from '../../../scripts/published-adventure-challenges';
import { inspectAdventurePrerequisites } from '../../../scripts/published-adventure-prerequisites';
import type { CourseExercise } from '../../offline-engine/src';
import {
  formalDefinitions,
  rpgAssessmentDigest,
  rpgTeachingDigest,
  teachingReferenceKey,
} from '../../offline-engine/src/learning-prerequisites';
import type {
  TravelChapter,
  TravelExerciseStep,
  TravelStep,
  TravelVocabulary,
} from '../../offline-engine/src/travel-content';

const grammar = { id: 'grammar.test.adjective' };
const pattern = { id: 'pattern.test.adjective', form: 'it is + adjective' };
const adjective = { id: 'lex.test.open.adjective', form: 'open' };
const verb = { id: 'lex.test.open.verb', form: 'open' };
const frame = { id: 'form.test.it-is', form: 'it is' };
const definitions = formalDefinitions(
  { lessons: {} },
  [],
  [
    { ...grammar, kind: 'grammar', labelEs: 'Adjetivos', forms: [], examples: [] },
    { id: pattern.id, kind: 'pattern', labelEs: 'Estado', forms: [pattern.form], examples: [] },
    {
      id: adjective.id,
      kind: 'lexical',
      labelEs: 'abierto',
      forms: [adjective.form],
      examples: [],
    },
    { id: verb.id, kind: 'lexical', labelEs: 'abrir', forms: [verb.form], examples: [] },
    { id: frame.id, kind: 'lexical', labelEs: 'Está', forms: [frame.form], examples: [] },
  ],
);
const exercise: CourseExercise = {
  id: 'posted-hours',
  type: 'short_text',
  promptEs: 'Escribe que está abierto.',
  acceptedAnswers: ['It is open.'],
  feedbackEs: 'It is open significa que está abierto.',
  skillId: grammar.id,
  difficulty: 1,
  dimension: 'grammar_production',
};
const assessment: TravelExerciseStep = {
  id: exercise.id,
  type: 'exercise',
  situation: 'Lee el letrero.',
  exercise,
  lessonId: 'test-lesson',
  requires: [grammar, pattern, adjective, frame],
  targets: [{ targetId: grammar.id, dimension: 'grammar_production' }],
};
const word: TravelVocabulary = {
  term: 'open',
  meaning: 'abierto',
  explanation: 'En este letrero puedes entrar.',
  kind: 'Adjetivo',
  example: { en: 'It is open.', es: 'Está abierto.' },
  teaches: [adjective],
};
const instruction: Extract<TravelStep, { type: 'teach' }> = {
  id: 'teach-posted-hours',
  type: 'teach',
  title: 'Lee un letrero',
  text: 'It is y un adjetivo indican un estado.',
  examples: [{ en: 'It is open.', es: 'Está abierto.' }],
  instruction: { lessonId: 'test-lesson', stage: 'both', references: [grammar, pattern, frame] },
  vocabularyTerms: ['open'],
};
const chapter: TravelChapter = {
  id: 'test-adventure',
  revision: 1,
  title: 'En el barrio',
  stamp: 'En el barrio',
  postcard: 'Una visita',
  message: 'Hola.',
  collectible: 'Un mapa',
  missions: [
    {
      id: 'read-hours',
      title: 'Lee el letrero',
      place: 'La plaza',
      objective: 'Indica el horario.',
      minutes: [1, 2],
      success: 'Ya puedes entrar.',
      vocabulary: [word],
      steps: [instruction, assessment],
    },
  ],
};
const audit: RpgAdventureAudit = {
  definitions: [],
  teaching: { [instruction.id]: rpgTeachingDigest(instruction, [word]) },
  assessments: { [assessment.id]: rpgAssessmentDigest(assessment) },
};
const evaluate = (candidate = chapter, review = audit, priorTeaching = new Set<string>()) =>
  inspectAdventurePrerequisites({
    chapter: candidate,
    practice: [],
    audit: review,
    definitions,
    priorTeaching,
    properNames: [],
  });

test('adventure prerequisites require visible instruction, exact senses, and teaching before assessment', () => {
  assert.deepEqual(evaluate().issues, []);
  const [mission] = chapter.missions;
  const changed = (updates: Partial<typeof mission>) => ({
    ...chapter,
    missions: [{ ...mission, ...updates }],
  });
  const later = evaluate(changed({ steps: [assessment, instruction] }));
  assert.match(later.issues.join('\n'), /Untaught requirements.*lex\.test\.open\.adjective/);
  assert.deepEqual(later.independent, []);

  const removed = { ...instruction, text: 'Un adjetivo indica un estado.', examples: [] };
  const removedDigest = rpgTeachingDigest(removed, []);
  const noMaterial = evaluate(
    changed({ vocabulary: [], steps: [removed, assessment] }),
    { ...audit, teaching: { [removed.id]: removedDigest } },
    new Set([teachingReferenceKey(verb)]),
  );
  assert.match(noMaterial.issues.join('\n'), /Missing visible vocabulary/);
  assert.match(noMaterial.issues.join('\n'), /Missing shown form.*form\.test\.it-is/);
  assert.match(noMaterial.issues.join('\n'), /Untaught requirements.*lex\.test\.open\.adjective/);

  const wrongForm = {
    ...assessment,
    requires: [grammar, pattern, { ...adjective, form: 'opened' }, frame],
  };
  const invalid = evaluate(changed({ steps: [instruction, wrongForm] }), {
    ...audit,
    assessments: { [wrongForm.id]: rpgAssessmentDigest(wrongForm) },
  });
  assert.match(invalid.issues.join('\n'), /Unreviewed assessment/);
});

test('adventure challenge audit checks implicit words and the required independent response format', () => {
  const cloze: CourseExercise = {
    ...exercise,
    id: 'challenge-posted-hours',
    type: 'cloze',
    sentence: 'It is ___.',
    acceptedAnswers: ['open'],
  };
  const digest = sha256Hex(canonicalStringify(cloze));
  const rehearsed = evaluate();
  const inspect = (
    requires: NonNullable<typeof assessment.requires>,
    practice = rehearsed.independent,
  ) =>
    inspectAdventureChallenges({
      chapterId: chapter.id,
      pools: { grammar_rush: [], cloze_battle: [cloze], reading_quest: [] },
      reviews: { [cloze.id]: { digest, requires } },
      definitions,
      taught: rehearsed.taught,
      practice: practice.map(({ exercise, targets }) => ({ exercise, targets: targets ?? [] })),
      properNames: [],
    });
  assert.deepEqual(inspect(assessment.requires!).issues, []);
  assert.match(
    inspect([grammar, pattern, adjective]).issues.join('\n'),
    /Unannotated vocabulary.*it, is/,
  );
  assert.match(
    inspect([grammar, pattern, verb, frame]).issues.join('\n'),
    /Untaught requirement.*lex\.test\.open\.verb/,
  );
  const choices: TravelExerciseStep = {
    ...assessment,
    exercise: { ...exercise, type: 'single_choice', options: [{ id: 'a', text: 'open' }] },
  };
  assert.match(
    inspect(assessment.requires!, [choices]).issues.join('\n'),
    /No matching independent practice/,
  );
});
