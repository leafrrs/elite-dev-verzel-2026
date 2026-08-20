/**
 * testDb.ts — Helpers para criação e limpeza do banco de teste.
 *
 * Estratégia:
 * - DATABASE_URL aponta para prisma/test.db (definido em setup.ts).
 * - Antes da suíte: aplica migrations versionadas (migrate deploy) e cria dados mínimos.
 * - Depois da suíte: remove o banco temporário.
 * - NÃO usa prisma db push.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';

/** Instância do Prisma apontando para o banco de teste */
export const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: [],
});

/** Cria um usuário de teste e retorna o record */
export async function createTestUser(role: 'CLIENT' | 'ORGANIZER' | 'GATE_STAFF', suffix = '') {
  const email = `test-${role.toLowerCase()}-${suffix}-${Date.now()}@test.local`;
  const hash = await bcrypt.hash('senha123', 6);
  return testPrisma.user.create({
    data: { email, passwordHash: hash, role, name: `Test ${role} ${suffix}` },
  });
}

/** Cria um evento SEATED com N assentos */
export async function createSeatedEvent(organizerId: string, capacity = 4) {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const event = await testPrisma.event.create({
    data: {
      title: 'Test SEATED Event',
      description: 'Test',
      bannerUrl: 'http://example.com/banner.jpg',
      date: futureDate,
      location: 'Test Venue',
      price: 50,
      totalCapacity: capacity,
      availableStock: capacity,
      type: 'SEATED',
      organizerId,
      externalSource: 'MANUAL',
      externalId: `manual-${Date.now()}`,
    },
  });

  // Gera assentos
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const seats = [];
  let count = 0;
  for (const row of rows) {
    for (let col = 1; col <= 10 && count < capacity; col++) {
      seats.push({ eventId: event.id, seatCode: `${row}${col}`, status: 'AVAILABLE' as const });
      count++;
    }
  }
  await testPrisma.seat.createMany({ data: seats });

  return event;
}

/** Cria um evento GENERAL_ADMISSION */
export async function createGAEvent(organizerId: string, stock = 2) {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return testPrisma.event.create({
    data: {
      title: 'Test GA Event',
      description: 'Test',
      bannerUrl: 'http://example.com/banner.jpg',
      date: futureDate,
      location: 'Test Venue',
      price: 30,
      totalCapacity: stock,
      availableStock: stock,
      type: 'GENERAL_ADMISSION',
      organizerId,
      externalSource: 'MANUAL',
      externalId: `manual-ga-${Date.now()}`,
    },
  });
}

/** Cria um Ticket VALID diretamente, sem passar pelo fluxo de reserva */
export async function createValidTicket(userId: string, eventId: string, seatId?: string) {
  const secretKey = process.env.QR_SECRET_KEY!;
  const hex = crypto.randomBytes(8).toString('hex').toUpperCase();
  const ticketCode = `VZR-${hex}`;
  const secureHash = crypto.createHmac('sha256', secretKey).update(ticketCode).digest('hex');

  // Cria reserva mínima
  const reservation = await testPrisma.reservation.create({
    data: { eventId, userId, seatId, totalAmount: 50, status: 'CONFIRMED' },
  });

  return testPrisma.ticket.create({
    data: { ticketCode, secureHash, eventId, userId, reservationId: reservation.id, seatId, status: 'VALID' },
  });
}
