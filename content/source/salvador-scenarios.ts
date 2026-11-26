import type { TeamScenarioDefinition, TeamStatus, TeamTask } from '@lingoquest/course-pack';
import { pair } from './salvador-lessons';

function task(
  id: string,
  command: string,
  commandEs: string,
  progressive: string,
  progressiveEs: string,
  habitual: string,
  status: TeamStatus,
  personId?: string,
  extra?: Pick<TeamTask, 'hidden' | 'after' | 'aliases'>,
): TeamTask {
  return {
    id,
    command: pair(command, commandEs),
    progressive: pair(progressive, progressiveEs),
    habitual,
    status,
    ...(personId && { personId }),
    ...extra,
  };
}

const kitchen = {
  kind: 'team',
  title: pair('Team lunch', 'El almuerzo en equipo'),
  subtitle: pair('Salvador · The kitchen', 'Salvador · La cocina'),
} as const;

const wash = task(
  'wash',
  'wash the vegetables',
  'lavar las verduras',
  'washing the vegetables',
  'lavando las verduras',
  'washes the vegetables',
  'active',
  'jo',
);
const rice = task(
  'rice',
  'cook rice',
  'cocinar arroz',
  'cooking rice',
  'cocinando arroz',
  'cooks rice',
  'active',
  'rafa',
  { aliases: ['cook'] },
);
const set = task(
  'set',
  'set the table',
  'poner la mesa',
  'setting the table',
  'poniendo la mesa',
  'sets the table',
  'unassigned',
);
const stir = task(
  'stir',
  'stir the soup',
  'revolver la sopa',
  'stirring the soup',
  'revolviendo la sopa',
  'stirs the soup',
  'active',
  'rafa',
  { hidden: true },
);
const bread = task(
  'bread',
  'cut the bread',
  'cortar el pan',
  'cutting the bread',
  'cortando el pan',
  'cuts the bread',
  'unassigned',
);
const bowls = task(
  'bowls',
  'put the bowls on the table',
  'poner los tazones en la mesa',
  'putting the bowls on the table',
  'poniendo los tazones en la mesa',
  'puts the bowls on the table',
  'blocked',
  undefined,
  { after: ['bread'] },
);
const prepLunch = {
  ...task(
    'group-lunch',
    'prepare lunch',
    'preparar el almuerzo',
    'preparing lunch',
    'preparando el almuerzo',
    'prepares lunch',
    'unassigned',
  ),
  hidden: true,
};
const together = {
  ...task(
    'group-together',
    'work together',
    'trabajar juntos',
    'working together',
    'trabajando juntos',
    'works together',
    'unassigned',
  ),
  hidden: true,
};
const prepare = task(
  'prepare',
  'prepare the bowls',
  'preparar los tazones',
  'preparing the bowls',
  'preparando los tazones',
  'prepares the bowls',
  'done',
  'luz',
);

export const observeLunch: TeamScenarioDefinition = {
  ...kitchen,
  id: 'salvador-lunch-observe',
  participants: [
    {
      id: 'jo',
      name: 'Jo',
      pronoun: 'she',
      usualTaskId: 'set',
      canDo: ['wash', 'set'],
      availability: 'busy',
    },
    {
      id: 'rafa',
      name: 'Rafa',
      pronoun: 'he',
      usualTaskId: 'wash',
      canDo: ['rice', 'wash'],
      availability: 'busy',
    },
  ],
  tasks: [
    { ...wash, labelEs: 'Primera tanda' },
    rice,
    { ...set, status: 'done' },
    prepLunch,
    together,
  ],
  groups: [
    { id: 'hosts', members: ['jo', 'rafa'], activeTaskId: 'group-lunch' },
    { id: 'our-team', members: ['player', 'jo', 'rafa'], activeTaskId: 'group-together' },
  ],
};

export const compareLunch: TeamScenarioDefinition = {
  ...kitchen,
  id: 'salvador-lunch-routine',
  snapshot: 'historical',
  subtitle: pair('This morning’s record', 'Registro de esta mañana'),
  participants: [
    {
      id: 'jo',
      name: 'Jo',
      pronoun: 'she',
      usualTaskId: 'set',
      canDo: ['wash', 'set'],
      availability: 'busy',
    },
    {
      id: 'rafa',
      name: 'Rafa',
      pronoun: 'he',
      usualTaskId: 'wash',
      canDo: ['rice', 'wash'],
      availability: 'busy',
    },
  ],
  tasks: [wash, rice, { ...set, status: 'done' }],
};

export const coordinateLunch: TeamScenarioDefinition = {
  ...kitchen,
  id: 'salvador-lunch-work',
  carryFrom: observeLunch.id,
  requiredWork: ['wash', 'rice', 'wash-final', 'stir', 'bread', 'bowls'],
  participants: [
    {
      id: 'jo',
      name: 'Jo',
      pronoun: 'she',
      usualTaskId: 'set',
      canDo: ['wash', 'wash-final', 'set', 'bread', 'bowls'],
      availability: 'busy',
    },
    {
      id: 'rafa',
      name: 'Rafa',
      pronoun: 'he',
      usualTaskId: 'wash',
      canDo: ['stir', 'rice', 'wash', 'bread'],
      availability: 'busy',
      needsHelp: true,
    },
    {
      id: 'sam',
      name: 'Sam',
      pronoun: 'he',
      usualTaskId: 'bread',
      canDo: ['bread', 'bowls'],
      availability: 'available',
    },
    {
      id: 'luz',
      name: 'Luz',
      pronoun: 'she',
      usualTaskId: 'prepare',
      canDo: ['prepare', 'bowls'],
      availability: 'available',
    },
    {
      id: 'alex',
      name: 'Alex',
      pronoun: 'he',
      usualTaskId: 'bowls',
      canDo: ['bowls'],
      availability: 'on-break',
    },
  ],
  tasks: [
    { ...wash, status: 'done', recordOnly: true, labelEs: 'Primera tanda' },
    { ...rice, status: 'done', recordOnly: true },
    { ...wash, id: 'wash-final', labelEs: 'Última tanda' },
    stir,
    { ...set, status: 'done' },
    prepare,
    bread,
    bowls,
  ],
};

export const coordinateDisplay: TeamScenarioDefinition = {
  kind: 'team',
  id: 'salvador-display-work',
  requiredWork: ['move', 'labels'],
  title: pair('The photo display', 'La muestra de fotos'),
  subtitle: pair('Salvador · Community room', 'Salvador · Sala comunitaria'),
  participants: [
    {
      id: 'bia',
      name: 'Bia',
      pronoun: 'she',
      usualTaskId: 'move',
      canDo: ['hang', 'move', 'labels'],
      availability: 'busy',
    },
    {
      id: 'leo',
      name: 'Leo',
      pronoun: 'he',
      usualTaskId: 'hang',
      canDo: ['read', 'hang'],
      availability: 'busy',
      needsHelp: true,
    },
    {
      id: 'nina',
      name: 'Nina',
      pronoun: 'she',
      usualTaskId: 'labels',
      canDo: ['move', 'labels'],
      availability: 'available',
    },
    {
      id: 'noah',
      name: 'Noah',
      pronoun: 'he',
      usualTaskId: 'read',
      canDo: ['read', 'labels'],
      availability: 'available',
    },
  ],
  tasks: [
    task(
      'hang',
      'hang the pictures',
      'colgar las imágenes',
      'hanging the pictures',
      'colgando las imágenes',
      'hangs the pictures',
      'active',
      'bia',
    ),
    task(
      'read',
      'read the labels',
      'leer las etiquetas',
      'reading the labels',
      'leyendo las etiquetas',
      'reads the labels',
      'active',
      'leo',
    ),
    task(
      'move',
      'move the table',
      'mover la mesa',
      'moving the table',
      'moviendo la mesa',
      'moves the table',
      'unassigned',
    ),
    task(
      'labels',
      'put the labels on the table',
      'poner las etiquetas en la mesa',
      'putting the labels on the table',
      'poniendo las etiquetas en la mesa',
      'puts the labels on the table',
      'blocked',
      undefined,
      { after: ['move'] },
    ),
  ],
};
