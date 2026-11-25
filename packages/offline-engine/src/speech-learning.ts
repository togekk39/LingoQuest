import { z } from 'zod';
import { chapter } from './home-content';
import type { CourseData } from './index';
import {
  recordUnifiedEvidence,
  type LearningEvidence,
  type UnifiedLearningState,
} from './learning-evidence';
import { homeSpeakingEvidenceTargets } from './learning-registry';
import { studyMaterialVersion } from './study-learning';

const identifier = z.string().min(1).max(200);
const practiceSchema = z
  .object({
    id: identifier,
    source: z.enum(['story', 'study', 'drill', 'travel-guide']),
    materialId: identifier,
    itemId: identifier,
    retry: z.boolean(),
    timestamp: z.number().int().nonnegative().optional(),
    recognition: z.enum(['matched', 'unmatched', 'empty']).optional(),
    recording: z.boolean(),
  })
  .strict()
  .refine(({ recognition, recording }) => Boolean(recognition || recording));
type Practice = z.infer<typeof practiceSchema>;

const courseDrillSchema = z.object({ id: identifier, category: identifier });
const homeGuideConcepts: Readonly<Record<string, string>> = {
  'hello:Hi': 'greeting',
  'hello:I am': 'introduction',
  'hello:My name is': 'introduction',
  'bus:bus stop': 'place-question',
  'bus:park': 'place-location',
  'bus:next to': 'place-location',
  'bag:bag': 'item-color',
  'bag:blue': 'item-color',
  'bag:red': 'item-color',
};

function speechTarget(
  content: CourseData,
  input: Practice,
): Pick<LearningEvidence, 'materialVersion' | 'contextId' | 'source' | 'targets'> | undefined {
  const { source, materialId, itemId } = input;
  if (source === 'drill') {
    const drill = content.speechDrills.some((value) => {
      const parsed = courseDrillSchema.safeParse(value);
      return parsed.success && parsed.data.id === itemId && parsed.data.category === materialId;
    });
    if (!drill) return undefined;
    return {
      source: 'speech',
      contextId: materialId,
      materialVersion:
        content.courseVersion ??
        (chapter.missions.length ? `home:${chapter.revision}` : 'legacy-unversioned'),
      targets: [{ targetId: `speech.${materialId}`, dimension: 'speaking' }],
    };
  }
  const mission = chapter.missions.find(({ id }) => id === materialId);
  const homeVersion = `home:${chapter.revision}`;
  if (source === 'travel-guide') {
    const key = `${materialId}:${itemId}`;
    const word = mission?.vocabulary.some(({ term }) => term === itemId);
    if (!word || !Object.hasOwn(homeGuideConcepts, key)) return undefined;
    return {
      source: 'speech',
      contextId: `home:guide:${materialId}`,
      materialVersion: homeVersion,
      targets: homeSpeakingEvidenceTargets({ conceptId: homeGuideConcepts[key] }),
    };
  }
  const step = mission?.steps.find((step) => step.id === itemId);
  if (step?.type === 'speak') {
    return {
      source,
      contextId: step.learning.contextId,
      materialVersion: homeVersion,
      targets: homeSpeakingEvidenceTargets(step.learning),
    };
  }
  if (source !== 'study' || itemId !== `${materialId}:speaking`) return undefined;
  const lesson = Object.hasOwn(content.lessons, materialId)
    ? content.lessons[materialId]
    : undefined;
  if (!lesson?.grammar) return undefined;
  const targetId = lesson.id === 'u01_l01' ? 'home.introduce' : lesson.grammar.skillId;
  return {
    source,
    contextId: materialId,
    materialVersion: studyMaterialVersion(content, lesson.id),
    targets: [{ targetId, dimension: 'speaking' }],
  };
}

export function recordSpeechPractice(
  learning: UnifiedLearningState,
  content: CourseData,
  body: unknown,
  now: number,
) {
  const input = practiceSchema.parse(body);
  const target = speechTarget(content, input);
  if (!target) return undefined;
  const metadata = {
    ...target,
    materialId: input.materialId,
    exerciseId: input.itemId,
    timestamp: Math.min(input.timestamp ?? now, now),
    format: 'speaking',
    aids: ['guided', 'answer_shown'],
    retry: input.retry,
    independent: false,
  } satisfies Omit<LearningEvidence, 'id' | 'activity'>;
  if (input.recognition) {
    recordUnifiedEvidence(learning, {
      ...metadata,
      id: `${input.id}:stt`,
      activity: 'speech_transcript',
      outcome:
        input.recognition === 'matched'
          ? 'target'
          : input.recognition === 'unmatched'
            ? 'incorrect'
            : 'ungradable',
    });
  }
  if (input.recording) {
    recordUnifiedEvidence(learning, {
      ...metadata,
      id: `${input.id}:recording`,
      activity: 'recording',
    });
  }
  return { saved: true };
}
