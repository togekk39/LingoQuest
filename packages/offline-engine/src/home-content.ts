import type { RpgAdventureAudit } from '@lingoquest/course-pack';
import type { CourseData, CourseExercise, CourseLesson } from './index';
import type { StoryDefinition } from './story';
import type { TravelChapter, TravelExerciseStep } from './travel-content';
import {
  chapter as legacyChapter,
  travelLesson as legacyLesson,
  travelPracticeSteps as legacyPractice,
} from './travel-content';
import { chapterStory as legacyStory } from './chapter-story';
import { travelChallengePools as legacyChallenges } from './travel-challenge-pools';
import { travelPlacementItems as legacyPlacement } from './travel-placement-items';

export interface HomeContent {
  chapter: TravelChapter;
  adventure: StoryDefinition;
  practice: TravelExerciseStep[];
  lesson: CourseLesson;
  placement: { missionId: string; audio?: string; exercise: CourseExercise }[];
  challenges: CourseData['challengePools'];
  audit?: RpgAdventureAudit;
  supportingLessons?: CourseLesson[];
}

const legacyHome: HomeContent = {
  chapter: legacyChapter,
  adventure: legacyStory,
  lesson: legacyLesson,
  practice: legacyPractice,
  placement: legacyPlacement,
  challenges: legacyChallenges,
};

export let chapter = legacyHome.chapter;
export let travelLesson = legacyHome.lesson;
export let chapterStory = legacyHome.adventure;
export let travelPracticeSteps = legacyHome.practice;
export let travelPlacementItems = legacyHome.placement;
export let travelChallengePools = legacyHome.challenges;
export let homeAdventureAudit = legacyHome.audit;
export let homeSupportingLessons = legacyHome.supportingLessons;

export function installHomeContent(content: HomeContent = legacyHome) {
  chapter = content.chapter;
  chapterStory = content.adventure;
  travelLesson = content.lesson;
  travelPracticeSteps = content.practice;
  travelPlacementItems = content.placement;
  travelChallengePools = content.challenges;
  homeAdventureAudit = content.audit;
  homeSupportingLessons = content.supportingLessons;
}
