import {
  judgeAnswer,
  normalizeAnswerText,
  type Answer,
  type AnswerOutcome,
} from '@lingoquest/contracts';
import type { PrivateExercise } from './content.ts';

export interface ChallengeClock {
  now(): number;
}
export class SystemClock implements ChallengeClock {
  now(): number {
    return Date.now();
  }
}
export interface GradingService {
  grade(exercise: PrivateExercise, answer: Answer): boolean;
  judge?(exercise: PrivateExercise, answer: Answer): AnswerOutcome;
}
export const normalize = normalizeAnswerText;
export class DeterministicGradingService implements GradingService {
  grade(exercise: PrivateExercise, answer: Answer): boolean {
    return this.judge(exercise, answer) === 'target';
  }
  judge(exercise: PrivateExercise, answer: Answer): AnswerOutcome {
    return judgeAnswer(exercise, answer);
  }
}
export interface SpeechAssessmentProvider {
  assess(): Promise<{
    status: 'unscorable';
    provider: 'not_configured';
    feedbackEs: string;
    stored: false;
  }>;
}
export class NeutralSpeechProvider implements SpeechAssessmentProvider {
  async assess() {
    return {
      status: 'unscorable' as const,
      provider: 'not_configured' as const,
      feedbackEs:
        'Puedes escuchar y comparar tu grabación. La evaluación de pronunciación no está conectada; no calculamos una puntuación sin evidencia.',
      stored: false as const,
    };
  }
}
export interface FeedbackProvider {
  explain(exercise: PrivateExercise, correct: boolean): string;
}
export class AuthoredFeedbackProvider implements FeedbackProvider {
  explain(exercise: PrivateExercise, correct: boolean): string {
    return `${correct ? '¡Muy bien!' : 'Buen intento. Puedes volver a intentarlo.'} ${exercise.feedbackEs}`;
  }
}
