import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SafetyInstruction } from '../../shared/api/types';
import { getDb } from '../../shared/offline/db';
import { enqueue, flushOutbox, type SafetyAckPayload } from '../../shared/offline/outbox';
import { hasSynced, syncResource } from '../../shared/offline/sync';

export type SafetyStatus = 'acknowledged' | 'open' | 'updated';

export interface SafetyItem extends SafetyInstruction {
  status: SafetyStatus;
  /** Bestätigung ist erfasst, aber noch nicht an den Server übertragen */
  pendingSync: boolean;
}

interface SafetyRow {
  id: string;
  code: string;
  version: number;
  title: string;
  summary: string | null;
  body: string;
  is_mandatory: number;
  valid_until: string | null;
  document_id: string | null;
  acknowledged_version: number | null;
}

async function pendingAcknowledgements(): Promise<Map<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ payload: string }>(
    "SELECT payload FROM outbox WHERE type = 'safety_ack'",
  );
  const map = new Map<string, number>();
  for (const row of rows) {
    const p = JSON.parse(row.payload) as SafetyAckPayload;
    map.set(p.instructionId, Math.max(map.get(p.instructionId) ?? 0, p.version));
  }
  return map;
}

function toItem(row: SafetyRow, pending: Map<string, number>): SafetyItem {
  const pendingVersion = pending.get(row.id) ?? 0;
  const confirmed = row.acknowledged_version ?? 0;
  const acknowledged = Math.max(confirmed, pendingVersion) >= row.version;

  let status: SafetyStatus = 'open';
  if (acknowledged) status = 'acknowledged';
  else if (confirmed > 0) status = 'updated';

  return {
    id: row.id,
    code: row.code,
    version: row.version,
    title: row.title,
    summary: row.summary,
    body: row.body,
    isMandatory: row.is_mandatory === 1,
    validUntil: row.valid_until,
    documentId: row.document_id,
    acknowledgedVersion: row.acknowledged_version,
    status,
    pendingSync: acknowledged && confirmed < row.version,
  };
}

async function loadAll(): Promise<SafetyItem[]> {
  if (!(await hasSynced('safety'))) await syncResource('safety').catch(() => undefined);

  const db = await getDb();
  const [rows, pending] = await Promise.all([
    db.getAllAsync<SafetyRow>(
      `SELECT id, code, version, title, summary, body, is_mandatory, valid_until, document_id, acknowledged_version
       FROM safety_instructions`,
    ),
    pendingAcknowledgements(),
  ]);

  const rank: Record<SafetyStatus, number> = { open: 0, updated: 1, acknowledged: 2 };
  return rows
    .map((row) => toItem(row, pending))
    .sort(
      (a, b) =>
        rank[a.status] - rank[b.status] ||
        Number(b.isMandatory) - Number(a.isMandatory) ||
        a.title.localeCompare(b.title),
    );
}

/** Schlüssel beginnen mit "safety", damit der SyncManager die Anzeige nach einem Abgleich aktualisiert. */
export function useSafetyList() {
  return useQuery({ queryKey: ['safety', 'list'], queryFn: loadAll, staleTime: 0, retry: false });
}

export function useSafetyItem(id: string) {
  return useQuery({
    queryKey: ['safety', 'item', id],
    staleTime: 0,
    retry: false,
    queryFn: async () => (await loadAll()).find((item) => item.id === id) ?? null,
  });
}

/** Bestätigt eine Unterweisung. Funktioniert offline: Die Bestätigung wird vorgemerkt und später gesendet. */
export function useAcknowledgeSafety() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: SafetyItem) => {
      const payload: SafetyAckPayload = {
        instructionId: item.id,
        version: item.version,
        acknowledgedAt: new Date().toISOString(),
      };
      await enqueue('safety_ack', payload);
      // Sofort versuchen. Ohne Verbindung bleibt der Eintrag in der Outbox.
      await flushOutbox().catch(() => undefined);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety'] }),
  });
}
