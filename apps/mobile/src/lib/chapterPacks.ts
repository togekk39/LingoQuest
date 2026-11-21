import { fetch as nativeFetch } from 'expo/fetch';
import { Platform } from 'react-native';
import { route } from '@lingoquest/offline-engine';
import {
  MAX_CHAPTER_CATALOG_BYTES,
  MAX_CHAPTER_PACK_BYTES,
  chapterCatalogSchema,
  parseChapterPack,
  sha256Hex,
  type ChapterPack,
} from '@lingoquest/course-pack';
import { chapterMediaUri, readChapterPack, writeChapterPack } from './chapterStorage';
import { pickTextFile } from './localFiles';

const web = Platform.OS === 'web';
const baseUrl = web
  ? '/chapter-packs/'
  : 'https://raw.githubusercontent.com/togekk39/LingoQuest/main/apps/mobile/public/chapter-packs/';
const destinations = new Map(route.map((destination) => [destination.id, destination]));
const downloads = new Map<string, Promise<ChapterPack>>();
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

async function saveChapter(id: string, text: string, pack: ChapterPack) {
  let installed = pack;
  const destination = destinations.get(id);
  if (pack.unit?.id !== destination?.unitId)
    throw new Error('El contenido del paquete no corresponde a este capítulo.');
  const committed = await writeChapterPack(id, text, (previous) => {
    const current = parseStored(id, previous);
    if (!current || current.revision < pack.revision) return true;
    if (current.revision === pack.revision && current.sha256 !== pack.sha256)
      throw new Error('Ya tienes un paquete diferente con esta versión.');
    installed = current;
    return false;
  });
  if (committed) lastRead = { text, pack };
  return installed;
}

async function fetchChapterFile(path: string, maxBytes: number, expectedBytes?: number) {
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
    let response: Response;
    try {
      response = web
        ? await fetch(url, { ...options, cache: 'no-store' })
        : await nativeFetch(url, {
            ...options,
            headers: { ...options.headers, 'Cache-Control': 'no-cache' },
          });
    } catch {
      throw new Error('No pudimos descargar el capítulo. Revisa tu conexión e inténtalo de nuevo.');
    }
    if (!response.ok || !response.body)
      throw new Error('La descarga del capítulo no está disponible en este momento.');
    if (Number(response.headers.get('content-length')) > maxBytes)
      throw new Error('El archivo del capítulo supera el tamaño permitido.');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      for (;;) {
        const item = await reader.read();
        if (item.done) break;
        length += item.value.length;
        if (length > maxBytes)
          throw new Error('El archivo del capítulo supera el tamaño permitido.');
        chunks.push(item.value);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    if (expectedBytes !== undefined && length !== expectedBytes)
      throw new Error('La descarga del capítulo está incompleta. Inténtalo de nuevo.');
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return bytes;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error('La descarga tardó demasiado. Inténtalo de nuevo.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function downloadChapter(id: string): Promise<ChapterPack> {
  const pending = downloads.get(id);
  if (pending) return pending;
  const operation = (async () => {
    if (!destinations.has(id)) throw new Error('No encontramos este capítulo.');
    const source = await fetchChapterFile('catalog.json', MAX_CHAPTER_CATALOG_BYTES);
    let value: unknown;
    try {
      value = JSON.parse(new TextDecoder().decode(source));
    } catch {
      throw new Error('No pudimos leer el catálogo de capítulos. Inténtalo de nuevo.');
    }
    const catalog = chapterCatalogSchema.safeParse(value);
    if (!catalog.success) throw new Error('El catálogo de capítulos no es compatible.');
    const entry = catalog.data.chapters[id];
    if (!entry) throw new Error('Este capítulo no está disponible para descargar.');
    const installed = await getInstalledChapter(id);
    if (installed && installed.revision >= entry.revision) return installed;
    const bytes = await fetchChapterFile(
      `${entry.revision}/${id}.json`,
      entry.sizeBytes,
      entry.sizeBytes,
    );
    if (sha256Hex(bytes) !== entry.sha256)
      throw new Error('La descarga del capítulo está dañada. Inténtalo de nuevo.');
    const text = new TextDecoder().decode(bytes);
    const pack = parseChapterPack(text, id);
    if (pack.revision !== entry.revision)
      throw new Error('El archivo del capítulo no coincide con el catálogo publicado.');
    return saveChapter(id, text, pack);
  })().finally(() => downloads.delete(id));
  downloads.set(id, operation);
  return operation;
}

export async function importChapterFile(id: string) {
  if (!destinations.has(id)) throw new Error('No encontramos este capítulo.');
  const text = await pickTextFile('Archivo del capítulo', MAX_CHAPTER_PACK_BYTES);
  return text === null ? null : saveChapter(id, text, parseChapterPack(text, id));
}

export function chapterForUnit(unitId: string) {
  return route.find((destination) => destination.unitId === unitId)?.id;
}

export async function getChapterAudio(id: string, phrase: string) {
  const pack = await getInstalledChapter(id);
  const media = pack && Object.hasOwn(pack.audio, phrase) ? pack.audio[phrase] : undefined;
  return media ? chapterMediaUri(media.mimeType, media.dataBase64) : undefined;
}
