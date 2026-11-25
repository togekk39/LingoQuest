import {
  answerOutcomeSchema,
  learningErrorSchema,
  type LearningError,
} from '@lingoquest/contracts';
import { z } from 'zod';
import { canonicalLearningId } from './learning-registry';

const dayMs = 86_400_000;
const reviewIntervals = [1, 3, 7, 14, 30];
const identifier = z.string().min(1).max(250);
export const unifiedLearningDimensions = [
  'listening',
  'reading',
  'writing',
  'speaking',
  'vocabulary_recall',
  'vocabulary_recognition',
  'grammar_understanding',
  'grammar_production',
] as const;
const dimensionSchema = z.enum(unifiedLearningDimensions);
const sourceSchema = z.enum([
  'story',
  'study',
  'review',
  'remediation',
  'placement',
  'challenge',
  'speech',
]);
const aidSchema = z.enum([
  'hint',
  'translation',
  'transcript',
  'answer_shown',
  'guided',
  'starter',
  'retry',
]);
const activitySchema = z.enum([
  'introduced',
  'answer',
  'speaking_practice',
  'speech_transcript',
  'recording',
]);
const formatSchema = z.enum([
  'single_choice',
  'meaning',
  'matching',
  'cloze',
  'reorder',
  'correction',
  'short_text',
  'instruction',
  'dialogue',
  'speaking',
]);
const targetSchema = z.object({ targetId: identifier, dimension: dimensionSchema }).strict();
const teachingReferenceSchema = z.object({ id: identifier, form: identifier.optional() }).strict();
const timestamp = z.number().int().min(0).max(8_639_997_408_000_000);
export const learningEvidenceSchema = z
  .object({
    id: identifier,
    source: sourceSchema,
    materialId: identifier,
    exerciseId: identifier,
    materialVersion: identifier,
    timestamp,
    contextId: identifier,
    format: formatSchema,
    activity: activitySchema,
    outcome: answerOutcomeSchema.optional(),
    languageOutcome: answerOutcomeSchema.optional(),
    identityMismatch: z.literal(true).optional(),
    aids: z.array(aidSchema).max(aidSchema.options.length),
    retry: z.boolean(),
    independent: z.boolean(),
    targets: z.array(targetSchema).max(100),
    teaches: z.array(teachingReferenceSchema).max(100).optional(),
    error: learningErrorSchema.optional(),
    errors: z.array(learningErrorSchema).max(learningErrorSchema.options.length).optional(),
    remediates: z.array(learningErrorSchema).max(learningErrorSchema.options.length).optional(),
    transfer: z.boolean().optional(),
  })
  .strict()
  .refine((event) => event.activity !== 'answer' || event.outcome !== undefined);

export const legacyLearningScheduleSchema = targetSchema
  .extend({
    nextReviewAt: z.string().datetime(),
    lastPracticedAt: z.string().datetime().optional(),
  })
  .strict();
export const unifiedLearningSchema = z
  .object({
    evidence: z.array(learningEvidenceSchema),
    legacySchedules: z.array(legacyLearningScheduleSchema),
  })
  .strict();

export type UnifiedLearningDimension = z.infer<typeof dimensionSchema>;
export type UnifiedLearningSource = z.infer<typeof sourceSchema>;
export type UnifiedLearningAid = z.infer<typeof aidSchema>;
export type UnifiedEvidenceTarget = z.infer<typeof targetSchema>;
export type LearningEvidence = z.infer<typeof learningEvidenceSchema>;
export type LegacyLearningSchedule = z.infer<typeof legacyLearningScheduleSchema>;
export type UnifiedLearningState = z.infer<typeof unifiedLearningSchema>;

export const unifiedMasteryStates = [
  'not_introduced',
  'introduced',
  'guided_practice',
  'independent_performance',
  'demonstrated',
] as const;
export type UnifiedMasteryState = (typeof unifiedMasteryStates)[number];
type VerificationState = 'unverified' | 'verified';

export interface RemediationSupport {
  exerciseId: string;
  contextId: string;
  timestamp: number;
  failedExerciseId?: string;
}

export interface UnifiedMastery extends UnifiedEvidenceTarget {
  state: UnifiedMasteryState;
  retention: VerificationState;
  transfer: VerificationState;
  needsReview: boolean;
  nextReviewAt?: string;
  lastPracticedAt?: string;
  lastIndependentAt?: string;
  lastDelayedSuccessAt?: string;
  lastTransferSuccessAt?: string;
  independentSuccesses: number;
  assistedSuccesses: number;
  communicationSuccesses: number;
  incorrectAttempts: number;
  delayedSuccesses: number;
  transferSuccesses: number;
  pendingErrors: LearningError[];
  remediationSupport: Partial<Record<LearningError, RemediationSupport>>;
  errorCounts: Partial<Record<LearningError, number>>;
  legacy: boolean;
}

export type UnifiedReviewCandidate = {
  exerciseId: string;
  contextId: string;
  targets: UnifiedEvidenceTarget[];
  guided?: boolean;
  errors?: LearningError[];
  remediates?: LearningError[];
};

export function emptyUnifiedLearning(): UnifiedLearningState {
  return { evidence: [], legacySchedules: [] };
}

export function unifiedMasteryKey({ targetId, dimension }: UnifiedEvidenceTarget) {
  return `${dimension}:${canonicalLearningId(targetId)}`;
}

export function masteryAtLeast(state: UnifiedMasteryState, minimum: UnifiedMasteryState) {
  return unifiedMasteryStates.indexOf(state) >= unifiedMasteryStates.indexOf(minimum);
}

function compareEvents(a: LearningEvidence, b: LearningEvidence) {
  return a.timestamp - b.timestamp;
}

export function learningEvidenceOutcome(event: LearningEvidence) {
  return event.languageOutcome ?? event.outcome;
}

function canCountIndependently(event: LearningEvidence) {
  return (
    event.independent &&
    event.activity === 'answer' &&
    event.format !== 'speaking' &&
    event.format !== 'dialogue' &&
    event.format !== 'instruction' &&
    event.format !== 'reorder' &&
    !event.retry &&
    event.aids.length === 0 &&
    learningEvidenceOutcome(event) !== 'ungradable'
  );
}

export function hasRecentGradableAnswer(
  state: UnifiedLearningState,
  exerciseId: string,
  now: number,
) {
  return state.evidence.some(
    (event) =>
      event.exerciseId === exerciseId &&
      event.source !== 'placement' &&
      event.activity === 'answer' &&
      learningEvidenceOutcome(event) !== 'ungradable' &&
      event.timestamp <= now &&
      now - event.timestamp < dayMs,
  );
}

export function recordUnifiedEvidence(state: UnifiedLearningState, input: LearningEvidence) {
  if (state.evidence.some(({ id }) => id === input.id)) return false;
  const event = learningEvidenceSchema.parse(input);
  const targets = [
    ...new Map(event.targets.map((target) => [unifiedMasteryKey(target), target])).values(),
  ].map(({ targetId, dimension }) => ({ targetId: canonicalLearningId(targetId), dimension }));
  const aids = new Set(event.aids);
  if (event.format === 'reorder' || event.activity === 'speech_transcript') aids.add('guided');
  if (event.retry) aids.add('retry');
  if (
    event.activity === 'answer' &&
    event.source !== 'placement' &&
    hasRecentGradableAnswer(state, event.exerciseId, event.timestamp)
  )
    aids.add('answer_shown');
  state.evidence.push({
    ...event,
    targets,
    aids: [...aids],
    independent: canCountIndependently({ ...event, aids: [...aids] }),
  });
  return true;
}

export function emptyUnifiedMastery({
  targetId,
  dimension,
}: UnifiedEvidenceTarget): UnifiedMastery {
  return {
    targetId: canonicalLearningId(targetId),
    dimension,
    state: 'not_introduced',
    retention: 'unverified',
    transfer: 'unverified',
    needsReview: false,
    independentSuccesses: 0,
    assistedSuccesses: 0,
    communicationSuccesses: 0,
    incorrectAttempts: 0,
    delayedSuccesses: 0,
    transferSuccesses: 0,
    pendingErrors: [],
    remediationSupport: {},
    errorCounts: {},
    legacy: false,
  };
}

export function isRemediationFollowUp(
  candidate: Omit<UnifiedReviewCandidate, 'targets'>,
  error: LearningError,
  support: RemediationSupport,
) {
  return (
    !candidate.guided &&
    candidate.exerciseId !== support.exerciseId &&
    candidate.exerciseId !== support.failedExerciseId &&
    candidate.contextId !== support.contextId &&
    (candidate.errors?.includes(error) || candidate.remediates?.includes(error)) === true
  );
}

function raise(mastery: UnifiedMastery, state: UnifiedMasteryState) {
  if (!masteryAtLeast(mastery.state, state)) mastery.state = state;
}

function reduceMastery(mastery: UnifiedMastery, evidence: LearningEvidence[]) {
  const qualifyingPrompts = new Set<string>();
  const independentContexts = new Set<string>();
  const challengePrompts = new Map<string, boolean>();
  const pendingErrors = new Map<LearningError, string>();
  let interval = 0;
  let lastIndependent = -Infinity;
  let lastIndependentExercise = '';
  for (const event of evidence) {
    const outcome = learningEvidenceOutcome(event);
    const independent = canCountIndependently(event);
    if (event.source === 'placement') continue;
    if (event.activity === 'introduced') {
      raise(mastery, 'introduced');
      continue;
    }
    if (event.activity !== 'answer') {
      raise(mastery, 'guided_practice');
      continue;
    }
    if (event.source === 'challenge') {
      // Keep replay history without awarding repeated evidence for the same challenge item.
      // Conserva el historial sin premiar repetidamente el mismo ejercicio de desafío.
      const earned = outcome === 'target' && independent;
      const previous = challengePrompts.get(event.exerciseId);
      if (previous || (previous === false && !earned)) continue;
      challengePrompts.set(event.exerciseId, earned);
    }
    const date = new Date(event.timestamp).toISOString();
    mastery.lastPracticedAt = date;
    raise(mastery, 'guided_practice');
    if (outcome === 'communication_only') mastery.communicationSuccesses++;
    if (outcome === 'incorrect' || outcome === 'context_mismatch') {
      mastery.incorrectAttempts++;
      if (event.error) {
        mastery.errorCounts[event.error] = (mastery.errorCounts[event.error] ?? 0) + 1;
        if (!pendingErrors.has(event.error) || !event.aids.includes('guided'))
          pendingErrors.set(event.error, event.exerciseId);
        delete mastery.remediationSupport[event.error];
      }
    }
    if (outcome !== 'target' || !independent) {
      if (outcome === 'target') {
        mastery.assistedSuccesses++;
        if (event.aids.includes('guided'))
          for (const error of event.remediates ?? []) {
            const failedExerciseId = pendingErrors.get(error);
            if (failedExerciseId)
              mastery.remediationSupport[error] = {
                exerciseId: event.exerciseId,
                contextId: event.contextId,
                timestamp: event.timestamp,
                failedExerciseId,
              };
          }
      }
      mastery.needsReview = true;
      // Keep earned progress while bringing a weak target forward in the queue.
      // Conserva el progreso ganado y adelanta el objetivo por reforzar en la cola.
      interval = Math.max(0, interval - 1);
      const due =
        outcome === 'incorrect' || outcome === 'context_mismatch'
          ? event.timestamp
          : event.timestamp + dayMs;
      mastery.nextReviewAt = new Date(
        Math.min(due, mastery.nextReviewAt ? Date.parse(mastery.nextReviewAt) : due),
      ).toISOString();
      continue;
    }
    mastery.independentSuccesses++;
    mastery.lastIndependentAt = date;
    const demonstrated = masteryAtLeast(mastery.state, 'demonstrated');
    const differentPrompt = event.exerciseId !== lastIndependentExercise;
    const newPrompt = !qualifyingPrompts.has(event.exerciseId);
    const newContext = !independentContexts.has(event.contextId);
    const delayed = demonstrated && differentPrompt && event.timestamp - lastIndependent >= dayMs;
    const transferred = event.transfer && qualifyingPrompts.size > 0 && newPrompt && newContext;
    qualifyingPrompts.add(event.exerciseId);
    independentContexts.add(event.contextId);
    raise(mastery, qualifyingPrompts.size >= 2 ? 'demonstrated' : 'independent_performance');
    if (delayed) {
      mastery.delayedSuccesses++;
      mastery.retention = 'verified';
      mastery.lastDelayedSuccessAt = date;
      if (!mastery.nextReviewAt || Date.parse(mastery.nextReviewAt) <= event.timestamp)
        interval = Math.min(reviewIntervals.length - 1, interval + 1);
    }
    if (transferred) {
      mastery.transferSuccesses++;
      mastery.transfer = 'verified';
      mastery.lastTransferSuccessAt = date;
    }
    for (const error of pendingErrors.keys()) {
      const support = mastery.remediationSupport[error];
      if (support && isRemediationFollowUp(event, error, support)) {
        pendingErrors.delete(error);
        delete mastery.remediationSupport[error];
      }
    }
    mastery.needsReview = pendingErrors.size > 0;
    lastIndependent = event.timestamp;
    lastIndependentExercise = event.exerciseId;
    if (
      newPrompt ||
      delayed ||
      !mastery.nextReviewAt ||
      Date.parse(mastery.nextReviewAt) <= event.timestamp
    )
      mastery.nextReviewAt = new Date(
        event.timestamp + reviewIntervals[interval] * dayMs,
      ).toISOString();
  }
  mastery.pendingErrors = [...pendingErrors.keys()];
  return mastery;
}

export function unifiedMastery(state: UnifiedLearningState): UnifiedMastery[] {
  const byTarget = new Map<string, { mastery: UnifiedMastery; evidence: LearningEvidence[] }>();
  const bucket = (target: UnifiedEvidenceTarget) => {
    const key = unifiedMasteryKey(target);
    const found = byTarget.get(key);
    if (found) return found;
    const entry = { mastery: emptyUnifiedMastery(target), evidence: [] };
    byTarget.set(key, entry);
    return entry;
  };
  for (const schedule of state.legacySchedules) {
    const { mastery } = bucket(schedule);
    mastery.legacy = true;
    if (!mastery.nextReviewAt || schedule.nextReviewAt < mastery.nextReviewAt)
      mastery.nextReviewAt = schedule.nextReviewAt;
    if (
      schedule.lastPracticedAt &&
      (!mastery.lastPracticedAt || schedule.lastPracticedAt > mastery.lastPracticedAt)
    )
      mastery.lastPracticedAt = schedule.lastPracticedAt;
  }
  const seen = new Set<string>();
  for (const event of state.evidence) {
    if (
      seen.has(event.id) ||
      event.source === 'placement' ||
      learningEvidenceOutcome(event) === 'ungradable'
    )
      continue;
    seen.add(event.id);
    for (const target of new Map(
      event.targets.map((target) => [unifiedMasteryKey(target), target]),
    ).values())
      bucket(target).evidence.push(event);
  }
  return [...byTarget.values()].map(({ mastery, evidence }) =>
    reduceMastery(mastery, evidence.sort(compareEvents)),
  );
}

export function getUnifiedMastery(
  state: UnifiedLearningState,
  targetId: string,
  dimension: UnifiedLearningDimension,
): UnifiedMastery {
  const key = unifiedMasteryKey({ targetId, dimension });
  return (
    unifiedMastery(state).find((target) => unifiedMasteryKey(target) === key) ??
    emptyUnifiedMastery({ targetId, dimension })
  );
}

export function unifiedReviewQueue(state: UnifiedLearningState, now: number) {
  const priority = (mastery: UnifiedMastery) =>
    Number(mastery.pendingErrors.length === 0) * 2 +
    Number(!mastery.nextReviewAt || Date.parse(mastery.nextReviewAt) > now);
  const dueAt = (mastery: UnifiedMastery) =>
    mastery.nextReviewAt ? Date.parse(mastery.nextReviewAt) : Infinity;
  const difficulty = (mastery: UnifiedMastery) => {
    const supported =
      mastery.incorrectAttempts + mastery.assistedSuccesses + mastery.communicationSuccesses;
    return supported / Math.max(1, supported + mastery.independentSuccesses);
  };
  return unifiedMastery(state)
    .map((item) => ({ ...item, needsReview: item.needsReview || dueAt(item) <= now }))
    .sort(
      (a, b) => priority(a) - priority(b) || dueAt(a) - dueAt(b) || difficulty(b) - difficulty(a),
    );
}

export function rankUnifiedReviewCandidates<T extends UnifiedReviewCandidate>(
  state: UnifiedLearningState,
  mastery: UnifiedMastery,
  candidates: readonly T[],
  now: number,
) {
  const key = unifiedMasteryKey(mastery);
  const prior = state.evidence.filter(
    (event) =>
      event.source !== 'placement' &&
      event.activity === 'answer' &&
      learningEvidenceOutcome(event) !== 'ungradable' &&
      event.targets.some((target) => unifiedMasteryKey(target) === key),
  );
  const contexts = new Set(prior.map(({ contextId }) => contextId));
  const recentIds = new Set(
    prior.filter((event) => now - event.timestamp < dayMs).map(({ exerciseId }) => exerciseId),
  );
  const seenIds = new Set(prior.map(({ exerciseId }) => exerciseId));
  const score = (item: T) => {
    const addressesError = mastery.pendingErrors.some((error) => {
      const guidance = mastery.remediationSupport[error];
      return guidance
        ? isRemediationFollowUp(item, error, guidance)
        : item.guided && item.remediates?.includes(error);
    });
    return (
      Number(!addressesError) * 100 +
      Number(recentIds.has(item.exerciseId)) * 20 +
      Number(seenIds.has(item.exerciseId)) * 5 +
      Number(contexts.has(item.contextId)) * 2 +
      Number(!!item.guided)
    );
  };
  return candidates
    .filter(({ targets }) => targets.some((target) => unifiedMasteryKey(target) === key))
    .sort((a, b) => score(a) - score(b));
}
