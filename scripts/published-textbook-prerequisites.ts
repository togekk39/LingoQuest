import {
  canonicalStringify,
  sha256Hex,
  type CourseExercise,
  type CourseLesson,
} from '@lingoquest/course-pack';
import { textbookPatterns } from '../content/source/prerequisites/textbook-patterns';
import { textbookReview } from '../content/source/prerequisites/textbook-review';
import type { PrerequisiteFile } from '../packages/course-pack/src/prerequisites';

type Target = PrerequisiteFile['targets'][number];
type LexicalTarget = Extract<Target, { kind: 'lexical' }>;
type PatternTarget = Extract<Target, { kind: 'pattern' }>;
type Lesson = PrerequisiteFile['lessons'][number];
type Stage = Lesson['stages'][number];
type Reference = Extract<Stage, { type: 'exercise' }>['requires'][number];

const lexical = (id: string, en: string, es: string): LexicalTarget => ({
  id,
  kind: 'lexical',
  lemma: en,
  senseEs: es,
  forms: [en],
});

export function textbookFormalTargets(lesson: CourseLesson) {
  const vocabulary = lesson.vocabulary.map((item) => lexical('lex.' + item.id, item.en, item.es));
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

function reference(target: Target): Reference {
  return target.kind === 'grammar' ? { id: target.id } : { id: target.id, form: target.forms[0] };
}

export function textbookExerciseEnglish(exercise: CourseExercise) {
  return [
    exercise.sentence ?? '',
    exercise.passage ?? '',
    ...(exercise.tokens ?? []),
    ...(exercise.matchingPairs ?? []).map(({ left }) => left),
    ...(exercise.optionsLanguage !== 'es' ? (exercise.options ?? []).map(({ text }) => text) : []),
    ...(!exercise.options && exercise.type !== 'matching' ? exercise.acceptedAnswers : []),
  ];
}

export function textbookTokens(text: string) {
  return (
    text
      .normalize('NFC')
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .match(/[a-z]+(?:'[a-z]+)*/g) ?? []
  );
}

export const textbookExerciseDigest = (exercise: CourseExercise) =>
  sha256Hex(canonicalStringify(exercise));

export const textbookTeachingDigest = (lesson: CourseLesson) =>
  sha256Hex(canonicalStringify({ vocabulary: lesson.vocabulary, grammar: lesson.grammar }));

export function buildTextbookPrerequisites(lessons: readonly CourseLesson[]) {
  const targets = new Map<string, Target>();
  const traces: Lesson[] = [];
  const issues: string[] = [];
  let exerciseCount = 0;
  const add = (target: Target) => {
    const previous = targets.get(target.id);
    if (previous && canonicalStringify(previous) !== canonicalStringify(target))
      issues.push(`target=${target.id} El significado cambió / Target sense changed`);
    targets.set(target.id, target);
    return reference(target);
  };
  const formal = new Map(lessons.map((lesson) => [lesson.id, textbookFormalTargets(lesson)]));
  for (const sources of formal.values())
    [...sources.vocabulary, ...sources.forms, sources.grammar, ...sources.patterns].forEach(add);

  for (const lesson of lessons) {
    const id = lesson.id;
    const location = 'lesson=' + id;
    const reviewed = textbookReview[id];
    const patterns = textbookPatterns[id];
    const sources = formal.get(id)!;
    if (!reviewed || !patterns) {
      issues.push(`${location} Falta anotación del curso / Missing textbook annotation`);
      continue;
    }
    if (textbookTeachingDigest(lesson) !== reviewed.teaching)
      issues.push(`${location} Revisa la enseñanza modificada / Review changed formal teaching`);

    const presentPatterns = sources.patterns.filter((target, index) => {
      const example = patterns.patterns[index][2];
      const formalEvidence = [...(lesson.grammar.taughtForms ?? []), ...lesson.grammar.examples];
      if (formalEvidence.some(({ en }) => en === example)) return true;
      issues.push(
        `${location} pattern=${target.id} Falta un ejemplo formal / Missing formal example: ${example}`,
      );
      return false;
    });

    const stages: Stage[] = [];
    const exerciseIds = new Set<string>();
    for (const runtimeStage of lesson.stages) {
      if (runtimeStage.type === 'vocabulary' && sources.vocabulary.length)
        stages.push({
          id: 'teach-vocabulary',
          type: 'teach',
          teaches: sources.vocabulary.map(reference),
          instructionEs: lesson.vocabulary[0].es,
          exampleEn: lesson.vocabulary[0].example.en,
        });
      if (runtimeStage.type === 'grammar')
        stages.push({
          id: 'teach-grammar',
          type: 'teach',
          teaches: [sources.grammar, ...sources.forms, ...presentPatterns].map(reference),
          instructionEs: lesson.grammar.explanationEs,
          exampleEn: lesson.grammar.examples[0]?.en ?? lesson.grammar.explanationEs,
        });
      if (runtimeStage.type === 'dialogue' && lesson.dialogue.length)
        stages.push({
          id: 'dialogue-preview',
          type: 'preview',
          text: lesson.dialogue.map(({ en }) => en).join('\n'),
        });

      for (const exerciseId of runtimeStage.exerciseIds ?? []) {
        const item = lesson.exercises.find(({ id }) => id === exerciseId);
        if (!item) {
          issues.push(`${location} exercise=${exerciseId} Falta ejercicio / Missing exercise`);
          continue;
        }
        exerciseCount++;
        exerciseIds.add(exerciseId);
        const locationWithItem = `${location} exercise=${exerciseId}`;
        if (reviewed.exercises[exerciseId] !== textbookExerciseDigest(item))
          issues.push(
            `${locationWithItem} Revisa el ejercicio modificado / Review changed exercise`,
          );

        const lexicalRecognition = item.type === 'meaning' || item.type === 'matching';
        const indexedPractice = reviewed.practice[exerciseId];
        if (!lexicalRecognition && !indexedPractice) {
          issues.push(
            `${locationWithItem} Faltan requisitos del ejercicio / Missing exercise dependencies`,
          );
          continue;
        }
        const practiceReferences: Reference[] = lexicalRecognition
          ? item.vocabularyIds.map((word) => {
              const targetId = 'lex.' + word;
              const target = targets.get(targetId);
              return target ? reference(target) : { id: targetId };
            })
          : indexedPractice!.vocabularyAndForms.map(([targetId, form]) => ({ id: targetId, form }));
        const requiredPatterns = indexedPractice?.patterns ?? [];
        const needsGrammar = requiredPatterns.length > 0;
        if (!lexicalRecognition && item.dimension !== 'vocabulary_recall' && !needsGrammar)
          issues.push(
            `${locationWithItem} Falta un patrón evaluado / Missing assessed sentence pattern`,
          );
        if (!practiceReferences.length)
          issues.push(
            `${locationWithItem} Falta un requisito léxico / Missing lexical requirement`,
          );
        const requires = [
          ...practiceReferences,
          ...requiredPatterns.map((key) => {
            const target = targets.get(`pattern.${id}.${key}`);
            return target ? reference(target) : { id: `pattern.${id}.${key}` };
          }),
          ...(needsGrammar ? [{ id: item.skillId }] : []),
        ];

        const supports: NonNullable<Extract<Stage, { type: 'exercise' }>['supports']> = [];
        const allowedWords = new Set(
          practiceReferences.flatMap(({ form }) => textbookTokens(form ?? '')),
        );
        const requiredWords = new Set(
          item.options || item.type === 'matching'
            ? []
            : item.acceptedAnswers.flatMap(textbookTokens),
        );
        for (const [index, glossary] of (item.contextualGlosses ?? []).entries()) {
          const extra = textbookTokens(glossary.en);
          if (
            extra.some((word) => requiredWords.has(word) && !allowedWords.has(word)) ||
            practiceReferences.some(
              ({ form }) => textbookTokens(form ?? '').join(' ') === extra.join(' '),
            )
          )
            issues.push(
              `${locationWithItem} Un apoyo no enseña la respuesta / Support cannot teach an answer`,
            );
          const target = add(
            lexical(`support.${exerciseId}.${index + 1}`, glossary.en, glossary.es),
          );
          supports.push({ use: 'gloss', target, reasonEs: 'Glosa visible junto al ejercicio.' });
          extra.forEach((word) => allowedWords.add(word));
        }
        const seenWords = new Set(textbookExerciseEnglish(item).flatMap(textbookTokens));
        for (const [index, name] of (lesson.properNames ?? []).entries()) {
          const tokens = textbookTokens(name);
          if (!tokens.some((word) => seenWords.has(word))) continue;
          const target = add(lexical(`context.${id}.name-${index + 1}`, name, 'nombre propio'));
          supports.push({
            use: 'inferable',
            target,
            reasonEs: 'Nombre propio dado en la situación.',
          });
          tokens.forEach((word) => allowedWords.add(word));
        }
        const unknown = [...seenWords].filter((word) => !allowedWords.has(word));
        if (unknown.length)
          issues.push(
            `${locationWithItem} Vocabulario sin requisito anotado / Vocabulary has no annotated requirement: ${unknown.join(', ')}`,
          );
        if (!requires.length) continue;
        stages.push({
          id: exerciseId,
          type: 'exercise',
          mode: lexicalRecognition || item.type === 'reorder' ? 'guided' : 'independent',
          requires,
          ...(supports.length && { supports }),
        });
      }
    }
    for (const { id: exerciseId } of lesson.exercises)
      if (!exerciseIds.has(exerciseId))
        issues.push(
          `${location} exercise=${exerciseId} Ejercicio fuera de la secuencia / Exercise absent from path`,
        );
    for (const exerciseId of Object.keys(reviewed.exercises))
      if (!exerciseIds.has(exerciseId))
        issues.push(
          `${location} exercise=${exerciseId} Anotación sin ejercicio / Annotation without exercise`,
        );
    traces.push({
      id,
      chapterId: 'textbook',
      stages,
      paths: ['direct-study', 'lesson-review'].map((id) => ({
        id,
        requiresLessons: [],
        stages: stages.map((stage) => stage.id),
      })),
    });
  }
  return { targets: [...targets.values()], traces, exerciseCount, issues };
}
