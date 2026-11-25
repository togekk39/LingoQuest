import assert from 'node:assert/strict';
import test from 'node:test';
import { cartagenaAssessmentSteps } from '../../../content/source/cartagena-assessments';
import {
  cartagenaCafeScenario,
  cartagenaSeaScenario,
} from '../../../content/source/cartagena-scenarios';
import {
  evaluateScenarioTurn,
  scenarioStateSchema,
  startScenario,
  type ScenarioDefinition,
  type ScenarioState,
  type ScenarioTurn,
} from '../src/scenario';
import { emptyTravel, updateTravel, type TravelOperation } from '../src/travel';
import type { TravelChapter } from '../src/travel-content';

const target = (targetId: string) => ({ targetId, dimension: 'writing' as const });
const see = target('pattern.fixture.see');
const have = target('pattern.fixture.have');
const could = target('pattern.fixture.could');
const would = target('pattern.fixture.would');
const instead = target('pattern.fixture.instead-of');

const menu: ScenarioTurn = {
  action: 'menu',
  targetForms: ['can-see', 'can-have'],
  formTargets: [
    { form: 'can-see', targets: [see] },
    { form: 'can-have', targets: [have] },
  ],
};
const request: ScenarioTurn = {
  action: 'request',
  targetForms: ['would-like'],
  formTargets: [{ form: 'would-like', targets: [would] }],
};
const replace: ScenarioTurn = {
  action: 'replace',
  targetForms: ['would-like', 'can-have', 'could-have'],
  formTargets: [
    { form: 'would-like', targets: [would, instead] },
    { form: 'can-have', targets: [have, instead] },
    { form: 'could-have', targets: [could, instead] },
  ],
};
const confirm: ScenarioTurn = { action: 'confirm', targetForms: ['confirm'] };
const finish: ScenarioTurn = { action: 'finish', targetForms: ['finish'] };
const check: ScenarioTurn = { action: 'bill', targetForms: ['price', 'can-have'] };

function conversation(definition: ScenarioDefinition) {
  let state = startScenario(definition);
  return {
    turn(turn: ScenarioTurn, answer: string) {
      const previous = JSON.stringify(state);
      const result = evaluateScenarioTurn(definition, state, turn, answer);
      assert.equal(JSON.stringify(state), previous);
      if (result.state) state = scenarioStateSchema.parse(JSON.parse(JSON.stringify(result.state)));
      return result;
    },
    read: (): ScenarioState => state,
  };
}

test('a confirmed café order keeps the diner and exact quantities through a drink change', () => {
  const player = conversation(cartagenaCafeScenario);
  assert.deepEqual(player.turn(menu, 'Can I see the menu, please?').verdict.targets, [see]);
  const choice = "I'd like two cups of coffee for Sam and chicken with rice, no cheese, please.";
  const order = player.turn(request, choice);
  assert.equal(order.verdict.outcome, 'target');
  assert.deepEqual(order.verdict.targets, [would]);
  assert.match(
    order.reply!.line.en,
    /2 cups of coffee for Sam and chicken with rice without cheese/,
  );
  const selection = player.read().lines;
  assert.equal(player.turn(request, choice).verdict.outcome, 'context_mismatch');
  assert.deepEqual(player.read().lines, selection);
  assert.equal(player.turn(confirm, "That's right.").state?.phase, 'confirmed');

  const missingReplacement = player.turn(replace, 'Could I have water?');
  assert.equal(missingReplacement.verdict.error, 'replacement_form');
  assert.deepEqual(missingReplacement.verdict.targets, [instead]);
  const malformedRequest = player.turn(replace, 'Could I has water instead of coffee?');
  assert.equal(malformedRequest.verdict.error, 'request_form');
  assert.deepEqual(malformedRequest.verdict.targets, [could]);
  assert.equal(
    player.turn(replace, 'Can I have something refreshing instead of coffee?').verdict.outcome,
    'ungradable',
  );
  assert.deepEqual(player.read().lines, selection);

  const updated = player.turn(replace, 'Can I have water instead of coffee?');
  assert.equal(updated.state?.phase, 'selected');
  assert.deepEqual(updated.verdict.targets, [have, instead]);
  assert.match(updated.reply!.line.en, /2 portions of water for Sam/);
  assert.deepEqual(updated.state?.changes, [
    {
      before: selection[0],
      after: {
        itemId: 'water',
        quantity: 2,
        participantId: 'sam',
      },
    },
  ]);
  assert.equal(
    player.turn(replace, 'Can I have water instead of coffee?').verdict.outcome,
    'context_mismatch',
  );
  assert.equal(player.read().changes.length, 1);
  assert.equal(player.turn(confirm, 'Yes, that is right.').state?.phase, 'confirmed');
  assert.equal(player.turn(finish, "That's all, thank you.").state?.phase, 'closed');
  const bill = player.turn(check, 'How much is the total?');
  assert.equal(bill.state?.total, 31_000);
  assert.match(bill.reply!.line.en, /COP 31,000/);
  assert.equal(bill.state?.phase, 'complete');
});

test('a different seaside order replaces the dish and bills its new price', () => {
  const player = conversation(cartagenaSeaScenario);
  assert.equal(player.turn(menu, 'Can I have the menu?').state?.phase, 'menu');
  const refused = player.turn(request, "I don't want fish.");
  assert.equal(refused.verdict.outcome, 'context_mismatch');
  for (const answer of [
    "I'd like fish without onions and tea.",
    "I'd like eggs with bread and three cups of tea.",
    "I'd like eggs with bread and some milk.",
  ]) {
    assert.equal(player.turn(request, answer).verdict.outcome, 'context_mismatch', answer);
    assert.deepEqual(player.read().lines, []);
  }

  const alternative = player.turn(request, 'Could I have a cup of tea and eggs with bread?');
  assert.equal(alternative.verdict.outcome, 'communication_only');
  assert.deepEqual(alternative.verdict.targets, []);
  assert.match(alternative.reply!.line.en, /A cup of tea and eggs with bread/);
  assert.equal(player.turn(confirm, "That's right.").state?.phase, 'confirmed');
  const change = player.turn(replace, "I'd like chicken with rice instead of eggs with bread.");
  assert.deepEqual(change.verdict.targets, [would, instead]);
  assert.equal(
    change.state?.lines.some(({ itemId }) => itemId === 'eggs-bread'),
    false,
  );
  assert.match(change.reply!.line.en, /A cup of tea and chicken with rice/);
  assert.equal(player.turn(confirm, "That's right.").state?.phase, 'confirmed');
  assert.equal(player.turn(finish, 'No, thank you.').state?.phase, 'closed');
  const bill = player.turn(check, 'Can I have the bill, please?');
  assert.equal(bill.state?.total, 26_000);
  assert.match(bill.reply!.line.en, /COP 26,000/);
});

test('an accepted alternative survives duplicate submissions and a stale retry command', () => {
  const chapter: TravelChapter = {
    id: 'scenario-fixture',
    title: 'La carta',
    revision: 1,
    stamp: 'La carta',
    postcard: 'La carta',
    message: 'Confirma el pedido.',
    collectible: 'La carta',
    missions: [
      {
        id: 'test-order',
        title: 'El pedido',
        place: 'El café',
        objective: 'Pide un plato y una bebida.',
        minutes: [5, 10],
        success: 'El pedido está confirmado.',
        scenario: cartagenaCafeScenario,
        optional: true,
        vocabulary: [],
        steps: cartagenaAssessmentSteps.order.filter(({ id }) =>
          ['cartagena-order-menu', 'cartagena-order-write'].includes(id),
        ),
      },
    ],
  };
  const travel = emptyTravel();
  let next = 0;
  let attempts = 0;
  const apply = (operation: TravelOperation) =>
    updateTravel(
      travel,
      operation,
      0,
      () => `scenario-advance-${++next}`,
      (_input, _aids, { scenarioVerdict }) => {
        attempts++;
        assert.ok(scenarioVerdict);
        return {
          correct: scenarioVerdict.outcome === 'target',
          ...(scenarioVerdict.outcome === 'communication_only' && { communicationOnly: true }),
          outcome: scenarioVerdict.outcome,
          feedbackEs: 'Revisa el pedido.',
          xpAwarded: 0,
          pending: false,
        };
      },
      () => {},
      undefined,
      undefined,
      chapter,
      { allow: () => true, prepare: () => true, canSkipKnown: () => true },
    );
  apply({ action: 'start', missionId: 'test-order' });
  const first = travel.active!.token;
  apply({ action: 'skipKnown', token: first });
  assert.equal(travel.active?.token, first);
  apply({ action: 'answer', token: first, answer: { text: 'Can I see the menu?' } });
  apply({ action: 'advance', token: first });

  const token = travel.active!.token;
  const order = {
    action: 'answer' as const,
    token,
    answer: { text: 'Could I have fish with rice and water?' },
  };
  apply(order);
  const accepted = structuredClone(travel.active);
  assert.equal(accepted?.result?.outcome, 'communication_only');
  assert.equal(accepted?.scenario?.phase, 'selected');
  apply(order);
  apply({ action: 'retry', token });
  assert.deepEqual(travel.active, accepted);
  assert.equal(attempts, 2);
  apply({ action: 'advance', token });
  assert.equal(travel.active?.finished, true);
});
