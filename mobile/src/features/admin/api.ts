import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../shared/api/client';
import type {
  AdminStatus,
  LocationDto,
  PublishPostRequest,
  SecurityAlertRequest,
} from '../../shared/api/types';

export const adminKeys = {
  status: ['admin', 'status'] as const,
  locations: ['locations'] as const,
};

export function useAdminStatus() {
  return useQuery({
    queryKey: adminKeys.status,
    queryFn: ({ signal }) => api.get<AdminStatus>('/admin/status', { signal }),
  });
}

/** Startet den Abgleich der Benutzer mit Entra ID. */
export function useStartUserSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>('/admin/sync/users'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminKeys.status }),
  });
}

/** Startet die Neuindizierung der Wissensquellen für den KI-Assistenten. */
export function useStartReindex() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>('/admin/rag/reindex'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminKeys.status }),
  });
}

export function useLocations() {
  return useQuery({
    queryKey: adminKeys.locations,
    queryFn: ({ signal }) => api.get<LocationDto[]>('/locations', { signal }),
    staleTime: 10 * 60_000,
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: PublishPostRequest) => api.post<void>('/posts', request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function usePublishSecurityAlert() {
  return useMutation({
    mutationFn: (request: SecurityAlertRequest) => api.post<void>('/security-alerts', request),
  });
}
