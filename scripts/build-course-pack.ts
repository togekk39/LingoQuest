import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  units,
  lessons,
  challengePools,
  challengeLevels,
  placementQuestions,
  missions,
  speechDrills,
  contentStatus,
} from '../content/source/curriculum.ts';
import {
  createCoursePack,
  serializeCoursePack,
  sha256Hex,
  utf8Bytes,
  courseCatalogSchema,
} from '../packages/course-pack/src/index.ts';
async function main() {
  const root = resolve(process.cwd());
  const version = process.env.COURSE_PACK_VERSION ?? '1.0.0';
  const repository = process.env.COURSE_PACK_REPOSITORY ?? 'togekk39/LingoQuest';
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))
    throw new Error('COURSE_PACK_REPOSITORY must be owner/repository.');
  const createdAt = process.env.COURSE_PACK_CREATED_AT ?? '2026-11-08T00:00:00.000Z';
  const pack = createCoursePack(
    {
      units,
      lessons,
      challengePools,
      challengeLevels,
      placementQuestions,
      missions,
      speechDrills,
      contentStatus,
    },
    {
      packageId: 'es419-enus-a1a2',
      version,
      minAppVersion: '1.2.0',
      titleEs: 'Inglés para tu vida real · A1–A2',
      locale: 'es-419',
      targetLanguage: 'en-US',
      createdAt,
    },
  );
  const serialized = serializeCoursePack(pack);
  const fileName = `lingoquest-es419-enus-a1a2-${version}.lqp.json`;
  const releaseDir = resolve(root, 'content/releases');
  await mkdir(releaseDir, { recursive: true });
  await mkdir(resolve(root, 'apps/mobile/src/content'), { recursive: true });
  await writeFile(resolve(releaseDir, fileName), serialized);
  await writeFile(resolve(root, 'apps/mobile/src/content/bundled-course.json'), serialized);
  const fileDigest = sha256Hex(serialized);
  await writeFile(resolve(releaseDir, `${fileName}.sha256`), `${fileDigest}  ${fileName}\n`);
  const catalog = courseCatalogSchema.parse({
    format: 'lingoquest-course-catalog',
    schemaVersion: 1,
    updatedAt: createdAt,
    packages: [
      {
        packageId: pack.manifest.packageId,
        version,
        titleEs: pack.manifest.titleEs,
        url: `https://github.com/${repository}/releases/download/course-v${version}/${fileName}`,
        sha256: fileDigest,
        sizeBytes: utf8Bytes(serialized).length,
        minAppVersion: pack.manifest.minAppVersion,
        locale: pack.manifest.locale,
        targetLanguage: pack.manifest.targetLanguage,
      },
    ],
  });
  await writeFile(resolve(releaseDir, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(
    `Built ${fileName}: ${utf8Bytes(serialized).length} bytes, ${units.length} units, ${Object.keys(lessons).length} lessons; original draft awaiting human review.`,
  );
  console.log(
    'GitHub URLs are release targets; this command does not publish, push or call any online API.',
  );
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
