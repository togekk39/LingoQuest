import type { LearningError } from './index.ts';

const greetingStart =
  /^(?:(?:hi|hello|hey)(?: there)?|good (?:morning|afternoon|evening))(?=$|[ ,.!?])/i;
const namePart = /^(?:(?:\p{L}\p{M}*\.)+\p{L}?|\p{L}\p{M}*(?:['-]?\p{L}\p{M}*)*)$/u;
const nonNameWords = /^(?:my|you|your|am|is|are|was|were|called|here|very|from)$/u;
const nonNameStarts =
  /^(?:not|a|an|the|at|in|on|with|fine|good|okay|ok|happy|ready|tired|doing|looking|going|waiting|trying|learning|working|visiting|eating|drinking|reading|studying|traveling|calling|listening|speaking|sitting|standing|sorry|glad|excited|hungry|thirsty|lost|sick|busy|uh|um|er|ah)$/u;

function isName(value: string | undefined): boolean {
  const spelling = value?.replace(/[’‘ʼ]/g, "'").replace(/[‐‑]/g, '-');
  if (
    !spelling ||
    spelling.length > 120 ||
    !spelling.split(' ').every((part) => namePart.test(part))
  )
    return false;
  const words = spelling.toLowerCase().split(' ');
  return !nonNameStarts.test(words[0]) && !words.some((word) => nonNameWords.test(word));
}

export function readIntroduction(value: string, spoken = false) {
  const text = value
    .normalize('NFKC')
    .replace(/[’‘ʼ]/g, "'")
    .replace(/[‐‑]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const greeting = text.match(greetingStart)?.[0];
  let body = (greeting ? text.slice(greeting.length).replace(/^[ ,.!?]+/, '') : text)
    .replace(/[.!?]+$/, '')
    .trim();
  if (greeting) body = body.replace(/^sam[,! ]+(?=(?:i |i'm |im |my name|you can))/i, '');
  if (spoken) body = body.replace(/^im\b/i, "i'm").replace(/^my names\b/i, "my name's");

  const target = body.match(/^(?:i am|i'm|my name is|my name's)(?: |$)(.*)$/i);
  const alternative =
    body.match(/^(?:you can call me|i am called|i'm called) (.+)$/i) ?? body.match(/^(.+) here$/i);
  const candidate = alternative?.[1] ?? target?.[1];
  const name = isName(candidate) ? candidate : candidate?.replace(/\.+$/, '');
  const form = isName(name) ? (alternative ? 'alternative' : 'target') : undefined;
  return {
    greeting: !!greeting,
    form,
    name: form ? name : undefined,
    startsTarget: !!target,
    error: form ? undefined : introductionError(body.toLowerCase()),
  };
}

function introductionError(body: string): LearningError | undefined {
  const candidates: [LearningError, RegExp][] = [
    ['be_agreement', /^(?:i (?:is|are)|my name (?:am|are)) (.+)$/],
    ['subject_omission', /^(?:am|is) (.+)$/],
    ['be_omission', /^(?:i|my name) (.+)$/],
    ['word_order', /^(?:i (.+) am|my name (.+) is|(.+) i am|(.+) my name is)$/],
  ];
  return candidates.find(([, pattern]) => body.match(pattern)?.slice(1).some(isName))?.[0];
}

export function meetsIntroduction(
  response: ReturnType<typeof readIntroduction>,
  greetingRequired: boolean,
) {
  return response.form === 'target' && (response.greeting || !greetingRequired);
}

export function playerIntroductionName(value: string | undefined) {
  const name = value?.normalize('NFKC').trim().replace(/\s+/g, ' ');
  return name?.toLowerCase() !== 'explorador' && isName(name) ? name : undefined;
}

export function matchesIntroductionName(actual: string, expected: string, spoken = false) {
  function key(name: string) {
    const normalized = name
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[’‘ʼ]/g, "'")
      .replace(/[‐‑]/g, '-')
      .replace(/((?:^| )\p{L}\p{M}*)\.(?= |$)/gu, '$1')
      .trim()
      .replace(/\s+/g, ' ');
    return spoken ? normalized.normalize('NFD').replace(/[\p{M} '-]/gu, '') : normalized;
  }
  return key(actual) === key(expected);
}
