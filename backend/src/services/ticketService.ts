import { prisma } from "../lib/prisma";
import crypto from "crypto";
import { AppError } from "../lib/AppError";
import { env } from "../config/env";

export class TicketService {
  async listByUser(userId: string) {
    return await prisma.ticket.findMany({
      where: { userId },
      select: {
        id: true,
        ticketCode: true,
        secureHash: true,
        eventId: true,
        status: true,
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
            bannerUrl: true,
          },
        },
        seat: {
          select: {
            seatCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

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

  async generateShareToken(userId: string, ticketCode: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode }
    });

    if (!ticket) {
      throw new AppError("Ingresso não encontrado.", 404);
    }

    if (ticket.userId !== userId) {
      throw new AppError("Acesso negado.", 403);
    }

    // Se já tiver token, reutiliza
    if (ticket.shareToken) {
      return { shareToken: ticket.shareToken };
    }

    const shareToken = crypto.randomBytes(32).toString("hex");

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { shareToken }
    });

    return { shareToken };
  }

  async getSharedTicket(shareToken: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { shareToken },
      select: {
        ticketCode: true,
        status: true,
        secureHash: true,
        eventId: true,
        event: {
          select: {
            title: true,
            date: true,
            location: true,
            bannerUrl: true,
          }
        },
        seat: {
          select: {
            seatCode: true,
          }
        }
      }
    });

    if (!ticket) {
      throw new AppError("Ingresso compartilhado não encontrado ou link inválido.", 404);
    }

    // Encapsula o dado sensível para o payload do QR
    const qrPayload = JSON.stringify({
      ticketCode: ticket.ticketCode,
      secureHash: ticket.secureHash,
      eventId: ticket.eventId
    });

    return {
      ticketCode: ticket.ticketCode,
      status: ticket.status,
      event: ticket.event,
      seat: ticket.seat,
      qrPayload
    };
  }
}
