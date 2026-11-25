import assert from 'node:assert/strict';
import test from 'node:test';
import { judgeAnswer } from '@lingoquest/contracts';
import { mexicoChapter } from '../../../content/source/mexico-missions';

const storyExercises = new Map(
  mexicoChapter.missions.flatMap(({ steps }) =>
    steps.flatMap((step) => (step.type === 'exercise' ? [[step.id, step.exercise] as const] : [])),
  ),
);

test('Mexico writing accepts natural wording with the right person and schedule', () => {
  for (const [id, valid, invalid] of [
    [
      'mexico-routine-write',
      ['Every day, I study English.'],
      ['Every day, I studies English.', 'Every day, I study Spanish.'],
    ],
    [
      'mexico-others-write',
      ['Clara cooks at home.', 'At home, Clara cooks.'],
      ['Clara cook at home.', 'Leo cooks at home.'],
    ],
    [
      'mexico-agreement-confirm',
      ['We meet at eight. She does not go at ten.', 'Let’s meet at eight. She doesn’t go at ten.'],
      [
        'We meet at ten. She does not go at eight.',
        'We meet at eight. She does not goes at ten.',
        'We meet at eight. He does not go at ten.',
      ],
    ],
    [
      'mexico-transfer-write',
      [
        'On Friday, we meet at the library at half past three.',
        'We meet at the library at 3:30 on Friday.',
      ],
      [
        'We meet at the library at 3:30 on Saturday.',
        'We meet at the market at 3:30 on Friday.',
        'We meet at the library at 4:30 on Friday.',
        'We meets at the library at 3:30 on Friday.',
      ],
    ],
  ] as const) {
    const exercise = storyExercises.get(id);
    assert.ok(exercise, id);
    for (const text of valid) assert.equal(judgeAnswer(exercise, { text }), 'target', text);
    for (const text of invalid) assert.equal(judgeAnswer(exercise, { text }), 'incorrect', text);
  }
});
