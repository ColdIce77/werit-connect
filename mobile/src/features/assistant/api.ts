import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../shared/api/client';
import type {
  AssistantChatResponse,
  AssistantConversationSummary,
  AssistantMessage,
} from '../../shared/api/types';

export const assistantKeys = {
  conversations: ['assistant', 'conversations'] as const,
  messages: (id: string) => ['assistant', 'messages', id] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: assistantKeys.conversations,
    queryFn: ({ signal }) =>
      api.get<AssistantConversationSummary[]>('/assistant/conversations', { signal }),
  });
}

export function useConversationMessages(id: string | undefined) {
  return useQuery({
    queryKey: assistantKeys.messages(id ?? 'none'),
    queryFn: ({ signal }) =>
      api.get<AssistantMessage[]>(`/assistant/conversations/${id}/messages`, { signal }),
    enabled: !!id,
    staleTime: Infinity,
  });
}

/**
 * Stellt eine Frage an den KI-Assistenten (RAG). Das Backend antwortet nur auf Grundlage
 * von Dokumenten, die der Nutzer sehen darf, und nennt die Quellen.
 */
export function useAskAssistant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, message }: { conversationId?: string; message: string }) =>
      api.post<AssistantChatResponse>('/assistant/messages', { conversationId, message }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assistantKeys.conversations }),
  });
}

export function useAssistantFeedback() {
  return useMutation({
    mutationFn: ({ messageId, value }: { messageId: string; value: 1 | -1 }) =>
      api.post<void>(`/assistant/messages/${messageId}/feedback`, { value }),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/assistant/conversations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assistantKeys.conversations }),
  });
}
