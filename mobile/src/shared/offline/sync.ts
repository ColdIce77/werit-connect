import type * as SQLite from 'expo-sqlite';

import { api } from '../api/client';
import type {
  EmergencyContact,
  Employee,
  SafetyInstruction,
  SyncPage,
} from '../api/types';
import { normalizeForSearch } from '../utils/text';
import { getDb } from './db';
import { flushOutbox, refreshPending } from './outbox';
import { useSyncStore } from './syncStore';

/**
 * Delta-Synchronisation der Offline-Inhalte.
 * Erster Abruf: alles. Danach nur Änderungen seit `cursor_time` (Serverzeit des letzten Abrufs).
 * Gelöschte Datensätze kommen als `deletedIds`.
 */

export type ResourceName = 'emergency' | 'safety' | 'directory';

type Database = SQLite.SQLiteDatabase;

interface Resource<T extends { id: string }> {
  name: ResourceName;
  path: string;
  apply: (db: Database, items: T[], deletedIds: string[]) => Promise<void>;
}

async function deleteIds(db: Database, table: string, ids: string[]): Promise<void> {
  for (const id of ids) await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

const emergencyResource: Resource<EmergencyContact> = {
  name: 'emergency',
  path: '/emergency-contacts/sync',
  async apply(db, items, deletedIds) {
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO emergency_contacts (id, category, label, description, phone, sort_order, location_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET category = excluded.category, label = excluded.label,
           description = excluded.description, phone = excluded.phone,
           sort_order = excluded.sort_order, location_name = excluded.location_name`,
        [item.id, item.category, item.label, item.description, item.phone, item.sortOrder, item.locationName],
      );
    }
    await deleteIds(db, 'emergency_contacts', deletedIds);
  },
};

const safetyResource: Resource<SafetyInstruction> = {
  name: 'safety',
  path: '/safety/sync',
  async apply(db, items, deletedIds) {
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO safety_instructions
           (id, code, version, title, summary, body, is_mandatory, valid_until, document_id, acknowledged_version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET code = excluded.code, version = excluded.version,
           title = excluded.title, summary = excluded.summary, body = excluded.body,
           is_mandatory = excluded.is_mandatory, valid_until = excluded.valid_until,
           document_id = excluded.document_id,
           -- eine lokal schon erfasste Bestätigung nicht durch einen älteren Serverstand überschreiben
           acknowledged_version = MAX(COALESCE(safety_instructions.acknowledged_version, 0),
                                      COALESCE(excluded.acknowledged_version, 0))`,
        [
          item.id,
          item.code,
          item.version,
          item.title,
          item.summary,
          item.body,
          item.isMandatory ? 1 : 0,
          item.validUntil,
          item.documentId,
          item.acknowledgedVersion,
        ],
      );
    }
    await deleteIds(db, 'safety_instructions', deletedIds);
  },
};

const directoryResource: Resource<Employee> = {
  name: 'directory',
  path: '/directory/sync',
  async apply(db, items, deletedIds) {
    for (const item of items) {
      const searchText = normalizeForSearch(
        [item.displayName, item.jobTitle, item.departmentName, item.locationName, item.email]
          .filter(Boolean)
          .join(' '),
      );
      await db.runAsync(
        `INSERT INTO directory
           (id, display_name, job_title, department_name, location_name, email,
            phone_office, phone_mobile, manager_id, manager_name, search_text)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name,
           job_title = excluded.job_title, department_name = excluded.department_name,
           location_name = excluded.location_name, email = excluded.email,
           phone_office = excluded.phone_office, phone_mobile = excluded.phone_mobile,
           manager_id = excluded.manager_id, manager_name = excluded.manager_name,
           search_text = excluded.search_text`,
        [
          item.id,
          item.displayName,
          item.jobTitle,
          item.departmentName,
          item.locationName,
          item.email,
          item.phoneOffice,
          item.phoneMobile,
          item.managerId,
          item.managerName,
          searchText,
        ],
      );
    }
    await deleteIds(db, 'directory', deletedIds);
  },
};

/** Reihenfolge = Priorität. Notfallkontakte zuerst. */
const RESOURCES = [emergencyResource, safetyResource, directoryResource] as const;

const inFlight = new Map<ResourceName, Promise<void>>();

async function runResourceSync<T extends { id: string }>(resource: Resource<T>): Promise<void> {
  const db = await getDb();
  const state = await db.getFirstAsync<{ cursor_time: string | null }>(
    'SELECT cursor_time FROM sync_state WHERE name = ?',
    [resource.name],
  );
  const since = state?.cursor_time ?? undefined;

  let cursor: string | undefined;
  // Die Serverzeit der ersten Seite gilt als Stand. Änderungen während des Abrufs holt der nächste Lauf nach.
  let snapshotTime: string | undefined;

  do {
    const page = await api.get<SyncPage<T>>(resource.path, {
      query: { updated_since: since, cursor },
    });
    snapshotTime ??= page.serverTime;
    await db.withTransactionAsync(async () => {
      await resource.apply(db, page.items, page.deletedIds);
    });
    cursor = page.hasMore && page.cursor ? page.cursor : undefined;
  } while (cursor);

  await db.runAsync(
    `INSERT INTO sync_state (name, cursor_time, synced_at) VALUES (?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET cursor_time = excluded.cursor_time, synced_at = excluded.synced_at`,
    [resource.name, snapshotTime ?? null, Date.now()],
  );
}

/** Synchronisiert eine Ressource. Parallele Aufrufe teilen sich einen Lauf. */
export function syncResource(name: ResourceName): Promise<void> {
  const existing = inFlight.get(name);
  if (existing) return existing;

  const resource = RESOURCES.find((r) => r.name === name);
  if (!resource) return Promise.resolve();

  const run = (runResourceSync(resource as Resource<{ id: string }>) as Promise<void>).finally(() => {
    inFlight.delete(name);
  });
  inFlight.set(name, run);
  return run;
}

export async function hasSynced(name: ResourceName): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ name: string }>('SELECT name FROM sync_state WHERE name = ?', [name]);
  return !!row;
}

/** Zeitpunkt (ms) der letzten erfolgreichen Synchronisation einer Ressource, null = noch nie. */
export async function getSyncedAt(name: ResourceName): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ synced_at: number }>(
    'SELECT synced_at FROM sync_state WHERE name = ?',
    [name],
  );
  return row?.synced_at ?? null;
}

/**
 * Nach einem Sprachwechsel: übersetzte Inhalte vollständig neu laden.
 * Noch nicht gesendete Bestätigungen liegen in der Outbox und bleiben erhalten.
 */
export async function resetLocalizedContent(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM sync_state WHERE name IN ('emergency', 'safety')");
    await db.runAsync('DELETE FROM emergency_contacts');
    await db.runAsync('DELETE FROM safety_instructions');
  });
}

// ---------------------------------------------------------------------------
// Gesamtlauf
// ---------------------------------------------------------------------------

const MIN_INTERVAL_MS = 30_000;
let runningAll: Promise<ResourceName[]> | null = null;

/**
 * Sendet die Outbox und synchronisiert alle Ressourcen.
 * Liefert die Bereiche, deren Daten sich geändert haben könnten (für Cache-Aktualisierung).
 */
export function runFullSync(options: { force?: boolean } = {}): Promise<ResourceName[]> {
  if (runningAll) return runningAll;

  const { lastSyncAt } = useSyncStore.getState();
  if (!options.force && lastSyncAt && Date.now() - lastSyncAt < MIN_INTERVAL_MS) {
    return Promise.resolve([]);
  }

  runningAll = (async () => {
    const store = useSyncStore.getState();
    store.setSyncing(true);
    const changed: ResourceName[] = [];
    try {
      await refreshPending();
      await flushOutbox().catch(() => undefined);

      let allOk = true;
      for (const resource of RESOURCES) {
        try {
          await syncResource(resource.name);
          changed.push(resource.name);
        } catch {
          allOk = false; // andere Ressourcen trotzdem synchronisieren
        }
      }
      if (allOk) useSyncStore.getState().setLastSyncAt(Date.now());
    } finally {
      useSyncStore.getState().setSyncing(false);
    }
    return changed;
  })().finally(() => {
    runningAll = null;
  });

  return runningAll;
}
