import { homeFoundationStory } from '../../packages/offline-engine/src/chapter-story';
import type {
  StoryCondition,
  StoryDefinition,
  StoryEffect,
} from '../../packages/offline-engine/src/story';

const completed = (id: string): StoryCondition => ({ type: 'completedMission', id });
const event = (id: string): StoryCondition => ({ type: 'event', id });
const pending = (condition: StoryCondition): StoryCondition => ({ ...condition, not: true });
const dialogue = (id: string): StoryEffect => ({ type: 'dialogue', id });
const encounter = (id: string): StoryEffect => ({ type: 'encounter', id });
const scene = (id: string): StoryEffect => ({ type: 'scene', id });
const item = (id: string): StoryEffect => ({ type: 'giveItem', id });
const startQuest = (id: string): StoryEffect => ({ type: 'startQuest', id });

const likes = completed('cartagena-likes');
const quantity = completed('cartagena-quantity');
const prices = completed('cartagena-prices');
const order = completed('cartagena-order');
const transfer = completed('cartagena-transfer');
const postcardRead = event('cartagena-postcard-read');

const close = {
  id: 'close',
  label: 'Volver a la escena',
  effects: [{ type: 'closeDialogue' }],
} as const;

const enterCafe = [
  startQuest('cartagena-market-supplies'),
  startQuest('cartagena-compare-menu'),
  scene('cartagena-cafe'),
];
const enterSeaside = [
  startQuest('cartagena-table-for-three'),
  startQuest('cartagena-meal-by-the-sea'),
  scene('cartagena-seaside'),
];

export const cartagenaAdventure = {
  id: 'colombia',
  revision: 13,
  initialSceneId: 'cartagena-street',
  repairPhrases: homeFoundationStory.repairPhrases,
  npcs: [
    { id: 'sam', name: 'Sam', role: 'Viajero y compañero de mesa' },
    { id: 'luz', name: 'Luz', role: 'Viajera y compañera de mesa' },
    { id: 'mar', name: 'Mar', role: 'Vendedora del mercado' },
    { id: 'alba', name: 'Alba', role: 'Mesera y voluntaria del intercambio de idiomas' },
  ],
  items: [
    {
      id: 'cartagena-invitation',
      name: 'Invitación al intercambio',
      kind: 'story',
      description: 'Inés dejó esta invitación al intercambio de comida en su postal de México.',
    },
    {
      id: 'cartagena-market-list',
      name: 'Lista del mercado',
      kind: 'quest',
      description: 'Anotaste las preferencias del grupo y las cantidades para tres personas.',
    },
    {
      id: 'cartagena-cafe-menu',
      name: 'Menú del café',
      kind: 'quest',
      description: 'El menú de la historia tiene platos, bebidas y precios en pesos colombianos.',
    },
    {
      id: 'cartagena-cusco-postcard',
      name: 'Postal para Cusco',
      kind: 'souvenir',
      description:
        'Alba te dejó una postal del intercambio con una invitación al mercado de Cusco, Perú.',
    },
  ],
  quests: [
    {
      id: 'cartagena-market-preferences',
      title: 'El mercado de Cartagena',
      kind: 'main',
      description: 'Averigua qué les gusta a tus compañeros para planear la comida.',
      goals: [{ id: 'likes', label: 'Averigua los gustos del grupo.', requires: [likes] }],
    },
    {
      id: 'cartagena-market-supplies',
      title: '¿Cuánto necesitamos?',
      kind: 'main',
      description: 'Ayuda a Sam a preparar comida y bebidas suficientes.',
      requires: [likes],
      goals: [
        { id: 'quantity', label: 'Prepara la lista para tres personas.', requires: [quantity] },
      ],
      rewardItems: ['cartagena-market-list'],
    },
    {
      id: 'cartagena-compare-menu',
      title: '¿Cuánto cuesta?',
      kind: 'main',
      description: 'Compara los precios del café antes de sentarte a la mesa.',
      requires: [quantity],
      goals: [
        { id: 'prices', label: 'Lee el menú y elige según el presupuesto.', requires: [prices] },
      ],
      rewardItems: ['cartagena-cafe-menu'],
    },
    {
      id: 'cartagena-table-for-three',
      title: 'Una mesa para tres',
      kind: 'main',
      description: 'Haz el pedido, confirma los detalles con Alba y pide la cuenta.',
      requires: [prices],
      goals: [{ id: 'order', label: 'Completa el pedido en el café.', requires: [order] }],
    },
    {
      id: 'cartagena-meal-by-the-sea',
      title: 'Una comida junto al mar',
      kind: 'main',
      description: 'Resuelve un pedido distinto durante el encuentro junto a la bahía.',
      requires: [order],
      goals: [
        { id: 'transfer', label: 'Completa el pedido junto al mar.', requires: [transfer] },
        { id: 'postcard', label: 'Recoge la postal para Cusco.', requires: [postcardRead] },
      ],
      rewardItems: ['cartagena-cusco-postcard'],
    },
  ],
  scenes: [
    {
      id: 'cartagena-street',
      art: 'cover',
      title: 'Una calle de Cartagena',
      description:
        'Las fachadas de colores dan a una calle angosta. Sam y Luz te esperan en la terraza con la postal de Inés abierta sobre la mesa.',
      hotspots: [
        {
          id: 'cartagena-street-postcard',
          label: 'Leer la postal de Inés',
          kind: 'object',
          position: { x: 57, y: 81 },
          effects: [dialogue('cartagena-arrival')],
        },
      ],
    },
    {
      id: 'cartagena-market',
      art: 'cartagena-market',
      title: 'El mercado de Cartagena',
      description: 'Mar acomoda el puesto de frutas. Sam dejó la canasta sobre el mostrador.',
      hotspots: [
        {
          id: 'cartagena-market-mar',
          label: 'Hablar con Mar',
          kind: 'npc',
          npcId: 'mar',
          position: { x: 33, y: 45 },
          requires: [pending(likes)],
          effects: [dialogue('cartagena-likes-intro')],
        },
        {
          id: 'cartagena-market-basket',
          label: 'Revisar la canasta',
          kind: 'object',
          position: { x: 65, y: 68 },
          requires: [likes, pending(quantity)],
          effects: [dialogue('cartagena-quantity-intro')],
        },
        {
          id: 'cartagena-market-to-cafe',
          label: 'Ir al café',
          kind: 'exit',
          position: { x: 87, y: 46 },
          requires: [quantity],
          effects: enterCafe,
        },
        {
          id: 'cartagena-market-to-street',
          label: 'Volver a la calle',
          kind: 'exit',
          position: { x: 87, y: 82 },
          effects: [scene('cartagena-street')],
        },
      ],
    },
    {
      id: 'cartagena-cafe',
      art: 'cartagena-cafe',
      title: 'El café del intercambio',
      description:
        'El menú está en el tablero. Alba atiende una mesa de tres lugares con vista a la calle.',
      hotspots: [
        {
          id: 'cartagena-cafe-menu-board',
          label: 'Consultar el menú',
          kind: 'object',
          position: { x: 56, y: 30 },
          requires: [pending(prices)],
          effects: [dialogue('cartagena-prices-intro')],
        },
        {
          id: 'cartagena-cafe-alba',
          label: 'Hablar con Alba',
          kind: 'npc',
          npcId: 'alba',
          position: { x: 18, y: 42 },
          requires: [prices, pending(order)],
          effects: [dialogue('cartagena-order-intro')],
        },
        {
          id: 'cartagena-cafe-to-seaside',
          label: 'Ir a la terraza',
          kind: 'exit',
          position: { x: 87, y: 42 },
          requires: [order],
          effects: enterSeaside,
        },
        {
          id: 'cartagena-cafe-to-market',
          label: 'Volver al mercado',
          kind: 'exit',
          position: { x: 87, y: 80 },
          effects: [scene('cartagena-market')],
        },
      ],
    },
    {
      id: 'cartagena-seaside',
      art: 'cartagena-seaside',
      title: 'La terraza junto al mar',
      description:
        'La mesa mira hacia la bahía. Alba participa en el intercambio de la tarde y tiene otro menú.',
      hotspots: [
        {
          id: 'cartagena-seaside-alba',
          label: 'Hablar con Alba',
          kind: 'npc',
          npcId: 'alba',
          position: { x: 16, y: 45 },
          requires: [pending(transfer)],
          effects: [dialogue('cartagena-transfer-intro')],
        },
        {
          id: 'cartagena-seaside-postcard',
          label: 'Leer la postal para Cusco',
          kind: 'object',
          position: { x: 60, y: 73 },
          requires: [transfer],
          effects: [dialogue('cartagena-postcard')],
        },
        {
          id: 'cartagena-seaside-to-cafe',
          label: 'Volver al café',
          kind: 'exit',
          position: { x: 87, y: 67 },
          effects: [scene('cartagena-cafe')],
        },
      ],
    },
  ],
  dialogues: [
    {
      id: 'cartagena-arrival',
      npcId: 'luz',
      text: 'La invitación al intercambio que Inés escribió en México nos trajo a Cartagena. Primero visitemos el puesto de Mar. Le prometí que iríamos al mercado con ella.',
      line: { en: "Let's go to the market.", es: 'Vamos al mercado.' },
      choices: [
        {
          id: 'cartagena-go-to-market',
          label: 'Ir al mercado',
          effects: [
            item('cartagena-invitation'),
            startQuest('cartagena-market-preferences'),
            scene('cartagena-market'),
          ],
        },
        close,
      ],
    },
    {
      id: 'cartagena-likes-intro',
      npcId: 'mar',
      text: 'Elige qué probar según los gustos de las tres personas que van a comer. Luz te puede contar qué le gusta a ella.',
      choices: [
        {
          id: 'cartagena-start-likes',
          label: 'Averiguar qué les gusta',
          effects: [startQuest('cartagena-market-preferences'), encounter('cartagena-likes')],
        },
        close,
      ],
    },
    {
      id: 'cartagena-likes-finished',
      npcId: 'luz',
      text: 'Ya sabes qué nos gusta. Sam está junto al mostrador y quiere hacer una lista de lo que hace falta.',
      choices: [close],
    },
    {
      id: 'cartagena-quantity-intro',
      npcId: 'sam',
      text: 'Hoy comemos tres: tú, Luz y yo. Antes de irnos, revisemos qué cantidades necesitamos llevar.',
      choices: [
        {
          id: 'cartagena-start-quantity',
          label: 'Preparar la lista',
          effects: [startQuest('cartagena-market-supplies'), encounter('cartagena-quantity')],
        },
        close,
      ],
    },
    {
      id: 'cartagena-quantity-finished',
      npcId: 'mar',
      text: 'Mar guarda la lista en tu cuaderno. Señala el café del intercambio, a unos pasos del mercado.',
      choices: [{ id: 'cartagena-go-to-cafe', label: 'Ir al café', effects: enterCafe }, close],
    },
    {
      id: 'cartagena-prices-intro',
      title: 'Menú del café',
      text: 'Sam ve el código COP en el tablero. Los precios de este menú están en pesos colombianos. Compáralos antes de elegir.',
      choices: [
        {
          id: 'cartagena-start-prices',
          label: 'Comparar precios',
          effects: [startQuest('cartagena-compare-menu'), encounter('cartagena-prices')],
        },
        close,
      ],
    },
    {
      id: 'cartagena-prices-finished',
      npcId: 'sam',
      text: 'Ya sabes cuáles opciones caben en el presupuesto. Alba nos espera junto a la mesa.',
      choices: [close],
    },
    {
      id: 'cartagena-order-intro',
      npcId: 'alba',
      text: 'Alba te acompaña a la mesa de tres. Si necesitas escuchar su pregunta otra vez, puedes pedírselo en inglés.',
      line: { en: 'What would you like?', es: '¿Qué quisieras pedir?' },
      canRepair: true,
      choices: [
        {
          id: 'cartagena-start-order',
          label: 'Pedir en la mesa',
          effects: [startQuest('cartagena-table-for-three'), encounter('cartagena-order')],
        },
        close,
      ],
    },
    {
      id: 'cartagena-order-finished',
      npcId: 'alba',
      text: 'Ya pediste y revisaste la cuenta. Alba te invita al encuentro de la tarde en la terraza de la bahía, donde podrás usar otro menú.',
      choices: [
        {
          id: 'cartagena-go-to-seaside',
          label: 'Ir a la terraza junto al mar',
          effects: enterSeaside,
        },
        close,
      ],
    },
    {
      id: 'cartagena-transfer-intro',
      npcId: 'alba',
      text: 'Hay opciones y precios distintos en esta mesa. Decide qué pedir a partir del nuevo menú y de los gustos de tus compañeros.',
      line: { en: 'Can I help you?', es: '¿Te puedo ayudar?' },
      canRepair: true,
      choices: [
        {
          id: 'cartagena-start-transfer',
          label: 'Hacer un nuevo pedido',
          effects: [startQuest('cartagena-meal-by-the-sea'), encounter('cartagena-transfer')],
        },
        close,
      ],
    },
    {
      id: 'cartagena-postcard',
      npcId: 'alba',
      text: 'Alba dejó una postal sobre la mesa. Al reverso hay una invitación a visitar un mercado durante tu próxima parada: Cusco, Perú.',
      choices: [
        {
          id: 'cartagena-take-postcard',
          label: 'Guardar la postal para Cusco',
          requires: [pending(postcardRead)],
          effects: [
            startQuest('cartagena-meal-by-the-sea'),
            { type: 'event', id: 'cartagena-postcard-read' },
            { type: 'closeDialogue' },
          ],
        },
        close,
      ],
    },
  ],
  encounters: [
    {
      id: 'cartagena-likes',
      missionId: 'cartagena-likes',
      npcId: 'mar',
      onFinish: [dialogue('cartagena-likes-finished')],
    },
    {
      id: 'cartagena-quantity',
      missionId: 'cartagena-quantity',
      npcId: 'sam',
      onFinish: [dialogue('cartagena-quantity-finished')],
    },
    {
      id: 'cartagena-prices',
      missionId: 'cartagena-prices',
      npcId: 'sam',
      onFinish: [dialogue('cartagena-prices-finished')],
    },
    {
      id: 'cartagena-order',
      missionId: 'cartagena-order',
      npcId: 'alba',
      onFinish: [dialogue('cartagena-order-finished')],
    },
    {
      id: 'cartagena-transfer',
      missionId: 'cartagena-transfer',
      npcId: 'alba',
      onFinish: [dialogue('cartagena-postcard')],
    },
  ],
} satisfies StoryDefinition;
