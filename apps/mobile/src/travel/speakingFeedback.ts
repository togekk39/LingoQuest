import {
  matchesIntroductionName,
  meetsIntroduction,
  normalize,
  readIntroduction,
} from '@lingoquest/offline-engine';

function speechText(value: string) {
  return normalize(value.replace(/[.,!?;:]/g, ' '))
    .replace(/\bi'?m\b/g, 'i am')
    .replace(/\bit'?s\b/g, 'it is')
    .replace(/\b(my name|where|(?:my|the|her|luz's) (?:bag|backpack))'s\b/g, '$1 is');
}

export function matchesSpeechTarget(
  transcript: string,
  reference: string,
  alternatives?: string[],
) {
  const text = speechText(transcript);
  return (
    !!text && [reference, ...(alternatives ?? [])].some((phrase) => speechText(phrase) === text)
  );
}

export function matchesPersonalIntroduction(transcript: string, playerName?: string) {
  const response = readIntroduction(transcript, true);
  return (
    meetsIntroduction(response, true) &&
    (!playerName || (!!response.name && matchesIntroductionName(response.name, playerName, true)))
  );
}

export function introductionFeedback(transcript: string, playerName?: string) {
  const {
    greeting: hasGreeting,
    form,
    startsTarget,
    error,
    name,
  } = readIntroduction(transcript, true);
  const hasName = !!form;

  return {
    content:
      playerName && name && !matchesIntroductionName(name, playerName, true)
        ? `La transcripción usa otro nombre. Di tu nombre: ${playerName}.`
        : error
          ? 'Incluiste un nombre. Revisa la estructura de la presentación.'
          : hasGreeting && hasName
            ? 'El texto incluye un saludo y una presentación. Revisa si tu nombre quedó bien escrito.'
            : hasGreeting
              ? 'El texto incluye un saludo. Agrega tu nombre al presentarte.'
              : hasName
                ? 'El texto incluye una presentación. Empieza con Hi o Hello para saludar a Sam.'
                : 'Saluda a Sam con Hi o Hello y preséntate con tu nombre.',
    grammar:
      error === 'be_agreement'
        ? 'Con I usa am y con My name usa is.'
        : startsTarget && form !== 'alternative'
          ? form === 'target'
            ? 'El texto usa una forma de presentación practicada: I am, I’m, My name is o My name’s.'
            : 'La estructura empieza bien. Coloca tu nombre después de I am, I’m, My name is o My name’s.'
          : 'Para presentarte, usa I am, I’m, My name is o My name’s y luego tu nombre.',
  };
}

const itemColorSubject = "(?:it|(?:the|her|luz's) (?:bag|backpack))";
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
    grammar: new RegExp(`^${itemColorSubject} is (?:red|blue)$`),
    target: 'sujeto + is + color, como It’s red',
    content: new RegExp(
      `^(?:red|the red one|${itemColorSubject} is (?:red|a red (?:bag|backpack)))$`,
    ),
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
