import { z } from 'zod';
import {
  teamStatusSchema,
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
  if (turn.check) return state.checked;
  if (turn.assign)
    return turn.assign.every((id) =>
      state.work.some(({ taskId, status }) => taskId === id && status === 'assigned'),
    );
  return !!turn.sequence && state.sequenced;
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
  return {
    ...state,
    work,
    checked: false,
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

export function evaluateTeamTurn(
  definition: TeamScenarioDefinition,
  state: TeamScenarioState,
  turn: TeamScenarioTurn,
  input: string | undefined,
  personId?: string,
): ScenarioEvaluation<TeamScenarioState> {
  const speaker =
    definition.participants.find(({ id }) => id === personId) ?? definition.participants[0];
  if (!input || state.phase === 'complete') return { verdict: { outcome: 'ungradable' } };
  const parsed = parseTeamLanguage(definition, input, speaker);
  if (!parsed)
    return {
      verdict: {
        outcome: 'ungradable',
        feedbackEs: 'Escribe una frase completa sobre una tarea de esta actividad.',
      },
      reply: unsure(speaker.name),
    };
  const mismatch = (
    feedbackEs: string,
    error: 'team_state' | 'team_availability' | 'team_order',
    reply?: ScenarioReply,
  ) => ({
    verdict: {
      outcome: 'context_mismatch' as const,
      feedbackEs,
      error,
      targets: turn.errorTargets?.find((entry) => entry.error === error)?.targets ?? [],
    },
    reply,
  });
  if ('error' in parsed) {
    const exact = turn.errorTargets?.find(
      ({ error, taskId }) => error === parsed.error && taskId === parsed.task?.id,
    );
    const generic = turn.errorTargets?.find(
      ({ error, taskId }) => error === parsed.error && !taskId,
    );
    return {
      verdict: {
        outcome: 'incorrect',
        error: parsed.error,
        targets:
          exact?.targets ??
          generic?.targets ??
          turn.formTargets.find(({ form }) => form === parsed.form)?.targets ??
          [],
      },
    };
  }
  const next: TeamScenarioState = { ...state };
  const { form } = parsed;
  const task = 'task' in parsed ? parsed.task : undefined;
  const person = 'person' in parsed ? parsed.person : undefined;
  let reply: ScenarioReply | undefined;
  let signature = [parsed.form, task?.id, person?.id].join(':');
  const workFor = (taskId: string) => state.work.find((entry) => entry.taskId === taskId);
  const active =
    person &&
    definition.tasks.find(({ id }) => {
      const work = workFor(id);
      return work?.status === 'active' && work.personId === person.id;
    });
  const confirm = (taskId?: string, reveal = true) => {
    if (
      (!turn.checkPerson || turn.checkPerson === person?.id) &&
      (turn.check === true || (reveal && turn.check === taskId))
    )
      next.checked = true;
    if (reveal && taskId && !next.confirmed.includes(taskId))
      next.confirmed = [...next.confirmed, taskId];
  };
  if (
    form === 'progressive-positive' ||
    form === 'progressive-negative' ||
    form === 'habit-contrast' ||
    form === 'habit'
  ) {
    const routine = form === 'habit' ? parsed.task : parsed.usual;
    if (
      (routine && routine.id !== parsed.person.usualTaskId) ||
      (form !== 'habit' && (active?.id === parsed.task.id) !== (form !== 'progressive-negative'))
    )
      return mismatch(
        'La frase no coincide con el registro o con la tarea que está en curso.',
        'team_state',
      );
    if (
      turn.descriptions?.includes(parsed.task.id) &&
      turn.targetForms.includes(form) &&
      teamWorkVisible(state, parsed.task) &&
      !state.observations.includes(parsed.task.id)
    )
      next.observations = [...state.observations, parsed.task.id];
    if (
      (form === 'progressive-positive' || form === 'habit-contrast') &&
      !teamWorkVisible(state, parsed.task)
    )
      return mismatch('Confirma esta tarea con el equipo antes de describirla.', 'team_state');
    signature += `:${state.history.length}`;
  } else if (form === 'progressive-question' && person) {
    if (!task || active?.id === task.id) confirm(active?.id);
    reply = task
      ? message(
          speaker.name,
          active?.id === task.id ? 'Yes.' : 'No.',
          active?.id === task.id ? 'Sí.' : 'No.',
        )
      : statusReply(speaker, person, active);
    signature += `:${active?.id ?? ''}`;
  } else if (
    task &&
    person &&
    (form === 'ability-question' || form === 'ability-positive' || form === 'ability-negative')
  ) {
    const able = person.canDo.includes(task.id);
    if (form === 'ability-question') {
      confirm(task.id, false);
      reply = message(
        person.name,
        able ? 'Yes, I can.' : "No, I can't.",
        able ? 'Sí, puedo.' : 'No, no puedo.',
      );
    } else if (able !== (form === 'ability-positive'))
      return mismatch('Comprueba qué sabe hacer esta persona.', 'team_availability');
  } else if (form === 'help-offer' || (form === 'help-request' && !task)) {
    reply = unsure(speaker.name);
  } else if (form === 'help-request' && person && task) {
    const work = workFor(task.id);
    const owner = definition.participants.find(({ id }) => id === work?.personId);
    if (owner && ['assigned', 'active', 'done'].includes(work!.status)) {
      const status = work!.status;
      const answer =
        status === 'active'
          ? statusReply(person, owner, task)
          : status === 'done'
            ? message(person.name, 'That task is done.', 'Esa tarea ya está hecha.')
            : message(
                person.name,
                `${owner.name} can do that task.`,
                `${owner.name} aceptó esa tarea.`,
              );
      return mismatch(
        'El equipo ya cuenta con alguien para esta tarea. Revisa la tarea pendiente.',
        'team_state',
        answer,
      );
    }
    if (!person.canDo.includes(task.id) || teamAvailability(state, person) !== 'available') {
      const answer = !person.canDo.includes(task.id)
        ? message(person.name, "No, I can't.", 'No, no puedo hacer esa tarea.')
        : decline(person.name);
      return mismatch(
        'Busca a alguien que sepa hacer esta tarea y pueda ayudar ahora.',
        'team_availability',
        answer,
      );
    }
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
    reply = accept(person.name);
  } else if (form === 'sequence' || form === 'instruction') {
    const ids = parsed.tasks.map(({ id }) => id);
    if (!turn.sequence || ids.join(':') !== turn.sequence.join(':'))
      return mismatch('Comprueba qué tarea va primero y cuál sigue.', 'team_order');
    next.sequenced = true;
    signature += `:${ids.join(':')}`;
    reply = message(speaker.name, 'Thank you.', 'Gracias.');
  }
  const targets = [
    ...(turn.formTargets.find((entry) => entry.form === form)?.targets ?? []),
    ...(form === 'progressive-positive' && task
      ? (turn.taskTargets?.find((entry) => entry.taskId === task.id)?.targets ?? [])
      : []),
  ];
  const newEvidence = !state.recorded.includes(signature) && state.recorded.length < 240;
  if (newEvidence) next.recorded = [...state.recorded, signature];
  return {
    verdict: {
      outcome: turn.targetForms.includes(form) && newEvidence ? 'target' : 'communication_only',
      targets: newEvidence ? targets : [],
      feedbackEs: reply ? undefined : 'Revisaste la frase con el registro de este momento.',
    },
    state: next,
    reply,
  };
}
