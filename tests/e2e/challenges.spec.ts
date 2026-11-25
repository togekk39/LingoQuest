import { test, expect, click, exact, enterApp, readyOfflineShell, state } from './helpers';

test('travel trials stay locked until each mission has been taught, even with a stamp', async ({
  page,
}) => {
  await enterApp(page);
  await page.evaluate(() => {
    const key = 'lq_offline_state_v1';
    const s = JSON.parse(localStorage.getItem(key)!);
    const date = new Date().toISOString();
    s.travel.completed = { bag: date };
    s.travel.cleared = ['hello', 'bus'];
    s.travel.stamps.home = date;
    localStorage.setItem(key, JSON.stringify(s));
  });
  await page.getByRole('tab', exact('Desafíos')).click();
  const locked = page.getByRole('button', exact('Completa las misiones primero'));
  await expect(locked).toBeDisabled();
  await expect(page.getByText('1 de 3 misiones necesarias')).toBeVisible();
});

test('partial writing evidence and an older best score do not open a travel challenge', async ({
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
    s.unifiedLearning.evidence.push({
      id: 'verified-travel_hello_write',
      source: 'story',
      materialId: 'travel_home',
      materialVersion: 'home:7',
      exerciseId: 'travel_hello_write',
      timestamp: Date.parse(date),
      contextId: 'welcome-desk',
      format: 'short_text',
      activity: 'answer',
      outcome: 'target',
      aids: [],
      retry: false,
      independent: true,
      targets: [{ targetId: 'home.introduce', dimension: 'writing' }],
    });
    s.challengeProgress = [
      {
        trackId: 'home_journey',
        type: 'grammar_rush',
        mode: 'practice',
        highestLevel: 3,
        bestScores: { '3': 700 },
        badge: false,
      },
    ];
    localStorage.setItem(key, JSON.stringify(s));
  });
  const before = await state(page);
  await page.getByRole('tab', exact('Desafíos')).click();
  await expect(page.getByRole('button', exact('Practica sin ayuda primero'))).toBeDisabled();
  expect((await state(page)).challengeProgress).toEqual(before.challengeProgress);
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
