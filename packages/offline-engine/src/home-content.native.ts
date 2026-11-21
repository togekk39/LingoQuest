import type { HomeContent } from './home-content';
import { homeChapterDetails } from './travel-route';

const emptyHome: HomeContent = {
  chapter: { ...homeChapterDetails, revision: 0, missions: [] },
  lesson: {
    id: 'travel_home',
    unitId: 'travel',
    title: homeChapterDetails.title,
    introEs: '',
    examples: [],
    speakingText: '',
    estimatedMinutes: 0,
    exercises: [],
  },
  adventure: {
    id: homeChapterDetails.id,
    revision: 0,
    initialSceneId: '',
    scenes: [],
    npcs: [],
    items: [],
    quests: [],
    dialogues: [],
    encounters: [],
  },
  practice: [],
  placement: [],
  challenges: { grammar_rush: [], cloze_battle: [], reading_quest: [] },
};

export let chapter = emptyHome.chapter;
export let travelLesson = emptyHome.lesson;
export let chapterStory = emptyHome.adventure;
export let travelPracticeSteps = emptyHome.practice;
export let travelPlacementItems = emptyHome.placement;
export let travelChallengePools = emptyHome.challenges;

export function installHomeContent(content: HomeContent = emptyHome) {
  chapter = content.chapter;
  chapterStory = content.adventure;
  travelLesson = content.lesson;
  travelPracticeSteps = content.practice;
  travelPlacementItems = content.placement;
  travelChallengePools = content.challenges;
}
