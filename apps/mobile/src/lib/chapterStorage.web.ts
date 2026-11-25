const storeName = 'packs';
const currentChapterKey = '@current';
let database: Promise<IDBDatabase> | undefined;

function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('lingoquest-chapter-packs', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        database = undefined;
      };
      db.onclose = () => {
        database = undefined;
      };
      resolve(db);
    };
  }).catch((error) => {
    database = undefined;
    throw error;
  });
  return database;
}

export async function readChapterPack(chapterId: string): Promise<string | null> {
  const db = await openDatabase();
  return new Promise<string | null>((resolve, reject) => {
    const request = db.transaction(storeName).objectStore(storeName).get(chapterId);
    request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
    request.onerror = () => reject(request.error);
  });
}

export function readCurrentChapter() {
  return readChapterPack(currentChapterKey);
}

export async function writeCurrentChapter(id: string) {
  await writeChapterPack(currentChapterKey, id, (previous) => previous !== id);
}

export async function writeChapterPack(
  chapterId: string,
  text: string,
  shouldReplace: (previous: string | null) => boolean,
): Promise<boolean> {
  const db = await openDatabase();
  return new Promise<boolean>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.get(chapterId);
    let replaced = false;
    request.onsuccess = () => {
      try {
        const previous = typeof request.result === 'string' ? request.result : null;
        if (shouldReplace(previous)) {
          store.put(text, chapterId);
          replaced = true;
        }
      } catch (error) {
        reject(error);
        transaction.abort();
      }
    };
    transaction.oncomplete = () => resolve(replaced);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function removeChapterPack(chapterId: string) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).delete(chapterId);
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function chapterMediaUri(_chapterId: string, mimeType: string, dataBase64: string) {
  return `data:${mimeType};base64,${dataBase64}`;
}
