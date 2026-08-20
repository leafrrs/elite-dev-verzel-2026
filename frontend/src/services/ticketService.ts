import { fetchApi } from './api';
import type { TicketDetail, ValidateTicketPayload, ValidateTicketResponse, SharedTicket } from '../types/ticket';

export const ticketService = {
  // Retorna a lista de tickets do usuário logado
  async listMyTickets(): Promise<TicketDetail[]> {
    return fetchApi<TicketDetail[]>('/tickets/me', {
      method: 'GET',
    });
  },

  // Valida um ingresso na portaria
  async validateTicket(payload: ValidateTicketPayload): Promise<ValidateTicketResponse> {
    return fetchApi<ValidateTicketResponse>('/tickets/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async shareTicket(ticketCode: string): Promise<{ shareToken: string }> {
    return fetchApi<{ shareToken: string }>(`/tickets/${ticketCode}/share`, {
      method: 'POST',
    });
  },

  async getSharedTicket(shareToken: string): Promise<SharedTicket> {
    return fetchApi<SharedTicket>(`/tickets/shared/${shareToken}`, {
      method: 'GET',
    });
  }
};
