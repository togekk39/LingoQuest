// Bundled en-US reference clips for the authored first chapter.
// Audios de referencia en-US incluidos para el primer capítulo.
import samGreeting from '../../assets/travel/sam-greeting.mp3';
import line1 from '../../assets/travel/line-1.mp3';
import line2 from '../../assets/travel/line-2.mp3';
import line3 from '../../assets/travel/line-3.mp3';
import line4 from '../../assets/travel/line-4.mp3';
import line5 from '../../assets/travel/line-5.mp3';
import line6 from '../../assets/travel/line-6.mp3';
import line7 from '../../assets/travel/line-7.mp3';
import line8 from '../../assets/travel/line-8.mp3';
import line9 from '../../assets/travel/line-9.mp3';
import line10 from '../../assets/travel/line-10.mp3';
import line11 from '../../assets/travel/line-11.mp3';

import word1 from '../../assets/travel/word-1.mp3';
import word2 from '../../assets/travel/word-2.mp3';
import word3 from '../../assets/travel/word-3.mp3';
import word4 from '../../assets/travel/word-4.mp3';
import word5 from '../../assets/travel/word-5.mp3';
import word6 from '../../assets/travel/word-6.mp3';
import word7 from '../../assets/travel/word-7.mp3';

export const audioClips: Readonly<Record<string, number>> = {
  'Hi! My name is Sam.': line1,
  "Hi! My name is Sam. What's your name?": samGreeting,
  'Hi! I am Luz.': line2,
  'My name is Luz.': line3,
  'Where is the bus stop?': line4,
  'bus stop': line5,
  park: line6,
  'It’s next to the park.': line7,
  'My bag!': line8,
  'My bag is blue.': line9,
  'a blue bag': line10,
  'It’s red.': line11,
  Hi: word1,
  'I am': word2,
  'My name is': word3,
  'next to': word4,
  bag: word5,
  blue: word6,
  red: word7,
};
