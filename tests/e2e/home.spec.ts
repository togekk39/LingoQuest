import { test, expect, click, exact, enterApp, openTravelLessons } from './helpers';

for (const width of [390, 1280]) {
  test(`home leads with the next mission and offers a usable route at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await enterApp(page);

    const postcard = page.getByTestId('home-mission-postcard');
    await expect(postcard.getByText('Un saludo en la plaza', { exact: true })).toBeVisible();
    await expect(postcard.getByRole('button', exact('Comenzar mi aventura'))).toBeInViewport();

    const route = page.getByTestId('home-route');
    await expect(route.getByRole('heading', exact('Ruta del capítulo'))).toBeVisible();
    await expect(route.getByTestId('home-stop-hello')).toHaveText(/Siguiente/);
    await expect(route.getByRole('button', exact('Un saludo en la plaza'))).toHaveCount(0);
    await page.getByRole('tab', exact('Mapa')).click();
    await expect(page.getByRole('button', exact('Comenzar mi aventura'))).toHaveCount(1);
    await expect(page.getByRole('button', exact('Un saludo en la plaza'))).toHaveCount(0);
    const lessons = await openTravelLessons(page);
    await expect(lessons.getByRole('heading', exact('Lecciones'))).toBeVisible();
    await expect(lessons.getByRole('button', exact('El bus de las ocho'))).toBeDisabled();
    await lessons.getByRole('button', exact('Un saludo en la plaza')).click();
    await expect(page.getByTestId('travel-step-dialogue')).toBeVisible();
    await click(page, 'Cerrar y volver');
    await expect(lessons.getByText('En curso', { exact: true })).toBeVisible();
    await page.getByRole('tab', exact('Inicio')).click();
    await expect(postcard.getByRole('button', exact('Comenzar mi aventura'))).toBeVisible();

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

test('the illustrated vocabulary guide offers matching and a fill-in without scoring progress', async ({
  page,
}) => {
  await enterApp(page);
  await page.getByRole('tab', exact('Aprender')).click();
  await expect(page.getByTestId('illustrated-vocabulary').first()).toBeVisible();
  await click(page, 'Relacionar palabras');
  for (const [word, meaning] of [
    ['Hi', 'hola'],
    ['I am', 'soy / estoy'],
    ['My name is', 'me llamo'],
  ]) {
    await click(page, `Relacionar: ${word}`);
    await click(page, `Significado: ${meaning}`);
  }
  await click(page, 'Comprobar parejas y frases');
  const success = page.getByText('¡Bien! Ya puedes usar lo que acabas de practicar.', {
    exact: true,
  });
  await expect(success).toBeVisible();
  await click(page, 'Volver a las palabras');
  await click(page, 'Completar una frase');
  await page.getByRole('textbox', exact('Tu respuesta en inglés')).fill('is');
  await click(page, 'Comprobar parejas y frases');
  await expect(success).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('lq_offline_state_v1')!).xp),
  ).toBe(0);
});
