import { test, expect, click, exact, enterApp } from './helpers';

for (const width of [390, 1280]) {
  test(`travel theme remains readable and persists at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await enterApp(page);
    await click(page, 'Cambiar tema');
    await page.getByRole('radio', exact('Oscuro')).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('lq_theme'))).toBe('dark');
    await page.reload();
    const header = page.getByRole('heading', exact('Cuaderno de viaje'));
    await expect(header).toBeVisible();
    expect(await header.evaluate((node) => getComputedStyle(node).color)).toBe(
      'rgb(255, 240, 218)',
    );
    await click(page, 'Palabras del viaje');
    await expect(page.getByRole('button', exact('Escuchar: Hi'))).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}
