import type { CourseExercise } from '../../packages/offline-engine/src';
import { cuscoLessons, g, p, refs, w, type CuscoTopic } from './cusco-lessons';

type Mode = 'grammar_rush' | 'cloze_battle' | 'reading_quest';
type Word = (typeof w)[keyof typeof w];
type Prompt = {
  topic: CuscoTopic;
  words: Word[];
  sentence: string;
  answers: string[];
  read: string;
  question: string;
  options: string[];
  feedback: string;
};

const prompts: Prompt[] = [
  {
    topic: 'be',
    words: [w.she, w.they, w.was, w.were, w.werent, w.not, w.at, w.the, w.park, w.hotel],
    sentence: 'They ___ at the hotel.',
    answers: ['were', 'was'],
    read: 'Luz was at the hotel. Sam was at the park.',
    question: '¿Dónde estaba Sam?',
    options: ['En el parque.', 'En el hotel.'],
    feedback: 'They usa were. La nota dice que Sam estaba en el parque.',
  },
  {
    topic: 'regular',
    words: [w.we, w.the, w.call, w.called, w.visit, w.visited, w.plaza, w.first, w.then],
    sentence: 'Sam ___ Luz.',
    answers: ['called', 'call'],
    read: 'First, Luz called Sam. Then we visited the plaza.',
    question: '¿Qué pasó primero?',
    options: ['Luz llamó a Sam.', 'Visitamos la plaza.'],
    feedback: 'Called es el pasado de call. First señala la llamada.',
  },
  {
    topic: 'irregular',
    words: [w.go, w.went, w.to, w.the, w.market, w.yesterday, w.bought, w.bread, w.before, w.after],
    sentence: 'Nora ___ to the market yesterday.',
    answers: ['went', 'go'],
    read: 'Diego bought bread after Sam went to the market.',
    question: '¿Qué sucedió después de que Sam fue al mercado?',
    options: ['Diego compró pan.', 'Sam compró pan.'],
    feedback: 'Went es el pasado de go. La compra pasó después.',
  },
  {
    topic: 'ask',
    words: [w.did, w.you, w.i, w.buy, w.bought, w.bread, w.coffee, w.didnt, w.no, w.didNot],
    sentence: 'Did you ___ bread?',
    answers: ['buy', 'bought'],
    read: "Nora: Did you buy coffee? Ana: No, I didn't. I bought bread.",
    question: '¿Qué compró Ana?',
    options: ['Pan.', 'Café.'],
    feedback: 'Después de did usa buy. La compra confirmada fue la de pan.',
  },
];

function define(mode: Mode, data: Prompt) {
  const { topic, words, sentence, answers, read, question, options, feedback } = data;
  const reading = mode === 'reading_quest';
  const cloze = mode === 'cloze_battle';
  const id = `challenge_cusco_${mode}_${topic}`;
  const choices = reading ? options : answers;
  const conceptId = topic === 'ask' && !reading ? p.ask.id : g[topic].id;
  const exercise: CourseExercise = {
    id,
    type: reading ? 'meaning' : cloze ? 'cloze' : 'single_choice',
    difficulty: 3,
    requiredLessonIds: [cuscoLessons[topic]],
    skillId: conceptId,
    promptEs: reading
      ? question
      : `Completa la nota del viaje con la forma correcta. ${topic === 'ask' ? 'Fíjate en el verbo después de did.' : 'La nota habla de ayer.'}`,
    feedbackEs: feedback,
    ...(reading ? { passage: read } : { sentence }),
    ...(cloze
      ? { dimension: 'grammar_production', acceptedAnswers: [choices[0]] }
      : {
          options: choices.map((text, index) => ({ id: String(index + 1), text })),
          correctOptionId: '1',
          acceptedAnswers: [choices[0]],
          ...(reading ? { optionsLanguage: 'es' } : { dimension: 'grammar_understanding' }),
        }),
    learning: {
      conceptId,
      contextId: `cusco.challenge.${mode}.${topic}`,
      skill: reading ? 'reading' : 'grammar',
      evidence: cloze ? 'production' : 'understanding',
    },
  };
  return {
    exercise,
    requires: refs(
      words,
      g[topic],
      p[topic],
      ...(topic === 'irregular' && reading ? [p.order, g.sequence] : []),
    ),
  };
}
export const cuscoChallenges = {
  grammar_rush: prompts.map((item) => define('grammar_rush', item)),
  cloze_battle: prompts.map((item) => define('cloze_battle', item)),
  reading_quest: prompts.map((item) => define('reading_quest', item)),
};
