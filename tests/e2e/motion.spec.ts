import type { Locator } from '@playwright/test';
import {
  test,
  expect,
  enterApp,
  finishVocabulary,
  finishGreetingPractice,
  openLessons,
  openTravelWriting,
  click,
  exact,
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
  await page.getByRole('tab', exact('Aprender')).click();
  const button = page.getByRole('button', exact('Lecciones'));
  await button.hover();
  await page.mouse.down();
  await expect
    .poll(() => button.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a))
    .toBeLessThan(0.99);
  await page.mouse.move(5, 5);
  await page.mouse.up();
  await button.focus();
  await page.keyboard.press('Enter');
  await click(page, 'Continuar sin nombre');
  await expect(page.getByTestId('travel-step-dialogue')).toBeVisible();
  await click(page, 'Continuar');
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await finishGreetingPractice(page);
  await page.getByRole('textbox', exact('Tu respuesta en inglés')).fill('Hello.');
  await click(page, 'Comprobar respuesta');
  const buddy = page.getByTestId('buddy-body').first();
  await expect.poll(() => transformCount(buddy)).toBeGreaterThan(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => transformCount(buddy)).toBe(1);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => transformCount(buddy)).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

test('mission progress stays mounted across vocabulary and a correct answer celebrates', async ({
  page,
}) => {
  await enterApp(page);
  await openLessons(page);
  const progress = page.getByRole('progressbar');
  await progress.evaluate((element) => ((element as HTMLElement).dataset.retained = 'yes'));
  await click(page, 'Continuar');
  await click(page, 'Continuar');
  await click(page, 'Siguiente palabra');
  await expect(progress).toHaveAttribute('data-retained', 'yes');
  await click(page, 'Cerrar y volver');
  await openLessons(page);
  await expect(page.getByRole('button', exact('Escuchar: I am'))).toBeVisible();
  await click(page, 'Siguiente palabra');
  await click(page, 'Ver la explicación');
  await click(page, 'Probar en la historia');
  await finishGreetingPractice(page);
  await page.getByRole('textbox', exact('Tu respuesta en inglés')).fill('Hi! I am Luz.');
  await click(page, 'Comprobar respuesta');
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
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await openTravelWriting(page);
  await page.getByRole('textbox', exact('Tu respuesta en inglés')).fill('Hi! I am Luz.');
  await page.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click();
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  const buddy = page.getByTestId('buddy-body').first();
  await expect(buddy).toBeVisible();
  await expect(page.getByTestId('celebration-particles')).toHaveCount(0);
  expect(await transformCount(buddy)).toBe(1);
});
