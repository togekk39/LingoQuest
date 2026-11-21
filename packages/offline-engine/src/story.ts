import { z } from 'zod';
import { homeCountries, type HomeCountry } from './travel-route';

const idSchema = z.string().min(1).max(100);
const turnSchema = z.number().int().nonnegative().safe();
const questStateSchema = z
  .object({
    status: z.enum(['active', 'completed']),
    goals: z.record(z.literal(true)),
  })
  .strict();
const npcStateSchema = z
  .object({
    visits: z.number().int().positive().safe(),
    lastDialogueId: idSchema,
  })
  .strict();
const inventoryStateSchema = z.object({ used: z.boolean() }).strict();

export const storyStateSchema = z
  .object({
    version: z.literal(1),
    storyId: idSchema,
    revision: z.number().int().positive(),
    turn: turnSchema,
    sceneId: idSchema,
    dialogueId: idSchema.optional(),
    encounterId: idSchema.optional(),
    encounterSuspended: z.literal(true).optional(),
    flags: z.record(z.string().max(100)),
    events: z.record(z.literal(true)),
    quests: z.record(questStateSchema),
    npcs: z.record(npcStateSchema),
    inventory: z.record(inventoryStateSchema),
    choices: z.array(z.object({ dialogueId: idSchema, choiceId: idSchema }).strict()),
  })
  .strict();

export type StoryState = z.infer<typeof storyStateSchema>;
export type QuestState = z.infer<typeof questStateSchema>;
export type NPCState = z.infer<typeof npcStateSchema>;
export type InventoryState = z.infer<typeof inventoryStateSchema>;

const operationSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('interact'), turn: turnSchema, hotspotId: idSchema }).strict(),
  z.object({ action: z.literal('choose'), turn: turnSchema, choiceId: idSchema }).strict(),
  z.object({ action: z.literal('closeDialogue'), turn: turnSchema }).strict(),
  z.object({ action: z.literal('suspendEncounter'), turn: turnSchema }).strict(),
  z.object({ action: z.literal('finishEncounter'), turn: turnSchema }).strict(),
]);
export type StoryOperation = z.input<typeof operationSchema>;

export type StoryCondition = (
  | { type: 'flag'; id: string; value?: string }
  | { type: 'any'; conditions: readonly StoryCondition[] }
  | {
      type:
        | 'event'
        | 'item'
        | 'itemUsed'
        | 'questComplete'
        | 'completedMission'
        | 'clearedMission'
        | 'demonstratedConcept'
        | 'reviewCompletedMission';
      id: string;
    }
) & { not?: boolean };

export type StoryEffect =
  | { type: 'flag'; id: string; value: string }
  | { type: 'closeDialogue' }
  | {
      type: 'event' | 'giveItem' | 'useItem' | 'startQuest' | 'scene' | 'dialogue' | 'encounter';
      id: string;
    };

interface Interaction {
  id: string;
  label: string;
  requires?: readonly StoryCondition[];
  effects: readonly StoryEffect[];
}

export interface StoryHotspot extends Interaction {
  kind: 'npc' | 'object' | 'exit';
  npcId?: string;
  position?: { x: number; y: number };
}

export interface StoryScene {
  id: string;
  title: string;
  description: string;
  art: string;
  hotspots: readonly StoryHotspot[];
}

export interface StoryNpc {
  id: string;
  name: string;
  role: string;
}

export interface StoryDialogue {
  id: string;
  npcId?: string;
  text: string;
  line?: { en: string; es: string };
  tip?: string;
  exampleLabel?: string;
  choices: readonly Interaction[];
}

export interface StoryQuest {
  id: string;
  title: string;
  description: string;
  kind: 'main' | 'side' | 'review';
  requires?: readonly StoryCondition[];
  goals: readonly { id: string; label: string; requires: readonly StoryCondition[] }[];
  rewardItems?: readonly string[];
  reviewMissionId?: string;
}

export interface StoryItem {
  id: string;
  name: string;
  description: string;
  kind: 'story' | 'quest' | 'souvenir';
}

export interface StoryEncounter {
  id: string;
  npcId?: string;
  missionId: string;
  entryStepId?: string;
  endBeforeStepId?: string;
  onFinish?: readonly StoryEffect[];
}

export interface StoryDefinition {
  id: string;
  revision: number;
  initialSceneId: string;
  scenes: readonly StoryScene[];
  npcs: readonly StoryNpc[];
  dialogues: readonly StoryDialogue[];
  quests: readonly StoryQuest[];
  items: readonly StoryItem[];
  encounters: readonly StoryEncounter[];
}

export interface StoryContext {
  country?: HomeCountry;
  completedMissions: readonly string[];
  clearedMissions: readonly string[];
  demonstratedConcepts?: readonly string[];
  readyEncounterId?: string;
}

export interface StoryView {
  turn: number;
  origin: string;
  scene: Omit<StoryScene, 'hotspots'>;
  hotspots: Omit<StoryHotspot, 'requires' | 'effects'>[];
  dialogue?: Pick<StoryDialogue, 'id' | 'text' | 'line' | 'tip' | 'exampleLabel'> & {
    npc?: StoryNpc;
    choices: Pick<Interaction, 'id' | 'label'>[];
  };
  quests: (Pick<StoryQuest, 'id' | 'title' | 'description' | 'kind' | 'reviewMissionId'> & {
    status: 'locked' | 'available' | 'active' | 'completed';
    goals: { id: string; label: string; completed: boolean }[];
  })[];
  inventory: (StoryItem & InventoryState)[];
  encounter?: Omit<StoryEncounter, 'onFinish' | 'npcId'> & {
    ready: boolean;
    suspended: boolean;
    npc?: StoryNpc;
  };
}

export function emptyStory(definition: StoryDefinition): StoryState {
  return {
    version: 1,
    storyId: definition.id,
    revision: definition.revision,
    turn: 0,
    sceneId: definition.initialSceneId,
    flags: {},
    events: {},
    quests: {},
    npcs: {},
    inventory: {},
    choices: [],
  };
}

const byId = <T extends { id: string }>(rows: readonly T[], id?: string) =>
  rows.find((row) => row.id === id);
const own = <T>(record: Record<string, T>, id: string): T | undefined =>
  Object.hasOwn(record, id) ? record[id] : undefined;

function setFact<T>(record: Record<string, T>, id: string, value: T) {
  Object.defineProperty(record, id, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

export function upgradeStory(definition: StoryDefinition, state: StoryState) {
  if (state.storyId !== definition.id || state.revision >= definition.revision) return;
  if (!byId(definition.scenes, state.sceneId)) {
    state.sceneId = definition.initialSceneId;
    delete state.dialogueId;
  }
  if (!byId(definition.dialogues, state.dialogueId)) delete state.dialogueId;
  if (!byId(definition.encounters, state.encounterId)) {
    delete state.encounterId;
    delete state.encounterSuspended;
  }
  state.revision = definition.revision;
  state.turn++;
}

function reviewEvent(missionId: string) {
  return `review:${missionId}`;
}

function matches(condition: StoryCondition, state: StoryState, context: StoryContext): boolean {
  const test = () => {
    switch (condition.type) {
      case 'flag': {
        const value = own(state.flags, condition.id);
        return condition.value === undefined ? value !== undefined : value === condition.value;
      }
      case 'any':
        return condition.conditions.some((entry) => matches(entry, state, context));
      case 'event':
        return own(state.events, condition.id) === true;
      case 'item':
        return !!own(state.inventory, condition.id);
      case 'itemUsed':
        return own(state.inventory, condition.id)?.used === true;
      case 'questComplete':
        return own(state.quests, condition.id)?.status === 'completed';
      case 'completedMission':
        return context.completedMissions.includes(condition.id);
      case 'clearedMission':
        return context.clearedMissions.includes(condition.id);
      case 'demonstratedConcept':
        return context.demonstratedConcepts?.includes(condition.id) === true;
      case 'reviewCompletedMission':
        return own(state.events, reviewEvent(condition.id)) === true;
    }
  };
  return condition.not ? !test() : test();
}

function allowed(
  conditions: readonly StoryCondition[] | undefined,
  state: StoryState,
  context: StoryContext,
) {
  return !conditions || conditions.every((condition) => matches(condition, state, context));
}

function giveItem(definition: StoryDefinition, state: StoryState, id: string) {
  if (byId(definition.items, id) && !own(state.inventory, id))
    setFact(state.inventory, id, { used: false });
}

function settleQuests(definition: StoryDefinition, state: StoryState, context: StoryContext) {
  let completed: boolean;
  do {
    completed = false;
    for (const quest of definition.quests) {
      const progress = own(state.quests, quest.id);
      if (progress?.status !== 'active') continue;
      for (const goal of quest.goals) {
        if (allowed(goal.requires, state, context)) setFact(progress.goals, goal.id, true);
      }
      if (quest.goals.every((goal) => own(progress.goals, goal.id))) {
        progress.status = 'completed';
        for (const item of quest.rewardItems ?? []) giveItem(definition, state, item);
        completed = true;
      }
    }
  } while (completed);
}

function applyEffects(
  definition: StoryDefinition,
  state: StoryState,
  context: StoryContext,
  effects: readonly StoryEffect[],
) {
  for (const effect of effects) {
    switch (effect.type) {
      case 'flag':
        setFact(state.flags, effect.id, effect.value);
        break;
      case 'event':
        setFact(state.events, effect.id, true);
        break;
      case 'giveItem':
        giveItem(definition, state, effect.id);
        break;
      case 'useItem': {
        const item = own(state.inventory, effect.id);
        if (item) item.used = true;
        break;
      }
      case 'startQuest': {
        const quest = byId(definition.quests, effect.id);
        if (quest && !own(state.quests, quest.id) && allowed(quest.requires, state, context)) {
          setFact(state.quests, quest.id, { status: 'active', goals: {} });
        }
        break;
      }
      case 'scene':
        if (byId(definition.scenes, effect.id)) {
          state.sceneId = effect.id;
          delete state.dialogueId;
        }
        break;
      case 'dialogue': {
        const node = byId(definition.dialogues, effect.id);
        if (node) {
          const previous = byId(definition.dialogues, state.dialogueId);
          state.dialogueId = node.id;
          if (node.npcId) {
            const saved = own(state.npcs, node.npcId);
            const newVisit = !saved || previous?.npcId !== node.npcId;
            setFact(state.npcs, node.npcId, {
              visits: (saved?.visits ?? 0) + Number(newVisit),
              lastDialogueId: node.id,
            });
          }
        }
        break;
      }
      case 'closeDialogue':
        delete state.dialogueId;
        break;
      case 'encounter':
        if (byId(definition.encounters, effect.id)) {
          state.encounterId = effect.id;
          delete state.encounterSuspended;
          delete state.dialogueId;
        }
        break;
    }
  }
}

function canInteract(interaction: Interaction, state: StoryState, context: StoryContext) {
  return (
    allowed(interaction.requires, state, context) &&
    (!state.encounterId ||
      !interaction.effects.some(({ type }) => type === 'scene' || type === 'encounter'))
  );
}

export function updateStory(
  definition: StoryDefinition,
  state: StoryState,
  context: StoryContext,
  operation: unknown,
) {
  const input = operationSchema.parse(operation);
  upgradeStory(definition, state);
  if (
    state.storyId !== definition.id ||
    state.revision !== definition.revision ||
    state.turn !== input.turn
  )
    return;
  let effects: readonly StoryEffect[] = [];
  switch (input.action) {
    case 'interact': {
      const scene = byId(definition.scenes, state.sceneId);
      const hotspot = byId(scene?.hotspots ?? [], input.hotspotId);
      if (!hotspot || !canInteract(hotspot, state, context)) return;
      if (state.encounterId) state.encounterSuspended = true;
      if (!hotspot.effects.some(({ type }) => type === 'dialogue')) delete state.dialogueId;
      effects = hotspot.effects;
      break;
    }
    case 'choose': {
      const node = byId(definition.dialogues, state.dialogueId);
      const choice = byId(node?.choices ?? [], input.choiceId);
      if (!node || !choice || !canInteract(choice, state, context)) return;
      if (
        !state.choices.some((saved) => saved.dialogueId === node.id && saved.choiceId === choice.id)
      )
        state.choices.push({ dialogueId: node.id, choiceId: choice.id });
      effects = choice.effects;
      break;
    }
    case 'closeDialogue':
      if (!state.dialogueId) return;
      delete state.dialogueId;
      break;
    case 'suspendEncounter':
      if (!state.encounterId || state.encounterSuspended) return;
      state.encounterSuspended = true;
      break;
    case 'finishEncounter': {
      const encounter = byId(definition.encounters, state.encounterId);
      if (!encounter || encounter.id !== context.readyEncounterId) return;
      delete state.encounterId;
      delete state.encounterSuspended;
      delete state.dialogueId;
      effects = encounter.onFinish ?? [];
      break;
    }
  }
  applyEffects(definition, state, context, effects);
  settleQuests(definition, state, context);
  state.turn++;
}

export function resumeStoryEncounter(state: StoryState, turn: number) {
  if (state.turn !== turn || !state.encounterId) return false;
  if (state.encounterSuspended || state.dialogueId) {
    delete state.encounterSuspended;
    delete state.dialogueId;
    state.turn++;
  }
  return true;
}

export function recordStoryReview(
  definition: StoryDefinition,
  state: StoryState,
  missionId: string,
  context: StoryContext,
) {
  if (!definition.quests.some((quest) => quest.reviewMissionId === missionId)) return;
  upgradeStory(definition, state);
  if (state.storyId !== definition.id || state.revision !== definition.revision) return;
  const id = reviewEvent(missionId);
  if (own(state.events, id)) return;
  setFact(state.events, id, true);
  settleQuests(definition, state, context);
  state.turn++;
}

export function readStory(
  definition: StoryDefinition,
  state: StoryState,
  context: StoryContext,
): StoryView {
  const current = { ...state };
  upgradeStory(definition, current);
  const savedScene = byId(definition.scenes, current.sceneId);
  const scene = savedScene ?? byId(definition.scenes, definition.initialSceneId);
  if (!scene) throw new Error(`Missing initial scene: ${definition.initialSceneId}`);
  const origin =
    context.country && context.country !== 'OTHER' ? homeCountries[context.country] : undefined;
  const personalize = (text: string) => text.replaceAll('{origin}', origin ?? 'tu lugar de origen');
  const node = savedScene ? byId(definition.dialogues, current.dialogueId) : undefined;
  const encounter = byId(definition.encounters, current.encounterId);
  return {
    turn: current.turn,
    origin: origin ?? 'Tu lugar de origen',
    scene: {
      id: scene.id,
      art: scene.art,
      title: personalize(scene.title),
      description: personalize(scene.description),
    },
    hotspots: scene.hotspots
      .filter((hotspot) => canInteract(hotspot, current, context))
      .map(({ id, label, kind, npcId, position }) => ({
        id,
        label: personalize(label),
        kind,
        npcId,
        position,
      })),
    dialogue: node && {
      id: node.id,
      text: personalize(node.text),
      line: node.line && { en: personalize(node.line.en), es: personalize(node.line.es) },
      tip: node.tip && personalize(node.tip),
      exampleLabel: node.exampleLabel,
      npc: byId(definition.npcs, node.npcId),
      choices: node.choices
        .filter((choice) => canInteract(choice, current, context))
        .map(({ id, label }) => ({ id, label: personalize(label) })),
    },
    inventory: definition.items.flatMap((item) => {
      const saved = own(current.inventory, item.id);
      return saved ? [{ ...item, ...saved }] : [];
    }),
    quests: definition.quests.map((quest) => {
      const saved = own(current.quests, quest.id);
      const status =
        saved?.status ?? (allowed(quest.requires, current, context) ? 'available' : 'locked');
      return {
        id: quest.id,
        kind: quest.kind,
        title: personalize(quest.title),
        description: personalize(quest.description),
        status,
        reviewMissionId: quest.reviewMissionId,
        goals: quest.goals.map((goal) => ({
          id: goal.id,
          label: personalize(goal.label),
          completed: status === 'completed' || !!(saved && own(saved.goals, goal.id)),
        })),
      };
    }),
    encounter: encounter && {
      id: encounter.id,
      missionId: encounter.missionId,
      entryStepId: encounter.entryStepId,
      endBeforeStepId: encounter.endBeforeStepId,
      ready: encounter.id === context.readyEncounterId,
      suspended: !!current.encounterSuspended,
      npc: byId(definition.npcs, encounter.npcId),
    },
  };
}
