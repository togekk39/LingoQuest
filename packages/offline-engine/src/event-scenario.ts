import { z } from 'zod';
import { normalizeAnswerText } from '@lingoquest/contracts';
import {
  eventFactSchema,
  type EventFact,
  type EventForm,
  type EventScenarioDefinition,
  type EventScenarioTurn,
  type TimelineEvent,
} from '@lingoquest/course-pack';
import type { ScenarioReply, ScenarioVerdict } from './scenario';

const identifier = z
  .string()
  .regex(/^[a-z][a-z0-9._-]*$/)
  .max(100);
const factKey = z.object({ eventId: identifier, field: eventFactSchema }).strict();

export const eventScenarioStateSchema = z
  .object({
    kind: z.literal('timeline'),
    scenarioId: identifier,
    definitionDigest: z.string().regex(/^[a-f0-9]{64}$/),
    phase: z.enum(['investigating', 'complete']),
    confirmed: z.array(factKey).max(80),
    answers: z
      .array(factKey.extend({ speakerId: identifier, subjectId: identifier.optional() }))
      .max(160),
    submitted: z
      .array(z.object({ eventId: identifier, text: z.string().min(1).max(2000) }).strict())
      .max(20),
  })
  .strict();

export type EventScenarioState = z.infer<typeof eventScenarioStateSchema>;
type Participant = EventScenarioDefinition['participants'][number];
type InquiryForm = Extract<EventForm, 'did-question' | 'wh-question' | 'subject-question'>;
const uncertainty = {
  en: "I'm not sure. Maybe someone else knows.",
  es: 'No estoy seguro. Tal vez alguien más lo sepa.',
};
const ambiguity = { en: 'Which event do you mean?', es: '¿A qué evento te refieres?' };
const normalize = (value: string) =>
  normalizeAnswerText(value)
    .replace(/[,]/g, '')
    .replace(/\ba\.m\.?/g, 'am')
    .replace(/\bp\.m\.?/g, 'pm');
const includesPhrase = (value: string, phrases: readonly string[]) =>
  phrases.some((phrase) => value === normalize(phrase));

function namedPerson(definition: EventScenarioDefinition, value: string) {
  return definition.participants.find(({ name, aliases }) =>
    includesPhrase(value, [name, ...(aliases ?? [])]),
  );
}

export function confirmedEventFact(
  state: EventScenarioState | undefined,
  event: TimelineEvent,
  field: EventFact,
) {
  return (
    event.visible.includes(field) ||
    !!state?.confirmed.some((fact) => fact.eventId === event.id && fact.field === field)
  );
}

export function eventScenarioReady(
  definition: EventScenarioDefinition,
  state?: EventScenarioState,
) {
  return definition.events.every((event) =>
    event.required.every((field) => confirmedEventFact(state, event, field)),
  );
}

function factReply(
  definition: EventScenarioDefinition,
  event: TimelineEvent,
  field: EventFact,
  speaker: Participant,
  subject?: Participant,
): ScenarioReply['line'] {
  const actor = definition.participants.find(({ id }) => id === event.personId)!;
  switch (field) {
    case 'person':
      if (!subject) return { en: `${actor.name} did.`, es: `Fue ${actor.name}.` };
      if (subject.id === speaker.id)
        return actor.id === speaker.id
          ? { en: 'Yes, I did.', es: 'Sí, fui yo.' }
          : { en: "No, I didn't.", es: 'No, yo no fui.' };
      return actor.id === subject.id
        ? { en: `Yes, ${subject.name} did.`, es: `Sí, fue ${subject.name}.` }
        : { en: `No, ${subject.name} didn't.`, es: `No, ${subject.name} no fue.` };
    case 'time':
      return { en: `At ${event.time.label.en}.`, es: `A las ${event.time.label.es}.` };
    case 'place':
      return { en: `At ${event.place.label.en}.`, es: `En ${event.place.label.es}.` };
    case 'object':
      return { en: `${event.object!.label.en}.`, es: `${event.object!.label.es}.` };
  }
}

export function eventScenarioPhrases(definition: EventScenarioDefinition) {
  const speakers = definition.participants;
  return [
    uncertainty.en,
    ambiguity.en,
    ...definition.events.flatMap((event) =>
      event.witnesses.flatMap(({ personId, knows }) => {
        const speaker = speakers.find(({ id }) => id === personId)!;
        return knows.flatMap((field) => [
          factReply(definition, event, field, speaker).en,
          ...(field === 'person'
            ? speakers.map((subject) => factReply(definition, event, field, speaker, subject).en)
            : []),
        ]);
      }),
    ),
    'The journal is ready.',
  ];
}

function inquire(
  definition: EventScenarioDefinition,
  state: EventScenarioState,
  turn: EventScenarioTurn,
  text: string,
  speakerId?: string,
): { verdict: ScenarioVerdict; state?: EventScenarioState; reply?: ScenarioReply } {
  const speaker = definition.participants.find(({ id }) => id === speakerId);
  const noReply = {
    outcome: 'ungradable' as const,
    feedbackEs: 'Elige a quién preguntar y escribe una pregunta sobre un evento del diario.',
  };
  if (!speaker) return { verdict: noReply };
  if (eventScenarioReady(definition, state))
    return {
      verdict: {
        outcome: 'context_mismatch',
        feedbackEs: 'Ya reuniste los datos necesarios. Continúa para escribir la corrección.',
      },
    };

  const did = /^(?:(when|where|what time|what) )?did ([a-z]+) (.+)$/.exec(text);
  const who = /^who (.+)$/.exec(text);
  const subject = did && (did[2] === 'you' ? speaker : namedPerson(definition, did[2]));
  const [verb, ...words] = (did?.[3] ?? who?.[1] ?? '').split(' ');
  const complement = words.join(' ');
  const pastVerb = definition.events.some(({ past }) => normalize(past) === verb);
  const baseVerb = definition.events.some(({ base }) => normalize(base) === verb);
  const form: InquiryForm = who ? 'subject-question' : did?.[1] ? 'wh-question' : 'did-question';
  const formTargets = turn.formTargets?.find((entry) => entry.form === form)?.targets ?? [];
  if (
    (did && pastVerb) ||
    /^(?:(?:where|when|what) )?did \w+ (?:was|were)\b/.test(text) ||
    /^where did \w+ (?:be|were|was)$/.test(text)
  ) {
    return {
      verdict: {
        outcome: 'incorrect',
        feedbackEs: pastVerb
          ? 'Después de did usa la forma base del verbo.'
          : 'Para preguntar con was o were, pon esa forma antes del sujeto.',
        error: 'did_base',
        targets: formTargets.filter(
          ({ dimension, targetId }) =>
            dimension === 'grammar_production' && targetId === 'grammar.did',
        ),
      },
    };
  }
  if (who && baseVerb && !pastVerb)
    return {
      verdict: {
        outcome: 'incorrect',
        feedbackEs: 'Después de who, cuando preguntas quién hizo algo, usa el pasado del verbo.',
      },
    };
  if ((!did && !who) || (did && !subject))
    return { verdict: noReply, reply: { speaker: speaker.name, line: ambiguity } };

  const field: EventFact =
    did?.[1] === 'when' || did?.[1] === 'what time'
      ? 'time'
      : did?.[1] === 'where'
        ? 'place'
        : did?.[1] === 'what'
          ? 'object'
          : 'person';
  const matches = definition.events.filter(
    (event) =>
      normalize(who ? event.past : event.base) === verb &&
      (includesPhrase(complement, event.complements) ||
        (field === 'object' && !complement && !!event.object)),
  );
  const [event] = matches;
  if (!event || matches.length !== 1)
    return { verdict: noReply, reply: { speaker: speaker.name, line: ambiguity } };
  const knowledge = event.witnesses.find(({ personId }) => personId === speaker.id);
  const actorMatches = !subject || subject.id === event.personId;
  const canAnswer = knowledge?.knows.includes(field) && (field === 'person' || actorMatches);
  if (!canAnswer || (field === 'object' && !event.object))
    return {
      verdict: {
        outcome: 'communication_only',
        feedbackEs: 'La pregunta se entiende. Prueba con otra persona o pregunta por otro dato.',
      },
      state,
      reply: { speaker: speaker.name, line: uncertainty },
    };

  const previous = state.answers.some(
    (answer) =>
      answer.eventId === event.id &&
      answer.field === field &&
      answer.speakerId === speaker.id &&
      answer.subjectId === (field === 'person' ? subject?.id : undefined),
  );
  const confirmed =
    (field !== 'person' || actorMatches) && !confirmedEventFact(state, event, field);
  const reply = {
    speaker: speaker.name,
    line: factReply(definition, event, field, speaker, subject ?? undefined),
  };
  if (previous || state.answers.length >= 160)
    return {
      verdict: {
        outcome: 'communication_only',
        feedbackEs: 'Ya tienes esta respuesta en el diario.',
      },
      state,
      reply,
    };

  const target = turn.focusEventIds.includes(event.id) && turn.targetForms.includes(form);
  return {
    verdict: {
      outcome: target ? 'target' : 'communication_only',
      targets: target ? formTargets : [],
    },
    state: {
      ...state,
      confirmed: confirmed ? [...state.confirmed, { eventId: event.id, field }] : state.confirmed,
      answers: [
        ...state.answers,
        {
          eventId: event.id,
          field,
          speakerId: speaker.id,
          ...(field === 'person' && subject && { subjectId: subject.id }),
        },
      ],
    },
    reply,
  };
}

const timePattern =
  "(?:[0-9]{1,2}(?::[0-9]{2})?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|noon|midnight)(?: o'clock)?(?: [ap]m)?";
const leadingTime = new RegExp(`^at (${timePattern}) (.+)$`);
const trailingTime = new RegExp(`(?:^| )at (${timePattern})(?: |$)`);

function record(
  definition: EventScenarioDefinition,
  state: EventScenarioState,
  turn: EventScenarioTurn,
  input: string,
): { verdict: ScenarioVerdict; state?: EventScenarioState; reply?: ScenarioReply } {
  const mismatch = (feedbackEs: string) => ({
    verdict: { outcome: 'context_mismatch' as const, feedbackEs },
  });
  if (state.phase === 'complete' || !eventScenarioReady(definition, state))
    return mismatch('Confirma los datos pendientes del diario antes de guardarlos.');
  const clauses = input
    .trim()
    .split(/(?:[.!?](?![mM]\b|\d)|\n)(?:\s+|$)/)
    .filter((line) => line.trim());
  const submitted: EventScenarioState['submitted'] = [];
  const productions = new Set<EventForm>();
  for (const source of clauses) {
    const text = normalize(source).replace(/^yesterday | yesterday$/g, '');
    const first = leadingTime.exec(text);
    const [person, ...words] = (first?.[2] ?? text).split(' ');
    const subject = namedPerson(definition, person);
    if (!subject)
      return {
        verdict: {
          outcome: 'ungradable',
          feedbackEs: 'Empieza con el nombre de la persona y una acción concreta del diario.',
        },
      };
    const rest = words.join(' ').replace(/^didn't /, 'did not ');
    const negative = rest.startsWith('did not ');
    const [verb, ...tail] = (negative ? rest.slice(8) : rest).split(' ');
    const scope = definition.events.filter((event) =>
      [event.base, event.past].map(normalize).includes(verb),
    );
    const args = tail.join(' ');
    const match = scope.flatMap((event) => {
      const prefix = event.complements
        .map(normalize)
        .filter((value) => args === value || args.startsWith(value + ' '))
        .sort((a, b) => b.length - a.length)[0];
      return prefix ? [{ event, details: args.slice(prefix.length).trim() }] : [];
    });
    if (match.length !== 1)
      return {
        verdict: {
          outcome: 'ungradable',
          feedbackEs: 'Escribe una acción del diario con los datos que confirmaste.',
        },
      };
    const { event, details } = match[0];
    if (!turn.focusEventIds.includes(event.id))
      return mismatch('Escribe la corrección de la entrada con datos pendientes.');
    const expected = normalize(negative ? event.base : event.past);
    if (verb !== expected)
      return {
        verdict: {
          outcome: 'incorrect',
          feedbackEs: negative
            ? 'Después de didn’t usa el verbo en su forma base.'
            : 'Para contar lo que pasó usa el pasado del verbo.',
          error: negative ? 'did_base' : 'past_spelling',
          targets: turn.eventTargets
            ?.find(({ eventId }) => eventId === event.id)
            ?.targets.filter(({ dimension }) => dimension === 'grammar_production'),
        },
      };
    if (negative || subject.id !== event.personId)
      return mismatch(
        'La forma en inglés es válida. Comprueba quién realizó la acción y qué pasó.',
      );
    const last = trailingTime.exec(details);
    if (first && last) return mismatch('Incluye una sola hora para este evento.');
    const time = first?.[1] ?? last?.[1];
    const placePhrase = details.replace(trailingTime, ' ').trim();
    if (placePhrase && !/^(at|in) /.test(placePhrase))
      return {
        verdict: {
          outcome: 'ungradable',
          feedbackEs: 'Revisa cómo unes el evento con el lugar. Prueba con at o in.',
        },
      };
    const place = placePhrase.replace(/^(?:at|in) /, '');
    if (
      (time && !includesPhrase(time, event.time.aliases)) ||
      (!time && event.required.includes('time'))
    )
      return mismatch('Comprueba la hora que confirmaste e inclúyela en la nota.');
    if (
      (place && !includesPhrase(place, event.place.aliases)) ||
      (!place && event.required.includes('place'))
    )
      return mismatch('Comprueba el lugar que confirmaste e inclúyelo en la nota.');
    if (submitted.some(({ eventId }) => eventId === event.id))
      return mismatch('Escribe una sola nota por cada evento.');
    submitted.push({ eventId: event.id, text: source.trim() });
    productions.add('past-statement');
  }
  if (
    definition.events.some(
      ({ id, required }) => required.length && !submitted.some(({ eventId }) => eventId === id),
    )
  )
    return mismatch('Incluye una nota en inglés por cada evento con datos pendientes.');
  const target = [...productions].every((form) => turn.targetForms.includes(form));
  const targets = [
    ...(turn.formTargets ?? []).flatMap(({ form, targets }) =>
      productions.has(form) ? targets : [],
    ),
    ...(turn.eventTargets ?? []).flatMap(({ eventId, targets }) =>
      submitted.some((entry) => entry.eventId === eventId) ? targets : [],
    ),
  ];
  return {
    verdict: { outcome: target ? 'target' : 'communication_only', targets },
    state: { ...state, phase: 'complete', submitted },
    reply: {
      speaker: definition.participants[0].name,
      line: { en: 'The journal is ready.', es: 'El diario está listo.' },
    },
  };
}

export function evaluateEventTurn(
  definition: EventScenarioDefinition,
  state: EventScenarioState,
  turn: EventScenarioTurn,
  input: string | undefined,
  speakerId?: string,
) {
  if (!input?.trim()) return { verdict: { outcome: 'ungradable' as const } };
  return turn.action === 'inquire'
    ? inquire(definition, state, turn, normalize(input), speakerId)
    : record(definition, state, turn, input);
}
