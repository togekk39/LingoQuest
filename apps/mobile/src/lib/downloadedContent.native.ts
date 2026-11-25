import {
  homeContentFromPack,
  installHomeContent,
  route,
  type CourseData,
} from '@lingoquest/offline-engine';
import { parseCoursePack, type ChapterPack } from '@lingoquest/course-pack';
import { applyHomeImages } from '../travel/illustrations.native';
import { getInstalledChapter } from './chapterPacks';
import { isPreviousBuiltInCourse } from './previousCourse';
import { getRaw } from './storage';

const emptyCourse: CourseData = {
  units: [],
  lessons: {},
  challengePools: { grammar_rush: [], cloze_battle: [], reading_quest: [] },
  challengeLevels: [],
  placementQuestions: [],
  missions: [],
  speechDrills: [],
};

const installedUnits = new Map<
  string,
  { unit: NonNullable<ChapterPack['unit']>; revision: number }
>();
let originalCourse: CourseData = emptyCourse;
let keepImportedActivities = false;
let homeActivities: Omit<CourseData, 'units' | 'lessons'> = emptyCourse;
let activeCourse: CourseData = emptyCourse;
let homeReady = false;
const activated = new Map<string, number>();
let activationTail: Promise<unknown> = Promise.resolve();

export function getActiveCourseData() {
  return activeCourse;
}

function refreshCourse() {
  const units = new Map(originalCourse.units.map((unit) => [unit.id, unit]));
  const lessons = { ...originalCourse.lessons };
  const lessonVersions = { ...originalCourse.lessonVersions };
  for (const destination of route) {
    const installed = installedUnits.get(destination.id);
    if (!installed) continue;
    const { unit, revision } = installed;
    const original = units.get(unit.id);
    units.set(unit.id, {
      id: unit.id,
      title: original?.title ?? unit.titleEs,
      titleEs: unit.titleEs,
      description: original?.description ?? destination.description,
      cefr: unit.lessons[0].cefr,
      lessons: unit.lessons.map((lesson, index) => ({
        id: lesson.id,
        title: lesson.title,
        estimatedMinutes: lesson.estimatedMinutes,
        skills: [lesson.grammar.skillId],
        seq: index + 1,
      })),
    });
    for (const lesson of unit.lessons) {
      lessons[lesson.id] = lesson;
      lessonVersions[lesson.id] = `${destination.id}:${revision}`;
    }
  }
  const activities = homeReady && !keepImportedActivities ? homeActivities : originalCourse;
  activeCourse = {
    ...activities,
    units: [...units.values()],
    lessons,
    lessonVersions,
  };
}

async function activate(pack: ChapterPack) {
  if ((activated.get(pack.chapterId) ?? 0) >= pack.revision) return homeReady;
  if (pack.chapterId !== 'home' && !(await getInstalledChapter(pack.chapterId))) return homeReady;
  const { story, unit } = pack;
  const home = homeContentFromPack(pack);
  if (home && story?.runtime) {
    await applyHomeImages(pack.chapterId, pack.images).catch(() => {});
    installHomeContent(home);
    homeActivities = {
      ...story.runtime.course,
      courseVersion: `${pack.chapterId}:${pack.revision}`,
    };
    homeReady = true;
  }
  if (unit) installedUnits.set(pack.chapterId, { unit, revision: pack.revision });
  refreshCourse();
  activated.set(pack.chapterId, pack.revision);
  return homeReady;
}

function queueCourseChange(change: () => Promise<boolean>) {
  const operation = activationTail.then(change);
  activationTail = operation.catch(() => {});
  return operation;
}

export function applyDownloadedContent(pack: ChapterPack) {
  return queueCourseChange(() => activate(pack));
}

export function removeDownloadedContent(chapterId: string) {
  return queueCourseChange(async () => {
    if (chapterId !== 'home' && !(await getInstalledChapter(chapterId))) {
      installedUnits.delete(chapterId);
      activated.delete(chapterId);
      refreshCourse();
    }
    return homeReady;
  });
}

export async function restoreDownloadedContent() {
  try {
    const saved = await getRaw('lq_installed_course_pack_v1');
    const imported = saved ? parseCoursePack(saved) : null;
    originalCourse = imported
      ? { ...imported.payload, courseVersion: imported.manifest.version }
      : emptyCourse;
    keepImportedActivities = !!imported && !isPreviousBuiltInCourse(imported.manifest.sha256);
  } catch {
    originalCourse = emptyCourse;
    keepImportedActivities = false;
  }
  for (const { id, unitId } of route) {
    if (!unitId) continue;
    const pack = await getInstalledChapter(id);
    if (pack) await applyDownloadedContent(pack);
  }
  refreshCourse();
  return homeReady;
}
