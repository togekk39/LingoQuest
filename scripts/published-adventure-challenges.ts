import { canonicalStringify, sha256Hex } from '@lingoquest/course-pack';
import type { CourseData, CourseExercise } from '../packages/offline-engine/src';
import {
  reviewedChallengeRequirements,
  type AdventureChallengeReview,
  type ChallengeType,
} from '../packages/offline-engine/src/challenge-learning';
import type { UnifiedEvidenceTarget } from '../packages/offline-engine/src/learning-evidence';
import {
  formalDefinitions,
  teachingReferenceKey,
  type TeachingReference,
} from '../packages/offline-engine/src/learning-prerequisites';
import { canonicalLearningId } from '../packages/offline-engine/src/learning-registry';
import { optionalAssessmentEnglish } from './published-optional-prerequisites';
import { adventureTokens } from './published-adventure-prerequisites';

type Practice = { exercise: CourseExercise; targets: readonly UnifiedEvidenceTarget[] };
type ChallengeCurriculum = {
  chapterId: string;
  pools: CourseData['challengePools'];
  reviews: Readonly<Record<string, AdventureChallengeReview>>;
  definitions: ReturnType<typeof formalDefinitions>;
  taught: ReadonlySet<string>;
  practice: readonly Practice[];
  properNames: readonly string[];
};

export function inspectAdventureChallenges({
  chapterId,
  pools,
  reviews,
  definitions,
  taught,
  practice,
  properNames,
}: ChallengeCurriculum) {
  const issues: string[] = [];
  const used = new Set<string>();
  const names = properNames.flatMap(adventureTokens);
  for (const [mode, items] of Object.entries(pools) as [ChallengeType, CourseExercise[]][]) {
    for (const exercise of items) {
      const location = `chapter=${chapterId} mode=${mode} exercise=${exercise.id}`;
      if (used.has(exercise.id)) issues.push(`${location} Duplicate ID / ID duplicado`);
      used.add(exercise.id);
      const review = Object.hasOwn(reviews, exercise.id) ? reviews[exercise.id] : undefined;
      if (review?.digest !== sha256Hex(canonicalStringify(exercise))) {
        issues.push(`${location} Unreviewed challenge material / Material del reto sin revisar`);
        continue;
      }
      const requires = reviewedChallengeRequirements(exercise, 'adventure', definitions, review);
      if (!requires?.length) {
        issues.push(
          `${location} Missing or invalid exact reference / Referencia exacta faltante o inválida`,
        );
        continue;
      }
      const kinds = new Set(requires.map(({ id }) => definitions.get(id)?.kind));
      for (const kind of ['lexical', 'pattern', 'grammar'] as const)
        if (!kinds.has(kind))
          issues.push(`${location} Missing ${kind} dependency / Falta requisito ${kind}`);
      for (const ref of requires)
        if (!taught.has(teachingReferenceKey(ref)))
          issues.push(
            `${location} Untaught requirement / Requisito sin enseñar: ${teachingReferenceKey(ref)}`,
          );

      const permitted = new Set([
        ...names,
        ...requires.flatMap(({ id, form }: TeachingReference) =>
          definitions.get(id)?.kind === 'lexical' ? adventureTokens(form ?? '') : [],
        ),
      ]);
      const words = [
        ...optionalAssessmentEnglish(exercise),
        ...(!exercise.options ? exercise.acceptedAnswers : []),
      ].flatMap(adventureTokens);
      const uncovered = [...new Set(words.filter((word) => !permitted.has(word)))];
      if (uncovered.length)
        issues.push(
          `${location} Unannotated vocabulary / Vocabulario sin anotar: ${uncovered.join(', ')}`,
        );

      const hasOptions = !!exercise.options?.length;
      const validMode =
        mode === 'reading_quest'
          ? hasOptions && !!exercise.passage && exercise.learning?.skill === 'reading'
          : mode === 'cloze_battle'
            ? !hasOptions &&
              exercise.type === 'cloze' &&
              exercise.dimension === 'grammar_production'
            : hasOptions &&
              exercise.type === 'single_choice' &&
              exercise.dimension === 'grammar_understanding';
      if (!validMode)
        issues.push(`${location} Incompatible challenge format / Formato de reto incompatible`);
      const sameTarget = new Set([
        exercise.skillId,
        ...requires.flatMap(({ id }) =>
          definitions.get(id)?.kind === 'pattern' ? [canonicalLearningId(id)] : [],
        ),
      ]);
      const normalPractice = practice.some(({ exercise: item, targets }) =>
        targets.some(({ targetId, dimension }) => {
          if (!sameTarget.has(targetId)) return false;
          if (mode === 'reading_quest') return dimension === 'reading' && !!item.passage;
          const typed =
            !item.options?.length && ['short_text', 'cloze', 'correction'].includes(item.type);
          return (
            (mode === 'grammar_rush' || typed) &&
            ['grammar_understanding', 'grammar_production', 'writing'].includes(dimension)
          );
        }),
      );
      if (!normalPractice)
        issues.push(
          `${location} No matching independent practice / Falta práctica independiente correspondiente`,
        );
    }
  }
  for (const id of Object.keys(reviews))
    if (!used.has(id))
      issues.push(
        `chapter=${chapterId} exercise=${id} Review without material / Revisión sin material`,
      );
  return { issues, items: used.size };
}
