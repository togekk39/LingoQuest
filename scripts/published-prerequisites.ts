import { buildTextbookPrerequisites } from './published-textbook-prerequisites';
import type { ChapterLessonSource, CourseLesson } from '@lingoquest/course-pack';
import { chapterReaderSections } from '../apps/mobile/src/travel/chapterReaderSections';
import { starterGreetingInstruction } from '../apps/mobile/src/travel/starterGreeting';
import {
  chapterLexicalForms,
  chapterPatterns,
  homeExercises,
  homeLocalTeaching,
  homeReviewExercises,
  homeReviewGlosses,
  homeTargets,
  homeTeaching,
  travelCards,
} from '../content/source/prerequisites/published-travel';
import {
  reviewedChapterCards,
  reviewedHomeLocal,
  reviewedHomeReview,
  reviewedHomeSteps,
} from '../content/source/prerequisites/published-travel-review';
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
import { checkReviewedTravelContent } from './reviewed-travel-content';

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

function evidenceIssues(
  material: string,
  evidence: readonly string[],
  location: string,
  source: 'instruction' | 'support' = 'instruction',
) {
  const diagnostic =
    source === 'instruction'
      ? 'Falta evidencia de enseñanza / Missing teaching evidence'
      : 'Falta evidencia del apoyo / Missing support evidence';
  return evidence
    .filter((phrase) => !canonicalText(material).includes(canonicalText(phrase)))
    .map((phrase) => `${location} ${diagnostic}: ${phrase}`);
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
    chapterExactPatterns: 0,
    textbookLessons: 0,
    textbookExercises: 0,
    storyMissions: 0,
    storyExercises: 0,
    storySpeakingModels: 0,
    storyGuidedDialogues: 0,
    travelAdaptiveItems: 0,
    travelGuidedStarters: 0,
    travelAdaptivePaths: 0,
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
      issues.push(...checkReviewedTravelContent(reviewedChapterCards, id, card, location));
      const patterns = definition.patterns ?? authoredEntry(chapterPatterns, chapterId);
      if (!patterns) {
        issues.push(`${location} Falta anotación de patrones / Missing pattern annotation`);
        continue;
      }
      const terms = new Map<string, Reference[]>();
      const knownPatterns = new Set<string>();
      const vocabulary: Stage[] = [];
      for (const [position, term] of definition.vocabulary.entries()) {
        const word = card.vocabulary.find(({ en }) => canonicalText(en) === canonicalText(term));
        if (!word) {
          issues.push(
            `${location} Falta vocabulario de la tarjeta / Missing card vocabulary: ${term}`,
          );
          continue;
        }
        const wordId = `${id}.word-${position + 1}`;
        const forms = [...(chapterLexicalForms[chapterId]?.[term] ?? [word.en])];
        const refs = forms.map((form) => ({ id: wordId, form }));
        const displayed = [word.en, ...word.en.split(' → ')];
        const teaches = refs.filter(({ form }) => displayed.includes(form));
        for (const { form } of refs.filter(({ form }) => !displayed.includes(form)))
          issues.push(
            `${location} form=${form} Forma ausente del glosario / Form absent from the glossary`,
          );
        terms.set(term, refs);
        file.targets.push({
          id: wordId,
          kind: 'lexical',
          lemma: forms[0],
          forms,
          senseEs: word.es,
        });
        if (teaches.length)
          vocabulary.push({
            id: `vocabulary-${position + 1}`,
            type: 'teach',
            teaches,
            instructionEs: word.es,
            exampleEn: word.en,
          });
      }
      const grammar = definition.grammar.map((item): Stage => {
        const ref = { id: `${id}.grammar.${item.id}` };
        terms.set(item.id, [ref]);
        file.targets.push({ ...ref, kind: 'grammar', descriptionEs: item.descriptionEs });
        const patternId = `${id}.pattern.${item.id}`;
        const forms = [
          ...new Set([
            ...(patterns.question[item.id] ?? []),
            ...(patterns.practice[item.id] ?? []),
          ]),
        ];
        knownPatterns.add(item.id);
        if (forms.length)
          file.targets.push({
            id: patternId,
            kind: 'pattern',
            descriptionEs: item.descriptionEs,
            forms,
          });
        const taughtIssues = evidenceIssues(
          card.grammarEs,
          [...item.evidence, ...forms],
          location + ' grammar=' + item.id,
        );
        issues.push(...taughtIssues);
        statistics.chapterExactPatterns += forms.length;
        if (taughtIssues.length)
          return { id: 'grammar-' + item.id, type: 'preview', text: card.grammarEs };
        return {
          id: 'grammar-' + item.id,
          type: 'teach',
          teaches: [ref, ...forms.map((form) => ({ id: patternId, form }))],
          instructionEs: card.grammarEs,
          exampleEn: item.evidence[0],
        };
      });
      function dependencies(
        names: readonly string[],
        exact: Readonly<Record<string, readonly string[]>>,
        exercise: string,
      ) {
        const refs = names.flatMap((name) => {
          const registered = terms.get(name);
          if (registered) return registered;
          issues.push(`${location} exercise=${exercise} Falta objetivo / Missing target: ${name}`);
          return [{ id: 'missing' }];
        });
        for (const [grammarId, forms] of Object.entries(exact)) {
          if (!names.includes(grammarId) || !knownPatterns.has(grammarId))
            issues.push(
              `${location} exercise=${exercise} Falta objetivo del patrón / Missing pattern target: ${grammarId}`,
            );
          refs.push(...forms.map((form) => ({ id: `${id}.pattern.${grammarId}`, form })));
        }
        return refs;
      }
      const question: CheckStage = {
        id: 'chapter-question',
        type: 'exercise',
        mode: 'guided',
        requires: dependencies(definition.question, patterns.question, 'chapter-question'),
      };
      const practice: CheckStage = {
        id: 'chapter-practice',
        type: 'exercise',
        mode: 'self-check',
        requires: dependencies(definition.practice, patterns.practice, 'chapter-practice'),
      };
      const preview: Stage = {
        id: 'bilingual-dialogue',
        type: 'preview',
        text: 'El diálogo bilingüe anticipa el escenario con las traducciones visibles.',
      };
      const sections: Record<ReaderSection, Stage[]> = {
        dialogue: [preview],
        vocabulary,
        grammar,
        question: [question],
        practice: [
          practice,
          {
            id: 'practice-model',
            type: 'preview',
            text: 'Modelo de autocorrección opcional, disponible después de leer la consigna.',
          },
        ],
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

  const textbook = buildTextbookPrerequisites(lessons);
  file.targets.push(...textbook.targets);
  textbook.traces.forEach(addLesson);
  issues.push(...textbook.issues);
  statistics.textbookLessons = textbook.traces.length;
  statistics.textbookExercises = textbook.exerciseCount;

  const actualTeaching = new Set<string>();
  const actualHomeExercises = new Set<string>();
  const taughtBeforeReview = new Map<string, ReadonlySet<string>>();
  const referenceKey = ({ id, form }: Reference) => `${id}:${form ?? ''}`;
  for (const mission of missions) {
    statistics.storyMissions++;
    const id = 'published.home.' + mission.id;
    const chapterId = 'home';
    issues.push(
      ...checkReviewedTravelContent(
        reviewedHomeLocal,
        `${mission.id}-vocabulary`,
        mission.vocabulary,
        `chapter=${chapterId} lesson=${id} vocabulary`,
      ),
    );
    const stagesByStep = new Map<string, Stage>();
    const storyStagesByStep = new Map<string, Stage>();
    const exerciseConcepts = new Map<string, string>();
    for (const step of mission.steps) {
      const location = `chapter=${chapterId} lesson=${id} step=${step.id}`;
      issues.push(...checkReviewedTravelContent(reviewedHomeSteps, step.id, step, location));
      if (step.type === 'dialogue') {
        stagesByStep.set(step.id, { id: step.id, type: 'preview', text: step.text });
        continue;
      }
      if (step.type === 'teach') {
        actualTeaching.add(step.id);
        const annotated = authoredEntry(homeTeaching, step.id);
        if (!annotated) {
          issues.push(`${location} Falta anotación de enseñanza / Missing teaching annotation`);
          continue;
        }
        const vocabulary = mission.vocabulary.map(
          ({ term, meaning, explanation }) => `${term} ${meaning} ${explanation}`,
        );
        const examples = step.examples.map(({ en, es }) => `${en} ${es}`);
        const exampleEn = step.examples[0].en;
        const { teaches } = annotated;
        function instruction(
          id: string,
          text: string,
          shown: string,
          evidence: readonly string[],
          source: string,
        ): Stage {
          const missing = evidenceIssues(shown, evidence, source);
          issues.push(...missing);
          return missing.length
            ? { id, type: 'preview', text }
            : {
                id,
                type: 'teach',
                teaches,
                instructionEs: text,
                exampleEn,
              };
        }
        stagesByStep.set(
          step.id,
          instruction(
            step.id,
            step.text,
            [step.text, ...vocabulary, ...examples].join('\n'),
            annotated.evidence,
            location,
          ),
        );
        if (step.storyPrompt) {
          const storyWords = mission.vocabulary.map((word) => word.storyPrompt?.text ?? '');
          const shown = [step.storyPrompt.text, ...vocabulary, ...storyWords, ...examples].join(
            '\n',
          );
          const evidence =
            'storyEvidence' in annotated ? annotated.storyEvidence : annotated.evidence;
          storyStagesByStep.set(
            step.id,
            instruction(
              `${step.id}-story`,
              step.storyPrompt.text,
              shown,
              evidence,
              location + ' path=story',
            ),
          );
        }
        continue;
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
        if (step.type === 'exercise' && step.exercise.learning)
          exerciseConcepts.set(targetId, step.exercise.learning.conceptId);
        stagesByStep.set(step.id, {
          id: targetId,
          type: 'exercise',
          mode:
            step.type === 'speak'
              ? 'self-check'
              : step.exercise.learning?.guided
                ? 'guided'
                : 'independent',
          requires,
        });
      }
    }
    const trace = (stepIds: readonly string[], story = false) =>
      stepIds.flatMap((id) => {
        const stage = (story ? storyStagesByStep.get(id) : undefined) ?? stagesByStep.get(id);
        return stage ? [stage] : [];
      });
    const stepIds = mission.steps.map(({ id }) => id);
    const direct = trace(stepIds);
    const routes = new Map<string, Stage[]>([['direct-study', direct]]);
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
      const storyStages = trace(stepIds.slice(start, end), true);
      if (storyStages.length) routes.set('story-' + encounter.id, storyStages);
    }
    for (const stages of routes.values()) {
      const seenTeaching = new Set<string>();
      for (const stage of stages) {
        if (stage.type === 'teach') {
          stage.teaches.forEach((reference) => seenTeaching.add(referenceKey(reference)));
        } else if (stage.type === 'exercise') {
          const concept = exerciseConcepts.get(stage.id);
          if (!concept) continue;
          const previous = taughtBeforeReview.get(concept);
          taughtBeforeReview.set(
            concept,
            new Set([...seenTeaching].filter((known) => !previous || previous.has(known))),
          );
          statistics.travelAdaptivePaths++;
        }
      }
    }
    const stages = new Map([...routes.values()].flat().map((stage) => [stage.id, stage]));
    addLesson({
      id,
      chapterId,
      stages: [...stages.values()],
      paths: [...routes].map(([key, route]) => path(key, route)),
    });
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
    const { teaches, evidence } = homeLocalTeaching.luz;
    issues.push(...checkReviewedTravelContent(reviewedHomeLocal, coach.id, coach, 'lesson=' + id));
    issues.push(...evidenceIssues(coach.text, evidence, 'lesson=' + id));
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
    const { teaches, evidence } = homeLocalTeaching.starter;
    issues.push(
      ...checkReviewedTravelContent(
        reviewedHomeLocal,
        reviewStarter.id,
        [starterGreetingInstruction, reviewStarter],
        'lesson=' + id,
      ),
    );
    issues.push(...evidenceIssues(starterGreetingInstruction, evidence, 'lesson=' + id));
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
  for (const step of reviewSteps) {
    const { exercise, situation } = step;
    const location = 'chapter=home adaptive=' + exercise.id;
    issues.push(...checkReviewedTravelContent(reviewedHomeReview, exercise.id, step, location));
    const requires = authoredEntry(homeReviewExercises, exercise.id);
    if (!requires || reviewIds.has(exercise.id)) {
      issues.push(
        location +
          ' Anotación de repaso ausente o repetida / Missing or duplicate review annotation',
      );
      continue;
    }
    reviewIds.add(exercise.id);
    const taught = taughtBeforeReview.get(exercise.learning?.conceptId ?? '');
    for (const target of requires) {
      if (!taught?.has(referenceKey(target)))
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
      issues.push(...evidenceIssues(situation, [gloss.text], location, 'support'));
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
  return { issues, statistics, instructionTrace: file };
}
