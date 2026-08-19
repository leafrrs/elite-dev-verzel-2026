import { prisma } from "../lib/prisma";
import crypto from "crypto";

import { AppError } from "../lib/AppError";
import { env } from "../config/env";
export class ReservationService {
  async createReservation(eventId: string, userId: string, seatCode?: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError("Evento não encontrado.", 404);
    }

    if (event.type === "SEATED" && seatCode) {
      return await this.reserveSeatedTicket(
        event.id,
        userId,
        event.price,
        seatCode,
      );
    } else if (event.type === "GENERAL_ADMISSION") {
      return await this.reserveGeneralTicket(event.id, userId);
    }

    throw new AppError("Tipo de evento inválido ou assento não informado.", 400);
  }

  private async reserveSeatedTicket(
    eventId: string,
    userId: string,
    price: number,
    seatCode: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const seat = await tx.seat.findFirst({
        where: { eventId: eventId, seatCode: seatCode },
      });

      if (!seat) {
        throw new AppError("Assento não existe neste evento.", 404);
      }

      const updateResult = await tx.seat.updateMany({
        where: {
          id: seat.id,
          status: "AVAILABLE",
        },
        data: { status: "RESERVED" },
      });

      if (updateResult.count === 0) {
        throw new AppError("Assento indisponível ou já reservado por outra pessoa.", 409);
      }

      const reservation = await tx.reservation.create({
        data: {
          eventId,
          userId,
          seatId: seat.id,
          totalAmount: price,
          status: "PENDING",
        },
      });

      return reservation;
    });
  }

  private async reserveGeneralTicket(
    eventId: string,
    userId: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new AppError("Evento não encontrado.", 404);
      }
      const updateResult = await tx.event.updateMany({
        where: {
          id: eventId,
          availableStock: { gt: 0 },
        },
        data: {
          availableStock: { decrement: 1 },
        },
      });
      if (updateResult.count === 0) {
        throw new AppError("Ingressos esgotados para este evento!", 409);
      }
      const reservation = await tx.reservation.create({
        data: {
          eventId,
          userId,
          totalAmount: event.price,
          status: "PENDING",
        },
      });

      return reservation;
    });
  }

  async processPayment(
    reservationId: string,
    userId: string,
    isApproved: boolean,
  ) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { event: true },
    });

    if (!reservation) {
      throw new AppError("Reserva não encontrada.", 404);
    }

    if (reservation.userId !== userId) {
      throw new AppError(
        "Acesso negado. Você não é o dono desta reserva.",
        403,
      );
    }

    if (reservation.status !== "PENDING") {
      throw new AppError("Esta reserva já foi processada.", 409);
    }

    if (!isApproved) {
      return await prisma.$transaction(async (tx) => {
        // Trava da Reserva
        const updateResult = await tx.reservation.updateMany({
          where: { id: reservationId, status: "PENDING" },
          data: { status: "REFUSED" },
        });

        if (updateResult.count === 0) {
          throw new AppError(
            "A reserva já foi processada por outra requisição.",
            409,
          );
        }

        if (reservation.event.type === "SEATED" && reservation.seatId) {
          const seatUpdate = await tx.seat.updateMany({
            where: { id: reservation.seatId, status: "RESERVED" },
            data: { status: "AVAILABLE" },
          });

          if (seatUpdate.count === 0) {
            throw new AppError(
              "Inconsistência: o assento não estava reservado.",
              409,
            );
          }
        } else if (reservation.event.type === "GENERAL_ADMISSION") {
          await tx.event.update({
            where: { id: reservation.event.id },
            data: { availableStock: { increment: 1 } },
          });
        }

        return {
          message: "Pagamento recusado. Ingresso liberado para o público.",
        };
      });
    }

    return await prisma.$transaction(async (tx) => {
      const updateResult = await tx.reservation.updateMany({
        where: { id: reservationId, status: "PENDING" },
        data: { status: "CONFIRMED" },
      });

      if (updateResult.count === 0) {
        throw new AppError(
          "A reserva já foi processada por outra requisição.",
          409,
        );
      }

      if (reservation.event.type === "SEATED" && reservation.seatId) {
        const seatUpdate = await tx.seat.updateMany({
          where: { id: reservation.seatId, status: "RESERVED" },
          data: { status: "SOLD" },
        });

        if (seatUpdate.count === 0) {
          throw new AppError(
            "Inconsistência: o assento não estava reservado.",
            409,
          );
        }
      }

      const secureRandomHex = crypto
        .randomBytes(8)
        .toString("hex")
        .toUpperCase();
      const ticketCode = `VZR-${secureRandomHex}`;

      const secureHash = crypto
        .createHmac("sha256", env.QR_SECRET_KEY)
        .update(ticketCode)
        .digest("hex");

      const ticket = await tx.ticket.create({
        data: {
          ticketCode,
          secureHash,
          eventId: reservation.event.id,
          userId: reservation.userId,
          reservationId: reservation.id,
          seatId: reservation.seatId,
        },
      });

      return {
        message: "Pagamento aprovado! Ingresso gerado com sucesso.",
        ticket,
      };
    });
  }
}
