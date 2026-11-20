import { test, expect, click, exact, enterApp, openTravelWriting } from './helpers';

for (const width of [360, 1280]) {
  test(`travel feedback keeps the mistake, explanation and retry visible at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await enterApp(page);
    await openTravelWriting(page);
    const input = page.getByRole('textbox', exact('Tu respuesta en inglés'));
    await input.fill('Hi! I is Luz.');
    await click(page, 'Comprobar respuesta');
    const feedback = page.getByTestId('answer-feedback');
    await expect(feedback).toBeInViewport({ ratio: 0.95 });
    await expect(page.getByTestId('submitted-answer')).toHaveText(/Hi! I is Luz\./);
    await expect(page.getByRole('button', exact('Intentar otra vez'))).toBeVisible();
    await click(page, 'Intentar otra vez');
    await input.fill('Hi! I am Luz.');
    await click(page, 'Comprobar respuesta');
    await expect(feedback).toBeInViewport({ ratio: 0.95 });
    await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  });
}
