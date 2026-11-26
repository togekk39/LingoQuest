import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compareLunch,
  observeLunch,
  coordinateLunch,
  coordinateDisplay,
} from '../../../content/source/salvador-scenarios';
import type { TeamScenarioTurn } from '@lingoquest/course-pack';
import { parseTeamLanguage } from '../src/team-language';
import { startScenario } from '../src/scenario';
import {
  evaluateTeamTurn,
  teamTurnReady,
  advanceTeamTurn,
  teamRequiredWorkDone,
} from '../src/team-scenario';

const form = (input: string, addressed = observeLunch.participants[0], focusId?: string) =>
  parseTeamLanguage(observeLunch, input, { addressed, focusId });
const isError = (input: string, error: string) =>
  assert.equal((form(input) as { error?: string } | undefined)?.error, error, input);

test('player, addressee, named antecedents and defined groups use their grammatical forms', () => {
  assert.equal(form('You usually set the table.')?.form, 'habit');
  assert.equal(form('She is washing the vegetables.'), undefined);
  assert.equal(
    form("She's not washing the vegetables.", undefined, 'jo')?.form,
    'progressive-negative',
  );
  assert.equal(form("Right now, Jo's washing the vegetables.")?.form, 'progressive-positive');
  assert.equal(form('Today, Jo is washing the vegetables.')?.form, 'progressive-positive');
  assert.equal(form('Jo is washing the vegetables right now.')?.form, 'progressive-positive');
  assert.equal(form('Jo is washing the vegetables and cutting the bread.'), undefined);
  assert.equal(form('They are preparing lunch.'), undefined);
  assert.equal(form('They are preparing lunch.', undefined, 'hosts')?.form, 'progressive-positive');
  assert.equal(form('Jo and Rafa are preparing lunch.')?.form, 'progressive-positive');
  assert.equal(form("We're working together.")?.form, 'progressive-positive');
  const player = form('I am washing the vegetables.');
  assert.ok(player && 'subject' in player && player.subject.kind === 'player');
  for (const input of [
    'I usually cooks rice.',
    'We usually cooks rice.',
    'They usually cooks rice.',
    'You usually sets the table.',
    'She usually set the table.',
    'Rafa usually cook rice.',
  ])
    isError(input, 'third_person');
  for (const input of [
    'I is cooking.',
    'You is washing the vegetables.',
    'They is cooking.',
    'Jo are cooking.',
  ])
    isError(input, 'be_agreement');
  const modal = parseTeamLanguage(coordinateLunch, "Sam can't cutting the bread.");
  assert.ok(
    modal && 'error' in modal && modal.form === 'ability-negative' && modal.error === 'can_base',
  );
  const query = parseTeamLanguage(coordinateLunch, 'Can she cuts the bread?', { focusId: 'jo' });
  assert.ok(
    query && 'error' in query && query.form === 'ability-question' && query.error === 'can_base',
  );
  assert.equal(
    form("Jo usually sets the table, but today she's washing the vegetables.")?.form,
    'habit-contrast',
  );
  assert.equal(
    form("You usually set the table, but today you're washing the vegetables.")?.form,
    'habit-contrast',
  );
  assert.equal(
    form("I usually cook rice, but today I'm washing the vegetables.")?.form,
    'habit-contrast',
  );
  assert.equal(
    form("Jo usually sets the table, but today he's washing the vegetables."),
    undefined,
  );
  assert.equal(form('What Jo doing?')?.form, 'progressive-information');
  isError('What Jo is doing?', 'word_order');
  assert.equal(form('Is Jo washing the vegetables?')?.form, 'progressive-yes-no');
  assert.equal(form('What is Jo doing?')?.form, 'progressive-information');
});

test('team answers check the requested fact and keep the full typed claim grounded', () => {
  const state = startScenario(observeLunch);
  const turn: TeamScenarioTurn = {
    action: 'team',
    targetForms: ['progressive-information'],
    formTargets: [],
    confirmAny: [{ kind: 'work', personId: 'jo' }],
  };
  const ability = evaluateTeamTurn(observeLunch, state, turn, 'Can Jo wash the vegetables?', 'jo');
  assert.equal(ability.reply?.line.en, 'Yes, I can.');
  assert.deepEqual(ability.state?.work, state.work);
  assert.equal(teamTurnReady(turn, ability.state), false);
  const available = evaluateTeamTurn(observeLunch, state, turn, 'Can you help right now?', 'jo');
  assert.deepEqual(available.state?.work, state.work);
  assert.equal(teamTurnReady(turn, available.state), false);
  const work = evaluateTeamTurn(observeLunch, state, turn, 'What is Jo doing?', 'jo');
  assert.equal(teamTurnReady(turn, work.state), true);
  const abilityTurn: TeamScenarioTurn = {
    ...turn,
    confirmAny: [{ kind: 'ability', personId: 'jo', taskId: 'wash' }],
  };
  assert.equal(teamTurnReady(abilityTurn, work.state), false);
  assert.equal(teamTurnReady(abilityTurn, ability.state), true);
  assert.equal(
    evaluateTeamTurn(observeLunch, state, turn, 'I am washing the vegetables.', 'jo').verdict
      .outcome,
    'context_mismatch',
  );
  assert.equal(
    evaluateTeamTurn(
      compareLunch,
      startScenario(compareLunch),
      turn,
      'You usually set the table.',
      'jo',
    ).verdict.outcome,
    'communication_only',
  );
});

test('capability, availability, offers, requests and instructions remain distinct', () => {
  const state = startScenario(coordinateDisplay);
  const turn: TeamScenarioTurn = {
    action: 'team',
    targetForms: ['ability-question'],
    formTargets: [],
    confirmAny: [{ kind: 'ability', personId: 'nina', taskId: 'move' }],
  };
  const ability = evaluateTeamTurn(
    coordinateDisplay,
    state,
    turn,
    'Can you move the table?',
    'nina',
  );
  assert.equal(ability.reply?.line.en, 'Yes, I can.');
  assert.deepEqual(ability.state?.work, state.work);
  const offered = evaluateTeamTurn(coordinateDisplay, state, turn, 'I can help.', 'nina');
  assert.equal(offered.reply?.line.en, 'Can you move the table?');
  assert.deepEqual(offered.state?.work, state.work);
  const arrange: TeamScenarioTurn = {
    action: 'team',
    targetForms: ['help-request'],
    formTargets: [],
    assign: ['move'],
    event: [{ taskId: 'move', status: 'active' }],
  };
  for (const input of [
    'Can you move the table?',
    'Please, can you move the table?',
    'Nina, can you move the table?',
    'Can you move the table, Nina?',
    'Can you move the table, please?',
    'Can you move the table, Nina, please?',
  ]) {
    const result = evaluateTeamTurn(coordinateDisplay, state, arrange, input, 'nina');
    assert.equal(
      result.state?.work.find(({ taskId }) => taskId === 'move')?.status,
      'assigned',
      input,
    );
    assert.equal(
      advanceTeamTurn(coordinateDisplay, arrange, result.state!)?.work.find(
        ({ taskId }) => taskId === 'move',
      )?.status,
      'active',
    );
  }
  assert.equal(teamRequiredWorkDone(coordinateDisplay, state), false);
  assert.equal(
    advanceTeamTurn(coordinateDisplay, { ...turn, complete: true }, ability.state!),
    undefined,
  );
  const session = startScenario(coordinateLunch);
  const steps: TeamScenarioTurn = {
    action: 'team',
    targetForms: ['sequence'],
    formTargets: [],
    sequence: ['bread', 'bowls'],
  };
  assert.equal(
    evaluateTeamTurn(
      coordinateLunch,
      session,
      steps,
      'First, please cut the bread. Then put the bowls on the table.',
      'sam',
    ).verdict.outcome,
    'target',
  );
});
