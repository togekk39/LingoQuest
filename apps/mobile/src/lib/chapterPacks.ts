import { fetch as nativeFetch } from 'expo/fetch';
import { Platform } from 'react-native';
import { route } from '@lingoquest/offline-engine';
import {
  CHAPTER_CATALOG_FILE,
  MAX_CHAPTER_CATALOG_BYTES,
  chapterCatalogSchema,
  parseChapterPack,
  sha256Hex,
  type ChapterCatalog,
  type ChapterPack,
} from '@lingoquest/course-pack';
import {
  chapterMediaUri,
  readChapterPack,
  readCurrentChapter,
  writeChapterPack,
  writeCurrentChapter,
} from './chapterStorage';

const web = Platform.OS === 'web';
const previewRef = process.env.EXPO_PUBLIC_CHAPTER_PACK_REF;
const previewRepository = process.env.EXPO_PUBLIC_CHAPTER_PACK_REPOSITORY;
const pinnedPreview = previewRef && /^[a-f0-9]{40}$/.test(previewRef);
const chapterPackRef = pinnedPreview ? previewRef : 'main';
const chapterPackRepository =
  pinnedPreview &&
  previewRepository &&
  /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9_.-]*$/i.test(previewRepository)
    ? previewRepository
    : 'togekk39/LingoQuest';
const baseUrl = web
  ? '/chapter-packs/'
  : `https://raw.githubusercontent.com/${chapterPackRepository}/${chapterPackRef}/apps/mobile/public/chapter-packs/`;
const destinations = new Map(route.map((destination) => [destination.id, destination]));
export const [firstChapter, secondChapter] = route;
export class ChapterDownloadError extends Error {}

export type ChapterDownloadProgress = { receivedBytes: number; totalBytes: number };
type ProgressListener = (progress: ChapterDownloadProgress) => void;
type Download = {
  operation: Promise<ChapterPack>;
  progress?: ChapterDownloadProgress;
  listeners: Set<ProgressListener>;
};
const downloads = new Map<string, Download>();
let lastRead: { text: string; pack: ChapterPack } | undefined;

function parseStored(id: string, text: string | null) {
  if (text === null) return null;
  if (lastRead?.pack.chapterId === id && lastRead.text === text) return lastRead.pack;
  try {
    const pack = parseChapterPack(text, id);
    lastRead = { text, pack };
    return pack;
  } catch {
    return null;
  }
}

export async function getInstalledChapter(id: string) {
  if (!destinations.has(id)) return null;
  return parseStored(id, await readChapterPack(id));
}

export async function getCurrentChapter() {
  return (await readCurrentChapter()) === secondChapter.id ? secondChapter : firstChapter;
}

export function setCurrentChapter(id: string) {
  return writeCurrentChapter(id);
}

async function saveChapter(id: string, text: string, pack: ChapterPack) {
  let installed = pack;
  const committed = await writeChapterPack(id, text, (previous) => {
    const current = parseStored(id, previous);
    if (!current || current.revision < pack.revision) return true;
    if (current.revision === pack.revision && current.sha256 !== pack.sha256)
      throw new ChapterDownloadError('Ya tienes un paquete diferente con esta versión.');
    installed = current;
    return false;
  });
  if (committed) lastRead = { text, pack };
  return installed;
}

async function fetchChapterFile(
  path: string,
  maxBytes: number,
  expectedBytes?: number,
  onBytesReceived?: (receivedBytes: number) => void,
) {
  const url = baseUrl + path;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const options = {
    credentials: 'omit',
    redirect: 'error',
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  } as const;
  try {
    const response = web
      ? await fetch(url, { ...options, cache: 'no-store' })
      : await nativeFetch(url, {
          ...options,
          headers: { ...options.headers, 'Cache-Control': 'no-cache' },
        });
    if (!response.ok || !response.body)
      throw new ChapterDownloadError(
        'La descarga del capítulo no está disponible en este momento.',
      );
    if (Number(response.headers.get('content-length')) > maxBytes)
      throw new ChapterDownloadError('El archivo del capítulo supera el tamaño permitido.');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      for (;;) {
        const item = await reader.read();
        if (item.done) break;
        length += item.value.length;
        if (length > maxBytes)
          throw new ChapterDownloadError('El archivo del capítulo supera el tamaño permitido.');
        chunks.push(item.value);
        onBytesReceived?.(length);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    if (expectedBytes !== undefined && length !== expectedBytes)
      throw new ChapterDownloadError('La descarga del capítulo está incompleta.');
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return bytes;
  } catch (error) {
    if (controller.signal.aborted)
      throw new ChapterDownloadError('La descarga tardó demasiado. Revisa tu conexión a internet.');
    if (error instanceof ChapterDownloadError) throw error;
    throw new ChapterDownloadError('Revisa tu conexión a internet y vuelve a intentarlo.');
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCatalog() {
  const source = await fetchChapterFile(CHAPTER_CATALOG_FILE, MAX_CHAPTER_CATALOG_BYTES);
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(source));
  } catch {
    throw new ChapterDownloadError('No pudimos leer el catálogo de capítulos.');
  }
  const catalog = chapterCatalogSchema.safeParse(value);
  if (!catalog.success)
    throw new ChapterDownloadError('El catálogo de capítulos no es compatible.');
  return catalog.data;
}

async function fetchChapter(id: string, onProgress: ProgressListener, catalog?: ChapterCatalog) {
  const destination = destinations.get(id);
  if (!destination) throw new ChapterDownloadError('No encontramos este capítulo.');
  const entry = (catalog ?? (await fetchCatalog())).chapters[id];
  if (!entry) throw new ChapterDownloadError('Este capítulo no está disponible para descargar.');
  const installed = await getInstalledChapter(id);
  if (installed && installed.revision >= entry.revision) return installed;
  const totalBytes = entry.sizeBytes;
  onProgress({ receivedBytes: 0, totalBytes });
  const bytes = await fetchChapterFile(
    `${entry.revision}/${id}.json`,
    totalBytes,
    totalBytes,
    (receivedBytes) => onProgress({ receivedBytes, totalBytes }),
  );
  if (sha256Hex(bytes) !== entry.sha256)
    throw new ChapterDownloadError('La descarga del capítulo está dañada.');
  const text = new TextDecoder().decode(bytes);
  let pack: ChapterPack;
  try {
    pack = parseChapterPack(text, id);
  } catch {
    throw new ChapterDownloadError('El archivo recibido no contiene un paquete compatible.');
  }
  if (pack.revision !== entry.revision)
    throw new ChapterDownloadError(
      'El archivo del capítulo no coincide con el catálogo publicado.',
    );
  if (pack.unit?.id !== destination.unitId)
    throw new ChapterDownloadError('El contenido del paquete no corresponde a este capítulo.');
  return saveChapter(id, text, pack);
}

export function downloadChapter(
  id: string,
  onProgress?: ProgressListener,
  catalog?: ChapterCatalog,
): Promise<ChapterPack> {
  let download = downloads.get(id);
  if (!download) {
    const listeners = new Set<ProgressListener>();
    const transfer: Download = {
      listeners,
      operation: fetchChapter(
        id,
        (progress) => {
          transfer.progress = progress;
          for (const listener of listeners) listener(progress);
        },
        catalog,
      ).finally(() => downloads.delete(id)),
    };
    download = transfer;
    downloads.set(id, download);
  }
  if (onProgress) {
    download.listeners.add(onProgress);
    if (download.progress) onProgress(download.progress);
  }
  return download.operation;
}

export async function refreshInstalledChapters() {
  if (web && typeof navigator !== 'undefined' && !navigator.onLine) return;
  const installed = new Map<string, number>();
  for (const { id } of route) {
    const pack = await getInstalledChapter(id);
    if (pack) installed.set(id, pack.revision);
  }
  if (!installed.size) return;

  const catalog = await fetchCatalog();
  for (const [id, revision] of installed) {
    if ((catalog.chapters[id]?.revision ?? 0) <= revision) continue;
    await downloadChapter(id, undefined, catalog).catch(() => {});
  }
}

export function chapterForUnit(unitId: string) {
  return route.find((destination) => destination.unitId === unitId)?.id;
}

export async function getChapterAudio(id: string, phrase: string) {
  const pack = await getInstalledChapter(id);
  const media = pack && Object.hasOwn(pack.audio, phrase) ? pack.audio[phrase] : undefined;
  return media ? chapterMediaUri(id, media.mimeType, media.dataBase64) : undefined;
}
