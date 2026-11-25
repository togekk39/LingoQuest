import type { EventScenarioDefinition, TimelineEvent } from '@lingoquest/course-pack';
import { pair } from './cusco-lessons';

const location = (en: string, es: string, ...aliases: string[]) => ({
  label: pair(en, es),
  aliases: [en, ...aliases],
});
const time = (en: string, es: string, numeral: string, period?: 'am' | 'pm') => {
  const values = [en, numeral, `${numeral}:00`, `${en} o'clock`];
  return {
    label: pair(en, es),
    aliases: period ? [...values, ...values.map((value) => `${value} ${period}`)] : values,
  };
};
const market = location('the market', 'el mercado', 'market');
const museum = location('the museum', 'el museo', 'museum');
const entrance = location(
  'the museum entrance',
  'la entrada del museo',
  'the entrance',
  'museum entrance',
);
const shop = location('the museum shop', 'la tienda del museo', 'the shop', 'museum shop');
const all = ['person', 'time', 'place'] as const;
const witness = (personId: string, ...knows: TimelineEvent['visible']) => ({ personId, knows });

function known(
  id: string,
  personId: string,
  minute: number,
  where: TimelineEvent['place'],
  when: TimelineEvent['time'],
  base: string,
  past: string,
  complements: string[],
  en: string,
  es: string,
  object?: TimelineEvent['object'],
): TimelineEvent {
  return {
    id,
    personId,
    date: 'yesterday',
    minute,
    time: when,
    place: where,
    base,
    past,
    complements,
    statement: pair(en, es),
    note: pair(en, es),
    visible: all,
    required: [],
    witnesses: [witness(personId, ...all, ...(object ? (['object'] as const) : []))],
    ...(object && { object }),
  };
}

export const marketTimeline = {
  kind: 'timeline',
  id: 'cusco-market-journal',
  title: pair('My travel journal', 'Mi diario de viaje'),
  subtitle: pair('Cusco · Yesterday', 'Cusco · Ayer'),
  participants: [
    { id: 'sam', name: 'Sam', noteEs: 'Estuvo en el mercado con el grupo.' },
    { id: 'luz', name: 'Luz', noteEs: 'Compró pan en el mercado.' },
    { id: 'diego', name: 'Diego', noteEs: 'Se encontró con el grupo en el mercado.' },
  ],
  events: [
    known(
      'market',
      'sam',
      540,
      market,
      time('nine', 'nueve de la mañana', '9', 'am'),
      'go',
      'went',
      ['to the market'],
      'Sam went to the market.',
      'Sam fue al mercado.',
    ),
    known(
      'bread',
      'luz',
      600,
      market,
      time('ten', 'diez de la mañana', '10', 'am'),
      'buy',
      'bought',
      ['bread', 'some bread'],
      'Luz bought bread.',
      'Luz compró pan.',
      location('bread', 'pan'),
    ),
    {
      ...known(
        'photo',
        'luz',
        660,
        market,
        time('eleven', 'once de la mañana', '11', 'am'),
        'take',
        'took',
        ['the photo', 'a photo', 'a picture', 'the picture'],
        'Luz took a photo.',
        'Luz sacó una foto.',
      ),
      note: pair('Photo · 10:00 a.m.', 'Foto · La nota dice 10:00 a. m.'),
      visible: ['place'],
      required: ['person', 'time'],
      witnesses: [witness('sam', 'person'), witness('luz', ...all), witness('diego', 'time')],
    },
    known(
      'lunch',
      'diego',
      720,
      market,
      time('noon', 'doce del día', '12', 'pm'),
      'eat',
      'ate',
      ['lunch'],
      'Diego ate lunch.',
      'Diego almorzó.',
    ),
  ],
} satisfies EventScenarioDefinition;

export const museumTimeline = {
  kind: 'timeline',
  id: 'cusco-museum-journal',
  title: pair('The museum journal', 'El diario del museo'),
  subtitle: pair('Cusco · Yesterday afternoon', 'Cusco · Ayer por la tarde'),
  participants: [
    { id: 'nora', name: 'Nora', noteEs: 'Recibió al grupo en el museo.' },
    { id: 'diego', name: 'Diego', noteEs: 'Entró al museo después de almorzar.' },
    { id: 'ana', name: 'Ana', noteEs: 'Vio a Nora en el museo.' },
  ],
  events: [
    known(
      'visit',
      'diego',
      840,
      museum,
      time('two', 'dos de la tarde', '2', 'pm'),
      'visit',
      'visited',
      ['the museum'],
      'Diego visited the museum.',
      'Diego visitó el museo.',
    ),
    {
      ...known(
        'sighting',
        'ana',
        900,
        entrance,
        time('three', 'tres de la tarde', '3', 'pm'),
        'see',
        'saw',
        ['nora'],
        'Ana saw Nora.',
        'Ana vio a Nora.',
      ),
      note: pair('Ana · Nora · the shop', 'Ana vio a Nora. La nota dice que fue en la tienda.'),
      visible: ['person'],
      required: ['time', 'place'],
      witnesses: [
        witness('nora', 'person', 'place'),
        witness('ana', ...all),
        witness('diego', 'time'),
      ],
    },
    known(
      'departure',
      'nora',
      960,
      museum,
      time('four', 'cuatro de la tarde', '4', 'pm'),
      'leave',
      'left',
      ['the museum'],
      'Nora left the museum.',
      'Nora salió del museo.',
    ),
  ],
} satisfies EventScenarioDefinition;

export const cuscoLocations = { market, museum, entrance, shop };
