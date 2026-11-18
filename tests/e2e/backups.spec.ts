import { readFileSync } from 'node:fs';
import { test, expect, click, exact, enterApp, state } from './helpers';

test('retiring the old course preserves its local history and leaves backup available', async ({
  page,
}) => {
  await enterApp(page);
  await page.evaluate(() => {
    const key = 'lq_offline_state_v1';
    const s = JSON.parse(localStorage.getItem(key)!);
    s.completedLessons = ['u01_l01'];
    s.xp = 25;
    localStorage.setItem(key, JSON.stringify(s));
  });
  await page.reload();
  await page.getByRole('tab', exact('Perfil')).click();
  await expect(page.getByText('Misiones completadas', { exact: true })).toBeVisible();
  await expect(page.getByText('Contenido sin conexión', { exact: true })).toHaveCount(0);
  const download = page.waitForEvent('download');
  await click(page, 'Exportar mis datos');
  const output = JSON.parse(readFileSync((await (await download).path())!, 'utf8'));
  expect(output.state.completedLessons).toEqual(['u01_l01']);
  expect(output.state.xp).toBe(25);
  expect((await state(page)).travel.completed).toEqual({});
});
