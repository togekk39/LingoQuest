import { expect, test as base, type BrowserContext, type Page } from '@playwright/test';

export interface LocalState {
  user: { name: string; goalMinutes: number; reducedMotion: boolean };
  xp: number;
  completedLessons: string[];
  mastery: { skillId: string; value: number }[];
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
export async function beginFirstLesson(page: Page) {
  await page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }).click();
  await expect(page.getByText('Una idea que abre puertas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Vamos a practicar', exact: true }).click();
}
export async function chooseWrongAnswer(page: Page, exercise: ExerciseFixture) {
  if (exercise.options?.length) {
    const wrong = exercise.options.find((option) => option.id !== exercise.correctOptionId)!;
    await page.getByRole('radio').filter({ hasText: wrong.text }).click();
  } else if (exercise.type === 'reorder') {
    await page.getByText(exercise.tokens!.at(-1)!, { exact: true }).last().click();
  } else {
    await page.getByRole('textbox', { name: 'Tu respuesta en inglés' }).fill('Deliberately wrong.');
  }
}
export async function finishAllWrong(page: Page, exercises: ExerciseFixture[]) {
  for (let index = 0; index < exercises.length; index++) {
    await expect(
      page.getByText(`Práctica ${index + 1} de ${exercises.length}`, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/corazones|tiempo restante|límite de tiempo/i)).toHaveCount(0);
    await chooseWrongAnswer(page, exercises[index]!);
    await page.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click();
    await expect(page.getByText('Buen intento. Veamos por qué…', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Intentar otra vez', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', {
        name: index + 1 === exercises.length ? 'Continuar' : 'Siguiente ejercicio',
        exact: true,
      })
      .click();
  }
  await expect(page.getByText('Dale voz a lo que aprendiste.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ahora no puedo hablar', exact: true }).click();
  await expect(page.getByText('¡Lección completada!', { exact: true })).toBeVisible();
}
export async function readyOfflineShell(page: Page, context: BrowserContext) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
}
