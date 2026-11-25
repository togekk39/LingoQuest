import type { TravelMission, TravelStep } from './travel-content';

export function travelStepVocabulary(
  mission: TravelMission,
  step: Extract<TravelStep, { type: 'teach' }>,
) {
  const { vocabularyTerms } = step;
  return vocabularyTerms
    ? mission.vocabulary.filter(({ term }) => vocabularyTerms.includes(term))
    : mission.vocabulary;
}
