import { z } from 'zod';

export const answerSchema = z
  .object({
    optionId: z.string().max(100).optional(),
    text: z.string().max(2000).optional(),
    tokens: z.array(z.string().max(200)).max(60).optional(),
    matches: z
      .record(z.string().min(1).max(100), z.string().min(1).max(100))
      .refine(
        (pairs) => Object.keys(pairs).length > 0 && Object.keys(pairs).length <= 10,
        'Relaciona entre una y diez parejas.',
      )
      .optional(),
  })
  .strict()
  .refine(
    (a) => Object.values(a).filter((v) => v !== undefined).length === 1,
    'Envía una sola respuesta.',
  );
export type Answer = z.infer<typeof answerSchema>;
export const idSchema = z.string().min(8).max(100);
export const attemptSchema = z
  .object({
    clientAttemptId: idSchema,
    lessonId: z.string().min(1).max(60),
    exerciseId: z.string().min(1).max(100),
    answer: answerSchema,
    hintUsed: z.boolean().optional().default(false),
  })
  .strict();
export type AttemptInput = z.input<typeof attemptSchema>;
export const runSchema = z
  .object({
    clientRequestId: idSchema,
    trackId: z.enum(['present_simple', 'past_simple', 'real_life']),
    level: z.number().int().min(1).max(13),
    mode: z.enum(['practice', 'ranked']),
    type: z.enum(['grammar_rush', 'cloze_battle', 'reading_quest']).default('grammar_rush'),
    relaxed: z.boolean().default(false),
  })
  .strict();
export const submissionSchema = z
  .object({
    clientSubmissionId: idSchema,
    questionPosition: z.number().int().min(1).max(20),
    answer: answerSchema,
  })
  .strict();
export const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    goalMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]).optional(),
    motivation: z.enum(['travel', 'work', 'life']).optional(),
    reducedMotion: z.boolean().optional(),
  })
  .strict();
export const credentialsSchema = z
  .object({
    email: z
      .string()
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    password: z.string().min(8).max(128),
    name: z.string().trim().min(1).max(60).optional(),
  })
  .strict();

export type ExerciseType =
  'single_choice' | 'meaning' | 'matching' | 'cloze' | 'reorder' | 'correction' | 'short_text';
export type EvidenceDimension =
  'vocabulary_recognition' | 'vocabulary_recall' | 'grammar_understanding' | 'grammar_production';
export interface Translation {
  en: string;
  es: string;
}
export interface VocabularyItem {
  id: string;
  en: string;
  es: string;
  partOfSpeech: string;
  example: Translation;
  status: 'new' | 'review';
  audioAssetId?: string;
  illustrationAssetId?: string;
}
export interface LessonGrammar {
  skillId: string;
  prerequisiteSkillIds: string[];
  explanationEs: string;
  examples: Translation[];
  taughtForms?: Translation[];
}
export interface DialogueTurn extends Translation {
  speaker: string;
  glosses: Translation[];
}
export interface LessonStage {
  type: 'goal' | 'vocabulary' | 'grammar' | 'dialogue' | 'practice' | 'speaking' | 'recap';
  exerciseIds?: string[];
}
export interface PublicExercise {
  id: string;
  type: ExerciseType;
  promptEs: string;
  sentence?: string;
  options?: { id: string; text: string }[];
  tokens?: string[];
  skillId: string;
  passage?: string;
  difficulty: number;
  vocabularyIds?: string[];
  dimension?: EvidenceDimension;
  contextualGlosses?: Translation[];
  optionsLanguage?: 'en' | 'es';
  matchingPairs?: { id: string; left: string; right: string }[];
  requiredLessonIds?: string[];
}
export interface PublicLesson {
  id: string;
  unitId: string;
  title: string;
  introEs: string;
  examples: { en: string; es: string }[];
  speakingText: string;
  exercises: PublicExercise[];
  estimatedMinutes?: number;
  objectiveEs?: string;
  contextEs?: string;
  cefr?: 'A1' | 'A2';
  order?: number;
  properNames?: string[];
  vocabulary?: VocabularyItem[];
  grammar?: LessonGrammar;
  dialogue?: DialogueTurn[];
  stages?: LessonStage[];
  review?: { vocabularyIds: string[]; skillIds: string[] };
}
export interface User {
  id: string;
  name: string;
  email?: string;
  isGuest: boolean;
  goalMinutes: 5 | 10 | 15;
  motivation: 'travel' | 'work' | 'life';
  reducedMotion: boolean;
}
export interface Mastery {
  skillId: string;
  targetId?: string;
  dimension?: EvidenceDimension;
  practicedFormats?: ExerciseType[];
  value: number;
  evidenceCount: number;
  unpromptedSuccessCount: number;
  lastPracticedAt: string;
  nextReviewAt: string;
  lastDelayedSuccessAt: string | null;
}
export interface ChallengeProgress {
  trackId: string;
  type: string;
  highestLevel: number;
  bestScores: Record<string, number>;
  badge: boolean;
  mode: 'practice' | 'ranked';
}
export interface Progress {
  user: User;
  completedLessons: string[];
  xp: number;
  learningDays: string[];
  streak: number;
  mastery: Mastery[];
  reviewCount: number;
  challengeProgress: ChallengeProgress[];
}
export interface AttemptResult {
  correct: boolean;
  feedbackEs: string;
  acceptedAnswer?: string;
  xpAwarded: number;
  pending: false;
}
export type ChallengeStatus = 'active' | 'passed' | 'failed' | 'abandoned';
export interface RunView {
  runId: string;
  trackId: string;
  type: string;
  level: number;
  mode: 'practice' | 'ranked';
  relaxed: boolean;
  status: ChallengeStatus;
  deadlineAt: string | null;
  serverNow: string;
  heartsRemaining: number;
  heartsInitial: number;
  questionsTotal: number;
  completedQuestions: number;
  correctCount: number;
  score: number;
  reason?: string;
  question: PublicExercise | null;
  questionPosition: number;
  feedback?: { questionId: string; correct: boolean; feedbackEs: string; acceptedAnswer: string }[];
}
