import { z } from 'zod';
import { sha256Hex, utf8Bytes } from './hash';
export { sha256Hex, utf8Bytes } from './hash';
export const COURSE_PACK_FORMAT = 'lingoquest-course-pack' as const;
export const COURSE_PACK_SCHEMA_VERSION = 1 as const;
export const APP_VERSION = '1.2.0';
export const MAX_PACK_BYTES = 4 * 1024 * 1024;
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !forbiddenKeys.has(value), 'Identificador no permitido.');
const text = z.string().min(1).max(4000);
const version = z
  .string()
  .max(32)
  .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, 'Usa una versión como 1.0.0.')
  .refine(
    (value) => value.split('.').every((part) => Number.isSafeInteger(Number(part))),
    'Versión fuera de rango.',
  );
const option = z.object({ id, text }).strict();
export const courseExerciseSchema = z
  .object({
    id,
    type: z.enum(['single_choice', 'cloze', 'reorder', 'correction', 'short_text']),
    promptEs: text,
    sentence: text.optional(),
    options: z.array(option).min(2).max(10).optional(),
    tokens: z.array(z.string().min(1).max(200)).min(1).max(60).optional(),
    skillId: id,
    feedbackEs: text,
    acceptedAnswers: z.array(z.string().min(1).max(2000)).min(1).max(30),
    correctOptionId: id.optional(),
    passage: z.string().min(1).max(20000).optional(),
    difficulty: z.number().int().min(1).max(13),
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
const lessonSchema = z
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
function validateReferences(payload: CoursePayload) {
  const errors: string[] = [];
  const unitIds = new Set<string>(),
    lessonIds = new Set<string>(),
    exerciseIds = new Set<string>();
  const checkExercise = (exercise: CourseExercise) => {
    if (exerciseIds.has(exercise.id)) errors.push(`Ejercicio repetido: ${exercise.id}`);
    exerciseIds.add(exercise.id);
    if (exercise.options) {
      const ids = exercise.options.map((o) => o.id);
      if (new Set(ids).size !== ids.length) errors.push(`Opciones repetidas: ${exercise.id}`);
      if (!exercise.correctOptionId || !ids.includes(exercise.correctOptionId))
        errors.push(`Respuesta de opción inválida: ${exercise.id}`);
    } else if (exercise.correctOptionId) errors.push(`Opción sin lista: ${exercise.id}`);
    if (exercise.type === 'single_choice' && !exercise.options)
      errors.push(`Faltan opciones: ${exercise.id}`);
    if (exercise.type === 'reorder' && !exercise.tokens?.length)
      errors.push(`Faltan palabras: ${exercise.id}`);
  };
  if (Object.keys(payload.lessons).length > 1000) errors.push('Demasiadas lecciones.');
  for (const unit of payload.units) {
    if (unitIds.has(unit.id)) errors.push(`Unidad repetida: ${unit.id}`);
    unitIds.add(unit.id);
    const sequences = new Set<number>();
    for (const summary of unit.lessons) {
      if (lessonIds.has(summary.id)) errors.push(`Lección repetida: ${summary.id}`);
      lessonIds.add(summary.id);
      if (sequences.has(summary.seq)) errors.push(`Orden repetido: ${unit.id}`);
      sequences.add(summary.seq);
      const lesson = payload.lessons[summary.id];
      if (!lesson || lesson.id !== summary.id || lesson.unitId !== unit.id)
        errors.push(`Referencia de lección inválida: ${summary.id}`);
    }
  }
  for (const [key, lesson] of Object.entries(payload.lessons)) {
    if (key !== lesson.id || !lessonIds.has(key) || !unitIds.has(lesson.unitId))
      errors.push(`Lección fuera del curso: ${key}`);
    lesson.exercises.forEach(checkExercise);
  }
  Object.values(payload.challengePools).forEach((pool) => pool.forEach(checkExercise));
  payload.placementQuestions.forEach(checkExercise);
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
    const steps = new Set(item.steps.map((s) => s.id));
    if (steps.size !== item.steps.length) errors.push(`Paso repetido: ${item.id}`);
    for (const step of item.steps) {
      if (new Set(step.options.map((o) => o.id)).size !== step.options.length)
        errors.push(`Opciones de misión repetidas: ${item.id}`);
      for (const choice of step.options)
        if (choice.nextStepId && !steps.has(choice.nextStepId))
          errors.push(`Paso de misión desconocido: ${choice.nextStepId}`);
    }
  }
  if (new Set(payload.speechDrills.map((d) => d.id)).size !== payload.speechDrills.length)
    errors.push('Prácticas de voz repetidas.');
  if (errors.length)
    throw new CoursePackError(
      `El contenido no es válido: ${errors.slice(0, 3).join('; ')}`,
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
