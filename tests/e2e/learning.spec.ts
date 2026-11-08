import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  test,
  expect,
  enterApp,
  state,
  beginFirstLesson,
  finishAllWrong,
  readyOfflineShell,
  type ExerciseFixture,
} from './helpers';

const pack = JSON.parse(
  readFileSync(resolve(process.cwd(), 'apps/mobile/src/content/bundled-course.json'), 'utf8'),
);
const exercises = pack.payload.lessons.u01_l01.exercises as ExerciseFixture[];

test('fresh installation completes a lesson fully offline with immediate local feedback and persistent XP', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await enterApp(page);
  expect((await state(page)).xp).toBe(0);
  await readyOfflineShell(page, context);
  await beginFirstLesson(page);
  await finishAllWrong(page, exercises);
  const completed = await state(page);
  expect(completed.completedLessons).toEqual(['u01_l01']);
  expect(completed.xp).toBe(25);
  expect(completed.mastery.every((skill) => skill.value < 1)).toBeTruthy();
  await page.getByRole('button', { name: 'Volver a mi camino', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }),
  ).toBeVisible();
  expect((await state(page)).xp).toBe(25);
  await page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }).click();
  await expect(page.getByText('Pronombres personales', { exact: true }).first()).toBeVisible();
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
  expect((await state(page)).mastery).toHaveLength(1);
  expect((await state(page)).xp).toBe(0);
  await page.getByRole('button', { name: 'Cerrar y volver', exact: true }).click();
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  await expect(page.getByText('Real-life missions', { exact: true })).toBeVisible();
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
  for (let index = 0; index < 12; index++) {
    await expect(page.getByText(`Pregunta ${index + 1} de 12`, { exact: true })).toBeVisible();
    await page.getByRole('radio').first().click();
    await page
      .getByRole('button', {
        name: index === 11 ? 'Ver mi orientación' : 'Siguiente pregunta',
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
      'Audio de referencia no incluido en este paquete. Puedes seguir leyendo, grabarte y escuchar tu práctica.',
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
  await expect(page.getByText('Verbo be', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Practicar esta habilidad', exact: true }).first().click();
  await expect(page.getByText('Una idea que abre puertas', { exact: true })).toBeVisible();
  await expect(page.getByText(/corazones|tiempo restante/i)).toHaveCount(0);
  expect((await state(page)).xp).toBe(0);
});
