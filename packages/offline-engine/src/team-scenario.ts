import { z } from 'zod';
import {
  teamStatusSchema,
  teamFactKindSchema,
  type TeamForm,
  type TeamPerson,
  type TeamScenarioDefinition,
  type TeamScenarioTurn,
  type TeamTask,
} from '@lingoquest/course-pack';
import type { ScenarioEvaluation, ScenarioReply } from './scenario';
import { parseTeamLanguage } from './team-language';

const id = z
  .string()
  .max(100)
  .regex(/^[a-z][a-z0-9._-]*$/);
const teamWorkSchema = z
  .object({ taskId: id, status: teamStatusSchema, personId: id.optional() })
  .strict();
const factSchema = z
  .object({
    kind: teamFactKindSchema,
    personId: id.optional(),
    taskId: id.optional(),
    value: z.boolean(),
  })
  .strict();
type TeamFact = z.infer<typeof factSchema>;
export const teamScenarioStateSchema = z
  .object({
    kind: z.literal('team'),
    scenarioId: id,
    definitionDigest: z.string().regex(/^[a-f0-9]{64}$/),
    phase: z.enum(['coordinating', 'complete']),
    work: z.array(teamWorkSchema).min(1).max(20),
    confirmed: z.array(id).max(20),
    observations: z.array(id).max(20),
    checked: z.boolean(),
    focusId: id.optional(),
    facts: z.array(factSchema).max(120).optional(),
    turnFacts: z.array(factSchema).max(40).optional(),
    sequenced: z.boolean(),
    recorded: z.array(z.string().max(350)).max(240),
    history: z.array(teamWorkSchema).max(80),
  })
  .strict();
export type TeamScenarioState = z.infer<typeof teamScenarioStateSchema>;

export function startTeamScenario(
  definition: TeamScenarioDefinition,
  identity: Pick<TeamScenarioState, 'scenarioId' | 'definitionDigest'>,
): TeamScenarioState {
  return {
    ...identity,
    kind: 'team',
    phase: 'coordinating',
    work: definition.tasks.map(({ id, status, personId }) => ({
      taskId: id,
      status,
      ...(personId && { personId }),
    })),
    confirmed: [],
    observations: [],
    checked: false,
    sequenced: false,
    recorded: [],
    history: [],
  };
}

export function teamAvailability(state: TeamScenarioState, person: TeamPerson) {
  if (person.availability === 'on-break') return 'on-break';
  if (
    state.work.some(
      (entry) => entry.personId === person.id && ['assigned', 'active'].includes(entry.status),
    )
  )
    return 'busy';
  return state.work.some((entry) => entry.personId === person.id && entry.status === 'done')
    ? 'available'
    : person.availability;
}

export function teamWorkVisible(state: TeamScenarioState, task: TeamTask) {
  const work = state.work.find(({ taskId }) => taskId === task.id);
  return !task.hidden || state.confirmed.includes(task.id) || work?.status === 'done';
}

export function teamTurnReady(turn: TeamScenarioTurn, state?: TeamScenarioState) {
  if (!state) return false;
  if (turn.descriptions) return turn.descriptions.every((id) => state.observations.includes(id));
  if (turn.confirmAny)
    return turn.confirmAny.some((goal) =>
      state.turnFacts?.some(
        (fact) =>
          fact.kind === goal.kind &&
          (!goal.personId || fact.personId === goal.personId) &&
          (!goal.taskId || fact.taskId === goal.taskId) &&
          (goal.kind !== 'work' || !goal.taskId || fact.value),
      ),
    );
  if (turn.check) return state.checked;
  if (turn.assign)
    return turn.assign.every((id) =>
      state.work.some(({ taskId, status }) => taskId === id && status === 'assigned'),
    );
  return !!(turn.sequence || turn.handover) && state.sequenced;
}

function prerequisitesDone(task: TeamTask, work: TeamScenarioState['work']) {
  return (task.after ?? []).every((id) =>
    work.some(({ taskId, status }) => taskId === id && status === 'done'),
  );
}

export function advanceTeamTurn(
  definition: TeamScenarioDefinition,
  turn: TeamScenarioTurn,
  state: TeamScenarioState,
): TeamScenarioState | undefined {
  if (state.phase === 'complete' || !teamTurnReady(turn, state)) return;
  const work = [...state.work];
  const changes: TeamScenarioState['history'] = [];
  for (const { taskId, status } of turn.event ?? []) {
    const task = definition.tasks.find(({ id }) => id === taskId);
    const index = work.findIndex((entry) => entry.taskId === taskId);
    const before = work[index];
    if (
      !task ||
      !before?.personId ||
      (status === 'active' && (before.status !== 'assigned' || !prerequisitesDone(task, work))) ||
      (status === 'done' && before.status !== 'active')
    )
      return;
    const after = { ...before, status };
    work[index] = after;
    changes.push(after);
  }
  for (const task of definition.tasks) {
    const entry = work.find(({ taskId }) => taskId === task.id);
    if (entry?.status === 'blocked' && prerequisitesDone(task, work)) {
      const available = { ...entry, status: 'unassigned' as const };
      work[work.indexOf(entry)] = available;
      changes.push(available);
    }
  }
  if (turn.complete && !teamRequiredWorkDone(definition, { ...state, work })) return;
  return {
    ...state,
    work,
    checked: false,
    turnFacts: [],
    sequenced: false,
    observations: [],
    history: [...state.history, ...changes],
    phase: turn.complete ? 'complete' : 'coordinating',
  };
}

const message = (speaker: string, en: string, es: string): ScenarioReply => ({
  speaker,
  line: { en, es },
});
const unsure = (speaker: string) => message(speaker, 'What do you need?', '¿Qué necesitas?');
const accept = (speaker: string) =>
  message(speaker, 'Sure. I can do that.', 'Claro. Puedo hacerlo.');
const decline = (speaker: string) =>
  message(speaker, "Sorry, I can't right now.", 'Lo siento, ahora no puedo.');
const statusReply = (speaker: TeamPerson, subject: TeamPerson, task?: TeamTask): ScenarioReply => {
  if (!task)
    return message(
      speaker.name,
      subject === speaker
        ? "I'm not working right now."
        : `${subject.name} is not working right now.`,
      subject === speaker
        ? 'No estoy haciendo ninguna tarea ahora.'
        : `${subject.name} no está haciendo ninguna tarea ahora.`,
    );
  return message(
    speaker.name,
    `${subject === speaker ? "I'm" : `${subject.name} is`} ${task.progressive.en}.`,
    `${subject === speaker ? 'Estoy' : `${subject.name} está`} ${task.progressive.es}.`,
  );
};

export function teamRequiredWorkDone(definition: TeamScenarioDefinition, state: TeamScenarioState) {
  return (definition.requiredWork ?? []).every((id) =>
    state.work.some(({ taskId, status }) => taskId === id && status === 'done'),
  );
}

export function teamScenarioPhrases(definition: TeamScenarioDefinition) {
  return [
    unsure('').line.en,
    accept('').line.en,
    decline('').line.en,
    "I'm not working right now.",
    'Yes, I can.',
    "No, I can't.",
    'Yes.',
    'No.',
    ...definition.tasks.map((task) => `I'm ${task.progressive.en}.`),
  ];
}

const workForm = (form: TeamForm) =>
  form === 'progressive-information' || form === 'progressive-yes-no';
const matchesForm = (expected: TeamForm, actual: TeamForm) =>
  expected === actual || (expected === 'progressive-question' && workForm(actual));

function putFact(list: TeamFact[], fact: TeamFact, maximum: number) {
  const previous = list.filter(
    ({ kind, personId, taskId }) =>
      kind !== fact.kind || personId !== fact.personId || taskId !== fact.taskId,
  );
  return [...previous.slice(-(maximum - 1)), fact];
}

export function evaluateTeamTurn(
  definition: TeamScenarioDefinition,
  state: TeamScenarioState,
  turn: TeamScenarioTurn,
  input: string | undefined,
  personId?: string,
): ScenarioEvaluation<TeamScenarioState> {
  const addressed = definition.participants.find(({ id }) => id === personId);
  const speaker = addressed ?? definition.participants[0];
  if (!input || state.phase === 'complete') return { verdict: { outcome: 'ungradable' } };
  const canYou = turn.assign
    ? 'request'
    : turn.targetForms.includes('ability-question')
      ? 'ability'
      : undefined;
  const parsed = parseTeamLanguage(definition, input, {
    addressed,
    focusId: state.focusId,
    canYou,
  });
  if (!parsed)
    return {
      verdict: {
        outcome: 'ungradable',
        feedbackEs: 'Escribe una frase completa. Usa el nombre si no está claro de quién hablas.',
      },
      reply: unsure(speaker.name),
    };
  const { form } = parsed;
  const mappedError = (error: string, taskId?: string) =>
    turn.errorTargets
      ?.filter(
        (entry) =>
          entry.error === error &&
          (!entry.form || matchesForm(entry.form, form)) &&
          (!entry.taskId || entry.taskId === taskId),
      )
      .sort(
        (a, b) => Number(!!b.form) + Number(!!b.taskId) - Number(!!a.form) - Number(!!a.taskId),
      )[0]?.targets ?? [];
  const mismatch = (
    feedbackEs: string,
    error: 'team_state' | 'team_availability' | 'team_order',
    reply?: ScenarioReply,
  ): ScenarioEvaluation<TeamScenarioState> => ({
    verdict: { outcome: 'context_mismatch', feedbackEs, error, targets: mappedError(error) },
    reply,
  });
  if ('error' in parsed) {
    return {
      verdict: {
        outcome: 'incorrect',
        error: parsed.error,
        targets: mappedError(parsed.error, parsed.task?.id),
      },
    };
  }
  const next: TeamScenarioState = { ...state };
  const task = 'task' in parsed ? parsed.task : undefined;
  const subject = 'subject' in parsed ? parsed.subject : undefined;
  const person = subject?.kind === 'person' ? subject.person : undefined;
  let reply: ScenarioReply | undefined;
  let signature = [form, task?.id, subject?.id].join(':');
  const workFor = (id: string) => state.work.find(({ taskId }) => taskId === id);
  const active = definition.tasks.find(({ id }) =>
    subject?.kind === 'group'
      ? subject.group.activeTaskId === id
      : !!subject && workFor(id)?.status === 'active' && workFor(id)?.personId === subject.id,
  );
  const usualTaskId = subject?.kind === 'group' ? subject.group.usualTaskId : person?.usualTaskId;
  const confirm = (fact: TeamFact) => {
    next.facts = putFact(state.facts ?? [], fact, 120);
    next.turnFacts = putFact(state.turnFacts ?? [], fact, 40);
    if (fact.kind === 'work' && fact.value && fact.taskId && !next.confirmed.includes(fact.taskId))
      next.confirmed = [...next.confirmed, fact.taskId];
    if (
      fact.kind === 'work' &&
      (!turn.checkPerson || turn.checkPerson === fact.personId) &&
      (turn.check === true || (fact.value && turn.check === fact.taskId))
    )
      next.checked = true;
    if (
      fact.kind === 'ability' &&
      turn.check === true &&
      !turn.checkPerson &&
      turn.targetForms.includes('ability-question')
    )
      next.checked = true;
  };
  const targetForm = turn.targetForms.some((expected) => matchesForm(expected, form));

  if (
    form === 'progressive-positive' ||
    form === 'progressive-negative' ||
    form === 'habit-contrast' ||
    form === 'habit' ||
    form === 'handover'
  ) {
    const routine = form === 'habit' ? task : 'usual' in parsed ? parsed.usual : undefined;
    if (
      !task ||
      (routine && routine.id !== usualTaskId) ||
      (form !== 'habit' && (active?.id === task.id) !== (form !== 'progressive-negative'))
    )
      return mismatch(
        'La frase no coincide con el registro o con la tarea que está en curso.',
        'team_state',
      );
    if (
      form !== 'habit' &&
      form !== 'progressive-negative' &&
      subject?.kind !== 'group' &&
      !teamWorkVisible(state, task)
    )
      return mismatch('Confirma esta tarea con el equipo antes de describirla.', 'team_state');
    if (turn.descriptions?.includes(task.id) && targetForm && !state.observations.includes(task.id))
      next.observations = [...state.observations, task.id];
    if (form === 'handover') {
      const pending = workFor(parsed.next.id);
      if (
        turn.handover?.current !== task.id ||
        turn.handover?.next !== parsed.next.id ||
        !pending ||
        !['unassigned', 'blocked'].includes(pending.status)
      )
        return mismatch(
          'Menciona la tarea en curso y el paso pendiente que la sigue.',
          'team_order',
        );
      next.sequenced = true;
      reply = message(speaker.name, 'Thank you.', 'Gracias.');
      signature += `:${parsed.next.id}`;
    }
    signature += `:${state.history.length}`;
  } else if (workForm(form) && subject) {
    const matches = !task || active?.id === task.id;
    confirm({ kind: 'work', personId: subject.id, taskId: task?.id ?? active?.id, value: matches });
    if (form === 'progressive-yes-no') reply = yesNo(speaker.name, matches);
    else if (person) reply = statusReply(speaker, person, active);
    else if (subject.kind === 'group' && active)
      reply = message(
        speaker.name,
        `They are ${active.progressive.en}.`,
        `Están ${active.progressive.es}.`,
      );
    else reply = message(speaker.name, 'No task is in progress.', 'No hay una tarea en curso.');
    signature += `:${active?.id ?? ''}`;
  } else if (
    task &&
    person &&
    (form === 'ability-question' || form === 'ability-positive' || form === 'ability-negative')
  ) {
    const able = person.canDo.includes(task.id);
    if (form === 'ability-question') {
      confirm({ kind: 'ability', personId: person.id, taskId: task.id, value: able });
      reply = message(
        person.name,
        able ? 'Yes, I can.' : "No, I can't.",
        able ? 'Sí, puedo.' : 'No, no puedo.',
      );
    } else if (able !== (form === 'ability-positive'))
      return mismatch('Comprueba qué sabe hacer esta persona.', 'team_availability');
  } else if (form === 'availability-question' && person) {
    const available = teamAvailability(state, person) === 'available';
    confirm({ kind: 'availability', personId: person.id, value: available });
    reply = available
      ? message(person.name, 'I can help now.', 'Puedo ayudar ahora.')
      : decline(person.name);
    signature += `:${available}`;
  } else if (form === 'owner-question' || form === 'completion-question') {
    const work = workFor(parsed.task.id);
    const owner = definition.participants.find(({ id }) => id === work?.personId);
    if (form === 'owner-question') {
      confirm({ kind: 'owner', taskId: parsed.task.id, personId: owner?.id, value: !!owner });
      reply =
        owner && work?.status === 'active'
          ? statusReply(speaker, owner, parsed.task)
          : owner
            ? message(
                speaker.name,
                `${owner.name} has that task.`,
                `${owner.name} tiene ese encargo.`,
              )
            : message(
                speaker.name,
                'No one has that task yet.',
                'Todavía nadie tiene ese encargo.',
              );
    } else {
      const done = work?.status === 'done';
      confirm({ kind: 'done', taskId: parsed.task.id, value: done });
      reply = yesNo(speaker.name, done);
    }
    signature += `:${work?.status ?? ''}:${work?.personId ?? ''}`;
  } else if (form === 'help-offer' || (form === 'help-request' && !task)) {
    const available = definition.tasks.find(
      (item) =>
        (turn.assign ? turn.assign.includes(item.id) : !item.hidden && !item.recordOnly) &&
        workFor(item.id)?.status === 'unassigned' &&
        prerequisitesDone(item, state.work),
    );
    reply = available
      ? message(
          speaker.name,
          `Can you ${available.command.en}?`,
          `¿Puedes ${available.command.es}?`,
        )
      : message(
          speaker.name,
          'Please check what the team is doing.',
          'Por favor, confirma qué está haciendo el equipo.',
        );
  } else if (form === 'help-request' && person && task) {
    const work = workFor(task.id);
    const owner = definition.participants.find(({ id }) => id === work?.personId);
    if (owner && ['assigned', 'active', 'done'].includes(work!.status)) {
      const answer =
        work!.status === 'active'
          ? statusReply(person, owner, task)
          : work!.status === 'done'
            ? message(person.name, 'That task is done.', 'Esa tarea ya está hecha.')
            : message(
                person.name,
                `${owner.name} has that task.`,
                `${owner.name} aceptó esa tarea.`,
              );
      return mismatch(
        'El equipo ya cuenta con alguien para esta tarea. Revisa la tarea pendiente.',
        'team_state',
        answer,
      );
    }
    const capable = person.canDo.includes(task.id);
    if (!capable || teamAvailability(state, person) !== 'available')
      return mismatch(
        'Busca a alguien que sepa hacer esta tarea y pueda ayudar ahora.',
        'team_availability',
        capable
          ? decline(person.name)
          : message(person.name, "No, I can't.", 'No, no puedo hacer esa tarea.'),
      );
    if (
      !turn.assign?.includes(task.id) ||
      work?.status !== 'unassigned' ||
      !prerequisitesDone(task, state.work)
    )
      return mismatch(
        'Revisa cuál es la tarea que se puede acordar ahora.',
        'team_order',
        decline(person.name),
      );
    const assignment = { taskId: task.id, personId: person.id, status: 'assigned' as const };
    next.work = state.work.map((entry) => (entry.taskId === task.id ? assignment : entry));
    next.history = [...state.history, assignment];
    confirm({ kind: 'agreement', personId: person.id, taskId: task.id, value: true });
    reply = accept(person.name);
  } else if (form === 'sequence' || form === 'instruction') {
    const ids = parsed.tasks.map(({ id }) => id);
    const nextId = turn.handover?.next;
    if (
      form === 'instruction' &&
      nextId === ids[0] &&
      ['unassigned', 'blocked'].includes(workFor(nextId)?.status ?? '')
    )
      reply = message(
        speaker.name,
        'What is happening right now?',
        '¿Qué está pasando ahora mismo?',
      );
    else if (turn.sequence && ids.join(':') === turn.sequence.join(':')) {
      next.sequenced = true;
      reply = message(speaker.name, 'Thank you.', 'Gracias.');
    } else return mismatch('Comprueba qué tarea va primero y cuál sigue.', 'team_order');
    signature += `:${ids.join(':')}`;
  }
  if (subject && subject.kind !== 'player') next.focusId = subject.id;
  const targets = [
    ...(turn.formTargets.find((entry) => matchesForm(entry.form, form))?.targets ?? []),
    ...((form === 'progressive-positive' || form === 'handover') && task
      ? (turn.taskTargets?.find((entry) => entry.taskId === task.id)?.targets ?? [])
      : []),
  ];
  const newEvidence = !state.recorded.includes(signature) && state.recorded.length < 240;
  if (newEvidence) next.recorded = [...state.recorded, signature];
  return {
    verdict: {
      outcome: targetForm && newEvidence ? 'target' : 'communication_only',
      targets: newEvidence && targetForm ? targets : [],
      feedbackEs: reply ? undefined : 'Revisaste la frase con el registro de este momento.',
    },
    state: next,
    reply,
  };
}

function yesNo(speaker: string, yes: boolean) {
  return message(speaker, yes ? 'Yes.' : 'No.', yes ? 'Sí.' : 'No.');
}
