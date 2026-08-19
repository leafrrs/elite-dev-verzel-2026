export interface CreateReservationPayload {
  eventId: string;
  seatCode?: string;
}

export interface Reservation {
  id: string;
  eventId: string;
  userId: string;
  seatId: string | null;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'REFUSED';
}
