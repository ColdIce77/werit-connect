import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { ApiError, api } from '../../shared/api/client';
import type { Employee } from '../../shared/api/types';
import { hasSynced } from '../../shared/offline/sync';
import { getLocalEmployee, searchLocalDirectory } from './localRepo';

/**
 * Local-first: Ist das Verzeichnis einmal synchronisiert, läuft die Suche in der lokalen Kopie
 * (schnell und offline). Vor der ersten Synchronisation fragt die App den Server direkt.
 * Der Schlüssel beginnt mit "directory", damit der SyncManager die Anzeige nach einem Abgleich aktualisiert.
 */
export const directoryKeys = {
  search: (query: string) => ['directory', 'search', query] as const,
  employee: (id: string) => ['directory', 'employee', id] as const,
};

async function isLocalReady(): Promise<boolean> {
  try {
    return await hasSynced('directory');
  } catch {
    return false;
  }
}

export function useDirectorySearch(query: string) {
  return useQuery({
    queryKey: directoryKeys.search(query),
    queryFn: async ({ signal }) => {
      if (await isLocalReady()) return searchLocalDirectory(query);
      return api.get<Employee[]>('/directory', { query: { q: query, limit: 50 }, signal });
    },
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: directoryKeys.employee(id),
    queryFn: async ({ signal }) => {
      if (await isLocalReady()) {
        const local = await getLocalEmployee(id);
        if (local) return local;
      }
      const remote = await api.get<Employee>(`/directory/${id}`, { signal });
      return remote;
    },
    retry: (count, error) => !(error instanceof ApiError) && count < 1,
  });
}
