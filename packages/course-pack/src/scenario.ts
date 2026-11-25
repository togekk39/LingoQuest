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

export const scenarioDefinitionSchema = z
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

export const scenarioTurnSchema = z
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

export type ScenarioDefinition = z.infer<typeof scenarioDefinitionSchema>;
export type ScenarioItem = z.infer<typeof itemSchema>;
export type ScenarioAction = z.infer<typeof scenarioActionSchema>;
export type ScenarioForm = z.infer<typeof scenarioFormSchema>;
export type ScenarioTurn = z.infer<typeof scenarioTurnSchema>;
export type ScenarioLine = z.infer<typeof scenarioLineSchema>;
