import assert from 'node:assert/strict';
import test from 'node:test';
import { homeFoundationStory } from '../src/chapter-story.ts';
import {
  emptyStory,
  readStory,
  recordStoryReview,
  storyStateSchema,
  updateStory,
  upgradeStory,
  type StoryContext,
  type StoryDefinition,
  type StoryState,
} from '../src/story.ts';

const context: StoryContext = {
  country: 'CL',
  completedMissions: [],
  clearedMissions: [],
};

const story: StoryDefinition = {
  id: 'postcard',
  revision: 1,
  initialSceneId: 'plaza',
  scenes: [
    {
      id: 'plaza',
      title: 'La plaza',
      description: 'Salida desde {origin}.',
      art: 'plaza',
      hotspots: [
        {
          id: 'sam',
          label: 'Hablar con Sam',
          kind: 'npc',
          effects: [
            { type: 'startQuest', id: 'find-stop' },
            { type: 'dialogue', id: 'greeting' },
          ],
        },
        {
          id: 'ticket',
          label: 'Leer boleto',
          kind: 'object',
          requires: [{ type: 'flag', id: 'route', value: 'ticket' }],
          effects: [
            { type: 'giveItem', id: 'ticket' },
            { type: 'useItem', id: 'ticket' },
          ],
        },
        {
          id: 'staff',
          label: 'Consultar el puesto',
          kind: 'npc',
          requires: [{ type: 'flag', id: 'route', value: 'staff' }],
          effects: [{ type: 'event', id: 'asked-staff' }],
        },
        {
          id: 'go',
          label: 'Ir a la parada',
          kind: 'exit',
          requires: [
            {
              type: 'any',
              conditions: [
                { type: 'itemUsed', id: 'ticket' },
                { type: 'event', id: 'asked-staff' },
              ],
            },
          ],
          effects: [{ type: 'scene', id: 'stop' }],
        },
      ],
    },
    {
      id: 'stop',
      title: 'La parada',
      description: 'La parada está junto al parque.',
      art: 'bus-stop',
      hotspots: [
        {
          id: 'talk',
          label: 'Hablar con Sam',
          kind: 'npc',
          requires: [{ type: 'questComplete', id: 'find-stop', not: true }],
          effects: [{ type: 'dialogue', id: 'directions' }],
        },
        {
          id: 'arrived',
          label: 'Leer la postal',
          kind: 'object',
          requires: [{ type: 'item', id: 'postcard' }],
          effects: [
            { type: 'useItem', id: 'postcard' },
            { type: 'startQuest', id: 'review' },
          ],
        },
      ],
    },
  ],
  npcs: [{ id: 'sam', name: 'Sam', role: 'Viajero' }],
  dialogues: [
    {
      id: 'greeting',
      npcId: 'sam',
      text: '¿Conoces bien {origin}?',
      choices: [
        {
          id: 'look',
          label: 'Mirar el boleto',
          requires: [{ type: 'flag', id: 'route', not: true }],
          effects: [
            { type: 'flag', id: 'route', value: 'ticket' },
            { type: 'dialogue', id: 'ticket-response' },
          ],
        },
        {
          id: 'ask',
          label: 'Preguntar en el puesto',
          requires: [{ type: 'flag', id: 'route', not: true }],
          effects: [
            { type: 'flag', id: 'route', value: 'staff' },
            { type: 'dialogue', id: 'staff-response' },
          ],
        },
      ],
    },
    {
      id: 'ticket-response',
      npcId: 'sam',
      text: 'Te enseño mi boleto.',
      choices: [],
    },
    {
      id: 'staff-response',
      npcId: 'sam',
      text: 'Te espero aquí.',
      choices: [],
    },
    {
      id: 'directions',
      npcId: 'sam',
      text: 'Sam quiere saber dónde está el parque.',
      line: { en: 'Where is the park?', es: '¿Dónde está el parque?' },
      choices: [
        {
          id: 'reply',
          label: 'Dar indicaciones',
          effects: [{ type: 'encounter', id: 'give-directions' }],
        },
      ],
    },
  ],
  quests: [
    {
      id: 'find-stop',
      title: 'Encontrar la parada',
      description: 'Ayuda a Sam a tomar el bus.',
      kind: 'main',
      goals: [
        {
          id: 'help',
          label: 'Dar indicaciones',
          requires: [{ type: 'event', id: 'guided-sam' }],
        },
      ],
      rewardItems: ['postcard'],
    },
    {
      id: 'review',
      title: 'Repasar',
      description: 'Practica las indicaciones.',
      kind: 'review',
      reviewMissionId: 'bus',
      requires: [{ type: 'questComplete', id: 'find-stop' }],
      goals: [
        {
          id: 'practice',
          label: 'Resolver un repaso',
          requires: [{ type: 'reviewCompletedMission', id: 'bus' }],
        },
      ],
    },
  ],
  items: [
    { id: 'ticket', name: 'Boleto', description: 'Sale a las ocho.', kind: 'quest' },
    { id: 'postcard', name: 'Postal', description: 'Un recuerdo del viaje.', kind: 'souvenir' },
  ],
  encounters: [
    {
      id: 'give-directions',
      missionId: 'bus',
      endBeforeStepId: 'bus_lost',
      onFinish: [{ type: 'event', id: 'guided-sam' }],
    },
  ],
};

const view = (state: StoryState, ctx = context) => readStory(story, state, ctx);
const click = (state: StoryState, hotspotId: string) =>
  updateStory(story, state, context, { action: 'interact', hotspotId, turn: state.turn });
const choose = (state: StoryState, choiceId: string) =>
  updateStory(story, state, context, { action: 'choose', choiceId, turn: state.turn });
const close = (state: StoryState) =>
  updateStory(story, state, context, { action: 'closeDialogue', turn: state.turn });

test('the story persists distinct NPC responses and paths selected by its player', () => {
  const ticket = emptyStory(story);
  const staff = emptyStory(story);
  const initial = view(ticket);
  assert.equal(initial.scene.description, 'Salida desde Chile.');
  const other = view(ticket, { ...context, country: 'OTHER' });
  assert.equal(other.origin, 'Tu lugar de origen');
  assert.equal(other.scene.description, 'Salida desde tu lugar de origen.');
  assert.deepEqual(
    initial.hotspots.map((hotspot) => hotspot.id),
    ['sam'],
  );
  assert.equal(initial.quests[1].status, 'locked');
  click(ticket, 'ticket');
  assert.equal(ticket.turn, 0);

  for (const state of [ticket, staff]) {
    click(state, 'sam');
    assert.equal(view(state).dialogue?.text, '¿Conoces bien Chile?');
    assert.equal(view(state).quests[0].status, 'active');
  }
  choose(ticket, 'look');
  choose(staff, 'ask');
  assert.equal(view(ticket).dialogue?.id, 'ticket-response');
  assert.equal(view(staff).dialogue?.id, 'staff-response');
  assert.equal(ticket.npcs.sam.visits, 1);
  assert.deepEqual(ticket.choices, [{ dialogueId: 'greeting', choiceId: 'look' }]);
  assert.deepEqual(staff.choices, [{ dialogueId: 'greeting', choiceId: 'ask' }]);

  close(ticket);
  close(staff);
  assert.deepEqual(
    view(ticket).hotspots.map((hotspot) => hotspot.id),
    ['sam', 'ticket'],
  );
  assert.deepEqual(
    view(staff).hotspots.map((hotspot) => hotspot.id),
    ['sam', 'staff'],
  );

  click(ticket, 'ticket');
  click(staff, 'staff');
  assert.equal(view(ticket).inventory[0].used, true);
  assert.equal(view(staff).inventory.length, 0);
  click(ticket, 'go');
  click(staff, 'go');
  assert.equal(view(ticket).scene.id, 'stop');
  assert.equal(view(staff).scene.id, 'stop');
});

test('round-tripping story saves resumes an encounter and rewards it once after proof', () => {
  let state = emptyStory(story);
  const firstClick = { action: 'interact', hotspotId: 'sam', turn: 0 };
  updateStory(story, state, context, firstClick);
  updateStory(story, state, context, firstClick);
  assert.equal(state.npcs.sam.visits, 1);
  choose(state, 'look');
  close(state);
  click(state, 'ticket');
  click(state, 'go');
  click(state, 'talk');
  assert.equal(view(state).dialogue?.line?.en, 'Where is the park?');
  choose(state, 'reply');

  state = storyStateSchema.parse(JSON.parse(JSON.stringify(state)));
  assert.equal(view(state).scene.id, 'stop');
  assert.equal(view(state).encounter?.endBeforeStepId, 'bus_lost');
  assert.equal(view(state).encounter?.ready, false);
  const finish = { action: 'finishEncounter', turn: state.turn };
  updateStory(story, state, context, finish);
  assert.equal(state.turn, finish.turn);
  assert.equal(view(state).quests[0].status, 'active');
  const ready = { ...context, readyEncounterId: 'give-directions' };
  assert.equal(view(state, ready).encounter?.ready, true);
  updateStory(story, state, ready, finish);
  assert.equal(view(state).encounter, undefined);
  assert.equal(view(state).quests[0].status, 'completed');
  assert.equal(view(state).quests[0].goals[0].completed, true);
  assert.equal(view(state).inventory.filter((item) => item.id === 'postcard').length, 1);

  click(state, 'arrived');
  const rewarded = JSON.stringify(state);
  updateStory(story, state, ready, finish);
  updateStory(story, state, ready, { ...finish, turn: state.turn });
  assert.equal(JSON.stringify(state), rewarded);
  assert.equal(state.inventory.postcard.used, true);
  assert.equal(view(state).quests[1].status, 'active');
  recordStoryReview(story, state, 'hello', context);
  assert.equal(JSON.stringify(state), rewarded);
  recordStoryReview(story, state, 'bus', context);
  assert.equal(view(state).quests[1].status, 'completed');
  const reviewedTurn = state.turn;
  recordStoryReview(story, state, 'bus', context);
  assert.equal(state.turn, reviewedTurn);
});

test('a Home foundation encounter restores its conversation on suspend and finish', () => {
  let state = emptyStory(homeFoundationStory);
  const homeView = (progress = context) => readStory(homeFoundationStory, state, progress);
  const select = (choiceId: string) =>
    updateStory(homeFoundationStory, state, context, {
      action: 'choose',
      choiceId,
      turn: state.turn,
    });

  updateStory(homeFoundationStory, state, context, {
    action: 'interact',
    hotspotId: 'plaza-sam',
    turn: state.turn,
  });
  select('greet-sam-in-english');
  select('greet-luz-in-english');
  select('reply-to-luz');
  select('continue-opening-with-sam');
  assert.equal(homeView().dialogue?.id, 'sam-asks-name');
  assert.deepEqual(
    homeView().dialogue?.repairPhrases?.map(({ kind }) => kind),
    ['repeat', 'slower', 'meaning'],
  );
  select('open-name-foundation');
  select('open-letter-foundation');
  select('practice-foundation-letters-a');
  assert.equal(homeView().encounter?.missionId, 'foundation-letters-a');

  state = storyStateSchema.parse(JSON.parse(JSON.stringify(state)));
  updateStory(homeFoundationStory, state, context, {
    action: 'suspendEncounter',
    turn: state.turn,
  });
  assert.equal(homeView().dialogue?.id, 'luz-letter-foundation');
  assert.equal(homeView().encounter, undefined);
  assert.equal(homeView().quests.find(({ id }) => id === 'meet-sam')?.status, 'available');

  select('practice-foundation-letters-a');
  const finished = {
    ...context,
    completedMissions: ['foundation-letters-a'],
    readyEncounterId: 'foundation-letters-a',
  };
  updateStory(homeFoundationStory, state, finished, {
    action: 'finishEncounter',
    turn: state.turn,
  });
  assert.equal(homeView(finished).dialogue?.id, 'luz-letter-foundation');
  assert.ok(
    !homeView(finished).dialogue?.choices.some(({ id }) => id === 'practice-foundation-letters-a'),
  );
  assert.ok(
    homeView(finished).dialogue?.choices.some(({ id }) => id === 'practice-foundation-letters-b'),
  );
  select('return-to-name-foundation');
  select('return-to-sam-introduction');
  select('introduce-yourself');
  assert.equal(homeView().encounter?.missionId, 'hello');
  assert.equal(homeView().inventory.length, 0);
});

test('a story revision repairs deleted locations and checkpoints while retaining durable memory', () => {
  const state: StoryState = {
    ...emptyStory(story),
    sceneId: 'stop',
    dialogueId: 'directions',
    encounterId: 'give-directions',
    flags: { route: 'ticket' },
    events: { 'guided-sam': true },
    inventory: { postcard: { used: true } },
    quests: { 'find-stop': { status: 'completed', goals: { help: true } } },
    npcs: { sam: { visits: 2, lastDialogueId: 'directions' } },
    choices: [{ dialogueId: 'directions', choiceId: 'reply' }],
  };
  const revision = {
    ...story,
    revision: 2,
    scenes: story.scenes.slice(0, 1),
    dialogues: story.dialogues.slice(0, 1),
    encounters: [],
    quests: story.quests.map((quest) => ({ ...quest, rewardItems: ['ticket'] })),
  };
  const upgraded = readStory(revision, state, context);
  assert.equal(upgraded.turn, 1);
  assert.equal(upgraded.scene.id, 'plaza');
  assert.equal(upgraded.dialogue, undefined);
  assert.equal(upgraded.encounter, undefined);
  assert.equal(state.revision, 1);
  upgradeStory(revision, state);
  upgradeStory(revision, state);
  assert.equal(state.turn, 1);
  assert.equal(state.revision, 2);
  assert.equal(state.flags.route, 'ticket');
  assert.equal(state.events['guided-sam'], true);
  assert.equal(state.npcs.sam.visits, 2);
  assert.deepEqual(state.inventory, { postcard: { used: true } });
  assert.equal(state.quests['find-stop'].status, 'completed');
  assert.deepEqual(state.choices, [{ dialogueId: 'directions', choiceId: 'reply' }]);
});

test('dialogue availability can depend on a demonstrated concept independently of completion', () => {
  const practiced = {
    ...story,
    scenes: [
      {
        ...story.scenes[0],
        hotspots: story.scenes[0].hotspots.map((hotspot) =>
          hotspot.id === 'sam'
            ? {
                ...hotspot,
                requires: [{ type: 'demonstratedConcept' as const, id: 'introduction' }],
              }
            : hotspot,
        ),
      },
      story.scenes[1],
    ],
  };
  const state = emptyStory(practiced);
  const completed = { ...context, completedMissions: ['hello'] };
  assert.equal(readStory(practiced, state, completed).hotspots.length, 0);
  const demonstrated = { ...completed, demonstratedConcepts: ['introduction'] };
  assert.equal(readStory(practiced, state, demonstrated).hotspots[0].id, 'sam');
});
