import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  APP_VERSION,
  MAX_PACK_BYTES,
  CoursePackError,
  canonicalStringify,
  createCoursePack,
  parseCoursePack,
  serializeCoursePack,
  sha256Hex,
  utf8Bytes,
  compareVersions,
  parseCourseCatalog,
  validateCoursePack,
  type CoursePack,
} from '../src/index';
const text = readFileSync(
  new URL('../../../apps/mobile/src/content/bundled-course.json', import.meta.url),
  'utf8',
);
const baseline = JSON.parse(text) as CoursePack;
const clone = () => JSON.parse(text) as CoursePack;
function errorCode(code: string) {
  return (error: unknown) => error instanceof CoursePackError && error.code === code;
}

test('portable SHA-256 matches standard and Unicode UTF-8 vectors including block boundaries', () => {
  for (const input of [
    '',
    'abc',
    'The quick brown fox jumps over the lazy dog',
    'a'.repeat(55),
    'a'.repeat(56),
    'a'.repeat(64),
    'a'.repeat(1000),
    '¡Hola! Español, 中文, 👋🏽',
    '\ud800x\udc00',
  ]) {
    assert.equal(sha256Hex(input), createHash('sha256').update(input, 'utf8').digest('hex'));
    assert.deepEqual([...utf8Bytes(input)], [...Buffer.from(input, 'utf8')]);
  }
});
test('bundled course is a validated self-contained package with 32 lessons and offline grading rules', () => {
  const pack = parseCoursePack(text, APP_VERSION);
  assert.equal(pack.manifest.packageId, 'es419-enus-a1a2');
  assert.equal(pack.payload.units.length, 8);
  assert.equal(Object.keys(pack.payload.lessons).length, 32);
  assert.equal(
    Object.values(pack.payload.lessons).reduce((n, lesson) => n + lesson.exercises.length, 0),
    320,
  );
  assert.equal(pack.payload.speechDrills.length, 40);
  assert.equal(pack.payload.challengeLevels.length, 13);
  assert.equal(pack.payload.placementQuestions.length, 12);
  assert.equal(pack.payload.contentStatus.rankedPublished, false);
  assert.ok(pack.payload.lessons.u01_l01.exercises.every((e) => e.acceptedAnswers.length > 0));
  assert.equal(serializeCoursePack(pack), text);
});
test('canonical metadata and payload digest are stable across property insertion order', () => {
  const reordered = { payload: baseline.payload, manifest: { ...baseline.manifest } };
  assert.equal(validateCoursePack(reordered).manifest.sha256, baseline.manifest.sha256);
  assert.equal(canonicalStringify({ z: 1, a: { y: 3, b: 2 } }), '{' + '"a":{"b":2,"y":3},"z":1}');
});
test('tampered content or metadata is rejected without accepting the new payload', () => {
  const changed = clone();
  changed.payload.lessons.u01_l01.title = 'Contenido alterado';
  assert.throws(() => parseCoursePack(JSON.stringify(changed)), errorCode('CHECKSUM_MISMATCH'));
  const metadata = clone();
  metadata.manifest.version = '1.0.1';
  assert.throws(() => validateCoursePack(metadata), errorCode('CHECKSUM_MISMATCH'));
  assert.equal(
    parseCoursePack(text).payload.lessons.u01_l01.title,
    baseline.payload.lessons.u01_l01.title,
  );
});
test('unsupported schemas, incompatible app versions and oversized input are rejected', () => {
  const changed = clone();
  (changed.manifest as { schemaVersion: number }).schemaVersion = 2;
  assert.throws(() => validateCoursePack(changed), errorCode('INVALID_SCHEMA'));
  assert.throws(() => parseCoursePack(text, '1.1.0'), errorCode('APP_UPDATE_REQUIRED'));
  assert.throws(() => parseCoursePack(' '.repeat(MAX_PACK_BYTES + 1)), errorCode('SIZE_LIMIT'));
  assert.throws(() => parseCoursePack('{broken'), errorCode('INVALID_JSON'));
});
test('unknown executable or prototype keys cannot enter the package', () => {
  const changed = clone();
  (changed.payload as unknown as Record<string, unknown>).script = 'alert(1)';
  assert.throws(() => validateCoursePack(changed), errorCode('INVALID_SCHEMA'));
  assert.throws(() => parseCoursePack('{"__proto__":{"polluted":true}}'), errorCode('INVALID_KEY'));
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
  const versioned = clone();
  (versioned.payload.lessons.u01_l01 as unknown as Record<string, unknown>).script =
    'javascript:evil';
  assert.throws(() => validateCoursePack(versioned), errorCode('INVALID_SCHEMA'));
});
test('bad references, duplicate IDs, invalid answer options and incomplete levels are rejected', () => {
  const badLesson = clone();
  badLesson.payload.lessons.u01_l01.unitId = 'missing';
  assert.throws(
    () => createCoursePack(badLesson.payload, badLesson.manifest),
    errorCode('INVALID_REFERENCES'),
  );
  const duplicate = clone();
  duplicate.payload.units[1].lessons[0].id = 'u01_l01';
  assert.throws(
    () => createCoursePack(duplicate.payload, duplicate.manifest),
    errorCode('INVALID_REFERENCES'),
  );
  const answer = clone();
  answer.payload.lessons.u01_l01.exercises[0].correctOptionId = 'no-option';
  assert.throws(
    () => createCoursePack(answer.payload, answer.manifest),
    errorCode('INVALID_REFERENCES'),
  );
  const mission = clone();
  mission.payload.missions[0].steps[0].options[0].nextStepId = 'not-a-step';
  assert.throws(
    () => createCoursePack(mission.payload, mission.manifest),
    errorCode('INVALID_REFERENCES'),
  );
  const levels = clone();
  levels.payload.challengeLevels[12].level = 12;
  assert.throws(
    () => createCoursePack(levels.payload, levels.manifest),
    errorCode('INVALID_REFERENCES'),
  );
});
test('new content versions preserve stable IDs and version ordering is numeric', () => {
  const next = createCoursePack(baseline.payload, { ...baseline.manifest, version: '1.0.1' });
  assert.equal(next.manifest.version, '1.0.1');
  assert.notEqual(next.manifest.sha256, baseline.manifest.sha256);
  assert.deepEqual(Object.keys(next.payload.lessons), Object.keys(baseline.payload.lessons));
  assert.equal(compareVersions('1.10.0', '1.9.0'), 1);
  assert.equal(compareVersions('1.0.0', '1.0.0'), 0);
  assert.equal(compareVersions('1.0.0', '2.0.0'), -1);
  assert.equal(parseCoursePack(serializeCoursePack(next)).manifest.version, '1.0.1');
});
test('GitHub catalog file checksum agrees with actual release asset and rejects other origins', () => {
  const catalogText = readFileSync(
    new URL('../../../content/releases/catalog.json', import.meta.url),
    'utf8',
  );
  const catalog = parseCourseCatalog(catalogText);
  const entry = catalog.packages[0];
  assert.equal(entry.sha256, sha256Hex(text));
  assert.equal(entry.sizeBytes, utf8Bytes(text).length);
  assert.match(entry.url, /^https:\/\/github.com\/togekk39\/LingoQuest\/releases\/download\//);
  for (const url of [
    'http://github.com/owner/repo/x',
    'https://evil.example/course.json',
    'https://user:password@github.com/owner/repo/x',
    'https://github.com:444/owner/repo/x',
  ]) {
    const changed = JSON.parse(catalogText);
    changed.packages[0].url = url;
    assert.throws(() => parseCourseCatalog(JSON.stringify(changed)), errorCode('INVALID_CATALOG'));
  }
});

test('unsafe version integers and duplicate catalog versions are rejected', () => {
  const bad = clone();
  bad.manifest.version = '99999999999999999.0.0';
  assert.throws(() => validateCoursePack(bad), errorCode('INVALID_SCHEMA'));
  const catalog = JSON.parse(
    readFileSync(new URL('../../../content/releases/catalog.json', import.meta.url), 'utf8'),
  );
  catalog.packages.push(catalog.packages[0]);
  assert.throws(() => parseCourseCatalog(JSON.stringify(catalog)), errorCode('INVALID_CATALOG'));
});
