import type { LearningError } from '@lingoquest/contracts';
import type {
  TeamForm,
  TeamPerson,
  TeamScenarioDefinition,
  TeamTask,
} from '@lingoquest/course-pack';

type TeamAction =
  | {
      form: 'progressive-positive' | 'progressive-negative' | 'habit' | 'habit-contrast';
      person: TeamPerson;
      task: TeamTask;
      usual?: TeamTask;
    }
  | {
      form:
        | 'progressive-question'
        | 'ability-question'
        | 'help-request'
        | 'ability-positive'
        | 'ability-negative';
      person: TeamPerson;
      task?: TeamTask;
    }
  | { form: 'help-offer' }
  | { form: 'instruction' | 'sequence'; tasks: TeamTask[] };
export type TeamLanguage = TeamAction | { error: LearningError; form: TeamForm; task?: TeamTask };

export function parseTeamLanguage(
  definition: TeamScenarioDefinition,
  input: string,
  addressed?: TeamPerson,
): TeamLanguage | undefined {
  const raw = input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .trim()
    .replace(/\s+/g, ' ');
  if (!raw || /[^a-z' ,.;?!]/.test(raw)) return;
  const isQuestion = raw.endsWith('?');
  const normalized = raw
    .replace(/[.!?]$/, '')
    .replace(/\b(can)('t|not)\b/g, '$1 not')
    .replace(/\b(is|are)n't\b/g, '$1 not')
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\b(you|we|they)'re\b/g, '$1 are')
    .replace(/\b([a-z]+)'s\b/g, '$1 is');
  const words = normalized.replace(/,/g, '').replace(/ +/g, ' ');
  const { participants, tasks } = definition;
  const personFor = (subject: string) =>
    participants.find(({ name }) => name.toLowerCase() === subject) ??
    (subject === 'you' || addressed?.pronoun === subject ? addressed : undefined);
  const beFor = (subject: string, person: TeamPerson) =>
    subject === 'you' || subject === 'they' || (subject === 'who' && person.pronoun === 'they')
      ? 'are'
      : 'is';
  const base = (value: string) =>
    tasks.find(({ command, aliases = [] }) => [command.en, ...aliases].includes(value));
  const action = (value: string) => tasks.find(({ progressive }) => progressive.en === value);
  const habitual = (value: string) => tasks.find((task) => task.habitual === value);
  const malformedIng = (value: string) =>
    tasks.find(({ command, progressive }) => {
      const [verb, ...rest] = command.en.split(' ');
      const tail = rest.join(' ');
      const correct = progressive.en.split(' ')[0];
      return [
        verb,
        verb + 'ing',
        verb.slice(0, -1) + 'ing',
        verb + verb.at(-1) + 'ing',
        correct.slice(0, -1),
        correct + 'g',
      ].some((candidate) => [candidate, tail].filter(Boolean).join(' ') === value);
    });
  const malformedBase = (value: string) =>
    action(value) ?? habitual(value) ?? base(value.replace(/^to /, ''));

  const sequence = /^first,? ([a-z ]+?)(?:[.;,] | )(?:and )?(?:then|next),? (.+)$/.exec(normalized);
  if (sequence && !isQuestion) {
    const first = base(sequence[1].trim());
    const next = base(sequence[2].replace(/^please /, '').trim());
    return first && next ? { form: 'sequence', tasks: [first, next] } : undefined;
  }
  const instruction = base(words.replace(/^please /, '').replace(/ please$/, ''));
  if (instruction && !isQuestion) return { form: 'instruction', tasks: [instruction] };

  const request = /^(?:([a-z]+), )?can you (.+?)(?:,? please)?(?:, ([a-z]+))?$/.exec(normalized);
  if (request) {
    const [, before, requestWords, after] = request;
    if (before && after) return;
    const person = before || after ? personFor(before ?? after) : addressed;
    if (!person) return;
    const task = base(requestWords);
    if (task) return { form: 'help-request', person, task };
    const malformed = malformedBase(requestWords);
    if (malformed) return { form: 'help-request', error: 'can_base', task: malformed };
    if (requestWords === 'help me' || requestWords === 'help us')
      return { form: 'help-request', person };
    return;
  }
  if (/^(?:can i help(?: you)?|i can help(?: you)?)$/.test(words)) return { form: 'help-offer' };
  const question = /^can ([a-z]+) (.+)$/.exec(words);
  if (question) {
    const [, subject, verb] = question;
    const person = personFor(subject);
    const task = base(verb);
    if (person && task) return { form: 'ability-question', person, task };
    const malformed = malformedBase(verb);
    if (person && malformed)
      return { form: 'ability-question', error: 'can_base', task: malformed };
  }
  const ability = /^([a-z]+) can (not )?(.+)$/.exec(words);
  if (ability && !isQuestion) {
    const [, subject, negative, verb] = ability;
    const person = personFor(subject);
    const form = negative ? 'ability-negative' : 'ability-positive';
    const task = base(verb);
    if (person && task) return { form, person, task };
    const malformed = malformedBase(verb);
    if (person && malformed) return { form, error: 'can_base', task: malformed };
  }

  const what = /^what (am|is|are) ([a-z]+) (?:still )?doing(?: right now| now)?$/.exec(words);
  const yesNo = /^(am|is|are) ([a-z]+) (?:still )?(.+?)(?: right now| now)?$/.exec(words);
  if (what || yesNo) {
    const [, be, subject, verb] = (what ?? yesNo)!;
    const person = personFor(subject);
    const form = 'progressive-question';
    if (!person) return;
    const task = verb ? action(verb) : undefined;
    if (be !== beFor(subject, person)) return { form, error: 'be_agreement', task };
    if (what || task) return { form, person, task };
    const malformed = verb && malformedIng(verb);
    if (malformed) return { form, error: 'progressive_spelling', task: malformed };
    return;
  }
  if (/^what [a-z]+ (?:am|is|are) doing/.test(words))
    return { form: 'progressive-question', error: 'word_order' };
  if (/^what [a-z]+ doing/.test(words))
    return { form: 'progressive-question', error: 'be_omission' };

  const contrast = /^([a-z]+) usually (.+?),? but today,? ([a-z]+) (am|is|are) (.+)$/.exec(
    normalized,
  );
  if (contrast && !isQuestion) {
    const [, firstSubject, routine, secondSubject, be, current] = contrast;
    const person = personFor(firstSubject);
    const form = 'habit-contrast';
    if (!person || (person.pronoun !== secondSubject && person.id !== secondSubject)) return;
    const task = action(current);
    const usual = habitual(routine);
    if (be !== beFor(secondSubject, person)) return { form, error: 'be_agreement', task };
    if (usual && task) return { form, person, task, usual };
    if (base(routine)) return { form, error: 'third_person', task };
    const malformed = malformedIng(current);
    if (usual && malformed) return { form, error: 'progressive_spelling', task: malformed };
    return;
  }

  const statement =
    /^([a-z]+) (?:(am|is|are) )?(not )?(?:still )?(.+?)(?: today| right now| now)?$/.exec(words);
  if (!statement) return;
  const [, subject, be, negative, clause] = statement;
  const person = personFor(subject);
  if (!person) return;
  const form = isQuestion
    ? 'progressive-question'
    : negative
      ? 'progressive-negative'
      : 'progressive-positive';
  const task = action(clause);
  if (task) {
    if (!be) return { form, error: 'be_omission', task };
    if (be !== beFor(subject, person)) return { form, error: 'be_agreement', task };
    if (isQuestion) return { form, error: 'word_order', task };
    return { form: negative ? 'progressive-negative' : 'progressive-positive', person, task };
  }
  const badNegative = /^(.+) not$/.exec(clause);
  if (badNegative && action(badNegative[1]))
    return {
      form: 'progressive-negative',
      error: 'progressive_negative',
      task: action(badNegative[1]),
    };
  if (clause.startsWith('usually ') && !isQuestion) {
    const routine = clause.slice('usually '.length);
    const usual = habitual(routine);
    if (usual && !be && !negative) return { form: 'habit', person, task: usual };
    if (action(routine) && be) return { form: 'habit', error: 'tense' };
    if (base(routine)) return { form: 'habit', error: 'third_person' };
  }
  if (be && /^(?:liking|knowing|wanting|needing) .+$/.test(clause))
    return { form, error: 'habit_state' };
  const malformed = malformedIng(clause);
  if (malformed && be) return { form, error: 'progressive_spelling', task: malformed };
}
