import type {
  StoryCondition,
  StoryDefinition,
  StoryEffect,
} from '../../packages/offline-engine/src/story';

const routineDone = { type: 'completedMission', id: 'mexico-routine' } as const;
const familyDone = { type: 'completedMission', id: 'mexico-others' } as const;
const timeDone = { type: 'completedMission', id: 'mexico-time' } as const;
const agreementDone = { type: 'completedMission', id: 'mexico-agreement' } as const;
const transferDone = { type: 'completedMission', id: 'mexico-transfer' } as const;
const welcomed = { type: 'event', id: 'mexico-welcomed' } as const;
const marketVisited = { type: 'event', id: 'mexico-market-visited' } as const;

const absent = (condition: StoryCondition): StoryCondition => ({ ...condition, not: true });
const dialogue = (id: string): StoryEffect => ({ type: 'dialogue', id });
const encounter = (id: string): StoryEffect => ({ type: 'encounter', id });
const enter = (id: string): StoryEffect => ({ type: 'scene', id });
const item = (id: string): StoryEffect => ({ type: 'giveItem', id });
const close = {
  id: 'close',
  label: 'Cerrar el cuaderno',
  effects: [{ type: 'closeDialogue' }],
} as const;

export const mexicoAdventure = {
  id: 'mexico',
  revision: 1,
  initialSceneId: 'mexico-reading-room',
  npcs: [
    { id: 'ines', name: 'Inés', role: 'Anfitriona de un intercambio de idiomas' },
    { id: 'sam', name: 'Sam', role: 'Viajero que conociste en la primera postal' },
    { id: 'leo', name: 'Leo', role: 'Hermano de Inés y compañero del intercambio' },
  ],
  items: [
    {
      id: 'mexico-agenda',
      name: 'Agenda de Inés',
      kind: 'story',
      description:
        'Anotaste tus hábitos y comparaste los de la familia de Inés antes de consultar el horario.',
    },
    {
      id: 'mexico-market-hours',
      name: 'Horario del mercado',
      kind: 'quest',
      description:
        'El mercado ficticio de la historia abre el sábado a las ocho. Inés trabaja a las diez.',
    },
    {
      id: 'mexico-market-postcard',
      name: 'Postal del mercado de las ocho',
      kind: 'souvenir',
      description: 'En el reverso hay una invitación a un intercambio de comida en Cartagena.',
    },
  ],
  quests: [
    {
      id: 'mexico-market-plan',
      title: 'Una mañana en el mercado',
      kind: 'main',
      description: 'Conoce a Inés y usa las rutinas y los horarios para acordar una visita.',
      goals: [
        { id: 'my-day', label: 'Comparte tu rutina con Inés.', requires: [routineDone] },
        { id: 'family-day', label: 'Distingue las rutinas de su familia.', requires: [familyDone] },
        { id: 'opening-hours', label: 'Consulta los horarios del mercado.', requires: [timeDone] },
        { id: 'meet-at-eight', label: 'Confirma la hora con Inés.', requires: [agreementDone] },
      ],
    },
    {
      id: 'mexico-library-plan',
      title: 'Un plan con Leo',
      kind: 'main',
      description: 'Usa un horario distinto para organizar una sesión de estudio.',
      requires: [agreementDone],
      goals: [
        {
          id: 'confirm-library-time',
          label: 'Confirma la cita con Leo por escrito.',
          requires: [transferDone],
        },
      ],
      rewardItems: ['mexico-market-postcard'],
    },
  ],
  scenes: [
    {
      id: 'mexico-reading-room',
      art: 'mexico-reading-room',
      title: 'La sala de lectura',
      description:
        'Inés te recibe en la sala de lectura del barrio. En la mesa hay una agenda y junto a la puerta está el tablero de horarios.',
      hotspots: [
        {
          id: 'mexico-ines-welcome',
          label: 'Hablar con Inés',
          kind: 'npc',
          npcId: 'ines',
          position: { x: 21, y: 49 },
          requires: [absent(routineDone)],
          effects: [dialogue('mexico-welcome')],
        },
        {
          id: 'mexico-family-agenda',
          label: 'Revisar la agenda',
          kind: 'object',
          position: { x: 42, y: 68 },
          requires: [routineDone, absent(familyDone)],
          effects: [dialogue('mexico-family-agenda-dialogue')],
        },
        {
          id: 'mexico-hours-board',
          label: 'Leer el horario',
          kind: 'object',
          position: { x: 58, y: 36 },
          requires: [familyDone, absent(timeDone)],
          effects: [dialogue('mexico-hours-intro')],
        },
        {
          id: 'mexico-market-exit',
          label: 'Ir al mercado',
          kind: 'exit',
          position: { x: 88, y: 55 },
          requires: [timeDone, absent(agreementDone)],
          effects: [enter('mexico-market'), { type: 'event', id: 'mexico-market-visited' }],
        },
        {
          id: 'mexico-leo-message',
          label: 'Leer el mensaje de Leo',
          kind: 'object',
          position: { x: 66, y: 53 },
          requires: [agreementDone, absent(transferDone)],
          effects: [dialogue('mexico-leo-intro')],
        },
        {
          id: 'mexico-postcard',
          label: 'Leer la postal del mercado',
          kind: 'object',
          position: { x: 60, y: 43 },
          requires: [transferDone],
          effects: [dialogue('mexico-finish')],
        },
      ],
    },
    {
      id: 'mexico-market',
      art: 'cover',
      title: 'El mercado del barrio',
      description:
        'Los puestos dan a una calle peatonal. Todavía están comparando las horas para visitar el mercado juntos.',
      hotspots: [
        {
          id: 'mexico-market-clock',
          label: 'Revisar el reloj',
          kind: 'object',
          position: { x: 14, y: 18 },
          effects: [dialogue('mexico-market-clock-dialogue')],
        },
        {
          id: 'mexico-market-stand',
          label: 'Consultar los horarios con Inés',
          kind: 'npc',
          npcId: 'ines',
          position: { x: 34, y: 76 },
          requires: [marketVisited, absent(agreementDone)],
          effects: [dialogue('mexico-agreement-intro')],
        },
        {
          id: 'mexico-return-reading-room',
          label: 'Volver a la sala de lectura',
          kind: 'exit',
          position: { x: 83, y: 55 },
          effects: [enter('mexico-reading-room')],
        },
      ],
    },
  ],
  dialogues: [
    {
      id: 'mexico-welcome',
      npcId: 'ines',
      text: 'Al llegar de la primera parada, Sam te presenta a Inés. Ella organiza intercambios de idiomas y quiere visitar el mercado contigo.',
      line: {
        en: 'Hello! I’m Inés. Welcome to Mexico City!',
        es: '¡Hola! Soy Inés. ¡Te doy la bienvenida a la Ciudad de México!',
      },
      choices: [
        {
          id: 'mexico-agenda-intro-choice',
          label: 'Ver mi agenda con Inés',
          effects: [
            { type: 'event', id: 'mexico-welcomed' },
            { type: 'startQuest', id: 'mexico-market-plan' },
            dialogue('mexico-welcome-agenda'),
          ],
        },
      ],
    },
    {
      id: 'mexico-welcome-agenda',
      npcId: 'ines',
      text: 'Inés abre su agenda. Quiere conocer tu rutina antes de decidir a qué hora ir al mercado.',
      line: { en: 'I work and I study English.', es: 'Trabajo y estudio inglés.' },
      choices: [
        {
          id: 'mexico-start-routine',
          label: 'Preparar mi rutina',
          requires: [welcomed],
          effects: [encounter('mexico-routine')],
        },
      ],
    },
    {
      id: 'mexico-routine-finished',
      npcId: 'ines',
      text: 'Inés escribe tu actividad en la agenda. Queda una segunda página para las rutinas de su familia.',
      line: { en: 'Here is my family’s schedule.', es: 'Aquí está el horario de mi familia.' },
      choices: [
        {
          id: 'mexico-turn-agenda',
          label: 'Dar vuelta a la página',
          effects: [dialogue('mexico-family-agenda-dialogue')],
        },
        close,
      ],
    },
    {
      id: 'mexico-family-agenda-dialogue',
      npcId: 'ines',
      text: 'Sam leyó las dos columnas y quiere saber de quién es cada rutina.',
      line: { en: 'My sister cooks. My brother reads.', es: 'Mi hermana cocina. Mi hermano lee.' },
      choices: [
        {
          id: 'mexico-start-family',
          label: 'Comparar las rutinas',
          effects: [encounter('mexico-others')],
        },
      ],
    },
    {
      id: 'mexico-others-finished',
      npcId: 'sam',
      text: 'Sam ya distingue los hábitos. Te indica el tablero junto a la puerta para que revises cuándo abre el mercado.',
      line: { en: 'Let’s check the schedule.', es: 'Revisemos el horario.' },
      choices: [close],
    },
    {
      id: 'mexico-hours-intro',
      title: 'Tablero de horarios',
      text: 'El cartel del mercado muestra los días y horas de apertura. Practica cómo leerlos antes de proponer una hora.',
      line: { en: 'Saturday morning', es: 'Sábado por la mañana' },
      choices: [
        {
          id: 'mexico-start-clock',
          label: 'Practicar con el horario',
          effects: [encounter('mexico-time')],
        },
      ],
    },
    {
      id: 'mexico-time-finished',
      npcId: 'sam',
      text: 'Hay dos opciones dentro del horario. Sam propone caminar hasta la entrada del mercado para comparar las dos con Inés.',
      line: { en: 'Eight or ten?', es: '¿A las ocho o a las diez?' },
      choices: [
        {
          id: 'mexico-walk-to-market',
          label: 'Ir al mercado',
          effects: [enter('mexico-market'), { type: 'event', id: 'mexico-market-visited' }],
        },
        close,
      ],
    },
    {
      id: 'mexico-market-clock-dialogue',
      title: 'Reloj de la entrada',
      text: 'El reloj sirve de punto de encuentro. Consulta la agenda de Inés para acordar a qué hora regresar el sábado.',
      choices: [close],
    },
    {
      id: 'mexico-agreement-intro',
      npcId: 'ines',
      text: 'Inés puede volver una sola vez el sábado antes de empezar a trabajar. Pregúntale por su horario y confírmale el plan a Sam.',
      line: { en: 'I am available in the morning.', es: 'Estoy disponible por la mañana.' },
      choices: [
        {
          id: 'mexico-start-agreement',
          label: 'Acordar la visita',
          effects: [encounter('mexico-agreement')],
        },
      ],
    },
    {
      id: 'mexico-agreement-finished',
      npcId: 'ines',
      text: 'El sábado a las ocho recorren el mercado antes del turno de Inés. Al despedirse, te cuenta que Leo dejó una invitación en la sala de lectura.',
      line: { en: 'Thanks for coming with us!', es: '¡Gracias por venir con nosotros!' },
      choices: [
        {
          id: 'mexico-go-to-leo',
          label: 'Volver a la sala de lectura',
          effects: [enter('mexico-reading-room')],
        },
        close,
      ],
    },
    {
      id: 'mexico-leo-intro',
      npcId: 'leo',
      text: 'Leo te dejó un mensaje para estudiar juntos. Compara el horario de la biblioteca con el de su familia y responde en inglés.',
      line: { en: 'Can we study at the library?', es: '¿Podemos estudiar en la biblioteca?' },
      choices: [
        {
          id: 'mexico-start-transfer',
          label: 'Organizar la cita de estudio',
          effects: [
            { type: 'startQuest', id: 'mexico-library-plan' },
            encounter('mexico-transfer'),
          ],
        },
      ],
    },
    {
      id: 'mexico-finish',
      npcId: 'leo',
      text: 'La cita de estudio queda confirmada. En el reverso de la postal, Inés anotó la próxima invitación: un intercambio de comida en Cartagena.',
      line: { en: 'See you at the library!', es: '¡Nos vemos en la biblioteca!' },
      choices: [close],
    },
  ],
  encounters: [
    {
      id: 'mexico-routine',
      missionId: 'mexico-routine',
      npcId: 'ines',
      onFinish: [dialogue('mexico-routine-finished')],
    },
    {
      id: 'mexico-others',
      missionId: 'mexico-others',
      npcId: 'ines',
      onFinish: [item('mexico-agenda'), dialogue('mexico-others-finished')],
    },
    {
      id: 'mexico-time',
      missionId: 'mexico-time',
      npcId: 'sam',
      onFinish: [item('mexico-market-hours'), dialogue('mexico-time-finished')],
    },
    {
      id: 'mexico-agreement',
      missionId: 'mexico-agreement',
      npcId: 'ines',
      onFinish: [dialogue('mexico-agreement-finished')],
    },
    {
      id: 'mexico-transfer',
      missionId: 'mexico-transfer',
      npcId: 'leo',
      onFinish: [dialogue('mexico-finish')],
    },
  ],
} satisfies StoryDefinition;
