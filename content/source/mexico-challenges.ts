import type { CourseExercise } from '../../packages/offline-engine/src';

type Target = readonly [lessonId: string, skillId: string, difficulty: number];
const routine: Target = ['u02_l01', 'grammar.routine_base', 1];
const others: Target = ['u02_l02', 'grammar.routine_third_person', 2];
const frequency: Target = ['u02_l03', 'grammar.frequency', 2];
const schedule: Target = ['u02_l04', 'grammar.routine_time', 3];
const questions: Target = ['u03_l01', 'grammar.do_questions', 5];
const negative: Target = ['u03_l02', 'grammar.dont', 6];

function author(
  id: string,
  target: Target,
  contextId: string,
  item: Pick<
    CourseExercise,
    'type' | 'sentence' | 'passage' | 'promptEs' | 'acceptedAnswers' | 'feedbackEs'
  > &
    Partial<Pick<CourseExercise, 'options' | 'optionsLanguage' | 'correctOptionId'>>,
): CourseExercise {
  const [lessonId, skillId, difficulty] = target;
  const reading = item.type === 'meaning';
  const production = item.type === 'cloze';
  return {
    ...item,
    id: `challenge_mexico_${id}`,
    skillId,
    difficulty,
    requiredLessonIds: [lessonId],
    ...(reading ? {} : { dimension: production ? 'grammar_production' : 'grammar_understanding' }),
    learning: {
      contextId,
      conceptId: skillId,
      skill: reading ? 'reading' : 'grammar',
      evidence: production ? 'production' : 'understanding',
    },
  };
}

function choice(answers: readonly [string, string], correct: 0 | 1) {
  return {
    options: answers.map((text, index) => ({ id: String(index + 1), text })),
    correctOptionId: String(correct + 1),
    acceptedAnswers: [answers[correct]],
  };
}

const grammar = (
  id: string,
  target: Target,
  sentence: string,
  answers: readonly [string, string],
  correct: 0 | 1,
  feedbackEs: string,
) =>
  author(`grammar_${id}`, target, 'mexico.market-shifts', {
    type: 'single_choice',
    sentence,
    promptEs: 'Estás revisando los turnos de otro puesto del mercado. Elige la forma que falta.',
    ...choice(answers, correct),
    feedbackEs,
  });

const cloze = (
  id: string,
  target: Target,
  sentence: string,
  acceptedAnswers: string[],
  promptEs: string,
  feedbackEs: string,
) =>
  author(`cloze_${id}`, target, 'mexico.volunteer-notes', {
    type: 'cloze',
    sentence,
    acceptedAnswers,
    promptEs,
    feedbackEs,
  });

const reading = (
  id: string,
  target: Target,
  passage: string,
  promptEs: string,
  answers: readonly [string, string],
  correct: 0 | 1,
  feedbackEs: string,
) =>
  author(`read_${id}`, target, 'mexico.neighborhood-schedules', {
    type: 'meaning',
    passage,
    promptEs,
    ...choice(answers, correct),
    optionsLanguage: 'es',
    feedbackEs,
  });

export const mexicoChallengePools = {
  grammar_rush: [
    grammar(
      'routine',
      routine,
      'I ___ at home.',
      ['works', 'work'],
      1,
      'Con I usamos work, sin -s.',
    ),
    grammar(
      'third',
      others,
      'Leo ___ English at noon.',
      ['studies', 'study'],
      0,
      'Leo equivale a he. Study cambia a studies.',
    ),
    grammar(
      'time',
      schedule,
      'I start ___ six.',
      ['in', 'at'],
      1,
      'Usamos at delante de una hora: at six.',
    ),
    grammar(
      'do',
      questions,
      '___ you have breakfast at eight?',
      ['Do', 'Does'],
      0,
      'Con you, empieza con Do y conserva la forma base have: Do you have breakfast at eight?',
    ),
    grammar(
      'does',
      questions,
      '___ Sol work at noon?',
      ['Do', 'Does'],
      1,
      'Sol es una persona. Usamos Does y el verbo base work.',
    ),
    grammar(
      'negative',
      negative,
      'I ___ study at night.',
      ["don't", "doesn't"],
      0,
      'Con I usamos don’t y el verbo base study.',
    ),
  ],
  cloze_battle: [
    cloze(
      'routine',
      routine,
      'I ___ English at home.',
      ['study'],
      'Completa la nota: «Estudio inglés en casa». Usa el verbo study.',
      'I study English at home. Con I, study va sin -s.',
    ),
    cloze(
      'time',
      schedule,
      'I have breakfast ___ six.',
      ['at'],
      'Completa tu nota: «Desayuno a las seis». Escribe la preposición.',
      'Usamos at para la hora: I have breakfast at six.',
    ),
    cloze(
      'do',
      questions,
      '___ you study at night?',
      ['do'],
      'Pregúntale a otro voluntario si estudia por la noche. Escribe el auxiliar.',
      'Do you study at night? Con you usamos Do y el verbo base study.',
    ),
    cloze(
      'does',
      questions,
      '___ Leo study at noon?',
      ['does'],
      'Pregunta si Leo estudia al mediodía. Escribe el auxiliar.',
      'Does Leo study at noon? Con Leo usamos Does y el verbo base study.',
    ),
    cloze(
      'negative',
      negative,
      'Sol ___ work at eight.',
      ["doesn't", 'does not'],
      'Completa «Sol no trabaja a las ocho». Puedes usar el auxiliar negativo completo o contraído.',
      'Con Sol, does not y doesn’t van antes del verbo base work.',
    ),
  ],
  reading_quest: [
    reading(
      'morning',
      frequency,
      'Leo usually works at home in the morning. Sol never works at home at night.',
      '¿Quién dice que nunca trabaja en casa por la noche?',
      ['Leo', 'Sol'],
      1,
      'Sol never works at home at night. Never significa «nunca».',
    ),
    reading(
      'schedule',
      schedule,
      'Luz: I work at six. I have breakfast at eight.\nSam: I have breakfast at six. I work at eight.',
      '¿Quién trabaja a las ocho?',
      ['Sam', 'Luz'],
      0,
      'Sam dice I work at eight. Luz desayuna a las ocho.',
    ),
    reading(
      'questions',
      questions,
      'Luz: Do you work at six?\nSam: Yes.\nLuz: Does Leo work at six?\nSam: No. Leo works at noon.',
      '¿Quién trabaja a las seis?',
      ['Leo', 'Sam'],
      1,
      'Sam responde Yes cuando Luz le pregunta si trabaja a las seis. Leo trabaja al mediodía.',
    ),
  ],
};
