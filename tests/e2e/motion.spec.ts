import type { Locator } from '@playwright/test';
import {
  test,
  expect,
  enterApp,
  beginFirstLesson,
  chooseCorrectAnswer,
  firstLesson,
  state,
} from './helpers';

test.use({ reducedMotion: 'no-preference' });

// Sample rendered frames rather than only checking implementation style declarations.
async function transformCount(locator: Locator) {
  return locator.evaluate(async (element) => {
    const samples = new Set<string>();
    for (let frame = 0; frame < 16; frame++) {
      await new Promise(requestAnimationFrame);
      samples.add(getComputedStyle(element).transform);
    }
    return samples.size;
  });
}

test('the companion animates and responds live to the system motion preference', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enterApp(page);
  const buddy = page.getByTestId('buddy-body').first();
  expect(await transformCount(buddy)).toBeGreaterThan(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => transformCount(buddy)).toBe(1);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => transformCount(buddy)).toBeGreaterThan(1);

  const button = page.getByRole('button', { name: 'Continuar aprendiendo', exact: true });
  await button.hover();
  await page.mouse.down();
  await expect
    .poll(() => button.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a))
    .toBeLessThan(0.99);
  await page.mouse.move(5, 5);
  await page.mouse.up();
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('lesson-stage-goal')).toBeVisible();
  expect(errors).toEqual([]);
});

test('lesson progress stays mounted across stages and correct answers celebrate once', async ({
  page,
}) => {
  await enterApp(page);
  await page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }).click();
  const progress = page.getByRole('progressbar');
  await progress.evaluate((element) => {
    (element as HTMLElement).dataset.retained = 'yes';
  });
  await page.getByRole('button', { name: 'Conocer las palabras', exact: true }).click();
  await expect(progress).toHaveAttribute('data-retained', 'yes');
  await expect(progress).toHaveAttribute('aria-valuenow', '14');
  await page.getByRole('button', { name: 'Cerrar y volver', exact: true }).click();
  await beginFirstLesson(page);
  await chooseCorrectAnswer(page, firstLesson.exercises[0]);
  await page.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click();
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  await expect(page.getByTestId('celebration-particles')).toBeAttached();
  await expect(page.getByTestId('celebration-particles')).toHaveCount(0, { timeout: 4000 });
});

test('saved reduced motion survives reload and suppresses celebration on a narrow screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterApp(page);
  await page.getByRole('tab', { name: 'Perfil', exact: true }).click();
  await page.getByRole('switch', { name: 'Reducir movimiento', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect.poll(async () => (await state(page)).user.reducedMotion).toBe(true);
  await page.reload();
  const buddy = page.getByTestId('buddy-body').first();
  await expect(buddy).toBeVisible();
  expect(await transformCount(buddy)).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await beginFirstLesson(page);
  await chooseCorrectAnswer(page, firstLesson.exercises[0]);
  await page.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click();
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  await expect(page.getByTestId('celebration-particles')).toHaveCount(0);
  expect(await transformCount(page.getByTestId('buddy-body').first())).toBe(1);
});
