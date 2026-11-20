import { test, expect, enterApp, openTravelWriting, answerTravelText, click } from './helpers';
import type { Page } from '@playwright/test';

async function openPractice(page: Page) {
  await enterApp(page);
  await page.getByRole('button', { name: 'Practicar pronunciación', exact: true }).click();
  await page
    .getByRole('button', { name: /^Practicar: / })
    .first()
    .click();
  await expect(page.getByRole('button', { name: 'Practicar con mi voz', exact: true })).toHaveCount(
    0,
  );
  await click(page, 'Ver opción de reconocimiento que puede usar internet');
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
  await page.setViewportSize({ width: 360, height: 580 });
  await installRecognition(page);
  await openPractice(page);
  await expect(page.getByText(/puede procesar tu audio en línea/)).toBeVisible();
  await page.getByRole('button', { name: 'Practicar con mi voz', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Terminar reconocimiento', exact: true }),
  ).toBeVisible();
  const liveTranscript = page.getByTestId('speech-transcript');
  await expect(liveTranscript.getByText('Transcripción en vivo')).toBeVisible();
  await expect(liveTranscript.getByText(/Te escuchamos/)).toBeVisible();
  await expect(liveTranscript).toBeInViewport({ ratio: 0.95 });
  expect(
    await page.evaluate(() => {
      const r = (window as any).__recognizers.at(-1);
      return { lang: r.lang, interim: r.interimResults, continuous: r.continuous };
    }),
  ).toEqual({ lang: 'en-US', interim: true, continuous: false });
  await page.evaluate(() => (window as any).__recognizers.at(-1).result('Hello', false));
  await expect(liveTranscript.getByText('Hello', { exact: true })).toBeVisible();
  await page.evaluate(() => (window as any).__recognizers.at(-1).result('Hello there', false));
  await expect(liveTranscript.getByText('Hello there', { exact: true })).toBeVisible();
  await expect(liveTranscript.getByText('Hello', { exact: true })).toHaveCount(0);
  await expect(liveTranscript).toBeInViewport({ ratio: 0.95 });
  await expect(page.getByText('Gramática de la lección')).toHaveCount(0);
  await page.evaluate(() => (window as any).__recognizers.at(-1).result('Hello world', true));
  await expect(page.getByText('Hello world', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Terminar reconocimiento', exact: true }).click();
  await expect(liveTranscript.getByText('Esto entendió el sistema')).toBeVisible();
  await expect(page.getByText('Contenido de la frase')).toBeVisible();
  await expect(page.getByText('Gramática de la lección')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar con mi lección' })).toBeDisabled();
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

test('unsupported browser offers an explicit skip', async ({ page }) => {
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
  await expect(page.getByRole('button', { name: 'Continuar con mi lección' })).toBeDisabled();
  await page.getByRole('button', { name: 'Ahora no puedo hablar', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Practicar: / }).first()).toBeVisible();
});

test('silence with automatic end permits another attempt', async ({ page }) => {
  await installRecognition(page);
  await openPractice(page);
  await page.getByRole('button', { name: 'Practicar con mi voz', exact: true }).click();
  await page.evaluate(() => (window as any).__recognizers.at(-1).stop());
  await expect(page.getByText(/No reconocimos palabras/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar con mi lección' })).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Practicar con mi voz', exact: true }),
  ).toBeEnabled();
});

test('only a completed matching final transcript enables continuation', async ({ page }) => {
  await installRecognition(page);
  await openPractice(page);
  const continueButton = page.getByRole('button', { name: 'Continuar con mi lección' });
  await expect(continueButton).toBeDisabled();
  await click(page, 'Practicar con mi voz');
  await page.evaluate(() =>
    (window as any).__recognizers.at(-1).result("Hi! My name's Sam.", false),
  );
  await click(page, 'Terminar reconocimiento');
  await expect(continueButton).toBeDisabled();

  await click(page, 'Practicar con mi voz');
  await page.evaluate(() =>
    (window as any).__recognizers.at(-1).result("Hi! My name's Sam.", true),
  );
  await expect(continueButton).toBeDisabled();
  await click(page, 'Terminar reconocimiento');
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
  await expect(page.getByRole('button', { name: /^Practicar: / }).first()).toBeVisible();
});

test('travel speaking on an unsupported platform skips directly without opening the microphone', async ({
  page,
}) => {
  await installRecognition(page);
  await page.addInitScript(() => {
    const fixture = window as any;
    fixture.__microphoneRequests = 0;
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        fixture.__microphoneRequests++;
        throw new Error('Microphone unavailable');
      },
    });
  });
  await enterApp(page);
  await openTravelWriting(page);
  await answerTravelText(page, 'travel_hello_write', 'Hi! I am Maya.');
  await answerTravelText(page, 'travel_hello_transfer', "I'm Maya.");
  await expect(
    page.getByText(/reconocimiento de voz de la misión está disponible en Android/),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Ver opción de reconocimiento que puede usar internet' }),
  ).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Completar misión', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Solo grabar|mi grabación/ })).toHaveCount(0);
  await click(page, 'Ahora no puedo hablar');
  await expect(page.getByText('¡Misión completada!')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__recognizers.length)).toBe(0);
  expect(await page.evaluate(() => (window as any).__microphoneRequests)).toBe(0);
});

test('audio preparation failure is recoverable instead of escaping the speaking button', async ({
  page,
}) => {
  const uncaught: string[] = [];
  page.on('pageerror', (error) => uncaught.push(error.message));
  await installRecognition(page);
  await page.addInitScript(() => {
    const pause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = function () {
      if ((window as any).__failPracticePause) throw new Error('Audio preparation failed');
      pause.call(this);
    };
  });
  await openPractice(page);
  await page.evaluate(() => {
    (window as any).__failPracticePause = true;
  });
  await page.getByRole('button', { name: 'Practicar con mi voz', exact: true }).click();
  await expect(page.getByText(/No pudimos preparar el audio/)).toBeVisible();
  expect(uncaught).toEqual([]);
  await page.evaluate(() => {
    (window as any).__failPracticePause = false;
  });
  await page.getByRole('button', { name: 'Practicar con mi voz', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Terminar reconocimiento', exact: true }),
  ).toBeVisible();
});
