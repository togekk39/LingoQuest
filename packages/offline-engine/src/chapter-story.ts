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
const plazaPostcardName = 'Postal de la plaza';
const parkSignName = 'Cartel del parque';
const stopSignName = 'Señal de la parada';
const parkBenchName = 'Banco del parque';
const blueBagName = 'Mochila azul';
const redBagName = 'Mochila roja';
const luzGreeting = { en: 'Hello! I’m Luz. Welcome!', es: '¡Hola! Soy Luz. ¡Qué gusto recibirte!' };
const luzGreetingReply = { en: 'Nice to meet you, too!', es: '¡El gusto es mío!' };
const practiceWithLuz = {
  id: 'practice-with-luz',
  label: 'Practicar con el ejemplo de Luz',
  effects: [{ type: 'dialogue', id: 'luz-introduction-practice' }],
} as const;
const askAboutPlazaPostcard = {
  label: 'Preguntar por la postal',
  requires: [{ ...hasOriginCard, not: true }],
  effects: [{ type: 'dialogue', id: 'origin-postcards' }],
} as const;
const showPlazaPostcard = {
  label: 'Mostrarle la postal',
  requires: [hasOriginCard, { ...annotatedOriginCard, not: true }],
  effects: [
    { type: 'useItem', id: 'origin-card' },
    { type: 'event', id: 'annotated-origin-card' },
    { type: 'dialogue', id: 'luz-map-clue' },
  ],
} as const;

export const chapterStory = {
  id: chapter.id,
  revision: 4,
  initialSceneId: 'plaza',
  npcs: [
    { id: 'sam', name: 'Sam', role: 'Viajero que busca la parada del bus de las ocho' },
    { id: 'luz', name: 'Luz', role: 'Encargada de la mesa de bienvenida y de objetos perdidos' },
  ],
  items: [
    {
      id: 'bus-ticket',
      name: 'Boleto de Sam',
      kind: 'quest',
      description:
        'El boleto del bus de las ocho lleva un árbol. Busca ese símbolo en el cartel del parque, en la plaza.',
    },
    {
      id: 'sam-blue-bag',
      name: 'Mochila azul de Sam',
      kind: 'quest',
      description: 'La mochila que Luz guardó para Sam en el mostrador de objetos perdidos.',
    },
    {
      id: 'origin-card',
      name: plazaPostcardName,
      kind: 'story',
      description: 'En el reverso hay un mapa sencillo de la plaza y el parque.',
    },
    {
      id: 'sam-postcard',
      name: chapter.collectible,
      kind: 'souvenir',
      description:
        'Sam guardaba esta postal en su mochila. Puedes escribir en ella desde tu pasaporte.',
    },
  ],
  quests: [
    {
      id: 'meet-sam',
      title: 'Un saludo en la plaza',
      kind: 'main',
      description: 'Saluda a Sam en la plaza, conoce a Luz y di tu nombre en inglés.',
      goals: [{ id: 'introduction', label: 'Preséntate a Sam en inglés.', requires: [greeted] }],
    },
    {
      id: 'catch-the-bus',
      title: 'El bus de las ocho',
      kind: 'main',
      description: 'Compara el boleto de Sam con el cartel del parque y dile dónde está la parada.',
      requires: [greeted],
      goals: [
        {
          id: 'ticket-read',
          label: 'Compara el boleto con el cartel del parque.',
          requires: [ticketRead],
        },
        { id: 'stop-found', label: 'Examina la señal de la parada.', requires: [stopFound] },
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
        {
          id: 'search-clue',
          label: 'Busca una pista en el banco o pregúntale a Luz.',
          requires: [hasClue],
        },
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
      title: 'La ruta en la postal',
      kind: 'side',
      description: 'Pídele a Luz que marque el camino al parque en el mapa de la postal.',
      goals: [
        {
          id: 'find-sketch',
          label: 'Guarda la postal de la plaza en tu mochila.',
          requires: [hasOriginCard],
        },
        {
          id: 'show-sketch',
          label: 'Muéstrale la postal a Luz.',
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
      description:
        'Alrededor de la fuente están la mesa de bienvenida de Luz y el camino al parque.',
      hotspots: [
        {
          id: 'plaza-sam',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
          requires: [{ ...greeted, not: true }],
          effects: [{ type: 'dialogue', id: 'sam-introduction' }],
        },
        {
          id: 'plaza-sam-ticket',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
          requires: [greeted, { ...ticketRead, not: true }],
          effects: [{ type: 'dialogue', id: 'sam-waiting-for-directions' }],
        },
        {
          id: 'plaza-luz',
          label: 'Luz',
          kind: 'npc',
          npcId: 'luz',
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
          requires: [
            knowsIntroduction,
            { type: 'any', conditions: [{ ...luzPath, not: true }, returnedBag] },
          ],
          effects: [{ type: 'dialogue', id: 'luz-after-introduction' }],
        },
        {
          id: 'plaza-luz-search',
          label: 'Luz',
          kind: 'npc',
          npcId: 'luz',
          requires: [luzPath, { ...returnedBag, not: true }],
          effects: [{ type: 'dialogue', id: 'luz-search' }],
        },
        {
          id: 'plaza-origin',
          label: plazaPostcardName,
          kind: 'object',
          effects: [{ type: 'dialogue', id: 'origin-postcards' }],
        },
        {
          id: 'plaza-ticket',
          label: parkSignName,
          kind: 'object',
          requires: [hasTicket],
          effects: [{ type: 'dialogue', id: 'ticket-inspection' }],
        },
        {
          id: 'plaza-to-stop',
          label: 'Ir a la parada',
          kind: 'exit',
          requires: [ticketRead],
          effects: [{ type: 'scene', id: 'bus-stop' }],
        },
      ],
    },
    {
      id: 'bus-stop',
      title: 'La parada',
      art: 'bus',
      description:
        'Junto al parque hay un banco y una señal de la parada con el símbolo de un árbol.',
      hotspots: [
        {
          id: 'stop-to-plaza',
          label: 'Volver a la plaza',
          kind: 'exit',
          effects: [{ type: 'scene', id: 'plaza' }],
        },
        {
          id: 'stop-sign',
          label: stopSignName,
          kind: 'object',
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
          requires: [{ ...guided, not: true }],
          effects: [{ type: 'dialogue', id: 'sam-directions' }],
        },
        {
          id: 'stop-sam-search',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
          requires: [guided, { ...hasClue, not: true }],
          effects: [{ type: 'dialogue', id: 'sam-search' }],
        },
        {
          id: 'stop-bench',
          label: parkBenchName,
          kind: 'object',
          requires: [benchPath],
          effects: [{ type: 'dialogue', id: 'bench-search' }],
        },
        {
          id: 'stop-to-lost-property',
          label: 'Ir a objetos perdidos',
          kind: 'exit',
          requires: [hasClue],
          effects: [{ type: 'scene', id: 'lost-property' }],
        },
      ],
    },
    {
      id: 'lost-property',
      title: 'Objetos perdidos',
      art: 'bag',
      description: 'Luz atiende el mostrador donde se guardan los objetos perdidos.',
      hotspots: [
        {
          id: 'lost-to-stop',
          label: 'Volver a la parada',
          kind: 'exit',
          effects: [{ type: 'scene', id: 'bus-stop' }],
        },
        {
          id: 'lost-luz',
          label: 'Luz',
          kind: 'npc',
          npcId: 'luz',
          requires: [{ ...identifiedBag, not: true }],
          effects: [{ type: 'dialogue', id: 'luz-lost-property' }],
        },
        {
          id: 'lost-luz-identified',
          label: 'Luz',
          kind: 'npc',
          npcId: 'luz',
          requires: [identifiedBag, { ...returnedBag, not: true }],
          effects: [{ type: 'dialogue', id: 'luz-two-bags' }],
        },
        {
          id: 'lost-luz-after-return',
          label: 'Luz',
          kind: 'npc',
          npcId: 'luz',
          requires: [returnedBag],
          effects: [{ type: 'dialogue', id: 'luz-postcard' }],
        },
        {
          id: 'lost-blue-bag',
          label: blueBagName,
          kind: 'object',
          requires: [identifiedBag, { ...hasBag, not: true }],
          effects: [{ type: 'dialogue', id: 'blue-bag' }],
        },
        {
          id: 'lost-red-bag',
          label: redBagName,
          kind: 'object',
          requires: [identifiedBag],
          effects: [{ type: 'dialogue', id: 'red-bag' }],
        },
        {
          id: 'lost-sam-return',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
          requires: [hasBag, { ...returnedBag, not: true }],
          effects: [{ type: 'dialogue', id: 'sam-return' }],
        },
        {
          id: 'lost-sam-finale',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
          requires: [benchPath, returnedBag],
          effects: [{ type: 'dialogue', id: 'sam-finale-bench' }],
        },
        {
          id: 'lost-sam-finale-luz',
          label: 'Sam',
          kind: 'npc',
          npcId: 'sam',
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
      freshEntryStepId: 'hello_teach',
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
      text: 'Sam te saluda junto a la fuente. Para devolverle el saludo, dile «Hola, Sam».',
      line: { en: 'Hi! My name is Sam.', es: '¡Hola! Me llamo Sam.' },
      choices: [
        {
          id: 'greet-sam-in-english',
          label: 'Hi, Sam!',
          effects: [{ type: 'dialogue', id: 'sam-introduces-luz' }],
        },
      ],
    },
    {
      id: 'sam-introduces-luz',
      npcId: 'sam',
      text: 'Sam señala la mesa de bienvenida. Puedes decirle «Hola, Luz».',
      line: { en: 'This is Luz.', es: 'Ella es Luz.' },
      choices: [
        {
          id: 'greet-luz-in-english',
          label: 'Hi, Luz!',
          effects: [{ type: 'dialogue', id: 'luz-meets-traveler' }],
        },
      ],
    },
    {
      id: 'luz-meets-traveler',
      npcId: 'luz',
      text: 'Luz te da la bienvenida. Puedes contestarle «Mucho gusto, Luz».',
      line: luzGreeting,
      choices: [
        {
          id: 'reply-to-luz',
          label: 'Nice to meet you, Luz!',
          effects: [{ type: 'dialogue', id: 'luz-replies-to-traveler' }],
        },
      ],
    },
    {
      id: 'luz-replies-to-traveler',
      npcId: 'luz',
      text: 'Luz sonríe y deja que Sam siga la conversación.',
      line: luzGreetingReply,
      choices: [
        {
          id: 'continue-opening-with-sam',
          label: 'Seguir con Sam',
          effects: [{ type: 'dialogue', id: 'sam-asks-name' }],
        },
      ],
    },
    {
      id: 'sam-asks-name',
      npcId: 'sam',
      text: 'Sam quiere saber cómo te llamas. Luz se acerca para practicar contigo antes de que le respondas.',
      line: { en: "What's your name?", es: '¿Cómo te llamas?' },
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
      text: 'Toma mi boleto. El bus sale a las ocho. Busca el mismo árbol en el cartel del parque.',
      line: {
        en: 'Can you help me find the bus stop?',
        es: '¿Me ayudas a encontrar la parada del bus?',
      },
      choices: [],
    },
    {
      id: 'sam-waiting-for-directions',
      npcId: 'sam',
      text: 'Te espero por la entrada del parque. Lleva mi boleto y fíjate en el árbol para encontrar la parada.',
      choices: [],
    },
    {
      id: 'luz-welcome',
      npcId: 'luz',
      text: 'Luz te saluda desde la mesa de bienvenida.',
      line: luzGreeting,
      choices: [
        {
          id: 'reply-to-luz-at-desk',
          label: 'Nice to meet you, Luz!',
          effects: [{ type: 'dialogue', id: 'luz-desk-greeting-reply' }],
        },
        { id: 'ask-luz-about-origin', ...askAboutPlazaPostcard },
        { id: 'show-origin-sketch', ...showPlazaPostcard },
      ],
    },
    {
      id: 'luz-desk-greeting-reply',
      npcId: 'luz',
      text: 'Si necesitas algo, acércate a mi mesa.',
      line: luzGreetingReply,
      choices: [
        practiceWithLuz,
        { id: 'ask-luz-about-origin-at-desk', ...askAboutPlazaPostcard },
        { id: 'show-origin-sketch-at-desk', ...showPlazaPostcard },
      ],
    },
    {
      id: 'luz-after-introduction',
      npcId: 'luz',
      text: '¿Necesitas ayuda para llegar al parque? Puedo marcarte el camino en la postal de la plaza.',
      choices: [
        practiceWithLuz,
        { id: 'ask-luz-about-origin-after-introduction', ...askAboutPlazaPostcard },
        { id: 'show-origin-sketch-after-introduction', ...showPlazaPostcard },
      ],
    },
    {
      id: 'luz-introduction-practice',
      npcId: 'luz',
      text: 'Cuando digo «I’m Luz», uso la forma corta de «I am Luz». Con «I» va «am». Ahora, elige el verbo de la forma completa: «I ___ Luz».',
      choices: [
        {
          id: 'luz-practice-am',
          label: 'am',
          effects: [{ type: 'dialogue', id: 'luz-introduction-practice-feedback' }],
        },
        {
          id: 'luz-practice-is',
          label: 'is',
          effects: [{ type: 'dialogue', id: 'luz-introduction-practice-retry' }],
        },
      ],
    },
    {
      id: 'luz-introduction-practice-feedback',
      npcId: 'luz',
      text: '¡Eso es! Puedes decir «I am» o «My name is» y luego tu nombre. Pruébalo cuando hables con Sam.',
      line: { en: 'Hi! I am Luz.', es: '¡Hola! Soy Luz.' },
      exampleLabel: 'Ejemplo de Luz',
      choices: [],
    },
    {
      id: 'luz-introduction-practice-retry',
      npcId: 'luz',
      text: 'Con «My name» usamos «is». Prueba con «am» cuando empieces con «I».',
      choices: [
        {
          id: 'luz-practice-retry',
          label: 'Volver al ejemplo',
          effects: [{ type: 'dialogue', id: 'luz-introduction-practice' }],
        },
      ],
    },
    {
      id: 'origin-postcards',
      title: plazaPostcardName,
      text: 'En la mesa de Luz hay postales de {origin}. Esta muestra la plaza y el parque en el reverso.',
      choices: [
        {
          id: 'take-origin-sketch',
          label: 'Guardar la postal',
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
      title: plazaPostcardName,
      text: 'La postal está en tu mochila. Habla con Luz y muéstrasela para que marque el camino al parque.',
      choices: [],
    },
    {
      id: 'luz-map-clue',
      npcId: 'luz',
      text: 'En el reverso de la postal, Luz marca el camino desde la fuente hasta el parque. «Sigue ese camino y busca la señal con el árbol junto al parque».',
      choices: [],
    },
    {
      id: 'ticket-inspection',
      title: parkSignName,
      text: 'El árbol del cartel marca el camino al parque.',
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
      title: parkSignName,
      text: 'El árbol del cartel coincide con el del boleto. Ve a la parada junto al parque y busca la señal.',
      choices: [],
    },
    {
      id: 'stop-found',
      title: stopSignName,
      text: 'La señal tiene el mismo árbol que el boleto. Aquí se toma el bus, junto al parque.',
      choices: [],
    },
    {
      id: 'sam-directions',
      npcId: 'sam',
      text: 'Ya llegué al parque. ¿Me dices dónde queda la parada para avisarle a otro pasajero?',
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
      text: '¡Gracias! Ya puedo explicar dónde queda la parada. Un momento… ¿dónde dejé mi mochila?',
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
      text: 'Dejé mi mochila en el banco mientras revisaba el boleto. Luz estaba cerca. ¿Dónde buscamos?',
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
          label: 'Recordar dónde buscar',
          requires: [benchPath],
          effects: [{ type: 'dialogue', id: 'sam-search-bench' }],
        },
        {
          id: 'keep-searching-luz',
          label: 'Recordar dónde está Luz',
          requires: [luzPath],
          effects: [{ type: 'dialogue', id: 'sam-search-luz' }],
        },
      ],
    },
    {
      id: 'sam-search-bench',
      npcId: 'sam',
      text: 'Revisa el banco del parque. Si encuentras una pista, déjame un aviso y te alcanzo en objetos perdidos.',
      choices: [],
    },
    {
      id: 'sam-search-luz',
      npcId: 'sam',
      text: 'Vuelve a la plaza y pregúntale a Luz en la mesa de bienvenida. Si la guardó, te alcanzo en objetos perdidos.',
      choices: [],
    },
    {
      id: 'bench-search',
      title: parkBenchName,
      text: 'Junto al asiento ves un papel doblado. Puede ser una pista sobre la mochila.',
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
      title: 'Nota del banco',
      text: 'La nota dice que Luz guardó una mochila en objetos perdidos. Dejas un aviso para Sam y ya puedes ir al mostrador.',
      choices: [],
    },
    {
      id: 'luz-search',
      npcId: 'luz',
      text: 'Vi a Sam sentado en el banco. Cuando volví a pasar, quedaba una mochila en el asiento.',
      choices: [
        {
          id: 'hear-luz-clue',
          label: 'Preguntar dónde guardó la mochila',
          requires: [{ ...hasClue, not: true }],
          effects: [
            { type: 'event', id: 'found-bag-clue' },
            { type: 'dialogue', id: 'luz-clue' },
          ],
        },
        {
          id: 'hear-luz-clue-again',
          label: 'Recordar dónde queda la mochila',
          requires: [hasClue],
          effects: [{ type: 'dialogue', id: 'luz-clue' }],
        },
        { id: 'show-origin-sketch-while-searching', ...showPlazaPostcard },
      ],
    },
    {
      id: 'luz-clue',
      npcId: 'luz',
      text: 'La guardé en objetos perdidos. Vuelve a la parada y sigue hacia el mostrador. Le aviso a Sam que nos alcance.',
      choices: [],
    },
    {
      id: 'luz-lost-property',
      npcId: 'luz',
      text: 'Sam dejó un mensaje en inglés con el color de su mochila. Léelo conmigo para que podamos devolverle la correcta.',
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
      text: 'La mochila roja es mía y se queda aquí. Sam está esperando la azul.',
      line: { en: 'It’s red.', es: 'Es roja.' },
      choices: [],
    },
    {
      id: 'blue-bag',
      title: blueBagName,
      text: 'El color coincide con el mensaje de Sam. Luz te deja tomar la mochila azul del mostrador.',
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
      title: blueBagName,
      text: 'Sam acaba de llegar al mostrador. Habla con Sam para entregarle la mochila.',
      choices: [],
    },
    {
      id: 'red-bag',
      npcId: 'luz',
      text: 'La mochila roja es mía. Se queda conmigo en el mostrador.',
      line: { en: 'It’s red.', es: 'Es roja.' },
      choices: [],
    },
    {
      id: 'sam-return',
      npcId: 'sam',
      text: '¡Llegaste! ¿Me enseñas la mochila que encontraste?',
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
      text: 'Si quieres guardar el recuerdo de cómo encontraste la mochila, escribe en la postal desde tu pasaporte.',
      choices: [],
    },
  ],
} satisfies StoryDefinition;
