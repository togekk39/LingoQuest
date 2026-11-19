import {
  test,
  expect,
  click,
  exact,
  enterApp,
  readyOfflineShell,
  state,
  openPlacement,
} from './helpers';

test('first launch offers two spaced travel routes and opens the first scene', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 320, height: 650 });
  await page.goto('/');
  const start = page.getByRole('button', exact('Empezar mi viaje'));
  const assess = page.getByRole('button', exact('Ya sé algo de inglés'));
  await expect(start).toBeVisible();
  await expect(assess).toBeVisible();
  await expect(page.getByRole('button', exact('Empiezo desde cero'))).toHaveCount(0);
  const [first, second] = await Promise.all([start.boundingBox(), assess.boundingBox()]);
  expect(second!.y - first!.y - first!.height).toBeGreaterThanOrEqual(10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await readyOfflineShell(page, context);
  await start.click();
  await expect(page.getByRole('heading', exact('¿Desde dónde viajas?'))).toBeVisible();
  expect((await state(page)).travel.active).toBeUndefined();
  await click(page, 'Cerrar');
  await expect(start).toBeVisible();
  await start.click();
  await click(page, 'Honduras');
  await expect(page.getByText('Un saludo en la plaza', { exact: true })).toBeVisible();
  await expect(page.getByTestId('travel-step-dialogue')).toBeVisible();
  expect((await state(page)).travel.country).toBe('HN');
});

test('placement from the welcome evaluates travel listening and jumps to the recommended mission', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByRole('button', exact('Ya sé algo de inglés'))).toBeVisible();
  await readyOfflineShell(page, context);
  await click(page, 'Ya sé algo de inglés');
  await expect(page.getByRole('heading', exact('¿Desde dónde viajas?'))).toBeVisible();
  await click(page, 'Honduras');
  await click(page, 'Empezar la prueba');
  await page.getByRole('radio', exact('Se está presentando.')).click();
  await click(page, 'Siguiente pregunta');
  await page.getByRole('textbox', exact('Tu respuesta en inglés')).fill("I'm Luz.");
  await click(page, 'Siguiente pregunta');
  await click(page, 'Escuchar a Sam');
  await page.getByRole('radio', exact('La parada de bus.')).click();
  await click(page, 'Siguiente pregunta');
  for (const word of ['It’s', 'next', 'to', 'the', 'park'])
    await click(page, `Agregar palabra: ${word}`);
  await click(page, 'Siguiente pregunta');
  await click(page, 'No lo sé todavía');
  await click(page, 'No lo sé todavía');
  await expect(page.getByText('4 de 6 respuestas acertadas sin ayuda.')).toBeVisible();
  await expect(page.getByText('Una mochila y una postal', { exact: true })).toBeVisible();
  expect((await state(page)).travel.stamps).toEqual({});
  expect((await state(page)).travel.completed).toEqual({});
  await click(page, 'Ir a mi misión');
  await expect(page.getByTestId('travel-step-dialogue')).toBeVisible();
  await page.reload();
  await click(page, 'Continuar viaje');
  expect((await state(page)).travel.active?.missionId).toBe('bag');
});

test('placement skips can recommend the first mission without awarding progress', async ({
  page,
}) => {
  await enterApp(page);
  const before = await state(page);
  await openPlacement(page);
  for (let i = 0; i < 6; i++) await click(page, 'No lo sé todavía');
  await expect(page.getByText('Un saludo en la plaza', { exact: true })).toBeVisible();
  await click(page, 'Ir a mi misión');
  expect((await state(page)).attempts).toEqual(before.attempts);
  expect((await state(page)).xp).toBe(before.xp);
});

test('the library offers travel-only vocabulary and examples', async ({ page }) => {
  await enterApp(page);
  await click(page, 'Palabras del viaje');
  await expect(page.getByRole('button', exact('Escuchar: Hi'))).toBeVisible();
  await expect(page.getByText('Me presento', { exact: true })).toHaveCount(0);
  await page.getByRole('tab', exact('Objetos perdidos')).click();
  await expect(page.getByRole('button', exact('Escuchar: blue'))).toBeVisible();
  await expect(page.getByText('Mi mochila es azul.', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', exact('Completa la misión anterior'))).toBeDisabled();
});
