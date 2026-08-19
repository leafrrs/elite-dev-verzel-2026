import { prisma } from "../lib/prisma";
import crypto from "crypto";
import { AppError } from "../lib/AppError";

export class TicketService {
  async validateTicket(ticketCode: string, providedHash: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
    });
    if (!ticket) {
      throw new AppError("ALERTA: Ingresso não encontrado (Falso)!", 404);
    }

    const expectedHash = crypto
      .createHmac("sha256", process.env.QR_SECRET_KEY as string)
      .update(ticketCode)
      .digest("hex");
    if (providedHash !== expectedHash || providedHash !== ticket.secureHash) {
      throw new AppError(
        "ALERTA: Assinatura do ingresso inválida (Forjado)!",
        403,
      );
    }

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
      throw new AppError(
        "ALERTA: Este ingresso já foi utilizado para entrar no evento!",
        409,
      );
    }
    return {
      message: "ACESSO LIBERADO! Ingresso válido e consumido com sucesso.",
    };
  }
}
