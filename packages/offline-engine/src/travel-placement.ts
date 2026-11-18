import { z } from 'zod';
import { answerSchema, type PublicExercise } from '@lingoquest/contracts';
import type { CourseExercise } from './index';

const items: { missionId: string; audio?: string; exercise: CourseExercise }[] = [
  {
    missionId: 'hello',
    exercise: {
      id: 'route_intro_read',
      type: 'meaning',
      promptEs: '¿Qué está haciendo la persona?',
      passage: 'Hi! My name is Sam.',
      options: [
        { id: 'name', text: 'Se está presentando.' },
        { id: 'bag', text: 'Está buscando su mochila.' },
      ],
      optionsLanguage: 'es',
      correctOptionId: 'name',
      acceptedAnswers: ['Se está presentando.'],
      difficulty: 1,
      skillId: 'grammar.be_i_you',
      feedbackEs: 'My name is significa «me llamo».',
    },
  },
  {
    missionId: 'hello',
    exercise: {
      id: 'route_intro_write',
      type: 'short_text',
      promptEs: 'Preséntate como Luz. Escribe «Soy Luz» en inglés.',
      acceptedAnswers: ['I am Luz', "I'm Luz", 'My name is Luz'],
      difficulty: 1,
      skillId: 'grammar.be_i_you',
      feedbackEs: 'I am, I’m y My name is sirven para decir tu nombre.',
    },
  },
  {
    missionId: 'bus',
    audio: 'Where is the bus stop?',
    exercise: {
      id: 'route_bus_listen',
      type: 'meaning',
      promptEs: 'Escucha a Sam. ¿Qué está buscando?',
      options: [
        { id: 'park', text: 'El parque.' },
        { id: 'stop', text: 'La parada de bus.' },
      ],
      optionsLanguage: 'es',
      correctOptionId: 'stop',
      acceptedAnswers: ['La parada de bus.'],
      difficulty: 2,
      skillId: 'grammar.be_questions',
      feedbackEs: 'Bus stop es la parada de bus.',
    },
  },
  {
    missionId: 'bus',
    exercise: {
      id: 'route_bus_order',
      type: 'reorder',
      promptEs: 'Indica que la parada está junto al parque.',
      tokens: ['park', 'It’s', 'to', 'the', 'next'],
      acceptedAnswers: ['It’s next to the park'],
      difficulty: 2,
      skillId: 'grammar.be_it_they',
      feedbackEs: 'Next to significa «junto a».',
    },
  },
  {
    missionId: 'bag',
    exercise: {
      id: 'route_bag_read',
      type: 'single_choice',
      promptEs: 'Lee el mensaje. ¿Qué objeto debes devolver?',
      passage: 'My bag is blue.',
      options: [
        { id: 'red', text: 'Una mochila roja.' },
        { id: 'blue', text: 'Una mochila azul.' },
      ],
      optionsLanguage: 'es',
      correctOptionId: 'blue',
      acceptedAnswers: ['Una mochila azul.'],
      difficulty: 3,
      skillId: 'grammar.be_it_they',
      feedbackEs: 'Blue significa «azul».',
    },
  },
  {
    missionId: 'bag',
    exercise: {
      id: 'route_bag_write',
      type: 'short_text',
      promptEs: 'Confirma el color de la mochila. Escribe «Es azul» en inglés.',
      acceptedAnswers: ['It is blue', "It's blue", 'The bag is blue', 'The backpack is blue'],
      difficulty: 3,
      skillId: 'grammar.be_it_they',
      feedbackEs: 'It is blue describe un objeto conocido.',
    },
  },
];

const responsesSchema = z
  .object({
    answers: z
      .array(z.object({ answer: answerSchema.nullable(), transcript: z.boolean() }).strict())
      .length(items.length),
  })
  .strict();
export type TravelPlacementResponse = z.input<typeof responsesSchema>['answers'][number];
export type TravelPlacementQuestion = { exercise: PublicExercise; audio?: string };
export const travelPlacementSchema = z
  .object({
    missionId: z.enum(['hello', 'bus', 'bag']),
    correct: z.number().int().min(0).max(items.length),
    total: z.literal(items.length),
  })
  .strict();
export type TravelPlacement = z.infer<typeof travelPlacementSchema>;

export function placementQuestions(publish: (e: CourseExercise) => PublicExercise) {
  return items.map(({ audio, exercise }): TravelPlacementQuestion => ({
    exercise: publish(exercise),
    audio,
  }));
}

export function assessTravelPlacement(
  body: unknown,
  grade: (e: CourseExercise, answer: NonNullable<TravelPlacementResponse['answer']>) => boolean,
) {
  const { answers } = responsesSchema.parse(body);
  const passed = items.map(({ audio, exercise }, i) => {
    const { answer, transcript } = answers[i];
    return !!answer && !(audio && transcript) && grade(exercise, answer);
  });
  const firstToPractice = ['hello', 'bus', 'bag'].find((missionId) =>
    items.some((item, i) => item.missionId === missionId && !passed[i]),
  );
  const missionId = travelPlacementSchema.shape.missionId.parse(firstToPractice ?? 'bag');
  return {
    missionId,
    correct: passed.filter(Boolean).length,
    total: items.length,
  } satisfies TravelPlacement;
}
