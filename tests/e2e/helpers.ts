import { mkdirSync } from 'node:fs';
import {
  CHAPTER_CATALOG_FILE,
  type ChapterCatalog,
  type ChapterPack,
} from '@lingoquest/course-pack';
import type {
  OfflineState,
  TravelLearningState,
  TravelMission,
  TravelState,
} from '@lingoquest/offline-engine';
import {
  expect,
  test as base,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { travelStepVocabulary } from '../../packages/offline-engine/src/travel-vocabulary';

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
  travelLearning?: TravelLearningState;
  unifiedLearning: OfflineState['unifiedLearning'];
  lessonCheckpoints?: OfflineState['lessonCheckpoints'];
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

export const initialChapterTimeout = 40_000;

export async function enterApp(page: Page, { chooseOrigin = true } = {}) {
  await page.addInitScript(() => localStorage.setItem('lq_setting:onboarded', 'true'));
  await page.goto('/');
  await expect(page.getByRole('button', exact('Comenzar mi aventura'))).toBeVisible({
    timeout: initialChapterTimeout,
  });
  if (chooseOrigin) {
    await click(page, 'Elegir lugar de origen');
    await click(page, 'Honduras');
    await expect(page.getByRole('textbox', exact('Buscar lugar de origen'))).toBeHidden();
  }
}
export async function state(page: Page): Promise<LocalState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('lq_offline_state_v1') ?? 'null'));
}
export function learningProgress(s: LocalState) {
  return { xp: s.xp, completedLessons: s.completedLessons, mastery: s.mastery };
}
export const exact = (name: string) => ({ name, exact: true });
export const click = (page: Page, name: string) => page.getByRole('button', exact(name)).click();

export async function openLessons(page: Page) {
  await page.getByRole('tab', exact('Aprender')).click();
  await click(page, 'Lecciones');
  const skipName = page.getByRole('button', exact('Continuar sin nombre'));
  const closeLesson = page.getByRole('button', exact('Cerrar y volver'));
  await expect(skipName.or(closeLesson)).toBeVisible();
  if (await skipName.isVisible()) await skipName.click();
  await expect(closeLesson).toBeVisible();
}

export async function finishVocabulary(page: Page) {
  await click(page, 'Siguiente palabra');
  await click(page, 'Siguiente palabra');
  await click(page, 'Ver la explicación');
  await click(page, 'Probar en la historia');
}

export async function checkTravelAnswer(page: Page) {
  await click(page, 'Comprobar respuesta');
  await click(page, 'Seguir la historia');
}

export async function answerTravelChoice(page: Page, id: string, option: string) {
  await page.getByTestId(`exercise-${id}`).getByRole('radio', exact(option)).click();
  await checkTravelAnswer(page);
}

export async function answerTravelReorder(page: Page, id: string, words: string[]) {
  const exercise = page.getByTestId(`exercise-${id}`);
  for (const word of words)
    await exercise.getByRole('button', exact(`Agregar palabra: ${word}`)).click();
  await checkTravelAnswer(page);
}

export async function answerTravelText(page: Page, id: string, answer: string) {
  await page
    .getByTestId(`exercise-${id}`)
    .getByRole('textbox', exact('Tu respuesta en inglés'))
    .fill(answer);
  await checkTravelAnswer(page);
}

export async function finishGreetingPractice(page: Page, name = '[tu nombre]') {
  await answerTravelChoice(page, 'travel_hello_recognize', 'Hola');
  await answerTravelReorder(page, 'travel_hello_build', ['I', 'am', name]);
  await answerTravelText(page, 'travel_hello_recall', 'Hi');
}

export async function openTravelWriting(page: Page) {
  await openLessons(page);
  await click(page, 'Continuar');
  await click(page, 'Continuar');
  await finishVocabulary(page);
  await finishGreetingPractice(page);
  await expect(page.getByTestId('exercise-travel_hello_write')).toBeVisible();
}

export async function openPlacement(page: Page) {
  await page.getByRole('tab', exact('Aprender')).click();
  await click(page, 'Encontrar mi punto de partida');
  await click(page, 'Empezar la prueba');
}

export async function homeMission(request: APIRequestContext, missionId: string) {
  const catalog: ChapterCatalog = await (
    await request.get(`/chapter-packs/${CHAPTER_CATALOG_FILE}`)
  ).json();
  const home: ChapterPack = await (
    await request.get(`/chapter-packs/${catalog.chapters.home.revision}/home.json`)
  ).json();
  const mission = home.story?.chapter.missions.find(({ id }) => id === missionId);
  if (!mission) throw new Error(`Missing Home lesson ${missionId}`);
  return mission as unknown as TravelMission;
}

export async function openHomeFoundationStudy(page: Page, missionId: string) {
  await page.getByRole('tab', exact('Aprender')).click();
  const group = page.getByTestId('home-foundation-toggle');
  const mission = page.getByTestId(`home-study-${missionId}`);
  await expect(group).toBeVisible();
  if (!(await mission.isVisible())) await group.click();
  await mission.click();
}

export async function readTravelInstruction(page: Page, mission: TravelMission, from = 0) {
  for (const step of mission.steps.slice(from)) {
    if (step.type !== 'dialogue' && step.type !== 'teach') return;
    await expect(page.locator(`[id="travel-step-id-${step.id}"]`)).toBeVisible();
    if (step.type === 'dialogue') {
      await click(page, 'Continuar');
      continue;
    }
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
  }
}

export async function readyOfflineShell(page: Page, context: BrowserContext) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
}

declare global {
  interface Window {
    chapterAudioLabel: (uri: string) => Promise<string | undefined>;
  }
}

export async function labelFirstChapterAudio(
  page: Page,
  request: APIRequestContext,
  phrases: Record<string, string>,
) {
  const catalog: ChapterCatalog = await (
    await request.get('/chapter-packs/catalog-v6.json')
  ).json();
  const path = `/chapter-packs/${catalog.chapters.home.revision}/home.json`;
  const { audio }: ChapterPack = await (await request.get(path)).json();
  const sources = Object.fromEntries(
    Object.entries(phrases).map(([label, phrase]) => {
      const clip = audio[phrase];
      return [`data:${clip.mimeType};base64,${clip.dataBase64}`, label];
    }),
  );
  await page.addInitScript((sources) => {
    const labels = new Map<string, Promise<string | undefined>>();
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (media) => {
      const uri = createObjectURL(media);
      if (media instanceof Blob && media.type === 'audio/mpeg') {
        labels.set(
          uri,
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(sources[String(reader.result)]);
            reader.onerror = () => resolve(undefined);
            reader.readAsDataURL(media);
          }),
        );
      }
      return uri;
    };
    window.chapterAudioLabel = async (uri) => labels.get(uri) ?? sources[uri];
  }, sources);
}

export async function capture(page: Page, name: string) {
  const dir = process.env.SCREENSHOTS_DIR;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.screenshot({
    path: `${dir}/${name}.jpg`,
    type: 'jpeg',
    quality: 89,
    animations: 'disabled',
  });
}
