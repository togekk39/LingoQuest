import type { ImageSourcePropType } from 'react-native';
import type { ChapterPack } from '@lingoquest/course-pack';
import { chapterMediaUri } from '../lib/chapterStorage';

export let world: ImageSourcePropType | undefined;
export const illustrations = {
  welcome: undefined,
  bus: undefined,
  bag: undefined,
  atlas: undefined,
  passport: undefined,
  writing: undefined,
  luz: undefined,
  expedition: undefined,
  review: undefined,
  plaza: undefined,
  hometown: undefined,
  sam: undefined,
} as Record<keyof typeof import('./illustrations').illustrations, ImageSourcePropType | undefined>;
export const storyArt: Record<'plaza' | 'bus' | 'bag', ImageSourcePropType | undefined> = {
  plaza: undefined,
  bus: undefined,
  bag: undefined,
};
export const storyFigures: Record<'sam' | 'luz', ImageSourcePropType | undefined> = {
  sam: undefined,
  luz: undefined,
};
export const storyPortraits: Record<'sam' | 'luz', ImageSourcePropType | undefined> = {
  sam: undefined,
  luz: undefined,
};

export async function applyHomeImages(chapterId: string, images: ChapterPack['images']) {
  const sources = new Map(
    await Promise.all(
      Object.entries(images).map(async ([key, media]) => {
        const uri = await chapterMediaUri(chapterId, media.mimeType, media.dataBase64);
        return [key, { uri }] as const;
      }),
    ),
  );
  for (const key of Object.keys(illustrations) as (keyof typeof illustrations)[])
    illustrations[key] = sources.get(key === 'hometown' ? 'cover' : key);
  world = sources.get('world');
  storyArt.plaza = sources.get('story-plaza');
  storyArt.bus = illustrations.bus;
  storyArt.bag = illustrations.bag;
  storyFigures.sam = sources.get('story-sam');
  storyFigures.luz = sources.get('story-luz');
  storyPortraits.sam = sources.get('story-sam-portrait');
  storyPortraits.luz = sources.get('story-luz-portrait');
}

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
