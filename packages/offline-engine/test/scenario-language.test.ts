import assert from 'node:assert/strict';
import test from 'node:test';
import { exactRpgAnswerEvidence, rpgAnswerTargets } from '../src/rpg-answer-evidence';
import { parseScenarioLanguage } from '../src/scenario-language';
import type { ScenarioDefinition } from '../src/scenario';
import type { TravelExerciseStep } from '../src/travel-content';

const table: ScenarioDefinition = {
  id: 'test-cafe',
  title: { en: 'Café menu', es: 'Menú del café' },
  speaker: 'Alba',
  currency: 'COP',
  participants: [{ id: 'sam', name: 'Sam', noteEs: 'Pedido de Sam.' }],
  groups: [
    {
      id: 'dish',
      allowedItemIds: ['chicken'],
      quantity: { min: 1, max: 2 },
      participantIds: ['sam'],
    },
    {
      id: 'drink',
      allowedItemIds: ['coffee', 'water'],
      quantity: { min: 1, max: 3 },
      participantIds: ['sam'],
    },
  ],
  menu: [
    {
      id: 'chicken',
      group: 'dish',
      label: { en: 'Chicken with rice', es: 'Pollo con arroz' },
      baseLabel: { en: 'Chicken', es: 'Pollo' },
      aliases: ['chicken'],
      price: 18000,
      ingredients: ['rice'],
      modifiers: [{ id: 'rice', aliases: ['rice'], label: { en: 'rice', es: 'arroz' } }],
    },
    {
      id: 'coffee',
      group: 'drink',
      label: { en: 'Coffee', es: 'Café' },
      aliases: ['coffee'],
      pluralAliases: ['coffees'],
      price: 5000,
      ingredients: [],
      units: [
        { id: 'cup', en: 'cup', es: 'taza', pluralEn: 'cups', pluralEs: 'tazas', aliases: ['cup'] },
      ],
    },
    {
      id: 'water',
      group: 'drink',
      label: { en: 'Water', es: 'Agua' },
      aliases: ['water'],
      price: 3000,
      ingredients: [],
    },
  ],
  knownItems: [
    {
      id: 'milk',
      group: 'drink',
      label: { en: 'Milk', es: 'Leche' },
      aliases: ['milk'],
      price: 0,
      ingredients: [],
    },
  ],
};

test('parses taught request frames, quantity forms, and order variations', () => {
  for (const [source, form] of [
    ["I'd like", 'would-like'],
    ['I would like', 'would-like'],
    ['Can I have', 'can-have'],
    ['Could I please have', 'could-have'],
  ]) {
    const answer = `Please, ${source} 2 cups of coffee, and chicken with rice for Sam.`;
    assert.deepEqual(parseScenarioLanguage(table, 'request', answer), {
      kind: 'parsed',
      form,
      lines: [
        { itemId: 'coffee', quantity: 2, quantitySpecified: true, unit: 'cup' },
        { itemId: 'chicken', quantity: 1, participantId: 'sam' },
      ],
    });
  }
  assert.deepEqual(parseScenarioLanguage(table, 'request', 'I’d like two coffees, please.'), {
    kind: 'parsed',
    form: 'would-like',
    lines: [{ itemId: 'coffee', quantity: 2, quantitySpecified: true }],
  });
  assert.deepEqual(parseScenarioLanguage(table, 'menu', 'Can I see the menu, please?'), {
    kind: 'parsed',
    form: 'can-see',
  });
  assert.deepEqual(parseScenarioLanguage(table, 'menu', 'Can I have the menu, please?'), {
    kind: 'parsed',
    form: 'can-have',
  });
});

test('separates negation, ingredients, out-of-menu nouns and uncertain input', () => {
  assert.deepEqual(parseScenarioLanguage(table, 'request', "I don't want chicken."), {
    kind: 'context_mismatch',
  });
  assert.deepEqual(parseScenarioLanguage(table, 'request', "I'd like chicken without rice."), {
    kind: 'parsed',
    form: 'would-like',
    lines: [
      {
        itemId: 'chicken',
        quantity: 1,
        modifiers: [{ operation: 'without', ingredientId: 'rice' }],
      },
    ],
  });
  assert.deepEqual(parseScenarioLanguage(table, 'request', "I'd like two coffee."), {
    kind: 'incorrect',
    error: 'countability',
  });
  assert.deepEqual(parseScenarioLanguage(table, 'request', "I'd like a cups of coffee."), {
    kind: 'incorrect',
    error: 'countability',
  });
  assert.deepEqual(
    parseScenarioLanguage(table, 'request', "I'd like water and something Alba recommended."),
    { kind: 'ungradable' },
  );
  assert.deepEqual(parseScenarioLanguage(table, 'request', "I'd like some milk."), {
    kind: 'parsed',
    form: 'would-like',
    lines: [{ itemId: 'milk', quantity: 1 }],
  });
  assert.deepEqual(parseScenarioLanguage(table, 'request', "I'd like some water for Ana."), {
    kind: 'context_mismatch',
  });
});

test('replacement identifies both lines without retaining a stale unit', () => {
  const result = parseScenarioLanguage(
    table,
    'replace',
    'Could I have water, instead of a cup of coffee, please?',
  );
  assert.deepEqual(result, {
    kind: 'parsed',
    form: 'could-have',
    lines: [{ itemId: 'water', quantity: 1 }],
    replacement: { itemId: 'coffee', quantity: 1, quantitySpecified: true, unit: 'cup' },
  });
  assert.deepEqual(parseScenarioLanguage(table, 'replace', 'Can I have water?'), {
    kind: 'incorrect',
    error: 'replacement_form',
  });
  assert.deepEqual(parseScenarioLanguage(table, 'bill', 'Can I have the menu?'), {
    kind: 'context_mismatch',
  });
});

test('mapped static evidence keeps successful variants and unknown responses separate', () => {
  const target = { targetId: 'pattern.request.see', dimension: 'writing' } as const;
  const alternative = { targetId: 'pattern.request.have', dimension: 'writing' } as const;
  const see = 'Can I see the menu, please?';
  const have = 'Can I have the menu, please?';
  const exercise: TravelExerciseStep = {
    id: 'test-menu',
    type: 'exercise',
    situation: 'Pide ver el menú.',
    exercise: {
      id: 'test-menu',
      type: 'short_text',
      promptEs: 'Pide ver el menú.',
      acceptedAnswers: [see, have],
      skillId: 'grammar.can',
      difficulty: 1,
      dimension: 'grammar_production',
      vocabularyIds: [],
      feedbackEs: 'Practica una petición cortés.',
    },
    targets: [target, alternative],
    answerEvidence: [
      { answers: [see], targets: [target] },
      { answers: [have], targets: [alternative] },
    ],
  };
  assert.equal(exactRpgAnswerEvidence(exercise), true);
  assert.deepEqual(rpgAnswerTargets(exercise, { text: 'can i see the menu please?' }, 'target'), [
    target,
  ]);
  assert.deepEqual(rpgAnswerTargets(exercise, { text: have }, 'target'), [alternative]);
  assert.deepEqual(rpgAnswerTargets(exercise, { text: 'Would they have rice?' }, 'ungradable'), []);
  assert.equal(
    exactRpgAnswerEvidence({ ...exercise, answerEvidence: [exercise.answerEvidence![0]] }),
    false,
  );
});
