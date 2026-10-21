import Database from 'better-sqlite3';

/**
 * Test double for expo-sqlite's sync API, backed by a real in-memory SQLite
 * (better-sqlite3 in Node). Repositories run their actual SQL against it.
 */
export function createFakeExpoSqlite() {
  const db = new Database(':memory:');
  return {
    execSync: (sql: string) => void db.exec(sql),
    runSync: (sql: string, ...params: unknown[]) => db.prepare(sql).run(...params),
    getFirstSync: <T>(sql: string, ...params: unknown[]) => (db.prepare(sql).get(...params) as T | undefined) ?? null,
    withTransactionSync: (task: () => void) => db.transaction(task)(),
    raw: db,
  };
}
