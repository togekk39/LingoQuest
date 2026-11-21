import type { ChapterPack } from '@lingoquest/course-pack';
import { retireFirstChapter } from './chapterPacks';

export async function restoreDownloadedContent(): Promise<boolean> {
  return true;
}

export async function applyDownloadedContent(_pack: ChapterPack): Promise<boolean> {
  return true;
}

export async function discardFirstChapterContent(): Promise<boolean> {
  await retireFirstChapter();
  return true;
}
