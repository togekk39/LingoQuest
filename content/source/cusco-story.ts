import { homeFoundationStory } from '../../packages/offline-engine/src/chapter-story';
import type {
  StoryCondition,
  StoryDefinition,
  StoryEffect,
} from '../../packages/offline-engine/src/story';
import { cuscoChapter } from './cusco-missions';

const done = (id: string): StoryCondition => ({ type: 'completedMission', id });
const event = (id: string): StoryCondition => ({ type: 'event', id });
const pending = (condition: StoryCondition): StoryCondition => ({ ...condition, not: true });
const show = (id: string): StoryEffect => ({ type: 'dialogue', id });
const go = (id: string): StoryEffect => ({ type: 'scene', id });
const start = (id: string): StoryEffect => ({ type: 'startQuest', id });
const close = {
  id: 'close',
  label: 'Volver a la escena',
  effects: [{ type: 'closeDialogue' }],
} as const;
const postcardRead = event('cusco-postcard-read');

const stops = [
  {
    art: 'cusco-plaza',
    name: 'La plaza de Cusco',
    description:
      'Sam abre la postal de Alba en la plaza. En el diario quedan unas notas de la visita de ayer.',
    npc: 'sam',
    label: 'Leer las notas con Sam',
    x: 32,
    y: 62,
  },
  {
    art: 'cusco-plaza',
    name: 'Las fotos de la plaza',
    description:
      'Desde una banca, Luz mira las fotos de ayer. Quiere escribir una nota para cada una.',
    npc: 'luz',
    label: 'Mirar las fotos con Luz',
    x: 61,
    y: 67,
  },
  {
    art: 'cusco-market',
    name: 'El mercado de Cusco',
    description: 'Diego guarda las bolsas y busca las notas de la visita junto al puesto de pan.',
    npc: 'diego',
    label: 'Ordenar las notas con Diego',
    x: 31,
    y: 54,
  },
  {
    art: 'cusco-courtyard',
    name: 'El patio del hotel',
    description: 'Nora, Sam y Luz comparan sus recuerdos con lo que quedó escrito en el diario.',
    npc: 'nora',
    label: 'Abrir el diario de viaje',
    x: 64,
    y: 73,
  },
  {
    art: 'cusco-museum',
    name: 'El museo de Cusco',
    description:
      'Nora te espera en el patio. El diario de la visita al museo tiene otros nombres y otros datos por confirmar.',
    npc: 'nora',
    label: 'Consultar el diario del museo',
    x: 66,
    y: 60,
  },
] as const;

const missionId = (index: number) => cuscoChapter.missions[index].id;
const quest = (index: number) => `${missionId(index)}-quest`;
const sceneId = (index: number) => `${missionId(index)}-scene`;
const allMissions = cuscoChapter.missions;

export const cuscoAdventure = {
  id: cuscoChapter.id,
  revision: cuscoChapter.revision,
  initialSceneId: sceneId(0),
  repairPhrases: homeFoundationStory.repairPhrases,
  npcs: [
    { id: 'sam', name: 'Sam', role: 'Compañero de viaje' },
    { id: 'luz', name: 'Luz', role: 'Compañera de viaje' },
    { id: 'nora', name: 'Nora', role: 'Anfitriona del grupo' },
    { id: 'diego', name: 'Diego', role: 'Amigo del grupo en Cusco' },
    { id: 'ana', name: 'Ana', role: 'Visitante del museo' },
  ],
  items: [
    {
      id: 'cusco-cartagena-postcard',
      kind: 'story',
      name: 'Postal para Cusco',
      description: 'La invitación de Alba de Cartagena para encontrarse con amigos en Cusco.',
    },
    {
      id: 'cusco-market-page',
      kind: 'quest',
      name: 'Página del mercado',
      description: 'La página del diario con los recuerdos del mercado ya confirmados.',
    },
    {
      id: 'cusco-salvador-postcard',
      kind: 'souvenir',
      name: 'Postal para Salvador',
      description: 'Nora dejó una invitación para la próxima parada en Salvador, Brasil.',
    },
  ],
  quests: allMissions.map(({ id, title, objective }, index) => ({
    id: quest(index),
    kind: 'main',
    title,
    description: objective,
    ...(index && { requires: [done(missionId(index - 1))] }),
    goals: [
      { id: 'activity', label: objective, requires: [done(id)] },
      ...(index === 4
        ? [{ id: 'postcard', label: 'Recoge la postal para Salvador.', requires: [postcardRead] }]
        : []),
    ],
    ...(index === 0 && { rewardItems: ['cusco-cartagena-postcard'] }),
    ...(index === 3 && { rewardItems: ['cusco-market-page'] }),
    ...(index === 4 && { rewardItems: ['cusco-salvador-postcard'] }),
  })),
  scenes: stops.map(({ art, name, description, npc, label, x, y }, index) => ({
    id: sceneId(index),
    art,
    title: name,
    description,
    hotspots: [
      {
        id: `${missionId(index)}-open`,
        kind: index === 1 || index === 3 ? ('object' as const) : ('npc' as const),
        label,
        npcId: npc,
        position: { x, y },
        requires: [pending(done(missionId(index)))],
        effects: [show(`${missionId(index)}-intro`)],
      },
      ...(index < stops.length - 1
        ? [
            {
              id: `${missionId(index)}-next`,
              kind: 'exit' as const,
              label: `Ir a ${stops[index + 1].name.toLowerCase()}`,
              position: { x: 88, y: 45 },
              requires: [done(missionId(index))],
              effects: [go(sceneId(index + 1))],
            },
          ]
        : [
            {
              id: 'cusco-museum-postcard',
              kind: 'object' as const,
              label: 'Ver la postal para Salvador',
              position: { x: 78, y: 72 },
              requires: [done(missionId(index)), pending(postcardRead)],
              effects: [show('cusco-postcard')],
            },
          ]),
      ...(index > 0
        ? [
            {
              id: `${missionId(index)}-back`,
              kind: 'exit' as const,
              label: 'Volver al lugar anterior',
              position: { x: 10, y: 80 },
              effects: [go(sceneId(index - 1))],
            },
          ]
        : []),
    ],
  })),
  dialogues: [
    ...allMissions.flatMap(({ id, title, success }, index) => {
      const { npc, description } = stops[index];
      return [
        {
          id: `${id}-intro`,
          npcId: npc,
          text: description,
          ...(index === 0 && {
            line: { en: 'Where were you yesterday?', es: '¿Dónde estuviste ayer?' },
            canRepair: true,
          }),
          choices: [
            {
              id: `${id}-start`,
              label: title,
              effects: [start(quest(index)), { type: 'encounter' as const, id }],
            },
            close,
          ],
        },
        {
          id: `${id}-finished`,
          npcId: npc,
          text: success,
          choices: [
            {
              id: `${id}-continue`,
              label: index === 4 ? 'Leer la postal' : `Ir a ${stops[index + 1].name.toLowerCase()}`,
              effects: [index === 4 ? show('cusco-postcard') : go(sceneId(index + 1))],
            },
            close,
          ],
        },
      ];
    }),
    {
      id: 'cusco-postcard',
      npcId: 'nora',
      text: 'Nora abre la postal. «Tu siguiente parada es Salvador, Brasil. Lleva contigo los recuerdos de Cusco».',
      choices: [
        {
          id: 'cusco-take-postcard',
          label: 'Guardar la postal para Salvador',
          requires: [pending(postcardRead)],
          effects: [
            start(quest(4)),
            { type: 'event', id: 'cusco-postcard-read' },
            { type: 'closeDialogue' },
          ],
        },
        close,
      ],
    },
  ],
  encounters: allMissions.map(({ id }, index) => ({
    id,
    missionId: id,
    npcId: stops[index].npc,
    onFinish: [show(`${id}-finished`)],
  })),
} satisfies StoryDefinition;
