import type { RpgAdventureAudit } from '@lingoquest/course-pack';
import {
  exactRpgAssessment,
  exactRpgReferences,
  formalDefinitions,
  rpgAssessmentDigest,
  rpgTeachingDigest,
  teachingReferenceKey,
} from '../packages/offline-engine/src/learning-prerequisites';
import {
  travelStepVocabulary,
  type TravelChapter,
  type TravelExerciseStep,
} from '../packages/offline-engine/src/travel-content';
import { optionalAssessmentEnglish } from './published-optional-prerequisites';
import { textbookTokens } from './published-textbook-prerequisites';

type AdventureCurriculum = {
  chapter: TravelChapter;
  practice: readonly TravelExerciseStep[];
  audit: RpgAdventureAudit;
  definitions: ReturnType<typeof formalDefinitions>;
  priorTeaching: ReadonlySet<string>;
  properNames: readonly string[];
};

export function adventureTokens(text: string) {
  return text
    .split(/(\b[ap]\.\s*m\.)(?!\p{L})/giu)
    .flatMap((part, index) =>
      index % 2 ? [part.toLowerCase().replace(/\s+/g, '')] : textbookTokens(part),
    );
}

function displaysForm(text: string, form: string) {
  return ` ${adventureTokens(text).join(' ')} `.includes(` ${adventureTokens(form).join(' ')} `);
}

export function inspectAdventurePrerequisites({
  chapter,
  practice,
  audit,
  definitions,
  priorTeaching,
  properNames,
}: AdventureCurriculum) {
  const issues: string[] = [];
  const taught = new Set(priorTeaching);
  const teaching = new Set<string>();
  const assessments = new Set<string>();
  const independent: TravelExerciseStep[] = [];
  const names = properNames.flatMap((name) => [
    ...adventureTokens(name),
    ...adventureTokens(`${name}'s`),
  ]);

  function inspectExercise(step: TravelExerciseStep) {
    const location = `chapter=${chapter.id} exercise=${step.id}`;
    if (assessments.has(step.id)) issues.push(`${location} Duplicate ID / ID duplicado`);
    assessments.add(step.id);
    if (
      !Object.hasOwn(audit.assessments, step.id) ||
      audit.assessments[step.id] !== rpgAssessmentDigest(step) ||
      !exactRpgAssessment(step, definitions) ||
      !step.requires
    ) {
      issues.push(`${location} Unreviewed assessment / Evaluación sin revisar`);
      return;
    }
    const missing = step.requires.map(teachingReferenceKey).filter((key) => !taught.has(key));
    if (missing.length)
      issues.push(
        `${location} Untaught requirements / Requisitos sin enseñar: ${missing.join(', ')}`,
      );
    const words = [
      ...optionalAssessmentEnglish(step.exercise, step.audio),
      ...(!step.exercise.options ? step.exercise.acceptedAnswers : []),
    ].flatMap(adventureTokens);
    const permitted = new Set([
      ...names,
      ...step.requires.flatMap(({ id, form }) =>
        definitions.get(id)?.kind === 'lexical' ? adventureTokens(form ?? '') : [],
      ),
    ]);
    const uncovered = [...new Set(words.filter((word) => !permitted.has(word)))];
    if (uncovered.length)
      issues.push(
        `${location} Unannotated vocabulary / Vocabulario sin anotar: ${uncovered.join(', ')}`,
      );
    if (step.audio && step.transcript !== step.audio)
      issues.push(
        `${location} Audio does not match transcript / Audio distinto de la transcripción`,
      );
    if (
      !missing.length &&
      !uncovered.length &&
      !step.exercise.ungradable &&
      !step.exercise.learning?.guided &&
      step.exercise.type !== 'reorder'
    )
      independent.push(step);
  }

  for (const mission of chapter.missions) {
    for (const step of mission.steps) {
      if (step.type === 'exercise') inspectExercise(step);
      if (step.type !== 'teach' || !step.instruction) continue;
      const location = `chapter=${chapter.id} mission=${mission.id} teaching=${step.id}`;
      if (teaching.has(step.id)) issues.push(`${location} Duplicate ID / ID duplicado`);
      teaching.add(step.id);
      const words = travelStepVocabulary(mission, step);
      if (step.vocabularyTerms && words.length !== new Set(step.vocabularyTerms).size) {
        issues.push(`${location} Missing visible vocabulary / Falta vocabulario visible`);
      }
      if (
        !Object.hasOwn(audit.teaching, step.id) ||
        audit.teaching[step.id] !== rpgTeachingDigest(step, words)
      ) {
        issues.push(`${location} Unreviewed lesson material / Material de la lección sin revisar`);
        continue;
      }
      if (step.instruction.stage !== 'vocabulary') {
        const refs = step.instruction.references;
        if (!exactRpgReferences(refs, definitions)) {
          issues.push(`${location} Invalid exact instruction / Enseñanza exacta inválida`);
        } else {
          const displayed = [
            step.text,
            ...step.examples.map(({ en }) => en),
            ...(step.patterns ?? []).map(({ parts }) => parts.map(({ text }) => text).join(' ')),
          ];
          for (const ref of refs) {
            if (
              definitions.get(ref.id)?.kind === 'lexical' &&
              !displayed.some((line) => displaysForm(line, ref.form!))
            ) {
              issues.push(
                `${location} Missing shown form / Falta forma visible: ${teachingReferenceKey(ref)}`,
              );
              continue;
            }
            taught.add(teachingReferenceKey(ref));
          }
        }
      }
      if (step.instruction.stage !== 'grammar')
        for (const word of words) {
          if (!exactRpgReferences(word.teaches, definitions)) {
            issues.push(
              `${location} Invalid exact word instruction / Enseñanza exacta de palabra inválida: ${word.term}`,
            );
            continue;
          }
          for (const ref of word.teaches) {
            if (
              definitions.get(ref.id)?.kind !== 'lexical' ||
              ![word.term, word.example.en].some((line) => displaysForm(line, ref.form!))
            ) {
              issues.push(
                `${location} Missing shown form / Falta forma visible: ${teachingReferenceKey(ref)}`,
              );
              continue;
            }
            taught.add(teachingReferenceKey(ref));
          }
        }
    }
  }
  for (const step of practice) inspectExercise(step);
  for (const id of Object.keys(audit.teaching))
    if (!teaching.has(id))
      issues.push(
        `chapter=${chapter.id} teaching=${id} Review without visible instruction / Revisión sin enseñanza visible`,
      );
  for (const id of Object.keys(audit.assessments))
    if (!assessments.has(id))
      issues.push(
        `chapter=${chapter.id} exercise=${id} Review without assessment / Revisión sin evaluación`,
      );
  return { issues, taught, independent, teaching: teaching.size, assessments: assessments.size };
}
