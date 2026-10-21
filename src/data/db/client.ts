import * as SQLite from 'expo-sqlite';

/**
 * The single local SQLite file. Only repositories use this; nothing in the UI
 * or store writes SQL.
 *
 * Tables:
 *  - drafts:      the forms being filled, one row per form record (id = device uuid)
 *  - definitions: every form definition version seen, so old drafts keep their form
 * Later the same DB gets an `outbox` table for sync.
 */

const DB_NAME = 'commissioning.db';

/** Ordered schema changes; index + 1 = schema version (PRAGMA user_version). Append only. */
const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS drafts (
     id TEXT PRIMARY KEY NOT NULL,
     form_id TEXT NOT NULL,
     form_version TEXT NOT NULL,
     data_json TEXT NOT NULL,
     status TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );
   CREATE TABLE IF NOT EXISTS definitions (
     form_id TEXT NOT NULL,
     version TEXT NOT NULL,
     json TEXT NOT NULL,
     is_current INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (form_id, version)
   );`,
];

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (db) return db;
  db = SQLite.openDatabaseSync(DB_NAME);
  db.execSync('PRAGMA journal_mode = WAL;');
  migrate(db);
  return db;
}

function migrate(d: SQLite.SQLiteDatabase): void {
  const current = d.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    d.withTransactionSync(() => {
      d.execSync(MIGRATIONS[v]);
      d.execSync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}
