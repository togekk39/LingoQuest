import type { HomeContent } from './home-content';

export let chapter: HomeContent['chapter'] = {
  id: 'home',
  revision: 0,
  title: 'La primera postal',
  stamp: '',
  postcard: '',
  message: '',
  collectible: '',
  missions: [],
};
export let travelLesson: HomeContent['lesson'] = {
  id: 'travel_home',
  unitId: 'travel',
  title: chapter.title,
  introEs: '',
  examples: [],
  speakingText: '',
  estimatedMinutes: 0,
  exercises: [],
};
export let chapterStory: HomeContent['adventure'] = {
  id: 'home',
  revision: 0,
  initialSceneId: '',
  scenes: [],
  npcs: [],
  items: [],
  quests: [],
  dialogues: [],
  encounters: [],
};
export let travelPracticeSteps: HomeContent['practice'] = [];
export let travelPlacementItems: HomeContent['placement'] = [];
export let travelChallengePools: HomeContent['challenges'] = {
  grammar_rush: [],
  cloze_battle: [],
  reading_quest: [],
};

export function installHomeContent(content: HomeContent) {
  chapter = content.chapter;
  chapterStory = content.adventure;
  travelLesson = content.lesson;
  travelPracticeSteps = content.practice;
  travelPlacementItems = content.placement;
  travelChallengePools = content.challenges;
}
