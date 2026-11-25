import type { ChapterPack } from '@lingoquest/course-pack';
import { z } from 'zod';
import {
  recordUnifiedEvidence,
  type UnifiedLearningState,
  type UnifiedLearningAid,
} from './learning-evidence';
import { chapterCardEvidenceTargets } from './learning-registry';

export const chapterCardEventSchema = z
  .object({
    id: z.string().min(8).max(100),
    chapterId: z.string().regex(/^[a-z][a-z-]{0,39}$/),
    revision: z.number().int().positive(),
    cardNumber: z.number().int().min(1).max(25),
    stage: z.enum(['vocabulary', 'grammar', 'question', 'practice']),
    word: z.string().max(120).optional(),
    selected: z.number().int().nonnegative().optional(),
    transcript: z.boolean().optional(),
    heard: z.boolean().optional(),
    retry: z.boolean().optional(),
  })
  .strict();

export function recordChapterCardEvent(
  state: UnifiedLearningState,
  pack: Pick<ChapterPack, 'chapterId' | 'revision' | 'lesson' | 'additionalLessons'>,
  input: z.infer<typeof chapterCardEventSchema>,
  now: number,
) {
  const card = [pack.lesson, ...pack.additionalLessons][input.cardNumber - 1];
  if (!card) return { recorded: false };
  const question = input.stage === 'question';
  if (question && (input.selected === undefined || input.selected >= card.question.options.length))
    return { recorded: false };
  const listening = question && !!card.question.listening;
  const targets = chapterCardEvidenceTargets(
    pack.chapterId,
    input.cardNumber,
    input.stage,
    input.word,
  ).map((target) => (listening ? { ...target, dimension: 'listening' as const } : target));
  if (!targets.length) return { recorded: false };
  const aids: UnifiedLearningAid[] = question ? ['guided'] : [];
  if (input.transcript) aids.push('transcript', 'translation');
  if (input.stage === 'practice') aids.push('answer_shown');
  if (input.stage === 'vocabulary') aids.push('translation');
  const materialId = `published.${pack.chapterId}.card-${input.cardNumber}`;
  const recorded = recordUnifiedEvidence(state, {
    id: `chapter-card:${input.id}`,
    source: 'study',
    materialId,
    exerciseId: `${materialId}.${input.stage}`,
    contextId: materialId,
    materialVersion: `${pack.chapterId}:${pack.revision}`,
    timestamp: now,
    format: question ? 'single_choice' : 'instruction',
    activity: question ? 'answer' : 'introduced',
    outcome: question
      ? listening && !input.heard && !input.transcript
        ? 'ungradable'
        : input.selected === card.question.answerIndex
          ? 'target'
          : 'incorrect'
      : undefined,
    independent: false,
    retry: !!input.retry,
    aids,
    targets,
  });
  return { recorded };
}
