import { test, expect, enterApp } from './helpers';
import type { Page } from '@playwright/test';

async function openPractice(page: Page) {
  await enterApp(page);
  await page.getByRole('button', { name: 'Practicar pronunciación', exact: true }).click();
  await page
    .getByRole('button', { name: /^Practicar: / })
    .first()
    .click();
}

async function installRecognition(page: Page) {
  await page.addInitScript(() => {
    const fixture = window as any;
    fixture.__recognizers = [];
    class Recognition extends EventTarget {
      lang = '';
      interimResults = false;
      continuous = true;
      maxAlternatives = 0;
      aborted = false;
      start() {
        fixture.__recognizers.push(this);
        this.dispatchEvent(new Event('start'));
      }
      stop() {
        this.dispatchEvent(new Event('end'));
      }
      abort() {
        this.aborted = true;
        this.dispatchEvent(new Event('end'));
      }
      result(text: string, final: boolean) {
        const results = Object.assign([{ transcript: text, confidence: 0.9 }], { isFinal: final });
        this.dispatchEvent(
          Object.assign(new Event('result'), { resultIndex: 0, results: [results] }),
        );
      }
      fail(error: string) {
        this.dispatchEvent(Object.assign(new Event('error'), { error, message: error }));
        this.dispatchEvent(new Event('end'));
      }
    }
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: Recognition,
    });
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: Recognition });
  });
}

test('system STT receives English, displays interim/final text, stops, retries and aborts on leaving', async ({
  page,
}) => {
  await installRecognition(page);
  await openPractice(page);
  await expect(page.getByText(/puede procesar tu audio en línea/)).toBeVisible();
  await page.getByRole('button', { name: 'Practicar con mi voz', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Terminar reconocimiento', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => {
      const r = (window as any).__recognizers.at(-1);
      return { lang: r.lang, interim: r.interimResults, continuous: r.continuous };
    }),
  ).toEqual({ lang: 'en-US', interim: true, continuous: false });
  await page.evaluate(() => (window as any).__recognizers.at(-1).result('Hello', false));
  await expect(page.getByText('Hello', { exact: true })).toBeVisible();
  await page.evaluate(() => (window as any).__recognizers.at(-1).result('Hello world', true));
  await expect(page.getByText('Hello world', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Terminar reconocimiento', exact: true }).click();
  await page.getByRole('button', { name: 'Practicar con mi voz', exact: true }).click();
  await expect(page.getByText('Hello world', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ahora no puedo hablar', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__recognizers.at(-1).aborted)).toBe(true);
  expect(
    await page.evaluate(() =>
      Object.values(localStorage).some((v) => String(v).includes('Hello world')),
    ),
  ).toBe(false);
});

for (const [code, feedback] of [
  ['not-allowed', /Permite el micrófono y el reconocimiento/],
  ['audio-capture', /otra aplicación no lo esté usando/],
  ['network', /necesita conexión/],
  ['no-speech', /No reconocimos palabras/],
  ['language-not-supported', /Instala o activa inglés/],
] as const) {
  test(`STT ${code} has actionable feedback and permits retry`, async ({ page }) => {
    await installRecognition(page);
    await openPractice(page);
    await page.getByRole('button', { name: 'Practicar con mi voz', exact: true }).click();
    await page.evaluate((error) => (window as any).__recognizers.at(-1).fail(error), code);
    await expect(page.getByText(feedback)).toBeVisible();
    await page.getByRole('button', { name: 'Practicar con mi voz', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Terminar reconocimiento', exact: true }),
    ).toBeVisible();
    await expect(page.getByText(feedback)).toHaveCount(0);
  });
}

test('unsupported browser offers local recording and lesson exit', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: undefined });
  });
  await openPractice(page);
  await page.getByRole('button', { name: 'Practicar con mi voz', exact: true }).click();
  await expect(page.getByText(/Activa el servicio de voz del sistema/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Solo grabar y escuchar (sin reconocimiento)', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Ahora no puedo hablar', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Practicar: / }).first()).toBeVisible();
});

test('silence with automatic end permits another attempt', async ({ page }) => {
  await installRecognition(page);
  await openPractice(page);
  await page.getByRole('button', { name: 'Practicar con mi voz', exact: true }).click();
  await page.evaluate(() => (window as any).__recognizers.at(-1).stop());
  await expect(page.getByText(/No reconocimos palabras/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Practicar con mi voz', exact: true }),
  ).toBeEnabled();
});

test('local recording starts, saves, allows replay and revokes the recording on exit', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const fixture = window as any;
    fixture.__revoked = [];
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (uri: string) => {
      fixture.__revoked.push(uri);
      revoke(uri);
    };
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        const audio = new AudioContext();
        const destination = audio.createMediaStreamDestination();
        const oscillator = audio.createOscillator();
        oscillator.connect(destination);
        oscillator.start();
        return destination.stream;
      },
    });
  });
  await openPractice(page);
  await page
    .getByRole('button', { name: 'Solo grabar y escuchar (sin reconocimiento)', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Terminar grabación', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Practicar con mi voz', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Terminar grabación', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Escuchar mi grabación', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Escuchar mi grabación', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar con mi lección', exact: true }).click();
  expect(
    await page.evaluate(() =>
      (window as any).__revoked.some((uri: string) => uri.startsWith('blob:')),
    ),
  ).toBe(true);
});
