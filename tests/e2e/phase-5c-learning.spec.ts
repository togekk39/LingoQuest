import { readFileSync } from 'node:fs';
import { getUnifiedMastery } from '@lingoquest/offline-engine';
import type { Page } from '@playwright/test';
import {
  answerTravelText,
  click,
  enterApp,
  exact,
  expect,
  finishGreetingPractice,
  openTravelWriting,
  readyOfflineShell,
  state,
  test,
} from './helpers';

const introWriting = { targetId: 'home.introduce', dimension: 'writing' };
const studyWriting = 'u01_l01_practice_4';
const checkAnswer = 'Comprobar respuesta';
const answerInput = (page: Page, exerciseId: string) =>
  page.getByTestId(`exercise-${exerciseId}`).getByRole('textbox', exact('Tu respuesta en inglés'));

const evidence = async (page: Page) => (await state(page)).unifiedLearning.evidence;
const writingReview = (page: Page) =>
  page
    .getByTestId('learning-review-writing:home.introduce')
    .getByRole('button', { name: /^Abrir repaso rápido:/ });

async function openSharedSkills(page: Page) {
  await page.getByRole('tab', exact('Aprender')).click();
  await click(page, 'Mis habilidades');
}

async function openSamIntroduction(page: Page) {
  await click(page, 'Comenzar mi aventura');
  const skipName = page.getByRole('button', exact('Continuar sin nombre'));
  const plaza = page.getByTestId('story-scene-plaza');
  await expect(skipName.or(plaza)).toBeVisible();
  if (await skipName.isVisible()) await skipName.click();
  await expect(plaza).toBeVisible();
  await click(page, 'Omitir guía');
  await page.getByTestId('story-hotspot-plaza-sam').click();
  for (const choice of [
    'greet-sam-in-english',
    'greet-luz-in-english',
    'reply-to-luz',
    'continue-opening-with-sam',
    'introduce-yourself',
  ]) {
    await page.getByTestId(`story-choice-${choice}`).click();
  }
  await expect(page.getByTestId('story-learning')).toBeVisible();
}

async function openTextbookLesson(page: Page, resume = false) {
  await page.getByRole('tab', exact('Aprender')).click();
  await click(page, 'Cursos A1–A2');
  await click(page, '¡Hola! Mucho gusto');
  await page
    .getByTestId('textbook-lesson-u01_l01')
    .getByRole('button', exact(resume ? 'Continuar lección' : 'Empezar lección'))
    .click();
}

async function finishStudyExercise(page: Page, next: string) {
  await click(page, checkAnswer);
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  await click(page, next);
}

async function reachTextbookWriting(page: Page, storyWritingVerified = false) {
  await openTextbookLesson(page);
  if (storyWritingVerified) {
    const status = page.getByTestId('study-learning-status');
    await expect(status.getByTestId('study-status-writing')).toHaveText(
      'Escritura · 1 objetivo demostrado',
    );
    await expect(status.getByTestId('study-status-listening')).toHaveText(
      'Escucha · Por comprobar',
    );
    await expect(status.getByTestId('study-status-speaking')).toHaveText('Habla · Por comprobar');
  }
  await click(page, 'Conocer las palabras');
  for (let position = 1; position < 8; position++) await click(page, 'Siguiente palabra');
  await click(page, 'Practicar estas palabras');
  for (const meaning of [
    'hola',
    'hola (informal)',
    'adiós',
    'yo',
    'tú; usted; ustedes',
    'mi',
    'nombre',
    'amigo o amiga',
  ]) {
    await page.getByRole('radio', exact(meaning)).click();
    await finishStudyExercise(page, 'Siguiente ejercicio');
  }
  for (const [word, meaning] of [
    ['hello', 'hola'],
    ['you', 'tú; usted; ustedes'],
    ['friend', 'amigo o amiga'],
  ]) {
    await click(page, `Relacionar: ${word}`);
    await click(page, `Significado: ${meaning}`);
  }
  await finishStudyExercise(page, 'Continuar');
  await click(page, 'Leer la conversación');
  await click(page, 'Vamos a practicar');
  for (const answer of ['am', 'are', 'hello']) {
    await page.getByRole('textbox', exact('Tu respuesta en inglés')).fill(answer);
    await finishStudyExercise(page, 'Siguiente ejercicio');
  }
  await expect(answerInput(page, studyWriting)).toBeVisible();
}

async function exportBackup(page: Page) {
  const download = page.waitForEvent('download');
  await click(page, 'Exportar mis datos');
  return JSON.parse(readFileSync((await (await download).path())!, 'utf8'));
}

async function restoreBackup(page: Page, backup: object) {
  const picker = page.waitForEvent('filechooser');
  await click(page, 'Restaurar respaldo');
  await (
    await picker
  ).setFiles({
    name: 'lingoquest-respaldo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await click(page, 'Reemplazar con este respaldo');
  await expect(page.getByText('Respaldo restaurado en este dispositivo.')).toBeVisible();
}

test('Story shows same-day writing transfer and Study and Review keep evidence separate by ability', async ({
  page,
  context,
}) => {
  const start = Date.UTC(2026, 10, 20, 17);
  await page.clock.setFixedTime(start);
  await enterApp(page);
  await readyOfflineShell(page, context);
  await openSamIntroduction(page);
  expect((await evidence(page)).every(({ independent }) => !independent)).toBe(true);

  await click(page, 'Siguiente palabra');
  await click(page, 'Siguiente palabra');
  await click(page, 'Ver la explicación');
  await click(page, 'Escuchar a Sam');
  await finishGreetingPractice(page);
  await answerTravelText(page, 'travel_hello_write', 'Hi! My name is Ana.');
  await answerTravelText(page, 'travel_hello_transfer', 'I am Ana.');
  await click(page, 'Ahora no puedo hablar');

  const writing = (await evidence(page)).filter(
    ({ source, independent, targets }) =>
      source === 'story' &&
      independent &&
      targets.some(
        ({ targetId, dimension }) => targetId === introWriting.targetId && dimension === 'writing',
      ),
  );
  expect(writing.map(({ exerciseId }) => exerciseId)).toEqual([
    'travel_hello_write',
    'travel_hello_transfer',
  ]);
  expect(new Set(writing.map(({ contextId }) => contextId)).size).toBe(2);
  const learning = (await state(page)).unifiedLearning;
  expect(getUnifiedMastery(learning, introWriting.targetId, 'writing')).toMatchObject({
    state: 'demonstrated',
    retention: 'unverified',
    transfer: 'verified',
    delayedSuccesses: 0,
    transferSuccesses: 1,
  });
  for (const dimension of ['listening', 'speaking'] as const) {
    expect(getUnifiedMastery(learning, introWriting.targetId, dimension).independentSuccesses).toBe(
      0,
    );
  }

  await page.getByTestId('story-dialogue-close').click();
  await click(page, 'Cerrar y volver');
  await reachTextbookWriting(page, true);
  await click(page, 'Omitir ejercicio que ya dominas');
  await expect(page.getByTestId('lesson-stage-speaking')).toBeVisible();
  expect((await state(page)).completedLessons).not.toContain('u01_l01');
  expect(
    (await evidence(page)).some(
      ({ exerciseId, independent }) => exerciseId === studyWriting && independent,
    ),
  ).toBe(false);

  await page.reload();
  await openSharedSkills(page);
  const writingCard = page.getByTestId('learning-review-writing:home.introduce');
  await expect(
    writingCard.getByText('La aplicaste en otra situación', { exact: true }),
  ).toBeVisible();
  await expect(writingCard.getByText('Retención aún sin verificar', { exact: true })).toBeVisible();

  await page.clock.setFixedTime(start + 2 * 86_400_000);
  await page.reload();
  await openSharedSkills(page);
  await writingReview(page).click();
  await expect(page.getByText('Recuerda lo aprendido · 1 min', { exact: true })).toBeVisible();
  await answerInput(page, 'travel_review_introduction').fill('My name is Ana.');
  await click(page, checkAnswer);
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  expect(
    getUnifiedMastery((await state(page)).unifiedLearning, introWriting.targetId, 'writing'),
  ).toMatchObject({
    state: 'demonstrated',
    retention: 'verified',
    transfer: 'verified',
    delayedSuccesses: 1,
    transferSuccesses: 2,
  });
  expect(
    (await evidence(page)).find(({ exerciseId }) => exerciseId === 'travel_review_introduction'),
  ).toMatchObject({
    source: 'review',
    independent: true,
    targets: expect.arrayContaining([introWriting]),
  });
  await click(page, 'Volver al viaje');
  await expect(
    writingCard.getByText('La recordaste después de un tiempo', { exact: true }),
  ).toBeVisible();
  await expect(
    writingCard.getByText('La aplicaste en otra situación', { exact: true }),
  ).toBeVisible();
});

test('Study saves an assisted answer and a restart draft, and Story keeps its own story path', async ({
  page,
  context,
}) => {
  await enterApp(page);
  await readyOfflineShell(page, context);
  await reachTextbookWriting(page);
  await click(page, 'Volver a ver las palabras');
  const input = answerInput(page, studyWriting);
  const answer = 'Hello! My name is Ana.';
  await input.fill(answer);
  await expect
    .poll(async () => (await state(page)).lessonCheckpoints?.u01_l01?.answer.text)
    .toBe(answer);
  await page.reload();
  await openTextbookLesson(page, true);
  await expect(input).toHaveValue(answer);
  const submit = page.getByRole('button', exact(checkAnswer));
  await submit.evaluate((button: HTMLElement) => {
    button.click();
    button.click();
  });
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();

  const answers = (await evidence(page)).filter(({ exerciseId }) => exerciseId === studyWriting);
  expect(answers).toHaveLength(1);
  expect(answers[0]).toMatchObject({
    source: 'study',
    outcome: 'target',
    independent: false,
    aids: expect.arrayContaining(['hint']),
    targets: expect.arrayContaining([introWriting]),
  });
  await click(page, 'Cerrar y volver');
  await click(page, 'Cerrar y volver');
  await click(page, 'Cerrar y volver');
  await page.getByRole('tab', exact('Inicio')).click();
  await openSamIntroduction(page);
  await click(page, 'Siguiente palabra');
  await click(page, 'Siguiente palabra');
  await click(page, 'Ver la explicación');
  await click(page, 'Escuchar a Sam');
  await finishGreetingPractice(page);
  await answerTravelText(page, 'travel_hello_write', 'Hi! My name is Ana.');
  const saved = await evidence(page);
  expect(saved.find(({ exerciseId }) => exerciseId === 'travel_hello_write')).toMatchObject({
    source: 'story',
    outcome: 'target',
    independent: true,
    targets: expect.arrayContaining([introWriting]),
  });
  expect(saved.filter(({ exerciseId }) => exerciseId === studyWriting)).toEqual(answers);
  expect(
    getUnifiedMastery((await state(page)).unifiedLearning, introWriting.targetId, 'writing'),
  ).toMatchObject({
    state: 'independent_performance',
    independentSuccesses: 1,
    assistedSuccesses: 1,
  });
  expect((await state(page)).travel.stamps).toEqual({});

  await click(page, 'Cerrar y volver');
  await openSharedSkills(page);
  await writingReview(page).click();
  await page.getByRole('textbox', exact('Tu respuesta en inglés')).fill('I am Ana.');
  await click(page, checkAnswer);
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  const writingSources = (await evidence(page))
    .filter(
      ({ activity, targets }) =>
        activity === 'answer' &&
        targets.some(
          ({ targetId, dimension }) =>
            targetId === introWriting.targetId && dimension === introWriting.dimension,
        ),
    )
    .map(({ source }) => source);
  expect(new Set(writingSources)).toEqual(new Set(['study', 'story', 'review']));
  await click(page, 'Volver al viaje');
  await click(page, 'Cerrar y volver');
  await page.getByRole('tab', exact('Perfil')).click();
  const current = await exportBackup(page);
  const beforeRestore = (await state(page)).unifiedLearning;
  await restoreBackup(page, current);
  const restored = (await state(page)).unifiedLearning;
  expect(restored).toEqual(beforeRestore);
  expect(new Set(restored.evidence.map(({ id }) => id)).size).toBe(restored.evidence.length);
});

test('guided repair requires success and restores the same stage and draft after restart', async ({
  page,
  context,
}) => {
  const start = Date.UTC(2026, 10, 20, 17);
  await page.clock.setFixedTime(start);
  await enterApp(page);
  await readyOfflineShell(page, context);
  await openTravelWriting(page);
  await answerTravelText(page, 'travel_hello_write', 'Hi! My name is Ana.');
  await answerTravelText(page, 'travel_hello_transfer', 'I am Ana.');
  await click(page, 'Cerrar y volver');

  await page.clock.setFixedTime(start + 2 * 86_400_000);
  await page.reload();
  await openSharedSkills(page);
  await writingReview(page).click();
  await answerInput(page, 'travel_review_introduction').fill('I is Ana.');
  await click(page, checkAnswer);
  await expect(page.getByTestId('answer-feedback')).toContainText('Elige la forma de be');
  const forgotten = getUnifiedMastery(
    (await state(page)).unifiedLearning,
    introWriting.targetId,
    'writing',
  );
  expect(forgotten).toMatchObject({
    state: 'demonstrated',
    needsReview: true,
    independentSuccesses: 2,
    pendingErrors: ['be_agreement'],
  });
  await click(page, 'Volver al viaje');
  await writingReview(page).click();
  await expect(page.getByText('Revisa esta idea', { exact: true })).toBeVisible();
  const guided = answerInput(page, 'travel_remedy_introduction_be');
  await guided.fill('is');
  await click(page, checkAnswer);
  const feedback = page.getByTestId('answer-feedback');
  await expect(feedback).toBeVisible();
  await expect(page.getByRole('button', exact('Probar otra escena'))).toHaveCount(0);
  await expect(page.getByRole('button', exact('Intentar otra vez'))).toBeVisible();

  await page.reload();
  await openSharedSkills(page);
  await writingReview(page).click();
  await expect(page.getByText('Revisa esta idea', { exact: true })).toBeVisible();
  await expect(feedback).toBeVisible();
  await expect(page.getByRole('button', exact('Probar otra escena'))).toHaveCount(0);
  await click(page, 'Intentar otra vez');
  await guided.fill('am');
  await click(page, checkAnswer);
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  await click(page, 'Probar otra escena');
  await expect(page.getByTestId('exercise-travel_remedy_introduction_be')).toHaveCount(0);
  const independent = page.getByRole('textbox', exact('Tu respuesta en inglés'));
  await independent.fill('Hi! I am Ana.');
  await click(page, 'Cerrar y volver');
  await page.reload();
  await click(page, 'Repaso rápido');
  await expect(independent).toHaveValue('Hi! I am Ana.');
  await expect(page.getByTestId('exercise-travel_remedy_introduction_be')).toHaveCount(0);
  await click(page, checkAnswer);
  await expect(page.getByText('¡Muy bien!', { exact: true })).toBeVisible();
  expect(
    getUnifiedMastery((await state(page)).unifiedLearning, introWriting.targetId, 'writing'),
  ).toMatchObject({ independentSuccesses: 3, pendingErrors: [] });
  const remediation = (await evidence(page)).filter(({ source }) => source === 'remediation');
  expect(remediation.map(({ independent, outcome }) => [independent, outcome])).toEqual([
    [false, 'incorrect'],
    [false, 'target'],
    [true, 'target'],
  ]);
  expect(new Set(remediation.map(({ contextId }) => contextId)).size).toBe(2);
});

test('an earlier format 2 backup restores completion, stamp, challenge progress and a draft', async ({
  page,
}) => {
  await enterApp(page);
  await page.getByRole('tab', exact('Perfil')).click();
  const backup = await exportBackup(page);
  delete backup.state.unifiedLearning;
  const date = backup.exportedAt;
  const scheduled = new Date(Date.parse(date) + 86_400_000).toISOString();
  backup.state.xp = 27;
  backup.state.completedLessons = ['u01_l01'];
  backup.state.attempts = {
    'old-intro-answer': {
      fingerprint: 'historical-answer',
      result: { correct: true, feedbackEs: 'Muy bien.', xpAwarded: 5, pending: false },
    },
  };
  backup.state.mastery = [
    {
      skillId: 'grammar.be_i_you',
      targetId: 'grammar.be_i_you',
      dimension: 'grammar_production',
      practicedFormats: ['short_text'],
      practicedExerciseIds: [studyWriting],
      value: 0.9,
      evidenceCount: 4,
      unpromptedSuccessCount: 4,
      lastPracticedAt: date,
      nextReviewAt: scheduled,
      lastDelayedSuccessAt: date,
    },
  ];
  backup.state.travel.stamps.home = date;
  backup.state.travel.completed = { hello: date, bus: date, bag: date };
  backup.state.challengeProgress = [
    {
      trackId: 'present_simple',
      type: 'grammar_rush',
      mode: 'practice',
      highestLevel: 1,
      bestScores: { '1': 150 },
      badge: false,
    },
  ];
  backup.state.lessonCheckpoints = {
    u01_l02: {
      eventId: 'old-event-1',
      activityId: 'old-lesson-1',
      stage: 0,
      vocabulary: 0,
      exercise: -1,
      answer: { text: 'my old draft' },
      hint: false,
      help: false,
      xp: 0,
      weak: [],
      reviewAt: null,
    },
  };
  await restoreBackup(page, backup);
  const restored = await exportBackup(page);
  expect(restored.state).toMatchObject({
    xp: backup.state.xp,
    completedLessons: backup.state.completedLessons,
    attempts: backup.state.attempts,
    mastery: backup.state.mastery,
    travel: { stamps: backup.state.travel.stamps, completed: backup.state.travel.completed },
    challengeProgress: backup.state.challengeProgress,
    lessonCheckpoints: backup.state.lessonCheckpoints,
  });
  expect((await evidence(page)).some(({ independent }) => independent)).toBe(false);
  const learning = (await state(page)).unifiedLearning;
  expect(learning.legacySchedules).toContainEqual({
    targetId: 'grammar.be_i_you',
    dimension: 'grammar_production',
    nextReviewAt: scheduled,
    lastPracticedAt: date,
  });
  expect(getUnifiedMastery(learning, 'grammar.be_i_you', 'grammar_production')).toMatchObject({
    state: 'not_introduced',
    retention: 'unverified',
    transfer: 'unverified',
    independentSuccesses: 0,
    legacy: true,
  });
});
