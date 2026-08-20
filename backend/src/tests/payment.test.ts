/**
 * payment.test.ts
 *
 * Cobre:
 * - Teste 3: Pagamento duplicado — segunda tentativa deve ser rejeitada, apenas um Ticket emitido
 * - Teste 4 (partial): IDOR no pagamento — CLIENT B não pode pagar reserva do CLIENT A
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  testPrisma,
  createTestUser,
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

describe('Pagamento', () => {
  it('segunda tentativa de pagamento da mesma reserva é rejeitada com 409', async () => {
    const organizer = await createTestUser('ORGANIZER', 'pay-dup');
    const client = await createTestUser('CLIENT', 'c1-pay-dup');
    const event = await createGAEvent(organizer.id, 5);

    const reservation = await reservationService.createReservation(event.id, client.id);

    // Aprovação legítima
    await reservationService.processPayment(reservation.id, client.id, true);

    // Segunda tentativa deve lançar AppError 409
    await expect(
      reservationService.processPayment(reservation.id, client.id, true)
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('aprovação de reserva gera exatamente UM Ticket', async () => {
    const organizer = await createTestUser('ORGANIZER', 'pay-ticket');
    const client = await createTestUser('CLIENT', 'c1-pay-ticket');
    const event = await createGAEvent(organizer.id, 5);

    const reservation = await reservationService.createReservation(event.id, client.id);
    await reservationService.processPayment(reservation.id, client.id, true);

    const tickets = await testPrisma.ticket.findMany({ where: { reservationId: reservation.id } });
    expect(tickets).toHaveLength(1);
    expect(tickets[0].status).toBe('VALID');
  });

  it('pagamentos simultâneos da mesma reserva geram apenas um Ticket', async () => {
    const organizer = await createTestUser('ORGANIZER', 'pay-conc');
    const client = await createTestUser('CLIENT', 'c1-pay-conc');
    const event = await createGAEvent(organizer.id, 5);

    const reservation = await reservationService.createReservation(event.id, client.id);

    // Dispara dois pagamentos simultâneos
    const results = await Promise.allSettled([
      reservationService.processPayment(reservation.id, client.id, true),
      reservationService.processPayment(reservation.id, client.id, true),
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    expect(fulfilled).toHaveLength(1);

    // Apenas um ticket deve ter sido criado
    const tickets = await testPrisma.ticket.findMany({ where: { reservationId: reservation.id } });
    expect(tickets).toHaveLength(1);
  });
});

describe('Ownership / IDOR — Pagamento', () => {
  it('CLIENT B não pode pagar reserva do CLIENT A (retorna 403)', async () => {
    const organizer = await createTestUser('ORGANIZER', 'idor-pay');
    const clientA = await createTestUser('CLIENT', 'ca-idor');
    const clientB = await createTestUser('CLIENT', 'cb-idor');
    const event = await createGAEvent(organizer.id, 5);

    const reservation = await reservationService.createReservation(event.id, clientA.id);

    // CLIENT B tenta pagar reserva do CLIENT A
    await expect(
      reservationService.processPayment(reservation.id, clientB.id, true)
    ).rejects.toMatchObject({ statusCode: 403 });

    // Reserva permanece PENDING
    const res = await testPrisma.reservation.findUnique({ where: { id: reservation.id } });
    expect(res!.status).toBe('PENDING');
  });
});
