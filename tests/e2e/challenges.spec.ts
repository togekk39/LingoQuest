import {
  test,
  expect,
  click,
  exact,
  enterApp,
  readyOfflineShell,
  state,
  learningProgress,
} from './helpers';

test('travel trials stay locked before finishing the chapter', async ({ page }) => {
  await enterApp(page);
  await page.getByRole('tab', exact('Desafíos')).click();
  const locked = page.getByRole('button', exact('Completa el capítulo primero'));
  await expect(locked).toBeDisabled();
});

test('travel trials expose chapter questions and keep unreleased ranks unavailable', async ({
  page,
  context,
}) => {
  await enterApp(page);
  await readyOfflineShell(page, context);
  await page.evaluate(() => {
    const key = 'lq_offline_state_v1';
    const s = JSON.parse(localStorage.getItem(key)!);
    const date = new Date().toISOString();
    s.travel.completed = { hello: date, bus: date, bag: date };
    s.travel.stamps.home = date;
    localStorage.setItem(key, JSON.stringify(s));
  });
  const before = learningProgress(await state(page));
  await page.getByRole('tab', exact('Desafíos')).click();
  await click(page, 'Explorar práctica');
  await expect(page.getByRole('button', { name: /^Nivel \d+:/ })).toHaveCount(13);
  await expect(page.getByRole('button', { name: /^Nivel 4:/ })).toBeDisabled();
  await page.getByRole('button', { name: /^Nivel 3:/ }).click();
  await page.getByRole('switch', exact('Practicar sin reloj')).check();
  await click(page, 'Empezar práctica');
  await expect(page.getByLabel('Sin límite de tiempo')).toBeVisible();
  await expect(page.getByText('My name ___ Sam.', { exact: true })).toBeVisible();
  expect(learningProgress(await state(page))).toEqual(before);
});

test('the separate A1–A2 challenge track lists all 13 ranks offline', async ({ page, context }) => {
  await enterApp(page);
  await readyOfflineShell(page, context);
  const before = await state(page);
  await page.getByRole('tab', exact('Desafíos')).click();
  await click(page, 'Ver los 13 niveles del curso');
  await expect(page.getByRole('button', { name: /^Nivel \d+:/ })).toHaveCount(13);
  await expect(page.getByRole('button', { name: /^Nivel 13:/ })).toBeVisible();
  expect(await state(page)).toEqual(before);
});
