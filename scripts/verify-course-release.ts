import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseCoursePack, parseCourseCatalog, sha256Hex, utf8Bytes } from '@lingoquest/course-pack';
async function main() {
  const version = process.env.COURSE_PACK_VERSION ?? '2.0.0';
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
    record.sizeBytes !== utf8Bytes(text).length
  )
    throw new Error(
      'Release files or catalog do not match. Build and commit the versioned artifacts first.',
    );
  const checksum = (await readFile(resolve(root, filename + '.sha256'), 'utf8')).trim();
  if (checksum !== `${hash}  ${filename}`)
    throw new Error('SHA-256 sidecar does not match the release bytes.');
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
