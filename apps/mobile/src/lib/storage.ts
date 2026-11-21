import * as SQLite from 'expo-sqlite';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
async function db() {
  if (!dbPromise)
    dbPromise = SQLite.openDatabaseAsync('lingoquest.db').then(async (d) => {
      await d.execAsync(
        'CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
      );
      return d;
    });
  return dbPromise;
}
export async function getRaw(key: string) {
  return (
    (
      await (
        await db()
      ).getFirstAsync<{ value: string }>('SELECT value FROM cache WHERE key=?', key)
    )?.value ?? null
  );
}
export async function putRaw(key: string, value: string) {
  await (await db()).runAsync('INSERT OR REPLACE INTO cache(key,value) VALUES(?,?)', key, value);
}
export async function compareAndPutRaw(key: string, previous: string | null, value: string) {
  const result = await (
    await db()
  ).runAsync(
    `INSERT INTO cache(key, value)
     SELECT ?, ? WHERE (SELECT value FROM cache WHERE key = ?) IS ?
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
    key,
    previous,
  );
  return result.changes === 1;
}
export async function keysRaw() {
  return (await (await db()).getAllAsync<{ key: string }>('SELECT key FROM cache')).map(
    (row) => row.key,
  );
}
export async function removeRaw(keys: string[]) {
  for (const key of keys) await (await db()).runAsync('DELETE FROM cache WHERE key=?', key);
}
export async function putRawAndRemove(key: string, value: string, removedKey: string) {
  await (
    await db()
  ).withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync('INSERT OR REPLACE INTO cache(key,value) VALUES(?,?)', key, value);
    await transaction.runAsync('DELETE FROM cache WHERE key=?', removedKey);
  });
}
