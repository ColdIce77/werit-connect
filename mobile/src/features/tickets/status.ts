import type { TicketStatus } from '../../shared/api/types';

export function ticketStatusTone(status: TicketStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'open':
      return 'danger';
    case 'in_progress':
      return 'warning';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'neutral';
  }
}
