import { useQuery } from '@tanstack/react-query';
import Storage from 'expo-sqlite/kv-store';

import { api } from '../../shared/api/client';
import type { RemoteConfig } from '../../shared/api/types';

type VedaLink = NonNullable<RemoteConfig['links']['veda']>;

const KEY = 'werit.link.veda';

function readCached(): VedaLink | null {
  try {
    const raw = Storage.getItemSync(KEY);
    return raw ? (JSON.parse(raw) as VedaLink) : null;
  } catch {
    return null;
  }
}

function writeCached(link: VedaLink | null): void {
  try {
    if (link) Storage.setItemSync(KEY, JSON.stringify(link));
    else Storage.removeItemSync(KEY);
  } catch {
    // nicht kritisch
  }
}

/**
 * Link zu VEDA.net. Die Adresse pflegt der Administrator in den App-Einstellungen (Schlüssel links.veda).
 * Der zuletzt bekannte Link wird gemerkt, damit er auch offline im Menü steht.
 */
export function useVedaLink() {
  return useQuery({
    queryKey: ['config', 'veda'],
    queryFn: async ({ signal }) => {
      const config = await api.get<RemoteConfig>('/app-config', { signal });
      writeCached(config.links.veda);
      return config.links.veda;
    },
    initialData: readCached,
    staleTime: 10 * 60_000,
  });
}
