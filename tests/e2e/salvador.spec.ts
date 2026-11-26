import { readFileSync } from 'node:fs';
import {
  CHAPTER_CATALOG_FILE,
  type ChapterCatalog,
  type ChapterPack,
} from '@lingoquest/course-pack';
import {
  travelStepVocabulary,
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

const checkpoint = async (page: Page) =>
  ((await state(page)) as OfflineState).chapterProgress?.brazil?.travel.active;
const board = (page: Page) => page.getByTestId('travel-team-board');
const reply = (page: Page) => page.getByTestId('travel-story-reply');
const exercise = (page: Page, id: string) => page.getByTestId(`exercise-${id}`);
const input = (page: Page, id: string) =>
  exercise(page, id).getByRole('textbox', exact('Tu respuesta en inglés'));
const select = (page: Page, id: string) => page.getByTestId(`travel-team-talk-${id}`).click();
const choice = (page: Page, id: string) => page.getByTestId(`story-choice-${id}`).click();
const continueStory = (page: Page) => click(page, 'Seguir la historia');

async function map(page: Page) {
  await page.getByRole('tab', exact('Mapa')).click();
  await click(page, '5. Salvador');
  await click(page, 'Abrir capítulo');
  await expect(page.getByTestId('chapter-lesson-brazil')).toBeVisible();
}

async function answer(page: Page, id: string, text: string) {
  await input(page, id).fill(text);
  await input(page, id).press('Enter');
  await expect(page.getByTestId('answer-feedback')).toBeVisible();
}

async function play(
  page: Page,
  mission: TravelMission,
  override: (id: string) => Promise<boolean>,
) {
  for (const step of mission.steps) {
    const wrapper = page.locator(`[id="travel-step-id-${step.id}"]`);
    await expect(wrapper).toBeVisible();
    if (step.type === 'dialogue') {
      await page.getByRole('button', { name: /^(Continuar|Escuchar la conversación)$/ }).click();
    } else if (step.type === 'teach') {
      for (const [index] of travelStepVocabulary(mission, step).entries())
        await click(
          page,
          index === travelStepVocabulary(mission, step).length - 1
            ? 'Ver la explicación'
            : 'Siguiente palabra',
        );
      await click(page, 'Probar en la historia');
    } else if (step.type === 'speak') {
      await click(page, 'Ahora no puedo hablar');
    } else {
      if (await override(step.id)) continue;
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
        await expect(
          wrapper.getByText(step.exercise.acceptedAnswers[0], { exact: false }),
        ).toHaveCount(0);
        await input(page, step.id).fill('Bia is hanging the pictures. Can you help me?');
        await click(page, 'Revisar mi respuesta');
        await expect(page.getByTestId('answer-feedback')).toContainText('Revisa tu respuesta');
      } else {
        await answer(page, step.id, step.exercise.acceptedAnswers[0]);
      }
      await continueStory(page);
    }
  }
  const done = page.getByTestId('story-encounter-finish');
  if (await done.isVisible()) await done.click();
}

test('Salvador coordinates two offline teams and restores a selected teammate, state and draft', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 414, height: 850 });
  const catalog: ChapterCatalog = await (
    await request.get(`/chapter-packs/${CHAPTER_CATALOG_FILE}`)
  ).json();
  const pack: ChapterPack = await (
    await request.get(`/chapter-packs/${catalog.chapters.brazil.revision}/brazil.json`)
  ).json();
  const missions = (pack.story!.chapter.missions as unknown as TravelMission[]).filter(
    ({ optional }) => !optional,
  );
  await page.goto('/');
  await page
    .getByRole('button', exact('Explorar primero'))
    .click({ timeout: initialChapterTimeout });
  await map(page);
  await click(page, 'Cerrar y volver');
  await readyOfflineShell(page, context);
  await map(page);
  await click(page, 'Explorar aventura de este capítulo');

  for (const mission of missions) {
    await page.getByTestId(`story-hotspot-${mission.id}-open`).click();
    await choice(page, `${mission.id}-start`);
    await play(page, mission, async (id) => {
      if (id === 'salvador-observe' || id === 'salvador-display-observe') {
        await answer(
          page,
          id,
          id === 'salvador-observe'
            ? 'Jo is washing the vegetables.'
            : 'Bia is hanging the pictures.',
        );
        await click(page, 'Seguir conversando');
        await answer(
          page,
          id,
          id === 'salvador-observe' ? 'Rafa is cooking rice.' : 'Leo is reading the labels.',
        );
        await continueStory(page);
        return true;
      }
      if (id === 'salvador-observe-update') {
        await answer(page, id, 'Jo is washing the vegetables.');
        await expect(page.getByTestId('answer-feedback')).toContainText('no coincide');
        await click(page, 'Intentar otra vez');
        await answer(page, id, 'What is Jo doing?');
        await expect(reply(page)).toContainText("I'm not working right now.");
        await continueStory(page);
        return true;
      }
      if (id === 'salvador-lunch-check') {
        await expect(board(page)).toContainText('Trabajo por confirmar');
        await expect(board(page)).not.toContainText('stirring the soup');
        await select(page, 'rafa');
        await answer(page, id, 'What are you doing?');
        await expect(reply(page)).toContainText("I'm stirring the soup.");
        await expect(board(page)).toContainText('Confirmado con el equipo');
        await continueStory(page);
        return true;
      }
      if (id === 'salvador-lunch-bread') {
        await select(page, 'sam');
        await answer(page, id, 'Can Sam cut the bread?');
        await expect(reply(page)).toContainText('Yes, I can.');
        await expect(board(page)).toContainText('Sin asignar · cut the bread');
        await click(page, 'Seguir conversando');
        const draft = 'Can you cut the';
        await input(page, id).fill(draft);
        await expect.poll(async () => (await checkpoint(page))?.answer.text).toBe(draft);
        const prior = await checkpoint(page);
        await page.reload();
        await map(page);
        await click(page, 'Explorar aventura de este capítulo');
        await expect(input(page, id)).toHaveValue(draft);
        await click(page, 'Cerrar y volver');
        await page.getByRole('tab', exact('Aprender')).click();
        await click(page, 'Estudiar en Salvador');
        await click(page, 'Practicar las misiones');
        await click(page, mission.title);
        await expect(input(page, id)).toHaveValue(draft);
        expect(await checkpoint(page)).toMatchObject({
          scenarioSpeaker: 'sam',
          scenario: prior!.scenario,
        });
        await click(page, 'Cerrar y volver');
        await click(page, 'Cerrar y volver');

        await page.getByRole('tab', exact('Perfil')).click();
        const exported = page.waitForEvent('download');
        await click(page, 'Exportar mis datos');
        const path = await (await exported).path();
        if (!path) throw new Error('No backup was exported.');
        const buffer = readFileSync(path);
        const backup = JSON.parse(buffer.toString()) as { state: OfflineState };
        expect(backup.state.chapterProgress?.brazil?.travel.active).toMatchObject({
          scenario: prior!.scenario,
          scenarioSpeaker: 'sam',
          answer: { text: draft },
        });
        const picker = page.waitForEvent('filechooser');
        await click(page, 'Restaurar respaldo');
        await (
          await picker
        ).setFiles({ name: 'lingoquest-respaldo.json', mimeType: 'application/json', buffer });
        await click(page, 'Reemplazar con este respaldo');
        await expect(page.getByText('Respaldo restaurado en este dispositivo.')).toBeVisible();
        await map(page);
        await click(page, 'Explorar aventura de este capítulo');
        await expect(input(page, id)).toHaveValue(draft);
        await answer(page, id, 'Can you cut the bread, please?');
        await expect(reply(page)).toContainText('Sure. I can do that.');
        await expect(board(page)).toContainText('Acordada · cut the bread');
        await continueStory(page);
        await expect(board(page)).toContainText('En curso · cutting the bread');
        return true;
      }
      if (id === 'salvador-lunch-bowls' || id === 'salvador-display-labels') {
        const kitchen = id === 'salvador-lunch-bowls';
        await select(page, kitchen ? 'luz' : 'noah');
        await answer(
          page,
          id,
          kitchen ? 'Can you put the bowls on the table?' : 'Can you put the labels on the table?',
        );
        await continueStory(page);
        return true;
      }
      if (id === 'salvador-display-move') {
        await select(page, 'nina');
        await answer(page, id, 'Can you move the table?');
        await continueStory(page);
        return true;
      }
      return false;
    });
    await choice(page, `${mission.id}-continue`);
  }
  await choice(page, 'salvador-take-postcard');
  await click(page, 'Mochila');
  await expect(page.getByTestId('story-inventory-salvador-valparaiso-postcard')).toContainText(
    'Postal para Lisboa',
  );
  const saved = (await state(page)) as OfflineState;
  expect(saved.chapterProgress?.brazil?.travel.stamps.brazil).toBeTruthy();
  const evidence = saved.unifiedLearning.evidence;
  expect(
    evidence.find(
      ({ exerciseId, activity }) =>
        exerciseId === 'salvador-display-handover' && activity === 'answer',
    ),
  ).toMatchObject({ outcome: 'ungradable', independent: false });
  expect(
    evidence.find(
      ({ exerciseId, activity }) => exerciseId === 'salvador-hear-cook' && activity === 'answer',
    ),
  ).toMatchObject({ outcome: 'target', independent: true });
  await click(page, 'Pasaporte');
  await expect(page.getByRole('heading', exact('Postal para Lisboa'))).toBeVisible();
  await context.setOffline(false);
  await click(page, 'Continuar a Lisboa');
  await expect(page.getByRole('heading', exact('Un nuevo plan en Lisboa'))).toBeVisible();
});

test('Brazil card evidence survives updating from catalog v10', async ({
  page,
  context,
  request,
}) => {
  const prior: ChapterCatalog = await (await request.get('/chapter-packs/catalog-v10.json')).json();
  const current: ChapterCatalog = await (
    await request.get(`/chapter-packs/${CHAPTER_CATALOG_FILE}`)
  ).json();
  const cardPack: ChapterPack = await (
    await request.get(`/chapter-packs/${prior.chapters.brazil.revision}/brazil.json`)
  ).json();
  expect(cardPack.story).toBeUndefined();
  const catalog = `**/chapter-packs/${CHAPTER_CATALOG_FILE}`;
  await context.route(catalog, (route) => route.fulfill({ json: prior }));
  await page.goto('/');
  await page
    .getByRole('button', exact('Explorar primero'))
    .click({ timeout: initialChapterTimeout });
  await map(page);
  const card = page.getByTestId('chapter-lesson-brazil');
  await expect(page.getByRole('heading', exact('El almuerzo en equipo'))).toBeVisible();
  if (cardPack.lesson.question.listening) {
    await card
      .getByRole('button', { name: /Escuchar/ })
      .first()
      .click();
  }
  await card
    .getByRole(
      'radio',
      exact(cardPack.lesson.question.options[cardPack.lesson.question.answerIndex]),
    )
    .click();
  await card.getByRole('button', exact('Comprobar respuesta')).click();
  await expect(card.getByText(/^¡Muy bien!/)).toBeVisible();
  const before = ((await state(page)) as OfflineState).unifiedLearning.evidence.find(
    ({ exerciseId, activity }) =>
      exerciseId === 'published.brazil.card-1.question' && activity === 'answer',
  )!;
  expect(before).toMatchObject({ materialVersion: `brazil:${prior.chapters.brazil.revision}` });
  await context.unroute(catalog);
  const downloaded = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname ===
      `/chapter-packs/${current.chapters.brazil.revision}/brazil.json`,
  );
  await page.reload();
  expect((await downloaded).ok()).toBe(true);
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          new Promise<number>((resolve, reject) => {
            const open = indexedDB.open('lingoquest-chapter-packs');
            open.onerror = () => reject(open.error);
            open.onsuccess = () => {
              const database = open.result;
              const fetch = database.transaction('packs').objectStore('packs').get('brazil');
              fetch.onerror = () => reject(fetch.error);
              fetch.onsuccess = () => {
                resolve(JSON.parse(fetch.result).revision);
                database.close();
              };
            };
          }),
      ),
    )
    .toBe(current.chapters.brazil.revision);
  await page.reload();
  await map(page);
  await click(page, 'Explorar aventura de este capítulo');
  await expect(page.getByTestId('story-scene-salvador-now-scene')).toBeVisible();
  expect(((await state(page)) as OfflineState).unifiedLearning.evidence).toContainEqual(before);
});

test('the optional next-lunch note opens offline in Study and evaluates four answers separately', async ({
  page,
  context,
  request,
}) => {
  const catalog: ChapterCatalog = await (
    await request.get(`/chapter-packs/${CHAPTER_CATALOG_FILE}`)
  ).json();
  const pack: ChapterPack = await (
    await request.get(`/chapter-packs/${catalog.chapters.brazil.revision}/brazil.json`)
  ).json();
  const optional = (pack.story!.chapter.missions as unknown as TravelMission[]).find(
    ({ optional }) => optional,
  )!;
  await page.goto('/');
  await page
    .getByRole('button', exact('Explorar primero'))
    .click({ timeout: initialChapterTimeout });
  await map(page);
  await click(page, 'Cerrar y volver');
  await readyOfflineShell(page, context);
  await page.getByRole('tab', exact('Aprender')).click();
  await click(page, 'Estudiar en Salvador');
  await click(page, 'Practicar las misiones');
  await click(page, optional.title);
  await play(page, optional, async () => false);
  const saved = (await state(page)) as OfflineState;
  expect(saved.chapterProgress?.brazil?.travel.stamps.brazil).toBeUndefined();
  const answers = saved.unifiedLearning.evidence.filter(
    ({ exerciseId, activity }) =>
      exerciseId.startsWith('salvador-a1-production-') && activity === 'answer',
  );
  expect(answers).toHaveLength(4);
  for (const item of optional.steps) {
    if (item.type !== 'exercise') continue;
    const event = answers.find(({ exerciseId }) => exerciseId === item.id);
    expect(event).toMatchObject({ outcome: 'target', independent: true, source: 'study' });
    expect(new Set(event!.targets.map(({ targetId }) => targetId))).toEqual(
      new Set([item.exercise.skillId]),
    );
  }
});
