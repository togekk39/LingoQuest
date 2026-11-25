import type { LearningError } from './travel-learning';
import type {
  ParsedScenarioLine,
  MenuScenarioDefinition,
  ScenarioForm,
  ScenarioItem,
  ScenarioLine,
} from './scenario';

export type ScenarioLanguageAction = 'menu' | 'request' | 'replace' | 'confirm' | 'finish' | 'bill';
export type ParsedScenarioLanguage =
  | {
      kind: 'parsed';
      form: ScenarioForm;
      lines?: ParsedScenarioLine[];
      replacement?: ParsedScenarioLine;
    }
  | {
      kind: 'ungradable' | 'incorrect' | 'context_mismatch';
      error?: LearningError;
      form?: ScenarioForm;
    };

type ReadLine =
  { line: ParsedScenarioLine } | { error: 'countability' | 'context_mismatch' | 'unknown' };

const quantityWords = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
];

function normalize(value: string) {
  return value.normalize('NFKC').toLowerCase().replace(/[‘’ʼ]/g, "'").replace(/\s+/g, ' ').trim();
}

const requestFrames: ReadonlyArray<{ form: ScenarioForm; prefix: RegExp; malformed: RegExp }> = [
  {
    form: 'would-like',
    prefix: /^(?:i'd|i would)(?: please)? like\b/,
    malformed: /^(?:i'd|i would)(?: please)? likes\b/,
  },
  { form: 'can-have', prefix: /^can i(?: please)? have\b/, malformed: /^can i(?: please)? has\b/ },
  {
    form: 'could-have',
    prefix: /^could i(?: please)? have\b/,
    malformed: /^could i(?: please)? has\b/,
  },
  { form: 'can-see', prefix: /^can i(?: please)? see\b/, malformed: /^can i(?: please)? sees\b/ },
  {
    form: 'could-see',
    prefix: /^could i(?: please)? see\b/,
    malformed: /^could i(?: please)? sees\b/,
  },
];

const confirmations = new Set([
  "that's right",
  'that is right',
  "yes that's right",
  'yes that is right',
  'yes please',
  'yes',
]);
const endings = new Set([
  "that's all",
  'that is all',
  "that's all thank you",
  'that is all thank you',
  'no thank you',
  "no that's all thank you",
  'no that is all thank you',
]);

function withoutPlease(value: string) {
  return value
    .trim()
    .replace(/^please(?:\s*,\s*|\s+|$)/, '')
    .replace(/(?:,\s*|\s+)please$/, '')
    .trim();
}

function withRecipient(value: string, definition: MenuScenarioDefinition) {
  const index = value.lastIndexOf(' for ');
  if (index < 0) return { value };
  const recipient = value.slice(index + ' for '.length);
  const participant = definition.participants.find(({ id, name, aliases }) =>
    [id, name, ...(aliases ?? [])].some((alias) => normalize(alias) === recipient),
  );
  return {
    value: value.slice(0, index),
    participantId: participant?.id,
    unknownParticipant: !participant,
  };
}

function readQuantity(value: string) {
  const [prefix, ...rest] = value.split(' ');
  const numberWord = quantityWords.indexOf(prefix);
  const numeric = /^\d{1,3}$/.test(prefix);
  const quantity = numeric ? Number(prefix) : numberWord >= 0 ? numberWord : 1;
  const article = prefix === 'a' || prefix === 'an' ? prefix : undefined;
  const explicit = numeric || numberWord >= 0 || !!article || prefix === 'some';
  return {
    value: explicit || prefix === 'the' ? rest.join(' ') : value,
    quantity,
    number: numeric || numberWord >= 0,
    article,
    some: prefix === 'some',
  };
}

function exactPrefix(value: string, prefix: string) {
  return value === prefix || value.startsWith(`${prefix} `);
}

function readUnit(value: string, items: readonly ScenarioItem[]) {
  const delimiter = value.indexOf(' of ');
  if (delimiter < 0) return;
  const portion = value.slice(0, delimiter);
  const unit = items
    .flatMap(({ units }) => units ?? [])
    .find(({ en, pluralEn, aliases }) =>
      [en, pluralEn, ...aliases].some((alias) => normalize(alias) === portion),
    );
  if (unit)
    return {
      unit,
      plural: normalize(unit.pluralEn) === portion,
      value: value.slice(delimiter + ' of '.length),
    };
}

function readItem(value: string, items: readonly ScenarioItem[]) {
  const matches = items
    .flatMap((item) =>
      [item.label.en, item.baseLabel?.en, ...item.aliases, ...(item.pluralAliases ?? [])].flatMap(
        (phrase) => (phrase ? [{ item, phrase: normalize(phrase) }] : []),
      ),
    )
    .filter(({ phrase }) => exactPrefix(value, phrase))
    .sort((first, second) => second.phrase.length - first.phrase.length);
  const best = matches[0];
  if (
    best &&
    !matches.some(({ item, phrase }) => phrase === best.phrase && item.id !== best.item.id)
  )
    return best;
}

function readModifiers(value: string, items: readonly ScenarioItem[]) {
  const ingredients = items.flatMap(({ modifiers }) => modifiers ?? []);
  const modifiers: NonNullable<ScenarioLine['modifiers']> = [];
  let remaining = value;
  while (remaining) {
    const qualifier = /^(with|without|no) (.+)$/.exec(remaining);
    if (!qualifier) return;
    const [, instruction, object] = qualifier;
    const ingredient = ingredients
      .flatMap(({ id, label, aliases }) =>
        [label.en, ...aliases].map((alias) => ({ id, phrase: normalize(alias) })),
      )
      .filter(({ phrase }) => exactPrefix(object, phrase))
      .sort((first, second) => second.phrase.length - first.phrase.length)[0];
    if (!ingredient) return;
    modifiers.push({
      operation: instruction === 'with' ? 'with' : 'without',
      ingredientId: ingredient.id,
    });
    remaining = object.slice(ingredient.phrase.length).trim();
  }
  return modifiers;
}

function matchLine(value: string, definition: MenuScenarioDefinition): ReadLine {
  const recipient = withRecipient(value, definition);
  const items = [...definition.menu, ...(definition.knownItems ?? [])];
  const quantity = readQuantity(recipient.value);
  const portion = readUnit(quantity.value, items);
  const item = readItem(portion?.value ?? quantity.value, items);
  if (!item) return { error: 'unknown' };
  const remainder = (portion?.value ?? quantity.value).slice(item.phrase.length).trim();
  const modifiers = readModifiers(remainder, items);
  if (!modifiers) return { error: 'unknown' };
  if (recipient.unknownParticipant) return { error: 'context_mismatch' };
  const head = portion ? quantity.value : item.phrase;
  const startsWithVowel = /^[aeiou]/.test(head);
  const plural =
    portion?.plural ??
    (item.item.pluralAliases ?? []).some((alias) => normalize(alias) === item.phrase);
  if (
    (quantity.article && (quantity.article === 'an') !== startsWithVowel) ||
    (quantity.article && plural) ||
    (quantity.number && (quantity.quantity !== 1) !== plural) ||
    (portion && !quantity.number && !quantity.article && !portion.plural) ||
    (portion && quantity.some && !portion.plural)
  )
    return { error: 'countability' };
  if (plural && !quantity.number) return { error: 'unknown' };
  if (new Set(modifiers.map(({ ingredientId }) => ingredientId)).size !== modifiers.length)
    return { error: 'context_mismatch' };
  return {
    line: {
      itemId: item.item.id,
      quantity: quantity.quantity,
      ...(quantity.number || quantity.article || portion ? { quantitySpecified: true } : {}),
      ...(portion && { unit: portion.unit.id }),
      ...(recipient.participantId && { participantId: recipient.participantId }),
      ...(modifiers.length && { modifiers }),
    },
  };
}

function lineFailure(
  error: Extract<ReadLine, { error: unknown }>['error'],
): ParsedScenarioLanguage {
  if (error === 'countability') return { kind: 'incorrect', error };
  return { kind: error === 'context_mismatch' ? 'context_mismatch' : 'ungradable' };
}

export function parseScenarioLanguage(
  definition: MenuScenarioDefinition,
  action: ScenarioLanguageAction,
  input?: string,
): ParsedScenarioLanguage {
  if (!input || input.length > 350) return { kind: 'ungradable' };
  let phrase = normalize(input)
    .replace(/[.?!]+$/, '')
    .trim();
  phrase = withoutPlease(phrase);
  const shortReply = phrase.replace(/,\s*/g, ' ');
  if (confirmations.has(shortReply))
    return action === 'confirm'
      ? { kind: 'parsed', form: 'confirm' }
      : { kind: 'context_mismatch' };
  if (endings.has(shortReply))
    return action === 'finish' ? { kind: 'parsed', form: 'finish' } : { kind: 'context_mismatch' };
  if (/^how much is (?:it|the total|the check|the bill)$/.test(phrase))
    return action === 'bill' ? { kind: 'parsed', form: 'price' } : { kind: 'context_mismatch' };

  if (action === 'replace') phrase = phrase.replace(/^(?:no|actually),\s*/, '');
  const frontRecipient = /^for (.*?)\s*,\s*(.*)$/.exec(phrase);
  if (frontRecipient) phrase = frontRecipient[2];
  const frame = requestFrames.find(({ prefix }) => prefix.test(phrase));
  if (!frame) {
    const negative = /^i (?:do not|don't|would not|wouldn't) (?:want|like) (.+)$/.exec(phrase);
    if (negative && 'line' in matchLine(negative[1], definition))
      return { kind: 'context_mismatch' };
    const malformedFrame = requestFrames.find(({ malformed }) => malformed.test(phrase));
    if (malformedFrame)
      return { kind: 'incorrect', error: 'request_form', form: malformedFrame.form };
    return { kind: 'ungradable' };
  }
  const object = withoutPlease(phrase.replace(frame.prefix, '').replace(/^\s*,\s*/, ''));
  if (!object) return { kind: 'incorrect', error: 'request_form', form: frame.form };
  if (/^(?:(?:the |a )?menu|(?:the )?(?:bill|check))$/.test(object)) {
    const expected = object.endsWith('menu') ? 'menu' : 'bill';
    return expected === action && !frontRecipient
      ? { kind: 'parsed', form: frame.form }
      : { kind: 'context_mismatch' };
  }
  if (frame.form === 'can-see' || frame.form === 'could-see') return { kind: 'ungradable' };
  if (action === 'replace') {
    const parts = object.split(/(?:,\s*|\s+)instead of /);
    if (parts.length !== 2) {
      if (
        object.includes(' instead ') ||
        /\binstead$/.test(object) ||
        'line' in matchLine(object, definition)
      )
        return { kind: 'incorrect', error: 'replacement_form' };
      return { kind: 'ungradable' };
    }
    const replacement = matchLine(parts[1], definition);
    if ('error' in replacement) return lineFailure(replacement.error);
    const offered = matchLine(
      frontRecipient ? `${parts[0]} for ${frontRecipient[1]}` : parts[0],
      definition,
    );
    if ('error' in offered) return lineFailure(offered.error);
    return {
      kind: 'parsed',
      form: frame.form,
      lines: [offered.line],
      replacement: replacement.line,
    };
  }

  const parts = object
    .replace(/(?:,\s*(?:and )?| and )(?=(?:with|without|no) )/g, ' ')
    .split(/,\s*(?:and )?| and /);
  const lines: ParsedScenarioLine[] = [];
  for (const part of parts) {
    const read = matchLine(frontRecipient ? `${part} for ${frontRecipient[1]}` : part, definition);
    if ('error' in read) return lineFailure(read.error);
    lines.push(read.line);
  }
  return action === 'request'
    ? { kind: 'parsed', form: frame.form, lines }
    : { kind: 'context_mismatch' };
}
