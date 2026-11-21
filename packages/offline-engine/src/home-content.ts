import type { CourseData, CourseExercise, CourseLesson } from './index';
import type { StoryDefinition } from './story';
import type { TravelChapter, TravelExerciseStep } from './travel-content';

export interface HomeContent {
  chapter: TravelChapter;
  adventure: StoryDefinition;
  practice: TravelExerciseStep[];
  lesson: CourseLesson;
  placement: { missionId: string; audio?: string; exercise: CourseExercise }[];
  challenges: CourseData['challengePools'];
}

export { chapter, travelLesson, travelPracticeSteps } from './travel-content';
export { chapterStory } from './chapter-story';
export { travelChallengePools } from './travel-challenge-pools';
export { travelPlacementItems } from './travel-placement-items';

export function installHomeContent(_content: HomeContent) {}
