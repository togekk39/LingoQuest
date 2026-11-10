import type { Page } from '@playwright/test';
import { test, expect, enterApp } from './helpers';

async function installOverlayViewport(page: Page) {
  await page.addInitScript(() => {
    const viewport = new EventTarget();
    Object.defineProperties(viewport, {
      height: { value: window.innerHeight, configurable: true },
      offsetTop: { value: 0 },
      scale: { value: 1 },
    });
    Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true });
  });
}

async function setKeyboardTop(page: Page, top: number | null) {
  await page.evaluate((top) => {
    // The layout viewport never shrinks here: this reproduces an overlay keyboard.
    Object.defineProperty(window.visualViewport, 'height', {
      value: top ?? window.innerHeight,
      configurable: true,
    });
    window.visualViewport!.dispatchEvent(new Event('resize'));
    document.querySelector('[data-testid="overlay-keyboard"]')?.remove();
    if (top !== null) {
      const keyboard = document.createElement('div');
      keyboard.dataset.testid = 'overlay-keyboard';
      keyboard.style.cssText = `position:fixed;top:${top}px;bottom:0;left:0;right:0;background:#222;z-index:9999`;
      document.body.append(keyboard);
    }
  }, top);
}

async function openShortTextPage(page: Page) {
  await enterApp(page);
  await page.getByRole('tab', { name: 'Aprender', exact: true }).click();
  await page.getByRole('button', { name: 'Explorar mi nivel', exact: true }).click();
  await page.getByRole('button', { name: 'Explorar mi nivel', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Tu respuesta en inglés' })).toBeVisible();
}

async function expectInputAboveKeyboard(page: Page, keyboardTop: number) {
  await expect
    .poll(async () => {
      const [input, scroll, footer] = await Promise.all([
        page.getByRole('textbox', { name: 'Tu respuesta en inglés' }).boundingBox(),
        page.getByTestId('flow-scroll').boundingBox(),
        page.getByTestId('flow-footer').boundingBox(),
      ]);
      return (
        !!input &&
        !!scroll &&
        !!footer &&
        input.y >= scroll.y &&
        input.y + input.height <= footer.y &&
        footer.y + footer.height <= keyboardTop + 1
      );
    })
    .toBe(true);
}

test('an overlay keyboard creates room on an initially unscrollable short page', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installOverlayViewport(page);
  await openShortTextPage(page);
  const input = page.getByRole('textbox', { name: 'Tu respuesta en inglés' });
  const scroll = page.getByTestId('flow-scroll');
  await expect.poll(() => scroll.evaluate((node) => node.scrollHeight - node.clientHeight)).toBe(0);
  const before = await input.boundingBox();
  await input.focus();
  const keyboardTop = 430;
  expect(before!.y + before!.height).toBeGreaterThan(keyboardTop);
  await setKeyboardTop(page, keyboardTop);
  // This assertion must pass without any page.setViewportSize call after opening the keyboard.
  expect(await page.evaluate(() => window.innerHeight)).toBe(844);
  await expectInputAboveKeyboard(page, keyboardTop);
  await expect
    .poll(async () => (await page.getByTestId('keyboard-spacer').boundingBox())?.height)
    .toBe(414);
  await expect
    .poll(() => scroll.evaluate((node) => node.scrollHeight - node.clientHeight))
    .toBeGreaterThan(0);
  await input.pressSequentially('I can see what I type.');
  await expect(input).toBeFocused();
  await expectInputAboveKeyboard(page, keyboardTop);

  // A keyboard height change must also update the reserved space.
  await setKeyboardTop(page, 390);
  await expectInputAboveKeyboard(page, 390);
  await expect
    .poll(async () => (await page.getByTestId('keyboard-spacer').boundingBox())?.height)
    .toBe(454);
  await setKeyboardTop(page, null);
  await expect
    .poll(async () => (await page.getByTestId('keyboard-spacer').boundingBox())?.height)
    .toBe(0);
  await expect(input).toHaveValue('I can see what I type.');
  await expect.poll(() => scroll.evaluate((node) => node.scrollHeight - node.clientHeight)).toBe(0);
  await setKeyboardTop(page, keyboardTop);
  await expectInputAboveKeyboard(page, keyboardTop);
  await page.getByRole('button', { name: 'Siguiente pregunta', exact: true }).click();
  await expect(page.getByText('Pregunta 2 de 12', { exact: true })).toBeVisible();
});

test('an OS-resized window removes the overlap spacer instead of reserving keyboard space twice', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installOverlayViewport(page);
  await openShortTextPage(page);
  await page.getByRole('textbox', { name: 'Tu respuesta en inglés' }).focus();
  await setKeyboardTop(page, 430);
  await expectInputAboveKeyboard(page, 430);
  await page.setViewportSize({ width: 390, height: 430 });
  await expect
    .poll(async () => (await page.getByTestId('keyboard-spacer').boundingBox())?.height)
    .toBe(0);
  await expectInputAboveKeyboard(page, 430);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectInputAboveKeyboard(page, 430);
  await expect
    .poll(async () => (await page.getByTestId('keyboard-spacer').boundingBox())?.height)
    .toBe(414);
});
