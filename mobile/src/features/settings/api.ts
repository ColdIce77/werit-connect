import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../shared/api/client';
import type { NotificationCategory, NotificationPreference } from '../../shared/api/types';

export const preferenceKeys = { list: ['settings', 'notification-preferences'] as const };

export function useNotificationPreferences() {
  return useQuery({
    queryKey: preferenceKeys.list,
    queryFn: ({ signal }) => api.get<NotificationPreference[]>('/me/notification-preferences', { signal }),
  });
}

/** Schaltet eine Kategorie sofort in der Anzeige um und gleicht danach mit dem Server ab. */
export function useSetNotificationPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ category, enabled }: { category: NotificationCategory; enabled: boolean }) =>
      api.put<void>('/me/notification-preferences', { category, enabled }),
    onMutate: async ({ category, enabled }) => {
      await queryClient.cancelQueries({ queryKey: preferenceKeys.list });
      const previous = queryClient.getQueryData<NotificationPreference[]>(preferenceKeys.list);
      queryClient.setQueryData<NotificationPreference[]>(preferenceKeys.list, (old) =>
        (old ?? []).map((entry) => (entry.category === category ? { ...entry, enabled } : entry)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(preferenceKeys.list, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: preferenceKeys.list }),
  });
}
