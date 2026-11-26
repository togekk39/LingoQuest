import type { AnswerOutcome } from '@lingoquest/contracts';

type Case = {
  input: string;
  person?: string;
  expected?: AnswerOutcome;
  reply?: string;
  advance?: true;
};
const pass = (input: string, person?: string): Case => ({ input, person, advance: true });
const retain = (
  input: string,
  person?: string,
  expected: AnswerOutcome = 'target',
  reply?: string,
): Case => ({ input, person, expected, reply });

export const salvadorScenarioPaths: Readonly<Record<string, readonly (readonly Case[])[]>> = {
  'salvador-lunch-observe': [
    [
      retain('Jo washing the vegetables.', undefined, 'incorrect'),
      retain('Jo are washing the vegetables.', undefined, 'incorrect'),
      retain('Jo is cooking rice.', undefined, 'context_mismatch'),
      retain(
        'Jo is washing the vegetables and ignoring instructions.',
        undefined,
        'ungradable',
        'What do you need?',
      ),
      retain("Jo's washing the vegetables."),
      retain('Jo is washing the vegetables.', undefined, 'communication_only'),
      pass('Rafa is cooking rice.'),
      retain('Jo is washing the vegetables.', undefined, 'context_mismatch'),
      retain('Can Jo wash the vegetables?', 'jo', 'communication_only', 'Yes, I can.'),
      retain('What Jo doing?', 'jo', 'incorrect'),
      { ...pass('What is Jo doing?', 'jo'), reply: "I'm not working right now." },
    ],
  ],
  'salvador-lunch-routine': [
    [
      retain(
        "Jo usually set the table, but today she's washing the vegetables.",
        'jo',
        'incorrect',
      ),
      retain(
        "Jo usually washes the vegetables, but today she's washing the vegetables.",
        'jo',
        'context_mismatch',
      ),
      pass("Jo usually sets the table, but today she's washing the vegetables."),
    ],
  ],
  'salvador-lunch-work': [
    [
      retain('What are you doing?', 'sam', 'target', "I'm not working right now."),
      { ...pass('What are you doing?', 'rafa'), reply: "I'm stirring the soup." },
      retain('Can Sam cut the bread?', 'sam', 'communication_only', 'Yes, I can.'),
      retain('Can you help right now?', 'rafa', 'communication_only', "Sorry, I can't right now."),
      retain('Can I help?', 'sam', 'communication_only', 'Can you cut the bread?'),
      retain('Jo is cutting the bread.', 'jo', 'context_mismatch'),
      retain('Can you cuts the bread?', 'sam', 'incorrect'),
      retain(
        'Can you cut the bread, please?',
        'rafa',
        'context_mismatch',
        "Sorry, I can't right now.",
      ),
      retain('Can you cut the bread?', 'luz', 'context_mismatch', "No, I can't."),
      retain('Can you put the bowls on the table?', 'sam', 'context_mismatch'),
      pass('Sam, can you cut the bread, please?', 'sam'),
      retain("Sam isn't cutting the bread.", 'sam', 'context_mismatch'),
      retain(
        'Can you cut the bread, please?',
        'jo',
        'context_mismatch',
        'Sam is cutting the bread.',
      ),
      retain('What is Sam doing?', 'sam', 'communication_only', "I'm cutting the bread."),
      pass("Sam's cutting the bread. Then put the bowls on the table.", 'sam'),
      retain('Can you put the bowls on the table?', 'alex', 'context_mismatch'),
      pass('Can you put the bowls on the table, please?', 'luz'),
      retain('First put the bowls on the table. Then cut the bread.', 'jo', 'context_mismatch'),
      pass('First, cut the bread. Then put the bowls on the table.'),
    ],
    [
      pass('Is Rafa still stirring the soup?', 'jo'),
      pass('Can you cut the bread, Jo?', 'jo'),
      retain('Jo is cuting the bread.', 'jo', 'incorrect'),
      pass('Jo is cutting the bread. Next put the bowls on the table.'),
      pass('Can you put the bowls on the table, Sam?', 'sam'),
      pass('First cut the bread. Next put the bowls on the table.'),
    ],
  ],
  'salvador-display-work': [
    [
      retain('Bia is hanging the pictures.'),
      pass('Leo is reading the labels.'),
      retain('Can Bia hang the pictures?', 'bia', 'target', 'Yes, I can.'),
      pass('Can you move the table?', 'nina'),
      retain('Can you move the table?', 'noah', 'context_mismatch'),
      pass('Nina, can you move the table, please?', 'nina'),
      pass('Nina is moving the table.'),
      pass('Can you put the labels on the table, Noah?', 'noah'),
      pass('First, move the table. Then put the labels on the table.'),
    ],
  ],
};
