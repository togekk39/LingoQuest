import {
  homeFoundationLanguageMissions,
  homeFoundationLanguagePractice,
} from './home-foundation-language';
import {
  homeFoundationLiteracyMissions,
  homeFoundationLiteracyPractice,
} from './home-foundation-literacy';

export { homeFoundationLearningDefinitions } from './home-foundation-prerequisites';

export const homeFoundationMissions = [
  ...homeFoundationLiteracyMissions,
  ...homeFoundationLanguageMissions,
];

export const homeFoundationPractice = [
  ...homeFoundationLiteracyPractice,
  ...homeFoundationLanguagePractice,
];
