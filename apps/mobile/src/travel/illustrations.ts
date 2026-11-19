import welcome from '../../assets/journal/welcome-desk.jpg';
import bus from '../../assets/journal/bus-stop.jpg';
import bag from '../../assets/journal/lost-bag.jpg';
import atlas from '../../assets/journal/atlas.jpg';
import passport from '../../assets/journal/passport.jpg';
import writing from '../../assets/journal/writing.jpg';
import luz from '../../assets/journal/luz.jpg';
import expedition from '../../assets/journal/expedition.jpg';
import review from '../../assets/journal/review.jpg';
import plaza from '../../assets/journal/plaza.jpg';

export const illustrations = {
  welcome,
  bus,
  bag,
  atlas,
  passport,
  writing,
  luz,
  expedition,
  review,
  plaza,
};

export function placeIllustration(place: string) {
  if (place === 'La parada') return illustrations.bus;
  if (place === 'Objetos perdidos') return illustrations.bag;
  return illustrations.plaza;
}

export function wordIllustration(term: string) {
  if (['bus stop', 'next to', 'where'].some((part) => term.toLowerCase().includes(part)))
    return illustrations.bus;
  if (['bag', 'blue', 'mine', 'yours'].some((part) => term.toLowerCase().includes(part)))
    return illustrations.bag;
  return illustrations.welcome;
}
