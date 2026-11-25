import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import {
  CHAPTER_CATALOG_FILE,
  chapterCatalogSchema,
  parseChapterPack,
  parseCoursePack,
  sha256Hex,
  utf8Bytes,
  type ChapterPack,
  type ChapterLessonSource,
  type CourseLesson,
} from '@lingoquest/course-pack';
import { route } from '@lingoquest/offline-engine';
import { judgeAnswer } from '@lingoquest/contracts';
import * as courseSource from '../content/source/curriculum';
import { easternChapterLessons } from '../content/source/chapter-lessons-east';
import { westernChapterLessons } from '../content/source/chapter-lessons-west';
import { mexicoChallengePools } from '../content/source/mexico-challenges';
import { mexicoChapter, mexicoPractice } from '../content/source/mexico-missions';
import { mexicoAdventure } from '../content/source/mexico-story';
import { travelChallengePools as unpublishedChallenges } from '../content/source/travel-challenges';
import { chapterStory } from '../packages/offline-engine/src/chapter-story';
import { travelChallengePools } from '../packages/offline-engine/src/travel-challenge-pools';
import {
  chapter,
  travelLesson,
  travelPracticeSteps,
  travelStepVocabulary,
} from '../packages/offline-engine/src/travel-content';
import {
  teachingReferenceKey,
  textbookFormalReferences,
} from '../packages/offline-engine/src/learning-prerequisites';
import {
  checkPrerequisites,
  prerequisiteFileSchema,
  type CurriculumLesson,
} from '../packages/course-pack/src/prerequisites';
import { verifyReleaseAudit } from './audit-release-items';
import { travelPlacementItems } from '../packages/offline-engine/src/travel-placement-items';
import { inspectPublishedPrerequisites } from './published-prerequisites';
import { inspectOptionalPrerequisites } from './published-optional-prerequisites';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFile(new URL(path, root), 'utf8');
const bands = ['Pre-A1', 'A1', 'A2', 'B1', 'B2'];
const unitPattern = /^### `(lq-[a-z-]+)` · .+ \(`([a-z-]+)`, (Pre-A1|[AB][12])\)$/;
const lessonPattern = /^#### `(lq-[a-z-]+\.[a-z0-9-]+)` · \S.+$/;
const prerequisitePattern = /^`(lq-[a-z-]+\.[a-z0-9-]+):(form|l|s|r|w)`$/;
const firstLessonPattern = /`(lq-[a-z-]+\.[a-z0-9-]+)`/;

function tableCells(line: string) {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function entries(cell: string) {
  return cell === '—' ? [] : cell.split(',').map((phrase) => phrase.trim());
}

function lexicalKey(value: string) {
  return value.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'");
}

function unique<T>(items: readonly T[], label: string) {
  assert.equal(new Set(items).size, items.length, 'Duplicate / Duplicado: ' + label);
}

const planLabels = {
  en: {
    unit: ['Story', 'Transfer'],
    lesson: [
      'Prerequisites',
      'New',
      'Review',
      'Form and patterns',
      'Guided practice',
      'L',
      'S',
      'R',
      'W',
    ],
  },
  es: {
    unit: ['Historia', 'Transferencia'],
    lesson: [
      'Requisitos',
      'Nuevo',
      'Repaso',
      'Forma y estructuras',
      'Práctica guiada',
      'L',
      'S',
      'R',
      'W',
    ],
  },
};

function fieldValues(lines: string[], labels: string[], id: string, list = false) {
  assert.equal(lines.length, labels.length, 'Plan fields / Campos del plan: ' + id);
  return labels.map((label, index) => {
    const prefix = (list ? '- ' : '') + '**' + label + '** · ';
    const line = lines[index];
    const value = line.slice(prefix.length).trim();
    assert.ok(
      line.startsWith(prefix) && value && value !== '-',
      'Plan field / Campo del plan: ' + id + ' → ' + label,
    );
    return value;
  });
}

function readPlan(text: string, locale: keyof typeof planLabels) {
  const units: { id: string; stop: string; band: string; lessonIds: string[] }[] = [];
  const taught = new Set<string>();
  const lessons = new Map<
    string,
    { prerequisites: string[]; newWords: string[]; review: string[] }
  >();

  const sections = text.split(/(?=^#{3,4} `lq-)/m).slice(1);
  for (const section of sections) {
    const [heading, ...body] = section.trimEnd().split(/\r?\n/);
    const fields = body.filter((line) => line.trim());
    const labels = planLabels[locale];
    const header = unitPattern.exec(heading);
    if (header) {
      const [, id, stop, band] = header;
      assert.ok(
        fieldValues(fields, labels.unit, id).every((value) => value !== '—'),
        'Missing scenario / Falta escenario: ' + id,
      );
      units.push({ id, stop, band, lessonIds: [] });
      continue;
    }

    const lesson = lessonPattern.exec(heading);
    assert.ok(lesson, 'Plan heading / Encabezado del plan: ' + heading);
    const [, id] = lesson;
    const unit = units.at(-1);
    assert.ok(unit && id.startsWith(unit.id + '.'), 'Lesson unit / Unidad de lección: ' + id);
    assert.ok(!lessons.has(id), 'Duplicate lesson / Lección duplicada: ' + id);
    const [requirements, newLexicon, reviewLexicon, ...practiceAndGoals] = fieldValues(
      fields,
      labels.lesson,
      id,
      true,
    );
    assert.ok(
      practiceAndGoals.every((goal) => goal !== '—'),
      'Missing practice or goal / Falta práctica u objetivo: ' + id,
    );

    const prerequisites = entries(requirements);
    unique(prerequisites, id);
    assert.ok(
      prerequisites.length || lessons.size === 0,
      'Missing prerequisite / Falta requisito: ' + id,
    );
    for (const reference of prerequisites) {
      const target = prerequisitePattern.exec(reference);
      assert.ok(
        target && lessons.has(target[1]),
        'Forward or unknown prerequisite / Requisito posterior o desconocido: ' +
          id +
          ' → ' +
          reference,
      );
    }
    const newWords = entries(newLexicon).map(lexicalKey);
    const review = entries(reviewLexicon).map(lexicalKey);
    unique([...newWords, ...review], id);
    for (const word of review)
      assert.ok(
        word && taught.has(word),
        'Review before teaching / Repaso antes de enseñanza: ' + id + ' → ' + word,
      );
    for (const word of newWords) {
      assert.ok(
        word && !taught.has(word),
        'Repeated introduction / Introducción repetida: ' + id + ' → ' + word,
      );
      taught.add(word);
    }
    unit.lessonIds.push(id);
    lessons.set(id, { prerequisites, newWords, review });
  }

  unique(
    units.map((unit) => unit.id),
    'unit IDs / IDs de unidad',
  );
  assert.ok(
    units.every((unit) => unit.lessonIds.length),
    'Empty unit / Unidad vacía',
  );
  assert.deepEqual(
    units.map((unit) => unit.stop).filter((stop, i, stops) => i === 0 || stops[i - 1] !== stop),
    route.map(({ id }) => id),
    'Route order and coverage / Orden y cobertura de la ruta',
  );
  for (const [index, unit] of units.entries()) {
    const stop = route.find(({ id }) => id === unit.stop)!;
    const allowed = stop.band === 'Desde cero' ? ['Pre-A1', 'A1'] : [stop.band];
    assert.ok(allowed.includes(unit.band), 'Stop level / Nivel de parada: ' + unit.id);
    assert.ok(
      index === 0 || bands.indexOf(unit.band) >= bands.indexOf(units[index - 1].band),
      'Level order / Orden de niveles: ' + unit.id,
    );
  }

  for (const band of bands) {
    const bandUnits = units.filter((unit) => unit.band === band);
    const bandLessons = bandUnits.flatMap((unit) => unit.lessonIds);
    const summaries = text.split(/\r?\n/).filter((line) => {
      if (!line.startsWith('|')) return false;
      const cells = tableCells(line);
      return cells.length === 4 && cells[0] === band;
    });
    assert.equal(summaries.length, 1, 'Level summary / Resumen por nivel: ' + band);
    const summary = tableCells(summaries[0]);
    assert.deepEqual(
      [Number(summary[1]), Number(summary[2]), firstLessonPattern.exec(summary[3])?.[1]],
      [bandUnits.length, bandLessons.length, bandLessons[0]],
      'Level counts or first lesson / Totales o primera lección: ' + band,
    );
  }
  return { units, lessons };
}

function counts<T>(rows: readonly T[], key: (row: T) => string) {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    const name = key(row);
    totals[name] = (totals[name] ?? 0) + 1;
  }
  return totals;
}

function verifyMexicoStory(pack: ChapterPack, lessons: Record<string, CourseLesson>) {
  const supportingLessons = ['u03_l01', 'u03_l02'].map((id) => lessons[id]);
  assert.deepEqual(
    pack.story,
    JSON.parse(
      JSON.stringify({
        chapter: mexicoChapter,
        adventure: mexicoAdventure,
        practice: mexicoPractice,
        supportingLessons,
        challenges: mexicoChallengePools,
      }),
    ),
    'Mexico story content / Contenido de la historia de México',
  );
  const taught = new Set<string>();
  const practice = [];
  const checkPrerequisites = ({ id, requires }: (typeof mexicoPractice)[number]) => {
    assert.ok(requires?.length, id);
    for (const ref of requires)
      assert.ok(taught.has(teachingReferenceKey(ref)), `${id} → ${ref.id}`);
  };
  for (const mission of mexicoChapter.missions) {
    for (const step of mission.steps) {
      if (step.type === 'teach' && step.instruction) {
        const { lessonId, references } = step.instruction;
        const lesson = lessons[lessonId];
        assert.ok(lesson, step.id);
        const reviewed = textbookFormalReferences(lesson, 'grammar');
        assert.ok(references?.length, step.id);
        for (const ref of references) {
          const match = reviewed.find(({ id }) => id === ref.id);
          assert.ok(match, `${step.id} → ${ref.id}`);
          taught.add(teachingReferenceKey(match));
        }
        const terms = travelStepVocabulary(mission, step).map(({ term }) => term);
        if (step.vocabularyTerms) assert.deepEqual(new Set(terms), new Set(step.vocabularyTerms));
      }
      if (step.type === 'exercise') {
        checkPrerequisites(step);
        if (step.audio) assert.equal(step.transcript, step.audio, step.id);
        practice.push(step.exercise);
      }
    }
  }
  for (const step of mexicoPractice) {
    checkPrerequisites(step);
    practice.push(step.exercise);
  }
  practice.push(...Object.values(mexicoChallengePools).flat());
  unique(
    practice.map(({ id }) => id),
    'Mexico exercise IDs / IDs de ejercicios de México',
  );
  let probes = 0;
  for (const exercise of practice) {
    if (exercise.options) {
      for (const { id } of exercise.options) {
        assert.equal(
          judgeAnswer(exercise, { optionId: id }),
          id === exercise.correctOptionId ? 'target' : 'incorrect',
          exercise.id,
        );
        probes++;
      }
      continue;
    }
    assert.ok(exercise.acceptedAnswers.length, exercise.id);
    for (const text of exercise.acceptedAnswers) {
      assert.equal(judgeAnswer(exercise, { text }), 'target', exercise.id);
      probes++;
    }
    assert.equal(judgeAnswer(exercise, { text: ':::?' }), 'incorrect', exercise.id);
    probes++;
  }
  console.log(`Mexico / México: ${practice.length} items/ítems, ${probes} grading checks/pruebas.`);
}

async function verifyPublishedContent(inventory: boolean) {
  const bundled = parseCoursePack(await read('apps/mobile/src/content/bundled-course.json'));
  const { units, lessons, ...activities } = bundled.payload;
  assert.deepEqual(
    { units, lessons, ...activities },
    JSON.parse(
      JSON.stringify({
        units: courseSource.units,
        lessons: courseSource.lessons,
        challengePools: courseSource.challengePools,
        challengeLevels: courseSource.challengeLevels,
        missions: courseSource.missions,
        speechDrills: courseSource.speechDrills,
        placementQuestions: courseSource.placementQuestions,
        contentStatus: courseSource.contentStatus,
        assets: [],
      }),
    ),
    'Bundle differs from authored sources / El paquete incluido difiere de las fuentes',
  );

  const chapterRoot = 'apps/mobile/public/chapter-packs/';
  const catalog = chapterCatalogSchema.parse(
    JSON.parse(await read(chapterRoot + CHAPTER_CATALOG_FILE)),
  );
  const authored: Record<string, ChapterLessonSource> = {
    ...westernChapterLessons,
    ...easternChapterLessons,
  };
  const stopIds = route.map(({ id }) => id).sort();
  assert.deepEqual(
    Object.keys(catalog.chapters).sort(),
    stopIds,
    'Catalog route / Ruta del catálogo',
  );
  assert.deepEqual(Object.keys(authored).sort(), stopIds, 'Authored route / Ruta de autoría');

  if (inventory) {
    const vocabulary = Object.values(lessons).flatMap((lesson) => lesson.vocabulary);
    const exercises = Object.values(lessons).flatMap((lesson) => lesson.exercises);
    console.log({
      version: bundled.manifest.version,
      units: units.length,
      lessons: Object.keys(lessons).length,
      vocabulary: counts(vocabulary, (word) => word.status),
      exercises: counts(exercises, (exercise) => exercise.type),
      evidence: counts(exercises, (exercise) => exercise.dimension),
      challenges: Object.fromEntries(
        Object.entries(activities.challengePools).map(([type, pool]) => [type, pool.length]),
      ),
      additionalAuthoredChallenges: Object.values(unpublishedChallenges).flat().length,
      originalPlacement: activities.placementQuestions.length,
      originalSpeechDrills: activities.speechDrills.length,
      originalMissions: activities.missions.length,
    });
    for (const unit of units) {
      console.log(unit.id, unit.cefr, unit.title);
      for (const { id } of unit.lessons) {
        const lesson = lessons[id];
        console.log(id, lesson.title, lesson.grammar.skillId, lesson.exercises.length);
      }
    }
  }

  const activeChapters = new Map<string, ChapterPack>();
  for (const { id, unitId } of route) {
    const entry = catalog.chapters[id];
    const bytes = await read(chapterRoot + entry.revision + '/' + id + '.json');
    const pack = parseChapterPack(bytes, id);
    activeChapters.set(id, pack);
    assert.equal(sha256Hex(bytes), entry.sha256, id);
    assert.equal(utf8Bytes(bytes).length, entry.sizeBytes, id);
    assert.equal(pack.revision, entry.revision, id);

    const cards = [pack.lesson, ...pack.additionalLessons];
    const expected = authored[id];
    assert.deepEqual(
      cards,
      Array.isArray(expected) ? expected : [expected],
      'Chapter source / Fuente del capítulo: ' + id,
    );
    for (const card of cards) unique(card.question.options.map(lexicalKey), id + '/' + card.title);

    assert.equal(pack.unit?.id, unitId, 'Chapter unit / Unidad del capítulo: ' + id);
    if (unitId) {
      const unit = units.find((unit) => unit.id === unitId);
      assert.ok(unit, 'Unknown legacy unit / Unidad anterior desconocida: ' + unitId);
      assert.deepEqual(
        pack.unit,
        {
          id: unit.id,
          titleEs: unit.titleEs,
          lessons: unit.lessons.map(({ id }) => lessons[id]),
        },
        'Chapter textbook copy / Copia del curso por capítulo: ' + id,
      );
    }
    if (id === 'home') {
      assert.deepEqual(
        pack.story,
        JSON.parse(
          JSON.stringify({
            chapter,
            adventure: chapterStory,
            practice: travelPracticeSteps,
            runtime: {
              lesson: travelLesson,
              placement: travelPlacementItems,
              challenges: travelChallengePools,
              course: activities,
            },
          }),
        ),
        'Home story runtime / Historia del lugar de origen',
      );
    }
    if (id === 'mexico') verifyMexicoStory(pack, lessons);
    if (inventory)
      console.log(
        id,
        entry.revision,
        entry.sizeBytes,
        cards.map((card) => card.title),
        Object.keys(pack.audio).length,
      );
  }
  await verifyReleaseAudit(bundled.payload, activeChapters);
  const prerequisiteCoverage = inspectPublishedPrerequisites({
    chapters: authored,
    lessons: units.flatMap((unit) => unit.lessons.map(({ id }) => lessons[id])),
    missions: chapter.missions,
    encounters: chapterStory.encounters,
    dialogues: chapterStory.dialogues,
    reviewSteps: travelPracticeSteps,
    reviewStarter: travelLesson.exercises[0],
  });
  assert.deepEqual(
    prerequisiteCoverage.issues,
    [],
    'Published paths / Rutas publicadas:\n' + prerequisiteCoverage.issues.join('\n'),
  );
  console.log('Published prerequisites / Requisitos publicados:', prerequisiteCoverage.statistics);
  const optionalCoverage = inspectOptionalPrerequisites({
    ...bundled.payload,
    homeChallengePools: travelChallengePools,
    homePlacementItems: travelPlacementItems,
    homeMissionIds: chapter.missions.map(({ id }) => id),
    instructionTrace: prerequisiteCoverage.instructionTrace,
  });
  assert.deepEqual(
    optionalCoverage.issues,
    [],
    'Optional assessment dependencies / Requisitos de evaluaciones opcionales:\n' +
      optionalCoverage.issues.join('\n'),
  );
  console.log('Optional assessments / Evaluaciones opcionales:', optionalCoverage.stats);
  if (inventory)
    console.log({
      homeMissions: chapter.missions.map((mission) => ({
        id: mission.id,
        vocabulary: mission.vocabulary.length,
        steps: counts(mission.steps, (step) => step.type),
      })),
      homeEncounters: chapterStory.encounters.length,
      homeReview: travelPracticeSteps.length,
      homePlacement: travelPlacementItems.length,
      homeChallengeItems: Object.values(travelChallengePools).map((items) => items.length),
    });
}

async function verifyPrerequisiteAnnotations(plan: ReturnType<typeof readPlan>) {
  const directory = new URL('content/source/prerequisites/', root);
  const names = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort();
  assert.ok(names.length, 'No prerequisite annotations / Faltan anotaciones de requisitos');
  const files = await Promise.all(
    names.map(async (name) => {
      const data = await readFile(new URL(name, directory), 'utf8');
      try {
        return prerequisiteFileSchema.parse(JSON.parse(data));
      } catch (error) {
        throw new Error('content/source/prerequisites/' + name + '\n' + String(error));
      }
    }),
  );
  const curriculum = new Map<string, CurriculumLesson>();
  for (const unit of plan.units) {
    for (const id of unit.lessonIds)
      curriculum.set(id, { chapterId: unit.stop, order: curriculum.size });
  }
  const issues = checkPrerequisites(files, curriculum);
  if (issues.length) throw new Error(issues.join('\n'));
  const annotated = files.flatMap((file) => file.lessons);
  assert.ok(annotated.length, 'No annotated lessons / Faltan lecciones anotadas');
  console.log(
    'Prerequisites checked / Requisitos verificados: ' +
      annotated.length +
      '/' +
      plan.lessons.size +
      ' annotated lessons/lecciones anotadas, ' +
      annotated.reduce((count, lesson) => count + lesson.paths.length, 0) +
      ' paths/rutas.',
  );
}

async function main() {
  const [english, spanish] = await Promise.all([
    read('docs/curriculum/curriculum-master-plan.md'),
    read('docs/curriculum/curriculum-master-plan.es-419.md'),
  ]);
  const plan = readPlan(english, 'en');
  assert.deepEqual(
    readPlan(spanish, 'es'),
    plan,
    'Plan structure differs by locale / La estructura del plan difiere por idioma',
  );
  const inventory = process.argv.includes('--inventory');
  if (inventory) {
    const focalEntries = Object.fromEntries(
      bands.map((band) => [
        band,
        plan.units
          .filter((unit) => unit.band === band)
          .flatMap((unit) => unit.lessonIds)
          .reduce((total, id) => total + plan.lessons.get(id)!.newWords.length, 0),
      ]),
    );
    console.log('Planned focal entries / Entradas clave previstas:', focalEntries);
  }
  await verifyPrerequisiteAnnotations(plan);
  await verifyPublishedContent(inventory);
  console.log(
    'Curriculum verified / Currículo verificado: ' +
      plan.units.length +
      ' units/unidades, ' +
      plan.lessons.size +
      ' lessons/lecciones, ' +
      route.length +
      ' stops/paradas.',
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
