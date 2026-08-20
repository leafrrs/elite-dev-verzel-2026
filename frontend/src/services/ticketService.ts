import { fetchApi } from './api';
import type { TicketDetail, ValidateTicketPayload, ValidateTicketResponse } from '../types/ticket';

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
  }
};
