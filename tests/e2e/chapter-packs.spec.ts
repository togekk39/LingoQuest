import { createHash } from 'node:crypto';
import {
  serializeChapterPack,
  type ChapterCatalog,
  type ChapterPack,
} from '@lingoquest/course-pack';
import type { Page, Response } from '@playwright/test';
import { click, enterApp, exact, expect, readyOfflineShell, state, test } from './helpers';

const catalogPath = '/chapter-packs/catalog.json';
const londonPath = /^\/chapter-packs\/\d+\/london\.json$/;
const isLondonPack = (response: Response) => londonPath.test(new URL(response.url()).pathname);

async function openLondon(page: Page) {
  await page.getByRole('tab', exact('Mapa')).click();
  await click(page, '10. Londres');
  return page.getByTestId('chapter-package-london');
}

test('a chapter download can be retried and opens with its own media after an offline reload', async ({
  page,
  context,
  networkGuard,
}) => {
  await page.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.addEventListener(
        'ended',
        () => {
          document.body.dataset.chapterAudio = this.currentSrc.startsWith('data:audio/')
            ? 'data:audio'
            : this.currentSrc;
          document.body.dataset.chapterAudioDuration = String(this.duration);
        },
        { once: true },
      );
      return play.call(this);
    };
  });
  await enterApp(page);
  const panel = await openLondon(page);
  await readyOfflineShell(page, context);
  const before = await state(page);
  const cachedPacks = await page.evaluate(async () => {
    const entries = await Promise.all(
      (await caches.keys()).map(async (key) => (await caches.open(key)).keys()),
    );
    return entries.flat().filter(({ url }) => new URL(url).pathname.startsWith('/chapter-packs/'))
      .length;
  });
  expect(cachedPacks).toBe(0);
  expect(networkGuard.attempted.some((url) => url.includes('/chapter-packs/'))).toBe(false);

  await panel.getByRole('button', exact('Descargar capítulo')).click();
  const retry = panel.getByRole('button', exact('Reintentar descarga'));
  await expect(retry).toBeVisible();
  await expect(panel.getByText('Disponible sin conexión', { exact: true })).toHaveCount(0);

  await context.setOffline(false);
  const transfer = page.waitForResponse(isLondonPack);
  await retry.click();
  const downloaded = await transfer;
  expect(downloaded.ok()).toBe(true);
  const { lesson: downloadedLesson }: ChapterPack = await downloaded.json();
  const openingLine = downloadedLesson.dialogue[0].en;
  await expect(panel.getByText('Disponible sin conexión', { exact: true })).toBeVisible();
  expect(await state(page)).toEqual(before);
  const transferCount = networkGuard.attempted.filter((url) => url === downloaded.url()).length;

  await context.setOffline(true);
  await page.reload();
  const saved = await openLondon(page);
  await expect(saved.getByText('Disponible sin conexión', { exact: true })).toBeVisible();
  await saved.getByRole('button', exact('Abrir capítulo descargado')).click();

  const lesson = page.getByTestId('chapter-lesson-london');
  await expect(lesson).toBeVisible();
  await expect(page.getByRole('heading', exact(downloadedLesson.title))).toBeVisible();
  await expect(lesson.getByText(openingLine, { exact: true })).toBeVisible();
  const picture = page.getByTestId('chapter-cover-london').locator('img');
  await expect(picture).toHaveAttribute('src', /^(?:blob:|data:image\/)/);
  await expect
    .poll(() => picture.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await lesson.getByRole('button', exact(`Escuchar ${openingLine}`)).click();
  await expect(page.locator('body')).toHaveAttribute('data-chapter-audio', /^(?:blob:|data:audio)/);
  await expect
    .poll(async () =>
      Number(await page.locator('body').getAttribute('data-chapter-audio-duration')),
    )
    .toBeGreaterThan(0);
  const { options, answerIndex } = downloadedLesson.question;
  await lesson.getByRole('radio', exact(options[answerIndex])).click();
  await lesson.getByRole('button', exact('Comprobar respuesta')).click();
  await expect(lesson.getByText(/^¡Muy bien!/)).toBeVisible();
  expect(networkGuard.attempted.filter((url) => url === downloaded.url())).toHaveLength(
    transferCount,
  );
});

test('a content revision updates without a new app build and failed updates keep the old lesson', async ({
  page,
  context,
}) => {
  await enterApp(page);
  const panel = await openLondon(page);
  const before = await state(page);
  const catalogResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === catalogPath,
  );
  const transfer = page.waitForResponse(isLondonPack);
  await panel.getByRole('button', exact('Descargar capítulo')).click();
  const { sha256: originalDigest, ...original }: ChapterPack = await (await transfer).json();
  expect(originalDigest).toMatch(/^[a-f0-9]{64}$/);
  const catalog: ChapterCatalog = await (await catalogResponse).json();
  const versionLabel = (revision: number) =>
    panel.getByText(`Versión ${revision}`, { exact: true });
  const checkUpdate = panel.getByRole('button', exact('Buscar actualización'));
  await expect(versionLabel(original.revision)).toBeVisible();

  await readyOfflineShell(page, context);
  await checkUpdate.click();
  await expect(panel.getByRole('alert')).toBeVisible();
  await expect(versionLabel(original.revision)).toBeVisible();
  await panel.getByRole('button', exact('Abrir capítulo descargado')).click();
  await expect(page.getByRole('heading', exact(original.lesson.title))).toBeVisible();
  await click(page, 'Cerrar y volver');

  const revision = original.revision + 1;
  const title = 'Una nueva edición de la lección de Londres';
  const extraTitle = 'Otra ruta para llegar a tiempo';
  const extraObjective = 'Practica otra alternativa para llegar a la entrevista.';
  const body = serializeChapterPack({
    ...original,
    revision,
    lesson: { ...original.lesson, title },
    additionalLessons: [
      ...original.additionalLessons,
      { ...original.lesson, title: extraTitle, objectiveEs: extraObjective },
    ],
  });
  catalog.chapters.london = {
    revision,
    sizeBytes: Buffer.byteLength(body),
    sha256: createHash('sha256').update(body).digest('hex'),
  };
  const updatedPath = `/chapter-packs/${revision}/london.json`;
  let incomplete = true;
  await context.route(`**${catalogPath}`, (route) => route.fulfill({ json: catalog }));
  await context.route(`**${updatedPath}`, (route) =>
    route.fulfill({
      body: incomplete ? body.slice(0, -16) : body,
      contentType: 'application/json',
    }),
  );
  await context.setOffline(false);
  await checkUpdate.click();
  await expect(panel.getByRole('alert')).toBeVisible();
  await expect(versionLabel(original.revision)).toBeVisible();

  incomplete = false;
  await checkUpdate.click();
  await expect(panel.getByText('Capítulo actualizado.', { exact: true })).toBeVisible();
  await expect(versionLabel(revision)).toBeVisible();
  expect(await state(page)).toEqual(before);

  await context.setOffline(true);
  await page.reload();
  const saved = await openLondon(page);
  await expect(versionLabel(revision)).toBeVisible();
  await saved.getByRole('button', exact('Abrir capítulo descargado')).click();
  await expect(page.getByRole('heading', exact(title))).toBeVisible();
  const opened = page.getByTestId('chapter-lesson-london');
  await opened.getByRole('button', exact(extraTitle)).click();
  await expect(page.getByRole('heading', exact(extraTitle))).toBeVisible();
  await expect(opened.getByText(extraObjective, { exact: true })).toBeVisible();
});

test('a saved package can be imported offline only for its matching chapter', async ({
  page,
  context,
  request,
}) => {
  const catalog: ChapterCatalog = await (await request.get(catalogPath)).json();
  const revision = catalog.chapters.london.revision;
  const file = await request.get(`/chapter-packs/${revision}/london.json`);
  expect(file.ok()).toBe(true);
  const buffer = await file.body();
  const { lesson }: ChapterPack = JSON.parse(buffer.toString());
  const upload = { name: 'london.json', mimeType: 'application/json', buffer };

  await enterApp(page);
  await readyOfflineShell(page, context);
  await page.getByRole('tab', exact('Mapa')).click();
  await click(page, '2. Ciudad de México');
  const other = page.getByTestId('chapter-package-mexico');
  const wrongChoice = page.waitForEvent('filechooser');
  await other.getByRole('button', exact('Importar archivo del capítulo')).click();
  await (await wrongChoice).setFiles(upload);
  await expect(other.getByRole('alert')).toContainText('para este capítulo');
  await expect(other.getByRole('button', exact('Abrir capítulo descargado'))).toHaveCount(0);

  const london = await openLondon(page);
  const matchingChoice = page.waitForEvent('filechooser');
  await london.getByRole('button', exact('Importar archivo del capítulo')).click();
  await (await matchingChoice).setFiles(upload);
  await expect(london.getByText(`Versión ${revision}`, { exact: true })).toBeVisible();

  await page.reload();
  const saved = await openLondon(page);
  await saved.getByRole('button', exact('Abrir capítulo descargado')).click();
  await expect(page.getByRole('heading', exact(lesson.title))).toBeVisible();
});
