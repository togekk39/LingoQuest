import { test, expect, enterApp, readyOfflineShell } from './helpers';
import type { Page } from '@playwright/test';

async function installSpeechFixture(page: Page) {
  await page.addInitScript(() => {
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
    fixture.__speechVoices = [
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
  });
}
async function openDrill(page: Page) {
  await page.getByRole('button', { name: 'Practicar pronunciación', exact: true }).click();
  await page
    .getByRole('button', { name: /^Practicar: / })
    .first()
    .click();
  await page.getByText('Escuchar ejemplo', { exact: true }).click();
}

test('system default local English voice works offline; saved voice and speed persist and apply to practice', async ({
  page,
  context,
}) => {
  await installSpeechFixture(page);
  await enterApp(page);
  await readyOfflineShell(page, context);
  await openDrill(page);
  await expect
    .poll(() => page.evaluate(() => (window as any).__speechCalls.at(-1)))
    .toMatchObject({ voice: 'local-gb', language: 'en-GB', rate: 1 });
  await page.reload();
  await page.getByRole('button', { name: 'Configuración', exact: true }).click();
  await expect(
    page.getByRole('radio', { name: 'Predeterminada del sistema', exact: true }),
  ).toBeChecked();
  await expect(page.getByRole('radio', { name: /Remote English|Español local/ })).toHaveCount(0);
  await page.getByRole('radio', { name: /English US local/ }).click();
  await page.getByRole('radio', { name: 'Velocidad 0.75×', exact: true }).click();
  await page.getByRole('button', { name: 'Probar voz', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__speechCalls.at(-1)))
    .toMatchObject({ voice: 'local-us', language: 'en-US', rate: 0.75 });
  await page.getByRole('button', { name: 'Guardar configuración de voz', exact: true }).click();
  await expect(
    page.getByText('Configuración de voz guardada en este dispositivo.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await openDrill(page);
  await expect
    .poll(() => page.evaluate(() => (window as any).__speechCalls.at(-1)))
    .toMatchObject({ voice: 'local-us', language: 'en-US', rate: 0.75 });
  await page.reload();
  await page.getByRole('button', { name: 'Configuración', exact: true }).click();
  await expect(page.getByRole('radio', { name: /English US local/ })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Velocidad 0.75×', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'Predeterminada del sistema', exact: true }).click();
  await page.getByRole('radio', { name: 'Velocidad Del sistema', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar configuración de voz', exact: true }).click();
  await expect(
    page.getByText('Configuración de voz guardada en este dispositivo.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar configuración', exact: true }).click();
  await openDrill(page);
  await expect
    .poll(() => page.evaluate(() => (window as any).__speechCalls.at(-1)))
    .toMatchObject({ voice: 'local-gb', language: 'en-GB', rate: 1 });
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
  await openDrill(page);
  await expect
    .poll(() => page.evaluate(() => (window as any).__speechCalls.at(-1)))
    .toMatchObject({ voice: 'local-us', language: 'en-US' });
  await page.evaluate(() => {
    const fixture = window as any;
    fixture.__speechVoices = fixture.__speechVoices.filter((voice: any) => voice.lang === 'es-MX');
  });
  await page.getByText('Escuchar ejemplo', { exact: true }).click();
  await expect(page.getByText(/No hay una voz de inglés sin conexión disponible/)).toBeVisible();
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
  await openDrill(page);
  await expect(page.getByText(/No hay una voz de inglés sin conexión disponible/)).toBeVisible();
  expect(await page.evaluate(() => (window as any).__speechCalls)).toEqual([]);
  await page.reload();
  await page.getByRole('button', { name: 'Configuración', exact: true }).click();
  await expect(page.getByText(/La voz guardada ya no está disponible/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Probar voz', exact: true })).toBeDisabled();
  await page.getByRole('radio', { name: 'Predeterminada del sistema', exact: true }).click();
  await page.evaluate(() => {
    (window as any).__speechFailure = true;
  });
  await page.getByRole('button', { name: 'Probar voz', exact: true }).click();
  await expect(page.getByText(/No hay una voz de inglés sin conexión disponible/)).toBeVisible();
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
  await expect(
    page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }),
  ).toBeVisible();
});

test('leaving practice cancels speech while the system is still loading its voices', async ({
  page,
}) => {
  await installSpeechFixture(page);
  await enterApp(page);
  await page.evaluate(() => {
    const fixture = window as any;
    fixture.__delayedVoices = fixture.__speechVoices;
    fixture.__speechVoices = [];
  });
  await openDrill(page);
  await page.getByRole('button', { name: 'Ahora no puedo hablar', exact: true }).click();
  await page.evaluate(() => {
    const fixture = window as any;
    fixture.__speechVoices = fixture.__delayedVoices;
  });
  await page.waitForFunction(() => (window as any).__voiceReads >= 2);
  expect(await page.evaluate(() => (window as any).__speechCalls)).toEqual([]);
});
