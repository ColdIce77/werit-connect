import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

import { wipeFiles } from './files';
import { useSyncStore } from './syncStore';

/**
 * Lokale Datenbank für alle Offline-Inhalte.
 *
 * Verschlüsselung: SQLCipher mit zufälligem Schlüssel im SecureStore. Das setzt voraus, dass
 * das Plugin `expo-sqlite` mit `useSQLCipher: true` konfiguriert ist (siehe app.config.ts).
 * Ohne SQLCipher ignoriert SQLite `PRAGMA key` stillschweigend und die Datei ist unverschlüsselt.
 * Deshalb prüft `assertEncrypted` beim Öffnen, ob die SQLCipher-Version vorhanden ist.
 */

const DB_NAME = 'werit-connect.db';
const KEY_NAME = 'werit.db.key';

const MIGRATIONS: string[] = [
  // Version 1
  `
  CREATE TABLE sync_state (
    name TEXT PRIMARY KEY,
    cursor_time TEXT,
    synced_at INTEGER NOT NULL
  );

  CREATE TABLE directory (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    job_title TEXT,
    department_name TEXT,
    location_name TEXT,
    email TEXT NOT NULL,
    phone_office TEXT,
    phone_mobile TEXT,
    manager_id TEXT,
    manager_name TEXT,
    search_text TEXT NOT NULL
  );
  CREATE INDEX directory_name_idx ON directory (display_name);

  CREATE TABLE emergency_contacts (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    phone TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    location_name TEXT
  );

  CREATE TABLE safety_instructions (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    version INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    body TEXT NOT NULL,
    is_mandatory INTEGER NOT NULL,
    valid_until TEXT,
    document_id TEXT,
    acknowledged_version INTEGER
  );

  CREATE TABLE outbox (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
  );

  CREATE TABLE document_cache (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER,
    version TEXT,
    category TEXT,
    web_url TEXT,
    updated_at TEXT,
    local_path TEXT,
    last_read_at INTEGER NOT NULL
  );
  CREATE INDEX document_cache_read_idx ON document_cache (last_read_at DESC);
  `,
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let wiping: Promise<void> | null = null;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function getOrCreateKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing) return existing;
  const key = toHex(Crypto.getRandomBytes(32));
  await SecureStore.setItemAsync(KEY_NAME, key);
  return key;
}

async function assertEncrypted(db: SQLite.SQLiteDatabase): Promise<void> {
  // PRAGMA cipher_version liefert nur mit SQLCipher einen Wert
  const row = await db.getFirstAsync<{ cipher_version?: string }>('PRAGMA cipher_version');
  if (!row?.cipher_version) {
    throw new Error(
      'SQLCipher ist nicht aktiv. In app.config.ts muss expo-sqlite mit useSQLCipher: true konfiguriert sein.',
    );
  }
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version++) {
    const sql = MIGRATIONS[version] as string;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
    });
    await db.execAsync(`PRAGMA user_version = ${version + 1}`);
  }
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  const key = await getOrCreateKey();
  // Rohschlüssel (64 Hexzeichen), kein Passwort-Ableitungsaufwand nötig
  await db.execAsync(`PRAGMA key = "x'${key}'";`);
  await assertEncrypted(db);
  await migrate(db);
  return db;
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (wiping) await wiping;
  dbPromise ??= open().catch((error) => {
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}

/** Löscht alle lokalen Daten (Abmeldung, Rollenentzug, Intune-Wipe). */
export function wipeLocalData(): Promise<void> {
  wiping = (async () => {
    const pending = dbPromise;
    dbPromise = null;
    if (pending) {
      try {
        const db = await pending;
        await db.closeAsync();
      } catch {
        // Datenbank war nie geöffnet
      }
    }
    await Promise.allSettled([
      SQLite.deleteDatabaseAsync(DB_NAME),
      SecureStore.deleteItemAsync(KEY_NAME),
      wipeFiles(),
    ]);
    useSyncStore.getState().reset();
  })().finally(() => {
    wiping = null;
  });
  return wiping;
}
