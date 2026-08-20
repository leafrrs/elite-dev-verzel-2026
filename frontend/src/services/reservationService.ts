import { fetchApi } from './api';
import type { CreateReservationPayload, Reservation, PaymentResponse, CreateReservationResponse } from '../types/reservation';

export const reservationService = {
  async createReservation(payload: CreateReservationPayload): Promise<Reservation> {
    const response = await fetchApi<CreateReservationResponse>('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return response.reservation;
  },

  async processPayment(reservationId: string, approved: boolean): Promise<PaymentResponse> {
    return fetchApi<PaymentResponse>(`/reservations/${reservationId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ approved })
    });
  }
};
