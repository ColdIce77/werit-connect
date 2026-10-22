import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../shared/api/client';
import type { DashboardResponse, Post, PostType, Task } from '../../shared/api/types';

export const dashboardKeys = {
  dashboard: ['dashboard'] as const,
  posts: (type?: PostType) => ['posts', type ?? 'all'] as const,
  post: (id: string) => ['post', id] as const,
  tasks: ['tasks'] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.dashboard,
    queryFn: ({ signal }) => api.get<DashboardResponse>('/dashboard', { signal }),
  });
}

export function usePosts(type?: PostType) {
  return useQuery({
    queryKey: dashboardKeys.posts(type),
    queryFn: ({ signal }) => api.get<Post[]>('/posts', { query: { type, limit: 50 }, signal }),
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: dashboardKeys.post(id),
    queryFn: ({ signal }) => api.get<Post>(`/posts/${id}`, { signal }),
  });
}

export function useTasks() {
  return useQuery({
    queryKey: dashboardKeys.tasks,
    queryFn: ({ signal }) => api.get<Task[]>('/tasks', { signal }),
  });
}

/** Aufgabe erledigen oder wieder öffnen. */
export function useSetTaskDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      api.post<Task>(`/tasks/${id}/${done ? 'complete' : 'reopen'}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.tasks });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.dashboard });
    },
  });
}
