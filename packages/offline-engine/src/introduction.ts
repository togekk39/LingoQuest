import type { LearningError } from './travel-learning';

const greetingStart =
  /^(?:(?:hi|hello|hey)(?: there)?|good (?:morning|afternoon|evening))(?=$|[ ,.!?])/;
const namePattern = /^\p{L}\p{M}*(?:[ '-]?\p{L}\p{M}*)*$/u;
const nonNameWords = /^(?:i|my|you|your|am|is|are|was|were|called|here|very|from)$/u;
const nonNameStarts =
  /^(?:not|a|an|the|at|in|on|with|fine|good|okay|ok|happy|ready|tired|doing|looking|going|waiting|trying|learning|working|visiting|sorry|glad|excited|hungry|thirsty|lost|sick|busy|uh|um|er|ah)$/u;

function isName(value: string | undefined): boolean {
  if (!value || value.length > 120 || !namePattern.test(value)) return false;
  const words = value.split(' ');
  return !nonNameStarts.test(words[0]) && !words.some((word) => nonNameWords.test(word));
}

export function readIntroduction(value: string, spoken = false) {
  const text = value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const greeting = text.match(greetingStart)?.[0];
  let body = (greeting ? text.slice(greeting.length).replace(/^[ ,.!?]+/, '') : text)
    .replace(/[.!?]+$/, '')
    .trim();
  if (greeting) body = body.replace(/^sam[,! ]+(?=(?:i |i'm |im |my name|you can))/, '');
  if (spoken) body = body.replace(/^im\b/, "i'm").replace(/^my names\b/, "my name's");

  const target = body.match(/^(?:i am|i'm|my name is|my name's)(?: |$)(.*)$/);
  const alternative =
    body.match(/^(?:you can call me|i am called|i'm called) (.+)$/) ?? body.match(/^(.+) here$/);
  const form = isName(alternative?.[1])
    ? 'alternative'
    : isName(target?.[1])
      ? 'target'
      : undefined;
  return {
    greeting: !!greeting,
    form,
    startsTarget: !!target,
    error: form ? undefined : introductionError(body),
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
