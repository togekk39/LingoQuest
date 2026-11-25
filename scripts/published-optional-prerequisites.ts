import { canonicalStringify, sha256Hex, type CoursePayload } from '@lingoquest/course-pack';
import {
  challengeQuestionCount,
  challengeRequiredUnit,
  selectChallengeQuestions,
} from '@lingoquest/contracts';
import {
  optionalCourseItems,
  optionalHomeItems,
} from '../content/source/prerequisites/optional-items';
import {
  availableTravelRanks,
  HOME_TRAVEL_TRACK,
  practiceHomeChallengeItems,
} from '../packages/offline-engine/src/travel-challenges';
import type { CourseExercise } from '../packages/offline-engine/src/index';
import type { PrerequisiteFile } from '../packages/course-pack/src/prerequisites';
import { textbookTokens } from './published-textbook-prerequisites';

type Exercise = CourseExercise & { audio?: string };
type Mode = keyof CoursePayload['challengePools'];
type Dependency = string | readonly [id: string, form: string];
type Review = { digest: string; requires: readonly Dependency[] };

const derivedDiagnosticForm = {
  exerciseId: 'placement_09',
  form: 'reading',
  lemma: 'lex.u02_l02_v02',
  rule: 'pattern.u05_l01.current',
};
const incidentalDiagnosticWord = {
  exerciseId: 'placement_11',
  word: 'new',
  reasonEs:
    'El adjetivo no permite determinar quién probó la comida. Ambas oraciones se refieren al mismo restaurante.',
};

type OptionalCurriculum = Pick<
  CoursePayload,
  'units' | 'lessons' | 'challengePools' | 'placementQuestions'
> & {
  challengeLevels: readonly CoursePayload['challengeLevels'][number][];
  homeChallengePools: Record<Mode, Exercise[]>;
  homePlacementItems: readonly { missionId: string; audio?: string; exercise: Exercise }[];
  homeMissionIds: readonly string[];
  instructionTrace: PrerequisiteFile;
};

function formKey(form: string) {
  return textbookTokens(form).join(' ');
}

export function optionalDigest(exercise: Exercise, audio?: string) {
  return sha256Hex(canonicalStringify(audio ? { exercise, audio } : exercise));
}

function guaranteedTeaching(trace: PrerequisiteFile) {
  const completed = new Map<string, Set<string>>();
  for (const lesson of trace.lessons) {
    const stages = new Map(lesson.stages.map((stage) => [stage.id, stage]));
    const paths = lesson.paths.map(({ stages: order, requiresLessons }) => {
      const taught = new Set(requiresLessons.flatMap((id) => [...(completed.get(id) ?? [])]));
      for (const id of order) {
        const stage = stages.get(id);
        if (stage?.type === 'teach')
          for (const ref of stage.teaches) taught.add(teachingKey(ref.id, ref.form));
      }
      return taught;
    });
    completed.set(
      lesson.id,
      new Set(
        [...(paths[0] ?? new Set<string>())].filter((key) => paths.every((set) => set.has(key))),
      ),
    );
  }
  return completed;
}

function teachingKey(id: string, form?: string) {
  return form === undefined ? id : id + '[' + formKey(form) + ']';
}

export function optionalAssessmentEnglish(exercise: Exercise, audio?: string) {
  const sentence = exercise.sentence ?? '';
  const options =
    exercise.optionsLanguage === 'es' ? [] : (exercise.options ?? []).map(({ text }) => text);
  const blank = /_{2,}/;
  const canonical = exercise.acceptedAnswers[0];
  const fills = options.length ? options : canonical ? [canonical] : [];
  const sentenceTexts =
    blank.test(sentence) && fills.length
      ? fills.map((answer) => sentence.replace(blank, answer))
      : [sentence, ...options];
  return [
    ...sentenceTexts,
    exercise.passage ?? '',
    ...(exercise.tokens ?? []),
    ...(!exercise.options && !blank.test(sentence) && canonical ? [canonical] : []),
    audio ?? '',
  ];
}

export function inspectOptionalPrerequisites({
  units,
  lessons,
  challengePools,
  challengeLevels,
  placementQuestions,
  homeChallengePools,
  homePlacementItems,
  homeMissionIds,
  instructionTrace,
}: OptionalCurriculum) {
  const issues: string[] = [];
  const targets = new Map(instructionTrace.targets.map((target) => [target.id, target]));
  const completed = guaranteedTeaching(instructionTrace);
  const allTaught = new Set([...completed.values()].flatMap((forms) => [...forms]));
  const teachingFor = (ids: readonly string[]) =>
    new Set(ids.flatMap((id) => [...(completed.get(id) ?? [])]));

  const stats = {
    textbookChallenges: 0,
    homeChallenges: 0,
    textbookDiagnostics: 0,
    homeDiagnostics: 0,
    challengePaths: 0,
  };
  const used = { course: new Set<string>(), home: new Set<string>() };

  function checkItem(
    exercise: Exercise,
    scope: 'course' | 'home',
    route: string,
    taught: ReadonlySet<string>,
    audio?: string,
  ) {
    const location = `path=${route} exercise=${exercise.id}`;
    const registry: Record<string, Review> =
      scope === 'course' ? optionalCourseItems : optionalHomeItems;
    const review = Object.hasOwn(registry, exercise.id) ? registry[exercise.id] : undefined;
    if (!review) {
      issues.push(`${location} Faltan requisitos anotados / Missing assessment requirements`);
      return;
    }
    used[scope].add(exercise.id);
    if (review.digest !== optionalDigest(exercise, audio))
      issues.push(`${location} Revisa la evaluación modificada / Review changed assessment`);

    const requirements = review.requires.flatMap((requirement) => {
      const [id, requested] = typeof requirement === 'string' ? [requirement] : requirement;
      const target = targets.get(id);
      if (!target) {
        issues.push(`${location} target=${id} Objetivo desconocido / Unknown target`);
        return [];
      }
      const forms = target.kind === 'grammar' ? [] : target.forms;
      const form = requested ?? (forms.length === 1 ? forms[0] : undefined);
      if (forms.length && (!form || !forms.some((value) => formKey(value) === formKey(form))))
        issues.push(
          `${location} target=${id} Falta una forma explícita válida / Missing a valid explicit form`,
        );
      const key = teachingKey(target.id, form);
      if (!taught.has(key))
        issues.push(
          `${location} target=${key} Falta enseñanza de la forma o sentido / Missing instruction for the form or sense`,
        );
      return [{ target, form }];
    });
    const kinds = new Set(requirements.map(({ target }) => target.kind));
    for (const kind of ['lexical', 'pattern', 'grammar'] as const)
      if (!kinds.has(kind))
        issues.push(`${location} kind=${kind} Falta requisito / Missing dependency`);

    const publicWords = new Set(optionalAssessmentEnglish(exercise, audio).flatMap(textbookTokens));
    const requiredWords = new Set(
      requirements.flatMap(({ target, form }) =>
        target.kind === 'lexical' || target.kind === 'pattern' ? textbookTokens(form ?? '') : [],
      ),
    );
    if (exercise.id === derivedDiagnosticForm.exerciseId) {
      const ids = new Set(requirements.map(({ target }) => target.id));
      if (ids.has(derivedDiagnosticForm.lemma) && ids.has(derivedDiagnosticForm.rule))
        requiredWords.add(derivedDiagnosticForm.form);
    }
    const glossedWords = new Set(
      (exercise.contextualGlosses ?? []).flatMap(({ en }) => textbookTokens(en)),
    );
    const names =
      scope === 'home'
        ? ['sam', 'luz']
        : [
            'ana',
            'diego',
            'eva',
            'leo',
            'lima',
            'luis',
            'maya',
            'nora',
            'peru',
            'rosa',
            'sam',
            'sara',
            'luz',
          ];
    const allowed = new Set([...requiredWords, ...glossedWords, ...names]);
    if (exercise.id === incidentalDiagnosticWord.exerciseId)
      allowed.add(incidentalDiagnosticWord.word);
    const missing = [...publicWords].filter((word) => !allowed.has(word));
    if (missing.length)
      issues.push(
        `${location} Vocabulario sin anotación / Vocabulary has no annotated requirement: ${missing.join(', ')}`,
      );
    if (!exercise.options || exercise.optionsLanguage !== 'es') {
      const answerWords = textbookTokens(exercise.acceptedAnswers[0] ?? '');
      const onlySupported = answerWords.filter(
        (word) => !requiredWords.has(word) && !names.includes(word),
      );
      if (onlySupported.length)
        issues.push(
          `${location} La respuesta exige formas sin enseñar / The answer depends on an untaught form: ${onlySupported.join(', ')}`,
        );
    }
  }

  for (const exercise of Object.values(challengePools).flat()) {
    const ids = exercise.requiredLessonIds ?? [];
    if (!ids.length || new Set(ids).size !== ids.length || ids.some((id) => !completed.has(id)))
      issues.push(
        `exercise=${exercise.id} Requisitos de lección no válidos / Invalid lesson gates`,
      );
    checkItem(exercise, 'course', 'textbook-challenge', teachingFor(ids));
    stats.textbookChallenges++;
  }
  const visited = new Set<string>();
  for (const { level } of challengeLevels) {
    const unitId = challengeRequiredUnit(challengePools.grammar_rush, level);
    const index = units.findIndex(({ id }) => id === unitId);
    const ids = new Set(
      units.slice(0, index + 1).flatMap(({ lessons: rows }) => rows.map(({ id }) => id)),
    );
    const vocab = new Set(
      [...ids].flatMap((id) => lessons[id]?.vocabulary.map(({ id }) => id) ?? []),
    );
    const skills = new Set(
      [...ids].flatMap((id) => lessons[id]?.exercises.map(({ skillId }) => skillId) ?? []),
    );
    for (const [type, pool] of Object.entries(challengePools) as [Mode, Exercise[]][]) {
      const items = selectChallengeQuestions(
        pool,
        type,
        level,
        (exercise) =>
          !!exercise.requiredLessonIds?.length &&
          exercise.requiredLessonIds.every((id) => ids.has(id)) &&
          skills.has(exercise.skillId) &&
          (exercise.vocabularyIds ?? []).every((id) => vocab.has(id)),
      );
      if (items.length < challengeQuestionCount(type))
        issues.push(
          `path=textbook-challenge.${level}.${type} El nivel no tiene suficientes ítems elegibles / Too few eligible items at this rank`,
        );
      items.forEach(({ id }) => visited.add(id));
      stats.challengePaths++;
    }
  }
  for (const exercise of Object.values(challengePools).flat())
    if (!exercise.ungradable && !visited.has(exercise.id))
      issues.push(
        `exercise=${exercise.id} Ítem inaccesible en los niveles / Item unreachable from the published ranks`,
      );

  const homeTeaching = teachingFor(homeMissionIds.map((id) => 'published.home.' + id));
  const homeVisited = new Set<string>();
  for (const [type, pool] of Object.entries(homeChallengePools) as [Mode, Exercise[]][]) {
    for (const exercise of pool) {
      checkItem(exercise, 'home', HOME_TRAVEL_TRACK, homeTeaching);
      stats.homeChallenges++;
    }
    for (let rank = 1; rank <= availableTravelRanks; rank++) {
      for (const { id } of practiceHomeChallengeItems(pool, rank)) homeVisited.add(id);
      stats.challengePaths++;
    }
  }
  for (const exercise of Object.values(homeChallengePools).flat())
    if (!exercise.ungradable && !homeVisited.has(exercise.id))
      issues.push(`exercise=${exercise.id} Ítem de Home inaccesible / Home item unreachable`);

  // Diagnostics sample known constructs without crediting any teaching or requiring a completion gate.
  // El diagnóstico explora estructuras sin dar crédito de enseñanza ni exigir una lección previa.
  for (const exercise of placementQuestions) {
    if (exercise.requiredLessonIds?.length)
      issues.push(
        `exercise=${exercise.id} Diagnóstico con requisito previo / Diagnostic must remain ungated`,
      );
    checkItem(exercise, 'course', 'textbook-diagnostic', allTaught);
    stats.textbookDiagnostics++;
  }
  for (const { missionId, audio, exercise } of homePlacementItems) {
    if (exercise.requiredLessonIds?.length)
      issues.push(
        `exercise=${exercise.id} Diagnóstico con requisito previo / Diagnostic must remain ungated`,
      );
    if (!homeMissionIds.includes(missionId))
      issues.push(
        `exercise=${exercise.id} Misión de diagnóstico desconocida / Unknown diagnostic mission`,
      );
    checkItem(exercise, 'home', 'home-diagnostic', homeTeaching, audio);
    stats.homeDiagnostics++;
  }
  for (const [scope, registry] of [
    ['course', optionalCourseItems],
    ['home', optionalHomeItems],
  ] as const) {
    for (const id of Object.keys(registry))
      if (!used[scope].has(id))
        issues.push(`exercise=${id} Anotación sin ejercicio / Annotation without exercise`);
  }
  return { issues, stats };
}
