import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mobile = join(repo, 'apps/mobile');
const env = {
  ...process.env,
  CI: '1',
  EXPO_NO_TELEMETRY: '1',
  EXPO_OFFLINE: '1',
  __UNSAFE_EXPO_HOME_DIRECTORY:
    process.env.LINGOQUEST_EXPO_CACHE || join(tmpdir(), 'lingoquest-expo'),
};
const packRef = env.EXPO_PUBLIC_CHAPTER_PACK_REF;
if (packRef && /^[a-f0-9]{40}$/.test(packRef)) {
  // Scope Metro's cache to the catalog source compiled into this APK.
  // Separa la caché de Metro por el origen del catálogo compilado en este APK.
  const cacheKey = createHash('sha256')
    .update(JSON.stringify([env.EXPO_PUBLIC_CHAPTER_PACK_REPOSITORY ?? '', packRef]))
    .digest('hex');
  env.TMPDIR = join(tmpdir(), `lingoquest-metro-${cacheKey}`);
  await mkdir(env.TMPDIR, { recursive: true });
}
const architectures = process.env.ANDROID_ARCHITECTURES || 'arm64-v8a,armeabi-v7a';
if (!/^(arm64-v8a|armeabi-v7a|x86_64)(,(arm64-v8a|armeabi-v7a|x86_64))*$/.test(architectures))
  throw new Error('Unsupported ANDROID_ARCHITECTURES.');
const gradleHeap = process.env.ANDROID_GRADLE_MAX_HEAP || '4g';
const gradleWorkers = Number(process.env.ANDROID_GRADLE_MAX_WORKERS || '2');
if (!/^[1-9][0-9]*[mg]$/.test(gradleHeap))
  throw new Error('ANDROID_GRADLE_MAX_HEAP must be a JVM size such as 2g.');
if (!Number.isInteger(gradleWorkers) || gradleWorkers < 1)
  throw new Error('ANDROID_GRADLE_MAX_WORKERS must be a positive integer.');
const runNumber = Number(process.env.GITHUB_RUN_NUMBER || '0');
const versionCode = Number(
  process.env.ANDROID_VERSION_CODE || (runNumber ? 100000 + runNumber : 1),
);
if (!Number.isSafeInteger(versionCode) || versionCode < 1 || versionCode > 2100000000)
  throw new Error('ANDROID_VERSION_CODE must be a positive Android version code.');
function run(command, args, cwd = repo, capture = false) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    });
    const chunks = [];
    if (capture) child.stdout.on('data', (chunk) => chunks.push(chunk));
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) reject(new Error(`${command} exited with ${code}`));
      else resolvePromise(capture ? Buffer.concat(chunks) : undefined);
    });
  });
}
const packageFile = join(mobile, 'package.json');
const originalPackage = await readFile(packageFile);
try {
  // Expo's generated native template embeds JS/assets in the release variant.
  await run(
    process.execPath,
    [join(repo, 'scripts/expo.mjs'), 'prebuild', '--platform', 'android', '--no-install'],
    mobile,
  );
} finally {
  // Prebuild adjusts start scripts even with --no-install; keep authored sources unchanged.
  await writeFile(packageFile, originalPackage);
}
const native = join(mobile, 'android');
const appGradle = join(native, 'app/build.gradle');
let gradle = await readFile(appGradle, 'utf8');
if (
  !gradle.includes('signingConfig signingConfigs.debug') ||
  !gradle.includes('bundleCommand = "export:embed"')
)
  throw new Error(
    'The Expo release template changed; review bundling and preview signing before building.',
  );
const matches = gradle.match(/versionCode\s+\d+/g) || [];
if (matches.length !== 1) throw new Error('Expected exactly one generated Android versionCode.');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
await writeFile(appGradle, gradle);
const manifest = await readFile(join(native, 'app/src/main/AndroidManifest.xml'), 'utf8');
if (!manifest.includes('android:allowBackup="false"'))
  throw new Error('Android automatic backup must remain disabled for this offline edition.');
const certificate = await run(
  'keytool',
  [
    '-exportcert',
    '-keystore',
    join(native, 'app/debug.keystore'),
    '-alias',
    'androiddebugkey',
    '-storepass',
    'android',
  ],
  repo,
  true,
);
const certificateSha256 = createHash('sha256').update(certificate).digest('hex');
const expectedTemplateCertificate =
  'fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c';
if (certificateSha256 !== expectedTemplateCertificate)
  throw new Error(
    'The public preview signing certificate changed; refuse to produce an incompatible update.',
  );
if (process.argv.includes('--prebuild-only')) {
  console.log(
    'Native prebuild, standalone bundling configuration, offline backup policy and fixed signing certificate verified.',
  );
  process.exit(0);
}
// Gradle can miss workspace packages in the Expo bundle task's incremental inputs.
// Gradle puede omitir paquetes del espacio de trabajo al detectar cambios para el paquete de Expo.
await run(
  './gradlew',
  [
    ':app:createBundleReleaseJsAndAssets',
    '--rerun',
    ':app:assembleRelease',
    '--no-daemon',
    `--max-workers=${gradleWorkers}`,
    '--console=plain',
    `-Dorg.gradle.jvmargs=-Xmx${gradleHeap} -XX:MaxMetaspaceSize=1g`,
    `-PreactNativeArchitectures=${architectures}`,
    '-Pandroid.buildToolsVersion=36.0.0',
    '-Pandroid.compileSdkVersion=36',
    '-Pandroid.targetSdkVersion=36',
  ],
  native,
);
const apk = join(native, 'app/build/outputs/apk/release/app-release.apk');
const entries = (await run('unzip', ['-Z1', apk], repo, true)).toString('utf8').split('\n');
if (!entries.includes('assets/index.android.bundle'))
  throw new Error(
    'APK is missing the embedded JavaScript/Hermes bundle; it cannot be shipped as standalone.',
  );
if (!entries.some((entry) => entry.endsWith('.ttf')))
  throw new Error('APK is missing embedded fonts required by the offline UI.');
// The app shows these illustrations while downloading a chapter.
// La app muestra estas ilustraciones mientras descarga un capítulo.
const downloadShellArt = new Set([
  'assets_journal_atlas.jpg',
  'assets_journal_atlasportrait.jpg',
  'assets_journal_writing.jpg',
  'assets_journal_writingportrait.jpg',
]);
if (
  entries.some(
    (entry) =>
      entry.includes('chapter-packs/') ||
      (/assets_(journal|travel)_.*\.(png|jpe?g|webp|mp3)$/i.test(entry) &&
        !downloadShellArt.has(basename(entry))),
  )
)
  throw new Error('APK embeds chapter art or audio. These files belong in chapter packs.');
const bundle = await run('unzip', ['-p', apk, 'assets/index.android.bundle'], repo, true);
const chapterPacks = join(mobile, 'public/chapter-packs');
const chapterCatalog = 'catalog-v6.json';
const bundleContains = (value) =>
  bundle.includes(Buffer.from(value)) || bundle.includes(Buffer.from(value, 'utf16le'));
if (!bundleContains(chapterCatalog))
  throw new Error('APK bundle is missing the current chapter catalog reference.');
if (packRef && /^[a-f0-9]{40}$/.test(packRef) && !bundleContains(packRef))
  throw new Error('APK bundle is missing the pinned chapter catalog commit.');
const catalog = JSON.parse(await readFile(join(chapterPacks, chapterCatalog), 'utf8'));
const home = JSON.parse(
  await readFile(join(chapterPacks, String(catalog.chapters.home.revision), 'home.json'), 'utf8'),
).story;
const mexico = JSON.parse(
  await readFile(
    join(chapterPacks, String(catalog.chapters.mexico.revision), 'mexico.json'),
    'utf8',
  ),
).story;
const textbook = JSON.parse(
  await readFile(join(mobile, 'src/content/bundled-course.json'), 'utf8'),
);
// Canonical IDs are available in the shell. Probe authored question bodies for embedded material.
// Los identificadores canónicos están en la app base. Busca textos de preguntas para detectar material incluido.
const payloadMarkers = [
  home.runtime.lesson.exercises.find(({ id }) => id === 'travel_quick_hello')?.promptEs,
  home.runtime.challenges.reading_quest.find(({ id }) => id === 'home_challenge_readbag')?.passage,
  home.chapter.missions
    .find(({ id }) => id === 'foundation-letters-a')
    ?.steps.find(({ id }) => id === 'foundation-letters-a-teach')?.text,
  textbook.payload.lessons.u08_l04.exercises.find(({ id }) => id === 'u08_l04_practice_5')?.passage,
  mexico.chapter.missions
    .find(({ id }) => id === 'mexico-transfer')
    ?.steps.find(({ id }) => id === 'mexico-transfer-write')?.exercise.promptEs,
];
for (const marker of payloadMarkers) {
  if (typeof marker !== 'string' || marker.length < 20)
    throw new Error('The authored payload marker changed. Select a replacement from the pack.');
  if (bundle.includes(Buffer.from(marker)) || bundle.includes(Buffer.from(marker, 'utf16le')))
    throw new Error(
      'APK embeds course data. Course content must load from installed chapter packs.',
    );
}
const config = JSON.parse(await readFile(join(mobile, 'app.json'), 'utf8')).expo;
const commit = process.env.LINGOQUEST_BUILD_COMMIT || process.env.GITHUB_SHA || 'local';
const shortCommit = commit.slice(0, 8);
const output = join(repo, 'work/apk');
await mkdir(output, { recursive: true });
const releaseVersion = env.LINGOQUEST_RELEASE_VERSION;
const buildLabel = releaseVersion || 'dev';
const filename = `lingoquest-${buildLabel}-${shortCommit}.apk`;
await copyFile(apk, join(output, filename));
const bytes = await readFile(apk);
const apkSha256 = createHash('sha256').update(bytes).digest('hex');
await writeFile(join(output, filename + '.sha256'), `${apkSha256}  ${filename}\n`);
await writeFile(
  join(output, 'build-info.json'),
  JSON.stringify(
    {
      app: config.name,
      packageId: config.android.package,
      version: releaseVersion || null,
      versionCode,
      commit,
      architectures: architectures.split(','),
      standalone: true,
      signing: 'public-template-preview-key-not-for-store-release',
      signingCertificateSha256: certificateSha256,
      sha256: apkSha256,
      bytes: bytes.length,
    },
    null,
    2,
  ) + '\n',
);
await writeFile(
  join(output, 'README.txt'),
  'LingoQuest standalone offline preview APK.\nInstall on an ARM Android device (Android 7 or newer). Metro, Expo Go and an account are not required.\nThe APK uses the public React Native preview signing key. It is for testing, not Play Store production distribution.\nKeep a local progress backup before switching to a future private production signing certificate.\n',
);
console.log(`Standalone APK ready: work/apk/${filename} (${bytes.length} bytes)`);
