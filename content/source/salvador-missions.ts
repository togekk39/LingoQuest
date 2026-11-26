import type { TeamScenarioDefinition } from '@lingoquest/course-pack';
import type {
  TravelChapter,
  TravelMission,
  TravelStep,
} from '../../packages/offline-engine/src/travel-content';
import {
  canChecks,
  choose,
  habitChecks,
  handover,
  nowChecks,
  teamChecks,
  teamTurn,
} from './salvador-assessments';
import {
  basic,
  canWords,
  displayWords,
  g,
  habitWords,
  kitchenWords,
  p,
  pair,
  subjects,
  teach,
  teamWords,
  w,
} from './salvador-lessons';
import {
  compareLunch,
  coordinateDisplay,
  coordinateLunch,
  observeLunch,
} from './salvador-scenarios';

const dialogue = (
  id: string,
  speaker: string,
  text: string,
  en?: string,
  es?: string,
): TravelStep => ({
  id: `salvador-${id}`,
  type: 'dialogue',
  speaker,
  text,
  ...(en && es && { line: pair(en, es) }),
});
const speak = (id: string, text: string, phrase: string, conceptId: string): TravelStep => ({
  id: `salvador-${id}-speak`,
  type: 'speak',
  text,
  phrase,
  speech: { selfCheck: true, allowSystemRecognition: true },
  exampleLabel: 'Modelo para comparar tu grabación',
  learning: {
    conceptId,
    contextId: `salvador.oral.${id}`,
    skill: 'speaking',
    evidence: 'production',
    guided: true,
  },
});
const teachLook = teach(
  'look',
  'now',
  'Lo que está pasando',
  'En español puedes decir «está lavando» sin nombrar el sujeto. En inglés di quién, pon am, is o are y usa el verbo en -ing. Para una persona o su nombre usa is.',
  [w.i, w.im, w.am, w.she, w.he, w.is, w.the, w.vegetable, w.wash, w.washing, w.kitchen, w.now],
  [
    pair('Jo is washing the vegetables now.', 'Jo está lavando las verduras ahora.'),
    pair("I'm washing the vegetables.", 'Estoy lavando las verduras.'),
    pair('Wash. Washing.', 'Lavar. Lavando.'),
  ],
  g.now,
  g.firstPerson,
  g.agreement,
  g.team,
  p.now,
  p.i,
);

const teachMore = teach(
  'more-actions',
  'now',
  'Am, is y are en el equipo',
  'Usa I am, he/she is y you/we/they are. Las formas cortas conservan el significado. Agrega -ing a wash, cook y read. Make pierde la e. Escucha la terminación -ing, que suena como el final de cooking.',
  [
    ...subjects.filter(
      (word) => ![w.i, w.im, w.am, w.she, w.he, w.is].some((entry) => entry === word),
    ),
    ...basic.filter((word) => word !== w.the && word !== w.now),
    ...kitchenWords.filter(
      (word) => ![w.vegetable, w.wash, w.washing, w.kitchen].some((entry) => entry === word),
    ),
    w.set,
  ],
  [
    pair("I am cooking. I'm cooking.", 'Estoy cocinando.'),
    pair(
      "You are washing the vegetables. You're washing the vegetables.",
      'Estás lavando las verduras.',
    ),
    pair("He is making lunch. He's making lunch.", 'Está preparando el almuerzo.'),
    pair("We are preparing lunch. We're preparing lunch.", 'Estamos preparando el almuerzo.'),
    pair("They are working together. They're working together.", 'Están trabajando juntos.'),
    pair('Cook. Cooking. Make. Making.', 'Cocinar. Cocinando. Preparar. Preparando.'),
    pair("I'm reading a book at home.", 'Estoy leyendo un libro en casa.'),
    pair('Rafa is cooking rice.', 'Rafa está cocinando arroz.'),
  ],
  g.now,
  g.spelling,
  g.agreement,
  p.now,
  p.plural,
);

const teachQuestions = teach(
  'questions',
  'team',
  'Preguntar por el trabajo',
  'Empieza con What para saber qué hace alguien. Pon is o are antes del sujeto. En una pregunta de sí o no comienza con is o are. Still indica que algo sigue.',
  [w.what, w.do, w.doing, w.still],
  [
    pair('What are you doing?', '¿Qué estás haciendo?'),
    pair('What is Jo doing?', '¿Qué está haciendo Jo?'),
    pair('Is Rafa cooking rice?', '¿Está Rafa cocinando arroz?'),
    pair('Are they washing the vegetables?', '¿Están lavando las verduras?'),
    pair('Are you still cooking rice?', '¿Todavía estás cocinando arroz?'),
    pair('Is Sam still working?', '¿Sam todavía está trabajando?'),
  ],
  g.question,
  p.question,
  p.yesNo,
);

const teachRoutine = teach(
  'routine',
  'habit',
  'Normalmente y hoy',
  'Para un hábito, usa el presente simple. Con he, she o un nombre suelen aparecer -s o -es. Para una acción en curso, usa be + -ing. Today indica el momento. El verbo depende de lo que quieras expresar.',
  habitWords.slice(0, 15),
  [
    pair(
      "Jo usually sets the table, but today she's washing the vegetables.",
      'Jo normalmente pone la mesa, pero hoy lava las verduras.',
    ),
    pair(
      "Rafa usually washes the vegetables, but today he's cooking rice.",
      'Rafa suele lavar las verduras, pero hoy está cocinando arroz.',
    ),
    pair(
      "I usually cook lunch, but today I'm setting the table.",
      'Suelo cocinar el almuerzo, pero hoy estoy poniendo la mesa.',
    ),
    pair("She's setting the table.", 'Está poniendo la mesa.'),
  ],
  g.habit,
  g.third,
  p.habit,
);
const teachStates = teach(
  'states',
  'negative',
  'Acciones y estados',
  'Pon not después de am, is o are para negar una acción en curso. Para lo que te gusta, sabes, quieres o necesitas, normalmente usa el presente simple. Today también puede acompañar un estado.',
  [...habitWords.slice(15), w.help, w.not, w.isnt, w.arent, w.it],
  [
    pair(
      "Jo isn't setting the table today. She's washing the vegetables.",
      'Jo no está poniendo la mesa hoy. Está lavando las verduras.',
    ),
    pair(
      "I'm not cooking rice. They aren't setting the table.",
      'No estoy cocinando arroz. No están poniendo la mesa.',
    ),
    pair(
      'I like soup. I know Jo. I want lunch. I need help today.',
      'Me gusta la sopa. Conozco a Jo. Quiero almorzar. Necesito ayuda hoy.',
    ),
  ],
  g.negative,
  p.negative,
  g.state,
);

const teachAbility = teach(
  'ability',
  'can',
  'Qué sabe hacer cada persona',
  'Can expresa capacidad. Para negar, usa can’t o cannot. Después va el verbo base. Escucha la frase completa: can suele sonar débil antes del verbo, y can’t suele tener énfasis. La última t de can’t puede oírse poco.',
  [w.can, w.cant, w.cannot, w.help, w.carry, w.cut, w.cutBase, w.cuts, w.bread, w.yes, w.no],
  [
    pair("I can help. I can't help.", 'Puedo ayudar. No puedo ayudar.'),
    pair("She can cook rice. She can't cook rice.", 'Sabe cocinar arroz. No sabe cocinar arroz.'),
    pair(
      "She can cut the bread. He can't carry the table.",
      'Sabe cortar el pan. Él no puede cargar la mesa.',
    ),
    pair('Can you cook?', '¿Sabes cocinar?'),
    pair("Yes, I can. No, I can't.", 'Sí, puedo. No, no puedo.'),
  ],
  g.can,
  g.canBase,
  p.can,
  g.canPolarity,
);
const teachRequests = teach(
  'requests',
  'can',
  'Pedir, ofrecer y responder',
  'En la cocina, Can you + verbo puede ser una petición. Preguntar por capacidad sirve para conocer lo que alguien sabe hacer. Antes de pedir ayuda, comprueba quién puede ayudar en este momento. Can I help? ofrece tu ayuda.',
  canWords.filter(
    (word) =>
      ![
        w.can,
        w.cant,
        w.cannot,
        w.help,
        w.carry,
        w.cut,
        w.cutBase,
        w.cuts,
        w.bread,
        w.yes,
        w.no,
      ].some((entry) => entry === word),
  ),
  [
    pair(
      'Can you help me, please? Can you wash the vegetables?',
      '¿Puedes ayudarme, por favor? ¿Puedes lavar las verduras?',
    ),
    pair(
      "I can cook, but I can't help right now.",
      'Sé cocinar, pero ahora mismo no puedo ayudar.',
    ),
    pair("Sure. Sorry, I can't right now.", 'Claro. Lo siento, ahora mismo no puedo.'),
    pair(
      'Can I help? I can help you. We can help.',
      '¿Puedo ayudar? Puedo ayudarte. Podemos ayudar.',
    ),
    pair(
      'Take a break. I can carry out a task.',
      'Toma un descanso. Puedo encargarme de una tarea.',
    ),
    pair('Can you speak slowly, please?', '¿Puedes hablar despacio, por favor?'),
  ],
  g.can,
  g.offer,
  p.request,
  g.availability,
);
const teachSequence = teach(
  'sequence',
  'team',
  'El próximo paso',
  'Al dar una instrucción usa el verbo base. First presenta el primer paso. Then y next introducen el que sigue. Cut, stir, put y set duplican la consonante final al agregar -ing. Después de be, usa esa forma completa.',
  teamWords.slice(8),
  [
    pair(
      'First, cut the bread. Then put the bowls on the table.',
      'Primero corta el pan. Luego pon los tazones en la mesa.',
    ),
    pair(
      'Next, wash the vegetables. Please put the cups here.',
      'A continuación lava las verduras. Por favor, pon las tazas aquí.',
    ),
    pair(
      'Cut. Cutting. Stir. Stirring. Put. Putting. Set. Setting.',
      'Cortar. Cortando. Revolver. Revolviendo. Poner. Poniendo.',
    ),
    pair(
      'Sam is cutting the bread. Luz is putting the bowls on the table.',
      'Sam está cortando el pan. Luz está poniendo los tazones en la mesa.',
    ),
    pair('Can you put the bowls on the table?', '¿Puedes poner los tazones en la mesa?'),
  ],
  g.order,
  g.spelling,
  p.order,
);
const teachDisplay = teach(
  'display',
  'team',
  'Preparar la muestra',
  'Las fotos van en la pared y las etiquetas en la mesa. Para hablar con tus compañeros, usa el nombre de cada persona y comprueba si la tarea está en curso o aún está pendiente.',
  displayWords,
  [
    pair(
      'Bia is hanging the pictures. Leo is reading the labels.',
      'Bia está colgando las imágenes. Leo está leyendo las etiquetas.',
    ),
    pair('Can Nina move the table?', '¿Nina puede mover la mesa?'),
    pair(
      'First, move the table. Then put the labels on the table.',
      'Primero mueve la mesa. Luego pon las etiquetas en la mesa.',
    ),
    pair(
      'Bia usually moves the table, but today she is hanging the pictures.',
      'Bia normalmente mueve la mesa, pero hoy está colgando las imágenes.',
    ),
  ],
);
const teachRecap = teach(
  'a1-recap',
  'habit',
  'Del viaje al almuerzo',
  'Yesterday sitúa la acción terminada. Usually introduce una rutina. Today puede introducir una acción en curso. Compara cómo usas el inglés en el diario de viaje, en la cocina y con el equipo.',
  [w.yesterday, w.cooked, w.atTwelve],
  [
    pair(
      'Yesterday we cooked rice. We usually cook lunch at noon. Today we are making soup. Can you help us?',
      'Ayer cocinamos arroz. Normalmente preparamos el almuerzo al mediodía. Hoy estamos preparando sopa. ¿Puedes ayudarnos?',
    ),
  ],
);

function mission(
  id: string,
  title: string,
  place: string,
  objective: string,
  success: string,
  vocabulary: TravelMission['vocabulary'],
  steps: TravelStep[],
  objectiveId?: string,
  scenario?: TeamScenarioDefinition,
): TravelMission {
  return {
    id: `salvador-${id}`,
    title,
    place,
    objective,
    success,
    ...(objectiveId && { objectiveId: `lq-salvador-actions.${objectiveId}` }),
    ...(scenario && { scenario }),
    authoredAudio: true,
    minutes: [6, 12],
    vocabulary: [...new Map(vocabulary.map((word) => [word.term, word])).values()],
    steps,
  };
}

export const salvadorChapter: TravelChapter = {
  id: 'brazil',
  revision: 16,
  title: 'Salvador',
  stamp: 'Salvador',
  postcard: 'El almuerzo en equipo',
  collectible: 'Postal para Valparaíso',
  message:
    'En Salvador usamos inglés para ponernos de acuerdo. El equipo dejó una postal para Valparaíso, Chile.',
  missions: [
    mission(
      'now',
      '¿Qué están haciendo?',
      'La cocina de Salvador',
      'Describe las tareas que están en curso.',
      'Ya sabes qué está pasando. Jo trae el registro de las tareas habituales.',
      [...subjects, ...basic, ...kitchenWords, w.set, w.what, w.do, w.doing, w.still],
      [
        dialogue(
          'arrival',
          'Jo',
          'Llegas desde Cusco con Sam y Luz para un almuerzo de intercambio. «Olá» es un saludo en portugués, la lengua principal de Brasil. El grupo usa inglés para entenderse.',
        ),
        teachLook,
        nowChecks[0],
        teachMore,
        ...nowChecks.slice(1),
        teamTurn(
          'observe',
          'now',
          'Mira los trabajos en curso y escribe una frase en inglés sobre cada persona. Envía una frase por turno.',
          ['Jo is washing the vegetables.', 'Rafa is cooking rice.'],
          p.now,
          {
            descriptions: ['wash', 'rice'],
            event: [{ taskId: 'wash', status: 'done' }],
            terms: { wash: w.washing.teaches[0], rice: w.cooking.teaches[0] },
          },
        ),
        dialogue(
          'wash-finished',
          'Jo',
          'Jo termina de lavar las verduras. Comprueba cómo cambió el trabajo de la cocina.',
        ),
        teachQuestions,
        teamTurn(
          'observe-update',
          'team',
          'Pregunta qué está haciendo Jo ahora que ha terminado de lavar. Selecciona a Jo para hablar con ella.',
          ['What are you doing?', 'What is Jo doing?'],
          g.question,
          {
            check: true,
            checkPerson: 'jo',
            complete: true,
            extra: [p.question, p.yesNo, w.still.teaches[0]],
          },
        ),
        speak(
          'now',
          'Describe dos acciones que puedes ver. Al escucharte, identifica quién hace cada cosa, la forma de be y el verbo en -ing.',
          "Jo is washing the vegetables. He's cooking rice.",
          g.now.id,
        ),
      ],
      'now',
      observeLunch,
    ),
    mission(
      'habit',
      'Hoy es diferente',
      'La cocina de Salvador',
      'Compara el registro habitual con la nota de esta mañana.',
      'La nota explica los cambios de hoy. Al equipo aún le falta quien se encargue del pan.',
      [...habitWords, w.help, w.not, w.isnt, w.arent, w.it],
      [
        dialogue(
          'routine-opening',
          'Jo',
          'Jo te muestra dos registros: el de las tareas habituales y una nota que escribió antes de acabar de lavar las verduras.',
        ),
        teachRoutine,
        ...habitChecks.slice(0, 3),
        teachStates,
        ...habitChecks.slice(3),
        teamTurn(
          'routine-contrast',
          'habit',
          'En el registro de esta mañana, ¿qué estaba haciendo Jo en lugar de su tarea habitual? Escribe una frase en inglés que contraste la rutina con lo que indica la nota de hoy.',
          [
            "Jo usually sets the table, but today she's washing the vegetables.",
            'Jo usually sets the table, but today she is washing the vegetables.',
          ],
          g.habit,
          { forms: ['habit-contrast'], descriptions: ['wash'], complete: true },
        ),
        speak(
          'habit',
          'Compara lo habitual con la tarea de hoy para dos personas. Busca usually y today al escucharte.',
          "Jo usually sets the table, but today she's washing the vegetables. Rafa usually washes the vegetables, but today he's cooking rice.",
          g.habit.id,
        ),
      ],
      'habit-now',
      compareLunch,
    ),
    mission(
      'can',
      '¿Quién puede ayudar?',
      'La cocina de Salvador',
      'Escucha quién sabe hacer cada tarea y quién puede ayudar.',
      'Ya sabes cómo pedir ayuda. Ahora comprueba el trabajo pendiente con el equipo.',
      canWords,
      [
        dialogue(
          'can-opening',
          'Sam',
          'Sam y Luz escuchan a Jo hablar con Rafa. Alex está tomando un descanso. El grupo necesita saber quién puede ayudar ahora.',
        ),
        teachAbility,
        ...canChecks.slice(0, 2),
        teachRequests,
        ...canChecks.slice(2),
        speak(
          'can',
          'Di qué sabes hacer y pide ayuda con otra tarea. Al escucharte, comprueba que después de can usaste el verbo base.',
          'I can cook rice. Can you cut the bread, please?',
          p.request.id,
        ),
      ],
      'can-do',
    ),
    mission(
      'team',
      'Trabajamos en equipo',
      'La cocina de Salvador',
      'Averigua qué ya tiene responsable y coordina el pan y los tazones.',
      'El pan y los tazones están listos. Después del almuerzo, el grupo prepara una muestra de fotos.',
      teamWords.slice(8),
      [
        dialogue(
          'team-opening',
          'Rafa',
          'Rafa ya preparó el arroz. Jo está lavando las últimas verduras. La nota le pide a Sam revolver la sopa, pero quizá alguien ya se está encargando. Confírmalo en inglés.',
        ),
        teachSequence,
        ...teamChecks,
        teamTurn(
          'lunch-check',
          'team',
          'Habla con Rafa o pregunta por él. Confirma quién se ocupa de la sopa antes de repetir el encargo.',
          ['What is Rafa doing?', 'What are you doing?', 'Is Rafa stirring the soup?'],
          g.question,
          {
            check: 'stir',
            event: [{ taskId: 'wash', status: 'done' }],
            extra: [p.question, p.yesNo],
          },
        ),
        dialogue(
          'jo-free',
          'Jo',
          'Jo deja las verduras listas y puede encargarse de otra tarea. Queda el pan. Los tazones van después.',
        ),
        teamTurn(
          'lunch-bread',
          'can',
          'Elige a una persona libre que pueda encargarse del pan y pídeselo en inglés. También puedes preguntar por su capacidad.',
          [
            'Can you cut the bread, please?',
            'Can Sam cut the bread?',
            'Jo, can you cut the bread?',
          ],
          p.request,
          {
            assign: ['bread'],
            event: [{ taskId: 'bread', status: 'active' }],
            mayUse: ['ability-question', 'help-offer', 'progressive-question'],
          },
        ),
        teamTurn(
          'lunch-bread-live',
          'team',
          'El trabajo acordado ya empezó. Escribe qué está haciendo la persona que aceptó cortar el pan.',
          ['Sam is cutting the bread.', 'Jo is cutting the bread.'],
          p.now,
          {
            descriptions: ['bread'],
            terms: { bread: w.cutting.teaches[0] },
            mayUse: ['progressive-negative', 'progressive-question'],
            event: [{ taskId: 'bread', status: 'done' }],
          },
        ),
        dialogue(
          'bread-ready',
          'Luz',
          'Ya cortaron el pan. Ahora sí pueden colocar los tazones en la mesa.',
        ),
        teamTurn(
          'lunch-bowls',
          'can',
          'Pide a una persona disponible que ponga los tazones en la mesa.',
          [
            'Can you put the bowls on the table, please?',
            'Can you put the bowls on the table, Luz?',
          ],
          p.request,
          {
            assign: ['bowls'],
            event: [{ taskId: 'bowls', status: 'active' }],
            mayUse: ['ability-question', 'progressive-question'],
          },
        ),
        teamTurn(
          'lunch-handover',
          'team',
          'Deja el orden de trabajo para el próximo turno. Escribe dos instrucciones. El pan tiene que estar listo antes de poner los tazones.',
          [
            'First, cut the bread. Then put the bowls on the table.',
            'First cut the bread. Next put the bowls on the table.',
          ],
          g.order,
          {
            sequence: ['bread', 'bowls'],
            event: [
              { taskId: 'bowls', status: 'done' },
              { taskId: 'stir', status: 'done' },
            ],
            complete: true,
          },
        ),
      ],
      'coordinate',
      coordinateLunch,
    ),
    mission(
      'display',
      'Una nueva actividad',
      'La sala comunitaria',
      'Ayuda a un equipo diferente a preparar la muestra y deja una nota en inglés.',
      'La muestra está lista. Bia te invita a dejar un recuerdo del viaje y te entrega una postal.',
      [...displayWords, w.yesterday, w.cooked, w.atTwelve],
      [
        dialogue(
          'display-opening',
          'Bia',
          'Después del almuerzo, Bia te lleva a la sala comunitaria. Hay que mover una mesa antes de colocar las etiquetas. Nadie ha encargado ese trabajo.',
        ),
        teachDisplay,
        teamTurn(
          'display-observe',
          'now',
          'Describe dos acciones en curso para el equipo nuevo. Envía una frase por turno.',
          ['Bia is hanging the pictures.', 'Leo is reading the labels.'],
          p.now,
          {
            descriptions: ['hang', 'read'],
            terms: { hang: w.hanging.teaches[0], read: w.reading.teaches[0] },
            transfer: true,
          },
        ),
        teamTurn(
          'display-check',
          'team',
          'Antes de hacer una petición, confirma qué hace alguien o si sabe mover la mesa.',
          ['What is Bia doing?', 'Can Nina move the table?'],
          g.question,
          { check: true, forms: ['progressive-question', 'ability-question'], transfer: true },
        ),
        teamTurn(
          'display-move',
          'can',
          'Hay dos personas dispuestas a ayudar. Pídele a alguien adecuado que mueva la mesa.',
          ['Nina, can you move the table, please?', 'Can you move the table?'],
          p.request,
          { assign: ['move'], event: [{ taskId: 'move', status: 'active' }], transfer: true },
        ),
        teamTurn(
          'display-move-live',
          'team',
          'Comprueba quién está moviendo la mesa. Informa a Leo con una frase.',
          ['Nina is moving the table.'],
          p.now,
          {
            descriptions: ['move'],
            terms: { move: w.moving.teaches[0] },
            event: [{ taskId: 'move', status: 'done' }],
            transfer: true,
          },
        ),
        teamTurn(
          'display-labels',
          'can',
          'La mesa está lista. Busca quién puede poner las etiquetas sobre la mesa y pídeselo.',
          [
            'Can you put the labels on the table, Noah?',
            'Can you put the labels on the table, please?',
          ],
          p.request,
          { assign: ['labels'], event: [{ taskId: 'labels', status: 'active' }], transfer: true },
        ),
        teamTurn(
          'display-order',
          'team',
          'Escribe los dos pasos en el orden que necesita la muestra.',
          ['First, move the table. Then put the labels on the table.'],
          g.order,
          {
            sequence: ['move', 'labels'],
            event: [{ taskId: 'labels', status: 'done' }],
            complete: true,
            transfer: true,
          },
        ),
        handover,
        speak(
          'display',
          'Graba el relevo para el equipo. Menciona una acción en curso y dos pasos. Comprueba que otra persona pueda seguir el orden.',
          'Bia is hanging the pictures. First, move the table. Then put the labels on the table.',
          g.order.id,
        ),
        teachRecap,
        choose(
          'a1-time',
          'habit',
          g.habit,
          'Lee la nota final. ¿Qué ocurrió ayer y qué ocurre hoy?',
          ['Ayer cocinaron arroz. Hoy preparan sopa.', 'Ayer hicieron sopa. Hoy cocinan arroz.'],
          0,
          'Yesterday cooked indica una acción terminada. Today are making indica lo que están haciendo hoy.',
          { extra: [p.plural, p.request] },
          'Yesterday we cooked rice. We usually cook lunch at noon. Today we are making soup. Can you help us?',
        ),
      ],
      undefined,
      coordinateDisplay,
    ),
  ],
};
