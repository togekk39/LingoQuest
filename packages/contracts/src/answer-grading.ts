import type { Answer, AnswerOutcome, PublicExercise } from './index.ts';
import { matchesIntroductionName, meetsIntroduction, readIntroduction } from './introduction.ts';

export interface AnswerKey {
  acceptedAnswers: string[];
  correctOptionId?: string;
  introduction?: { greetingRequired: boolean; model: string };
  spelling?: { model: string };
  communicationOnly?: { answers: string[]; feedbackEs: string };
  ungradable?: { feedbackEs: string };
}

type GradedExercise = AnswerKey & Pick<PublicExercise, 'type' | 'options' | 'matchingPairs'>;

const negativeContractions: ReadonlyMap<string, string> = new Map([
  ["aren't", 'are not'],
  ["can't", 'cannot'],
  ["couldn't", 'could not'],
  ["didn't", 'did not'],
  ["doesn't", 'does not'],
  ["don't", 'do not'],
  ["hadn't", 'had not'],
  ["hasn't", 'has not'],
  ["haven't", 'have not'],
  ["isn't", 'is not'],
  ["mightn't", 'might not'],
  ["mustn't", 'must not'],
  ["needn't", 'need not'],
  ["shan't", 'shall not'],
  ["shouldn't", 'should not'],
  ["wasn't", 'was not'],
  ["weren't", 'were not'],
  ["won't", 'will not'],
  ["wouldn't", 'would not'],
]);

const perfectAdverbs = new Set(['already', 'always', 'ever', 'just', 'never', 'only', 'recently']);
const sharedBaseForms = new Set([
  'come',
  'cut',
  'hit',
  'hurt',
  'put',
  'read',
  'run',
  'set',
  'shut',
]);
const irregularParticiples = new Set([
  'been',
  'bought',
  'broken',
  'brought',
  'built',
  'caught',
  'chosen',
  'done',
  'driven',
  'eaten',
  'fallen',
  'felt',
  'flown',
  'forgotten',
  'found',
  'given',
  'gone',
  'got',
  'gotten',
  'grown',
  'had',
  'heard',
  'held',
  'kept',
  'known',
  'left',
  'lost',
  'made',
  'met',
  'paid',
  'said',
  'seen',
  'sent',
  'slept',
  'sold',
  'spoken',
  'spent',
  'stood',
  'taken',
  'taught',
  'thought',
  'told',
  'understood',
  'won',
  'worn',
  'written',
]);
const basesEndingInEd = new Set([
  'bleed',
  'breed',
  'embed',
  'feed',
  'heed',
  'need',
  'seed',
  'shed',
  'shred',
  'speed',
  'wed',
  'weed',
]);
const commonCopulaAdjectives = new Set(['closed', 'excited', 'interested', 'tired', 'worried']);
const perfectOnly = new Set([
  'arrived',
  'been',
  'happened',
  'occurred',
  'slept',
  'waited',
  'worked',
]);

export function normalizeAnswerText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑]/g, '-')
    .replace(/\s+([.!?,;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[¿¡]/, '')
    .replace(/[.!?]+$/, '')
    .replace(
      /(^|[.!?] )(hi|hello|hey|excuse me|good morning|good afternoon|good evening)[,.!?] +/g,
      '$1$2 ',
    )
    .replace(/(^|[.!?] )(yes|no), (?=(?:i|you|he|she|it|we|they) )/g, '$1$2 ')
    .replace(
      /(^|[.!?] )((?:if|when|before|after|unless|because|although|while|as soon as) [^,.!?]+), /g,
      '$1$2 ',
    )
    .replace(
      /(^|[.!?] )(please|usually|sometimes|today|tomorrow|yesterday|later|(?:right )?now|every day|last (?:night|week|year)|at (?:home|six|eight|noon)|in the kitchen), (?=\p{L})/gu,
      '$1$2 ',
    )
    .replace(/, please$/, ' please');
}

function expandWord(word: string, words: readonly string[], next: number): string[] {
  const bare = word.replace(/[,.!?;:]+$/, '');
  const negative = negativeContractions.get(bare);
  if (negative) return (negative + word.slice(bare.length)).split(' ');

  // Positive contractions need a following complement. / Las contracciones afirmativas necesitan un complemento después.
  if (!words[next] || !/^[\p{L}\d]/u.test(words[next])) return [word];
  const match =
    /^(i|you|he|she|it|we|they|there|that|what|where|when|why|who|how|could|might|must|should|would)('m|'re|'s|'ll|'ve|'d)$/.exec(
      word,
    );
  if (!match) return [word];
  const [, subject, ending] = match;
  const subjectPronoun = /^(?:i|you|he|she|it|we|they)$/.test(subject);
  const modal = /^(?:could|might|must|should|would)$/.test(subject);
  if (ending === "'m" && subject === 'i') return [subject, 'am'];
  if (ending === "'re" && /^(?:you|we|they|there|what|where|who|how)$/.test(subject))
    return [subject, 'are'];
  if (ending === "'ll" && !modal) return [subject, 'will'];

  let verbIndex = next;
  while (perfectAdverbs.has(words[verbIndex])) verbIndex++;
  const verb = words[verbIndex]?.match(/^([a-z]+)(?:[,.!?;:]|$)/)?.[1] ?? '';
  const following = words[verbIndex + 1] ?? '';
  const distinctParticiple =
    irregularParticiples.has(verb) || (verb.endsWith('ed') && !basesEndingInEd.has(verb));
  const participle = distinctParticiple || sharedBaseForms.has(verb);
  if (ending === "'ve" && (['i', 'you', 'we', 'they'].includes(subject) || modal) && participle)
    return [subject, 'have'];
  if (ending === "'d" && (subjectPronoun || subject === 'there' || subject === 'that')) {
    if (distinctParticiple || verb === 'better') return [subject, 'had'];
    return [subject, 'would'];
  }
  if (ending === "'s" && !/^(?:i|you|we|they)$/.test(subject) && !modal) {
    const objectFollows =
      /^(?:me|you|him|her|it|us|them|my|your|his|its|our|their|the|an?|this|that|these|those)\b/.test(
        following,
      );
    if (commonCopulaAdjectives.has(verb)) return [subject, 'is'];
    if (perfectOnly.has(verb) || (participle && objectFollows)) return [subject, 'has'];
    if (!participle || /^(?:by|of)\b/.test(following)) return [subject, 'is'];
  }
  return [word];
}

function expanded(value: string): string {
  const words = value.split(' ');
  return words.flatMap((word, position) => expandWord(word, words, position + 1)).join(' ');
}

export function equivalentAnswerText(answer: string, model: string): boolean {
  const actual = normalizeAnswerText(answer);
  const expected = normalizeAnswerText(model);
  return !!actual && (actual === expected || expanded(actual) === expanded(expected));
}

export function spellingModel(name: string) {
  return (
    name
      .normalize('NFC')
      .match(/\p{L}\p{M}*/gu)
      ?.join(' – ') ?? ''
  );
}

function comparableSpelling(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}]/gu, '');
}

export function judgeAnswer(
  exercise: GradedExercise,
  answer: Answer,
  playerName?: string,
): AnswerOutcome {
  if (exercise.ungradable) return 'ungradable';
  if (exercise.spelling) {
    if (!playerName) return 'ungradable';
    const response = answer.text?.trim();
    return response &&
      /^[\p{L}\p{M}\s.,'’‘ʼ·・\/\-‐‑–]+$/u.test(response) &&
      comparableSpelling(response) === comparableSpelling(playerName)
      ? 'target'
      : 'incorrect';
  }
  if (exercise.introduction) {
    if (answer.text === undefined) return 'incorrect';
    const response = readIntroduction(answer.text, false, playerName);
    if (playerName && response.name && !matchesIntroductionName(response.name, playerName))
      return 'incorrect';
    if (meetsIntroduction(response, exercise.introduction.greetingRequired)) return 'target';
    return response.form === 'alternative' &&
      (response.greeting || !exercise.introduction.greetingRequired) &&
      exercise.communicationOnly
      ? 'communication_only'
      : 'incorrect';
  }
  if (exercise.type === 'matching') {
    const pairs = exercise.matchingPairs ?? [];
    const matches = answer.matches;
    if (!pairs.length) return 'ungradable';
    return matches &&
      Object.keys(matches).length === pairs.length &&
      pairs.every((pair) => Object.hasOwn(matches, pair.id) && matches[pair.id] === pair.id)
      ? 'target'
      : 'incorrect';
  }
  if (exercise.options || ['single_choice', 'meaning'].includes(exercise.type)) {
    const correct = exercise.correctOptionId;
    if (!correct || !exercise.options?.some((option) => option.id === correct)) return 'ungradable';
    return answer.optionId === correct ? 'target' : 'incorrect';
  }
  if (!exercise.acceptedAnswers.length) return 'ungradable';
  const response =
    answer.text ?? (exercise.type === 'reorder' ? answer.tokens?.join(' ') : undefined);
  if (!response) return 'incorrect';
  if (exercise.acceptedAnswers.some((model) => equivalentAnswerText(response, model)))
    return 'target';
  return exercise.communicationOnly?.answers.some((model) => equivalentAnswerText(response, model))
    ? 'communication_only'
    : 'incorrect';
}
