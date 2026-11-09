import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createCoursePack, serializeCoursePack } from '@lingoquest/course-pack';
import {
  test,
  expect,
  enterApp,
  state,
  learningProgress,
  beginFirstLesson,
  finishAllWrong,
  readyOfflineShell,
  type ExerciseFixture,
} from './helpers';
import type { Page } from '@playwright/test';

const bundled = JSON.parse(
  readFileSync(resolve(process.cwd(), 'apps/mobile/src/content/bundled-course.json'), 'utf8'),
);
function upgradedPack() {
  const payload = structuredClone(bundled.payload);
  payload.lessons.u01_l02.contextEs =
    'Este concepto actualizado viene de un paquete local verificado.';
  const [major, minor, patch] = bundled.manifest.version.split('.').map(Number);
  return createCoursePack(payload, {
    ...bundled.manifest,
    version: `${major}.${minor}.${patch + 1}`,
    titleEs: 'Curso actualizado de prueba',
  });
}
async function importFile(page: Page, button: string, name: string, text: string) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: button, exact: true }).click();
  await (await chooser).setFiles({ name, mimeType: 'application/json', buffer: Buffer.from(text) });
}
async function profile(page: Page) {
  await page.getByRole('tab', { name: 'Perfil', exact: true }).click();
}

test('course files update offline, preserve progress and reject corrupt content without replacing it', async ({
  page,
  context,
}) => {
  await enterApp(page);
  await beginFirstLesson(page);
  await finishAllWrong(page, bundled.payload.lessons.u01_l01.exercises as ExerciseFixture[]);
  await page.getByRole('button', { name: 'Volver a mi camino', exact: true }).click();
  const before = learningProgress(await state(page));
  await profile(page);
  await expect(page.getByText('Contenido sin conexión', { exact: true })).toBeVisible();
  await readyOfflineShell(page, context);
  const updated = upgradedPack();
  await importFile(
    page,
    'Importar paquete de curso',
    'course-update.lqp.json',
    serializeCoursePack(updated),
  );
  await expect(page.getByText('Curso actualizado de prueba', { exact: true })).toBeVisible();
  expect(learningProgress(await state(page))).toEqual(before);
  const corrupt = structuredClone(updated);
  corrupt.payload.lessons.u01_l01.title = 'Una modificación sin checksum válido';
  await importFile(
    page,
    'Importar paquete de curso',
    'corrupt-course.lqp.json',
    JSON.stringify(corrupt),
  );
  await expect(
    page.getByText('La verificación del paquete falló. Descárgalo de nuevo.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Curso actualizado de prueba', { exact: true })).toBeVisible();
  expect(learningProgress(await state(page))).toEqual(before);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }).click();
  await expect(
    page.getByText(updated.payload.lessons.u01_l02.contextEs, { exact: true }),
  ).toBeVisible();
});

test('GitHub content download happens only after an explicit action and installs verified static content', async ({
  page,
  networkGuard,
}) => {
  const updated = upgradedPack();
  const url = 'https://github.com/example/lingoquest/releases/download/course-test/course.lqp.json';
  networkGuard.allow(url);
  const downloads: string[] = [];
  page.on('request', (request) => {
    if (request.url() === url) downloads.push(request.url());
  });
  await page.route(url, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: serializeCoursePack(updated),
    }),
  );
  await enterApp(page);
  await profile(page);
  expect(downloads).toEqual([]);
  await page
    .getByRole('textbox', { name: 'URL del paquete de curso', exact: true })
    .fill('https://api.openai.com/v1/unsupported-course');
  await page.getByRole('button', { name: 'Descargar e instalar', exact: true }).click();
  await expect(
    page.getByText('Usa un enlace HTTPS de github.com o raw.githubusercontent.com.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(downloads).toEqual([]);
  await page.getByRole('textbox', { name: 'URL del paquete de curso', exact: true }).fill(url);
  expect(downloads).toEqual([]);
  await page.getByRole('button', { name: 'Descargar e instalar', exact: true }).click();
  await expect(page.getByText('Curso actualizado de prueba', { exact: true })).toBeVisible();
  expect(downloads).toEqual([url]);
  expect((await state(page)).xp).toBe(0);
});

test('a local backup exports, resets and restores progress with no account or server', async ({
  page,
}) => {
  await enterApp(page);
  await beginFirstLesson(page);
  await finishAllWrong(page, bundled.payload.lessons.u01_l01.exercises as ExerciseFixture[]);
  await page.getByRole('button', { name: 'Volver a mi camino', exact: true }).click();
  await profile(page);
  const before = learningProgress(await state(page));
  await page.getByRole('textbox', { name: 'Tu nombre', exact: true }).fill('Aprendiz local');
  await page.getByRole('button', { name: 'Guardar preferencias', exact: true }).click();
  await expect.poll(async () => (await state(page)).user.name).toBe('Aprendiz local');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar mis datos', exact: true }).click();
  const file = await downloaded;
  const backupText = readFileSync((await file.path())!, 'utf8');
  const backup = JSON.parse(backupText);
  expect(backup.format).toBe('lingoquest-backup');
  expect(backup.state.user.name).toBe('Aprendiz local');
  expect(learningProgress(backup.state)).toEqual(before);
  await page.getByRole('button', { name: 'Borrar progreso local', exact: true }).click();
  await page
    .getByRole('button', { name: 'Borrar progreso de este dispositivo', exact: true })
    .click();
  await expect.poll(async () => (await state(page)).xp).toBe(0);
  expect((await state(page)).completedLessons).toEqual([]);
  await importFile(page, 'Restaurar respaldo', 'learning-backup.json', backupText);
  await page.getByRole('button', { name: 'Reemplazar con este respaldo', exact: true }).click();
  await expect.poll(async () => learningProgress(await state(page))).toEqual(before);
  await expect(page.getByRole('textbox', { name: 'Tu nombre', exact: true })).toHaveValue(
    'Aprendiz local',
  );
  await expect(page.getByRole('button', { name: 'Ya tengo una cuenta', exact: true })).toHaveCount(
    0,
  );
});
