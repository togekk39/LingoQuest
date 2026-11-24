import type { Page } from '@playwright/test';
import { capture, click, enterApp, exact, expect, readyOfflineShell, state, test } from './helpers';

async function openFirstUnit(page: Page) {
  await page.getByRole('tab', exact('Aprender')).click();
  await click(page, 'Cursos A1–A2');
  await click(page, '¡Hola! Mucho gusto');
}

async function checkLessonAnswer(page: Page, next: string) {
  await click(page, 'Comprobar respuesta');
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  await click(page, next);
}

test('the bundled A1–A2 course opens offline, resumes an exercise, and finishes an original lesson', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterApp(page);
  await readyOfflineShell(page, context);
  const before = await state(page);
  await openFirstUnit(page);
  const lesson = page.getByTestId('textbook-lesson-u01_l01');
  await lesson.getByRole('button', exact('Consultar vocabulario y gramática')).click();
  await expect(page.getByText('hello', { exact: true }).first()).toBeVisible();
  await capture(page, '06-legacy-reference');
  await click(page, 'Cerrar y volver');
  await lesson.getByRole('button', exact('Empezar lección')).click();
  await expect(page.getByTestId('lesson-stage-goal')).toBeVisible();
  await click(page, 'Conocer las palabras');
  for (let position = 1; position < 8; position++) await click(page, 'Siguiente palabra');
  await click(page, 'Practicar estas palabras');

  const hola = page.getByRole('radio', exact('hola'));
  await hola.click();
  await expect(hola).toBeChecked();
  await click(page, 'Cerrar y volver');
  await page.reload();
  await openFirstUnit(page);
  await lesson.getByRole('button', exact('Continuar lección')).click();
  await expect(hola).toBeChecked();
  await checkLessonAnswer(page, 'Siguiente ejercicio');
  for (const meaning of [
    'hola (informal)',
    'adiós',
    'yo',
    'tú; usted; ustedes',
    'mi',
    'nombre',
    'amigo o amiga',
  ]) {
    await page.getByRole('radio', exact(meaning)).click();
    await checkLessonAnswer(page, 'Siguiente ejercicio');
  }
  for (const [word, meaning] of [
    ['hello', 'hola'],
    ['you', 'tú; usted; ustedes'],
    ['friend', 'amigo o amiga'],
  ]) {
    await click(page, `Relacionar: ${word}`);
    await click(page, `Significado: ${meaning}`);
  }
  await checkLessonAnswer(page, 'Continuar');
  await expect(page.getByTestId('lesson-stage-grammar')).toContainText('I’m Ana');
  await click(page, 'Leer la conversación');
  await click(page, 'Vamos a practicar');
  const input = page.getByRole('textbox', exact('Tu respuesta en inglés'));
  for (const answer of ['am', 'are', 'hello']) {
    await input.fill(answer);
    await checkLessonAnswer(page, 'Siguiente ejercicio');
  }
  await input.fill('Hi! I are María-José de la Cruz.');
  await click(page, 'Comprobar respuesta');
  await expect(page.getByTestId('answer-feedback')).toContainText('Buen intento');
  await click(page, 'Intentar otra vez');
  await input.fill('hi! I’m María-José de la Cruz.');
  await checkLessonAnswer(page, 'Continuar');
  await click(page, 'Ahora no puedo hablar');
  await expect(page.getByTestId('lesson-stage-recap')).toBeVisible();
  await click(page, 'Volver a mi camino');
  const after = await state(page);
  expect(after.completedLessons).toEqual(['u01_l01']);
  expect(after.travel).toEqual(before.travel);
  expect(after.xp).toBeGreaterThan(before.xp);
});
