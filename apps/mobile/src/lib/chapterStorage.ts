import { sha256Hex } from '@lingoquest/course-pack';
import { Directory, File, Paths } from 'expo-file-system';
import { compareAndPutRaw, getRaw } from './storage';

const keyPrefix = 'lq_chapter_pack:';

export function readChapterPack(chapterId: string) {
  return getRaw(keyPrefix + chapterId);
}

export async function writeChapterPack(
  chapterId: string,
  text: string,
  shouldReplace: (previous: string | null) => boolean,
): Promise<boolean> {
  const key = keyPrefix + chapterId;
  for (;;) {
    const previous = await getRaw(key);
    if (!shouldReplace(previous)) return false;
    if (await compareAndPutRaw(key, previous, text)) return true;
  }
}

const extensions = new Map([
  ['audio/mpeg', 'mp3'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export async function chapterMediaUri(mimeType: string, dataBase64: string) {
  const extension = extensions.get(mimeType);
  if (!extension) throw new Error('Este formato de archivo no es compatible.');

  const directory = new Directory(Paths.cache, 'chapter-media');
  directory.create({ idempotent: true, intermediates: true });
  const name = `${sha256Hex(dataBase64)}.${extension}`;
  const file = new File(directory, name);
  const padding = dataBase64.endsWith('==') ? 2 : Number(dataBase64.endsWith('='));
  const size = (dataBase64.length / 4) * 3 - padding;
  if (file.exists) {
    if (file.size === size) return file.uri;
    file.delete();
  }

  const temporary = new File(directory, `${name}.pending`);
  try {
    temporary.write(dataBase64, { encoding: 'base64' });
    temporary.rename(name);
  } catch (error) {
    try {
      if (temporary.exists) temporary.delete();
    } catch {
      // The next playback attempt can replace the temporary file.
      // El siguiente intento de reproducción puede reemplazar el archivo temporal.
    }
    throw error;
  }
  return file.uri;
}
