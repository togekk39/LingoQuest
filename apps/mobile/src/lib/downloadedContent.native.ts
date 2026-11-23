import {
  installHomeContent,
  route,
  type CourseData,
  type HomeContent,
} from '@lingoquest/offline-engine';
import { parseCoursePack, type ChapterPack } from '@lingoquest/course-pack';
import { applyHomeImages } from '../travel/illustrations.native';
import { firstChapter, getInstalledChapter, retireFirstChapter } from './chapterPacks';
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

const installedUnits = new Map<string, NonNullable<ChapterPack['unit']>>();
let originalCourse: CourseData = emptyCourse;
let courseActivities: Omit<CourseData, 'units' | 'lessons'> = emptyCourse;
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
  for (const destination of route) {
    const unit = installedUnits.get(destination.id);
    if (!unit) continue;
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
    for (const lesson of unit.lessons) lessons[lesson.id] = lesson;
  }
  activeCourse = { ...courseActivities, units: [...units.values()], lessons };
}

async function activate(pack: ChapterPack) {
  if ((activated.get(pack.chapterId) ?? 0) >= pack.revision) return homeReady;
  const { story, unit } = pack;
  if (story?.runtime) {
    const { lesson, placement, challenges, course } = story.runtime;
    const home = {
      chapter: story.chapter,
      adventure: story.adventure,
      practice: story.practice,
      lesson,
      placement,
      challenges,
    } as unknown as HomeContent;
    await applyHomeImages(pack.chapterId, pack.images);
    installHomeContent(home);
    courseActivities = originalCourse === emptyCourse ? course : originalCourse;
    homeReady = true;
  }
  if (unit) installedUnits.set(pack.chapterId, unit);
  refreshCourse();
  activated.set(pack.chapterId, pack.revision);
  return homeReady;
}

export function applyDownloadedContent(pack: ChapterPack) {
  const operation = activationTail.then(() => activate(pack));
  activationTail = operation.catch(() => {});
  return operation;
}

export function discardFirstChapterContent() {
  const operation = activationTail.then(async () => {
    await retireFirstChapter();
    installedUnits.delete(firstChapter.id);
    activated.delete(firstChapter.id);
    installHomeContent();
    await applyHomeImages(firstChapter.id, {});
    courseActivities = originalCourse;
    refreshCourse();
    homeReady = false;
    return homeReady;
  });
  activationTail = operation.catch(() => {});
  return operation;
}

export async function restoreDownloadedContent() {
  try {
    const saved = await getRaw('lq_installed_course_pack_v1');
    if (saved) originalCourse = courseActivities = parseCoursePack(saved).payload;
  } catch {
    originalCourse = courseActivities = emptyCourse;
  }
  for (const { id, unitId } of route) {
    if (!unitId) continue;
    const pack = await getInstalledChapter(id);
    if (pack) await applyDownloadedContent(pack);
  }
  refreshCourse();
  return homeReady;
}
