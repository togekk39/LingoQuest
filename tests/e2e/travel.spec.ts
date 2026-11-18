import { mkdirSync } from 'node:fs';
import {
  test,
  expect,
  enterApp,
  readyOfflineShell,
  finishVocabulary,
  openTravelWriting,
  state,
} from './helpers';

const exact = (name: string) => ({ name, exact: true });

test('an offline traveler can choose an origin, resume a draft and its feedback, and earn one stamp', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterApp(page);
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
  await page.getByRole('button', exact('Continuar viaje')).click();
  const click = (name: string) => page.getByRole('button', exact(name)).click();
  await click('Continuar');
  await click('Continuar');
  await finishVocabulary(page);
  const input = page.getByRole('textbox', exact('Tu respuesta en inglés'));
  await input.fill('Hi! I am');
  const travelState = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('lq_offline_state_v1')!).travel);
  await expect.poll(async () => (await travelState()).active.answer.text).toBe('Hi! I am');
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
  await expect(page.getByRole('button', exact('Practicar con mi voz'))).toHaveCount(0);
  await expect(
    page.getByRole('button', exact('Solo grabar y escuchar (sin reconocimiento)')),
  ).toBeVisible();
  await click('Completar misión');
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
  await page.getByRole('radio', exact('La parada de bus')).click();
  await click('Comprobar respuesta');
  await click('Seguir la historia');
  for (const token of ['It’s', 'next', 'to', 'the', 'park'])
    await click(`Agregar palabra: ${token}`);
  await click('Comprobar respuesta');
  await click('Seguir la historia');
  await click('Completar misión');
  await click('Volver al viaje');
  await click('Continuar viaje');
  await click('Continuar');
  await finishVocabulary(page);
  await page.getByRole('radio', exact('A blue bag')).click();
  await click('Comprobar respuesta');
  await click('Seguir la historia');
  await input.fill("It's blue.");
  await click('Comprobar respuesta');
  await click('Seguir la historia');
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
  expect((await state(page)).completedLessons).toEqual([]);

  const dir = process.env.SCREENSHOTS_DIR;
  if (dir) {
    mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: `${dir}/04-pasaporte.jpg`, type: 'jpeg', quality: 85 });
  }
});

test('quick review saves feedback separately from the active story', async ({ page, context }) => {
  await enterApp(page);
  await readyOfflineShell(page, context);
  await openTravelWriting(page);
  await page.getByRole('textbox', exact('Tu respuesta en inglés')).fill('Hi! I am Luz.');
  await page.getByRole('button', exact('Comprobar respuesta')).click();
  await page.getByRole('button', exact('Cerrar y volver')).click();
  await page.getByRole('button', exact('Repaso rápido')).click();
  await expect(page.getByRole('heading', exact('Me presento'))).toHaveCount(0);
  await page.getByRole('button', exact('Cerrar y volver')).click();
  await page.getByRole('button', exact('Continuar viaje')).click();
  await expect(page.getByRole('button', exact('Seguir la historia'))).toBeVisible();
});
