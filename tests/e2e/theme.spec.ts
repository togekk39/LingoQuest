import { test, expect, enterApp, bundledCourse, beginFirstLesson } from './helpers';

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

for (const mode of ['light', 'dark', 'oled']) {
  test(`challenge primary foregrounds stay white in ${mode} mode`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem('lq_theme', theme), mode);
    await enterApp(page);
    const lessonIds = bundledCourse.payload.units
      .filter((unit: { id: string }) => ['u01', 'u02'].includes(unit.id))
      .flatMap((unit: { lessons: { id: string }[] }) => unit.lessons.map((lesson) => lesson.id));
    await page.evaluate((completedLessons) => {
      const local = JSON.parse(localStorage.getItem('lq_offline_state_v1')!);
      local.completedLessons = completedLessons;
      localStorage.setItem('lq_offline_state_v1', JSON.stringify(local));
    }, lessonIds);
    await page.reload();
    await page.getByRole('tab', { name: 'Desafíos', exact: true }).click();
    await page.getByRole('button', { name: 'Explorar práctica', exact: true }).click();
    await page.getByRole('button', { name: /^Nivel 1:/ }).click();
    await page.getByRole('switch', { name: 'Practicar sin reloj' }).check();
    const start = page.getByRole('button', { name: 'Empezar práctica', exact: true });
    await expect(start).toHaveCSS('background-color', 'rgb(22, 125, 114)');
    await expect(start.getByText('Empezar práctica', { exact: true })).toHaveCSS(
      'color',
      'rgb(255, 255, 255)',
    );
    await expect(start.locator('svg')).toHaveCSS('stroke', 'rgb(255, 255, 255)');
    await start.click();
    const answer = page.getByRole('radio').first();
    await answer.click();
    const letter = answer.getByText('A', { exact: true });
    await expect(letter).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(letter.locator('..')).toHaveCSS('background-color', 'rgb(22, 125, 114)');
    await expect(
      page
        .getByRole('button', { name: 'Enviar respuesta', exact: true })
        .getByText('Enviar respuesta', { exact: true }),
    ).toHaveCSS('color', 'rgb(255, 255, 255)');
  });
}

for (const mode of ['light', 'dark', 'oled']) {
  test(`review mastery fill stays visible in ${mode} mode`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem('lq_theme', theme), mode);
    await enterApp(page);
    await beginFirstLesson(page);
    await page.getByRole('radio').first().click();
    await page.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Siguiente ejercicio', exact: true }),
    ).toBeVisible();
    await page.evaluate(() => {
      const local = JSON.parse(localStorage.getItem('lq_offline_state_v1')!);
      local.mastery.forEach((skill: { value: number }) => {
        skill.value = 0.25;
      });
      localStorage.setItem('lq_offline_state_v1', JSON.stringify(local));
    });
    await page.reload();
    await page.getByRole('button', { name: 'Repasar un poquito', exact: true }).click();
    await page.getByRole('tab', { name: 'Todas mis habilidades', exact: true }).click();
    const track = page.getByRole('progressbar').first();
    await expect(track).toBeVisible();
    await expect(track).toHaveAttribute('aria-valuenow', '25');
    const fill = track.locator(':scope > div');
    await expect(fill).toHaveCSS(
      'background-color',
      mode === 'light' ? 'rgb(22, 125, 114)' : 'rgb(121, 217, 195)',
    );
    const colors = await track.evaluate((el) => [
      getComputedStyle(el).backgroundColor,
      getComputedStyle(el.firstElementChild!).backgroundColor,
    ]);
    expect(colors[0]).not.toBe(colors[1]);
    const ratio = await track.evaluate(
      (el) =>
        el.firstElementChild!.getBoundingClientRect().width / el.getBoundingClientRect().width,
    );
    expect(ratio).toBeCloseTo(0.25, 2);
  });
}
