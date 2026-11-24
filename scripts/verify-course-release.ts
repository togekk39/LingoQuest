import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseCoursePack, parseCourseCatalog, sha256Hex, utf8Bytes } from '@lingoquest/course-pack';
async function main() {
  const version = process.env.COURSE_PACK_VERSION ?? '2.2.0';
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version))
    throw new Error('Invalid release version.');
  const root = resolve('content/releases');
  const filename = `lingoquest-es419-enus-a1a2-${version}.lqp.json`;
  const text = await readFile(resolve(root, filename), 'utf8');
  const pack = parseCoursePack(text);
  const catalog = parseCourseCatalog(await readFile(resolve(root, 'catalog.json'), 'utf8'));
  const record = catalog.packages.find(
    (item) => item.packageId === pack.manifest.packageId && item.version === version,
  );
  const hash = sha256Hex(text);
  if (
    pack.manifest.version !== version ||
    !record ||
    record.sha256 !== hash ||
    record.sizeBytes !== utf8Bytes(text).length ||
    record.minAppVersion !== pack.manifest.minAppVersion ||
    record.titleEs !== pack.manifest.titleEs ||
    record.locale !== pack.manifest.locale ||
    record.targetLanguage !== pack.manifest.targetLanguage
  )
    throw new Error(
      'Release files or catalog do not match. Build and commit the versioned artifacts first.',
    );
  const checksum = (await readFile(resolve(root, filename + '.sha256'), 'utf8')).trim();
  if (checksum !== `${hash}  ${filename}`)
    throw new Error('SHA-256 sidecar does not match the release bytes.');
  const bundled = await readFile(resolve('apps/mobile/src/content/bundled-course.json'), 'utf8');
  const bundledVersion = parseCoursePack(bundled).manifest.version;
  if (version === bundledVersion && bundled !== text)
    throw new Error('The bundled copy differs from the matching versioned release.');
  if (!process.env.COURSE_PACK_VERSION && bundledVersion !== version)
    throw new Error('The bundled copy does not use the default course version.');
  if (version === bundledVersion) {
    const source = JSON.parse(
      await readFile(resolve('apps/mobile/src/content/course-source.json'), 'utf8'),
    );
    if (
      source.version !== version ||
      source.packageId !== record.packageId ||
      source.sha256 !== hash ||
      source.sizeBytes !== record.sizeBytes ||
      (source.published ? source.url !== record.url : source.url !== '')
    )
      throw new Error('The bundled download metadata differs from the versioned release.');
  }
  if (process.env.COURSE_PACK_REPOSITORY) {
    const expected = `https://github.com/${process.env.COURSE_PACK_REPOSITORY}/releases/download/course-v${version}/${filename}`;
    if (record.url !== expected) throw new Error('Catalog URL does not match this repository/tag.');
  }
  console.log(`Verified immutable course-v${version}: ${utf8Bytes(text).length} bytes, ${hash}`);
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
