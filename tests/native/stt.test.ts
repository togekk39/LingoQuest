import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { selectedRecognitionService } from '../../apps/mobile/src/features/recognitionService';
import { pausePracticePlayback } from '../../apps/mobile/src/features/pausePracticePlayback';

test('third-party system default is selected without Google and changes apply on next attempt', () => {
  let selected = 'example.marmalade';
  const services = {
    getDefaultRecognitionService: () => ({ packageName: selected }),
    getSpeechRecognitionServices: () => ['example.marmalade', 'other.provider'],
  };
  assert.equal(selectedRecognitionService(services), 'example.marmalade');
  selected = 'other.provider';
  assert.equal(selectedRecognitionService(services), 'other.provider');
});
for (const selected of ['', 'disabled.google']) {
  test(`missing/disabled default (${selected}) does not silently choose another provider`, () => {
    assert.throws(
      () =>
        selectedRecognitionService({
          getDefaultRecognitionService: () => ({ packageName: selected }),
          getSpeechRecognitionServices: () => ['example.marmalade'],
        }),
      /service-unavailable/,
    );
  });
}
test('native playback never passes null to Android AudioPlayer.replace', () => {
  let pauses = 0;
  let replacements = 0;
  const player = {
    pause: () => {
      pauses++;
    },
    replace: () => {
      replacements++;
      throw new Error('Android requires AudioSource');
    },
  };
  pausePracticePlayback(player, 'android');
  pausePracticePlayback(player, 'ios');
  assert.equal(pauses, 2);
  assert.equal(replacements, 0);
  pausePracticePlayback({ pause() {}, replace: (source) => assert.equal(source, null) }, 'web');
});
test('generated Android manifest exposes RecognitionService and Marmalade', () => {
  const config = JSON.parse(
    execFileSync('node', ['../../scripts/expo.mjs', 'config', '--type', 'introspect', '--json'], {
      cwd: 'apps/mobile',
      encoding: 'utf8',
    }),
  );
  const manifest = JSON.stringify(config._internal.modResults.android.manifest);
  assert.ok(manifest.includes('android.speech.RecognitionService'));
  assert.ok(manifest.includes('app.marmalade.stt'));
});
