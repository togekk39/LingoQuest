import { test, expect, click, exact, enterApp } from './helpers';

for (const width of [390, 1280]) {
  test(`home leads with the next mission and offers a usable route at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await enterApp(page);

    const postcard = page.getByTestId('home-mission-postcard');
    await expect(postcard.getByText('Un saludo en la plaza', { exact: true })).toBeVisible();
    await expect(postcard.getByRole('button', exact('Continuar viaje'))).toBeInViewport();

    const route = page.getByTestId('home-route');
    await expect(route.getByRole('heading', exact('Ruta del capítulo'))).toBeVisible();
    const firstStop = route.getByRole('button', exact('Un saludo en la plaza'));
    await expect(firstStop).toBeEnabled();
    await expect(route.getByTestId('home-stop-bus')).toBeDisabled();
    await firstStop.click();
    await expect(page.getByTestId('travel-step-dialogue')).toBeVisible();
    await click(page, 'Cerrar y volver');
    await expect(postcard.getByRole('button', exact('Continuar viaje'))).toBeVisible();

    const practice = page.getByTestId('home-practice');
    await expect(practice.getByRole('heading', exact('Practicar a tu ritmo'))).toBeVisible();
    await expect(practice.getByRole('button', exact('Repaso rápido'))).toBeEnabled();
    await expect(practice.getByRole('button', exact('Practicar pronunciación'))).toBeEnabled();
    await practice.getByRole('button', exact('Palabras del viaje')).click();
    await expect(page.getByRole('button', exact('Escuchar: Hi'))).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}
