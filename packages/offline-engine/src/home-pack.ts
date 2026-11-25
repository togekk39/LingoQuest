import type { ChapterPack } from '@lingoquest/course-pack';
import type { HomeContent } from './home-content';

export function homeContentFromPack({
  chapterId,
  story,
  unit,
}: ChapterPack): HomeContent | undefined {
  if (chapterId !== 'home' || !story?.runtime) return;
  return {
    chapter: story.chapter,
    adventure: story.adventure,
    practice: story.practice,
    lesson: story.runtime.lesson,
    placement: story.runtime.placement,
    challenges: story.runtime.challenges,
    audit: story.audit,
    supportingLessons: [...(unit?.lessons ?? []), ...(story.supportingLessons ?? [])],
  } as unknown as HomeContent;
}
