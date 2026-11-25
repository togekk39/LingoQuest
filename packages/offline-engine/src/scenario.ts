import { z } from 'zod';
import type { AnswerOutcome } from '@lingoquest/contracts';
import {
  canonicalStringify,
  scenarioLineSchema,
  sha256Hex,
  type ScenarioDefinition,
  type ScenarioForm,
  type ScenarioItem,
  type ScenarioLine,
  type ScenarioTurn,
} from '@lingoquest/course-pack';
import { unifiedMasteryKey, type UnifiedEvidenceTarget } from './learning-evidence';
import { parseScenarioLanguage } from './scenario-language';
import type { LearningError } from './travel-learning';

export type {
  ScenarioAction,
  ScenarioDefinition,
  ScenarioForm,
  ScenarioItem,
  ScenarioLine,
  ScenarioTurn,
} from '@lingoquest/course-pack';

export type ParsedScenarioLine = ScenarioLine & { quantitySpecified?: boolean };

export const scenarioReplySchema = z
  .object({
    speaker: z.string().min(1).max(240),
    line: z.object({ en: z.string().min(1).max(4000), es: z.string().min(1).max(4000) }).strict(),
  })
  .strict();

const maximumScenarioLines = 30;

export const scenarioStateSchema = z
  .object({
    scenarioId: z.string().min(1).max(100),
    definitionDigest: z.string().regex(/^[a-f0-9]{64}$/),
    phase: z.enum(['initial', 'menu', 'selected', 'confirmed', 'closed', 'complete']),
    lines: z.array(scenarioLineSchema).max(maximumScenarioLines),
    changes: z
      .array(z.object({ before: scenarioLineSchema, after: scenarioLineSchema }).strict())
      .max(20),
    total: z.number().int().nonnegative().max(300_000_000_000).optional(),
  })
  .strict();

export type ScenarioState = z.infer<typeof scenarioStateSchema>;
export type ScenarioReply = z.infer<typeof scenarioReplySchema>;
export interface ScenarioVerdict {
  outcome: AnswerOutcome;
  feedbackEs?: string;
  targets?: readonly UnifiedEvidenceTarget[];
  error?: LearningError;
}

export function rpgScenarioDigest(definition: ScenarioDefinition) {
  return sha256Hex(canonicalStringify(definition));
}

export function startScenario(definition: ScenarioDefinition): ScenarioState {
  return {
    scenarioId: definition.id,
    definitionDigest: rpgScenarioDigest(definition),
    phase: 'initial',
    lines: [],
    changes: [],
  };
}

export function scenarioSelectionTotal(
  definition: ScenarioDefinition,
  lines: readonly ScenarioLine[],
) {
  return lines.reduce(
    (total, line) =>
      total + (definition.menu.find(({ id }) => id === line.itemId)?.price ?? 0) * line.quantity,
    0,
  );
}

export function formatScenarioAmount(definition: ScenarioDefinition, value: number) {
  return `${definition.currency} ${value.toLocaleString('en-US')}`;
}

type ScenarioLocale = 'en' | 'es';
function formatJoin(labels: readonly string[], locale: ScenarioLocale) {
  if (labels.length < 2) return labels[0] ?? '';
  const conjunction = locale === 'en' ? ' and ' : ' y ';
  return labels.slice(0, -1).join(', ') + conjunction + labels.at(-1);
}

function formatItemLine(item: ScenarioItem, line: ScenarioLine, locale: ScenarioLocale) {
  let label = item.label[locale];
  if (line.modifiers?.length) {
    const labelFor = (id: string) =>
      item.modifiers?.find((entry) => entry.id === id)?.label[locale] ?? id;
    const removals = line.modifiers.filter(({ operation }) => operation === 'without');
    const removed = new Set(removals.map(({ ingredientId }) => ingredientId));
    const additions = line.modifiers.flatMap(({ operation, ingredientId }) =>
      operation === 'with' && !item.ingredients.includes(ingredientId) ? [ingredientId] : [],
    );
    const base = item.baseLabel?.[locale];
    const includes = [
      ...(base ? item.ingredients.filter((id) => !removed.has(id)) : []),
      ...additions,
    ];
    label = base ?? label;
    if (includes.length)
      label += (locale === 'en' ? ' with ' : ' con ') + formatJoin(includes.map(labelFor), locale);
    if (removals.length)
      label +=
        (locale === 'en' ? ' without ' : ' sin ') +
        formatJoin(
          removals.map(({ ingredientId }) => labelFor(ingredientId)),
          locale,
        );
  }
  label = label.charAt(0).toLowerCase() + label.slice(1);
  const unit = item.units?.find(({ id }) => id === line.unit);
  if (unit) {
    if (line.quantity > 1)
      return locale === 'en'
        ? `${line.quantity} ${unit.pluralEn} of ${label}`
        : `${line.quantity} ${unit.pluralEs} de ${label}`;
    const article = locale === 'en' ? (/^[aeiou]/i.test(unit.en) ? 'an' : 'a') : '1';
    return locale === 'en'
      ? `${article} ${unit.en} of ${label}`
      : `${article} ${unit.es} de ${label}`;
  }
  if (line.quantity === 1) return label;
  if (item.pluralLabel && !line.modifiers?.length)
    return `${line.quantity} ${item.pluralLabel[locale]}`;
  return locale === 'en'
    ? `${line.quantity} portions of ${label}`
    : `${line.quantity} porciones de ${label}`;
}

export function formatScenarioSelection(
  definition: ScenarioDefinition,
  state: Pick<ScenarioState, 'lines'>,
  locale: ScenarioLocale = 'en',
) {
  return formatJoin(
    state.lines.flatMap((line) => {
      const item = definition.menu.find(({ id }) => id === line.itemId);
      if (!item) return [];
      const party = definition.participants.find(({ id }) => id === line.participantId);
      const group = definition.groups.find(({ id }) => id === item.group);
      const recipient =
        party && group && line.participantId !== group.participantIds[0]
          ? (locale === 'en' ? ' for ' : ' para ') + party.name
          : '';
      return [formatItemLine(item, line, locale) + recipient];
    }),
    locale,
  );
}

type SelectionCheck =
  { allowed: true; lines: ScenarioLine[] } | { allowed: false; feedbackEs: string };

function selectionProblem(feedbackEs: string): SelectionCheck {
  return { allowed: false, feedbackEs };
}

function validateSelection(
  definition: ScenarioDefinition,
  lines: readonly ScenarioLine[],
): SelectionCheck {
  if (lines.length > maximumScenarioLines)
    return selectionProblem('Elige menos opciones para este turno.');
  const accepted: ScenarioLine[] = [];
  const items = new Set<string>();
  for (const line of lines) {
    const item = definition.menu.find(({ id }) => id === line.itemId);
    if (!item)
      return selectionProblem('Ese producto no está en la lista. Revisa las opciones disponibles.');
    const group = definition.groups.find(({ id }) => id === item.group);
    if (!group?.allowedItemIds.includes(item.id))
      return selectionProblem(
        'Esa opción no cumple lo que necesita el grupo. Revisa los requisitos.',
      );
    const participantId = line.participantId ?? group.participantIds[0];
    if (participantId && !group.participantIds.includes(participantId))
      return selectionProblem('Revisa para quién es cada opción.');
    if (line.unit && !item.units?.some(({ id }) => id === line.unit))
      return selectionProblem('Esa presentación no está disponible para este producto.');
    const itemRecipient = `${item.id}:${participantId ?? ''}`;
    if (items.has(itemRecipient))
      return selectionProblem('Indica una sola cantidad por opción para cada persona.');
    items.add(itemRecipient);

    const ingredients = new Set(item.ingredients);
    const changed = new Set<string>();
    for (const { ingredientId, operation } of line.modifiers ?? []) {
      if (changed.has(ingredientId) || !item.modifiers?.some(({ id }) => id === ingredientId))
        return selectionProblem('Revisa qué ingrediente se puede añadir o quitar.');
      changed.add(ingredientId);
      if (operation === 'with') ingredients.add(ingredientId);
      else ingredients.delete(ingredientId);
    }
    if (
      group.requiredIngredientIds?.some((id) => !ingredients.has(id)) ||
      group.forbiddenIngredientIds?.some((id) => ingredients.has(id))
    )
      return selectionProblem(
        'La preparación no cumple los requisitos. Comprueba los ingredientes.',
      );
    accepted.push({
      itemId: line.itemId,
      quantity: line.quantity,
      ...(line.unit && { unit: line.unit }),
      ...(participantId && { participantId }),
      ...(line.modifiers?.length && { modifiers: line.modifiers }),
    });
  }

  for (const group of definition.groups) {
    const relevant = accepted.filter(({ itemId }) => group.allowedItemIds.includes(itemId));
    const count = relevant.reduce((sum, { quantity }) => sum + quantity, 0);
    if (
      (group.required || relevant.length > 0) &&
      (count < group.quantity.min ||
        count > group.quantity.max ||
        relevant.some(({ quantity }) => quantity < 1))
    )
      return selectionProblem(
        'La cantidad no coincide con lo que necesitan. Revisa el número de cada opción.',
      );
  }
  if (
    definition.budget !== undefined &&
    scenarioSelectionTotal(definition, accepted) > definition.budget
  )
    return selectionProblem('El total supera el presupuesto. Consulta los precios de la lista.');
  return { allowed: true, lines: accepted };
}

type ScenarioEvaluation = {
  verdict: ScenarioVerdict;
  state?: ScenarioState;
  reply?: ScenarioReply;
};

function orderRecap(definition: ScenarioDefinition, state: ScenarioState): ScenarioReply {
  const en = formatScenarioSelection(definition, state, 'en');
  const es = formatScenarioSelection(definition, state, 'es');
  const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
  return {
    speaker: definition.speaker,
    line: { en: `${sentence(en)}. Is that right?`, es: `${sentence(es)}. ¿Está bien así?` },
  };
}

function errorTargets(turn: ScenarioTurn, error: LearningError, form?: ScenarioForm) {
  const groups = turn.formTargets ?? [];
  const shared = new Set(
    groups.length > 1
      ? groups[0].targets
          .map(unifiedMasteryKey)
          .filter((key) =>
            groups.every(({ targets }) =>
              targets.some((entry) => unifiedMasteryKey(entry) === key),
            ),
          )
      : [],
  );
  if (error === 'replacement_form')
    return groups[0]?.targets.filter((target) => shared.has(unifiedMasteryKey(target))) ?? [];
  if (error !== 'request_form' || !form) return [];
  const targets = groups.find((entry) => entry.form === form)?.targets ?? [];
  return turn.action === 'replace'
    ? targets.filter((target) => !shared.has(unifiedMasteryKey(target)))
    : targets;
}

export function evaluateScenarioTurn(
  definition: ScenarioDefinition,
  state: ScenarioState,
  turn: ScenarioTurn,
  input: string | undefined,
): ScenarioEvaluation {
  const parsed = parseScenarioLanguage(definition, turn.action, input);
  const reject = (
    outcome: Exclude<AnswerOutcome, 'target' | 'communication_only'>,
    feedbackEs?: string,
    error?: LearningError,
    form?: ScenarioForm,
  ): ScenarioEvaluation => {
    const defaults = {
      context_mismatch: 'Revisa lo que se necesita en este momento de la conversación.',
      incorrect: 'Revisa la forma de tu respuesta y vuelve a intentarlo.',
      ungradable: 'Escribe una petición más concreta con las palabras de esta actividad.',
    };
    return {
      verdict: {
        outcome,
        feedbackEs: turn.feedback?.[outcome] ?? feedbackEs ?? defaults[outcome],
        ...(error && { error, targets: errorTargets(turn, error, form) }),
      },
    };
  };
  if (parsed.kind !== 'parsed') return reject(parsed.kind, undefined, parsed.error, parsed.form);
  if (
    state.scenarioId !== definition.id ||
    state.definitionDigest !== rpgScenarioDigest(definition)
  )
    return reject('context_mismatch');

  const { speaker } = definition;
  let next: ScenarioState;
  let reply: ScenarioReply;
  switch (turn.action) {
    case 'menu':
      if (state.phase !== 'initial') return reject('context_mismatch');
      next = { ...state, phase: 'menu' };
      reply = { speaker, line: { en: 'Here is the menu.', es: 'Aquí está el menú.' } };
      break;
    case 'request': {
      if (state.phase !== 'menu' || !parsed.lines?.length) return reject('context_mismatch');
      const checked = validateSelection(definition, parsed.lines);
      if (!checked.allowed) return reject('context_mismatch', checked.feedbackEs);
      next = { ...state, phase: 'selected', lines: checked.lines };
      reply = orderRecap(definition, next);
      break;
    }
    case 'replace': {
      if (
        !['selected', 'confirmed'].includes(state.phase) ||
        parsed.lines?.length !== 1 ||
        !parsed.replacement ||
        state.changes.length >= 20
      )
        return reject('context_mismatch');
      const { replacement: old } = parsed;
      const [requested] = parsed.lines;
      const recipient = old.participantId ?? requested.participantId;
      const matches = state.lines.filter(
        (line) =>
          line.itemId === old.itemId &&
          (!recipient || recipient === line.participantId) &&
          (!old.unit || old.unit === line.unit) &&
          (!old.quantitySpecified || old.quantity === line.quantity) &&
          (old.modifiers ?? []).every(({ ingredientId, operation }) =>
            line.modifiers?.some(
              (modifier) =>
                modifier.ingredientId === ingredientId && modifier.operation === operation,
            ),
          ),
      );
      if (matches.length > 1)
        return reject('context_mismatch', 'Indica para quién es la opción que quieres cambiar.');
      const [candidate] = matches;
      if (!candidate)
        return reject('context_mismatch', 'Indica cuál opción de tu selección quieres cambiar.');
      const oldGroup = definition.menu.find(({ id }) => id === candidate.itemId)?.group;
      const newItem = definition.menu.find(({ id }) => id === requested.itemId);
      if (!oldGroup || !newItem || oldGroup !== newItem.group)
        return reject('context_mismatch', 'Elige un reemplazo del mismo tipo en la lista.');
      if (requested.participantId && requested.participantId !== candidate.participantId)
        return reject('context_mismatch', 'El cambio debe ser para la misma persona.');
      const updated = {
        ...requested,
        participantId: candidate.participantId,
        quantity: requested.quantitySpecified ? requested.quantity : candidate.quantity,
        unit: requested.unit ?? (newItem.id === candidate.itemId ? candidate.unit : undefined),
      };
      const position = state.lines.indexOf(candidate);
      const checked = validateSelection(
        definition,
        state.lines.map((line, index) => (index === position ? updated : line)),
      );
      if (!checked.allowed) return reject('context_mismatch', checked.feedbackEs);
      const after = checked.lines[position];
      if (canonicalStringify(candidate) === canonicalStringify(after))
        return reject(
          'context_mismatch',
          'La selección queda igual. Indica el cambio que quieres hacer.',
        );
      next = {
        ...state,
        phase: 'selected',
        lines: checked.lines,
        changes: [...state.changes, { before: candidate, after }],
      };
      reply = orderRecap(definition, next);
      break;
    }
    case 'confirm':
      if (state.phase !== 'selected') return reject('context_mismatch');
      next = { ...state, phase: 'confirmed' };
      reply = { speaker, line: { en: 'All right.', es: 'De acuerdo.' } };
      break;
    case 'finish':
      if (state.phase !== 'confirmed') return reject('context_mismatch');
      next = { ...state, phase: 'closed' };
      reply = { speaker, line: { en: 'Thank you.', es: 'Gracias.' } };
      break;
    case 'bill': {
      if (state.phase !== 'closed') return reject('context_mismatch');
      const total = scenarioSelectionTotal(definition, state.lines);
      const label = formatScenarioAmount(definition, total);
      next = { ...state, phase: 'complete', total };
      reply = { speaker, line: { en: `Your total is ${label}.`, es: `El total es ${label}.` } };
      break;
    }
  }
  const outcome = turn.targetForms.includes(parsed.form) ? 'target' : 'communication_only';
  return {
    verdict: {
      outcome,
      targets: turn.formTargets?.find(({ form }) => form === parsed.form)?.targets ?? [],
      ...(turn.feedback?.[outcome] && { feedbackEs: turn.feedback[outcome] }),
    },
    state: next,
    reply,
  };
}
