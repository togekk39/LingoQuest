import type { ChapterPack } from '@lingoquest/course-pack';

export async function restoreDownloadedContent(): Promise<boolean> {
  return true;
}

export async function applyDownloadedContent(_pack: ChapterPack): Promise<boolean> {
  return true;
}
