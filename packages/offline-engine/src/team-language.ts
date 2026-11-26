import type { LearningError } from '@lingoquest/contracts';
import type {
  TeamForm,
  TeamPerson,
  TeamScenarioDefinition,
  TeamTask,
} from '@lingoquest/course-pack';

type Group = NonNullable<TeamScenarioDefinition['groups']>[number];
type Subject =
  | { kind: 'player'; id: 'player' }
  | { kind: 'person'; id: string; person: TeamPerson }
  | { kind: 'group'; id: string; group: Group };
type Clause = {
  form:
    | 'progressive-positive'
    | 'progressive-negative'
    | 'habit'
    | 'habit-contrast'
    | 'progressive-information'
    | 'progressive-yes-no'
    | 'ability-question'
    | 'ability-positive'
    | 'ability-negative'
    | 'availability-question'
    | 'help-request';
  subject: Subject;
  task?: TeamTask;
  usual?: TeamTask;
};
type TeamAction =
  | Clause
  | { form: 'help-offer' }
  | { form: 'owner-question' | 'completion-question'; task: TeamTask }
  | { form: 'instruction' | 'sequence'; tasks: TeamTask[] }
  | { form: 'handover'; subject: Subject; task: TeamTask; next: TeamTask };
export type TeamLanguage = TeamAction | { error: LearningError; form: TeamForm; task?: TeamTask };
type Context = { addressed?: TeamPerson; focusId?: string; canYou?: 'ability' | 'request' };

const time = /^(?:right now|now|today),? | (?:right now|now|today)$/g;
const subjectPattern = '([a-z]+(?: and [a-z]+)*)';
const progressive = new RegExp(`^${subjectPattern} (?:(am|is|are) )?(not )?(?:still )?(.+)$`);
const infoQuestion = new RegExp(`^what (am|is|are) ${subjectPattern} (?:still )?doing$`);
const inverted = new RegExp(`^(am|is|are) ${subjectPattern} (?:still )?(.+)$`);

export function parseTeamLanguage(
  definition: TeamScenarioDefinition,
  input: string,
  context: Context = {},
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
  const words = normalized.replace(/,/g, '');
  const { participants, groups = [] } = definition;
  const tasks = definition.tasks.filter(({ recordOnly }) => !recordOnly);
  const named = (name: string) => participants.find((person) => person.name.toLowerCase() === name);
  const resolve = (name: string, antecedent?: Subject): Subject | undefined => {
    if (name === 'i') return { kind: 'player', id: 'player' };
    const focus = antecedent?.id ?? context.focusId;
    const person =
      name === 'you'
        ? context.addressed
        : (named(name) ??
          participants.find(
            (item) => item.id === focus && item.pronoun === name && name !== 'they',
          ));
    if (person) return { kind: 'person', id: person.id, person };
    const namedMembers = name.includes(' and ')
      ? name.split(' and ').map((member) => named(member)?.id)
      : [];
    const candidates = groups.filter((group) =>
      name === 'we'
        ? group.members.includes('player')
        : name === 'they'
          ? group.id === focus && !group.members.includes('player')
          : namedMembers.length === group.members.length &&
            new Set(namedMembers).size === namedMembers.length &&
            namedMembers.every((member) => member && group.members.includes(member)),
    );
    if (candidates.length === 1)
      return { kind: 'group', id: candidates[0].id, group: candidates[0] };
  };
  const beFor = (name: string) =>
    name === 'i'
      ? 'am'
      : ['you', 'we', 'they'].includes(name) || name.includes(' and ')
        ? 'are'
        : 'is';
  const taskByBase = (value: string) =>
    tasks.find(({ command, aliases = [] }) => [command.en, ...aliases].includes(value));
  const taskByIng = (value: string) => {
    const exact = tasks.find(({ progressive }) => progressive.en === value);
    if (exact || value.includes(' ')) return exact;
    const matching = tasks.filter(({ progressive }) => progressive.en.split(' ')[0] === value);
    return matching.length === 1 ? matching[0] : undefined;
  };
  const taskByHabit = (value: string) => tasks.find(({ habitual }) => habitual === value);
  const badIng = (value: string) =>
    tasks.find(({ command, progressive }) => {
      const [verb, ...rest] = command.en.split(' ');
      const correct = progressive.en.split(' ')[0];
      return [
        verb,
        verb + 'ing',
        verb.slice(0, -1) + 'ing',
        verb + verb.at(-1) + 'ing',
        correct.slice(0, -1),
        correct + 'g',
      ].some((candidate) => [candidate, ...rest].join(' ') === value);
    });
  const badBase = (value: string) =>
    taskByIng(value) ?? taskByHabit(value) ?? taskByBase(value.replace(/^to /, ''));
  const command = (value: string) =>
    taskByBase(
      value
        .replace(/^please,? /, '')
        .replace(/,? please$/, '')
        .trim(),
    );
  const routine = (name: string, verb: string) => {
    const singular = beFor(name) === 'is';
    return {
      task: singular ? taskByHabit(verb) : taskByBase(verb),
      wrong: singular ? taskByBase(verb) : taskByHabit(verb),
    };
  };
  const describe = (
    form: Clause['form'],
    name: string,
    be: string | undefined,
    value: string,
    antecedent?: Subject,
  ): TeamLanguage | undefined => {
    const task = taskByIng(value);
    const subject = resolve(name, antecedent);
    if (task && !be) return { form, error: 'be_omission', task };
    if (be && be !== beFor(name) && (task || badIng(value)))
      return { form, error: 'be_agreement', task };
    if (be && badIng(value) && !task)
      return { form, error: 'progressive_spelling', task: badIng(value) };
    if (be && task && subject) return { form, subject, task };
  };

  const sequence = /^first,? (.+?)(?:[.;,] | )(?:and )?(?:then|next),? (.+)$/.exec(normalized);
  if (sequence && !isQuestion) {
    const first = command(sequence[1]);
    const next = command(sequence[2]);
    if (first && next) return { form: 'sequence', tasks: [first, next] };
    return;
  }
  const handover = /^(.+?)[.;] (?:and )?(?:then|next),? (.+)$/.exec(normalized);
  if (handover && !isQuestion) {
    const clause = progressive.exec(handover[1].replace(/,/g, '').replace(time, ''));
    const next = command(handover[2]);
    if (!clause || !next || clause[3]) return;
    const current = describe('progressive-positive', clause[1], clause[2], clause[4]);
    if (current && 'error' in current) return current;
    if (current && 'subject' in current && current.task)
      return { form: 'handover', subject: current.subject, task: current.task, next };
    return;
  }
  const instruction = command(normalized.replace(/^(?:then|next),? /, ''));
  if (instruction && !isQuestion) return { form: 'instruction', tasks: [instruction] };

  const availability =
    /^(?:can (you|[a-z]+) help (?:right )?now|(?:is|are) (you|[a-z]+) busy(?: (?:right )?now)?)$/.exec(
      words,
    );
  if (availability) {
    const name = availability[1] ?? availability[2];
    const subject = resolve(name);
    if (availability[2] && !words.startsWith(beFor(name) + ' '))
      return { form: 'availability-question', error: 'be_agreement' };
    if (subject?.kind === 'person') return { form: 'availability-question', subject };
  }
  if (/^(?:can i help(?: you)?|i can help(?: you)?)$/.test(words)) return { form: 'help-offer' };

  const request =
    /^(?:please,? )?(?:([a-z]+), )?can you (.+?)(?:,? please)?(?:, ([a-z]+))?(?:,? please)?$/.exec(
      normalized,
    );
  if (request) {
    const [, before, verb, after] = request;
    if (before && after) return;
    const recipient = before ?? after;
    const subject = recipient ? resolve(recipient) : resolve('you');
    if (subject?.kind !== 'person' || (recipient && !named(recipient))) return;
    const polite = /\bplease\b/.test(normalized) || !!recipient;
    const form =
      polite || context.canYou === 'request'
        ? 'help-request'
        : context.canYou === 'ability'
          ? 'ability-question'
          : undefined;
    if (!form) return;
    const task = taskByBase(verb);
    if (task) return { form, subject, task };
    if (badBase(verb)) return { form, error: 'can_base', task: badBase(verb) };
    if (form === 'help-request' && /^(help me|help us)$/.test(verb)) return { form, subject };
    return;
  }

  const question = /^can ([a-z]+) (.+)$/.exec(words);
  if (question) {
    const subject = resolve(question[1]);
    const task = taskByBase(question[2]);
    if (subject?.kind === 'person' && task) return { form: 'ability-question', subject, task };
    if (badBase(question[2]))
      return { form: 'ability-question', error: 'can_base', task: badBase(question[2]) };
  }
  const ability = /^([a-z]+) can (not )?(.+)$/.exec(words);
  if (ability && !isQuestion) {
    const subject = resolve(ability[1]);
    const form = ability[2] ? 'ability-negative' : 'ability-positive';
    const task = taskByBase(ability[3]);
    if (subject?.kind === 'person' && task) return { form, subject, task };
    if (badBase(ability[3])) return { form, error: 'can_base', task: badBase(ability[3]) };
  }

  const current = words.replace(time, '');
  const owner = /^who is (.+)$/.exec(current);
  const ownerTask = owner && taskByIng(owner[1]);
  if (ownerTask) return { form: 'owner-question', task: ownerTask };
  const finished = /^is (.+) done$/.exec(current);
  const completedTask = finished && taskByIng(finished[1]);
  if (completedTask) return { form: 'completion-question', task: completedTask };

  const info = infoQuestion.exec(current);
  if (info) {
    const [, be, name] = info;
    if (be !== beFor(name)) return { form: 'progressive-information', error: 'be_agreement' };
    const subject = resolve(name);
    if (subject) return { form: 'progressive-information', subject };
    return;
  }
  if (/^what [a-z]+ (?:am|is|are) doing$/.test(current))
    return { form: 'progressive-information', error: 'word_order' };
  if (/^what [a-z]+ doing$/.test(current))
    return { form: 'progressive-information', error: 'be_omission' };

  const yesNo = inverted.exec(current);
  if (yesNo) return describe('progressive-yes-no', yesNo[2], yesNo[1], yesNo[3]);

  const contrast = new RegExp(
    `^${subjectPattern} usually (.+?),? but (?:today|right now|now),? (.+)$`,
  ).exec(normalized);
  if (contrast && !isQuestion) {
    const [, name, usualVerb, active] = contrast;
    const form = 'habit-contrast';
    const subject = resolve(name);
    const habitual = routine(name, usualVerb);
    if (habitual.wrong) return { form, error: 'third_person' };
    const clause = progressive.exec(active.replace(/,/g, '').replace(time, ''));
    if (!clause || !subject || !habitual.task || clause[3]) return;
    const described = describe(form, clause[1], clause[2], clause[4], subject);
    if (described && 'error' in described) return described;
    if (described && 'subject' in described && described.subject.id === subject.id)
      return { ...described, form, usual: habitual.task };
    return;
  }

  const statement = progressive.exec(current);
  if (!statement) return;
  const [, name, be, negative, clause] = statement;
  const subject = resolve(name);
  const form = isQuestion
    ? 'progressive-yes-no'
    : negative
      ? 'progressive-negative'
      : 'progressive-positive';
  if (clause.startsWith('usually ') && !isQuestion) {
    const verb = clause.slice('usually '.length);
    const habitual = routine(name, verb);
    if (be && taskByIng(verb)) return { form: 'habit', error: 'tense' };
    if (!be && habitual.wrong)
      return { form: 'habit', error: 'third_person', task: habitual.wrong };
    if (!be && subject && habitual.task && !negative)
      return { form: 'habit', subject, task: habitual.task };
    return;
  }
  if (be && /^(liking|knowing|wanting|needing) (soup|jo|lunch|help)$/.test(clause))
    return { form, error: 'habit_state' };
  if (be && / not$/.test(clause) && taskByIng(clause.slice(0, -4)))
    return {
      form: 'progressive-negative',
      error: 'progressive_negative',
      task: taskByIng(clause.slice(0, -4)),
    };
  const result = describe(form, name, be, clause);
  if (result && !('error' in result) && isQuestion)
    return { form, error: 'word_order', task: taskByIng(clause) };
  return result;
}
