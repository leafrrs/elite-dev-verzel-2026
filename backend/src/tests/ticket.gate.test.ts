/**
 * ticket.gate.test.ts
 *
 * Cobre:
 * - Teste 5: Consumo único na portaria (duas validações simultâneas)
 * - Teste 6: Validação manual com evento errado não consome o Ticket
 * - Opcional: HMAC — payload forjado é rejeitado
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  testPrisma,
  createTestUser,
  createGAEvent,
  createSeatedEvent,
  createValidTicket,
} from './helpers/testDb';
import { TicketService } from '../services/ticketService';
import crypto from 'crypto';

const ticketService = new TicketService();

beforeAll(async () => {
  // Banco já criado pelo globalSetup
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe('Portaria — Consumo Único (QR)', () => {
  it('duas validações simultâneas do mesmo Ticket: apenas uma tem sucesso e o status final é USED', async () => {
    const organizer = await createTestUser('ORGANIZER', 'gate-qr');
    const client = await createTestUser('CLIENT', 'c-gate-qr');
    const event = await createGAEvent(organizer.id, 5);
    const ticket = await createValidTicket(client.id, event.id);

    // Dispara duas validações simultâneas
    const results = await Promise.allSettled([
      ticketService.validateTicket(ticket.ticketCode, ticket.secureHash, event.id),
      ticketService.validateTicket(ticket.ticketCode, ticket.secureHash, event.id),
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    // Status final deve ser USED
    const ticketFinal = await testPrisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(ticketFinal!.status).toBe('USED');
  });
});

describe('Portaria Manual — Evento Errado', () => {
  it('validação manual com evento errado retorna erro e não altera o status do Ticket', async () => {
    const organizer = await createTestUser('ORGANIZER', 'gate-manual');
    const client = await createTestUser('CLIENT', 'c-gate-manual');

    const eventA = await createGAEvent(organizer.id, 5);
    const eventB = await createGAEvent(organizer.id, 5);

    const ticket = await createValidTicket(client.id, eventA.id);

    // Validação manual com evento errado (eventB)
    await expect(
      ticketService.validateManualTicket(ticket.ticketCode, eventB.id)
    ).rejects.toMatchObject({ statusCode: 403 });

    // Ticket deve permanecer VALID
    const ticketAfterWrong = await testPrisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(ticketAfterWrong!.status).toBe('VALID');

    // Validação manual com evento correto (eventA) — deve ter sucesso
    await expect(
      ticketService.validateManualTicket(ticket.ticketCode, eventA.id)
    ).resolves.toMatchObject({ message: expect.stringContaining('ACESSO LIBERADO') });

    // Ticket deve agora ser USED
    const ticketAfterValid = await testPrisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(ticketAfterValid!.status).toBe('USED');
  });

  it('ticketCode inexistente retorna 404', async () => {
    const organizer = await createTestUser('ORGANIZER', 'gate-notfound');
    const event = await createGAEvent(organizer.id, 5);

    await expect(
      ticketService.validateManualTicket('VZR-DOESNOTEXIST', event.id)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('Portaria QR — HMAC forjado', () => {
  it('hash adulterado é rejeitado mesmo com ticketCode válido', async () => {
    const organizer = await createTestUser('ORGANIZER', 'gate-hmac');
    const client = await createTestUser('CLIENT', 'c-gate-hmac');
    const event = await createGAEvent(organizer.id, 5);
    const ticket = await createValidTicket(client.id, event.id);

    // Adultera o último byte do hash
    const tamperedHash = ticket.secureHash.slice(0, -2) + '00';

    await expect(
      ticketService.validateTicket(ticket.ticketCode, tamperedHash, event.id)
    ).rejects.toMatchObject({ statusCode: 400 });

    // Ticket deve permanecer VALID (não consumido)
    const ticketFinal = await testPrisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(ticketFinal!.status).toBe('VALID');
  });
});
