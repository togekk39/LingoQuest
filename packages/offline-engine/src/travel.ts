import { z } from 'zod';
import { answerSchema, type AttemptInput, type AttemptResult } from '@lingoquest/contracts';
import { chapter, travelLesson } from './travel-content';
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
    feedbackEs: z.string().max(5000),
    acceptedAnswer: z.string().max(5000).optional(),
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
    answer: draftAnswerSchema,
    hint: z.boolean(),
    transcript: z.boolean(),
    result: savedResultSchema.optional(),
    finished: z.boolean(),
  })
  .strict();

export const travelStateSchema = z
  .object({
    country: countrySchema.optional(),
    active: checkpointSchema.optional(),
    completed: z.record(z.string().datetime()),
    stamps: z.record(z.string().datetime()),
    note: z.string().max(500).optional(),
  })
  .strict();

export type TravelState = z.infer<typeof travelStateSchema>;
export type TravelCheckpoint = z.infer<typeof checkpointSchema>;
export const emptyTravel = (): TravelState => ({ completed: {}, stamps: {} });

const operationSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('country'), country: countrySchema }).strict(),
  z.object({ action: z.literal('start'), missionId: z.string().max(100) }).strict(),
  z.object({ action: z.literal('note'), text: z.string().max(500) }).strict(),
  z.object({ action: z.literal('draft'), token: z.string(), answer: draftAnswerSchema }).strict(),
  z
    .object({
      action: z.enum(['hint', 'transcript', 'retry', 'advance', 'dismiss']),
      token: z.string(),
    })
    .strict(),
  z.object({ action: z.literal('answer'), token: z.string(), answer: answerSchema }).strict(),
]);
export type TravelOperation = z.input<typeof operationSchema>;

function checkpoint(missionId: string, step: number, token: string): TravelCheckpoint {
  return {
    missionId,
    step,
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
  attempt: (input: AttemptInput) => AttemptResult,
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
    if (current?.missionId === input.missionId && current.contentRevision === chapter.revision)
      return;
    const index = chapter.missions.findIndex((mission) => mission.id === input.missionId);
    if (
      index < 0 ||
      chapter.missions.slice(0, index).some((mission) => !travel.completed[mission.id])
    )
      return;
    if (current && !current.finished && current.contentRevision === chapter.revision) return;
    travel.active = checkpoint(input.missionId, 0, id());
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
  if (step.type === 'exercise') {
    if (input.action === 'draft' && !current.result) current.answer = input.answer;
    if (input.action === 'hint' && !current.result) current.hint = true;
    if (input.action === 'transcript' && !current.result) current.transcript = true;
    if (input.action === 'answer' && !current.result) {
      current.result = attempt({
        lessonId: travelLesson.id,
        exerciseId: step.exercise.id,
        clientAttemptId: current.token,
        answer: input.answer,
        hintUsed: current.hint || current.transcript,
      });
      current.answer = input.answer;
    }
    if (input.action === 'retry' && current.result && !current.result.correct) {
      travel.active = {
        ...checkpoint(mission.id, current.step, id()),
        hint: true,
        transcript: current.transcript,
      };
      return;
    }
    if (!current.result) return;
  }
  if (input.action !== 'advance') return;
  if (current.step + 1 < mission.steps.length) {
    travel.active = checkpoint(mission.id, current.step + 1, id());
    return;
  }
  const date = new Date(now).toISOString();
  travel.completed[mission.id] ??= date;
  if (chapter.missions.every((item) => travel.completed[item.id]))
    travel.stamps[chapter.id] ??= date;
  current.finished = true;
}
