export interface CreateReservationPayload {
  eventId: string;
  seatCode?: string;
}

export interface CreateReservationResponse {
  message: string;
  reservation: Reservation;
}

export interface Reservation {
  id: string;
  eventId: string;
  userId: string;
  seatId: string | null;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'REFUSED';
}

export interface PaymentPayload {
  approved: boolean;
}

export interface Ticket {
  id: string;
  ticketCode: string;
  secureHash: string; // Apenas para debug/entendimento nesta fase
  eventId: string;
  userId: string;
  reservationId: string;
  seatId: string | null;
}

export interface PaymentResponse {
  message: string;
  ticket?: Ticket;
}
