import { test, expect, enterApp, readyOfflineShell, click, exact } from './helpers';
import type { Page } from '@playwright/test';

async function installSpeechFixture(page: Page, noVoices = false) {
  await page.addInitScript((noVoices) => {
    const fixture = window as any;
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: class {
        text: string;
        voice = null;
        rate = 1;
        constructor(text: string) {
          this.text = text;
        }
      },
    });
    fixture.__speechCalls = [];
    fixture.__voiceReads = 0;
    fixture.__speechCancels = 0;
    fixture.__speechFailure = false;
    fixture.__speechVoices = noVoices
      ? []
      : [
          {
            name: 'English US local',
            lang: 'en-US',
            voiceURI: 'local-us',
            localService: true,
            default: false,
          },
          {
            name: 'English UK system',
            lang: 'en-GB',
            voiceURI: 'local-gb',
            localService: true,
            default: true,
          },
          {
            name: 'Remote English',
            lang: 'en-US',
            voiceURI: 'cloud-us',
            localService: false,
            default: false,
          },
          {
            name: 'Español local',
            lang: 'es-MX',
            voiceURI: 'local-es',
            localService: true,
            default: false,
          },
        ];
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => {
          fixture.__voiceReads++;
          return fixture.__speechVoices;
        },
        speak: (utterance: SpeechSynthesisUtterance) => {
          fixture.__speechCalls.push({
            text: utterance.text,
            voice: utterance.voice?.voiceURI,
            language: utterance.lang,
            rate: utterance.rate,
          });
          setTimeout(
            () =>
              fixture.__speechFailure
                ? utterance.onerror?.({} as SpeechSynthesisErrorEvent)
                : utterance.onend?.({} as SpeechSynthesisEvent),
            30,
          );
        },
        cancel: () => fixture.__speechCancels++,
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  }, noVoices);
}
test('travel sentences and words autoplay bundled audio when a system voice is unavailable', async ({
  page,
  context,
}) => {
  await installSpeechFixture(page, true);
  await page.addInitScript(() => {
    const played: string[] = [];
    Object.assign(window, { played });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const result = play.call(this);
      void result
        .then(() => {
          played.push(this.currentSrc);
        })
        .catch(() => {});
      return result;
    };
  });
  await enterApp(page);
  await readyOfflineShell(page, context);
  const clipPlays = (clip: string) =>
    page.evaluate(
      (clip) =>
        (window as unknown as { played: string[] }).played.filter((src) =>
          src.includes(`/${clip}.`),
        ).length,
      clip,
    );
  await click(page, 'Continuar viaje');
  await click(page, 'Continuar');
  await expect.poll(() => clipPlays('line-1')).toBe(1);
  await click(page, 'Escuchar frase');
  await expect.poll(() => clipPlays('line-1')).toBe(2);
  await click(page, 'Continuar');
  await expect.poll(() => clipPlays('word-1')).toBe(1);
  await click(page, 'Revelar significado');
  await expect(page.getByText('hola', { exact: true })).toBeVisible();
  await expect(page.getByText(/Estás escuchando el audio incluido/)).toBeVisible();
  expect(await clipPlays('line-1')).toBe(2);
  await click(page, 'Escuchar ejemplo');
  await expect.poll(() => clipPlays('line-1')).toBe(3);
  await click(page, 'Escuchar: Hi');
  await expect.poll(() => clipPlays('word-1')).toBe(2);
  await click(page, 'Siguiente palabra');
  await expect.poll(() => clipPlays('word-2')).toBe(1);
});

async function previewVoice(page: Page) {
  await click(page, 'Configuración');
  await click(page, 'Probar voz');
}

test('the mission uses the system TTS and applies in-mission voice changes to actual words and examples', async ({
  page,
  context,
}) => {
  await installSpeechFixture(page);
  await enterApp(page);
  await readyOfflineShell(page, context);
  const lastSpeech = () => page.evaluate(() => (window as any).__speechCalls.at(-1));
  await click(page, 'Continuar viaje');
  await click(page, 'Continuar');
  await click(page, 'Continuar');
  await expect.poll(lastSpeech).toMatchObject({
    text: 'Hi',
    voice: 'local-gb',
    language: 'en-GB',
    rate: 1,
  });
  await click(page, 'Configuración de voz');
  await expect(
    page.getByRole('radio', { name: 'Predeterminada del sistema', exact: true }),
  ).toBeChecked();
  await expect(page.getByRole('radio', { name: /Remote English|Español local/ })).toHaveCount(0);
  await page.getByRole('radio', { name: /English US local/ }).click();
  await page.getByRole('radio', { name: 'Velocidad 0.75×', exact: true }).click();
  await page.getByRole('button', { name: 'Probar voz', exact: true }).click();
  await expect.poll(lastSpeech).toMatchObject({ voice: 'local-us', language: 'en-US', rate: 0.75 });
  await page.getByRole('button', { name: 'Guardar configuración de voz', exact: true }).click();
  await expect(
    page.getByText('Configuración de voz guardada en este dispositivo.', { exact: true }),
  ).toBeVisible();
  await click(page, 'Cerrar configuración');
  await click(page, 'Escuchar ejemplo');
  await expect.poll(lastSpeech).toMatchObject({
    text: 'Hi! My name is Sam.',
    voice: 'local-us',
    language: 'en-US',
    rate: 0.75,
  });
  await page.reload();
  await click(page, 'Palabras del viaje');
  await click(page, 'Escuchar: Hi');
  await expect.poll(lastSpeech).toMatchObject({ text: 'Hi', voice: 'local-us', rate: 0.75 });
  await click(page, 'Configuración de voz');
  await expect(page.getByRole('radio', { name: /English US local/ })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Velocidad 0.75×', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'Predeterminada del sistema', exact: true }).click();
  await page.getByRole('radio', { name: 'Velocidad Del sistema', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar configuración de voz', exact: true }).click();
  await expect(
    page.getByText('Configuración de voz guardada en este dispositivo.', { exact: true }),
  ).toBeVisible();
  await click(page, 'Cerrar configuración');
  await click(page, 'Escuchar: Hi');
  await expect.poll(lastSpeech).toMatchObject({ text: 'Hi', voice: 'local-gb', rate: 1 });
});

test('Spanish system defaults cannot change English playback or enable Spanish-only voices', async ({
  page,
}) => {
  await installSpeechFixture(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'language', { value: 'es-MX', configurable: true });
    Object.defineProperty(navigator, 'languages', { value: ['es-MX'], configurable: true });
    for (const voice of (window as any).__speechVoices) voice.default = voice.lang === 'es-MX';
  });
  await enterApp(page);
  await previewVoice(page);
  await expect
    .poll(() => page.evaluate(() => (window as any).__speechCalls.at(-1)))
    .toMatchObject({ voice: 'local-us', language: 'en-US' });
  await page.evaluate(() => {
    const fixture = window as any;
    fixture.__speechVoices = fixture.__speechVoices.filter((voice: any) => voice.lang === 'es-MX');
  });
  await click(page, 'Actualizar voces instaladas');
  await expect(page.getByRole('button', exact('Probar voz'))).toBeDisabled();
  expect(await page.evaluate(() => (window as any).__speechCalls.length)).toBe(1);
});

test('removed or network-only saved voices are not silently replaced; playback errors have feedback', async ({
  page,
}) => {
  await installSpeechFixture(page);
  await page.addInitScript(() =>
    localStorage.setItem('lq_setting:speech', JSON.stringify({ voice: 'cloud-us', rate: 1 })),
  );
  await enterApp(page);
  await click(page, 'Configuración');
  expect(await page.evaluate(() => (window as any).__speechCalls)).toEqual([]);
  await expect(page.getByText(/La voz guardada ya no está disponible/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Probar voz', exact: true })).toBeDisabled();
  await page.getByRole('radio', { name: 'Predeterminada del sistema', exact: true }).click();
  await page.evaluate(() => {
    (window as any).__speechFailure = true;
  });
  await page.getByRole('button', { name: 'Probar voz', exact: true }).click();
  await expect(page.getByText(/No pudimos usar una voz de inglés sin conexión/)).toBeVisible();
  await click(page, 'Cerrar configuración');
  await click(page, 'Palabras del viaje');
  await click(page, 'Escuchar: Hi');
  await expect(page.getByText(/No pudimos usar una voz de inglés sin conexión/)).toBeVisible();
  await expect(page.getByText(/Estás escuchando el audio incluido/)).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__speechCalls.length)).toBe(1);
});

test('voice settings are reachable and scrollable on a phone without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installSpeechFixture(page);
  await enterApp(page);
  await page.getByRole('button', { name: 'Configuración', exact: true }).click();
  await page.getByRole('radio', { name: 'Velocidad 1.25×', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar configuración de voz', exact: true }).click();
  await expect(
    page.getByText('Configuración de voz guardada en este dispositivo.', { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await page.getByRole('button', { name: 'Cerrar configuración', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continuar viaje', exact: true })).toBeVisible();
});
