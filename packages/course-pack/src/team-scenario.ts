import { z } from 'zod';
import { learningErrorSchema } from '@lingoquest/contracts';

const id = z
  .string()
  .max(100)
  .regex(/^[a-z][a-z0-9._-]*$/);
const text = z.string().trim().min(1).max(240);
const ids = z.array(id).max(20);
const phrase = z.object({ en: text, es: text }).strict();

export const teamStatusSchema = z.enum(['unassigned', 'assigned', 'active', 'done', 'blocked']);
const availability = z.enum(['available', 'busy', 'on-break']);
const person = z
  .object({
    id,
    name: text,
    pronoun: z.enum(['he', 'she', 'they']),
    usualTaskId: id,
    canDo: ids,
    availability,
    needsHelp: z.boolean().optional(),
  })
  .strict();
const task = z
  .object({
    id,
    command: phrase,
    progressive: phrase,
    habitual: text,
    aliases: z.array(text).max(10).optional(),
    status: teamStatusSchema,
    personId: id.optional(),
    after: ids.optional(),
    hidden: z.boolean().optional(),
  })
  .strict();

const unique = <T>(values: T[]) => new Set(values).size === values.length;
export const teamScenarioDefinitionSchema = z
  .object({
    kind: z.literal('team'),
    id,
    title: phrase,
    subtitle: phrase,
    participants: z.array(person).min(1).max(20),
    tasks: z.array(task).min(1).max(20),
  })
  .strict()
  .refine(({ participants, tasks }) => {
    const taskIds = tasks.map(({ id }) => id);
    const knownTasks = (references: string[]) =>
      unique(references) && references.every((value) => taskIds.includes(value));
    const activePeople = tasks.flatMap(({ status, personId }) =>
      status === 'active' || status === 'assigned' ? [personId] : [],
    );
    return (
      unique(participants.map(({ id }) => id)) &&
      unique(participants.map(({ name }) => name.toLowerCase())) &&
      unique(taskIds) &&
      unique(activePeople) &&
      unique(
        tasks.flatMap(({ command, progressive, aliases = [] }) => [
          command.en.toLowerCase(),
          progressive.en.toLowerCase(),
          ...aliases.map((alias) => alias.toLowerCase()),
        ]),
      ) &&
      participants.every(
        ({ usualTaskId, canDo }) => taskIds.includes(usualTaskId) && knownTasks(canDo),
      ) &&
      tasks.every(
        ({ id, personId, status, after = [] }, index) =>
          knownTasks(after) &&
          after.every((required) => taskIds.indexOf(required) < index) &&
          ((status !== 'active' && status !== 'assigned') || !!personId) &&
          ((status !== 'unassigned' && status !== 'blocked') || !personId) &&
          (!personId ||
            participants.some((entry) => entry.id === personId && entry.canDo.includes(id))) &&
          ((status !== 'active' && status !== 'done') ||
            after.every(
              (required) => tasks.find((entry) => entry.id === required)?.status === 'done',
            )),
      )
    );
  });

export const teamFormSchema = z.enum([
  'progressive-positive',
  'progressive-negative',
  'progressive-question',
  'habit',
  'habit-contrast',
  'ability-positive',
  'ability-negative',
  'ability-question',
  'help-request',
  'help-offer',
  'instruction',
  'sequence',
]);
const target = z
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
  .strict();
const targets = z.array(target).min(1).max(20);
const transition = z
  .object({
    taskId: id,
    status: z.enum(['active', 'done']),
  })
  .strict();
export const teamScenarioTurnSchema = z
  .object({
    action: z.literal('team'),
    targetForms: z.array(teamFormSchema).min(1).max(12),
    formTargets: z.array(z.object({ form: teamFormSchema, targets }).strict()).max(12),
    taskTargets: z
      .array(z.object({ taskId: id, targets }).strict())
      .max(20)
      .optional(),
    errorTargets: z
      .array(z.object({ error: learningErrorSchema, taskId: id.optional(), targets }).strict())
      .max(20)
      .optional(),
    descriptions: ids.optional(),
    check: z.union([z.literal(true), id]).optional(),
    checkPerson: id.optional(),
    assign: ids.optional(),
    sequence: ids.min(2).optional(),
    event: z.array(transition).min(1).max(10).optional(),
    complete: z.boolean().optional(),
  })
  .strict()
  .refine((turn) => {
    const goals = [turn.descriptions, turn.check, turn.assign, turn.sequence].filter(Boolean);
    return (
      goals.length === 1 &&
      (!turn.checkPerson || !!turn.check) &&
      [turn.descriptions, turn.assign, turn.sequence].every(
        (list) => !list || (!!list.length && unique(list)),
      ) &&
      unique(turn.targetForms) &&
      unique(turn.formTargets.map(({ form }) => form)) &&
      unique((turn.taskTargets ?? []).map(({ taskId }) => taskId)) &&
      unique((turn.event ?? []).map(({ taskId }) => taskId)) &&
      unique((turn.errorTargets ?? []).map(({ error, taskId }) => `${error}:${taskId ?? ''}`))
    );
  });

export function validTeamTurns(
  definition: TeamScenarioDefinition,
  turns: readonly TeamScenarioTurn[],
) {
  return (
    !!turns.length &&
    turns.every(
      (turn, index) =>
        !!turn.complete === (index === turns.length - 1) &&
        (!turn.checkPerson || definition.participants.some(({ id }) => id === turn.checkPerson)) &&
        [
          ...(typeof turn.check === 'string' ? [turn.check] : []),
          ...(turn.descriptions ?? []),
          ...(turn.assign ?? []),
          ...(turn.sequence ?? []),
          ...(turn.event ?? []).map(({ taskId }) => taskId),
          ...(turn.taskTargets ?? []).map(({ taskId }) => taskId),
          ...(turn.errorTargets ?? []).flatMap(({ taskId }) => (taskId ? [taskId] : [])),
        ].every((taskId) => definition.tasks.some(({ id }) => id === taskId)),
    )
  );
}

export type TeamScenarioDefinition = z.infer<typeof teamScenarioDefinitionSchema>;
export type TeamScenarioTurn = z.infer<typeof teamScenarioTurnSchema>;
export type TeamForm = z.infer<typeof teamFormSchema>;
export type TeamTask = z.infer<typeof task>;
export type TeamPerson = z.infer<typeof person>;
export type TeamStatus = z.infer<typeof teamStatusSchema>;
