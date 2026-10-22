import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Sharing from 'expo-sharing';

import { ApiError, api } from '../../shared/api/client';
import type { DocumentMeta } from '../../shared/api/types';
import { config } from '../../shared/config';
import { downloadToCache, fileExists } from '../../shared/offline/files';
import { getAccessToken } from '../auth/authService';
import {
  getCachedDocument,
  listRecentDocuments,
  saveCachedDocument,
  touchDocument,
} from './localRepo';

export const documentKeys = {
  search: (query: string) => ['documents', 'search', query] as const,
  detail: (id: string) => ['documents', 'detail', id] as const,
  recent: ['documents-recent'] as const,
};

export function useDocumentSearch(query: string) {
  return useQuery({
    queryKey: documentKeys.search(query),
    queryFn: ({ signal }) =>
      api.get<DocumentMeta[]>('/documents', { query: { q: query, limit: 50 }, signal }),
    placeholderData: keepPreviousData,
  });
}

export interface DocumentDetail {
  doc: DocumentMeta;
  /** Datei liegt lokal und entspricht der aktuellen Version */
  availableOffline: boolean;
  /** Daten stammen aus dem lokalen Speicher, weil keine Verbindung besteht */
  fromCache: boolean;
}

/** Metadaten vom Server. Ohne Verbindung aus dem lokalen Speicher, wenn das Dokument schon gelesen wurde. */
export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: async ({ signal }): Promise<DocumentDetail> => {
      const cached = await getCachedDocument(id);
      try {
        const doc = await api.get<DocumentMeta>(`/documents/${id}`, { signal });
        const upToDate =
          !!cached?.localPath &&
          cached.version === doc.version &&
          (await fileExists(cached.localPath));
        return { doc, availableOffline: upToDate, fromCache: false };
      } catch (error) {
        if (error instanceof ApiError && error.isNetworkError && cached) {
          return {
            doc: cached,
            availableOffline: !!cached.localPath && (await fileExists(cached.localPath)),
            fromCache: true,
          };
        }
        throw error;
      }
    },
  });
}

export function useRecentDocuments() {
  return useQuery({
    queryKey: documentKeys.recent,
    queryFn: listRecentDocuments,
    staleTime: 0,
    retry: false,
  });
}

/** Lädt das Dokument bei Bedarf herunter und öffnet es über das System. Bereits geladene Dateien öffnen offline. */
export function useOpenDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: DocumentMeta) => {
      const cached = await getCachedDocument(doc.id);
      let path: string | null = null;

      if (cached?.localPath && cached.version === doc.version && (await fileExists(cached.localPath))) {
        path = cached.localPath;
        await touchDocument(doc.id);
      } else {
        const token = await getAccessToken();
        path = await downloadToCache({
          url: `${config.apiBaseUrl}/documents/${doc.id}/content`,
          id: doc.id,
          version: doc.version,
          mimeType: doc.mimeType,
          headers: { Authorization: `Bearer ${token}` },
        });
        await saveCachedDocument(doc, path);
        // Lesehistorie für andere Geräte, Fehler sind hier unkritisch
        void api.post(`/documents/${doc.id}/read`).catch(() => undefined);
      }

      if (!(await Sharing.isAvailableAsync())) throw new Error('sharing_unavailable');
      await Sharing.shareAsync(path, { mimeType: doc.mimeType ?? undefined, dialogTitle: doc.title });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.recent });
      void queryClient.invalidateQueries({ queryKey: ['documents', 'detail'] });
    },
  });
}
