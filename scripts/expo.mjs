import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const androidExport =
  args[0] === 'export' &&
  args.includes('--platform') &&
  args[args.indexOf('--platform') + 1] === 'android';
const child = spawn(process.execPath, [require.resolve('expo/bin/cli'), ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_NO_TELEMETRY: '1',
    ...(androidExport && {
      EXPO_PUBLIC_FOLDER: process.env.EXPO_PUBLIC_FOLDER ?? 'public-android',
    }),
    __UNSAFE_EXPO_HOME_DIRECTORY:
      process.env.LINGOQUEST_EXPO_CACHE || join(tmpdir(), 'lingoquest-expo'),
  },
});
child.on('exit', (code) => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
