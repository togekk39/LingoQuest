import {
  test,
  expect,
  enterApp,
  readyOfflineShell,
  finishVocabulary,
  finishGreetingPractice,
  state,
  answerTravelChoice,
  answerTravelReorder,
  answerTravelText,
  capture,
} from './helpers';

const exact = (name: string) => ({ name, exact: true });

test.describe('origin picker on a small touch screen', () => {
  test.use({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });

  test('opens from home and the map and saves changes offline', async ({ page, context }) => {
    await page.goto('/');
    await readyOfflineShell(page, context);
    const origin = page.getByRole('button', exact('Elegir lugar de origen'));
    const search = page.getByRole('textbox', exact('Buscar lugar de origen'));

    await page.getByRole('button', exact('Explorar primero')).tap();
    await page.getByRole('button', exact('Continuar viaje')).tap();
    await expect(search).toBeVisible();
    expect((await state(page)).travel.active).toBeUndefined();
    await page.getByRole('button', exact('Cerrar')).tap();
    await origin.tap();
    await page.getByRole('button', exact('Otro lugar')).tap();
    await expect(search).toBeHidden();
    await expect(
      page.getByRole('button', exact('Cambiar lugar de origen')).getByText('Otro lugar'),
    ).toBeVisible();

    await page.getByRole('tab', exact('Mapa')).tap();
    await origin.tap();
    await search.fill('panama');
    await page.getByRole('button', exact('Panamá')).tap();
    await expect(search).toBeHidden();
    await page.reload();
    const change = page.getByRole('button', exact('Cambiar lugar de origen'));
    await expect(change.getByText('Panamá')).toBeVisible();
    expect((await state(page)).travel.country).toBe('PA');
    await change.tap();
    await expect(page.getByRole('button', exact('Panamá'))).toBeVisible();
  });
});

test('an offline traveler can choose an origin, resume a draft and its feedback, and earn one stamp', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [];
  });
  await enterApp(page, { chooseOrigin: false });
  await readyOfflineShell(page, context);
  await page.getByRole('tab', exact('Mapa')).click();
  await expect(
    page.getByText('20 paradas, 7 continentes. Explora el mapa o elige un destino en la lista.'),
  ).toBeVisible();
  await page.getByRole('button', exact('20. Antártida')).click();
  await expect(page.getByText(/Desde Ushuaia, te unes/)).toBeVisible();
  await page.getByRole('button', exact('Elegir lugar de origen')).click();
  await page.getByRole('textbox', exact('Buscar lugar de origen')).fill('dominicana');
  await page.getByRole('button', exact('República Dominicana')).click();
  await expect(page.getByRole('textbox', exact('Buscar lugar de origen'))).toBeHidden();
  await page.getByRole('tab', exact('Inicio')).click();
  await expect(page.getByText('República Dominicana', { exact: true })).toBeVisible();
  const postcard = page.getByTestId('home-mission-postcard');
  await postcard.getByRole('button', exact('Continuar viaje')).click();
  const click = (name: string) => page.getByRole('button', exact(name)).click();
  await expect(page.getByTestId('travel-dialogue-postcard')).toBeVisible();
  await capture(page, '01-plaza-dialogue');
  await click('Continuar');
  await expect(
    page.getByTestId('travel-reference-phrase').getByText('Hi! My name is Sam.', { exact: true }),
  ).toBeVisible();
  await click('Continuar');
  await finishVocabulary(page);
  await finishGreetingPractice(page);
  const input = page
    .getByTestId('travel-workbook')
    .getByRole('textbox', exact('Tu respuesta en inglés'));
  await input.fill('Hi! I am');
  const travelState = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('lq_offline_state_v1')!).travel);
  await expect.poll(async () => (await travelState()).active.answer.text).toBe('Hi! I am');
  await click('Cerrar y volver');
  await expect(
    page.getByTestId('home-stop-hello').getByText('En curso', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await click('Continuar viaje');
  await expect(input).toHaveValue('Hi! I am');
  await expect(page.getByText(/Retomamos donde lo dejaste/)).toBeVisible();
  await input.fill("Hi! I'm Luz.");
  await click('Comprobar respuesta');
  await expect(page.getByRole('button', exact('Seguir la historia'))).toBeVisible();
  const beforeReload = await state(page);
  await page.reload();
  await click('Continuar viaje');
  await expect(page.getByRole('button', exact('Seguir la historia'))).toBeVisible();
  expect((await state(page)).attempts).toEqual(beforeReload.attempts);
  await click('Seguir la historia');
  await answerTravelText(page, 'travel_hello_transfer', "I'm Nico.");
  await expect(page.getByRole('button', exact('Practicar con mi voz'))).toHaveCount(0);
  await expect(page.getByText(/reconocimiento en el dispositivo no está disponible/)).toBeVisible();
  await expect(page.getByRole('button', exact('Completar misión'))).toBeDisabled();
  await capture(page, '02-speaking');
  await click('Ahora no puedo hablar');
  await expect(page.getByText('¡Misión completada!')).toBeVisible();
  await click('Volver al viaje');
  await click('Continuar viaje');
  await click('Continuar');
  await finishVocabulary(page);
  await page.evaluate(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const result = play.call(this);
      void result
        .then(() => {
          document.body.dataset.played = this.currentSrc;
        })
        .catch(() => {});
      return result;
    };
  });
  await click('Escuchar a Sam');
  await expect
    .poll(() => page.evaluate(() => document.body.dataset.played))
    .toMatch(/line-4.*\.mp3/);
  await click('Leer la transcripción');
  await expect(page.getByText('Where is the bus stop?', { exact: true })).toBeVisible();
  await answerTravelChoice(page, 'travel_bus_listen', 'La parada de bus');
  await answerTravelReorder(page, 'travel_bus_direction', ['It’s', 'next', 'to', 'the', 'park']);
  const dictation = page.getByTestId('exercise-travel_bus_dictation');
  await expect(dictation).toBeVisible();
  await click('Escuchar la indicación');
  await expect
    .poll(() => page.evaluate(() => document.body.dataset.played))
    .toMatch(/line-7.*\.mp3/);
  await capture(page, '03-offline-dictation');
  await answerTravelText(page, 'travel_bus_dictation', 'It’s next to the park.');
  await answerTravelText(page, 'travel_bus_ask', 'Where is the bus stop?');
  await answerTravelText(page, 'travel_bus_transfer', 'The park is next to the bus stop.');
  await click('Completar misión');
  await click('Volver al viaje');
  await click('Continuar viaje');
  await click('Continuar');
  await finishVocabulary(page);
  await answerTravelChoice(page, 'travel_bag_read', 'A blue bag');
  await answerTravelChoice(page, 'travel_bag_owner', 'Luz');
  await answerTravelText(page, 'travel_bag_write', "It's blue.");
  await expect(page.getByTestId('exercise-travel_bag_transfer')).toBeVisible();
  await capture(page, '04-transfer');
  await answerTravelText(page, 'travel_bag_transfer', "It's red.");
  await click('Ahora no puedo hablar');
  await click('Completar misión');
  await expect(page.getByText('Sello obtenido · Primer encuentro')).toBeVisible();
  await page.reload();
  await click('Continuar viaje');
  await expect(page.getByText('Sello obtenido · Primer encuentro')).toBeVisible();
  await click('Abrir pasaporte');
  await expect(page.getByText('La postal de Sam', { exact: true })).toBeVisible();
  const note = page.getByRole('textbox', exact('Mi recuerdo'));
  await note.fill("It's next to the park.");
  await click('Guardar recuerdo');
  await expect(page.getByText('Recuerdo guardado.')).toBeVisible();
  const finished = await travelState();
  expect(Object.keys(finished.stamps)).toEqual(['home']);
  expect(Object.keys(finished.completed)).toHaveLength(3);
  const record = await state(page);
  expect(record.completedLessons).toEqual([]);
  expect(record.travelLearning?.targets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        skill: 'listening',
        conceptId: 'place-question',
        assistance: { guided: 1, transcript: 1 },
      }),
      expect.objectContaining({ skill: 'writing', conceptId: 'item-color', transferSuccesses: 1 }),
    ]),
  );
  expect(record.travelLearning?.targets.filter((target) => target.skill === 'speaking')).toEqual(
    [],
  );

  await capture(page, '07-passport');
});
