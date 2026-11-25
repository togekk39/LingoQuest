import type { Translation } from '@lingoquest/contracts';
import type { RpgFormalDefinition } from '@lingoquest/course-pack';
import type { PrerequisiteReference } from '../../packages/course-pack/src/prerequisites';
import { homeFoundationLearningDefinitions } from './home-foundation';
import { form, grammar, mexicoLearningDefinitions, studyPattern } from './mexico-prerequisites';
import { numberLearningId, travelNumberWords } from './travel-number-words';

const definitions = new Map<string, RpgFormalDefinition>();
const existingDefinitions = new Map(
  [...mexicoLearningDefinitions, ...homeFoundationLearningDefinitions].map((entry) => [
    entry.id,
    entry,
  ]),
);

function define(
  id: string,
  kind: RpgFormalDefinition['kind'],
  labelEs: string,
  examples: Translation[],
  forms: string[],
) {
  if (definitions.has(id)) throw new Error(`Duplicate Cartagena definition ${id}`);
  definitions.set(id, { id, kind, labelEs, forms, examples });
}

function lexical(id: string, en: string, es: string, moreForms: [string, string][] = []) {
  const forms = [{ en, es }, ...moreForms.map(([en, es]) => ({ en, es }))];
  define(
    id,
    'lexical',
    es,
    forms,
    forms.map(({ en }) => en),
  );
  return form(id, en);
}

function earlierForm(id: string, en?: string) {
  const entry = existingDefinitions.get(id);
  if (!entry) throw new Error(`Missing reviewed definition ${id}`);
  definitions.set(entry.id, entry);
  return en === undefined ? grammar(id) : form(id, en);
}

function pattern(name: string, template: string, en: string, es: string) {
  const id = `pattern.cartagena.${name}`;
  define(id, 'pattern', es, [{ en, es }], [template]);
  return form(id, template);
}

function rule(name: string, labelEs: string, examples: Translation[]) {
  const id = `grammar.cartagena.${name}`;
  define(id, 'grammar', labelEs, examples, []);
  return grammar(id);
}

export const cartagenaLessonIds = {
  likes: 'u03_l01',
  quantity: 'u03_l02',
  prices: 'u08_l01',
  order: 'u08_l01',
} as const;

export const cartagenaRefs = {
  i: form('lex.u01_l01_v04', 'I'),
  you: form('lex.u01_l01_v05', 'you'),
  she: form('form.u02_l02.12', 'she'),
  he: form('form.u02_l02.13', 'he'),
  we: form('form.u06_l01.2', 'we'),
  it: earlierForm('lex.home.it', 'it'),
  they: earlierForm('lex.home.they', 'they'),
  a: earlierForm('lex.home.a', 'a'),
  an: earlierForm('lex.home.an', 'an'),
  the: form('home.article-word', 'the'),
  this: earlierForm('lex.home.this', 'this'),
  is: form('form.u01_l03.5', 'is'),
  are: form('form.u01_l03.6', 'are'),
  its: form('form.u01_l03.7', "it's"),
  theyre: form('form.u01_l03.8', "they're"),
  and: form('form.u01_l03.3', 'and'),
  but: lexical('lex.conjunction.but', 'but', 'pero, para contrastar dos ideas'),
  or: earlierForm('lex.conjunction.or', 'or'),
  with: form('lex.u04_l04_v06', 'with'),
  without: lexical('lex.food.without-ingredient', 'without', 'sin, para quitar un ingrediente'),
  of: lexical('lex.quantity.of', 'of', 'de, entre una medida y lo que contiene'),
  in: form('form.u02_l01.1', 'in'),
  like: form('lex.u03_l01_v01', 'like'),
  likes: form('form.u03_l01.3', 'likes'),
  want: form('lex.u03_l02_v05', 'want'),
  do: form('form.u03_l01.1', 'do'),
  does: form('form.u03_l01.2', 'does'),
  dont: form('form.u03_l02.3', "don't"),
  doesnt: form('form.u03_l02.4', "doesn't"),
  dontLong: form('form.u03_l02.1', 'do not'),
  doesntLong: form('form.u03_l02.2', 'does not'),
  yes: form('lex.u01_l04_v05', 'yes'),
  no: form('lex.u01_l04_v06', 'no'),
  yesIDo: form('form.u03_l01.4', 'Yes, I do.'),
  noIDont: lexical('lex.preferences.no-i-dont', "No, I don't.", 'No, no me gusta.'),
  yesSheDoes: form('form.u03_l01.5', 'Yes, she does.'),
  noSheDoesnt: lexical(
    'lex.preferences.no-she-doesnt',
    "No, she doesn't.",
    'No, a ella no le gusta.',
  ),
  have: form('form.u08_l01.4', 'have'),
  need: lexical('lex.quantity.need', 'need', 'necesitar', [['needs', 'necesita, con he o she']]),
  needs: form('lex.quantity.need', 'needs'),
  please: form('lex.u03_l03_v04', 'please'),
  thankYou: earlierForm('lex.home.thank-you', 'Thank you'),
  rice: form('lex.u03_l01_v05', 'rice'),
  bread: form('lex.u03_l02_v02', 'bread'),
  chicken: lexical('lex.food.chicken-meat', 'chicken', 'pollo, como alimento'),
  chickenAnimal: lexical('lex.animal.chicken', 'a chicken', 'un pollo, el animal entero'),
  fish: lexical('lex.food.fish', 'fish', 'pescado, como alimento'),
  meat: form('lex.u03_l02_v03', 'meat'),
  egg: lexical('published.colombia.card-1.word-1', 'egg', 'huevo'),
  eggs: lexical('form.food.egg.plural', 'eggs', 'huevos'),
  cheese: lexical('lex.food.cheese', 'cheese', 'queso'),
  fruit: form('lex.u03_l01_v06', 'fruit'),
  vegetable: lexical('lex.food.vegetable', 'vegetable', 'verdura', [['vegetables', 'verduras']]),
  vegetables: form('lex.food.vegetable', 'vegetables'),
  bean: lexical('lex.food.bean', 'bean', 'un frijol', [['beans', 'frijoles']]),
  beans: form('lex.food.bean', 'beans'),
  water: form('lex.u02_l01_v06', 'water'),
  milk: form('lex.u03_l02_v01', 'milk'),
  coffee: form('lex.u03_l01_v02', 'coffee'),
  coffees: lexical(
    'lex.food.coffee-serving',
    'coffees',
    'cafés, es decir tazas o porciones en un pedido',
    [['a coffee', 'un café, una porción']],
  ),
  aCoffee: form('lex.food.coffee-serving', 'a coffee'),
  tea: form('lex.u03_l01_v03', 'tea'),
  juice: form('lex.u03_l02_v04', 'juice'),
  orangeJuice: lexical('published.colombia.card-1.word-5', 'orange juice', 'jugo de naranja'),
  apple: lexical('lex.food.apple', 'apple', 'manzana', [['apples', 'manzanas']]),
  apples: form('lex.food.apple', 'apples'),
  banana: lexical('lex.food.banana', 'banana', 'banano', [['bananas', 'bananos']]),
  bananas: form('lex.food.banana', 'bananas'),
  orange: lexical('lex.food.orange', 'orange', 'naranja', [['oranges', 'naranjas']]),
  oranges: form('lex.food.orange', 'oranges'),
  onion: lexical('lex.food.onion', 'onion', 'cebolla', [['onions', 'cebollas']]),
  onions: form('lex.food.onion', 'onions'),
  arepa: lexical('lex.food.arepa', 'arepa', 'arepa, una torta plana de maíz', [
    ['arepas', 'arepas de maíz'],
  ]),
  arepas: form('lex.food.arepa', 'arepas'),
  coconutRice: lexical('lex.food.coconut-rice', 'coconut rice', 'arroz con coco'),
  friedFish: lexical('lex.food.fried-fish', 'fried fish', 'pescado frito'),
  patacones: lexical('lex.food.patacon', 'patacones', 'patacones, plátano verde aplanado y frito'),
  lemonade: lexical('lex.food.lemonade', 'lemonade', 'limonada'),
  aLemonade: lexical('published.colombia.card-1.word-3', 'a lemonade', 'una limonada, una porción'),
  glass: lexical('lex.portion.glass', 'glass', 'vaso', [['glasses', 'vasos']]),
  glasses: form('lex.portion.glass', 'glasses'),
  aGlassOf: form('lex.u08_l01_v02', 'a glass of'),
  cup: form('lex.u05_l02_v03', 'cup'),
  cups: lexical('form.portion.cup.plural', 'cups', 'tazas'),
  bottle: lexical('lex.portion.bottle', 'bottle', 'botella', [['bottles', 'botellas']]),
  bottles: form('lex.portion.bottle', 'bottles'),
  piece: lexical('lex.portion.piece', 'piece', 'pedazo o porción', [
    ['pieces', 'pedazos o porciones'],
  ]),
  pieces: form('lex.portion.piece', 'pieces'),
  some: lexical('lex.quantity.some', 'some', 'algo de o algunos, en cantidades no especificadas'),
  someWater: lexical(
    'published.colombia.card-1.word-2',
    'some water',
    'un poco de agua; agua sin especificar cuánto',
  ),
  any: lexical('lex.quantity.any', 'any', 'algo de o algún, en preguntas de disponibilidad'),
  howMany: lexical(
    'lex.quantity.how-many',
    'how many',
    'cuántos o cuántas, con cosas que puedes contar',
  ),
  howMuch: lexical(
    'lex.quantity.how-much',
    'how much',
    'cuánto, con una cantidad sin unidades contables',
  ),
  howMuchPrice: lexical(
    'lex.price.how-much',
    'how much',
    'cuánto cuesta, cuando preguntas un precio',
  ),
  price: lexical('lex.price.price', 'price', 'precio, lo que pagas por algo'),
  cost: lexical('lex.price.cost', 'cost', 'costar', [
    ['costs', 'cuesta, con un producto en singular'],
  ]),
  costs: form('lex.price.cost', 'costs'),
  total: lexical('lex.price.total', 'total', 'total, lo que cuestan todos los productos juntos'),
  too: lexical('lex.price.too', 'too', 'demasiado, antes de un adjetivo'),
  expensive: lexical('lex.price.expensive', 'expensive', 'caro o costoso'),
  hundred: lexical('lex.number.hundred', 'hundred', 'cien o cientos, en un número compuesto'),
  thousand: lexical('lex.number.thousand', 'thousand', 'mil o miles, en un número compuesto'),
  peso: lexical('lex.currency.colombian-peso', 'peso', 'peso, la moneda de Colombia en este menú', [
    ['pesos', 'pesos'],
    ['Colombian pesos', 'pesos colombianos'],
  ]),
  pesos: form('lex.currency.colombian-peso', 'pesos'),
  colombianPesos: form('lex.currency.colombian-peso', 'Colombian pesos'),
  cop: lexical('lex.currency.cop', 'COP', 'código de la moneda colombiana en el menú'),
  dollar: lexical('lex.currency.dollar', 'dollar', 'dólar, en los ejemplos con USD'),
  dollars: earlierForm('lex.home.dollars', 'dollars'),
  cent: lexical('lex.currency.cent', 'cent', 'centavo', [['cents', 'centavos']]),
  cents: form('lex.currency.cent', 'cents'),
  menu: form('lex.u08_l01_v03', 'menu'),
  bill: lexical('lex.food.bill', 'bill', 'cuenta del restaurante, común en inglés británico'),
  check: form('lex.u08_l01_v04', 'check'),
  usd: lexical('lex.currency.usd', 'USD', 'código del dólar estadounidense'),
  were: form('form.u06_l01.3', "we're"),
  weAre: lexical('form.be.we-are', 'we are', 'estamos o somos, con we'),
  noOnions: lexical('lex.food.no-onions', 'no onions', 'sin cebolla, en un pedido'),
  eggArepas: lexical('lex.food.egg-arepa', 'egg arepas', 'arepas con huevo', [
    ['egg arepa', 'arepa con huevo'],
  ]),
  eggArepa: form('lex.food.egg-arepa', 'egg arepa'),

  idLike: form('form.u08_l01.2', "I'd like"),
  wouldLike: form('lex.u08_l01_v01', 'would like'),
  can: form('form.u03_l03.1', 'can'),
  canIHave: lexical('lex.food.can-i-have', 'Can I have', '¿Me da…?, para pedir algo'),
  couldIHave: lexical(
    'lex.food.could-i-have',
    'Could I have',
    '¿Me podría dar…?, otra manera de pedir algo',
  ),
  canISee: lexical('lex.food.can-i-see', 'Can I see', '¿Puedo ver…?, para pedir el menú'),
  whatWouldYouLike: lexical(
    'lex.food.what-would-you-like',
    'What would you like?',
    '¿Qué quisiera pedir?',
  ),
  anythingElse: lexical('lex.food.anything-else', 'Anything else?', '¿Algo más?'),
  thatsAll: lexical('lex.food.thats-all', "That's all", 'Eso es todo'),
  thats: lexical('form.be.thats', "that's", 'eso es, forma breve de that is'),
  thatsRight: lexical(
    'lex.conversation.thats-right',
    "That's right",
    'Así es, para confirmar un dato',
  ),
  yesPlease: lexical('lex.conversation.yes-please', 'Yes, please', 'Sí, por favor'),
  noThankYou: lexical('lex.conversation.no-thank-you', 'No, thank you', 'No, gracias'),
  isThere: lexical('lex.food.is-there', 'Is there', '¿Hay…?, para preguntar por un ingrediente'),
  table: form('lex.u05_l02_v06', 'table'),
  for: lexical('lex.quantity.for', 'for', 'para, al indicar el número de personas'),
  toGo: lexical('published.colombia.card-1.word-4', 'to go', 'para llevar'),
  outOf: lexical('lex.food.out-of', 'out of', 'sin existencias de un producto'),
  instead: lexical('lex.food.instead', 'instead', 'en lugar de lo anterior'),
  change: lexical('lex.food.change-order', 'change', 'cambiar un pedido'),
  repeat: earlierForm('lex.home.can-you-repeat-that-please', 'Can you repeat that, please?'),
  slowly: earlierForm(
    'lex.home.can-you-speak-more-slowly-please',
    'Can you speak more slowly, please?',
  ),
  mean: earlierForm('lex.home.what-does-that-mean', 'What does that mean?'),
};

const numberRefs = new Map<number, PrerequisiteReference>(
  travelNumberWords.map(([value, en]) => [value, earlierForm(numberLearningId(value), en)]),
);
for (const [value, en, es] of [
  [22, 'twenty-two', 'veintidós'],
  [25, 'twenty-five', 'veinticinco'],
  [28, 'twenty-eight', 'veintiocho'],
] as const) {
  numberRefs.set(value, lexical(numberLearningId(value), en, es));
}

export function cartagenaNumbers(...values: number[]) {
  return values.map((value) => {
    const target = numberRefs.get(value);
    if (!target) throw new Error(`Missing Cartagena number form ${value}`);
    return target;
  });
}

export const cartagenaPatterns = {
  like: studyPattern('u02_l01', 'habit'),
  youLike: studyPattern('u03_l01', 'you'),
  thirdPerson: studyPattern('u02_l02', 'habit'),
  question: studyPattern('u03_l01', 'question'),
  negative: studyPattern('u03_l02', 'negative'),
  preferences: pattern(
    'preferences',
    'like / likes + comida o bebida',
    'She likes rice, but I like bread.',
    'A ella le gusta el arroz, pero a mí me gusta el pan.',
  ),
  article: pattern(
    'a-an',
    'a / an + alimento singular',
    'An egg. A banana.',
    'Un huevo. Un banano.',
  ),
  plural: pattern('plural', 'número + alimento en plural', 'Three eggs.', 'Tres huevos.'),
  countable: pattern(
    'countable',
    'número + medida + of + alimento',
    'Two bottles of water.',
    'Dos botellas de agua.',
  ),
  someAny: pattern(
    'some-any',
    'some en un pedido / any en una pregunta',
    'Do you have any eggs? I need some water.',
    '¿Tienen huevos? Necesito agua.',
  ),
  howMany: pattern(
    'how-many',
    'How many + sustantivo contable plural?',
    'How many eggs?',
    '¿Cuántos huevos?',
  ),
  howMuch: pattern(
    'how-much-quantity',
    'How much + sustantivo no contable?',
    'How much water?',
    '¿Cuánta agua?',
  ),
  priceQuestion: pattern(
    'price-question',
    'How much + is / are + producto?',
    'How much are the eggs?',
    '¿Cuánto cuestan los huevos?',
  ),
  priceAnswer: pattern(
    'price-answer',
    'It is / They are + número + moneda',
    "It's five thousand pesos.",
    'Son cinco mil pesos.',
  ),
  pesos: pattern(
    'pesos',
    'número + thousand + pesos',
    'Twenty-five thousand pesos.',
    'Veinticinco mil pesos.',
  ),
  order: studyPattern('u08_l01', 'request'),
  canHave: pattern(
    'request-can-have',
    'Can / Could I have + pedido (+ please)?',
    'Can I have the menu, please?',
    '¿Me da el menú, por favor?',
  ),
  confirm: pattern(
    'confirm',
    'Yes / No + detalle o cierre cortés',
    "That's right. That's all, thank you.",
    'Así es. Eso es todo, gracias.',
  ),
  check: pattern(
    'check',
    'Can I have + the check / the bill + please?',
    'Can I have the check, please?',
    '¿Me da la cuenta, por favor?',
  ),
  repair: studyPattern('u03_l03', 'request'),
  replace: pattern(
    'replace',
    'pedido + instead / pedido + without + ingrediente',
    "I'd like chicken with rice instead.",
    'Quisiera pollo con arroz en su lugar.',
  ),
};

export const cartagenaGrammar = {
  present: grammar('grammar.routine_base'),
  thirdPerson: grammar('grammar.routine_third_person'),
  question: grammar('grammar.do_questions'),
  negative: grammar('grammar.dont'),
  numberAgreement: earlierForm('grammar.home.one-or-many'),
  quantity: rule('quantity', 'Distinguir unidades de cantidades al hablar de comida', [
    {
      en: 'How many bottles of water? How much water?',
      es: '¿Cuántas botellas de agua? ¿Cuánta agua?',
    },
  ]),
  price: rule('price', 'Preguntar o decir el precio de uno o más productos', [
    {
      en: "How much is the coffee? It's five thousand pesos.",
      es: '¿Cuánto cuesta el café? Cuesta cinco mil pesos.',
    },
  ]),
  order: grammar('grammar.would_like'),
  repair: grammar('grammar.can'),
};

export const cartagenaLearningDefinitions = [...definitions.values()];
