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
  labelFirstChapterAudio,
  openLessons,
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

async function startSamLesson(page: Page) {
  await choice(page, 'greet-sam-in-english');
  await choice(page, 'greet-luz-in-english');
  await choice(page, 'reply-to-luz');
  await choice(page, 'continue-opening-with-sam');
  await choice(page, 'introduce-yourself');
}

async function finishStoryBriefing(page: Page, onWord?: (word: string) => Promise<void>) {
  const learning = page.getByTestId('story-learning');
  for (const [word, speaker, meaning, example] of [
    ['Hi', 'Sam', '«hola»', 'Hi! My name is Sam.'],
    ['I am', 'Luz', '«soy»', 'Hi! I am Luz.'],
    ['My name is', 'Luz', '«me llamo»', 'My name is Luz.'],
  ]) {
    await expect(learning.getByRole('heading', exact(speaker))).toBeVisible();
    await expect(learning.getByRole('button', exact(`Escuchar: ${word}`))).toBeVisible();
    await expect(learning.getByText(example, { exact: true })).toBeVisible();
    await expect(learning).toContainText(meaning);
    await expect(learning.getByTestId('travel-workbook')).toHaveCount(0);
    await onWord?.(word);
    await click(page, word === 'My name is' ? 'Ver la explicación' : 'Siguiente palabra');
  }
  const grammar = learning.getByTestId('grammar-workbench');
  await expect(learning.getByRole('heading', exact('Luz'))).toBeVisible();
  await expect(learning).toContainText('Con «I» digo «am», y con «My name» digo «is».');
  await expect(grammar.getByText('I', { exact: true })).toBeVisible();
  await expect(grammar.getByText('am', { exact: true })).toBeVisible();
  await expect(grammar.getByText('My name', { exact: true })).toBeVisible();
  await expect(grammar.getByText('is', { exact: true })).toBeVisible();
  await expect(learning.getByTestId('travel-workbook')).toHaveCount(0);
  await click(page, 'Escuchar a Sam');
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

async function pressArtwork(artwork: Locator, xPercent: number, yPercent: number, touch = false) {
  const bounds = await artwork.boundingBox();
  if (!bounds) throw new Error('The scene artwork must be visible before interacting with it.');
  const position = { x: (bounds.width * xPercent) / 100, y: (bounds.height * yPercent) / 100 };
  if (touch) await artwork.tap({ position });
  else await artwork.click({ position });
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

test('the guide starts with Sam, restores the conversation, and opens the next mission', async ({
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

  await expect(guide.getByRole('button', exact('Omitir guía'))).toBeVisible();
  await expect(guide).toContainText('Guía rápida · 1 de 3');
  await expect(guide.getByText('Habla con los personajes')).toBeInViewport({ ratio: 1 });
  await expect(guide.getByText(/Toca a Sam en la plaza/)).toBeInViewport({ ratio: 1 });
  await expect(sceneMask.locator('path')).toHaveAttribute('fill-rule', 'evenodd');
  const guideHeading = guide.getByRole('heading', exact('Habla con los personajes'));
  await expect(guideHeading).toBeFocused();

  const luzBounds = await spot(page, 'plaza-luz').boundingBox();
  if (!luzBounds) throw new Error('Luz needs a visible hit area.');
  await page.mouse.click(luzBounds.x + luzBounds.width / 2, luzBounds.y + luzBounds.height / 2);
  await expect(guide).toContainText('Guía rápida · 1 de 3');
  expect((await storyProgress(page)).story?.turn).toBe(0);
  await expect(target).toHaveAccessibleName('Sam');
  await expect(target).toBeInViewport({ ratio: 1 });
  const sam = spot(page, 'plaza-sam');
  await expectGuideAligned(target, sam);
  expect(
    await sam.evaluate((label) => {
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

  const samIntroduction = dialogue(page, 'sam-introduction');
  await expect(samIntroduction.getByRole('heading', exact('Sam'))).toBeFocused();
  await expect(samIntroduction).toContainText('Hi! My name is Sam.');
  await expect(target).toHaveCount(0);
  await closeDialogue(page);
  await expect(target).toHaveAccessibleName('Sam');
  await target.click();
  await choice(page, 'greet-sam-in-english');
  const introduction = dialogue(page, 'sam-introduces-luz');
  await expect(introduction.getByRole('heading', exact('Sam'))).toBeFocused();
  await expect(introduction).toContainText('This is Luz.');
  await choice(page, 'greet-luz-in-english');
  const welcome = dialogue(page, 'luz-meets-traveler');
  await expect(welcome.getByRole('heading', exact('Luz'))).toBeFocused();
  await expect(welcome).toContainText('Hello! I’m Luz. Welcome!');
  await expect(guide).toHaveCount(0);

  await click(page, 'Cerrar y volver');
  await page.reload();
  await openAdventure(page, undefined, false);
  await expect(welcome).toContainText('Hello! I’m Luz. Welcome!');
  await expect(guide).toHaveCount(0);
  await choice(page, 'reply-to-luz');
  const luzReply = dialogue(page, 'luz-replies-to-traveler');
  await expect(luzReply.getByRole('heading', exact('Luz'))).toBeFocused();
  await expect(luzReply).toContainText('Nice to meet you, too!');
  await choice(page, 'continue-opening-with-sam');
  const question = dialogue(page, 'sam-asks-name');
  await expect(question.getByRole('heading', exact('Sam'))).toBeFocused();
  await expect(question).toContainText("What's your name?");
  await choice(page, 'introduce-yourself');
  await expect(guide).toHaveCount(0);
  await finishStoryBriefing(page);
  await finishGreetingPractice(page, 'Ana');
  await expect(guide).toHaveCount(0);
  await page.getByRole('textbox', exact('Tu respuesta en inglés')).fill('Hi! My name is Ana.');
  await click(page, 'Comprobar respuesta');
  await expect(page.getByTestId('travel-story-reply')).toContainText("It's nice to meet you.");
  await click(page, 'Seguir la historia');
  await answerTravelText(page, 'travel_hello_transfer', "I'm Ana.");
  await click(page, 'Ahora no puedo hablar');
  await expect(dialogue(page, 'sam-after-introduction')).toBeVisible();
  await expect(guide).toHaveCount(0);
  await closeDialogue(page);

  await expect(guide).toContainText('Guía rápida · 2 de 3');
  await expect(guide.getByText('Examina los objetos')).toBeInViewport({ ratio: 1 });
  await expect(guide.getByText(/Toca «Postal de la plaza» para ver el mapa/)).toBeInViewport({
    ratio: 1,
  });
  await expect(target).toHaveAccessibleName('Postal de la plaza');
  await expect(target).toBeInViewport({ ratio: 1 });
  const postcard = spot(page, 'plaza-origin');
  await expectGuideAligned(target, postcard);
  await target.click();

  await expect(dialogue(page, 'origin-postcards')).toContainText(/en el reverso/i);
  await expect(target).toHaveCount(0);
  await click(page, 'Guardar la postal');
  await expect(dialogue(page, 'origin-sketch-taken')).toContainText('La postal está en tu mochila');
  expect((await storyProgress(page)).story?.inventory['origin-card']).toBeDefined();
  await closeDialogue(page);

  await expect(guide).toContainText('Guía rápida · 3 de 3');
  await expect(guide.getByText('Consulta tus misiones')).toBeInViewport({ ratio: 1 });
  await expect(guide.getByText(/Abre el resumen de misiones para ver qué hacer/)).toBeInViewport({
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
  const nextMission = page.getByTestId('story-quest-detail-catch-the-bus');
  await expect(nextMission).toBeVisible();
  await expect(nextMission.getByRole('heading')).toBeFocused();

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

test('a saved Luz dialogue from the previous guide stays open before guiding to Sam', async ({
  page,
}) => {
  await enterApp(page);
  await openAdventure(page, undefined, false);
  await page.evaluate(() => {
    const key = 'lq_offline_state_v1';
    const state = JSON.parse(localStorage.getItem(key)!);
    state.story.revision = 2;
    state.story.dialogueId = 'luz-welcome';
    localStorage.setItem(key, JSON.stringify(state));
    localStorage.setItem('lq_setting:storyGuideStage', JSON.stringify('npc-dialogue'));
  });

  await page.reload();
  await openAdventure(page, undefined, false);
  await expect(dialogue(page, 'luz-welcome').getByRole('heading', exact('Luz'))).toBeVisible();
  await expect(page.getByTestId('story-guide-overlay')).toHaveCount(0);
  await closeDialogue(page);
  await expect(page.getByTestId('story-guide-target')).toHaveAccessibleName('Sam');
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
    await expectCharacterInsideArt(page, 'plaza-luz');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    const artwork = scene(page).getByTestId('story-scene-art');
    await pressArtwork(artwork, 19, 58, true);
    await expect(dialogue(page, 'sam-introduction')).toBeVisible();
    await pressArtwork(artwork, 79, 53, true);
    await expect(dialogue(page, 'luz-welcome')).toBeVisible();
    await closeDialogue(page);
    await expect(dialogue(page, 'luz-welcome')).toBeHidden();
    await expect(sam).toBeVisible();
  });

  test('the plaza postcard keeps its name from inspection through collection and use', async ({
    page,
  }) => {
    await enterApp(page, { chooseOrigin: false });
    await click(page, 'Elegir lugar de origen');
    await click(page, 'Bolivia');
    await openAdventure(page);

    const postcard = spot(page, 'plaza-origin');
    const postcardName = 'Postal de la plaza';
    const panel = dialogue(page, 'origin-postcards');
    const confirmation = dialogue(page, 'origin-sketch-taken');
    const savePostcard = panel.getByRole('button', exact('Guardar la postal'));
    const backpackToggle = page.getByTestId('story-inventory-toggle');
    const backpackItem = page.getByTestId('story-inventory-origin-card');

    await expect(postcard).toHaveAccessibleName(postcardName);
    await expect(postcard.getByText(postcardName, { exact: true })).toBeVisible();
    await pressArtwork(scene(page).getByTestId('story-scene-art'), 62, 87, true);
    await expect(panel.getByRole('heading', exact(postcardName))).toBeVisible();
    await expect(panel).toContainText('postales de Bolivia');
    await expect(panel).toContainText('reverso');
    await savePostcard.tap();
    await expect(confirmation.getByRole('heading', exact(postcardName))).toBeVisible();
    await expect(confirmation.getByText(/La postal está en tu mochila/)).toBeVisible();
    await restoreAdventure(page, confirmation);
    await backpackToggle.tap();
    await expect(backpackItem.getByText(postcardName, { exact: true })).toBeVisible();
    await closeDialogue(page);

    await postcard.tap();
    await expect(panel.getByRole('heading', exact(postcardName))).toBeVisible();
    await expect(savePostcard).toBeHidden();
    await panel.getByRole('button', exact('Volver a la escena')).tap();
    await expect(panel).toBeHidden();
    await expect(page.getByRole('heading', exact('La plaza'))).toBeVisible();

    await spot(page, 'plaza-luz').tap();
    await dialogue(page, 'luz-welcome').getByRole('button', exact('Mostrarle la postal')).tap();
    await expect(dialogue(page, 'luz-map-clue')).toContainText(
      'En el reverso de la postal, Luz marca',
    );
    await backpackToggle.tap();
    await expect(backpackItem).toContainText('Usado en la historia');
    await page.getByTestId('story-quests-toggle').tap();
    await expect(page.getByTestId('story-quest-origin-sketch')).toContainText('Completada');
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
  await expect(samPanel.getByText('Hi! My name is Sam.', { exact: true })).toBeVisible();
  await expect(samPanel.getByRole('heading', exact('Sam'))).toBeFocused();
  await capture(page, 'storybook-web-sam');
  await expect(luz).toBeEnabled();
  await luz.focus();
  await expect(luz).toBeFocused();
  await page.keyboard.press('Enter');
  const luzPanel = dialogue(page, 'luz-welcome');
  await expect(luzPanel.getByText('Hello! I’m Luz. Welcome!', { exact: true })).toBeVisible();
  await expect(luzPanel.getByRole('heading', exact('Luz'))).toBeFocused();
  await capture(page, 'storybook-web-luz');
});

test('an offline storybook restores dialogue, grades exercises and awards one postcard', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await labelFirstChapterAudio(page, request, {
    'line-4': 'Where is the bus stop?',
    'sam-opening': 'Hi! My name is Sam.',
    'sam-introduces-luz': 'This is Luz.',
    'luz-welcome': 'Hello! I’m Luz. Welcome!',
    'luz-reply': 'Nice to meet you, too!',
    'sam-question': "What's your name?",
    'sam-listening': "Hi! My name is Sam. What's your name?",
    Hi: 'Hi',
    'I am': 'I am',
    'My name is': 'My name is',
    'sam-reply': "It's nice to meet you.",
    'sam-directions': 'Can you help me find the bus stop?',
    'introduction-starter': 'Hi! I am',
  });
  await page.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [];
    const playback: string[] = [];
    Object.assign(window, { storyPlayback: playback });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const result = play.call(this);
      void result
        .then(async () => {
          const clip = await window.chapterAudioLabel(this.currentSrc);
          if (clip) {
            document.body.dataset.played = clip;
            playback.push(clip);
          }
        })
        .catch(() => {});
      return result;
    };
  });
  await enterApp(page);
  await readyOfflineShell(page, context);
  await openAdventure(page, 'Ana O’Connor');
  await expect.poll(async () => (await state(page)).travel.practiceName).toBe('Ana O’Connor');
  const initial = await state(page);
  expect(initial.user.name).toBe('Explorador');
  expect(initial.attempts).toEqual({});
  expect(initial.travelLearning?.targets ?? []).toEqual([]);
  const initialXp = initial.xp;
  const quests = page.getByTestId('story-quests-toggle');
  const playback = () =>
    page.evaluate(() => (window as Window & { storyPlayback: string[] }).storyPlayback);
  const clipPlays = async (clip: string) => (await playback()).filter((id) => id === clip).length;
  await expect(quests).toContainText('Un saludo en la plaza');
  await capture(page, 'storybook-mobile-plaza');

  await spot(page, 'plaza-sam').click();
  await expect.poll(() => clipPlays('sam-opening')).toBe(1);
  await capture(page, 'storybook-mobile-sam');
  await choice(page, 'greet-sam-in-english');
  await expect.poll(() => clipPlays('sam-introduces-luz')).toBe(1);
  await choice(page, 'greet-luz-in-english');
  const luzPanel = dialogue(page, 'luz-meets-traveler');
  await expect(luzPanel.getByRole('heading', exact('Luz'))).toBeVisible();
  await expect.poll(() => clipPlays('luz-welcome')).toBe(1);
  const translation = luzPanel.getByText('¡Hola! Soy Luz. ¡Qué gusto recibirte!', { exact: true });
  const translationToggle = luzPanel.getByRole('switch', exact('Mostrar traducción'));
  await expect(translation).toBeVisible();
  await translationToggle.click();
  await expect(translation).toBeHidden();
  await translationToggle.click();
  await expect(translation).toBeVisible();
  await luzPanel.getByRole('button', exact('Escuchar frase')).click();
  await expect.poll(() => clipPlays('luz-welcome')).toBe(2);
  await capture(page, 'storybook-mobile-luz');

  await choice(page, 'reply-to-luz');
  await expect.poll(() => clipPlays('luz-reply')).toBe(1);
  await choice(page, 'continue-opening-with-sam');
  await expect.poll(() => clipPlays('sam-question')).toBe(1);
  await choice(page, 'introduce-yourself');
  const learning = page.getByTestId('story-learning');
  await expect(learning).toBeVisible();
  await expect(scene(page)).toBeVisible();
  await expect(learning.getByText(/Retomamos donde lo dejaste/)).toHaveCount(0);
  expect((await state(page)).travel.active?.stepId).toBe('hello_teach');
  await finishStoryBriefing(page, async (word) => {
    await expect.poll(() => clipPlays(word)).toBeGreaterThan(0);
    if (word === 'I am') {
      const lessonState = (await state(page)).travel.active;
      await click(page, 'Cerrar y volver');
      await restoreAdventure(page, learning.getByRole('button', exact('Escuchar: I am')));
      expect((await state(page)).travel.active).toEqual(lessonState);
    }
  });
  expect((await state(page)).attempts).toEqual(initial.attempts);
  expect((await state(page)).travelLearning?.targets ?? []).toEqual([]);

  await expect(learning.getByRole('heading', exact('Sam'))).toBeVisible();
  await expect(learning.getByTestId('exercise-travel_hello_recognize')).toBeVisible();
  await click(page, 'Escuchar el saludo de Sam');
  await expect.poll(() => clipPlays('sam-listening')).toBe(1);
  await answerTravelChoice(page, 'travel_hello_recognize', 'Hola');
  await expect(learning.getByRole('heading', exact('Luz'))).toBeVisible();
  await answerTravelReorder(page, 'travel_hello_build', ['I', 'am', 'Ana O’Connor']);
  await expect(learning.getByRole('heading', exact('Sam'))).toBeVisible();
  await answerTravelText(page, 'travel_hello_recall', 'Hi');
  expect(Object.keys((await state(page)).attempts)).toHaveLength(3);

  const input = learning
    .getByTestId('exercise-travel_hello_write')
    .getByRole('textbox', exact('Tu respuesta en inglés'));
  await expect(learning.getByText('Tu saludo para Sam', { exact: true })).toBeVisible();
  await expect(learning.getByText('Tu respuesta', { exact: true })).toBeVisible();
  await expect(learning.getByText('Tu nombre: Ana O’Connor')).toBeVisible();
  await expect(learning.getByRole('heading', exact('Sam'))).toBeVisible();
  await expect(learning.getByTestId('travel-reference-phrase')).toHaveCount(0);
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
  if (await dialogue(page, 'luz-welcome').isVisible()) await choice(page, 'reply-to-luz-at-desk');
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
  await expect(learning.getByTestId('travel-story-reply')).toHaveCount(0);
  await expect(page.getByRole('button', exact('Seguir la historia'))).toHaveCount(0);
  await click(page, 'Intentar otra vez');
  await input.fill("Hi! My name's Ana O’Connor.");
  await capture(page, 'storybook-mobile-own-name');
  await click(page, 'Comprobar respuesta');
  await expect(feedback.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  const samReply = learning.getByTestId('travel-story-reply');
  await expect(samReply.getByRole('heading', exact('Sam'))).toBeVisible();
  await expect(samReply).toContainText("It's nice to meet you.");
  await expect.poll(() => clipPlays('sam-reply')).toBe(1);
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
    dialogue(page, 'sam-after-introduction').getByText('Can you help me find the bus stop?', {
      exact: true,
    }),
  ).toBeVisible();
  await expect.poll(() => clipPlays('sam-directions')).toBe(1);
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

  const parkSign = spot(page, 'plaza-ticket');
  await expect(parkSign).toHaveAccessibleName('Cartel del parque');
  await pressArtwork(scene(page).getByTestId('story-scene-art'), 57, 35);
  await expect(
    dialogue(page, 'ticket-inspection').getByRole('heading', exact('Cartel del parque')),
  ).toBeVisible();
  await choice(page, 'read-ticket');
  await closeDialogue(page);
  const plazaArtwork = scene(page).getByTestId('story-scene-art');
  const travelToStop = spot(page, 'plaza-to-stop');
  await expect(travelToStop).toHaveAccessibleName('Ir a la parada');
  await expect(travelToStop.getByText('Ir a la parada', { exact: true })).toBeVisible();
  await pressArtwork(plazaArtwork, 86, 30);
  await expect(scene(page, 'bus-stop')).toBeVisible();
  const busArtwork = scene(page, 'bus-stop').getByTestId('story-scene-art');
  await expect(spot(page, 'stop-to-plaza')).toHaveAccessibleName('Volver a la plaza');
  await pressArtwork(busArtwork, 16, 91);
  await expect(scene(page)).toBeVisible();
  await pressArtwork(plazaArtwork, 86, 30);
  const stopSign = spot(page, 'stop-sign');
  await expect(stopSign).toHaveAccessibleName('Señal de la parada');
  await pressArtwork(busArtwork, 38, 32);
  await expect(
    dialogue(page, 'stop-found').getByRole('heading', exact('Señal de la parada')),
  ).toBeVisible();
  await closeDialogue(page);
  await spot(page, 'stop-sam-directions').click();
  await choice(page, 'give-directions');
  await expect(learning).toBeVisible();
  await expect(scene(page, 'bus-stop')).toBeVisible();
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await click(page, 'Escuchar a Sam');
  await expect.poll(() => page.evaluate(() => document.body.dataset.played)).toBe('line-4');
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
  const bench = spot(page, 'stop-bench');
  await expect(bench).toHaveAccessibleName('Banco del parque');
  await pressArtwork(busArtwork, 16, 69);
  await expect(
    dialogue(page, 'bench-search').getByRole('heading', exact('Banco del parque')),
  ).toBeVisible();
  await choice(page, 'read-bench-note');
  await closeDialogue(page);
  await expect(spot(page, 'stop-to-lost-property')).toHaveAccessibleName('Ir a objetos perdidos');
  await pressArtwork(busArtwork, 49, 91);
  await expect(scene(page, 'lost-property')).toBeVisible();
  const lostPropertyArtwork = scene(page, 'lost-property').getByTestId('story-scene-art');
  await expect(spot(page, 'lost-to-stop')).toHaveAccessibleName('Volver a la parada');
  await pressArtwork(lostPropertyArtwork, 17, 91);
  await expect(busArtwork).toBeVisible();
  await pressArtwork(busArtwork, 49, 91);
  await pressArtwork(lostPropertyArtwork, 16, 66);
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

  const redBag = spot(page, 'lost-red-bag');
  const blueBag = spot(page, 'lost-blue-bag');
  const lostPropertyBackground = lostPropertyArtwork
    .getByTestId('story-scene-background')
    .locator('img');
  await expect(lostPropertyBackground).toHaveAttribute('src', /\/story-lost-property\./);
  await expect(redBag).toHaveAccessibleName('Mochila roja');
  await expect(blueBag).toHaveAccessibleName('Mochila azul');
  await pressArtwork(lostPropertyArtwork, 77, 53);
  const luzCorrection = dialogue(page, 'red-bag');
  await expect(luzCorrection.getByRole('heading', exact('Luz'))).toBeVisible();
  await expect(luzCorrection.getByText('It’s red.', { exact: true })).toBeVisible();
  expect((await storyProgress(page)).story?.inventory['sam-blue-bag']).toBeUndefined();
  await closeDialogue(page);

  await pressArtwork(lostPropertyArtwork, 50, 53);
  await expect(
    dialogue(page, 'blue-bag').getByRole('heading', exact('Mochila azul')),
  ).toBeVisible();
  await choice(page, 'take-blue-bag');
  await expect(blueBag).toHaveCount(0);
  await expect(lostPropertyBackground).toHaveAttribute(
    'src',
    /\/story-lost-property-after-pickup\./,
  );
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

test('the player can introduce their own name without setting a profile name', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterApp(page);
  await openAdventure(page);
  await spot(page, 'plaza-sam').click();
  await startSamLesson(page);
  const learning = page.getByTestId('story-learning');
  await finishStoryBriefing(page);
  await finishGreetingPractice(page);
  await answerTravelText(page, 'travel_hello_write', 'Hi! My name is Amaya.');
  await answerTravelText(page, 'travel_hello_transfer', "I'm Amaya.");
  await expect(learning.getByText('Hi! I am Amaya.', { exact: true })).toBeVisible();
  expect((await state(page)).user.name).toBe('Explorador');
  expect((await state(page)).travel.introductionName).toBe('Amaya');
  await click(page, 'Ahora no puedo hablar');
  await expect(dialogue(page, 'sam-after-introduction')).toBeVisible();
});

test('a Study reorder draft survives opening the new Sam dialogue and naming the player', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterApp(page);
  await openLessons(page);
  await click(page, 'Continuar');
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await answerTravelChoice(page, 'travel_hello_recognize', 'Hola');
  await click(page, 'Agregar palabra: I');
  await click(page, 'Agregar palabra: am');
  await click(page, 'Agregar palabra: [tu nombre]');
  await expect
    .poll(async () => (await state(page)).travel.active?.answer.tokens)
    .toEqual(['I', 'am', '[tu nombre]']);
  const before = (await state(page)).travel.active;
  await click(page, 'Cerrar y volver');
  await page.getByRole('tab', exact('Inicio')).click();
  await openAdventure(page);
  await spot(page, 'plaza-sam').click();
  await startSamLesson(page);
  await expect(page.getByRole('button', exact('Quitar palabra: [tu nombre]'))).toBeVisible();
  expect((await state(page)).travel.active).toEqual(before);
  await click(page, 'Escribir mi nombre');
  await page.getByRole('textbox', exact('Tu nombre')).fill('Mai-Linh Nguyễn');
  await click(page, 'Guardar nombre');
  await expect(page.getByRole('button', exact('Quitar palabra: Mai-Linh Nguyễn'))).toBeVisible();
  const named = await state(page);
  expect(named.user.name).toBe('Explorador');
  expect(named.travel.practiceName).toBe('Mai-Linh Nguyễn');
  await capture(page, 'storybook-name-tile');
  expect((await state(page)).travel.active).toEqual(before);
  await click(page, 'Comprobar respuesta');
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  await restoreAdventure(page, page.getByRole('button', exact('Quitar palabra: Mai-Linh Nguyễn')));
});
