import {
  answerTravelChoice,
  capture,
  click,
  enterApp,
  exact,
  expect,
  finishVocabulary,
  openTravelWriting,
  readyOfflineShell,
  state,
  test,
} from './helpers';

test('two be-agreement errors lead to contextual repair and leave the story checkpoint intact', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterApp(page);
  await readyOfflineShell(page, context);
  await openTravelWriting(page);

  const input = page.getByRole('textbox', exact('Tu respuesta en inglés'));
  const feedback = page.getByTestId('answer-feedback');
  await input.fill('Hi! I is Luz.');
  await click(page, 'Comprobar respuesta');
  await expect(feedback.getByText(/Elige la forma de be que va con el sujeto/)).toBeVisible();
  await capture(page, '05-be-agreement-feedback');
  await click(page, 'Intentar otra vez');
  await input.fill("Hi! I'm Luz.");
  await click(page, 'Comprobar respuesta');
  await click(page, 'Seguir la historia');

  await expect(page.getByTestId('exercise-travel_hello_transfer')).toBeVisible();
  await input.fill('I is Nico.');
  await click(page, 'Comprobar respuesta');
  await expect(feedback.getByText(/Elige la forma de be que va con el sujeto/)).toBeVisible();
  const before = await state(page);
  const writing = before.travelLearning?.targets.find(
    (target) => target.skill === 'writing' && target.conceptId === 'introduction',
  );
  expect(writing?.errors.be_agreement).toMatchObject({ occurrences: 2, pending: 2 });
  expect(writing?.successes.production).toEqual({ independent: 0, assisted: 1 });

  await click(page, 'Repasar en otra escena');
  await expect(page.getByText('Refuerza una idea · 1 min', { exact: true })).toBeVisible();
  await expect(page.getByTestId('exercise-travel_remedy_introduction_be')).toBeVisible();
  await capture(page, '08-adaptive-review');
  await input.fill('am');
  await click(page, 'Cerrar y volver');
  await click(page, 'Continuar viaje');
  await expect(page.getByTestId('submitted-answer')).toHaveText(/I is Nico\./);
  await click(page, 'Repasar en otra escena');
  await expect(input).toHaveValue('am');
  await click(page, 'Comprobar respuesta');
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  await click(page, 'Volver al viaje');

  const trained = await state(page);
  expect(trained.travel.active).toEqual(before.travel.active);
  expect(
    trained.travelLearning?.targets.find((target) => target.skill === 'writing')?.errors
      .be_agreement?.pending,
  ).toBe(2);
  await click(page, 'Continuar viaje');
  await click(page, 'Repasar en otra escena');
  await expect(page.getByTestId('exercise-travel_review_introduction')).toBeVisible();
  await input.fill('My name is Ada.');
  await click(page, 'Comprobar respuesta');
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  await click(page, 'Volver al viaje');
  const confirmed = await state(page);
  expect(confirmed.travel.active).toEqual(before.travel.active);
  expect(
    confirmed.travelLearning?.targets.find((target) => target.skill === 'writing')?.errors
      .be_agreement?.pending,
  ).toBe(0);

  await page.getByRole('tab', exact('Aprender')).click();
  await click(page, 'Mis habilidades');
  await expect(page.getByRole('tab', exact('Todas mis habilidades'))).toBeVisible();
  await expect(page.getByText('Escritura', { exact: true })).toBeVisible();
  await expect(page.getByText(/Aciertos del objetivo con ayuda/).first()).toBeVisible();
});

test('a clear introduction outside the target form gets feedback without mastery credit', async ({
  page,
  context,
}) => {
  await enterApp(page);
  await readyOfflineShell(page, context);
  await openTravelWriting(page);
  const input = page.getByRole('textbox', exact('Tu respuesta en inglés'));
  await input.fill("Hi! I'm Luz.");
  await click(page, 'Comprobar respuesta');
  await click(page, 'Seguir la historia');
  await expect(page.getByTestId('exercise-travel_hello_transfer')).toBeVisible();

  const before = await state(page);
  const writing = (snapshot: typeof before) =>
    snapshot.travelLearning?.targets.find(
      (target) => target.skill === 'writing' && target.conceptId === 'introduction',
    );
  await input.fill('Nico here.');
  await click(page, 'Comprobar respuesta');
  const feedback = page.getByTestId('answer-feedback');
  await expect(feedback.getByText('Lograste comunicarte', { exact: true })).toBeVisible();
  const alternative = await state(page);
  await expect(page.getByRole('button', exact('Seguir la historia'))).toBeVisible();
  expect(alternative.xp).toBe(before.xp);
  expect(writing(alternative)?.communicationSuccesses).toBe(2);
  expect(writing(alternative)?.successes).toEqual(writing(before)?.successes);
  expect(writing(alternative)?.errors).toEqual(writing(before)?.errors);
  expect(writing(alternative)?.nextReviewAt).toBe(writing(before)?.nextReviewAt);

  await click(page, 'Intentar otra vez');
  await input.fill('My name’s Nico.');
  await click(page, 'Comprobar respuesta');
  await expect(feedback.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  const retried = writing(await state(page));
  expect(retried?.successes.production).toEqual({ independent: 1, assisted: 1 });
  expect(retried?.transferSuccesses).toBe(0);
  expect(retried?.communicationSuccesses).toBe(3);
});

test('an offline delayed review asks for independent use of a practiced concept in a new context', async ({
  page,
  context,
}) => {
  const start = Date.UTC(2026, 10, 19, 17);
  const day = 24 * 60 * 60 * 1000;
  await page.clock.setFixedTime(start);
  await enterApp(page);
  await readyOfflineShell(page, context);
  await click(page, 'Continuar viaje');
  await click(page, 'Continuar');
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await answerTravelChoice(page, 'travel_hello_recognize', 'Hola');
  await click(page, 'Cerrar y volver');

  await page.clock.setFixedTime(start + 2 * day);
  await page.reload();
  await click(page, 'Repaso rápido');
  await expect(page.getByText('Recuerda lo aprendido · 1 min', { exact: true })).toBeVisible();
  const exercise = page.getByTestId('exercise-travel_review_greeting');
  await exercise.getByRole('textbox', exact('Tu respuesta en inglés')).fill('Hello!');
  await click(page, 'Comprobar respuesta');
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  const after = await state(page);
  const greeting = after.travelLearning?.targets.find((target) => target.conceptId === 'greeting');
  expect(greeting).toMatchObject({
    skill: 'vocabulary',
    successes: {
      recognition: { independent: 1, assisted: 0 },
      transfer: { independent: 1, assisted: 0 },
    },
    transferSuccesses: 1,
    delayedSuccesses: 1,
    nextReviewAt: new Date(start + 5 * day).toISOString(),
  });
});
