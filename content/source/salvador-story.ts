import { homeFoundationStory } from '../../packages/offline-engine/src/chapter-story';
import type {
  StoryCondition,
  StoryDefinition,
  StoryEffect,
} from '../../packages/offline-engine/src/story';
import { salvadorChapter } from './salvador-missions';

const stops = [
  {
    art: 'cover',
    npc: 'jo',
    label: 'Entrar a la cocina',
    description:
      'Desde Pelourinho, Sam y Luz te acompañan a la cocina del almuerzo de intercambio.',
  },
  {
    art: 'salvador-kitchen',
    npc: 'jo',
    label: 'Mirar el registro de cocina',
    description: 'Jo deja dos notas en la mesa. La de hoy muestra algunos cambios.',
  },
  {
    art: 'salvador-kitchen',
    npc: 'sam',
    label: 'Hablar con Sam y Luz',
    description: 'Sam y Luz escuchan lo que sabe hacer cada persona y cuándo puede ayudar.',
  },
  {
    art: 'salvador-kitchen',
    npc: 'rafa',
    label: 'Coordinar el almuerzo',
    description: 'Rafa sigue frente a la estufa. Hay que aclarar dos encargos antes del almuerzo.',
  },
  {
    art: 'salvador-display',
    npc: 'bia',
    label: 'Visitar la muestra de fotos',
    description: 'Bia abre la sala comunitaria. El grupo te pide ayuda para preparar la muestra.',
  },
];
const missions = salvadorChapter.missions.filter(({ optional }) => !optional);
const completed = (id: string): StoryCondition => ({ type: 'completedMission', id });
const missing = (condition: StoryCondition): StoryCondition => ({ ...condition, not: true });
const go = (id: string): StoryEffect => ({ type: 'scene', id: `${id}-scene` });
const show = (id: string): StoryEffect => ({ type: 'dialogue', id });
const close = {
  id: 'close',
  label: 'Volver a la escena',
  effects: [{ type: 'closeDialogue' }],
} as const;
const readPostcard: StoryCondition = { type: 'event', id: 'salvador-postcard-read' };

export const salvadorAdventure = {
  id: salvadorChapter.id,
  revision: salvadorChapter.revision,
  initialSceneId: `${missions[0].id}-scene`,
  npcs: [
    { id: 'jo', name: 'Jo', role: 'Anfitriona del almuerzo' },
    { id: 'rafa', name: 'Rafa', role: 'Amigo del equipo de cocina' },
    { id: 'sam', name: 'Sam', role: 'Compañero de viaje' },
    { id: 'luz', name: 'Luz', role: 'Compañera de viaje' },
    { id: 'bia', name: 'Bia', role: 'Anfitriona de la muestra' },
    { id: 'leo', name: 'Leo', role: 'Colaborador de la muestra' },
    { id: 'nina', name: 'Nina', role: 'Voluntaria de la muestra' },
    { id: 'noah', name: 'Noah', role: 'Voluntario de la muestra' },
    { id: 'alex', name: 'Alex', role: 'Amigo del equipo de cocina' },
  ],
  repairPhrases: homeFoundationStory.repairPhrases,
  items: [
    {
      id: 'salvador-arrival-postcard',
      kind: 'story',
      name: 'Postal para Salvador',
      description: 'La invitación que leíste con Nora en Cusco.',
    },
    {
      id: 'salvador-valparaiso-postcard',
      kind: 'souvenir',
      name: 'Postal para Valparaíso',
      description: 'Bia te invita a continuar el viaje en Valparaíso, Chile.',
    },
  ],
  quests: missions.map(({ id, title, objective }, index) => ({
    id: `${id}-quest`,
    kind: 'main',
    title,
    description: objective,
    ...(index > 0 && { requires: [completed(missions[index - 1].id)] }),
    goals: [
      { id: 'activity', label: objective, requires: [completed(id)] },
      ...(index === stops.length - 1
        ? [{ id: 'postcard', label: 'Recoge la postal para Valparaíso.', requires: [readPostcard] }]
        : []),
    ],
    ...(index === 0 && { rewardItems: ['salvador-arrival-postcard'] }),
    ...(index === stops.length - 1 && { rewardItems: ['salvador-valparaiso-postcard'] }),
  })),
  scenes: missions.map(({ id, place }, index) => {
    const { art, npc, label, description } = stops[index];
    const next = missions[index + 1];
    const previous = missions[index - 1];
    return {
      id: `${id}-scene`,
      title: index === 0 ? 'Llegada a Salvador' : place,
      art,
      description,
      hotspots: [
        {
          id: `${id}-open`,
          kind: 'npc',
          npcId: npc,
          label,
          position: { x: 44, y: 68 },
          requires: [missing(completed(id))],
          effects: [show(`${id}-intro`)],
        },
        next
          ? {
              id: `${id}-next`,
              kind: 'exit',
              label: stops[index + 1].label,
              position: { x: 88, y: 46 },
              requires: [completed(id)],
              effects: [go(next.id)],
            }
          : {
              id: 'salvador-display-postcard',
              kind: 'object',
              label: 'Ver la postal para Valparaíso',
              position: { x: 76, y: 70 },
              requires: [completed(id), missing(readPostcard)],
              effects: [show('salvador-postcard')],
            },
        ...(previous
          ? [
              {
                id: `${id}-back`,
                kind: 'exit' as const,
                label: 'Volver a la escena anterior',
                position: { x: 10, y: 78 },
                effects: [go(previous.id)],
              },
            ]
          : []),
      ],
    };
  }),
  dialogues: [
    ...missions.flatMap(({ id, title, success }, index) => {
      const { npc, description } = stops[index];
      const next = missions[index + 1];
      return [
        {
          id: `${id}-intro`,
          npcId: npc,
          text: description,
          choices: [
            {
              id: `${id}-start`,
              label: title,
              effects: [
                { type: 'startQuest' as const, id: `${id}-quest` },
                { type: 'encounter' as const, id },
              ],
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
              label: next ? stops[index + 1].label : 'Leer la postal',
              effects: [next ? go(next.id) : show('salvador-postcard')],
            },
            close,
          ],
        },
      ];
    }),
    {
      id: 'salvador-postcard',
      npcId: 'bia',
      text: 'Junto a las fotos, Bia deja una postal para tu próxima parada: Valparaíso, Chile.',
      choices: [
        {
          id: 'salvador-take-postcard',
          label: 'Guardar la postal para Valparaíso',
          requires: [missing(readPostcard)],
          effects: [
            { type: 'startQuest', id: 'salvador-display-quest' },
            { type: 'event', id: 'salvador-postcard-read' },
            { type: 'closeDialogue' },
          ],
        },
        close,
      ],
    },
  ],
  encounters: missions.map(({ id }, index) => ({
    id,
    missionId: id,
    npcId: stops[index].npc,
    onFinish: [show(`${id}-finished`)],
  })),
} satisfies StoryDefinition;
