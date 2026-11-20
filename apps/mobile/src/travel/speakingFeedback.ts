import { normalize } from '@lingoquest/offline-engine';

function speechText(value: string) {
  return normalize(value.replace(/[.,!?;:]/g, ' '))
    .replace(/\bi'?m\b/g, 'i am')
    .replace(/\bit'?s\b/g, 'it is');
}

const greeting = /^(?:hi|hello)\b/;
const introduction = /^(?:(?:hi|hello) )?(?:i am|my name is)\b/;

export function introductionFeedback(transcript: string) {
  const text = speechText(transcript);
  const hasGreeting = greeting.test(text);
  const hasIntroduction = introduction.test(text);
  const name = text.replace(introduction, '').trim();
  const hasName =
    hasIntroduction &&
    /^\p{L}[\p{L}'-]*(?: \p{L}[\p{L}'-]*)*$/u.test(name) &&
    !/^(?:not|a|an|the)\b/.test(name) &&
    !/^(?:fine|good|okay|ok|(?:uh|um|er|ah)(?: (?:uh|um|er|ah))*)$/.test(name);

  return {
    content:
      hasGreeting && hasName
        ? 'El texto incluye un saludo y una presentación. Revisa si tu nombre quedó bien escrito.'
        : hasGreeting
          ? 'El texto incluye un saludo. Agrega tu nombre al presentarte.'
          : hasName
            ? 'El texto incluye una presentación. Empieza con Hi o Hello para saludar a Sam.'
            : 'Saluda a Sam con Hi o Hello y preséntate con tu nombre.',
    grammar: hasIntroduction
      ? hasName
        ? 'El texto usa una forma de presentación practicada: I am, I’m o My name is.'
        : 'La estructura empieza bien. Coloca tu nombre después de I am, I’m o My name is.'
      : 'Para presentarte, usa I am, I’m o My name is y luego tu nombre.',
  };
}

const drillGrammar = {
  'where is the bus stop': {
    grammar: /^where is (?:the |a )?(?!(?:the|a|an)\b)\p{L}/u,
    target: 'Where is + lugar',
    content: /\bwhere\b.*\bbus stop\b/,
    clue: 'Pregunta dónde está la parada del bus. Usa las palabras where y bus stop.',
  },
  'it is next to the park': {
    grammar: /^it is next to (?:the |a )?(?!(?:the|a|an)\b)\p{L}/u,
    target: 'It’s / It is + next to + lugar',
    content: /\b(?:next to|beside|by) (?:the )?park\b/,
    clue: 'Indica que está junto al parque. Usa next to the park.',
  },
  'my bag is blue': {
    grammar: /^my (?:bag|backpack) is (?:red|blue)$/,
    target: 'My bag is + color',
    content: /\b(?:my (?:bag|backpack) is blue|my blue (?:bag|backpack))\b/,
    clue: 'Indica que tu mochila es azul. Usa my bag y blue.',
  },
  'it is red': {
    grammar: /^it is (?:red|blue)$/,
    target: 'It’s / It is + color',
    content: /\bred\b/,
    clue: 'Indica que es rojo. Usa red para el color.',
  },
};

export function drillFeedback(transcript: string, reference: string) {
  const text = speechText(transcript);
  const example = speechText(reference);
  const rule = drillGrammar[example as keyof typeof drillGrammar];
  const hasContent = rule
    ? rule.content.test(text) && !/\b(?:not|isn't|isnt)\b/.test(text)
    : text === example;
  return {
    content: hasContent
      ? 'El texto incluye la idea de la frase de práctica.'
      : (rule?.clue ?? 'Revisa el saludo y el nombre que aparecen en la frase de práctica.'),
    grammar: rule
      ? rule.grammar.test(text)
        ? `El texto incluye la estructura ${rule.target}.`
        : `Practica la estructura ${rule.target}.`
      : introductionFeedback(transcript).grammar,
  };
}
