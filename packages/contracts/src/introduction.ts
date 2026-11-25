import type { LearningError } from './index.ts';

const greetingStart =
  /^(?:(?:hi|hello|hey)(?: there)?|good (?:morning|afternoon|evening))(?=$|[ ,.!?])/i;
const namePart = /^(?:(?:\p{L}\p{M}*\.)+\p{L}?|\p{L}\p{M}*(?:['·・-]?\p{L}\p{M}*)*)$/u;
const nameParticle =
  /^(?:al|ap|bin|bint|da|dal|das|de|del|della|den|der|di|do|dos|du|el|ibn|la|le|van|von|y)$/u;
const predicateStart = /^(?:not|a|an|the|at|in|on|with|from|very)$/iu;
const statusWord =
  /^(?:late|early|fine|good|okay|ok|here|ready|tired|sorry|glad|hungry|thirsty|lost|sick|busy)$/iu;
const predicatePhrase =
  /^(?:running (?:late|early|behind)|(?:able|unable|about|supposed|willing) to|(?:first|second|third|last|next) (?:in|on|at))(?: |$)/iu;
const embeddedClause = /^(?:i|you|he|she|it|we|they|my|your) (?:am|is|are|was|were|name)(?: |$)/iu;

function normalizeSpelling(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[’‘ʼ]/g, "'")
    .replace(/[‐‑]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasNameSpelling(value: string | undefined) {
  return !!value && value.length <= 120 && value.split(' ').every((part) => namePart.test(part));
}

function looksLikeBareName(value: string) {
  const words = value.split(' ');
  const namedWord = (word: string) => /[\p{Lu}\p{Lt}]/u.test(word) || !/\p{Ll}/u.test(word);
  return (
    !(words.length === 1 && statusWord.test(value)) &&
    !predicatePhrase.test(value) &&
    words.some(namedWord) &&
    words.every((word) => namedWord(word) || nameParticle.test(word))
  );
}

function looksLikeNamedPerson(name: string, explicitName: boolean) {
  const words = name.split(' ');
  return (
    !predicateStart.test(words[0]) &&
    !embeddedClause.test(name) &&
    !words.slice(1).some((word) => /^and$/i.test(word)) &&
    !words.slice(1, -1).some((word) => /^or$/i.test(word)) &&
    (explicitName || looksLikeBareName(name))
  );
}

export function readIntroduction(value: string, spoken = false, confirmedName?: string) {
  const text = normalizeSpelling(value);
  const greeting = text.match(greetingStart)?.[0];
  let body = (greeting ? text.slice(greeting.length).replace(/^[ ,.!?]+/, '') : text)
    .replace(/[.!?]+$/, '')
    .trim();
  if (greeting) body = body.replace(/^sam[,! ]+(?=(?:i |i'm |im |my name|you can))/i, '');
  if (spoken) body = body.replace(/^im\b/i, "i'm").replace(/^my names\b/i, "my name's");

  const target = body.match(/^(i am|i'm|my name is|my name's)(?: |$)(.*)$/i);
  const namedAlternative = body.match(/^(?:you can call me|i am called|i'm called) (.+)$/i);
  const alternative = namedAlternative ?? (!target ? body.match(/^(.+) here$/i) : null);
  const candidate = alternative?.[1] ?? target?.[2];
  const explicitName = !!namedAlternative || !!target?.[1].toLowerCase().startsWith('my name');
  const name = hasNameSpelling(candidate) ? candidate : candidate?.replace(/\.+$/, '');
  const recognizedName =
    !!name &&
    hasNameSpelling(name) &&
    ((confirmedName && matchesIntroductionName(name, confirmedName, spoken)) ||
      looksLikeNamedPerson(name, explicitName));
  const form = recognizedName ? (alternative ? 'alternative' : 'target') : undefined;
  return {
    greeting: !!greeting,
    form,
    name: form ? name : undefined,
    startsTarget: !!target,
    error: form ? undefined : introductionError(body, confirmedName, spoken),
  };
}

function introductionError(
  body: string,
  confirmedName: string | undefined,
  spoken: boolean,
): LearningError | undefined {
  const candidates: [LearningError, RegExp][] = [
    ['be_agreement', /^(?:i (?:is|are)|my name (?:am|are)) (.+)$/i],
    ['subject_omission', /^(?:am|is) (.+)$/i],
    ['be_omission', /^(?:i|my name) (.+)$/i],
    ['word_order', /^(?:i (.+) am|my name (.+) is|(.+) i am|(.+) my name is)$/i],
  ];
  return candidates.find(([, pattern]) =>
    body
      .match(pattern)
      ?.slice(1)
      .some(
        (part) =>
          hasNameSpelling(part) &&
          ((confirmedName && matchesIntroductionName(part, confirmedName, spoken)) ||
            looksLikeNamedPerson(part, false)),
      ),
  )?.[0];
}

export function meetsIntroduction(
  response: ReturnType<typeof readIntroduction>,
  greetingRequired: boolean,
) {
  return response.form === 'target' && (response.greeting || !greetingRequired);
}

export function playerIntroductionName(value: string | undefined) {
  const name = value?.normalize('NFKC').trim().replace(/\s+/g, ' ');
  return name?.toLowerCase() !== 'explorador' && hasNameSpelling(normalizeSpelling(name ?? ''))
    ? name
    : undefined;
}

export function matchesIntroductionName(actual: string, expected: string, spoken = false) {
  function key(name: string) {
    const normalized = name
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[’‘ʼ]/g, "'")
      .replace(/[‐‑]/g, '-')
      .replace(
        /(^| )((?:\p{L}\p{M}*\.)+\p{L}?\p{M}*)(?= |$)/gu,
        (_match, space, initials) => space + initials.replace(/\./g, ' ').trim(),
      )
      .trim()
      .replace(/\s+/g, ' ');
    return spoken ? normalized.normalize('NFD').replace(/[\p{M} '-]/gu, '') : normalized;
  }
  return key(actual) === key(expected);
}
