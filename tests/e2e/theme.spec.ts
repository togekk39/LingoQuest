import { test, expect, enterApp } from './helpers';

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`theme switching persists and covers learning at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await enterApp(page);
    await page.getByRole('button', { name: 'Cambiar tema', exact: true }).click();
    const dark = page.getByRole('radio', { name: 'Oscuro', exact: true });
    await dark.click();
    await expect(dark).toHaveAttribute('aria-checked', 'true');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.backgroundColor))
      .toBe('rgb(16, 26, 25)');
    await page.getByRole('radio', { name: 'Negro OLED', exact: true }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('lq_theme'))).toBe('oled');
    await page.getByRole('button', { name: 'Cerrar apariencia' }).click();
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.backgroundColor))
      .toBe('rgb(0, 0, 0)');
    await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
    await expect(page.getByText('Tu ruta de aprendizaje', { exact: true })).toBeVisible();
    const header = page.getByRole('button', { expanded: true });
    await expect(header).toHaveCSS('background-color', 'rgb(9, 43, 33)');
    await page.getByRole('tab', { name: 'Inicio', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }).click();
    await expect(page.getByTestId('lesson-stage-goal')).toBeVisible();
    await expect(
      page.getByText('Una situación, paso a paso', { exact: true }).locator('..'),
    ).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await page.getByRole('button', { name: 'Cerrar y volver', exact: true }).click();
    await page.getByRole('tab', { name: 'Perfil', exact: true }).click();
    await page.getByRole('radio', { name: 'Claro', exact: true }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('lq_theme'))).toBe('light');
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.backgroundColor))
      .toBe('rgb(247, 250, 247)');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}
