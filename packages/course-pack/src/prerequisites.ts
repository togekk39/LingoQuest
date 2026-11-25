import { z } from 'zod';

const id = z.string().regex(/^[a-z][a-z0-9._-]*$/);
const text = z.string().trim().min(1);
const reference = z.object({ id, form: text.optional() }).strict();
const context = z
  .object({
    use: z.enum(['gloss', 'inferable']),
    target: reference,
    reasonEs: text,
  })
  .strict();

const target = z.discriminatedUnion('kind', [
  z
    .object({
      id,
      kind: z.literal('lexical'),
      lemma: text,
      senseEs: text,
      forms: z.array(text).min(1),
    })
    .strict(),
  z
    .object({ id, kind: z.literal('pattern'), descriptionEs: text, forms: z.array(text).min(1) })
    .strict(),
  z.object({ id, kind: z.literal('grammar'), descriptionEs: text }).strict(),
]);

const stage = z.discriminatedUnion('type', [
  z
    .object({
      id,
      type: z.literal('teach'),
      teaches: z.array(reference).min(1),
      instructionEs: text,
      exampleEn: text,
    })
    .strict(),
  z.object({ id, type: z.literal('context'), supports: z.array(context).min(1) }).strict(),
  z.object({ id, type: z.literal('preview'), text }).strict(),
  z
    .object({
      id,
      type: z.literal('exercise'),
      mode: z.enum(['guided', 'independent', 'self-check']).optional(),
      requires: z.array(reference).min(1),
      supports: z.array(context).optional(),
    })
    .strict(),
]);

export const prerequisiteFileSchema = z
  .object({
    version: z.literal(1),
    targets: z.array(target),
    lessons: z.array(
      z
        .object({
          id,
          chapterId: id,
          stages: z.array(stage).min(1),
          paths: z
            .array(
              z.object({ id, requiresLessons: z.array(id), stages: z.array(id).min(1) }).strict(),
            )
            .min(1),
        })
        .strict(),
    ),
  })
  .strict();

export type PrerequisiteFile = z.infer<typeof prerequisiteFileSchema>;
export type PrerequisiteReference = z.infer<typeof reference>;
type Reference = PrerequisiteReference;
type Lesson = PrerequisiteFile['lessons'][number];

export type CurriculumLesson = { chapterId: string; order: number };

function formKey(value: string) {
  return value.normalize('NFC').replace(/[’‘]/g, "'");
}

export function referenceKey({ id, form }: Reference) {
  return form === undefined ? id : id + '[' + formKey(form) + ']';
}

function lessonLocation(lesson: Lesson) {
  return 'chapter=' + lesson.chapterId + ' lesson=' + lesson.id;
}

export function checkPrerequisites(
  files: readonly PrerequisiteFile[],
  curriculum: ReadonlyMap<string, CurriculumLesson>,
): string[] {
  const issues: string[] = [];
  const targets = new Map<string, PrerequisiteFile['targets'][number]>();
  const lessons = new Map<string, Lesson>();
  const completed = new Map<string, Set<string>>();

  function checkReference(ref: Reference, location: string) {
    const defined = targets.get(ref.id);
    const valid =
      defined &&
      (defined.kind === 'grammar'
        ? ref.form === undefined
        : ref.form !== undefined && defined.forms.map(formKey).includes(formKey(ref.form)));
    if (!valid)
      issues.push(
        location +
          ' target=' +
          referenceKey(ref) +
          ' Unknown target or invalid form / Objetivo desconocido o forma inválida',
      );
    return valid;
  }

  for (const file of files) {
    for (const definition of file.targets) {
      if (targets.has(definition.id)) {
        issues.push('target=' + definition.id + ' Duplicate target / Objetivo duplicado');
        continue;
      }
      if (
        definition.kind !== 'grammar' &&
        new Set(definition.forms.map(formKey)).size !== definition.forms.length
      )
        issues.push('target=' + definition.id + ' Duplicate form / Forma duplicada');
      targets.set(definition.id, definition);
    }
    for (const lesson of file.lessons) {
      const planned = curriculum.get(lesson.id);
      if (!planned || planned.chapterId !== lesson.chapterId) {
        issues.push(
          lessonLocation(lesson) +
            ' Lesson and chapter must match the master plan / La lección y el capítulo deben coincidir con el plan maestro',
        );
        continue;
      }
      if (lessons.has(lesson.id)) {
        issues.push(lessonLocation(lesson) + ' Duplicate annotation / Anotación duplicada');
        continue;
      }
      lessons.set(lesson.id, lesson);
    }
  }

  for (const [lessonId, planned] of [...curriculum].sort(
    ([, left], [, right]) => left.order - right.order,
  )) {
    const lesson = lessons.get(lessonId);
    if (!lesson) continue;
    const location = lessonLocation(lesson);
    const stages = new Map(lesson.stages.map((entry) => [entry.id, entry]));
    if (stages.size !== lesson.stages.length)
      issues.push(location + ' Duplicate stage / Etapa duplicada');
    if (new Set(lesson.paths.map((path) => path.id)).size !== lesson.paths.length)
      issues.push(location + ' Duplicate entry path / Ruta de entrada duplicada');

    const visited = new Set<string>();
    const taughtByPath: Set<string>[] = [];
    for (const path of lesson.paths) {
      const pathLocation = location + ' path=' + path.id;
      const taught = new Set<string>();
      const stageIds = new Set<string>();
      for (const prerequisite of new Set(path.requiresLessons)) {
        const previous = curriculum.get(prerequisite);
        const guaranteed = completed.get(prerequisite);
        if (!previous || previous.order >= planned.order || !guaranteed) {
          issues.push(
            pathLocation +
              ' prerequisite=' +
              prerequisite +
              ' Must reference an earlier annotated lesson / Debe apuntar a una lección anterior anotada',
          );
          continue;
        }
        for (const key of guaranteed) taught.add(key);
      }
      for (const stageId of path.stages) {
        const entry = stages.get(stageId);
        if (!entry || stageIds.has(stageId)) {
          issues.push(
            pathLocation +
              ' stage=' +
              stageId +
              ' Unknown or repeated stage / Etapa desconocida o repetida',
          );
          continue;
        }
        stageIds.add(stageId);
        visited.add(stageId);

        if (entry.type === 'teach') {
          for (const ref of entry.teaches)
            if (checkReference(ref, pathLocation + ' stage=' + entry.id))
              taught.add(referenceKey(ref));
          continue;
        }
        if (entry.type === 'preview') continue;

        const itemLocation =
          pathLocation + (entry.type === 'exercise' ? ' exercise=' : ' stage=') + entry.id;
        const supportKeys = new Set<string>();
        for (const support of entry.supports ?? []) {
          if (checkReference(support.target, itemLocation))
            supportKeys.add(referenceKey(support.target));
        }
        if (entry.type === 'exercise') {
          for (const ref of entry.requires) {
            const key = referenceKey(ref);
            if (!checkReference(ref, itemLocation)) continue;
            if (!taught.has(key))
              issues.push(
                itemLocation +
                  ' missing=' +
                  key +
                  ' Teach before this exercise or require a completed teaching path / Enséñalo antes del ejercicio o exige una ruta de enseñanza completada',
              );
            if (supportKeys.has(key))
              issues.push(
                itemLocation +
                  ' target=' +
                  key +
                  ' A required target cannot be labeled non-assessed support / Un objetivo requerido no puede etiquetarse como apoyo sin evaluar',
              );
          }
        }
      }
      taughtByPath.push(taught);
    }
    for (const stageId of stages.keys())
      if (!visited.has(stageId))
        issues.push(
          location +
            ' stage=' +
            stageId +
            ' Stage absent from all entry paths / Etapa ausente de todas las rutas de entrada',
        );

    const guaranteed = [...taughtByPath[0]].filter((key) =>
      taughtByPath.every((taught) => taught.has(key)),
    );
    completed.set(lesson.id, new Set(guaranteed));
  }

  return issues;
}
