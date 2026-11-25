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
export let homeAdventureAudit = emptyHome.audit;
export let homeSupportingLessons = emptyHome.supportingLessons;

export function installHomeContent(content: HomeContent = emptyHome) {
  chapter = content.chapter;
  const greeting = content.adventure.encounters.find(({ id }) => id === 'greet-sam');
  chapterStory =
    greeting?.freshEntryStepId === 'travel_hello_write'
      ? {
          ...content.adventure,
          encounters: content.adventure.encounters.map((encounter) =>
            encounter === greeting ? { ...encounter, freshEntryStepId: 'hello_teach' } : encounter,
          ),
        }
      : content.adventure;
  travelLesson = content.lesson;
  travelPracticeSteps = content.practice;
  travelPlacementItems = content.placement;
  travelChallengePools = content.challenges;
  homeAdventureAudit = content.audit;
  homeSupportingLessons = content.supportingLessons;
}
