import {
  test,
  expect,
  click,
  exact,
  enterApp,
  readyOfflineShell,
  state,
  openPlacement,
  openLessons,
  capture,
} from './helpers';

test('first launch has one start button for the adventure and an optional assessment', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 320, height: 650 });
  await page.goto('/');
  const start = page.getByRole('button', exact('Comenzar mi aventura'));
  const assess = page.getByRole('button', exact('Ya sé algo de inglés'));
  await expect(start).toBeVisible();
  await expect(assess).toBeVisible();
  await expect(page.getByRole('button', exact('Empezar mi viaje'))).toHaveCount(0);
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
  await expect(page.getByRole('heading', exact('¿Cómo te llamas?'))).toBeVisible();
  await page.getByRole('textbox', exact('Tu nombre')).fill('Amaya');
  await click(page, 'Guardar y continuar');
  await expect(page.getByTestId('story-scene-plaza')).toBeVisible();
  expect(await state(page)).toMatchObject({ user: { name: 'Amaya' }, travel: { country: 'HN' } });
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
  const savedName = (await state(page)).user.name;
  await page.getByRole('radio', exact('Se está presentando.')).click();
  await click(page, 'Siguiente pregunta');
  await expect(page.getByText(/Usa tu nombre o elige un nombre de práctica/)).toBeVisible();
  await page
    .getByRole('textbox', exact('Tu respuesta en inglés'))
    .fill('Hello! You can call me María-José O’Neill.');
  await click(page, 'Siguiente pregunta');
  await click(page, 'Escuchar a Sam');
  await page.getByRole('radio', exact('La parada de autobús.')).click();
  await click(page, 'Siguiente pregunta');
  for (const word of ['It’s', 'next', 'to', 'the', 'park'])
    await click(page, `Agregar palabra: ${word}`);
  await click(page, 'Siguiente pregunta');
  await click(page, 'No lo sé todavía');
  await click(page, 'No lo sé todavía');
  await expect(page.getByText('4 de 6 respuestas acertadas sin ayuda.')).toBeVisible();
  await expect(page.getByText('Una mochila y una postal', { exact: true })).toBeVisible();
  expect((await state(page)).user.name).toBe(savedName);
  expect((await state(page)).travel.stamps).toEqual({});
  expect((await state(page)).travel.completed).toEqual({});
  await click(page, 'Ir a mi misión');
  await expect(page.getByTestId('travel-step-dialogue')).toBeVisible();
  await page.reload();
  await openLessons(page);
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

test('the travel guide offers vocabulary and examples for each mission', async ({ page }) => {
  await enterApp(page);
  await click(page, 'Palabras del viaje');
  await expect(page.getByRole('button', exact('Escuchar: Hi'))).toBeVisible();
  await expect(page.getByText('Me presento', { exact: true })).toHaveCount(0);
  await page.getByRole('tab', exact('Objetos perdidos')).click();
  await expect(page.getByRole('button', exact('Escuchar: blue'))).toBeVisible();
  await expect(page.getByText('Mi mochila es azul.', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', exact('Completa la misión anterior'))).toBeDisabled();
});

test('the grammar handbook compares examples offline and reflows with enlarged text', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterApp(page);
  await readyOfflineShell(page, context);
  const before = await state(page);
  await page.getByRole('tab', exact('Aprender')).click();
  await click(page, 'Manual de gramática');
  const workbench = page.getByTestId('grammar-workbench');
  await workbench.getByRole('tab', exact('Ejemplo 1')).click();
  await expect(workbench.getByText('Sujeto', { exact: true })).toBeVisible();
  await click(page, 'Comparar ejemplos');
  await expect(workbench.getByText('My name is', { exact: true })).toBeVisible();
  await capture(page, '09-grammar-handbook');
  await page.setViewportSize({ width: 320, height: 720 });
  await workbench.evaluate((root) => {
    for (const element of root.querySelectorAll<HTMLElement>('div, span')) {
      if (element.children.length || !element.textContent?.trim()) continue;
      const style = getComputedStyle(element);
      element.style.fontSize = `${Number.parseFloat(style.fontSize) * 1.5}px`;
      const lineHeight = Number.parseFloat(style.lineHeight);
      if (Number.isFinite(lineHeight)) element.style.lineHeight = `${lineHeight * 1.5}px`;
    }
  });
  await click(page, 'Cerrar comparación');
  const second = workbench.getByRole('tab', exact('Ejemplo 2'));
  await second.focus();
  await second.press('Enter');
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(workbench.getByText('My name', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('tab', exact('Ubicar un lugar')).click();
  await expect(workbench.getByRole('heading', exact('Pregunta'))).toBeVisible();
  await expect(workbench.getByRole('heading', exact('Respuesta'))).toBeVisible();
  await expect(workbench.getByRole('button', exact('Comparar ejemplos'))).toHaveCount(0);
  await expect(workbench.getByRole('button', exact('Escuchar la pregunta'))).toBeVisible();
  await expect(workbench.getByRole('button', exact('Escuchar la respuesta'))).toBeVisible();
  await click(page, 'Ver traducción de la pregunta');
  await expect(workbench.getByText('¿Dónde está la parada de bus?', { exact: true })).toBeVisible();
  await expect(workbench.getByText('Está junto al parque.', { exact: true })).toHaveCount(0);
  await click(page, 'Ver traducción de la respuesta');
  await expect(workbench.getByText('Está junto al parque.', { exact: true })).toBeVisible();
  expect((await state(page)).attempts).toEqual(before.attempts);
});
