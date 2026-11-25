import type { OfflineState } from '@lingoquest/offline-engine';
import type { Page } from '@playwright/test';
import { mexicoChapter } from '../../content/source/mexico-missions';
import { travelStepVocabulary } from '../../packages/offline-engine/src/travel-vocabulary';
import {
  answerTravelChoice,
  answerTravelReorder,
  click,
  enterApp,
  exact,
  expect,
  readyOfflineShell,
  state,
  test,
} from './helpers';

async function openMexicoStory(page: Page) {
  await page.getByRole('tab', exact('Mapa')).click();
  await click(page, '2. Ciudad de México');
  await click(page, 'Abrir capítulo');
  const reader = page.getByTestId('chapter-lesson-mexico');
  await reader.getByRole('button', exact('Explorar aventura de este capítulo')).click();
}

const stories = async (page: Page) =>
  (await state(page)) as Awaited<ReturnType<typeof state>> &
    Pick<OfflineState, 'story' | 'chapterProgress'>;
const answerInput = (page: Page, exercise: string) =>
  page.getByTestId(`exercise-${exercise}`).getByRole('textbox', exact('Tu respuesta en inglés'));

async function learn(page: Page, missionId: string) {
  const mission = mexicoChapter.missions.find(({ id }) => id === missionId);
  if (!mission) throw new Error(`Missing lesson for ${missionId}`);
  for (const step of mission.steps) {
    if (step.type !== 'teach') break;
    const vocabulary = travelStepVocabulary(mission, step);
    for (let word = 1; word < vocabulary.length; word++) await click(page, 'Siguiente palabra');
    if (vocabulary.length) await click(page, 'Ver la explicación');
    await expect(page.getByRole('heading', exact(step.title))).toBeVisible();
    await click(page, 'Probar en la historia');
  }
}

async function listen(page: Page) {
  await click(page, 'Escuchar el mensaje');
  await expect
    .poll(async () => (await stories(page)).chapterProgress?.mexico?.travel.active?.audioPlayed)
    .toBe(true);
}

async function submitWithEnter(page: Page, exercise: string, answer: string) {
  const input = answerInput(page, exercise);
  await input.fill(answer);
  await input.press('Enter');
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  await click(page, 'Seguir la historia');
}

test('Mexico runs offline through the market and library, preserving drafts and the Home adventure', async ({
  page,
  context,
  networkGuard,
}) => {
  test.setTimeout(210_000);
  await enterApp(page);
  await click(page, 'Comenzar mi aventura');
  await click(page, 'Continuar sin nombre');
  await expect(page.getByTestId('story-scene-plaza')).toBeVisible();
  await click(page, 'Omitir guía');
  const { story: home, travel: homeTravel } = await stories(page);
  expect(home).toBeDefined();
  await click(page, 'Cerrar y volver');

  await openMexicoStory(page);
  await expect(page.getByTestId('story-scene-mexico-reading-room')).toBeVisible();
  const opening = page.getByRole('button', exact('Hablar con Inés'));
  await expect(opening).toBeVisible();
  const artwork = page.getByTestId('story-scene-background').locator('img');
  await expect(artwork).toHaveAttribute('src', /^(?:blob:|data:image\/)/);
  await expect
    .poll(() => artwork.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);

  const transfers = () =>
    networkGuard.attempted.filter((url) => /\/chapter-packs\/\d+\/mexico\.json$/.test(url));
  expect(transfers()).toHaveLength(1);
  await readyOfflineShell(page, context);
  await opening.click();
  const host = page.getByRole('heading', exact('Inés'));
  await expect(host).toBeVisible();

  await page.reload();
  await openMexicoStory(page);
  await expect(host).toBeVisible();
  await expect(artwork).toHaveAttribute('src', /^(?:blob:|data:image\/)/);

  await click(page, 'Ver mi agenda con Inés');
  await click(page, 'Preparar mi rutina');
  await expect(page.getByText('work', { exact: true })).toBeVisible();
  await learn(page, 'mexico-routine');
  await listen(page);
  await answerTravelChoice(page, 'mexico-routine-audio', 'Se levanta, desayuna y trabaja.');
  await answerTravelChoice(page, 'mexico-routine-planner', 'Trabaja y estudia inglés.');

  const input = answerInput(page, 'mexico-routine-write');
  await input.fill('I study English');
  await expect
    .poll(async () => (await stories(page)).chapterProgress?.mexico?.travel.active?.answer.text)
    .toBe('I study English');
  await page.reload();
  await openMexicoStory(page);
  await expect(input).toHaveValue('I study English');
  await submitWithEnter(page, 'mexico-routine-write', 'I study English every day.');
  await expect(page.getByTestId('speaking-studio')).toContainText('Modelo para comparar');
  await click(page, 'Ya revisé mi respuesta');

  await click(page, 'Dar vuelta a la página');
  await click(page, 'Comparar las rutinas');
  await learn(page, 'mexico-others');
  await listen(page);
  await answerTravelChoice(page, 'mexico-others-audio', 'Nunca.');
  await answerTravelChoice(page, 'mexico-others-read', 'Leo.');
  await submitWithEnter(page, 'mexico-others-write', 'She cooks at home.');
  await click(page, 'Ahora no puedo hablar');
  await click(page, 'Cerrar el cuaderno');

  await click(page, 'Leer el horario');
  await click(page, 'Practicar con el horario');
  await learn(page, 'mexico-time');
  await listen(page);
  await answerTravelChoice(page, 'mexico-time-audio', '8:15 y 9:30');
  await answerTravelChoice(page, 'mexico-time-read', 'Sábado a las ocho.');
  await submitWithEnter(page, 'mexico-time-write', 'We meet on Saturday at eight.');
  await click(page, 'Ahora no puedo hablar');

  await page.getByTestId('story-choice-mexico-walk-to-market').click();
  const market = page.getByTestId('story-scene-mexico-market');
  await expect(market).toBeVisible();
  await expect(market.getByTestId('story-scene-background').locator('img')).toHaveAttribute(
    'src',
    /^(?:blob:|data:image\/)/,
  );
  await click(page, 'Consultar los horarios con Inés');
  await click(page, 'Acordar la visita');
  await learn(page, 'mexico-agreement');
  await answerTravelReorder(page, 'mexico-agreement-build', [
    'Does',
    'the',
    'market',
    'open',
    'at',
    'eight?',
  ]);
  await listen(page);
  await answerTravelChoice(
    page,
    'mexico-agreement-listen',
    'Pueden a las ocho y descartan las diez.',
  );
  await answerTravelChoice(
    page,
    'mexico-agreement-read',
    'La hora a la que trabaja el hermano de Inés.',
  );
  await submitWithEnter(
    page,
    'mexico-agreement-question',
    'What time does your sister start work?',
  );
  await submitWithEnter(
    page,
    'mexico-agreement-confirm',
    "We meet at eight. She doesn't go at ten.",
  );
  await click(page, 'Ahora no puedo hablar');

  await page.getByTestId('story-choice-mexico-go-to-leo').click();
  await click(page, 'Leer el mensaje de Leo');
  await click(page, 'Organizar la cita de estudio');
  await learn(page, 'mexico-transfer');
  await answerTravelChoice(page, 'mexico-transfer-read', 'Viernes a las tres y media.');
  await submitWithEnter(page, 'mexico-transfer-ask', 'Does your sister work on Friday?');
  await submitWithEnter(
    page,
    'mexico-transfer-write',
    'We meet at the library on Friday at half past three.',
  );
  await expect(page.getByTestId('story-dialogue-mexico-finish')).toContainText('Cartagena');
  await click(page, 'Cerrar el cuaderno');
  await click(page, 'Mochila');
  await expect(page.getByTestId('story-inventory-mexico-market-postcard')).toBeVisible();
  await page.getByTestId('story-passport').click();
  await expect(page.getByText(/^Ciudad de México · /)).toBeVisible();
  await expect(page.getByRole('button', exact('Continuar a Cartagena'))).toBeVisible();

  const saved = await stories(page);
  expect(saved.chapterProgress?.mexico?.travel.stamps.mexico).toBeTruthy();
  expect(saved.chapterProgress?.mexico?.story?.quests['mexico-market-plan']?.status).toBe(
    'completed',
  );
  expect(saved.chapterProgress?.mexico?.story?.quests['mexico-library-plan']?.status).toBe(
    'completed',
  );
  const evidence = saved.unifiedLearning.evidence;
  expect(
    evidence.some(
      (event) =>
        event.source === 'story' &&
        event.independent &&
        event.targets.some(({ dimension }) => dimension === 'speaking'),
    ),
  ).toBe(false);
  expect(evidence).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        exerciseId: 'mexico-routine-lesson',
        activity: 'introduced',
        teaches: expect.arrayContaining([{ id: 'grammar.routine_base' }]),
      }),
      expect.objectContaining({
        exerciseId: 'mexico-routine-audio',
        activity: 'answer',
        independent: true,
        outcome: 'target',
        targets: expect.arrayContaining([
          { targetId: 'grammar.routine_base', dimension: 'listening' },
        ]),
      }),
      expect.objectContaining({
        exerciseId: 'mexico-transfer-write',
        activity: 'answer',
        outcome: 'target',
        independent: true,
        transfer: true,
        contextId: 'mexico-library-classmate',
        materialId: 'u02_l04',
      }),
      expect.objectContaining({
        exerciseId: 'mexico-agreement-build',
        activity: 'answer',
        outcome: 'target',
        independent: false,
        aids: expect.arrayContaining(['guided']),
      }),
    ]),
  );
  const answers = evidence.filter(
    ({ exerciseId, activity }) => exerciseId === 'mexico-routine-write' && activity === 'answer',
  );
  expect(answers).toEqual([
    expect.objectContaining({
      source: 'story',
      materialId: 'u02_l01',
      independent: true,
      outcome: 'target',
      targets: expect.arrayContaining([
        { targetId: 'grammar.routine_base', dimension: 'grammar_production' },
      ]),
    }),
  ]);
  expect(transfers()).toHaveLength(1);
  expect(saved.story).toEqual(home);
  expect(saved.travel).toEqual(homeTravel);
});
