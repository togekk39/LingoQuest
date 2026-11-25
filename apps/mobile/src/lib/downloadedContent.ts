import type { ChapterPack } from '@lingoquest/course-pack';
import { chapter, homeContentFromPack, installHomeContent } from '@lingoquest/offline-engine';
import { getInstalledChapter } from './chapterPacks';

export async function restoreDownloadedContent(): Promise<boolean> {
  const pack = await getInstalledChapter('home');
  if (pack) await applyDownloadedContent(pack);
  return true;
}

export async function applyDownloadedContent(pack: ChapterPack): Promise<boolean> {
  const home = homeContentFromPack(pack);
  if (home?.audit && home.chapter.revision > chapter.revision) installHomeContent(home);
  return true;
}

export async function removeDownloadedContent(_chapterId: string): Promise<boolean> {
  return true;
}
