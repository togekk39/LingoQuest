import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { ChapterMedia } from '@lingoquest/course-pack';

const run = promisify(execFile);
const mobileAssets = new URL('../apps/mobile/assets/', import.meta.url);
const chapterArt = new URL('../content/media/chapters/', import.meta.url);
const homeImages = {
  cover: 'travel/hometown.jpg',
  world: 'travel/world.png',
  atlas: 'journal/atlas.jpg',
  passport: 'journal/passport.jpg',
  expedition: 'journal/expedition.jpg',
  sam: 'journal/sam.jpg',
  plaza: 'journal/plaza.jpg',
  bus: 'journal/bus-stop.jpg',
  bag: 'journal/lost-bag.jpg',
  welcome: 'journal/welcome-desk.jpg',
  review: 'journal/review.jpg',
  writing: 'journal/writing.jpg',
  luz: 'journal/luz.jpg',
  'story-plaza': 'journal/story-plaza.jpg',
  'story-lost-property': 'journal/story-lost-property.jpg',
  'story-lost-property-after-pickup': 'journal/story-lost-property-after-pickup.jpg',
  'story-sam': 'journal/story-sam.png',
  'story-luz': 'journal/story-luz.png',
  'story-sam-portrait': 'journal/story-sam-portrait.png',
  'story-luz-portrait': 'journal/story-luz-portrait.png',
};

const recordedPhrases = new Map([
  ['Hi! My name is Sam.', 'line-1'],
  ["Hi! My name is Sam. What's your name?", 'sam-greeting'],
  ['This is Luz.', 'sam-introduces-luz'],
  ["Hello! I'm Luz. Welcome!", 'luz-welcome'],
  ['Nice to meet you, too!', 'luz-greeting-reply'],
  ["What's your name?", 'sam-asks-name'],
  ["It's nice to meet you.", 'sam-greeting-reply'],
  ['Can you help me find the bus stop?', 'sam-asks-for-directions'],
  ['Hi! I am Luz.', 'line-2'],
  ['My name is Luz.', 'line-3'],
  ['Where is the bus stop?', 'line-4'],
  ['bus stop', 'line-5'],
  ['park', 'line-6'],
  ["It's next to the park.", 'line-7'],
  ['My bag!', 'line-8'],
  ['My bag is blue.', 'line-9'],
  ['a blue bag', 'line-10'],
  ["It's red.", 'line-11'],
  ['Hi! I am', 'introduction-starter'],
  ['Nice to meet you! Can you help me find the bus stop?', 'sam-after-introduction'],
  ['Hi', 'word-1'],
  ['I am', 'word-2'],
  ['My name is', 'word-3'],
  ['next to', 'word-4'],
  ['bag', 'word-5'],
  ['blue', 'word-6'],
  ['red', 'word-7'],
]);

async function readMedia(url: URL, mimeType: ChapterMedia['mimeType']): Promise<ChapterMedia> {
  return { mimeType, dataBase64: await readFile(url, 'base64') };
}

export async function loadChapterImages(chapterId: string): Promise<Record<string, ChapterMedia>> {
  if (chapterId !== 'home') {
    if (!/^[a-z]+(?:-[a-z]+)*$/.test(chapterId)) {
      throw new Error(`Invalid chapter ID: ${chapterId}`);
    }
    const cover = await readMedia(new URL(`${chapterId}.jpg`, chapterArt), 'image/jpeg');
    if (chapterId !== 'mexico') return { cover };
    return {
      cover,
      'mexico-reading-room': await readMedia(
        new URL('mexico-reading-room.jpg', chapterArt),
        'image/jpeg',
      ),
      'portrait-ines': await readMedia(new URL('mexico-ines.jpg', chapterArt), 'image/jpeg'),
      'portrait-sam': await readMedia(
        new URL('journal/story-sam-portrait.png', mobileAssets),
        'image/png',
      ),
    };
  }

  return Object.fromEntries(
    await Promise.all(
      Object.entries(homeImages).map(async ([id, file]) => [
        id,
        await readMedia(
          new URL(file, mobileAssets),
          file.endsWith('.png') ? 'image/png' : 'image/jpeg',
        ),
      ]),
    ),
  );
}

function speechText(phrase: string) {
  return phrase
    .normalize('NFKD')
    .replace(/\p{Mark}/gu, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, ', ')
    .replace(/\s*→\s*/g, ', ')
    .trim();
}

async function makeClip(phrase: string): Promise<ChapterMedia> {
  const recorded = recordedPhrases.get(phrase);
  if (recorded) return readMedia(new URL(`travel/${recorded}.mp3`, mobileAssets), 'audio/mpeg');

  const dir = await mkdtemp(join(tmpdir(), 'lingoquest-chapter-audio-'));
  try {
    await writeFile(join(dir, 'phrase.txt'), phrase);
    const { stdout } = await run(
      'ffmpeg',
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-nostdin',
        '-f',
        'lavfi',
        '-i',
        'flite=textfile=phrase.txt:voice=slt',
        '-af',
        'apad=pad_dur=0.18',
        '-c:a',
        'libmp3lame',
        '-b:a',
        '32k',
        '-map_metadata',
        '-1',
        '-id3v2_version',
        '0',
        '-write_xing',
        '0',
        '-f',
        'mp3',
        'pipe:1',
      ],
      { cwd: dir, encoding: 'buffer', maxBuffer: 1024 * 1024 },
    );
    if (stdout.length === 0) throw new Error('FFmpeg produced an empty clip.');
    return { mimeType: 'audio/mpeg', dataBase64: stdout.toString('base64') };
  } catch (cause) {
    throw new Error(`Could not create local Flite audio for ${JSON.stringify(phrase)}.`, { cause });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const clips = new Map<string, Promise<ChapterMedia>>();

function loadClip(phrase: string) {
  const text = speechText(phrase);
  if (!text) throw new Error('Chapter audio requires a spoken phrase.');
  let clip = clips.get(text);
  if (!clip) {
    clip = makeClip(text).catch((error) => {
      clips.delete(text);
      throw error;
    });
    clips.set(text, clip);
  }
  return clip;
}

export async function loadChapterAudio(
  phrases: readonly string[],
): Promise<Record<string, ChapterMedia>> {
  const unique = [...new Set(phrases)];
  const entries: [string, ChapterMedia][] = [];
  for (let i = 0; i < unique.length; i += 6) {
    entries.push(
      ...(await Promise.all(
        unique
          .slice(i, i + 6)
          .map(async (phrase): Promise<[string, ChapterMedia]> => [phrase, await loadClip(phrase)]),
      )),
    );
  }
  return Object.fromEntries(entries);
}
