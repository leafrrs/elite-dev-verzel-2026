/**
 * ownership.test.ts
 *
 * Cobre:
 * - Teste 4: Ownership / IDOR no compartilhamento de ingresso
 *   CLIENT B não pode gerar shareToken de um Ticket pertencente ao CLIENT A
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  testPrisma,
  createTestUser,
  createGAEvent,
  createValidTicket,
} from './helpers/testDb';
import { TicketService } from '../services/ticketService';

const ticketService = new TicketService();

beforeAll(async () => {
  // Banco já criado pelo globalSetup
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe('Ownership / IDOR — Compartilhamento', () => {
  it('CLIENT B não pode gerar shareToken do Ticket do CLIENT A (retorna 403)', async () => {
    const organizer = await createTestUser('ORGANIZER', 'ownership-share');
    const clientA = await createTestUser('CLIENT', 'ca-share');
    const clientB = await createTestUser('CLIENT', 'cb-share');
    const event = await createGAEvent(organizer.id, 5);

    const ticket = await createValidTicket(clientA.id, event.id);

    // CLIENT B tenta gerar share do ticket do CLIENT A
    await expect(
      ticketService.generateShareToken(clientB.id, ticket.ticketCode)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('CLIENT A pode gerar seu próprio shareToken', async () => {
    const organizer = await createTestUser('ORGANIZER', 'ownership-self');
    const clientA = await createTestUser('CLIENT', 'ca-self-share');
    const event = await createGAEvent(organizer.id, 5);

    const ticket = await createValidTicket(clientA.id, event.id);

    const result = await ticketService.generateShareToken(clientA.id, ticket.ticketCode);
    expect(result.shareToken).toBeDefined();
    expect(typeof result.shareToken).toBe('string');
    expect(result.shareToken.length).toBeGreaterThan(10);
  });

  it('link de compartilhamento permite visualizar o ingresso sem autenticação', async () => {
    const organizer = await createTestUser('ORGANIZER', 'ownership-public');
    const clientA = await createTestUser('CLIENT', 'ca-pub-share');
    const event = await createGAEvent(organizer.id, 5);

    const ticket = await createValidTicket(clientA.id, event.id);
    const { shareToken } = await ticketService.generateShareToken(clientA.id, ticket.ticketCode);

    // Busca pública via getSharedTicket (rota pública)
    const shared = await ticketService.getSharedTicket(shareToken);
    expect(shared.ticketCode).toBe(ticket.ticketCode);
    // Não deve vazar o shareToken diretamente no DTO público
    expect((shared as any).shareToken).toBeUndefined();
  });
});
