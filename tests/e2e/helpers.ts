import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test as base, type BrowserContext, type Page } from '@playwright/test';

export interface LocalState {
  user: { name: string; goalMinutes: number; reducedMotion: boolean };
  xp: number;
  completedLessons: string[];
  formatVersion: number;
  mastery: { skillId: string; targetId: string; dimension: string; value: number }[];
  attempts: Record<string, unknown>;
  runs: Record<string, any>;
  challengeProgress: unknown[];
}
export interface ExerciseFixture {
  id: string;
  type: string;
  sentence?: string;
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  tokens?: string[];
  acceptedAnswers: string[];
  matchingPairs?: { id: string; left: string; right: string }[];
}
interface NetworkGuard {
  attempted: string[];
  forbidden: string[];
  allow: (url: string) => void;
}
export const test = base.extend<{ networkGuard: NetworkGuard }>({
  networkGuard: [
    async ({ context, baseURL }, use) => {
      const allowed = new Set<string>();
      const guard: NetworkGuard = {
        attempted: [],
        forbidden: [],
        allow: (url) => allowed.add(url),
      };
      const origin = new URL(baseURL ?? 'http://127.0.0.1:3000').origin;
      const forbiddenUrl = (url: string) => {
        const parsed = new URL(url);
        return (
          parsed.pathname.startsWith('/v1/') ||
          parsed.pathname.startsWith('/api/') ||
          (parsed.origin !== origin && !['data:', 'blob:'].includes(parsed.protocol))
        );
      };
      context.on('request', (request) => {
        const url = request.url();
        guard.attempted.push(url);
        if (forbiddenUrl(url) && !allowed.has(url)) guard.forbidden.push(url);
      });
      await context.route('**/*', async (route) => {
        const url = route.request().url();
        if (forbiddenUrl(url) && !allowed.has(url)) await route.abort('blockedbyclient');
        else await route.fallback();
      });
      await use(guard);
      expect(guard.forbidden, 'The offline app must never contact a service API').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export async function enterApp(page: Page) {
  await page.addInitScript(() => localStorage.setItem('lq_setting:onboarded', 'true'));
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }),
  ).toBeVisible();
}
export async function state(page: Page): Promise<LocalState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('lq_offline_state_v1') ?? 'null'));
}
export function learningProgress(s: LocalState) {
  return { xp: s.xp, completedLessons: s.completedLessons, mastery: s.mastery };
}
export const bundledCourse = JSON.parse(
  readFileSync(resolve(process.cwd(), 'apps/mobile/src/content/bundled-course.json'), 'utf8'),
);
export const firstLesson = bundledCourse.payload.lessons.u01_l01;
const teachingButtons =
  /^(Conocer las palabras|Siguiente palabra|Practicar estas palabras|Ver la gramática|Leer la conversación|Vamos a practicar|Empezar a repasar|Continuar con la práctica|Continuar)$/;

/** Walk through the authored teaching stages, including vocabulary before any production. */
export async function advanceToExercise(page: Page, exercise: ExerciseFixture) {
  const target = page.getByTestId(`exercise-${exercise.id}`);
  for (let step = 0; step < 60; step++) {
    if (await target.isVisible()) return;
    const advance = page.getByRole('button', { name: teachingButtons }).first();
    await expect(advance).toBeVisible();
    await advance.click();
  }
  throw new Error(`Teaching stages did not reach ${exercise.id}`);
}
export async function beginFirstLesson(page: Page) {
  await page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }).click();
  await expect(page.getByTestId('lesson-stage-goal')).toBeVisible();
  await advanceToExercise(page, firstLesson.exercises[0]);
}
export async function chooseWrongAnswer(page: Page, exercise: ExerciseFixture) {
  if (exercise.type === 'matching') {
    const pairs = exercise.matchingPairs!;
    for (let index = 0; index < pairs.length; index++) {
      await page
        .getByRole('button', { name: `Relacionar: ${pairs[index].left}`, exact: true })
        .click();
      await page
        .getByRole('button', {
          name: `Significado: ${pairs[(index + 1) % pairs.length].right}`,
          exact: true,
        })
        .click();
    }
  } else if (exercise.options?.length) {
    const wrong = exercise.options.find((option) => option.id !== exercise.correctOptionId)!;
    await page.getByRole('radio', { name: wrong.text, exact: true }).click();
  } else if (exercise.type === 'reorder') {
    await page
      .getByRole('button', { name: `Agregar palabra: ${exercise.tokens!.at(-1)!}`, exact: true })
      .last()
      .click();
  } else {
    await page
      .getByRole('textbox', { name: 'Tu respuesta en inglés' })
      .fill('Una respuesta incorrecta.');
  }
}
const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .trim();
export async function chooseCorrectAnswer(page: Page, exercise: ExerciseFixture) {
  if (exercise.type === 'matching') {
    for (const pair of exercise.matchingPairs!) {
      await page.getByRole('button', { name: `Relacionar: ${pair.left}`, exact: true }).click();
      await page.getByRole('button', { name: `Significado: ${pair.right}`, exact: true }).click();
    }
  } else if (exercise.options?.length) {
    const correct = exercise.options.find((option) => option.id === exercise.correctOptionId)!;
    await page.getByRole('radio', { name: correct.text, exact: true }).click();
  } else if (exercise.type === 'reorder') {
    const target = normalize(exercise.acceptedAnswers[0]).split(/\s+/);
    for (const word of target) {
      const token = exercise.tokens!.find((item) => normalize(item) === word)!;
      const buttons = await page
        .getByRole('button', { name: `Agregar palabra: ${token}`, exact: true })
        .all();
      for (const button of buttons) {
        if (await button.isEnabled()) {
          await button.click();
          break;
        }
      }
    }
  } else {
    await page
      .getByRole('textbox', { name: 'Tu respuesta en inglés' })
      .fill(exercise.acceptedAnswers[0]);
  }
}
export async function nextAfterFeedback(page: Page) {
  await page
    .getByRole('button', { name: /^(Siguiente ejercicio|Continuar)$/, exact: true })
    .click();
}
export async function finishLesson(
  page: Page,
  exercises: ExerciseFixture[],
  options: { correct?: boolean; retryFirst?: boolean } = {},
) {
  for (let index = 0; index < exercises.length; index++) {
    const exercise = exercises[index];
    await advanceToExercise(page, exercise);
    await expect(page.getByText(/corazones|tiempo restante|límite de tiempo/i)).toHaveCount(0);
    if (options.retryFirst && index === 0) {
      await chooseWrongAnswer(page, exercise);
      await page.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click();
      await expect(page.getByText('Buen intento. Veamos por qué…', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Intentar otra vez', exact: true }).click();
    }
    await (options.correct ? chooseCorrectAnswer : chooseWrongAnswer)(page, exercise);
    await page.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click();
    if (!options.correct) {
      await expect(page.getByText('Buen intento. Veamos por qué…', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Intentar otra vez', exact: true }),
      ).toBeVisible();
    }
    await nextAfterFeedback(page);
  }
  await expect(page.getByText('Dale voz a lo que aprendiste.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ahora no puedo hablar', exact: true }).click();
  await expect(page.getByText('¡Lección completada!', { exact: true })).toBeVisible();
}
export async function finishAllWrong(page: Page, exercises: ExerciseFixture[]) {
  await finishLesson(page, exercises);
}
export async function readyOfflineShell(page: Page, context: BrowserContext) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
}
