import test from 'node:test';
import assert from 'node:assert/strict';
import {
  equivalentAnswerText,
  judgeAnswer,
  type AnswerKey,
  type AttemptResult,
  type ExerciseType,
} from '@lingoquest/contracts';
import { OfflineEngine, type CourseData, type CourseExercise } from '../src/index';

function key(type: ExerciseType, ...acceptedAnswers: string[]): AnswerKey & { type: ExerciseType } {
  return { type, acceptedAnswers };
}

test('equivalent written answers preserve grammar and meaning', () => {
  const equivalent = [
    ['  I’M  Luz! ', 'I am Luz.'],
    ['You’re in the right place.', 'You are in the right place.'],
    ['He is waiting at the gate.', "He's waiting at the gate."],
    ["She's tired.", 'She is tired.'],
    ['How’s the weather?', 'How is the weather?'],
    ['Where is the stop?', 'Where’s the stop'],
    ['There is a bus stop near the park.', 'There’s a bus stop near the park.'],
    ['They’re from Lima.', 'They are from Lima.'],
    ['I’d like a ticket, please!', 'I would like a ticket please.'],
    ['We’d already arrived.', 'We had already arrived.'],
    ['She’s bought the tickets.', 'She has bought the tickets.'],
    ['He has been here.', 'He’s been here.'],
    ['They’ve never seen it.', 'They have never seen it.'],
    ['It is not next to the cafe.', 'It isn’t next to the cafe.'],
    ['He’s not here.', 'He isn’t here.'],
    ['We cannot go.', 'We can’t go.'],
    ['I will not go.', "I won't go."],
    ['I won’t, but you can.', 'I will not, but you can.'],
    ['Yesterday, I called my sister.', 'Yesterday I called my sister.'],
    ['I get up at six. At noon, I eat.', 'I get up at six. At noon I eat.'],
    ['If the flight is delayed, I will call you.', 'If the flight is delayed I will call you.'],
    ['Please can you repeat?', 'Please, can you repeat?'],
  ];
  for (const [model, answer] of equivalent) {
    assert.ok(equivalentAnswerText(answer, model), `${model} / ${answer}`);
    assert.ok(equivalentAnswerText(model, answer), `${answer} / ${model}`);
  }
  const distinct = [
    ['I am Luz.', 'Im Luz.'],
    ['It is blue.', 'It are blue.'],
    ['She works here.', 'She work here.'],
    ['We saw it.', 'We seen it.'],
    ['I cannot go.', 'I can go.'],
    ['I can’t go.', 'I cant go.'],
    ['I am.', "I'm."],
    ['He has been here.', 'He is been here.'],
    ['He’s slept.', 'He is slept.'],
    ['She’s done it.', 'She is done it.'],
    ['He has a ticket.', 'He’s a ticket.'],
    ['We’d arrived.', 'We would arrived.'],
    ['He would like a ticket.', 'He had like a ticket.'],
    ['It’s red.', 'Its red.'],
    ["Sam's bag is red.", 'Sam is bag is red.'],
    ['The park is next to the stop.', 'The park is near the stop.'],
    ['Let’s eat, Grandma.', 'Let’s eat Grandma.'],
    ['No, smoking is fine.', 'No smoking is fine.'],
    ['Do I need a ticket?', 'Do I? Need a ticket.'],
    ['It costs $1.25.', 'It costs $1 25.'],
  ];
  for (const [model, answer] of distinct)
    assert.ok(!equivalentAnswerText(answer, model), `${model} / ${answer}`);
});

test('authored answer keys distinguish target, communicative wording, errors and insufficient context', () => {
  const exercise = {
    ...key('short_text', 'Where is the bus stop?'),
    communicationOnly: {
      answers: ['Could you tell me where the bus stop is?'],
      feedbackEs: 'Usa la pregunta directa con Where is.',
    },
  };
  assert.equal(judgeAnswer(exercise, { text: 'Where’s the bus stop?' }), 'target');
  assert.equal(
    judgeAnswer(exercise, { text: 'could you tell me where the bus stop is' }),
    'communication_only',
  );
  assert.equal(
    judgeAnswer(exercise, { text: 'Could you tell me where is the bus stop?' }),
    'incorrect',
  );
  assert.equal(judgeAnswer(exercise, { text: 'Where’s the park?' }), 'incorrect');
  assert.equal(
    judgeAnswer(
      { ...exercise, ungradable: { feedbackEs: 'Falta la ubicación.' } },
      { text: 'Where’s the bus stop?' },
    ),
    'ungradable',
  );
  assert.equal(judgeAnswer(key('cloze', 'study', 'am studying'), { text: 'study' }), 'target');
  assert.equal(judgeAnswer(key('cloze', 'study'), { text: 'learn' }), 'incorrect');
  assert.equal(
    judgeAnswer(key('correction', 'She studies English.'), { text: 'She study English.' }),
    'incorrect',
  );
  assert.equal(
    judgeAnswer(key('reorder', 'I am here now.'), { tokens: ['I’m', 'here', 'now', '.'] }),
    'target',
  );
  assert.equal(
    judgeAnswer(key('reorder', 'I am here now.'), { tokens: ['I', 'here', 'am', 'now'] }),
    'incorrect',
  );
  const choice = {
    ...key('single_choice', 'stop', 'wrong'),
    correctOptionId: 'right',
    options: [
      { id: 'right', text: 'stop' },
      { id: 'wrong', text: 'drive' },
    ],
  };
  assert.equal(judgeAnswer(choice, { optionId: 'right' }), 'target');
  assert.equal(judgeAnswer(choice, { optionId: 'wrong' }), 'incorrect');
  assert.equal(judgeAnswer(choice, { text: 'stop' }), 'incorrect');
  assert.equal(judgeAnswer(key('short_text', 'study'), { optionId: 'study' }), 'incorrect');
});

test('personal introductions accept real name formats and keep identity separate from the target pattern', () => {
  const exercise = {
    ...key('short_text', 'I am Ana.'),
    introduction: { greetingRequired: false, model: 'I am [tu nombre].' },
    communicationOnly: {
      answers: [],
      feedbackEs: 'Para esta práctica usa I am o My name is.',
    },
  };
  for (const text of [
    'I’m José de la Cruz.',
    'My name is Ana-María O’Connor.',
    'I am A. J. Silva.',
    'I am J.R. López.',
    'My name is Wei-Lun Nguyễn.',
    'Hi, I am Lucía!',
  ])
    assert.equal(judgeAnswer(exercise, { text }), 'target', text);
  assert.equal(judgeAnswer(exercise, { text: 'You can call me Lucía.' }), 'communication_only');
  assert.equal(judgeAnswer(exercise, { text: 'I am Lucía.' }, 'Ana'), 'incorrect');
  assert.equal(
    judgeAnswer(exercise, { text: 'I am Nora J. OʼNeill.' }, "Nora J O'Neill"),
    'target',
  );
  for (const text of [
    'I is Lucía.',
    'I am [tu nombre].',
    'I am eating fruit.',
    'I am Ana, I know.',
  ])
    assert.equal(judgeAnswer(exercise, { text }), 'incorrect', text);
});

test('a communicative alternative and an ungradable prompt award no target evidence and survive backup restore', async () => {
  const model: CourseExercise = {
    id: 'graded_text',
    type: 'short_text',
    promptEs: 'Pregunta por la parada con Where is.',
    feedbackEs: 'Usa Where is…?',
    skillId: 'where_is',
    difficulty: 1,
    dimension: 'grammar_production',
    acceptedAnswers: ['Where is the bus stop?'],
    communicationOnly: {
      answers: ['Where can I find the bus stop?'],
      feedbackEs: 'Se entiende tu pregunta. Ahora practica Where is…?',
    },
  };
  const lessonId = 'test_lesson';
  const content: CourseData = {
    units: [],
    lessons: {
      [lessonId]: {
        id: lessonId,
        unitId: 'test_unit',
        title: 'Directions',
        introEs: 'Preguntar por la parada',
        examples: [],
        speakingText: 'Where is the bus stop?',
        estimatedMinutes: 2,
        exercises: [
          model,
          {
            ...model,
            id: 'ungradable_text',
            skillId: 'unclear_location',
            communicationOnly: undefined,
            ungradable: { feedbackEs: 'La indicación no incluye el lugar que se busca.' },
          },
        ],
      },
    },
    challengePools: { grammar_rush: [], cloze_battle: [], reading_quest: [] },
    challengeLevels: [],
    placementQuestions: [],
    missions: [],
    speechDrills: [],
  };
  function device() {
    const files = new Map<string, string>();
    return new OfflineEngine({
      getContent: () => content,
      store: {
        getItem: async (key) => files.get(key) ?? null,
        setItem: async (key, value) => {
          files.set(key, value);
        },
      },
    });
  }
  const engine = device();
  const alternative = {
    lessonId,
    exerciseId: model.id,
    clientAttemptId: 'alternative-001',
    answer: { text: model.communicationOnly!.answers[0] },
  };
  const response = await engine.request<AttemptResult>('/v1/attempts', alternative);
  assert.equal(response.outcome, 'communication_only');
  assert.equal(response.correct, false);
  assert.equal(response.communicationOnly, true);
  assert.equal(response.xpAwarded, 0);
  const ungradable = await engine.request<AttemptResult>('/v1/attempts', {
    ...alternative,
    exerciseId: 'ungradable_text',
    clientAttemptId: 'ungradable-001',
  });
  assert.equal(ungradable.outcome, 'ungradable');
  assert.equal(ungradable.acceptedAnswer, undefined);
  assert.deepEqual((await engine.initialize()).mastery, []);
  const restored = device();
  const backup = await engine.request('/v1/me/export');
  await restored.request('/v1/me/import', { backup });
  assert.deepEqual(await restored.request('/v1/attempts', alternative), response);
  const target = await restored.request<AttemptResult>('/v1/attempts', {
    ...alternative,
    clientAttemptId: 'target-001',
    answer: { text: 'Where’s the bus stop?' },
  });
  assert.equal(target.outcome, 'target');
  assert.equal((await restored.initialize()).mastery[0].unpromptedSuccessCount, 1);
});
