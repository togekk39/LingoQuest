import { chapter } from './travel-content';
import type { StoryDefinition } from './story';

const greeted = { type: 'event', id: 'greeted-sam' } as const;
const ticketRead = { type: 'event', id: 'read-bus-ticket' } as const;
const stopFound = { type: 'event', id: 'found-bus-stop' } as const;
const guided = { type: 'event', id: 'guided-sam' } as const;
const routeChosen = { type: 'flag', id: 'bag-search-path' } as const;
const benchPath = { ...routeChosen, value: 'bench' } as const;
const luzPath = { ...routeChosen, value: 'luz' } as const;
const hasClue = { type: 'event', id: 'found-bag-clue' } as const;
const identifiedBag = { type: 'event', id: 'identified-bag' } as const;
const returnedBag = { type: 'event', id: 'returned-sam-bag' } as const;
const hasBag = { type: 'item', id: 'sam-blue-bag' } as const;
const hasTicket = { type: 'item', id: 'bus-ticket' } as const;
const hasOriginCard = { type: 'item', id: 'origin-card' } as const;
const annotatedOriginCard = { type: 'event', id: 'annotated-origin-card' } as const;
const knowsIntroduction = {
  type: 'any',
  conditions: [
    { type: 'demonstratedConcept', id: 'introduction' },
    { type: 'clearedMission', id: 'hello' },
  ],
} as const;

const close = { type: 'closeDialogue' } as const;
const showOriginSketch = {
  label: 'Mostrarle el croquis',
  requires: [hasOriginCard, { ...annotatedOriginCard, not: true }],
  effects: [
    { type: 'useItem', id: 'origin-card' },
    { type: 'event', id: 'annotated-origin-card' },
    { type: 'dialogue', id: 'luz-map-clue' },
  ],
} as const;

export const chapterStory = {
  id: chapter.id,
  revision: 1,
  initialSceneId: 'plaza',
  npcs: [
    { id: 'sam', name: 'Sam', role: 'Viajero que necesita encontrar el bus de las ocho' },
    { id: 'luz', name: 'Luz', role: 'Encargada de la mesa de bienvenida y de objetos perdidos' },
  ],
  items: [
    {
      id: 'bus-ticket',
      name: 'Boleto de Sam',
      kind: 'quest',
      description:
        'El boleto de las ocho lleva el símbolo de un árbol. Puedes compararlo con el cartel de la plaza para encontrar el camino a la parada.',
    },
    {
      id: 'sam-blue-bag',
      name: 'Mochila azul de Sam',
      kind: 'quest',
      description: 'La mochila que identificaste para Sam en objetos perdidos.',
    },
    {
      id: 'origin-card',
      name: 'Croquis de la plaza',
      kind: 'story',
      description:
        'Un dibujo del barrio donde empieza tu viaje. Luz puede indicar qué camino pasa por la fuente y llega al parque.',
    },
    {
      id: 'sam-postcard',
      name: chapter.collectible,
      kind: 'souvenir',
      description: 'Sam guardaba esta postal en su mochila. La puedes escribir en tu pasaporte.',
    },
  ],
  quests: [
    {
      id: 'meet-sam',
      title: 'Un saludo en la plaza',
      kind: 'main',
      description: 'Sam llegó a la mesa de bienvenida con un boleto. Averigua qué necesita.',
      goals: [{ id: 'introduction', label: 'Preséntate a Sam en inglés.', requires: [greeted] }],
    },
    {
      id: 'catch-the-bus',
      title: 'El bus de las ocho',
      kind: 'main',
      description: 'Usa el boleto para ubicar la parada y explícale a Sam cómo llegar.',
      requires: [greeted],
      goals: [
        { id: 'ticket-read', label: 'Revisa el boleto de Sam.', requires: [ticketRead] },
        { id: 'stop-found', label: 'Ubica la parada junto al parque.', requires: [stopFound] },
        { id: 'directions', label: 'Dale la indicación a Sam en inglés.', requires: [guided] },
      ],
    },
    {
      id: 'find-the-bag',
      title: 'Una mochila y una postal',
      kind: 'main',
      description: 'Sigue una pista y lee el mensaje de Sam para devolverle su mochila.',
      requires: [guided],
      goals: [
        { id: 'search-route', label: 'Decide con Sam dónde buscar.', requires: [routeChosen] },
        { id: 'search-clue', label: 'Encuentra una pista.', requires: [hasClue] },
        {
          id: 'bag-description',
          label: 'Describe la mochila en inglés.',
          requires: [identifiedBag],
        },
        { id: 'bag-return', label: 'Devuélvele la mochila a Sam.', requires: [returnedBag] },
      ],
      rewardItems: ['sam-postcard'],
    },
    {
      id: 'origin-sketch',
      title: 'Un croquis del barrio',
      kind: 'side',
      description: 'Pídele a Luz que marque en el croquis el camino de la plaza al parque.',
      goals: [
        {
          id: 'find-sketch',
          label: 'Encuentra el croquis entre las postales.',
          requires: [hasOriginCard],
        },
        {
          id: 'show-sketch',
          label: 'Muéstrale el croquis a Luz.',
          requires: [annotatedOriginCard],
        },
      ],
    },
    {
      id: 'review-bag',
      title: 'Otro día en objetos perdidos',
      kind: 'review',
      description:
        'Practica con otro mensaje cuando quieras recordar cómo identificar una mochila.',
      requires: [returnedBag],
      reviewMissionId: 'bag',
      goals: [
        {
          id: 'bag-review-response',
          label: 'Resuelve una actividad de repaso de la mochila.',
          requires: [{ type: 'reviewCompletedMission', id: 'bag' }],
        },
      ],
    },
  ],
  scenes: [
    {
      id: 'plaza',
      title: 'La plaza',
      art: 'plaza',
      description: 'La fuente queda frente a la mesa de bienvenida. Aquí empieza tu viaje.',
      hotspots: [
        {
          id: 'plaza-sam',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
          position: { x: 53, y: 67 },
          requires: [{ ...greeted, not: true }],
          effects: [{ type: 'dialogue', id: 'sam-introduction' }],
        },
        {
          id: 'plaza-sam-ticket',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
          position: { x: 53, y: 67 },
          requires: [greeted, { ...guided, not: true }],
          effects: [{ type: 'dialogue', id: 'sam-waiting-for-directions' }],
        },
        {
          id: 'plaza-luz',
          label: 'Luz',
          kind: 'npc',
          npcId: 'luz',
          position: { x: 78, y: 54 },
          requires: [
            { ...knowsIntroduction, not: true },
            { ...luzPath, not: true },
          ],
          effects: [{ type: 'dialogue', id: 'luz-welcome' }],
        },
        {
          id: 'plaza-luz-after-introduction',
          label: 'Luz',
          kind: 'npc',
          npcId: 'luz',
          position: { x: 78, y: 54 },
          requires: [knowsIntroduction, { ...luzPath, not: true }],
          effects: [{ type: 'dialogue', id: 'luz-after-introduction' }],
        },
        {
          id: 'plaza-luz-search',
          label: 'Luz',
          kind: 'npc',
          npcId: 'luz',
          position: { x: 78, y: 54 },
          requires: [luzPath],
          effects: [{ type: 'dialogue', id: 'luz-search' }],
        },
        {
          id: 'plaza-origin',
          label: 'Postales de {origin}',
          kind: 'object',
          position: { x: 17, y: 29 },
          effects: [{ type: 'dialogue', id: 'origin-postcards' }],
        },
        {
          id: 'plaza-ticket',
          label: 'Boleto y cartel del parque',
          kind: 'object',
          position: { x: 48, y: 33 },
          requires: [hasTicket],
          effects: [{ type: 'dialogue', id: 'ticket-inspection' }],
        },
        {
          id: 'plaza-to-stop',
          label: 'Camino al parque',
          kind: 'exit',
          position: { x: 80, y: 82 },
          requires: [ticketRead],
          effects: [{ type: 'scene', id: 'bus-stop' }],
        },
      ],
    },
    {
      id: 'bus-stop',
      title: 'La parada',
      art: 'bus',
      description: 'A un lado del parque hay un banco y un poste con el símbolo de un árbol.',
      hotspots: [
        {
          id: 'stop-to-plaza',
          label: 'Volver a la plaza',
          kind: 'exit',
          position: { x: 14, y: 79 },
          effects: [{ type: 'scene', id: 'plaza' }],
        },
        {
          id: 'stop-sign',
          label: 'Señal de la parada',
          kind: 'object',
          position: { x: 42, y: 24 },
          effects: [
            { type: 'event', id: 'found-bus-stop' },
            { type: 'dialogue', id: 'stop-found' },
          ],
        },
        {
          id: 'stop-sam-directions',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
          position: { x: 75, y: 52 },
          requires: [{ ...guided, not: true }],
          effects: [{ type: 'dialogue', id: 'sam-directions' }],
        },
        {
          id: 'stop-sam-search',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
          position: { x: 75, y: 52 },
          requires: [guided, { ...returnedBag, not: true }],
          effects: [{ type: 'dialogue', id: 'sam-search' }],
        },
        {
          id: 'stop-bench',
          label: 'Banco del parque',
          kind: 'object',
          position: { x: 23, y: 51 },
          requires: [benchPath],
          effects: [{ type: 'dialogue', id: 'bench-search' }],
        },
        {
          id: 'stop-to-lost-property',
          label: 'Ir a objetos perdidos',
          kind: 'exit',
          position: { x: 82, y: 83 },
          requires: [hasClue],
          effects: [{ type: 'scene', id: 'lost-property' }],
        },
      ],
    },
    {
      id: 'lost-property',
      title: 'Objetos perdidos',
      art: 'bag',
      description: 'En el mostrador guardan dos mochilas y un mensaje de Sam.',
      hotspots: [
        {
          id: 'lost-to-stop',
          label: 'Volver a la parada',
          kind: 'exit',
          position: { x: 14, y: 81 },
          effects: [{ type: 'scene', id: 'bus-stop' }],
        },
        {
          id: 'lost-luz',
          label: 'Luz',
          kind: 'npc',
          npcId: 'luz',
          position: { x: 22, y: 30 },
          effects: [{ type: 'dialogue', id: 'luz-lost-property' }],
        },
        {
          id: 'lost-blue-bag',
          label: 'Mochila azul',
          kind: 'object',
          position: { x: 48, y: 55 },
          requires: [identifiedBag, { ...hasBag, not: true }],
          effects: [{ type: 'dialogue', id: 'blue-bag' }],
        },
        {
          id: 'lost-red-bag',
          label: 'Mochila roja',
          kind: 'object',
          position: { x: 80, y: 30 },
          requires: [identifiedBag],
          effects: [{ type: 'dialogue', id: 'red-bag' }],
        },
        {
          id: 'lost-sam-return',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
          position: { x: 77, y: 78 },
          requires: [hasBag, { ...returnedBag, not: true }],
          effects: [{ type: 'dialogue', id: 'sam-return' }],
        },
        {
          id: 'lost-sam-finale',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
          position: { x: 77, y: 78 },
          requires: [benchPath, returnedBag],
          effects: [{ type: 'dialogue', id: 'sam-finale-bench' }],
        },
        {
          id: 'lost-sam-finale-luz',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
          position: { x: 77, y: 78 },
          requires: [luzPath, returnedBag],
          effects: [{ type: 'dialogue', id: 'sam-finale-luz' }],
        },
      ],
    },
  ],
  encounters: [
    {
      id: 'greet-sam',
      npcId: 'sam',
      missionId: 'hello',
      onFinish: [
        { type: 'event', id: 'greeted-sam' },
        { type: 'giveItem', id: 'bus-ticket' },
        { type: 'startQuest', id: 'catch-the-bus' },
        { type: 'dialogue', id: 'sam-after-introduction' },
      ],
    },
    {
      id: 'guide-sam',
      npcId: 'sam',
      missionId: 'bus',
      onFinish: [
        { type: 'event', id: 'guided-sam' },
        { type: 'startQuest', id: 'find-the-bag' },
        { type: 'dialogue', id: 'sam-found-stop' },
      ],
    },
    {
      id: 'identify-bag',
      npcId: 'luz',
      missionId: 'bag',
      endBeforeStepId: 'bag_postcard',
      onFinish: [{ type: 'event', id: 'identified-bag' }],
    },
    {
      id: 'return-bag',
      npcId: 'sam',
      missionId: 'bag',
      onFinish: [
        { type: 'event', id: 'returned-sam-bag' },
        { type: 'startQuest', id: 'review-bag' },
      ],
    },
  ],
  dialogues: [
    {
      id: 'sam-introduction',
      npcId: 'sam',
      text: 'Sam se acerca a la mesa de bienvenida con un boleto en la mano. Quiere pedirte ayuda, pero primero se presenta.',
      line: { en: 'Hi! My name is Sam.', es: '¡Hola! Me llamo Sam.' },
      choices: [
        {
          id: 'introduce-yourself',
          label: 'Presentarme a Sam',
          effects: [
            { type: 'startQuest', id: 'meet-sam' },
            { type: 'encounter', id: 'greet-sam' },
          ],
        },
      ],
    },
    {
      id: 'sam-after-introduction',
      npcId: 'sam',
      text: '¡Mucho gusto! ¿Me ayudas a encontrar la parada? Mi bus sale a las ocho. Compara el árbol de mi boleto con el del cartel de la plaza.',
      line: { en: 'Where is the bus stop?', es: '¿Dónde está la parada de bus?' },
      choices: [],
    },
    {
      id: 'sam-waiting-for-directions',
      npcId: 'sam',
      text: 'Voy a tomar el bus de las ocho. Me adelanto por el parque y te espero en el poste con el árbol. Puedes llevarte mi boleto para comparar el símbolo.',
      choices: [],
    },
    {
      id: 'luz-welcome',
      npcId: 'luz',
      text: 'Para presentarte en inglés, puedes decir «I am» o «My name is» y agregar tu nombre.',
      line: { en: 'Hi! I am Luz.', es: '¡Hola! Soy Luz.' },
      tip: 'Empieza con «Hi!». Si usas «I», el verbo va como «am».',
      choices: [
        {
          id: 'ask-luz-about-origin',
          label: 'Preguntar por las postales',
          effects: [{ type: 'dialogue', id: 'origin-postcards' }],
        },
        { id: 'show-origin-sketch', ...showOriginSketch },
      ],
    },
    {
      id: 'luz-after-introduction',
      npcId: 'luz',
      text: 'Un saludo y tu nombre bastan para empezar. Si te fijas en las postales de {origin}, muchas cuentan cómo se conocieron dos personas.',
      line: { en: 'Hi! I am Luz.', es: '¡Hola! Soy Luz.' },
      choices: [
        {
          id: 'ask-luz-about-origin-after-introduction',
          label: 'Preguntar por las postales',
          effects: [{ type: 'dialogue', id: 'origin-postcards' }],
        },
        { id: 'show-origin-sketch-after-introduction', ...showOriginSketch },
      ],
    },
    {
      id: 'origin-postcards',
      text: 'Entre las postales de {origin} hay un dibujo de la plaza y el parque. La calle que sale de la fuente quedó sin marcar.',
      choices: [
        {
          id: 'take-origin-sketch',
          label: 'Guardar el croquis',
          requires: [{ ...hasOriginCard, not: true }],
          effects: [
            { type: 'startQuest', id: 'origin-sketch' },
            { type: 'giveItem', id: 'origin-card' },
            { type: 'dialogue', id: 'origin-sketch-taken' },
          ],
        },
      ],
    },
    {
      id: 'origin-sketch-taken',
      text: 'Guardas el croquis en la mochila. Luz conoce bien los caminos de esta plaza.',
      choices: [],
    },
    {
      id: 'luz-map-clue',
      npcId: 'luz',
      text: 'Luz marca una línea desde la fuente hasta el parque. «Sigue el borde del parque. Si encuentras el poste con el árbol, llegaste a la parada».',
      choices: [],
    },
    {
      id: 'ticket-inspection',
      text: 'El cartel tiene dos caminos. Solo el camino al parque tiene el mismo árbol que el boleto de las ocho.',
      choices: [
        {
          id: 'read-ticket',
          label: 'Comparar el boleto con el cartel',
          requires: [hasTicket, { ...ticketRead, not: true }],
          effects: [
            { type: 'useItem', id: 'bus-ticket' },
            { type: 'event', id: 'read-bus-ticket' },
            { type: 'dialogue', id: 'ticket-read' },
          ],
        },
      ],
    },
    {
      id: 'ticket-read',
      text: 'El símbolo coincide. El camino bordea el parque, donde tienes que buscar la señal de la parada.',
      choices: [],
    },
    {
      id: 'stop-found',
      text: 'El poste tiene el mismo árbol que el boleto. Mirando desde aquí, ves que la parada queda justo junto al parque.',
      choices: [],
    },
    {
      id: 'sam-directions',
      npcId: 'sam',
      text: 'Sam está junto a la entrada del parque. Necesita una indicación para reconocer la parada y poder decirle a otro pasajero cómo llegar.',
      line: { en: 'Where is the bus stop?', es: '¿Dónde está la parada de bus?' },
      choices: [
        {
          id: 'give-directions',
          label: 'Darle la indicación en inglés',
          requires: [stopFound],
          effects: [{ type: 'encounter', id: 'guide-sam' }],
        },
        {
          id: 'find-stop-sign',
          label: 'Buscar la señal primero',
          requires: [{ ...stopFound, not: true }],
          effects: [close],
        },
      ],
    },
    {
      id: 'sam-found-stop',
      npcId: 'sam',
      text: '¡Gracias! Ya encontré la parada junto al parque. Un momento… dejé mi mochila en algún lugar.',
      line: { en: 'My bag!', es: '¡Mi mochila!' },
      choices: [
        {
          id: 'start-search',
          label: 'Buscar la mochila',
          effects: [{ type: 'dialogue', id: 'sam-search' }],
        },
      ],
    },
    {
      id: 'sam-search',
      npcId: 'sam',
      text: 'Sam ya encontró la parada, pero su mochila no está. Recuerda que se sentó en el banco mientras miraba el boleto. Luz estaba cerca.',
      line: { en: 'My bag!', es: '¡Mi mochila!' },
      choices: [
        {
          id: 'search-bench',
          label: 'Revisar el banco',
          requires: [{ ...routeChosen, not: true }],
          effects: [
            { type: 'flag', id: 'bag-search-path', value: 'bench' },
            { type: 'dialogue', id: 'sam-search-bench' },
          ],
        },
        {
          id: 'ask-luz',
          label: 'Preguntarle a Luz',
          requires: [{ ...routeChosen, not: true }],
          effects: [
            { type: 'flag', id: 'bag-search-path', value: 'luz' },
            { type: 'dialogue', id: 'sam-search-luz' },
          ],
        },
        {
          id: 'keep-searching-bench',
          label: 'Revisar la nota del banco',
          requires: [benchPath],
          effects: [{ type: 'dialogue', id: 'sam-search-bench' }],
        },
        {
          id: 'keep-searching-luz',
          label: 'Volver con Luz',
          requires: [luzPath],
          effects: [{ type: 'dialogue', id: 'sam-search-luz' }],
        },
      ],
    },
    {
      id: 'sam-search-bench',
      npcId: 'sam',
      text: 'Revisa debajo del banco. Si encuentras algo, déjame un aviso y te alcanzo en la mesa de objetos perdidos.',
      choices: [],
    },
    {
      id: 'sam-search-luz',
      npcId: 'sam',
      text: 'Luz estaba en la plaza. Pregúntale si alguien se llevó la mochila. Te alcanzo en la mesa de objetos perdidos si la encuentras.',
      choices: [],
    },
    {
      id: 'bench-search',
      text: 'No hay mochila debajo del banco. Entre las tablas ves un papel doblado.',
      choices: [
        {
          id: 'read-bench-note',
          label: 'Leer la nota doblada',
          effects: [
            { type: 'event', id: 'found-bag-clue' },
            { type: 'dialogue', id: 'bench-clue' },
          ],
        },
      ],
    },
    {
      id: 'bench-clue',
      text: 'Luz dejó una nota para quien perdió una mochila. La guardó en objetos perdidos junto a otra que ya estaba en el mostrador. Dejas el aviso para Sam.',
      choices: [],
    },
    {
      id: 'luz-search',
      npcId: 'luz',
      text: 'Luz recuerda a Sam junto al banco. Cuando volvió a pasar, vio una mochila donde se había sentado.',
      choices: [
        {
          id: 'hear-luz-clue',
          label: 'Preguntar dónde dejó la mochila',
          effects: [
            { type: 'event', id: 'found-bag-clue' },
            { type: 'dialogue', id: 'luz-clue' },
          ],
        },
        { id: 'show-origin-sketch-while-searching', ...showOriginSketch },
      ],
    },
    {
      id: 'luz-clue',
      npcId: 'luz',
      text: 'La llevé al mostrador de objetos perdidos. Hay dos mochilas y no quiero devolver la equivocada. Voy contigo. Dile a Sam que nos alcance allá.',
      choices: [],
    },
    {
      id: 'luz-lost-property',
      npcId: 'luz',
      text: 'Para entregar una mochila necesito confirmar qué color mencionó su dueño. Sam nos dejó un mensaje en inglés.',
      choices: [
        {
          id: 'read-sam-message',
          label: 'Revisar el mensaje de Sam',
          requires: [{ ...identifiedBag, not: true }],
          effects: [{ type: 'encounter', id: 'identify-bag' }],
        },
        {
          id: 'ask-which-bag',
          label: 'Preguntar por las mochilas',
          requires: [identifiedBag, { ...returnedBag, not: true }],
          effects: [{ type: 'dialogue', id: 'luz-two-bags' }],
        },
        {
          id: 'ask-luz-about-postcard',
          label: 'Mostrarle la postal de Sam',
          requires: [returnedBag],
          effects: [{ type: 'dialogue', id: 'luz-postcard' }],
        },
      ],
    },
    {
      id: 'luz-two-bags',
      npcId: 'luz',
      text: 'Ahora puedes elegir cuál llevarle a Sam. La mochila roja es mía y se queda aquí.',
      line: { en: 'It’s red.', es: 'Es roja.' },
      choices: [],
    },
    {
      id: 'blue-bag',
      text: 'Reconoces el color de la mochila que Sam describió. Luz deja la mochila azul a tu alcance.',
      choices: [
        {
          id: 'take-blue-bag',
          label: 'Llevarle la mochila azul',
          requires: [identifiedBag, { ...hasBag, not: true }],
          effects: [
            { type: 'giveItem', id: 'sam-blue-bag' },
            { type: 'dialogue', id: 'bag-taken' },
          ],
        },
      ],
    },
    {
      id: 'bag-taken',
      text: 'Sam entra a objetos perdidos. Muéstrale la mochila que encontraste.',
      choices: [],
    },
    {
      id: 'red-bag',
      npcId: 'luz',
      text: 'Luz reconoce su mochila roja por el lazo del cierre. La deja en su lado del mostrador.',
      line: { en: 'It’s red.', es: 'Es roja.' },
      choices: [],
    },
    {
      id: 'sam-return',
      npcId: 'sam',
      text: 'Sam se acerca al mostrador para reconocer su mochila.',
      choices: [
        {
          id: 'show-blue-bag',
          label: 'Mostrarle la mochila azul',
          requires: [hasBag, { ...returnedBag, not: true }],
          effects: [
            { type: 'useItem', id: 'sam-blue-bag' },
            { type: 'event', id: 'showed-sam-bag' },
            { type: 'encounter', id: 'return-bag' },
          ],
        },
      ],
    },
    {
      id: 'sam-finale-bench',
      npcId: 'sam',
      text: 'Tu aviso y la nota del banco me ahorraron volver por toda la plaza. Quédate con la postal. Ojalá te sirva para contar lo que viste en el camino.',
      choices: [],
    },
    {
      id: 'sam-finale-luz',
      npcId: 'sam',
      text: 'Gracias a la pista de Luz pude venir directo al mostrador. Quédate con la postal. Cuando la escribas, acuérdate de las personas que nos ayudaron.',
      choices: [],
    },
    {
      id: 'luz-postcard',
      npcId: 'luz',
      text: 'Tu postal ya tiene una historia. En tu pasaporte puedes guardar el recuerdo de cómo encontraste la mochila.',
      choices: [],
    },
  ],
} satisfies StoryDefinition;
