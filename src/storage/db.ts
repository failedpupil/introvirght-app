import * as SQLite from 'expo-sqlite';
import { encryptText, decryptText } from './crypto';
import { PersistedState, defaultPersistedState, Person, SealedLetter } from '../state/types';

const DB_NAME = 'introvirght.vault.db';
const ROW_ID = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME)
      .then(async (db) => {
        await db.execAsync(
          'CREATE TABLE IF NOT EXISTS vault (id INTEGER PRIMARY KEY NOT NULL, ct TEXT NOT NULL, iv TEXT NOT NULL, updated_at TEXT NOT NULL);'
        );
        // The sealed-plane blob table (per the backend doc): one encrypted row per object.
        // Only structural metadata is plaintext — kind, id, timestamps. Never a name, relation,
        // closeness or energy column: that would be a social graph sitting in the database.
        await db.execAsync(
          'CREATE TABLE IF NOT EXISTS blobs (id TEXT PRIMARY KEY NOT NULL, kind TEXT NOT NULL, ct TEXT NOT NULL, iv TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT);'
        );
        // Letters (RITUALS_ADDENDUM.md §2) reuse the blob table with exactly three plaintext
        // columns: opens_at, written_at, read_at. Readiness has to be answerable without
        // decrypting anything, and "Ready now" vs "Opened" has to survive a restart — but the
        // body stays inside `ct` like every other sealed object. These are added with ALTER so
        // an existing install keeps its rows.
        for (const col of ['opens_at', 'written_at', 'read_at']) {
          await db.execAsync(`ALTER TABLE blobs ADD COLUMN ${col} TEXT;`).catch(() => {
            // already present — SQLite has no ADD COLUMN IF NOT EXISTS
          });
        }
        return db;
      })
      .catch((err) => {
        // Never cache a failed open — a transient lock right after Android kills and
        // restarts a backgrounded process would otherwise poison every DB call for the
        // rest of the app's lifetime instead of just this one.
        dbPromise = null;
        throw err;
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
    const merged = { ...defaultPersistedState(), ...parsed };

    // The top-level spread doesn't reach into the arrays, so entries and fragments
    // written by an older version arrive missing fields the current code expects.
    merged.entries = (merged.entries ?? []).map((e) => ({
      ...e,
      people: e.people ?? [],
      minutesOnPage: e.minutesOnPage ?? 0,
      foldedFragmentIds: e.foldedFragmentIds ?? [],
    }));
    merged.todayFragments = (merged.todayFragments ?? []).map((f, i) => ({
      ...f,
      id: f.id ?? `legacy_${i}_${f.at}`,
    }));
    return merged;
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

interface LetterRow {
  id: string;
  opens_at: string;
  written_at: string;
  read_at: string | null;
  ct: string | null;
  iv: string | null;
}

function rowToLetter(row: LetterRow, body: string): SealedLetter {
  return {
    id: row.id,
    writtenAtMs: Date.parse(row.written_at),
    opensAtMs: Date.parse(row.opens_at),
    readAtMs: row.read_at ? Date.parse(row.read_at) : null,
    body,
  };
}

/**
 * Every letter, with the body of any still-sealed one withheld.
 *
 * The `CASE` is the whole point: a sealed letter's ciphertext never leaves SQLite, so the
 * decrypted body cannot sit in memory waiting to be found — the same guarantee the addendum
 * asks the server for, applied at the only boundary this architecture actually has (§2,
 * Option A). Sealed rows come back with `body: ''`.
 */
export async function listLetters(nowMs = Date.now()): Promise<SealedLetter[]> {
  const db = await getDb();
  const nowIso = new Date(nowMs).toISOString();
  const rows = await db.getAllAsync<LetterRow>(
    `SELECT id, opens_at, written_at, read_at,
            CASE WHEN opens_at <= ? THEN ct ELSE NULL END AS ct,
            CASE WHEN opens_at <= ? THEN iv ELSE NULL END AS iv
     FROM blobs
     WHERE kind = 'letter' AND deleted_at IS NULL
     ORDER BY opens_at ASC;`,
    [nowIso, nowIso]
  );
  const letters: SealedLetter[] = [];
  for (const row of rows) {
    if (!row.ct || !row.iv) {
      letters.push(rowToLetter(row, ''));
      continue;
    }
    try {
      const json = await decryptText({ ct: row.ct, iv: row.iv });
      letters.push(rowToLetter(row, (JSON.parse(json) as { body: string }).body));
    } catch {
      letters.push(rowToLetter(row, ''));
    }
  }
  return letters;
}

/** Seal a letter. There is deliberately no update or delete counterpart — see §2. */
export async function insertLetter(letter: SealedLetter): Promise<void> {
  const db = await getDb();
  const sealed = await encryptText(JSON.stringify({ body: letter.body }));
  await db.runAsync(
    `INSERT INTO blobs (id, kind, ct, iv, created_at, updated_at, deleted_at, opens_at, written_at, read_at)
     VALUES (?, 'letter', ?, ?, ?, ?, NULL, ?, ?, NULL);`,
    [
      letter.id,
      sealed.ct,
      sealed.iv,
      new Date(letter.writtenAtMs).toISOString(),
      new Date(letter.writtenAtMs).toISOString(),
      new Date(letter.opensAtMs).toISOString(),
      new Date(letter.writtenAtMs).toISOString(),
    ]
  );
}

/**
 * Stamp `read_at`, once. The `read_at IS NULL` guard keeps the first open the real one, so
 * re-reading a letter later never rewrites the moment it was opened. Refuses to mark a letter
 * read before it opens, so a caller bug can't retroactively unseal one.
 */
export async function markLetterRead(id: string, nowMs = Date.now()): Promise<void> {
  const db = await getDb();
  const nowIso = new Date(nowMs).toISOString();
  await db.runAsync(
    "UPDATE blobs SET read_at = ?, updated_at = ? WHERE id = ? AND kind = 'letter' AND read_at IS NULL AND opens_at <= ?;",
    [nowIso, nowIso, id, nowIso]
  );
}
