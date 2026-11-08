/** Compatibility facade for screens. Every request below is a local function call;
 * this module has no HTTP client, account session, telemetry, or remote API. */
import { OfflineEngine, LocalError, type CourseData } from '@lingoquest/offline-engine';
import type { Progress, User } from '@lingoquest/contracts';
import { getRaw, putRaw } from './storage';
import { getActiveCourseData } from './coursePacks';
export type { Progress, User };
export type LessonSummary = {
  id: string;
  title: string;
  estimatedMinutes: number;
  skills: string[];
  seq: number;
};
export type Unit = {
  id: string;
  title: string;
  titleEs: string;
  description: string;
  cefr: string;
  lessons: LessonSummary[];
};
export const newId = () =>
  globalThis.crypto?.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 3) | 8).toString(16);
  });
const engine = new OfflineEngine({
  store: { getItem: getRaw, setItem: putRaw },
  getContent: async () => (await getActiveCourseData()) as CourseData,
  randomId: newId,
});
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code = 'LOCAL_REQUEST_ERROR',
  ) {
    super(message);
  }
}
export async function api<T = any>(path: string, body?: unknown, method?: string): Promise<T> {
  try {
    return await engine.request<T>(path, body, method);
  } catch (error) {
    if (error instanceof LocalError) throw new ApiError(error.message, error.status, error.code);
    throw new ApiError(
      'No pudimos guardar los datos en este dispositivo. Revisa el espacio disponible y vuelve a intentar.',
      500,
      'LOCAL_STORAGE_ERROR',
    );
  }
}
export async function bootstrap() {
  await engine.initialize();
}
export const localSettings = {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      return JSON.parse((await getRaw(`lq_setting:${key}`)) || JSON.stringify(fallback)) as T;
    } catch {
      return fallback;
    }
  },
  async set(key: string, value: unknown) {
    await putRaw(`lq_setting:${key}`, JSON.stringify(value));
  },
};
