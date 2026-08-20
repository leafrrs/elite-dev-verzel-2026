/**
 * reservation.concurrent.test.ts
 *
 * Cobre:
 * - Teste 1: Concorrência em Seat SEATED (dois clientes, mesmo assento)
 * - Teste 2: Concorrência em estoque GENERAL_ADMISSION (stock = 1)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  testPrisma,
  createTestUser,
  createSeatedEvent,
  createGAEvent,
} from './helpers/testDb';
import { ReservationService } from '../services/reservationService';

const reservationService = new ReservationService();

beforeAll(async () => {
  // Banco já criado pelo globalSetup
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe('Concorrência — SEATED', () => {
  it('apenas uma das duas reservas simultâneas para o mesmo assento deve ter sucesso', async () => {
    const organizer = await createTestUser('ORGANIZER', 'seated-conc');
    const client1 = await createTestUser('CLIENT', 'c1-seated');
    const client2 = await createTestUser('CLIENT', 'c2-seated');
    const event = await createSeatedEvent(organizer.id, 4);

    // Pega o primeiro assento disponível
    const seat = await testPrisma.seat.findFirst({ where: { eventId: event.id, status: 'AVAILABLE' } });
    expect(seat).not.toBeNull();

    // Dispara duas reservas simultâneas para o mesmo assento
    const results = await Promise.allSettled([
      reservationService.createReservation(event.id, client1.id, seat!.seatCode),
      reservationService.createReservation(event.id, client2.id, seat!.seatCode),
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    // Exatamente uma deve ter sucesso e uma deve falhar
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    // O assento final deve estar RESERVED (não AVAILABLE)
    const seatFinal = await testPrisma.seat.findUnique({ where: { id: seat!.id } });
    expect(seatFinal!.status).toBe('RESERVED');

    // Não podem existir duas reservas para o mesmo seat
    const reservations = await testPrisma.reservation.findMany({ where: { seatId: seat!.id } });
    expect(reservations).toHaveLength(1);
  });
});

describe('Concorrência — GENERAL_ADMISSION', () => {
  it('com stock = 1, apenas uma reserva deve ser aceita e o estoque nunca deve ficar negativo', async () => {
    const organizer = await createTestUser('ORGANIZER', 'ga-conc');
    const client1 = await createTestUser('CLIENT', 'c1-ga');
    const client2 = await createTestUser('CLIENT', 'c2-ga');
    const event = await createGAEvent(organizer.id, 1); // stock = 1

    const results = await Promise.allSettled([
      reservationService.createReservation(event.id, client1.id),
      reservationService.createReservation(event.id, client2.id),
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    // Estoque deve ser exatamente 0 (nunca negativo)
    const eventFinal = await testPrisma.event.findUnique({ where: { id: event.id } });
    expect(eventFinal!.availableStock).toBe(0);
    expect(eventFinal!.availableStock).toBeGreaterThanOrEqual(0);
  });
});
