import {
  equivalentAnswerText,
  judgeAnswer,
  type Answer,
  type AnswerOutcome,
} from '@lingoquest/contracts';
import { unifiedMasteryKey, type UnifiedEvidenceTarget } from './learning-evidence';
import type { TravelExerciseStep } from './travel-content';

export interface RpgAnswerEvidence {
  answers: readonly string[];
  targets: readonly UnifiedEvidenceTarget[];
}

function matchingGroups(groups: readonly RpgAnswerEvidence[], text: string) {
  return groups.filter(({ answers }) => answers.some((model) => equivalentAnswerText(text, model)));
}

export function exactRpgAnswerEvidence(step: TravelExerciseStep) {
  const groups = step.answerEvidence;
  if (!groups) return true;
  const exercise = step.exercise;
  if (
    !groups.length ||
    exercise.options ||
    exercise.ungradable ||
    exercise.spelling ||
    exercise.introduction ||
    step.scenarioTurn ||
    !['short_text', 'cloze', 'correction', 'reorder'].includes(exercise.type)
  )
    return false;
  const declared = new Set(step.targets?.map(unifiedMasteryKey));
  return (
    groups.every(({ answers, targets }) => {
      const keys = targets.map(unifiedMasteryKey);
      return (
        !!answers.length &&
        !!keys.length &&
        new Set(keys).size === keys.length &&
        keys.every((key) => declared.has(key)) &&
        answers.every((text) => judgeAnswer(exercise, { text }) === 'target')
      );
    }) && exercise.acceptedAnswers.every((text) => matchingGroups(groups, text).length === 1)
  );
}

export function rpgAnswerTargets(
  step: TravelExerciseStep,
  answer: Answer,
  outcome: AnswerOutcome,
): UnifiedEvidenceTarget[] {
  const groups = step.answerEvidence;
  if (!groups) return [...(step.targets ?? [])];
  if (outcome === 'target') {
    const text = answer.text ?? answer.tokens?.join(' ');
    const matched = text ? matchingGroups(groups, text) : [];
    return matched.length === 1 ? [...matched[0].targets] : [];
  }
  if (outcome === 'ungradable' || outcome === 'communication_only') return [];
  return (groups[0]?.targets ?? []).filter((target) =>
    groups.every(({ targets }) =>
      targets.some((entry) => unifiedMasteryKey(entry) === unifiedMasteryKey(target)),
    ),
  );
}
