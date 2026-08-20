export type EventType = 'SEATED' | 'GENERAL_ADMISSION';
export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

// A interface base que representa a listagem (GET /events)
export interface EventModel {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  totalCapacity: number;
  availableStock: number;
  type: EventType;
  bannerUrl: string | null;
}

export interface Seat {
  id: string;
  seatCode: string;
  status: SeatStatus;
}

// O detalhe do evento (GET /events/:id) possui os mesmos campos da base, mas INCLUI os assentos
export interface EventDetails extends EventModel {
  seats: Seat[];
}

// Contrato explícito para criação de eventos no Front-End
export interface CreateEventPayload {
  title: string;
  description?: string;
  date: string;
  location: string;
  price: number;
  totalCapacity: number;
  type: EventType;
  bannerUrl?: string;
  externalSource?: string;
  externalId?: string;
}
