import {
  CHAPTER_CATALOG_FILE,
  type ChapterCatalog,
  type ChapterPack,
} from '@lingoquest/course-pack';
import type { Page } from '@playwright/test';
import {
  click,
  exact,
  expect,
  initialChapterTimeout,
  readyOfflineShell,
  state,
  test,
} from './helpers';

const currentCatalog = `/chapter-packs/${CHAPTER_CATALOG_FILE}`;
const previousCatalog = '/chapter-packs/catalog-v6.json';
const previousAdventureCatalog = '/chapter-packs/catalog-v7.json';

async function openCartagenaFromMap(page: Page) {
  await page.getByRole('tab', exact('Mapa')).click();
  await click(page, '3. Cartagena');
  await click(page, 'Abrir capítulo');
}

async function installedCartagenaRevision(page: Page) {
  return page.evaluate(
    () =>
      new Promise<number | undefined>((resolve, reject) => {
        const database = indexedDB.open('lingoquest-chapter-packs');
        database.onerror = () => reject(database.error);
        database.onsuccess = () => {
          const db = database.result;
          const request = db.transaction('packs').objectStore('packs').get('colombia');
          request.onsuccess = () => resolve(request.result && JSON.parse(request.result).revision);
          request.onerror = () => reject(request.error);
          db.close();
        };
      }),
  );
}

test('the installed Cartagena guide works offline and keeps its learning after the adventure upgrade', async ({
  page,
  context,
  request,
}) => {
  const oldCatalogResponse = await request.get(previousCatalog);
  const newCatalogResponse = await request.get(currentCatalog);
  const previousAdventureResponse = await request.get(previousAdventureCatalog);
  expect(oldCatalogResponse.ok()).toBe(true);
  expect(newCatalogResponse.ok()).toBe(true);
  expect(previousAdventureResponse.ok()).toBe(true);
  const oldCatalog: ChapterCatalog = await oldCatalogResponse.json();
  const newCatalog: ChapterCatalog = await newCatalogResponse.json();
  const previousAdventure: ChapterCatalog = await previousAdventureResponse.json();
  const oldRevision = oldCatalog.chapters.colombia.revision;
  const newRevision = newCatalog.chapters.colombia.revision;
  expect(oldRevision).toBe(7);
  expect(previousAdventure.chapters.colombia.revision).toBe(12);
  expect(newRevision).toBeGreaterThan(previousAdventure.chapters.colombia.revision);
  expect((await request.get('/chapter-packs/12/colombia.json')).ok()).toBe(true);
  const guide = await request.get(`/chapter-packs/${oldRevision}/colombia.json`);
  expect(guide.ok()).toBe(true);
  const { lesson, story }: ChapterPack = await guide.json();
  expect(story).toBeUndefined();

  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.addEventListener(
        'ended',
        () => {
          document.body.dataset.cartagenaGuideAudio = this.currentSrc.startsWith('data:audio/')
            ? 'data:audio/'
            : this.currentSrc;
        },
        { once: true },
      );
      return play.call(this);
    };
  });
  const catalogRoute = `**${currentCatalog}`;
  await context.route(catalogRoute, (route) => route.fulfill({ json: oldCatalog }));
  await page.goto('/');
  await page
    .getByRole('button', exact('Explorar primero'))
    .click({ timeout: initialChapterTimeout });
  await openCartagenaFromMap(page);

  const card = page.getByTestId('chapter-lesson-colombia');
  const adventure = page.getByRole('button', exact('Explorar aventura de este capítulo'));
  await expect(card.getByText(lesson.dialogue[0].en, { exact: true })).toBeVisible();
  await expect(adventure).toHaveCount(0);
  expect(await installedCartagenaRevision(page)).toBe(oldRevision);

  await readyOfflineShell(page, context);
  await context.unroute(catalogRoute);
  await page.reload();
  await openCartagenaFromMap(page);
  await expect(card.getByText(lesson.dialogue[0].en, { exact: true })).toBeVisible();
  await expect(adventure).toHaveCount(0);
  expect(await installedCartagenaRevision(page)).toBe(oldRevision);
  await card.getByRole('button', exact(`Escuchar ${lesson.dialogue[0].en}`)).click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-cartagena-guide-audio',
    /^(blob:|data:audio\/)/,
  );

  const { options, answerIndex } = lesson.question;
  await card.getByRole('radio', exact(options[answerIndex])).click();
  await card.getByRole('button', exact('Comprobar respuesta')).click();
  await expect(card.getByText(/^¡Muy bien!/)).toBeVisible();
  const oldAnswer = (await state(page)).unifiedLearning.evidence.find(
    (entry) =>
      entry.exerciseId === 'published.colombia.card-1.question' &&
      entry.materialVersion === `colombia:${oldRevision}`,
  );
  expect(oldAnswer).toMatchObject({
    source: 'study',
    activity: 'answer',
    outcome: 'target',
    independent: false,
  });

  await context.setOffline(false);
  const newPackResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === `/chapter-packs/${newRevision}/colombia.json`,
  );
  await page.reload();
  expect((await newPackResponse).ok()).toBe(true);
  await expect.poll(() => installedCartagenaRevision(page)).toBe(newRevision);

  await context.setOffline(true);
  await page.reload();
  await openCartagenaFromMap(page);
  await expect(card.getByText(lesson.dialogue[0].en, { exact: true })).toBeVisible();
  await adventure.click();
  await expect(page.getByTestId('story-scene-cartagena-street')).toBeVisible();
  await page.getByTestId('story-hotspot-cartagena-street-postcard').click();
  await page.getByTestId('story-choice-cartagena-go-to-market').click();
  await expect(page.getByTestId('story-scene-cartagena-market')).toBeVisible();
  expect((await state(page)).unifiedLearning.evidence).toContainEqual(oldAnswer);
});
