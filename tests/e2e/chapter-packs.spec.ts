import { createHash } from 'node:crypto';
import {
  CHAPTER_CATALOG_FILE,
  serializeChapterPack,
  type ChapterCatalog,
  type ChapterPack,
} from '@lingoquest/course-pack';
import type { Page } from '@playwright/test';
import { chapterReaderSections } from '../curriculum/chapter-reader-sections';
import {
  click,
  enterApp,
  exact,
  expect,
  finishGreetingPractice,
  finishVocabulary,
  labelFirstChapterAudio,
  openLessons,
  readyOfflineShell,
  state,
  test,
} from './helpers';

const catalogUrl = `/chapter-packs/${CHAPTER_CATALOG_FILE}`;

function expectProgressWithChapterExposure(
  before: Awaited<ReturnType<typeof state>>,
  after: Awaited<ReturnType<typeof state>>,
  chapterId: string,
) {
  const { unifiedLearning: beforeLearning, ...beforeProgress } = before;
  const { unifiedLearning: afterLearning, ...afterProgress } = after;
  expect(afterProgress).toEqual(beforeProgress);
  expect(afterLearning.legacySchedules).toEqual(beforeLearning.legacySchedules);
  expect(afterLearning.evidence.slice(0, beforeLearning.evidence.length)).toEqual(
    beforeLearning.evidence,
  );
  expect(afterLearning.evidence.length).toBeGreaterThan(beforeLearning.evidence.length);
  for (const exposure of afterLearning.evidence.slice(beforeLearning.evidence.length)) {
    expect(exposure).toMatchObject({
      materialId: `published.${chapterId}.card-1`,
      activity: 'introduced',
      independent: false,
    });
  }
}

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

async function savedChapterRevision(page: Page, chapterId = 'home') {
  return page.evaluate(
    (id) =>
      new Promise<number | undefined>((resolve, reject) => {
        const database = indexedDB.open('lingoquest-chapter-packs');
        database.onerror = () => reject(database.error);
        database.onsuccess = () => {
          const db = database.result;
          const request = db.transaction('packs').objectStore('packs').get(id);
          request.onsuccess = () => resolve(request.result && JSON.parse(request.result).revision);
          request.onerror = () => reject(request.error);
          db.close();
        };
      }),
    chapterId,
  );
}

test('launch downloads the first chapter with byte progress and reuses it offline', async ({
  page,
  context,
  request,
  networkGuard,
}) => {
  const catalog: ChapterCatalog = await (await request.get(catalogUrl)).json();
  const home = catalog.chapters.home;
  const middle = Math.ceil(home.sizeBytes / 2);
  const nextChunk = middle + Math.floor(home.sizeBytes * 0.004);
  const sizeFormat = new Intl.NumberFormat('es-419', { maximumFractionDigits: 2 });
  const megabytes = (bytes: number) => `${sizeFormat.format(bytes / 1_000_000)} MB`;
  await page.setViewportSize({ width: 390, height: 740 });
  await page.addInitScript(
    ({ path, middle, nextChunk }) => {
      localStorage.setItem('lq_setting:onboarded', 'true');
      const fetchFile = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const response = await fetchFile(input, init);
        if (new URL(response.url).pathname !== path) return response;
        const bytes = new Uint8Array(await response.arrayBuffer());
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(bytes.subarray(0, middle));
              window.addEventListener(
                'advance-home-transfer',
                () => controller.enqueue(bytes.subarray(middle, nextChunk)),
                { once: true },
              );
              window.addEventListener(
                'finish-home-transfer',
                () => {
                  controller.enqueue(bytes.subarray(nextChunk));
                  controller.close();
                },
                { once: true },
              );
            },
          }),
          { status: response.status, headers: response.headers },
        );
      };
    },
    { path: `/chapter-packs/${home.revision}/home.json`, middle, nextChunk },
  );

  await page.goto('/');
  const backdrop = page.getByTestId('chapter-transfer-backdrop');
  const artwork = page.getByTestId('chapter-transfer-artwork').locator('img');
  const progress = page.getByRole('progressbar', exact('Descarga del capítulo'));
  await expect(page.getByRole('heading', exact('La primera postal'))).toBeVisible();
  expect(await backdrop.boundingBox()).toEqual({ x: 0, y: 0, width: 390, height: 740 });
  await expect(artwork).toHaveAttribute('src', /\/atlas-portrait\./);
  await expect(progress).toHaveAttribute('aria-valuenow', '50');
  await expect(page.getByText('Descargando capítulo…', { exact: true })).toBeVisible();
  await expect(page.getByText('50 %', { exact: true })).toBeVisible();
  await expect(
    page.getByText(`${megabytes(middle)} de ${megabytes(home.sizeBytes)}`, { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('advance-home-transfer')));
  const size = page.getByText(`${megabytes(nextChunk)} de ${megabytes(home.sizeBytes)}`, {
    exact: true,
  });
  await expect(size).toBeVisible();
  await expect(progress).toHaveAttribute('aria-valuenow', '50');
  await page.setViewportSize({ width: 740, height: 390 });
  await expect(artwork).toHaveAttribute('src', /\/atlas\./);
  await expect(progress).toHaveAttribute('aria-valuenow', '50');
  await expect(size).toBeVisible();
  await page.setViewportSize({ width: 390, height: 740 });
  await expect(artwork).toHaveAttribute('src', /\/atlas-portrait\./);
  await page.evaluate(() => window.dispatchEvent(new Event('finish-home-transfer')));
  const adventure = page.getByRole('button', exact('Comenzar mi aventura'));
  await expect(adventure).toBeVisible();
  await expect(backdrop).toHaveCount(0);
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

test('chapter two verifies its pack and keeps the first adventure, study and due review offline', async ({
  page,
  context,
  request,
  networkGuard,
}) => {
  const start = Date.UTC(2026, 10, 19, 17);
  await page.clock.setFixedTime(start);
  await enterApp(page);
  await openLessons(page);
  await click(page, 'Continuar');
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await click(page, 'Escuchar el saludo de Sam');
  await expect.poll(async () => (await state(page)).travel.active?.audioPlayed).toBe(true);
  await finishGreetingPractice(page);
  await click(page, 'Cerrar y volver');
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

  const catalog: ChapterCatalog = await (await request.get(catalogUrl)).json();
  const packUrl = `**/chapter-packs/${catalog.chapters.mexico.revision}/mexico.json`;
  await context.route(packUrl, (request) =>
    request.fulfill({ body: '{"incomplete":true}', contentType: 'application/json' }),
  );
  await click(page, 'Continuar a Ciudad de México');
  await expect(page.getByRole('heading', exact('No se pudo descargar'))).toBeVisible();
  expect(await page.getByTestId('chapter-transfer-backdrop').boundingBox()).toEqual({
    x: 0,
    y: 0,
    ...page.viewportSize(),
  });
  const artwork = page.getByTestId('chapter-transfer-artwork').locator('img');
  await expect(artwork).toHaveAttribute('src', /\/writing\./);
  await page.setViewportSize({ width: 390, height: 740 });
  await expect(artwork).toHaveAttribute('src', /\/writing-portrait\./);
  await expect(page.getByRole('alert')).toContainText('La descarga del capítulo está incompleta');
  expect(await savedChapters(page)).toContain('home');
  expect(await savedChapters(page)).not.toContain('mexico');
  expect(await state(page)).toEqual(before);

  await context.unroute(packUrl);
  await click(page, 'Reintentar');
  await expect(page.getByTestId('chapter-lesson-mexico')).toBeVisible();
  expect(await savedChapters(page)).toEqual(expect.arrayContaining(['home', 'mexico']));
  await expect
    .poll(async () => (await state(page)).unifiedLearning.evidence.length)
    .toBeGreaterThan(before.unifiedLearning.evidence.length);
  expectProgressWithChapterExposure(before, await state(page), 'mexico');

  await readyOfflineShell(page, context);
  const transferCount = networkGuard.attempted.filter((url) =>
    url.includes('/chapter-packs/'),
  ).length;
  await page.clock.setFixedTime(start + 2 * 24 * 60 * 60 * 1000);
  await page.reload();
  await click(page, 'Abrir pasaporte');
  await expect(page.getByRole('textbox', exact('Mi recuerdo'))).toHaveValue('My first postcard');
  await click(page, 'Continuar a Ciudad de México');
  await expect(page.getByTestId('chapter-lesson-mexico')).toBeVisible();
  await click(page, 'Cerrar y volver');
  await page.getByRole('tab', exact('Inicio')).click();
  await expect(page.getByRole('button', exact('Repaso rápido'))).toBeVisible();
  await page.getByRole('tab', exact('Aprender')).click();
  await click(page, 'Mis habilidades');
  await page
    .getByTestId('learning-review-vocabulary_recall:home.greeting-word')
    .getByRole('button', { name: /^Abrir repaso rápido:/ })
    .click();
  await expect(page.getByText('Recuerda lo aprendido · 1 min', { exact: true })).toBeVisible();
  const review = page.getByTestId('exercise-travel_review_greeting');
  await review.getByRole('textbox', exact('Tu respuesta en inglés')).fill('Hello!');
  await click(page, 'Comprobar respuesta');
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  expect((await state(page)).unifiedLearning.evidence).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ exerciseId: 'travel_hello_recognize', source: 'study' }),
      expect.objectContaining({ exerciseId: 'travel_hello_recall', source: 'study' }),
      expect.objectContaining({
        exerciseId: 'travel_review_greeting',
        source: 'review',
        outcome: 'target',
        independent: true,
      }),
    ]),
  );
  await click(page, 'Volver al viaje');
  await click(page, 'Cerrar y volver');
  await page.getByRole('tab', exact('Inicio')).click();
  await click(page, 'Volver a La primera postal');
  const skipName = page.getByRole('button', exact('Continuar sin nombre'));
  const plaza = page.getByTestId('story-scene-plaza');
  await expect(skipName.or(plaza)).toBeVisible();
  if (await skipName.isVisible()) await skipName.click();
  await expect(plaza).toBeVisible();
  const skipGuide = page.getByRole('button', exact('Omitir guía'));
  if (await skipGuide.isVisible()) await skipGuide.click();
  await click(page, 'Cerrar y volver');
  await openLessons(page);
  await expect(page.getByTestId(/^travel-step-/)).toBeVisible();
  expect(networkGuard.attempted.filter((url) => url.includes('/chapter-packs/'))).toHaveLength(
    transferCount,
  );
});

test('an installed first chapter survives a failed update and updates after retrying', async ({
  page,
  context,
  request,
}) => {
  const catalog: ChapterCatalog = await (await request.get(catalogUrl)).json();
  const previousRevision = 4;
  expect(catalog.chapters.home.revision).toBeGreaterThan(previousRevision);
  const previous = await (await request.get(`/chapter-packs/${previousRevision}/home.json`)).body();
  const previousCatalog: ChapterCatalog = {
    ...catalog,
    chapters: {
      ...catalog.chapters,
      home: {
        revision: previousRevision,
        sizeBytes: previous.length,
        sha256: createHash('sha256').update(previous).digest('hex'),
      },
    },
  };
  const route = `**${catalogUrl}`;
  await context.route(route, (entry) => entry.fulfill({ json: previousCatalog }));
  await labelFirstChapterAudio(page, request, { 'introduction-model': 'I am' });
  await page.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.addEventListener(
        'ended',
        async () => {
          if (
            document.querySelector('[data-testid="grammar-workbench"]') &&
            (await window.chapterAudioLabel(this.currentSrc)) === 'introduction-model'
          )
            document.body.dataset.playedIntroductionModel = 'true';
        },
        { once: true },
      );
      return play.call(this);
    };
  });
  await enterApp(page);
  expect(await savedChapterRevision(page)).toBe(previousRevision);

  await readyOfflineShell(page, context);
  await page.reload();
  expect(await savedChapterRevision(page)).toBe(previousRevision);
  await click(page, 'Comenzar mi aventura');
  const skipName = page.getByRole('button', exact('Continuar sin nombre'));
  const plaza = page.getByTestId('story-scene-plaza');
  await expect(skipName.or(plaza)).toBeVisible();
  if (await skipName.isVisible()) await skipName.click();
  await expect(plaza).toBeVisible();
  await click(page, 'Omitir guía');
  await page.getByTestId('story-hotspot-plaza-sam').click();
  for (const choiceId of [
    'greet-sam-in-english',
    'greet-luz-in-english',
    'reply-to-luz',
    'continue-opening-with-sam',
    'introduce-yourself',
  ])
    await page.getByTestId(`story-choice-${choiceId}`).click();
  await click(page, 'Siguiente palabra');
  await click(page, 'Siguiente palabra');
  await click(page, 'Ver la explicación');
  const grammar = page.getByTestId('story-learning').getByTestId('grammar-workbench');
  await grammar.getByRole('button', exact('Escuchar: I am')).click();
  await expect(page.locator('body')).toHaveAttribute('data-played-introduction-model', 'true');

  await context.setOffline(false);
  await context.unroute(route);
  const currentPath = `**/chapter-packs/${catalog.chapters.home.revision}/home.json`;
  await context.route(currentPath, (request) =>
    request.fulfill({ body: '{"incomplete":true}', contentType: 'application/json' }),
  );
  const beforeUpdate = await state(page);
  const corruptUpdate = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith(currentPath.slice(2)),
  );
  await page.reload();
  await corruptUpdate;
  await expect(page.getByRole('button', exact('Comenzar mi aventura'))).toBeVisible();
  expect(await savedChapterRevision(page)).toBe(previousRevision);
  expect((await state(page)).unifiedLearning).toEqual(beforeUpdate.unifiedLearning);

  await context.unroute(currentPath);
  await page.reload();
  await expect(page.getByRole('button', exact('Comenzar mi aventura'))).toBeVisible();
  await expect.poll(() => savedChapterRevision(page)).toBe(catalog.chapters.home.revision);
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
  await expect
    .poll(async () => (await state(page)).unifiedLearning.evidence.length)
    .toBeGreaterThan(before.unifiedLearning.evidence.length);
  expectProgressWithChapterExposure(before, await state(page), 'london');
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

test('early chapter cards render dialogue, teaching, question and optional model in the audited order', async ({
  page,
  request,
}) => {
  await enterApp(page);
  await page.getByRole('tab', exact('Mapa')).click();
  const headings = chapterReaderSections.map(({ heading }) => heading);
  const catalog: ChapterCatalog = await (await request.get(catalogUrl)).json();
  for (const [id, label] of [
    ['mexico', '2. Ciudad de México'],
    ['colombia', '3. Cartagena'],
    ['peru', '4. Cusco'],
  ]) {
    const packPath = `/chapter-packs/${catalog.chapters[id].revision}/${id}.json`;
    const { lesson }: ChapterPack = await (await request.get(packPath)).json();
    await click(page, label);
    await click(page, 'Abrir capítulo');
    const card = page.getByTestId('chapter-lesson-' + id);
    await expect(card).toBeVisible();
    const sectionLabels = headings.map((heading) => card.getByText(heading, { exact: true }));
    await expect(sectionLabels.reduce((all, label) => all.or(label))).toHaveText(headings);
    const model = card.getByText(lesson.model.en, { exact: true });
    await expect(model).toHaveCount(0);
    await card.getByRole('button', exact('Ver un modelo')).click();
    await expect(model).toBeVisible();
    await click(page, 'Cerrar y volver');
  }
});

test('an installed chapter updates when the catalog advances beyond the bundled revision', async ({
  page,
  context,
  request,
}) => {
  const catalog: ChapterCatalog = await (await request.get(catalogUrl)).json();
  const installedRevision = catalog.chapters.toronto.revision;
  const packPath = `/chapter-packs/${installedRevision}/toronto.json`;
  const { sha256: _oldDigest, ...pack }: ChapterPack = await (await request.get(packPath)).json();
  const revision = installedRevision + 1;
  const newTitle = 'Deletreo mi apellido y confirmo el aula';
  const newPack = serializeChapterPack({
    ...pack,
    revision,
    lesson: { ...pack.lesson, title: newTitle },
  });
  const newEntry = {
    revision,
    sizeBytes: Buffer.byteLength(newPack),
    sha256: createHash('sha256').update(newPack).digest('hex'),
  };

  async function openToronto() {
    await page.getByRole('tab', exact('Mapa')).click();
    await click(page, '9. Toronto');
    await click(page, 'Abrir capítulo');
  }
  await enterApp(page);
  await openToronto();
  await expect(page.getByRole('heading', exact(pack.lesson.title))).toBeVisible();
  expect(await savedChapterRevision(page, 'toronto')).toBe(installedRevision);
  const before = await state(page);

  await context.route(`**${catalogUrl}`, (entry) =>
    entry.fulfill({ json: { ...catalog, chapters: { ...catalog.chapters, toronto: newEntry } } }),
  );
  await context.route(`**/chapter-packs/${revision}/toronto.json`, (entry) =>
    entry.fulfill({ body: newPack, contentType: 'application/json' }),
  );
  await page.reload();
  await expect.poll(() => savedChapterRevision(page, 'toronto')).toBe(revision);
  await readyOfflineShell(page, context);
  await page.reload();
  await openToronto();
  await expect(page.getByRole('heading', exact(newTitle))).toBeVisible();
  await expect
    .poll(async () => (await state(page)).unifiedLearning.evidence.length)
    .toBeGreaterThan(before.unifiedLearning.evidence.length);
  expectProgressWithChapterExposure(before, await state(page), 'toronto');
});

test('removing a chapter in one tab prevents a pending background update from restoring it', async ({
  page,
  context,
  request,
}) => {
  const catalog: ChapterCatalog = await (await request.get(catalogUrl)).json();
  const oldRevision = 1;
  const oldPack = await (await request.get(`/chapter-packs/${oldRevision}/toronto.json`)).body();
  const oldCatalog = {
    ...catalog,
    chapters: {
      ...catalog.chapters,
      toronto: {
        revision: oldRevision,
        sizeBytes: oldPack.byteLength,
        sha256: createHash('sha256').update(oldPack).digest('hex'),
      },
    },
  };
  const catalogPattern = `**${catalogUrl}`;
  const originalCatalog = { json: oldCatalog };
  await page.route(catalogPattern, (entry) => entry.fulfill(originalCatalog));
  await enterApp(page);

  async function openToronto(activeTab: Page) {
    await activeTab.getByRole('tab', exact('Mapa')).click();
    await click(activeTab, '9. Toronto');
    await click(activeTab, 'Abrir capítulo');
    await expect(activeTab.getByTestId('chapter-lesson-toronto')).toBeVisible();
  }

  await openToronto(page);
  expect(await savedChapterRevision(page, 'toronto')).toBe(oldRevision);
  const homeRevision = await savedChapterRevision(page);
  await page.unroute(catalogPattern);

  await page.addInitScript(() => {
    const read = IDBObjectStore.prototype.get;
    IDBObjectStore.prototype.get = function (key) {
      const result = read.call(this, key);
      if (key === 'toronto' && this.name === 'packs' && this.transaction.mode === 'readwrite') {
        this.transaction.addEventListener('complete', () => {
          document.body.dataset.torontoRefresh = 'completed';
        });
        this.transaction.addEventListener('abort', () => {
          document.body.dataset.torontoRefresh = 'aborted';
        });
      }
      return result;
    };
  });
  const currentPath = `**/chapter-packs/${catalog.chapters.toronto.revision}/toronto.json`;
  let releaseUpdate!: () => void;
  const pauseUpdate = new Promise<void>((resolve) => {
    releaseUpdate = resolve;
  });
  await page.route(currentPath, async (entry) => {
    await pauseUpdate;
    await entry.continue();
  });

  const waitingForUpdate = page.waitForRequest(currentPath);
  await page.reload();
  await waitingForUpdate;
  const removalTab = await context.newPage();
  try {
    await removalTab.route(catalogPattern, (entry) => entry.fulfill(originalCatalog));
    await removalTab.goto('/');
    await openToronto(removalTab);
    await click(removalTab, 'Quitar descarga');
    await click(removalTab, 'Quitar recursos del dispositivo');
    await expect(removalTab.getByTestId('chapter-lesson-toronto')).toHaveCount(0);
    expect(await savedChapterRevision(removalTab, 'toronto')).toBeUndefined();

    releaseUpdate();
    await expect(page.locator('body')).toHaveAttribute(
      'data-toronto-refresh',
      /^(?:aborted|completed)$/,
    );
    expect(await savedChapterRevision(page, 'toronto')).toBeUndefined();
    expect(await savedChapterRevision(page)).toBe(homeRevision);
  } finally {
    releaseUpdate();
    await removalTab.close();
  }

  await openToronto(page);
  expect(await savedChapterRevision(page, 'toronto')).toBe(catalog.chapters.toronto.revision);
});

test('Salvador offers a fresh offline listening question with an optional translation', async ({
  page,
  context,
  request,
}) => {
  const catalog: ChapterCatalog = await (await request.get(catalogUrl)).json();
  const path = `/chapter-packs/${catalog.chapters.brazil.revision}/brazil.json`;
  const { lesson }: ChapterPack = await (await request.get(path)).json();
  const { listening, options, answerIndex } = lesson.question;
  expect(listening).toBeDefined();
  if (!listening) throw new Error('Listening item missing from the chapter');

  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.addEventListener(
        'playing',
        () => {
          document.body.dataset.salvadorAudio = this.currentSrc;
        },
        { once: true },
      );
      return play.call(this);
    };
  });
  await enterApp(page);
  async function openSalvador() {
    await page.getByRole('tab', exact('Mapa')).click();
    await click(page, '5. Salvador');
    await click(page, 'Abrir capítulo');
  }
  await openSalvador();
  const card = page.getByTestId('chapter-lesson-brazil');
  await expect(card).toBeVisible();
  await readyOfflineShell(page, context);
  await page.reload();
  await openSalvador();
  await expect(card).toBeVisible();

  const headings = chapterReaderSections.map(({ heading }) => heading);
  const sectionLabels = headings.map((heading) => card.getByText(heading, { exact: true }));
  await expect(sectionLabels.reduce((all, label) => all.or(label))).toHaveText(headings);
  await expect(card.getByText(listening.en, { exact: true })).toHaveCount(0);
  await click(page, 'Escuchar el mensaje');
  await expect(page.locator('body')).toHaveAttribute(
    'data-salvador-audio',
    /^(?:blob:|data:audio)/,
  );
  await card.getByRole('radio', exact(options[answerIndex])).click();
  await click(page, 'Comprobar respuesta');
  await expect(card.getByText(/^¡Muy bien!/)).toBeVisible();
  await click(page, 'Ver la transcripción');
  await expect(card.getByText(listening.en, { exact: true })).toBeVisible();
  await expect(card.getByText(listening.es, { exact: true })).toBeVisible();
});

test('Cape Town distinguishes what the ferry video shows from the unconfirmed departure time', async ({
  page,
}) => {
  await enterApp(page);
  await page.getByRole('tab', exact('Mapa')).click();
  await click(page, '19. Ciudad del Cabo');
  await click(page, 'Abrir capítulo');

  const card = page.getByTestId('chapter-lesson-south-africa');
  await expect(card.getByText(/solo se ve el ferry junto al muelle/)).toBeVisible();
  await expect(
    card.getByText(/Su teléfono indica que el video se grabó a las tres y cuarenta/),
  ).toBeVisible();
  const model = card.getByText(/Amara’s video shows the ferry next to the dock/);
  await expect(model).toHaveCount(0);
  await card.getByRole('button', exact('Ver un modelo')).click();
  await expect(model).toContainText('The video doesn’t show the ferry pulling away');
  await expect(model).toContainText('the actual departure time hasn’t been confirmed');
  await expect(model).toContainText('compare the recording with the terminal log');
});
