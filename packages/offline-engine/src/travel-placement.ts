import { z } from 'zod';
import { answerSchema, judgeAnswer, type PublicExercise } from '@lingoquest/contracts';
import type { CourseExercise } from './index';

import { travelPlacementItems as items } from './home-content';

const responsesSchema = z
  .object({
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
  const { answers } = responsesSchema.parse(body);
  const passed = items.map(({ audio, exercise }, i) => {
    const { answer, transcript } = answers[i];
    if (!answer || (audio && transcript)) return false;
    const outcome = judgeAnswer(exercise, answer);
    return outcome === 'target' || (outcome === 'communication_only' && !!exercise.introduction);
  });
  const firstToPractice = ['hello', 'bus', 'bag'].find((missionId) =>
    items.some((item, i) => item.missionId === missionId && !passed[i]),
  );
  const missionId = travelPlacementSchema.shape.missionId.parse(firstToPractice ?? 'bag');
  return {
    missionId,
    correct: passed.filter(Boolean).length,
    total: 6,
  } satisfies TravelPlacement;
}
