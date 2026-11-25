import type { ScenarioDefinition } from '@lingoquest/course-pack';

type Item = ScenarioDefinition['menu'][number];
type Unit = NonNullable<Item['units']>[number];
type Modifier = NonNullable<Item['modifiers']>[number];

const pair = (en: string, es: string) => ({ en, es });
const rice: Modifier = { id: 'rice', label: pair('rice', 'arroz'), aliases: ['rice'] };
const bread: Modifier = { id: 'bread', label: pair('bread', 'pan'), aliases: ['bread'] };
const onions: Modifier = {
  id: 'onions',
  label: pair('onions', 'cebolla'),
  aliases: ['onions', 'onion'],
};
const cheese: Modifier = { id: 'cheese', label: pair('cheese', 'queso'), aliases: ['cheese'] };
const cup: Unit = {
  id: 'cup',
  en: 'cup',
  es: 'taza',
  pluralEn: 'cups',
  pluralEs: 'tazas',
  aliases: ['cup', 'cups'],
};
const glass: Unit = {
  id: 'glass',
  en: 'glass',
  es: 'vaso',
  pluralEn: 'glasses',
  pluralEs: 'vasos',
  aliases: ['glass', 'glasses'],
};
const bottle: Unit = {
  id: 'bottle',
  en: 'bottle',
  es: 'botella',
  pluralEn: 'bottles',
  pluralEs: 'botellas',
  aliases: ['bottle', 'bottles'],
};
const plate: Unit = {
  id: 'plate',
  en: 'plate',
  es: 'plato',
  pluralEn: 'plates',
  pluralEs: 'platos',
  aliases: ['plate', 'plates'],
};

function dish(
  id: string,
  main: ReturnType<typeof pair>,
  ingredient: Modifier,
  price: number,
  eligibleModifiers: readonly Modifier[],
): Item {
  return {
    id,
    group: 'dish',
    label: pair(`${main.en} with ${ingredient.label.en}`, `${main.es} con ${ingredient.label.es}`),
    baseLabel: main,
    aliases: [main.en.toLowerCase(), `${main.en.toLowerCase()} with ${ingredient.label.en}`],
    price,
    ingredients: [ingredient.id],
    units: [plate],
    modifiers: eligibleModifiers,
  };
}

function drink(
  id: string,
  label: ReturnType<typeof pair>,
  price: number,
  units: readonly Unit[],
  aliases: readonly string[] = [label.en.toLowerCase()],
): Item {
  return { id, group: 'drink', label, aliases, price, ingredients: [], units };
}

const chicken = pair('Chicken', 'Pollo');
const eggs = pair('Eggs', 'Huevos');
const fish = pair('Fish', 'Pescado');
const cafeItems = [
  {
    ...drink('coffee', pair('Coffee', 'Café'), 5_000, [cup]),
    pluralLabel: pair('coffees', 'cafés'),
    pluralAliases: ['coffees'],
  },
  drink('water', pair('Water', 'Agua'), 3_000, [glass, bottle]),
  dish('eggs-cheese', eggs, cheese, 10_000, [cheese]),
  dish('chicken-rice', chicken, rice, 25_000, [rice, cheese]),
  dish('fish-rice', fish, rice, 30_000, [rice, cheese]),
] as const;
const seaItems = [
  dish('eggs-bread', eggs, bread, 12_000, [bread, onions]),
  dish('chicken-rice', chicken, rice, 22_000, [rice, onions]),
  dish('fish-onions', fish, onions, 28_000, [onions]),
  drink('tea', pair('Tea', 'Té'), 4_000, [cup]),
  drink('orange-juice', pair('Orange juice', 'Jugo de naranja'), 6_000, [glass]),
] as const;
const milk = drink('milk', pair('Milk', 'Leche'), 0, [glass]);
const participants = ['table', 'sam', 'luz'];

export const cartagenaCafeScenario = {
  id: 'cartagena-cafe-table',
  title: pair('Exchange Café Menu', 'Menú del café del intercambio'),
  speaker: 'Alba',
  currency: 'COP',
  budget: 35_000,
  menu: cafeItems,
  knownItems: [milk, ...seaItems.filter(({ group }) => group === 'drink')],
  participants: [
    { id: 'table', name: 'Mesa', noteEs: 'Un plato para compartir y una o dos bebidas.' },
    { id: 'sam', name: 'Sam', noteEs: 'Quiere acompañar el plato con arroz.' },
    { id: 'luz', name: 'Luz', noteEs: 'Prefiere un plato sin queso.' },
  ],
  groups: [
    {
      id: 'dish',
      allowedItemIds: ['chicken-rice', 'fish-rice'],
      quantity: { min: 1, max: 1 },
      participantIds: participants,
      required: true,
      requiredIngredientIds: ['rice'],
      forbiddenIngredientIds: ['cheese'],
    },
    {
      id: 'drink',
      allowedItemIds: ['coffee', 'water'],
      quantity: { min: 1, max: 2 },
      participantIds: participants,
      required: true,
    },
  ],
} satisfies ScenarioDefinition;

export const cartagenaSeaScenario = {
  id: 'cartagena-seaside-table',
  title: pair('Seaside Terrace Menu', 'Menú de la terraza junto al mar'),
  speaker: 'Alba',
  currency: 'COP',
  budget: 34_000,
  menu: seaItems,
  knownItems: [milk, ...cafeItems.filter(({ group }) => group === 'drink')],
  participants: [
    { id: 'table', name: 'Mesa', noteEs: 'Un plato para compartir y una o dos bebidas.' },
    { id: 'sam', name: 'Sam', noteEs: 'Prefiere pollo. No quiere pescado para compartir.' },
    { id: 'luz', name: 'Luz', noteEs: 'Quiere un plato sin cebolla.' },
  ],
  groups: [
    {
      id: 'dish',
      allowedItemIds: ['eggs-bread', 'chicken-rice'],
      quantity: { min: 1, max: 1 },
      participantIds: participants,
      required: true,
      forbiddenIngredientIds: ['onions'],
    },
    {
      id: 'drink',
      allowedItemIds: ['tea', 'orange-juice'],
      quantity: { min: 1, max: 2 },
      participantIds: participants,
      required: true,
    },
  ],
} satisfies ScenarioDefinition;

function printedMenu({ menu, currency }: ScenarioDefinition) {
  return menu
    .map(({ label, price }) => `${label.en} — ${currency} ${price.toLocaleString('en-US')}`)
    .join('\n');
}

export const cartagenaCafeMenu = printedMenu(cartagenaCafeScenario);
export const cartagenaSeaMenu = printedMenu(cartagenaSeaScenario);
