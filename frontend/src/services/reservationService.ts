import { fetchApi } from './api';
import type { CreateReservationPayload, Reservation, PaymentResponse } from '../types/reservation';

export const reservationService = {
  async createReservation(payload: CreateReservationPayload): Promise<Reservation> {
    return fetchApi('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async processPayment(reservationId: string, approved: boolean): Promise<PaymentResponse> {
    return fetchApi(`/reservations/${reservationId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ approved })
    });
  }
};
