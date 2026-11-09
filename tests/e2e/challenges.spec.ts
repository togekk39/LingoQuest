import {
  test,
  expect,
  enterApp,
  state,
  learningProgress,
  readyOfflineShell,
  bundledCourse,
} from './helpers';

async function unlockLearnedMaterial(page: import('@playwright/test').Page) {
  // Set the prerequisite for challenge-specific tests. The separate learner journey
  // exercises real lesson completion; the engine tests enforce the serverless gate.
  const learned = bundledCourse.payload.units
    .filter((unit: { id: string }) => ['u01', 'u02'].includes(unit.id))
    .flatMap((unit: { lessons: { id: string }[] }) => unit.lessons.map((lesson) => lesson.id));
  await page.evaluate((lessonIds) => {
    const local = JSON.parse(localStorage.getItem('lq_offline_state_v1')!);
    local.completedLessons = lessonIds;
    localStorage.setItem('lq_offline_state_v1', JSON.stringify(local));
  }, learned);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }),
  ).toBeVisible();
}

async function enterArena(page: import('@playwright/test').Page) {
  await page.getByRole('tab', { name: 'Desafíos', exact: true }).click();
  await expect(page.getByText('Un paso más allá.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explorar práctica', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Nivel \d+:/ })).toHaveCount(13);
}

test('challenges remain locked before the related lessons have been learned', async ({
  page,
  context,
}) => {
  await enterApp(page);
  await readyOfflineShell(page, context);
  await page.getByRole('tab', { name: 'Desafíos', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Completa las lecciones primero', exact: true }).first(),
  ).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Explorar práctica', exact: true })).toHaveCount(0);
  expect(Object.values((await state(page)).runs)).toHaveLength(0);
  expect((await state(page)).completedLessons).toEqual([]);
});

test('all thirteen learned-material challenge levels work offline and a failed challenge preserves learning', async ({
  page,
  context,
}) => {
  await enterApp(page);
  await readyOfflineShell(page, context);
  await unlockLearnedMaterial(page);
  const before = learningProgress(await state(page));
  await enterArena(page);
  await page.getByRole('button', { name: /^Nivel 13:/ }).click();
  await expect(page.getByText('Invencible', { exact: true })).toBeVisible();
  await expect(page.getByLabel(/^Tiempo restante:/)).toHaveCount(0);
  await page.getByRole('switch', { name: 'Practicar sin reloj' }).check();
  await page.getByRole('button', { name: 'Empezar práctica', exact: true }).click();
  await expect(page.getByLabel('Sin límite de tiempo', { exact: true })).toBeVisible();
  const local = await state(page);
  const run = Object.values(local.runs).find((item: any) => item.status === 'active');
  expect(run).toBeTruthy();
  expect(run.hearts).toBe(1);
  const exercise = run.items[run.position];
  const wrong = exercise.options.find((option: any) => option.id !== exercise.correctOptionId);
  await page.getByText(wrong.text, { exact: true }).click();
  await page.getByRole('button', { name: 'Enviar respuesta', exact: true }).click();
  await expect(page.getByText('Cada intento cuenta.', { exact: true })).toBeVisible();
  expect(learningProgress(await state(page))).toEqual(before);
  await page.getByRole('button', { name: 'Seguir aprendiendo', exact: true }).click();
  await expect(page.getByText('Tu ruta de aprendizaje', { exact: true })).toBeVisible();
});

test('reading has its own local clock budget, starts only after preflight and fits a phone', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterApp(page);
  await readyOfflineShell(page, context);
  await unlockLearnedMaterial(page);
  const before = learningProgress(await state(page));
  await enterArena(page);
  await page.getByText('Reading Quest', { exact: true }).click();
  await page.getByRole('button', { name: /^Nivel 13:/ }).click();
  await expect(page.getByLabel(/^Tiempo restante:/)).toHaveCount(0);
  expect(Object.values((await state(page)).runs)).toHaveLength(0);
  await page.getByRole('button', { name: 'Empezar práctica', exact: true }).click();
  await expect(page.getByText('LEE CON ATENCIÓN', { exact: true })).toBeVisible();
  const run = Object.values((await state(page)).runs).find((item: any) => item.status === 'active');
  expect(run.deadline - run.startedAt).toBeGreaterThanOrEqual(180000);
  expect(run.items[0].passage.trim().split(/\s+/).length).toBeGreaterThan(5);
  expect(
    run.items.every((item: any) =>
      item.requiredLessonIds?.every((id: string) =>
        (before.completedLessons as string[]).includes(id),
      ),
    ),
  ).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Salir de la práctica', exact: true }).click();
  await page.getByRole('button', { name: 'Salir de la práctica', exact: true }).last().click();
  await expect(page.getByText('A tu ritmo, siempre.', { exact: true }).last()).toBeVisible();
  expect(learningProgress(await state(page))).toEqual(before);
});
