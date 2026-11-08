import {
  APP_VERSION,
  MAX_PACK_BYTES,
  compareVersions,
  parseCoursePack,
  serializeCoursePack,
  utf8Bytes,
  sha256Hex,
  type CoursePack,
  type CoursePayload,
} from '@lingoquest/course-pack';
import bundled from '../content/bundled-course.json';
import courseSource from '../content/course-source.json';
import { getRaw, putRaw, removeRaw } from './storage';
const PACK_KEY = 'lq_installed_course_pack_v1';
let active: CoursePack | null = null;
let initialization: Promise<CoursePack> | null = null;
let recoveryMessage = '';
let installTail: Promise<unknown> = Promise.resolve();
async function initialize() {
  if (active) return active;
  if (initialization) return initialization;
  initialization = (async () => {
    const included = parseCoursePack(JSON.stringify(bundled), APP_VERSION);
    try {
      const saved = await getRaw(PACK_KEY);
      active = saved ? parseCoursePack(saved, APP_VERSION) : included;
    } catch {
      active = included;
      recoveryMessage =
        'No pudimos abrir el curso guardado. Estás usando el contenido incluido en la app.';
    }
    return active;
  })();
  return initialization;
}
export async function getActiveCourseData(): Promise<CoursePayload> {
  return (await initialize()).payload;
}
export async function getCoursePackInfo() {
  const pack = await initialize();
  return {
    manifest: pack.manifest,
    units: pack.payload.units.length,
    lessons: Object.keys(pack.payload.lessons).length,
    exercises: Object.values(pack.payload.lessons).reduce((n, l) => n + l.exercises.length, 0),
    bytes: utf8Bytes(serializeCoursePack(pack)).length,
    bundled: pack.manifest.sha256 === bundled.manifest.sha256,
    recoveryMessage,
  };
}
export function installCoursePackText(text: string) {
  const operation = installTail.then(async () => {
    const next = parseCoursePack(text, APP_VERSION);
    const previous = await initialize();
    if (next.manifest.packageId !== previous.manifest.packageId)
      throw new Error(
        'Este paquete pertenece a otro curso. Selecciona una actualización de tu curso actual.',
      );
    const order = compareVersions(next.manifest.version, previous.manifest.version);
    if (order < 0) throw new Error('Ya tienes una versión más reciente de este curso.');
    if (order === 0) {
      if (next.manifest.sha256 === previous.manifest.sha256)
        return { installed: false, manifest: previous.manifest };
      throw new Error(
        'Esta versión tiene contenido diferente. Usa un paquete con una versión más reciente.',
      );
    }
    for (const id of Object.keys(previous.payload.lessons)) {
      if (!next.payload.lessons[id])
        throw new Error(
          'La actualización no conserva todas tus lecciones. No se cambió el curso instalado.',
        );
    }
    await putRaw(PACK_KEY, serializeCoursePack(next));
    active = next;
    recoveryMessage = '';
    return { installed: true, manifest: next.manifest };
  });
  installTail = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}
export async function restoreBundledCourse() {
  const operation = installTail.then(async () => {
    const included = parseCoursePack(JSON.stringify(bundled));
    await removeRaw([PACK_KEY]);
    active = included;
    initialization = Promise.resolve(included);
    recoveryMessage = '';
  });
  installTail = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}
export function validateCourseDownloadUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Pega el enlace HTTPS del archivo de curso en GitHub.');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.hash ||
    (url.port && url.port !== '443') ||
    !['github.com', 'raw.githubusercontent.com'].includes(url.hostname)
  )
    throw new Error('Usa un enlace HTTPS de github.com o raw.githubusercontent.com.');
  if (url.hostname === 'github.com' && !url.pathname.includes('/releases/download/'))
    throw new Error('Usa el enlace del archivo en GitHub Releases, no la página del repositorio.');
  return url.toString();
}
async function boundedText(response: Response) {
  const length = Number(response.headers.get('content-length') ?? 0);
  if (length > MAX_PACK_BYTES) throw new Error('El paquete supera el tamaño permitido de 4 MB.');
  if (response.body && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const value = await reader.read();
        if (value.done) break;
        size += value.value.byteLength;
        if (size > MAX_PACK_BYTES)
          throw new Error('El paquete supera el tamaño permitido de 4 MB.');
        chunks.push(value.value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      return new TextDecoder().decode(bytes);
    } finally {
      await reader.cancel().catch(() => {});
    }
  }
  if (!length)
    throw new Error('Este enlace no permite comprobar el tamaño. Descarga el archivo e impórtalo.');
  const text = await response.text();
  if (utf8Bytes(text).length > MAX_PACK_BYTES)
    throw new Error('El paquete supera el tamaño permitido de 4 MB.');
  return text;
}
/** The only application network request: an explicit user-started GitHub course download. */
export async function downloadAndInstallCourse(urlInput: string) {
  const url = validateCourseDownloadUrl(urlInput);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok)
      throw new Error(
        'No pudimos descargar el curso. Revisa que el archivo esté publicado y el enlace sea correcto.',
      );
    if (response.url) {
      const destination = new URL(response.url);
      if (
        destination.protocol !== 'https:' ||
        ![
          'github.com',
          'raw.githubusercontent.com',
          'release-assets.githubusercontent.com',
          'objects.githubusercontent.com',
        ].includes(destination.hostname)
      )
        throw new Error('La descarga redirigió a un sitio no compatible.');
    }
    const text = await boundedText(response);
    if (
      url === courseSource.url &&
      (sha256Hex(text) !== courseSource.sha256 || utf8Bytes(text).length !== courseSource.sizeBytes)
    )
      throw new Error(
        'El archivo descargado no coincide con la versión publicada. Tu curso actual sigue disponible.',
      );
    return await installCoursePackText(text);
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error('La descarga tardó demasiado. Tu curso actual sigue disponible.');
    if (error instanceof TypeError)
      throw new Error(
        'No pudimos descargar el archivo. Puedes guardarlo desde GitHub e importarlo sin conexión.',
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
