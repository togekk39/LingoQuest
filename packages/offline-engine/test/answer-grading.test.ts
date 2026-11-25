import test from 'node:test';
import assert from 'node:assert/strict';
import {
  equivalentAnswerText,
  judgeAnswer,
  type Answer,
  type AnswerKey,
  type AnswerOutcome,
  type AttemptResult,
  type ExerciseType,
} from '@lingoquest/contracts';
import {
  cartagenaAssessmentSteps,
  cartagenaPractice,
} from '../../../content/source/cartagena-assessments';
import { lessons } from '../../../content/source/curriculum';
import { OfflineEngine, type CourseData, type CourseExercise } from '../src/index';

function key(type: ExerciseType, ...acceptedAnswers: string[]): AnswerKey & { type: ExerciseType } {
  return { type, acceptedAnswers };
}

test('Cartagena orders recognize the prompt, the menu conditions and natural alternatives', () => {
  const step = cartagenaAssessmentSteps.order.find(({ id }) => id === 'cartagena-order-write');
  assert.ok(step);
  const samples: Array<[string, AnswerOutcome]> = [
    ["I'd like fish with rice and some water, please.", 'target'],
    ['I would like a cup of coffee and chicken with rice please.', 'target'],
    ['Can I have fish with rice and a bottle of water, please?', 'communication_only'],
    ["I'd like eggs with cheese and water, please.", 'context_mismatch'],
    ["I'd like chicken with rice.", 'context_mismatch'],
    ["I'd likes fish with rice and some water, please.", 'incorrect'],
  ];
  for (const [text, outcome] of samples)
    assert.equal(judgeAnswer(step.exercise, { text }), outcome);
  const order = 'I would like a bottle of water and fish with rice, please.';
  const reply = step.storyReplies?.find(({ answers }) =>
    answers.some((answer) => equivalentAnswerText(order, answer)),
  );
  assert.equal(reply?.line.en, 'Fish with rice and a bottle of water.');
});

test('Cartagena distinguishes counted servings, contextual quantities and open self-checks', () => {
  const coffee = cartagenaPractice.find(({ id }) => id === 'cartagena-review-order-coffee-confirm');
  const quantity = cartagenaAssessmentSteps.quantity.find(
    ({ id }) => id === 'cartagena-quantity-write',
  );
  const open = cartagenaAssessmentSteps.transfer.find(({ id }) => id === 'cartagena-transfer-open');
  assert.ok(coffee && quantity && open);
  assert.equal(judgeAnswer(coffee.exercise, { text: 'I’d like two coffees, please.' }), 'target');
  assert.equal(
    judgeAnswer(coffee.exercise, { text: 'I would like two cups of coffee.' }),
    'target',
  );
  assert.equal(judgeAnswer(coffee.exercise, { text: "I'd like two coffee." }), 'incorrect');
  assert.equal(
    judgeAnswer(coffee.exercise, { text: "I'd like three coffees." }),
    'context_mismatch',
  );
  assert.equal(judgeAnswer(quantity.exercise, { text: 'How much water?' }), 'context_mismatch');
  assert.equal(judgeAnswer(quantity.exercise, { text: 'How many water?' }), 'incorrect');
  assert.equal(
    judgeAnswer(open.exercise, { text: "I'd like chicken. Does it have milk?" }),
    'ungradable',
  );
});

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
    ['Let’s wait, Ana.', 'Let’s wait Ana.'],
    ['We’re leaving, Sam.', 'We’re leaving Sam.'],
    ['She said, “Wait.”', 'She said? Wait.'],
    ['Do I need a ticket?', 'Do I? Need a ticket.'],
    ['It costs $1.25.', 'It costs $1 25.'],
  ];
  for (const [model, answer] of distinct)
    assert.ok(!equivalentAnswerText(answer, model), `${model} / ${answer}`);
});

test('published lesson keys accept only the intended meaning and distinguish the requested form', () => {
  const cases: Record<string, [Answer, AnswerOutcome][]> = {
    u01_l01_practice_4: [
      [{ text: 'good morning! My name’s José Ortega y Gasset.' }, 'target'],
      [{ text: 'Hello! I’m A. J. da Silva.' }, 'target'],
      [{ text: 'hi, my name is oʼneill-blanc.' }, 'target'],
      [{ text: 'My name is A. J. da Silva.' }, 'incorrect'],
      [{ text: 'Hello! I am Ana and Julia.' }, 'incorrect'],
      [{ text: 'Hello! My name is Ana or Julia.' }, 'incorrect'],
      [{ text: 'Hello! I’m from Peru.' }, 'incorrect'],
    ],
    u02_l01_practice_1: [
      [{ text: ' STUDY! ' }, 'target'],
      [{ text: 'to study' }, 'incorrect'],
      [{ text: 'am studying' }, 'incorrect'],
    ],
    u02_l01_practice_2: [
      [{ tokens: ['Every', 'day', 'I', 'drink', 'water', '.'] }, 'target'],
      [{ tokens: ['I', 'drink', 'water', 'every', 'day', '.'] }, 'target'],
      [{ tokens: ['Every', 'day', 'drink', 'I', 'water', '.'] }, 'incorrect'],
    ],
    u02_l02_practice_3: [
      [{ text: 'SHE STUDIES ENGLISH' }, 'target'],
      [{ text: 'She studys English.' }, 'incorrect'],
      [{ text: 'She studies Spanish.' }, 'incorrect'],
    ],
    u03_l03_practice_3: [
      [{ text: 'Please, can you repeat?' }, 'target'],
      [{ text: 'Can you please repeat?' }, 'target'],
      [{ text: 'Could you please repeat?' }, 'communication_only'],
      [{ text: 'Please repeat.' }, 'communication_only'],
      [{ text: 'Can you please repeats?' }, 'incorrect'],
      [{ text: 'Can you? repeat please.' }, 'incorrect'],
    ],
    u05_l03_practice_4: [
      [{ text: 'It isn’t raining.' }, 'target'],
      [{ text: 'It’s not raining.' }, 'target'],
      [{ text: 'There’s no rain right now.' }, 'communication_only'],
      [{ text: 'It is raining.' }, 'incorrect'],
      [{ text: 'It isn’t rain.' }, 'incorrect'],
    ],
    u07_l02_practice_4: [
      [{ text: 'Have you ever been abroad before?' }, 'target'],
      [{ text: 'Have you been abroad before?' }, 'communication_only'],
      [{ text: 'Have you ever went abroad?' }, 'incorrect'],
    ],
    u07_l03_practice_4: [
      [{ text: 'I haven’t bought my ticket yet.' }, 'target'],
      [{ text: 'I haven’t yet bought my ticket.' }, 'target'],
      [{ text: 'I still haven’t bought my ticket.' }, 'communication_only'],
      [{ text: 'I have bought my ticket.' }, 'incorrect'],
      [{ text: 'I haven’t bought my tickets yet.' }, 'incorrect'],
      [{ text: 'I haven’t buy my ticket yet.' }, 'incorrect'],
    ],
    u08_l01_practice_3: [
      [{ text: 'Check' }, 'target'],
      [{ text: 'bill' }, 'communication_only'],
      [{ text: 'ticket' }, 'incorrect'],
    ],
    u08_l01_practice_4: [
      [{ text: 'I’d like the menu, please!' }, 'target'],
      [{ text: 'May I have the menu, please?' }, 'communication_only'],
      [{ text: 'I’d like a ticket, please.' }, 'incorrect'],
      [{ text: 'I had like the menu, please.' }, 'incorrect'],
    ],
  };
  const exercises = Object.values(lessons).flatMap((lesson) => lesson.exercises);
  for (const [exerciseId, answers] of Object.entries(cases)) {
    const exercise = exercises.find(({ id }) => id === exerciseId);
    assert.ok(exercise, exerciseId);
    for (const [answer, outcome] of answers)
      assert.equal(
        judgeAnswer(exercise, answer),
        outcome,
        `${exerciseId} ${JSON.stringify(answer)}`,
      );
  }
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
  assert.equal(judgeAnswer(key('cloze'), { text: 'study' }), 'ungradable');
  assert.equal(
    judgeAnswer({ ...choice, correctOptionId: 'unknown' }, { optionId: 'right' }),
    'ungradable',
  );
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
    'I am Running Deer.',
    'I am Ana Or.',
  ])
    assert.equal(judgeAnswer(exercise, { text }), 'target', text);
  assert.equal(judgeAnswer(exercise, { text: 'You can call me Lucía.' }), 'communication_only');
  assert.equal(
    judgeAnswer(exercise, { text: 'I am mai-linh nguyễn.' }, 'Mai-Linh Nguyễn'),
    'target',
  );
  assert.equal(judgeAnswer(exercise, { text: "I'm A.J. Silva." }, 'A. J. Silva'), 'target');
  assert.equal(judgeAnswer(exercise, { text: 'My name is אנה לוי.' }), 'target');
  assert.equal(judgeAnswer(exercise, { text: "I am d'arcy." }, "d'Arcy"), 'target');
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
    'I am here.',
    'I am late.',
    'I am Late.',
    'I’m running late.',
    'I’m pretty good.',
    'I am still waiting for the bus.',
    'I am able to help.',
    'I am first in line.',
    'I am Ana and.',
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
