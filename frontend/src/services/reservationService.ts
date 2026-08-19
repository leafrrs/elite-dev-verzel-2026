import { fetchApi } from './api';
import type { CreateReservationPayload, Reservation } from '../types/reservation';

export const reservationService = {
  async createReservation(payload: CreateReservationPayload): Promise<Reservation> {
    return fetchApi('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
