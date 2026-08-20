import type { TicketStatus } from '../types/ticket';

export function getTicketStatusLabel(status: TicketStatus): string {
  switch (status) {
    case 'VALID':
      return 'Válido';
    case 'USED':
      return 'Já Utilizado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status;
  }
}
