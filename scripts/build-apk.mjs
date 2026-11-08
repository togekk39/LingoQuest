import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
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
const architectures = process.env.ANDROID_ARCHITECTURES || 'arm64-v8a,armeabi-v7a';
if (!/^(arm64-v8a|armeabi-v7a|x86_64)(,(arm64-v8a|armeabi-v7a|x86_64))*$/.test(architectures))
  throw new Error('Unsupported ANDROID_ARCHITECTURES.');
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
await run(
  './gradlew',
  [
    ':app:assembleRelease',
    '--no-daemon',
    '--max-workers=2',
    '--console=plain',
    '-Dorg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g',
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
const config = JSON.parse(await readFile(join(mobile, 'app.json'), 'utf8')).expo;
const commit = process.env.GITHUB_SHA || 'local';
const shortCommit = commit.slice(0, 8);
const output = join(repo, 'work/apk');
await mkdir(output, { recursive: true });
const filename = `lingoquest-${config.version}-preview-${shortCommit}.apk`;
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
      version: config.version,
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
