import type { Locator, Page } from '@playwright/test';
import type { StoryState } from '@lingoquest/offline-engine';
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

const scene = (page: Page, id = 'plaza') => page.getByTestId(`story-scene-${id}`);
const spot = (page: Page, id: string) => page.getByTestId(`story-hotspot-${id}`);
const dialogue = (page: Page, id: string) => page.getByTestId(`story-dialogue-${id}`);
const choice = (page: Page, id: string) => page.getByTestId(`story-choice-${id}`).click();
const closeDialogue = (page: Page) => page.getByTestId('story-dialogue-close').click();
const adventure = (page: Page) => page.getByRole('button', exact('Comenzar mi aventura'));
const storyProgress = async (page: Page) =>
  (await state(page)) as Awaited<ReturnType<typeof state>> & { story?: StoryState };

async function openAdventure(page: Page, name?: string, skipGuide = true) {
  await adventure(page).click();
  const picker = page.getByRole('heading', exact('¿Cómo te llamas?'));
  await expect(picker.or(scene(page))).toBeVisible();
  if (name) {
    await expect(picker).toBeVisible();
    await expect(page.getByRole('button', exact('Guardar y continuar'))).toBeDisabled();
    await page.getByRole('textbox', exact('Tu nombre')).fill(name);
    await capture(page, 'storybook-name-entry');
    await click(page, 'Guardar y continuar');
  } else if (await picker.isVisible()) {
    await click(page, 'Continuar sin nombre');
  }
  await expect(scene(page)).toBeVisible();
  if (skipGuide && (await page.getByTestId('story-guide-overlay').count())) {
    await click(page, 'Omitir guía');
  }
}

async function restoreAdventure(page: Page, expected: Locator) {
  await page.reload();
  await expect(expected.or(adventure(page)).first()).toBeVisible();
  if (await adventure(page).isVisible()) await openAdventure(page);
  await expect(expected).toBeVisible();
}

async function openSamBriefing(page: Page) {
  const learning = page.getByTestId('story-learning');
  await expect(learning.getByTestId('travel-step-dialogue')).toBeVisible();
  await click(page, 'Continuar');
  await expect(learning.getByTestId('travel-reference-phrase')).toBeVisible();
  await click(page, 'Continuar');
  for (const word of ['Hi', 'I am']) {
    await expect(learning.getByRole('button', exact(`Escuchar: ${word}`))).toBeVisible();
    await click(page, 'Siguiente palabra');
  }
  await expect(learning.getByRole('button', exact('Escuchar: My name is'))).toBeVisible();
  await click(page, 'Ver la explicación');
  await expect(learning.getByText('Prepara tu respuesta para Sam')).toBeVisible();
}

async function expectCharacterInsideArt(page: Page, id: string) {
  const artwork = scene(page).getByTestId('story-scene-art');
  const character = artwork.getByTestId(`story-hotspot-${id}`);
  await expect(character).toBeVisible();
  const [art, actor] = await Promise.all([artwork.boundingBox(), character.boundingBox()]);
  expect(art).not.toBeNull();
  expect(actor).not.toBeNull();
  if (!art || !actor) throw new Error('The scene and character need visible hit areas.');
  expect(actor.width).toBeGreaterThanOrEqual(44);
  expect(actor.height).toBeGreaterThanOrEqual(44);
  expect(actor.x).toBeGreaterThanOrEqual(art.x - 1);
  expect(actor.y).toBeGreaterThanOrEqual(art.y - 1);
  expect(actor.x + actor.width).toBeLessThanOrEqual(art.x + art.width + 1);
  expect(actor.y + actor.height).toBeLessThanOrEqual(art.y + art.height + 1);
  return character;
}

async function expectGuideAligned(target: Locator, anchor: Locator) {
  await expect
    .poll(async () => {
      const [spotlight, control] = await Promise.all([target.boundingBox(), anchor.boundingBox()]);
      if (!spotlight || !control) return Infinity;
      return Math.max(
        Math.abs(spotlight.x + spotlight.width / 2 - control.x - control.width / 2),
        Math.abs(spotlight.y + spotlight.height / 2 - control.y - control.height / 2),
      );
    })
    .toBeLessThanOrEqual(1);
}

test('the first chapter guides a new player through the scene and mission list only once', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  const guide = page.getByTestId('story-guide');
  const sceneMask = page.getByTestId('story-guide-scene-mask');
  const target = page.getByTestId('story-guide-target');
  await adventure(page).click();
  await click(page, 'Honduras');
  await expect(page.getByRole('heading', exact('¿Cómo te llamas?'))).toBeVisible();
  await expect(guide).toHaveCount(0);
  await page.getByRole('textbox', exact('Tu nombre')).fill('Ana');
  await click(page, 'Guardar y continuar');

  await expect(guide.getByRole('button')).toHaveText('Omitir guía');
  await expect(guide).toContainText('Guía rápida · 1 de 3');
  await expect(guide.getByText('Habla con los personajes')).toBeInViewport({ ratio: 1 });
  await expect(guide.getByText(/Toca a Luz para abrir su diálogo/)).toBeInViewport({ ratio: 1 });
  await expect(sceneMask.locator('path')).toHaveAttribute('fill-rule', 'evenodd');
  const guideHeading = guide.getByRole('heading', exact('Habla con los personajes'));
  await expect(guideHeading).toBeFocused();

  const sam = await spot(page, 'plaza-sam').boundingBox();
  if (!sam) throw new Error('Sam needs a visible hit area.');
  await page.mouse.click(sam.x + sam.width / 2, sam.y + sam.height * 0.75);
  await expect(guide).toContainText('Guía rápida · 1 de 3');
  expect((await storyProgress(page)).story?.turn).toBe(0);
  await expect(target).toHaveAccessibleName('Luz');
  await expect(target).toBeInViewport({ ratio: 1 });
  const luz = spot(page, 'plaza-luz').getByText('Luz', { exact: true });
  await expectGuideAligned(target, luz.locator('..'));
  expect(
    await luz.evaluate((label) => {
      for (let ancestor = label.parentElement; ancestor; ancestor = ancestor.parentElement) {
        if (ancestor.dataset.testid === 'flow-scroll') break;
        if (getComputedStyle(ancestor).transform !== 'none') return false;
      }
      return true;
    }),
  ).toBe(true);
  await guideHeading.focus();
  await page.keyboard.press('Tab');
  await expect(target).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(dialogue(page, 'luz-welcome')).toBeVisible();
  await expect(guide).toContainText('Guía rápida · 2 de 3');
  await expect(guide.getByText('Examina los objetos')).toBeInViewport({ ratio: 1 });
  await expect(guide.getByText(/Toca «Postales» para descubrir qué hay/)).toBeInViewport({
    ratio: 1,
  });
  await expect(target).toHaveAccessibleName('Postales de Honduras');
  await expect(target).toBeInViewport({ ratio: 1 });
  const postcards = spot(page, 'plaza-origin').getByText('Postales', { exact: true });
  await expectGuideAligned(target, postcards.locator('..'));
  await target.click();

  await expect(dialogue(page, 'origin-postcards')).toBeVisible();
  await expect(guide).toContainText('Guía rápida · 3 de 3');
  await expect(guide.getByText('Consulta tus misiones')).toBeInViewport({ ratio: 1 });
  await expect(
    guide.getByText(/Toca el resumen de misiones para ver tus objetivos/),
  ).toBeInViewport({
    ratio: 1,
  });
  await expect(guide).toBeInViewport({ ratio: 1 });
  await expect(target).toHaveAccessibleName('Abrir lista de misiones');
  await expect(target).toBeInViewport({ ratio: 1 });

  const quests = page.getByTestId('story-quests-toggle');
  await expectGuideAligned(target, quests);
  await target.click();
  await expect(guide).toHaveCount(0);
  await expect(sceneMask).toHaveCount(0);
  await expect(quests).toHaveAttribute('aria-expanded', 'true');
  await page.getByTestId('story-quest-meet-sam').getByRole('button').click();
  await expect(page.getByTestId('story-quest-detail-meet-sam')).toBeVisible();

  await click(page, 'Cerrar y volver');
  await openAdventure(page);
  await expect(guide).toHaveCount(0);
  await page.reload();
  await openAdventure(page);
  await expect(guide).toHaveCount(0);
});

test('the first chapter guide stays hidden once skipped', async ({ page }) => {
  await enterApp(page);
  await openAdventure(page, 'Ana', false);
  const guide = page.getByTestId('story-guide');
  await guide.getByRole('button', exact('Omitir guía')).click();
  await expect(guide).toHaveCount(0);
  await expect(page.getByTestId('story-guide-scene-mask')).toHaveCount(0);
  await click(page, 'Cerrar y volver');
  await openAdventure(page);
  await expect(guide).toHaveCount(0);
  expect((await storyProgress(page)).story?.turn).toBe(0);
});

test.describe('small touch screen', () => {
  test.use({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });

  test('storybook characters remain in the artwork', async ({ page }) => {
    await enterApp(page);
    await openAdventure(page);
    await capture(page, 'storybook-small-plaza');
    const quests = page.getByTestId('story-quests-toggle');
    const firstQuest = page.getByTestId('story-quest-meet-sam');
    const firstDetail = page.getByTestId('story-quest-detail-meet-sam');
    const inventory = page.getByTestId('story-inventory-toggle');
    await expect(quests).toHaveAttribute('aria-expanded', 'false');
    await expect(quests).toContainText('Un saludo en la plaza');
    await expect(quests).toContainText('0 de 3 misiones principales completadas');
    await expect(firstQuest).toBeHidden();
    await quests.tap();
    await expect(firstQuest).toBeVisible();
    await expect(firstDetail).toBeHidden();
    await firstQuest.getByRole('button').tap();
    await expect(firstDetail).toContainText('Preséntate a Sam en inglés.');
    await inventory.tap();
    await expect(firstQuest).toBeHidden();
    await expect(inventory).toHaveAttribute('aria-expanded', 'true');
    await quests.tap();
    await expect(inventory).toHaveAttribute('aria-expanded', 'false');
    await expect(firstDetail).toBeHidden();
    await scene(page).evaluate((root) => {
      for (const element of root.querySelectorAll<HTMLElement>('div, span')) {
        if (element.children.length || !element.textContent?.trim()) continue;
        const style = getComputedStyle(element);
        element.style.fontSize = `${Number.parseFloat(style.fontSize) * 1.5}px`;
        const lineHeight = Number.parseFloat(style.lineHeight);
        if (Number.isFinite(lineHeight)) element.style.lineHeight = `${lineHeight * 1.5}px`;
      }
    });
    const sam = await expectCharacterInsideArt(page, 'plaza-sam');
    const luz = await expectCharacterInsideArt(page, 'plaza-luz');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    await sam.tap();
    await expect(dialogue(page, 'sam-introduction')).toBeVisible();
    await luz.tap();
    await expect(dialogue(page, 'luz-welcome')).toBeVisible();
    await closeDialogue(page);
    await expect(dialogue(page, 'luz-welcome')).toBeHidden();
    await expect(sam).toBeVisible();
  });
});

test('storybook character conversations are keyboard accessible on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await enterApp(page);
  await openAdventure(page);
  const sam = await expectCharacterInsideArt(page, 'plaza-sam');
  const luz = await expectCharacterInsideArt(page, 'plaza-luz');
  await capture(page, 'storybook-web-plaza');
  await sam.focus();
  await page.keyboard.press('Enter');
  const samPanel = dialogue(page, 'sam-introduction');
  await expect(
    samPanel.getByText("Hi! My name is Sam. What's your name?", { exact: true }),
  ).toBeVisible();
  await capture(page, 'storybook-web-sam');
  await luz.focus();
  await page.keyboard.press('Enter');
  const luzPanel = dialogue(page, 'luz-welcome');
  await expect(luzPanel.getByText('Ejemplo de Luz', { exact: true })).toBeVisible();
  await expect(luzPanel.getByText('Hi! I am Luz.', { exact: true })).toBeVisible();
  await capture(page, 'storybook-web-luz');
});

test('an offline storybook restores dialogue, grades exercises and awards one postcard', async ({
  page,
  context,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [];
    const playback: string[] = [];
    Object.assign(window, { storyPlayback: playback });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const result = play.call(this);
      void result
        .then(() => {
          document.body.dataset.played = this.currentSrc;
          playback.push(this.currentSrc);
        })
        .catch(() => {});
      return result;
    };
  });
  await enterApp(page);
  await readyOfflineShell(page, context);
  await openAdventure(page, 'Ana O’Connor');
  await expect.poll(async () => (await state(page)).user.name).toBe('Ana O’Connor');
  const initialXp = (await state(page)).xp;
  const quests = page.getByTestId('story-quests-toggle');
  const playback = () =>
    page.evaluate(() =>
      (window as Window & { storyPlayback?: string[] }).storyPlayback!.map(
        (src) => src.match(/\/(line-\d+|word-\d+|sam-greeting|introduction-starter)\./)?.[1],
      ),
    );
  const clipPlays = async (clip: string) => (await playback()).filter((id) => id === clip).length;
  await expect(quests).toContainText('Un saludo en la plaza');
  await capture(page, 'storybook-mobile-plaza');

  await spot(page, 'plaza-luz').click();
  const luzPanel = dialogue(page, 'luz-welcome');
  await expect(luzPanel.getByText('Ejemplo de Luz', { exact: true })).toBeVisible();
  await expect(luzPanel.getByText('Hi! I am Luz.', { exact: true })).toBeVisible();
  await expect.poll(() => clipPlays('line-2')).toBe(1);
  const translation = luzPanel.getByText('¡Hola! Soy Luz.', { exact: true });
  const translationToggle = luzPanel.getByRole('switch', exact('Mostrar traducción'));
  await expect(translation).toBeVisible();
  await translationToggle.click();
  await expect(translation).toBeHidden();
  await translationToggle.click();
  await expect(translation).toBeVisible();
  await luzPanel.getByRole('button', exact('Escuchar frase')).click();
  await expect.poll(() => clipPlays('line-2')).toBe(2);
  await capture(page, 'storybook-mobile-luz');

  await spot(page, 'plaza-sam').click();
  const samPanel = dialogue(page, 'sam-introduction');
  await expect(
    samPanel.getByText("Hi! My name is Sam. What's your name?", { exact: true }),
  ).toBeVisible();
  await expect.poll(() => clipPlays('sam-greeting')).toBe(1);
  await capture(page, 'storybook-mobile-sam');
  await choice(page, 'introduce-yourself');
  const learning = page.getByTestId('story-learning');
  await expect(learning).toBeVisible();
  await expect(scene(page)).toBeVisible();
  await expect(learning.getByText(/Retomamos donde lo dejaste/)).toHaveCount(0);
  await openSamBriefing(page);
  await expect(learning.getByRole('heading', exact('Luz'))).toHaveCount(0);
  await expect.poll(async () => (await playback()).slice(-2)).toEqual(['word-2', 'word-3']);
  await capture(page, 'storybook-mobile-sam-briefing');
  await click(page, 'Escuchar a Sam');
  const greetingsBeforeReplay = await clipPlays('sam-greeting');
  await click(page, 'Escuchar el saludo de Sam');
  await expect.poll(() => clipPlays('sam-greeting')).toBe(greetingsBeforeReplay + 1);
  await finishGreetingPractice(page, 'Ana O’Connor');

  const input = learning
    .getByTestId('exercise-travel_hello_write')
    .getByRole('textbox', exact('Tu respuesta en inglés'));
  await expect(learning.getByText('Tu saludo para Sam', { exact: true })).toBeVisible();
  await expect(learning.getByText('Tu respuesta', { exact: true })).toBeVisible();
  await expect(learning.getByText('Tu nombre: Ana O’Connor')).toBeVisible();
  await expect(learning.getByRole('heading', exact('Sam'))).toHaveCount(0);
  await input.fill('Hi! I am Ana');
  await input.scrollIntoViewIfNeeded();
  await expect
    .poll(async () => (await state(page)).travel.active?.answer.text)
    .toBe('Hi! I am Ana');
  const draft = (await state(page)).travel.active;
  await capture(page, 'storybook-mobile-writing');
  await spot(page, 'plaza-luz').click();
  const resumedLuz = dialogue(page, 'luz-welcome').or(dialogue(page, 'luz-after-introduction'));
  await expect(resumedLuz).toBeVisible();
  await expect(learning).toBeHidden();
  await choice(page, 'practice-with-luz');
  await choice(page, 'luz-practice-is');
  await expect(dialogue(page, 'luz-introduction-practice-retry')).toBeVisible();
  await choice(page, 'luz-practice-retry');
  await choice(page, 'luz-practice-am');
  const guidance = dialogue(page, 'luz-introduction-practice-feedback');
  await expect(guidance.getByText('Ejemplo de Luz', { exact: true })).toBeVisible();
  await capture(page, 'storybook-mobile-luz-practice');
  await restoreAdventure(page, guidance);
  await spot(page, 'plaza-sam').click();
  await expect(input).toHaveValue('Hi! I am Ana');
  expect((await state(page)).travel.active).toEqual(draft);
  await input.scrollIntoViewIfNeeded();
  await capture(page, 'storybook-mobile-resume');

  await input.fill('Hi! I is Ana.');
  await click(page, 'Comprobar respuesta');
  const feedback = page.getByTestId('answer-feedback');
  await expect(feedback.getByText(/Elige la forma de be que va con el sujeto/)).toBeVisible();
  await capture(page, 'storybook-mobile-feedback');
  const incorrectlyAnswered = await state(page);
  await restoreAdventure(page, feedback);
  expect((await state(page)).attempts).toEqual(incorrectlyAnswered.attempts);
  await click(page, 'Intentar otra vez');
  await input.fill('Hi! I am Luz.');
  await click(page, 'Comprobar respuesta');
  await expect(feedback.getByText('Usa tu nombre', { exact: true })).toBeVisible();
  await expect(feedback.getByText(/La estructura en inglés es correcta/)).toBeVisible();
  await expect(page.getByRole('button', exact('Seguir la historia'))).toHaveCount(0);
  await click(page, 'Intentar otra vez');
  await input.fill("Hi! My name's Ana O’Connor.");
  await capture(page, 'storybook-mobile-own-name');
  await click(page, 'Comprobar respuesta');
  await expect(feedback.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  await click(page, 'Seguir la historia');
  await answerTravelText(page, 'travel_hello_transfer', "I'm Ana O’Connor.");
  const voice = page.getByText(/reconocimiento de voz de la misión está disponible en Android/);
  await expect(voice).toBeVisible();
  const model = learning.getByText('Hi! I am Ana O’Connor.', { exact: true });
  await expect(model).toBeVisible();
  await expect(learning.getByText('Tu modelo para responder', { exact: true })).toBeVisible();
  await capture(page, 'storybook-mobile-speaking');
  await click(page, 'Escuchar ejemplo');
  await expect(learning.getByText(/No pudimos usar una voz de inglés sin conexión/)).toBeVisible();
  expect(await clipPlays('introduction-starter')).toBe(0);

  await page.evaluate(() => {
    const voice = {
      voiceURI: 'local-us',
      name: 'Local English',
      lang: 'en-US',
      localService: true,
    };
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: class {
        constructor(readonly text: string) {}
      },
    });
    Object.assign(window.speechSynthesis, {
      getVoices: () => [voice],
      speak: (utterance: SpeechSynthesisUtterance) => {
        document.body.dataset.spoken = utterance.text;
        utterance.onend?.({} as SpeechSynthesisEvent);
      },
    });
  });
  await click(page, 'Escuchar ejemplo');
  await expect(page.locator('body')).toHaveAttribute('data-spoken', (await model.textContent())!);
  await page.evaluate(() => (window.speechSynthesis.getVoices = () => []));
  await click(page, 'Ahora no puedo hablar');
  await expect
    .poll(async () => (await storyProgress(page)).story?.events['greeted-sam'])
    .toBe(true);
  await expect(scene(page)).toBeVisible();
  await expect(learning).toBeHidden();
  await expect(
    dialogue(page, 'sam-after-introduction').getByText(
      'Nice to meet you! Can you help me find the bus stop?',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText('1 de 3 misiones principales completadas', { exact: true }).first(),
  ).toBeVisible();
  await page.getByTestId('story-quests').scrollIntoViewIfNeeded();
  await capture(page, 'storybook-mobile-mission');

  await page.getByTestId('story-inventory-toggle').click();
  const ticket = page.getByTestId('story-inventory-bus-ticket');
  await expect(ticket).toBeVisible();
  await ticket.scrollIntoViewIfNeeded();
  await capture(page, 'storybook-mobile-mochila');
  await page.getByTestId('story-inventory-toggle').click();

  await spot(page, 'plaza-ticket').click();
  await choice(page, 'read-ticket');
  await closeDialogue(page);
  await spot(page, 'plaza-to-stop').click();
  await expect(scene(page, 'bus-stop')).toBeVisible();
  await spot(page, 'stop-sign').click();
  await closeDialogue(page);
  await spot(page, 'stop-sam-directions').click();
  await choice(page, 'give-directions');
  await expect(learning).toBeVisible();
  await expect(scene(page, 'bus-stop')).toBeVisible();
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await click(page, 'Escuchar a Sam');
  await expect
    .poll(() => page.evaluate(() => document.body.dataset.played))
    .toMatch(/line-4.*\.mp3/);
  await click(page, 'Leer la transcripción');
  await answerTravelChoice(page, 'travel_bus_listen', 'La parada de bus');
  await answerTravelReorder(page, 'travel_bus_direction', ['It’s', 'next', 'to', 'the', 'park']);
  await answerTravelText(page, 'travel_bus_dictation', 'It’s next to the park.');
  await answerTravelText(page, 'travel_bus_ask', 'Where is the bus stop?');
  await answerTravelText(page, 'travel_bus_transfer', 'The park is next to the bus stop.');
  await click(page, 'Completar misión');
  await expect(learning).toBeHidden();

  await spot(page, 'stop-sam-search').click();
  await choice(page, 'search-bench');
  await closeDialogue(page);
  await spot(page, 'stop-bench').click();
  await choice(page, 'read-bench-note');
  await closeDialogue(page);
  await spot(page, 'stop-to-lost-property').click();
  await expect(scene(page, 'lost-property')).toBeVisible();
  await spot(page, 'lost-luz').click();
  await choice(page, 'read-sam-message');
  await expect(learning).toBeVisible();
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await answerTravelChoice(page, 'travel_bag_read', 'A blue bag');
  await answerTravelChoice(page, 'travel_bag_owner', 'Luz');
  await answerTravelText(page, 'travel_bag_write', "It's blue.");
  await answerTravelText(page, 'travel_bag_transfer', "It's red.");
  await click(page, 'Ahora no puedo hablar');
  await expect(learning).toBeHidden();

  await spot(page, 'lost-blue-bag').click();
  await choice(page, 'take-blue-bag');
  await closeDialogue(page);
  await spot(page, 'lost-sam-return').click();
  await choice(page, 'show-blue-bag');
  await expect(learning).toBeVisible();
  await click(page, 'Completar misión');
  await expect(learning).toBeHidden();
  await expect(
    page.getByText('3 de 3 misiones principales completadas', { exact: true }).first(),
  ).toBeVisible();
  await page.getByTestId('story-quests').scrollIntoViewIfNeeded();
  await capture(page, 'storybook-mobile-completed');
  await expect(quests).toHaveAttribute('aria-expanded', 'false');
  await quests.click();
  const greeting = page.getByTestId('story-quest-meet-sam');
  const directions = page.getByTestId('story-quest-catch-the-bus');
  const greetingDetail = page.getByTestId('story-quest-detail-meet-sam');
  const directionsDetail = page.getByTestId('story-quest-detail-catch-the-bus');
  await expect(greeting).toContainText('Completada');
  await expect(directions).toContainText('Completada');
  await expect(greetingDetail).toBeHidden();
  await expect(directionsDetail).toBeHidden();
  await greeting.getByRole('button').click();
  await expect(greetingDetail).toBeVisible();
  await directions.getByRole('button').click();
  await expect(directionsDetail).toBeVisible();
  await expect(greetingDetail).toBeHidden();
  await quests.click();
  await page.getByTestId('story-passport').click();
  await expect(page.getByText('La postal de Sam', { exact: true })).toBeVisible();
  await capture(page, 'storybook-mobile-pasaporte');

  const finished = await storyProgress(page);
  expect(Object.keys(finished.travel.stamps)).toEqual(['home']);
  expect(Object.keys(finished.travel.completed)).toHaveLength(3);
  expect(finished.xp).toBe(initialXp);
  expect(finished.story).toMatchObject({
    choices: expect.arrayContaining([{ dialogueId: 'sam-search', choiceId: 'search-bench' }]),
    events: { 'returned-sam-bag': true },
    inventory: { 'sam-postcard': { used: false } },
  });
  expect(finished.travelLearning?.targets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        conceptId: 'introduction',
        skill: 'writing',
        transferSuccesses: 1,
      }),
      expect.objectContaining({
        conceptId: 'place-question',
        skill: 'listening',
        assistance: { guided: 1, transcript: 1 },
      }),
    ]),
  );
  expect(finished.travelLearning?.targets.filter(({ skill }) => skill === 'speaking')).toEqual([]);
});

test('Sam’s introduction is complete without visiting Luz or setting a profile name', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterApp(page);
  await openAdventure(page);
  await spot(page, 'plaza-sam').click();
  await choice(page, 'introduce-yourself');
  const learning = page.getByTestId('story-learning');
  await openSamBriefing(page);
  await click(page, 'Escuchar a Sam');
  await finishGreetingPractice(page);
  await answerTravelText(page, 'travel_hello_write', 'Hi! My name is Amaya.');
  await answerTravelText(page, 'travel_hello_transfer', "I'm Amaya.");
  await expect(learning.getByText('Hi! I am Amaya.', { exact: true })).toBeVisible();
  expect((await state(page)).user.name).toBe('Explorador');
  await click(page, 'Ahora no puedo hablar');
  await expect(dialogue(page, 'sam-after-introduction')).toBeVisible();
});

test('adding a name from the reorder exercise preserves the draft and updates its tile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterApp(page);
  await openAdventure(page);
  await spot(page, 'plaza-sam').click();
  await choice(page, 'introduce-yourself');
  await openSamBriefing(page);
  await click(page, 'Escuchar a Sam');
  await answerTravelChoice(page, 'travel_hello_recognize', 'Hola');
  await click(page, 'Agregar palabra: I');
  await click(page, 'Agregar palabra: am');
  await click(page, 'Agregar palabra: [tu nombre]');
  await expect
    .poll(async () => (await state(page)).travel.active?.answer.tokens)
    .toEqual(['I', 'am', '[tu nombre]']);
  const before = (await state(page)).travel.active;
  await click(page, 'Escribir mi nombre');
  await page.getByRole('textbox', exact('Tu nombre')).fill('Mai-Linh Nguyễn');
  await click(page, 'Guardar nombre');
  await expect(page.getByRole('button', exact('Quitar palabra: Mai-Linh Nguyễn'))).toBeVisible();
  await capture(page, 'storybook-name-tile');
  expect((await state(page)).travel.active).toEqual(before);
  await click(page, 'Comprobar respuesta');
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  await restoreAdventure(page, page.getByRole('button', exact('Quitar palabra: Mai-Linh Nguyễn')));
});
