import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../shared/api/client';
import type { Approval } from '../../shared/api/types';

/**
 * Platzhalter-Vertrag. Welche Vorgänge als Freigabe erscheinen (z. B. IT-Freigaben),
 * wird später festgelegt (siehe Architektur, Abschnitt 13).
 */
export type ApprovalFilter = 'pending' | 'decided';

export const approvalKeys = {
  list: (filter: ApprovalFilter) => ['approvals', 'list', filter] as const,
  detail: (id: string) => ['approvals', 'detail', id] as const,
};

export function useApprovals(filter: ApprovalFilter) {
  return useQuery({
    queryKey: approvalKeys.list(filter),
    queryFn: ({ signal }) => api.get<Approval[]>('/approvals', { query: { status: filter }, signal }),
  });
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: approvalKeys.detail(id),
    queryFn: ({ signal }) => api.get<Approval>(`/approvals/${id}`, { signal }),
  });
}

export function useDecideApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      comment,
    }: {
      id: string;
      decision: 'approved' | 'rejected';
      comment: string | null;
    }) => api.post<Approval>(`/approvals/${id}/decision`, { decision, comment }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['approvals'] }),
  });
}
