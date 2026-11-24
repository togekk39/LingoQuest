import type { CourseData } from './index';

import { travelChallengePools } from './home-content';
export { travelChallengePools } from './home-content';

export const HOME_TRAVEL_TRACK = 'home_journey';
export const availableTravelRanks = 3;
export function travelChallengeItems(type: keyof typeof travelChallengePools, level: number) {
  return travelChallengePools[type].filter((item) => !item.ungradable).slice(0, level + 2);
}

const ranks = [
  'Explorador',
  'Caminante',
  'Viajero',
  'Navegante',
  'Guía',
  'Cartógrafo',
  'Aventurero',
  'Pionero',
  'Mensajero',
  'Embajador',
  'Cronista',
  'Capitán',
  'Leyenda',
];
export const activeTravelCourse: CourseData = {
  units: [],
  lessons: {},
  placementQuestions: [],
  missions: [],
  speechDrills: [],
  challengePools: { grammar_rush: [], cloze_battle: [], reading_quest: [] },
  challengeLevels: ranks.map((name, i) => ({
    level: i + 1,
    name_es: name,
    hearts: i === 0 ? 3 : 2,
    grammar_rush_total_seconds: Math.max(30, 85 - i * 5),
    reading_clock_multiplier: 1,
    cloze_clock_multiplier: 1,
  })),
};
