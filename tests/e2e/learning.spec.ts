import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  test,
  expect,
  enterApp,
  state,
  beginFirstLesson,
  chooseCorrectAnswer,
  finishLesson,
  readyOfflineShell,
  type ExerciseFixture,
} from './helpers';

const pack = JSON.parse(
  readFileSync(resolve(process.cwd(), 'apps/mobile/src/content/bundled-course.json'), 'utf8'),
);
const exercises = pack.payload.lessons.u01_l01.exercises as ExerciseFixture[];

test('fresh zero-knowledge learner completes the integrated lesson offline, retries safely and returns for review', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Empiezo desde cero', exact: true })).toBeVisible();
  await readyOfflineShell(page, context);
  await page.getByRole('button', { name: 'Empiezo desde cero', exact: true }).click();
  await expect(page.getByTestId('lesson-stage-goal')).toBeVisible();
  await expect(page.getByText('Meta de hoy', { exact: true })).toBeVisible();
  await expect(page.getByText(/^Pregunta \d+ de/)).toHaveCount(0);
  expect((await state(page)).xp).toBe(0);
  await page.getByRole('button', { name: 'Conocer las palabras', exact: true }).click();
  await expect(page.getByTestId('lesson-stage-vocabulary')).toBeVisible();
  await expect(page.getByText('Palabras para esta situación', { exact: true })).toBeVisible();
  await finishLesson(page, exercises, { correct: true, retryFirst: true });
  const completed = await state(page);
  expect(completed.formatVersion).toBe(2);
  expect(completed.completedLessons).toEqual(['u01_l01']);
  expect(completed.xp).toBe(25);
  expect(completed.mastery.every((skill) => skill.value < 1)).toBeTruthy();
  expect(new Set(completed.mastery.map((skill) => skill.dimension))).toEqual(
    new Set([
      'vocabulary_recognition',
      'vocabulary_recall',
      'grammar_understanding',
      'grammar_production',
    ]),
  );
  await page.getByRole('button', { name: 'Volver a mi camino', exact: true }).click();
  await page.clock.install({ time: new Date(Date.now() + 86_400_000) });
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }),
  ).toBeVisible();
  expect((await state(page)).xp).toBe(25);
  await page.getByRole('button', { name: 'Repasar un poquito', exact: true }).click();
  await expect(
    page.getByText('Un buen momento para recordar', { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Todas mis habilidades', exact: true }).click();
  await expect(page.getByText('Reconocer palabras', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText('Recordar palabras sin opciones', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText('Usar la gramática al escribir', { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Practicar esta habilidad', exact: true }).first().click();
  await expect(page.getByTestId('lesson-stage-goal')).toBeVisible();
  await expect(page.getByText(/corazones|tiempo restante/i)).toHaveCount(0);
  await finishLesson(page, exercises, { correct: true });
  const reviewed = await state(page);
  expect(reviewed.xp).toBeGreaterThan(completed.xp);
  expect(
    reviewed.mastery.some((skill, index) => skill.value > completed.mastery[index].value),
  ).toBeTruthy();
  await page.getByRole('button', { name: 'Volver a mi camino', exact: true }).click();
  await expect(
    page.getByText('Un pequeño repaso hace la diferencia.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar y volver', exact: true }).click();
  // The parent must reflect saved review results without a page reload.
  await expect(page.getByText(`${reviewed.xp} XP`, { exact: true })).toBeVisible();
  await expect(page.getByText('2 días', { exact: true })).toBeVisible();
  await expect(page.getByText('A tu ritmo', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Repasar · 0 pendientes', exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Perfil', exact: true }).click();
  await expect(
    page
      .getByText('XP de aprendizaje', { exact: true })
      .locator('..')
      .getByText(String(reviewed.xp), { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByText('Días consecutivos', { exact: true })
      .locator('..')
      .getByText('2', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/^\d+% · Evidencia de práctica$/)).toHaveText(
    reviewed.mastery.map((skill) => `${Math.round(skill.value * 100)}% · Evidencia de práctica`),
  );
  expect(errors).toEqual([]);
});

test('the bundled course cold-reloads offline without signing in, downloading lessons or waiting for sync', async ({
  page,
  context,
}) => {
  await enterApp(page);
  await readyOfflineShell(page, context);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }),
  ).toBeVisible();
  await beginFirstLesson(page);
  await page.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click();
  await expect(
    page.getByText(/Guardado para después|pendiente.*verificar|Sincronizar/i),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Siguiente ejercicio', exact: true }),
  ).toBeVisible();
  expect((await state(page)).mastery.length).toBeGreaterThan(0);
  expect(
    (await state(page)).mastery.every((item) => item.dimension === 'vocabulary_recognition'),
  ).toBeTruthy();
  expect((await state(page)).xp).toBe(0);
  await page.getByRole('button', { name: 'Cerrar y volver', exact: true }).click();
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Preparar mi viaje', exact: true })).toBeVisible();
});

test('phone layout exposes all four destinations and practice without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterApp(page);
  for (const label of ['Inicio', 'Aprender', 'Desafíos', 'Perfil'])
    await expect(page.getByRole('tab', { name: label, exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await beginFirstLesson(page);
  await expect(
    page.getByRole('button', { name: 'Comprobar respuesta', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
});

test('all forty pronunciation drills are reachable offline with recording optional and no remote score', async ({
  page,
  context,
}) => {
  await enterApp(page);
  await readyOfflineShell(page, context);
  await page.getByRole('button', { name: 'Practicar pronunciación', exact: true }).click();
  await expect(page.getByText('Tu inglés tiene algo que decir.', { exact: true })).toBeVisible();
  const categories = page.getByRole('tab');
  await expect(categories).toHaveCount(8);
  let total = 0;
  for (let index = 0; index < 8; index++) {
    await categories.nth(index).click();
    await expect(page.getByRole('button', { name: /^Practicar: / })).toHaveCount(5);
    total += await page.getByRole('button', { name: /^Practicar: / }).count();
  }
  expect(total).toBe(40);
  await page
    .getByRole('button', { name: /^Practicar: / })
    .first()
    .click();
  await expect(page.getByText('Dale voz a lo que aprendiste.', { exact: true })).toBeVisible();
  await expect(page.getByText(/No se envía a terceros/)).toBeVisible();
  await page.getByRole('button', { name: 'Ahora no puedo hablar', exact: true }).click();
  await expect(page.getByText('Tu inglés tiene algo que decir.', { exact: true })).toBeVisible();
  expect((await state(page)).xp).toBe(0);
});

test('placement and a complete airport mission run locally without altering course XP', async ({
  page,
  context,
}) => {
  await enterApp(page);
  await readyOfflineShell(page, context);
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  await page.getByRole('button', { name: 'Explorar mi nivel', exact: true }).click();
  await page.getByRole('button', { name: 'Explorar mi nivel', exact: true }).click();
  const questions = pack.payload.placementQuestions as ExerciseFixture[];
  for (let index = 0; index < questions.length; index++) {
    await expect(
      page.getByText(`Pregunta ${index + 1} de ${questions.length}`, { exact: true }),
    ).toBeVisible();
    await chooseCorrectAnswer(page, questions[index]);
    await page
      .getByRole('button', {
        name: index + 1 === questions.length ? 'Ver mi orientación' : 'Siguiente pregunta',
        exact: true,
      })
      .click();
  }
  await expect(page.getByText('Nivel sugerido · No certificado', { exact: true })).toBeVisible();
  expect((await state(page)).completedLessons).toEqual([]);
  await page.getByRole('button', { name: 'Seguir aprendiendo', exact: true }).click();
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  await page.getByRole('button', { name: 'Preparar mi viaje', exact: true }).click();
  await page.getByRole('button', { name: 'Empezar la conversación', exact: true }).click();
  for (const option of [
    'Good morning. I am flying to Miami.',
    'Of course. Here is my passport.',
    'I would like a window seat, please.',
    'What time does boarding start?',
    'Thank you. Have a nice day.',
  ])
    await page.getByRole('button', { name: option, exact: true }).click();
  await expect(page.getByText('¡Acabas de usar tu inglés!', { exact: true })).toBeVisible();
  await expect(page.getByText(/corazones|tiempo restante/i)).toHaveCount(0);
  expect((await state(page)).xp).toBe(0);
});

test('reference audio never selects a network-only browser speech voice', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__speechInvocations = 0;
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [
          {
            name: 'Remote English',
            lang: 'en-US',
            voiceURI: 'remote-en',
            localService: false,
            default: true,
          },
        ],
        speak: () => {
          (window as any).__speechInvocations++;
        },
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        speaking: false,
        pending: false,
        paused: false,
      },
    });
  });
  await enterApp(page);
  await page.getByRole('button', { name: 'Practicar pronunciación', exact: true }).click();
  await page
    .getByRole('button', { name: /^Practicar: / })
    .first()
    .click();
  await page.getByText('Escuchar ejemplo', { exact: true }).click();
  await expect(
    page.getByText(
      'No hay una voz de inglés sin conexión disponible. Revisa la voz elegida en Configuración de voz o instala una voz sin conexión en los ajustes TTS del sistema. Puedes seguir leyendo, grabarte y escuchar tu práctica.',
      { exact: true },
    ),
  ).toBeVisible();
  expect(await page.evaluate(() => (window as any).__speechInvocations)).toBe(0);
});

test('local review finds a practiced skill and opens untimed practice without a network service', async ({
  page,
  context,
}) => {
  await enterApp(page);
  await readyOfflineShell(page, context);
  await beginFirstLesson(page);
  await page.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Siguiente ejercicio', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar y volver', exact: true }).click();
  await page.getByRole('button', { name: 'Repasar un poquito', exact: true }).click();
  await page.getByRole('tab', { name: 'Todas mis habilidades', exact: true }).click();
  await expect(page.getByText('Reconocer palabras', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Practicar esta habilidad', exact: true }).first().click();
  await expect(page.getByTestId('lesson-stage-goal')).toBeVisible();
  await expect(page.getByText(/corazones|tiempo restante/i)).toHaveCount(0);
  expect((await state(page)).xp).toBe(0);
});

test('optional recording and replay stay local without a fabricated pronunciation score', async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    // A generated tone tests MediaRecorder/replay without requesting a real microphone.
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        const destination = audio.createMediaStreamDestination();
        oscillator.connect(destination);
        oscillator.start();
        await audio.resume();
        return destination.stream;
      },
    });
  });
  await enterApp(page);
  await readyOfflineShell(page, context);
  await page.getByRole('button', { name: 'Practicar pronunciación', exact: true }).click();
  await page
    .getByRole('button', { name: /^Practicar: / })
    .first()
    .click();
  await page.getByRole('button', { name: 'Practicar con mi voz', exact: true }).click();
  await page.getByRole('button', { name: 'Terminar grabación', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Escuchar mi grabación', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Escuchar mi grabación', exact: true }).click();
  await expect(
    page.getByText(/no genera una calificación automática de pronunciación/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Continuar con mi lección', exact: true }).click();
  await expect(page.getByText('Tu inglés tiene algo que decir.', { exact: true })).toBeVisible();
  expect(JSON.stringify(await state(page))).not.toMatch(/blob:|recordingUri|pronunciationScore/);
});

test('development progress reset is explicit and the original local data can be saved first', async ({
  page,
}) => {
  const previous = {
    formatVersion: 1,
    user: { name: 'Prototipo' },
    completedLessons: ['u01_l01'],
    xp: 75,
  };
  await page.addInitScript((original) => {
    localStorage.setItem('lq_setting:onboarded', 'true');
    localStorage.setItem('lq_offline_state_v1', JSON.stringify(original));
  }, previous);
  await page.goto('/');
  await expect(page.getByText('No pudimos abrir tus datos', { exact: true })).toBeVisible();
  expect(await state(page)).toEqual(previous);
  const downloaded = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Guardar copia de los datos anteriores', exact: true })
    .click();
  const file = await downloaded;
  expect(JSON.parse(readFileSync((await file.path())!, 'utf8'))).toEqual(previous);
  await page.getByRole('button', { name: 'Restablecer datos locales', exact: true }).click();
  await expect(page.getByText('¿Restablecer los datos locales?', { exact: true })).toBeVisible();
  expect(await state(page)).toEqual(previous);
  await page
    .getByRole('button', { name: 'Borrar progreso de este dispositivo', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Empiezo desde cero', exact: true })).toBeVisible();
  expect((await state(page)).formatVersion).toBe(2);
  expect((await state(page)).completedLessons).toEqual([]);
  expect((await state(page)).xp).toBe(0);
});
