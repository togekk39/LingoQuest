import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  onDeviceRecognitionOptions,
  selectedRecognitionService,
} from '../../apps/mobile/src/features/recognitionService';
import { pausePracticePlayback } from '../../apps/mobile/src/features/pausePracticePlayback';
import { drillFeedback, introductionFeedback } from '../../apps/mobile/src/travel/speakingFeedback';

test('device recognition requires API 33 and uses an installed US English model without a provider override', async () => {
  const localeChecks: object[] = [];
  const service = {
    supportsOnDeviceRecognition: () => true,
    getSupportedLocales: async (options: object) => {
      localeChecks.push(options);
      return { installedLocales: ['en_GB', 'en_US'] };
    },
  };
  await assert.rejects(onDeviceRecognitionOptions('android', 32, service), /on-device-unavailable/);
  await assert.rejects(onDeviceRecognitionOptions('web', 33, service), /on-device-unavailable/);
  await assert.rejects(onDeviceRecognitionOptions('ios', 33, service), /on-device-unavailable/);
  await assert.rejects(
    onDeviceRecognitionOptions('android', 33, {
      ...service,
      supportsOnDeviceRecognition: () => false,
    }),
    /on-device-unavailable/,
  );
  assert.deepEqual(localeChecks, []);
  assert.deepEqual(await onDeviceRecognitionOptions('android', 33, service), {
    lang: 'en-US',
    requiresOnDeviceRecognition: true,
  });
  assert.deepEqual(localeChecks, [{}]);
});

test('online and downloadable language listings cannot qualify for on-device recognition', async () => {
  await assert.rejects(
    onDeviceRecognitionOptions('android', 35, {
      supportsOnDeviceRecognition: () => true,
      getSupportedLocales: async () => ({ locales: ['en-US'], installedLocales: ['en-GB'] }),
    }),
    /on-device-language-unavailable/,
  );
});

test('travel speaking feedback accepts personal names and separates the greeting from the grammar', () => {
  const complete = introductionFeedback('Hi! I’m Marisol.');
  assert.match(complete.content, /saludo y una presentación/);
  assert.match(complete.grammar, /usa una forma de presentación/);

  const noGreeting = introductionFeedback('My name is Marisol.');
  assert.match(noGreeting.content, /Empieza con Hi o Hello/);
  assert.equal(noGreeting.grammar, complete.grammar);

  const noName = introductionFeedback('Hi, I am.');
  assert.match(noName.content, /Agrega tu nombre/);
  assert.match(noName.grammar, /Coloca tu nombre después/);

  const noStructure = introductionFeedback('Hi, Marisol.');
  assert.match(noStructure.grammar, /usa I am/);
  assert.match(drillFeedback('It is blue', 'It’s red.').content, /Usa red/);
  assert.match(drillFeedback('It is blue', 'It’s red.').grammar, /incluye la estructura/);
  assert.match(drillFeedback('Red', 'It’s red.').content, /incluye la idea/);
  assert.match(drillFeedback('Red', 'It’s red.').grammar, /Practica la estructura/);
});

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
