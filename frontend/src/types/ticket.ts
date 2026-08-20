export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';

// Representa a entidade aninhada de evento na resposta do Ticket
export interface TicketEventSummary {
  id: string;
  title: string;
  date: string;
  location: string;
  bannerUrl: string | null;
}

export interface TicketSeatSummary {
  seatCode: string;
}

export interface TicketDetail {
  id: string;
  ticketCode: string;
  secureHash: string;
  eventId: string;
  status: TicketStatus;
  event: TicketEventSummary;
  seat: TicketSeatSummary | null;
}

export interface ValidateTicketPayload {
  ticketCode: string;
  secureHash: string;
  eventId: string;
}

export interface ValidateTicketResponse {
  message: string;
}
