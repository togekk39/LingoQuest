import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { route, publicExercise } from '@lingoquest/offline-engine';
import {
  chapter,
  travelLesson,
  travelPracticeSteps,
} from '../packages/offline-engine/src/travel-content';
import { chapterStory } from '../packages/offline-engine/src/chapter-story';
import { travelChallengePools } from '../packages/offline-engine/src/travel-challenge-pools';
import { travelPlacementItems } from '../packages/offline-engine/src/travel-placement-items';
import { placementQuestions } from '../packages/offline-engine/src/travel-placement';
import { westernChapterLessons } from '../content/source/chapter-lessons-west';
import { easternChapterLessons } from '../content/source/chapter-lessons-east';
import bundled from '../apps/mobile/src/content/bundled-course.json';
import {
  CHAPTER_PACK_FORMAT,
  CHAPTER_PACK_SCHEMA_VERSION,
  chapterCatalogSchema,
  chapterLessonPhrases,
  parseChapterPack,
  serializeChapterPack,
  type ChapterCatalog,
  type ChapterLessonSource,
  type CoursePayload,
} from '@lingoquest/course-pack';
import { loadChapterAudio, loadChapterImages } from './chapter-media';

const root = new URL('../apps/mobile/public/chapter-packs/', import.meta.url);
const catalogPath = new URL('catalog.json', root);
const course = bundled.payload as CoursePayload;
const source: Record<string, ChapterLessonSource> = {
  ...westernChapterLessons,
  ...easternChapterLessons,
};
const { units: courseUnits, lessons: courseLessons, ...courseActivities } = course;
const story = {
  chapter,
  adventure: chapterStory,
  practice: travelPracticeSteps,
  runtime: {
    lesson: travelLesson,
    placement: travelPlacementItems,
    challenges: travelChallengePools,
    course: courseActivities,
  },
};
const storyPhrases = [
  ...chapterStory.dialogues.flatMap((dialogue) => ('line' in dialogue ? [dialogue.line.en] : [])),
  ...chapter.missions.flatMap(({ vocabulary, steps }) => [
    ...vocabulary.flatMap(({ term, example }) => [term, example.en]),
    ...steps.flatMap((step) => {
      if (step.type === 'dialogue') return step.line ? [step.line.en] : [];
      if (step.type === 'teach') return step.examples.map(({ en }) => en);
      if (step.type === 'speak') return [step.phrase];
      return step.audio ? [step.audio] : [];
    }),
  ]),
  ...travelPracticeSteps.flatMap(({ audio }) => (audio ? [audio] : [])),
  ...placementQuestions(publicExercise).flatMap(({ audio }) => (audio ? [audio] : [])),
  'Hi! My name is Sam.',
  'Hi! I am',
];

const digest = (bytes: string) => createHash('sha256').update(bytes).digest('hex');
const chapterPath = (revision: number, chapterId: string) =>
  new URL(`${revision}/${chapterId}.json`, root);

async function readCatalog(): Promise<ChapterCatalog> {
  try {
    return chapterCatalogSchema.parse(JSON.parse(await readFile(catalogPath, 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return {
      format: 'lingoquest-chapter-catalog',
      schemaVersion: CHAPTER_PACK_SCHEMA_VERSION,
      chapters: {},
    };
  }
}

async function verifyCatalog(catalog: ChapterCatalog) {
  if (Object.keys(catalog.chapters).length !== route.length)
    throw new Error('The catalog must cover all route destinations.');
  for (const { id, unitId } of route) {
    const entry = catalog.chapters[id];
    if (!entry) throw new Error(`Missing catalog entry for ${id}.`);
    const text = await readFile(chapterPath(entry.revision, id), 'utf8');
    if (Buffer.byteLength(text) !== entry.sizeBytes || digest(text) !== entry.sha256)
      throw new Error(`Incorrect artifact bytes for ${id}.`);
    const pack = parseChapterPack(text, id);
    if (pack.revision !== entry.revision || pack.unit?.id !== unitId)
      throw new Error(`Incorrect revision or course unit for ${id}.`);
    if (id === 'home' && storyPhrases.some((phrase) => !Object.hasOwn(pack.audio, phrase)))
      throw new Error('Missing audio for the first chapter adventure.');
  }
  console.log(`Verified ${route.length} chapter packs.`);
}

async function main() {
  const catalog = await readCatalog();
  if (process.argv.includes('--verify')) return verifyCatalog(catalog);
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
    const phrases = chapterLessonPhrases([lesson, ...additionalLessons], unit?.lessons);
    if (id === 'home') phrases.push(...storyPhrases);
    const text = serializeChapterPack({
      format: CHAPTER_PACK_FORMAT,
      schemaVersion: CHAPTER_PACK_SCHEMA_VERSION,
      revision,
      chapterId: id,
      lesson,
      additionalLessons,
      ...(unit && { unit }),
      ...(id === 'home' && { story }),
      images: await loadChapterImages(id),
      audio: await loadChapterAudio(phrases),
    });
    parseChapterPack(text, id);
    const sha256 = digest(text);
    if (current?.revision === revision && current.sha256 !== sha256)
      throw new Error(`Revision ${revision} of ${id} already exists. Choose a newer revision.`);
    await writeFile(chapterPath(revision, id), text);
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
