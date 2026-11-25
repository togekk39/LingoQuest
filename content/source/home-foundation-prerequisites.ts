import type { RpgFormalDefinition } from '../../packages/course-pack/src/index';
import type { PrerequisiteReference } from '../../packages/course-pack/src/prerequisites';
import type { Translation } from '@lingoquest/contracts';
import type {
  LearningError,
  LearningTarget,
} from '../../packages/offline-engine/src/travel-learning';
import type {
  TravelExerciseStep,
  TravelMission,
  TravelStep,
  TravelVocabulary,
} from '../../packages/offline-engine/src/travel-content';

const lessonId = 'travel_home';

export const homeFoundationLearningDefinitions: RpgFormalDefinition[] = [];
export const pair = (en: string, es: string): Translation => ({ en, es });

export type Word = Translation & { ref: PrerequisiteReference };

export function word(
  en: string,
  es: string,
  id = `lex.home.${en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '')}`,
): Word {
  const existing = homeFoundationLearningDefinitions.find((entry) => entry.id === id);
  if (existing) {
    if (!existing.forms.includes(en)) {
      existing.forms.push(en);
      existing.examples.push(pair(en, es));
    }
  } else {
    homeFoundationLearningDefinitions.push({
      id,
      kind: 'lexical',
      labelEs: es,
      forms: [en],
      examples: [pair(en, es)],
    });
  }
  return { en, es, ref: { id, form: en } };
}

export function coreWord(en: string, es: string, id: string): Word {
  return { en, es, ref: { id, form: en } };
}

export function rule(id: string, labelEs: string, example: Translation): PrerequisiteReference {
  homeFoundationLearningDefinitions.push({
    id,
    kind: 'grammar',
    labelEs,
    forms: [],
    examples: [example],
  });
  return { id };
}

type Requirement = Word | PrerequisiteReference;

function references(requirements: readonly Requirement[]): PrerequisiteReference[] {
  const exact = new Map<string, PrerequisiteReference>();
  for (const requirement of requirements) {
    const ref = 'ref' in requirement ? requirement.ref : requirement;
    exact.set(`${ref.id}:${ref.form?.toLowerCase() ?? ''}`, ref);
  }
  return [...exact.values()];
}

type Speaker = 'Sam' | 'Luz';
type Objective =
  | `lq-home-start.${'greet' | 'name' | 'spell' | 'repair'}`
  | `lq-home-plaza.${'origins' | 'people-things' | 'place' | 'direction' | 'objects-map' | 'bag'}`;

function vocabulary(words: readonly Word[]): TravelVocabulary[] {
  return words.map(({ en, es, ref }) => ({
    term: en,
    meaning: es,
    kind: 'Inglés',
    explanation: es,
    example: pair(en, es),
    teaches: [ref],
  }));
}

export function mission(
  id: string,
  foundationObjectiveId: Objective,
  title: string,
  place: string,
  objective: string,
  anchor: Word,
  steps: TravelStep[],
): TravelMission {
  return {
    id,
    title,
    place,
    objective,
    optional: true,
    foundationObjectiveId,
    authoredAudio: true,
    minutes: [2, 5],
    success: 'Puedes volver a practicar cuando quieras.',
    vocabulary: vocabulary([anchor]),
    steps,
  };
}

export function teach(
  id: string,
  speaker: Speaker,
  title: string,
  text: string,
  words: readonly Word[],
  examples: Translation[] = [],
  patterns: PrerequisiteReference[] = [],
): TravelStep {
  return {
    id,
    type: 'teach',
    speaker,
    title,
    text,
    vocabularyTerms: [],
    examples: [...words.map(({ en, es }) => pair(en, es)), ...examples],
    instruction: { lessonId, stage: 'grammar', references: references([...words, ...patterns]) },
  };
}

type Check = {
  id: string;
  target: Requirement;
  requires: readonly Requirement[];
  contextId: string;
  situation: string;
  promptEs: string;
  feedbackEs: string;
  hint?: string;
  guided?: true;
  transfer?: true;
  errors?: LearningError[];
  errorAnswers?: LearningTarget['errorAnswers'];
  remediates?: LearningError[];
};

function assessment(
  details: Check,
  dimension: 'listening' | 'reading' | 'writing' | 'grammar_production',
  exercise: Partial<TravelExerciseStep['exercise']>,
  cues: Partial<TravelExerciseStep> = {},
): TravelExerciseStep {
  const {
    id,
    target,
    requires,
    contextId,
    situation,
    promptEs,
    feedbackEs,
    hint,
    guided,
    transfer,
    errors,
    errorAnswers,
    remediates,
  } = details;
  const targetId = ('ref' in target ? target.ref : target).id;
  const skill = dimension === 'grammar_production' ? 'grammar' : dimension;
  const optionError = errors?.length === 1 ? errors[0] : undefined;
  const optionErrors =
    optionError && exercise.options
      ? Object.fromEntries(
          exercise.options
            .filter(({ id }) => id !== exercise.correctOptionId)
            .map(({ id }) => [id, optionError]),
        )
      : undefined;
  return {
    id,
    type: 'exercise',
    lessonId,
    situation,
    hint,
    requires: references([target, ...requires]),
    targets: [{ targetId, dimension }],
    exercise: {
      id,
      type: 'short_text',
      promptEs,
      feedbackEs,
      acceptedAnswers: [],
      difficulty: 1,
      skillId: targetId,
      learning: {
        conceptId: targetId,
        skill,
        contextId,
        guided,
        errors,
        errorAnswers,
        optionErrors,
        remediates,
        evidence: transfer
          ? 'transfer'
          : skill === 'listening' || skill === 'reading'
            ? 'understanding'
            : 'production',
      },
      ...exercise,
    },
    ...cues,
  };
}

type Choices = readonly (readonly [string, string])[];

export function hear(
  details: Check,
  audio: string,
  options: Choices,
  correctOptionId: string,
): TravelExerciseStep {
  return assessment(
    details,
    'listening',
    {
      type: 'single_choice',
      optionsLanguage: 'es',
      options: options.map(([id, text]) => ({ id, text })),
      correctOptionId,
    },
    { audio, transcript: audio, listeningButton: 'Escuchar el mensaje' },
  );
}

export function read(
  details: Check,
  passage: string,
  options: Choices,
  correctOptionId: string,
  optionsLanguage: 'en' | 'es' = 'es',
): TravelExerciseStep {
  return assessment(details, 'reading', {
    type: 'single_choice',
    passage,
    options: options.map(([id, text]) => ({ id, text })),
    optionsLanguage,
    correctOptionId,
  });
}

export function write(details: Check, answers: string[], grammar = false): TravelExerciseStep {
  return assessment(details, grammar ? 'grammar_production' : 'writing', {
    acceptedAnswers: answers,
  });
}

export function spell(details: Check): TravelExerciseStep {
  return assessment(
    details,
    'writing',
    { spelling: { model: '[las letras de tu nombre]' } },
    { response: 'personal-spelling' },
  );
}

export function say(
  id: string,
  target: Requirement,
  contextId: string,
  phrase: string,
  text: string,
): TravelStep {
  const conceptId = ('ref' in target ? target.ref : target).id;
  const learning: LearningTarget = {
    conceptId,
    skill: 'speaking',
    contextId,
    evidence: 'production',
  };
  return {
    id,
    type: 'speak',
    phrase,
    text,
    learning,
    exampleLabel: 'Modelo para comparar',
    speech: { selfCheck: true },
  };
}
