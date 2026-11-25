import { readFileSync } from 'node:fs';
import {
  CHAPTER_CATALOG_FILE,
  type ChapterCatalog,
  type ChapterPack,
} from '@lingoquest/course-pack';
import {
  getUnifiedMastery,
  type OfflineState,
  type TravelMission,
} from '@lingoquest/offline-engine';
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

test.use({ actionTimeout: 15_000 });

const exercise = (page: Page, id: string) => page.getByTestId(`exercise-${id}`);
const input = (page: Page, id: string) =>
  exercise(page, id).getByRole('textbox', exact('Tu respuesta en inglés'));
const feedback = (page: Page) => page.getByTestId('answer-feedback');
const journal = (page: Page) => page.getByTestId('travel-event-journal');
const reply = (page: Page) => page.getByTestId('travel-story-reply');
const start = (page: Page, id: string) => page.getByTestId(`story-choice-${id}`).click();
const hotspot = (page: Page, id: string) => page.getByTestId(`story-hotspot-${id}`).click();
const saved = async (page: Page) => (await state(page)) as OfflineState;
const checkpoint = async (page: Page) => (await saved(page)).chapterProgress?.peru?.travel.active;
const evidence = async (page: Page, id: string) =>
  (await saved(page)).unifiedLearning.evidence.filter(
    ({ exerciseId, activity }) => exerciseId === id && activity === 'answer',
  );

async function map(page: Page) {
  await page.getByRole('tab', exact('Mapa')).click();
  await click(page, '4. Cusco');
  await click(page, 'Abrir capítulo');
  await expect(page.getByTestId('chapter-lesson-peru')).toBeVisible();
}

async function study(page: Page, mission: TravelMission) {
  await page.getByRole('tab', exact('Aprender')).click();
  await click(page, 'Estudiar en Cusco');
  await click(page, 'Practicar las misiones');
  await click(page, mission.title);
}

async function typeAnswer(page: Page, id: string, value: string) {
  await input(page, id).fill(value);
  await input(page, id).press('Enter');
  await expect(feedback(page)).toBeVisible();
}

async function playMission(
  page: Page,
  mission: TravelMission,
  override?: (id: string) => Promise<boolean>,
  story = true,
) {
  for (const step of mission.steps) {
    const activity = page.locator(`[id="travel-step-id-${step.id}"]`);
    await expect(activity).toBeVisible();
    if (step.type === 'dialogue') await click(page, 'Continuar');
    else if (step.type === 'teach') {
      await expect(activity.getByTestId('grammar-workbench')).toContainText(step.text);
      await click(page, 'Probar en la historia');
    } else if (step.type === 'speak') {
      await expect(page.getByTestId('speaking-studio')).toBeVisible();
      await click(page, 'Ahora no puedo hablar');
    } else {
      if (await override?.(step.id)) continue;
      if (step.audio) {
        await click(page, 'Escuchar el mensaje');
        await expect.poll(async () => (await checkpoint(page))?.audioPlayed).toBe(true);
      }
      if (step.exercise.options?.length) {
        const option = step.exercise.options.find(
          ({ id }) => id === step.exercise.correctOptionId,
        )!;
        await exercise(page, step.id).getByRole('radio', exact(option.text)).click();
        await click(page, 'Comprobar respuesta');
      } else if (step.exercise.ungradable) {
        await input(page, step.id).fill(
          'Diego visited the museum. Ana saw Nora. Nora left at four.',
        );
        await expect(
          activity.getByText('Ana did not see Nora at the shop.', { exact: false }),
        ).toHaveCount(0);
        await click(page, 'Revisar mi respuesta');
      } else await typeAnswer(page, step.id, step.exercise.acceptedAnswers[0]);
      await expect(feedback(page)).toContainText(
        step.exercise.ungradable ? 'Revisa tu respuesta' : '¡Muy bien!',
      );
      await click(page, 'Seguir la historia');
    }
  }
  if (story) {
    const done = page.getByTestId('story-encounter-finish');
    if (await done.isVisible()) await done.click();
  } else {
    await click(page, 'Volver al viaje');
    await click(page, 'Cerrar y volver');
  }
}

test('Cusco shares an offline travel journal and language evidence between Study and Story', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(300_000);
  await page.clock.setFixedTime(Date.UTC(2026, 10, 25, 17));
  await page.setViewportSize({ width: 414, height: 850 });
  const catalog: ChapterCatalog = await (
    await request.get(`/chapter-packs/${CHAPTER_CATALOG_FILE}`)
  ).json();
  const pack: ChapterPack = await (
    await request.get(`/chapter-packs/${catalog.chapters.peru.revision}/peru.json`)
  ).json();
  const missions = pack.story?.chapter.missions as unknown as TravelMission[];
  expect(missions).toHaveLength(5);
  await page.goto('/');
  await page
    .getByRole('button', exact('Explorar primero'))
    .click({ timeout: initialChapterTimeout });
  await map(page);
  await click(page, 'Cerrar y volver');
  await readyOfflineShell(page, context);

  await study(page, missions[0]);
  await playMission(
    page,
    missions[0],
    async (id) => {
      if (id !== 'cusco-be-listen') return false;
      await click(page, 'Leer la transcripción');
      const step = missions[0].steps.find((entry) => entry.id === id)!;
      if (step.type !== 'exercise') throw new Error('Missing listening exercise.');
      const choice = step.exercise.options!.find(({ id }) => id === step.exercise.correctOptionId)!;
      await exercise(page, id).getByRole('radio', exact(choice.text)).click();
      await click(page, 'Comprobar respuesta');
      await click(page, 'Seguir la historia');
      expect((await evidence(page, id)).at(-1)).toMatchObject({
        source: 'study',
        independent: false,
      });
      return true;
    },
    false,
  );
  await map(page);
  await click(page, 'Explorar aventura de este capítulo');
  await hotspot(page, 'cusco-past-be-next');

  const ask = 'cusco-market-inquire';
  const record = 'cusco-market-record';
  const askPerson = (id: string) => page.getByTestId(`travel-event-ask-${id}`).click();
  const more = () => click(page, 'Hacer otra pregunta');
  for (const mission of missions.slice(1)) {
    await hotspot(page, `${mission.id}-open`);
    await start(page, `${mission.id}-start`);
    await playMission(page, mission, async (id) => {
      if (id === ask) {
        await expect(journal(page)).toContainText('0/2 datos confirmados');
        await expect(journal(page)).not.toContainText('11:00');
        await typeAnswer(page, ask, 'Did you went to the market?');
        await expect(feedback(page)).toContainText('forma base');
        expect((await evidence(page, ask)).at(-1)).toMatchObject({
          error: 'did_base',
          outcome: 'incorrect',
        });
        await click(page, 'Intentar otra vez');
        await typeAnswer(page, ask, 'Did you take the photo?');
        await expect(reply(page)).toContainText("No, I didn't.");
        await expect(reply(page).getByRole('button', exact('Escuchar frase'))).toBeVisible();
        await expect(journal(page)).toContainText('Sam no realizó esta acción.');
        await expect(journal(page)).toContainText('0/2 datos confirmados');
        await more();
        await typeAnswer(page, ask, 'Did you take a photo?');
        await expect(reply(page)).toContainText("No, I didn't.");
        expect((await evidence(page, ask)).at(-1)).toMatchObject({
          outcome: 'communication_only',
          targets: [],
        });
        await more();
        await askPerson('luz');
        await typeAnswer(page, ask, 'Did you take the photo?');
        await expect(reply(page)).toContainText('Yes, I did.');
        await expect(journal(page)).toContainText('1/2 datos confirmados');
        await more();
        const draft = 'When did you take';
        await input(page, ask).fill(draft);
        await expect.poll(async () => (await checkpoint(page))?.answer.text).toBe(draft);
        await page.reload();
        await map(page);
        await click(page, 'Explorar aventura de este capítulo');
        await expect(input(page, ask)).toHaveValue(draft);
        await click(page, 'Cerrar y volver');
        await study(page, mission);
        await expect(input(page, ask)).toHaveValue(draft);
        await expect(journal(page)).toContainText('1/2 datos confirmados');
        await click(page, 'Cerrar y volver');
        await click(page, 'Cerrar y volver');

        await page.getByRole('tab', exact('Perfil')).click();
        const downloaded = page.waitForEvent('download');
        await click(page, 'Exportar mis datos');
        const path = await (await downloaded).path();
        if (!path) throw new Error('No backup was exported.');
        const backup = readFileSync(path);
        expect(
          JSON.parse(backup.toString()).state.chapterProgress.peru.travel.active.scenario.confirmed,
        ).toEqual([{ eventId: 'photo', field: 'person' }]);
        const picker = page.waitForEvent('filechooser');
        await click(page, 'Restaurar respaldo');
        await (
          await picker
        ).setFiles({
          name: 'lingoquest-respaldo.json',
          mimeType: 'application/json',
          buffer: backup,
        });
        await click(page, 'Reemplazar con este respaldo');
        await expect(page.getByText('Respaldo restaurado en este dispositivo.')).toBeVisible();
        await map(page);
        await click(page, 'Explorar aventura de este capítulo');
        await expect(input(page, ask)).toHaveValue(draft);
        await typeAnswer(page, ask, 'When did you take the photo?');
        await expect(reply(page)).toContainText('At eleven.');
        await expect(journal(page)).toContainText('2/2 datos confirmados');
        await click(page, 'Seguir la historia');
        expect(
          (await evidence(page, ask))
            .flatMap(({ targets }) => targets)
            .map(({ targetId }) => targetId),
        ).not.toContain('form.u04_l03.4');
        return true;
      }
      if (id === record) {
        await typeAnswer(page, id, "Luz didn't took a photo.");
        expect((await evidence(page, id)).at(-1)).toMatchObject({
          outcome: 'incorrect',
          error: 'did_base',
          targets: expect.arrayContaining([
            { targetId: 'pattern.u04_l04.negative', dimension: 'grammar_production' },
          ]),
        });
        await click(page, 'Intentar otra vez');
        await typeAnswer(page, id, "Luz didn't take the photo.");
        expect((await evidence(page, id)).at(-1)).toMatchObject({
          outcome: 'context_mismatch',
          targets: [],
        });
        await click(page, 'Intentar otra vez');
        await typeAnswer(page, id, 'At 11:00 a.m., Luz took a photo.');
        await expect(journal(page)).toContainText('Luz took a photo.');
        await click(page, 'Seguir la historia');
        return true;
      }
      if (id === 'cusco-museum-inquire') {
        await expect(journal(page)).not.toContainText('3:00');
        await askPerson('diego');
        await typeAnswer(page, id, 'When did Ana see Nora?');
        await expect(reply(page)).toContainText('At three.');
        await more();
        await askPerson('nora');
        await typeAnswer(page, id, 'Where did Ana see Nora?');
        await expect(reply(page)).toContainText('At the museum entrance.');
        await click(page, 'Seguir la historia');
        return true;
      }
      return false;
    });
    await start(page, `${mission.id}-continue`);
  }
  await start(page, 'cusco-take-postcard');
  await click(page, 'Mochila');
  await expect(page.getByTestId('story-inventory-cusco-salvador-postcard')).toBeVisible();
  const progress = await saved(page);
  expect(progress.chapterProgress?.peru?.travel.stamps.peru).toBeTruthy();
  const wh = getUnifiedMastery(progress.unifiedLearning, 'pattern.cusco.wh-did', 'writing');
  expect(wh).toMatchObject({ transfer: 'verified', retention: 'unverified' });
  expect((await evidence(page, 'cusco-museum-own-account')).at(-1)).toMatchObject({
    outcome: 'ungradable',
    independent: false,
  });
  expect(getUnifiedMastery(progress.unifiedLearning, 'grammar.did', 'writing')).toMatchObject({
    independentSuccesses: 0,
    assistedSuccesses: 0,
    transferSuccesses: 0,
  });

  await click(page, 'Cerrar y volver');
  const didMastery = async () =>
    getUnifiedMastery((await saved(page)).unifiedLearning, 'grammar.did', 'grammar_production');
  expect((await didMastery()).pendingErrors).toContain('did_base');
  await page.getByRole('tab', exact('Perfil')).click();
  await click(page, 'Mis habilidades');
  await page
    .getByTestId('learning-review-grammar_production:grammar.did')
    .getByRole('button', { name: /^Abrir repaso rápido:/ })
    .click();
  await typeAnswer(page, 'cusco-did-base-guide', 'Did you buy bread?');
  expect((await didMastery()).pendingErrors).toContain('did_base');
  await click(page, 'Probar otra escena');
  await typeAnswer(page, 'cusco-did-base-write', 'Did you go to the plaza?');
  expect((await didMastery()).pendingErrors).not.toContain('did_base');
  const negative = async () =>
    getUnifiedMastery(
      (await saved(page)).unifiedLearning,
      'pattern.u04_l04.negative',
      'grammar_production',
    );
  expect((await negative()).pendingErrors).toContain('did_base');
  await click(page, 'Volver al viaje');
  await click(page, 'Cerrar y volver');

  await map(page);
  await click(page, 'Quitar descarga');
  await click(page, 'Quitar recursos del dispositivo');
  await expect(
    page.getByText('Recursos descargados eliminados. Tu progreso sigue guardado.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('tab', exact('Perfil')).click();
  await click(page, 'Mis habilidades');
  await page
    .getByTestId('learning-review-grammar_production:form.u04_l03.4')
    .getByRole('button', { name: /^Abrir repaso rápido:/ })
    .click();
  const textReview = page.getByTestId(/^exercise-cusco-(?:took-photo|photo-review)/);
  await expect(textReview).toBeVisible();
  const reviewId = (await textReview.getAttribute('data-testid'))?.replace(/^exercise-/, '');
  const review = (pack.story?.practice as TravelMission['steps']).find(({ id }) => id === reviewId);
  if (review?.type !== 'exercise') throw new Error('Missing authored text review.');
  await typeAnswer(page, review.id, review.exercise.acceptedAnswers[0]);
  await expect(feedback(page)).toContainText('¡Muy bien!');
  expect((await evidence(page, review.id)).at(-1)).toMatchObject({
    source: 'review',
    outcome: 'target',
    materialVersion: `peru:${pack.revision}`,
  });
  expect((await saved(page)).chapterProgress?.peru?.travel.stamps.peru).toBeTruthy();
});

test('the Peru travel card keeps its evidence when the Cusco adventure is installed', async ({
  page,
  context,
  request,
}) => {
  const old = (await (
    await request.get('/chapter-packs/catalog-v8.json')
  ).json()) as ChapterCatalog;
  const catalog = (await (
    await request.get(`/chapter-packs/${CHAPTER_CATALOG_FILE}`)
  ).json()) as ChapterCatalog;
  const resource = `/chapter-packs/${old.chapters.peru.revision}/peru.json`;
  const previous = (await (await request.get(resource)).json()) as ChapterPack;
  expect(previous.story).toBeUndefined();
  expect(catalog.chapters.peru.revision).toBeGreaterThan(old.chapters.peru.revision);
  const catalogRoute = `**/chapter-packs/${CHAPTER_CATALOG_FILE}`;
  await context.route(catalogRoute, (route) => route.fulfill({ json: old }));
  await page.goto('/');
  await page
    .getByRole('button', exact('Explorar primero'))
    .click({ timeout: initialChapterTimeout });
  await map(page);
  const card = page.getByTestId('chapter-lesson-peru');
  await expect(page.getByRole('heading', exact(previous.lesson.title))).toBeVisible();
  await expect(page.getByRole('button', exact('Explorar aventura de este capítulo'))).toHaveCount(
    0,
  );
  await card
    .getByRole(
      'radio',
      exact(previous.lesson.question.options[previous.lesson.question.answerIndex]),
    )
    .click();
  await card.getByRole('button', exact('Comprobar respuesta')).click();
  await expect(card.getByText(/^¡Muy bien!/)).toBeVisible();
  const attempt = (await evidence(page, 'published.peru.card-1.question'))[0];
  expect(attempt).toMatchObject({
    outcome: 'target',
    materialVersion: `peru:${old.chapters.peru.revision}`,
  });
  await context.unroute(catalogRoute);
  const packResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname ===
      `/chapter-packs/${catalog.chapters.peru.revision}/peru.json`,
  );
  await page.reload();
  expect((await packResponse).ok()).toBe(true);
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          new Promise<number>((resolve, reject) => {
            const open = indexedDB.open('lingoquest-chapter-packs');
            open.onerror = () => reject(open.error);
            open.onsuccess = () => {
              const database = open.result;
              const fetch = database.transaction('packs').objectStore('packs').get('peru');
              fetch.onerror = () => reject(fetch.error);
              fetch.onsuccess = () => resolve(JSON.parse(fetch.result).revision);
              database.close();
            };
          }),
      ),
    )
    .toBe(catalog.chapters.peru.revision);
  await page.reload();
  await map(page);
  await click(page, 'Explorar aventura de este capítulo');
  await expect(page.getByTestId('story-scene-cusco-past-be-scene')).toBeVisible();
  expect(await evidence(page, 'published.peru.card-1.question')).toContainEqual(attempt);
});
