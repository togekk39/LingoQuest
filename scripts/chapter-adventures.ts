import { publicExercise } from '@lingoquest/offline-engine';
import {
  chapter,
  travelLesson,
  travelPracticeSteps,
} from '../packages/offline-engine/src/travel-content';
import { homeFoundationStory } from '../packages/offline-engine/src/chapter-story';
import { travelChallengePools } from '../packages/offline-engine/src/travel-challenge-pools';
import { travelPlacementItems } from '../packages/offline-engine/src/travel-placement-items';
import { placementQuestions } from '../packages/offline-engine/src/travel-placement';
import {
  homeFoundationLearningDefinitions,
  homeFoundationMissions,
  homeFoundationPractice,
} from '../content/source/home-foundation';
import homeReview from '../content/source/home-foundation-rpg-review.json';
import { mexicoChallengePools } from '../content/source/mexico-challenges';
import { mexicoChapter, mexicoPractice } from '../content/source/mexico-missions';
import { mexicoAdventure } from '../content/source/mexico-story';
import { mexicoLearningDefinitions } from '../content/source/mexico-prerequisites';
import { mexicoChallengeReviews } from '../content/source/prerequisites/mexico-challenges';
import mexicoReview from '../content/source/mexico-rpg-review.json';
import {
  cartagenaChallengePools,
  cartagenaChallengeReviews,
} from '../content/source/cartagena-challenges';
import { cartagenaChapter, cartagenaPractice } from '../content/source/cartagena-missions';
import { cartagenaAdventure } from '../content/source/cartagena-story';
import { cartagenaLearningDefinitions } from '../content/source/cartagena-prerequisites';
import { cuscoChapter } from '../content/source/cusco-missions';
import { cuscoPractice } from '../content/source/cusco-assessments';
import { cuscoAdventure } from '../content/source/cusco-story';
import { cuscoDefinitions } from '../content/source/cusco-lessons';
import { cuscoChallenges } from '../content/source/cusco-challenges';
import cuscoReview from '../content/source/cusco-rpg-review.json';
import cuscoChallengeDigests from '../content/source/cusco-challenge-review.json';
import { eventScenarioPhrases } from '../packages/offline-engine/src/event-scenario';
import cartagenaReview from '../content/source/cartagena-rpg-review.json';
import {
  formalDefinitions,
  teachingReferenceKey,
} from '../packages/offline-engine/src/learning-prerequisites';
import { canonicalLearningId } from '../packages/offline-engine/src/learning-registry';
import type { StoryDefinition } from '../packages/offline-engine/src/story';
import type {
  TravelChapter,
  TravelExerciseStep,
} from '../packages/offline-engine/src/travel-content';
import bundled from '../apps/mobile/src/content/bundled-course.json';
import {
  chapterLessonPhrases,
  type CoursePayload,
  type RpgAdventureAudit,
} from '@lingoquest/course-pack';

const {
  units: courseUnits,
  lessons: courseLessons,
  ...courseActivities
} = bundled.payload as CoursePayload;

function portableDefinitions(
  chapter: TravelChapter,
  practice: readonly TravelExerciseStep[],
  localLessonIds: readonly string[],
  audit: RpgAdventureAudit,
) {
  const local = formalDefinitions({
    lessons: Object.fromEntries(localLessonIds.map((id) => [id, courseLessons[id]])),
  });
  const reviewed = formalDefinitions({ lessons: courseLessons });
  const authored = new Set(audit.definitions.map(({ id }) => id));
  const references = [
    ...chapter.missions.flatMap(({ vocabulary, steps }) => [
      ...vocabulary.flatMap(({ teaches }) => teaches ?? []),
      ...steps.flatMap((step) =>
        step.type === 'teach'
          ? (step.instruction?.references ?? [])
          : step.type === 'exercise'
            ? (step.requires ?? [])
            : [],
      ),
    ]),
    ...practice.flatMap(({ requires }) => requires ?? []),
    ...Object.values(audit.challenges ?? {}).flatMap(({ requires }) => requires),
  ];
  return [
    ...audit.definitions,
    ...[...new Set(references.map(({ id }) => id))].flatMap((id) => {
      const definition = reviewed.get(id);
      if (local.has(id) || authored.has(id) || !definition) return [];
      const canonical = local.get(canonicalLearningId(id));
      if (
        canonical &&
        definition.forms.every((form) =>
          canonical.forms.some(
            (localForm) =>
              teachingReferenceKey({ id: canonical.id, form: localForm }) ===
              teachingReferenceKey({ id, form }),
          ),
        )
      )
        return [];
      const { kind, labelEs, forms, examples } = definition;
      return [
        {
          id,
          kind,
          labelEs,
          forms,
          examples: examples.length ? examples : forms.map((en) => ({ en, es: labelEs })),
        },
      ];
    }),
  ];
}
function adventurePhrases({
  chapter,
  adventure,
  practice,
}: {
  chapter: TravelChapter;
  adventure: StoryDefinition;
  practice: readonly Pick<TravelExerciseStep, 'audio'>[];
}) {
  return [
    ...adventure.dialogues.flatMap(({ line }) => (line ? [line.en] : [])),
    ...(adventure.repairPhrases?.map(({ phrase }) => phrase.en) ?? []),
    ...chapter.missions.flatMap(({ vocabulary, steps, scenario }) => [
      ...(scenario && 'kind' in scenario ? eventScenarioPhrases(scenario) : []),
      ...vocabulary.flatMap(({ term, example }) => [term, example.en]),
      ...steps.flatMap((step) => {
        if (step.type === 'dialogue') return step.line ? [step.line.en] : [];
        if (step.type === 'teach') return step.examples.map(({ en }) => en);
        if (step.type === 'speak') return [step.phrase];
        return [
          step.audio,
          step.storyReply?.line.en,
          ...(step.storyReplies?.map(({ line }) => line.en) ?? []),
        ].filter((phrase): phrase is string => !!phrase);
      }),
    ]),
    ...practice.flatMap(({ audio }) => (audio ? [audio] : [])),
  ];
}

const homeAudit: RpgAdventureAudit = {
  ...homeReview,
  definitions: homeFoundationLearningDefinitions,
};
const homeChapter: TravelChapter = {
  ...chapter,
  revision: 11,
  reviewedHomeCore: true,
  missions: [...chapter.missions, ...homeFoundationMissions],
};
const homePractice = [...travelPracticeSteps, ...homeFoundationPractice];
export const homeStory = {
  chapter: homeChapter,
  adventure: homeFoundationStory,
  practice: homePractice,
  audit: {
    ...homeAudit,
    definitions: portableDefinitions(
      homeChapter,
      homePractice,
      courseUnits.find(({ id }) => id === 'u01')!.lessons.map(({ id }) => id),
      homeAudit,
    ),
  },
  runtime: {
    lesson: travelLesson,
    placement: travelPlacementItems,
    challenges: travelChallengePools,
    course: courseActivities,
  },
};
const mexicoSupportingLessonIds = ['u03_l01', 'u03_l02'];
const mexicoAudit: RpgAdventureAudit = {
  ...mexicoReview,
  definitions: [...mexicoLearningDefinitions],
  challenges: Object.fromEntries(
    Object.entries(mexicoChallengeReviews).map(([id, entry]) => [
      id,
      { ...entry, requires: [...entry.requires] },
    ]),
  ),
};
export const mexicoStory = {
  chapter: mexicoChapter,
  adventure: mexicoAdventure,
  practice: mexicoPractice,
  supportingLessons: mexicoSupportingLessonIds.map((id) => courseLessons[id]),
  challenges: mexicoChallengePools,
  audit: {
    ...mexicoAudit,
    definitions: portableDefinitions(
      mexicoChapter,
      mexicoPractice,
      [
        ...(courseUnits.find(({ id }) => id === 'u02')?.lessons.map(({ id }) => id) ?? []),
        ...mexicoSupportingLessonIds,
      ],
      mexicoAudit,
    ),
  },
};

const cartagenaSupportingLessonIds = ['u08_l01'];
const cartagenaAudit: RpgAdventureAudit = {
  ...cartagenaReview,
  definitions: [...cartagenaLearningDefinitions],
  challenges: Object.fromEntries(
    Object.entries(cartagenaChallengeReviews).map(([id, entry]) => [
      id,
      { ...entry, requires: [...entry.requires] },
    ]),
  ),
};
export const cartagenaStory = {
  chapter: cartagenaChapter,
  adventure: cartagenaAdventure,
  practice: cartagenaPractice,
  supportingLessons: cartagenaSupportingLessonIds.map((id) => courseLessons[id]),
  challenges: cartagenaChallengePools,
  audit: {
    ...cartagenaAudit,
    definitions: portableDefinitions(
      cartagenaChapter,
      cartagenaPractice,
      [
        ...(courseUnits.find(({ id }) => id === 'u03')?.lessons.map(({ id }) => id) ?? []),
        ...cartagenaSupportingLessonIds,
      ],
      cartagenaAudit,
    ),
  },
};

const cuscoAudit: RpgAdventureAudit = {
  ...cuscoReview,
  definitions: [...cuscoDefinitions],
  challenges: Object.fromEntries(
    Object.values(cuscoChallenges)
      .flat()
      .map(({ exercise, requires }) => [
        exercise.id,
        { requires, digest: (cuscoChallengeDigests as Record<string, string>)[exercise.id] },
      ]),
  ),
};
export const cuscoStory = {
  chapter: cuscoChapter,
  adventure: cuscoAdventure,
  practice: cuscoPractice,
  supportingLessons: [],
  challenges: {
    grammar_rush: cuscoChallenges.grammar_rush.map(({ exercise }) => exercise),
    cloze_battle: cuscoChallenges.cloze_battle.map(({ exercise }) => exercise),
    reading_quest: cuscoChallenges.reading_quest.map(({ exercise }) => exercise),
  },
  audit: {
    ...cuscoAudit,
    definitions: portableDefinitions(
      cuscoChapter,
      cuscoPractice,
      courseUnits.find(({ id }) => id === 'u04')!.lessons.map(({ id }) => id),
      cuscoAudit,
    ),
  },
};

type AuthoredAdventure =
  typeof homeStory | typeof mexicoStory | typeof cartagenaStory | typeof cuscoStory;

export function reviewedAdventure(story: AuthoredAdventure) {
  if (!('runtime' in story)) return story;
  const legacyPracticeIds = new Set(travelPracticeSteps.map(({ id }) => id));
  return {
    ...story,
    chapter: {
      ...story.chapter,
      missions: story.chapter.missions.filter(({ foundationObjectiveId }) => foundationObjectiveId),
    },
    practice: story.practice.filter(({ id }) => !legacyPracticeIds.has(id)),
  };
}

export const chapterAdventures = new Map<
  string,
  {
    story: AuthoredAdventure;
    phrases: string[];
    properNames?: string[];
    reuseAudioFrom?: string[];
  }
>([
  [
    homeStory.chapter.id,
    {
      story: homeStory,
      properNames: ['Ana', 'ULZ', 'ZUL'],
      phrases: [
        ...adventurePhrases(homeStory),
        ...placementQuestions(publicExercise).flatMap(({ audio }) => (audio ? [audio] : [])),
        'Hi! My name is Sam.',
        'Hi! I am',
        // Retain the clip used by open Home revision 3 sessions.
        // Conserva el audio de las sesiones abiertas de Home revisión 3.
        'Nice to meet you! Can you help me find the bus stop?',
      ],
    },
  ],
  [
    mexicoStory.chapter.id,
    {
      story: mexicoStory,
      properNames: ['Clara', 'Sol', 'Mexico City', 'Ana', 'Nora', 'Eli', 'Eva', 'Luz'],
      phrases: [
        ...adventurePhrases(mexicoStory),
        ...chapterLessonPhrases([], mexicoStory.supportingLessons),
      ],
    },
  ],
  [
    cartagenaStory.chapter.id,
    {
      story: cartagenaStory,
      properNames: [
        'Cartagena',
        'Cusco',
        'Colombia',
        'Colombian',
        'Sam',
        'Luz',
        'Mar',
        'Alba',
        'Leo',
      ],
      reuseAudioFrom: ['home', 'mexico'],
      phrases: [
        ...adventurePhrases(cartagenaStory),
        ...chapterLessonPhrases([], cartagenaStory.supportingLessons),
      ],
    },
  ],
  [
    cuscoStory.chapter.id,
    {
      story: cuscoStory,
      properNames: ['Cusco', 'Nora', 'Ana', 'Diego', 'Sam', 'Luz'],
      reuseAudioFrom: ['home', 'mexico', 'colombia'],
      phrases: adventurePhrases(cuscoStory),
    },
  ],
]);
