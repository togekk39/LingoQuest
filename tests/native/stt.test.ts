import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chapter } from '@lingoquest/offline-engine';
import {
  onDeviceRecognitionOptions,
  selectedRecognitionService,
} from '../../apps/mobile/src/features/recognitionService';
import { pausePracticePlayback } from '../../apps/mobile/src/features/pausePracticePlayback';
import { playPracticeClip } from '../../apps/mobile/src/features/playPracticeClip';
import {
  drillFeedback,
  introductionFeedback,
  matchesSpeechTarget,
} from '../../apps/mobile/src/travel/speakingFeedback';

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
  assert.deepEqual(introductionFeedback('Hi, my name’s Marisol.'), complete);
  assert.equal(introductionFeedback('Hi, Marisol here.').content, complete.content);
  assert.match(introductionFeedback('Hi, Marisol here.').grammar, /usa I am/);
  assert.match(drillFeedback('It is blue', 'It’s red.').content, /Usa red/);
  assert.match(drillFeedback('It is blue', 'It’s red.').grammar, /incluye la estructura/);
  assert.match(drillFeedback('Red', 'It’s red.').content, /incluye la idea/);
  assert.match(drillFeedback('Red', 'It’s red.').grammar, /Practica la estructura/);
  assert.match(drillFeedback('Her backpack’s red', 'It’s red.').grammar, /incluye la estructura/);
  assert.match(drillFeedback('My backpack is red', 'It’s red.').content, /Usa red/);
  assert.match(
    drillFeedback('Where’s the bus stop?', 'Where is the bus stop?').grammar,
    /incluye la estructura/,
  );
});

test('travel speaking targets require complete phrases and accept the chapter variants', () => {
  const tasks = chapter.missions.flatMap((mission) =>
    mission.steps.filter((step) => step.type === 'speak'),
  );
  const intro = tasks.find((step) => step.id === 'hello_speak')!;
  const bag = tasks.find((step) => step.id === 'bag_speak')!;
  const matchesIntro = (text: string) =>
    matchesSpeechTarget(text, intro.phrase, intro.acceptedPhrases);
  const matchesBag = (text: string) => matchesSpeechTarget(text, bag.phrase, bag.acceptedPhrases);
  assert.equal(matchesIntro(''), false);
  assert.equal(matchesIntro('Hi!'), false);
  assert.equal(matchesIntro('Hi, my name’s Luz!'), true);
  assert.equal(matchesIntro('Hi, my name is Ana.'), false);
  assert.equal(matchesIntro('Hi, I am Luz. I am happy.'), false);
  assert.equal(matchesBag('It is red.'), true);
  assert.equal(matchesBag('Her backpack’s red.'), true);
  assert.equal(matchesBag('Red.'), false);
  assert.equal(matchesBag('It is blue.'), false);
});

test('comparison playback waits for the example end and removes the listener on cancellation', async () => {
  const played: unknown[] = [];
  let emit: ((status: { didJustFinish: boolean }) => void) | undefined;
  const player = {
    addListener: (_name: string, listener: NonNullable<typeof emit>) => {
      emit = listener;
      return {
        remove: () => {
          emit = undefined;
        },
      };
    },
    replace: (source: unknown) => played.push(source),
    setPlaybackRate: () => {},
    play: () => {},
  } as Parameters<typeof playPracticeClip>[0];
  const recording = { uri: 'file:///practice.wav' };
  const controller = new AbortController();
  const comparison = playPracticeClip(player, 1, 1, controller.signal).then(
    (ended) => ended && playPracticeClip(player, recording, 1, controller.signal),
  );
  assert.deepEqual(played, [1]);
  emit?.({ didJustFinish: false });
  await Promise.resolve();
  assert.deepEqual(played, [1]);
  emit?.({ didJustFinish: true });
  await Promise.resolve();
  assert.deepEqual(played, [1, recording]);
  controller.abort();
  assert.equal(await comparison, false);
  assert.equal(emit, undefined);
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
