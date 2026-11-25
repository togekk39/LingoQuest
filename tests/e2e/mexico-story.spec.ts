import {
  CHAPTER_CATALOG_FILE,
  type ChapterCatalog,
  type ChapterPack,
} from '@lingoquest/course-pack';
import {
  OFFLINE_STATE_KEY,
  type OfflineState,
  type TravelCheckpoint,
} from '@lingoquest/offline-engine';
import type { Page } from '@playwright/test';
import { mexicoChapter } from '../../content/source/mexico-missions';
import { emptyStory, type StoryDefinition } from '../../packages/offline-engine/src/story';
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

async function openMexicoReader(page: Page) {
  await page.getByRole('tab', exact('Mapa')).click();
  await click(page, '2. Ciudad de México');
  await click(page, 'Abrir capítulo');
  const reader = page.getByTestId('chapter-lesson-mexico');
  await expect(reader).toBeVisible();
  return reader;
}

async function resumeMexicoStory(page: Page) {
  await click(page, 'Continuar capítulo 2');
  await page
    .getByTestId('chapter-lesson-mexico')
    .getByRole('button', exact('Explorar aventura de este capítulo'))
    .click();
}

async function openMexicoStudyLesson(page: Page, lessonId: string) {
  const reader = page.getByTestId('chapter-lesson-mexico');
  await reader.getByRole('button', exact('Hacer las lecciones del curso')).click();
  await page
    .getByTestId(`textbook-lesson-${lessonId}`)
    .getByRole('button', exact('Empezar lección'))
    .click();
  await expect(page.getByTestId('lesson-stage-goal')).toBeVisible();
}

const stories = async (page: Page) =>
  (await state(page)) as Awaited<ReturnType<typeof state>> &
    Pick<OfflineState, 'story' | 'chapterProgress'>;
const answerInput = (page: Page, exercise: string) =>
  page.getByTestId(`exercise-${exercise}`).getByRole('textbox', exact('Tu respuesta en inglés'));

async function setStoredMexicoPack(page: Page, pack?: string) {
  await page.evaluate(
    (value) =>
      new Promise<void>((resolve, reject) => {
        const database = indexedDB.open('lingoquest-chapter-packs');
        database.onerror = () => reject(database.error);
        database.onsuccess = () => {
          const db = database.result;
          const transaction = db.transaction('packs', 'readwrite');
          const store = transaction.objectStore('packs');
          if (value) {
            store.put(value, 'mexico');
            store.put('mexico', '@current');
          } else store.delete('mexico');
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        };
      }),
    pack,
  );
}

async function storedMexicoRevision(page: Page) {
  return page.evaluate(
    () =>
      new Promise<number | undefined>((resolve, reject) => {
        const database = indexedDB.open('lingoquest-chapter-packs');
        database.onerror = () => reject(database.error);
        database.onsuccess = () => {
          const db = database.result;
          const request = db.transaction('packs').objectStore('packs').get('mexico');
          request.onsuccess = () => resolve(request.result && JSON.parse(request.result).revision);
          request.onerror = () => reject(request.error);
          db.close();
        };
      }),
  );
}

async function learn(page: Page, missionId: string) {
  const mission = mexicoChapter.missions.find(({ id }) => id === missionId);
  if (!mission) throw new Error(`Missing lesson for ${missionId}`);
  for (const step of mission.steps) {
    if (step.type === 'dialogue') {
      const turn = page.locator(`[id="travel-step-id-${step.id}"]`);
      await expect(
        page.getByTestId('story-learning').getByRole('heading', exact(step.speaker)),
      ).toBeVisible();
      if (step.line) await expect(turn.getByText(step.line.en, exact(step.line.en))).toBeVisible();
      await click(page, 'Continuar');
      continue;
    }
    if (step.type !== 'teach') break;
    const vocabulary = travelStepVocabulary(mission, step);
    for (let word = 1; word < vocabulary.length; word++) await click(page, 'Siguiente palabra');
    if (vocabulary.length) await click(page, 'Ver la explicación');
    await expect(page.getByRole('heading', exact(step.title))).toBeVisible();
    if (step.speaker) {
      await expect(
        page.getByTestId('story-learning').getByRole('heading', exact(step.speaker)),
      ).toBeVisible();
    }
    await expect(page.getByTestId('grammar-workbench')).toContainText(step.text);
    if (step.id === 'mexico-time-numbers')
      await expect(page.getByTestId('grammar-workbench')).toContainText(
        'Fifteen, fifty. Thirteen, thirty.',
      );
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
  const step = mexicoChapter.missions
    .flatMap(({ steps }) => steps)
    .find(({ id }) => id === exercise);
  if (step?.type === 'exercise' && step.storyReply) {
    const reply = page.getByTestId('travel-story-reply');
    await expect(reply.getByRole('heading', exact(step.storyReply.speaker))).toBeVisible();
    await expect(reply).toContainText(step.storyReply.line.en);
    await expect(reply).toContainText(step.storyReply.line.es);
  }
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

  await openMexicoReader(page);
  await openMexicoStudyLesson(page, 'u02_l01');
  await click(page, 'Conocer las palabras');
  await click(page, 'Siguiente palabra');
  await expect
    .poll(async () =>
      (await state(page)).unifiedLearning.evidence.some(
        (event) =>
          event.source === 'study' &&
          event.materialId === 'u02_l01' &&
          event.activity === 'introduced' &&
          (event.teaches?.length ?? 0) > 0,
      ),
    )
    .toBe(true);
  await click(page, 'Cerrar y volver');
  await click(page, 'Cerrar y volver');
  await click(page, 'Cerrar y volver');
  await click(page, 'Explorar aventura de este capítulo');
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
  await resumeMexicoStory(page);
  await expect(host).toBeVisible();
  await expect(artwork).toHaveAttribute('src', /^(?:blob:|data:image\/)/);

  await click(page, 'Ver mi agenda con Inés');
  await click(page, 'Preparar mi rutina');
  await expect(
    page.getByTestId('illustrated-vocabulary').getByText('trabajar', exact('trabajar')).first(),
  ).toBeVisible();
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
  await resumeMexicoStory(page);
  await expect(input).toHaveValue('I study English');
  await expect(
    page.getByTestId('travel-workbook').getByText(/Actividad: estudiar inglés/),
  ).toBeVisible();
  await submitWithEnter(page, 'mexico-routine-write', 'Every day, I study English.');
  const openWriting = answerInput(page, 'mexico-routine-self-check');
  await openWriting.fill('I walk in the morning. Then I study English.');
  await openWriting.press('Enter');
  const selfCheck = page.getByTestId('answer-feedback');
  await expect(selfCheck).toContainText('Revisa tu respuesta');
  await expect(selfCheck).toContainText('I get up in the morning. Then I work.');
  await expect(selfCheck).toContainText('cada oración tiene un sujeto');
  await expect(selfCheck).not.toContainText('¡Muy bien!');
  await expect(page.getByRole('button', exact('Intentar otra vez'))).toHaveCount(0);
  expect((await stories(page)).chapterProgress?.mexico?.travel.active?.result).toMatchObject({
    outcome: 'ungradable',
    xpAwarded: 0,
  });
  await click(page, 'Seguir la historia');
  await expect(page.getByTestId('speaking-studio')).toContainText('Modelo para comparar');
  await click(page, 'Ya revisé mi respuesta');

  await click(page, 'Dar vuelta a la página');
  await click(page, 'Comparar las rutinas');
  await learn(page, 'mexico-others');
  await listen(page);
  await answerTravelChoice(page, 'mexico-others-audio', 'Nunca.');
  await answerTravelChoice(page, 'mexico-others-read', 'Leo.');
  await submitWithEnter(page, 'mexico-others-write', 'Clara cooks at home.');
  await click(page, 'Ahora no puedo hablar');
  await click(page, 'Cerrar el cuaderno');

  await click(page, 'Leer el horario');
  await click(page, 'Practicar con el horario');
  await learn(page, 'mexico-time');
  await listen(page);
  await answerTravelChoice(page, 'mexico-time-audio', '8:15 y 9:30');
  await answerTravelChoice(page, 'mexico-time-read', 'Sábado a las ocho.');
  await submitWithEnter(page, 'mexico-time-write', "On Saturday, we meet at eight o'clock.");
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
  await submitWithEnter(page, 'mexico-agreement-question', 'When does your sister start working?');
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
    'We meet at three thirty on Friday at the library.',
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

  await click(page, 'Volver al viaje');
  await click(page, 'Cerrar y volver');
  await openMexicoReader(page);
  await openMexicoStudyLesson(page, 'u02_l04');
  const writing = page.getByTestId('study-status-writing');
  await expect(writing).toBeVisible();
  await expect(writing).not.toContainText('Por comprobar');
  expect((await stories(page)).chapterProgress?.mexico).toMatchObject({
    story: saved.chapterProgress?.mexico?.story,
    travel: saved.chapterProgress?.mexico?.travel,
  });

  await click(page, 'Cerrar y volver');
  await click(page, 'Cerrar y volver');
  await click(page, 'Cerrar y volver');
  await click(page, 'Cerrar y volver');
  await setStoredMexicoPack(page);
  expect(await storedMexicoRevision(page)).toBeUndefined();
  await page.reload();
  await expect(page.getByRole('button', exact('Continuar capítulo 2'))).toBeVisible();
  await page.clock.setFixedTime(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000));
  await page.getByRole('tab', exact('Perfil')).click();
  await click(page, 'Mis habilidades');
  const routine = page.getByTestId('learning-review-grammar_production:grammar.routine_base');
  await routine.getByRole('button', { name: /^Abrir repaso rápido:/ }).click();
  const archivedReview = answerInput(page, 'mexico-review-routine');
  await expect(archivedReview).toBeVisible();
  await expect(page.getByRole('button', exact('Escuchar el mensaje'))).toHaveCount(0);
  await archivedReview.fill('We study English every day.');
  await archivedReview.press('Enter');
  await expect(page.getByTestId('answer-feedback')).toContainText('¡Muy bien!');
  expect((await stories(page)).unifiedLearning.evidence).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        exerciseId: 'mexico-review-routine',
        independent: true,
        outcome: 'target',
        source: 'review',
        materialVersion: expect.stringMatching(/^mexico:/),
      }),
    ]),
  );
});

test('an old Mexico draft survives the audit update and waits for the missing formal teaching', async ({
  page,
  context,
  request,
}) => {
  const latest: ChapterCatalog = await (
    await request.get(`/chapter-packs/${CHAPTER_CATALOG_FILE}`)
  ).json();
  const oldPackText = await (await request.get('/chapter-packs/8/mexico.json')).text();
  const oldPack: ChapterPack = JSON.parse(oldPackText);
  const oldStory = oldPack.story;
  if (!oldStory) throw new Error('The revision 8 Mexico Story fixture is missing.');
  const missionId = 'mexico-time';
  const stepId = 'mexico-time-write';
  const oldStep = oldStory.chapter.missions
    .find(({ id }) => id === missionId)
    ?.steps.findIndex(({ id }) => id === stepId);
  expect(oldStep).toBeGreaterThanOrEqual(0);
  expect(latest.chapters.mexico.revision).toBeGreaterThan(oldPack.revision);
  const draft = 'We meet on Saturday';
  const checkpoint: TravelCheckpoint = {
    missionId,
    step: oldStep!,
    stepId,
    contentRevision: oldStory.chapter.revision,
    token: 'mexico-time-revision-eight',
    answer: { text: draft },
    hint: false,
    transcript: false,
    finished: false,
  };
  const story = {
    ...emptyStory(oldStory.adventure as unknown as StoryDefinition),
    encounterId: missionId,
  };
  await enterApp(page);
  await readyOfflineShell(page, context);
  await page.evaluate(
    ({ key, checkpoint, story }) => {
      const saved: OfflineState = JSON.parse(localStorage.getItem(key)!);
      const timestamp = new Date().toISOString();
      saved.chapterProgress = {
        ...saved.chapterProgress,
        mexico: {
          story,
          travel: {
            active: checkpoint,
            completed: { 'mexico-routine': timestamp, 'mexico-others': timestamp },
            stamps: {},
          },
        },
      };
      saved.unifiedLearning.evidence.push({
        id: 'mexico:r8:time-lesson',
        source: 'story',
        materialVersion: 'mexico:8',
        materialId: 'u02_l04',
        exerciseId: 'mexico-time-lesson',
        timestamp: Date.now(),
        contextId: 'mexico-time',
        format: 'instruction',
        activity: 'introduced',
        aids: ['translation'],
        independent: false,
        retry: false,
        targets: [{ targetId: 'grammar.routine_time', dimension: 'grammar_recognition' }],
        teaches: [{ id: 'grammar.routine_time' }],
      });
      localStorage.setItem(key, JSON.stringify(saved));
    },
    { key: OFFLINE_STATE_KEY, checkpoint, story },
  );
  await setStoredMexicoPack(page, oldPackText);
  expect(await storedMexicoRevision(page)).toBe(oldPack.revision);
  await page.reload();
  await resumeMexicoStory(page);
  await expect(page.getByText(/actualizar este capítulo/)).toBeVisible();
  await expect(answerInput(page, stepId)).toHaveCount(0);
  expect((await stories(page)).chapterProgress?.mexico?.travel.active?.answer.text).toBe(draft);

  await context.setOffline(false);
  await page.reload();
  await expect.poll(() => storedMexicoRevision(page)).toBe(latest.chapters.mexico.revision);
  await readyOfflineShell(page, context);
  await page.reload();
  await resumeMexicoStory(page);
  await expect(page.getByRole('heading', exact('Primero aprende lo necesario'))).toBeVisible();
  const input = answerInput(page, stepId);
  await expect(input).toHaveCount(0);
  expect((await stories(page)).chapterProgress?.mexico?.travel.active).toMatchObject({
    stepId,
    answer: { text: draft },
    contentRevision: mexicoChapter.revision,
  });
  await click(page, 'Practicar con esta explicación');
  await expect(input).toHaveValue(draft);
  await input.fill('We meet on Saturday at eight.');
  await input.press('Enter');
  await expect(page.getByTestId('answer-feedback')).toContainText('¡Muy bien!');
  expect((await stories(page)).unifiedLearning.evidence).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        exerciseId: stepId,
        activity: 'answer',
        outcome: 'target',
        independent: false,
        aids: expect.arrayContaining(['guided']),
      }),
    ]),
  );
});
