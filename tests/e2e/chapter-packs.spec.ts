import type { ChapterPack } from '@lingoquest/course-pack';
import type { Page } from '@playwright/test';
import { click, enterApp, exact, expect, readyOfflineShell, state, test } from './helpers';

async function savedChapters(page: Page) {
  return page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const database = indexedDB.open('lingoquest-chapter-packs');
        database.onerror = () => reject(database.error);
        database.onsuccess = () => {
          const db = database.result;
          const request = db.transaction('packs').objectStore('packs').getAllKeys();
          request.onsuccess = () => resolve(request.result.map(String));
          request.onerror = () => reject(request.error);
          db.close();
        };
      }),
  );
}

test('launch downloads the first chapter with byte progress and reuses it offline', async ({
  page,
  context,
  networkGuard,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('lq_setting:onboarded', 'true');
    const fetchFile = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const response = await fetchFile(input, init);
      if (new URL(response.url).pathname !== '/chapter-packs/2/home.json') return response;
      const bytes = new Uint8Array(await response.arrayBuffer());
      const middle = Math.ceil(bytes.length / 2);
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(bytes.subarray(0, middle));
            window.addEventListener(
              'finish-home-transfer',
              () => {
                controller.enqueue(bytes.subarray(middle));
                controller.close();
              },
              { once: true },
            );
          },
        }),
        { status: response.status, headers: response.headers },
      );
    };
  });

  await page.goto('/');
  const progress = page.getByRole('progressbar', exact('Descarga del capítulo'));
  await expect(page.getByRole('heading', exact('La primera postal'))).toBeVisible();
  await expect(progress).toHaveAttribute('aria-valuenow', '50');
  await expect(page.getByText('Descargando capítulo…', { exact: true })).toBeVisible();
  await expect(page.getByText('50 %', { exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('finish-home-transfer')));
  const adventure = page.getByRole('button', exact('Comenzar mi aventura'));
  await expect(adventure).toBeVisible();
  expect(await savedChapters(page)).toContain('home');

  await readyOfflineShell(page, context);
  const transferCount = networkGuard.attempted.filter((url) =>
    url.includes('/chapter-packs/'),
  ).length;
  await page.reload();
  await expect(adventure).toBeVisible();
  expect(networkGuard.attempted.filter((url) => url.includes('/chapter-packs/'))).toHaveLength(
    transferCount,
  );
});

test('continuing to chapter two keeps chapter one until the new pack is verified', async ({
  page,
  context,
  networkGuard,
}) => {
  await enterApp(page);
  await page.evaluate(() => {
    const key = 'lq_offline_state_v1';
    const saved = JSON.parse(localStorage.getItem(key)!);
    const date = new Date().toISOString();
    saved.travel.completed = { hello: date, bus: date, bag: date };
    saved.travel.stamps.home = date;
    saved.travel.note = 'My first postcard';
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload();
  await click(page, 'Abrir pasaporte');
  const before = await state(page);

  const packUrl = '**/chapter-packs/1/mexico.json';
  await context.route(packUrl, (request) =>
    request.fulfill({ body: '{"incomplete":true}', contentType: 'application/json' }),
  );
  await click(page, 'Continuar a Ciudad de México');
  await expect(page.getByRole('heading', exact('No se pudo descargar'))).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('La descarga del capítulo está incompleta');
  expect(await savedChapters(page)).toContain('home');
  expect(await savedChapters(page)).not.toContain('mexico');

  await context.unroute(packUrl);
  await click(page, 'Reintentar');
  await expect(page.getByTestId('chapter-lesson-mexico')).toBeVisible();
  expect(await savedChapters(page)).toContain('mexico');
  expect(await savedChapters(page)).not.toContain('home');
  expect(await state(page)).toEqual(before);

  await readyOfflineShell(page, context);
  const transferCount = networkGuard.attempted.filter((url) =>
    url.includes('/chapter-packs/'),
  ).length;
  await page.reload();
  await click(page, 'Abrir pasaporte');
  await expect(page.getByRole('textbox', exact('Mi recuerdo'))).toHaveValue('My first postcard');
  await click(page, 'Continuar a Ciudad de México');
  await expect(page.getByTestId('chapter-lesson-mexico')).toBeVisible();
  expect(networkGuard.attempted.filter((url) => url.includes('/chapter-packs/'))).toHaveLength(
    transferCount,
  );
});

test('opening a destination downloads its lessons and media when needed', async ({
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
  const openLondon = async () => {
    await page.getByRole('tab', exact('Mapa')).click();
    await click(page, '10. Londres');
    await expect(
      page.getByRole('button', {
        name: /Descargar capítulo|Importar archivo del capítulo|Buscar actualización/,
      }),
    ).toHaveCount(0);
    await click(page, 'Abrir capítulo');
  };
  await enterApp(page);
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
  await openLondon();
  await expect(page.getByRole('alert')).toContainText('Revisa tu conexión a internet');
  await click(page, 'Volver');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await openLondon();
  await expect(page.getByRole('alert')).toContainText('Revisa tu conexión a internet');

  await context.setOffline(false);
  const transfer = page.waitForResponse((response) =>
    /^\/chapter-packs\/\d+\/london\.json$/.test(new URL(response.url()).pathname),
  );
  await click(page, 'Reintentar');
  const downloaded = await transfer;
  expect(downloaded.ok()).toBe(true);
  const { lesson: downloadedLesson }: ChapterPack = await downloaded.json();
  const openingLine = downloadedLesson.dialogue[0].en;
  await expect(page.getByTestId('chapter-lesson-london')).toBeVisible();
  expect(await state(page)).toEqual(before);
  const transferCount = networkGuard.attempted.filter((url) => url === downloaded.url()).length;

  await context.setOffline(true);
  await page.reload();
  await openLondon();
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
