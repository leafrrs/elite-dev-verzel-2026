import { prisma } from "../lib/prisma";
import crypto from "crypto";
import { AppError } from "../lib/AppError";
import { env } from "../config/env";

export class TicketService {
  async validateTicket(ticketCode: string, providedHash: string, gateEventId: string) {
    // 1. Leitura do ingresso
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
    });

    // 2. Proteção Anti-Enumeração (Combina "não existe" com "falso/forjado")
    let isHashValid = false;
    
    if (ticket && providedHash) {
      const expectedHash = crypto
        .createHmac("sha256", env.QR_SECRET_KEY)
        .update(ticketCode)
        .digest("hex");

      const providedBuffer = Buffer.from(providedHash, "hex");
      const expectedBuffer = Buffer.from(expectedHash, "hex");
      const storedBuffer = Buffer.from(ticket.secureHash, "hex");

      // timingSafeEqual exige que os buffers tenham o mesmo tamanho
      if (
        providedBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(providedBuffer, expectedBuffer) &&
        providedBuffer.length === storedBuffer.length &&
        crypto.timingSafeEqual(providedBuffer, storedBuffer)
      ) {
        isHashValid = true;
      }
    }

    if (!ticket || !isHashValid) {
      throw new AppError("Ingresso inválido.", 400); // 400 (ou 403) sem dar dicas do motivo exato
    }

    // 3. Validação de Contexto: O Evento bate com a localização do segurança?
    if (ticket.eventId !== gateEventId) {
      throw new AppError("Este ingresso pertence a outro evento.", 403);
    }

    // 4. Barreira Atômica (Previne entrada dupla simultânea)
    const updateResult = await prisma.ticket.updateMany({
      where: {
        id: ticket.id,
        status: "VALID",
      },
      data: {
        status: "USED",
        usedAt: new Date(),
      },
    });

    if (updateResult.count === 0) {
      throw new AppError("Este ingresso já foi utilizado para entrar no evento!", 409);
    }

    return {
      message: "ACESSO LIBERADO! Ingresso válido e consumido com sucesso.",
    };
  }
}
