import type { APIRequestContext, Page } from '@playwright/test';
import {
  answerTravelChoice,
  click,
  enterApp,
  exact,
  expect,
  homeMission,
  initialChapterTimeout,
  labelFirstChapterAudio,
  openHomeFoundationStudy,
  readTravelInstruction,
  readyOfflineShell,
  state,
  test,
} from './helpers';

const studyOrStoryAnswer = (page: Page, exerciseId: string) =>
  page.getByTestId(`exercise-${exerciseId}`);
const storyChoice = (page: Page, choice: string) => page.getByTestId(`story-choice-${choice}`);
const listen = async (page: Page, button = 'Escuchar el mensaje') => {
  await click(page, button);
  await expect.poll(async () => (await state(page)).travel.active?.audioPlayed).toBe(true);
};

async function removeHomePack(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('lingoquest-chapter-packs');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction('packs', 'readwrite');
          transaction.objectStore('packs').delete('home');
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
  );
}

async function openFirstNameConversation(page: Page, name: string) {
  await page.goto('/');
  await expect(page.getByRole('heading', exact('Empieza tu viaje en inglés'))).toBeVisible({
    timeout: initialChapterTimeout,
  });
  await click(page, 'Comenzar mi aventura');
  await click(page, 'Honduras');
  await page.getByRole('textbox', exact('Tu nombre')).fill(name);
  await click(page, 'Guardar y continuar');
  await expect(page.getByTestId('story-scene-plaza')).toBeVisible();
  await click(page, 'Omitir guía');
  await page.getByTestId('story-hotspot-plaza-sam').click();
  for (const id of [
    'greet-sam-in-english',
    'greet-luz-in-english',
    'reply-to-luz',
    'continue-opening-with-sam',
  ]) {
    await storyChoice(page, id).click();
  }
  await expect(page.getByTestId('story-dialogue-sam-asks-name')).toBeVisible();
}

async function observeAudio(
  page: Page,
  request: APIRequestContext,
  phrases: Record<string, string>,
) {
  await labelFirstChapterAudio(page, request, phrases);
  await page.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.addEventListener(
        'ended',
        async () => {
          const label = await window.chapterAudioLabel(this.currentSrc);
          if (label) {
            document.body.dataset.completedAudio = label;
            document.body.dataset.completedAudioRate = String(this.playbackRate);
          }
        },
        { once: true },
      );
      return play.call(this);
    };
  });
}

async function supplyTestMicrophone(page: Page) {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const audio = new AudioContext();
      const output = audio.createMediaStreamDestination();
      const signal = audio.createOscillator();
      signal.connect(output);
      signal.start();
      const track = output.stream.getAudioTracks()[0];
      const stop = track.stop.bind(track);
      track.stop = () => {
        if (track.readyState === 'ended') return;
        stop();
        signal.stop();
        void audio.close();
      };
      await audio.resume();
      return output.stream;
    };
    const recordingTypes = new Set<string>();
    const start = MediaRecorder.prototype.start;
    MediaRecorder.prototype.start = function () {
      let encodedSamples = 0;
      this.addEventListener('dataavailable', ({ data }) => {
        if (!data.size) return;
        recordingTypes.add(this.mimeType.toLowerCase());
        if (++encodedSamples === 2) document.body.dataset.encodedRecording = 'true';
      });
      start.call(this, 200);
    };
    const recordings = new Set<string>();
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (media) => {
      const uri = createObjectURL(media);
      if (media instanceof Blob && recordingTypes.has(media.type)) recordings.add(uri);
      return uri;
    };
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (recordings.has(this.src)) {
        this.addEventListener(
          'ended',
          () => {
            document.body.dataset.playedRecording = 'true';
          },
          { once: true },
        );
      }
      return play.call(this);
    };
  });
}

test('the first Home conversation teaches sound and print before offline letter assessment', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await observeAudio(page, request, { letterE: 'E', nameQuestion: "What's your name?" });
  await openFirstNameConversation(page, 'Ana María López-García');
  expect((await state(page)).travel.practiceName).toBe('Ana María López-García');
  const dialogue = page.getByTestId('story-dialogue-sam-asks-name');
  await expect(dialogue.getByRole('heading', exact('Sam'))).toBeVisible();
  await readyOfflineShell(page, context);

  await page.getByTestId('story-repair-toggle').click();
  await page.getByTestId('story-repair-repeat').click();
  await expect(page.getByTestId('story-repair-response')).toContainText(
    'Can you repeat that, please?',
  );
  await page.getByTestId('story-repair-slower').click();
  await expect(page.getByTestId('story-repair-response')).toContainText(
    'Can you speak more slowly, please?',
  );
  await expect(page.locator('body')).toHaveAttribute('data-completed-audio', 'nameQuestion');
  await expect
    .poll(async () => Number(await page.locator('body').getAttribute('data-completed-audio-rate')))
    .toBeLessThan(1);
  await page.getByTestId('story-repair-meaning').click();
  await expect(page.getByTestId('story-repair-response')).toContainText('¿Cómo te llamas?');
  expect((await state(page)).unifiedLearning.evidence.some(({ independent }) => independent)).toBe(
    false,
  );

  const id = 'foundation-letters-a';
  const mission = await homeMission(request, id);
  await storyChoice(page, 'open-name-foundation').click();
  await storyChoice(page, 'open-letter-foundation').click();
  await storyChoice(page, `practice-${id}`).click();
  const quizId = 'foundation-letters-a-listen';
  const quiz = studyOrStoryAnswer(page, quizId);
  await expect(quiz).toHaveCount(0);
  await readTravelInstruction(page, mission);
  await expect(quiz).toBeVisible();
  await quiz.getByRole('radio', exact('e')).click();
  const check = page.getByRole('button', exact('Comprobar respuesta'));
  await expect(check).toBeDisabled();
  await listen(page);
  await expect(page.locator('body')).toHaveAttribute('data-completed-audio', 'letterE');
  await expect(check).toBeEnabled();
  await check.click();
  await expect(page.getByTestId('answer-feedback')).toContainText('¡Muy bien!');
  const learned = (await state(page)).unifiedLearning.evidence;
  expect(learned).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        exerciseId: quizId,
        source: 'story',
        independent: true,
        outcome: 'target',
        targets: expect.arrayContaining([expect.objectContaining({ dimension: 'listening' })]),
      }),
    ]),
  );
  expect(
    learned.some(
      ({ activity, teaches }) => activity === 'introduced' && (teaches?.length ?? 0) > 0,
    ),
  ).toBe(true);
});

test('Story and Study share the personal spelling draft and distinguish support from assessment', async ({
  page,
  context,
  request,
}) => {
  const id = 'foundation-names';
  const name = 'Ana María López-García';
  const spelling = 'A-N-A / M-A-R-I-A / L-O-P-E-Z / G-A-R-C-I-A';
  await supplyTestMicrophone(page);
  await openFirstNameConversation(page, name);
  await readyOfflineShell(page, context);
  await storyChoice(page, 'open-name-foundation').click();
  await storyChoice(page, `practice-${id}`).click();
  const mission = await homeMission(request, id);
  await readTravelInstruction(page, mission);
  await answerTravelChoice(page, 'foundation-names-read', 'Ana');
  await readTravelInstruction(page, mission, 2);
  await click(page, 'Leer la transcripción');
  await answerTravelChoice(page, 'foundation-names-order-listen', 'L · U · Z');
  await listen(page, 'Escuchar a Sam');
  await studyOrStoryAnswer(page, 'foundation-names-letters-write')
    .getByRole('textbox', exact('Tu respuesta en inglés'))
    .fill('U L Z');
  await click(page, 'Comprobar respuesta');
  await expect(page.getByTestId('answer-feedback')).toContainText('¡Muy bien!');
  await click(page, 'Seguir la historia');

  const quizId = 'foundation-names-spell';
  const input = studyOrStoryAnswer(page, quizId).getByRole(
    'textbox',
    exact('Tu respuesta en inglés'),
  );
  await input.fill(spelling);
  await expect.poll(async () => (await state(page)).travel.active?.answer.text).toBe(spelling);
  await click(page, 'Cerrar y volver');
  await page.reload();
  await expect(page.getByRole('button', exact('Comenzar mi aventura'))).toBeVisible({
    timeout: initialChapterTimeout,
  });
  await openHomeFoundationStudy(page, id);
  await expect(input).toHaveValue(spelling);
  await click(page, 'Comprobar respuesta');
  await expect(page.getByTestId('answer-feedback')).toContainText('¡Muy bien!');
  await click(page, 'Seguir la historia');
  await expect(page.getByTestId('speaking-studio')).toContainText('Modelo para comparar');
  await click(page, 'Grabar sin conexión');
  await expect(page.locator('body')).toHaveAttribute('data-encoded-recording', 'true');
  await click(page, 'Terminar grabación');
  await click(page, 'Escuchar ejemplo y mi grabación');
  await expect(page.locator('body')).toHaveAttribute('data-played-recording', 'true');
  await click(page, 'Ya revisé mi respuesta');
  const { user, travel, unifiedLearning } = await state(page);
  expect(user.name).toBe('Explorador');
  expect(travel.practiceName).toBe(name);
  expect(unifiedLearning.evidence).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        exerciseId: 'foundation-names-read',
        source: 'story',
        independent: true,
      }),
      expect.objectContaining({
        exerciseId: 'foundation-names-order-listen',
        source: 'story',
        independent: false,
        outcome: 'target',
        aids: expect.arrayContaining(['transcript']),
      }),
      expect.objectContaining({
        exerciseId: quizId,
        source: 'study',
        independent: false,
        outcome: 'target',
        aids: expect.arrayContaining(['guided']),
      }),
      expect.objectContaining({
        exerciseId: 'foundation-names-letters-write',
        source: 'story',
        independent: true,
        outcome: 'target',
      }),
      expect.objectContaining({
        exerciseId: 'foundation-names-say',
        activity: 'recording',
        source: 'study',
        independent: false,
        aids: expect.arrayContaining(['guided']),
      }),
    ]),
  );
  expect(
    unifiedLearning.evidence.some(
      ({ independent, targets }) =>
        independent && targets.some(({ dimension }) => dimension === 'speaking'),
    ),
  ).toBe(false);
  expect(travel.stamps).toEqual({});
});

test('a missed bus number offers specific listening reinforcement offline', async ({
  page,
  context,
  request,
}) => {
  await observeAudio(page, request, { busEight: 'Eight' });
  await enterApp(page);
  await readyOfflineShell(page, context);
  const id = 'foundation-digits';
  const mission = await homeMission(request, id);
  await openHomeFoundationStudy(page, id);
  await readTravelInstruction(page, mission);
  await listen(page);
  await answerTravelChoice(page, 'foundation-digits-quantity', '2');
  await readTravelInstruction(page, mission, 2);
  await listen(page);
  await expect(page.locator('body')).toHaveAttribute('data-completed-audio', 'busEight');
  const quizId = 'foundation-digits-listen';
  await studyOrStoryAnswer(page, quizId).getByRole('radio', exact('9')).click();
  await click(page, 'Comprobar respuesta');
  await expect(page.getByTestId('answer-feedback')).toContainText('Eight significa ocho.');
  await click(page, 'Repasar en otra escena');
  await expect(page.getByText('Refuerza una idea · 1 min', { exact: true })).toBeVisible();
  const reinforcementId = 'foundation-review-eight-guided';
  const reinforcement = studyOrStoryAnswer(page, reinforcementId);
  await expect(reinforcement).toContainText('Nine significa 9.');
  await click(page, 'Escuchar el mensaje');
  await reinforcement.getByRole('radio', exact('8')).click();
  const submit = page.getByRole('button', exact('Comprobar respuesta'));
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByTestId('answer-feedback')).toContainText('¡Muy bien!');
  expect((await state(page)).unifiedLearning.evidence).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        exerciseId: quizId,
        outcome: 'incorrect',
        error: 'vocabulary_sense',
      }),
      expect.objectContaining({
        exerciseId: reinforcementId,
        source: 'remediation',
        independent: false,
        outcome: 'target',
      }),
    ]),
  );
});

test('Home repair stays reviewable offline from Mexico after removing the Home media pack', async ({
  page,
  context,
  request,
  networkGuard,
}) => {
  const start = Date.UTC(2026, 10, 20, 18);
  await page.clock.setFixedTime(start);
  await enterApp(page);
  const id = 'foundation-repair';
  const mission = await homeMission(request, id);
  await openHomeFoundationStudy(page, id);
  await readTravelInstruction(page, mission);
  await listen(page);
  await answerTravelChoice(page, 'foundation-repair-command', 'Leer');
  await readTravelInstruction(page, mission, 3);
  await answerTravelChoice(page, 'foundation-repair-meaning', 'La primera');
  const taughtCheck = studyOrStoryAnswer(page, 'foundation-repair-repeat').getByRole(
    'textbox',
    exact('Tu respuesta en inglés'),
  );
  await taughtCheck.fill('Can you repeat that, please?');
  await click(page, 'Comprobar respuesta');
  await expect(page.getByTestId('answer-feedback')).toContainText('¡Muy bien!');
  await click(page, 'Seguir la historia');
  await click(page, 'Ahora no puedo hablar');
  await click(page, 'Volver al viaje');

  await page.getByRole('tab', exact('Mapa')).click();
  await click(page, '2. Ciudad de México');
  await click(page, 'Abrir capítulo');
  await expect(page.getByTestId('chapter-lesson-mexico')).toBeVisible();
  await readyOfflineShell(page, context);
  await removeHomePack(page);
  const requestsBefore = networkGuard.attempted.filter((url) =>
    url.includes('/chapter-packs/'),
  ).length;
  await page.clock.setFixedTime(start + 8 * 86_400_000);
  await page.reload();
  await expect(page.getByRole('button', exact('Continuar capítulo 2'))).toBeVisible();
  await page.getByRole('tab', exact('Perfil')).click();
  await click(page, 'Mis habilidades');
  await page
    .getByTestId('learning-review-writing:lex.home.can-you-repeat-that-please')
    .getByRole('button', { name: /^Abrir repaso rápido:/ })
    .click();
  const archived = studyOrStoryAnswer(page, 'foundation-review-repeat').getByRole(
    'textbox',
    exact('Tu respuesta en inglés'),
  );
  await expect(archived).toBeVisible();
  await expect(page.getByRole('button', exact('Escuchar el mensaje'))).toHaveCount(0);
  await archived.fill('Again, please.');
  await archived.press('Enter');
  await expect(page.getByTestId('answer-feedback')).toContainText('¡Muy bien!');
  expect((await state(page)).unifiedLearning.evidence).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        exerciseId: 'foundation-repair-repeat',
        source: 'study',
        independent: true,
      }),
      expect.objectContaining({
        exerciseId: 'foundation-review-repeat',
        source: 'review',
        independent: true,
        materialVersion: expect.stringMatching(/^home:/),
      }),
    ]),
  );
  expect(networkGuard.attempted.filter((url) => url.includes('/chapter-packs/'))).toHaveLength(
    requestsBefore,
  );
});
