import { fetchApi } from './api';
import type { EventModel, EventDetails } from '../types/event';

export const eventService = {
  // Lista o catálogo de eventos públicos
  async getEvents(): Promise<EventModel[]> {
    return fetchApi('/events', {
      method: 'GET',
    });
  },

  // Busca os detalhes e assentos de um evento específico
  async getEventById(id: string): Promise<EventDetails> {
    return fetchApi(`/events/${id}`, {
      method: 'GET',
    });
  }
};
