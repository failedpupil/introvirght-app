import * as SQLite from 'expo-sqlite';
import { encryptText, decryptText } from './crypto';
import { PersistedState, defaultPersistedState, Person } from '../state/types';

const DB_NAME = 'introvirght.vault.db';
const ROW_ID = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync(
        'CREATE TABLE IF NOT EXISTS vault (id INTEGER PRIMARY KEY NOT NULL, ct TEXT NOT NULL, iv TEXT NOT NULL, updated_at TEXT NOT NULL);'
      );
      // The sealed-plane blob table (per the backend doc): one encrypted row per object.
      // Only structural metadata is plaintext — kind, id, timestamps. Never a name, relation,
      // closeness or energy column: that would be a social graph sitting in the database.
      await db.execAsync(
        'CREATE TABLE IF NOT EXISTS blobs (id TEXT PRIMARY KEY NOT NULL, kind TEXT NOT NULL, ct TEXT NOT NULL, iv TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT);'
      );
      return db;
    });
  }
  return dbPromise;
}

/**
 * Everything the diary knows — entries, fragments, echoes, settings — lives as a single
 * AES-256-GCM sealed blob in one SQLite row. No column in this table is ever plaintext.
 */
export async function loadState(): Promise<PersistedState> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ ct: string; iv: string }>(
    'SELECT ct, iv FROM vault WHERE id = ?;',
    [ROW_ID]
  );
  if (!row) return defaultPersistedState();
  try {
    const json = await decryptText({ ct: row.ct, iv: row.iv });
    const parsed = JSON.parse(json) as Partial<PersistedState>;
    return { ...defaultPersistedState(), ...parsed };
  } catch {
    return defaultPersistedState();
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  const db = await getDb();
  const sealed = await encryptText(JSON.stringify(state));
  await db.runAsync(
    'INSERT INTO vault (id, ct, iv, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET ct = excluded.ct, iv = excluded.iv, updated_at = excluded.updated_at;',
    [ROW_ID, sealed.ct, sealed.iv, new Date().toISOString()]
  );
}

/** Dev/debug escape hatch only — never wired to a UI control that ships. */
export async function wipeAll(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM vault WHERE id = ?;', [ROW_ID]);
}

/** All undeleted people, decrypted. Each row is its own ciphertext — there is no plaintext person column. */
export async function listPeople(): Promise<Person[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ ct: string; iv: string }>(
    "SELECT ct, iv FROM blobs WHERE kind = 'person' AND deleted_at IS NULL ORDER BY created_at ASC;"
  );
  const people: Person[] = [];
  for (const row of rows) {
    try {
      const json = await decryptText({ ct: row.ct, iv: row.iv });
      people.push(JSON.parse(json) as Person);
    } catch {
      // a row that fails to decrypt is skipped rather than surfaced — never partial-render ciphertext
    }
  }
  return people;
}

export async function upsertPerson(person: Person): Promise<void> {
  const db = await getDb();
  const sealed = await encryptText(JSON.stringify(person));
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO blobs (id, kind, ct, iv, created_at, updated_at, deleted_at)
     VALUES (?, 'person', ?, ?, ?, ?, NULL)
     ON CONFLICT(id) DO UPDATE SET ct = excluded.ct, iv = excluded.iv, updated_at = excluded.updated_at;`,
    [person.id, sealed.ct, sealed.iv, now, now]
  );
}
