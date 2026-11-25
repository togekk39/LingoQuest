import { z } from 'zod';
import { answerSchema, judgeAnswer, type PublicExercise } from '@lingoquest/contracts';
import type { CourseExercise } from './index';

import { travelPlacementItems as items } from './home-content';

const responsesSchema = z
  .object({
    assessmentId: z.string().min(8).max(100).optional(),
    answers: z
      .array(z.object({ answer: answerSchema.nullable(), transcript: z.boolean() }).strict())
      .length(6),
  })
  .strict();
export type TravelPlacementResponse = z.input<typeof responsesSchema>['answers'][number];
export type TravelPlacementQuestion = { exercise: PublicExercise; audio?: string };
export const travelPlacementSchema = z
  .object({
    missionId: z.enum(['hello', 'bus', 'bag']),
    correct: z.number().int().min(0).max(6),
    total: z.literal(6),
  })
  .strict();
export type TravelPlacement = z.infer<typeof travelPlacementSchema>;

export function placementQuestions(publish: (e: CourseExercise) => PublicExercise) {
  return items.map(({ audio, exercise }): TravelPlacementQuestion => ({
    exercise: publish(exercise),
    audio,
  }));
}

export function assessTravelPlacement(body: unknown) {
  const { answers, assessmentId } = responsesSchema.parse(body);
  const responses = items.flatMap(({ exercise }, i) => {
    const { answer, transcript } = answers[i];
    return answer ? [{ exercise, transcript, outcome: judgeAnswer(exercise, answer) }] : [];
  });
  const scored = new Map(responses.map((item) => [item.exercise.id, item]));
  const passed = items.map(({ audio, exercise }) => {
    const response = scored.get(exercise.id);
    if (!response || (audio && response.transcript)) return false;
    return (
      response.outcome === 'target' ||
      (response.outcome === 'communication_only' && !!exercise.introduction)
    );
  });
  const firstToPractice = ['hello', 'bus', 'bag'].find((missionId) =>
    items.some((item, i) => item.missionId === missionId && !passed[i]),
  );
  const missionId = travelPlacementSchema.shape.missionId.parse(firstToPractice ?? 'bag');
  const placement = {
    missionId,
    correct: passed.filter(Boolean).length,
    total: 6,
  } satisfies TravelPlacement;
  return { placement, responses, assessmentId };
}
