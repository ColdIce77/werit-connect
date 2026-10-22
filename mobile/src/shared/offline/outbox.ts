import * as Crypto from 'expo-crypto';

import { ApiError, api } from '../api/client';
import { getDb } from './db';
import { useSyncStore } from './syncStore';

/**
 * Warteschlange für Aktionen, die offline entstehen (Lesebestätigung, Ticket).
 *
 * - Jeder Eintrag hat eine ID, die zugleich Idempotenzschlüssel für das Backend ist.
 *   Kam der erste Versuch beim Server an, die Antwort aber nicht zurück, erzeugt der zweite Versuch
 *   keine Dublette (das Backend antwortet mit 409 oder dem vorhandenen Datensatz).
 * - Die Einträge liegen in der verschlüsselten lokalen Datenbank (Tabelle `outbox`).
 * - `flushOutbox` wirft bei Verbindungs- oder Serverfehlern nicht. Der Eintrag bleibt dann
 *   in der Warteschlange und wird beim nächsten Lauf erneut gesendet.
 */

export type OutboxType = 'safety_ack' | 'ticket_create';

export interface SafetyAckPayload {
  instructionId: string;
  version: number;
  /** Zeitpunkt auf dem Gerät, auch wenn die Bestätigung offline erfolgte */
  acknowledgedAt: string;
}

export interface TicketCreatePayload {
  title: string;
  description: string;
  category: string | null;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

interface OutboxRow {
  id: string;
  type: OutboxType;
  payload: string;
}

type Outcome = 'done' | 'retry' | 'rejected';

/** Einträge, die der Server dauerhaft abgelehnt hat (nur für die laufende Sitzung relevant). */
const rejectedIds = new Set<string>();

export async function enqueue(type: OutboxType, payload: SafetyAckPayload | TicketCreatePayload): Promise<string> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  await db.runAsync('INSERT INTO outbox (id, type, payload, created_at) VALUES (?, ?, ?, ?)', [
    id,
    type,
    JSON.stringify(payload),
    Date.now(),
  ]);
  await refreshPending();
  return id;
}

/** true, solange der Eintrag noch auf die Übertragung wartet. */
export async function isQueued(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: string }>('SELECT id FROM outbox WHERE id = ?', [id]);
  return row !== null;
}

/** true, wenn der Server den Eintrag dauerhaft abgelehnt hat (z. B. ungültige Daten). */
export function wasRejected(id: string): boolean {
  return rejectedIds.has(id);
}

/** Aktualisiert die Anzahl wartender Aktionen für die Anzeige. */
export async function refreshPending(): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM outbox');
  useSyncStore.getState().setPending(row?.n ?? 0);
}

async function send(row: OutboxRow): Promise<Outcome> {
  const payload = JSON.parse(row.payload) as SafetyAckPayload | TicketCreatePayload;

  try {
    if (row.type === 'safety_ack') {
      await api.post('/safety/acknowledgements', { ...(payload as SafetyAckPayload), clientEventId: row.id });
    } else {
      await api.post('/tickets', { ...(payload as TicketCreatePayload), clientRequestId: row.id });
    }
    return 'done';
  } catch (error) {
    if (!(error instanceof ApiError)) return 'retry';
    // 409: Der Server kennt den Eintrag bereits (früherer Versuch kam an). Das gilt als gesendet.
    if (error.status === 409) return 'done';
    // Vorübergehende Fehler: später erneut versuchen
    if (error.status === 0 || error.status === 401 || error.status === 408 || error.status === 429 || error.status >= 500) {
      return 'retry';
    }
    // Übrige 4xx: Der Server lehnt die Daten dauerhaft ab, erneutes Senden würde nichts ändern.
    return 'rejected';
  }
}

async function processQueue(): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<OutboxRow>('SELECT id, type, payload FROM outbox ORDER BY created_at, id');

  for (const row of rows) {
    const outcome = await send(row);

    if (outcome === 'retry') {
      await db.runAsync('UPDATE outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?', [
        'retry',
        row.id,
      ]);
      // Meist besteht keine Verbindung: Reihenfolge wahren und später fortfahren
      break;
    }

    if (outcome === 'rejected') rejectedIds.add(row.id);
    await db.runAsync('DELETE FROM outbox WHERE id = ?', [row.id]);
  }

  await refreshPending();
}

let running: Promise<void> | null = null;
let rerun = false;

/**
 * Sendet alle wartenden Einträge der Reihe nach. Parallele Aufrufe teilen sich einen Lauf.
 * Kommt während eines Laufs ein neuer Eintrag hinzu, folgt ein weiterer Durchgang.
 */
export function flushOutbox(): Promise<void> {
  if (running) {
    rerun = true;
    return running;
  }

  running = (async () => {
    do {
      rerun = false;
      await processQueue();
    } while (rerun);
  })().finally(() => {
    running = null;
  });

  return running;
}
