import { z } from 'zod';

const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9._-]*$/);
const phrase = z.string().trim().min(1).max(240);
const translation = z.object({ en: phrase, es: phrase }).strict();
const tokens = z.array(id).max(40).readonly();
const aliases = z.array(phrase).min(1).max(30).readonly();
const quantity = z.number().int().min(0).max(99);
const amount = z.number().int().nonnegative().max(100_000_000);

const unitSchema = z
  .object({
    id,
    en: phrase,
    es: phrase,
    pluralEn: phrase,
    pluralEs: phrase,
    aliases,
  })
  .strict();

const modifierSchema = z.object({ id, aliases, label: translation }).strict();

const itemSchema = z
  .object({
    id,
    group: id,
    label: translation,
    baseLabel: translation.optional(),
    pluralLabel: translation.optional(),
    aliases,
    pluralAliases: aliases.optional(),
    price: amount,
    ingredients: tokens,
    units: z.array(unitSchema).max(12).readonly().optional(),
    modifiers: z.array(modifierSchema).max(16).readonly().optional(),
  })
  .strict();

const groupSchema = z
  .object({
    id,
    allowedItemIds: tokens,
    quantity: z.object({ min: quantity, max: quantity }).strict(),
    participantIds: tokens,
    required: z.boolean().optional(),
    requiredIngredientIds: tokens.optional(),
    forbiddenIngredientIds: tokens.optional(),
  })
  .strict();

const participantSchema = z
  .object({
    id,
    name: phrase,
    noteEs: phrase,
    aliases: aliases.optional(),
  })
  .strict();

function distinct(values: readonly string[]) {
  return new Set(values).size === values.length;
}

const menuScenarioDefinitionSchema = z
  .object({
    id,
    title: translation,
    speaker: phrase,
    currency: z.string().regex(/^[A-Z]{3}$/),
    menu: z.array(itemSchema).min(1).max(30).readonly(),
    knownItems: z.array(itemSchema).max(30).readonly().optional(),
    participants: z.array(participantSchema).max(20).readonly(),
    groups: z.array(groupSchema).min(1).max(12).readonly(),
    budget: amount.optional(),
  })
  .strict()
  .refine(({ menu, knownItems = [], participants, groups }) => {
    const items = [...menu, ...knownItems];
    return (
      distinct(items.map(({ id }) => id)) &&
      distinct(participants.map(({ id }) => id)) &&
      distinct(groups.map(({ id }) => id)) &&
      items.every(
        (item) =>
          groups.some(({ id }) => id === item.group) &&
          distinct((item.units ?? []).map(({ id }) => id)) &&
          distinct((item.modifiers ?? []).map(({ id }) => id)) &&
          distinct(item.ingredients) &&
          item.ingredients.every((ingredient) =>
            item.modifiers?.some(({ id }) => id === ingredient),
          ),
      ) &&
      groups.every(
        (group) =>
          group.quantity.max >= Math.max(1, group.quantity.min) &&
          distinct(group.allowedItemIds) &&
          (!group.required || group.allowedItemIds.length > 0) &&
          group.allowedItemIds.every((entry) =>
            menu.some(({ id, group: itemGroup }) => id === entry && itemGroup === group.id),
          ) &&
          distinct(group.participantIds) &&
          group.participantIds.every((participant) =>
            participants.some(({ id }) => id === participant),
          ),
      )
    );
  });

const scenarioActionSchema = z.enum(['menu', 'request', 'replace', 'confirm', 'finish', 'bill']);
const scenarioFormSchema = z.enum([
  'would-like',
  'can-have',
  'could-have',
  'can-see',
  'could-see',
  'confirm',
  'finish',
  'price',
]);
const scenarioFeedbackSchema = z.enum([
  'target',
  'communication_only',
  'context_mismatch',
  'incorrect',
  'ungradable',
]);
export const scenarioEvidenceTargetSchema = z
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

const menuScenarioTurnSchema = z
  .object({
    action: scenarioActionSchema,
    targetForms: z.array(scenarioFormSchema).min(1).max(8).readonly(),
    formTargets: z
      .array(
        z
          .object({
            form: scenarioFormSchema,
            targets: z.array(scenarioEvidenceTargetSchema).min(1).max(20).readonly(),
          })
          .strict(),
      )
      .max(8)
      .readonly()
      .optional(),
    feedback: z.record(scenarioFeedbackSchema, phrase).optional(),
  })
  .strict()
  .refine(
    ({ targetForms, formTargets }) =>
      distinct(targetForms) && distinct((formTargets ?? []).map(({ form }) => form)),
  );

export const scenarioLineSchema = z
  .object({
    itemId: id,
    quantity,
    unit: id.optional(),
    participantId: id.optional(),
    modifiers: z
      .array(
        z
          .object({
            operation: z.enum(['with', 'without']),
            ingredientId: id,
          })
          .strict(),
      )
      .max(12)
      .optional(),
  })
  .strict();

export const eventFactSchema = z.enum(['person', 'time', 'place', 'object']);
const eventValueSchema = z.object({ label: translation, aliases }).strict();
const timelineEventSchema = z
  .object({
    id,
    personId: id,
    date: phrase,
    minute: z.number().int().min(0).max(1439),
    time: eventValueSchema,
    place: eventValueSchema,
    object: eventValueSchema.optional(),
    base: phrase,
    past: phrase,
    complements: z.array(phrase).min(1).max(15).readonly(),
    statement: translation,
    note: translation,
    visible: z.array(eventFactSchema).max(4).readonly(),
    required: z.array(eventFactSchema).max(4).readonly(),
    witnesses: z
      .array(
        z
          .object({
            personId: id,
            knows: z.array(eventFactSchema).max(4).readonly(),
          })
          .strict(),
      )
      .max(20)
      .readonly(),
  })
  .strict();

export const eventScenarioDefinitionSchema = z
  .object({
    kind: z.literal('timeline'),
    id,
    title: translation,
    subtitle: translation,
    participants: z.array(participantSchema).min(1).max(20).readonly(),
    events: z.array(timelineEventSchema).min(2).max(20).readonly(),
  })
  .strict()
  .refine(({ participants, events }) => {
    const people = new Set(participants.map(({ id }) => id));
    return (
      people.size === participants.length &&
      distinct(events.map(({ id }) => id)) &&
      events.some(({ required }) => required.length > 0) &&
      events.every(
        (event) =>
          people.has(event.personId) &&
          distinct(event.visible) &&
          distinct(event.required) &&
          distinct(event.witnesses.map(({ personId }) => personId)) &&
          event.witnesses.every(({ personId, knows }) => people.has(personId) && distinct(knows)) &&
          event.required.every(
            (field) =>
              !event.visible.includes(field) &&
              (field !== 'object' || !!event.object) &&
              event.witnesses.some(({ knows }) => knows.includes(field)),
          ),
      )
    );
  });

const eventFormSchema = z.enum([
  'did-question',
  'wh-question',
  'subject-question',
  'past-statement',
  'past-negative',
]);
const eventScenarioTurnSchema = z
  .object({
    action: z.enum(['inquire', 'record']),
    focusEventIds: tokens,
    targetForms: z.array(eventFormSchema).min(1).max(5).readonly(),
    formTargets: z
      .array(
        z
          .object({
            form: eventFormSchema,
            targets: z.array(scenarioEvidenceTargetSchema).min(1).max(20).readonly(),
          })
          .strict(),
      )
      .max(5)
      .readonly()
      .optional(),
    eventTargets: z
      .array(
        z
          .object({
            eventId: id,
            targets: z.array(scenarioEvidenceTargetSchema).min(1).max(20).readonly(),
          })
          .strict(),
      )
      .max(20)
      .readonly()
      .optional(),
    feedback: z.record(scenarioFeedbackSchema, phrase).optional(),
  })
  .strict()
  .refine(
    ({ targetForms, formTargets, eventTargets, action, focusEventIds }) =>
      !!focusEventIds.length &&
      distinct(focusEventIds) &&
      distinct(targetForms) &&
      distinct((formTargets ?? []).map(({ form }) => form)) &&
      distinct((eventTargets ?? []).map(({ eventId }) => eventId)) &&
      (action === 'record' || !eventTargets?.length),
  );

export const scenarioDefinitionSchema = z.union([
  menuScenarioDefinitionSchema,
  eventScenarioDefinitionSchema,
]);
export const scenarioTurnSchema = z.union([menuScenarioTurnSchema, eventScenarioTurnSchema]);
export type MenuScenarioDefinition = z.infer<typeof menuScenarioDefinitionSchema>;
export type MenuScenarioTurn = z.infer<typeof menuScenarioTurnSchema>;
export type EventScenarioDefinition = z.infer<typeof eventScenarioDefinitionSchema>;
export type EventScenarioTurn = z.infer<typeof eventScenarioTurnSchema>;
export type EventFact = z.infer<typeof eventFactSchema>;
export type EventForm = z.infer<typeof eventFormSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type ScenarioDefinition = z.infer<typeof scenarioDefinitionSchema>;
export type ScenarioItem = z.infer<typeof itemSchema>;
export type ScenarioAction = z.infer<typeof scenarioActionSchema>;
export type ScenarioForm = z.infer<typeof scenarioFormSchema>;
export type ScenarioTurn = z.infer<typeof scenarioTurnSchema>;
export type ScenarioLine = z.infer<typeof scenarioLineSchema>;
