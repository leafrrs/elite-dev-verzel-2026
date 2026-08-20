import { fetchApi } from './api';
import type { TicketDetail } from '../types/ticket';

export const ticketService = {
  // Retorna a lista de tickets do usuário logado
  async listMyTickets(): Promise<TicketDetail[]> {
    return fetchApi<TicketDetail[]>('/tickets/me', {
      method: 'GET',
    });
  }
};
