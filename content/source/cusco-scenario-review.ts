import type { AnswerOutcome } from '@lingoquest/contracts';

type Probe = { input: string; person?: string; expected: AnswerOutcome; reply?: string };
const question = (
  person: string,
  input: string,
  reply: string,
  expected: AnswerOutcome = 'target',
): Probe => ({ person, input, reply, expected });
const note = (input: string, expected: AnswerOutcome = 'target'): Probe => ({ input, expected });

export const cuscoScenarioPaths: Readonly<Record<string, readonly (readonly Probe[])[]>> = {
  'cusco-market-journal': [
    [
      question('sam', 'Did you went to the market?', '', 'incorrect'),
      question('sam', 'Did you take the photo?', "No, I didn't."),
      question('sam', 'Did you take a photo?', "No, I didn't.", 'communication_only'),
      question(
        'sam',
        'When did you take the photo?',
        "I'm not sure. Maybe someone else knows.",
        'communication_only',
      ),
      question('luz', 'Did you take the photo?', 'Yes, I did.'),
      question('luz', 'When did you take the photo?', 'At eleven.'),
      note('Sam took a photo at eleven.', 'context_mismatch'),
      note('Luz took a photo at ten.', 'context_mismatch'),
      note('Luz didn’t take a photo.', 'context_mismatch'),
      note('Luz take a photo at eleven.', 'incorrect'),
      note('Luz took a photo at eleven.'),
    ],
    [
      question('luz', 'What time did you take the photo?', 'At eleven.'),
      question('sam', 'Who took a photo?', 'Luz did.'),
      note('At 11:00 a.m., Luz took the photo.'),
    ],
  ],
  'cusco-museum-journal': [
    [
      question('diego', 'When did Ana see Nora?', 'At three.'),
      question('nora', 'Where did Ana see Nora?', 'At the museum entrance.'),
      note('Ana saw Nora at the shop at three.', 'context_mismatch'),
      note('At three, Ana saw Nora at the entrance.'),
    ],
    [
      question('ana', 'Where did you see Nora?', 'At the museum entrance.'),
      question('ana', 'When did you see Nora?', 'At three.'),
      note('Ana saw Nora at the museum entrance at three.'),
    ],
  ],
};
