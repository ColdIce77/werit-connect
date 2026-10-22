import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError, api } from '../../shared/api/client';
import type { Ticket } from '../../shared/api/types';
import {
  enqueue,
  flushOutbox,
  isQueued,
  wasRejected,
  type TicketCreatePayload,
} from '../../shared/offline/outbox';

/** Platzhalter-Vertrag, bis die NinjaOne-Anbindung definiert ist (siehe Architektur, Abschnitt 13). */
export const ticketKeys = {
  list: ['tickets', 'list'] as const,
  detail: (id: string) => ['tickets', 'detail', id] as const,
};

export function useTickets() {
  return useQuery({
    queryKey: ticketKeys.list,
    queryFn: ({ signal }) => api.get<Ticket[]>('/tickets', { signal }),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: ({ signal }) => api.get<Ticket>(`/tickets/${id}`, { signal }),
  });
}

export type CreateTicketResult = 'sent' | 'queued';

/**
 * Meldet eine Störung. Ohne Verbindung wird die Meldung vorgemerkt und später automatisch gesendet.
 * Eine feste Anfrage-ID verhindert doppelte Tickets, falls der erste Versuch beim Server ankam.
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TicketCreatePayload): Promise<CreateTicketResult> => {
      // Immer zuerst in die Outbox: So geht die Meldung nie verloren, auch wenn die App währenddessen schließt.
      const id = await enqueue('ticket_create', payload);
      try {
        await flushOutbox();
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
      }
      if (wasRejected(id)) throw new Error('ticket_rejected');
      return (await isQueued(id)) ? 'queued' : 'sent';
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  });
}
