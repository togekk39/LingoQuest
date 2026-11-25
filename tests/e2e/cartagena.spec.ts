import {
  CHAPTER_CATALOG_FILE,
  type ChapterCatalog,
  type ChapterPack,
} from '@lingoquest/course-pack';
import {
  getUnifiedMastery,
  type OfflineState,
  type TravelMission,
  type TravelStep,
} from '@lingoquest/offline-engine';
import type { APIRequestContext, Page } from '@playwright/test';
import { mexicoChapter } from '../../content/source/mexico-missions';
import { travelStepVocabulary } from '../../packages/offline-engine/src/travel-vocabulary';
import {
  answerTravelChoice,
  answerTravelReorder,
  answerTravelText,
  click,
  enterApp,
  exact,
  expect,
  finishVocabulary,
  readTravelInstruction,
  readyOfflineShell,
  state,
  test,
} from './helpers';

test.use({ actionTimeout: 15_000 });

const scene = (page: Page, id: string) => page.getByTestId(`story-scene-${id}`);
const hotspot = (page: Page, id: string) => page.getByTestId(`story-hotspot-${id}`);
const choice = (page: Page, id: string) => page.getByTestId(`story-choice-${id}`).click();
const closeDialogue = (page: Page) => page.getByTestId('story-dialogue-close').click();
const answerInput = (page: Page, id: string) =>
  page.getByTestId(`exercise-${id}`).getByRole('textbox', exact('Tu respuesta en inglés'));
const feedback = (page: Page) => page.getByTestId('answer-feedback');
const progress = async (page: Page) =>
  (await state(page)) as Awaited<ReturnType<typeof state>> &
    Pick<OfflineState, 'story' | 'chapterProgress'>;
const cartagenaCheckpoint = async (page: Page) =>
  (await progress(page)).chapterProgress?.colombia?.travel.active;
const answerEvidence = async (page: Page, exerciseId: string) =>
  (await state(page)).unifiedLearning.evidence.filter(
    (event) => event.exerciseId === exerciseId && event.activity === 'answer',
  );
const taught = async (page: Page, id: string, form: string) =>
  (await state(page)).unifiedLearning.evidence.some(
    (event) =>
      event.activity === 'introduced' &&
      event.teaches?.some((ref) => ref.id === id && ref.form === form),
  );

type ExerciseStep = Extract<TravelStep, { type: 'exercise' }>;
type BeforeExercise = (step: ExerciseStep) => Promise<boolean | void>;

declare global {
  interface Window {
    cartagenaMedia: { source: string; rate: number }[];
  }
}

async function observeLocalMedia(page: Page) {
  await page.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [];
    window.cartagenaMedia = [];
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const source = this.src;
      const rate = this.playbackRate;
      this.addEventListener('ended', () => window.cartagenaMedia.push({ source, rate }), {
        once: true,
      });
      return original.call(this);
    };
  });
}

async function provideLocalRecordingInput(page: Page) {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const audio = new AudioContext();
      const output = audio.createMediaStreamDestination();
      const tone = audio.createOscillator();
      tone.connect(output);
      tone.start();
      const track = output.stream.getAudioTracks()[0];
      const stop = track.stop.bind(track);
      track.stop = () => {
        stop();
        tone.stop();
        void audio.close();
      };
      await audio.resume();
      return output.stream;
    };
    const start = MediaRecorder.prototype.start;
    MediaRecorder.prototype.start = function () {
      let chunks = 0;
      this.addEventListener('dataavailable', ({ data }) => {
        if (data.size && ++chunks === 2) document.body.dataset.cartagenaRecording = 'encoded';
      });
      return start.call(this, 200);
    };
  });
}

async function publishedPack(request: APIRequestContext, chapterId: string) {
  const catalogResponse = await request.get(`/chapter-packs/${CHAPTER_CATALOG_FILE}`);
  expect(catalogResponse.ok()).toBe(true);
  const catalog: ChapterCatalog = await catalogResponse.json();
  const metadata = catalog.chapters[chapterId];
  const packResponse = await request.get(`/chapter-packs/${metadata.revision}/${chapterId}.json`);
  expect(packResponse.ok()).toBe(true);
  const pack: ChapterPack = await packResponse.json();
  expect(pack.revision).toBe(metadata.revision);
  return pack;
}

async function listen(page: Page, chapterId: string, label = 'Escuchar el mensaje') {
  await click(page, label);
  await expect
    .poll(async () => {
      const saved = await progress(page);
      return chapterId === 'home'
        ? saved.travel.active?.audioPlayed
        : saved.chapterProgress?.[chapterId]?.travel.active?.audioPlayed;
    })
    .toBe(true);
}

function findMission(missions: TravelMission[], id: string) {
  const mission = missions.find((entry) => entry.id === id);
  if (!mission) throw new Error(`Missing published mission ${id}`);
  return mission;
}

async function submitText(page: Page, id: string, answer: string) {
  const input = answerInput(page, id);
  await input.fill(answer);
  await input.press('Enter');
}

async function enterAuthoredAnswer(page: Page, step: ExerciseStep, response?: string) {
  const { exercise } = step;
  if (exercise.options?.length) {
    const option = exercise.options.find((entry) => entry.id === exercise.correctOptionId);
    if (!option) throw new Error(`Missing correct option for ${exercise.id}`);
    await page
      .getByTestId(`exercise-${exercise.id}`)
      .getByRole('radio', exact(response ?? option.text))
      .click();
    await click(page, 'Comprobar respuesta');
  } else if (exercise.type === 'reorder') {
    const tokens = (response ?? exercise.acceptedAnswers[0]).split(/\s+/);
    for (const token of tokens)
      await page
        .getByTestId(`exercise-${exercise.id}`)
        .getByRole('button', exact(`Agregar palabra: ${token}`))
        .click();
    await click(page, 'Comprobar respuesta');
  } else {
    await submitText(page, exercise.id, response ?? exercise.acceptedAnswers[0]);
  }
}

async function playCartagenaMission(
  page: Page,
  mission: TravelMission,
  {
    beforeExercise,
    finishStory = true,
  }: { beforeExercise?: BeforeExercise; finishStory?: boolean } = {},
) {
  for (const step of mission.steps) {
    const activity = page.locator(`[id="travel-step-id-${step.id}"]`);
    await expect(activity).toBeVisible();
    if (step.type === 'dialogue') {
      if (step.line)
        await expect(activity.getByText(step.line.en, exact(step.line.en))).toBeVisible();
      await click(page, 'Continuar');
    } else if (step.type === 'teach') {
      const vocabulary = travelStepVocabulary(mission, step);
      for (const [index, word] of vocabulary.entries()) {
        await expect(page.getByRole('button', exact(`Escuchar: ${word.term}`))).toBeVisible();
        await click(
          page,
          index === vocabulary.length - 1 ? 'Ver la explicación' : 'Siguiente palabra',
        );
      }
      await expect(page.getByTestId('grammar-workbench')).toContainText(step.text);
      await click(page, 'Probar en la historia');
    } else if (step.type === 'speak') {
      await expect(page.getByTestId('speaking-studio')).toBeVisible();
      if (step.id === 'cartagena-likes-speak' && finishStory) {
        await click(page, 'Grabar sin conexión');
        await expect(page.locator('body')).toHaveAttribute('data-cartagena-recording', 'encoded');
        await click(page, 'Terminar grabación');
        const previous = await page.evaluate(() => window.cartagenaMedia.length);
        await click(page, 'Escuchar ejemplo y mi grabación');
        await expect
          .poll(() => page.evaluate(() => window.cartagenaMedia.length))
          .toBeGreaterThanOrEqual(previous + 2);
        await click(page, 'Ya revisé mi respuesta');
      } else await click(page, 'Ahora no puedo hablar');
    } else {
      if (await beforeExercise?.(step)) continue;
      if (step.audio) await listen(page, 'colombia', step.listeningButton);
      await enterAuthoredAnswer(page, step);
      await expect(feedback(page)).toContainText(
        step.exercise.ungradable ? 'Revisa tu respuesta' : '¡Muy bien!',
      );
      await click(page, 'Seguir la historia');
    }
  }
  if (finishStory) {
    const finish = page.getByTestId('story-encounter-finish');
    if (await finish.isVisible()) await finish.click();
  }
}

async function resumeCartagena(page: Page) {
  await click(page, 'Continuar capítulo 3');
  await expect(page.getByTestId('chapter-lesson-colombia')).toBeVisible();
  await click(page, 'Explorar aventura de este capítulo');
}

async function studyCartagena(page: Page, title: string) {
  await page.getByRole('tab', exact('Aprender')).click();
  await click(page, 'Estudiar en Cartagena');
  await expect(page.getByTestId('chapter-lesson-colombia')).toBeVisible();
  await click(page, 'Practicar las misiones');
  await click(page, title);
}

async function openSkillReview(page: Page, target: string) {
  await page.getByRole('tab', exact('Perfil')).click();
  await click(page, 'Mis habilidades');
  const card = page.getByTestId(`learning-review-${target}`);
  await card.getByRole('button', { name: /^Abrir repaso rápido:/ }).click();
}

async function finishHome(page: Page) {
  await click(page, 'Comenzar mi aventura');
  await page.getByRole('textbox', exact('Tu nombre')).fill('Ana');
  await click(page, 'Guardar y continuar');
  await expect(scene(page, 'plaza')).toBeVisible();
  await click(page, 'Omitir guía');
  await hotspot(page, 'plaza-sam').click();
  for (const id of [
    'greet-sam-in-english',
    'greet-luz-in-english',
    'reply-to-luz',
    'continue-opening-with-sam',
    'introduce-yourself',
  ])
    await choice(page, id);
  await click(page, 'Siguiente palabra');
  await click(page, 'Siguiente palabra');
  await click(page, 'Ver la explicación');
  await click(page, 'Escuchar a Sam');
  await listen(page, 'home', 'Escuchar el saludo de Sam');
  await answerTravelChoice(page, 'travel_hello_recognize', 'Hola');
  await answerTravelReorder(page, 'travel_hello_build', ['I', 'am', 'Ana']);
  await answerTravelText(page, 'travel_hello_recall', 'Hi');
  await answerTravelText(page, 'travel_hello_write', "Hi! I'm Ana.");
  await answerTravelText(page, 'travel_hello_transfer', "I'm Ana.");
  await click(page, 'Ahora no puedo hablar');

  await hotspot(page, 'plaza-ticket').click();
  await choice(page, 'read-ticket');
  await closeDialogue(page);
  await hotspot(page, 'plaza-to-stop').click();
  await hotspot(page, 'stop-sign').click();
  await closeDialogue(page);
  await hotspot(page, 'stop-sam-directions').click();
  await choice(page, 'give-directions');
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await listen(page, 'home', 'Escuchar a Sam');
  await answerTravelChoice(page, 'travel_bus_listen', 'La parada de bus');
  await answerTravelReorder(page, 'travel_bus_direction', ['It’s', 'next', 'to', 'the', 'park']);
  await answerTravelText(page, 'travel_bus_dictation', 'It’s next to the park.');
  await answerTravelText(page, 'travel_bus_ask', 'Where is the bus stop?');
  await answerTravelText(page, 'travel_bus_transfer', 'The park is next to the bus stop.');
  await click(page, 'Completar misión');

  await hotspot(page, 'stop-sam-search').click();
  await choice(page, 'search-bench');
  await closeDialogue(page);
  await hotspot(page, 'stop-bench').click();
  await choice(page, 'read-bench-note');
  await closeDialogue(page);
  await hotspot(page, 'stop-to-lost-property').click();
  await hotspot(page, 'lost-luz').click();
  await choice(page, 'read-sam-message');
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await answerTravelChoice(page, 'travel_bag_read', 'A blue bag');
  await answerTravelChoice(page, 'travel_bag_owner', 'Luz');
  await answerTravelText(page, 'travel_bag_write', "It's blue.");
  await answerTravelText(page, 'travel_bag_transfer', "It's red.");
  await click(page, 'Ahora no puedo hablar');
  await hotspot(page, 'lost-blue-bag').click();
  await choice(page, 'take-blue-bag');
  await closeDialogue(page);
  await hotspot(page, 'lost-sam-return').click();
  await choice(page, 'show-blue-bag');
  await click(page, 'Completar misión');
  await page.getByTestId('story-passport').click();
  await expect(page.getByText('La postal de Sam', { exact: true })).toBeVisible();
  expect((await progress(page)).travel.stamps.home).toBeTruthy();
  await click(page, 'Continuar a Ciudad de México');
}

async function learnMexico(page: Page, id: string) {
  const mission = mexicoChapter.missions.find((entry) => entry.id === id);
  if (!mission) throw new Error(`Missing Mexico mission ${id}`);
  await readTravelInstruction(page, mission);
}

async function finishMexico(page: Page) {
  await expect(page.getByTestId('chapter-lesson-mexico')).toBeVisible();
  await click(page, 'Explorar aventura de este capítulo');
  await click(page, 'Hablar con Inés');
  await click(page, 'Ver mi agenda con Inés');
  await click(page, 'Preparar mi rutina');
  await learnMexico(page, 'mexico-routine');
  await listen(page, 'mexico');
  await answerTravelChoice(page, 'mexico-routine-audio', 'Se levanta, desayuna y trabaja.');
  await answerTravelChoice(page, 'mexico-routine-planner', 'Trabaja y estudia inglés.');
  await answerTravelText(page, 'mexico-routine-write', 'Every day, I study English.');
  await submitText(page, 'mexico-routine-self-check', 'I walk in the morning.');
  await expect(feedback(page)).toContainText('Revisa tu respuesta');
  await click(page, 'Seguir la historia');
  await click(page, 'Ya revisé mi respuesta');

  await click(page, 'Dar vuelta a la página');
  await click(page, 'Comparar las rutinas');
  await learnMexico(page, 'mexico-others');
  await listen(page, 'mexico');
  await answerTravelChoice(page, 'mexico-others-audio', 'Nunca.');
  await answerTravelChoice(page, 'mexico-others-read', 'Leo.');
  await answerTravelText(page, 'mexico-others-write', 'Clara cooks at home.');
  await click(page, 'Ahora no puedo hablar');
  await click(page, 'Cerrar el cuaderno');

  await click(page, 'Leer el horario');
  await click(page, 'Practicar con el horario');
  await learnMexico(page, 'mexico-time');
  await listen(page, 'mexico');
  await answerTravelChoice(page, 'mexico-time-audio', '8:15 y 9:30');
  await answerTravelChoice(page, 'mexico-time-read', 'Sábado a las ocho.');
  await answerTravelText(page, 'mexico-time-write', 'On Saturday, we meet at eight.');
  await click(page, 'Ahora no puedo hablar');

  await choice(page, 'mexico-walk-to-market');
  await click(page, 'Consultar los horarios con Inés');
  await click(page, 'Acordar la visita');
  await learnMexico(page, 'mexico-agreement');
  await answerTravelReorder(page, 'mexico-agreement-build', [
    'Does',
    'the',
    'market',
    'open',
    'at',
    'eight?',
  ]);
  await listen(page, 'mexico');
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
  await answerTravelText(page, 'mexico-agreement-question', 'When does your sister start working?');
  await answerTravelText(
    page,
    'mexico-agreement-confirm',
    "We meet at eight. She doesn't go at ten.",
  );
  await click(page, 'Ahora no puedo hablar');

  await choice(page, 'mexico-go-to-leo');
  await click(page, 'Leer el mensaje de Leo');
  await click(page, 'Organizar la cita de estudio');
  await learnMexico(page, 'mexico-transfer');
  await answerTravelChoice(page, 'mexico-transfer-read', 'Viernes a las tres y media.');
  await answerTravelText(page, 'mexico-transfer-ask', 'Does your sister work on Friday?');
  await answerTravelText(
    page,
    'mexico-transfer-write',
    'We meet at three thirty on Friday at the library.',
  );
  await expect(page.getByTestId('story-dialogue-mexico-finish')).toContainText('Cartagena');
  await click(page, 'Cerrar el cuaderno');
  await page.getByTestId('story-passport').click();
  await expect(page.getByText(/^Ciudad de México · /)).toBeVisible();
}

test('a mobile learner reaches Cartagena through the Mexico passport and finishes its five missions offline', async ({
  context,
  networkGuard,
  page,
  request,
}) => {
  test.setTimeout(420_000);
  await page.clock.setFixedTime(Date.UTC(2026, 10, 25, 17));
  const pack = await publishedPack(request, 'colombia');
  if (!pack.story) throw new Error('Cartagena adventure pack is missing.');
  const missions = pack.story.chapter.missions as unknown as TravelMission[];
  await page.setViewportSize({ width: 390, height: 844 });
  await observeLocalMedia(page);
  await provideLocalRecordingInput(page);
  await enterApp(page);
  await finishHome(page);
  await finishMexico(page);
  const beforeCartagena = await progress(page);
  expect(beforeCartagena.chapterProgress?.mexico?.travel.stamps.mexico).toBeTruthy();
  expect(
    beforeCartagena.unifiedLearning.evidence.some(({ materialVersion }) =>
      materialVersion.startsWith('colombia:'),
    ),
  ).toBe(false);

  await click(page, 'Continuar a Cartagena');
  const reader = page.getByTestId('chapter-lesson-colombia');
  await expect(reader).toBeVisible();
  await reader.getByRole('button', exact('Explorar aventura de este capítulo')).click();
  const street = scene(page, 'cartagena-street');
  await expect(street).toBeVisible();
  const artwork = street.getByTestId('story-scene-background').locator('img');
  await expect(artwork).toHaveAttribute('src', /^(?:blob:|data:image\/)/);
  await expect
    .poll(() => artwork.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  expect(
    networkGuard.attempted.filter((url) =>
      url.endsWith(`/chapter-packs/${pack.revision}/colombia.json`),
    ),
  ).toHaveLength(1);

  await readyOfflineShell(page, context);
  await page.reload();
  await resumeCartagena(page);
  await expect(street).toBeVisible();
  const invitation = hotspot(page, 'cartagena-street-postcard');
  await expect(invitation).toHaveAccessibleName('Leer la postal de Inés');
  const target = await invitation.boundingBox();
  expect(target?.width).toBeGreaterThanOrEqual(44);
  expect(target?.height).toBeGreaterThanOrEqual(44);
  await invitation.click();
  await choice(page, 'cartagena-go-to-market');
  await expect(scene(page, 'cartagena-market')).toBeVisible();
  await expect(hotspot(page, 'cartagena-market-basket')).toHaveCount(0);

  await hotspot(page, 'cartagena-market-mar').click();
  await choice(page, 'cartagena-start-likes');
  await expect(page.getByTestId('exercise-cartagena-likes-write')).toHaveCount(0);
  await playCartagenaMission(page, findMission(missions, 'cartagena-likes'), {
    beforeExercise: async (step) => {
      if (step.id === 'cartagena-likes-aux-guide') {
        const skill = getUnifiedMastery(
          (await state(page)).unifiedLearning,
          'grammar.do_questions',
          'grammar_production',
        );
        expect(skill.state).toBe('demonstrated');
        await click(page, 'Omitir esta práctica que ya demostré');
        return true;
      }
      if (step.id !== 'cartagena-likes-write') return;
      const learning = (await state(page)).unifiedLearning.evidence;
      expect(
        learning.filter(
          ({ activity, materialVersion, teaches }) =>
            activity === 'introduced' && materialVersion.startsWith('colombia:') && teaches?.length,
        ).length,
      ).toBeGreaterThan(4);
      await submitText(page, step.id, 'She likes chicken.');
      await expect(feedback(page)).toContainText('¡Muy bien!');
      await click(page, 'Seguir la historia');
      return true;
    },
  });
  await choice(page, 'close');
  expect(await answerEvidence(page, 'cartagena-likes-write')).toEqual([
    expect.objectContaining({ source: 'story', independent: true, outcome: 'target' }),
  ]);
  expect(await taught(page, 'lex.u03_l01_v02', 'coffee')).toBe(true);
  expect(await taught(page, 'lex.food.coffee-serving', 'coffees')).toBe(false);
  expect((await state(page)).unifiedLearning.evidence).toContainEqual(
    expect.objectContaining({
      exerciseId: 'cartagena-likes-speak',
      source: 'story',
      activity: 'recording',
      independent: false,
    }),
  );

  await hotspot(page, 'cartagena-market-basket').click();
  await choice(page, 'cartagena-start-quantity');
  await playCartagenaMission(page, findMission(missions, 'cartagena-quantity'), {
    beforeExercise: async (step) => {
      if (step.id !== 'cartagena-quantity-write') return;
      await submitText(page, step.id, 'How much water?');
      await expect(feedback(page)).toContainText('La forma en inglés es válida.');
      expect(await answerEvidence(page, step.id)).toEqual([
        expect.objectContaining({ outcome: 'context_mismatch' }),
      ]);
      await click(page, 'Intentar otra vez');
      await submitText(page, step.id, 'How many bottles of water?');
      await expect(feedback(page)).toContainText('¡Muy bien!');
      await click(page, 'Seguir la historia');
      return true;
    },
  });
  expect(await taught(page, 'lex.food.coffee-serving', 'coffees')).toBe(true);
  expect(await taught(page, 'lex.quantity.how-much', 'how much')).toBe(true);
  expect(await taught(page, 'lex.price.how-much', 'how much')).toBe(false);
  await choice(page, 'cartagena-go-to-cafe');
  await expect(scene(page, 'cartagena-cafe')).toBeVisible();

  await hotspot(page, 'cartagena-cafe-menu-board').click();
  await choice(page, 'cartagena-start-prices');
  await playCartagenaMission(page, findMission(missions, 'cartagena-prices'), {
    beforeExercise: async (step) => {
      if (step.id !== 'cartagena-prices-listen') return;
      expect(await taught(page, 'lex.price.how-much', 'how much')).toBe(true);
      expect(await taught(page, 'lex.number.thousand', 'thousand')).toBe(true);
      const correct = step.exercise.options?.find(({ id }) => id === step.exercise.correctOptionId);
      if (!correct) throw new Error('COP listening answer is missing.');
      expect(correct.text).toMatch(/25[.,]000|25\s*mil/i);
      await page.getByTestId(`exercise-${step.id}`).getByRole('radio', exact(correct.text)).click();
      await expect(page.getByRole('button', exact('Comprobar respuesta'))).toBeDisabled();
      await click(page, 'Leer la transcripción');
      await listen(page, 'colombia', step.listeningButton);
      await click(page, 'Comprobar respuesta');
      await expect(feedback(page)).toContainText('¡Muy bien!');
      expect(await answerEvidence(page, step.id)).toEqual([
        expect.objectContaining({
          independent: false,
          aids: expect.arrayContaining(['transcript']),
        }),
      ]);
      await click(page, 'Seguir la historia');
      return true;
    },
  });
  await choice(page, 'close');

  const preRepair = await page.evaluate(() => window.cartagenaMedia.length);
  await hotspot(page, 'cartagena-cafe-alba').click();
  await expect
    .poll(() => page.evaluate(() => window.cartagenaMedia.length))
    .toBeGreaterThan(preRepair);
  await page.getByTestId('story-repair-toggle').click();
  for (const [kind, rate, reply] of [
    ['repeat', 1, 'Repite la frase.'],
    ['slower', 0.75, 'Repite la frase más despacio.'],
  ] as const) {
    const previous = await page.evaluate(() => window.cartagenaMedia.length);
    await page.getByTestId(`story-repair-${kind}`).click();
    await expect(page.getByTestId('story-repair-response')).toContainText(reply);
    await expect
      .poll(() => page.evaluate(() => window.cartagenaMedia.length))
      .toBeGreaterThanOrEqual(previous + 2);
    const completed = await page.evaluate((start) => window.cartagenaMedia.slice(start), previous);
    expect(completed).toEqual([
      expect.objectContaining({ source: expect.stringMatching(/^blob:/), rate: 1 }),
      expect.objectContaining({ source: expect.stringMatching(/^blob:/), rate }),
    ]);
  }
  await choice(page, 'cartagena-start-order');
  await playCartagenaMission(page, findMission(missions, 'cartagena-order'), {
    beforeExercise: async (step) => {
      if (step.id !== 'cartagena-order-write') return;
      const draft = "I'd like fish with rice and";
      await answerInput(page, step.id).fill(draft);
      await expect.poll(async () => (await cartagenaCheckpoint(page))?.answer.text).toBe(draft);
      await page.reload();
      await resumeCartagena(page);
      await expect(answerInput(page, step.id)).toHaveValue(draft);
      await submitText(page, step.id, "I'd like eggs with cheese and some water, please.");
      await expect(feedback(page)).toContainText('La forma en inglés es válida.');
      await expect(page.getByTestId('travel-story-reply')).toHaveCount(0);
      await expect(page.getByRole('button', exact('Seguir la historia'))).toHaveCount(0);
      expect(await answerEvidence(page, step.id)).toEqual([
        expect.objectContaining({ outcome: 'context_mismatch' }),
      ]);
      await click(page, 'Intentar otra vez');
      await submitText(page, step.id, 'Can I have fish with rice and some water, please?');
      await expect(feedback(page)).toContainText('Lograste comunicarte');
      await expect(page.getByTestId('travel-story-reply')).toContainText(/fish.*rice.*water/i);
      expect(await answerEvidence(page, step.id)).toEqual([
        expect.objectContaining({ outcome: 'context_mismatch' }),
        expect.objectContaining({ outcome: 'communication_only', independent: false }),
      ]);
      await click(page, 'Seguir la historia');
      return true;
    },
  });
  await choice(page, 'cartagena-go-to-seaside');
  await expect(scene(page, 'cartagena-seaside')).toBeVisible();
  await hotspot(page, 'cartagena-seaside-alba').click();
  await choice(page, 'cartagena-start-transfer');
  await playCartagenaMission(page, findMission(missions, 'cartagena-transfer'), {
    beforeExercise: async (step) => {
      if (step.id !== 'cartagena-transfer-order') return;
      await submitText(page, step.id, "I'd like eggs with bread and some tea, please.");
      await expect(feedback(page)).toContainText('¡Muy bien!');
      await expect(page.getByTestId('travel-story-reply')).toContainText(/eggs.*bread.*tea/i);
      await click(page, 'Seguir la historia');
      return true;
    },
  });
  await choice(page, 'cartagena-take-postcard');
  await click(page, 'Mochila');
  await expect(page.getByTestId('story-inventory-cartagena-cusco-postcard')).toBeVisible();
  await page.getByTestId('story-passport').click();
  await expect(page.getByText(/^Cartagena · /)).toBeVisible();
  await expect(page.getByText(/^Ciudad de México · /)).toBeVisible();
  await expect(page.getByText('La postal de Sam', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', exact('Continuar a Cusco'))).toBeVisible();

  const completed = await progress(page);
  expect(completed.story).toEqual(beforeCartagena.story);
  expect(completed.travel).toEqual(beforeCartagena.travel);
  expect(completed.chapterProgress?.mexico).toEqual(beforeCartagena.chapterProgress?.mexico);
  expect(completed.chapterProgress?.colombia?.travel.stamps.colombia).toBeTruthy();
  expect(
    Object.values(completed.chapterProgress?.colombia?.story?.quests ?? {}).filter(
      ({ status }) => status === 'completed',
    ),
  ).toHaveLength(5);
  const transfer = (await answerEvidence(page, 'cartagena-transfer-order')).find(
    ({ outcome }) => outcome === 'target',
  );
  expect(transfer).toMatchObject({ source: 'story', transfer: true, independent: true });
  for (const { targetId, dimension } of transfer?.targets ?? [])
    expect(getUnifiedMastery(completed.unifiedLearning, targetId, dimension).retention).toBe(
      'unverified',
    );

  const quantityTransfer = (await answerEvidence(page, 'cartagena-transfer-quantity')).find(
    ({ outcome }) => outcome === 'target',
  );
  const quantity = quantityTransfer?.targets.find(
    ({ dimension }) => dimension === 'grammar_production',
  );
  if (!quantity) throw new Error('The quantity transfer no longer assesses grammar production.');
  expect(
    getUnifiedMastery(completed.unifiedLearning, quantity.targetId, quantity.dimension),
  ).toMatchObject({
    transfer: 'verified',
    retention: 'unverified',
    delayedSuccesses: 0,
  });

  await click(page, 'Volver al viaje');
  await click(page, 'Cerrar y volver');
  await studyCartagena(page, 'El mercado de Cartagena');
  await playCartagenaMission(page, findMission(missions, 'cartagena-likes'), {
    finishStory: false,
    beforeExercise: async (step) => {
      if (step.id !== 'cartagena-likes-write') return;
      await submitText(page, step.id, 'She like chicken.');
      await expect(feedback(page)).toContainText('Buen intento');
      await click(page, 'Usar la respuesta de QuestBuddy');
      return true;
    },
  });
  await click(page, 'Volver al viaje');
  await click(page, 'Cerrar y volver');
  expect(await answerEvidence(page, 'cartagena-likes-write')).toEqual([
    expect.objectContaining({ source: 'story', outcome: 'target' }),
    expect.objectContaining({ source: 'study', outcome: 'incorrect', error: 'third_person' }),
  ]);
  const preferences = 'grammar.routine_third_person';
  const preferenceMastery = async () =>
    getUnifiedMastery((await state(page)).unifiedLearning, preferences, 'grammar_production');
  expect((await preferenceMastery()).pendingErrors).toContain('third_person');

  const practice = pack.story.practice as unknown as ExerciseStep[];
  const guide = practice.find((step) => step.id === 'cartagena-review-likes-guide');
  const confirmation = practice.find((step) => step.id === 'cartagena-review-likes-confirm');
  if (!guide || !confirmation) throw new Error('Cartagena preference repair steps are missing.');
  expect(guide.exercise.learning?.contextId).not.toBe(confirmation.exercise.learning?.contextId);
  await page.getByRole('tab', exact('Inicio')).click();
  await click(page, 'Repaso rápido');
  await expect(page.getByTestId(`exercise-${guide.id}`)).toBeVisible();
  await enterAuthoredAnswer(page, guide);
  await expect(feedback(page)).toContainText('¡Muy bien!');
  expect((await preferenceMastery()).pendingErrors).toContain('third_person');
  await click(page, 'Probar otra escena');
  await expect(page.getByTestId(`exercise-${confirmation.id}`)).toBeVisible();
  await enterAuthoredAnswer(page, confirmation);
  await expect(feedback(page)).toContainText('¡Muy bien!');
  expect((await preferenceMastery()).pendingErrors).not.toContain('third_person');
  expect(await answerEvidence(page, confirmation.id)).toEqual([
    expect.objectContaining({ outcome: 'target', independent: true, source: 'remediation' }),
  ]);
  await click(page, 'Volver al viaje');

  await page.getByRole('tab', exact('Mapa')).click();
  await click(page, '3. Cartagena');
  await click(page, 'Abrir capítulo');
  await click(page, 'Quitar descarga');
  await click(page, 'Quitar recursos del dispositivo');
  await expect(page.getByTestId('chapter-lesson-colombia')).toBeHidden();
  await expect(
    page.getByText('Recursos descargados eliminados. Tu progreso sigue guardado.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.clock.setFixedTime(Date.UTC(2026, 11, 3, 17));
  await openSkillReview(page, `${quantity.dimension}:${quantity.targetId}`);
  const textReview = page.getByTestId(/^exercise-cartagena-review-/);
  await expect(textReview).toBeVisible();
  await expect(page.getByRole('button', exact('Escuchar el mensaje'))).toHaveCount(0);
  const reviewId = (await textReview.getAttribute('data-testid'))?.replace(/^exercise-/, '');
  const archived = practice.find(({ id }) => id === reviewId);
  if (!archived) throw new Error(`Missing authored item for archived review ${reviewId}`);
  await enterAuthoredAnswer(page, archived);
  await expect(feedback(page)).toContainText('¡Muy bien!');
  expect(await answerEvidence(page, archived.id)).toContainEqual(
    expect.objectContaining({
      source: 'review',
      independent: true,
      outcome: 'target',
      materialVersion: `colombia:${pack.revision}`,
    }),
  );
  expect(
    getUnifiedMastery((await state(page)).unifiedLearning, quantity.targetId, quantity.dimension)
      .retention,
  ).toBe('verified');
  expect((await progress(page)).chapterProgress?.colombia?.travel.stamps.colombia).toBeTruthy();
  expect(
    networkGuard.attempted.filter((url) => /\/chapter-packs\/\d+\/colombia\.json$/.test(url)),
  ).toHaveLength(1);
});
