import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { route } from '@lingoquest/offline-engine';
import { chapter, travelPracticeSteps } from '../packages/offline-engine/src/travel-content';
import { travelStepVocabulary } from '../packages/offline-engine/src/travel-vocabulary';
import {
  rpgAssessmentDigest,
  rpgTeachingDigest,
} from '../packages/offline-engine/src/learning-prerequisites';
import { westernChapterLessons } from '../content/source/chapter-lessons-west';
import { easternChapterLessons } from '../content/source/chapter-lessons-east';
import { chapterAdventures } from './chapter-adventures';
import bundled from '../apps/mobile/src/content/bundled-course.json';
import {
  CHAPTER_PACK_FORMAT,
  CHAPTER_PACK_SCHEMA_VERSION,
  CHAPTER_CATALOG_FILE,
  chapterCatalogSchema,
  chapterLessonPhrases,
  parseChapterPack,
  serializeChapterPack,
  type ChapterCatalog,
  type ChapterLessonSource,
  type ChapterMedia,
  type CoursePayload,
} from '@lingoquest/course-pack';
import { loadChapterAudio, loadChapterImages } from './chapter-media';

const root = new URL('../apps/mobile/public/chapter-packs/', import.meta.url);
const catalogPath = new URL(CHAPTER_CATALOG_FILE, root);
const previousCatalogPath = new URL('catalog-v3.json', root);
const course = bundled.payload as CoursePayload;
const source: Record<string, ChapterLessonSource> = {
  ...westernChapterLessons,
  ...easternChapterLessons,
};
const { units: courseUnits, lessons: courseLessons } = course;
const digest = (bytes: string) => createHash('sha256').update(bytes).digest('hex');
const chapterPath = (revision: number, chapterId: string) =>
  new URL(`${revision}/${chapterId}.json`, root);

function checkReviewLedger({ story }: NonNullable<ReturnType<typeof chapterAdventures.get>>) {
  if (!('audit' in story)) return;
  const teaching = Object.fromEntries(
    story.chapter.missions.flatMap((mission) =>
      mission.steps.flatMap((step) =>
        step.type === 'teach' && step.instruction
          ? [[step.id, rpgTeachingDigest(step, travelStepVocabulary(mission, step))]]
          : [],
      ),
    ),
  );
  const assessments = Object.fromEntries(
    [
      ...story.chapter.missions.flatMap(({ steps }) =>
        steps.filter((step) => step.type === 'exercise'),
      ),
      ...story.practice,
    ].map((step) => [step.id, rpgAssessmentDigest(step)]),
  );
  assert.deepEqual(
    teaching,
    story.audit.teaching,
    `Teaching review is stale for ${story.chapter.id}.`,
  );
  assert.deepEqual(
    assessments,
    story.audit.assessments,
    `Assessment review is stale for ${story.chapter.id}.`,
  );
}

function verifyMedia(media: ChapterMedia, name: string) {
  const bytes = Buffer.from(media.dataBase64, 'base64');
  const isValid = {
    'image/jpeg': () => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    'image/png': () => bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')),
    'image/webp': () =>
      bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP',
    'audio/mpeg': () =>
      bytes.toString('ascii', 0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0),
  }[media.mimeType];
  if (bytes.length < 16 || !isValid())
    throw new Error(`Invalid ${media.mimeType} resource: ${name}`);
}

async function readCatalog(): Promise<ChapterCatalog> {
  try {
    return chapterCatalogSchema.parse(JSON.parse(await readFile(catalogPath, 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return chapterCatalogSchema.parse(JSON.parse(await readFile(previousCatalogPath, 'utf8')));
  }
}

async function verifyCatalog(catalog: ChapterCatalog, checkAuthoredStory = true) {
  if (Object.keys(catalog.chapters).length !== route.length)
    throw new Error('The catalog must cover all route destinations.');
  const practice = [
    ...chapter.missions.flatMap(({ steps }) => steps.filter((step) => step.type === 'exercise')),
    ...travelPracticeSteps,
  ];
  for (const { id, audio, transcript } of practice) {
    if (transcript && transcript !== audio)
      throw new Error(`The transcript differs from the English audio source: ${id}.`);
  }
  for (const { id, unitId } of route) {
    const entry = catalog.chapters[id];
    if (!entry) throw new Error(`Missing catalog entry for ${id}.`);
    const text = await readFile(chapterPath(entry.revision, id), 'utf8');
    if (Buffer.byteLength(text) !== entry.sizeBytes || digest(text) !== entry.sha256)
      throw new Error(`Incorrect artifact bytes for ${id}.`);
    const pack = parseChapterPack(text, id);
    if (pack.revision !== entry.revision || pack.unit?.id !== unitId)
      throw new Error(`Incorrect revision or course unit for ${id}.`);
    const authored = checkAuthoredStory ? chapterAdventures.get(id) : undefined;
    if (
      authored &&
      (!pack.story || authored.phrases.some((phrase) => !Object.hasOwn(pack.audio, phrase)))
    )
      throw new Error(`Missing story data or audio for ${id}.`);
    for (const [key, media] of Object.entries(pack.images)) verifyMedia(media, `${id}/${key}`);
    for (const [text, media] of Object.entries(pack.audio)) verifyMedia(media, `${id}/${text}`);
  }
  console.log(`Verified ${route.length} chapter packs.`);
}

async function main() {
  const catalog = await readCatalog();
  const previousCatalog = chapterCatalogSchema.parse(
    JSON.parse(await readFile(previousCatalogPath, 'utf8')),
  );
  if (process.argv.includes('--verify')) {
    await verifyCatalog(catalog);
    await verifyCatalog(previousCatalog, false);
    await verifyCatalog(
      chapterCatalogSchema.parse(
        JSON.parse(await readFile(new URL('catalog-v2.json', root), 'utf8')),
      ),
      false,
    );
    return;
  }
  const requested = process.argv.find((arg) => arg.startsWith('--chapter='))?.slice(10);
  const targets = requested ? route.filter(({ id }) => id === requested) : route;
  const revision = Number(process.env.CHAPTER_PACK_REVISION ?? '1');
  if (!targets.length || !Number.isInteger(revision) || revision < 1 || revision > 999999)
    throw new Error('Provide a route chapter ID and an integer revision between 1 and 999999.');

  await mkdir(new URL(`${revision}/`, root), { recursive: true });
  for (const { id, unitId } of targets) {
    const current = catalog.chapters[id];
    if (current && revision < current.revision)
      throw new Error(`Revision ${revision} is older than the published revision for ${id}.`);
    const chapterSource = source[id];
    if (!chapterSource) throw new Error(`Missing authored lessons for ${id}.`);
    const [lesson, ...additionalLessons] = Array.isArray(chapterSource)
      ? chapterSource
      : [chapterSource];
    const unitSource = unitId ? courseUnits.find(({ id }) => id === unitId) : undefined;
    if (unitId && !unitSource) throw new Error(`Missing course unit ${unitId}.`);
    const unit = unitSource && {
      id: unitSource.id,
      titleEs: unitSource.titleEs,
      lessons: unitSource.lessons.map(({ id }) => courseLessons[id]),
    };
    const authored = chapterAdventures.get(id);
    if (authored) checkReviewLedger(authored);
    const phrases = [
      ...new Set([
        ...chapterLessonPhrases([lesson, ...additionalLessons], unit?.lessons),
        ...(authored?.phrases ?? []),
      ]),
    ];
    const previous = parseChapterPack(
      await readFile(
        chapterPath(current?.revision ?? previousCatalog.chapters[id].revision, id),
        'utf8',
      ),
      id,
    );
    const newPhrases = phrases.filter((phrase) => !Object.hasOwn(previous.audio, phrase));
    const generated = await loadChapterAudio(newPhrases);
    const audio = Object.fromEntries(
      phrases.map((phrase) => [phrase, previous.audio[phrase] ?? generated[phrase]]),
    );
    if (id === 'home')
      for (const [phrase, clip] of Object.entries(previous.audio)) audio[phrase] ??= clip;
    const text = serializeChapterPack({
      format: CHAPTER_PACK_FORMAT,
      schemaVersion: CHAPTER_PACK_SCHEMA_VERSION,
      revision,
      chapterId: id,
      lesson,
      additionalLessons,
      ...(unit && { unit }),
      ...(authored && { story: authored.story }),
      images: await loadChapterImages(id),
      audio,
    });
    parseChapterPack(text, id);
    const sha256 = digest(text);
    const target = chapterPath(revision, id);
    try {
      await writeFile(target, text, { flag: 'wx' });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if ((await readFile(target, 'utf8')) !== text)
        throw new Error(`Revision ${revision} of ${id} already exists. Choose a newer revision.`);
    }
    catalog.chapters[id] = { revision, sizeBytes: Buffer.byteLength(text), sha256 };
    console.log(`Built ${id} revision ${revision} (${catalog.chapters[id].sizeBytes} bytes).`);
  }

  await verifyCatalog(catalog);
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
