import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { judgeAnswer, type Answer, type AnswerOutcome } from '@lingoquest/contracts';
import {
  canonicalStringify,
  chapterCatalogSchema,
  parseChapterPack,
  parseCoursePack,
  sha256Hex,
  type ChapterPack,
  type CoursePayload,
} from '@lingoquest/course-pack';
import type { StoryDefinition } from '../packages/offline-engine/src/story';
import type {
  TravelChapter,
  TravelExerciseStep,
} from '../packages/offline-engine/src/travel-content';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFile(new URL(path, root), 'utf8');
const legacyCatalog = 'apps/mobile/public/chapter-packs/catalog.json';
const legacyCourse = 'content/releases/lingoquest-es419-enus-a1a2-2.1.0.lqp.json';
const auditIndex = new URL('docs/PHASE_5B_CONTENT_AUDIT.items.tsv', root);

function verifyAnswerKeys(course: CoursePayload, home: ChapterPack) {
  const runtime = home.story?.runtime;
  assert.ok(runtime, 'Missing Home runtime / Falta el contenido de Home');
  const homeExercises = [
    ...runtime.lesson.exercises,
    ...runtime.placement.map(({ exercise }) => exercise),
    ...Object.values(runtime.challenges).flat(),
  ].map((exercise) => exercise as ChapterPackExercise);
  const all = [
    ...Object.values(course.lessons).flatMap(({ exercises }) => exercises),
    ...Object.values(course.challengePools).flat(),
    ...course.placementQuestions,
    ...homeExercises,
  ];
  let probes = 0;
  for (const exercise of all) {
    const check = (answer: Answer, expected: AnswerOutcome) => {
      assert.equal(
        judgeAnswer(exercise, answer),
        expected,
        exercise.id + ' ' + JSON.stringify(answer),
      );
      probes++;
    };
    if (exercise.ungradable) {
      check({ text: 'A guess.' }, 'ungradable');
      continue;
    }
    if (exercise.introduction) {
      check({ text: 'Hi! I’m María-José de la Cruz.' }, 'target');
      check({ text: 'Hi! I are María-José de la Cruz.' }, 'incorrect');
      continue;
    }
    if (exercise.type === 'matching') {
      const matches = Object.fromEntries(exercise.matchingPairs!.map(({ id }) => [id, id]));
      check({ matches }, 'target');
      check({ matches: {} }, 'incorrect');
      continue;
    }
    if (exercise.options) {
      for (const { id } of exercise.options)
        check({ optionId: id }, id === exercise.correctOptionId ? 'target' : 'incorrect');
      continue;
    }
    for (const text of exercise.acceptedAnswers) check({ text }, 'target');
    for (const text of exercise.communicationOnly?.answers ?? [])
      check({ text }, 'communication_only');
    check({ text: ':::?' }, 'incorrect');
  }
  console.log(
    `Answer keys / Claves de respuesta: ${all.length} items/ítems, ${probes} checks/pruebas.`,
  );
}

type ChapterPackExercise = Parameters<typeof judgeAnswer>[0] & { id: string };

function auditItems(course: CoursePayload, chapters: Map<string, ChapterPack>) {
  const items = new Map<string, { section: string; id: string; serialized: string }>();
  const add = (section: string, id: string, value: unknown) => {
    const key = `${section}\t${id}`;
    assert.ok(!items.has(key), 'Duplicate audit item / Ítem de auditoría duplicado: ' + key);
    items.set(key, { section, id, serialized: canonicalStringify(value) });
  };

  for (const unit of course.units) {
    add('course-unit', unit.id, unit);
    for (const { id } of unit.lessons) {
      const { exercises, ...lesson } = course.lessons[id];
      add('course-lesson', id, lesson);
      exercises.forEach((exercise) => add('course-exercise', exercise.id, exercise));
    }
  }
  for (const [mode, exercises] of Object.entries(course.challengePools))
    exercises.forEach((exercise) => add('course-challenge', `${mode}/${exercise.id}`, exercise));
  for (const level of course.challengeLevels) add('challenge-level', String(level.level), level);
  for (const exercise of course.placementQuestions) add('course-placement', exercise.id, exercise);
  for (const drill of course.speechDrills) add('course-speaking', drill.id, drill);
  for (const mission of course.missions)
    for (const step of mission.steps) add('course-mission', `${mission.id}/${step.id}`, step);

  for (const [id, chapter] of chapters) {
    // The additional Mexico cards are audited in Phase 5D.
    // Las fichas adicionales de México se auditan en la fase 5D.
    const cards =
      id === 'mexico' ? [chapter.lesson] : [chapter.lesson, ...chapter.additionalLessons];
    for (const [offset, card] of cards.entries()) {
      const ref = `${id}/${offset + 1}`;
      const { question, model, practiceEs, ...teaching } = card;
      add('travel-card', ref, teaching);
      add('travel-question', ref, question);
      add('travel-practice-model', ref, { practiceEs, model });
    }
    if (!chapter.story?.runtime) continue;

    const home = chapter.story.chapter as unknown as TravelChapter;
    for (const mission of home.missions) {
      const { steps, ...teaching } = mission;
      add('home-mission', mission.id, teaching);
      for (const step of steps) add('home-step', `${mission.id}/${step.id}`, step);
    }
    const adventure = chapter.story.adventure as unknown as StoryDefinition;
    for (const dialogue of adventure.dialogues) {
      const { choices, ...line } = dialogue;
      add('home-dialogue', dialogue.id, line);
      for (const choice of choices) add('home-choice', `${dialogue.id}/${choice.id}`, choice);
    }
    for (const scene of adventure.scenes) {
      add('home-scene', scene.id, scene);
      assert.equal(
        new Set(scene.hotspots.map(({ id }) => id)).size,
        scene.hotspots.length,
        scene.id,
      );
    }
    for (const encounter of adventure.encounters) add('home-encounter', encounter.id, encounter);
    for (const quest of adventure.quests) add('home-quest', quest.id, quest);
    for (const npc of adventure.npcs) add('home-character', npc.id, npc);
    for (const item of adventure.items) add('home-item', item.id, item);
    for (const step of chapter.story.practice as TravelExerciseStep[])
      add('home-adaptive-review', step.exercise.id, step);
    const { placement, challenges, lesson } = chapter.story.runtime;
    const runtimeExerciseIds = new Set(lesson.exercises.map(({ id }) => id));
    assert.equal(runtimeExerciseIds.size, lesson.exercises.length, 'Duplicate Home exercise IDs');
    const starter = lesson.exercises.find(({ id }) => id === 'travel_quick_hello');
    assert.ok(starter, 'Missing guided Home starter / Falta el inicio guiado');
    add('home-review-starter', starter.id, starter);
    for (const item of placement) add('home-placement', item.exercise.id, item);
    for (const [mode, exercises] of Object.entries(challenges))
      exercises.forEach((exercise) => add('home-challenge', `${mode}/${exercise.id}`, exercise));
  }
  return items;
}

export async function verifyReleaseAudit(course: CoursePayload, current: Map<string, ChapterPack>) {
  const legacy = chapterCatalogSchema.parse(JSON.parse(await read(legacyCatalog)));
  const legacyChapters = new Map<string, ChapterPack>();
  for (const [id, { revision, sha256 }] of Object.entries(legacy.chapters)) {
    const bytes = await read(`apps/mobile/public/chapter-packs/${revision}/${id}.json`);
    assert.equal(
      sha256Hex(bytes),
      sha256,
      'Legacy chapter checksum / Suma del capítulo anterior: ' + id,
    );
    legacyChapters.set(id, parseChapterPack(bytes, id));
  }
  const baseline = auditItems(parseCoursePack(await read(legacyCourse)).payload, legacyChapters);
  const active = auditItems(course, current);
  const home = current.get('home');
  assert.ok(home, 'Missing Home chapter / Falta el capítulo inicial');
  verifyAnswerKeys(course, home);
  for (const key of baseline.keys()) {
    assert.ok(active.has(key), 'Released ID was removed / Se eliminó un ID publicado: ' + key);
  }
  const audited = new Map([...baseline, ...active]);
  const rows = [
    'section\tid\tchange\tbaseline_sha256\tphase_5b_sha256\tbaseline_content\tphase_5b_content',
  ];
  let changed = 0;
  for (const [key, { section, id }] of audited) {
    const before = baseline.get(key)?.serialized;
    const after = active.get(key)!.serialized;
    const change = before === after ? 'retained' : !before ? 'added' : 'revised';
    if (change !== 'retained') changed++;
    rows.push(
      [
        section,
        id,
        change,
        before ? sha256Hex(before) : '',
        sha256Hex(after),
        change === 'revised' ? before : 'null',
        change === 'retained' ? 'null' : after,
      ].join('\t'),
    );
  }
  const expected = rows.join('\n') + '\n';
  if (process.argv.includes('--write-audit-index')) await writeFile(auditIndex, expected);
  assert.ok(
    (await readFile(auditIndex, 'utf8')) === expected,
    'Stale item audit index / Índice de auditoría desactualizado. npm run curriculum:verify -- --write-audit-index',
  );
  console.log(
    `Release audit / Auditoría de publicación: ${active.size} tracked items/ítems, ${changed} changes/cambios.`,
  );
}
