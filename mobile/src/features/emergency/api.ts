import { useQuery } from '@tanstack/react-query';

import type { EmergencyContact } from '../../shared/api/types';
import { getDb } from '../../shared/offline/db';
import { getSyncedAt, hasSynced, syncResource } from '../../shared/offline/sync';

interface EmergencyRow {
  id: string;
  category: string;
  label: string;
  description: string | null;
  phone: string;
  sort_order: number;
  location_name: string | null;
}

async function listLocal(): Promise<EmergencyContact[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EmergencyRow>(
    'SELECT id, category, label, description, phone, sort_order, location_name FROM emergency_contacts ORDER BY sort_order, label',
  );
  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    label: row.label,
    description: row.description,
    phone: row.phone,
    sortOrder: row.sort_order,
    locationName: row.location_name,
  }));
}

/**
 * Notfallkontakte kommen immer aus der lokalen Kopie. Nur wenn sie noch nie geladen wurden,
 * versucht die App einmalig eine Synchronisation. Der Schlüssel beginnt mit "emergency",
 * damit der SyncManager die Anzeige nach einem Abgleich aktualisiert.
 */
export function useEmergencyContacts() {
  return useQuery({
    queryKey: ['emergency', 'list'],
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      if (!(await hasSynced('emergency'))) {
        await syncResource('emergency').catch(() => undefined);
      }
      return { items: await listLocal(), syncedAt: await getSyncedAt('emergency') };
    },
  });
}
