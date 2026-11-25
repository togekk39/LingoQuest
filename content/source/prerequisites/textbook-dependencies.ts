import { canonicalStringify, sha256Hex } from '@lingoquest/course-pack';
import type { PublicLesson } from '@lingoquest/contracts';
import type {
  PrerequisiteFile,
  PrerequisiteReference,
} from '../../../packages/course-pack/src/prerequisites';
import { textbookPatterns } from './textbook-patterns';
import { textbookReview } from './textbook-review';

type Target = PrerequisiteFile['targets'][number];
type LexicalTarget = Extract<Target, { kind: 'lexical' }>;
type PatternTarget = Extract<Target, { kind: 'pattern' }>;

export const lexical = (id: string, en: string, es: string): LexicalTarget => ({
  id,
  kind: 'lexical',
  lemma: en,
  senseEs: es,
  forms: [en],
});

export function formalTargetReference(target: Target): PrerequisiteReference {
  return target.kind === 'grammar' ? { id: target.id } : { id: target.id, form: target.forms[0] };
}

export function textbookFormalTargets(
  lesson: Pick<PublicLesson, 'id' | 'vocabulary'> & {
    grammar: NonNullable<PublicLesson['grammar']>;
  },
) {
  const vocabulary = (lesson.vocabulary ?? []).map((item) =>
    lexical('lex.' + item.id, item.en, item.es),
  );
  const forms = (lesson.grammar.taughtForms ?? []).map(({ en, es }, index) =>
    lexical(`form.${lesson.id}.${index + 1}`, en, es),
  );
  const grammar: Extract<Target, { kind: 'grammar' }> = {
    id: lesson.grammar.skillId,
    kind: 'grammar',
    descriptionEs: lesson.grammar.explanationEs,
  };
  const patterns = (textbookPatterns[lesson.id]?.patterns ?? []).map(
    ([id, form]): PatternTarget => ({
      id: `pattern.${lesson.id}.${id}`,
      kind: 'pattern',
      descriptionEs: form,
      forms: [form],
    }),
  );
  return { vocabulary, forms, grammar, patterns };
}

export const textbookExerciseDigest = (exercise: unknown) =>
  sha256Hex(canonicalStringify(exercise));

export const textbookTeachingDigest = (lesson: Pick<PublicLesson, 'vocabulary' | 'grammar'>) =>
  sha256Hex(canonicalStringify({ vocabulary: lesson.vocabulary, grammar: lesson.grammar }));

export function textbookExerciseDependencies(
  lessonId: string,
  exercise: { id: string; type: string; skillId: string; vocabularyIds?: readonly string[] },
  reference: (id: string) => PrerequisiteReference,
) {
  const lexicalRecognition = exercise.type === 'meaning' || exercise.type === 'matching';
  const indexedPractice = textbookReview[lessonId]?.practice[exercise.id];
  if (!lexicalRecognition && !indexedPractice) return undefined;
  const vocabularyAndForms = lexicalRecognition
    ? (exercise.vocabularyIds ?? []).map((id) => reference(`lex.${id}`))
    : (indexedPractice?.vocabularyAndForms ?? []).map(([id, form]) => ({ id, form }));
  const patterns = (indexedPractice?.patterns ?? []).map((id) =>
    reference(`pattern.${lessonId}.${id}`),
  );
  return {
    lexicalRecognition,
    vocabularyAndForms,
    patterns,
    grammar: patterns.length ? { id: exercise.skillId } : undefined,
  };
}
