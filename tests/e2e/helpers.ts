import type { TravelState } from '@lingoquest/offline-engine';
import { expect, test as base, type BrowserContext, type Page } from '@playwright/test';

export interface LocalState {
  user: { name: string; goalMinutes: number; reducedMotion: boolean };
  xp: number;
  completedLessons: string[];
  formatVersion: number;
  mastery: {
    skillId: string;
    targetId: string;
    dimension: string;
    value: number;
    evidenceCount: number;
  }[];
  attempts: Record<string, unknown>;
  runs: Record<string, any>;
  challengeProgress: unknown[];
  travel: TravelState;
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
  await expect(page.getByRole('button', { name: 'Continuar viaje', exact: true })).toBeVisible();
}
export async function state(page: Page): Promise<LocalState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('lq_offline_state_v1') ?? 'null'));
}
export function learningProgress(s: LocalState) {
  return { xp: s.xp, completedLessons: s.completedLessons, mastery: s.mastery };
}
export const exact = (name: string) => ({ name, exact: true });
export const click = (page: Page, name: string) => page.getByRole('button', exact(name)).click();

export async function finishVocabulary(page: Page) {
  await click(page, 'Siguiente palabra');
  await click(page, 'Siguiente palabra');
  await click(page, 'Ver la explicación');
  await click(page, 'Probar en la historia');
}

export async function openTravelWriting(page: Page) {
  await click(page, 'Continuar viaje');
  await click(page, 'Continuar');
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await expect(page.getByRole('textbox', exact('Tu respuesta en inglés'))).toBeVisible();
}

export async function openPlacement(page: Page) {
  await page.getByRole('tab', exact('Aprender')).click();
  await click(page, 'Encontrar mi punto de partida');
  await click(page, 'Empezar la prueba');
}

export async function readyOfflineShell(page: Page, context: BrowserContext) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
}
