import { z } from 'zod';
import { equivalentAnswerText } from '@lingoquest/contracts';
import { sha256Hex, utf8Bytes } from './hash.ts';
import { scenarioDefinitionSchema, scenarioTurnSchema } from './scenario.ts';
export { sha256Hex, utf8Bytes } from './hash.ts';
export * from './scenario.ts';
export const COURSE_PACK_FORMAT = 'lingoquest-course-pack' as const;
export const COURSE_PACK_SCHEMA_VERSION = 2 as const;
export const APP_VERSION = '2.2.0';
export const MAX_PACK_BYTES = 4 * 1024 * 1024;
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !forbiddenKeys.has(value), 'Identificador no permitido.');
const text = z
  .string()
  .min(1)
  .max(4000)
  .refine((value) => value.trim().length > 0, 'Falta el texto.');
const version = z
  .string()
  .max(32)
  .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, 'Usa una versión como 1.0.0.')
  .refine(
    (value) => value.split('.').every((part) => Number.isSafeInteger(Number(part))),
    'Versión fuera de rango.',
  );
const option = z.object({ id, text }).strict();
const translation = z.object({ en: text, es: text }).strict();
export const evidenceDimensionSchema = z.enum([
  'vocabulary_recognition',
  'vocabulary_recall',
  'grammar_understanding',
  'grammar_production',
]);
export const vocabularyItemSchema = z
  .object({
    id,
    en: text,
    es: text,
    partOfSpeech: text,
    example: translation,
    status: z.enum(['new', 'review']),
    audioAssetId: id.optional(),
    illustrationAssetId: id.optional(),
  })
  .strict();
const grammarSchema = z
  .object({
    skillId: id,
    prerequisiteSkillIds: z.array(id).max(20),
    explanationEs: text,
    examples: z.array(translation).min(1).max(10),
    taughtForms: z.array(translation).max(50).optional(),
  })
  .strict();
const dialogueTurnSchema = z
  .object({
    speaker: text,
    en: text,
    es: text,
    glosses: z.array(translation).max(30),
  })
  .strict();
const stageSchema = z
  .object({
    type: z.enum(['goal', 'vocabulary', 'grammar', 'dialogue', 'practice', 'speaking', 'recap']),
    exerciseIds: z.array(id).max(30).optional(),
  })
  .strict();
const assetSchema = z
  .object({
    id,
    kind: z.enum(['audio', 'illustration']),
    mimeType: z.enum([
      'audio/mpeg',
      'audio/ogg',
      'audio/wav',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ]),
    dataBase64: z
      .string()
      .min(4)
      .max(200000)
      .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
    provenance: text,
    license: text,
  })
  .strict();
const answerText = z
  .string()
  .min(1)
  .max(2000)
  .refine((value) => value.trim().length > 0);
const alternateAnswerMetadata = {
  introduction: z.object({ greetingRequired: z.boolean(), model: text }).strict().optional(),
  spelling: z.object({ model: text }).strict().optional(),
  communicationOnly: z
    .object({ answers: z.array(answerText).max(100), feedbackEs: text })
    .strict()
    .optional(),
  contextMismatch: z
    .object({ answers: z.array(answerText).min(1).max(240), feedbackEs: text })
    .strict()
    .optional(),
  ungradable: z.object({ feedbackEs: text }).strict().optional(),
};
export const courseExerciseSchema = z
  .object({
    id,
    type: z.enum([
      'single_choice',
      'meaning',
      'matching',
      'cloze',
      'reorder',
      'correction',
      'short_text',
    ]),
    promptEs: text,
    sentence: text.optional(),
    options: z.array(option).min(2).max(10).optional(),
    tokens: z.array(z.string().min(1).max(200)).min(1).max(60).optional(),
    skillId: id,
    feedbackEs: text,
    acceptedAnswers: z.array(answerText).min(1).max(30),
    correctOptionId: id.optional(),
    passage: z.string().min(1).max(20000).optional(),
    difficulty: z.number().int().min(1).max(13),
    vocabularyIds: z.array(id).max(30),
    dimension: evidenceDimensionSchema,
    contextualGlosses: z.array(translation).max(50).optional(),
    optionsLanguage: z.enum(['en', 'es']).optional(),
    matchingPairs: z
      .array(z.object({ id, left: text, right: text }).strict())
      .min(2)
      .max(10)
      .optional(),
    requiredLessonIds: z.array(id).min(1).max(32).optional(),
    ...alternateAnswerMetadata,
  })
  .strict();
export type CourseExercise = z.infer<typeof courseExerciseSchema>;
const lessonSummary = z
  .object({
    id,
    title: text,
    estimatedMinutes: z.number().int().min(1).max(120),
    skills: z.array(id).min(1).max(20),
    seq: z.number().int().min(1).max(100),
  })
  .strict();
const unitSchema = z
  .object({
    id,
    title: text,
    titleEs: text,
    description: text,
    cefr: z.enum(['A1', 'A2']),
    lessons: z.array(lessonSummary).min(1).max(20),
  })
  .strict();
export const lessonSchema = z
  .object({
    id,
    unitId: id,
    title: text,
    introEs: text,
    examples: z
      .array(z.object({ en: text, es: text }).strict())
      .min(1)
      .max(10),
    speakingText: text,
    exercises: z.array(courseExerciseSchema).min(1).max(30),
    estimatedMinutes: z.number().int().min(1).max(120),
    objectiveEs: text,
    contextEs: text,
    cefr: z.enum(['A1', 'A2']),
    order: z.number().int().min(1).max(1000),
    properNames: z.array(text).max(50).optional(),
    vocabulary: z.array(vocabularyItemSchema).min(1).max(15),
    grammar: grammarSchema,
    dialogue: z.array(dialogueTurnSchema).min(2).max(20),
    stages: z.array(stageSchema).length(7),
    review: z
      .object({ vocabularyIds: z.array(id).min(1).max(30), skillIds: z.array(id).min(1).max(20) })
      .strict(),
  })
  .strict();
const challengeLevel = z
  .object({
    level: z.number().int().min(1).max(13),
    name_es: text,
    hearts: z.number().int().min(1).max(10),
    grammar_rush_total_seconds: z.number().int().min(30).max(3600),
    grammar_rush_questions: z.literal(10),
    difficulty_tier: z.enum(['intro', 'intermediate', 'advanced', 'extreme']),
    reading_clock_multiplier: z.number().min(1).max(5),
    cloze_clock_multiplier: z.number().min(1).max(5),
  })
  .strict();
const missionStep = z
  .object({
    id,
    speaker: text,
    promptEn: text,
    hintEs: text,
    options: z.array(z.object({ id, text, nextStepId: id.optional() }).strict()).max(10),
  })
  .strict();
const mission = z
  .object({ id, titleEs: text, descriptionEs: text, steps: z.array(missionStep).min(1).max(50) })
  .strict();
const speech = z.object({ id, category: id, titleEs: text, textEn: text, tipEs: text }).strict();
export const coursePayloadSchema = z
  .object({
    units: z.array(unitSchema).min(1).max(100),
    lessons: z.record(id, lessonSchema),
    challengePools: z
      .object({
        grammar_rush: z.array(courseExerciseSchema).min(10).max(1000),
        cloze_battle: z.array(courseExerciseSchema).min(5).max(1000),
        reading_quest: z.array(courseExerciseSchema).min(4).max(1000),
      })
      .strict(),
    challengeLevels: z.array(challengeLevel).length(13),
    placementQuestions: z.array(courseExerciseSchema).min(1).max(15),
    missions: z.array(mission).max(20),
    speechDrills: z.array(speech).max(500),
    assets: z.array(assetSchema).max(100).default([]),
    contentStatus: z
      .object({
        version: text,
        status: z.enum(['draft_needs_human_review', 'reviewed']),
        rankedPublished: z.literal(false),
        source: text,
      })
      .strict(),
  })
  .strict();
export type CoursePayload = z.infer<typeof coursePayloadSchema>;
export type CourseUnit = CoursePayload['units'][number];
export type CourseLesson = CoursePayload['lessons'][string];

export const CHAPTER_PACK_FORMAT = 'lingoquest-chapter-pack' as const;
export const CHAPTER_PACK_SCHEMA_VERSION = 1 as const;
export const CHAPTER_CATALOG_FILE = 'catalog-v9.json';
export const MAX_CHAPTER_PACK_BYTES = 8 * 1024 * 1024;
export const MAX_CHAPTER_CATALOG_BYTES = 64 * 1024;
const chapterIdSchema = z.string().regex(/^[a-z][a-z-]{0,39}$/);
const chapterRevisionSchema = z.number().int().min(1).max(999999);
const chapterDigestSchema = z.string().regex(/^[a-f0-9]{64}$/);

const chapterLessonSchema = z
  .object({
    title: text,
    objectiveEs: text,
    dialogue: z
      .array(z.object({ speaker: text, en: text, es: text }).strict())
      .min(2)
      .max(12),
    vocabulary: z.array(translation).min(1).max(15),
    grammarEs: text,
    question: z
      .object({
        promptEs: text,
        options: z.array(text).min(2).max(6),
        answerIndex: z.number().int().nonnegative(),
        feedbackEs: text,
        listening: translation.optional(),
      })
      .strict()
      .refine(({ answerIndex, options }) => answerIndex < options.length),
    practiceEs: text,
    model: translation,
  })
  .strict();
export type ChapterLesson = z.infer<typeof chapterLessonSchema>;
export type ChapterLessonSource = ChapterLesson | [ChapterLesson, ...ChapterLesson[]];

const chapterMediaSchema = z
  .object({
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg']),
    dataBase64: z
      .string()
      .min(4)
      .max(1_500_000)
      .regex(/^[A-Za-z0-9+/]+={0,2}$/)
      .refine((data) => data.length % 4 === 0),
  })
  .strict();
export type ChapterMedia = z.infer<typeof chapterMediaSchema>;

const travelExercise = z
  .object({
    id,
    type: courseExerciseSchema.shape.type,
    promptEs: text,
    acceptedAnswers: z.array(z.string()),
    feedbackEs: text,
    skillId: id,
    ...alternateAnswerMetadata,
  })
  .passthrough();
const homeRuntime = z
  .object({
    lesson: z
      .object({
        id: z.literal('travel_home'),
        unitId: z.literal('travel'),
        title: text,
        introEs: text,
        examples: z.array(translation),
        speakingText: text,
        estimatedMinutes: z.number().positive(),
        exercises: z.array(travelExercise).min(1),
      })
      .passthrough(),
    placement: z
      .array(
        z
          .object({
            missionId: z.enum(['hello', 'bus', 'bag']),
            audio: text.optional(),
            exercise: travelExercise,
          })
          .strict(),
      )
      .length(6),
    challenges: z
      .object({
        grammar_rush: z.array(travelExercise).min(1),
        cloze_battle: z.array(travelExercise).min(1),
        reading_quest: z.array(travelExercise).min(1),
      })
      .strict(),
    course: coursePayloadSchema.omit({ units: true, lessons: true }),
  })
  .strict();

const storyRequirementsSchema = z.array(z.object({ id, form: text.optional() }).strict()).max(100);
export const rpgFormalDefinitionSchema = z
  .object({
    id,
    kind: z.enum(['lexical', 'pattern', 'grammar']),
    labelEs: text,
    forms: z.array(text).max(50),
    examples: z.array(translation).min(1).max(20),
  })
  .strict()
  .refine(({ kind, forms }) => (kind === 'grammar' ? !forms.length : !!forms.length));
export type RpgFormalDefinition = z.infer<typeof rpgFormalDefinitionSchema>;

export const rpgAssessmentTargetsSchema = z
  .array(
    z
      .object({
        targetId: id,
        dimension: z.enum([
          'vocabulary_recognition',
          'vocabulary_recall',
          'grammar_understanding',
          'grammar_production',
          'listening',
          'reading',
          'writing',
          'speaking',
        ]),
      })
      .strict(),
  )
  .min(1)
  .max(100);
export const rpgAnswerEvidenceSchema = z
  .array(
    z
      .object({
        answers: z.array(answerText).min(1).max(100),
        targets: rpgAssessmentTargetsSchema,
      })
      .strict(),
  )
  .min(1)
  .max(20);
const rpgAdventureAuditSchema = z
  .object({
    definitions: z.array(rpgFormalDefinitionSchema).max(500),
    teaching: z.record(id, chapterDigestSchema),
    assessments: z.record(id, chapterDigestSchema),
    scenarios: z.record(id, chapterDigestSchema).optional(),
    challenges: z
      .record(
        id,
        z.object({ digest: chapterDigestSchema, requires: storyRequirementsSchema }).strict(),
      )
      .optional(),
  })
  .strict();
export type RpgAdventureAudit = z.infer<typeof rpgAdventureAuditSchema>;

const storyInstructionSchema = z
  .object({
    lessonId: id,
    stage: z.enum(['vocabulary', 'grammar', 'both']),
    references: storyRequirementsSchema.optional(),
  })
  .strict();
export const travelStoryRepliesSchema = z
  .array(
    z
      .object({
        answers: z.array(z.string().min(1).max(2000)).min(1).max(500),
        speaker: z.string().min(1).max(100),
        line: translation,
      })
      .strict(),
  )
  .min(1)
  .max(30);
const storyStepSchema = z
  .object({
    id,
    type: z.enum(['dialogue', 'teach', 'exercise', 'speak']),
    lessonId: id.optional(),
    instruction: storyInstructionSchema.optional(),
    vocabularyTerms: z.array(text).max(100).optional(),
    requiredReply: z.literal(true).optional(),
    skipWhenMastered: z.literal(true).optional(),
    storyReplies: travelStoryRepliesSchema.optional(),
    scenarioTurn: scenarioTurnSchema.optional(),
    exercise: travelExercise.optional(),
    requires: storyRequirementsSchema.optional(),
    targets: rpgAssessmentTargetsSchema.optional(),
    answerEvidence: rpgAnswerEvidenceSchema.optional(),
    speech: z
      .object({
        selfCheck: z.literal(true).optional(),
        allowSystemRecognition: z.literal(true).optional(),
      })
      .strict()
      .optional(),
  })
  .passthrough()
  .refine(
    ({ storyReplies, scenarioTurn, type, exercise, requiredReply }) =>
      (!storyReplies && !scenarioTurn) ||
      (type === 'exercise' &&
        exercise?.type === 'short_text' &&
        (!scenarioTurn || (!!requiredReply && !storyReplies))),
  );

export const chapterPackSchema = z
  .object({
    format: z.literal(CHAPTER_PACK_FORMAT),
    schemaVersion: z.literal(CHAPTER_PACK_SCHEMA_VERSION),
    revision: chapterRevisionSchema,
    chapterId: chapterIdSchema,
    sha256: chapterDigestSchema,
    lesson: chapterLessonSchema,
    additionalLessons: z.array(chapterLessonSchema).max(30),
    unit: z
      .object({ id, titleEs: text, lessons: z.array(lessonSchema).min(1).max(20) })
      .strict()
      .optional(),
    story: z
      .object({
        chapter: z
          .object({
            id: chapterIdSchema,
            revision: chapterRevisionSchema,
            title: text,
            stamp: text,
            postcard: text,
            message: text,
            collectible: text,
            missions: z
              .array(
                z
                  .object({
                    id,
                    title: text,
                    place: text,
                    objective: text,
                    objectiveId: id.optional(),
                    scenario: scenarioDefinitionSchema.optional(),
                    optional: z.literal(true).optional(),
                    minutes: z.tuple([z.number().positive(), z.number().positive()]),
                    vocabulary: z.array(
                      z
                        .object({
                          term: text,
                          example: translation,
                          teaches: storyRequirementsSchema.optional(),
                        })
                        .passthrough(),
                    ),
                    steps: z.array(storyStepSchema).min(1),
                  })
                  .passthrough()
                  .refine(({ steps, scenario }) => {
                    const turns = steps.flatMap(({ scenarioTurn }) =>
                      scenarioTurn ? [scenarioTurn.action] : [],
                    );
                    if (!scenario) return !turns.length;
                    if ('kind' in scenario) {
                      return (
                        turns.length === 2 &&
                        turns[0] === 'inquire' &&
                        turns[1] === 'record' &&
                        steps.every(
                          ({ scenarioTurn }) =>
                            !scenarioTurn ||
                            ('focusEventIds' in scenarioTurn &&
                              [
                                ...scenarioTurn.focusEventIds,
                                ...(scenarioTurn.eventTargets ?? []).map(({ eventId }) => eventId),
                              ].every((eventId) =>
                                scenario.events.some(({ id }) => id === eventId),
                              )),
                        )
                      );
                    }
                    const menu = turns[0] === 'menu';
                    const request = turns.indexOf('request');
                    const firstConfirmation = turns.indexOf('confirm');
                    const replacement = turns.indexOf('replace');
                    const lastConfirmation = turns.lastIndexOf('confirm');
                    const finish = turns.indexOf('finish');
                    return (
                      menu &&
                      request > 0 &&
                      firstConfirmation > request &&
                      (replacement === -1 ||
                        (replacement > request && lastConfirmation > replacement)) &&
                      finish > lastConfirmation &&
                      turns.at(-1) === 'bill'
                    );
                  }),
              )
              .min(1),
          })
          .passthrough(),
        adventure: z
          .object({
            id: chapterIdSchema,
            revision: chapterRevisionSchema,
            initialSceneId: id,
            scenes: z
              .array(z.object({ id, art: id, hotspots: z.array(z.unknown()) }).passthrough())
              .min(1),
            dialogues: z
              .array(z.object({ id, choices: z.array(z.unknown()) }).passthrough())
              .min(1),
            encounters: z.array(z.object({ id, missionId: id }).passthrough()),
            npcs: z.array(z.object({ id }).passthrough()),
            quests: z.array(z.object({ id, goals: z.array(z.unknown()) }).passthrough()),
            items: z.array(z.object({ id }).passthrough()),
          })
          .passthrough(),
        practice: z.array(z.unknown()).min(1),
        runtime: homeRuntime.optional(),
        challenges: homeRuntime.shape.challenges.optional(),
        supportingLessons: z.array(lessonSchema).max(8).optional(),
        audit: rpgAdventureAuditSchema.optional(),
      })
      .strict()
      .optional(),
    images: z.record(id, chapterMediaSchema),
    audio: z.record(text, chapterMediaSchema),
  })
  .strict()
  .refine(({ chapterId, revision, lesson, additionalLessons, unit, story, images, audio }) => {
    const requiredImages =
      chapterId === 'home'
        ? [
            'cover',
            'story-plaza',
            'bus',
            'bag',
            'story-sam',
            'story-luz',
            'story-sam-portrait',
            'story-luz-portrait',
          ]
        : ['cover'];
    if (chapterId === 'home' && !story) return false;
    if (story) {
      const { chapter, adventure } = story;
      if (
        chapter.id !== chapterId ||
        adventure.id !== chapterId ||
        !adventure.scenes.some(({ id }) => id === adventure.initialSceneId)
      )
        return false;
      const home = chapterId === 'home';
      if (home && story.challenges) return false;
      if (
        home &&
        !story.audit &&
        (story.supportingLessons || chapter.missions.some(({ optional }) => optional))
      )
        return false;
      if (!home || story.audit) {
        if (
          (home ? !story.runtime : !!story.runtime) ||
          !unit ||
          !adventure.scenes.every(({ art }) => Object.hasOwn(images, art))
        )
          return false;
        const storyLessons = [
          ...unit.lessons,
          ...(story.supportingLessons ?? []),
          ...(story.runtime ? [story.runtime.lesson] : []),
        ];
        const lessons = new Set(storyLessons.map(({ id }) => id));
        if (lessons.size !== storyLessons.length) return false;
        const missions = new Set(chapter.missions.map(({ id }) => id));
        if (
          missions.size !== chapter.missions.length ||
          !adventure.encounters.every(({ missionId }) => missions.has(missionId))
        )
          return false;
        if (
          !chapter.missions.every(({ vocabulary, steps }) =>
            steps.every(
              ({ type, vocabularyTerms }) =>
                !vocabularyTerms ||
                (type === 'teach' &&
                  new Set(vocabularyTerms).size === vocabularyTerms.length &&
                  vocabularyTerms.every((term) => vocabulary.some((word) => word.term === term))),
            ),
          )
        )
          return false;
        const practice = z.array(storyStepSchema).safeParse(story.practice);
        if (!practice.success || practice.data.some(({ type }) => type !== 'exercise'))
          return false;
        const steps = [...chapter.missions.flatMap(({ steps }) => steps), ...practice.data];
        const auditedSteps = home
          ? [
              ...chapter.missions.filter(({ optional }) => optional).flatMap(({ steps }) => steps),
              ...steps.filter((step) => step.instruction || step.requires || step.targets),
            ]
          : steps;
        if (
          !auditedSteps.every(
            ({ type, instruction, lessonId, exercise, requires, requiredReply, targets }) =>
              type === 'exercise'
                ? !!(
                    lessonId &&
                    lessons.has(lessonId) &&
                    exercise &&
                    requires?.length &&
                    (!story.audit || targets?.length)
                  )
                : !requiredReply &&
                  (!instruction || (type === 'teach' && lessons.has(instruction.lessonId))),
          )
        )
          return false;
        const practiceIds = steps.flatMap(({ exercise }) => (exercise ? [exercise.id] : []));
        if (new Set(practiceIds).size !== practiceIds.length) return false;
      }
    }
    return (
      requiredImages.every((key) => Object.hasOwn(images, key)) &&
      Object.values(images).every((media) => media.mimeType !== 'audio/mpeg') &&
      Object.values(audio).every((media) => media.mimeType === 'audio/mpeg') &&
      chapterLessonPhrases([lesson, ...additionalLessons], unit?.lessons).every((phrase) =>
        Object.hasOwn(audio, phrase),
      ) &&
      (unit?.lessons.every((item) => item.unitId === unit.id) ?? true) &&
      (chapterId !== 'home' ||
        revision === 1 ||
        (!!story?.runtime &&
          [
            'world',
            'atlas',
            'passport',
            'expedition',
            'sam',
            'plaza',
            'welcome',
            'review',
            'writing',
            'luz',
          ].every((key) => Object.hasOwn(images, key))))
    );
  }, 'Faltan recursos del capítulo o algún recurso tiene un formato incorrecto.');
export type ChapterPack = z.infer<typeof chapterPackSchema>;

export function chapterLessonPhrases(
  lessons: readonly ChapterLesson[],
  unitLessons: readonly CourseLesson[] = [],
) {
  return [
    ...new Set([
      ...lessons.flatMap((lesson) => [
        ...lesson.dialogue.map(({ en }) => en),
        ...lesson.vocabulary.map(({ en }) => en),
        lesson.model.en,
        ...(lesson.question.listening ? [lesson.question.listening.en] : []),
      ]),
      ...unitLessons.flatMap((item) => [
        item.speakingText,
        ...item.examples.map(({ en }) => en),
        ...item.vocabulary.flatMap(({ en, example }) => [en, example.en]),
        ...item.grammar.examples.map(({ en }) => en),
        ...item.dialogue.map(({ en }) => en),
      ]),
    ]),
  ];
}

export function serializeChapterPack(content: Omit<ChapterPack, 'sha256'>): string {
  const body = JSON.stringify(content);
  return `${body.slice(0, -1)},"sha256":"${sha256Hex(body)}"}\n`;
}

export function parseChapterPack(source: string, expectedId: string): ChapterPack {
  if (source.length > MAX_CHAPTER_PACK_BYTES || utf8Bytes(source).length > MAX_CHAPTER_PACK_BYTES)
    throw new Error('El paquete del capítulo es demasiado grande.');
  let input: unknown;
  try {
    input = JSON.parse(source);
  } catch {
    throw new Error('No pudimos leer el archivo del capítulo.');
  }
  const pack = chapterPackSchema.safeParse(input);
  if (!pack.success || pack.data.chapterId !== expectedId)
    throw new Error('El archivo no contiene un paquete compatible para este capítulo.');
  const { sha256, ...content } = input as ChapterPack;
  if (sha256Hex(JSON.stringify(content)) !== sha256)
    throw new Error('El paquete del capítulo está incompleto o dañado.');
  return pack.data;
}

export const chapterCatalogSchema = z
  .object({
    format: z.literal('lingoquest-chapter-catalog'),
    schemaVersion: z.literal(CHAPTER_PACK_SCHEMA_VERSION),
    chapters: z.record(
      chapterIdSchema,
      z
        .object({
          revision: chapterRevisionSchema,
          sizeBytes: z.number().int().min(1).max(MAX_CHAPTER_PACK_BYTES),
          sha256: chapterDigestSchema,
        })
        .strict(),
    ),
  })
  .strict();
export type ChapterCatalog = z.infer<typeof chapterCatalogSchema>;

export const courseManifestSchema = z
  .object({
    format: z.literal(COURSE_PACK_FORMAT),
    schemaVersion: z.literal(COURSE_PACK_SCHEMA_VERSION),
    packageId: id,
    version,
    minAppVersion: version,
    titleEs: text,
    locale: z.literal('es-419'),
    targetLanguage: z.literal('en-US'),
    createdAt: z.string().datetime(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type CourseManifest = z.infer<typeof courseManifestSchema>;
export const coursePackSchema = z
  .object({ manifest: courseManifestSchema, payload: coursePayloadSchema })
  .strict();
export type CoursePack = z.infer<typeof coursePackSchema>;
export type CoursePackMetadata = Omit<CourseManifest, 'format' | 'schemaVersion' | 'sha256'>;
export class CoursePackError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'CoursePackError';
  }
}
/** Stable JSON independent of object insertion order. No executable code, path entries or prototype keys. */
export function canonicalStringify(value: unknown): string {
  function visit(current: unknown, depth: number): unknown {
    if (depth > 32)
      throw new CoursePackError('El paquete tiene demasiados niveles de datos.', 'DEPTH_LIMIT');
    if (current === null || typeof current === 'string' || typeof current === 'boolean')
      return current;
    if (typeof current === 'number') {
      if (!Number.isFinite(current)) throw new CoursePackError('Número inválido.', 'INVALID_DATA');
      return current;
    }
    if (Array.isArray(current)) return current.map((v) => visit(v, depth + 1));
    if (typeof current === 'object') {
      const obj = current as Record<string, unknown>;
      const output: Record<string, unknown> = {};
      for (const key of Object.keys(obj).sort()) {
        if (forbiddenKeys.has(key))
          throw new CoursePackError('El paquete contiene una clave no permitida.', 'INVALID_KEY');
        if (obj[key] !== undefined) output[key] = visit(obj[key], depth + 1);
      }
      return output;
    }
    throw new CoursePackError('El paquete contiene un valor inválido.', 'INVALID_DATA');
  }
  return JSON.stringify(visit(value, 0));
}
export function compareVersions(a: string, b: string): number {
  version.parse(a);
  version.parse(b);
  const left = a.split('.').map(Number),
    right = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  }
  return 0;
}
/** English tokens are checked against explicit teaching, not a hidden English starter list. */
const englishWords = (value: string) =>
  value
    .toLowerCase()
    .replace(/’/g, "'")
    .match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
const normalizedChoice = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
export function validateReferences(payload: CoursePayload) {
  const errors: string[] = [];
  const unitIds = new Set<string>(),
    lessonIds = new Set<string>(),
    exerciseIds = new Set<string>();
  const knownVocabulary = new Map<string, { en: string; es: string }>();
  const knownSkills = new Set<string>();
  const knownWords = new Set<string>();
  const assetIds = new Map(payload.assets.map((asset) => [asset.id, asset.kind]));
  if (assetIds.size !== payload.assets.length) errors.push('Recursos repetidos.');
  for (const asset of payload.assets)
    if (!asset.mimeType.startsWith(asset.kind === 'audio' ? 'audio/' : 'image/'))
      errors.push(`Tipo de recurso incompatible: ${asset.id}`);
  const addWords = (target: Set<string>, value: string) =>
    englishWords(value).forEach((word) => target.add(word));
  const checkExercise = (exercise: CourseExercise) => {
    if (exerciseIds.has(exercise.id)) errors.push(`Ejercicio repetido: ${exercise.id}`);
    exerciseIds.add(exercise.id);
    const hasOpenResponse = !exercise.options && exercise.type !== 'matching';
    if (
      exercise.introduction &&
      (!hasOpenResponse ||
        exercise.type !== 'short_text' ||
        !exercise.introduction.model.includes('[tu nombre]'))
    )
      errors.push(`Modelo de presentación inválido: ${exercise.id}`);
    if (exercise.communicationOnly) {
      if (
        !hasOpenResponse ||
        (!exercise.introduction && !exercise.communicationOnly.answers.length)
      )
        errors.push(`Falta una respuesta comunicativa válida: ${exercise.id}`);
      if (
        exercise.communicationOnly.answers.some((answer) =>
          exercise.acceptedAnswers.some((model) => equivalentAnswerText(answer, model)),
        )
      )
        errors.push(`La respuesta comunicativa coincide con el objetivo: ${exercise.id}`);
    }
    if (
      exercise.contextMismatch &&
      (!hasOpenResponse ||
        exercise.introduction ||
        exercise.spelling ||
        exercise.contextMismatch.answers.some((answer) =>
          [...exercise.acceptedAnswers, ...(exercise.communicationOnly?.answers ?? [])].some(
            (model) => equivalentAnswerText(answer, model),
          ),
        ))
    )
      errors.push(`La respuesta de otro contexto coincide con un criterio válido: ${exercise.id}`);
    if (
      exercise.ungradable &&
      (exercise.introduction || exercise.communicationOnly || exercise.contextMismatch)
    )
      errors.push(`Criterios de evaluación incompatibles: ${exercise.id}`);
    if (new Set(exercise.vocabularyIds).size !== exercise.vocabularyIds.length)
      errors.push(`Vocabulario repetido en ejercicio: ${exercise.id}`);
    if (exercise.options) {
      const ids = exercise.options.map((o) => o.id);
      if (
        new Set(ids).size !== ids.length ||
        new Set(exercise.options.map((o) => normalizedChoice(o.text))).size !== ids.length
      )
        errors.push(`Opciones repetidas o ambiguas: ${exercise.id}`);
      if (!exercise.correctOptionId || !ids.includes(exercise.correctOptionId))
        errors.push(`Respuesta de opción inválida: ${exercise.id}`);
      const correct = exercise.options.find((option) => option.id === exercise.correctOptionId);
      if (
        correct &&
        !exercise.acceptedAnswers.some(
          (answer) => answer === correct.id || equivalentAnswerText(answer, correct.text),
        )
      )
        errors.push(`La respuesta no coincide con la opción correcta: ${exercise.id}`);
      if (
        exercise.options.some(
          (option) =>
            option.id !== exercise.correctOptionId &&
            exercise.acceptedAnswers.some(
              (answer) => answer === option.id || equivalentAnswerText(answer, option.text),
            ),
        )
      )
        errors.push(`Una opción incorrecta coincide con una respuesta aceptada: ${exercise.id}`);
    } else if (exercise.correctOptionId) errors.push(`Opción sin lista: ${exercise.id}`);
    if (['single_choice', 'meaning'].includes(exercise.type) && !exercise.options)
      errors.push(`Faltan opciones: ${exercise.id}`);
    if (exercise.type === 'reorder') {
      if (!exercise.tokens?.length) errors.push(`Faltan palabras: ${exercise.id}`);
      else if (
        !exercise.acceptedAnswers.every(
          (answer) =>
            englishWords(answer).sort().join('|') ===
            englishWords(exercise.tokens!.join(' ')).sort().join('|'),
        )
      )
        errors.push(`Las palabras no permiten construir una respuesta: ${exercise.id}`);
    }
    if (exercise.type === 'matching') {
      const pairs = exercise.matchingPairs ?? [];
      if (
        pairs.length < 2 ||
        new Set(pairs.map((p) => p.id)).size !== pairs.length ||
        new Set(pairs.map((p) => normalizedChoice(p.left))).size !== pairs.length ||
        new Set(pairs.map((p) => normalizedChoice(p.right))).size !== pairs.length
      )
        errors.push(`Parejas incompletas o ambiguas: ${exercise.id}`);
    } else if (exercise.matchingPairs)
      errors.push(`Parejas en otro tipo de ejercicio: ${exercise.id}`);
    if (exercise.dimension.startsWith('vocabulary_') && exercise.vocabularyIds.length === 0)
      errors.push(`Falta el vocabulario evaluado: ${exercise.id}`);
    if (
      ['vocabulary_recall', 'grammar_production'].includes(exercise.dimension) &&
      ['single_choice', 'meaning', 'matching'].includes(exercise.type)
    )
      errors.push(`El reconocimiento no demuestra producción: ${exercise.id}`);
  };
  const checkEnglish = (exercise: CourseExercise, words: Set<string>) => {
    const supported = new Set(words);
    exercise.contextualGlosses?.forEach((gloss) => addWords(supported, gloss.en));
    const texts = [
      exercise.sentence ?? '',
      exercise.passage ?? '',
      ...(exercise.tokens ?? []),
      ...(exercise.matchingPairs?.map((pair) => pair.left) ?? []),
    ];
    if (exercise.optionsLanguage !== 'es')
      texts.push(...(exercise.options?.map((option) => option.text) ?? []));
    if (exercise.type !== 'matching' && exercise.optionsLanguage !== 'es')
      texts.push(
        ...exercise.acceptedAnswers.filter(
          (answer) => !exercise.options?.some((option) => option.id === answer),
        ),
      );
    const unknown = new Set(texts.flatMap(englishWords).filter((word) => !supported.has(word)));
    if (unknown.size)
      errors.push(`Vocabulario sin explicar en ${exercise.id}: ${[...unknown].join(', ')}`);
  };
  if (Object.keys(payload.lessons).length > 1000) errors.push('Demasiadas lecciones.');
  const orderedLessons: CourseLesson[] = [];
  for (const unit of payload.units) {
    if (unitIds.has(unit.id)) errors.push(`Unidad repetida: ${unit.id}`);
    unitIds.add(unit.id);
    const sequences = new Set<number>();
    for (const [lessonIndex, summary] of unit.lessons.entries()) {
      if (lessonIds.has(summary.id)) errors.push(`Lección repetida: ${summary.id}`);
      lessonIds.add(summary.id);
      if (sequences.has(summary.seq)) errors.push(`Orden repetido: ${unit.id}`);
      if (summary.seq !== lessonIndex + 1)
        errors.push(`Secuencia de lección inválida: ${summary.id}`);
      sequences.add(summary.seq);
      const lesson = payload.lessons[summary.id];
      if (!lesson || lesson.id !== summary.id || lesson.unitId !== unit.id)
        errors.push(`Referencia de lección inválida: ${summary.id}`);
      else {
        orderedLessons.push(lesson);
        if (lesson.cefr !== unit.cefr) errors.push(`Nivel de lección incorrecto: ${lesson.id}`);
        if (!summary.skills.includes(lesson.grammar.skillId))
          errors.push(`Falta la habilidad principal: ${lesson.id}`);
      }
    }
  }
  const orders = new Set<number>();
  const scopeByLesson = new Map<
    string,
    { vocabulary: Set<string>; skills: Set<string>; words: Set<string> }
  >();
  for (const lesson of orderedLessons) {
    if (orders.has(lesson.order) || (orders.size > 0 && lesson.order <= Math.max(...orders)))
      errors.push(`Orden de lección inválido: ${lesson.id}`);
    orders.add(lesson.order);
    for (const prerequisite of lesson.grammar.prerequisiteSkillIds)
      if (!knownSkills.has(prerequisite))
        errors.push(`Prerrequisito no aprendido: ${prerequisite}`);
    const localIds = new Set<string>();
    for (const item of lesson.vocabulary) {
      if (localIds.has(item.id)) errors.push(`Vocabulario repetido en lección: ${item.id}`);
      localIds.add(item.id);
      const previous = knownVocabulary.get(item.id);
      if (item.status === 'review') {
        if (!previous || previous.en !== item.en || previous.es !== item.es)
          errors.push(`Repaso de vocabulario desconocido o distinto: ${item.id}`);
      } else {
        if (previous) errors.push(`Vocabulario nuevo repetido: ${item.id}`);
        knownVocabulary.set(item.id, { en: item.en, es: item.es });
      }
      addWords(knownWords, item.en);
      if (item.audioAssetId && assetIds.get(item.audioAssetId) !== 'audio')
        errors.push(`Audio no incluido: ${item.audioAssetId}`);
      if (item.illustrationAssetId && assetIds.get(item.illustrationAssetId) !== 'illustration')
        errors.push(`Ilustración no incluida: ${item.illustrationAssetId}`);
    }
    lesson.grammar.taughtForms?.forEach((form) => addWords(knownWords, form.en));
    knownSkills.add(lesson.grammar.skillId);
    const lessonWords = new Set(knownWords);
    lesson.properNames?.forEach((name) => addWords(lessonWords, name));
    const expectedStages = [
      'goal',
      'vocabulary',
      'grammar',
      'dialogue',
      'practice',
      'speaking',
      'recap',
    ];
    if (lesson.stages.some((stage, i) => stage.type !== expectedStages[i]))
      errors.push(`Orden de etapas inválido: ${lesson.id}`);
    const exerciseMap = new Map(lesson.exercises.map((exercise) => [exercise.id, exercise]));
    const assigned = new Set<string>();
    for (const stage of lesson.stages) {
      if (stage.exerciseIds?.length && !['vocabulary', 'practice'].includes(stage.type))
        errors.push(`Ejercicios en etapa incompatible: ${lesson.id}`);
      for (const exerciseId of stage.exerciseIds ?? []) {
        const exercise = exerciseMap.get(exerciseId);
        if (!exercise || assigned.has(exerciseId))
          errors.push(`Ejercicio de etapa inválido: ${exerciseId}`);
        if (
          exercise &&
          stage.type === 'vocabulary' &&
          !['meaning', 'matching', 'single_choice'].includes(exercise.type)
        )
          errors.push(`El vocabulario debe empezar con reconocimiento: ${exerciseId}`);
        assigned.add(exerciseId);
      }
    }
    if (
      assigned.size !== lesson.exercises.length ||
      !lesson.stages.find((stage) => stage.type === 'vocabulary')?.exerciseIds?.length ||
      !lesson.stages.find((stage) => stage.type === 'practice')?.exerciseIds?.length
    )
      errors.push(`Faltan ejercicios en las etapas: ${lesson.id}`);
    for (const exercise of lesson.exercises) {
      checkExercise(exercise);
      if (!knownSkills.has(exercise.skillId))
        errors.push(`Habilidad desconocida: ${exercise.skillId}`);
      for (const vocabularyId of exercise.vocabularyIds)
        if (!knownVocabulary.has(vocabularyId))
          errors.push(`Vocabulario no aprendido: ${vocabularyId}`);
      checkEnglish(exercise, lessonWords);
    }
    for (const vocabularyId of lesson.review.vocabularyIds)
      if (!knownVocabulary.has(vocabularyId))
        errors.push(`Repaso de vocabulario inválido: ${vocabularyId}`);
    for (const skillId of lesson.review.skillIds)
      if (!knownSkills.has(skillId)) errors.push(`Repaso de gramática inválido: ${skillId}`);
    scopeByLesson.set(lesson.id, {
      vocabulary: new Set(knownVocabulary.keys()),
      skills: new Set(knownSkills),
      words: lessonWords,
    });
  }
  for (const [key, lesson] of Object.entries(payload.lessons))
    if (key !== lesson.id || !lessonIds.has(key) || !unitIds.has(lesson.unitId))
      errors.push(`Lección fuera del curso: ${key}`);
  Object.values(payload.challengePools).forEach((pool) =>
    pool.forEach((exercise) => {
      checkExercise(exercise);
      if (!exercise.requiredLessonIds?.length)
        errors.push(`Desafío sin requisitos: ${exercise.id}`);
      const scopes = (exercise.requiredLessonIds ?? []).map((lessonId) =>
        scopeByLesson.get(lessonId),
      );
      if (scopes.some((scope) => !scope))
        errors.push(`Requisito de desafío desconocido: ${exercise.id}`);
      const skills = new Set(scopes.flatMap((scope) => (scope ? [...scope.skills] : [])));
      const vocabulary = new Set(scopes.flatMap((scope) => (scope ? [...scope.vocabulary] : [])));
      if (!skills.has(exercise.skillId))
        errors.push(`Desafío con habilidad no aprendida: ${exercise.id}`);
      for (const vocabularyId of exercise.vocabularyIds)
        if (!vocabulary.has(vocabularyId))
          errors.push(`Desafío con vocabulario no aprendido: ${exercise.id}`);
      checkEnglish(exercise, new Set(scopes.flatMap((scope) => (scope ? [...scope.words] : []))));
    }),
  );
  payload.placementQuestions.forEach((exercise) => {
    checkExercise(exercise);
    if (!knownSkills.has(exercise.skillId))
      errors.push(`Habilidad de diagnóstico desconocida: ${exercise.id}`);
    exercise.vocabularyIds.forEach((vocabularyId) => {
      if (!knownVocabulary.has(vocabularyId))
        errors.push(`Vocabulario de diagnóstico desconocido: ${vocabularyId}`);
    });
  });
  const levels = payload.challengeLevels;
  for (let i = 0; i < 13; i++) {
    if (levels[i].level !== i + 1) errors.push('Los niveles deben ir del 1 al 13.');
    if (
      i > 0 &&
      (levels[i].hearts > levels[i - 1].hearts ||
        levels[i].grammar_rush_total_seconds > levels[i - 1].grammar_rush_total_seconds)
    )
      errors.push('Las reglas de dificultad no son progresivas.');
  }
  const missionIds = new Set<string>();
  for (const item of payload.missions) {
    if (missionIds.has(item.id)) errors.push(`Misión repetida: ${item.id}`);
    missionIds.add(item.id);
    const steps = new Set(item.steps.map((step) => step.id));
    if (steps.size !== item.steps.length) errors.push(`Paso repetido: ${item.id}`);
    for (const step of item.steps) {
      if (new Set(step.options.map((option) => option.id)).size !== step.options.length)
        errors.push(`Opciones de misión repetidas: ${item.id}`);
      for (const choice of step.options)
        if (choice.nextStepId && !steps.has(choice.nextStepId))
          errors.push(`Paso de misión desconocido: ${choice.nextStepId}`);
    }
  }
  if (new Set(payload.speechDrills.map((drill) => drill.id)).size !== payload.speechDrills.length)
    errors.push('Prácticas de voz repetidas.');
  if (errors.length)
    throw new CoursePackError(
      `El contenido no es válido: ${errors.slice(0, 8).join('; ')}`,
      'INVALID_REFERENCES',
    );
}

function checksum(manifest: Omit<CourseManifest, 'sha256'>, payload: CoursePayload) {
  return sha256Hex(canonicalStringify({ manifest, payload }));
}
export function validateCoursePack(input: unknown, appVersion = APP_VERSION): CoursePack {
  // Check raw JSON keys before Zod can normalize an object.
  canonicalStringify(input);
  const result = coursePackSchema.safeParse(input);
  if (!result.success)
    throw new CoursePackError(
      'El archivo no tiene un formato de curso compatible.',
      'INVALID_SCHEMA',
    );
  const pack = result.data;
  if (compareVersions(appVersion, pack.manifest.minAppVersion) < 0)
    throw new CoursePackError('Actualiza la app para usar este paquete.', 'APP_UPDATE_REQUIRED');
  validateReferences(pack.payload);
  const { sha256, ...metadata } = pack.manifest;
  if (checksum(metadata, pack.payload) !== sha256)
    throw new CoursePackError(
      'La verificación del paquete falló. Descárgalo de nuevo.',
      'CHECKSUM_MISMATCH',
    );
  return pack;
}
export function parseCoursePack(text: string, appVersion = APP_VERSION): CoursePack {
  if (text.length > MAX_PACK_BYTES || utf8Bytes(text).length > MAX_PACK_BYTES)
    throw new CoursePackError('El paquete supera el tamaño permitido de 4 MB.', 'SIZE_LIMIT');
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    throw new CoursePackError('No pudimos leer este archivo JSON.', 'INVALID_JSON');
  }
  return validateCoursePack(input, appVersion);
}
export function createCoursePack(
  payloadInput: unknown,
  metadataInput: CoursePackMetadata,
): CoursePack {
  const payload = coursePayloadSchema.parse(payloadInput);
  validateReferences(payload);
  const rawMetadata = { ...metadataInput } as Record<string, unknown>;
  delete rawMetadata.sha256;
  delete rawMetadata.format;
  delete rawMetadata.schemaVersion;
  const metadata = courseManifestSchema.omit({ sha256: true }).parse({
    ...rawMetadata,
    format: COURSE_PACK_FORMAT,
    schemaVersion: COURSE_PACK_SCHEMA_VERSION,
  });
  const pack = { manifest: { ...metadata, sha256: checksum(metadata, payload) }, payload };
  return validateCoursePack(pack, metadata.minAppVersion);
}
export function serializeCoursePack(pack: CoursePack): string {
  return `${canonicalStringify(pack)}\n`;
}
const githubUrl = z
  .string()
  .max(2048)
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        ['github.com', 'raw.githubusercontent.com'].includes(url.hostname) &&
        (!url.port || url.port === '443') &&
        !url.hash
      );
    } catch {
      return false;
    }
  }, 'Usa una URL HTTPS de GitHub.');
export const courseCatalogSchema = z
  .object({
    format: z.literal('lingoquest-course-catalog'),
    schemaVersion: z.literal(1),
    updatedAt: z.string().datetime(),
    packages: z
      .array(
        z
          .object({
            packageId: id,
            version,
            titleEs: text,
            url: githubUrl,
            sha256: z.string().regex(/^[a-f0-9]{64}$/),
            sizeBytes: z.number().int().min(1).max(MAX_PACK_BYTES),
            minAppVersion: version,
            locale: z.literal('es-419'),
            targetLanguage: z.literal('en-US'),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict();
export type CourseCatalog = z.infer<typeof courseCatalogSchema>;
export function parseCourseCatalog(text: string): CourseCatalog {
  if (utf8Bytes(text).length > 128 * 1024)
    throw new CoursePackError('El catálogo es demasiado grande.', 'SIZE_LIMIT');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new CoursePackError('El catálogo no es válido.', 'INVALID_JSON');
  }
  const result = courseCatalogSchema.safeParse(parsed);
  if (!result.success)
    throw new CoursePackError('El catálogo no tiene un formato compatible.', 'INVALID_CATALOG');
  const keys = result.data.packages.map((entry) => `${entry.packageId}:${entry.version}`);
  if (new Set(keys).size !== keys.length)
    throw new CoursePackError('El catálogo tiene versiones repetidas.', 'INVALID_CATALOG');
  return result.data;
}

/** Preserve the validated file path: React Native URL.toString() adds a trailing slash. */
export function validateGitHubCourseDownloadUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Pega el enlace HTTPS del archivo de curso en GitHub.');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.hash ||
    (url.port && url.port !== '443') ||
    !['github.com', 'raw.githubusercontent.com'].includes(url.hostname)
  )
    throw new Error('Usa un enlace HTTPS de github.com o raw.githubusercontent.com.');
  if (url.hostname === 'github.com' && !url.pathname.includes('/releases/download/'))
    throw new Error('Usa el enlace del archivo en GitHub Releases, no la página del repositorio.');
  return value.trim();
}
