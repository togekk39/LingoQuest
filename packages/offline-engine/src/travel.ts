import { z } from 'zod';
import {
  answerOutcomeSchema,
  answerSchema,
  type AttemptInput,
  type AttemptResult,
} from '@lingoquest/contracts';
import { travelPlacementSchema } from './travel-placement';
import { chapter, travelLesson } from './home-content';
import {
  learningErrorSchema,
  speechPracticeSchema,
  type LearningAid,
  type LearningTarget,
  type SpeechPractice,
} from './travel-learning';
import { homeCountries, type HomeCountry } from './travel-route';

export const draftAnswerSchema = z
  .object({
    optionId: z.string().max(100).optional(),
    text: z.string().max(2000).optional(),
    tokens: z.array(z.string().max(200)).max(60).optional(),
    matches: z.record(z.string().min(1).max(100), z.string().min(1).max(100)).optional(),
  })
  .strict();
export const savedResultSchema = z
  .object({
    correct: z.boolean(),
    outcome: answerOutcomeSchema.optional(),
    communicationOnly: z.literal(true).optional(),
    identityMismatch: z.literal(true).optional(),
    feedbackEs: z.string().max(5000),
    acceptedAnswer: z.string().max(5000).optional(),
    errorType: learningErrorSchema.optional(),
    xpAwarded: z.number().int().min(0).max(1000000),
    pending: z.literal(false),
  })
  .strict();

const countrySchema = z.custom<HomeCountry>(
  (code) => typeof code === 'string' && Object.hasOwn(homeCountries, code),
);
const checkpointSchema = z
  .object({
    missionId: z.string().max(100),
    contentRevision: z.number().int().positive(),
    token: z.string().min(8).max(100),
    step: z.number().int().min(0).max(100),
    stepId: z.string().max(100).optional(),
    word: z.number().int().min(0).max(100).optional(),
    answer: draftAnswerSchema,
    hint: z.boolean(),
    transcript: z.boolean(),
    retry: z.boolean().optional(),
    result: savedResultSchema.optional(),
    finished: z.boolean(),
  })
  .strict();

export const travelStateSchema = z
  .object({
    country: countrySchema.optional(),
    introductionName: z.string().trim().min(1).max(120).optional(),
    active: checkpointSchema.optional(),
    paused: z.record(checkpointSchema).optional(),
    placement: travelPlacementSchema.optional(),
    cleared: z.array(z.enum(['hello', 'bus', 'bag'])).optional(),
    completed: z.record(z.string().datetime()),
    stamps: z.record(z.string().datetime()),
    note: z.string().max(500).optional(),
  })
  .strict();

export type TravelState = z.infer<typeof travelStateSchema>;
export type TravelCheckpoint = z.infer<typeof checkpointSchema>;
export const emptyTravel = (): TravelState => ({ completed: {}, stamps: {} });

export function canStartTravelMission(travel: TravelState, missionId: string) {
  const i = chapter.missions.findIndex((mission) => mission.id === missionId);
  return (
    i >= 0 &&
    chapter.missions
      .slice(0, i)
      .every(
        (entry) => !!travel.completed[entry.id] || travel.cleared?.some((id) => id === entry.id),
      )
  );
}

export function nextTravelMission(travel: TravelState) {
  if (travel.active) {
    const active = chapter.missions.find((mission) => mission.id === travel.active?.missionId);
    if (active) return active;
  }
  return chapter.missions.find(
    (mission) => !travel.completed[mission.id] && !travel.cleared?.some((id) => id === mission.id),
  );
}

const operationSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('country'), country: countrySchema }).strict(),
  z.object({ action: z.literal('start'), missionId: z.string().max(100) }).strict(),
  z
    .object({
      action: z.literal('word'),
      token: z.string(),
      position: z.number().int().nonnegative(),
    })
    .strict(),
  z.object({ action: z.literal('note'), text: z.string().max(500) }).strict(),
  z.object({ action: z.literal('draft'), token: z.string(), answer: draftAnswerSchema }).strict(),
  z
    .object({
      action: z.enum(['hint', 'transcript', 'retry', 'advance', 'dismiss']),
      token: z.string(),
    })
    .strict(),
  z.object({ action: z.literal('answer'), token: z.string(), answer: answerSchema }).strict(),
  z
    .object({ action: z.literal('speak'), token: z.string(), practice: speechPracticeSchema })
    .strict(),
]);
export type TravelOperation = z.input<typeof operationSchema>;

const revisionOneSteps: Record<string, string[]> = {
  hello: ['hello_welcome', 'hello_sam', 'hello_teach', 'travel_hello_write', 'hello_speak'],
  bus: ['bus_sam', 'bus_teach', 'travel_bus_listen', 'travel_bus_direction', 'bus_lost'],
  bag: ['bag_luz', 'bag_teach', 'travel_bag_read', 'travel_bag_write', 'bag_postcard'],
};

export function upgradeTravelCheckpoints(travel: TravelState) {
  function upgrade(saved: TravelCheckpoint) {
    if (saved.contentRevision === chapter.revision) return saved;
    const mission = chapter.missions.find((item) => item.id === saved.missionId);
    const stableId =
      saved.stepId ??
      (saved.contentRevision === 1 && Object.hasOwn(revisionOneSteps, saved.missionId)
        ? revisionOneSteps[saved.missionId][saved.step]
        : saved.contentRevision === 2
          ? mission?.steps[saved.step]?.id
          : undefined);
    const step = mission?.steps.findIndex((item) => item.id === stableId) ?? -1;
    if (step < 0) return saved;
    const answer =
      stableId === 'travel_hello_build' && !saved.result && saved.answer.tokens
        ? {
            ...saved.answer,
            tokens: saved.answer.tokens.map((word) => (word === 'Luz' ? '[tu nombre]' : word)),
          }
        : saved.answer;
    return { ...saved, step, stepId: stableId, answer, contentRevision: chapter.revision };
  }
  if (travel.active) travel.active = upgrade(travel.active);
  for (const [key, saved] of Object.entries(travel.paused ?? {}))
    travel.paused![key] = upgrade(saved);
}

function checkpoint(missionId: string, step: number, token: string): TravelCheckpoint {
  return {
    missionId,
    step,
    stepId: chapter.missions.find((mission) => mission.id === missionId)?.steps[step]?.id,
    token,
    contentRevision: chapter.revision,
    answer: {},
    hint: false,
    transcript: false,
    finished: false,
  };
}

export function updateTravel(
  travel: TravelState,
  body: unknown,
  now: number,
  id: () => string,
  attempt: (input: AttemptInput, aids: LearningAid[]) => AttemptResult,
  speaking: (target: LearningTarget, practice: SpeechPractice) => void,
  entryStepId?: string,
) {
  const input = operationSchema.parse(body);
  if (input.action === 'country') {
    travel.country = input.country;
    return;
  }
  if (input.action === 'note') {
    if (travel.stamps[chapter.id]) travel.note = input.text;
    return;
  }
  const current = travel.active;
  if (input.action === 'start') {
    const mission = chapter.missions.find(({ id: missionId }) => missionId === input.missionId);
    const entry = entryStepId
      ? Math.max(0, mission?.steps.findIndex(({ id: stepId }) => stepId === entryStepId) ?? -1)
      : 0;
    if (current?.missionId === input.missionId && current.contentRevision === chapter.revision)
      return;
    if (!canStartTravelMission(travel, input.missionId)) return;
    const paused = (travel.paused ??= {});
    if (current && !current.finished && current.contentRevision === chapter.revision)
      paused[current.missionId] = current;
    const saved = paused[input.missionId];
    travel.active =
      saved?.contentRevision === chapter.revision
        ? saved
        : checkpoint(input.missionId, entry, id());
    delete paused[input.missionId];
    return;
  }
  if (!current || input.token !== current.token || current.contentRevision !== chapter.revision)
    return;
  if (current.finished) {
    if (input.action === 'dismiss') delete travel.active;
    return;
  }
  const mission = chapter.missions.find((item) => item.id === current.missionId);
  const step = mission?.steps[current.step];
  if (!mission || !step) return;
  if (input.action === 'word') {
    if (step.type === 'teach' && input.position <= mission.vocabulary.length)
      current.word = input.position;
    return;
  }
  if (step.type === 'exercise') {
    if (input.action === 'draft' && !current.result) current.answer = input.answer;
    if (input.action === 'hint' && step.hint && !current.result) current.hint = true;
    if (input.action === 'transcript' && step.transcript && !current.result)
      current.transcript = true;
    if (input.action === 'answer' && !current.result) {
      const aids: LearningAid[] = [];
      if (current.hint) aids.push('hint');
      if (current.transcript) aids.push('transcript');
      if (current.retry) aids.push('retry');
      current.result = attempt(
        {
          lessonId: travelLesson.id,
          exerciseId: step.exercise.id,
          clientAttemptId: current.token,
          answer: input.answer,
          hintUsed: aids.length > 0,
        },
        aids,
      );
      current.answer = input.answer;
    }
    if (input.action === 'retry' && current.result && !current.result.correct) {
      travel.active = {
        ...checkpoint(mission.id, current.step, id()),
        hint: current.result.identityMismatch ? current.hint : true,
        retry: current.result.identityMismatch ? current.retry : true,
        transcript: current.transcript,
      };
      return;
    }
    if (
      !current.result ||
      current.result.identityMismatch ||
      (step.response === 'personal-introduction' &&
        !current.result.correct &&
        !current.result.communicationOnly)
    )
      return;
  }
  if (input.action === 'speak') {
    if (step.type !== 'speak') return;
    if (step.learning) speaking(step.learning, input.practice);
  } else if (input.action !== 'advance') return;
  if (current.step + 1 < mission.steps.length) {
    travel.active = checkpoint(mission.id, current.step + 1, id());
    return;
  }
  const date = new Date(now).toISOString();
  travel.completed[mission.id] ??= date;
  if (
    chapter.missions.every(
      (item) => travel.completed[item.id] || travel.cleared?.some((id) => id === item.id),
    )
  )
    travel.stamps[chapter.id] ??= date;
  current.finished = true;
}
