import {
  test,
  expect,
  enterApp,
  bundledCourse,
  advanceToExercise,
  chooseCorrectAnswer,
  chooseWrongAnswer,
  nextAfterFeedback,
  type ExerciseFixture,
} from './helpers';

const lesson = bundledCourse.payload.lessons.u02_l03;
const exercises = lesson.exercises as ExerciseFixture[];

for (const scenario of [
  { width: 390, height: 844, theme: 'oled' },
  { width: 360, height: 740, theme: 'light' },
  { width: 1280, height: 900, theme: 'dark' },
]) {
  test(`answer feedback keeps the mistake, answer and explanation together at ${scenario.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(scenario);
    await page.addInitScript((theme) => localStorage.setItem('lq_theme', theme), scenario.theme);
    await enterApp(page);
    // Reach the exact lesson from the reported phone screen using disposable local progress.
    const lessonIds = bundledCourse.payload.units.flatMap((unit: { lessons: { id: string }[] }) =>
      unit.lessons.map((item) => item.id),
    );
    await page.evaluate(
      (completedLessons) => {
        const local = JSON.parse(localStorage.getItem('lq_offline_state_v1')!);
        local.completedLessons = completedLessons;
        localStorage.setItem('lq_offline_state_v1', JSON.stringify(local));
      },
      lessonIds.slice(0, lessonIds.indexOf(lesson.id)),
    );
    await page.reload();
    await page.getByRole('button', { name: 'Continuar aprendiendo', exact: true }).click();

    for (const exercise of exercises) {
      await advanceToExercise(page, exercise);
      const isReportedExercise = exercise.id === 'u02_l03_practice_1';
      if (isReportedExercise) {
        await page.getByRole('textbox', { name: 'Tu respuesta en inglés' }).fill('Usually');
        // Expanded help must not keep the feedback below the screen either.
        await page.getByRole('button', { name: 'Volver a ver las palabras', exact: true }).click();
      } else await chooseWrongAnswer(page, exercise);

      await page.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click();
      const feedback = page.getByTestId('answer-feedback');
      await expect(
        feedback.getByText('Buen intento. Veamos por qué…', { exact: true }),
      ).toBeInViewport({ ratio: 1 });
      await expect(feedback.getByTestId('submitted-answer')).toBeInViewport({ ratio: 1 });
      if (exercise.options?.length) {
        const wrong = exercise.options.find((item) => item.id !== exercise.correctOptionId)!;
        await expect(feedback.getByTestId('submitted-answer')).toHaveText(
          `Tu respuesta: ${wrong.text}`,
        );
      } else if (exercise.type === 'matching') {
        const pairs = exercise.matchingPairs!;
        for (let index = 0; index < pairs.length; index++) {
          await expect(feedback.getByTestId('submitted-answer')).toContainText(
            `${pairs[index].left} → ${pairs[(index + 1) % pairs.length].right}`,
          );
        }
      } else if (exercise.type === 'reorder') {
        await expect(feedback.getByTestId('submitted-answer')).toHaveText(
          `Tu respuesta: ${exercise.tokens!.at(-1)!}`,
        );
      }

      if (isReportedExercise) {
        await expect(feedback).toBeInViewport({ ratio: 1 });
        await expect(feedback.getByText('I ____ drink water.', { exact: true })).toBeVisible();
        await expect(feedback.getByTestId('submitted-answer')).toHaveText('Tu respuesta: Usually');
        await expect(
          feedback.getByText('Una respuesta posible: always', { exact: true }),
        ).toBeInViewport({ ratio: 1 });
        await expect(
          feedback.getByText(/Always significa siempre y va antes de drink\./),
        ).toBeInViewport({ ratio: 1 });
        await expect(page.getByRole('textbox')).not.toBeFocused();
        const footer = await page.getByTestId('flow-footer').boundingBox();
        const card = await feedback.boundingBox();
        expect(card!.y + card!.height).toBeLessThanOrEqual(footer!.y);

        await page.getByRole('button', { name: 'Intentar otra vez', exact: true }).click();
        await expect(feedback).toHaveCount(0);
        await expect
          .poll(() => page.getByTestId('flow-scroll').evaluate((el) => el.scrollTop))
          .toBe(0);
        await expect(page.getByRole('textbox')).toHaveValue('');
        await chooseCorrectAnswer(page, exercise);
        await page.getByRole('button', { name: 'Comprobar respuesta', exact: true }).click();
        await expect(feedback.getByText('¡Muy bien!', { exact: true })).toBeInViewport({
          ratio: 1,
        });
        await expect(feedback.getByTestId('submitted-answer')).toHaveCount(0);
      }
      await nextAfterFeedback(page);
      await expect
        .poll(() => page.getByTestId('flow-scroll').evaluate((el) => el.scrollTop))
        .toBe(0);
    }
  });
}
