import type { Locator, Page } from '@playwright/test';
import {
  answerTravelChoice,
  answerTravelReorder,
  answerTravelText,
  capture,
  click,
  enterApp,
  exact,
  expect,
  finishGreetingPractice,
  finishVocabulary,
  readyOfflineShell,
  state,
  test,
} from './helpers';

const scene = (page: Page, id: string) => page.getByTestId(`story-scene-${id}`);
const hotspot = (page: Page, id: string) => page.getByTestId(`story-hotspot-${id}`);
const dialogue = (page: Page, id: string) => page.getByTestId(`story-dialogue-${id}`);
const choice = (page: Page, id: string) => page.getByTestId(`story-choice-${id}`);
const closeDialogue = (page: Page) => page.getByTestId('story-dialogue-close').click();
const inventoryItem = (page: Page, id: string) => page.getByTestId(`story-inventory-${id}`);
const writingInput = (page: Page, id: string) =>
  page.getByTestId(`exercise-${id}`).getByRole('textbox', exact('Tu respuesta en inglés'));

async function captureStory(page: Page, name: string, target: Locator) {
  if (!process.env.SCREENSHOTS_DIR) return;
  await target.evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await expect(target).toBeInViewport();
  await capture(page, name);
}

async function talk(page: Page, hotspotId: string, choiceId: string) {
  await hotspot(page, hotspotId).click();
  await choice(page, choiceId).click();
}

async function startIntroduction(page: Page) {
  await talk(page, 'plaza-sam', 'introduce-yourself');
  await click(page, 'Continuar');
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await finishGreetingPractice(page);
}

async function finishIntroduction(page: Page) {
  await answerTravelText(page, 'travel_hello_transfer', 'My name is Nico.');
  await click(page, 'Ahora no puedo hablar');
  await expect(scene(page, 'plaza')).toBeVisible();
}

async function reachBusStop(page: Page) {
  await expect(hotspot(page, 'plaza-to-stop')).toHaveCount(0);
  await talk(page, 'plaza-ticket', 'read-ticket');
  await expect(dialogue(page, 'ticket-read')).toBeVisible();
  await closeDialogue(page);
  await hotspot(page, 'plaza-to-stop').click();
  await expect(scene(page, 'bus-stop')).toBeVisible();
  await hotspot(page, 'stop-sam-directions').click();
  await expect(choice(page, 'give-directions')).toHaveCount(0);
  await closeDialogue(page);
  await hotspot(page, 'stop-sign').click();
  await expect(dialogue(page, 'stop-found')).toBeVisible();
  await closeDialogue(page);
}

async function giveDirections(page: Page, readTranscript = false) {
  await talk(page, 'stop-sam-directions', 'give-directions');
  await click(page, 'Continuar');
  await finishVocabulary(page);
  if (readTranscript) {
    await page.evaluate(() => delete document.body.dataset.storyAudio);
    await click(page, 'Escuchar a Sam');
    await expect
      .poll(() => page.evaluate(() => document.body.dataset.storyAudio))
      .toMatch(/line-4.*\.mp3/);
    await click(page, 'Leer la transcripción');
  }
  await answerTravelChoice(page, 'travel_bus_listen', 'La parada de bus');
  await answerTravelReorder(page, 'travel_bus_direction', ['It’s', 'next', 'to', 'the', 'park']);
  await answerTravelText(page, 'travel_bus_dictation', 'It’s next to the park.');
  await answerTravelText(page, 'travel_bus_ask', 'Where is the bus stop?');
  await answerTravelText(page, 'travel_bus_transfer', 'The park is next to the bus stop.');
  await click(page, 'Completar misión');
  await expect(scene(page, 'bus-stop')).toBeVisible();
}

async function identifyBackpack(page: Page) {
  await talk(page, 'lost-luz', 'read-sam-message');
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await answerTravelChoice(page, 'travel_bag_read', 'A blue bag');
  await answerTravelChoice(page, 'travel_bag_owner', 'Luz');
  await answerTravelText(page, 'travel_bag_write', 'It is blue.');
  await answerTravelText(page, 'travel_bag_transfer', 'It is red.');
  await click(page, 'Ahora no puedo hablar');
  await expect(scene(page, 'lost-property')).toBeVisible();
}

function evidence(snapshot: Awaited<ReturnType<typeof state>>) {
  return {
    xp: snapshot.xp,
    attempts: snapshot.attempts,
    mastery: snapshot.mastery,
    travelLearning: snapshot.travelLearning,
  };
}

test('Chapter 1 plays offline through the bench branch, resumes learning, and awards one postal', async ({
  page,
  context,
}) => {
  test.slow();
  const start = Date.UTC(2026, 10, 19, 17);
  if (process.env.SCREENSHOTS_DIR) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(start);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [];
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const playing = original.call(this);
      void playing
        .then(() => {
          document.body.dataset.storyAudio = this.currentSrc;
        })
        .catch(() => {});
      return playing;
    };
  });
  await enterApp(page);
  await readyOfflineShell(page, context);
  await click(page, 'Explorar aventura');
  await expect(scene(page, 'plaza')).toBeVisible();
  await expect(hotspot(page, 'plaza-origin')).toHaveAccessibleName('Postales de Honduras');
  await captureStory(page, 'phase4-01-plaza', scene(page, 'plaza'));
  await hotspot(page, 'plaza-luz').click();
  await expect(page.getByTestId('story-origin')).toContainText('Honduras');
  await expect(dialogue(page, 'luz-welcome')).toContainText('Honduras');
  await closeDialogue(page);
  await talk(page, 'plaza-origin', 'take-origin-sketch');
  await expect(dialogue(page, 'origin-sketch-taken')).toBeVisible();
  await closeDialogue(page);
  await talk(page, 'plaza-luz', 'show-origin-sketch');
  await expect(dialogue(page, 'luz-map-clue')).toBeVisible();
  await closeDialogue(page);

  await startIntroduction(page);
  const introduction = writingInput(page, 'travel_hello_write');
  await introduction.fill('Hi! I is Luz.');
  await click(page, 'Comprobar respuesta');
  await expect(
    page.getByTestId('answer-feedback').getByText(/Elige la forma de be que va con el sujeto/),
  ).toBeVisible();
  await click(page, 'Intentar otra vez');
  await introduction.fill('Hi! I am');
  await expect.poll(async () => (await state(page)).travel.active?.answer.text).toBe('Hi! I am');
  await click(page, 'Cerrar y volver');
  await expect(scene(page, 'plaza')).toBeVisible();
  await page.reload();
  await click(page, 'Explorar aventura');
  await page.getByTestId('story-encounter-resume').click();
  await expect(introduction).toHaveValue('Hi! I am');
  await answerTravelText(page, 'travel_hello_write', "Hi! I'm Luz.");
  await finishIntroduction(page);
  expect(
    (await state(page)).travelLearning?.targets.find(
      (target) => target.skill === 'writing' && target.conceptId === 'introduction',
    )?.successes,
  ).toMatchObject({
    production: { independent: 0, assisted: 1 },
    transfer: { independent: 1, assisted: 0 },
  });
  await expect(hotspot(page, 'plaza-luz-after-introduction')).toBeVisible();
  await expect(hotspot(page, 'plaza-luz')).toHaveCount(0);

  await reachBusStop(page);
  await captureStory(page, 'phase4-02-stop', scene(page, 'bus-stop'));
  await giveDirections(page, true);
  const beforeSearch = evidence(await state(page));
  await talk(page, 'stop-sam-search', 'search-bench');
  await expect(dialogue(page, 'sam-search-bench')).toContainText('Revisa debajo del banco');
  await closeDialogue(page);
  await expect(hotspot(page, 'stop-to-lost-property')).toHaveCount(0);
  await talk(page, 'stop-bench', 'read-bench-note');
  await expect(dialogue(page, 'bench-clue')).toBeVisible();
  await page.reload();
  await click(page, 'Explorar aventura');
  await expect(dialogue(page, 'bench-clue')).toBeVisible();
  await closeDialogue(page);
  await hotspot(page, 'stop-to-lost-property').click();
  await expect(scene(page, 'lost-property')).toBeVisible();
  expect(evidence(await state(page))).toEqual(beforeSearch);
  await identifyBackpack(page);
  const beforeReturn = await state(page);
  expect(beforeReturn.travel.completed.bag).toBeUndefined();
  expect(beforeReturn.travel.stamps.home).toBeUndefined();

  await expect(hotspot(page, 'lost-sam-return')).toHaveCount(0);
  await talk(page, 'lost-blue-bag', 'take-blue-bag');
  await expect(dialogue(page, 'bag-taken')).toBeVisible();
  await closeDialogue(page);
  await page.getByTestId('story-inventory-toggle').click();
  await expect(inventoryItem(page, 'sam-blue-bag')).toBeVisible();
  await captureStory(page, 'phase4-03-backpack', inventoryItem(page, 'sam-blue-bag'));
  await talk(page, 'lost-sam-return', 'show-blue-bag');
  await click(page, 'Completar misión');
  await expect(scene(page, 'lost-property')).toBeVisible();
  await hotspot(page, 'lost-sam-finale').click();
  await expect(dialogue(page, 'sam-finale-bench')).toContainText('nota del banco');
  await closeDialogue(page);
  const finished = await state(page);
  expect(Object.keys(finished.travel.completed).sort()).toEqual(['bag', 'bus', 'hello']);
  expect(Object.keys(finished.travel.stamps)).toEqual(['home']);
  expect(evidence(finished)).toEqual(evidence(beforeReturn));
  expect(finished.travelLearning?.targets.filter((target) => target.skill === 'speaking')).toEqual(
    [],
  );
  expect(finished.travelLearning?.targets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ conceptId: 'item-color', skill: 'writing', transferSuccesses: 1 }),
      expect.objectContaining({
        conceptId: 'place-question',
        skill: 'listening',
        assistance: { guided: 1, transcript: 1 },
      }),
    ]),
  );

  await page.clock.setFixedTime(start + 2 * 24 * 60 * 60 * 1000);
  await page.reload();
  await click(page, 'Explorar aventura');
  await hotspot(page, 'lost-sam-finale').click();
  await expect(dialogue(page, 'sam-finale-bench')).toBeVisible();
  await closeDialogue(page);
  await page.getByTestId('story-inventory-toggle').click();
  await expect(inventoryItem(page, 'sam-postcard')).toHaveCount(1);
  await expect(inventoryItem(page, 'sam-blue-bag')).toContainText('Usado en la historia');
  expect((await state(page)).travel.stamps).toEqual(finished.travel.stamps);
  expect(evidence(await state(page))).toEqual(evidence(finished));
  await page.getByTestId('story-quests-toggle').click();
  await page.getByTestId('story-review-review-bag').click();
  await expect(page.getByText('Recuerda lo aprendido · 1 min')).toBeVisible();
  await writingInput(page, 'travel_review_item_color_read').fill('Red');
  await click(page, 'Comprobar respuesta');
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  await click(page, 'Volver al viaje');
  await expect(scene(page, 'lost-property')).toBeVisible();
  await page.getByTestId('story-quests-toggle').click();
  await expect(page.getByTestId('story-review-review-bag')).toHaveAccessibleName(
    'Practicar de nuevo',
  );
  const reviewed = await state(page);
  expect(reviewed.travelLearning?.targets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        conceptId: 'item-color',
        skill: 'reading',
        delayedSuccesses: 1,
        transferSuccesses: 1,
      }),
    ]),
  );
  await page.getByTestId('story-passport').click();
  await expect(page.getByText('La postal de Sam', { exact: true })).toBeVisible();
  await expect(page.getByText(/Honduras/).last()).toBeVisible();
  await capture(page, 'phase4-04-passport');
});

test('the Luz branch sends the player back to the plaza and records a different outcome', async ({
  page,
  context,
}) => {
  test.slow();
  await page.setViewportSize({ width: 320, height: 568 });
  await enterApp(page);
  await readyOfflineShell(page, context);
  await click(page, 'Explorar aventura');
  const luz = hotspot(page, 'plaza-luz');
  await luz.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('story-dialogue-close')).toBeVisible();
  await closeDialogue(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  await startIntroduction(page);
  await answerTravelText(page, 'travel_hello_write', "Hi! I'm Luz.");
  await finishIntroduction(page);
  await reachBusStop(page);
  await giveDirections(page);
  await talk(page, 'stop-sam-search', 'ask-luz');
  await expect(dialogue(page, 'sam-search-luz')).toContainText('Luz estaba en la plaza');
  await closeDialogue(page);
  await expect(hotspot(page, 'stop-bench')).toHaveCount(0);
  await expect(hotspot(page, 'stop-to-lost-property')).toHaveCount(0);
  await hotspot(page, 'stop-to-plaza').click();
  await expect(scene(page, 'plaza')).toBeVisible();
  await talk(page, 'plaza-luz-search', 'hear-luz-clue');
  await expect(dialogue(page, 'luz-clue')).toBeVisible();
  await closeDialogue(page);
  await hotspot(page, 'plaza-to-stop').click();
  await hotspot(page, 'stop-to-lost-property').click();
  await expect(scene(page, 'lost-property')).toBeVisible();
  await identifyBackpack(page);
  await talk(page, 'lost-blue-bag', 'take-blue-bag');
  await closeDialogue(page);
  await talk(page, 'lost-sam-return', 'show-blue-bag');
  await click(page, 'Completar misión');
  await hotspot(page, 'lost-sam-finale-luz').click();
  await expect(dialogue(page, 'sam-finale-luz')).toContainText('pista de Luz');
  expect(Object.keys((await state(page)).travel.completed).sort()).toEqual(['bag', 'bus', 'hello']);
});

test('closing the adventure during a save stays on home and preserves the NPC interaction', async ({
  page,
  context,
}) => {
  await enterApp(page);
  await readyOfflineShell(page, context);
  await click(page, 'Explorar aventura');
  await expect(scene(page, 'plaza')).toBeVisible();
  await page.evaluate(
    () =>
      new Promise<void>((locked) => {
        void navigator.locks.request('lq_offline_state_v1', () => {
          return new Promise<void>((release) => {
            document.addEventListener('release-story-test-lock', () => release(), { once: true });
            locked();
          });
        });
      }),
  );
  try {
    await hotspot(page, 'plaza-luz').click();
    await click(page, 'Cerrar y volver');
    await expect(page.getByRole('button', exact('Explorar aventura'))).toBeVisible();
  } finally {
    await page.evaluate(() => document.dispatchEvent(new Event('release-story-test-lock')));
  }
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('lq_offline_state_v1')!).story.dialogueId,
      ),
    )
    .toBe('luz-welcome');
  await expect(scene(page, 'plaza')).toHaveCount(0);
  await click(page, 'Explorar aventura');
  await expect(dialogue(page, 'luz-welcome')).toBeVisible();
});
