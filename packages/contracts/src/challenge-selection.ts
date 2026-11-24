import type { PublicExercise } from './index.ts';

type ChallengeType = 'grammar_rush' | 'cloze_battle' | 'reading_quest';
type ChallengeItem = PublicExercise & { ungradable?: unknown };

const isTravelScenario = (item: ChallengeItem) => item.id.startsWith('challenge_travel_');

export function challengeQuestionCount(type: ChallengeType) {
  return type === 'grammar_rush' ? 10 : type === 'cloze_battle' ? 5 : 4;
}

export function challengeRequiredUnit(grammar: readonly ChallengeItem[], level: number) {
  if (!grammar.some(isTravelScenario)) return 'u02';
  if (level >= 13) return 'u08';
  if (level >= 11) return 'u06';
  if (level >= 9) return 'u04';
  return 'u02';
}

export function selectChallengeQuestions<T extends ChallengeItem>(
  pool: readonly T[],
  type: ChallengeType,
  level: number,
  eligible: (item: T) => boolean,
) {
  const count = challengeQuestionCount(type);
  const items = pool.filter((item) => !item.ungradable && eligible(item));
  const routines = items.filter((item) => !isTravelScenario(item));
  const scenarios = items.filter(isTravelScenario);
  const nearest = (target: number) =>
    [...routines].sort((a, b) => Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target));

  if (level >= 9 && pool.some(isTravelScenario)) {
    const past = scenarios.filter((item) => item.difficulty === 9 || item.difficulty === 10);
    const plans = scenarios.filter((item) => item.difficulty === 11 || item.difficulty === 12);
    const arrival = scenarios.filter((item) => item.difficulty === 13);
    const recap = Math.max(1, Math.floor(count / 4));
    if (level === 9) return [...nearest(8).slice(0, recap), ...past.slice(0, count - recap)];
    if (level === 10) return past.slice(0, count);
    if (level === 11) return [...past.slice(-recap), ...plans.slice(0, count - recap)];
    if (level === 12) return plans.slice(0, count);
    return arrival.slice(0, count);
  }

  const rank = Math.min(level, 8);
  if (type === 'grammar_rush') {
    const staged = [...routines].sort((a, b) => a.difficulty - b.difficulty);
    const start = Math.round(((rank - 1) * Math.max(0, staged.length - count)) / 7);
    return staged.slice(start, start + count);
  }

  // Mix neighboring routines between anchors. / Combina las rutinas vecinas entre niveles base.
  const anchors = [...new Set(routines.map(({ difficulty }) => difficulty))].sort((a, b) => a - b);
  const lower = [...anchors].reverse().find((difficulty) => difficulty <= rank);
  const upper = anchors.find((difficulty) => difficulty >= rank);
  if (lower === undefined || upper === undefined || lower === upper)
    return nearest(rank).slice(0, count);
  const towardUpper = Math.round(((rank - lower) / (upper - lower)) * count);
  return [
    ...routines.filter((item) => item.difficulty === lower).slice(0, count - towardUpper),
    ...routines.filter((item) => item.difficulty === upper).slice(0, towardUpper),
  ];
}
