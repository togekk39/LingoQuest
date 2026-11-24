import type { ChapterLessonSource, CourseLesson } from '@lingoquest/course-pack';
import { chapterReaderSections } from '../apps/mobile/src/travel/chapterReaderSections';
import { starterGreetingInstruction } from '../apps/mobile/src/travel/starterGreeting';
import {
  homeExercises,
  homeReviewExercises,
  homeReviewGlosses,
  homeTargets,
  homeTeaching,
  travelCards,
} from '../content/source/prerequisites/published-travel';
import {
  checkPrerequisites,
  prerequisiteFileSchema,
  type CurriculumLesson,
  type PrerequisiteFile,
} from '../packages/course-pack/src/prerequisites';
import type { StoryDialogue, StoryEncounter } from '../packages/offline-engine/src/story';
import type {
  TravelExerciseStep,
  TravelMission,
} from '../packages/offline-engine/src/travel-content';

type Stage = PrerequisiteFile['lessons'][number]['stages'][number];
type CheckStage = Extract<Stage, { type: 'exercise' }>;
type Reference = CheckStage['requires'][number];
type ReaderSection = (typeof chapterReaderSections)[number]['id'];

interface PublishedCurriculum {
  chapters: Readonly<Record<string, ChapterLessonSource>>;
  lessons: readonly CourseLesson[];
  missions: readonly TravelMission[];
  encounters: readonly StoryEncounter[];
  dialogues: readonly StoryDialogue[];
  reviewSteps: readonly TravelExerciseStep[];
  reviewStarter: TravelExerciseStep['exercise'];
}

function canonicalText(value: string) {
  return value.normalize('NFC').replace(/[’‘]/gu, "'").toLowerCase();
}

function evidenceIssues(material: string, evidence: readonly string[], location: string) {
  return evidence
    .filter((phrase) => !canonicalText(material).includes(canonicalText(phrase)))
    .map(
      (phrase) => `${location} Falta evidencia de enseñanza / Missing teaching evidence: ${phrase}`,
    );
}

const path = (id: string, stages: readonly Stage[]) => ({
  id,
  requiresLessons: [],
  stages: stages.map((stage) => stage.id),
});

function authoredEntry<T>(record: Record<string, T>, key: string) {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

export function inspectPublishedPrerequisites(
  {
    chapters,
    lessons,
    missions,
    encounters,
    dialogues,
    reviewSteps,
    reviewStarter,
  }: PublishedCurriculum,
  readerSections: readonly { id: ReaderSection }[] = chapterReaderSections,
) {
  const file: PrerequisiteFile = { version: 1, targets: [...homeTargets], lessons: [] };
  const curriculum = new Map<string, CurriculumLesson>();
  const issues: string[] = [];
  const statistics = {
    chapterCards: 0,
    chapterQuestions: 0,
    chapterSelfChecks: 0,
    textbookLessons: 0,
    textbookExercises: 0,
    storyMissions: 0,
    storyExercises: 0,
    storySpeakingModels: 0,
    storyGuidedDialogues: 0,
    travelAdaptiveItems: 0,
    travelGuidedStarters: 0,
    paths: 0,
  };
  const addLesson = (lesson: PrerequisiteFile['lessons'][number]) => {
    file.lessons.push(lesson);
    curriculum.set(lesson.id, { chapterId: lesson.chapterId, order: curriculum.size });
    statistics.paths += lesson.paths.length;
  };
  for (const [chapterId, source] of Object.entries(chapters)) {
    const cards = Array.isArray(source) ? source : [source];
    const definitions = authoredEntry(travelCards, chapterId);
    if (definitions?.length !== cards.length) {
      issues.push(`chapter=${chapterId} Falta anotación de tarjeta / Missing card annotation`);
      continue;
    }
    for (const [index, card] of cards.entries()) {
      const definition = definitions[index];
      const id = `published.${chapterId}.card-${index + 1}`;
      statistics.chapterCards++;
      const location = `chapter=${chapterId} lesson=${id}`;
      const terms = new Map<string, Reference>();
      const vocabulary: Stage[] = [];
      for (const [position, term] of definition.vocabulary.entries()) {
        const word = card.vocabulary.find(({ en }) => canonicalText(en) === canonicalText(term));
        if (!word) {
          issues.push(
            `${location} Falta vocabulario de la tarjeta / Missing card vocabulary: ${term}`,
          );
          continue;
        }
        const ref = { id: `${id}.word-${position + 1}`, form: word.en };
        terms.set(term, ref);
        file.targets.push({
          id: ref.id,
          kind: 'lexical',
          lemma: word.en,
          forms: [word.en],
          senseEs: word.es,
        });
        vocabulary.push({
          id: `vocabulary-${position + 1}`,
          type: 'teach',
          teaches: [ref],
          instructionEs: word.es,
          exampleEn: word.en,
        });
      }
      const grammar = definition.grammar.map((item): Stage => {
        const ref = { id: `${id}.grammar.${item.id}` };
        terms.set(item.id, ref);
        file.targets.push({ ...ref, kind: 'grammar', descriptionEs: item.descriptionEs });
        issues.push(
          ...evidenceIssues(card.grammarEs, item.evidence, location + ' grammar=' + item.id),
        );
        return {
          id: 'grammar-' + item.id,
          type: 'teach',
          teaches: [ref],
          instructionEs: card.grammarEs,
          exampleEn: item.evidence[0],
        };
      });
      function dependencies(names: readonly string[], exercise: string) {
        return names.map((name) => {
          const ref = terms.get(name);
          if (ref) return ref;
          issues.push(`${location} exercise=${exercise} Falta objetivo / Missing target: ${name}`);
          return { id: 'missing' };
        });
      }
      const question: CheckStage = {
        id: 'chapter-question',
        type: 'exercise',
        mode: 'guided',
        requires: dependencies(definition.question, 'chapter-question'),
      };
      const practice: CheckStage = {
        id: 'chapter-practice',
        type: 'exercise',
        mode: 'self-check',
        requires: dependencies(definition.practice, 'chapter-practice'),
      };
      const preview: Stage = {
        id: 'bilingual-dialogue',
        type: 'context',
        supports: question.requires.map((target) => ({
          use: 'gloss',
          target,
          reasonEs: 'El diálogo bilingüe anticipa el escenario, con las traducciones visibles.',
        })),
      };
      const sections: Record<ReaderSection, Stage[]> = {
        dialogue: [preview],
        vocabulary,
        grammar,
        question: [question],
        practice: [practice],
      };
      statistics.chapterQuestions++;
      statistics.chapterSelfChecks++;
      addLesson({
        id,
        chapterId,
        stages: Object.values(sections).flat(),
        paths: [
          path(
            'chapter-reader',
            readerSections.flatMap(({ id }) => sections[id]),
          ),
        ],
      });
    }
  }
  for (const chapterId of Object.keys(travelCards))
    if (!Object.hasOwn(chapters, chapterId))
      issues.push(`chapter=${chapterId} Anotación sin tarjeta / Annotation without card`);

  const textbookVocabulary = new Set<string>();
  const textbookGrammar = new Set<string>();
  for (const lesson of lessons) {
    statistics.textbookLessons++;
    const id = lesson.id;
    const chapterId = 'textbook';
    const stages: Stage[] = [];
    const skillRef = { id: lesson.grammar.skillId };
    if (!textbookGrammar.has(skillRef.id)) {
      textbookGrammar.add(skillRef.id);
      file.targets.push({
        ...skillRef,
        kind: 'grammar',
        descriptionEs: lesson.grammar.explanationEs,
      });
    }
    const vocabulary = lesson.vocabulary.map((item) => {
      const ref = { id: 'lex.' + item.id, form: item.en };
      if (!textbookVocabulary.has(ref.id)) {
        textbookVocabulary.add(ref.id);
        file.targets.push({
          id: ref.id,
          kind: 'lexical',
          lemma: item.en,
          forms: [item.en],
          senseEs: item.es,
        });
      }
      return ref;
    });
    for (const runtimeStage of lesson.stages) {
      if (runtimeStage.type === 'vocabulary')
        stages.push({
          id: 'teach-vocabulary',
          type: 'teach',
          teaches: vocabulary,
          instructionEs: lesson.vocabulary[0].es,
          exampleEn: lesson.vocabulary[0].example.en,
        });
      if (runtimeStage.type === 'grammar') {
        if (!lesson.grammar.taughtForms?.length)
          issues.push(`lesson=${id} Falta enseñanza de formas / Missing taught forms`);
        stages.push({
          id: 'teach-grammar',
          type: 'teach',
          teaches: [skillRef],
          instructionEs: lesson.grammar.explanationEs,
          exampleEn: lesson.grammar.examples[0].en,
        });
      }
      for (const exerciseId of runtimeStage.exerciseIds ?? []) {
        const exercise = lesson.exercises.find(({ id }) => id === exerciseId);
        if (!exercise) {
          issues.push(`lesson=${id} exercise=${exerciseId} Falta ejercicio / Missing exercise`);
          continue;
        }
        const vocabularyTarget =
          exercise.dimension === 'vocabulary_recognition' ||
          exercise.dimension === 'vocabulary_recall';
        const requires = vocabularyTarget
          ? exercise.vocabularyIds.map(
              (target) =>
                vocabulary.find((ref) => ref.id === 'lex.' + target) ?? { id: 'lex.' + target },
            )
          : [{ id: exercise.skillId }];
        if (!requires.length)
          issues.push(
            `lesson=${id} exercise=${exerciseId} Falta objetivo evaluado / Missing assessed target`,
          );
        stages.push({
          id: exerciseId,
          type: 'exercise',
          mode: ['reorder', 'meaning', 'matching'].includes(exercise.type)
            ? 'guided'
            : 'independent',
          requires,
        });
        statistics.textbookExercises++;
      }
    }
    const traced = new Set(stages.map((stage) => stage.id));
    for (const exercise of lesson.exercises)
      if (!traced.has(exercise.id))
        issues.push(
          `lesson=${id} exercise=${exercise.id} Ejercicio fuera de la secuencia / Exercise absent from path`,
        );
    addLesson({
      id,
      chapterId,
      stages,
      paths: [path('direct-study', stages), path('lesson-review', stages)],
    });
  }

  const actualTeaching = new Set<string>();
  const actualHomeExercises = new Set<string>();
  const taughtByConcept = new Map<string, Reference[]>();
  for (const mission of missions) {
    statistics.storyMissions++;
    const id = 'published.home.' + mission.id;
    const chapterId = 'home';
    const stagesByStep = new Map<string, Stage>();
    for (const step of mission.steps) {
      const location = `chapter=${chapterId} lesson=${id} step=${step.id}`;
      if (step.type === 'teach') {
        actualTeaching.add(step.id);
        const annotated = authoredEntry(homeTeaching, step.id);
        if (!annotated) {
          issues.push(`${location} Falta anotación de enseñanza / Missing teaching annotation`);
          continue;
        }
        issues.push(
          ...evidenceIssues(
            [
              step.text,
              ...step.examples.map(({ en }) => en),
              ...mission.vocabulary.map(({ term, explanation }) => term + ' ' + explanation),
            ].join('\n'),
            annotated.evidence,
            location,
          ),
        );
        stagesByStep.set(step.id, {
          id: step.id,
          type: 'teach',
          teaches: annotated.teaches,
          instructionEs: step.text,
          exampleEn: step.examples[0].en,
        });
      }
      if (step.type === 'exercise' || step.type === 'speak') {
        if (step.type === 'exercise') statistics.storyExercises++;
        else statistics.storySpeakingModels++;
        const targetId = step.type === 'exercise' ? step.exercise.id : step.id;
        actualHomeExercises.add(targetId);
        const requires = authoredEntry(homeExercises, targetId);
        if (!requires) {
          issues.push(`${location} Falta anotación de ejercicio / Missing exercise annotation`);
          continue;
        }
        stagesByStep.set(step.id, {
          id: targetId,
          type: 'exercise',
          mode: step.type === 'speak' || step.exercise.learning?.guided ? 'guided' : 'independent',
          requires,
        });
      }
    }
    const trace = (stepIds: readonly string[]) =>
      stepIds.flatMap((id) => {
        const stage = stagesByStep.get(id);
        return stage ? [stage] : [];
      });
    const stepIds = mission.steps.map(({ id }) => id);
    const stages = trace(stepIds);
    const taught = stages.flatMap((stage) => (stage.type === 'teach' ? stage.teaches : []));
    for (const step of mission.steps) {
      if (step.type !== 'exercise' || !step.exercise.learning) continue;
      const { conceptId } = step.exercise.learning;
      taughtByConcept.set(conceptId, [...(taughtByConcept.get(conceptId) ?? []), ...taught]);
    }
    const paths = [path('direct-study', stages)];
    for (const encounter of encounters.filter(({ missionId }) => missionId === mission.id)) {
      const entry = encounter.freshEntryStepId ?? encounter.entryStepId;
      const start = entry ? stepIds.indexOf(entry) : 0;
      const end = encounter.endBeforeStepId
        ? stepIds.indexOf(encounter.endBeforeStepId)
        : stepIds.length;
      if (start < 0 || end <= start) {
        issues.push(
          `chapter=${chapterId} lesson=${id} path=${encounter.id} Ruta de historia inválida / Invalid Story path`,
        );
        continue;
      }
      const storyStages = trace(stepIds.slice(start, end));
      if (storyStages.length) paths.push(path('story-' + encounter.id, storyStages));
    }
    addLesson({ id, chapterId, stages, paths });
  }
  for (const id of Object.keys(homeTeaching))
    if (!actualTeaching.has(id))
      issues.push(`step=${id} Anotación sin enseñanza / Annotation without teaching`);
  for (const id of Object.keys(homeExercises))
    if (!actualHomeExercises.has(id))
      issues.push(`exercise=${id} Anotación sin ejercicio / Annotation without exercise`);
  for (const { id, missionId } of encounters)
    if (!missions.some(({ id: mission }) => mission === missionId))
      issues.push(`path=${id} Encuentro sin misión / Encounter without mission`);

  const coach = dialogues.find(({ id }) => id === 'luz-introduction-practice');
  if (!coach || !coach.choices.some(({ id }) => id === 'luz-practice-am')) {
    issues.push('chapter=home Falta la práctica con Luz / Missing practice with Luz');
  } else {
    const id = 'published.home.luz-introduction-practice';
    const teaches = homeExercises.travel_hello_build;
    issues.push(...evidenceIssues(coach.text, ['I am Luz', 'Con «I» va «am»'], 'lesson=' + id));
    const stages: Stage[] = [
      {
        id: 'luz-explanation',
        type: 'teach',
        teaches,
        instructionEs: coach.text,
        exampleEn: 'I am Luz',
      },
      { id: 'luz-practice-am', type: 'exercise', mode: 'guided', requires: teaches },
    ];
    addLesson({ id, chapterId: 'home', stages, paths: [path('story-dialogue-with-luz', stages)] });
    statistics.storyGuidedDialogues++;
  }

  if (reviewStarter.id === 'travel_quick_hello' && reviewStarter.learning?.guided) {
    const id = 'published.home.quick-review';
    const teaches = homeExercises.travel_hello_recall;
    issues.push(
      ...evidenceIssues(starterGreetingInstruction, ['Hi', 'Hello', 'hola'], 'lesson=' + id),
    );
    const stages: Stage[] = [
      {
        id: 'starter-explanation',
        type: 'teach',
        teaches,
        instructionEs: starterGreetingInstruction,
        exampleEn: 'Hi! Hello!',
      },
      {
        id: reviewStarter.id,
        type: 'exercise',
        mode: 'guided',
        requires: homeExercises.travel_hello_recognize,
      },
    ];
    addLesson({ id, chapterId: 'home', stages, paths: [path('direct-quick-review', stages)] });
    statistics.travelGuidedStarters++;
  } else {
    issues.push('chapter=home Falta un inicio guiado del repaso / Missing guided review starter');
  }

  const reviewIds = new Set<string>();
  for (const { exercise, situation } of reviewSteps) {
    const location = 'chapter=home adaptive=' + exercise.id;
    const requires = authoredEntry(homeReviewExercises, exercise.id);
    if (!requires || reviewIds.has(exercise.id)) {
      issues.push(
        location +
          ' Anotación de repaso ausente o repetida / Missing or duplicate review annotation',
      );
      continue;
    }
    reviewIds.add(exercise.id);
    const taught = taughtByConcept.get(exercise.learning?.conceptId ?? '') ?? [];
    for (const target of requires) {
      if (!taught.some((candidate) => candidate.id === target.id && candidate.form === target.form))
        issues.push(
          location +
            ' Objetivo ausente de la enseñanza del concepto / Target absent from concept teaching: ' +
            target.id,
        );
    }
    const gloss = authoredEntry(homeReviewGlosses, exercise.id);
    if (gloss) {
      if (requires.some((target) => target.id === gloss.target.id))
        issues.push(
          location +
            ' Se evalúa el apoyo contextual / Contextual support is assessed: ' +
            gloss.target.id,
        );
      issues.push(...evidenceIssues(situation, [gloss.text], location));
    }
    statistics.travelAdaptiveItems++;
  }
  for (const id of Object.keys(homeReviewExercises))
    if (!reviewIds.has(id))
      issues.push('adaptive=' + id + ' Anotación sin ejercicio / Annotation without exercise');

  const validated = prerequisiteFileSchema.safeParse(file);
  if (!validated.success)
    issues.push(
      ...validated.error.issues.map(({ path, message }) => path.join('.') + ' ' + message),
    );
  else issues.push(...checkPrerequisites([validated.data], curriculum));
  return { issues, statistics };
}
