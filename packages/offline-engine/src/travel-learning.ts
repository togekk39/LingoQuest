import { z } from 'zod';
import {
  learningErrorSchema,
  type Answer,
  type ExerciseType,
  type LearningError,
} from '@lingoquest/contracts';
export { learningErrorSchema, type LearningError } from '@lingoquest/contracts';

const skills = ['vocabulary', 'grammar', 'listening', 'reading', 'writing', 'speaking'] as const;
const stages = ['recognition', 'understanding', 'recall', 'production', 'transfer'] as const;
const aids = ['none', 'guided', 'hint', 'transcript', 'retry', 'answer_shown', 'starter'] as const;
const speechPractices = ['imitated', 'recorded'] as const;
const learningErrors = learningErrorSchema.options;
export const speechPracticeSchema = z.enum(speechPractices);

export type LearningSkill = (typeof skills)[number];
export type LearningStage = (typeof stages)[number];
export type LearningAid = (typeof aids)[number];
export type SpeechPractice = (typeof speechPractices)[number];
export type LearningReviewReason = 'remediation' | 'due' | 'practice';

export interface LearningTarget {
  conceptId: string;
  skill: LearningSkill;
  evidence: LearningStage;
  contextId: string;
  guided?: true;
  errors?: LearningError[];
  optionErrors?: Record<string, LearningError>;
  errorAnswers?: Partial<Record<LearningError, string[]>>;
  remediates?: LearningError[];
}

const count = z.number().int().nonnegative();
const iso = z.string().datetime();
const attemptsByStage = z.object({ independent: count, assisted: count }).strict();
const errorsByType = z
  .object({
    occurrences: count,
    pending: count,
    lastSeenAt: iso,
    supportedIn: z.string().max(100).optional(),
  })
  .strict();
const lastOutcomes = ['independent', 'assisted', 'incorrect'] as const;

const learningRecordSchema = z
  .object({
    conceptId: z.string().min(1).max(100),
    skill: z.enum(skills),
    attempts: count,
    successes: z.record(z.enum(stages), attemptsByStage),
    communicationSuccesses: count.optional(),
    assistance: z.record(z.enum(aids), count),
    delayedSuccesses: count,
    transferSuccesses: count,
    errors: z.record(learningErrorSchema, errorsByType),
    speakingPractice: z.record(speechPracticeSchema, count),
    seenExercises: z.record(iso),
    seenContexts: z.array(z.string().min(1).max(100)),
    lastOutcome: z.enum(lastOutcomes).optional(),
    lastExerciseId: z.string().max(100).optional(),
    lastPracticedAt: iso.optional(),
    lastEvidenceStage: z.enum(stages).optional(),
    lastDifficulty: count.optional(),
    lastDelayedSuccessAt: iso.optional(),
    intervalIndex: count.max(4),
    nextReviewAt: iso.optional(),
  })
  .strict();

export const travelLearningSchema = z
  .object({ targets: z.array(learningRecordSchema).max(10000) })
  .strict();
export type LearningRecord = z.infer<typeof learningRecordSchema>;
export type TravelLearningState = z.infer<typeof travelLearningSchema>;

const day = 24 * 60 * 60 * 1000;
const intervalDays = [1, 3, 7, 14, 30];
const stageRank: Record<LearningStage, number> = {
  recognition: 0,
  understanding: 0,
  recall: 1,
  production: 2,
  transfer: 3,
};

export const learningErrorFeedback: Record<LearningError, string> = {
  subject_omission: 'En esta frase en inglés hace falta decir quién: por ejemplo, I o it.',
  be_omission: 'Falta una forma de be. Am, is o are unen el sujeto con lo que dices de él.',
  be_agreement: 'Elige la forma de be que va con el sujeto: I am, you are, it is.',
  third_person: 'En presente simple, con he, she o it, el verbo normalmente lleva -s o -es.',
  tense: 'Fíjate en cuándo ocurre la acción y elige la forma del verbo para ese momento.',
  preposition:
    'Revisa la palabra que expresa la relación. En «junto a», por ejemplo, next to va completo.',
  article: 'El artículo va antes del sustantivo o de su descripción: the park, a blue bag.',
  word_order: 'Las palabras son adecuadas. Revisa su orden y compáralo con el ejemplo.',
  false_friend: 'Esta palabra se parece a una del español, pero su significado en inglés cambia.',
  vocabulary_sense: 'Compara el significado de esta palabra con el ejemplo de la situación.',
};

function tokens(value: string) {
  return (
    value
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/\bi'm\b/g, 'i am')
      .replace(/\b(it|he|she|where|name)'s\b/g, '$1 is')
      .replace(/\b(you|we|they)'re\b/g, '$1 are')
      .match(/[a-z0-9']+/g) ?? []
  );
}

const subjects = new Set(['i', 'you', 'it', 'he', 'she', 'we', 'they']);
const formsOfBe = new Set(['am', 'is', 'are', 'was', 'were']);
const articles = new Set(['a', 'an', 'the']);
const prepositions = new Set([
  'at',
  'by',
  'for',
  'from',
  'in',
  'near',
  'of',
  'on',
  'to',
  'under',
  'with',
  'beside',
]);
const pastBe = new Set(['was', 'were']);

function sameWords(left: string[], right: string[]) {
  return left.length === right.length && left.every((word, i) => word === right[i]);
}

function differsByToken(expected: string[], actual: string[], eligible: Set<string>) {
  return expected.some(
    (word, i) =>
      eligible.has(word) &&
      (sameWords([...expected.slice(0, i), ...expected.slice(i + 1)], actual) ||
        (actual[i] !== word &&
          eligible.has(actual[i]) &&
          sameWords([...expected.slice(0, i), actual[i], ...expected.slice(i + 1)], actual))),
  );
}

function thirdPersonForm(word: string) {
  if (word === 'have') return 'has';
  if (/[^aeiou]y$/.test(word)) return word.slice(0, -1) + 'ies';
  return word + (/(ch|sh|s|x|z|o)$/.test(word) ? 'es' : 's');
}

export function findLearningError(
  target: LearningTarget,
  answer: Answer,
  accepted: string[],
): LearningError | undefined {
  if (answer.optionId !== undefined) {
    return target.optionErrors && Object.hasOwn(target.optionErrors, answer.optionId)
      ? target.optionErrors[answer.optionId]
      : undefined;
  }
  const actual = tokens(answer.text ?? answer.tokens?.join(' ') ?? '');
  if (!actual.length) return;
  const explicit = learningErrors.find((error) =>
    target.errorAnswers?.[error]?.some((value) => sameWords(tokens(value), actual)),
  );
  if (explicit) return explicit;
  const expectedAnswers = accepted.map(tokens);
  const detectors: Partial<Record<LearningError, (expected: string[]) => boolean>> = {
    subject_omission: (expected) =>
      expected.some(
        (word, i) =>
          subjects.has(word) &&
          sameWords([...expected.slice(0, i), ...expected.slice(i + 1)], actual),
      ),
    be_omission: (expected) =>
      expected.some(
        (word, i) =>
          formsOfBe.has(word) &&
          sameWords([...expected.slice(0, i), ...expected.slice(i + 1)], actual),
      ),
    be_agreement: (expected) =>
      expected.length === actual.length &&
      expected.some(
        (word, i) =>
          formsOfBe.has(word) &&
          formsOfBe.has(actual[i]) &&
          actual[i] !== word &&
          pastBe.has(word) === pastBe.has(actual[i]) &&
          sameWords([...expected.slice(0, i), actual[i], ...expected.slice(i + 1)], actual),
      ),
    third_person: (expected) =>
      ['he', 'she', 'it'].includes(expected[0]) &&
      actual[0] === expected[0] &&
      !!actual[1] &&
      thirdPersonForm(actual[1]) === expected[1] &&
      sameWords(expected.slice(2), actual.slice(2)),
    tense: (expected) =>
      expected.length === actual.length &&
      expected.some(
        (word, i) =>
          formsOfBe.has(word) &&
          formsOfBe.has(actual[i]) &&
          pastBe.has(word) !== pastBe.has(actual[i]) &&
          sameWords([...expected.slice(0, i), actual[i], ...expected.slice(i + 1)], actual),
      ),
    preposition: (expected) => differsByToken(expected, actual, prepositions),
    article: (expected) => differsByToken(expected, actual, articles),
    word_order: (expected) =>
      !sameWords(expected, actual) && sameWords([...expected].sort(), [...actual].sort()),
  };
  return target.errors?.find((error) =>
    expectedAnswers.some((expected) => detectors[error]?.(expected)),
  );
}

export function learningKey(target: Pick<LearningRecord, 'skill' | 'conceptId'>) {
  return `${target.skill}:${target.conceptId}`;
}

function getRecord(state: TravelLearningState, target: LearningTarget) {
  const existing = state.targets.find((item) => learningKey(item) === learningKey(target));
  if (existing) return existing;
  const record: LearningRecord = {
    conceptId: target.conceptId,
    skill: target.skill,
    attempts: 0,
    successes: {},
    assistance: {},
    delayedSuccesses: 0,
    transferSuccesses: 0,
    errors: {},
    speakingPractice: {},
    seenExercises: {},
    seenContexts: [],
    intervalIndex: 0,
  };
  state.targets.push(record);
  return record;
}

export function recordSpeakingPractice(
  state: TravelLearningState,
  target: LearningTarget,
  practice: SpeechPractice,
) {
  if (target.skill !== 'speaking') return;
  const record = getRecord(state, target);
  record.speakingPractice[practice] = (record.speakingPractice[practice] ?? 0) + 1;
}

function noteExposure(record: LearningRecord, exerciseId: string, contextId: string, date: string) {
  Object.defineProperty(record.seenExercises, exerciseId, {
    value: date,
    enumerable: true,
    writable: true,
    configurable: true,
  });
  if (!record.seenContexts.includes(contextId)) record.seenContexts.push(contextId);
}

export function recordCommunicationSuccess(
  state: TravelLearningState,
  target: LearningTarget,
  exposure?: { exerciseId: string; now: number },
) {
  const record = getRecord(state, target);
  record.communicationSuccesses = (record.communicationSuccesses ?? 0) + 1;
  if (exposure)
    noteExposure(
      record,
      exposure.exerciseId,
      target.contextId,
      new Date(exposure.now).toISOString(),
    );
}

export function recordLearningAttempt(
  state: TravelLearningState,
  exercise: { id: string; type: ExerciseType; difficulty: number; learning: LearningTarget },
  correct: boolean,
  suppliedAids: LearningAid[],
  error: LearningError | undefined,
  now: number,
) {
  const target = exercise.learning;
  const record = getRecord(state, target);
  const related = state.targets.filter((item) => item.conceptId === target.conceptId);
  const previous = Object.hasOwn(record.seenExercises, exercise.id)
    ? Date.parse(record.seenExercises[exercise.id])
    : -Infinity;
  const latestConceptPractice = Math.max(
    -Infinity,
    ...related.flatMap((item) => (item.lastPracticedAt ? [Date.parse(item.lastPracticedAt)] : [])),
  );
  const novel = related.every((item) => !item.seenContexts.includes(target.contextId));
  const help = new Set(suppliedAids);
  if (target.guided || exercise.type === 'reorder') help.add('guided');
  if (now - previous < day) help.add('answer_shown');
  const independent = help.size === 0;
  if (independent) help.add('none');
  for (const aid of help) record.assistance[aid] = (record.assistance[aid] ?? 0) + 1;

  const date = new Date(now).toISOString();
  const transfer =
    target.evidence === 'transfer' && novel && Number.isFinite(latestConceptPractice);
  const baseStage: Record<LearningSkill, LearningStage> = {
    vocabulary: 'recall',
    grammar: 'production',
    listening: exercise.type === 'short_text' ? 'recall' : 'understanding',
    reading: 'understanding',
    writing: 'production',
    speaking: 'production',
  };
  const stage =
    target.evidence === 'transfer' && !transfer ? baseStage[target.skill] : target.evidence;
  const delayed =
    correct && independent && record.attempts > 0 && now - latestConceptPractice >= day;
  record.attempts++;
  if (correct) {
    const successes = (record.successes[stage] ??= { independent: 0, assisted: 0 });
    successes[independent ? 'independent' : 'assisted']++;
    if (independent && transfer) record.transferSuccesses++;
    if (delayed) {
      record.delayedSuccesses++;
      record.lastDelayedSuccessAt = date;
    }
    for (const item of related) {
      for (const tag of learningErrors) {
        const entry = item.errors[tag];
        if (!entry?.pending) continue;
        const supportExercise = target.remediates?.includes(tag);
        const confirmed =
          entry.supportedIn &&
          entry.supportedIn !== target.contextId &&
          stageRank[stage] >= stageRank.production &&
          (target.errors?.includes(tag) || target.errorAnswers?.[tag]);
        if (independent && (supportExercise || confirmed)) {
          entry.pending = 0;
          delete entry.supportedIn;
        } else if (supportExercise) entry.supportedIn = target.contextId;
      }
    }
  } else if (error) {
    const entry = (record.errors[error] ??= { occurrences: 0, pending: 0, lastSeenAt: date });
    entry.occurrences++;
    if (independent) {
      entry.pending++;
      for (const item of related) {
        const pending = item.errors[error];
        if (pending) delete pending.supportedIn;
      }
    }
    entry.lastSeenAt = date;
  }

  if (!correct || !independent) record.intervalIndex = 0;
  else if (delayed && (!record.nextReviewAt || Date.parse(record.nextReviewAt) <= now))
    record.intervalIndex = Math.min(intervalDays.length - 1, record.intervalIndex + 1);

  record.lastOutcome = correct ? (independent ? 'independent' : 'assisted') : 'incorrect';
  record.lastPracticedAt = date;
  record.lastExerciseId = exercise.id;
  record.lastEvidenceStage = stage;
  record.lastDifficulty = exercise.difficulty;
  record.nextReviewAt = new Date(now + intervalDays[record.intervalIndex] * day).toISOString();
  noteExposure(record, exercise.id, target.contextId, date);
  return independent;
}

type Candidate = {
  exercise: { id: string; difficulty: number; learning?: LearningTarget };
};
export function rankPractice<T extends Candidate>(
  state: TravelLearningState,
  target: LearningRecord,
  candidates: T[],
  now: number,
): { reason: LearningReviewReason; candidates: T[] } {
  const related = candidates.filter(
    ({ exercise }) => exercise.learning?.conceptId === target.conceptId,
  );
  const past = state.targets.filter((item) => item.conceptId === target.conceptId);
  const guidance: LearningError[] = [];
  const followUp = new Map<LearningError, string>();
  for (const tag of learningErrors) {
    const entries = past.flatMap((item) => (item.errors[tag]?.pending ? [item.errors[tag]] : []));
    if (entries.reduce((sum, entry) => sum + entry.pending, 0) < 2) continue;
    const supportedIn = entries.find((entry) => entry.supportedIn)?.supportedIn;
    if (supportedIn) followUp.set(tag, supportedIn);
    else guidance.push(tag);
  }
  const newContext = (learning: LearningTarget) =>
    past.every((item) => !item.seenContexts.includes(learning.contextId));
  const remediates = ({ exercise }: T) => {
    const learning = exercise.learning!;
    return (
      guidance.some((tag) => learning.remediates?.includes(tag)) ||
      (!learning.guided &&
        stageRank[learning.evidence] >= stageRank.production &&
        [...followUp].some(
          ([tag, supportContext]) =>
            learning.contextId !== supportContext &&
            (learning.errors?.includes(tag) || learning.errorAnswers?.[tag]),
        ))
    );
  };
  const relevant =
    target.skill === 'speaking'
      ? []
      : related.filter(
          (entry) =>
            entry.exercise.learning!.skill === target.skill ||
            (target.lastOutcome === 'incorrect' && remediates(entry)),
        );
  const reason = relevant.some(remediates)
    ? 'remediation'
    : target.nextReviewAt && Date.parse(target.nextReviewAt) <= now
      ? 'due'
      : 'practice';
  const advancing = target.lastOutcome === 'independent';
  const score = (entry: T) => {
    const { exercise } = entry;
    const learning = exercise.learning!;
    const unseen = newContext(learning);
    const seen = past.some(
      (item) =>
        Object.hasOwn(item.seenExercises, exercise.id) &&
        now - Date.parse(item.seenExercises[exercise.id]) < day,
    );
    const desiredDifficulty = Math.max(1, (target.lastDifficulty ?? 1) + (advancing ? 1 : -1));
    const previousStage = target.lastEvidenceStage ? stageRank[target.lastEvidenceStage] : 0;
    const desiredStage = Math.max(0, Math.min(3, previousStage + (advancing ? 1 : -1)));
    return (
      1000 * Number(!remediates(entry)) +
      100 * Number(learning.skill !== target.skill) +
      50 * Number(seen) +
      10 * Number(!unseen) +
      Number(target.lastExerciseId === exercise.id) +
      Math.abs(desiredDifficulty - exercise.difficulty) +
      Math.abs(desiredStage - stageRank[learning.evidence])
    );
  };
  return {
    reason,
    candidates: relevant.sort((a, b) => score(a) - score(b)),
  };
}
